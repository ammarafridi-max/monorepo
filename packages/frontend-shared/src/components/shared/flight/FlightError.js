import { AlertCircle } from 'lucide-react';

export default function FlightError({ email }) {
  if (!email && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[FlightError] `email` prop is required — falling back to no email button. ' +
        'Pass the brand-specific support email from the consuming app.',
    );
  }
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">Failed to load flights</p>
          <p className="text-base text-gray-400 mt-2">
            We couldn&apos;t load flights at this time. Email us your route, dates, and passenger
            names and we&apos;ll help you out.
          </p>
        </div>
        {email && (
          <a
            href={`mailto:${email}`}
            className="text-sm font-bold px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
          >
            Send email
          </a>
        )}
      </div>
    </div>
  );
}
