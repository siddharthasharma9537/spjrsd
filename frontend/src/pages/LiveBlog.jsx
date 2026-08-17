import { useState, useEffect, useCallback } from 'react';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from '@/components/LoadState';
import { useT } from '@/contexts/LanguageContext';
import { Radio, Pin } from 'lucide-react';

const POLL_INTERVAL_MS = 30000;

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LiveBlog() {
  const { t, heading } = useT();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback((silent) => {
    if (!silent) setLoading(true);
    api.get('/live-blog').then(r => { setPosts(r.data); setLoadError(false); }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Radio className="h-8 w-8 text-red-600" />
          </div>
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1 flex items-center justify-center gap-2`} data-testid="live-blog-title">
            {t('Live Blog', 'లైవ్ బ్లాగ్')}
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </h1>
          <p className="text-sm text-[#5D4037] mt-2">{t('Real-time updates from festivals and events at the temple', 'ఆలయ ఉత్సవాలు మరియు కార్యక్రమాల తాజా వార్తలు')}</p>
        </div>

        {loading ? <p className="text-center text-[#8D6E63]">Loading...</p> : posts.length === 0 ? (
          <LoadState error={loadError} emptyText="No live updates right now. Check back during the next festival or event." />
        ) : (
          <div className="relative space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-[#E6DCCA]">
            {posts.map(p => (
              <div key={p.id} className="relative pl-10" data-testid={`live-blog-post-${p.id}`}>
                <span className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 ${p.is_pinned ? 'bg-[#D4AF37]/15 border-[#D4AF37]' : 'bg-white border-[#E6DCCA]'}`}>
                  {p.is_pinned ? <Pin className="h-3.5 w-3.5 text-[#D4AF37]" /> : <span className="w-2 h-2 rounded-full bg-[#C43E00]" />}
                </span>
                <div className="bg-white border border-[#E6DCCA] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <span className="text-xs font-medium text-[#C43E00] uppercase tracking-wide">{t(p.event_name, p.event_name_telugu)}</span>
                    <span className="text-xs text-[#8D6E63]">{timeAgo(p.posted_at)}</span>
                  </div>
                  <h2 className="font-medium text-[#2D1B0E] mb-1">{t(p.title, p.title_telugu)}</h2>
                  <p className="text-sm text-[#5D4037] leading-relaxed">{t(p.content, p.content_telugu)}</p>
                  {p.image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden">
                      <img src={p.image_url} alt={p.title} className="w-full h-auto object-cover" loading="lazy" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
