import { LuUsers, LuLuggage } from 'react-icons/lu';

export default function FleetCard({ vehicle }) {
  const oneHourPrice = vehicle?.pricing?.hourlyRates?.hour1 ?? vehicle?.pricing?.pricePerHour ?? 0;

  return (
    <div className="group relative min-w-80 max-w-100 lg:min-w-fit overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-400 hover:border-accent-300/50 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />

      <div className="relative aspect-[16/9] overflow-hidden bg-gray-50">
        <img
          src={vehicle?.featuredImage || '/images/fleet-placeholder.jpg'}
          alt={`${vehicle?.brand} ${vehicle?.model}`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-6">
        <h3 className="text-[19px] font-light tracking-wide text-primary-900 mb-3 group-hover:text-primary-900 transition-colors">
          {vehicle?.brand} <span className="font-normal">{vehicle?.model}</span>
        </h3>

        <div className="mb-4 flex items-center gap-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <LuUsers className="text-[15px] text-gray-600" />
            <span className="text-[13px] font-light text-gray-500">{vehicle?.passengers || 4} Passengers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LuLuggage className="text-[15px] text-gray-600" />
            <span className="text-[13px] font-light text-gray-500">{vehicle?.luggage || 2} Bags</span>
          </div>
        </div>

        <p className="mb-5 text-[13.5px] font-light leading-relaxed text-gray-500 line-clamp-2">
          {vehicle?.description ||
            'Travel in comfort and style with our chauffeur-driven vehicles designed for a refined journey.'}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-light text-gray-400 tracking-wider uppercase block mb-0.5">From</span>
            <p className="text-[20px] font-light text-primary-900">
              AED {oneHourPrice}
              <span className="ml-1 text-[12px] font-light text-gray-400">/hr</span>
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[13px] font-light text-accent-600 border border-accent-200 rounded-lg py-2 px-3.5 transition-all duration-300 group-hover:bg-accent-500 group-hover:border-accent-500 group-hover:text-white">
            View details
            <span className="text-sm transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}
