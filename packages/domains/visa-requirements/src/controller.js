import { AppError } from '@travel-suite/utils';

export function createVisaRequirementsController({ service }) {
  const ok = (res, data, status = 200) => res.status(status).json({ status: 'success', data });

  return {
    listDestinations: async (req, res, next) => {
      try {
        ok(res, await service.listDestinations());
      } catch (err) { next(err); }
    },
    getPublicRule: async (req, res, next) => {
      try {
        const rule = await service.getPublicRule(req.params.destination);
        if (!rule) return next(new AppError('No published rule for that destination', 404));
        res.status(200).json({ status: 'success', data: rule });
      } catch (err) {
        next(err);
      }
    },

    check: async (req, res, next) => {
      try {
        const { nationality, residence, destination } = { ...req.query, ...req.body };
        ok(res, await service.check({ nationality, residence, destination }));
      } catch (err) { next(err); }
    },

    listRules: async (req, res, next) => {
      try {
        const published = req.query.published === undefined ? undefined : req.query.published === 'true';
        ok(res, { rules: await service.listRules({ published }) });
      } catch (err) { next(err); }
    },
    getRule: async (req, res, next) => {
      try { ok(res, { rule: await service.getRule(req.params.destination) }); }
      catch (err) { next(err); }
    },
    upsertRule: async (req, res, next) => {
      try { ok(res, { rule: await service.upsertRule(req.body) }, 200); }
      catch (err) { next(err); }
    },
    deleteRule: async (req, res, next) => {
      try { await service.deleteRule(req.params.destination); res.status(204).send(); }
      catch (err) { next(err); }
    },
    queryStats: async (req, res, next) => {
      try {
        ok(res, await service.queryStats({
          days: Number(req.query.days) || 30,
          limit: Number(req.query.limit) || 50,
        }));
      } catch (err) { next(err); }
    },
  };
}
