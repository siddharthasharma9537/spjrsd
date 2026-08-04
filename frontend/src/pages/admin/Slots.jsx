import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function AdminSlots() {
  const [slots, setSlots] = useState([]);
  const [sevas, setSevas] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterSeva, setFilterSeva] = useState('');
  const [form, setForm] = useState({ seva_id: '', profile_id: '', date: '', start_time: '', end_time: '', max_bookings: 20, online_quota: 10, counter_quota: 10 });

  const load = () => {
    Promise.all([
      api.get('/schedule-slots'),
      api.get('/sevas?active_only=false'),
      api.get('/day-profiles')
    ]).then(([s, sv, p]) => {
      setSlots(s.data);
      setSevas(sv.data);
      setProfiles(p.data);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ seva_id: '', profile_id: '', date: '', start_time: '', end_time: '', max_bookings: 20, online_quota: 10, counter_quota: 10 }); setEditing(null); setShowForm(false); };

  const handleEdit = (s) => {
    setForm({ seva_id: s.seva_id, profile_id: s.profile_id, date: s.date || '', start_time: s.start_time, end_time: s.end_time, max_bookings: s.max_bookings, online_quota: s.online_quota, counter_quota: s.counter_quota });
    setEditing(s.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, max_bookings: parseInt(form.max_bookings), online_quota: parseInt(form.online_quota), counter_quota: parseInt(form.counter_quota), date: form.date || null };
    if (editing) await api.put(`/admin/schedule-slots/${editing}`, payload);
    else await api.post('/admin/schedule-slots', payload);
    resetForm();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    await api.delete(`/admin/schedule-slots/${id}`);
    load();
  };

  const sevaMap = Object.fromEntries(sevas.map(s => [s.id, s]));
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
  const filtered = filterSeva ? slots.filter(s => s.seva_id === filterSeva) : slots;

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Schedule Slots">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <select className={`${inputCls} w-48`} value={filterSeva} onChange={e => setFilterSeva(e.target.value)} data-testid="slot-filter-seva">
            <option value="">All Sevas</option>
            {sevas.map(s => <option key={s.id} value={s.id}>{s.name_english}</option>)}
          </select>
          <p className="text-sm text-[#8D6E63]">{filtered.length} slots</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid="add-slot-btn">
          <Plus className="h-4 w-4" /> Add Slot
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="slot-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit Slot' : 'New Slot'}</h2>
            <button onClick={resetForm} className="text-[#8D6E63] hover:text-[#2D1B0E]"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Seva</label>
              <select className={inputCls} value={form.seva_id} onChange={e => setForm({...form, seva_id: e.target.value})} required data-testid="slot-seva-select">
                <option value="">Select Seva</option>
                {sevas.map(s => <option key={s.id} value={s.id}>{s.name_english}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Day Profile</label>
              <select className={inputCls} value={form.profile_id} onChange={e => setForm({...form, profile_id: e.target.value})} required data-testid="slot-profile-select">
                <option value="">Select Profile</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Specific Date (optional)</label>
              <input type="date" className={inputCls} value={form.date} onChange={e => setForm({...form, date: e.target.value})} data-testid="slot-date" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-[#5D4037] mb-1">Start Time</label>
                <input type="time" className={inputCls} value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required data-testid="slot-start-time" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5D4037] mb-1">End Time</label>
                <input type="time" className={inputCls} value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required data-testid="slot-end-time" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Max Bookings</label>
              <input type="number" className={inputCls} value={form.max_bookings} onChange={e => setForm({...form, max_bookings: e.target.value})} data-testid="slot-max-bookings" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-[#5D4037] mb-1">Online Quota</label>
                <input type="number" className={inputCls} value={form.online_quota} onChange={e => setForm({...form, online_quota: e.target.value})} data-testid="slot-online-quota" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5D4037] mb-1">Counter Quota</label>
                <input type="number" className={inputCls} value={form.counter_quota} onChange={e => setForm({...form, counter_quota: e.target.value})} data-testid="slot-counter-quota" />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm text-[#5D4037] border border-[#E6DCCA] rounded-full hover:bg-[#FDFBF7]">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid="slot-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="slots-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Seva</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Profile</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Quotas</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(s => (
                  <tr key={s.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]">
                    <td className="px-4 py-3 text-[#2D1B0E]">{sevaMap[s.seva_id]?.name_english || '—'}</td>
                    <td className="px-4 py-3 text-[#8D6E63]">{profileMap[s.profile_id]?.name || '—'}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">{s.start_time} - {s.end_time}</td>
                    <td className="px-4 py-3 text-[#8D6E63]">{s.date || 'Recurring'}</td>
                    <td className="px-4 py-3 text-xs text-[#8D6E63]">O:{s.online_quota} C:{s.counter_quota}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(s)} className="p-1.5 text-[#8D6E63] hover:text-[#C43E00]"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-[#8D6E63] hover:text-red-600 ml-1"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && <p className="text-center text-xs text-[#8D6E63] py-3">Showing 50 of {filtered.length} slots</p>}
        </div>
      )}
    </AdminLayout>
  );
}
