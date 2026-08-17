import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const EMPTY_FORM = {
  date: '', vaaram: '', vaaram_telugu: '', masa: '', masa_telugu: '',
  paksha: '', paksha_telugu: '', tithi: '', tithi_telugu: '',
  nakshatra: '', nakshatra_telugu: '', yoga: '', yoga_telugu: '',
  karana: '', karana_telugu: '', sunrise: '', sunset: '',
  rahu_kalam: '', yamagandam: '', gulika_kalam: '', abhijit_muhurtam: '',
  special_note: '', special_note_telugu: ''
};

const FIELDS = [
  { key: 'vaaram', label: 'Vaaram (Day)' }, { key: 'vaaram_telugu', label: 'Vaaram (Telugu)' },
  { key: 'masa', label: 'Masam' }, { key: 'masa_telugu', label: 'Masam (Telugu)' },
  { key: 'paksha', label: 'Paksha' }, { key: 'paksha_telugu', label: 'Paksha (Telugu)' },
  { key: 'tithi', label: 'Tithi', required: true }, { key: 'tithi_telugu', label: 'Tithi (Telugu)' },
  { key: 'nakshatra', label: 'Nakshatra', required: true }, { key: 'nakshatra_telugu', label: 'Nakshatra (Telugu)' },
  { key: 'yoga', label: 'Yoga' }, { key: 'yoga_telugu', label: 'Yoga (Telugu)' },
  { key: 'karana', label: 'Karana' }, { key: 'karana_telugu', label: 'Karana (Telugu)' },
  { key: 'sunrise', label: 'Sunrise' }, { key: 'sunset', label: 'Sunset' },
  { key: 'rahu_kalam', label: 'Rahu Kalam' }, { key: 'yamagandam', label: 'Yamagandam' },
  { key: 'gulika_kalam', label: 'Gulika Kalam' }, { key: 'abhijit_muhurtam', label: 'Abhijit Muhurtam' },
];

export default function AdminPanchangam() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => api.get('/admin/panchangam').then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(false); };

  const handleEdit = (p) => { setForm({ ...EMPTY_FORM, ...p }); setEditing(p.id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      const { date, ...rest } = form;
      await api.put(`/admin/panchangam/${editing}`, rest);
    } else {
      await api.post('/admin/panchangam', form);
    }
    resetForm(); load();
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await api.delete(`/admin/panchangam/${id}`); load(); };
  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Panchangam Management">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#8D6E63]">{items.length} entries</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="add-panchangam-btn"><Plus className="h-4 w-4" /> Add Entry</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="panchangam-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">{editing ? 'Edit Entry' : 'New Entry'}</h2>
            <button onClick={resetForm}><X className="h-5 w-5 text-[#8D6E63]" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5D4037] mb-1">Date</label>
              <input type="date" className={inputCls} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required disabled={!!editing} data-testid="panchangam-date-input" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-[#5D4037] mb-1">{f.label}</label>
                  <input className={inputCls} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                </div>
              ))}
            </div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Special Note (English)</label><textarea className={`${inputCls} h-20 py-2`} value={form.special_note} onChange={e => setForm({ ...form, special_note: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-[#5D4037] mb-1">Special Note (Telugu)</label><textarea className={`${inputCls} h-20 py-2`} value={form.special_note_telugu} onChange={e => setForm({ ...form, special_note_telugu: e.target.value })} /></div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="px-6 py-2 text-sm border border-[#E6DCCA] rounded-full">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="panchangam-submit-btn">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-[#8D6E63]">Loading...</p> : (
        <div className="space-y-3">
          {items.map(p => (
            <div key={p.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={`panchangam-row-${p.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[#2D1B0E] text-sm">{p.date}</h3>
                  <p className="text-xs text-[#8D6E63] mt-1">{p.tithi} &middot; {p.nakshatra}</p>
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
