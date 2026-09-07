import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, MessageCircle } from 'lucide-react';
import { GoogleAuthSection } from '@/components/GoogleAuthButton';

export default function SignUp() {
  const { t, heading } = useT();
  const uid = useId();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 4) {
      setError(t('Password must be at least 4 characters', 'పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('Passwords do not match', 'పాస్‌వర్డ్‌లు సరిపోలలేదు'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/devotee/register', {
        name: form.name, email: form.email, mobile: form.mobile || undefined,
        password: form.password, subscribe_newsletter: subscribeNewsletter,
      });
      login(res.data.token, res.data.devotee, 'devotee');
      // Account is active immediately; booking is gated on email_verified
      // server-side (see main.py's create_booking/create_accommodation_booking),
      // so this is a heads-up rather than a blocker - navigate('/verify-email')
      // isn't needed since the link they'll click lands them there directly.
      navigate('/sevas', { state: { justRegistered: true } });
    } catch (err) {
      setError(err.response?.data?.detail || t('Something went wrong', 'ఏదో పొరపాటు జరిగింది'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/devotee/google', { credential });
      login(res.data.token, res.data.devotee, 'devotee');
      navigate('/sevas');
    } catch (err) {
      setError(err.response?.data?.detail || t('Something went wrong', 'ఏదో పొరపాటు జరిగింది'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <div className="temple-gradient py-6 text-center text-white">
        <Link to="/" className="inline-flex items-center gap-2 text-[#FFE0B2] hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Home', 'హోమ్')}
        </Link>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-[#D4AF37]" />
          <span className="font-english-heading text-sm tracking-wide">SPJRS Devasthanams</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-8 shadow-sm">
            <h1 className={`${heading} text-xl text-[#621B00] text-center mb-6`} data-testid="signup-title">
              {t('Create Devotee Account', 'భక్తుల ఖాతా సృష్టించండి')}
            </h1>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4" data-testid="signup-error">{error}</div>}

            <a
              href="https://wa.me/919390353848?text=register"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 mb-4 bg-[#25D366] text-white font-medium rounded-full hover:bg-[#25D366]/90 transition-all"
              data-testid="signup-whatsapp"
            >
              <MessageCircle className="h-4 w-4" /> {t('Register via WhatsApp instead', 'వాట్సాప్ ద్వారా నమోదు చేసుకోండి')}
            </a>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`${uid}-name`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')} *</label>
                <input id={`${uid}-name`} name="name" autoComplete="name" className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="input-name" />
              </div>
              <div>
                <label htmlFor={`${uid}-email`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Email', 'ఇమెయిల్')} *</label>
                <input id={`${uid}-email`} name="email" className={inputCls} type="email" autoComplete="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required data-testid="input-email" />
                <p className="text-xs text-[#8D6E63] mt-1">{t("We'll send a verification link here - required before booking sevas or accommodation.", 'ధృవీకరణ లింక్‌ను ఇక్కడికి పంపుతాము - సేవలు లేదా వసతి బుక్ చేసుకోవడానికి ముందు ఇది అవసరం.')}</p>
              </div>
              <div>
                <label htmlFor={`${uid}-mobile`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Mobile', 'మొబైల్')}</label>
                <input id={`${uid}-mobile`} name="mobile" type="tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="9XXXXXXXXX" data-testid="input-mobile" />
              </div>
              <div>
                <label htmlFor={`${uid}-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Password', 'పాస్‌వర్డ్')} *</label>
                <input id={`${uid}-password`} name="password" type="password" autoComplete="new-password" className={inputCls} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={4} data-testid="input-password" />
              </div>
              <div>
                <label htmlFor={`${uid}-confirm-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Confirm Password', 'పాస్‌వర్డ్ నిర్ధారించండి')} *</label>
                <input id={`${uid}-confirm-password`} name="confirmPassword" type="password" autoComplete="new-password" className={inputCls} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required minLength={4} data-testid="input-confirm-password" />
              </div>
              <label className="flex items-start gap-2 text-sm text-[#5D4037]">
                <input type="checkbox" checked={subscribeNewsletter} onChange={e => setSubscribeNewsletter(e.target.checked)} className="mt-0.5" data-testid="input-newsletter" />
                {t('Send me temple updates by email (festival announcements, news)', 'ఆలయ నవీకరణలు (పండుగ ప్రకటనలు, వార్తలు) ఇమెయిల్ ద్వారా పంపండి')}
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50"
                data-testid="create-account-btn"
              >
                {loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Create Account', 'ఖాతా సృష్టించండి')}
              </button>
            </form>
            <GoogleAuthSection onCredential={handleGoogleCredential} text="signup_with" />

            <p className="text-center text-sm text-[#5D4037] mt-6">
              {t('Already have an account?', 'ఇప్పటికే ఖాతా ఉందా?')}{' '}
              <Link to="/login" className="text-[#C43E00] font-medium hover:underline" data-testid="go-to-signin">{t('Sign In', 'సైన్ ఇన్')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
