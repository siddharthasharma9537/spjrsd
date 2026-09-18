import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import DateInput from '@/components/ui/date-input';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { Flame, Printer, Plus, IndianRupee, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E] w-full";
const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  seva_id: '', for_date: today, slot_id: '', number_of_persons: 1,
  devotee_name: '', devotee_mobile: '', gotram: '', nakshatra: '', rashi: '',
  payment_method: 'cash',
};

// ---- Offline sale queue -------------------------------------------------
// Counter Sale can't stop selling tickets just because the internet drops.
// A sale made while offline is recorded here (localStorage, not IndexedDB -
// a temple counter sees a handful of sales during any one outage, never
// thousands) and printed immediately as a PROVISIONAL ticket. Once
// connectivity returns, each queued sale is POSTed to the real
// /admin/bookings/counter endpoint one at a time - that endpoint's own
// capacity check is what catches a slot that filled up during the outage,
// surfaced here as a "conflict" for a human to resolve, never silently
// dropped or silently overbooked.
const QUEUE_KEY = 'counterSaleOfflineQueue';
const SEVAS_CACHE_KEY = 'counterSaleSevasCache';
const slotsCacheKey = (sevaId, date) => `counterSaleSlotsCache:${sevaId}:${date}`;

const pruneQueue = (q) => q.filter(item =>
  item.status !== 'synced' || (Date.now() - new Date(item.created_at).getTime()) < 24 * 3600 * 1000
);
const loadQueue = () => {
  let q = [];
  try { q = JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { q = []; }
  return pruneQueue(q);
};
const saveQueue = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));

const makeProvisionalId = () =>
  `PROV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export default function AdminCounterSale() {
  const { user } = useAuth();
  // Reconciling the day's cash total is Cashier's job, not Clerk's - see
  // docs/ROLES_AND_PERMISSIONS.md. Clerk still holds bookings:view (to look
  // up an existing booking), so this is a UI-level distinction: the
  // underlying booking data isn't more sensitive, the consolidated
  // end-of-day totals view is the thing being restricted.
  const canReconcile = hasPermission(user, 'bookings:reconcile');

  const [sevas, setSevas] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsStale, setSlotsStale] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  // { scope: 'single', counter, bookings, total_amount, ticket_count } for a
  // login tied to one counter, or { scope: 'all', counters: [...], ... } for
  // an office login (EO/SysAdmin/Accountant) - see
  // GET /admin/counters/today-summary, scoped server-side by the caller's
  // own account, not anything picked here.
  const [summary, setSummary] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queue, setQueue] = useState(loadQueue);
  const syncingRef = useRef(false);

  const persistQueue = (next) => { setQueue(next); saveQueue(next); };

  const loadTodaySales = () => {
    if (!canReconcile) return;
    api.get('/admin/counters/today-summary').then(r => setSummary(r.data))
      .catch(() => {}); // offline - the queued items below still cover today's cash total
  };

  // Syncs queued sales one at a time (not Promise.all) so a still-offline
  // failure partway through stops the pass cleanly instead of firing every
  // remaining item at a dead connection.
  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    let current = loadQueue();
    persistQueue(current);
    for (const item of current) {
      if (item.status !== 'pending') continue;
      current = current.map(q => q.local_id === item.local_id ? { ...q, status: 'syncing' } : q);
      persistQueue(current);
      try {
        const res = await api.post('/admin/bookings/counter', item.payload);
        current = current.map(q => q.local_id === item.local_id ? { ...q, status: 'synced', synced_booking: res.data } : q);
        persistQueue(current);
      } catch (err) {
        if (err.response) {
          // Backend was reached and rejected it (e.g. the slot filled up
          // during the outage) - a real conflict a human resolves, not
          // something to keep retrying automatically.
          current = current.map(q => q.local_id === item.local_id
            ? { ...q, status: 'conflict', error: err.response?.data?.detail || 'Could not sync this sale.' } : q);
          persistQueue(current);
        } else {
          current = current.map(q => q.local_id === item.local_id ? { ...q, status: 'pending' } : q);
          persistQueue(current);
          setIsOffline(true);
          break; // still offline - stop rather than fail through the rest
        }
      }
    }
    syncingRef.current = false;
    loadTodaySales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // navigator.onLine only reflects the network interface, not whether the
  // backend is actually reachable (captive portal, backend down, DNS
  // hiccup) - a real request confirms it before trusting "online" enough
  // to fire the sync.
  const confirmOnline = useCallback(async () => {
    try {
      await api.get('/sevas?active_only=true');
      setIsOffline(false);
      syncQueue();
      return true;
    } catch {
      setIsOffline(true);
      return false;
    }
  }, [syncQueue]);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', confirmOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', confirmOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [confirmOnline]);

  // Covers connectivity returning without a clean 'online' event (e.g. this
  // tab was asleep) - only polls while there's actually unsynced work.
  useEffect(() => {
    const id = setInterval(() => {
      if (navigator.onLine && loadQueue().some(q => q.status === 'pending')) syncQueue();
    }, 20000);
    return () => clearInterval(id);
  }, [syncQueue]);

  useEffect(() => {
    api.get('/sevas?active_only=true').then(r => {
      setSevas(r.data);
      localStorage.setItem(SEVAS_CACHE_KEY, JSON.stringify(r.data));
    }).catch(() => {
      setIsOffline(true);
      try { setSevas(JSON.parse(localStorage.getItem(SEVAS_CACHE_KEY)) || []); } catch { /* nothing cached yet */ }
    });
    loadTodaySales();
    syncQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!(form.seva_id && form.for_date)) { setSlots([]); return; }
    const cacheKey = slotsCacheKey(form.seva_id, form.for_date);
    api.get(`/admin/slots/available-counter?seva_id=${form.seva_id}&date=${form.for_date}`).then(r => {
      setSlots(r.data);
      setSlotsStale(false);
      localStorage.setItem(cacheKey, JSON.stringify(r.data));
    }).catch(() => {
      setIsOffline(true);
      let cached = [];
      try { cached = JSON.parse(localStorage.getItem(cacheKey)) || []; } catch { /* nothing cached yet */ }
      setSlots(cached);
      setSlotsStale(true);
    });
  }, [form.seva_id, form.for_date]);

  const queueProvisionalSale = (payload) => {
    const seva = sevas.find(s => s.id === form.seva_id);
    const slot = slots.find(s => s.id === form.slot_id);
    const localId = makeProvisionalId();
    const preview = {
      seva_name_english: seva?.name_english, seva_name_telugu: seva?.name_telugu,
      slot_start_time: slot?.start_time, slot_end_time: slot?.end_time,
      amount: seva?.base_price, devotee_name: form.devotee_name, devotee_mobile: form.devotee_mobile,
      gotram: form.gotram, number_of_persons: payload.number_of_persons, for_date: form.for_date,
      payment_method: form.payment_method, booking_date_time: new Date().toISOString(),
    };
    persistQueue([...loadQueue(), { local_id: localId, status: 'pending', created_at: preview.booking_date_time, payload, preview }]);
    setTicket({ ...preview, provisional: true, local_id: localId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = { ...form, number_of_persons: parseInt(form.number_of_persons, 10) };

    if (isOffline) {
      queueProvisionalSale(payload);
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/admin/bookings/counter', payload);
      setTicket(res.data);
      loadTodaySales();
    } catch (err) {
      if (!err.response) {
        // The request never reached the backend - the connection dropped
        // between page-load and this submit. Fall back to the same
        // provisional path rather than surfacing a raw network error.
        setIsOffline(true);
        queueProvisionalSale(payload);
      } else {
        setError(err.response?.data?.detail || 'Could not create the booking.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startNewSale = () => {
    setTicket(null);
    setForm(emptyForm);
    setError('');
  };

  const pendingCount = queue.filter(q => q.status === 'pending' || q.status === 'syncing').length;
  const conflictItems = queue.filter(q => q.status === 'conflict');
  // Only pending/syncing/conflict queue items are merged into "today's
  // sales" below - a synced item is already a real booking that
  // loadTodaySales() picked up from the backend, so counting it here too
  // would double it.
  const unsyncedToday = queue.filter(q => q.status !== 'synced' && q.created_at?.startsWith(today));

  const retryOne = async (localId) => {
    const item = loadQueue().find(q => q.local_id === localId);
    if (!item) return;
    persistQueue(loadQueue().map(q => q.local_id === localId ? { ...q, status: 'pending' } : q));
    syncQueue();
  };

  if (ticket) {
    return (
      <AdminLayout title="Counter Sale">
        <div className="max-w-xl mx-auto">
          <div className="print:hidden mb-6 flex items-center justify-between">
            <button onClick={startNewSale} className="inline-flex items-center gap-2 px-4 py-2 border border-[#E6DCCA] text-[#621B00] text-sm rounded-full hover:bg-[#FDFBF7]" data-testid="counter-new-sale-btn">
              <Plus className="h-4 w-4" /> New Sale
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90" data-testid="counter-print-btn">
              <Printer className="h-4 w-4" /> Print Ticket
            </button>
          </div>

          <div className="ticket-border bg-white rounded-xl overflow-hidden shadow-md" data-testid="counter-ticket">
            {ticket.provisional && (
              <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs font-medium px-6 py-2 flex items-center gap-2" data-testid="counter-ticket-provisional-banner">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                PROVISIONAL — recorded offline, not yet confirmed. Will sync automatically once back online.
              </div>
            )}
            <div className="bg-[#621B00] text-white p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <h1 className="font-english-heading text-sm tracking-widest uppercase mb-1">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams</h1>
              <p className="font-telugu-heading text-base text-[#D4AF37]">శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం</p>
              <p className="text-xs text-[#FFE0B2]/70 mt-1">Cheruvugattu, Nalgonda, Telangana</p>
            </div>

            <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-[#8D6E63] uppercase tracking-wide">{ticket.provisional ? 'Provisional #' : 'Booking ID'}</span>
              <span className="font-mono text-sm font-bold text-[#621B00]" data-testid="counter-ticket-booking-number">{ticket.provisional ? ticket.local_id : ticket.booking_number}</span>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#FDFBF7] rounded-lg p-4 border border-[#E6DCCA]">
                <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Seva / సేవ</p>
                <p className="font-english-heading text-base text-[#2D1B0E]">{ticket.seva_name_english}</p>
                <p className="font-telugu-heading text-lg text-[#621B00]">{ticket.seva_name_telugu}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Devotee / భక్తుడు</p>
                  <p className="text-sm font-medium text-[#2D1B0E]">{ticket.devotee_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Mobile / మొబైల్</p>
                  <p className="text-sm font-medium text-[#2D1B0E]">{ticket.devotee_mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">గోత్రం / Gotram</p>
                  <p className="text-sm font-medium text-[#2D1B0E]">{ticket.gotram || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Persons / వ్యక్తులు</p>
                  <p className="text-sm font-medium text-[#2D1B0E]">{ticket.number_of_persons}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Seva Date / సేవ తేదీ</p>
                  <p className="text-sm font-medium text-[#2D1B0E]">{ticket.for_date}</p>
                </div>
                <div>
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide mb-1">Seva Time / సమయం</p>
                  <p className="text-sm font-medium text-[#2D1B0E]">{ticket.slot_start_time} - {ticket.slot_end_time}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#D4AF37]/10 rounded-lg p-4 border border-[#D4AF37]/20">
                <div>
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide">Amount / మొత్తం</p>
                  <p className="text-xl font-bold text-[#621B00]">Rs. {ticket.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8D6E63] uppercase tracking-wide">Paid via</p>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{ticket.payment_method}</span>
                </div>
              </div>

              <p className="text-center text-xs text-[#8D6E63]">Sold at temple counter — {new Date(ticket.booking_date_time).toLocaleString('en-IN')}</p>
            </div>

            <div className="h-4 bg-white torn-paper" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Counter Sale">
      {isOffline && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-4 py-3 text-sm" data-testid="counter-offline-banner">
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            You're offline — sales are being recorded as provisional and will sync automatically once connection returns
            {pendingCount > 0 && ` (${pendingCount} waiting)`}.
          </span>
          <button type="button" onClick={confirmOnline} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 rounded-full hover:bg-amber-100 shrink-0" data-testid="counter-check-connection-btn">
            <RefreshCw className="h-3.5 w-3.5" /> Check connection
          </button>
        </div>
      )}
      {!isOffline && pendingCount > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-4 py-3 text-sm" data-testid="counter-syncing-banner">
          <span>Syncing {pendingCount} provisional sale(s)...</span>
          <button type="button" onClick={syncQueue} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 rounded-full hover:bg-blue-100 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Sync now
          </button>
        </div>
      )}
      {conflictItems.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-900 rounded-xl px-4 py-3 text-sm" data-testid="counter-conflict-banner">
          <p className="font-medium mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {conflictItems.length} sale(s) couldn't be confirmed — the slot may have filled during the outage. Review and contact the devotee if needed.</p>
          <div className="space-y-2">
            {conflictItems.map(item => (
              <div key={item.local_id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                <span>
                  <span className="font-mono text-xs">{item.local_id}</span> — {item.preview?.devotee_name} · {item.preview?.seva_name_english} · Rs.{item.preview?.amount}
                  <span className="block text-xs text-red-700">{item.error}</span>
                </span>
                <button type="button" onClick={() => retryOne(item.local_id)} className="px-3 py-1 border border-red-300 rounded-full text-xs hover:bg-red-100 shrink-0">Retry</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-6 ${canReconcile ? 'lg:grid-cols-3' : ''}`}>
        <div className={`bg-white border border-[#E6DCCA] rounded-xl p-6 ${canReconcile ? 'lg:col-span-2' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="counter-sale-error">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Seva</label>
                <select className={inputCls} value={form.seva_id} onChange={e => setForm({ ...form, seva_id: e.target.value, slot_id: '' })} required data-testid="counter-seva">
                  <option value="">Select seva</option>
                  {sevas.map(s => <option key={s.id} value={s.id}>{s.name_english}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Date</label>
                <DateInput className={inputCls} min={today} value={form.for_date} onChange={v => setForm({ ...form, for_date: v, slot_id: '' })} required data-testid="counter-date" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5D4037] mb-1">Slot</label>
              {!form.seva_id ? (
                <p className="text-sm text-[#8D6E63]">Pick a seva first.</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-[#8D6E63]">No counter slots available for this date{slotsStale ? ' (offline - nothing cached for this seva/date yet)' : ''}.</p>
              ) : (
                <>
                  {slotsStale && (
                    <p className="text-xs text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Offline — showing last known availability, not live.</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map(slot => (
                      <button key={slot.id} type="button" onClick={() => setForm({ ...form, slot_id: slot.id })}
                        className={`p-3 rounded-lg border text-sm text-left transition-all ${form.slot_id === slot.id ? 'border-[#C43E00] bg-[#C43E00]/5 text-[#C43E00]' : 'border-[#E6DCCA] hover:border-[#D4AF37] text-[#5D4037]'}`}
                        data-testid={`counter-slot-btn-${slot.id}`}>
                        <div className="font-medium">{slot.start_time} - {slot.end_time}</div>
                        <div className="text-xs mt-1 text-[#8D6E63]">{slotsStale ? 'availability unconfirmed' : `${slot.remaining_slots} counter slots left`}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Devotee Name</label>
                <input className={inputCls} value={form.devotee_name} onChange={e => setForm({ ...form, devotee_name: e.target.value })} required data-testid="counter-devotee-name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Mobile Number</label>
                <input className={inputCls} value={form.devotee_mobile} onChange={e => setForm({ ...form, devotee_mobile: e.target.value })} required data-testid="counter-devotee-mobile" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Gotram</label>
                <input className={inputCls} value={form.gotram} onChange={e => setForm({ ...form, gotram: e.target.value })} data-testid="counter-gotram" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1">Persons</label>
                <input type="number" min="1" className={inputCls} value={form.number_of_persons} onChange={e => setForm({ ...form, number_of_persons: e.target.value })} required data-testid="counter-persons" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5D4037] mb-1">Payment Method</label>
              <div className="flex gap-3">
                {['cash', 'card', 'upi_counter'].map(m => (
                  <button key={m} type="button" onClick={() => setForm({ ...form, payment_method: m })}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${form.payment_method === m ? 'border-[#C43E00] bg-[#C43E00]/5 text-[#C43E00]' : 'border-[#E6DCCA] text-[#5D4037]'}`}
                    data-testid={`counter-payment-${m}`}>
                    {m === 'upi_counter' ? 'UPI' : m[0].toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting || !form.slot_id} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2" data-testid="counter-confirm-btn">
              <IndianRupee className="h-4 w-4" /> {submitting ? 'Recording sale...' : isOffline ? 'Record Provisional Sale' : 'Confirm & Print Ticket'}
            </button>
          </form>
        </div>

        {canReconcile && summary && (
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-6">
            <h2 className="font-english-heading text-sm text-[#621B00] uppercase tracking-wide mb-4">
              {summary.scope === 'single' ? `Today's Sales — ${summary.counter.name}` : "Today's Counter Sales (All Counters)"}
            </h2>
            {summary.scope === 'single' ? (
              summary.bookings.length === 0 && unsyncedToday.length === 0 ? (
                <p className="text-sm text-[#8D6E63]">No counter sales yet today.</p>
              ) : (
                <div className="space-y-3" data-testid="counter-today-sales">
                  {summary.bookings.map(b => (
                    <div key={b.id} className="border-b border-[#E6DCCA]/60 pb-3 last:border-0">
                      <p className="text-sm text-[#2D1B0E]">{b.devotee_name} — {b.seva_name_english}</p>
                      <p className="text-xs text-[#8D6E63] flex items-center justify-between">
                        <span className="font-mono">{b.booking_number}</span>
                        <span>Rs.{b.amount} · {b.payment_method}</span>
                      </p>
                    </div>
                  ))}
                  {unsyncedToday.map(item => (
                    <div key={item.local_id} className="border-b border-[#E6DCCA]/60 pb-3 last:border-0">
                      <p className="text-sm text-[#2D1B0E]">{item.preview?.devotee_name} — {item.preview?.seva_name_english}</p>
                      <p className="text-xs text-[#8D6E63] flex items-center justify-between">
                        <span className="font-mono">{item.local_id}</span>
                        <span>Rs.{item.preview?.amount} · {item.preview?.payment_method}</span>
                      </p>
                      <p className={`text-xs mt-0.5 ${item.status === 'conflict' ? 'text-red-600' : 'text-amber-700'}`}>
                        {item.status === 'conflict' ? 'Sync failed — needs review' : item.status === 'syncing' ? 'Syncing…' : 'Pending sync'}
                      </p>
                    </div>
                  ))}
                  <p className="text-sm font-medium text-[#621B00] pt-1">
                    Total: Rs.{summary.total_amount + unsyncedToday.reduce((sum, q) => sum + (q.preview?.amount || 0), 0)}
                    {' '}({summary.ticket_count + unsyncedToday.length} tickets{unsyncedToday.length > 0 ? `, ${unsyncedToday.length} pending sync` : ''})
                  </p>
                </div>
              )
            ) : (
              // This account isn't tied to one counter (EO/SysAdmin/Accountant) -
              // the combined total only, not a duplicate of the full per-counter
              // breakdown that Counter Reports already shows.
              <div>
                <p className="text-sm font-medium text-[#621B00]">
                  Combined total: Rs.{summary.grand_total_amount + unsyncedToday.reduce((sum, q) => sum + (q.preview?.amount || 0), 0)}
                  {' '}({summary.grand_ticket_count + unsyncedToday.length} tickets{unsyncedToday.length > 0 ? `, ${unsyncedToday.length} pending sync` : ''})
                </p>
                <a href="/admin/counter-reports" className="text-xs text-[#C43E00] hover:underline">See the per-counter breakdown in Counter Reports →</a>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
