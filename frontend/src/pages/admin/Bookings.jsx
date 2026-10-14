import { useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { useCachedGet, invalidateCached } from '@/lib/cachedGet';
import DateInput from '@/components/ui/date-input';
import { Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { sortByPriority } from '@/lib/sevaSamagri';
import useIsPhone from '@/hooks/useIsPhone';
import { statusBadge as statusOf, ticketRemark, todayIst } from '@/lib/ticketBadge';

// Filter options worked out by the backend from the ticket's date and
// prasadam state rather than a stored status (see ticketRemark).
const VIEWS = { PrasadamPending: 'prasadam_pending', NoShow: 'no_show' };

export default function AdminBookings() {
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'bookings:edit');
  // Cancelling is EO/SysAdmin authority only, even for a role otherwise
  // granted bookings:edit (e.g. to Confirm/Complete a booking) - everyone
  // else can only *request* a cancellation, reviewed on the Cancellation
  // Requests screen. See require_superuser() in the backend.
  const canCancelDirectly = !!user?.is_superuser;
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterSeva, setFilterSeva] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [requestingId, setRequestingId] = useState(null);
  const [reasonDraft, setReasonDraft] = useState('');

  const statusParams = VIEWS[filterStatus] ? { view: VIEWS[filterStatus] } : { status: filterStatus };
  const { data: bookingsData, loading } = useCachedGet('/admin/bookings', { date: filterDate, seva_id: filterSeva, ...statusParams });
  const { data: sevasData } = useCachedGet('/sevas', { active_only: 'false' });
  const bookings = bookingsData || [];
  const sevas = sortByPriority(sevasData || []);
  // A status change also moves the Dashboard's booking/revenue figures.
  const load = () => { invalidateCached('/admin/bookings'); invalidateCached('/admin/stats'); };

  const updateStatus = async (bookingId, newStatus) => {
    setError('');
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status: newStatus });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update this booking.');
    }
  };

  const submitCancellationRequest = async (bookingId) => {
    if (!reasonDraft.trim()) return;
    setError('');
    try {
      await api.post(`/admin/bookings/${bookingId}/request-cancellation`, { reason: reasonDraft });
      setRequestingId(null);
      setReasonDraft('');
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit the cancellation request.');
    }
  };

  const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  const pill = 'px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap';
  const statusBadge = (b) => {
    const { label, cls } = statusOf(b);
    return <span className={`${pill} ${cls}`} data-testid={`booking-status-${b.id}`}>{label}</span>;
  };
  const remarkBadge = (b) => {
    const r = ticketRemark(b, today);
    return r && <span className={`${pill} ${r.cls}`} data-testid={`booking-remark-${b.id}`}>{r.label}</span>;
  };

  // The same buttons in the desktop table and on the phone cards.
  // A Confirmed/Pending ticket whose date has passed has expired: no
  // Complete or Cancel any more (the backend refuses both too).
  const isExpired = (b) => ['Confirmed', 'Pending'].includes(b.status) && b.for_date < today;
  const actions = (b, align = '') => isExpired(b) ? (
    <div className={`flex gap-1 items-center flex-wrap ${align}`}>
      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap" data-testid={`ticket-expired-${b.id}`}>Ticket expired</span>
    </div>
  ) : (
    <div className={`flex gap-1 items-center flex-wrap ${align}`}>
      {canEdit && b.status === 'Confirmed' && (
        <button onClick={() => updateStatus(b.id, 'Completed')} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200" data-testid={`complete-booking-${b.id}`}>Complete</button>
      )}
      {canEdit && b.status === 'Pending' && (
        <button onClick={() => updateStatus(b.id, 'Confirmed')} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200">Confirm</button>
      )}
      {['Confirmed', 'Pending'].includes(b.status) && (
        canCancelDirectly ? (
          <button onClick={() => updateStatus(b.id, 'Cancelled')} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200" data-testid={`cancel-booking-${b.id}`}>Cancel</button>
        ) : b.cancellation_requested ? (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full" data-testid={`cancellation-pending-${b.id}`}>Cancellation Requested</span>
        ) : requestingId === b.id ? (
          <>
            <input
              autoFocus
              className="h-8 px-2 text-xs border border-[#E6DCCA] rounded-lg outline-none focus:border-[#C43E00]"
              placeholder="Reason..."
              value={reasonDraft}
              onChange={e => setReasonDraft(e.target.value)}
              data-testid={`cancellation-reason-${b.id}`}
            />
            <button onClick={() => submitCancellationRequest(b.id)} className="px-2 py-1 bg-[#621B00] text-white text-xs rounded-full hover:bg-[#4a1400]" data-testid={`submit-cancellation-${b.id}`}>Submit</button>
            <button onClick={() => { setRequestingId(null); setReasonDraft(''); }} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200">Cancel</button>
          </>
        ) : (
          <button onClick={() => { setRequestingId(b.id); setReasonDraft(''); }} className="px-2 py-1 bg-[#E6DCCA] text-[#621B00] text-xs rounded-full hover:bg-[#D4AF37]/40" data-testid={`request-cancellation-${b.id}`}>Request Cancellation</button>
        )
      )}
    </div>
  );

  const isPhone = useIsPhone();
  const today = todayIst();

  return (
    <AdminLayout title="Booking Management">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-[#8D6E63]" />
          <span className="text-sm text-[#8D6E63]">Filters:</span>
        </div>
        <DateInput className={inputCls} value={filterDate} onChange={setFilterDate} data-testid="filter-date" />
        <select className={`${inputCls} w-40`} value={filterSeva} onChange={e => setFilterSeva(e.target.value)} data-testid="filter-seva">
          <option value="">All Sevas</option>
          {sevas.map(s => <option key={s.id} value={s.id}>{s.name_english}</option>)}
        </select>
        <select className={`${inputCls} w-44`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} data-testid="filter-status">
          <option value="">All Status</option>
          {['Pending','Confirmed','Completed','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          <option value="NoShow">No-show</option>
          <option value="PrasadamPending">Prasadam pending</option>
        </select>
        <span className="text-sm text-[#8D6E63]">{bookings.length} results</span>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="bookings-error">{error}</p>}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : bookings.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No bookings found</p>
      ) : isPhone ? (
        // Phones get one card per booking instead of a 9-column table that
        // would need sideways scrolling to reach the status and buttons.
        <div className="space-y-3" data-testid="bookings-cards">
          {bookings.map(b => (
            <div key={b.id} className="bg-white border border-[#E6DCCA] rounded-xl p-4" data-testid={`booking-row-${b.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#2D1B0E]">{b.devotee_name}</p>
                  <a href={`tel:${b.devotee_mobile}`} className="text-sm text-[#C43E00]">{b.devotee_mobile}</a>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {statusBadge(b)}
                  {remarkBadge(b)}
                </div>
              </div>
              <p className="mt-2 text-sm text-[#2D1B0E]">{b.seva_name_english}</p>
              <p className="text-sm text-[#5D4037]">{b.for_date} · {b.slot_start_time}-{b.slot_end_time}</p>
              <p className="text-xs text-[#8D6E63] mt-1">
                {b.gotram && <>Gotram {b.gotram} · </>}Rs.{b.amount} · <span className="font-mono">{b.booking_number}</span>
              </p>
              {/* Bigger tap targets than the table's compact buttons. */}
              <div className="mt-3 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_input]:h-10 [&_input]:text-sm [&_input]:flex-1">
                {actions(b)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="bookings-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Booking #</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Devotee</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Seva</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Gotram</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Remarks</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]" data-testid={`booking-row-${b.id}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#621B00]">{b.booking_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-[#2D1B0E]">{b.devotee_name}</p>
                      <p className="text-xs text-[#8D6E63]">{b.devotee_mobile}</p>
                    </td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{b.seva_name_english}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{b.for_date}</td>
                    <td className="px-4 py-3 text-[#8D6E63]">{b.slot_start_time}-{b.slot_end_time}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{b.gotram}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">Rs.{b.amount}</td>
                    <td className="px-4 py-3">{statusBadge(b)}</td>
                    <td className="px-4 py-3">{remarkBadge(b)}</td>
                    <td className="px-4 py-3 text-right">{actions(b, 'justify-end')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
