import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  trend = null,
  trendLabel,
}) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-500'
        : 'text-gray-400';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={15} className={iconColor} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-lg font-extrabold text-gray-900 leading-tight truncate">
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>

      {trend !== null && (
        <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${trendColor}`}>
          <TrendIcon size={13} />
          {trendLabel && <span className="text-gray-400 font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
