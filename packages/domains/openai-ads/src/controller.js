import { catchAsync } from '@travel-suite/utils';

export function createOpenAIAdsController({ service }) {
  const performer = (req) => req.user?.email || String(req.user?._id || 'unknown');
  const ok = (res, data, code = 200) => res.status(code).json({ status: 'success', data });

  return {
    getOverview: catchAsync(async (req, res) => ok(res, await service.getOverview({ days: req.query.days }))),
    getSetup: catchAsync(async (req, res) => ok(res, await service.getSetup())),
    searchLocations: catchAsync(async (req, res) => ok(res, await service.searchLocations(req.query.q))),
    getCampaign: catchAsync(async (req, res) => ok(res, await service.getCampaignDetail(req.params.id, { days: req.query.days }))),
    createCampaign: catchAsync(async (req, res) => ok(res, await service.createCampaignWithAd(req.body, performer(req)), 201)),
    createAdGroup: catchAsync(async (req, res) => ok(res, await service.createAdGroupWithAd(req.params.id, req.body, performer(req)), 201)),
    createAd: catchAsync(async (req, res) => ok(res, await service.createAdInGroup(req.params.id, req.body, performer(req)), 201)),
    uploadImage: catchAsync(async (req, res) => ok(res, await service.uploadImage(req.file), 201)),
    previewAd: catchAsync(async (req, res) => ok(res, await service.previewAd(req.params.id))),
    getCampaignSettings: catchAsync(async (req, res) => ok(res, await service.getCampaignSettings(req.params.id))),
    updateCampaignSettings: catchAsync(async (req, res) => ok(res, await service.updateCampaignSettings(req.params.id, req.body, performer(req)))),
    getAdGroupSettings: catchAsync(async (req, res) => ok(res, await service.getAdGroupSettings(req.params.id))),
    updateAdGroupSettings: catchAsync(async (req, res) => ok(res, await service.updateAdGroupSettings(req.params.id, req.body, performer(req)))),
    rename: (kind) =>
      catchAsync(async (req, res) => ok(res, await service.rename(kind, req.params.id, req.body?.name, performer(req)))),
    setStatus: (kind, action) =>
      catchAsync(async (req, res) => ok(res, await service.setStatus(kind, req.params.id, action, performer(req)))),
  };
}
