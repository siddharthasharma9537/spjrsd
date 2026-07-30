import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import HeroCarousel from '@/components/HeroCarousel';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { Flame, BookOpen, Heart, ChevronRight, Camera, Newspaper, BedDouble, HandCoins, Tv, IndianRupee, Clock } from 'lucide-react';

export default function Home() {
  const [news, setNews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [sevas, setSevas] = useState([]);

  useEffect(() => {
    api.get('/news').then(r => setNews(r.data.slice(0, 5))).catch(() => {});
    api.get('/gallery?media_type=PHOTO').then(r => setGallery(r.data.slice(0, 6))).catch(() => api.get('/gallery').then(r => setGallery(r.data.filter(g => !g.media_type || g.media_type === 'PHOTO').slice(0, 6))).catch(() => {}));
    api.get('/sevas').then(r => setSevas(r.data.slice(0, 4))).catch(() => {});
  }, []);

  const featureCards = [
    { icon: HandCoins, to: '/donations', title: 'e-Hundi', titleTe: 'ఈ-హుండి', desc: 'Online donations from across the globe for temple welfare', cta: 'Donate Now', color: '#D4AF37' },
    { icon: BookOpen, to: '/paroksha-seva', title: 'Paroksha Seva', titleTe: 'పరోక్ష సేవ', desc: 'Participate in sevas without being physically present', cta: 'Book Now', color: '#621B00' },
    { icon: Heart, to: '/donations/annaprasadam', title: 'AnnaPrasadam', titleTe: 'అన్నప్రసాదం', desc: 'Sponsor sacred food offering for devotees', cta: 'Donate Now', color: '#E65100' },
    { icon: BedDouble, to: '/accommodation', title: 'Accommodation', titleTe: 'వసతి', desc: 'Rooms, cottages and guest houses for visiting pilgrims', cta: 'Book Now', color: '#621B00' },
    { icon: Tv, to: '/media/live-tv', title: 'Temple TV', titleTe: 'ఆలయ టీవీ', desc: '24x7 live darshan and devotional programs', cta: 'Watch Now', color: '#E65100' },
    { icon: Camera, to: '/gallery', title: 'Photo Gallery', titleTe: 'ఫోటో గ్యాలరీ', desc: 'Beautiful moments from the sacred temple', cta: 'View Gallery', color: '#D4AF37' },
  ];

  const mainOfferings = [
    { name: 'Abhishekam / అభిషేకం', desc: 'Sacred bathing ritual with milk, water, honey' },
    { name: 'Archana / అర్చన', desc: 'Flower offering with sacred names chanting' },
    { name: 'Kumkuma Archana / కుంకుమ అర్చన', desc: 'Special archana with kumkum powder' },
    { name: 'Sahasranama / సహస్రనామ అర్చన', desc: 'Chanting of 1000 divine names' },
    { name: 'Kalyanam / కల్యాణం', desc: 'Celestial marriage ceremony' },
    { name: 'Rudra Abhishekam / రుద్ర అభిషేకం', desc: 'Grand abhishekam with Rudra chanting' },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* News Ticker */}
      {news.length > 0 && (
        <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 overflow-hidden" data-testid="news-ticker">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 py-2">
            <span className="bg-[#E65100] text-white text-xs px-3 py-1 rounded-full font-medium shrink-0 flex items-center gap-1">
              <Newspaper className="h-3 w-3" /> News
            </span>
            <div className="overflow-hidden whitespace-nowrap flex-1">
              <div className="inline-block animate-marquee">
                {news.map((n) => (
                  <Link key={n.id} to="/news" className="inline text-sm text-[#621B00] mx-8 hover:text-[#E65100] transition-colors">
                    {n.is_important && <span className="text-[#E65100] font-bold mr-1">*</span>}
                    {n.title} {n.title_telugu && <span className="font-telugu-body text-[#8D6E63]"> | {n.title_telugu}</span>}
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/news" className="text-xs text-[#E65100] hover:underline shrink-0 font-medium" data-testid="view-all-news">View All</Link>
          </div>
        </div>
      )}

      {/* Key Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="font-english-heading text-2xl md:text-3xl text-[#621B00] mb-1">Temple Services</h2>
          <p className="font-telugu-heading text-xl text-[#8D6E63]">దేవస్థానం సేవలు</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((c, i) => (
            <div key={i} className="bg-white border border-[#E6DCCA] rounded-xl p-6 hover:border-[#D4AF37]/50 hover:shadow-lg transition-all group" data-testid={`feature-card-${i}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{backgroundColor: `${c.color}15`}}>
                  <c.icon className="h-6 w-6" style={{color: c.color}} />
                </div>
                <div className="flex-1">
                  <h3 className="font-english-heading text-sm text-[#2D1B0E] tracking-wide group-hover:text-[#E65100] transition-colors">{c.title}</h3>
                  <p className="font-telugu-heading text-base text-[#621B00]">{c.titleTe}</p>
                </div>
              </div>
              <p className="text-xs text-[#5D4037] mb-4 leading-relaxed">{c.desc}</p>
              <div className="flex items-center gap-3">
                <Link to={c.to} className="inline-flex items-center gap-1 px-4 py-2 bg-[#E65100] text-white text-xs rounded-full hover:bg-[#E65100]/90 transition-all" data-testid={`feature-cta-${i}`}>
                  {c.cta} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link to={c.to} className="text-xs text-[#8D6E63] hover:text-[#E65100] transition-colors">More Info</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* UPDATED: About Section / Sthala Puranam */}
      <section className="bg-[#2D1B0E] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="font-telugu-heading text-lg text-[#D4AF37] mb-2">స్థలపురాణము</p>
              <h2 className="font-english-heading text-2xl md:text-3xl mb-4">Sthala Puranam: The 108th Parashurama Linga</h2>
              <p className="text-[#FFE0B2]/80 leading-relaxed mb-3 text-sm">
                In the sacred Treta Yuga, the sixth incarnation of Lord Vishnu, <strong>Lord Parashurama</strong>, undertook a divine pilgrimage to cleanse the earth and restore cosmic balance. Following the guidance of Sage Jamadagni, he consecrated exactly 108 Shiva Lingas across Bharata Varsha.
              </p>
              <p className="text-[#FFE0B2]/80 leading-relaxed mb-6 text-sm">
                Arriving at the spiritually potent hill of <strong>Ikshwadri (Cheruvugattu)</strong>, Lord Parashurama installed the <strong>108th and final Shiva Linga</strong> within a cave in a rare west-facing direction. Through his intense penance, Lord Shiva manifested with radiant matted locks (<em>Jadala</em>) to grant him absolution.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 px-5 py-2 border border-[#D4AF37] text-[#D4AF37] rounded-full text-sm hover:bg-[#D4AF37]/10 transition-all" data-testid="read-more-about">
                Read Full History <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            {/* UPDATED: Embedded Artworks Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/20">
                  <img src="/assets/A02570B3-74C8-4557-9656-EBA6875EF238.jpeg" alt="Portrait of Lord Parashurama" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/20">
                  <img src="/assets/parashurama.webp" alt="Lord Parashurama Warrior" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              </div>
              <div className="aspect-[1/2] rounded-xl overflow-hidden bg-black/20">
                <img src="/assets/919E13FD-D2A9-4FCF-B58F-1F152120B896.webp" alt="Parashurama consecrating the cave Linga" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pratyaksha Seva Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-english-heading text-2xl text-[#621B00] mb-1">Pratyaksha Seva</h2>
            <p className="font-telugu-heading text-lg text-[#8D6E63]">ప్రత్యక్ష సేవ</p>
          </div>
          <Link to="/sevas" className="inline-flex items-center gap-1 text-sm text-[#E65100] hover:underline" data-testid="explore-sevas-link">
            Explore All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sevas.map(seva => (
            <Link key={seva.id} to={`/book/${seva.id}`} className="bg-white border border-[#E6DCCA] rounded-xl p-5 hover:border-[#D4AF37]/50 hover:shadow-md transition-all group" data-testid={`seva-preview-${seva.id}`}>
              <h3 className="font-english-heading text-sm text-[#2D1B0E] group-hover:text-[#E65100] transition-colors">{seva.name_english}</h3>
              <p className="font-telugu-heading text-base text-[#621B00]">{seva.name_telugu}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 text-xs text-[#8D6E63]"><Clock className="h-3 w-3" /> {seva.duration_minutes} min</span>
                <span className="flex items-center gap-0.5 font-bold text-[#E65100]"><IndianRupee className="h-3.5 w-3.5" />{seva.base_price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Offerings */}
      <section className="bg-[#FDFBF7] border-y border-[#E6DCCA] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-english-heading text-2xl text-[#621B00] mb-1">Main Offerings</h2>
              <p className="font-telugu-heading text-lg text-[#8D6E63]">ప్రధాన సేవలు</p>
            </div>
            <Link to="/sevas" className="inline-flex items-center gap-1 text-sm text-[#E65100] hover:underline">View All Offerings <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainOfferings.map((o, i) => (
              <div key={i} className="flex items-center gap-4 bg-white border border-[#E6DCCA] rounded-xl p-4 hover:border-[#D4AF37]/40 transition-all" data-testid={`offering-${i}`}>
                <div className="w-10 h-10 bg-[#E65100]/10 rounded-full flex items-center justify-center shrink-0">
                  <Flame className="h-5 w-5 text-[#E65100]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#2D1B0E]">{o.name}</h3>
                  <p className="text-xs text-[#8D6E63] mt-0.5">{o.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Preview */}
      {gallery.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-english-heading text-2xl text-[#621B00] mb-1">The Beauty of Sacred Cheruvugattu</h2>
              <p className="font-telugu-heading text-lg text-[#8D6E63]">పవిత్ర చెరువుగట్టు సౌందర్యం</p>
            </div>
            <Link to="/gallery" className="inline-flex items-center gap-1 text-sm text-[#E65100] hover:underline">View All <ChevronRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {gallery.map((img, i) => (
              <Link to="/gallery" key={i} className="aspect-square rounded-xl overflow-hidden group">
                <img src={img.image_url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="bg-[#FDFBF7] border-t border-[#E6DCCA] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { to: '/print-ticket', label: 'Print Ticket', labelTe: 'టికెట్ ప్రింట్' },
              { to: '/booking/quick', label: 'Quick Booking', labelTe: 'త్వరిత బుకింగ్' },
              { to: '/my-bookings', label: 'My Bookings', labelTe: 'నా బుకింగ్‌లు' },
              { to: '/volunteer', label: 'Volunteer', labelTe: 'వాలంటీర్' },
              { to: '/about', label: 'How to Reach', labelTe: 'ఎలా చేరుకోవాలి' },
            ].map((l, i) => (
              <Link key={i} to={l.to} className="bg-white border border-[#E6DCCA] rounded-xl p-4 text-center hover:border-[#D4AF37]/50 hover:shadow-md transition-all">
                <p className="text-sm font-medium text-[#2D1B0E]">{l.label}</p>
                <p className="text-xs font-telugu-body text-[#8D6E63]">{l.labelTe}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}