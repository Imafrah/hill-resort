'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import { 
  Loader2, Save, ChevronLeft, ChevronRight, 
  AlertTriangle, Check 
} from 'lucide-react';

interface RoomType {
  id: string;
  name: string;
  slug: string;
  baseRate: number;
  weekendRate: number;
  totalInventory: number;
  category: string;
}

interface InventoryDay {
  id: string;
  roomTypeId: string;
  date: string;
  rate: number;
  webAllotment: number;
  booked: number;
  isBlackout: boolean;
}

export default function RatesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editedCells, setEditedCells] = useState<Record<string, Partial<InventoryDay>>>({});

  // Fetch room types
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRoomTypes(data.rooms || []);
      if (data.rooms?.length > 0) setSelectedRoom(data.rooms[0].id);
      setLoading(false);
    }
    load();
  }, []);

  // Fetch inventory when room or week changes
  const fetchInventory = useCallback(async () => {
    if (!selectedRoom) return;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + weekOffset * 7);
    const start = startDate.toISOString().split('T')[0];
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // Show 14 days
    const end = endDate.toISOString().split('T')[0];

    const res = await fetch(
      `/api/admin/inventory?roomTypeId=${selectedRoom}&startDate=${start}&endDate=${end}`
    );
    const data = await res.json();
    setInventory(data.inventory || []);
    setEditedCells({});
  }, [selectedRoom, weekOffset]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  function handleCellChange(dayId: string, field: string, value: string | boolean) {
    setEditedCells((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: field === 'rate' || field === 'webAllotment' ? Number(value) : value,
      },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = Object.entries(editedCells).map(([id, changes]) => ({
        id,
        ...changes,
      }));

      await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      setSaved(true);
      await fetchInventory();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const hasEdits = Object.keys(editedCells).length > 0;

  function getDayLabel(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      isWeekend: d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6,
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-gray-900">Rates & Allotment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set daily rates, website allotment, and blackout dates
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasEdits || saving}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-sm transition-colors disabled:opacity-50 ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-[var(--forest)] text-white hover:bg-[var(--forest-light)]'
          }`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Room Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {roomTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelectedRoom(rt.id)}
            className={`px-4 py-2 text-sm border rounded transition-colors ${
              selectedRoom === rt.id
                ? 'bg-[var(--forest)] text-white border-[var(--forest)]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--forest)]'
            }`}
          >
            {rt.name}
            <span className="text-xs ml-1.5 opacity-70">
              ({rt.totalInventory})
            </span>
          </button>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
          disabled={weekOffset === 0}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--forest)] disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-sm text-gray-500">
          {weekOffset === 0 ? 'Current 2 weeks' : `+${weekOffset * 7} days`}
        </span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--forest)]"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase tracking-wider sticky left-0 bg-gray-50 w-24">
                Field
              </th>
              {inventory.map((day) => {
                const label = getDayLabel(day.date);
                return (
                  <th
                    key={day.date}
                    className={`text-center px-2 py-2 font-medium text-xs min-w-[80px] ${
                      label.isWeekend ? 'bg-amber-50/50 text-amber-700' : 'text-gray-500'
                    }`}
                  >
                    <div>{label.day}</div>
                    <div className="font-normal">{label.date}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Rate Row */}
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700 text-xs sticky left-0 bg-white">
                Rate (₹)
              </td>
              {inventory.map((day) => {
                const edited = editedCells[day.id];
                const currentRate = edited?.rate ?? day.rate;
                const label = getDayLabel(day.date);
                return (
                  <td
                    key={day.id}
                    className={`px-1 py-1.5 text-center ${
                      label.isWeekend ? 'bg-amber-50/30' : ''
                    } ${day.isBlackout ? 'opacity-40' : ''}`}
                  >
                    <input
                      type="number"
                      value={currentRate}
                      onChange={(e) => handleCellChange(day.id, 'rate', e.target.value)}
                      disabled={day.isBlackout}
                      className="w-full text-center py-1 px-1 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-[var(--forest)] disabled:bg-gray-100"
                    />
                  </td>
                );
              })}
            </tr>

            {/* Web Allotment Row */}
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700 text-xs sticky left-0 bg-white">
                Web Allot.
              </td>
              {inventory.map((day) => {
                const edited = editedCells[day.id];
                const currentAllotment = edited?.webAllotment ?? day.webAllotment;
                const label = getDayLabel(day.date);
                return (
                  <td
                    key={day.id}
                    className={`px-1 py-1.5 text-center ${
                      label.isWeekend ? 'bg-amber-50/30' : ''
                    } ${day.isBlackout ? 'opacity-40' : ''}`}
                  >
                    <input
                      type="number"
                      value={currentAllotment}
                      onChange={(e) => handleCellChange(day.id, 'webAllotment', e.target.value)}
                      disabled={day.isBlackout}
                      min={day.booked}
                      className="w-full text-center py-1 px-1 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:border-[var(--forest)] disabled:bg-gray-100"
                    />
                  </td>
                );
              })}
            </tr>

            {/* Booked Row (read-only) */}
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700 text-xs sticky left-0 bg-white">
                Booked
              </td>
              {inventory.map((day) => {
                const label = getDayLabel(day.date);
                const available = day.webAllotment - day.booked;
                return (
                  <td
                    key={day.id}
                    className={`px-1 py-1.5 text-center text-xs ${
                      label.isWeekend ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        available <= 0
                          ? 'text-red-600'
                          : available <= 2
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {day.booked}
                    </span>
                    <span className="text-gray-400">/{day.webAllotment}</span>
                  </td>
                );
              })}
            </tr>

            {/* Available Row (read-only) */}
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700 text-xs sticky left-0 bg-white">
                Available
              </td>
              {inventory.map((day) => {
                const label = getDayLabel(day.date);
                const available = day.webAllotment - day.booked;
                return (
                  <td
                    key={day.id}
                    className={`px-1 py-1.5 text-center text-xs font-medium ${
                      label.isWeekend ? 'bg-amber-50/30' : ''
                    } ${
                      day.isBlackout
                        ? 'text-gray-400'
                        : available <= 0
                        ? 'text-red-600'
                        : available <= 2
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {day.isBlackout ? '—' : available}
                  </td>
                );
              })}
            </tr>

            {/* Blackout Row */}
            <tr>
              <td className="px-3 py-2 font-medium text-gray-700 text-xs sticky left-0 bg-white">
                Blackout
              </td>
              {inventory.map((day) => {
                const edited = editedCells[day.id];
                const isBlackout = edited?.isBlackout ?? day.isBlackout;
                const label = getDayLabel(day.date);
                return (
                  <td
                    key={day.id}
                    className={`px-1 py-1.5 text-center ${
                      label.isWeekend ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isBlackout as boolean}
                      onChange={(e) =>
                        handleCellChange(day.id, 'isBlackout', e.target.checked)
                      }
                      className="accent-red-600"
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-amber-50 border border-amber-200 rounded" /> Weekend
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-100 rounded" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-100 rounded" /> Low stock (≤2)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-100 rounded" /> Sold out
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-yellow-600" /> Allotment cannot go below booked count
        </span>
      </div>
    </div>
  );
}
