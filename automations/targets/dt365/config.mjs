import { defineTarget } from '../../src/define-target.mjs';
export const TARGET = defineTarget({
  key: 'dt365',
  jobs: ['affiliate-payouts', 'meta-audiences'],
  name: 'Dummy Ticket 365',
  backendUrl: 'https://api.dummyticket365.com',

  adminEmailEnv: 'DT365_ADMIN_EMAIL',
  adminPasswordEnv: 'DT365_ADMIN_PASSWORD',
});
