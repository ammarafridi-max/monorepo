import JSZip from 'jszip';

/** Does this public URL still answer? One HEAD, no body. */
export async function urlAlive(url, timeoutMs = 5000) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

const EXT_TYPE = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/**
 * The selfies an order can be reused from. The individual uploads are what the
 * ui shows and the worker scores against; the training zip is what the trainer
 * consumed and is the durable copy. When the uploads are gone but the zip is
 * not, unpack the zip back into uploads/<newOrderId>/ so the new order carries
 * live selfies again. Returns null when neither exists.
 *
 * @param {{ publicUrl: Function, putObject: Function }} storage
 * @param {{ _id: any, uploadedImageUrls?: string[] }} source
 * @param {string} newOrderId
 * @returns {Promise<string[]|null>}
 */
export async function resolveReusableSelfies(storage, source, newOrderId) {
  const urls = source.uploadedImageUrls ?? [];
  if (urls.length && (await urlAlive(urls[0]))) return urls;

  const zipUrl = storage.publicUrl(`training/${source._id}.zip`);
  if (!(await urlAlive(zipUrl))) return null;

  const res = await fetch(zipUrl);
  if (!res.ok) return null;
  const zip = await JSZip.loadAsync(Buffer.from(await res.arrayBuffer()));
  const names = Object.keys(zip.files)
    .filter((n) => !zip.files[n].dir && /\.(jpe?g|png|webp)$/i.test(n))
    .sort();
  if (!names.length) return null;

  const restored = [];
  for (let i = 0; i < names.length; i++) {
    const ext = names[i].split('.').pop().toLowerCase();
    const body = await zip.files[names[i]].async('nodebuffer');
    restored.push(
      await storage.putObject(`uploads/${newOrderId}/img_${String(i).padStart(2, '0')}.${ext}`, body, EXT_TYPE[ext] || 'image/jpeg')
    );
  }
  return restored;
}
