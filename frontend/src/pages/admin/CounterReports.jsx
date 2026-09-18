import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Store } from 'lucide-react';

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

function CounterCard({ name, ticketCount, totalAmount, bookings }) {
  return (
    <div className="bg-white border border-[#E6DCCA] rounded-xl p-6">
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
    </div>
  );
}

export default function AdminCounterReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/counters/today-summary').then(r => { setSummary(r.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.detail || 'Could not load counter reports.'); setLoading(false); });
  }, []);

  if (loading) return <AdminLayout title="Counter Reports"><p className="text-[#8D6E63]">Loading...</p></AdminLayout>;
  if (error) return <AdminLayout title="Counter Reports"><p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="counter-reports-error">{error}</p></AdminLayout>;

  if (summary.scope === 'single') {
    return (
      <AdminLayout title="Counter Reports">
        <p className="text-sm text-[#8D6E63] mb-6">Today's bookings for your counter.</p>
        <CounterCard name={summary.counter.name} ticketCount={summary.ticket_count} totalAmount={summary.total_amount} bookings={summary.bookings} />
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
          <CounterCard key={c.counter_id} name={c.counter_name} ticketCount={c.ticket_count} totalAmount={c.total_amount} bookings={c.bookings} />
        ))}
        {summary.unassigned.ticket_count > 0 && (
          <CounterCard name="Unassigned (no counter on the account)" ticketCount={summary.unassigned.ticket_count} totalAmount={summary.unassigned.total_amount} bookings={summary.unassigned.bookings} />
        )}
      </div>
    </AdminLayout>
  );
}
