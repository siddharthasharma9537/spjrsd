import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Star, Check, X, Pencil } from 'lucide-react';

const STATUS_LABEL = {
  pending_approval: 'Needs approval',
  auto_replied: 'Auto-replied',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_CLS = {
  pending_approval: 'bg-amber-100 text-amber-800',
  auto_replied: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-200 text-gray-600',
};

export default function ReviewsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_approval');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    const query = filter ? `?status=${filter}` : '';
    api.get(`/admin/reviews${query}`).then(r => { setItems(r.data); setLoading(false); });
  };
  useEffect(() => { load(); }, [filter]);

  const startEdit = (r) => { setEditingId(r.id); setDraft(r.draft_reply); };
  const cancelEdit = () => { setEditingId(null); setDraft(''); };

  const saveEdit = async (id) => {
    setBusyId(id);
    await api.put(`/admin/reviews/${id}`, { draft_reply: draft });
    setEditingId(null);
    setBusyId(null);
    load();
  };

  const approve = async (id) => {
    if (!window.confirm('Post this reply publicly on Google?')) return;
    setBusyId(id);
    await api.post(`/admin/reviews/${id}/approve`);
    setBusyId(null);
    load();
  };

  const reject = async (id) => {
    if (!window.confirm('Discard this draft without replying?')) return;
    setBusyId(id);
    await api.post(`/admin/reviews/${id}/reject`);
    setBusyId(null);
    load();
  };

  const inputCls = "w-full px-3 py-2 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Review Replies">
      <div className="flex items-center gap-2 mb-6">
        {[
          ['pending_approval', 'Needs approval'],
          ['auto_replied', 'Auto-replied'],
          ['approved', 'Approved'],
          ['rejected', 'Rejected'],
          ['', 'All'],
        ].map(([value, label]) => (
          <button
            key={value || 'all'}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 text-sm rounded-full border ${filter === value ? 'bg-[#C43E00] text-white border-[#C43E00]' : 'border-[#E6DCCA] text-[#5D4037]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : items.length === 0 ? (
        <p className="text-[#8D6E63]">No reviews here.</p>
      ) : (
        <div className="space-y-4">
          {items.map(r => (
            <div key={r.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={`review-${r.id}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-[#2D1B0E]">{r.reviewer_name}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${r.rating && i < r.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#E6DCCA]'}`} />
                    ))}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_CLS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[r.status] || r.status}
                </span>
              </div>

              {r.review_text && <p className="text-sm text-[#5D4037] mb-3">"{r.review_text}"</p>}

              {editingId === r.id ? (
                <div className="space-y-2">
                  <textarea className={inputCls} rows={3} value={draft} onChange={e => setDraft(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(r.id)} disabled={busyId === r.id} className="px-4 py-1.5 bg-[#C43E00] text-white text-xs rounded-full">Save draft</button>
                    <button onClick={cancelEdit} className="px-4 py-1.5 border border-[#E6DCCA] text-xs rounded-full">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FFFCF5] border border-[#E6DCCA] rounded-lg p-3 text-sm text-[#2D1B0E]">
                  {r.posted_reply || r.draft_reply}
                </div>
              )}

              {r.status === 'pending_approval' && editingId !== r.id && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(r.id)} disabled={busyId === r.id} className="inline-flex items-center gap-1 px-4 py-1.5 bg-green-600 text-white text-xs rounded-full"><Check className="h-3.5 w-3.5" /> Approve & post</button>
                  <button onClick={() => startEdit(r)} className="inline-flex items-center gap-1 px-4 py-1.5 border border-[#E6DCCA] text-xs rounded-full"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => reject(r.id)} disabled={busyId === r.id} className="inline-flex items-center gap-1 px-4 py-1.5 border border-red-200 text-red-600 text-xs rounded-full"><X className="h-3.5 w-3.5" /> Discard</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
