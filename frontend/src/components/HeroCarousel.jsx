import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useT } from "@/contexts/LanguageContext";

// A hand-picked set of photographs of the kshetram itself; captions describe
// what is actually in each frame.
const slides = [
  { title: 'Ikshwadri — The Sacred Hill', subtitle: 'ఇక్ష్వాద్రి — పవిత్ర గిరి', desc: 'The steps path rising to the Swamy, guarded by Sri Ganapati', cta: { label: 'Temples of the Kshetram', to: '/temples' }, image: '/Assets/Ikshwadri_Hill_2.webp' },
  { title: 'Sri Jadala Ramalingeshwara Swamy', subtitle: 'శ్రీ జడల రామలింగేశ్వర స్వామి', desc: 'The 108th and final Shiva Linga consecrated by Lord Parashurama', cta: { label: 'Book Seva', to: '/sevas' }, image: '/Assets/Sri_Swamy_Varu_Alankarm_1.webp' },
  { title: 'Sri Mallikarjuna Swamy', subtitle: 'శ్రీ మల్లిఖార్జున స్వామి', desc: 'Consort of Sri Bhramarambha Devi, at the foot of the hill', cta: { label: 'Temple History', to: '/temples' }, image: '/Assets/Mallikharjuna_Swamy_Down_Hill_2_Close_Up.webp' },
  { title: 'Moodu Gundlu', subtitle: 'మూడు గుండ్లు', desc: 'The revered Urdhva Lingam atop the three sacred rock pools', cta: { label: 'Read More', to: '/temples' }, image: '/Assets/Mudu_Gundlu_Shivalingam_4.webp', focus: '50% 45%' },
  { title: 'Sri Bhramarambha Devi', subtitle: 'శ్రీ భ్రమరాంబ దేవి', desc: 'Sri Parvathi Devi, at her shrine at the foot of the hill', cta: { label: 'Temple History', to: '/temples' }, image: '/Assets/Parvati_Devi_1.webp', focus: '50% 16%' },
  { title: 'Sri Maha Ganapati', subtitle: 'శ్రీ మహా గణపతి', desc: 'Adorned in floral alankaram during the festival days', cta: { label: 'View Gallery', to: '/gallery' }, image: '/Assets/Decorated_Ganapati.webp' },
  { title: 'Vaarshika Brahmotsavams', subtitle: 'వార్షిక బ్రహ్మోత్సవములు', desc: 'Five days of Kalyanotsavams drawing nearly five lakh devotees', cta: { label: 'View News', to: '/news' }, image: '/Assets/Brahmotsavama_Kalyana_Murthulu_3.webp' },
  { title: 'Swamy Vari Kalyanam', subtitle: 'స్వామివారి కళ్యాణం', desc: 'The Kalyana Murthulu adorned for the celestial marriage', cta: { label: 'Book Seva', to: '/sevas' }, image: '/Assets/Kalyana_Murthulu.webp' },
  { title: 'Amavasya Laksha Pushparchana', subtitle: 'అమావాస్య లక్ష పుష్పార్చన', desc: 'A lakh of flowers offered to the Swamy every Amavasya evening', cta: { label: 'Festivals & Jatara', to: '/about#festivals' }, image: '/Assets/Amavasya_Laksha_Pushaparchana_2.webp' },
  { title: 'Cheruvugattu Kshetram', subtitle: 'చెరువుగట్టు క్షేత్రము', desc: 'Cheruvugattu, Narketpally Mandal, Nalgonda, Telangana', cta: { label: 'Plan Your Visit', to: '/about' }, image: '/Assets/Ikshwadri_Hill.webp' },
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
    <section className="relative h-[400px] md:h-[500px] overflow-hidden" data-testid="hero-carousel">
      {/* Background */}
      {slides.map((s, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
          {s.image
            ? <img
                src={s.image}
                alt={s.title}
                className="w-full h-full object-cover"
                /* Portrait shots crop to a narrow band in this wide frame, so each
                   slide can pull the crop up to keep the deity's face in view. */
                style={{ objectPosition: s.focus || 'center' }}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
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
  );
}
