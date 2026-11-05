import { defineTarget } from '../../src/define-target.mjs';
export const TARGET = defineTarget({
  key: 'mdt',
  jobs: ['affiliate-payouts'],
  name: 'My Dummy Ticket',
  backendUrl: 'https://api.mydummyticket.ae',

  adminEmailEnv: 'MDT_ADMIN_EMAIL',
  adminPasswordEnv: 'MDT_ADMIN_PASSWORD',
});
