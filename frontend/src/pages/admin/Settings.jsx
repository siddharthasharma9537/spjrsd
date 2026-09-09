import { useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';

export default function AdminSettings() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

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
            <input type="password" className={inputCls} value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} required data-testid="current-password-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">New Password</label>
            <input type="password" className={inputCls} value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} required minLength={4} data-testid="new-password-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">Confirm New Password</label>
            <input type="password" className={inputCls} value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required minLength={4} data-testid="confirm-password-input" />
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
