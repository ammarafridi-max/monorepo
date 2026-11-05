import { AppError, catchAsync } from '@travel-suite/utils';

export function createVisaRequirementsController({ service }) {
  const ok = (res, data, status = 200) => res.status(status).json({ status: 'success', data });

  return {
    listDestinations: catchAsync(async (req, res) => {
      ok(res, await service.listDestinations());
    }),
    getPublicRule: catchAsync(async (req, res, next) => {
      const rule = await service.getPublicRule(req.params.destination);
      if (!rule) return next(new AppError('No published rule for that destination', 404));
      res.status(200).json({ status: 'success', data: rule });
    }),

    check: catchAsync(async (req, res) => {
      const { nationality, residence, destination } = { ...req.query, ...req.body };
      ok(res, await service.check({ nationality, residence, destination }));
    }),

    listRules: catchAsync(async (req, res) => {
      const published = req.query.published === undefined ? undefined : req.query.published === 'true';
      ok(res, { rules: await service.listRules({ published }) });
    }),
    getRule: catchAsync(async (req, res) => {
      ok(res, { rule: await service.getRule(req.params.destination) });
    }),
    upsertRule: catchAsync(async (req, res) => {
      ok(res, { rule: await service.upsertRule(req.body) }, 200);
    }),
    deleteRule: catchAsync(async (req, res) => {
      await service.deleteRule(req.params.destination);
      res.status(204).send();
    }),
    queryStats: catchAsync(async (req, res) => {
      ok(res, await service.queryStats({
        days: Number(req.query.days) || 30,
        limit: Number(req.query.limit) || 50,
      }));
    }),
  };
}
