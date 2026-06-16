import puppeteer from 'puppeteer';
import { logger } from '@travel-suite/utils';
import { buildItineraryHtml } from './templates.js';

// One shared browser per process, launched lazily and reused across renders.
// In containers, point PUPPETEER_EXECUTABLE_PATH at the system Chromium and
// run with the sandbox flags below.
let browserPromise = null;

function launchArgs() {
  return ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'];
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: launchArgs(),
    });
    // If the browser dies, clear the cached promise so the next call relaunches.
    browserPromise
      .then((browser) => {
        browser.on('disconnected', () => {
          browserPromise = null;
        });
      })
      .catch(() => {
        browserPromise = null;
      });
  }
  return browserPromise;
}

async function withPage(fn) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    return await fn(page);
  } finally {
    await page.close().catch(() => {});
  }
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
