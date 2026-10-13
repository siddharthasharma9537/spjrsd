import { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, X, Pin, Send, CalendarClock, FileText, Undo2 } from 'lucide-react';

const EMPTY_FORM = {
  event_name: '', event_name_telugu: '', title: '', title_telugu: '', content: '', content_telugu: '',
  image_url: '', is_pinned: false, active_flag: true, also_show_in_ticker: false,
  post_to_facebook: true, post_to_google: true, post_to_instagram: true, note: '',
};
const EDITABLE = Object.keys(EMPTY_FORM);

// All times are shown and entered in India time, 24-hour, whatever the browser's timezone.
const IST = 'Asia/Kolkata';
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function istParts(iso) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hh: parts.hour, mm: parts.minute };
}
const fromIstParts = ({ date, hh, mm }) => `${date}T${hh}:${mm}:00+05:30`;
const fmtIst = (iso) => iso ? new Intl.DateTimeFormat('en-IN', {
  timeZone: IST, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date(iso)) : '';
// A sensible default for a new schedule: tomorrow 06:05.
const tomorrowMorning = () => ({ ...istParts(new Date(Date.now() + 86400000).toISOString()), hh: '06', mm: '05' });

const isJpeg = (url) => /\.jpe?g$/i.test((url || '').split('?')[0]);
const statusOf = (p) => {
  if (p.is_draft) return 'draft';
  if (p.syndication_pending && p.publish_at && new Date(p.publish_at) > new Date()) return 'scheduled';
  return 'published';
};
const errorText = (err) => err?.response?.data?.detail || 'Something went wrong. Please try again.';

function DateTimePicker({ value, onChange, testid }) {
  const sel = 'h-9 px-2 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#2D1B0E]';
  const timeSel = 'h-9 w-14 pl-2 pr-0 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#2D1B0E]';
  return (
    <div className="flex items-center gap-1.5 flex-wrap" data-testid={testid}>
      <input type="date" className={sel} value={value.date} onChange={e => onChange({ ...value, date: e.target.value })} aria-label="Date" />
      {/* HH : MM IST wraps as one unit, so the minute never ends up alone on the next line. */}
      <span className="flex items-center gap-1 whitespace-nowrap">
        <select className={timeSel} value={value.hh} onChange={e => onChange({ ...value, hh: e.target.value })} aria-label="Hour (HH)">
          {HOURS.map(h => <option key={h}>{h}</option>)}
        </select>
        <span className="text-[#8D6E63]">:</span>
        <select className={timeSel} value={value.mm} onChange={e => onChange({ ...value, mm: e.target.value })} aria-label="Minute (MM)">
          {MINUTES.map(m => <option key={m}>{m}</option>)}
        </select>
        <span className="text-xs text-[#8D6E63] ml-0.5">IST</span>
      </span>
    </div>
  );
}

function Channels({ post, onToggle }) {
  const igOk = isJpeg(post.image_url);
  const item = (key, label, disabled, title) => (
    <label key={key} className={`flex items-center gap-1 text-xs ${disabled ? 'text-[#BCAAA4]' : 'text-[#5D4037]'}`} title={title}>
      <input type="checkbox" checked={!disabled && post[key] !== false} disabled={disabled} onChange={e => onToggle(key, e.target.checked)} /> {label}
    </label>
  );
  return (
    <div className="flex flex-col gap-1">
      {item('post_to_facebook', 'Facebook')}
      {item('post_to_google', 'Google')}
      {item('post_to_instagram', 'Instagram', !igOk, igOk ? '' : 'Instagram needs a JPEG image')}
    </div>
  );
}

// Inline "goes live" editor for a scheduled row: saves itself shortly after a change.
function ScheduleCell({ post, onSaved }) {
  const [value, setValue] = useState(istParts(post.publish_at));
  const [state, setState] = useState('');
  const timer = useRef(null);
  const change = (v) => {
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setState('Saving…');
      try {
        await api.post(`/admin/live-blog/${post.id}/schedule`, { publish_at: fromIstParts(v) });
        setState('Saved ✓');
        onSaved();
      } catch (err) {
        setState(errorText(err));
      }
    }, 800);
  };
  return (
    <div>
      <DateTimePicker value={value} onChange={change} testid={`schedule-picker-${post.id}`} />
      {state && <p className={`text-xs mt-1 ${state.startsWith('Sav') ? 'text-green-700' : 'text-red-600'}`}>{state}</p>}
    </div>
  );
}

function NoteCell({ post, onSave }) {
  const [note, setNote] = useState(post.note || '');
  return (
    <input className="w-full h-9 px-2 bg-white border border-[#E6DCCA] rounded-lg text-sm" value={note} placeholder="What is this post about?"
      onChange={e => setNote(e.target.value)} onBlur={() => note !== (post.note || '') && onSave(note)} data-testid={`note-${post.id}`} />
  );
}

// Scheduled / Drafts table columns: drag a heading's right edge to resize.
// Widths are remembered in this browser; the table scrolls sideways when wider than the screen.
const COLUMN_WIDTHS = [56, 300, 200, 120, 220, 150];
const MIN_COLUMN_WIDTH = 48;
const WIDTHS_KEY = 'admin-live-blog-column-widths';

function useColumnWidths() {
  const [widths, setWidths] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WIDTHS_KEY));
      if (Array.isArray(saved) && saved.length === COLUMN_WIDTHS.length) return saved;
    } catch { /* fall back to defaults */ }
    return COLUMN_WIDTHS;
  });
  const startResize = (index, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = widths[index];
    let latest = widths;
    const move = (ev) => {
      latest = widths.map((w, i) => i === index ? Math.max(MIN_COLUMN_WIDTH, startWidth + ev.clientX - startX) : w);
      setWidths(latest);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      try { localStorage.setItem(WIDTHS_KEY, JSON.stringify(latest)); } catch { /* not saved; fine */ }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const reset = () => {
    setWidths(COLUMN_WIDTHS);
    try { localStorage.removeItem(WIDTHS_KEY); } catch { /* ignore */ }
  };
  return { widths, startResize, reset };
}

export default function AdminLiveBlog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('published');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState(tomorrowMorning());
  const [schedulingDraft, setSchedulingDraft] = useState(null);
  const columns = useColumnWidths();

  const load = () => api.get('/admin/live-blog').then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const byTab = {
    published: items.filter(p => statusOf(p) === 'published'),
    scheduled: items.filter(p => statusOf(p) === 'scheduled').sort((a, b) => a.publish_at.localeCompare(b.publish_at)),
    draft: items.filter(p => statusOf(p) === 'draft')
      .sort((a, b) => (b.updated_at || b.posted_at).localeCompare(a.updated_at || a.posted_at)),
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(false); setFormError(''); setScheduleOpen(false); };
  const openNew = () => { resetForm(); setScheduleValue(tomorrowMorning()); setShowForm(true); };
  const handleEdit = (p) => {
    setForm(Object.fromEntries(EDITABLE.map(k => [k, p[k] ?? EMPTY_FORM[k]])));
    setEditing(p); setFormError(''); setScheduleOpen(false); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const run = async (fn) => {
    setFormError('');
    try { await fn(); resetForm(); load(); } catch (err) { setFormError(errorText(err)); }
  };

  const create = (mode) => run(async () => {
    const body = { ...form, mode };
    if (!isJpeg(form.image_url)) body.post_to_instagram = false;
    if (mode === 'schedule') body.publish_at = fromIstParts(scheduleValue);
    try {
      await api.post('/admin/live-blog', body);
    } catch (err) {
      if (mode === 'schedule' && err?.response?.status === 400 && /passed/.test(errorText(err))
        && window.confirm('This time has already passed. Publish now instead?')) {
        await api.post('/admin/live-blog', { ...body, mode: 'publish', publish_at: null });
      } else {
        throw err;
      }
    }
  });

  const saveEdit = (e) => {
    e.preventDefault();
    run(() => api.put(`/admin/live-blog/${editing.id}`, form));
  };

  const update = async (id, fields) => { await api.put(`/admin/live-blog/${id}`, fields); load(); };
  const act = async (fn, question) => {
    if (question && !window.confirm(question)) return;
    try { await fn(); } catch (err) { window.alert(errorText(err)); }
    load();
  };
  const publishNow = (p) => act(() => api.post(`/admin/live-blog/${p.id}/publish-now`),
    `Publish "${p.title}" now? It goes live on the website and is shared to the ticked channels immediately.`);
  const moveToDraft = (p) => act(() => api.post(`/admin/live-blog/${p.id}/move-to-draft`),
    `Cancel the schedule for "${p.title}" and move it to Drafts?`);
  const remove = (p) => act(() => api.delete(`/admin/live-blog/${p.id}`), `Delete "${p.title}"? This cannot be undone.`);
  const scheduleDraft = async (p) => {
    try {
      await api.post(`/admin/live-blog/${p.id}/schedule`, { publish_at: fromIstParts(scheduleValue) });
      setSchedulingDraft(null); load();
    } catch (err) {
      if (err?.response?.status === 400 && /passed/.test(errorText(err))) {
        setSchedulingDraft(null); publishNow(p);
      } else {
        window.alert(errorText(err));
      }
    }
  };

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";
  const label = "block text-xs font-medium text-[#5D4037] mb-1";
  const btn = "inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full";
  const iconBtn = "p-1.5 text-[#8D6E63] hover:text-[#C43E00]";
  const igOk = isJpeg(form.image_url);
  const editingStatus = editing ? statusOf(editing) : null;
  const tabs = [['published', 'Published'], ['scheduled', 'Scheduled'], ['draft', 'Drafts']];

  const postCell = (p) => (
    <div className="flex items-center gap-3">
      {p.image_url ? <img src={p.image_url} alt="" className="w-14 h-11 shrink-0 object-cover rounded-md border border-[#E6DCCA]" />
        : <div className="w-14 h-11 shrink-0 rounded-md bg-[#F5EFE3]" />}
      <div>
        <p className="text-sm font-medium text-[#2D1B0E] leading-snug">{p.title}</p>
        <p className="text-xs text-[#8D6E63]">{p.event_name}</p>
      </div>
    </div>
  );
  const channelsCell = (p) => <Channels post={p} onToggle={(k, v) => update(p.id, { [k]: v })} />;
  const th = "relative text-left text-xs font-medium text-[#8D6E63] px-3 py-2 whitespace-nowrap overflow-hidden";
  const td = "px-3 py-3 align-top overflow-hidden";
  const headings = ['S.No', 'Post', tab === 'scheduled' ? 'Goes live (IST)' : 'Last edited', 'Share to', 'Note', 'Actions'];
  const tableWidth = columns.widths.reduce((a, b) => a + b, 0);

  return (
    <AdminLayout title="Live Blog Management">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="inline-flex bg-white border border-[#E6DCCA] rounded-full p-1" role="tablist">
          {tabs.map(([key, name]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} data-testid={`live-blog-tab-${key}`}
              className={`px-4 py-1.5 text-sm rounded-full ${tab === key ? 'bg-[#C43E00] text-white' : 'text-[#5D4037]'}`}>
              {name} <span className={tab === key ? 'text-white/80' : 'text-[#8D6E63]'}>({byTab[key].length})</span>
            </button>
          ))}
        </div>
        <button onClick={openNew} className={`${btn} bg-[#C43E00] text-white`} data-testid="add-live-blog-btn"><Plus className="h-4 w-4" /> Add Post</button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="live-blog-form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-english-heading text-lg text-[#621B00]">
              {editing ? `Edit ${editingStatus === 'published' ? 'post' : editingStatus === 'scheduled' ? 'scheduled post' : 'draft'}` : 'New Post'}
            </h2>
            <button onClick={resetForm}><X className="h-5 w-5 text-[#8D6E63]" /></button>
          </div>
          <form onSubmit={editing ? saveEdit : (e) => { e.preventDefault(); create('publish'); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={label}>Event Name</label><input className={inputCls} value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} required data-testid="live-blog-event-input" /></div>
              <div><label className={label}>Event Name (Telugu)</label><input className={inputCls} value={form.event_name_telugu} onChange={e => setForm({ ...form, event_name_telugu: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={label}>Title (English)</label><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required data-testid="live-blog-title-input" /></div>
              <div><label className={label}>Title (Telugu)</label><input className={inputCls} value={form.title_telugu} onChange={e => setForm({ ...form, title_telugu: e.target.value })} /></div>
            </div>
            <div><label className={label}>Content (English)</label><textarea className={`${inputCls} h-24 py-2`} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required /></div>
            <div><label className={label}>Content (Telugu)</label><textarea className={`${inputCls} h-24 py-2`} value={form.content_telugu} onChange={e => setForm({ ...form, content_telugu: e.target.value })} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={label}>Image URL</label><input className={inputCls} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://…/poster.jpg" /></div>
              <div><label className={label}>Note (staff only, never shown publicly)</label><input className={inputCls} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="e.g. Day 3 – Annapurna" data-testid="live-blog-note-input" /></div>
            </div>

            {editingStatus !== 'published' && (
              <div className="border border-[#E6DCCA] rounded-lg p-3">
                <p className="text-xs font-medium text-[#5D4037] mb-2">Share to</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.post_to_facebook} onChange={e => setForm({ ...form, post_to_facebook: e.target.checked })} data-testid="live-blog-fb-checkbox" /> Facebook</label>
                  <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.post_to_google} onChange={e => setForm({ ...form, post_to_google: e.target.checked })} data-testid="live-blog-google-checkbox" /> Google Business Profile</label>
                  <label className={`flex items-center gap-2 text-sm ${igOk ? 'text-[#5D4037]' : 'text-[#BCAAA4]'}`} title={igOk ? '' : 'Instagram needs a JPEG image (.jpg / .jpeg)'}>
                    <input type="checkbox" checked={igOk && form.post_to_instagram} disabled={!igOk} onChange={e => setForm({ ...form, post_to_instagram: e.target.checked })} data-testid="live-blog-ig-checkbox" /> Instagram
                    {!igOk && <span className="text-xs">(needs a JPEG image)</span>}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.also_show_in_ticker} onChange={e => setForm({ ...form, also_show_in_ticker: e.target.checked })} data-testid="live-blog-ticker-checkbox" /> Also show in News</label>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} /> Pinned</label>
              <label className="flex items-center gap-2 text-sm text-[#5D4037]"><input type="checkbox" checked={form.active_flag} onChange={e => setForm({ ...form, active_flag: e.target.checked })} /> Active</label>
            </div>

            {!editing && scheduleOpen && (
              <div className="bg-[#FFF8EC] border border-[#E6DCCA] rounded-lg p-3">
                <p className="text-xs font-medium text-[#5D4037] mb-2">Goes live on</p>
                <DateTimePicker value={scheduleValue} onChange={setScheduleValue} testid="new-post-schedule-picker" />
              </div>
            )}
            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex justify-end gap-3 flex-wrap">
              <button type="button" onClick={resetForm} className={`${btn} border border-[#E6DCCA]`}>Cancel</button>
              {editing ? (
                <button type="submit" className={`${btn} bg-[#C43E00] text-white`} data-testid="live-blog-submit-btn">Save changes</button>
              ) : (
                <>
                  <button type="button" onClick={() => create('draft')} className={`${btn} border border-[#C43E00] text-[#C43E00]`} data-testid="live-blog-draft-btn"><FileText className="h-4 w-4" /> Save as draft</button>
                  {scheduleOpen ? (
                    <button type="button" onClick={() => create('schedule')} className={`${btn} border border-[#C43E00] text-[#C43E00]`} data-testid="live-blog-schedule-btn"><CalendarClock className="h-4 w-4" /> Confirm schedule</button>
                  ) : (
                    <button type="button" onClick={() => setScheduleOpen(true)} className={`${btn} border border-[#C43E00] text-[#C43E00]`} data-testid="live-blog-schedule-btn"><CalendarClock className="h-4 w-4" /> Schedule…</button>
                  )}
                  <button type="submit" className={`${btn} bg-[#C43E00] text-white`} data-testid="live-blog-submit-btn"><Send className="h-4 w-4" /> Publish now</button>
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : tab === 'published' ? (
        <div className="space-y-3">
          {byTab.published.length === 0 && <p className="text-sm text-[#8D6E63]">No published posts yet.</p>}
          {byTab.published.map(p => (
            <div key={p.id} className={`bg-white border rounded-xl p-5 ${p.is_pinned ? 'border-[#D4AF37]/40' : 'border-[#E6DCCA]'}`} data-testid={`live-blog-row-${p.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-[#C43E00] uppercase tracking-wide">{p.event_name}</span>
                    {p.is_pinned && <Pin className="h-3 w-3 text-[#D4AF37]" />}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.active_flag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.active_flag ? 'Active' : 'Inactive'}</span>
                    {p.syndication_pending && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">Sharing to channels shortly</span>}
                    <span className="text-xs text-[#8D6E63]">{fmtIst(p.posted_at)}</span>
                  </div>
                  <h3 className="font-medium text-[#2D1B0E] text-sm">{p.title}</h3>
                  <p className="text-xs text-[#8D6E63] line-clamp-1 mt-1">{p.content}</p>
                  {p.note && <p className="text-xs text-[#5D4037] mt-1">Note: {p.note}</p>}
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => handleEdit(p)} className={iconBtn} title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p)} className="p-1.5 text-[#8D6E63] hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
        <div className="bg-white border border-[#E6DCCA] rounded-xl overflow-x-auto">
          <table className="text-sm table-fixed" style={{ width: tableWidth, minWidth: '100%' }} data-testid={`live-blog-table-${tab}`}>
            <colgroup>{columns.widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
            <thead className="border-b border-[#E6DCCA] bg-[#FFFCF5]">
              <tr>
                {headings.map((h, i) => (
                  <th key={i} className={th}>
                    {h}
                    <span onPointerDown={(e) => columns.startResize(i, e)} title="Drag to resize"
                      className="absolute top-0 right-0 h-full w-2 cursor-col-resize border-r-2 border-transparent hover:border-[#C43E00]/50 select-none" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byTab[tab].length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-[#8D6E63]">{tab === 'scheduled' ? 'Nothing scheduled.' : 'No drafts.'}</td></tr>
              )}
              {byTab[tab].map((p, i) => (
                <tr key={p.id} className="border-b border-[#F0E8D8] last:border-0" data-testid={`live-blog-row-${p.id}`}>
                  <td className={`${td} text-[#8D6E63]`}>{i + 1}</td>
                  <td className={td}>{postCell(p)}</td>
                  <td className={td}>
                    {tab === 'scheduled' ? <ScheduleCell key={p.id} post={p} onSaved={load} /> : (
                      schedulingDraft === p.id ? (
                        <div className="space-y-2">
                          <DateTimePicker value={scheduleValue} onChange={setScheduleValue} testid={`draft-schedule-picker-${p.id}`} />
                          <div className="flex gap-2">
                            <button onClick={() => scheduleDraft(p)} className="px-3 py-1 text-xs rounded-full bg-[#C43E00] text-white">Confirm</button>
                            <button onClick={() => setSchedulingDraft(null)} className="px-3 py-1 text-xs rounded-full border border-[#E6DCCA]">Cancel</button>
                          </div>
                        </div>
                      ) : <span className="text-[#5D4037] whitespace-nowrap">{fmtIst(p.updated_at || p.posted_at)}</span>
                    )}
                  </td>
                  <td className={td}>{channelsCell(p)}</td>
                  <td className={td}><NoteCell key={p.note || ''} post={p} onSave={(note) => update(p.id, { note })} /></td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => handleEdit(p)} className={iconBtn} title="Edit"><Pencil className="h-4 w-4" /></button>
                      {tab === 'draft' && (
                        <button onClick={() => { setScheduleValue(tomorrowMorning()); setSchedulingDraft(p.id); }} className={iconBtn} title="Schedule"><CalendarClock className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => publishNow(p)} className={iconBtn} title="Publish now"><Send className="h-4 w-4" /></button>
                      {tab === 'scheduled' && (
                        <button onClick={() => moveToDraft(p)} className={iconBtn} title="Move to drafts"><Undo2 className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => remove(p)} className="p-1.5 text-[#8D6E63] hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={columns.reset} className="mt-2 text-xs text-[#8D6E63] hover:text-[#C43E00]">Reset column widths</button>
        </div>
      )}
    </AdminLayout>
  );
}
