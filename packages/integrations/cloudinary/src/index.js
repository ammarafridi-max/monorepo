import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '@travel-suite/utils';

export function createCloudinaryStorage({ cloudName, apiKey, apiSecret, logger, folder = 'blog' }) {
  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  if (!isConfigured) {
    logger?.warn('Cloudinary credentials are missing — image uploads will fail');
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  /**
   * Does this storage instance own the asset at `publicId`?
   *
   * All six brands share ONE Cloudinary account. The only thing separating
   * airportrides' images from emirateslimo's is this `folder` prefix, so a
   * delete that takes a caller-supplied URL and destroys whatever it points at
   * is a cross-brand delete waiting to happen — one brand's admin can wipe
   * another brand's library by pasting its URL.
   *
   * Deletes are irreversible, so the check refuses rather than assuming.
   */
  const ownsPublicId = (publicId) =>
    typeof publicId === 'string' && (publicId === folder || publicId.startsWith(`${folder}/`));

  const refuse = (publicId, what) => {
    logger?.warn(
      `Refused to delete a Cloudinary ${what} outside this brand's folder`,
      { folder, publicId },
    );
    return false;
  };

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
      // deleteFolder takes an ABSOLUTE prefix (deleteSubfolder is the relative
      // one), so without this it can be pointed at any brand's tree.
      if (!ownsPublicId(folderPath)) return refuse(folderPath, 'folder');
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

  // ---------------------------------------------------------------------------
  // PRIVATE / AUTHENTICATED STORAGE
  //
  // For sensitive customer documents (passports, bank statements). Uploaded with
  // type + access_mode 'authenticated' so the raw delivery URL is NOT publicly
  // reachable — every read must be a freshly SIGNED, short-lived URL produced by
  // `signSecureUrl`. Callers pass the FULL public_id (must embed a version number
  // so resubmissions never overwrite) and `overwrite:false` guarantees no clobber.
  // Returns metadata only — never a raw delivery URL.
  // ---------------------------------------------------------------------------
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

  // `subPath` is joined under this storage's configured base folder, so the final
  // public_id is `${folder}/${subPath}`. Caller must embed a version in subPath.
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

  // Freshly signed, time-limited download URL for an authenticated asset.
  // Uses Cloudinary's private_download_url (works on all plans, enforces expiry
  // via a signed `expires_at`). Default 5 minutes. `format` is the file extension
  // (pdf/jpg/png) captured at upload time.
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
