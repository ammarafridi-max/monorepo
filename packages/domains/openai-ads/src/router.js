import { Router } from 'express';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export function createOpenAIAdsRouterFromParts({ controller, auth }) {
  const router = Router();
  const { protect, restrictTo } = auth;

  router.use(protect, restrictTo('admin'));

  router.get('/overview', controller.getOverview);
  router.get('/setup', controller.getSetup);
  router.get('/locations', controller.searchLocations);
  router.post('/images', upload.single('image'), controller.uploadImage);

  router.post('/campaigns', controller.createCampaign);
  router.get('/campaigns/:id', controller.getCampaign);
  router.post('/campaigns/:id/ad-groups', controller.createAdGroup);
  router.post('/ad-groups/:id/ads', controller.createAd);
  router.post('/ads/:id/preview', controller.previewAd);
  router.get('/campaigns/:id/settings', controller.getCampaignSettings);
  router.post('/campaigns/:id/settings', controller.updateCampaignSettings);
  router.get('/ad-groups/:id/settings', controller.getAdGroupSettings);
  router.post('/ad-groups/:id/settings', controller.updateAdGroupSettings);

  for (const [path, kind] of [['campaigns', 'campaigns'], ['ad-groups', 'ad_groups'], ['ads', 'ads']]) {
    router.post(`/${path}/:id/pause`, controller.setStatus(kind, 'pause'));
    router.post(`/${path}/:id/activate`, controller.setStatus(kind, 'activate'));
    router.post(`/${path}/:id/archive`, controller.setStatus(kind, 'archive'));
    router.post(`/${path}/:id/rename`, controller.rename(kind));
  }

  return router;
}
