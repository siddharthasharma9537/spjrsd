import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from '@/components/LoadState';
import usePageMeta from '@/hooks/usePageMeta';
import { useT } from '@/contexts/LanguageContext';
import { ScrollText, ChevronLeft } from 'lucide-react';

export default function StotramDetail() {
  const { slug } = useParams();
  const { t } = useT();
  const [stotram, setStotram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.get(`/stotrams/slug/${slug}`)
      .then(r => setStotram(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Falls back to the generic /stotrams title until the fetch resolves, then
  // overrides it with this stotram's own name - same pattern NotFound.jsx uses
  // to specialize a route-level default.
  const plainText = stotram?.text_telugu ? stotram.text_telugu.replace(/\s+/g, ' ').trim() : '';
  usePageMeta(stotram ? {
    title: `${stotram.title} (${stotram.title_telugu})`,
    description: plainText ? plainText.slice(0, 155) + (plainText.length > 155 ? '…' : '') : `${stotram.title} stotram in Telugu, chanted at Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam, Cheruvugattu.`,
  } : undefined);

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/stotrams" className="inline-flex items-center gap-1 text-sm text-[#8D6E63] hover:text-[#C43E00] mb-6" data-testid="back-to-stotrams">
          <ChevronLeft className="h-4 w-4" /> {t('All Stotrams', 'అన్ని స్తోత్రాలు')}
        </Link>

        {loading ? (
          <p className="text-center text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p>
        ) : notFound ? (
          // Not error=true: that variant reads as a network/server failure with
          // a "Try Again" reload button, which is misleading for a genuine 404.
          <LoadState emptyText={t('This stotram could not be found.', 'ఈ స్తోత్రం కనుగొనబడలేదు.')} />
        ) : (
          <article className="bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-10" data-testid="stotram-detail">
            <div className="flex items-start gap-3 mb-6">
              <ScrollText className="h-6 w-6 text-[#8D6E63] shrink-0 mt-1" />
              <div>
                <h1 className="font-medium text-xl md:text-2xl text-[#2D1B0E]">{t(stotram.title, stotram.title_telugu)}</h1>
                <p className="text-sm text-[#8D6E63] mt-0.5">{t(stotram.title_telugu, stotram.title)}</p>
                {stotram.deity && <p className="text-xs text-[#8D6E63] mt-1">{stotram.deity}</p>}
              </div>
            </div>
            {stotram.text_telugu ? (
              /* Stotram lines are metrical - preserve the breaks exactly as entered. */
              <p className="font-telugu-body whitespace-pre-line text-[#2D1B0E] leading-loose text-[17px]">{stotram.text_telugu}</p>
            ) : (
              <p className="text-sm text-[#8D6E63]">{t('Text is being added.', 'పాఠ్యం చేర్చబడుతోంది.')}</p>
            )}
          </article>
        )}
      </div>
      <Footer />
    </div>
  );
}
