import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import DateInput from '@/components/ui/date-input';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { Flame, Printer, Plus, IndianRupee } from 'lucide-react';

const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E] w-full";
const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  seva_id: '', for_date: today, slot_id: '', number_of_persons: 1,
  devotee_name: '', devotee_mobile: '', gotram: '', nakshatra: '', rashi: '',
  payment_method: 'cash',
};

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
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [todaySales, setTodaySales] = useState([]);

  const loadTodaySales = () => {
    if (!canReconcile) return;
    // No `date` filter here on purpose: that param means the seva's date,
    // not when the sale was made - a counter sale is often an advance
    // booking for a future seva date. "Today's sales" for cash
    // reconciliation means sold today, so it's filtered client-side on
    // booking_date_time instead.
    api.get('/admin/bookings').then(r => {
      setTodaySales(r.data.filter(b => b.channel === 'counter' && b.booking_date_time?.startsWith(today)));
    });
  };

  useEffect(() => {
    api.get('/sevas?active_only=true').then(r => setSevas(r.data));
    loadTodaySales();
  }, []);

  useEffect(() => {
    if (form.seva_id && form.for_date) {
      api.get(`/admin/slots/available-counter?seva_id=${form.seva_id}&date=${form.for_date}`).then(r => setSlots(r.data));
    } else {
      setSlots([]);
    }
  }, [form.seva_id, form.for_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/admin/bookings/counter', {
        ...form, number_of_persons: parseInt(form.number_of_persons, 10),
      });
      setTicket(res.data);
      loadTodaySales();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create the booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const startNewSale = () => {
    setTicket(null);
    setForm(emptyForm);
    setError('');
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
            <div className="bg-[#621B00] text-white p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <h1 className="font-english-heading text-sm tracking-widest uppercase mb-1">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams</h1>
              <p className="font-telugu-heading text-base text-[#D4AF37]">శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం</p>
              <p className="text-xs text-[#FFE0B2]/70 mt-1">Cheruvugattu, Nalgonda, Telangana</p>
            </div>

            <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-[#8D6E63] uppercase tracking-wide">Booking ID</span>
              <span className="font-mono text-sm font-bold text-[#621B00]" data-testid="counter-ticket-booking-number">{ticket.booking_number}</span>
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
                <p className="text-sm text-[#8D6E63]">No counter slots available for this date.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slots.map(slot => (
                    <button key={slot.id} type="button" onClick={() => setForm({ ...form, slot_id: slot.id })}
                      className={`p-3 rounded-lg border text-sm text-left transition-all ${form.slot_id === slot.id ? 'border-[#C43E00] bg-[#C43E00]/5 text-[#C43E00]' : 'border-[#E6DCCA] hover:border-[#D4AF37] text-[#5D4037]'}`}
                      data-testid={`counter-slot-btn-${slot.id}`}>
                      <div className="font-medium">{slot.start_time} - {slot.end_time}</div>
                      <div className="text-xs mt-1 text-[#8D6E63]">{slot.remaining_slots} counter slots left</div>
                    </button>
                  ))}
                </div>
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
              <IndianRupee className="h-4 w-4" /> {submitting ? 'Recording sale...' : 'Confirm & Print Ticket'}
            </button>
          </form>
        </div>

        {canReconcile && (
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-6">
            <h2 className="font-english-heading text-sm text-[#621B00] uppercase tracking-wide mb-4">Today's Counter Sales</h2>
            {todaySales.length === 0 ? (
              <p className="text-sm text-[#8D6E63]">No counter sales yet today.</p>
            ) : (
              <div className="space-y-3" data-testid="counter-today-sales">
                {todaySales.map(b => (
                  <div key={b.id} className="border-b border-[#E6DCCA]/60 pb-3 last:border-0">
                    <p className="text-sm text-[#2D1B0E]">{b.devotee_name} — {b.seva_name_english}</p>
                    <p className="text-xs text-[#8D6E63] flex items-center justify-between">
                      <span className="font-mono">{b.booking_number}</span>
                      <span>Rs.{b.amount} · {b.payment_method}</span>
                    </p>
                  </div>
                ))}
                <p className="text-sm font-medium text-[#621B00] pt-1">
                  Total: Rs.{todaySales.reduce((sum, b) => sum + (b.amount || 0), 0)} ({todaySales.length} tickets)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
