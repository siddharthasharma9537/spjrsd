import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import EmailReplyModal from './EmailReplyModal';
import DateInput from '@/components/ui/date-input';
import api from '@/lib/api';
import { Users, Phone, Mail, Search, ArrowUpDown } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminDevotees() {
  const navigate = useNavigate();
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/devotees').then(r => setDevotees(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = devotees.filter(d => {
      if (q && !(d.name?.toLowerCase().includes(q) || d.mobile?.includes(q) || d.email?.toLowerCase().includes(q) || d.gotram?.toLowerCase().includes(q))) return false;
      if (fromDate && d.created_at && d.created_at.slice(0, 10) < fromDate) return false;
      if (toDate && d.created_at && d.created_at.slice(0, 10) > toDate) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let cmp;
      if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else cmp = (a.created_at || '').localeCompare(b.created_at || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [devotees, search, fromDate, toDate, sortBy, sortDir]);

  return (
    <AdminLayout title="Devotee List">
      <p className="text-sm text-[#8D6E63] mb-4">{visible.length} of {devotees.length} registered devotees (read-only)</p>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-[#8D6E63] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile, email, gotram..."
            className="w-full h-10 pl-9 pr-3 bg-white border border-[#E6DCCA] rounded-lg text-sm focus:border-[#C43E00] outline-none" data-testid="devotees-search" />
        </div>
        <div>
          <label className="block text-xs text-[#8D6E63] mb-1">From</label>
          <DateInput value={fromDate} onChange={setFromDate} className="h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="devotees-filter-from" />
        </div>
        <div>
          <label className="block text-xs text-[#8D6E63] mb-1">To</label>
          <DateInput value={toDate} onChange={setToDate} className="h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="devotees-filter-to" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="devotees-sort-by">
          <option value="created_at">Sort: Registered date</option>
          <option value="name">Sort: Name</option>
        </select>
        <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="h-10 px-3 inline-flex items-center gap-1.5 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#5D4037]" data-testid="devotees-sort-dir">
          <ArrowUpDown className="h-3.5 w-3.5" /> {sortDir === 'asc' ? 'Oldest first' : 'Latest first'}
        </button>
      </div>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : visible.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">{devotees.length === 0 ? 'No devotees registered yet' : 'No devotees match your filters'}</p>
      ) : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="devotees-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Gotram</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Registered</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(d => (
                  <tr key={d.id} onClick={() => navigate(`/admin/devotees/${d.id}`)} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7] cursor-pointer" data-testid={`devotee-row-${d.id}`}>
                    <td className="px-4 py-3 text-[#2D1B0E] font-medium hover:underline">{d.name}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-[#5D4037]"><Phone className="h-3.5 w-3.5" /> {d.mobile}</span></td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-[#5D4037]">
                        <Mail className="h-3.5 w-3.5" /> {d.email || '—'}
                        {d.email && (
                          <button onClick={e => { e.stopPropagation(); setReplyTarget(d); }} className="text-[#C43E00] hover:underline text-xs" data-testid={`devotee-reply-${d.id}`}>Reply</button>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{d.gotram || '—'}</td>
                    <td className="px-4 py-3 text-[#8D6E63] text-xs">{fmtDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {replyTarget && (
        <EmailReplyModal to={replyTarget.email} defaultSubject="" onClose={() => setReplyTarget(null)} />
      )}
    </AdminLayout>
  );
}
