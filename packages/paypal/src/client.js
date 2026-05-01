/**
 * Lightweight PayPal REST API v2 client.
 * Uses Node's built-in fetch — no extra dependencies.
 *
 * Supported currencies: USD, EUR, GBP, AUD, CAD, etc.
 * AED is NOT supported by PayPal; callers should convert to USD first.
 */
export function createPayPalClient({ clientId, clientSecret, mode = 'sandbox' }) {
  if (!clientId || !clientSecret) throw new Error('PayPal clientId and clientSecret are required');

  const baseUrl =
    mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  // -- Token cache ----------------------------------------------------------
  let _cachedToken = null;
  let _tokenExpiresAt = 0;

  async function getAccessToken() {
    if (_cachedToken && Date.now() < _tokenExpiresAt - 30_000) {
      return _cachedToken;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal auth failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    _cachedToken = data.access_token;
    _tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return _cachedToken;
  }

  // -- Create order ---------------------------------------------------------

  /**
   * Creates a PayPal order and returns the approval URL to redirect the customer to.
   *
   * @param {{
   *   amount: string|number,  e.g. "25.00"
   *   currency: string,       ISO-4217, must be PayPal-supported (e.g. "USD")
   *   returnUrl: string,      PayPal redirects here after customer approves
   *   cancelUrl: string,      PayPal redirects here if customer cancels
   *   sessionId: string,      stored as custom_id on the purchase unit
   *   description?: string,
   *   brandName?: string,
   * }}
   * @returns {{ orderId: string, approveUrl: string }}
   */
  async function createOrder({ amount, currency, returnUrl, cancelUrl, sessionId, description, brandName }) {
    const token = await getAccessToken();

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': sessionId, // idempotency key
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: sessionId,
            description: description || 'Flight Reservation',
            amount: {
              currency_code: String(currency).toUpperCase(),
              value: Number(amount).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: brandName || 'Dummy Ticket 365',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal createOrder failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const approveLink = data.links?.find((l) => l.rel === 'approve');

    if (!approveLink?.href) {
      throw new Error('PayPal did not return an approval URL');
    }

    return { orderId: data.id, approveUrl: approveLink.href };
  }

  // -- Capture order --------------------------------------------------------

  /**
   * Captures an approved PayPal order. Call this after the customer returns
   * from PayPal with the `token` (orderId) query parameter.
   *
   * @param {string} orderId
   * @returns {object} PayPal capture response
   */
  async function captureOrder(orderId) {
    const token = await getAccessToken();

    const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal captureOrder failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  return { createOrder, captureOrder, getAccessToken };
}
