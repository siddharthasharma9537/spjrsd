import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Mail, CheckCircle, Gift } from 'lucide-react';
import { useT } from '@/contexts/LanguageContext';

export default function Newsletter() {
  const { t } = useT();
  const uid = useId();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setDone(true);
      setEmail('');
    } catch { }
    setLoading(false);
  };

  return (
    <div className="bg-[#C43E00] rounded-xl p-6 text-white" data-testid="newsletter">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5" />
        <h3 className="font-english-heading text-sm tracking-wide">{t('NEWSLETTER', 'వార్తాలేఖ')}</h3>
      </div>
      <p className="text-xs text-white/70 mb-3">{t('Subscribe to receive temple updates, festival notifications and seva schedules.', 'ఆలయ నవీకరణలు, పండుగ ప్రకటనలు మరియు సేవా షెడ్యూళ్లను పొందడానికి సభ్యత్వం పొందండి.')}</p>
      {done ? (
        <div className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4" /> {t('Subscribed!', 'సభ్యత్వం పొందారు!')}</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor={`${uid}-newsletter-email`} className="sr-only">{t('Email address for newsletter', 'వార్తాలేఖ కోసం ఇమెయిల్ చిరునామా')}</label>
          <input id={`${uid}-newsletter-email`} name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('Enter your email', 'మీ ఇమెయిల్ నమోదు చేయండి')} className="flex-1 h-9 px-3 rounded-lg bg-white/20 placeholder:text-white/50 text-white text-sm outline-none focus:bg-white/30 transition-all" data-testid="newsletter-email" />
          <button type="submit" disabled={loading} className="px-4 h-9 bg-[#D4AF37] text-[#2A1800] text-sm rounded-lg font-medium hover:bg-[#e6c44a] transition-all disabled:opacity-50" data-testid="newsletter-submit">{t('Subscribe', 'సభ్యత్వం')}</button>
        </form>
      )}
      <Link to="/aashirvachanam" className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white mt-3" data-testid="newsletter-aashirvachanam-link">
        <Gift className="h-3.5 w-3.5" /> {t('Get a personalized Aashirvachanam on your Birthday or Wedding Anniversary', 'మీ పుట్టినరోజు లేదా వివాహ వార్షికోత్సవం సందర్భంగా వ్యక్తిగతీకరించిన ఆశీర్వచనం పొందండి')}
      </Link>
    </div>
  );
}
