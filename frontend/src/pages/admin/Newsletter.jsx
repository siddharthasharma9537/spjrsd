import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Send } from 'lucide-react';

export default function AdminNewsletter() {
  const [count, setCount] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/admin/newsletter/subscribers').then(r => setCount(r.data.count)).catch(() => setCount(null));
  }, []);

  const inputCls = "w-full h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg focus:border-[#C43E00] focus:ring-1 focus:ring-[#C43E00]/20 outline-none text-sm text-[#2D1B0E]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Send this alert to ${count ?? 'all'} subscriber(s)?`)) return;
    setSending(true);
    setResult(null);
    try {
      const r = await api.post('/admin/newsletter/send-alert', form);
      setResult({ ok: true, message: `Sent to ${r.data.sent} subscriber(s).` });
      setForm({ subject: '', message: '' });
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.detail || 'Failed to send alert.' });
    }
    setSending(false);
  };

  return (
    <AdminLayout title="Newsletter">
      <p className="text-sm text-[#8D6E63] mb-6">{count === null ? 'Loading subscriber count...' : `${count} subscriber(s)`}</p>

      <div className="bg-white border border-[#E6DCCA] rounded-xl p-6 max-w-2xl" data-testid="newsletter-alert-form">
        <h2 className="font-english-heading text-lg text-[#621B00] mb-4">Send Email Alert</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">Subject</label>
            <input className={inputCls} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required data-testid="alert-subject-input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5D4037] mb-1">Message</label>
            <textarea className={`${inputCls} h-40 py-2`} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required data-testid="alert-message-input" />
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? 'text-green-700' : 'text-red-600'}`} data-testid="alert-result">{result.message}</p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={sending || !count} className="inline-flex items-center gap-2 px-6 py-2 bg-[#C43E00] text-white text-sm rounded-full disabled:opacity-50" data-testid="alert-submit-btn">
              <Send className="h-4 w-4" /> {sending ? 'Sending...' : 'Send Alert'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
