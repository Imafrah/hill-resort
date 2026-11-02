'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Plus, Tag, X, Check } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  validFrom: string;
  validTo: string;
  roomTypeId: string | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    validFrom: '',
    validTo: '',
    maxUses: '100',
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    try {
      const res = await fetch('/api/admin/promos');
      const data = await res.json();
      setPromos(data.promos || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase(),
          discountValue: Number(form.discountValue),
          maxUses: Number(form.maxUses),
        }),
      });
      setShowForm(false);
      setForm({
        code: '', description: '', discountType: 'percentage',
        discountValue: '', validFrom: '', validTo: '', maxUses: '100',
      });
      await fetchPromos();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(promo: PromoCode) {
    await fetch('/api/admin/promos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo.id, isActive: !promo.isActive }),
    });
    await fetchPromos();
  }

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const inputCls = "w-full px-3 py-2 border border-gray-200 bg-gray-50 text-sm rounded focus:outline-none focus:border-[var(--forest)]";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-gray-900">Promo Codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage discount codes for direct bookings
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[var(--forest)] text-white px-4 py-2.5 text-sm rounded-sm hover:bg-[var(--forest-light)] transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Code'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Code *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SUMMER20"
                className={inputCls + " uppercase"}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Discount Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                className={inputCls}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Discount Value *
              </label>
              <input
                type="number"
                required
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 3000'}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Valid From *
              </label>
              <input
                type="date"
                required
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Valid To *
              </label>
              <input
                type="date"
                required
                value={form.validTo}
                onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Max Uses
              </label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Internal description of this promo"
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[var(--forest)] text-white px-5 py-2.5 text-sm rounded-sm hover:bg-[var(--forest-light)] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Code
            </button>
          </div>
        </form>
      )}

      {/* Promo List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No promo codes yet. Create one to offer direct booking discounts.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className={`bg-white border rounded p-5 ${
                promo.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--gold)]" />
                  <span className="font-mono font-bold text-[var(--forest)] text-sm">
                    {promo.code}
                  </span>
                </div>
                <button
                  onClick={() => toggleActive(promo)}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    promo.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {promo.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3">{promo.description || '—'}</p>

              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-medium text-gray-700">
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}%`
                      : formatCurrency(promo.discountValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valid</span>
                  <span>{formatDate(promo.validFrom)} — {formatDate(promo.validTo)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage</span>
                  <span>
                    {promo.usedCount} / {promo.maxUses}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
