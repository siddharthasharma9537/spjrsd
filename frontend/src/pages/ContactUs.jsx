import { useState, useId } from 'react';
import Navbar from '@/components/Navbar';
import TopStrip from '@/components/TopStrip';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

export default function ContactUs() {
  const { t, heading } = useT();
  const uid = useId();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/contact', form);
      setSuccess(true);
      setForm({ name: '', email: '', mobile: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.detail || t('Failed to send', 'పంపడం విఫలమైంది'));
    } finally { setSubmitting(false); }
  };

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="contact-title">{t("Contact Us", "సంప్రదించండి")}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[#2D1B0E] mb-1">{t('Address', 'చిరునామా')}</h3>
                  <p className="text-xs text-[#5D4037]">{t(
                    'Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams, Cheruvugattu, Narketpally Mandal, Nalgonda District, Telangana - 508254, India',
                    'శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం, చెరువుగట్టు, నార్కట్‌పల్లి మండలం, నల్గొండ జిల్లా, తెలంగాణ - 508254, భారతదేశం'
                  )}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[#2D1B0E] mb-1">{t('Phone', 'ఫోన్')}</h3>
                  <p className="text-xs text-[#5D4037]">{t('+91 94910 00701 (Executive Officer)', '+91 94910 00701 (కార్యనిర్వహణాధికారి)')}</p>
                  <p className="text-xs text-[#5D4037]">{t('Sri S. Mohan Babu, Executive Officer', 'శ్రీ ఎస్. మోహన్ బాబు, కార్యనిర్వహణాధికారి')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[#2D1B0E] mb-1">{t('Email', 'ఇమెయిల్')}</h3>
                  <p className="text-xs text-[#5D4037]">info@spjrdevasthanams.org</p>
                  <p className="text-xs text-[#5D4037]">helpdesk@spjrdevasthanams.org</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[#2D1B0E] mb-1">{t('Office Hours', 'కార్యాలయ సమయాలు')}</h3>
                  <p className="text-xs text-[#5D4037]">{t('Mon - Sat: 9:00 AM - 5:00 PM', 'సోమ - శని: 9:00 AM - 5:00 PM')}</p>
                  <p className="text-xs text-[#5D4037]">{t('Sunday: 10:00 AM - 2:00 PM', 'ఆదివారం: 10:00 AM - 2:00 PM')}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Contact Form */}
          <div className="md:col-span-2">
            {success ? (
              <div className="bg-white border border-green-200 rounded-xl p-8 text-center" data-testid="contact-success">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="font-english-heading text-xl text-[#621B00] mb-2">{t('Message Sent!', 'సందేశం పంపబడింది!')}</h2>
                <p className="text-sm text-[#5D4037] mb-4">{t('We will get back to you soon.', 'మేము త్వరలో మిమ్మల్ని సంప్రదిస్తాము.')}</p>
                <button onClick={() => setSuccess(false)} className="px-6 py-2 bg-[#C43E00] text-white rounded-full text-sm">{t('Send Another', 'మరొకటి పంపండి')}</button>
              </div>
            ) : (
              <div className="bg-white border border-[#E6DCCA] rounded-xl p-6" data-testid="contact-form">
                <h2 className="font-english-heading text-lg text-[#621B00] mb-4">{t('Send us a Message', 'మాకు సందేశం పంపండి')}</h2>
                {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label htmlFor={`${uid}-name`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')} *</label><input id={`${uid}-name`} name="name" autoComplete="name" className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="contact-name" /></div>
                    <div><label htmlFor={`${uid}-email`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Email', 'ఇమెయిల్')} *</label><input id={`${uid}-email`} name="email" type="email" autoComplete="email" className={inputCls} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required data-testid="contact-email" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label htmlFor={`${uid}-mobile`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Mobile', 'మొబైల్')}</label><input id={`${uid}-mobile`} name="mobile" type="tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} /></div>
                    <div><label htmlFor={`${uid}-subject`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Subject', 'విషయం')} *</label><input id={`${uid}-subject`} name="subject" className={inputCls} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required data-testid="contact-subject" /></div>
                  </div>
                  <div><label htmlFor={`${uid}-message`} className="block text-xs font-medium text-[#5D4037] mb-1">{t('Message', 'సందేశం')} *</label><textarea id={`${uid}-message`} name="message" className={`${inputCls} h-28 py-3`} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required data-testid="contact-message" /></div>
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-6 py-3 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase text-sm rounded-full hover:bg-[#C43E00]/90 transition-all disabled:opacity-50" data-testid="contact-submit">
                    <Send className="h-4 w-4" /> {submitting ? t('Sending...', 'పంపుతోంది...') : t('Send Message', 'సందేశం పంపండి')}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
