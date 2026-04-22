const defaultBadges = [
  { value: '150+', label: 'Countries covered' },
  { value: '$10M', label: 'Max medical cover' },
  { value: '24/7', label: 'Emergency helpline' },
  { value: '98%', label: 'Claims paid rate' },
];

export default function TrustBadges({ trustBadges = defaultBadges }) {
  return (
    <section className="border-b border-gray-100 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap justify-center gap-10 text-center">
        {trustBadges.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-3xl font-extrabold text-primary-700">
              {value}
            </span>
            <span className="text-sm text-gray-500 mt-1">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
