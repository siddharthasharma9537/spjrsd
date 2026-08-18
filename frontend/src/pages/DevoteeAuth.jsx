import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, ShieldCheck, MessageCircle, Phone, Mail } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const CHANNELS = [
  { id: 'sms', icon: Phone, label: 'SMS', labelTe: 'SMS' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', labelTe: 'వాట్సాప్' },
  { id: 'email', icon: Mail, label: 'Email', labelTe: 'ఇమెయిల్' },
];

export default function DevoteeAuth() {
  const { t, heading } = useT();
  const uid = useId();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState({ name: '', mobile: '', email: '', gotram: '' });
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
    setLoading(true);
    try {
      await api.post('/auth/devotee/send-otp', { mobile: form.mobile, channel, name: form.name || undefined, email: form.email || undefined, gotram: form.gotram });
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
            <h1 className={`${heading} text-xl text-[#621B00] text-center mb-6`} data-testid="auth-title">
              {step === 'otp'
                ? t('Enter Verification Code', 'ధృవీకరణ కోడ్ నమోదు చేయండి')
                : t('Devotee Sign In', 'భక్తుల సైన్ ఇన్')}
            </h1>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4" data-testid="auth-error">{error}</div>}

            {step === 'details' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-[#8D6E63]">{t('Enter your mobile number. New devotees, please also fill in your name below.', 'మీ మొబైల్ నంబర్ నమోదు చేయండి. కొత్త భక్తులు దయచేసి మీ పేరు కూడా నమోదు చేయండి.')}</p>
                <div>
                  <label htmlFor={`${uid}-mobile`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Mobile', 'మొబైల్')}</label>
                  <input id={`${uid}-mobile`} name="mobile" type="tel" inputMode="numeric" autoComplete="tel" className={inputCls} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} required placeholder="9XXXXXXXXX" data-testid="input-mobile" />
                </div>
                <div>
                  <label htmlFor={`${uid}-name`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Name', 'పేరు')} <span className="text-[#8D6E63] font-normal">({t('new devotees only', 'కొత్త భక్తులకు మాత్రమే')})</span></label>
                  <input id={`${uid}-name`} name="name" autoComplete="name" className={inputCls} value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="input-name" />
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
                  <label className="block text-sm font-medium text-[#5D4037] mb-2">{t('Send code via', 'కోడ్ పంపండి')}</label>
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
                  {loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Verify & Continue', 'ధృవీకరించి కొనసాగించండి')}
                </button>
                <button type="button" onClick={() => { setStep('details'); setOtp(''); setError(''); }} className="w-full text-center text-sm text-[#C43E00] font-medium hover:underline" data-testid="change-number-btn">
                  {t('Change number or resend', 'నంబర్ మార్చండి లేదా మళ్ళీ పంపండి')}
                </button>
              </form>
            )}

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
