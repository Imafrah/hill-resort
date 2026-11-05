'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Users, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  roomTypeId: string;
  roomSlug: string;
  roomName: string;
  maxGuests: number;
}

interface AvailabilityResult {
  available: boolean;
  nights: number;
  nightlyRates: { date: string; rate: number }[];
  totalRoomCharges: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export default function AvailabilityChecker({ roomTypeId, roomSlug, roomName, maxGuests }: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  async function handleCheck() {
    if (!checkIn || !checkOut) { setError('Please select both dates.'); return; }
    if (checkIn >= checkOut) { setError('Check-out must be after check-in.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`/api/availability?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to check.'); return; }
      setResult(data);
    } catch { setError('Something went wrong.'); } finally { setLoading(false); }
  }

  function handleBookNow() {
    router.push(`/booking?roomTypeId=${roomTypeId}&roomSlug=${roomSlug}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  }

  return (
    <div>
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Check-in</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" value={checkIn} min={today}
              onChange={(e) => { setCheckIn(e.target.value); setResult(null); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
              className="w-full pl-10 pr-3 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Check-out</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="date" value={checkOut} min={checkIn || today}
              onChange={(e) => { setCheckOut(e.target.value); setResult(null); }}
              className="w-full pl-10 pr-3 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Guests</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full pl-10 pr-3 py-2.5 border border-stone-200 bg-stone-50 text-sm appearance-none rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]">
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleCheck} disabled={loading}
        className="w-full bg-[var(--forest)] text-white py-3 text-sm tracking-wide hover:bg-[var(--forest-light)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm">
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>) : 'Check Availability'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 rounded-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-6 pt-6 border-t border-stone-200">
          {result.available ? (
            <>
              <p className="text-sm text-emerald-800 font-medium mb-4 flex items-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                Available for {result.nights} night{result.nights > 1 ? 's' : ''}
              </p>
              <div className="space-y-1.5 mb-4">
                {result.nightlyRates.map((nr) => (
                  <div key={nr.date} className="flex justify-between text-xs text-gray-500">
                    <span>{new Date(nr.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span>{formatCurrency(nr.rate)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-3 border-t border-stone-200 text-sm">
                <div className="flex justify-between text-gray-600"><span>Room charges</span><span>{formatCurrency(result.totalRoomCharges)}</span></div>
                <div className="flex justify-between text-gray-500 text-xs"><span>GST @ {result.gstRate === 0.12 ? '12%' : '18%'}</span><span>{formatCurrency(result.gstAmount)}</span></div>
                <div className="flex justify-between font-semibold text-[var(--forest)] pt-2 border-t border-stone-200"><span>Total</span><span>{formatCurrency(result.totalAmount)}</span></div>
              </div>
              <button onClick={handleBookNow}
                className="w-full mt-6 bg-[var(--gold)] text-[var(--forest-dark)] py-3.5 text-sm font-medium tracking-wide hover:bg-[var(--gold-light)] transition-colors rounded-sm">
                Book Now — {formatCurrency(result.totalAmount)}
              </button>
            </>
          ) : (
            <p className="text-sm text-red-600">Sorry, not available for the selected dates. Please try different dates.</p>
          )}
        </div>
      )}
    </div>
  );
}
