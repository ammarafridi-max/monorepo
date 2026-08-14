import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '@travel-suite/utils';

export function createCloudinaryStorage({ cloudName, apiKey, apiSecret, logger, folder = 'blog' }) {
  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  if (!isConfigured) {
    logger?.warn('Cloudinary credentials are missing — image uploads will fail');
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  // All six brands share one Cloudinary account; this folder prefix is the only thing stopping one brand from deleting another's assets.
  const ownsPublicId = (publicId) =>
    typeof publicId === 'string' && (publicId === folder || publicId.startsWith(`${folder}/`));

  const refuse = (publicId, what) => {
    logger?.warn(
      `Refused to delete a Cloudinary ${what} outside this brand's folder`,
      { folder, publicId },
    );
    return false;
  };

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
    return uploadBuffer(buffer, { folder: `${folder}/${blogId}` });
  };

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
      const publicId = match[1];
      if (!ownsPublicId(publicId)) return refuse(publicId, 'asset');
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
      return true;
    } catch (err) {
      logger?.warn('Failed to delete Cloudinary image', { imageUrl, error: err.message });
      return false;
    }
  };

  const deleteFolder = async (folderPath) => {
    try {
      if (!isConfigured || !folderPath) return false;
      if (!ownsPublicId(folderPath)) return refuse(folderPath, 'folder');
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
      await cloudinary.api.delete_folder(folderPath).catch(() => {});
      return true;
    } catch (err) {
      logger?.warn('Cloudinary folder cleanup failed', { folderPath, error: err.message });
      return false;
    }
  };

  const deleteSubfolder = (subPath) => deleteFolder(`${folder}/${subPath}`);

  const uploadAuthenticated = (buffer, publicId, resourceType) =>
    new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: resourceType,
            type: 'authenticated',
            access_mode: 'authenticated',
            overwrite: false,
            invalidate: true,
          },
          (err, result) => (err ? reject(err) : resolve(result)),
        )
        .end(buffer);
    });

  const saveAuthenticatedFile = async (buffer, subPath, { resourceType = 'image' } = {}) => {
    if (!isConfigured) throw new AppError('Secure file storage is not configured', 500);
    const result = await uploadAuthenticated(buffer, `${folder}/${subPath}`, resourceType);
    return {
      publicId: result.public_id,
      version: result.version,
      bytes: result.bytes,
      format: result.format,
      resourceType: result.resource_type,
    };
  };

  const signSecureUrl = (publicId, expiresInSeconds = 300, { resourceType = 'image', format } = {}) => {
    if (!isConfigured) throw new AppError('Secure file storage is not configured', 500);
    const ttl = Math.max(30, Number(expiresInSeconds) || 300);
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;
    return cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: 'authenticated',
      expires_at: expiresAt,
    });
  };

  const deleteAuthenticatedFile = async (publicId, { resourceType = 'image' } = {}) => {
    try {
      if (!isConfigured || !publicId) return false;
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: 'authenticated',
        invalidate: true,
      });
      return true;
    } catch (err) {
      logger?.warn('Failed to delete authenticated Cloudinary file', { publicId, error: err.message });
      return false;
    }
  };

  return {
    saveImage,
    saveFile,
    deleteImage,
    deleteFolder,
    deleteSubfolder,
    saveAuthenticatedFile,
    signSecureUrl,
    deleteAuthenticatedFile,
  };
}
