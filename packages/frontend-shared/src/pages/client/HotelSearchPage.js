'use client';

import { BedDouble, ShieldCheck, Clock, FileCheck2 } from 'lucide-react';
import HotelForm from '../../components/forms/v1/HotelForm';

const POINTS = [
  { icon: ShieldCheck, title: 'A real booking', body: 'We book a genuine refundable room in your name, so the reference checks out.' },
  { icon: FileCheck2, title: 'Visa ready', body: 'You get the hotel confirmation you need for your accommodation proof.' },
  { icon: Clock, title: 'Sent in minutes', body: 'Your confirmation lands in your inbox right after payment.' },
];

export default function HotelSearchPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <BedDouble size={26} className="text-primary-700" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Hotel Reservation for Your Visa</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-lg">
          A confirmed, refundable hotel booking in your name for your visa application. Search your city and dates to get started.
        </p>
      </div>

      <HotelForm />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-200 p-5">
            <Icon size={18} className="text-primary-700 mb-3" />
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
