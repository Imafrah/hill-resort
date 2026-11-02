'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { 
  Download, Search, Eye, Calendar, Users, CreditCard, 
  Loader2, ChevronDown 
} from 'lucide-react';

interface Booking {
  id: string;
  bookingId: string;
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  gstAmount: number;
  discount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  roomType: { name: string };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayArrivals = bookings.filter((b) => b.checkIn === todayStr).length;
  const todayDepartures = bookings.filter((b) => b.checkOut === todayStr).length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reservations and export for the reservation system
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-[var(--forest)] text-white px-4 py-2.5 text-sm rounded-sm hover:bg-[var(--forest-light)] transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 rounded">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{bookings.length}</p>
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{todayArrivals}</p>
              <p className="text-xs text-gray-500">Arrivals Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded flex items-center justify-center">
              <Eye className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{todayDepartures}</p>
              <p className="text-xs text-gray-500">Departures Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, booking ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 bg-white text-sm rounded focus:outline-none focus:border-[var(--forest)]"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-200 bg-white text-sm rounded focus:outline-none focus:border-[var(--forest)]"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Room
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[var(--forest)] font-medium">
                        {booking.bookingId}
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{booking.guestName}</p>
                      <p className="text-xs text-gray-400">{booking.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {booking.roomType.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span>
                        {new Date(booking.checkIn + 'T00:00:00').toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span>
                        {new Date(booking.checkOut + 'T00:00:00').toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({booking.nights}N)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(booking.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
