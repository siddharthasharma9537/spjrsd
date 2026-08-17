import { useState, useEffect, useRef, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X, Upload, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 30;

const EMPTY_FORM = {
  date: '', vaaram: '', vaaram_telugu: '', masa: '', masa_telugu: '',
  paksha: '', paksha_telugu: '', tithi: '', tithi_telugu: '', tithi_timing: '',
  nakshatra: '', nakshatra_telugu: '', nakshatra_timing: '', yoga: '', yoga_telugu: '',
  karana: '', karana_telugu: '', sunrise: '', sunset: '',
  rahu_kalam: '', yamagandam: '', gulika_kalam: '', abhijit_muhurtam: '', varjyam: '',
  special_note: '', special_note_telugu: ''
};

const FIELDS = [
  { key: 'vaaram', label: 'Vaaram (Day)' }, { key: 'vaaram_telugu', label: 'Vaaram (Telugu)' },
  { key: 'masa', label: 'Masam' }, { key: 'masa_telugu', label: 'Masam (Telugu)' },
  { key: 'paksha', label: 'Paksha' }, { key: 'paksha_telugu', label: 'Paksha (Telugu)' },
  { key: 'tithi', label: 'Tithi', required: true }, { key: 'tithi_telugu', label: 'Tithi (Telugu)' },
  { key: 'tithi_timing', label: 'Tithi Timing' },
  { key: 'nakshatra', label: 'Nakshatra', required: true }, { key: 'nakshatra_telugu', label: 'Nakshatra (Telugu)' },
  { key: 'nakshatra_timing', label: 'Nakshatra Timing' },
  { key: 'yoga', label: 'Yoga' }, { key: 'yoga_telugu', label: 'Yoga (Telugu)' },
  { key: 'karana', label: 'Karana' }, { key: 'karana_telugu', label: 'Karana (Telugu)' },
  { key: 'sunrise', label: 'Sunrise' }, { key: 'sunset', label: 'Sunset' },
  { key: 'rahu_kalam', label: 'Rahu Kalam' }, { key: 'yamagandam', label: 'Yamagandam' },
  { key: 'gulika_kalam', label: 'Gulika Kalam' }, { key: 'abhijit_muhurtam', label: 'Abhijit Muhurtam' },
  { key: 'varjyam', label: 'Varjyam' },
];

export default function AdminPanchangam() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [monthFilter, setMonthFilter] = useState('');
  const [page, setPage] = useState(0);
  const fileInputRef = useRef(null);

  const load = () => api.get('/admin/panchangam').then(r => { setItems(r.data); setLoading(false); setPage(0); });
  useEffect(() => { load(); }, []);

  const monthOptions = useMemo(() => {
    const months = [...new Set(items.map(p => p.date?.slice(0, 7)).filter(Boolean))].sort();
    return months.map(m => ({
      value: m,
      label: new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    }));
  }, [items]);

  const filteredItems = useMemo(
    () => monthFilter ? items.filter(p => p.date?.startsWith(monthFilter)) : items,
    [items, monthFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const r = await api.post('/admin/panchangam/bulk-import', formData);
      setImportResult(r.data);
      load();
    } catch (err) {
      setImportResult({ error: err.response?.data?.detail || 'Import failed' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <AdminLayout title="Panchangam Management">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#8D6E63]">{filteredItems.length} of {items.length} entries</p>
          {monthOptions.length > 1 && (
            <select
              value={monthFilter}
              onChange={e => { setMonthFilter(e.target.value); setPage(0); }}
              className="h-9 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#2D1B0E] focus:border-[#C43E00] outline-none"
              data-testid="panchangam-month-filter"
            >
              <option value="">All months</option>
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} data-testid="panchangam-import-input" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#C43E00] text-[#C43E00] text-sm rounded-full disabled:opacity-50"
            data-testid="panchangam-import-btn"
          >
            <Upload className="h-4 w-4" /> {importing ? 'Importing...' : 'Upload Excel/CSV'}
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full" data-testid="add-panchangam-btn"><Plus className="h-4 w-4" /> Add Entry</button>
        </div>
      </div>

      <p className="text-xs text-[#8D6E63] mb-4">
        Bulk-load a full year at once. Expected columns: <code className="bg-[#F5EDE0] px-1 rounded">gregorian_date, weekday, telugu_masamu, pakshamu, suryodayam, suryasthamayam, festivals_or_notes, tithi_tithi_name_english, tithi_tithi_name_telugu, tithi_source_text, nakshatra_nakshatra_name_english, nakshatra_nakshatra_name_telugu, nakshatra_source_text, varjyam_source_text</code>. Existing entries for the same date are updated in place.
      </p>

      {importResult && (
        <div className={`border rounded-xl p-4 mb-6 text-sm ${importResult.error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`} data-testid="panchangam-import-result">
          {importResult.error ? (
            <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /> {importResult.error}</p>
          ) : (
            <>
              <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 shrink-0" /> {importResult.imported} created, {importResult.updated} updated out of {importResult.total_rows} rows.</p>
              {importResult.errors?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">{importResult.errors.length} row(s) skipped - click for details</summary>
                  <ul className="mt-1 text-xs list-disc list-inside space-y-0.5">
                    {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      )}

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
        <>
          <div className="space-y-3">
            {pagedItems.map(p => (
              <div key={p.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={`panchangam-row-${p.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-[#2D1B0E] text-sm">{p.date}</h3>
                    <p className="text-xs text-[#8D6E63] mt-1">{p.tithi} &middot; {p.nakshatra}{p.special_note ? ` · ${p.special_note}` : ''}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-[#8D6E63] hover:text-[#C43E00]"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-[#8D6E63] hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6" data-testid="panchangam-pagination">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-full border border-[#E6DCCA] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C43E00]" data-testid="panchangam-prev-page">
                <ChevronLeft className="h-4 w-4 text-[#621B00]" />
              </button>
              <span className="text-sm text-[#8D6E63]">Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-full border border-[#E6DCCA] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C43E00]" data-testid="panchangam-next-page">
                <ChevronRight className="h-4 w-4 text-[#621B00]" />
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
