import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function GuestFooter() {
  return (
    <footer className="bg-[var(--forest)] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <h3 className="font-serif text-2xl text-white mb-3">Misty Peaks Estate</h3>
            <p className="text-sm leading-relaxed text-white/60 max-w-md">
              A coffee-estate resort in the Western Ghats of Chikkamagaluru, Karnataka.
              76 rooms and villas nestled among arabica plantations with panoramic mountain views.
            </p>
            <div className="flex flex-col gap-2 mt-6 text-sm">
              <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors">
                <Phone className="w-4 h-4 text-[var(--gold)]" /> +91 98765 43210
              </a>
              <a href="mailto:reservations@mistypeaks.in" className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors">
                <Mail className="w-4 h-4 text-[var(--gold)]" /> reservations@mistypeaks.in
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--gold)] mt-0.5 shrink-0" />
                <span>Misty Peaks Estate, Coffee Plantation Road,<br />Chikkamagaluru, Karnataka 577101</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-[var(--gold)] mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/#rooms" className="hover:text-white transition-colors">Rooms & Villas</Link>
              <Link href="/enquiry" className="hover:text-white transition-colors">Weddings & Events</Link>
              <Link href="/#about" className="hover:text-white transition-colors">The Estate</Link>
              <Link href="/admin" className="hover:text-white transition-colors">Staff Login</Link>
            </nav>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-[var(--gold)] mb-4">Information</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <span>Check-in: 2:00 PM</span>
              <span>Check-out: 11:00 AM</span>
              <span>GST: 12–18% on tariff</span>
              <span>Cancellation: 48h free</span>
            </nav>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Misty Peaks Estate. All rights reserved. Your data is protected under the DPDP Act 2023.</p>
          <p className="text-xs text-white/40">Book direct &amp; save up to 20%</p>
        </div>
      </div>
    </footer>
  );
}
