import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { sortByPriority } from '@/lib/sevaSamagri';

export default function AdminSevas() {
  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const blankForm = { name_english: '', name_telugu: '', description: '', description_telugu: '', base_price: 0, duration_minutes: 30, is_online_bookable: true, max_per_slot_default: 20, max_persons_per_ticket: 4, special_instructions: '', location_categories: [], active_flag: true, prasadam_eligible: false, prasadam_items: [] };
  const [form, setForm] = useState(blankForm);

  const load = () => api.get('/sevas?active_only=false').then(r => { setSevas(sortByPriority(r.data)); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(blankForm);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (s) => {
    setForm({ name_english: s.name_english, name_telugu: s.name_telugu, description: s.description || '', description_telugu: s.description_telugu || '', base_price: s.base_price, duration_minutes: s.duration_minutes, is_online_bookable: s.is_online_bookable, max_per_slot_default: s.max_per_slot_default, max_persons_per_ticket: s.max_persons_per_ticket, special_instructions: s.special_instructions || '', location_categories: s.location_categories || [], active_flag: s.active_flag, prasadam_eligible: s.prasadam_eligible || false, prasadam_items: s.prasadam_items || [] });
    setEditing(s.id);
    setShowForm(true);
  };

  const toggleLocationCategory = (cat) => {
    setForm(f => ({ ...f, location_categories: f.location_categories.includes(cat) ? f.location_categories.filter(c => c !== cat) : [...f.location_categories, cat] }));
  };

  const addPrasadamItem = () => setForm(f => ({ ...f, prasadam_items: [...f.prasadam_items, { name: '', quantity: 1 }] }));
  const removePrasadamItem = (idx) => setForm(f => ({ ...f, prasadam_items: f.prasadam_items.filter((_, i) => i !== idx) }));
  const updatePrasadamItem = (idx, field, value) => setForm(f => ({
    ...f,
    prasadam_items: f.prasadam_items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      base_price: parseFloat(form.base_price),
      duration_minutes: parseInt(form.duration_minutes),
      max_per_slot_default: parseInt(form.max_per_slot_default),
      max_persons_per_ticket: parseInt(form.max_persons_per_ticket),
      // Empty item rows (left blank while editing) don't count as a real
      // entitlement - drop them rather than saving a nameless quantity.
      prasadam_items: form.prasadam_eligible
        ? form.prasadam_items.filter(item => item.name.trim()).map(item => ({ name: item.name.trim(), quantity: parseInt(item.quantity) || 1 }))
        : [],
    };
    if (editing) await api.put(`/admin/sevas/${editing}`, payload);
    else await api.post('/admin/sevas', payload);
    resetForm();
    load();
  };

  const handleToggleActive = async (s) => {
    await api.put(`/admin/sevas/${s.id}`, { active_flag: !s.active_flag });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this seva?')) return;
    await api.delete(`/admin/sevas/${id}`);
    load();
  };

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Seva Management">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{sevas.length} sevas</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid="add-seva-btn">
          <Plus className="h-4 w-4" /> Add Seva
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="seva-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit Seva' : 'New Seva'}</h2>
            <button onClick={resetForm} className="text-[#8D6E63] hover:text-[#2D1B0E]"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Name (English)</label>
              <input className={inputCls} value={form.name_english} onChange={e => setForm({...form, name_english: e.target.value})} required data-testid="seva-name-english" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Name (Telugu)</label>
              <input className={inputCls} value={form.name_telugu} onChange={e => setForm({...form, name_telugu: e.target.value})} required data-testid="seva-name-telugu" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Description (English)</label>
              <textarea className={`${inputCls} h-20 py-2`} value={form.description} onChange={e => setForm({...form, description: e.target.value})} data-testid="seva-description" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Description (Telugu)</label>
              <textarea className={`${inputCls} h-20 py-2`} value={form.description_telugu} onChange={e => setForm({...form, description_telugu: e.target.value})} data-testid="seva-description-telugu" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Base Price (Rs.)</label>
              <input type="number" className={inputCls} value={form.base_price} onChange={e => setForm({...form, base_price: e.target.value})} required data-testid="seva-price" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Duration (minutes)</label>
              <input type="number" className={inputCls} value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: e.target.value})} data-testid="seva-duration" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Max per Slot</label>
              <input type="number" className={inputCls} value={form.max_per_slot_default} onChange={e => setForm({...form, max_per_slot_default: e.target.value})} data-testid="seva-max-slot" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Max Persons/Ticket</label>
              <input type="number" className={inputCls} value={form.max_persons_per_ticket} onChange={e => setForm({...form, max_persons_per_ticket: e.target.value})} data-testid="seva-max-persons" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Special Instructions</label>
              <textarea className={`${inputCls} h-16 py-2`} value={form.special_instructions} onChange={e => setForm({...form, special_instructions: e.target.value})} data-testid="seva-instructions" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Shrine (for grouping seva ticket prices in chat/WhatsApp)</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-[#5D4037]">
                  <input type="checkbox" checked={form.location_categories.includes('gattupaina')} onChange={() => toggleLocationCategory('gattupaina')} className="rounded" data-testid="seva-cat-gattupaina" /> Gattupaina
                </label>
                <label className="flex items-center gap-2 text-sm text-[#5D4037]">
                  <input type="checkbox" checked={form.location_categories.includes('ammavari')} onChange={() => toggleLocationCategory('ammavari')} className="rounded" data-testid="seva-cat-ammavari" /> Sri Ammavari Devalayam
                </label>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-[#5D4037]">
                <input type="checkbox" checked={form.is_online_bookable} onChange={e => setForm({...form, is_online_bookable: e.target.checked})} className="rounded" /> Online Bookable
              </label>
              <label className="flex items-center gap-2 text-sm text-[#5D4037]">
                <input type="checkbox" checked={form.active_flag} onChange={e => setForm({...form, active_flag: e.target.checked})} className="rounded" /> Active
              </label>
            </div>
            <div className="md:col-span-2 border-t border-[#E6DCCA] pt-4">
              <label className="flex items-center gap-2 text-sm text-[#5D4037] mb-1">
                <input type="checkbox" checked={form.prasadam_eligible} onChange={e => setForm({...form, prasadam_eligible: e.target.checked})} className="rounded" data-testid="seva-prasadam-eligible" />
                Eligible for Free Prasadam (redeemable at the Prasadam Counter)
              </label>
              {form.prasadam_eligible && (
                <div className="mt-2 space-y-2" data-testid="seva-prasadam-items">
                  {form.prasadam_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className={`${inputCls.replace('w-full', 'flex-1')}`}
                        placeholder="Item name, e.g. Laddu"
                        value={item.name}
                        onChange={e => updatePrasadamItem(idx, 'name', e.target.value)}
                        data-testid={`prasadam-item-name-${idx}`}
                      />
                      <input
                        type="number"
                        min="1"
                        className={`${inputCls.replace('w-full', 'w-24')}`}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updatePrasadamItem(idx, 'quantity', e.target.value)}
                        data-testid={`prasadam-item-qty-${idx}`}
                      />
                      <button type="button" onClick={() => removePrasadamItem(idx)} className="p-2 text-[#8D6E63] hover:text-red-600" data-testid={`prasadam-item-remove-${idx}`}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addPrasadamItem} className="inline-flex items-center gap-1 text-sm text-[#C43E00] hover:underline" data-testid="prasadam-item-add">
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </button>
                </div>
              )}
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm text-[#5D4037] border border-[#E6DCCA] rounded-full hover:bg-[#FDFBF7]">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid="seva-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="sevas-table">
              <thead className="bg-[#FDFBF7] border-b border-[#E6DCCA]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Seva</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-[#5D4037]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[#5D4037]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sevas.map(s => (
                  <tr key={s.id} className="border-b border-[#E6DCCA]/50 hover:bg-[#FDFBF7]" data-testid={`seva-row-${s.id}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#2D1B0E]">{s.name_english}</p>
                      <p className="text-[#621B00] font-telugu-heading">{s.name_telugu}</p>
                      {s.prasadam_eligible && (
                        <p className="text-xs text-amber-700 mt-0.5" title={s.prasadam_items?.map(i => `${i.quantity} ${i.name}`).join(', ') || 'No items configured yet'}>
                          🍚 Free Prasadam
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#2D1B0E]">Rs. {s.base_price}</td>
                    <td className="px-4 py-3 text-[#8D6E63]">{s.duration_minutes} min</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`px-2 py-0.5 rounded-full text-xs transition-colors ${s.active_flag ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                        data-testid={`toggle-active-${s.id}`}
                        title="Click to toggle"
                      >
                        {s.active_flag ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(s)} className="p-1.5 text-[#8D6E63] hover:text-[#C43E00] transition-colors" data-testid={`edit-seva-${s.id}`}><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-[#8D6E63] hover:text-red-600 transition-colors ml-1" data-testid={`delete-seva-${s.id}`}><Trash2 className="h-4 w-4" /></button>
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
