import Stripe from 'stripe';

export function createStripeClient({ secretKey, apiVersion = '2024-04-10' }) {
  if (!secretKey) throw new Error('Stripe secretKey is required');
  return new Stripe(secretKey, { apiVersion });
}
