'use client';

import { useState } from 'react';
import GuestHeader from '@/components/guest/Header';
import GuestFooter from '@/components/guest/Footer';
import { CheckCircle, Loader2, Send } from 'lucide-react';

export default function EnquiryPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enquiryId, setEnquiryId] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    guestName: '', guestEmail: '', guestPhone: '', eventType: '',
    eventDateFrom: '', eventDateTo: '', expectedGuests: '',
    estimatedBudget: '', requirements: '', message: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'web_form', ...formData, expectedGuests: formData.expectedGuests ? Number(formData.expectedGuests) : undefined }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); setEnquiryId(data.enquiryId); }
      else setError(data.error || 'Failed to submit.');
    } catch { setError('Something went wrong.'); }
    finally { setSubmitting(false); }
  }

  const inputCls = "w-full px-4 py-2.5 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]";

  if (submitted) {
    return (
      <><GuestHeader />
        <main className="pt-24 lg:pt-28 pb-20 min-h-screen bg-[var(--cream)]">
          <div className="max-w-lg mx-auto px-4 text-center py-20">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-green-600" /></div>
            <h1 className="font-serif text-3xl text-[var(--forest)] mb-3">Enquiry Submitted</h1>
            <p className="text-gray-500 mb-2">Reference: {enquiryId}</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">Thank you for your interest. Our team will get back to you within a few hours.</p>
          </div>
        </main>
      <GuestFooter /></>
    );
  }

  return (
    <><GuestHeader />
      <main className="pt-24 lg:pt-28 pb-20 bg-[var(--cream)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[var(--coffee)] text-xs uppercase tracking-[0.3em] mb-3">Weddings &amp; Events</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] mb-4">Plan Your Celebration</h1>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              From intimate ceremonies to grand celebrations for up to 300 guests, our estate offers a magical setting in the Western Ghats.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="bg-white border border-stone-200 divide-y divide-stone-200 rounded-sm shadow-sm">
              <div className="p-6 lg:p-8 space-y-4">
                <h2 className="font-serif text-lg text-[var(--forest)] mb-4">Your Details</h2>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input type="text" name="guestName" required value={formData.guestName} onChange={handleChange} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Email *</label>
                    <input type="email" name="guestEmail" required value={formData.guestEmail} onChange={handleChange} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Phone *</label>
                    <input type="tel" name="guestPhone" required value={formData.guestPhone} onChange={handleChange} className={inputCls} /></div>
                </div>
              </div>

              <div className="p-6 lg:p-8 space-y-4">
                <h2 className="font-serif text-lg text-[var(--forest)] mb-4">Event Details</h2>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Event Type *</label>
                  <select name="eventType" required value={formData.eventType} onChange={handleChange} className={inputCls + " appearance-none"}>
                    <option value="">Select type...</option>
                    <option value="wedding">Wedding / Reception</option>
                    <option value="corporate_offsite">Corporate Offsite / Retreat</option>
                    <option value="social_event">Social Celebration</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">From Date</label>
                    <input type="date" name="eventDateFrom" value={formData.eventDateFrom} onChange={handleChange} className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">To Date</label>
                    <input type="date" name="eventDateTo" value={formData.eventDateTo} onChange={handleChange} className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Expected Guests</label>
                    <input type="number" name="expectedGuests" value={formData.expectedGuests} onChange={handleChange} placeholder="e.g. 150" className={inputCls} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Estimated Budget</label>
                    <input type="text" name="estimatedBudget" value={formData.estimatedBudget} onChange={handleChange} placeholder="e.g. ₹15 lakh" className={inputCls} /></div>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Specific Requirements</label>
                  <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={3} placeholder="Mandap, catering, AV equipment..." className={inputCls + " resize-none"} /></div>
                <div><label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Additional Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} rows={3} placeholder="Anything else..." className={inputCls + " resize-none"} /></div>
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting}
              className="w-full mt-6 bg-[var(--forest)] text-white py-3.5 text-sm tracking-wide hover:bg-[var(--forest-light)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm">
              {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>) : (<><Send className="w-4 h-4" /> Submit Enquiry</>)}
            </button>
          </form>
        </div>
      </main>
    <GuestFooter /></>
  );
}
