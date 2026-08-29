import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import EmailReplyModal from './EmailReplyModal';
import api from '@/lib/api';
import { Mail, Phone, UserCircle, Search, ArrowUpDown } from 'lucide-react';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [linkFilter, setLinkFilter] = useState('all');
  const [replyTarget, setReplyTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/contact-messages').then(r => setMessages(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = messages.filter(m => {
      if (q && !(m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.mobile?.includes(q) || m.subject?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q))) return false;
      if (linkFilter === 'linked' && !m.devotee_id) return false;
      if (linkFilter === 'unlinked' && m.devotee_id) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const cmp = (a.created_at || '').localeCompare(b.created_at || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [messages, search, linkFilter, sortDir]);

  return (
    <AdminLayout title="Contact Messages">
      <p className="text-sm text-[#8D6E63] mb-4">{visible.length} of {messages.length} messages submitted via the Contact Us form (read-only)</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-[#8D6E63] absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, mobile, subject, message..."
            className="w-full h-10 pl-9 pr-3 bg-white border border-[#E6DCCA] rounded-lg text-sm focus:border-[#C43E00] outline-none" data-testid="contact-messages-search" />
        </div>
        <select value={linkFilter} onChange={e => setLinkFilter(e.target.value)} className="h-10 px-3 bg-white border border-[#E6DCCA] rounded-lg text-sm" data-testid="contact-messages-filter">
          <option value="all">All messages</option>
          <option value="linked">Linked to a devotee</option>
          <option value="unlinked">Not linked</option>
        </select>
        <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="h-10 px-3 inline-flex items-center gap-1.5 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#5D4037]" data-testid="contact-messages-sort-dir">
          <ArrowUpDown className="h-3.5 w-3.5" /> {sortDir === 'asc' ? 'Oldest first' : 'Latest first'}
        </button>
      </div>

      {loading ? <p className="text-[#8D6E63]">Loading...</p> : loadError ? (
        <p className="text-center py-12 text-[#8D6E63]">Failed to load contact messages</p>
      ) : visible.length === 0 ? (
        <p className="text-center py-12 text-[#8D6E63]">{messages.length === 0 ? 'No contact messages yet' : 'No messages match your filters'}</p>
      ) : (
        <div className="space-y-3">
          {visible.map(m => (
            <div key={m.id} className="bg-white border border-[#E6DCCA] rounded-xl p-5" data-testid={`contact-message-row-${m.id}`}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-sm font-medium text-[#2D1B0E]">{m.subject || 'General Inquiry'}</h3>
                  <p className="text-xs text-[#8D6E63] mt-0.5">{m.name}</p>
                </div>
                <span className="text-xs text-[#8D6E63] shrink-0">{fmtDateTime(m.created_at)}</span>
              </div>
              <p className="text-sm text-[#5D4037] whitespace-pre-wrap mb-3">{m.message}</p>
              <div className="flex items-center gap-4 text-xs text-[#5D4037]">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {m.email}
                  <button onClick={() => setReplyTarget(m)} className="text-[#C43E00] hover:underline ml-1" data-testid={`contact-message-reply-${m.id}`}>Reply</button>
                </span>
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

      {replyTarget && (
        <EmailReplyModal to={replyTarget.email} defaultSubject={`Re: ${replyTarget.subject || 'General Inquiry'}`} onClose={() => setReplyTarget(null)} />
      )}
    </AdminLayout>
  );
}
