import { useState, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useT } from "@/contexts/LanguageContext";
import { Flame, ArrowLeft, MessageCircle, Phone, Mail } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const CHANNELS = [
  { id: 'sms', icon: Phone, label: 'SMS', labelTe: 'SMS' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', labelTe: 'వాట్సాప్' },
  { id: 'email', icon: Mail, label: 'Email', labelTe: 'ఇమెయిల్' },
];

export default function ForgotPassword() {
  const { t, heading } = useT();
  const uid = useId();
  const [step, setStep] = useState('identify'); // 'identify' | 'reset' | 'done'
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState('sms');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputCls = "w-full h-12 px-4 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-2 focus:ring-[#C43E00]/20 outline-none transition-all text-[#2D1B0E]";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/devotee/password-reset/send-otp', { identifier, channel });
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.detail || t('Something went wrong', 'ఏదో పొరపాటు జరిగింది'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 4) {
      setError(t('Password must be at least 4 characters', 'పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('Passwords do not match', 'పాస్‌వర్డ్‌లు సరిపోలలేదు'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/devotee/password-reset/verify', { identifier, code: otp, new_password: newPassword });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.detail || t('Something went wrong', 'ఏదో పొరపాటు జరిగింది'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <div className="temple-gradient py-6 text-center text-white">
        <Link to="/login" className="inline-flex items-center gap-2 text-[#FFE0B2] hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('Back to Sign In', 'సైన్ ఇన్‌కి తిరిగి వెళ్ళండి')}
        </Link>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-[#D4AF37]" />
          <span className="font-english-heading text-sm tracking-wide">SPJR Devasthanams</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-8 shadow-sm">
            <h1 className={`${heading} text-xl text-[#621B00] text-center mb-6`} data-testid="forgot-password-title">
              {step === 'done' ? t('Password Reset', 'పాస్‌వర్డ్ రీసెట్')
                : step === 'reset' ? t('Set New Password', 'కొత్త పాస్‌వర్డ్ సెట్ చేయండి')
                : t('Forgot Password', 'పాస్‌వర్డ్ మర్చిపోయారా')}
            </h1>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4" data-testid="forgot-password-error">{error}</div>}

            {step === 'identify' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-[#8D6E63]">{t("Enter your registered mobile number or email — we'll send a verification code to it.", 'మీ నమోదిత మొబైల్ నంబర్ లేదా ఇమెయిల్ నమోదు చేయండి — మేము దానికి ధృవీకరణ కోడ్ పంపుతాము.')}</p>
                <div>
                  <label htmlFor={`${uid}-identifier`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Mobile or Email', 'మొబైల్ లేదా ఇమెయిల్')}</label>
                  <input id={`${uid}-identifier`} className={inputCls} value={identifier} onChange={e => setIdentifier(e.target.value)} required data-testid="input-identifier" />
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
                <button type="submit" disabled={loading} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50" data-testid="send-reset-otp-btn">
                  {loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Send Code', 'కోడ్ పంపండి')}
                </button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-sm text-[#5D4037] text-center">{t('Enter the 6-digit code sent to your account', 'మీ ఖాతాకు పంపిన 6-అంకెల కోడ్ నమోదు చేయండి')}</p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="input-otp">
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div>
                  <label htmlFor={`${uid}-new-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('New Password', 'కొత్త పాస్‌వర్డ్')}</label>
                  <input id={`${uid}-new-password`} type="password" autoComplete="new-password" className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={4} data-testid="input-new-password" />
                </div>
                <div>
                  <label htmlFor={`${uid}-confirm-password`} className="block text-sm font-medium text-[#5D4037] mb-1">{t('Confirm New Password', 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి')}</label>
                  <input id={`${uid}-confirm-password`} type="password" autoComplete="new-password" className={inputCls} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={4} data-testid="input-confirm-password" />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg disabled:opacity-50" data-testid="reset-password-btn">
                  {loading ? t('Please wait...', 'దయచేసి వేచి ఉండండి...') : t('Reset Password', 'పాస్‌వర్డ్ రీసెట్ చేయండి')}
                </button>
                <button type="button" onClick={() => { setStep('identify'); setOtp(''); setError(''); }} className="w-full text-center text-sm text-[#C43E00] font-medium hover:underline" data-testid="change-identifier-btn">
                  {t('Change number/email or resend', 'నంబర్/ఇమెయిల్ మార్చండి లేదా మళ్ళీ పంపండి')}
                </button>
              </form>
            )}

            {step === 'done' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-[#5D4037]">{t('Your password has been reset successfully.', 'మీ పాస్‌వర్డ్ విజయవంతంగా రీసెట్ చేయబడింది.')}</p>
                <button onClick={() => navigate('/login')} className="w-full h-12 bg-[#C43E00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#C43E00]/90 transition-all shadow-lg" data-testid="go-to-signin-btn">
                  {t('Sign In', 'సైన్ ఇన్')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
