import { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 30;

export default function AdminPanchangam() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { api.get('/admin/panchangam').then(r => { setItems(r.data); setLoading(false); setPage(0); }); }, []);

  const monthOptions = useMemo(() => {
    const months = [...new Set(items.map(p => p.date?.slice(0, 7)).filter(Boolean))].sort();
    return months.map(m => ({
      value: m,
      label: new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    }));
  }, [items]);

  const filteredItems = useMemo(
    () => monthFilter ? items.filter(p => p.date?.startsWith(monthFilter)) : items,
    [items, monthFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <AdminLayout title="Panchangam">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <p className="text-sm text-[#8D6E63]">{filteredItems.length} of {items.length} entries</p>
        {monthOptions.length > 1 && (
          <select
            value={monthFilter}
            onChange={e => { setMonthFilter(e.target.value); setPage(0); }}
            className="h-9 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#2D1B0E] focus:border-[#C43E00] outline-none"
            data-testid="panchangam-month-filter"
          >
            <option value="">All months</option>
            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}
      </div>

      <p className="text-xs text-[#8D6E63] mb-4" data-testid="panchangam-engine-note">
        The panchangam is synced from the SoHum Surya Siddhanta panchangam engine, one Telugu year at a time, and is the only source: it is not entered or imported here, and any change made directly in the database is overwritten by the next sync.
      </p>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <>
          <div className="space-y-3">
            {pagedItems.map(p => (
              <div key={p.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={`panchangam-row-${p.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-[#2D1B0E] text-sm">{p.date}</h3>
                    <p className="text-xs text-[#8D6E63] mt-1">{p.tithi} &middot; {p.nakshatra}{p.special_note ? ` · ${p.special_note}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6" data-testid="panchangam-pagination">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-full border border-[#E6DCCA] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C43E00]" data-testid="panchangam-prev-page">
                <ChevronLeft className="h-4 w-4 text-[#621B00]" />
              </button>
              <span className="text-sm text-[#8D6E63]">Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-full border border-[#E6DCCA] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C43E00]" data-testid="panchangam-next-page">
                <ChevronRight className="h-4 w-4 text-[#621B00]" />
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
