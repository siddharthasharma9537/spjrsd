import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X, UploadCloud } from 'lucide-react';

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', image_url: '', category: 'Temple', active_flag: true });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const load = () => api.get('/gallery?active_only=false').then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ title: '', image_url: '', category: 'Temple', active_flag: true }); setEditing(null); setShowForm(false); };
  const handleEdit = (g) => { setForm({ title: g.title, image_url: g.image_url, category: g.category || 'Temple', active_flag: g.active_flag }); setEditing(g.id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await api.put(`/admin/gallery/${editing}`, form);
    else await api.post('/admin/gallery', form);
    resetForm(); load();
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await api.delete(`/admin/gallery/${id}`); load(); };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/admin/gallery/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Gallery Management">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{items.length} images</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="add-gallery-btn"><Plus className="h-4 w-4" /> Add Image</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="gallery-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit' : 'New'} Image</h2>
            <button onClick={resetForm}><X className="h-5 w-5 text-[#8D6E63]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Title</label><input className={inputCls} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required data-testid="gallery-title-input" /></div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Image</label>
              <label className="flex items-center gap-2 justify-center h-24 border-2 border-dashed border-[#E6DCCA] rounded-lg cursor-pointer text-sm text-[#8D6E63] hover:border-[#C43E00] mb-2">
                <UploadCloud className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Click to upload an image'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileUpload} disabled={uploading} data-testid="gallery-upload-input" />
              </label>
              {uploadError && <p className="text-xs text-red-600 mb-2">{uploadError}</p>}
              {form.image_url && <img src={form.image_url} alt="Preview" className="h-20 rounded-lg object-cover mb-2" />}
              <input className={inputCls} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} required placeholder="Or paste an image URL" data-testid="gallery-url-input" />
            </div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Category</label>
              <select className={inputCls} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {['Temple','Festival','Seva','Devotees','Nature','Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.active_flag} onChange={e => setForm({...form, active_flag: e.target.checked})} /> Active</label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm border border-[#E6DCCA] rounded-full">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="gallery-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(g => (
            <div key={g.id} className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden" data-testid={`gallery-admin-${g.id}`}>
              <div className="aspect-square relative">
                <img src={g.image_url} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                {!g.active_flag && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white text-xs bg-red-600 px-2 py-0.5 rounded">Inactive</span></div>}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-[#2D1B0E] truncate">{g.title}</p>
                <p className="text-xs text-[#8D6E63]">{g.category}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => handleEdit(g)} className="p-1 text-[#8D6E63] hover:text-[#C43E00]"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(g.id)} className="p-1 text-[#8D6E63] hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
