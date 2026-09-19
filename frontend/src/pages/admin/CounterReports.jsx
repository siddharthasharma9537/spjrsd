import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import DateInput from '@/components/ui/date-input';
import { Store, ArrowLeft } from 'lucide-react';

const todayIso = () => new Date().toISOString().slice(0, 10);

// Scoped entirely server-side, not by anything this screen picks - see
// GET /admin/counters/today-summary. A login tied to one counter (see
// StaffCreate.counter_id) only ever gets that counter's numbers back; an
// office-role login (EO, SysAdmin, or an Accountant role granted just
// bookings:reconcile) gets every counter, separately and combined.
function BookingRow({ b }) {
  return (
    <div className="border-b border-[#E6DCCA]/60 pb-2 last:border-0 flex items-center justify-between text-sm">
      <div>
        <p className="text-[#2D1B0E]">{b.devotee_name} — {b.seva_name_english}</p>
        <p className="font-mono text-xs text-[#8D6E63]">{b.booking_number}</p>
      </div>
      <span className="text-[#8D6E63]">Rs.{b.amount} · {b.payment_method}</span>
    </div>
  );
}

function CounterCard({ name, ticketCount, totalAmount, bookings, onClick, testId }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      data-testid={testId}
      className={`text-left bg-white border border-[#E6DCCA] rounded-xl p-6 w-full ${onClick ? 'hover:border-[#C43E00] hover:shadow-sm transition-colors cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-english-heading text-sm text-[#621B00] uppercase tracking-wide flex items-center gap-2">
          <Store className="h-4 w-4" /> {name}
        </h3>
        <span className="text-sm font-medium text-[#621B00]">Rs.{totalAmount} ({ticketCount})</span>
      </div>
      {bookings.length === 0 ? (
        <p className="text-sm text-[#8D6E63]">No sales yet today.</p>
      ) : (
        <div className="space-y-2">{bookings.map(b => <BookingRow key={b.id} b={b} />)}</div>
      )}
    </Tag>
  );
}

// Drill-down for one counter: date picker + that day's sales. Always filters
// by booking_date_time (when the counter sale was made), matching the
// "today's bookings across every counter" framing of the grid this opens
// from - not for_date (which seva/date the booking is for).
function CounterDetail({ counterId, counterName, onBack }) {
  const [date, setDate] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setError('');
    api.get(`/admin/counters/${counterId}/bookings`, { params: { date } })
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.detail || 'Could not load this counter.'); setLoading(false); });
  }, [counterId, date]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        {onBack ? (
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-[#621B00] hover:underline" data-testid="counter-detail-back">
            <ArrowLeft className="h-4 w-4" /> All Counters
          </button>
        ) : <span />}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#8D6E63]">Date:</span>
          <DateInput
            className="h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]"
            value={date}
            onChange={setDate}
            max={todayIso()}
            data-testid="counter-detail-date"
          />
        </div>
      </div>

      <h3 className="font-english-heading text-lg text-[#621B00] mb-4 flex items-center gap-2">
        <Store className="h-5 w-5" /> {counterName}
      </h3>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="counter-detail-error">{error}</p>}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6" data-testid="counter-detail-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#8D6E63]">{data.bookings.length} sale(s) on {date}</span>
            <span className="text-sm font-medium text-[#621B00]">Rs.{data.total_amount} ({data.ticket_count})</span>
          </div>
          {data.bookings.length === 0 ? (
            <p className="text-sm text-[#8D6E63]">No sales on this date.</p>
          ) : (
            <div className="space-y-2">{data.bookings.map(b => <BookingRow key={b.id} b={b} />)}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCounterReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // { id, name }

  useEffect(() => {
    api.get('/admin/counters/today-summary').then(r => { setSummary(r.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.detail || 'Could not load counter reports.'); setLoading(false); });
  }, []);

  if (loading) return <AdminLayout title="Counter Reports"><p className="text-[#8D6E63]">Loading...</p></AdminLayout>;
  if (error) return <AdminLayout title="Counter Reports"><p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="counter-reports-error">{error}</p></AdminLayout>;

  if (summary.scope === 'single') {
    return (
      <AdminLayout title="Counter Reports">
        <CounterDetail counterId={summary.counter.id} counterName={summary.counter.name} />
      </AdminLayout>
    );
  }

  if (selected) {
    return (
      <AdminLayout title="Counter Reports">
        <CounterDetail counterId={selected.id} counterName={selected.name} onBack={() => setSelected(null)} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Counter Reports">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">Today's bookings across every counter.</p>
        <div className="bg-[#621B00] text-white rounded-xl px-5 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-[#FFE0B2]/70">Combined Total</p>
          <p className="font-english-heading text-lg" data-testid="counter-reports-grand-total">Rs.{summary.grand_total_amount} ({summary.grand_ticket_count} tickets)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="counter-reports-grid">
        {summary.counters.map(c => (
          <CounterCard
            key={c.counter_id}
            name={c.counter_name}
            ticketCount={c.ticket_count}
            totalAmount={c.total_amount}
            bookings={c.bookings}
            onClick={() => setSelected({ id: c.counter_id, name: c.counter_name })}
            testId={`counter-card-${c.counter_id}`}
          />
        ))}
        {summary.unassigned.ticket_count > 0 && (
          <CounterCard name="Unassigned (no counter on the account)" ticketCount={summary.unassigned.ticket_count} totalAmount={summary.unassigned.total_amount} bookings={summary.unassigned.bookings} />
        )}
      </div>
    </AdminLayout>
  );
}
