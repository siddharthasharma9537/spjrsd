import { useState, useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DateInput from '@/components/ui/date-input';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, Users, Gift, Trash2, Plus, Pencil } from 'lucide-react';

const RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'];

export default function MyFamily() {
  const { t, heading } = useT();
  const { logout } = useAuth();
  const uid = useId();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', relation: 'Spouse', occasion_type: 'Birthday', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/devotee/family-members').then(r => setMembers(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: '', relation: 'Spouse', occasion_type: 'Birthday', date: '' }); setEditingId(null); setShowForm(false); };

  const handleEdit = (m) => {
    setForm({ name: m.name, relation: m.relation, occasion_type: m.occasion_type, date: m.date });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) await api.put(`/devotee/family-members/${editingId}`, form);
      else await api.post('/devotee/family-members', form);
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || t('Failed to save', 'సేవ్ చేయడం విఫలమైంది'));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('Remove this family member?', 'ఈ కుటుంబ సభ్యుడిని తీసివేయాలా?'))) return;
    await api.delete(`/devotee/family-members/${id}`);
    load();
  };

  const inputCls = "w-full h-11 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <nav className="bg-[#621B00] text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-[#D4AF37]" />
            <span className="font-english-heading text-sm tracking-wide">SPJR Devasthanams</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/my-bookings" className="hover:text-[#D4AF37]">{t('My Bookings', 'నా బుకింగ్‌లు')}</Link>
            <button onClick={logout} className="text-[#FFE0B2] hover:text-white">{t('Logout', 'లాగ్ అవుట్')}</button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/my-bookings" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to My Bookings', 'నా బుకింగ్‌లకు తిరిగి వెళ్ళండి')}
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-6 w-6 text-[#C43E00]" />
          <h1 className={`${heading} text-2xl text-[#621B00]`} data-testid="my-family-title">{t('My Family', 'నా కుటుంబం')}</h1>
        </div>
        <p className="text-sm text-[#5D4037] mb-6">{t(
          "Add your spouse, children, parents, or other family members' birthdays and wedding anniversaries. We'll send a personalized Aashirvachanam to your registered email on each of their occasions, every year.",
          'మీ జీవిత భాగస్వామి, పిల్లలు, తల్లిదండ్రులు లేదా ఇతర కుటుంబ సభ్యుల పుట్టినరోజులు మరియు వివాహ వార్షికోత్సవాలను జోడించండి. వారి ప్రతి సందర్భంలో, ప్రతి సంవత్సరం మీ నమోదిత ఇమెయిల్‌కు వ్యక్తిగత ఆశీర్వచనం పంపుతాము.'
        )}</p>

        {showForm ? (
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 mb-6" data-testid="family-member-form">
            <h2 className="font-english-heading text-sm text-[#621B00] mb-4">{editingId ? t('Edit Family Member', 'కుటుంబ సభ్యుడిని సవరించండి') : t('Add Family Member', 'కుటుంబ సభ్యుడిని జోడించండి')}</h2>
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label htmlFor={`${uid}-name`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')} *</label><input id={`${uid}-name`} className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="family-member-name" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${uid}-relation`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Relation', 'సంబంధం')} *</label>
                  <select id={`${uid}-relation`} className={inputCls} value={form.relation} onChange={e => setForm({...form, relation: e.target.value})} data-testid="family-member-relation">
                    {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${uid}-occasion`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Occasion', 'సందర్భం')} *</label>
                  <select id={`${uid}-occasion`} className={inputCls} value={form.occasion_type} onChange={e => setForm({...form, occasion_type: e.target.value})} data-testid="family-member-occasion">
                    <option value="Birthday">{t('Birthday', 'పుట్టినరోజు')}</option>
                    <option value="Wedding Anniversary">{t('Wedding Anniversary', 'వివాహ వార్షికోత్సవం')}</option>
                  </select>
                </div>
              </div>
              <div><label htmlFor={`${uid}-date`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Date', 'తేదీ')} *</label><DateInput id={`${uid}-date`} className={inputCls} value={form.date} onChange={v => setForm({...form, date: v})} required data-testid="family-member-date" /></div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#C43E00] text-white text-sm rounded-full disabled:opacity-50" data-testid="family-member-submit">
                  {submitting ? t('Saving...', 'సేవ్ అవుతోంది...') : editingId ? t('Save Changes', 'మార్పులను సేవ్ చేయండి') : t('Add', 'జోడించు')}
                </button>
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-[#8D6E63] text-sm">{t('Cancel', 'రద్దు చేయండి')}</button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 mb-6 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all" data-testid="add-family-member-btn">
            <Plus className="h-4 w-4" /> {t('Add Family Member', 'కుటుంబ సభ్యుడిని జోడించండి')}
          </button>
        )}

        {loading ? (
          <p className="text-center py-12 text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p>
        ) : loadError ? (
          <p className="text-center py-12 text-[#8D6E63]">{t('Failed to load family members', 'కుటుంబ సభ్యులను లోడ్ చేయడంలో విఫలమైంది')}</p>
        ) : members.length === 0 ? (
          <p className="text-center py-12 text-[#8D6E63]">{t('No family members added yet', 'ఇంకా కుటుంబ సభ్యులను జోడించలేదు')}</p>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="bg-white border border-[#E6DCCA] rounded-xl p-4 flex items-center justify-between" data-testid={`family-member-card-${m.id}`}>
                <div>
                  <p className="text-sm font-medium text-[#2D1B0E]">{m.name} <span className="text-xs text-[#8D6E63]">({m.relation})</span></p>
                  <p className="text-xs text-[#8D6E63] flex items-center gap-1 mt-0.5"><Gift className="h-3 w-3" /> {m.occasion_type} &mdash; {String(m.day).padStart(2, '0')}/{String(m.month).padStart(2, '0')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(m)} className="text-[#8D6E63] hover:text-[#C43E00] p-2" data-testid={`edit-family-member-${m.id}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-[#8D6E63] hover:text-red-600 p-2" data-testid={`delete-family-member-${m.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
