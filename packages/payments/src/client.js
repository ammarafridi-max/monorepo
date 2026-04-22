import Stripe from 'stripe';

/**
 * @param {{ secretKey: string, apiVersion?: string }} deps
 * @returns {import('stripe').Stripe}
 */
export function createStripeClient({ secretKey, apiVersion = '2024-04-10' }) {
  if (!secretKey) throw new Error('Stripe secretKey is required');
  return new Stripe(secretKey, { apiVersion });
}
