import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-gray-300" />
    </div>
  );
}
