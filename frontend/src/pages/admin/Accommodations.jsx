import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function AdminAccommodations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', name_telugu: '', description: '', room_type: 'AC', capacity: 2, price_per_day: 0, amenities: '', total_rooms: 10, active_flag: true });

  const load = () => api.get('/accommodations?active_only=false').then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: '', name_telugu: '', description: '', room_type: 'AC', capacity: 2, price_per_day: 0, amenities: '', total_rooms: 10, active_flag: true }); setEditing(null); setShowForm(false); };

  const handleEdit = (a) => { setForm({ name: a.name, name_telugu: a.name_telugu || '', description: a.description || '', room_type: a.room_type, capacity: a.capacity, price_per_day: a.price_per_day, amenities: a.amenities || '', total_rooms: a.total_rooms, active_flag: a.active_flag }); setEditing(a.id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, capacity: parseInt(form.capacity), price_per_day: parseFloat(form.price_per_day), total_rooms: parseInt(form.total_rooms) };
    if (editing) await api.put(`/admin/accommodations/${editing}`, payload);
    else await api.post('/admin/accommodations', payload);
    resetForm(); load();
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await api.delete(`/admin/accommodations/${id}`); load(); };
  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Accommodation Management">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{items.length} accommodations</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="add-acc-btn"><Plus className="h-4 w-4" /> Add Accommodation</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="acc-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit' : 'New'} Accommodation</h2>
            <button onClick={resetForm}><X className="h-5 w-5 text-[#8D6E63]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Name</label><input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="acc-name" /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Name (Telugu)</label><input className={inputCls} value={form.name_telugu} onChange={e => setForm({...form, name_telugu: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#5D4037] mb-1">Description</label><textarea className={`${inputCls} h-16 py-2`} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Room Type</label>
              <select className={inputCls} value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})}>
                {['AC','Non-AC','Cottage','Dormitory','Guest House'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Capacity</label><input type="number" className={inputCls} value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Price/Day (Rs.)</label><input type="number" className={inputCls} value={form.price_per_day} onChange={e => setForm({...form, price_per_day: e.target.value})} required /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Total Rooms</label><input type="number" className={inputCls} value={form.total_rooms} onChange={e => setForm({...form, total_rooms: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#5D4037] mb-1">Amenities (comma-separated)</label><input className={inputCls} value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})} placeholder="AC, TV, Hot Water" /></div>
            <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.active_flag} onChange={e => setForm({...form, active_flag: e.target.checked})} /> Active</label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm border border-[#E6DCCA] rounded-full">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="acc-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="acc-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Price/Day</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Rooms</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]">
                    <td className="px-4 py-3"><p className="font-medium text-[#2D1B0E]">{a.name}</p>{a.name_telugu && <p className="text-xs text-[#8D6E63] font-telugu-heading">{a.name_telugu}</p>}</td>
                    <td className="px-4 py-3 text-[#5D4037]">{a.room_type}</td>
                    <td className="px-4 py-3 text-[#2D1B0E]">Rs. {a.price_per_day}</td>
                    <td className="px-4 py-3 text-[#8D6E63]">{a.total_rooms}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${a.active_flag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a.active_flag ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(a)} className="p-1.5 text-[#8D6E63] hover:text-[#C43E00]"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 text-[#8D6E63] hover:text-red-600 ml-1"><Trash2 className="h-4 w-4" /></button>
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
