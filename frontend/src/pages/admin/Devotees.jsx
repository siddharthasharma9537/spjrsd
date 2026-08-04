import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Users, Phone, Mail } from 'lucide-react';

export default function AdminDevotees() {
  const [devotees, setDevotees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/admin/devotees').then(r => setDevotees(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Devotee List">
      <p className="text-sm text-[#8D6E63] mb-6">{devotees.length} registered devotees (read-only)</p>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : devotees.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No devotees registered yet</p>
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
                {devotees.map(d => (
                  <tr key={d.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]" data-testid={`devotee-row-${d.id}`}>
                    <td className="px-4 py-3 text-[#2D1B0E] font-medium">{d.name}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-[#5D4037]"><Phone className="h-3.5 w-3.5" /> {d.mobile}</span></td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-[#5D4037]"><Mail className="h-3.5 w-3.5" /> {d.email || '—'}</span></td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{d.gotram || '—'}</td>
                    <td className="px-4 py-3 text-[#8D6E63] text-xs">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
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
