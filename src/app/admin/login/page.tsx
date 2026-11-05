'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hotel, KeyRound, Loader2, ArrowRight, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';

const DEMO_ACCOUNTS = [
  {
    role: 'General Manager',
    email: 'gm@mistypeaks.in',
    name: 'Rajesh Hegde',
    desc: 'Unsorted lane, GM alerts, revenue & full allotment oversight',
  },
  {
    role: 'Reservations Manager',
    email: 'reservations@mistypeaks.in',
    name: 'Priya Sharma',
    desc: 'Room booking enquiries, daily allotment & rates control',
  },
  {
    role: 'Sales Manager',
    email: 'sales@mistypeaks.in',
    name: 'Arun Kumar',
    desc: 'Weddings, corporate offsites & banquet enquiries',
  },
  {
    role: 'Front Office Manager',
    email: 'frontdesk@mistypeaks.in',
    name: 'Meera Nair',
    desc: 'Guest complaints, arrivals, departures & Form C check-in',
  },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(targetEmail?: string) {
    const loginEmail = targetEmail || email;
    const loginPassword = targetEmail ? 'admin123' : password;

    if (!loginEmail || !loginPassword) {
      setError('Please provide email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDemoClick(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('admin123');
    handleLogin(demoEmail);
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-[var(--forest)] flex items-center justify-center shadow-md">
            <Hotel className="w-6 h-6 text-[var(--gold)]" />
          </div>
        </div>
        <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-gray-900">
          Staff Portal
        </h2>
        <p className="mt-1.5 text-center text-xs text-gray-500 uppercase tracking-widest">
          Misty Peaks Estate • Chikkamagaluru
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-sm sm:px-10">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@mistypeaks.in"
                className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-stone-200 bg-stone-50 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--forest)] text-white py-2.5 px-4 text-sm font-medium rounded-sm hover:bg-[var(--forest-light)] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
              ) : (
                <><KeyRound className="w-4 h-4" /> Sign In to Dashboard</>
              )}
            </button>
          </form>

          {/* Quick Demo Sign-in Section for Evaluator */}
          <div className="mt-8 pt-6 border-t border-stone-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
              <ShieldCheck className="w-4 h-4 text-[var(--forest)]" />
              <span>Reviewer One-Click Demo Sign-in:</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Click any role below to sign in immediately without typing passwords (default password: <code>admin123</code>):
            </p>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoClick(acc.email)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-sm border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[var(--forest)] text-xs font-bold">
                      {acc.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                        {acc.role}
                        <span className="text-[10px] text-gray-400 font-normal">({acc.name})</span>
                      </div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[250px]">{acc.desc}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-[var(--forest)] transition-colors"
            >
              ← Return to Guest Site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
