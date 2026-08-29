import { useState, useId } from 'react';
import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Gift, Send, CheckCircle } from 'lucide-react';

export default function Aashirvachanam() {
  const { t, heading } = useT();
  const uid = useId();
  const [form, setForm] = useState({ name: '', email: '', occasion_type: 'Birthday', date: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/aashirvachanam', form);
      setSuccess(true);
      setForm({ name: '', email: '', occasion_type: 'Birthday', date: '' });
    } catch (err) {
      setError(err.response?.data?.detail || t('Failed to submit', 'సమర్పించడం విఫలమైంది'));
    } finally { setSubmitting(false); }
  };

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <Gift className="h-10 w-10 text-[#C43E00] mx-auto mb-2" />
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-2`} data-testid="aashirvachanam-title">{t('Personalized Aashirvachanam', 'వ్యక్తిగత ఆశీర్వచనం')}</h1>
          <p className="text-sm text-[#5D4037]">{t(
            "A special perk for our newsletter subscribers: receive a personalized blessing email from the temple, addressed to you by name, every year on your birthday or wedding anniversary.",
            'మా న్యూస్‌లెటర్ చందాదారుల కోసం ప్రత్యేక సదుపాయం: మీ పుట్టినరోజు లేదా వివాహ వార్షికోత్సవం రోజున, ప్రతి సంవత్సరం మీ పేరుతో ఆలయం నుండి వ్యక్తిగత ఆశీర్వచన సందేశం అందుకోండి.'
          )}</p>
        </div>

        {success ? (
          <div className="bg-white border border-green-200 rounded-xl p-8 text-center" data-testid="aashirvachanam-success">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="font-english-heading text-xl text-[#621B00] mb-2">{t('Request Submitted!', 'అభ్యర్థన సమర్పించబడింది!')}</h2>
            <p className="text-sm text-[#5D4037] mb-4">{t("You'll receive your first Aashirvachanam on your next occasion. You've also been added to our newsletter.", 'మీ తదుపరి సందర్భంలో మీకు మొదటి ఆశీర్వచనం అందుతుంది. మిమ్మల్ని మా న్యూస్‌లెటర్‌కు కూడా జోడించాము.')}</p>
            <button onClick={() => setSuccess(false)} className="px-6 py-2 bg-[#C43E00] text-white rounded-full text-sm">{t('Submit Another', 'మరొకటి సమర్పించండి')}</button>
          </div>
        ) : (
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-6" data-testid="aashirvachanam-form">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label htmlFor={`${uid}-name`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')} *</label><input id={`${uid}-name`} name="name" autoComplete="name" className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="aashirvachanam-name" /></div>
              <div><label htmlFor={`${uid}-email`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Email', 'ఇమెయిల్')} *</label><input id={`${uid}-email`} name="email" type="email" autoComplete="email" className={inputCls} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required data-testid="aashirvachanam-email" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${uid}-occasion`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Occasion', 'సందర్భం')} *</label>
                  <select id={`${uid}-occasion`} name="occasion_type" className={inputCls} value={form.occasion_type} onChange={e => setForm({...form, occasion_type: e.target.value})} data-testid="aashirvachanam-occasion">
                    <option value="Birthday">{t('Birthday', 'పుట్టినరోజు')}</option>
                    <option value="Wedding Anniversary">{t('Wedding Anniversary', 'వివాహ వార్షికోత్సవం')}</option>
                  </select>
                </div>
                <div><label htmlFor={`${uid}-date`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Date', 'తేదీ')} *</label><input id={`${uid}-date`} name="date" type="date" className={inputCls} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required data-testid="aashirvachanam-date" /></div>
              </div>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-3 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase text-sm rounded-full hover:bg-[#C43E00]/90 transition-all disabled:opacity-50" data-testid="aashirvachanam-submit">
                <Send className="h-4 w-4" /> {submitting ? t('Submitting...', 'సమర్పిస్తోంది...') : t('Submit', 'సమర్పించండి')}
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
