'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import GuestHeader from '@/components/guest/Header';
import GuestFooter from '@/components/guest/Footer';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Download, Loader2 } from 'lucide-react';

interface BookingData {
  bookingId: string; guestName: string; checkIn: string; checkOut: string;
  nights: number; roomCharges: number; discount: number; gstRate: number;
  gstAmount: number; totalAmount: number; paymentId: string; status: string;
  roomType: { name: string };
}

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) return;
      try {
        const res = await fetch(`/api/booking?id=${bookingId}`);
        const data = await res.json();
        if (data.booking) setBooking(data.booking);
      } finally { setLoading(false); }
    }
    fetchBooking();
  }, [bookingId]);

  if (loading) return (<><GuestHeader /><div className="pt-28 pb-20 flex items-center justify-center min-h-screen bg-[var(--cream)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--forest)]" /></div><GuestFooter /></>);
  if (!booking) return (<><GuestHeader /><div className="pt-28 pb-20 text-center min-h-screen bg-[var(--cream)]"><p className="text-gray-500 mt-40">Booking not found.</p></div><GuestFooter /></>);

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <GuestHeader />
      <main className="pt-24 lg:pt-28 pb-20 bg-[var(--cream)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-600" /></div>
            <h1 className="font-serif text-3xl text-[var(--forest)] mb-2">Booking Confirmed</h1>
            <p className="text-gray-500 text-sm">Confirmation #{booking.bookingId}</p>
          </div>

          <div className="bg-white border border-stone-200 divide-y divide-stone-200 rounded-sm shadow-sm">
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-xs uppercase tracking-wider text-gray-400">Guest</span><p className="font-medium mt-1">{booking.guestName}</p></div>
                <div><span className="text-xs uppercase tracking-wider text-gray-400">Room</span><p className="font-medium mt-1">{booking.roomType.name}</p></div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-xs uppercase tracking-wider text-gray-400">Check-in</span><p className="mt-1">{fmtDate(booking.checkIn)}</p><p className="text-xs text-gray-400">2:00 PM onwards</p></div>
                <div><span className="text-xs uppercase tracking-wider text-gray-400">Check-out</span><p className="mt-1">{fmtDate(booking.checkOut)}</p><p className="text-xs text-gray-400">By 11:00 AM</p></div>
              </div>
              <p className="text-xs text-gray-500 mt-3">{booking.nights} night{booking.nights > 1 ? 's' : ''}</p>
            </div>
            <div className="p-6 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Room charges</span><span>{formatCurrency(booking.roomCharges)}</span></div>
              {booking.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatCurrency(booking.discount)}</span></div>}
              <div className="flex justify-between text-gray-500 text-xs"><span>GST @ {booking.gstRate === 0.12 ? '12%' : '18%'}</span><span>{formatCurrency(booking.gstAmount)}</span></div>
              <div className="flex justify-between font-semibold text-[var(--forest)] pt-3 border-t border-stone-200 text-base"><span>Total Paid</span><span>{formatCurrency(booking.totalAmount)}</span></div>
              <p className="text-xs text-gray-400 pt-2">Payment ID: {booking.paymentId} (Test Mode)</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button className="flex-1 flex items-center justify-center gap-2 border border-stone-200 bg-white py-3 text-sm text-gray-600 hover:bg-stone-50 transition-colors rounded-sm"><Download className="w-4 h-4" /> Download Confirmation</button>
            <Link href="/" className="flex-1 bg-[var(--forest)] text-white text-center py-3 text-sm tracking-wide hover:bg-[var(--forest-light)] transition-colors rounded-sm">Back to Home</Link>
          </div>

          <div className="mt-8 bg-stone-100 border border-stone-200 p-5 text-xs text-gray-500 space-y-2 rounded-sm">
            <p><strong>ID Proof:</strong> Please carry a valid government photo ID at check-in. Foreign nationals must carry their passport for Form C.</p>
            <p><strong>Cancellation:</strong> Free cancellation up to 48 hours before check-in.</p>
            <p>A confirmation email has been sent (simulated). For queries, call +91 98765 43210.</p>
          </div>
        </div>
      </main>
      <GuestFooter />
    </>
  );
}
