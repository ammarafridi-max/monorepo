import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '@travel-suite/utils';

export function createCloudinaryStorage({ cloudName, apiKey, apiSecret, logger, folder = 'blog' }) {
  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  if (!isConfigured) {
    logger?.warn('Cloudinary credentials are missing — image uploads will fail');
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  // Low-level stream upload; resolves to the delivered secure_url.
  const uploadBuffer = (buffer, options) =>
    new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(options, (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        })
        .end(buffer);
    });

  const saveImage = async (buffer, blogId) => {
    if (!isConfigured) throw new AppError('Image upload service is not configured', 500);
    // Auto-named image under `${folder}/${blogId}`.
    return uploadBuffer(buffer, { folder: `${folder}/${blogId}` });
  };

  // Upload to a DETERMINISTIC path (`${folder}/${subPath}`) and overwrite in place,
  // so repeated saves of the same logical asset don't accumulate orphans. invalidate
  // purges the CDN; the returned secure_url carries a fresh version so consumers
  // always get the latest bytes. resourceType: 'image' for previews/photos, 'raw'
  // for PDFs and other documents that must be served back byte-for-byte.
  const saveFile = async (buffer, subPath, { resourceType = 'image' } = {}) => {
    if (!isConfigured) throw new AppError('File upload service is not configured', 500);
    return uploadBuffer(buffer, {
      public_id: `${folder}/${subPath}`,
      resource_type: resourceType,
      overwrite: true,
      invalidate: true,
    });
  };

  const deleteImage = async (imageUrl) => {
    try {
      if (!isConfigured || !imageUrl) return false;
      const match = imageUrl.match(/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
      if (!match?.[1]) return false;
      await cloudinary.uploader.destroy(match[1], { invalidate: true });
      return true;
    } catch (err) {
      logger?.warn('Failed to delete Cloudinary image', { imageUrl, error: err.message });
      return false;
    }
  };

  const deleteFolder = async (folderPath) => {
    try {
      if (!isConfigured || !folderPath) return false;
      // Delete both image and raw resources under the prefix (PDFs/docs are 'raw').
      for (const resourceType of ['image', 'raw']) {
        const { resources } = await cloudinary.api.resources({
          resource_type: resourceType,
          type: 'upload',
          prefix: folderPath,
          max_results: 500,
        });
        for (const file of resources) {
          await cloudinary.uploader.destroy(file.public_id, { resource_type: resourceType });
        }
      }
      // Best-effort: remove the (now empty) folder tree; harmless if it can't.
      await cloudinary.api.delete_folder(folderPath).catch(() => {});
      return true;
    } catch (err) {
      logger?.warn('Cloudinary folder cleanup failed', { folderPath, error: err.message });
      return false;
    }
  };

  // Delete everything under `${folder}/${subPath}` (relative to this storage's
  // configured base folder).
  const deleteSubfolder = (subPath) => deleteFolder(`${folder}/${subPath}`);

  return { saveImage, saveFile, deleteImage, deleteFolder, deleteSubfolder };
}
