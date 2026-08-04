import { useState , useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Flame, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const uid = useId();
  const [form, setForm] = useState({ username: '', password: '' });
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
      const res = await api.post('/auth/admin/login', form);
      login(res.data.token, res.data.user, 'admin');
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
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
          <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
          <span className="font-english-heading text-sm tracking-wide">Staff Portal</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E6DCCA] rounded-xl p-8 shadow-sm">
            <h1 className="font-english-heading text-xl text-[#621B00] text-center mb-1" data-testid="admin-login-title">Staff Login</h1>
            <p className="text-sm text-[#8D6E63] text-center mb-6">EO / Clerk / Cashier / Priest</p>

            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4" data-testid="admin-login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-username-0`}>Username</label>
                <input id={`${uid}-username-0`} name="username" autoComplete="username" className={inputCls} value={form.username} onChange={e => setForm({...form, username: e.target.value})} required data-testid="admin-input-username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5D4037] mb-1" htmlFor={`${uid}-password`}>Password</label>
                <div className="relative">
                  <input id={`${uid}-password`} name="password" autoComplete="current-password" className={inputCls} type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required data-testid="admin-input-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D6E63]">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full h-12 bg-[#621B00] text-white font-english-heading tracking-wide uppercase rounded-full hover:bg-[#621B00]/90 transition-all shadow-lg disabled:opacity-50" data-testid="admin-login-btn">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
