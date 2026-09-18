import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, X, Pencil, Check } from 'lucide-react';

const inputCls = "h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

export default function AdminCounters() {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const load = () => {
    api.get('/admin/counters').then(r => { setCounters(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const createCounter = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/counters', { name: newName });
      setNewName('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create the counter.');
    }
  };

  const startRename = (c) => { setEditingId(c.id); setEditingName(c.name); setError(''); };

  const saveRename = async (id) => {
    setError('');
    try {
      await api.put(`/admin/counters/${id}`, { name: editingName });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not rename this counter.');
    }
  };

  const deleteCounter = async (c) => {
    setError('');
    try {
      await api.delete(`/admin/counters/${c.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete this counter.');
    }
  };

  return (
    <AdminLayout title="Counters">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">Physical ticket-selling stations (Main Booking Counter, MGBC1, ...). Assign a User Account to one under User Accounts.</p>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#621B00] text-white text-sm rounded-full hover:bg-[#621B00]/90" data-testid="counters-add-btn">
          <Plus className="h-4 w-4" /> New Counter
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" data-testid="counters-error">{error}</p>}

      {showForm && (
        <form onSubmit={createCounter} className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#5D4037] mb-1">Counter Name</label>
            <input className={`${inputCls} w-full`} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Main Booking Counter" required data-testid="counters-new-name" />
          </div>
          <button type="submit" className="px-5 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90" data-testid="counters-create-btn">Create</button>
        </form>
      )}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : counters.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No counters yet.</p>
      ) : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <table className="w-full text-sm" data-testid="counters-table">
            <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Name</th>
                <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {counters.map(c => (
                <tr key={c.id} className="border-b border-[#E6DCCA]/50" data-testid={`counters-row-${c.id}`}>
                  <td className="px-4 py-3 text-[#2D1B0E]">
                    {editingId === c.id ? (
                      <input className={`${inputCls} w-full max-w-xs`} value={editingName} onChange={e => setEditingName(e.target.value)} data-testid={`counters-rename-input-${c.id}`} />
                    ) : c.name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {editingId === c.id ? (
                        <button onClick={() => saveRename(c.id)} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 inline-flex items-center gap-1" data-testid={`counters-save-${c.id}`}>
                          <Check className="h-3 w-3" /> Save
                        </button>
                      ) : (
                        <button onClick={() => startRename(c)} className="px-2 py-1 bg-[#FDFBF7] border border-[#E6DCCA] text-[#621B00] text-xs rounded-full hover:bg-[#F0E6D6] inline-flex items-center gap-1" data-testid={`counters-rename-${c.id}`}>
                          <Pencil className="h-3 w-3" /> Rename
                        </button>
                      )}
                      <button onClick={() => deleteCounter(c)} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 inline-flex items-center gap-1" data-testid={`counters-delete-${c.id}`}>
                        <X className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
