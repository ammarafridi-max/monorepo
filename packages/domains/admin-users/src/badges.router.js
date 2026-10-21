import { Router } from 'express';
import { catchAsync } from '@travel-suite/utils';

export function createAdminBadgesRouter({ auth, counters = {} }) {
  const router = Router();
  const { protect } = auth;
  const entries = Object.entries(counters);

  router.get('/', protect, catchAsync(async (req, res) => {
    const results = await Promise.all(
      entries.map(async ([key, count]) => {
        try {
          return [key, Number(await count(req.user)) || 0];
        } catch {
          return [key, 0];
        }
      }),
    );
    res.json({ status: 'success', data: Object.fromEntries(results) });
  }));

  return router;
}
