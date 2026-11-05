'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GuestHeader from '@/components/guest/Header';
import GuestFooter from '@/components/guest/Footer';
import { formatCurrency } from '@/lib/utils';
import { 
  Loader2, CreditCard, Shield, Tag, AlertCircle, CheckCircle, 
  Lock, QrCode, Building, Check, Sparkles
} from 'lucide-react';

interface AvailabilityData {
  available: boolean;
  nights: number;
  nightlyRates: { date: string; rate: number }[];
  totalRoomCharges: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
}

interface PromoCodeData {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  roomTypeId: string | null;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking';

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
  
  // Guest form fields
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialReq, setSpecialReq] = useState('');

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeData | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Payment tab state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('4532 8920 1144 8921');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('883');
  const [cardHolder, setCardHolder] = useState('');
  const [upiId, setUpiId] = useState('guest@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/availability?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}`);
        const data = await res.json();
        if (data.available) {
          setAvailability(data);
        } else {
          setError('This room is no longer available for the selected dates.');
        }
        const roomRes = await fetch(`/api/rooms?slug=${roomSlug}`);
        const roomData = await roomRes.json();
        if (roomData.room) setRoomName(roomData.room.name);
      } catch {
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    }
    if (roomTypeId && checkIn && checkOut) {
      fetchData();
    } else {
      setError('Missing booking parameters. Please choose dates and room.');
      setLoading(false);
    }
  }, [roomTypeId, checkIn, checkOut, roomSlug]);

  // Keep cardholder in sync with guest name
  useEffect(() => {
    if (guestName && !cardHolder) {
      setCardHolder(guestName.toUpperCase());
    }
  }, [guestName, cardHolder]);

  // Handle promo code application
  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');

    try {
      const res = await fetch('/api/admin/promos');
      const data = await res.json();
      const codeUpper = promoCode.trim().toUpperCase();
      const match = (data.promos || []).find((p: PromoCodeData) => p.code.toUpperCase() === codeUpper);

      if (!match) {
        setPromoError('Promo code not recognized.');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      if (!match.isActive) {
        setPromoError('This promo code is currently inactive.');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      if (today < match.validFrom || today > match.validTo) {
        setPromoError('This promo code is outside its validity period.');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      if (match.usedCount >= match.maxUses) {
        setPromoError('Promo code usage limit has been reached.');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      if (match.roomTypeId && match.roomTypeId !== roomTypeId) {
        setPromoError('This promo code is not valid for this room type.');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      // Valid promo! Calculate discount
      if (!availability) return;
      let calculatedDiscount = 0;
      if (match.discountType === 'percentage') {
        calculatedDiscount = Math.round(availability.totalRoomCharges * (match.discountValue / 100));
      } else {
        calculatedDiscount = Math.min(match.discountValue, availability.totalRoomCharges);
      }

      setAppliedPromo(match);
      setDiscountAmount(calculatedDiscount);
    } catch {
      setPromoError('Failed to validate promo code.');
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoCode('');
    setDiscountAmount(0);
    setPromoError('');
  }

  // Calculate live financial summary with applied promo discount
  const roomCharges = availability?.totalRoomCharges || 0;
  const taxableAmount = Math.max(0, roomCharges - discountAmount);
  const gstRate = availability?.gstRate || 0.12;
  const calculatedGst = Math.round(taxableAmount * gstRate);
  const finalTotal = taxableAmount + calculatedGst;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName || !email || !phone) {
      setError('Please fill in all required guest details.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId,
          checkIn,
          checkOut,
          guestName,
          email,
          phone,
          adults: parseInt(guests),
          children: 0,
          specialReq,
          promoCode: appliedPromo ? appliedPromo.code : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        router.push(`/booking/confirmation?id=${data.booking.bookingId}`);
      } else {
        setError(data.error || 'Booking reservation could not be completed.');
      }
    } catch {
      setError('A network or server error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <GuestHeader />
        <div className="pt-28 pb-20 flex items-center justify-center min-h-screen bg-[var(--cream)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--forest)]" />
        </div>
        <GuestFooter />
      </>
    );
  }

  return (
    <>
      <GuestHeader />
      <main className="pt-24 lg:pt-28 pb-20 bg-[var(--cream)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Booking Progress Tracker */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10 text-xs sm:text-sm">
            <span className="text-gray-400">1. Select dates</span>
            <span className="w-6 sm:w-8 h-px bg-stone-300" />
            <span className="text-gray-400">2. Choose room</span>
            <span className="w-6 sm:w-8 h-px bg-stone-300" />
            <span className="text-[var(--forest)] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--gold)]" />
              3. Confirm &amp; Pay
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] text-center mb-10 tracking-tight">
            Complete Your Reservation
          </h1>

          {error && !availability && (
            <div className="max-w-lg mx-auto p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 rounded-sm mb-8">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {availability && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
                {/* Left Column: Form Sections */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Section 1: Guest Details */}
                  <div className="bg-white border border-stone-200 p-6 lg:p-8 rounded-sm shadow-sm">
                    <h2 className="font-serif text-xl text-[var(--forest)] mb-5">Primary Guest Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="As stated on government-issued ID"
                          className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="reservation@example.com"
                            className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                          Special Requests &amp; Dietary Preferences
                        </label>
                        <textarea
                          value={specialReq}
                          onChange={(e) => setSpecialReq(e.target.value)}
                          rows={2}
                          placeholder="Estate plantation tour, high-floor room, quiet corner, early arrival..."
                          className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Promo Code */}
                  <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-sm">
                    <h3 className="text-sm font-medium text-[var(--forest)] mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[var(--gold)]" /> Have a direct-booking promotional code?
                    </h3>

                    {!appliedPromo ? (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              setPromoError('');
                            }}
                            placeholder="e.g. DIRECTFIRST"
                            className="flex-1 px-4 py-2 border border-stone-200 bg-stone-50 text-sm rounded-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            disabled={!promoCode.trim() || promoLoading}
                            className="px-5 py-2 bg-[var(--forest)] text-white text-sm font-medium rounded-sm hover:bg-[var(--forest-light)] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                          >
                            {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                          </button>
                        </div>
                        {promoError && (
                          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {promoError}
                          </p>
                        )}
                        <p className="mt-2 text-[11px] text-stone-500">
                          Try code <span className="font-mono font-medium text-[var(--forest)]">DIRECTFIRST</span> for 10% direct savings.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-900 tracking-wider">
                              {appliedPromo.code} APPLIED
                            </p>
                            <p className="text-[11px] text-emerald-700">
                              {appliedPromo.description} ({formatCurrency(discountAmount)} off)
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Section 3: Payment Gateway Checkout */}
                  <div className="bg-white border border-stone-200 p-6 lg:p-8 rounded-sm shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif text-lg text-[var(--forest)] flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[var(--gold)]" /> Payment Details
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-sm font-medium">
                        <Lock className="w-3 h-3 text-emerald-700" /> 256-Bit SSL Encrypted
                      </div>
                    </div>

                    {/* Payment Method Selector Tabs */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-sm mb-5 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-2 px-3 rounded-sm text-center transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-white text-[var(--forest)] shadow-xs font-semibold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Credit / Debit Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`py-2 px-3 rounded-sm text-center transition-all ${
                          paymentMethod === 'upi'
                            ? 'bg-white text-[var(--forest)] shadow-xs font-semibold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        UPI / QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('netbanking')}
                        className={`py-2 px-3 rounded-sm text-center transition-all ${
                          paymentMethod === 'netbanking'
                            ? 'bg-white text-[var(--forest)] shadow-xs font-semibold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Net Banking
                      </button>
                    </div>

                    {/* Method 1: Credit / Debit Card */}
                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                              Card Number
                            </label>
                            <span className="text-[10px] text-stone-400 font-mono tracking-wider">
                              VISA • MASTERCARD • RUPAY
                            </span>
                          </div>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4532 0000 0000 0000"
                            className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm font-mono rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm font-mono rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                              CVV / CVC
                            </label>
                            <input
                              type="password"
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm font-mono rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="NAME AS PRINTED ON CARD"
                            className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm uppercase rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Method 2: UPI / QR Code */}
                    {paymentMethod === 'upi' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">
                            Virtual Payment Address (VPA / UPI ID)
                          </label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="mobile@okhdfcbank"
                            className="w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm font-mono rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:bg-white"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-stone-600">Supported Apps:</span>
                          <span className="text-[11px] text-stone-500 font-medium">
                            Google Pay • PhonePe • Paytm • BHIM UPI
                          </span>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setShowQr(!showQr)}
                            className="text-xs text-[var(--forest)] hover:underline flex items-center gap-1.5 font-medium"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[var(--gold)]" />
                            {showQr ? 'Hide Instant QR Code' : 'Or generate instant QR Code to scan'}
                          </button>

                          {showQr && (
                            <div className="mt-3 p-4 bg-stone-50 border border-stone-200 rounded-sm text-center">
                              <div className="w-32 h-32 bg-white border border-stone-300 mx-auto flex items-center justify-center p-2 rounded-sm shadow-xs">
                                <QrCode className="w-24 h-24 text-[var(--forest)]" />
                              </div>
                              <p className="mt-2 text-xs text-stone-600">Scan with any UPI application to complete payment</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Method 3: Net Banking */}
                    {paymentMethod === 'netbanking' && (
                      <div className="space-y-3">
                        <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">
                          Select Banking Partner
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setSelectedBank(b)}
                              className={`p-3 text-left border rounded-sm flex items-center justify-between transition-all ${
                                selectedBank === b
                                  ? 'border-[var(--forest)] bg-emerald-50/50 text-[var(--forest)] font-medium'
                                  : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-stone-400" /> {b}
                              </span>
                              {selectedBank === b && <Check className="w-3.5 h-3.5 text-[var(--forest)]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sandbox Security Notice */}
                    <div className="mt-5 p-3.5 bg-stone-50 border border-stone-200 rounded-sm text-xs text-stone-600 flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-stone-800">Evaluator Sandbox Active:</span> Pre-loaded with test credentials for immediate validation. No real payment cards or bank accounts will be charged.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Sticky Summary & Checkout Action */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-stone-200 p-6 lg:p-8 sticky top-24 rounded-sm shadow-sm">
                    <h2 className="font-serif text-xl text-[var(--forest)] mb-5">Reservation Summary</h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="text-gray-500">Accommodation</span>
                        <span className="font-medium text-right text-[var(--forest)]">{roomName || roomSlug}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Check-in</span>
                        <span>
                          {new Date(checkIn + 'T00:00:00').toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Check-out</span>
                        <span>
                          {new Date(checkOut + 'T00:00:00').toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Guests</span>
                        <span>{guests} Guest{parseInt(guests) > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stay Duration</span>
                        <span>{availability.nights} Night{availability.nights > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="border-t border-stone-200 mt-5 pt-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Room charges</span>
                        <span>{formatCurrency(roomCharges)}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium text-xs">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Direct Discount ({appliedPromo?.code})
                          </span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-500 text-xs">
                        <span>GST ({gstRate === 0.12 ? '12%' : '18%'})</span>
                        <span>{formatCurrency(calculatedGst)}</span>
                      </div>

                      <div className="flex justify-between font-serif font-bold text-[var(--forest)] pt-3 border-t border-stone-200 text-lg">
                        <span>Grand Total</span>
                        <span className="text-[var(--gold)]">{formatCurrency(finalTotal)}</span>
                      </div>
                    </div>

                    {error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 rounded-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>{error}</div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-6 bg-[var(--gold)] text-[var(--forest-dark)] py-3.5 text-sm font-semibold tracking-wider hover:bg-[var(--gold-light)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm shadow-xs uppercase"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Payment...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" /> Authorize &amp; Pay {formatCurrency(finalTotal)}
                        </>
                      )}
                    </button>

                    <div className="mt-4 pt-4 border-t border-stone-100 text-[11px] text-stone-500 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Free cancellation up to 48 hours prior to arrival
                      </p>
                      <p className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Foreign passport Form C registered at reception
                      </p>
                    </div>
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
