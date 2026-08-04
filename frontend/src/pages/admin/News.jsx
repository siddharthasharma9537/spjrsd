import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function AdminNews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', title_telugu: '', content: '', content_telugu: '', is_important: false, active_flag: true });

  const load = () => api.get('/news?active_only=false').then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ title: '', title_telugu: '', content: '', content_telugu: '', is_important: false, active_flag: true }); setEditing(null); setShowForm(false); };

  const handleEdit = (n) => { setForm({ title: n.title, title_telugu: n.title_telugu || '', content: n.content, content_telugu: n.content_telugu || '', is_important: n.is_important, active_flag: n.active_flag }); setEditing(n.id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/admin/news/${editing}`, form);
    else await api.post('/admin/news', form);
    resetForm(); load();
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await api.delete(`/admin/news/${id}`); load(); };
  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="News Management">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{items.length} news items</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="add-news-btn"><Plus className="h-4 w-4" /> Add News</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="news-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit News' : 'New News'}</h2>
            <button onClick={resetForm}><X className="h-5 w-5 text-[#8D6E63]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Title (English)</label><input className={inputCls} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required data-testid="news-title-input" /></div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Title (Telugu)</label><input className={inputCls} value={form.title_telugu} onChange={e => setForm({...form, title_telugu: e.target.value})} /></div>
            </div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Content (English)</label><textarea className={`${inputCls} h-24 py-2`} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Content (Telugu)</label><textarea className={`${inputCls} h-24 py-2`} value={form.content_telugu} onChange={e => setForm({...form, content_telugu: e.target.value})} /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.is_important} onChange={e => setForm({...form, is_important: e.target.checked})} /> Important</label>
              <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.active_flag} onChange={e => setForm({...form, active_flag: e.target.checked})} /> Active</label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm border border-[#E6DCCA] rounded-full">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="news-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="space-y-3">
          {items.map(n => (
            <div key={n.id} className={`bg-white border rounded-xl p-5 ${n.is_important ? 'border-[#C43E00]/30' : 'border-[#E6DCCA]'}`} data-testid={`news-row-${n.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-[#2D1B0E] text-sm">{n.title}</h3>
                    {n.is_important && <span className="px-2 py-0.5 bg-[#C43E00] text-white text-xs rounded-full">Important</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${n.active_flag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{n.active_flag ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="text-xs text-[#8D6E63] line-clamp-1">{n.content}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => handleEdit(n)} className="p-1.5 text-[#8D6E63] hover:text-[#C43E00]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(n.id)} className="p-1.5 text-[#8D6E63] hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
