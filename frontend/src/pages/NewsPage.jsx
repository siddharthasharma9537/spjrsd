import { useState, useEffect } from 'react';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from "@/components/LoadState";
import { useT } from "@/contexts/LanguageContext";
import { Newspaper, AlertCircle } from 'lucide-react';

export default function NewsPage() {
  const { t, heading } = useT();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/news').then(r => setNews(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="news-title">{t("Temple News", "ఆలయ వార్తలు")}</h1>
        </div>
        {loading ? <p className="text-center text-[#8D6E63]">Loading...</p> : news.length === 0 ? (
          <LoadState error={loadError} emptyText="No news or announcements yet." />
        ) : (
          <div className="space-y-4">
            {news.map(n => (
              <div key={n.id} className={`bg-white border rounded-xl p-6 ${n.is_important ? 'border-[#C43E00]/30 bg-[#C43E00]/5' : 'border-[#E6DCCA]'}`} data-testid={`news-item-${n.id}`}>
                <div className="flex items-start gap-3">
                  {n.is_important ? <AlertCircle className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" /> : <Newspaper className="h-5 w-5 text-[#8D6E63] shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-medium text-[#2D1B0E]">{n.title}</h2>
                      {n.is_important && <span className="px-2 py-0.5 bg-[#C43E00] text-white text-xs rounded-full">Important</span>}
                    </div>
                    <p className="text-sm text-[#5D4037] leading-relaxed mb-2">{n.content}</p>
                    {n.content_telugu && <p className="font-telugu-body text-sm text-[#8D6E63] leading-relaxed">{n.content_telugu}</p>}
                    <p className="text-xs text-[#8D6E63] mt-3">{new Date(n.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
