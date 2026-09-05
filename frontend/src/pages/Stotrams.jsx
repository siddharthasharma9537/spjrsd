import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import LoadState from "@/components/LoadState";
import { useT } from "@/contexts/LanguageContext";
import { ScrollText, ChevronRight } from 'lucide-react';

export default function Stotrams() {
  const { t, heading } = useT();
  const [stotrams, setStotrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/stotrams').then(r => setStotrams(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="stotrams-title">{t("Stotrams", "స్తోత్రాలు")}</h1>
          <p className="text-sm text-[#8D6E63]">{t('Chanted during sevas at the temple', 'ఆలయంలో సేవల సమయంలో పఠించేవి')}</p>
        </div>
        {loading ? <p className="text-center text-[#8D6E63]">{t('Loading...', 'లోడ్ అవుతోంది...')}</p> : stotrams.length === 0 ? (
          <LoadState error={loadError} emptyText={t('Stotrams will be added here soon.', 'స్తోత్రాలు త్వరలో ఇక్కడ చేర్చబడతాయి.')} />
        ) : (
          <div className="space-y-3">
            {/* Each stotram is its own route (/stotrams/:slug) rather than an
                inline accordion, so it gets its own indexable URL, title and
                meta description - see StotramDetail.jsx. */}
            {stotrams.map(s => (
              <Link
                key={s.id}
                to={`/stotrams/${s.slug}`}
                className="flex items-center gap-3 bg-white border border-[#E6DCCA] rounded-xl p-6 hover:border-[#C43E00]/40 transition-colors"
                data-testid={`stotram-${s.id}`}
              >
                <ScrollText className="h-5 w-5 text-[#8D6E63] shrink-0" />
                <div className="flex-1">
                  <h2 className="font-medium text-[#2D1B0E]">{t(s.title, s.title_telugu)}</h2>
                  {s.deity && <p className="text-xs text-[#8D6E63] mt-0.5">{s.deity}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-[#8D6E63] shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
