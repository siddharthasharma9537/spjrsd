import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X, Pin } from 'lucide-react';

const EMPTY_FORM = { event_name: '', event_name_telugu: '', title: '', title_telugu: '', content: '', content_telugu: '', image_url: '', is_pinned: false, active_flag: true };

export default function AdminLiveBlog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => api.get('/admin/live-blog').then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(false); };

  const handleEdit = (p) => { setForm({ ...EMPTY_FORM, ...p }); setEditing(p.id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/admin/live-blog/${editing}`, form);
    else await api.post('/admin/live-blog', form);
    resetForm(); load();
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await api.delete(`/admin/live-blog/${id}`); load(); };
  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Live Blog Management">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{items.length} posts</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="add-live-blog-btn"><Plus className="h-4 w-4" /> Add Post</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="live-blog-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit Post' : 'New Post'}</h2>
            <button onClick={resetForm}><X className="h-5 w-5 text-[#8D6E63]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Event Name</label><input className={inputCls} value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} required data-testid="live-blog-event-input" /></div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Event Name (Telugu)</label><input className={inputCls} value={form.event_name_telugu} onChange={e => setForm({ ...form, event_name_telugu: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Title (English)</label><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required data-testid="live-blog-title-input" /></div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Title (Telugu)</label><input className={inputCls} value={form.title_telugu} onChange={e => setForm({ ...form, title_telugu: e.target.value })} /></div>
            </div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Content (English)</label><textarea className={`${inputCls} h-24 py-2`} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Content (Telugu)</label><textarea className={`${inputCls} h-24 py-2`} value={form.content_telugu} onChange={e => setForm({ ...form, content_telugu: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Image URL</label><input className={inputCls} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="/Assets/example.webp" /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} /> Pinned</label>
              <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.active_flag} onChange={e => setForm({ ...form, active_flag: e.target.checked })} /> Active</label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm border border-[#E6DCCA] rounded-full">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="live-blog-submit-btn">{editing ? 'Update' : 'Publish'}</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="space-y-3">
          {items.map(p => (
            <div key={p.id} className={`bg-white border rounded-xl p-5 ${p.is_pinned ? 'border-[#D4AF37]/40' : 'border-[#E6DCCA]'}`} data-testid={`live-blog-row-${p.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#C43E00] uppercase tracking-wide">{p.event_name}</span>
                    {p.is_pinned && <Pin className="h-3 w-3 text-[#D4AF37]" />}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.active_flag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.active_flag ? 'Active' : 'Inactive'}</span>
                  </div>
                  <h3 className="font-medium text-[#2D1B0E] text-sm">{p.title}</h3>
                  <p className="text-xs text-[#8D6E63] line-clamp-1 mt-1">{p.content}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => handleEdit(p)} className="p-1.5 text-[#8D6E63] hover:text-[#C43E00]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-[#8D6E63] hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
