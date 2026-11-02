'use client';

import { useState, useEffect } from 'react';
import { CATEGORY_LABELS, CATEGORY_COLORS, SOURCE_LABELS, STATUS_COLORS } from '@/lib/utils';
import { 
  Loader2, MessageSquare, AlertTriangle, Plus,
  Mail, Phone, User, Calendar, Users, 
  Banknote, X, Send, RotateCcw, Sparkles
} from 'lucide-react';

interface Enquiry {
  id: string;
  enquiryId: string;
  source: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  message: string;
  category: string;
  confidence: number;
  isLowConfidence: boolean;
  extractedDates: string;
  extractedGuests: number | null;
  extractedBudget: string | null;
  assignedTo: string;
  alertGM: boolean;
  aiDraft: string;
  status: string;
  staffNotes: string;
  createdAt: string;
}

const CATEGORIES = ['all', 'room_booking', 'wedding', 'corporate_offsite', 'complaint', 'general'];
const STAFF = ['General Manager', 'Reservations Manager', 'Sales Manager', 'Front Office Manager'];

const PRESETS = [
  {
    label: "Sister's Wedding (250 pax)",
    source: "whatsapp",
    guestName: "Pooja Hegde",
    guestPhone: "+91 98888 12345",
    message: "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights",
  },
  {
    label: "Family Villa Request",
    source: "web_form",
    guestName: "Rohan Deshmukh",
    guestEmail: "rohan@example.com",
    message: "Is a villa free 14-16 Nov for 2 adults and a child?",
  },
  {
    label: "Corporate Offsite (45 pax)",
    source: "email",
    guestName: "Meenakshi Sundaram",
    guestEmail: "hr@techcorp.in",
    message: "Team of 45 wants a January offsite with a conference hall",
  },
  {
    label: "Guest Complaint (AC Broken)",
    source: "whatsapp",
    guestName: "Vikram Malhotra",
    guestPhone: "+91 91234 56789",
    message: "The AC in villa 3 stopped working at midnight and water leaked on the bed. Very disappointed with the service.",
  },
  {
    label: "Ambiguous Enquiry (Low Confidence)",
    source: "email",
    guestName: "Sunil Shenoy",
    guestEmail: "sunil@example.com",
    message: "Hi, please send pictures and brochure.",
  },
];

export default function InboxPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [saving, setSaving] = useState(false);

  // Simulation modal state
  const [showSimModal, setShowSimModal] = useState(false);
  const [simSource, setSimSource] = useState('whatsapp');
  const [simName, setSimName] = useState('');
  const [simContact, setSimContact] = useState('');
  const [simMessage, setSimMessage] = useState('');
  const [simSubmitting, setSimSubmitting] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  async function fetchEnquiries() {
    try {
      const res = await fetch('/api/enquiry');
      const data = await res.json();
      setEnquiries(data.enquiries || []);
    } finally {
      setLoading(false);
    }
  }

  async function updateEnquiry(id: string, updates: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch('/api/enquiry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      await fetchEnquiries();
      if (selected?.id === id) {
        setSelected((prev) => prev ? { ...prev, ...updates } as Enquiry : null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSimulateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!simMessage.trim()) return;

    setSimSubmitting(true);
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: simSource,
          guestName: simName || 'Test Guest',
          guestEmail: simSource === 'email' ? (simContact || 'guest@example.com') : '',
          guestPhone: simSource === 'whatsapp' ? (simContact || '+91 98765 00000') : '',
          message: simMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSimModal(false);
        setSimMessage('');
        setSimName('');
        setSimContact('');
        await fetchEnquiries();
        // Automatically select the freshly created enquiry
        const updatedRes = await fetch('/api/enquiry');
        const updatedData = await updatedRes.json();
        if (updatedData.enquiries?.length > 0) {
          const newest = updatedData.enquiries[0];
          setSelected(newest);
          setActiveCategory('all');
        }
      }
    } finally {
      setSimSubmitting(false);
    }
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setSimSource(p.source);
    setSimName(p.guestName);
    setSimContact(p.guestPhone || p.guestEmail || '');
    setSimMessage(p.message);
  }

  const filtered = activeCategory === 'all'
    ? enquiries
    : enquiries.filter((e) => e.category === activeCategory);

  // Count by category
  const counts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = cat === 'all'
      ? enquiries.length
      : enquiries.filter((e) => e.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header with Title and Simulate button */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-serif text-gray-900">Enquiry Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-classified enquiries with draft replies • {enquiries.filter((e) => e.status === 'new').length} new
          </p>
        </div>
        <button
          onClick={() => setShowSimModal(true)}
          className="flex items-center gap-2 bg-[var(--forest)] text-white px-4 py-2.5 text-xs sm:text-sm font-medium rounded-sm hover:bg-[var(--forest-light)] transition-colors shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[var(--gold)]" />
          Simulate Incoming Enquiry
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSelected(null); }}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? cat === 'all'
                  ? 'bg-gray-800 text-white'
                  : (CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-800')
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            <span className="ml-1.5 opacity-70">{counts[cat]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Enquiry List */}
          <div className="w-96 shrink-0 bg-white border border-gray-200 rounded overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No enquiries in this category.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((enq) => (
                  <button
                    key={enq.id}
                    onClick={() => setSelected(enq)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                      selected?.id === enq.id ? 'bg-blue-50 border-l-2 border-l-[var(--forest)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-mono text-xs text-gray-400">{enq.enquiryId}</span>
                      <div className="flex items-center gap-1.5">
                        {enq.alertGM && (
                          <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                            <AlertTriangle className="w-3 h-3 text-red-600" /> GM
                          </span>
                        )}
                        {enq.isLowConfidence && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                            Low Conf
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_COLORS[enq.category] || 'bg-gray-100 text-gray-600'}`}>
                          {CATEGORY_LABELS[enq.category] || enq.category}
                        </span>
                      </div>
                    </div>
                    <p className="font-medium text-sm text-gray-900 mb-1 truncate">
                      {enq.guestName || 'Unknown guest'}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">{enq.message}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{SOURCE_LABELS[enq.source] || enq.source}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[enq.status] || 'bg-gray-100'}`}
                      >
                        {enq.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="flex-1 bg-white border border-gray-200 rounded overflow-y-auto">
            {!selected ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <MessageSquare className="w-5 h-5 mr-2" />
                Select an enquiry to view details
              </div>
            ) : (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-500">{selected.enquiryId}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_COLORS[selected.category]}`}>
                        {CATEGORY_LABELS[selected.category]}
                      </span>
                      {selected.isLowConfidence && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          Low Confidence ({Math.round(selected.confidence * 100)}%) — GM Unsorted Lane
                        </span>
                      )}
                      {selected.alertGM && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> GM Alert Triggered
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {selected.guestName || 'Unknown guest'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Guest Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                  {selected.guestEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {selected.guestEmail}
                    </span>
                  )}
                  {selected.guestPhone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {selected.guestPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    via {SOURCE_LABELS[selected.source] || selected.source}
                  </span>
                </div>

                {/* Original Message */}
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                    Original Message
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                {/* AI Extracted Entities */}
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                    AI-Extracted Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(() => {
                      const dates = JSON.parse(selected.extractedDates || '[]') as string[];
                      return dates.length > 0 ? (
                        <div className="bg-blue-50 rounded p-3">
                          <Calendar className="w-4 h-4 text-blue-500 mb-1" />
                          <p className="text-xs text-blue-600 font-medium">Dates</p>
                          <p className="text-xs text-blue-800">{dates.join(', ')}</p>
                        </div>
                      ) : null;
                    })()}
                    {selected.extractedGuests && (
                      <div className="bg-purple-50 rounded p-3">
                        <Users className="w-4 h-4 text-purple-500 mb-1" />
                        <p className="text-xs text-purple-600 font-medium">Guests</p>
                        <p className="text-xs text-purple-800">{selected.extractedGuests}</p>
                      </div>
                    )}
                    {selected.extractedBudget && (
                      <div className="bg-green-50 rounded p-3">
                        <Banknote className="w-4 h-4 text-green-500 mb-1" />
                        <p className="text-xs text-green-600 font-medium">Budget</p>
                        <p className="text-xs text-green-800">{selected.extractedBudget}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded p-3">
                      <User className="w-4 h-4 text-gray-500 mb-1" />
                      <p className="text-xs text-gray-600 font-medium">Assigned Owner</p>
                      <p className="text-xs text-gray-800 font-semibold">{selected.assignedTo}</p>
                    </div>
                  </div>
                </div>

                {/* 1-Click Re-route */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-gray-500">1-Click Re-route to:</span>
                  {STAFF.map((staff) => (
                    <button
                      key={staff}
                      onClick={() => updateEnquiry(selected.id, { assignedTo: staff, category: staff === 'Sales Manager' ? 'wedding' : selected.category })}
                      disabled={saving || selected.assignedTo === staff}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                        selected.assignedTo === staff
                          ? 'bg-[var(--forest)] text-white border-[var(--forest)]'
                          : 'border-gray-200 text-gray-600 hover:border-[var(--forest)]'
                      } disabled:opacity-50`}
                    >
                      {staff}
                    </button>
                  ))}
                </div>

                {/* Status */}
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-xs text-gray-500">Status:</span>
                  {['new', 'in_progress', 'replied', 'closed'].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateEnquiry(selected.id, { status: st })}
                      disabled={saving}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                        selected.status === st
                          ? 'bg-[var(--forest)] text-white border-[var(--forest)]'
                          : 'border-gray-200 text-gray-600 hover:border-[var(--forest)]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* AI Draft Reply */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                    AI Draft Reply
                    <span className="text-amber-600 font-normal normal-case">
                      — Review before sending (never auto-sent)
                    </span>
                  </h3>
                  <div className="bg-amber-50/50 border border-amber-200 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {selected.aiDraft}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[var(--forest)] text-white text-xs rounded-sm hover:bg-[var(--forest-light)] transition-colors disabled:opacity-50"
                      onClick={() => updateEnquiry(selected.id, { status: 'replied' })}
                    >
                      <Send className="w-3.5 h-3.5" /> Mark as Replied
                    </button>
                    <button
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs rounded-sm hover:border-[var(--forest)] transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Regenerate Draft
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--gold)]" />
                <h3 className="font-serif text-lg font-semibold text-gray-900">
                  Simulate Incoming Channel Enquiry
                </h3>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Test how the AI router automatically classifies incoming messages from WhatsApp, email, or web forms, extracts key details, and generates draft replies.
            </p>

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Quick Sample Scenarios (click to fill):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-xs bg-stone-100 hover:bg-stone-200 text-gray-700 px-2.5 py-1.5 rounded transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                    Channel / Source
                  </label>
                  <select
                    value={simSource}
                    onChange={(e) => setSimSource(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-[var(--forest)]"
                  >
                    <option value="whatsapp">WhatsApp (GM / Desk)</option>
                    <option value="email">Forwarded Email</option>
                    <option value="web_form">Direct Web Form</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="e.g. Ramesh Hegde"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-[var(--forest)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                  Contact ({simSource === 'whatsapp' ? 'Phone' : 'Email'})
                </label>
                <input
                  type="text"
                  value={simContact}
                  onChange={(e) => setSimContact(e.target.value)}
                  placeholder={simSource === 'whatsapp' ? '+91 98765 43210' : 'guest@example.com'}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded bg-gray-50 focus:outline-none focus:border-[var(--forest)]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                  Raw Message Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="Type any enquiry (e.g. 'Looking for 2 villas for a wedding on March 15 with 100 people')..."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded bg-gray-50 resize-none focus:outline-none focus:border-[var(--forest)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simSubmitting || !simMessage.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--forest)] text-white text-xs font-medium rounded-sm hover:bg-[var(--forest-light)] transition-colors disabled:opacity-50"
                >
                  {simSubmitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing with AI...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Submit to AI Router</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
