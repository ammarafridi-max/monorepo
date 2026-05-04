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
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">

      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>

        {trend !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            {trendLabel && (
              <span className="text-gray-400 font-normal">{trendLabel}</span>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-extrabold text-gray-900 leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        )}
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
