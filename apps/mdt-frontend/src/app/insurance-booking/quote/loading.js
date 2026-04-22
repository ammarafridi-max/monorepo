import { Loader2 } from 'lucide-react';

export default function QuoteLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={24} className="animate-spin text-gray-300" />
    </div>
  );
}
