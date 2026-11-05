import { createCloudinaryStorage } from '@travel-suite/cloudinary';
import { logger } from '@travel-suite/utils';

export function createBrandStorage({ config }) {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  const root = config.brand.cloudinaryFolder;

  return (subfolder) =>
    createCloudinaryStorage({
      cloudName,
      apiKey,
      apiSecret,
      logger,
      folder: subfolder ? `${root}/${subfolder}` : root,
    });
}
