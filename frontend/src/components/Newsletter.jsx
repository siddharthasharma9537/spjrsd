import { useState, useId } from 'react';
import api from '@/lib/api';
import { Mail, CheckCircle } from 'lucide-react';

export default function Newsletter() {
  const uid = useId();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setDone(true);
      setEmail('');
    } catch { }
    setLoading(false);
  };

  return (
    <div className="bg-[#C43E00] rounded-xl p-6 text-white" data-testid="newsletter">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5" />
        <h3 className="font-english-heading text-sm tracking-wide">NEWSLETTER</h3>
      </div>
      <p className="text-xs text-white/70 mb-3">Subscribe to receive temple updates, festival notifications and seva schedules.</p>
      {done ? (
        <div className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4" /> Subscribed!</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor={`${uid}-newsletter-email`} className="sr-only">Email address for newsletter</label>
          <input id={`${uid}-newsletter-email`} name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 h-9 px-3 rounded-lg bg-white/20 placeholder:text-white/50 text-white text-sm outline-none focus:bg-white/30 transition-all" data-testid="newsletter-email" />
          <button type="submit" disabled={loading} className="px-4 h-9 bg-[#D4AF37] text-[#2A1800] text-sm rounded-lg font-medium hover:bg-[#e6c44a] transition-all disabled:opacity-50" data-testid="newsletter-submit">Subscribe</button>
        </form>
      )}
    </div>
  );
}
