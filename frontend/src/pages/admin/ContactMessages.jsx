import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import api from '@/lib/api';
import { Mail, Phone, UserCircle } from 'lucide-react';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/admin/contact-messages').then(r => setMessages(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Contact Messages">
      <p className="text-sm text-[#8D6E63] mb-6">{messages.length} messages submitted via the Contact Us form (read-only)</p>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : loadError ? (
        <p className="text-center py-12 text-[#8D6E63]">Failed to load contact messages</p>
      ) : messages.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">No contact messages yet</p>
      ) : (
        <div className="space-y-3">
          {messages.map(m => (
            <div key={m.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={`contact-message-row-${m.id}`}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-sm font-medium text-[#2D1B0E]">{m.subject || 'General Inquiry'}</h3>
                  <p className="text-xs text-[#8D6E63] mt-0.5">{m.name}</p>
                </div>
                <span className="text-xs text-[#8D6E63] shrink-0">{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</span>
              </div>
              <p className="text-sm text-[#5D4037] whitespace-pre-wrap mb-3">{m.message}</p>
              <div className="flex items-center gap-4 text-xs text-[#5D4037]">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {m.email}</span>
                {m.mobile && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {m.mobile}</span>}
                {m.devotee_id && (
                  <Link to={`/admin/devotees/${m.devotee_id}`} className="flex items-center gap-1 text-[#C43E00] hover:underline ml-auto" data-testid={`contact-message-devotee-link-${m.id}`}>
                    <UserCircle className="h-3.5 w-3.5" /> View {m.devotee_name}'s profile
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
