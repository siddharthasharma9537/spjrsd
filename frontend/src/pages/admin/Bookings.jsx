import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import DateInput from '@/components/ui/date-input';
import { Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';

export default function AdminBookings() {
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'bookings:edit');
  // Cancelling is EO/SysAdmin authority only, even for a role otherwise
  // granted bookings:edit (e.g. to Confirm/Complete a booking) - everyone
  // else can only *request* a cancellation, reviewed on the Cancellation
  // Requests screen. See require_superuser() in the backend.
  const canCancelDirectly = !!user?.is_superuser;
  const [bookings, setBookings] = useState([]);
  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterSeva, setFilterSeva] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [requestingId, setRequestingId] = useState(null);
  const [reasonDraft, setReasonDraft] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (filterDate) params.append('date', filterDate);
    if (filterSeva) params.append('seva_id', filterSeva);
    if (filterStatus) params.append('status', filterStatus);
    Promise.all([
      api.get(`/admin/bookings?${params.toString()}`),
      api.get('/sevas?active_only=false')
    ]).then(([b, s]) => {
      setBookings(b.data);
      setSevas(s.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [filterDate, filterSeva, filterStatus]);

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

  const statusColors = {
    Confirmed: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    NoShow: 'bg-gray-100 text-gray-800',
  };

  const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

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
        <select className={`${inputCls} w-36`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} data-testid="filter-status">
          <option value="">All Status</option>
          {['Pending','Confirmed','Completed','Cancelled','NoShow'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-sm text-[#8D6E63]">{bookings.length} results</span>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="bookings-error">{error}</p>}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : bookings.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No bookings found</p>
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
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || ''}`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end items-center flex-wrap">
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
                    </td>
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
