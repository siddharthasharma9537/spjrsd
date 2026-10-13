import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Clock, CheckCircle2, Hand, ChevronLeft, MoreVertical, Send, ListTodo, Trash2, X, Minus, Maximize2, Minimize2, ImagePlus, Loader2 } from 'lucide-react';

// Staff to-do: a round button floating in the bottom-right corner of every
// admin page, opening a small box that works like a chat. The list of tasks;
// tap one to open its conversation. The person assigned can
// tap Working on it / Completed / Need help, or just type a note and send.
// "Need help" flags the task for the EO (and emails them).
const QUICK_REPLIES = [
  { status: 'in_progress', label: 'Working on it', te: 'పని జరుగుతోంది', icon: Clock },
  { status: 'completed', label: 'Completed', te: 'పూర్తయింది', icon: CheckCircle2 },
  { status: 'need_help', label: 'Need help', te: 'సహాయం కావాలి', icon: Hand },
];
const STATUS = {
  open: ['New', 'bg-[#F5EFE3] text-[#5D4037]', 'bg-[#BCAAA4]'],
  in_progress: ['Working on it', 'bg-amber-100 text-amber-800', 'bg-amber-500'],
  completed: ['Completed', 'bg-green-100 text-green-800', 'bg-green-600'],
  need_help: ['Need help', 'bg-red-100 text-red-700', 'bg-red-600'],
};

const todayIst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtWhen = (iso) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date(iso));
const assigneeName = (t) => t.assigned_user_name || t.assigned_role || 'Not assigned';
const errorText = (err) => err?.response?.data?.detail || 'Something went wrong. Please try again.';
const field = "w-full h-8 px-2 bg-white border border-[#E6DCCA] rounded-md text-sm text-[#2D1B0E] focus:border-[#C43E00] outline-none";

const assigneeBody = (v) => v.startsWith('user:') ? { assigned_user_id: v.slice(5), assigned_role: null }
  : v.startsWith('role:') ? { assigned_user_id: null, assigned_role: v.slice(5) } : { assigned_user_id: null, assigned_role: null };
const assigneeValue = (t) => t.assigned_user_id ? `user:${t.assigned_user_id}` : t.assigned_role ? `role:${t.assigned_role}` : '';

function AssigneeSelect({ value, onChange, people }) {
  return (
    <select className={field} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Not assigned</option>
      <optgroup label="Person">
        {people.users.map(u => <option key={u.id} value={`user:${u.id}`}>{u.name} ({u.role})</option>)}
      </optgroup>
      <optgroup label="Everyone in a role">
        {people.roles.map(r => <option key={r} value={`role:${r}`}>{r}</option>)}
      </optgroup>
    </select>
  );
}

const FILTERS = [['active', 'Active'], ['need_help', 'Need help'], ['completed', 'Completed'], ['all', 'All']];
const EMPTY = { active: 'Nothing pending 🙏', need_help: 'Nobody needs help right now.', completed: 'Nothing completed yet.', all: 'No tasks yet.' };

function TaskList({ tasks, onOpen, filter, setFilter }) {
  const groups = {
    active: tasks.filter(t => t.status !== 'completed'),
    need_help: tasks.filter(t => t.status === 'need_help'),
    completed: tasks.filter(t => t.status === 'completed'),
    all: tasks,
  };
  const shown = groups[filter];
  const row = (t) => {
    const isNew = t.is_mine ? t.new_for_assignee : t.new_for_managers;
    const flagged = t.needs_attention && !t.is_mine;
    const overdue = t.due_date && t.status !== 'completed' && t.due_date < todayIst();
    return (
      <li key={t.id}>
        <button onClick={() => onOpen(t.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#FFF8EC] ${flagged ? 'bg-red-50/60' : ''}`} data-testid={`task-${t.id}`}>
          {flagged ? <Hand className="h-3.5 w-3.5 text-red-600 shrink-0" />
            : <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS[t.status][2]}`} title={STATUS[t.status][0]} />}
          <span className="flex-1 min-w-0">
            <span className={`block text-sm truncate ${t.status === 'completed' ? 'text-[#8D6E63] line-through' : 'text-[#2D1B0E]'} ${isNew ? 'font-semibold' : ''}`}>{t.title}</span>
            <span className="block text-[11px] text-[#8D6E63] truncate">
              {t.is_mine ? 'For you' : assigneeName(t)}
              {t.due_date && <> · <span className={overdue ? 'text-red-600' : ''}>{overdue ? 'Overdue ' : 'Due '}{shortDate(t.due_date)}</span></>}
            </span>
          </span>
          {isNew && <span className="h-2 w-2 rounded-full bg-[#C43E00] shrink-0" aria-label="New message" />}
        </button>
      </li>
    );
  };
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 flex gap-1.5 px-2 py-2 border-b border-[#F0E8D8] bg-[#FFFCF5] overflow-x-auto" role="tablist">
        {FILTERS.map(([key, label]) => {
          const selected = filter === key;
          const count = groups[key].length;
          return (
            <button key={key} role="tab" aria-selected={selected} onClick={() => setFilter(key)} data-testid={`tasks-filter-${key}`}
              className={`flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full border text-xs whitespace-nowrap transition-colors ${
                selected ? 'bg-[#C43E00] border-[#C43E00] text-white shadow-sm' : 'bg-white border-[#E6DCCA] text-[#5D4037] hover:border-[#C43E00]'}`}>
              {label}
              <span className={`min-w-[1.25rem] px-1 rounded-full text-[11px] leading-[1.25rem] text-center ${
                selected ? 'bg-white/25 text-white' : key === 'need_help' && count > 0 ? 'bg-red-600 text-white' : 'bg-[#F5EFE3] text-[#8D6E63]'}`}>{count}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 && <p className="px-3 py-6 text-center text-sm text-[#8D6E63]">{EMPTY[filter]}</p>}
      <ul className="divide-y divide-[#F0E8D8]">{shown.map(row)}</ul>
    </div>
  );
}

function AddTask({ people, onDone, onCancel }) {
  const [form, setForm] = useState({ title: '', due_date: '', assignee: '', details: '' });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/tasks', { title: form.title, details: form.details, due_date: form.due_date || null, ...assigneeBody(form.assignee) });
      onDone();
    } catch (err) { setError(errorText(err)); }
  };
  return (
    <form onSubmit={submit} className="flex-1 overflow-y-auto p-3 space-y-2">
      <input className={field} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" required autoFocus data-testid="task-title-input" />
      <AssigneeSelect value={form.assignee} people={people} onChange={v => setForm({ ...form, assignee: v })} />
      <label className="flex items-center gap-2 text-xs text-[#5D4037]">Due
        <input type="date" className={field} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
      </label>
      <textarea className={`${field} h-16 py-1.5`} value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Details (optional)" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs rounded-full border border-[#E6DCCA]">Cancel</button>
        <button type="submit" className="px-3 py-1.5 text-xs rounded-full bg-[#C43E00] text-white">Add task</button>
      </div>
    </form>
  );
}

// Photos are shrunk in the browser before upload (long side 1600px, JPEG), so
// phone pictures upload quickly and storage stays small.
const MAX_IMAGES = 4;
const MAX_SIDE = 1600;
async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'image.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

function TaskChat({ task, me, perms, people, onChanged }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(false);
  const [pending, setPending] = useState([]); // [{ file, preview }]
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);
  const picker = useRef(null);
  const scroller = useRef(null);
  // Pictures finish loading after the scroll to the newest message; follow them
  // down only if the reader is already near the bottom.
  const keepAtBottom = () => {
    const c = scroller.current;
    if (c && c.scrollHeight - c.scrollTop - c.clientHeight < 250) bottom.current?.scrollIntoView({ block: 'end' });
  };
  const manager = perms.can_edit && !task.is_mine;
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [task.thread?.length]);

  const addImages = (files) => {
    const images = [...files].filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    setError('');
    setPending(prev => {
      const room = MAX_IMAGES - prev.length;
      if (images.length > room) setError(`Up to ${MAX_IMAGES} images per message.`);
      return [...prev, ...images.slice(0, Math.max(0, room)).map(file => ({ file, preview: URL.createObjectURL(file) }))];
    });
  };
  const removeImage = (i) => setPending(prev => {
    URL.revokeObjectURL(prev[i].preview);
    return prev.filter((_, j) => j !== i);
  });
  const uploadPending = async () => {
    const urls = [];
    for (const { file } of pending) {
      const body = new FormData();
      body.append('file', await shrinkImage(file));
      urls.push((await api.post(`/admin/tasks/${task.id}/images`, body)).data.url);
    }
    return urls;
  };
  const run = async (fn) => {
    setError('');
    setSending(true);
    try {
      await fn();
      setText('');
      pending.forEach(p => URL.revokeObjectURL(p.preview));
      setPending([]);
      onChanged();
    } catch (err) { setError(errorText(err)); }
    setSending(false);
  };
  const canSend = (text.trim() || pending.length) && !sending;
  const sendNote = () => canSend && run(async () => {
    const images = await uploadPending();
    await api.post(`/admin/tasks/${task.id}/messages`, { text, images });
  });
  const quick = (r) => {
    if (sending) return;
    if (r.status === 'need_help' && !text.trim()) { setError('Type what help you need, then tap Need help.'); return; }
    run(async () => {
      const images = await uploadPending();
      await api.post(`/admin/tasks/${task.id}/status`, { status: r.status, text, images });
    });
  };

  return (
    <>
      <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-[#FFFCF5]"
        onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}>
        <p className="text-center text-[11px] text-[#8D6E63]">
          {task.created_by_name} added this · {fmtWhen(task.created_at)}
          {task.due_date && <> · due {shortDate(task.due_date)}</>}
        </p>
        {task.details && <p className="mx-auto max-w-[90%] text-center text-xs text-[#5D4037] bg-white border border-[#F0E8D8] rounded-lg px-2 py-1.5 whitespace-pre-line">{task.details}</p>}
        {(task.thread || []).map(m => {
          if (m.kind === 'change' || (m.kind === 'status' && !m.text && !m.images?.length)) {
            return (
              <p key={m.id} className="text-center text-[11px] text-[#8D6E63]">
                {m.by_name} · {m.kind === 'change' ? m.text : STATUS[m.status][0]} · {fmtWhen(m.at)}
              </p>
            );
          }
          const mine = m.by_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${mine ? 'bg-[#C43E00] text-white rounded-br-sm' : 'bg-white border border-[#E6DCCA] text-[#2D1B0E] rounded-bl-sm'}`}>
                {!mine && <p className="text-[11px] font-medium text-[#8D6E63]">{m.by_name}</p>}
                {m.status && <p className={`text-[11px] font-medium ${mine ? 'text-white/80' : 'text-red-600'}`}>{STATUS[m.status][0]}</p>}
                {m.images?.length > 0 && (
                  <div className={`grid gap-1 my-1 ${m.images.length > 1 ? 'grid-cols-2' : ''}`}>
                    {m.images.map(url => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" title="Open full size">
                        <img src={url} alt="Attached" onLoad={keepAtBottom} className="w-full max-h-40 object-cover rounded-lg" />
                      </a>
                    ))}
                  </div>
                )}
                {m.text && <p className="whitespace-pre-line">{m.text}</p>}
                <p className={`text-[10px] text-right ${mine ? 'text-white/70' : 'text-[#BCAAA4]'}`}>{fmtWhen(m.at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {manager && menu && (
        <div className="border-t border-[#E6DCCA] p-3 space-y-2 bg-white">
          {task.status !== 'completed' && (
            <button onClick={() => window.confirm(`Mark "${task.title}" as completed?`) && run(() => api.post(`/admin/tasks/${task.id}/status`, { status: 'completed', text: '' }))}
              className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800" data-testid="task-mark-completed">
              <CheckCircle2 className="h-4 w-4" /> Mark completed
            </button>
          )}
          <label className="flex items-center gap-2 text-xs text-[#5D4037]">Due
            <input type="date" className={field} value={task.due_date || ''} onChange={e => run(() => api.put(`/admin/tasks/${task.id}`, { due_date: e.target.value || null }))} />
          </label>
          <AssigneeSelect value={assigneeValue(task)} people={people} onChange={v => run(() => api.put(`/admin/tasks/${task.id}`, assigneeBody(v)))} />
          {perms.can_delete && (
            <button onClick={() => window.confirm(`Delete the task "${task.title}"?`) && run(() => api.delete(`/admin/tasks/${task.id}`))}
              className="flex items-center gap-1 text-xs text-[#8D6E63] hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /> Delete task</button>
          )}
        </div>
      )}

      <div className="border-t border-[#E6DCCA] p-2 space-y-1.5 bg-white">
        {task.is_mine && (
          <div className="flex gap-1.5">
            {QUICK_REPLIES.map(r => (
              <button key={r.status} onClick={() => quick(r)} title={r.te}
                className={`flex-1 flex flex-col items-center px-1 py-1 rounded-lg border text-[11px] leading-tight ${task.status === r.status ? 'border-[#C43E00] bg-[#FFF3E0]' : 'border-[#E6DCCA] hover:border-[#C43E00]'}`}
                data-testid={`task-reply-${r.status}`}>
                <span className="flex items-center gap-1 text-[#2D1B0E]"><r.icon className={`h-3.5 w-3.5 ${r.status === 'need_help' ? 'text-red-600' : 'text-[#C43E00]'}`} />{r.label}</span>
                <span className="text-[10px] text-[#8D6E63]">{r.te}</span>
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-[11px] text-red-600 px-1">{error}</p>}
        {pending.length > 0 && (
          <div className="flex gap-1.5 px-1" data-testid="task-pending-images">
            {pending.map((p, i) => (
              <span key={p.preview} className="relative">
                <img src={p.preview} alt="To send" className="h-12 w-12 object-cover rounded-md border border-[#E6DCCA]" />
                <button onClick={() => removeImage(i)} aria-label="Remove image"
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#2D1B0E] text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <input ref={picker} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { addImages(e.target.files); e.target.value = ''; }} data-testid="task-image-input" />
          <button onClick={() => picker.current?.click()} aria-label="Add image" title="Add image (or paste a screenshot)"
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full text-[#8D6E63] hover:text-[#C43E00] hover:bg-[#FFF3E0]" data-testid="task-add-image">
            <ImagePlus className="h-5 w-5" />
          </button>
          <textarea rows={1} className="flex-1 resize-none max-h-20 px-3 py-1.5 bg-[#FFFCF5] border border-[#E6DCCA] rounded-2xl text-sm outline-none focus:border-[#C43E00]"
            value={text} onChange={e => setText(e.target.value)} placeholder={task.is_mine ? 'Note / Say something · ఏదైనా చెప్పండి' : 'Reply…'}
            onPaste={e => { if ([...e.clipboardData.files].some(f => f.type.startsWith('image/'))) { e.preventDefault(); addImages(e.clipboardData.files); } }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNote(); } }} data-testid="task-message-input" />
          <button onClick={sendNote} disabled={!canSend} aria-label="Send" className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-[#C43E00] text-white disabled:opacity-40">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {manager && (
        <button onClick={() => setMenu(!menu)} aria-label="Task options" className="absolute top-2.5 right-[4.25rem] p-1 text-[#FFE0B2]/80 hover:text-white" data-testid="task-options">
          <MoreVertical className="h-4 w-4" />
        </button>
      )}
    </>
  );
}

const OPEN_KEY = 'admin-tasks-open';
const BIG_KEY = 'admin-tasks-maximised';
const REFRESH_MS = 60000;

export default function TasksWidget() {
  const [data, setData] = useState(null);
  const [people, setPeople] = useState({ users: [], roles: [] });
  const [view, setView] = useState('list'); // 'list' | 'add' | task id
  const [filter, setFilter] = useState('active');
  const [panelOpen, setPanelOpen] = useState(() => {
    try { return sessionStorage.getItem(OPEN_KEY) === 'true'; } catch { return false; }
  });
  const [big, setBig] = useState(() => {
    try { return sessionStorage.getItem(BIG_KEY) === 'true'; } catch { return false; }
  });
  const { user } = useAuth();
  const widget = useRef(null);

  const load = () => api.get('/admin/tasks').then(r => setData(r.data)).catch(() => setData(d => d || { tasks: [] }));
  useEffect(() => {
    load();
    // Picks up new tasks and replies while staff stay on one screen.
    const timer = setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (data?.can_create) api.get('/admin/tasks/assignees').then(r => setPeople(r.data)).catch(() => {});
  }, [data?.can_create]);

  const minimise = () => {
    setPanelOpen(false);
    try { sessionStorage.setItem(OPEN_KEY, 'false'); } catch { /* fine */ }
  };
  // A tap or click anywhere outside the box tucks it back into the corner.
  // The box stays mounted while minimised, so a half-typed message is kept.
  useEffect(() => {
    if (!panelOpen) return undefined;
    const onDown = (e) => { if (widget.current && !widget.current.contains(e.target)) minimise(); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [panelOpen]);

  if (!data) return null;
  const openTask = data.tasks.find(t => t.id === view);
  const attention = data.tasks.filter(t => t.needs_attention && !t.is_mine).length;
  const unread = data.tasks.filter(t => t.is_mine ? t.new_for_assignee : t.new_for_managers).length;
  const open = (id) => {
    setView(id);
    const t = data.tasks.find(x => x.id === id);
    if (t && (t.is_mine ? t.new_for_assignee : t.new_for_managers)) api.post(`/admin/tasks/${id}/seen`).then(load);
  };
  const togglePanel = () => {
    const next = !panelOpen;
    setPanelOpen(next);
    if (next) load();
    // Stays open while moving between admin screens, until closed.
    try { sessionStorage.setItem(OPEN_KEY, String(next)); } catch { /* fine */ }
  };
  const toggleBig = () => {
    setBig(!big);
    try { sessionStorage.setItem(BIG_KEY, String(!big)); } catch { /* fine */ }
  };

  return (
    <div ref={widget} className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3" data-testid="tasks-widget">
      {(
        <section className={`relative ${panelOpen ? 'flex' : 'hidden'} flex-col ${big ? 'w-[min(48rem,calc(100vw-2rem))] h-[calc(100vh-6rem)]' : 'w-[min(24rem,calc(100vw-2rem))] h-[min(26rem,calc(100vh-6rem))]'} bg-white border border-[#E6DCCA] rounded-xl overflow-hidden shadow-2xl transition-all duration-200`} data-testid="tasks-card">
          <header className="flex items-center gap-2 px-3 py-2.5 bg-[#2D1B0E] text-[#FFE0B2]">
            {openTask ? (
              <>
                <button onClick={() => setView('list')} aria-label="Back to tasks" className="p-0.5 -ml-1 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
                <span className="flex-1 min-w-0 pr-7">
                  <span className="block text-sm font-medium truncate text-white">{openTask.title}</span>
                  <span className="block text-[11px] text-[#FFE0B2]/70 truncate">{openTask.is_mine ? 'For you' : assigneeName(openTask)} · {STATUS[openTask.status][0]}</span>
                </span>
              </>
            ) : (
              <>
                <ListTodo className="h-4 w-4 text-[#D4AF37]" />
                <span className="flex-1 text-sm font-medium text-white">{view === 'add' ? 'New task' : 'Staff To-do'}</span>
                {attention > 0 && view === 'list' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-red-600 text-white" title={`${attention} need your attention`} data-testid="tasks-attention">
                    <Hand className="h-3 w-3" /> {attention}
                  </span>
                )}
                {data.can_create && view === 'list' && (
                  <button onClick={() => setView('add')} aria-label="Add task" className="p-1 rounded-full hover:bg-white/10" data-testid="add-task-btn"><Plus className="h-4 w-4" /></button>
                )}
              </>
            )}
            <button onClick={toggleBig} aria-label={big ? 'Make smaller' : 'Maximise'} title={big ? 'Make smaller' : 'Maximise'} className="p-1 rounded-full hover:bg-white/10" data-testid="tasks-maximise">
              {big ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button onClick={minimise} aria-label="Minimise" title="Minimise" className="p-1 rounded-full hover:bg-white/10" data-testid="tasks-minimise"><Minus className="h-4 w-4" /></button>
          </header>

          {openTask ? <TaskChat task={openTask} me={user?.id} perms={data} people={people} onChanged={load} />
            : view === 'add' ? <AddTask people={people} onDone={() => { setView('list'); load(); }} onCancel={() => setView('list')} />
            : <TaskList tasks={data.tasks} onOpen={open} filter={filter} setFilter={setFilter} />}
        </section>
      )}

      <button onClick={togglePanel} aria-label={panelOpen ? 'Close Staff To-do' : 'Open Staff To-do'} title="Staff To-do"
        className="relative h-14 w-14 rounded-full bg-[#C43E00] text-white shadow-xl flex items-center justify-center hover:bg-[#A33400] transition-colors" data-testid="tasks-launcher">
        {panelOpen ? <X className="h-6 w-6" /> : <ListTodo className="h-6 w-6" />}
        {!panelOpen && attention > 0 && (
          <span className="absolute -top-1 -left-1 flex items-center gap-0.5 px-1.5 h-5 rounded-full bg-red-600 border-2 border-white text-[11px] font-medium" aria-label={`${attention} need your attention`}>
            <Hand className="h-3 w-3" />{attention}
          </span>
        )}
        {!panelOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#D4AF37] border-2 border-white text-[11px] font-semibold text-[#2D1B0E] flex items-center justify-center" aria-label={`${unread} with something new`}>{unread}</span>
        )}
      </button>
    </div>
  );
}
