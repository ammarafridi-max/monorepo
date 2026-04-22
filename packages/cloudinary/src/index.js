import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '@travel-suite/utils';

export function createCloudinaryStorage({ cloudName, apiKey, apiSecret, logger, folder = 'blog' }) {
  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  if (!isConfigured) {
    logger?.warn('Cloudinary credentials are missing — image uploads will fail');
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  const saveImage = async (buffer, blogId) => {
    if (!isConfigured) throw new AppError('Image upload service is not configured', 500);

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `${folder}/${blogId}` }, (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        })
        .end(buffer);
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
      const { resources } = await cloudinary.api.resources({ type: 'upload', prefix: folderPath, max_results: 100 });
      for (const file of resources) await cloudinary.uploader.destroy(file.public_id);
      await cloudinary.api.delete_folder(folderPath);
      return true;
    } catch (err) {
      logger?.warn('Cloudinary folder cleanup failed', { folderPath, error: err.message });
      return false;
    }
  };

  return { saveImage, deleteImage, deleteFolder };
}
