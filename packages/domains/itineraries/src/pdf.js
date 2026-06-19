import puppeteer from 'puppeteer';
import { logger } from '@travel-suite/utils';
import { buildItineraryHtml } from './templates.js';

// One shared browser per process, launched lazily and reused across renders.
// In containers, point PUPPETEER_EXECUTABLE_PATH at the system Chromium and
// run with the sandbox flags below.
let browserPromise = null;

// Cap how long any single CDP command may hang. A wedged/OOM'd Chromium otherwise
// makes EVERY render fail with "Network.enable timed out" (the command sent when
// opening a page) until the process restarts — so we fail fast and recover by
// relaunching instead of poisoning the one shared browser forever.
const PROTOCOL_TIMEOUT_MS = 120_000;
const PAGE_TIMEOUT_MS = 60_000;

function launchArgs() {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--font-render-hinting=none',
  ];
}

function launch() {
  const p = puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: launchArgs(),
    protocolTimeout: PROTOCOL_TIMEOUT_MS,
  });
  // If this browser dies, clear the cached promise so the next call relaunches —
  // but only if it is still the current one (don't clobber a newer launch).
  p.then((browser) => {
    browser.on('disconnected', () => {
      if (browserPromise === p) browserPromise = null;
    });
  }).catch(() => {
    if (browserPromise === p) browserPromise = null;
  });
  return p;
}

async function getBrowser() {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      if (browser.connected) return browser; // healthy → reuse
    } catch {
      // launch failed earlier; fall through and relaunch
    }
    browserPromise = null; // stale/unhealthy → drop it
  }
  browserPromise = launch();
  return browserPromise;
}

// Force the shared browser to be torn down so the next render starts fresh.
async function discardBrowser() {
  const p = browserPromise;
  browserPromise = null;
  if (!p) return;
  try {
    const browser = await p;
    await browser.close();
  } catch {
    // already gone / never resolved — nothing to clean up
  }
}

// Run `fn` against a fresh page. If the shared browser has wedged (protocol
// timeout / closed connection), discard it and retry exactly once with a newly
// launched browser, so a single bad render can't take down the whole feature.
const RECOVERABLE = /timed out|Target closed|Session closed|Connection closed|Protocol error|socket hang up|disconnected|Navigation timeout/i;

async function withPage(fn) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      try {
        page.setDefaultTimeout(PAGE_TIMEOUT_MS);
        return await fn(page);
      } finally {
        await page.close().catch(() => {});
      }
    } catch (err) {
      const willRetry = attempt === 0 && RECOVERABLE.test(err?.message || '');
      logger.warn('[itineraries] Render attempt failed', {
        attempt,
        error: err?.message,
        willRetry,
      });
      await discardBrowser(); // never reuse a possibly-wedged browser
      if (!willRetry) throw err;
    }
  }
  // Loop always returns or throws above; this satisfies the control-flow analysis.
  throw new Error('[itineraries] Render failed after retry');
}

export function createPdfRenderer({ brand } = {}) {
  /**
   * Renders the WATERMARKED preview as a flat PNG. Because it is rasterised,
   * the itinerary text never exists in any client-readable form pre-payment.
   * @returns {Promise<Buffer>}
   */
  async function renderPreviewImage(order) {
    const html = buildItineraryHtml({ order, watermark: true, brand });
    return withPage(async (page) => {
      await page.setViewport({ width: 900, height: 1273, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const png = await page.screenshot({ type: 'png', fullPage: true });
      return Buffer.from(png);
    });
  }

  /**
   * Renders the clean, watermark-free, print-ready A4 PDF. Only ever called
   * after a successful payment.
   * @returns {Promise<Buffer>}
   */
  async function renderCleanPdf(order) {
    const html = buildItineraryHtml({ order, watermark: false, brand });
    return withPage(async (page) => {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdf);
    });
  }

  async function close() {
    if (browserPromise) {
      try {
        const browser = await browserPromise;
        await browser.close();
      } catch (err) {
        logger.warn('[itineraries] Error closing puppeteer browser', { error: err.message });
      } finally {
        browserPromise = null;
      }
    }
  }

  return { renderPreviewImage, renderCleanPdf, close };
}
