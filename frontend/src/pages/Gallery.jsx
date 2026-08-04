import { useState, useEffect } from 'react';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import LoadState from "@/components/LoadState";
import { useT } from "@/contexts/LanguageContext";

export default function Gallery() {
  const { t, heading } = useT();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/gallery').then(r => setImages(r.data)).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(images.map(i => i.category))];
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? images : images.filter(i => i.category === filter);

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className={`${heading} text-2xl md:text-4xl text-[#621B00] mb-1`} data-testid="gallery-title">{t("Photo Gallery", "ఫోటో గ్యాలరీ")}</h1>
          <p className="text-sm text-[#5D4037] mt-2">The Beauty of Sacred Cheruvugattu</p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-4 py-1.5 rounded-full text-sm transition-all ${filter === c ? 'bg-[#C43E00] text-white' : 'bg-white border border-[#E6DCCA] text-[#5D4037] hover:border-[#D4AF37]'}`} data-testid={`gallery-filter-${c}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? <p className="text-center text-[#8D6E63]">Loading...</p> : filtered.length === 0 ? (
          <LoadState error={loadError} emptyText="No photographs have been published yet." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((img, i) => (
              <div key={img.id} className="group cursor-pointer rounded-xl overflow-hidden aspect-square relative" onClick={() => setSelected(img)} data-testid={`gallery-item-${img.id}`}>
                <img src={img.image_url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-medium">{img.title}</p>
                    <p className="text-white/60 text-xs">{img.category}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selected && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <img src={selected.image_url} alt={selected.title} className="w-full rounded-xl max-h-[80vh] object-contain" />
              <div className="text-center mt-4">
                <p className="text-white text-lg">{selected.title}</p>
                <p className="text-white/50 text-sm">{selected.category}</p>
              </div>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-black/70">&times;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
