import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Search, ChevronDown } from 'lucide-react';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterSeva, setFilterSeva] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    await api.put(`/admin/bookings/${bookingId}/status`, { status: newStatus });
    load();
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
        <input type="date" className={inputCls} value={filterDate} onChange={e => setFilterDate(e.target.value)} data-testid="filter-date" />
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
                      {b.status === 'Confirmed' && (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => updateStatus(b.id, 'Completed')} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200" data-testid={`complete-booking-${b.id}`}>Complete</button>
                          <button onClick={() => updateStatus(b.id, 'Cancelled')} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200" data-testid={`cancel-booking-${b.id}`}>Cancel</button>
                        </div>
                      )}
                      {b.status === 'Pending' && (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => updateStatus(b.id, 'Confirmed')} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200">Confirm</button>
                          <button onClick={() => updateStatus(b.id, 'Cancelled')} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200">Cancel</button>
                        </div>
                      )}
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
