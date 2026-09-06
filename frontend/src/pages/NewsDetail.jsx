import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from '@/components/LoadState';
import usePageMeta from '@/hooks/usePageMeta';
import { useT } from '@/contexts/LanguageContext';
import { Newspaper, AlertCircle, ChevronLeft } from 'lucide-react';

export default function NewsDetail() {
  const { id } = useParams();
  const { t } = useT();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/news/${id}`)
      .then(r => setItem(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Falls back to the generic /news title until the fetch resolves, then
  // overrides it with this item's own title - same pattern StotramDetail.jsx
  // uses to specialize a route-level default.
  const plainText = item?.content ? item.content.replace(/\s+/g, ' ').trim() : '';
  usePageMeta(item ? {
    title: item.title,
    description: plainText ? plainText.slice(0, 155) + (plainText.length > 155 ? '…' : '') : undefined,
  } : undefined);

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/news" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6" data-testid="back-to-news">
          <ChevronLeft className="h-4 w-4" /> {t('All News', 'అన్ని వార్తలు')}
        </Link>

        {loading ? (
          <p className="text-center text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p>
        ) : notFound ? (
          <LoadState emptyText={t('This news item could not be found.', 'ఈ వార్త కనుగొనబడలేదు.')} />
        ) : (
          <article className={`bg-white border rounded-xl p-6 md:p-10 ${item.is_important ? 'border-[#C43E00]/30 bg-[#C43E00]/5' : 'border-[#E6DCCA]'}`} data-testid="news-detail">
            <div className="flex items-start gap-3 mb-4">
              {item.is_important ? <AlertCircle className="h-5 w-5 text-[#C43E00] shrink-0 mt-1" /> : <Newspaper className="h-5 w-5 text-[#8D6E63] shrink-0 mt-1" />}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-medium text-xl md:text-2xl text-[#2D1B0E]">{t(item.title, item.title_telugu)}</h1>
                  {item.is_important && <span className="px-2 py-0.5 bg-[#C43E00] text-white text-xs rounded-full">{t('Important', 'ముఖ్యమైనది')}</span>}
                </div>
                <p className="text-xs text-[#8D6E63]">{new Date(item.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <p className="text-[#5D4037] leading-relaxed whitespace-pre-line">{t(item.content, item.content_telugu)}</p>
          </article>
        )}
      </div>
      <Footer />
    </div>
  );
}
