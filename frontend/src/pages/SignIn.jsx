import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, ShieldCheck } from 'lucide-react';
import { GoogleAuthSection } from '@/components/GoogleAuthButton';

export default function SignIn() {
  const { t, heading } = useT();
  const uid = useId();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/devotee/login', { identifier, password });
      login(res.data.token, res.data.devotee, 'devotee');
      navigate('/sevas');
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
          <span className="font-english-heading text-sm tracking-wide">SPJR Devasthanams</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-8 shadow-sm">
            <h1 className={`${heading} text-xl text-[#621B00] text-center mb-6`} data-testid="signin-title">
              {t('Devotee Sign In', 'భక్తుల సైన్ ఇన్')}
            </h1>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4" data-testid="signin-error">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`${uid}-identifier`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Mobile or Email', 'మొబైల్ లేదా ఇమెయిల్')}</label>
                <input id={`${uid}-identifier`} name="identifier" autoComplete="username" className={inputCls} value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder={t('9XXXXXXXXX or you@email.com', '9XXXXXXXXX లేదా you@email.com')} data-testid="input-identifier" />
              </div>
              <div>
                <label htmlFor={`${uid}-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Password', 'పాస్‌వర్డ్')}</label>
                <input id={`${uid}-password`} name="password" type="password" autoComplete="current-password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} required data-testid="input-password" />
                <Link to="/forgot-password" className="inline-block mt-2 text-sm text-[#C43E00] hover:underline" data-testid="forgot-password-link">
                  {t('Forgot password?', 'పాస్‌వర్డ్ మర్చిపోయారా?')}
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50"
                data-testid="signin-btn"
              >
                {loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Sign In', 'సైన్ ఇన్')}
              </button>
            </form>

            <GoogleAuthSection onCredential={handleGoogleCredential} text="signin_with" />

            <p className="text-center text-sm text-[#5D4037] mt-6">
              {t('New devotee?', 'కొత్త భక్తులా?')}{' '}
              <Link to="/register" className="text-[#C43E00] font-medium hover:underline" data-testid="go-to-signup">{t('Create an account', 'ఖాతా సృష్టించండి')}</Link>
            </p>

            <div className="text-center mt-6 text-sm text-[#5D4037] space-y-2">
              <p className="pt-2 border-t border-[#E6DCCA]">
                <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-[#8D6E63] hover:text-[#621B00]" data-testid="staff-login-link">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t('Temple staff? Sign in here', 'దేవస్థానం సిబ్బందా? ఇక్కడ సైన్ ఇన్ చేయండి')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
