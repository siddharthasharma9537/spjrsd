import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminCancellationRequests() {
  const { user } = useAuth();
  // Approving actually cancels the booking - kept to EO/SysAdmin only (see
  // require_superuser() in the backend), even though anyone with
  // bookings:edit can see this queue and reject an obviously bad request.
  const canApprove = !!user?.is_superuser;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const load = () => {
    const params = filterStatus ? `?status=${filterStatus}` : '';
    api.get(`/admin/cancellation-requests${params}`).then(r => { setRequests(r.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.detail || 'Could not load cancellation requests.'); setLoading(false); });
  };

  useEffect(() => { load(); }, [filterStatus]);

  const approve = async (id) => {
    setError('');
    try {
      await api.put(`/admin/cancellation-requests/${id}/approve`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not approve this request.');
    }
  };

  const submitReject = async (id) => {
    setError('');
    try {
      await api.put(`/admin/cancellation-requests/${id}/reject`, { note: noteDraft });
      setRejectingId(null);
      setNoteDraft('');
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not reject this request.');
    }
  };

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-red-100 text-red-800',
    Rejected: 'bg-gray-100 text-gray-800',
  };

  const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Cancellation Requests">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-[#8D6E63]">Filter:</span>
        <select className={`${inputCls} w-40`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} data-testid="filter-request-status">
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="cancellation-requests-error">{error}</p>}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : requests.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No cancellation requests found</p>
      ) : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="cancellation-requests-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Booking #</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Devotee</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Counter</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Requested By</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]" data-testid={`cancellation-request-row-${r.id}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#621B00]">{r.booking_number}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{r.devotee_name}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{r.counter_name || '-'}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{r.requested_by_name}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{r.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || ''}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'Pending' && (
                        rejectingId === r.id ? (
                          <div className="flex gap-1 justify-end items-center">
                            <input
                              autoFocus
                              className="h-8 px-2 text-xs border border-[#E6DCCA] rounded-lg outline-none focus:border-[#C43E00]"
                              placeholder="Reason (optional)..."
                              value={noteDraft}
                              onChange={e => setNoteDraft(e.target.value)}
                              data-testid={`reject-note-${r.id}`}
                            />
                            <button onClick={() => submitReject(r.id)} className="px-2 py-1 bg-gray-700 text-white text-xs rounded-full hover:bg-gray-800" data-testid={`submit-reject-${r.id}`}>Confirm Reject</button>
                            <button onClick={() => { setRejectingId(null); setNoteDraft(''); }} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            {canApprove && <button onClick={() => approve(r.id)} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200" data-testid={`approve-request-${r.id}`}>Approve Cancellation</button>}
                            <button onClick={() => { setRejectingId(r.id); setNoteDraft(''); }} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full hover:bg-gray-200" data-testid={`reject-request-${r.id}`}>Reject</button>
                          </div>
                        )
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
