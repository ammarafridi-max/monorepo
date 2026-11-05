'use client';

export const PAYMENT_STATUS = {
  PAID: {
    label: 'Paid',
    dot: 'bg-green-500',
    cls: 'bg-green-50  text-green-700  border-green-200',
    pill: { bg: '#5dcaa5', fg: '#04342c' },
  },
  UNPAID: {
    label: 'Unpaid',
    dot: 'bg-amber-400',
    cls: 'bg-amber-50  text-amber-700  border-amber-200',
    pill: { bg: '#5f5e5a', fg: '#ffffff' },
  },
  REFUNDED: {
    label: 'Refunded',
    dot: 'bg-gray-400',
    cls: 'bg-gray-100  text-gray-600   border-gray-200',
    pill: { bg: '#f09595', fg: '#501313' },
  },
  PARTIALLY_REFUNDED: {
    label: 'Partly refunded',
    dot: 'bg-orange-400',
    cls: 'bg-orange-50 text-orange-700 border-orange-200',
    pill: { bg: '#f5c08a', fg: '#4a2c06' },
  },
};

const UNKNOWN = {
  dot: 'bg-gray-400',
  cls: 'bg-gray-100 text-gray-500 border-gray-200',
  pill: { bg: '#5f5e5a', fg: '#ffffff' },
};

export function paymentStatusConfig(status) {
  return PAYMENT_STATUS[status] ?? { ...UNKNOWN, label: status ?? '—' };
}

export function PaymentBadge({ status }) {
  const cfg = paymentStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
