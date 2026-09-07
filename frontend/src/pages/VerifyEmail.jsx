import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useT } from '@/contexts/LanguageContext';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const { t, heading } = useT();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('checking'); // 'checking' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg(t('No verification token was provided.', 'ధృవీకరణ టోకెన్ ఇవ్వబడలేదు.'));
      return;
    }
    api.get('/auth/devotee/verify-email', { params: { token } })
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error');
        setErrorMsg(err.response?.data?.detail || t('Something went wrong', 'ఏదో పొరపాటు జరిగింది'));
      });
  }, [token, t]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus('sending');
    try {
      await api.post('/auth/devotee/resend-verification', { email: resendEmail });
      setResendStatus('sent');
    } catch (err) {
      setResendStatus(err.response?.data?.detail || t('Something went wrong', 'ఏదో పొరపాటు జరిగింది'));
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-md mx-auto px-4 py-16 w-full">
        <div className="bg-white border border-[#E6DCCA] rounded-xl p-8 text-center" data-testid="verify-email-card">
          {status === 'checking' && (
            <>
              <Loader2 className="h-10 w-10 text-[#C43E00] animate-spin mx-auto mb-4" />
              <p className="text-[#5D4037]">{t('Verifying your email...', 'మీ ఇమెయిల్‌ను ధృవీకరిస్తున్నాము...')}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className={`${heading} text-xl text-[#621B00] mb-2`}>{t('Email Verified!', 'ఇమెయిల్ ధృవీకరించబడింది!')}</h1>
              <p className="text-sm text-[#5D4037] mb-6">{t('You can now book sevas and accommodation.', 'ఇప్పుడు మీరు సేవలు మరియు వసతి బుక్ చేసుకోవచ్చు.')}</p>
              <Link to="/sevas" className="inline-block px-6 h-11 leading-[2.75rem] bg-[#C43E00] text-white text-sm rounded-full" data-testid="verify-email-continue">
                {t('Browse Sevas', 'సేవలు చూడండి')}
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h1 className={`${heading} text-xl text-[#621B00] mb-2`}>{t('Verification Failed', 'ధృవీకరణ విఫలమైంది')}</h1>
              <p className="text-sm text-[#5D4037] mb-6" data-testid="verify-email-error">{errorMsg}</p>

              <form onSubmit={handleResend} className="space-y-3 text-left">
                <label className="block text-sm font-medium text-[#5D4037]">{t('Request a new verification link', 'కొత్త ధృవీకరణ లింక్ కోరండి')}</label>
                <input type="email" required value={resendEmail} onChange={e => setResendEmail(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-[#E6DCCA] rounded-lg text-sm focus:border-[#C43E00] outline-none" data-testid="resend-email-input" />
                <button type="submit" disabled={resendStatus === 'sending'} className="w-full h-11 bg-[#C43E00] text-white text-sm rounded-full disabled:opacity-50" data-testid="resend-email-btn">
                  {resendStatus === 'sending' ? t('Sending...', 'పంపుతోంది...') : t('Resend Link', 'లింక్ మళ్ళీ పంపండి')}
                </button>
                {resendStatus === 'sent' && <p className="text-sm text-green-700">{t('A new link has been sent - check your inbox.', 'కొత్త లింక్ పంపబడింది - మీ ఇన్‌బాక్స్ చూడండి.')}</p>}
                {resendStatus && resendStatus !== 'sending' && resendStatus !== 'sent' && <p className="text-sm text-red-600">{resendStatus}</p>}
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
