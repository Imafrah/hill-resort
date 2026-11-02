'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, CalendarDays, Tag, Inbox, 
  ChevronLeft, Hotel
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Bookings', icon: LayoutDashboard },
  { href: '/admin/rates', label: 'Rates & Allotment', icon: CalendarDays },
  { href: '/admin/promos', label: 'Promo Codes', icon: Tag },
  { href: '/admin/inbox', label: 'Enquiry Inbox', icon: Inbox },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--forest-dark)] text-white flex flex-col shrink-0 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Hotel className="w-5 h-5 text-[var(--gold)]" />
            <div>
              <div className="font-serif text-sm font-semibold tracking-tight">Misty Peaks</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = 
              item.href === '/admin' 
                ? pathname === '/admin' 
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Guest Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
