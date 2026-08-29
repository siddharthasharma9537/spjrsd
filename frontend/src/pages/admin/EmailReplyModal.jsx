import { useState } from 'react';
import api from '@/lib/api';
import { X } from 'lucide-react';

export default function EmailReplyModal({ to, defaultSubject = '', onClose }) {
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setSending(true);
    setError('');
    try {
      await api.post('/admin/send-email', { to, subject, message });
      setSent(true);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} data-testid="email-reply-modal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[#2D1B0E]">Reply to {to}</h3>
          <button onClick={onClose} data-testid="email-reply-close"><X className="h-4 w-4 text-[#8D6E63]" /></button>
        </div>
        {sent ? (
          <>
            <p className="text-sm text-[#2E7D32] mb-4">Email sent to {to}.</p>
            <button onClick={onClose} className="px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full">Close</button>
          </>
        ) : (
          <>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
              className="w-full h-10 px-3 mb-3 text-sm border border-[#E6DCCA] rounded-lg outline-none focus:border-[#C43E00]" data-testid="email-reply-subject" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your reply..." rows={5}
              className="w-full px-3 py-2 mb-3 text-sm border border-[#E6DCCA] rounded-lg outline-none focus:border-[#C43E00]" data-testid="email-reply-message" />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-[#8D6E63]">Cancel</button>
              <button onClick={send} disabled={sending || !message.trim() || !subject.trim()}
                className="px-4 py-2 bg-[#C43E00] text-white text-sm rounded-full disabled:opacity-50" data-testid="email-reply-send">
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
