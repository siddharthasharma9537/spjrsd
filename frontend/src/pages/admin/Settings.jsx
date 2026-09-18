import { useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminSettings() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState({ current_password: false, new_password: false, confirm_password: false });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const inputCls = "w-full h-10 px-3 pr-10 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";
  const toggleShowPw = (field) => setShowPw(prev => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (form.new_password !== form.confirm_password) {
      setResult({ ok: false, message: 'New password and confirmation do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/admin/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setResult({ ok: true, message: 'Password changed successfully.' });
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.detail || 'Failed to change password.' });
    }
    setSubmitting(false);
  };

  return (
    <AdminLayout title="Settings">
      <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 max-w-md" data-testid="change-password-form">
        <h2 className="font-english-heading text-lg text-[#621B00] mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">Current Password</label>
            <div className="relative">
              <input type={showPw.current_password ? 'text' : 'password'} className={inputCls} value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} required data-testid="current-password-input" />
              <button type="button" onClick={() => toggleShowPw('current_password')} aria-label={showPw.current_password ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D6E63]">
                {showPw.current_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">New Password</label>
            <div className="relative">
              <input type={showPw.new_password ? 'text' : 'password'} className={inputCls} value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} required minLength={4} data-testid="new-password-input" />
              <button type="button" onClick={() => toggleShowPw('new_password')} aria-label={showPw.new_password ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D6E63]">
                {showPw.new_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">Confirm New Password</label>
            <div className="relative">
              <input type={showPw.confirm_password ? 'text' : 'password'} className={inputCls} value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required minLength={4} data-testid="confirm-password-input" />
              <button type="button" onClick={() => toggleShowPw('confirm_password')} aria-label={showPw.confirm_password ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D6E63]">
                {showPw.confirm_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? 'text-green-700' : 'text-red-600'}`} data-testid="change-password-result">{result.message}</p>
          )}
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full hover:bg-[#C43E00]/90 transition-all disabled:opacity-50" data-testid="change-password-submit-btn">
            {submitting ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
