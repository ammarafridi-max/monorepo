import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * @param {object}  props
 * @param {React.ElementType} props.icon       Lucide icon component
 * @param {string}  props.iconColor            Tailwind text-* class
 * @param {string}  props.iconBg               Tailwind bg-* class for icon wrapper
 * @param {string}  props.label                Card label
 * @param {string|number} props.value          Primary displayed value
 * @param {string}  [props.sub]                Small text below value
 * @param {'up'|'down'|'flat'|null} [props.trend]
 * @param {string}  [props.trendLabel]         e.g. "vs last 30 days"
 */
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
      {/* Top row: icon + trend */}
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

      {/* Value */}
      <div>
        <p className="text-2xl font-extrabold text-gray-900 leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
