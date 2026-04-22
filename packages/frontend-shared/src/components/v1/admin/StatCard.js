export default function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 leading-none">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
