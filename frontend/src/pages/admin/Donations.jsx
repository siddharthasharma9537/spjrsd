import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { HandCoins, Heart, IndianRupee, FileCheck } from 'lucide-react';

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    Promise.all([
      api.get(`/admin/donations${filter ? `?donation_type=${filter}` : ''}`),
      api.get('/admin/donation-stats')
    ]).then(([d, s]) => { setDonations(d.data); setStats(s.data); setLoading(false); });
  };
  useEffect(() => { load(); }, [filter]);

  return (
    <AdminLayout title="Donation Management">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 flex items-center gap-4" data-testid="hundi-stats">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center"><HandCoins className="h-6 w-6 text-[#D4AF37]" /></div>
            <div>
              <p className="text-sm text-[#8D6E63]">e-Hundi ({stats.e_hundi.count} donations)</p>
              <p className="text-xl font-bold text-[#2D1B0E]">Rs. {stats.e_hundi.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 flex items-center gap-4" data-testid="anna-stats">
            <div className="w-12 h-12 bg-[#C43E00]/10 rounded-full flex items-center justify-center"><Heart className="h-6 w-6 text-[#C43E00]" /></div>
            <div>
              <p className="text-sm text-[#8D6E63]">AnnaPrasadam ({stats.anna_prasadam.count} donations)</p>
              <p className="text-xl font-bold text-[#2D1B0E]">Rs. {stats.anna_prasadam.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-[#8D6E63]">Filter:</span>
        {['', 'e-Hundi', 'AnnaPrasadam'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs transition-all ${filter === f ? 'bg-[#C43E00] text-white' : 'bg-white border border-[#E6DCCA] text-[#5D4037]'}`} data-testid={`filter-${f || 'all'}`}>
            {f || 'All'}
          </button>
        ))}
        <span className="text-sm text-[#8D6E63] ml-auto">{donations.length} results</span>
      </div>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : donations.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No donations found</p>
      ) : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="donations-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Donor</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Gotram</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Message</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]" data-testid={`donation-row-${d.id}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#621B00]">{d.donation_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${d.donation_type === 'e-Hundi' ? 'bg-[#D4AF37]/20 text-[#8D2800]' : 'bg-[#C43E00]/10 text-[#C43E00]'}`}>{d.donation_type}</span>
                    </td>
                    <td className="px-4 py-3"><p className="text-[#2D1B0E]">{d.is_anonymous ? 'Anonymous' : d.donor_name}</p><p className="text-xs text-[#8D6E63]">{d.donor_mobile}</p></td>
                    <td className="px-4 py-3 font-bold text-[#C43E00]">Rs. {d.amount}</td>
                    <td className="px-4 py-3 text-[#5D4037]">{d.donor_gotram || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#8D6E63] max-w-[150px] truncate">{d.message || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#8D6E63]">{new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/donation-receipt/${d.id}`} className="inline-flex items-center gap-1 px-2 py-1 bg-[#621B00] text-white text-xs rounded-full hover:bg-[#621B00]/90" data-testid={`receipt-btn-${d.id}`}>
                        <FileCheck className="h-3 w-3" /> 80G
                      </Link>
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
