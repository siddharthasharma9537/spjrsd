import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_special_day_flag: false });

  const load = () => api.get('/day-profiles').then(r => { setProfiles(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: '', description: '', is_special_day_flag: false }); setEditing(null); setShowForm(false); };

  const handleEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', is_special_day_flag: p.is_special_day_flag });
    setEditing(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/admin/day-profiles/${editing}`, form);
    else await api.post('/admin/day-profiles', form);
    resetForm();
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this profile?')) return;
    await api.delete(`/admin/day-profiles/${id}`);
    load();
  };

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Day Profiles">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{profiles.length} profiles</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid="add-profile-btn">
          <Plus className="h-4 w-4" /> Add Profile
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="profile-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit Profile' : 'New Profile'}</h2>
            <button onClick={resetForm} className="text-[#8D6E63] hover:text-[#2D1B0E]"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Name</label>
              <input className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="profile-name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Description</label>
              <textarea className={`${inputCls} h-20 py-2`} value={form.description} onChange={e => setForm({...form, description: e.target.value})} data-testid="profile-description" />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#5D4037]">
              <input type="checkbox" checked={form.is_special_day_flag} onChange={e => setForm({...form, is_special_day_flag: e.target.checked})} className="rounded" /> Special Day
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm text-[#5D4037] border border-[#E6DCCA] rounded-full hover:bg-[#FDFBF7]">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid="profile-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(p => (
            <div key={p.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5 hover:border-[#D4AF37]/50 transition-all" data-testid={`profile-card-${p.id}`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-[#2D1B0E]">{p.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(p)} className="p-1 text-[#8D6E63] hover:text-[#C43E00]" data-testid={`edit-profile-${p.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-[#8D6E63] hover:text-red-600" data-testid={`delete-profile-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <p className="text-sm text-[#8D6E63] mb-2">{p.description}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_special_day_flag ? 'bg-[#D4AF37]/20 text-[#8D2800]' : 'bg-[#E8E6E1] text-[#5D4037]'}`}>
                {p.is_special_day_flag ? 'Special Day' : 'Regular'}
              </span>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
