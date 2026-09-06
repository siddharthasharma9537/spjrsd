import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from '@/components/LoadState';
import usePageMeta from '@/hooks/usePageMeta';
import { useT } from '@/contexts/LanguageContext';
import { Radio, Pin, ChevronLeft } from 'lucide-react';

export default function LiveBlogDetail() {
  const { id } = useParams();
  const { t } = useT();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/live-blog/${id}`)
      .then(r => setItem(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Falls back to the generic /live-blog title until the fetch resolves, then
  // overrides it with this post's own title - same pattern StotramDetail.jsx
  // uses to specialize a route-level default.
  const plainText = item?.content ? item.content.replace(/\s+/g, ' ').trim() : '';
  usePageMeta(item ? {
    title: item.title,
    description: plainText ? plainText.slice(0, 155) + (plainText.length > 155 ? '…' : '') : undefined,
  } : undefined);

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex flex-col">
      <TopStrip />
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <Link to="/live-blog" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6" data-testid="back-to-live-blog">
          <ChevronLeft className="h-4 w-4" /> {t('All Live Blog Updates', 'అన్ని లైవ్ అప్‌డేట్‌లు')}
        </Link>

        {loading ? (
          <p className="text-center text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p>
        ) : notFound ? (
          <LoadState emptyText={t('This update could not be found.', 'ఈ అప్‌డేట్ కనుగొనబడలేదు.')} />
        ) : (
          <article className="bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-10" data-testid="live-blog-detail">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {item.is_pinned ? <Pin className="h-4 w-4 text-[#D4AF37]" /> : <Radio className="h-4 w-4 text-red-500" />}
              <span className="text-xs font-medium text-[#C43E00] uppercase tracking-wide">{t(item.event_name, item.event_name_telugu)}</span>
              <span className="text-xs text-[#8D6E63]">{new Date(item.posted_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="font-medium text-xl md:text-2xl text-[#2D1B0E] mb-3">{t(item.title, item.title_telugu)}</h1>
            <p className="text-[#5D4037] leading-relaxed whitespace-pre-line">{t(item.content, item.content_telugu)}</p>
            {item.image_url && (
              <div className="mt-4 rounded-lg overflow-hidden">
                <img src={item.image_url} alt={item.title} className="w-full h-auto object-cover" loading="lazy" />
              </div>
            )}
          </article>
        )}
      </div>
      <Footer />
    </div>
  );
}
