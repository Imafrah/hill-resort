'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';

export default function GuestHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-[var(--forest)] flex items-center justify-center">
              <span className="text-white font-serif text-sm font-bold">M</span>
            </div>
            <div>
              <span className="font-serif text-lg lg:text-xl text-[var(--forest)] font-semibold tracking-tight">
                Misty Peaks
              </span>
              <span className="hidden sm:inline text-xs text-[var(--coffee)] ml-1.5 tracking-widest uppercase">
                Estate
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#rooms" className="text-sm text-gray-600 hover:text-[var(--forest)] transition-colors tracking-wide">
              Rooms & Villas
            </Link>
            <Link href="/enquiry" className="text-sm text-gray-600 hover:text-[var(--forest)] transition-colors tracking-wide">
              Weddings & Events
            </Link>
            <Link href="/#about" className="text-sm text-gray-600 hover:text-[var(--forest)] transition-colors tracking-wide">
              The Estate
            </Link>
            <a href="tel:+919876543210" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[var(--forest)]">
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">+91 98765 43210</span>
            </a>
            <Link href="/#rooms" className="bg-[var(--forest)] text-white px-5 py-2.5 text-sm tracking-wide hover:bg-[var(--forest-light)] transition-colors rounded-sm">
              Book Direct
            </Link>
          </nav>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600" aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-stone-200">
          <nav className="px-4 py-4 flex flex-col gap-3">
            <Link href="/#rooms" className="py-2 text-sm text-gray-700" onClick={() => setMobileOpen(false)}>Rooms & Villas</Link>
            <Link href="/enquiry" className="py-2 text-sm text-gray-700" onClick={() => setMobileOpen(false)}>Weddings & Events</Link>
            <Link href="/#about" className="py-2 text-sm text-gray-700" onClick={() => setMobileOpen(false)}>The Estate</Link>
            <a href="tel:+919876543210" className="py-2 text-sm text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4" /> +91 98765 43210
            </a>
            <Link href="/#rooms" className="bg-[var(--forest)] text-white text-center py-3 text-sm tracking-wide mt-2 rounded-sm" onClick={() => setMobileOpen(false)}>
              Book Direct
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
