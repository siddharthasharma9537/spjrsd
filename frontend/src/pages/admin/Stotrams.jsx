import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const EMPTY = { title: '', title_telugu: '', text_telugu: '', deity: 'Shiva', seva_id: '', display_order: 0, active_flag: true };

export default function AdminStotrams() {
  const [items, setItems] = useState([]);
  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get('/stotrams?active_only=false').then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => {
    load();
    api.get('/sevas').then(r => setSevas(r.data)).catch(() => setSevas([]));
  }, []);

  const resetForm = () => { setForm(EMPTY); setEditing(null); setShowForm(false); };
  const handleEdit = (s) => {
    setForm({
      title: s.title, title_telugu: s.title_telugu, text_telugu: s.text_telugu || '',
      deity: s.deity || '', seva_id: s.seva_id || '', display_order: s.display_order ?? 0,
      active_flag: s.active_flag,
    });
    setEditing(s.id); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // seva_id is optional - send null rather than "" so the field clears properly.
    const payload = { ...form, seva_id: form.seva_id || null, display_order: Number(form.display_order) };
    if (editing) await api.put(`/admin/stotrams/${editing}`, payload);
    else await api.post('/admin/stotrams', payload);
    resetForm(); load();
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await api.delete(`/admin/stotrams/${id}`); load(); };

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";
  const sevaName = (id) => (sevas.find(s => s.id === id) || {}).name_english;
  const withText = items.filter(s => s.text_telugu).length;

  return (
    <AdminLayout title="Stotrams">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{items.length} stotrams &middot; {withText} with text, {items.length - withText} still empty</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="add-stotram-btn"><Plus className="h-4 w-4" /> Add Stotram</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="stotram-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit' : 'New'} Stotram</h2>
            <button onClick={resetForm}><X className="h-5 w-5 text-[#8D6E63]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Title (English)</label><input className={inputCls} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required data-testid="stotram-title-input" /></div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Title (Telugu)</label><input className={inputCls} value={form.title_telugu} onChange={e => setForm({...form, title_telugu: e.target.value})} required data-testid="stotram-title-te-input" /></div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Deity</label><input className={inputCls} value={form.deity} onChange={e => setForm({...form, deity: e.target.value})} /></div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Chanted during</label>
                <select className={inputCls} value={form.seva_id} onChange={e => setForm({...form, seva_id: e.target.value})}>
                  <option value="">Not tied to a seva</option>
                  {sevas.map(s => <option key={s.id} value={s.id}>{s.name_english}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Order</label><input type="number" className={inputCls} value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} /></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Text (Telugu)</label>
              {/* Line breaks are meaningful - the page renders them exactly as typed here. */}
              <textarea
                className="w-full px-3 py-2 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-[15px] text-[#2D1B0E] leading-loose"
                rows={16}
                value={form.text_telugu}
                onChange={e => setForm({...form, text_telugu: e.target.value})}
                placeholder="Paste the Telugu text. Line breaks are preserved exactly."
                data-testid="stotram-text-input"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.active_flag} onChange={e => setForm({...form, active_flag: e.target.checked})} /> Active</label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm border border-[#E6DCCA] rounded-full">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="stotram-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="space-y-2">
          {items.map(s => (
            <div key={s.id} className="bg-white border border-[#E6DCCA] rounded-xl p-4 flex items-center gap-4" data-testid={`stotram-admin-${s.id}`}>
              <span className="text-xs text-[#8D6E63] w-6 shrink-0 text-right">{s.display_order}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2D1B0E] truncate">{s.title} <span className="text-[#8D6E63] font-normal">&middot; {s.title_telugu}</span></p>
                <p className="text-xs text-[#8D6E63]">
                  {s.deity}
                  {s.seva_id && sevaName(s.seva_id) && <> &middot; during {sevaName(s.seva_id)}</>}
                  {!s.active_flag && <> &middot; <span className="text-red-600">inactive</span></>}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${s.text_telugu ? 'bg-green-50 text-green-700' : 'bg-[#F5EFE3] text-[#8D6E63]'}`}>
                {s.text_telugu ? 'text added' : 'empty'}
              </span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleEdit(s)} className="p-1 text-[#8D6E63] hover:text-[#C43E00]"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1 text-[#8D6E63] hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
