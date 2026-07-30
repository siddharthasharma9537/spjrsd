import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapPin, Clock, Phone, Calendar } from 'lucide-react';

export default function AboutTemple() {
  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />

      {/* Hero */}
      <div className="temple-gradient text-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-telugu-heading text-xl text-[#D4AF37] mb-2">శ్రీ చెరువుగట్టు క్షేత్ర చరిత్ర</p>
          <h1 className="font-english-heading text-2xl md:text-4xl mb-2" data-testid="about-title">Sthala Puranam: The Legend of Ikshwadri</h1>
          <p className="text-[#FFE0B2]/70 text-sm">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* UPDATED: History Section with Parashurama Legend */}
        <section>
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Temple History: The 108th Parashurama Linga</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-6">ఆలయ చరిత్ర</p>

          <div className="text-sm text-[#5D4037] leading-relaxed space-y-4">
            <p>
              In the sacred Treta Yuga, when Adharma spread across the earth, the sixth incarnation of Lord Vishnu, <strong>Lord Parashurama</strong>, incarnated to re-establish Dharma.
              After destroying Kartavirya Arjuna and cleansing the earth of corrupt Kshatriya rulers, Parashurama felt the burden of the bloodshed. Following the divine guidance of Sage Jamadagni, he undertook a sacred pilgrimage and consecrated <strong>108 Shiva Lingas</strong> across Bharata Varsha to atone and restore cosmic balance.
            </p>

            <div className="flex flex-col md:flex-row gap-6 my-6 p-5 bg-white border border-[#E6DCCA] rounded-xl shadow-sm">
              <div className="flex-1 space-y-4">
                <p>
                  After installing 107 Lingas, Parashurama arrived at the sacred hill known as <strong>Ikshwadri (present-day Cheruvugattu)</strong>. Recognizing its immense spiritual potency, he consecrated the <strong>108th and final Shiva Linga</strong> within a cave on this hill, installing it in a rare and powerful <strong>west-facing direction</strong>.
                </p>
                <p>
                  Engaging in intense penance, Parashurama’s tapas radiated divine energy, causing the Linga to rise on its own. When he gently struck it with his axe (<em>Parashu</em>), Lord Shiva manifested in divine form with radiant matted locks (<em>Jadala</em>), and blessed Parashurama with absolution.
                </p>
              </div>
              <div className="md:w-64 shrink-0 text-center">
                {/* Make sure 919E13FD-D2A9-4FCF-B58F-1F152120B896.webp is placed in public/assets/ */}
                <img
                  src="/assets/919E13FD-D2A9-4FCF-B58F-1F152120B896.webp"
                  alt="Lord Parashurama at Ikshwadri Cave"
                  className="w-full rounded-lg shadow-sm border border-[#D4AF37]"
                  loading="lazy"
                />
                <p className="text-xs text-[#8D6E63] mt-2 italic font-telugu-body">
                  పరశురాముడు 108వ శివలింగాన్ని ప్రతిష్ఠించడం
                </p>
              </div>
            </div>

            <div className="bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] p-5 rounded-r-xl my-6">
              <h3 className="font-english-heading text-[#621B00] mb-2 text-base">Lord Shiva’s Divine Proclamation:</h3>
              <ul className="list-disc ml-5 space-y-1 text-[#2D1B0E]">
                <li>This sacred Linga shall be known as <strong>Sri Jadala Ramalingeshwara Swamy</strong>.</li>
                <li>The kshetram shall be a powerful center of spiritual purification.</li>
                <li>Devotees worshipping here shall attain peace, prosperity, and Moksha.</li>
                <li>Parashurama shall eternally remain associated with this holy place.</li>
              </ul>
            </div>

            {/* Telugu Inscription Sub-Section */}
            <div className="mt-8 border-t border-[#E6DCCA] pt-6">
              <h3 className="font-telugu-heading text-lg text-[#621B00] mb-4 text-center">స్థలపురాణము</h3>
              <div className="bg-[#FDFBF7] border border-[#E6DCCA] p-6 rounded-xl font-telugu-body text-[#5D4037] leading-loose space-y-4 shadow-inner">
                <p className="text-center font-bold text-[#621B00]">🛕 శ్రీ పార్వతి జడల రామలింగేశ్వర స్వామి దేవస్థానం — చెరువుగట్టు (ఇక్ష్వాద్రి)</p>
                <p>
                  త్రేతాయుగమున అధర్మము విస్తరించెడి కాలమున, శ్రీమహావిష్ణువు ఆరవ అవతారముగా శ్రీ పరశురాముడు అవతరించెను. సంహార పాపభారము తన హృదయమునకు భారముగా అనిపించగా, జమదగ్ని మహర్షి ఉపదేశముచేత పరమేశ్వరుని అనుగ్రహార్థము భారతదేశమంతట 108 శివలింగములను ప్రతిష్ఠించెను.
                </p>
                <p>
                  107 శివలింగములను ప్రతిష్ఠించిన అనంతరం, నేటి చెరువుగట్టు అను ఇక్ష్వాద్రి గిరిపై గుహలో 108వ మరియు చివరి శివలింగమును పశ్చిమాభిముఖముగా ప్రతిష్ఠించెను. తపస్సు ప్రభావముచేత ఆ లింగము స్వయంగా పైకెత్తబడగా, పరశురాముడు తన పరశువుతో (గొడ్డలితో) తాకగా, పరమేశ్వరుడు జడలతో ప్రత్యక్షమై అనుగ్రహించెను.
                </p>
                <p>
                  <strong className="text-[#621B00]">పరమేశ్వరుని వరప్రసాదము:</strong> ఈ లింగము “శ్రీ జడల రామలింగేశ్వర స్వామి”గా ప్రసిద్ధి పొందెను. ఇక్కడ భక్తితో ప్రార్థించిన వారికి పాప విమోచనము, శాంతి, ఐశ్వర్యము, మోక్షము లభించును.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Significance */}
        <section className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-6 mt-10">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Spiritual Significance</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ఆధ్యాత్మిక ప్రాముఖ్యత</p>
          <div className="text-sm text-[#5D4037] leading-relaxed space-y-3">
            <p>Cheruvugattu is considered equivalent to Srisailam in spiritual merit. Devotees believe that worshipping at this temple bestows the same divine blessings as visiting the great Jyotirlinga shrines.</p>
            <p>The temple complex houses multiple shrines and mandapams, each with historical and mythological significance. The sacred hill provides a serene atmosphere conducive to meditation and prayer.</p>
          </div>
        </section>

        {/* Festivals */}
        <section>
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Major Festivals</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ప్రధాన పండుగలు</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Maha Shivaratri Brahmotsavams', nameTe: 'మహా శివరాత్రి బ్రహ్మోత్సవాలు', desc: 'The grandest festival spanning 10+ days with special sevas, cultural programs, and lakhs of devotees.' },
              { name: 'Karthika Masam', nameTe: 'కార్తీక మాసం', desc: 'Sacred month of Lord Shiva with daily special pujas and deepotsavam.' },
              { name: 'Maha Pradosham', nameTe: 'మహా ప్రదోషం', desc: 'Bi-monthly observance with special Shiva puja during twilight hours.' },
              { name: 'Pournami & Amavasya', nameTe: 'పౌర్ణమి & అమావాస్య', desc: 'Full moon and new moon days with special abhishekams and archanas.' },
            ].map((f, i) => (
              <div key={i} className="bg-white border border-[#E6DCCA] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-[#E65100]" />
                  <h3 className="font-medium text-[#2D1B0E] text-sm">{f.name}</h3>
                </div>
                <p className="font-telugu-body text-sm text-[#621B00] mb-1">{f.nameTe}</p>
                <p className="text-xs text-[#8D6E63]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to Reach */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">How to Reach</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ఎలా చేరుకోవాలి</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-sm text-[#5D4037]">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#E65100] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">Location</p>
                  <p>Cheruvugattu, Nalgonda District, Telangana, India</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#E65100] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">Temple Timings</p>
                  <p>Morning: 6:00 AM - 12:00 PM</p>
                  <p>Evening: 4:00 PM - 8:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#E65100] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">Administration</p>
                  <p>Telangana Endowments Department</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-[#5D4037] space-y-2">
              <p><strong>By Road:</strong> Well-connected to Nalgonda (approx. 20 km) and Hyderabad (approx. 150 km) via national highways.</p>
              <p><strong>By Rail:</strong> Nearest railway station is Nalgonda. Auto-rickshaws and buses available from the station.</p>
              <p><strong>By Air:</strong> Nearest airport is Rajiv Gandhi International Airport, Hyderabad (approx. 150 km).</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}