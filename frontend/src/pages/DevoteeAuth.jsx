import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function DevoteeAuth({ isRegister = false }) {
  const { t, heading } = useT();
  const uid = useId();
  const [mode, setMode] = useState(isRegister ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', mobile: '', email: '', gotram: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await api.post('/auth/devotee/register', form);
        login(res.data.token, res.data.devotee, 'devotee');
      } else {
        const res = await api.post('/auth/devotee/login', { mobile: form.mobile, password: form.password });
        login(res.data.token, res.data.devotee, 'devotee');
      }
      navigate('/sevas');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <div className="temple-gradient py-6 text-center text-white">
        <Link to="/" className="inline-flex items-center gap-2 text-[#FFE0B2] hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-[#D4AF37]" />
          <span className="font-english-heading text-sm tracking-wide">SPJR Devasthanams</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-8 shadow-sm">
            <h1 className={`${heading} text-xl text-[#621B00] text-center mb-6`} data-testid="auth-title">
              {mode === 'register' ? t('Devotee Registration', 'భక్తుల నమోదు') : t('Devotee Login', 'భక్తుల లాగిన్')}
            </h1>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4" data-testid="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label htmlFor={`${uid}-name`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')}</label>
                    <input id={`${uid}-name`} name="name" autoComplete="name" className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="input-name" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-email`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Email', 'ఇమెయిల్')}</label>
                    <input id={`${uid}-email`} name="email" className={inputCls} type="email" autoComplete="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} data-testid="input-email" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-gotram`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Gotram', 'గోత్రం')}
                    </label>
                    <input id={`${uid}-gotram`} name="gotram" className={inputCls} value={form.gotram} onChange={e => setForm({...form, gotram: e.target.value})} data-testid="input-gotram" />
                  </div>
                </>
              )}
              <div>
                <label htmlFor={`${uid}-mobile`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Mobile', 'మొబైల్')}</label>
                <input id={`${uid}-mobile`} name="mobile" type="tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} required placeholder="9XXXXXXXXX" data-testid="input-mobile" />
              </div>
              <div>
                <label htmlFor={`${uid}-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Password', 'పాస్‌వర్డ్')}</label>
                <div className="relative">
                  <input id={`${uid}-password`} name="password" className={inputCls} type={showPw ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required data-testid="input-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D6E63]">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50"
                data-testid="auth-submit-btn"
              >
                {loading ? 'Please wait...' : mode === 'register' ? 'Register' : 'Login'}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-[#5D4037]">
              {mode === 'login' ? (
                <p>New devotee? <button onClick={() => setMode('register')} className="text-[#C43E00] font-medium hover:underline" data-testid="switch-to-register">Register here</button></p>
              ) : (
                <p>Already registered? <button onClick={() => setMode('login')} className="text-[#C43E00] font-medium hover:underline" data-testid="switch-to-login">Login here</button></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
