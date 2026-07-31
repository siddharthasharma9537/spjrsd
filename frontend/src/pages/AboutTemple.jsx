import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapPin, Clock, Phone, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

        {/* UPDATED: History Section with Parashurama Legend (Tabs) */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-english-heading text-3xl md:text-4xl text-[#621B00] mb-2">Temple History: The 108th Parashurama Linga</h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto rounded-full"></div>
          </div>

          <Tabs defaultValue="english" className="w-full">
            <div className="flex justify-center mb-10">
              <TabsList className="bg-[#FDFBF7] border border-[#E6DCCA] p-1 h-14 rounded-xl shadow-sm">
                <TabsTrigger value="english" className="px-10 font-english-heading text-lg rounded-lg data-[state=active]:bg-[#621B00] data-[state=active]:text-white">English</TabsTrigger>
                <TabsTrigger value="telugu" className="px-10 font-telugu-heading text-lg rounded-lg data-[state=active]:bg-[#621B00] data-[state=active]:text-white">తెలుగు</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="english" className="mt-0">
              <div className="max-w-4xl mx-auto bg-white border border-[#E6DCCA] rounded-[2rem] p-8 md:p-14 shadow-sm">
                <div className="text-[#5D4037] text-base md:text-lg leading-relaxed md:leading-loose space-y-6">
                  
                  <p className="first-letter:text-7xl first-letter:font-english-heading first-letter:text-[#D4AF37] first-letter:float-left first-letter:mr-4 first-letter:-mt-2 first-letter:leading-none">
                    In the sacred Treta Yuga, when Adharma spread across the earth, the sixth incarnation of Lord Vishnu, <strong>Lord Parashurama</strong>, incarnated to re-establish Dharma.
                    After destroying Kartavirya Arjuna and cleansing the earth of corrupt Kshatriya rulers, Parashurama felt the burden of the bloodshed. Following the divine guidance of Sage Jamadagni, he undertook a sacred pilgrimage and consecrated <strong>108 Shiva Lingas</strong> across Bharata Varsha to atone and restore cosmic balance.
                  </p>

                  <div className="my-10 float-none md:float-right md:ml-10 md:mb-6 md:w-[45%] rounded-2xl overflow-hidden border-[6px] border-[#FDFBF7] shadow-md">
                    <img
                      src="/Assets/919E13FD-D2A9-4FCF-B58F-1F152120B896.webp"
                      alt="Lord Parashurama at Ikshwadri Cave"
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="bg-[#FDFBF7] p-3 text-center border-t border-[#E6DCCA]">
                      <p className="text-xs text-[#8D6E63] italic font-english-heading">
                        Lord Parashurama consecrating the 108th Shiva Linga
                      </p>
                    </div>
                  </div>

                  <p>
                    After installing 107 Lingas, Parashurama arrived at the sacred hill known as <strong>Ikshwadri (present-day Cheruvugattu)</strong>. Recognizing its immense spiritual potency, he consecrated the <strong>108th and final Shiva Linga</strong> within a cave on this hill, installing it in a rare and powerful <strong>west-facing direction</strong>.
                  </p>
                  
                  <p>
                    Engaging in intense penance, Parashurama’s tapas radiated divine energy, causing the Linga to rise on its own. When he gently struck it with his axe (<em>Parashu</em>), Lord Shiva manifested in divine form with radiant matted locks (<em>Jadala</em>), and blessed Parashurama with absolution.
                  </p>
                  
                  <div className="clear-both"></div>

                  <hr className="my-12 border-[#E6DCCA]" />

                  <div className="text-center mb-8">
                    <span className="text-[#D4AF37] text-5xl leading-none">ॐ</span>
                    <h3 className="font-english-heading text-2xl md:text-3xl text-[#621B00] mt-3">Lord Shiva’s Divine Proclamation</h3>
                  </div>
                  
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                    <li className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center flex items-center justify-center">
                      This sacred Linga shall be known as <strong>&nbsp;Sri Jadala Ramalingeshwara Swamy</strong>.
                    </li>
                    <li className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center flex items-center justify-center">
                      The kshetram shall be a powerful center of spiritual purification.
                    </li>
                    <li className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center flex items-center justify-center">
                      Devotees worshipping here shall attain peace, prosperity, and Moksha.
                    </li>
                    <li className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center flex items-center justify-center">
                      Parashurama shall eternally remain associated with this holy place.
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="telugu" className="mt-0">
              <div className="max-w-4xl mx-auto bg-white border border-[#E6DCCA] rounded-[2rem] p-8 md:p-14 shadow-sm">
                <div className="font-telugu-body text-[#5D4037] text-base md:text-lg leading-relaxed md:leading-loose space-y-6">
                  
                  <p className="first-letter:text-7xl first-letter:font-telugu-heading first-letter:text-[#D4AF37] first-letter:float-left first-letter:mr-4 first-letter:-mt-1 first-letter:leading-none">
                    త్రేతాయుగమున అధర్మము విస్తరించెడి కాలమున, శ్రీమహావిష్ణువు ఆరవ అవతారముగా <strong>శ్రీ పరశురాముడు</strong> అవతరించెను. సంహార పాపభారము తన హృదయమునకు భారముగా అనిపించగా, జమదగ్ని మహర్షి ఉపదేశముచేత పరమేశ్వరుని అనుగ్రహార్థము భారతదేశమంతట <strong>108 శివలింగములను</strong> ప్రతిష్ఠించెను.
                  </p>

                  <div className="my-10 float-none md:float-right md:ml-10 md:mb-6 md:w-[45%] rounded-2xl overflow-hidden border-[6px] border-[#FDFBF7] shadow-md">
                    <img
                      src="/Assets/919E13FD-D2A9-4FCF-B58F-1F152120B896.webp"
                      alt="పరశురాముడు 108వ శివలింగాన్ని ప్రతిష్ఠించడం"
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="bg-[#FDFBF7] p-3 text-center border-t border-[#E6DCCA]">
                      <p className="text-xs text-[#8D6E63] italic font-telugu-body">
                        పరశురాముడు 108వ శివలింగాన్ని ప్రతిష్ఠించడం
                      </p>
                    </div>
                  </div>

                  <p>
                    107 శివలింగములను ప్రతిష్ఠించిన అనంతరం, నేటి <strong>చెరువుగట్టు అను ఇక్ష్వాద్రి గిరిపై</strong> గుహలో <strong>108వ మరియు చివరి శివలింగమును</strong> పశ్చిమాభిముఖముగా ప్రతిష్ఠించెను. 
                  </p>
                  
                  <p>
                    తపస్సు ప్రభావముచేత ఆ లింగము స్వయంగా పైకెత్తబడగా, పరశురాముడు తన పరశువుతో (గొడ్డలితో) తాకగా, పరమేశ్వరుడు <strong>జడలతో</strong> ప్రత్యక్షమై అనుగ్రహించెను.
                  </p>
                  
                  <div className="clear-both"></div>

                  <hr className="my-12 border-[#E6DCCA]" />

                  <div className="text-center mb-8">
                    <span className="text-[#D4AF37] text-5xl leading-none font-english-heading">ॐ</span>
                    <h3 className="font-telugu-heading text-2xl md:text-3xl text-[#621B00] mt-3">పరమేశ్వరుని వరప్రసాదము</h3>
                  </div>
                  
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                    <li className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center flex items-center justify-center">
                      ఈ లింగము <strong>శ్రీ జడల రామలింగేశ్వర స్వామి</strong>గా ప్రసిద్ధి పొందెను.
                    </li>
                    <li className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center flex items-center justify-center">
                      ఇక్కడ భక్తితో ప్రార్థించిన వారికి పాప విమోచనము, శాంతి, ఐశ్వర్యము, మోక్షము లభించును.
                    </li>
                    <li className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center flex items-center justify-center md:col-span-2 mx-auto w-full md:w-1/2">
                      పరశురాముడు ఈ పవిత్ర స్థలముతో శాశ్వతముగా ముడిపడి ఉండును.
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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