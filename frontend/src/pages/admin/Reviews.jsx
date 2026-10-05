import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Star, RefreshCw, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'already_replied', label: 'Already Replied' },
  { value: 'rejected', label: 'Skipped' },
  { value: '', label: 'All' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  already_replied: 'bg-blue-100 text-blue-800',
  rejected: 'bg-[#E6DCCA] text-[#5D4037]',
};

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} star rating`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#E6DCCA]'}`} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [filter, setFilter] = useState('pending');
  const [actioning, setActioning] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/reviews', { params: filter ? { status: filter } : {} })
      .then(r => {
        setItems(r.data);
        setDrafts(prev => ({ ...Object.fromEntries(r.data.map(x => [x.id, x.draft_reply])), ...prev }));
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await api.post('/admin/reviews/sync');
      setSyncResult(r.data);
      load();
    } catch (err) {
      setSyncResult({ error: err.response?.data?.detail || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async (id) => {
    setActioning(id);
    try {
      await api.put(`/admin/reviews/${id}/draft`, { draft_reply: drafts[id] ?? '' });
      await api.post(`/admin/reviews/${id}/approve`);
      load();
    } catch (err) {
      window.alert(err.response?.data?.detail || 'Could not post reply');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Skip this review without replying?')) return;
    setActioning(id);
    try {
      await api.post(`/admin/reviews/${id}/reject`);
      load();
    } finally {
      setActioning(null);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Google Review Replies">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value || 'all'}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filter === f.value ? 'bg-[#C43E00] text-white border-[#C43E00]' : 'border-[#E6DCCA] text-[#5D4037] hover:border-[#D4AF37]'}`}
              data-testid={`reviews-filter-${f.value || 'all'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={handleSync} disabled={syncing} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full disabled:opacity-50" data-testid="sync-reviews-btn">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Reviews'}
        </button>
      </div>

      <p className="text-xs text-[#8D6E63] mb-4">
        Pulls new reviews from the temple's Google Business Profile and drafts a reply for each (based on star rating). Review and edit the draft, then "Approve & Post" to publish it as the public reply on Google - nothing posts automatically.
      </p>

      {syncResult && (
        <div className={`border rounded-xl p-4 mb-6 text-sm ${syncResult.error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`} data-testid="sync-result">
          {syncResult.error ? (
            <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {syncResult.error}</p>
          ) : (
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" /> Fetched {syncResult.fetched} review{syncResult.fetched === 1 ? '' : 's'} from Google, {syncResult.new} new.</p>
          )}
        </div>
      )}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : items.length === 0 ? (
        <p className="text-[#8D6E63] text-sm py-8 text-center">
          No reviews{filter ? ` with status "${STATUS_FILTERS.find(f => f.value === filter)?.label.toLowerCase()}"` : ''} yet.{!filter || filter === 'pending' ? ' Click "Sync Reviews" to pull the latest from Google.' : ''}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map(r => (
            <div key={r.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={`review-row-${r.id}`}>
              <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {r.reviewer_photo_url && <img src={r.reviewer_photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-[#2D1B0E] text-sm">{r.reviewer_name}</span>
                      <StarRow rating={r.star_rating} />
                    </div>
                    <p className="text-xs text-[#8D6E63]">{r.create_time ? new Date(r.create_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize shrink-0 ${STATUS_STYLES[r.status] || ''}`}>{(r.status || '').replace('_', ' ')}</span>
              </div>

              {r.comment && <p className="text-sm text-[#5D4037] mb-3 whitespace-pre-wrap">{r.comment}</p>}

              {r.status === 'pending' ? (
                <>
                  <label className="block text-xs font-medium text-[#5D4037] mb-1">Reply</label>
                  <textarea
                    className={`${inputCls} h-24 py-2 mb-3`}
                    value={drafts[r.id] ?? ''}
                    onChange={e => setDrafts({ ...drafts, [r.id]: e.target.value })}
                    data-testid={`review-draft-${r.id}`}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(r.id)} disabled={actioning === r.id} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full disabled:opacity-50" data-testid={`approve-${r.id}`}>
                      <Check className="h-4 w-4" /> Approve & Post
                    </button>
                    <button onClick={() => handleReject(r.id)} disabled={actioning === r.id} className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E6DCCA] text-sm rounded-full text-[#5D4037] disabled:opacity-50" data-testid={`reject-${r.id}`}>
                      <X className="h-4 w-4" /> Skip
                    </button>
                  </div>
                </>
              ) : (r.status === 'approved' || r.status === 'already_replied') && r.posted_reply ? (
                <div className="bg-[#FDFBF7] border border-[#E6DCCA] rounded-lg p-3">
                  <p className="text-xs text-[#8D6E63] mb-1">{r.status === 'approved' ? 'Posted reply' : "Reply (posted outside this screen)"}{r.posted_at ? ` · ${new Date(r.posted_at).toLocaleString('en-IN')}` : ''}</p>
                  <p className="text-sm text-[#2D1B0E] whitespace-pre-wrap">{r.posted_reply}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
