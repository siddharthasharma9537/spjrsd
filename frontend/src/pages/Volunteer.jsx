import { useState , useId } from 'react';
import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { HeartHandshake, CheckCircle } from 'lucide-react';

export default function Volunteer() {
  const { t, heading } = useT();
  const uid = useId();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', city: '', skills: '', availability: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/volunteers', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#C43E00]/10 flex items-center justify-center mx-auto mb-4">
            <HeartHandshake className="h-8 w-8 text-[#C43E00]" />
          </div>
          <h1 className={`${heading} text-2xl md:text-3xl text-[#621B00] mb-1`} data-testid="volunteer-title">{t("Become a Volunteer", "వాలంటీర్‌గా చేరండి")}</h1>
          <p className="text-sm text-[#5D4037] mt-2 max-w-md mx-auto">Serve the temple and devotees. Register your interest and our team will reach out to you.</p>
        </div>
        {success ? (
          <div className="bg-white border border-green-200 rounded-xl p-8 text-center" data-testid="volunteer-success">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="font-english-heading text-xl text-[#621B00] mb-2">Registration Received!</h2>
            <p className="text-sm text-[#5D4037]">Thank you for volunteering. We will contact you soon.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-6" data-testid="volunteer-form">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-name-0`}>Name / పేరు *</label><input id={`${uid}-name-0`} name="name" autoComplete="name" className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="vol-name" /></div>
                <div><label className="block text-xs font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-mobile-1`}>Mobile / మొబైల్ *</label><input id={`${uid}-mobile-1`} name="mobile" type="tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} required data-testid="vol-mobile" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-email-2`}>Email</label><input id={`${uid}-email-2`} type="email" name="email" autoComplete="email" className={inputCls} value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><label className="block text-xs font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-city-3`}>City / నగరం</label><input id={`${uid}-city-3`} name="city" autoComplete="address-level2" className={inputCls} value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
              </div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-skills-4`}>Skills / నైపుణ్యాలు</label><input id={`${uid}-skills-4`} className={inputCls} value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="e.g., Cooking, Crowd Management, IT, Medical" /></div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-availability-5`}>Availability</label>
                <select id={`${uid}-availability-5`} className={inputCls} value={form.availability} onChange={e => setForm({...form, availability: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Weekends">Weekends Only</option>
                  <option value="Festivals">During Festivals</option>
                  <option value="Fulltime">Full Time</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-message-6`}>Message</label><textarea id={`${uid}-message-6`} className={`${inputCls} h-20 py-3`} value={form.message} onChange={e => setForm({...form, message: e.target.value})} /></div>
              <button type="submit" disabled={submitting} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50" data-testid="vol-submit">
                {submitting ? 'Submitting...' : 'Register as Volunteer'}
              </button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
