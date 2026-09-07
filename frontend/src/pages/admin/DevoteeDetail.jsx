import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import EmailReplyModal from './EmailReplyModal';
import api from '@/lib/api';
import { Phone, Mail, ArrowLeft, Flame, BedDouble, HandCoins, MessageSquare, HeartHandshake, Mail as MailIcon, Pencil, Trash2 } from 'lucide-react';

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 mb-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-[#2D1B0E] mb-3">
        <Icon className="h-4 w-4 text-[#C43E00]" /> {title} <span className="text-xs text-[#8D6E63] font-normal">({count})</span>
      </h2>
      {count === 0 ? <p className="text-xs text-[#8D6E63]">None</p> : children}
    </div>
  );
}

export default function AdminDevoteeDetail() {
  const { devoteeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', gotram: '' });
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/admin/devotees/${devoteeId}/activity`).then(r => setData(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [devoteeId]);

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const startEdit = () => {
    setForm({
      name: data.devotee.name || '', mobile: data.devotee.mobile || '',
      email: data.devotee.email || '', gotram: data.devotee.gotram || '',
    });
    setSaveError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.put(`/admin/devotees/${devoteeId}`, form);
      setData(d => ({ ...d, devotee: { ...d.devotee, ...res.data } }));
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${data.devotee.name}'s devotee account? This cannot be undone.`)) return;
    await api.delete(`/admin/devotees/${devoteeId}`);
    navigate('/admin/devotees');
  };

  return (
    <AdminLayout title="Devotee Activity">
      <button onClick={() => navigate('/admin/devotees')} className="inline-flex items-center gap-1 text-sm text-[#5D4037] hover:text-[#C43E00] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Devotee List
      </button>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : loadError || !data ? (
        <p className="text-center py-12 text-[#8D6E63]">Failed to load devotee activity</p>
      ) : (
        <>
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-5 mb-6">
            {editing ? (
              <div className="space-y-3" data-testid="devotee-edit-form">
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#8D6E63] mb-1">Name</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="devotee-edit-name" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8D6E63] mb-1">Mobile</label>
                    <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="devotee-edit-mobile" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8D6E63] mb-1">Email</label>
                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="devotee-edit-email" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8D6E63] mb-1">Gotram</label>
                    <input value={form.gotram} onChange={e => setForm({ ...form, gotram: e.target.value })} className="w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="devotee-edit-gotram" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="px-4 h-9 bg-[#C43E00] text-white text-sm rounded-lg disabled:opacity-50" data-testid="devotee-edit-save">{saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditing(false)} className="px-4 h-9 border border-[#E6DCCA] text-[#5D4037] text-sm rounded-lg" data-testid="devotee-edit-cancel">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-medium text-[#2D1B0E]">{data.devotee.name}</h2>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={startEdit} className="p-1.5 text-[#8D6E63] hover:text-[#C43E00]" title="Edit devotee" data-testid="devotee-edit-btn"><Pencil className="h-4 w-4" /></button>
                    <button onClick={handleDelete} className="p-1.5 text-[#8D6E63] hover:text-red-600" title="Delete devotee" data-testid="devotee-delete-btn"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#5D4037]">
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {data.devotee.mobile}</span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {data.devotee.email || '—'}
                    {data.devotee.email && <button onClick={() => setShowReply(true)} className="text-[#C43E00] hover:underline ml-1" data-testid="devotee-detail-reply">Reply</button>}
                  </span>
                  <span>Gotram: {data.devotee.gotram || '—'}</span>
                  <span className="text-[#8D6E63]">Registered {fmt(data.devotee.created_at)}</span>
                  {data.newsletter_subscribed && <span className="flex items-center gap-1 text-[#2E7D32]"><MailIcon className="h-3.5 w-3.5" /> Newsletter subscriber</span>}
                </div>
              </>
            )}
          </div>

          <Section icon={Flame} title="Seva Bookings" count={data.bookings.length}>
            <div className="space-y-2">
              {data.bookings.map(b => (
                <div key={b.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-booking-${b.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{b.seva_name_english}</span> — {b.for_date}, {b.number_of_persons} person(s), ₹{b.amount} — <span className="text-[#8D6E63]">{b.status} / {b.payment_status}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={BedDouble} title="Accommodation Bookings" count={data.accommodation_bookings.length}>
            <div className="space-y-2">
              {data.accommodation_bookings.map(b => (
                <div key={b.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-accommodation-${b.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{b.accommodation_name}</span> ({b.room_type}) — {b.check_in_date} to {b.check_out_date}, ₹{b.amount} — <span className="text-[#8D6E63]">{b.status} / {b.payment_status}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={HandCoins} title="Donations" count={data.donations.length}>
            <div className="space-y-2">
              {data.donations.map(d => (
                <div key={d.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-donation-${d.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{d.donation_type}</span> — ₹{d.amount} — <span className="text-[#8D6E63]">{d.payment_status}, {fmt(d.created_at)}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={MessageSquare} title="Contact Us Messages" count={data.contact_messages.length}>
            <div className="space-y-2">
              {data.contact_messages.map(m => (
                <div key={m.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-contact-${m.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{m.subject || 'General Inquiry'}</span> — <span className="text-[#8D6E63]">{fmt(m.created_at)}</span>
                  <p className="text-[#5D4037] mt-0.5">{m.message}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={HeartHandshake} title="Volunteer Applications" count={data.volunteer_applications.length}>
            <div className="space-y-2">
              {data.volunteer_applications.map(v => (
                <div key={v.id} className="text-sm border-b border-[#E6DCCA]/50 pb-2 last:border-0" data-testid={`activity-volunteer-${v.id}`}>
                  <span className="font-medium text-[#2D1B0E]">{v.availability || 'Volunteer application'}</span> — <span className="text-[#8D6E63]">{v.status}, {fmt(v.created_at)}</span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {showReply && data && (
        <EmailReplyModal to={data.devotee.email} defaultSubject="" onClose={() => setShowReply(false)} />
      )}
    </AdminLayout>
  );
}
