import { AppError } from '@travel-suite/utils';

/**
 * @param {{ stripe: import('stripe').Stripe }} deps
 */
export function createPaymentService({ stripe }) {
  const createCheckoutSession = async ({
    amount,
    currency = 'aed',
    productName,
    customerEmail,
    successUrl,
    cancelUrl,
    metadata = {},
    idempotencyKey,
  }) => {
    const totalAmount = Number(amount);
    if (!totalAmount || totalAmount <= 0 || Number.isNaN(totalAmount)) {
      throw new AppError('Invalid payment amount', 400);
    }

    return stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: customerEmail,
        invoice_creation: { enabled: true },
        metadata,
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: Math.round(totalAmount * 100),
              product_data: { name: productName },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  };

  return { createCheckoutSession };
}
