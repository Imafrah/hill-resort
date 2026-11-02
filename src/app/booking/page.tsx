'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import BookingContent from './BookingContent';

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 pb-20 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-forest" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
