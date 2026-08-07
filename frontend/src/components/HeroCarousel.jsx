import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from "@/contexts/LanguageContext";

// All slides now carry authentic photographs of the kshetram itself.
const slides = [
  { title: 'Sri Parvathi Jadala Ramalingeshwara Swamy', subtitle: 'శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం', desc: 'Cheruvugattu, Narketpally Mandal, Nalgonda, Telangana', cta: { label: 'Book Seva', to: '/sevas' }, image: '/Assets/Main_Temple_Full_View_Up_Hill.jpg' },
  { title: 'The 108th Parashurama Linga', subtitle: 'స్థల పురాణము', desc: 'The last of the 108 Shiva Lingas consecrated by Lord Parashurama', cta: { label: 'Read Sthala Puranam', to: '/about' }, image: '/Assets/Sri_Swamy_Varu_0.jpg' },
  { title: 'Sri Parvathi Devi Temple', subtitle: 'శ్రీ పార్వతీ దేవి ఆలయం', desc: 'The Ammavaru shrine at the foot of the sacred hill', cta: { label: 'Temple History', to: '/about' }, image: '/Assets/Parvati_Devi_Temple_Panoramic_View_Down_Hill.jpg' },
  { title: 'Moodu Gundlu', subtitle: 'మూడు గుండ్లు', desc: 'The revered Urdhva Lingam atop the three sacred rock pools', cta: { label: 'Read More', to: '/about' }, image: '/Assets/Mudu_Gundlu_Shivalingam_6.jpg' },
  { title: 'Vaarshika Brahmotsavams', subtitle: 'వార్షిక బ్రహ్మోత్సవములు', desc: 'Five days of Kalyanotsavams drawing nearly five lakh devotees', cta: { label: 'View News', to: '/news' }, image: '/Assets/Brahmotsavam_Pavalimpu_Seva_Decoratin_1.jpg' },
  { title: 'e-Hundi Online Donation', subtitle: 'ఈ-హుండి ఆన్‌లైన్ దానం', desc: 'Contribute to temple welfare from anywhere in the world', cta: { label: 'Donate Now', to: '/donations' }, image: '/Assets/Sri_Swamy_Varu_2.jpg' },
  { title: 'Pilgrim Accommodation', subtitle: 'యాత్రికుల వసతి', desc: 'Comfortable rooms and cottages for visiting devotees', cta: { label: 'Book Room', to: '/accommodation' }, image: '/Assets/Parvati_Devi_Temple_Top_View_Down_Hill.jpg' },
];

export default function HeroCarousel() {
  const { t, heading } = useT();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), []);
  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const slide = slides[current];

  return (
    <div
      className="p-1.5"
      style={{
        backgroundColor: '#D4AF37',
        backgroundImage: 'repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 6px, #8a6d1f 6px, #8a6d1f 12px)',
      }}
    >
    <div className="p-[3px] bg-[#2D1B0E]">
    <section className="relative h-[400px] md:h-[500px] overflow-hidden" data-testid="hero-carousel">
      {/* Background */}
      {slides.map((s, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
          {s.image
            ? <img src={s.image} alt={s.title} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            : <div className="w-full h-full temple-gradient" />}
          {/* Overlay is tuned for the light-toned temple artwork - the gold Telugu
              subtitle needs contrast even over the brightest part of the image. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/45" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center text-white px-4">
        <div className="max-w-3xl animate-fade-in-up" key={current}>
          <h1 className={`${heading} text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3`}>{t(slide.title, slide.subtitle)}</h1>
          <p className="text-[#FFE0B2]/80 text-sm md:text-base mb-6">{slide.desc}</p>
          <Link to={slide.cta.to} className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#2A1800] font-english-heading tracking-wide uppercase text-sm px-6 py-2.5 rounded-full hover:bg-[#e6c44a] transition-all shadow-lg" data-testid="hero-cta">
            {slide.cta.label}
          </Link>
        </div>
      </div>

      {/* Nav arrows */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-all" data-testid="carousel-prev">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-all" data-testid="carousel-next">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-[#D4AF37] w-6' : 'bg-white/40 hover:bg-white/60'}`} data-testid={`carousel-dot-${i}`} />
        ))}
      </div>
    </section>
    </div>
    </div>
  );
}
