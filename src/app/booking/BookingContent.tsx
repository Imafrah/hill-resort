'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GuestHeader from '@/components/guest/Header';
import GuestFooter from '@/components/guest/Footer';
import { formatCurrency } from '@/lib/utils';
import { Loader2, CreditCard, Shield, Tag, AlertCircle, CheckCircle } from 'lucide-react';

interface AvailabilityData {
  available: boolean;
  nights: number;
  nightlyRates: { date: string; rate: number }[];
  totalRoomCharges: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

export default function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomTypeId = searchParams.get('roomTypeId') || '';
  const roomSlug = searchParams.get('roomSlug') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = searchParams.get('guests') || '2';

  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialReq, setSpecialReq] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/availability?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}`);
        const data = await res.json();
        if (data.available) setAvailability(data);
        else setError('This room is no longer available for the selected dates.');
        const roomRes = await fetch(`/api/rooms?slug=${roomSlug}`);
        const roomData = await roomRes.json();
        if (roomData.room) setRoomName(roomData.room.name);
      } catch { setError('Failed to load booking details.'); }
      finally { setLoading(false); }
    }
    if (roomTypeId && checkIn && checkOut) fetchData();
    else { setError('Missing booking parameters.'); setLoading(false); }
  }, [roomTypeId, checkIn, checkOut, roomSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName || !email || !phone) { setError('Please fill in all required fields.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomTypeId, checkIn, checkOut, guestName, email, phone, adults: parseInt(guests), children: 0, specialReq, promoCode: promoApplied ? promoCode.toUpperCase() : undefined }),
      });
      const data = await res.json();
      if (data.success) router.push(`/booking/confirmation?id=${data.booking.bookingId}`);
      else setError(data.error || 'Booking failed.');
    } catch { setError('Something went wrong.'); }
    finally { setSubmitting(false); }
  }

  if (loading) return (<><GuestHeader /><div className="pt-28 pb-20 flex items-center justify-center min-h-screen bg-[var(--cream)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--forest)]" /></div><GuestFooter /></>);

  return (
    <>
      <GuestHeader />
      <main className="pt-24 lg:pt-28 pb-20 bg-[var(--cream)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 mb-12 text-sm">
            <span className="text-gray-400">1. Select dates</span><span className="w-8 h-px bg-gray-300" />
            <span className="text-gray-400">2. Choose room</span><span className="w-8 h-px bg-gray-300" />
            <span className="text-[var(--forest)] font-semibold">3. Confirm &amp; Pay</span>
          </div>
          <h1 className="font-serif text-3xl text-[var(--forest)] text-center mb-10">Complete Your Booking</h1>

          {error && !availability && (
            <div className="max-w-lg mx-auto p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 rounded-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {availability && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 space-y-6">
                  {/* Guest Details */}
                  <div className="bg-white border border-stone-200 p-6 lg:p-8 rounded-sm shadow-sm">
                    <h2 className="font-serif text-xl text-[var(--forest)] mb-6">Guest Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Full Name *</label>
                        <input type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="As per ID proof"
                          className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Email *</label>
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                            className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Phone *</label>
                          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210"
                            className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Special Requests</label>
                        <textarea value={specialReq} onChange={(e) => setSpecialReq(e.target.value)} rows={3} placeholder="Early check-in, extra bed..."
                          className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--gold)]" />
                      </div>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[var(--gold)]" /> Have a promo code?
                    </h3>
                    <div className="flex gap-2">
                      <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(false); }}
                        placeholder="Enter code" disabled={promoApplied}
                        className="flex-1 px-4 py-2 border border-stone-200 bg-stone-50 text-sm rounded-sm uppercase disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]" />
                      <button type="button" onClick={() => { if (promoCode) setPromoApplied(true); }} disabled={!promoCode || promoApplied}
                        className="px-4 py-2 bg-[var(--forest)] text-white text-sm rounded-sm hover:bg-[var(--forest-light)] disabled:opacity-50">Apply</button>
                    </div>
                    {promoApplied && <p className="mt-2 text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Code will be applied at checkout</p>}
                  </div>

                  {/* Payment */}
                  <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-[var(--gold)]" /> Payment</h3>
                    <div className="bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700 rounded-sm">
                      <p className="font-medium mb-1">🔒 Test Mode</p>
                      <p className="text-xs">This is a simulated payment. No real charges will be made.</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-stone-200 p-6 lg:p-8 sticky top-24 rounded-sm shadow-sm">
                    <h2 className="font-serif text-xl text-[var(--forest)] mb-6">Booking Summary</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-medium text-right">{roomName || roomSlug}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span>{new Date(checkIn + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span>{new Date(checkOut + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Guests</span><span>{guests}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Nights</span><span>{availability.nights}</span></div>
                    </div>
                    <div className="border-t border-stone-200 mt-5 pt-5 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600"><span>Room charges</span><span>{formatCurrency(availability.totalRoomCharges)}</span></div>
                      <div className="flex justify-between text-gray-500 text-xs"><span>GST @ {availability.gstRate === 0.12 ? '12%' : '18%'}</span><span>{formatCurrency(availability.gstAmount)}</span></div>
                      <div className="flex justify-between font-semibold text-[var(--forest)] pt-3 border-t border-stone-200 text-base"><span>Total</span><span>{formatCurrency(availability.totalAmount)}</span></div>
                    </div>
                    {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 rounded-sm"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}</div>}
                    <button type="submit" disabled={submitting}
                      className="w-full mt-6 bg-[var(--gold)] text-[var(--forest-dark)] py-3.5 text-sm font-medium tracking-wide hover:bg-[var(--gold-light)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm">
                      {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>) : (<><Shield className="w-4 h-4" /> Confirm &amp; Pay {formatCurrency(availability.totalAmount)}</>)}
                    </button>
                    <p className="text-xs text-gray-400 mt-3 text-center">Free cancellation up to 48 hours before check-in</p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
      <GuestFooter />
    </>
  );
}
