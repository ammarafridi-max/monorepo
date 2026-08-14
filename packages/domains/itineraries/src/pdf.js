import { renderToBuffer } from '@react-pdf/renderer';
import { pdf as pdfToImages } from 'pdf-to-img';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { buildItineraryDocument } from './itinerary-document.js';

// Pure-Node rendering via @react-pdf. Do not reintroduce a headless browser.
async function stitchVertically(pngBuffers) {
  if (pngBuffers.length === 1) return pngBuffers[0];
  const images = await Promise.all(pngBuffers.map((buf) => loadImage(buf)));
  const width = Math.max(...images.map((img) => img.width));
  const height = images.reduce((sum, img) => sum + img.height, 0);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  let y = 0;
  for (const img of images) {
    ctx.drawImage(img, 0, y);
    y += img.height;
  }
  return canvas.toBuffer('image/png');
}

export function createPdfRenderer({ brand } = {}) {
  async function renderPreviewImage(order) {
    const pdfBuffer = await renderToBuffer(buildItineraryDocument({ order, watermark: true, brand }));
    const document = await pdfToImages(pdfBuffer, { scale: 2 });
    const pages = [];
    for await (const page of document) pages.push(page);
    return stitchVertically(pages);
  }

  async function renderCleanPdf(order) {
    return renderToBuffer(buildItineraryDocument({ order, watermark: false, brand }));
  }

  // Kept for interface compatibility with the previous (browser-backed) renderer.
  async function close() {}

  return { renderPreviewImage, renderCleanPdf, close };
}
