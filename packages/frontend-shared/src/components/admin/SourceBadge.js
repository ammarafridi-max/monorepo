import { sourceLabel } from '../../utils/attribution';

const PAID = new Set(['Google Ads', 'Meta Ads', 'ChatGPT Ads', 'Microsoft Ads', 'TikTok Ads', 'Other paid']);

export default function SourceBadge({ attribution }) {
  const label = sourceLabel(attribution);
  if (!label) return <span className="text-sm text-gray-300">—</span>;
  const paid = PAID.has(label);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
        paid ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${paid ? 'bg-primary-500' : 'bg-gray-400'}`} />
      {label}
    </span>
  );
}
