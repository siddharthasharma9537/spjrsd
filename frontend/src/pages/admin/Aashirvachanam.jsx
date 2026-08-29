import { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Mail, Search, ArrowUpDown, Gift } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminAashirvachanam() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('all');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    api.get('/admin/aashirvachanam').then(r => setItems(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter(i => {
      if (q && !(i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q))) return false;
      if (occasionFilter !== 'all' && i.occasion_type !== occasionFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const cmp = (a.created_at || '').localeCompare(b.created_at || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, search, occasionFilter, sortDir]);

  return (
    <AdminLayout title="Personalized Aashirvachanam">
      <p className="text-sm text-[#8D6E63] mb-4">{visible.length} of {items.length} requests submitted (read-only)</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-[#8D6E63] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email..."
            className="w-full h-10 pl-9 pr-3 bg-white border border-[#E6DCCA] rounded-lg text-sm focus:border-[#C43E00] outline-none" data-testid="aashirvachanam-search" />
        </div>
        <select value={occasionFilter} onChange={e => setOccasionFilter(e.target.value)} className="h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="aashirvachanam-filter">
          <option value="all">All occasions</option>
          <option value="Birthday">Birthday</option>
          <option value="Wedding Anniversary">Wedding Anniversary</option>
        </select>
        <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="h-10 px-3 inline-flex items-center gap-1.5 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#5D4037]" data-testid="aashirvachanam-sort-dir">
          <ArrowUpDown className="h-3.5 w-3.5" /> {sortDir === 'asc' ? 'Oldest first' : 'Latest first'}
        </button>
      </div>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : loadError ? (
        <p className="text-center py-12 text-[#8D6E63]">Failed to load Aashirvachanam requests</p>
      ) : visible.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">{items.length === 0 ? 'No requests submitted yet' : 'No requests match your filters'}</p>
      ) : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="aashirvachanam-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Occasion</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Date (Annual)</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(i => (
                  <tr key={i.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]" data-testid={`aashirvachanam-row-${i.id}`}>
                    <td className="px-4 py-3 text-[#2D1B0E] font-medium">{i.name}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-[#5D4037]"><Mail className="h-3.5 w-3.5" /> {i.email}</span></td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-[#5D4037]"><Gift className="h-3.5 w-3.5" /> {i.occasion_type}</span></td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{String(i.day).padStart(2, '0')}/{String(i.month).padStart(2, '0')}</td>
                    <td className="px-4 py-3 text-[#8D6E63] text-xs">{fmtDate(i.created_at)}</td>
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
