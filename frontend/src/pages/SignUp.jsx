import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, MessageCircle, Phone, Mail } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { GoogleAuthSection } from '@/components/GoogleAuthButton';

const CHANNELS = [
  { id: 'sms', icon: Phone, label: 'SMS', labelTe: 'SMS' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', labelTe: 'వాట్సాప్' },
  { id: 'email', icon: Mail, label: 'Email', labelTe: 'ఇమెయిల్' },
];

export default function SignUp() {
  const { t, heading } = useT();
  const uid = useId();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState({ name: '', mobile: '', email: '', gotram: '', password: '', confirmPassword: '' });
  const [channel, setChannel] = useState('sms');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  const handleSendOtp = async (e) => {
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
      await api.post('/auth/devotee/send-otp', { mobile: form.mobile, channel, name: form.name, email: form.email || undefined, gotram: form.gotram, password: form.password });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.detail || t('Something went wrong', 'ఏదో పొరపాటు జరిగింది'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/devotee/verify-otp', { mobile: form.mobile, code: otp });
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
          <span className="font-english-heading text-sm tracking-wide">SPJRS Devasthanams</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-8 shadow-sm">
            <h1 className={`${heading} text-xl text-[#621B00] text-center mb-6`} data-testid="signup-title">
              {step === 'otp'
                ? t('Enter Verification Code', 'ధృవీకరణ కోడ్ నమోదు చేయండి')
                : t('Create Devotee Account', 'భక్తుల ఖాతా సృష్టించండి')}
            </h1>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4" data-testid="signup-error">{error}</div>}

            {step === 'details' ? (
              <>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label htmlFor={`${uid}-name`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')} *</label>
                    <input id={`${uid}-name`} name="name" autoComplete="name" className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required data-testid="input-name" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-mobile`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Mobile', 'మొబైల్')} *</label>
                    <input id={`${uid}-mobile`} name="mobile" type="tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} required placeholder="9XXXXXXXXX" data-testid="input-mobile" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-email`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Email', 'ఇమెయిల్')}</label>
                    <input id={`${uid}-email`} name="email" className={inputCls} type="email" autoComplete="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} data-testid="input-email" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-gotram`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Gotram', 'గోత్రం')}</label>
                    <input id={`${uid}-gotram`} name="gotram" className={inputCls} value={form.gotram} onChange={e => setForm({...form, gotram: e.target.value})} data-testid="input-gotram" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Password', 'పాస్‌వర్డ్')} *</label>
                    <input id={`${uid}-password`} name="password" type="password" autoComplete="new-password" className={inputCls} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={4} data-testid="input-password" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-confirm-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Confirm Password', 'పాస్‌వర్డ్ నిర్ధారించండి')} *</label>
                    <input id={`${uid}-confirm-password`} name="confirmPassword" type="password" autoComplete="new-password" className={inputCls} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} required minLength={4} data-testid="input-confirm-password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5D4037] mb-2">{t('Verify via', 'ధృవీకరించండి')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CHANNELS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setChannel(c.id)}
                          className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-all ${channel === c.id ? 'border-[#C43E00] bg-[#C43E00]/5 text-[#C43E00]' : 'border-[#E6DCCA] text-[#8D6E63]'}`}
                          data-testid={`channel-${c.id}`}
                        >
                          <c.icon className="h-4 w-4" />
                          {t(c.label, c.labelTe)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50"
                    data-testid="send-otp-btn"
                  >
                    {loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Send Code', 'కోడ్ పంపండి')}
                  </button>
                </form>
                <GoogleAuthSection onCredential={handleGoogleCredential} text="signup_with" />
              </>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <p className="text-sm text-[#5D4037] text-center">
                  {t('Enter the 6-digit code sent to', 'పంపిన 6-అంకెల కోడ్ నమోదు చేయండి')} <span className="font-medium">{form.mobile}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="input-otp">
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50"
                  data-testid="verify-otp-btn"
                >
                  {loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Verify & Create Account', 'ధృవీకరించి ఖాతా సృష్టించండి')}
                </button>
                <button type="button" onClick={() => { setStep('details'); setOtp(''); setError(''); }} className="w-full text-center text-sm text-[#C43E00] font-medium hover:underline" data-testid="change-details-btn">
                  {t('Change details or resend', 'వివరాలు మార్చండి లేదా మళ్ళీ పంపండి')}
                </button>
              </form>
            )}

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
