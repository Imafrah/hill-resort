'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ConfirmationContent from './ConfirmationContent';

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 pb-20 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-forest" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
