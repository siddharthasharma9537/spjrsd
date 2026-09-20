import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

/* Photographs from the annual Brahmotsavams. */
const BRAHMOTSAVAM = [
  { img: '/Assets/Brahmotsavam_Dhwajarohanam_1.webp', en: 'Dhwajarohanam — the flag hoisting that opens the festival', te: 'ధ్వజారోహణం — ఉత్సవ ప్రారంభము' },
  { img: '/Assets/Brahmotsavam_Pavalimpu_Seva_Decoratin_1.webp', en: 'Pavalimpu Seva floral decoration', te: 'పవళింపు సేవ పుష్పాలంకరణ' },
  { img: '/Assets/Brahmotsavam_Pavalimpu_Seva_Decoratin_3.webp', en: 'Pavalimpu Seva mandapam', te: 'పవళింపు సేవ మండపము' },
  { img: '/Assets/Brahmotsavam_Alankara_Ganapati_2026.webp', en: 'Alankara Ganapati', te: 'అలంకార గణపతి' },
  { img: '/Assets/Utsava_Murthulu_1.webp', en: 'Utsava Murthulu adorned for procession', te: 'ఉత్సవ మూర్తులు' },
  { img: '/Assets/Brahmotsavam_Cultural_Dance_1.webp', en: 'Cultural performances by devotees', te: 'భక్తులచే సాంస్కృతిక కార్యక్రమములు' },
];

/* Telugu copy below is the temple's own wording from the Devasthanam handout;
   the English is a translation of it. Keep the two in sync when editing. */
const CONTENT = {
  significance: {
    en: [
      'Cheruvugattu is considered equivalent to Srisailam in spiritual merit. Devotees believe that worshipping at this temple bestows the same divine blessings as visiting the great Jyotirlinga shrines.',
      'The temple complex houses multiple shrines and mandapams, each with historical and mythological significance. The sacred hill provides a serene atmosphere conducive to meditation and prayer.',
    ],
    te: [
      'చెరువుగట్టు క్షేత్రము ఆధ్యాత్మిక ఫలమునందు శ్రీశైలముతో సమానమని భావింపబడుచున్నది. ఈ ఆలయమునందు అర్చించిన భక్తులకు మహా జ్యోతిర్లింగ క్షేత్రములను దర్శించినంత పుణ్యఫలము లభించునని భక్తుల విశ్వాసము.',
      'ఈ దేవస్థాన ప్రాంగణమునందు అనేక ఉపాలయములు, మండపములు కలవు. ప్రతిదానికి చారిత్రక, పౌరాణిక ప్రాముఖ్యత కలదు. ఈ పవిత్ర గిరి ధ్యానమునకు, ప్రార్థనకు అనుకూలమైన ప్రశాంత వాతావరణమును కలిగియున్నది.',
    ],
  },
  arogya: {
    en: [
      'It is a deep-rooted belief that devotees suffering from ill health, who observe Mandala or Ardha Mandala Deeksha in the temple premises and partake of the daily theertha-prasadam in the Swamy\'s presence, are cured and return home to live healthily with their families. For this reason, Cheruvugattu is revered as an "Arogya Kshetram", with many devotees staying near the temple for months at a stretch.',
      'On the path to the Anjaneya Swamy shrine lies the famed "Operation Banda" (Operation Rock) — devotees hold a strong belief that lying on this rock dissolves abdominal growths.',
    ],
    te: [
      'ఈ దేవాలయ ప్రాంగణంలో మండల, అర్ధ మండల దీక్ష తీసుకుని శ్రీ స్వామివారి సన్నిధిలో ప్రతిరోజు తీర్థ ప్రసాదములు స్వీకరించి, తమ ఆరోగ్యం చక్కబడిన తరువాత శ్రీ స్వామివారి కృపతో తిరిగి తమ స్వగ్రామం వెళ్ళి, తమ కుటుంబసభ్యులతో, బంధుమిత్రులతో సంపూర్ణ ఆరోగ్యవంతులుగా జీవించడం వలన ఈ క్షేత్రాన్ని "ఆరోగ్యక్షేత్రం"గా పిలుస్తారు. అనేకమంది భక్తులు ఇక్కడ నెలలపాటు దైవసన్నిధిలో ఉంటారు.',
      'స్వామివారి దర్శనానంతరం ఆంజనేయస్వామివారి ఆలయమునకు వెళ్ళేదారిలో ఉన్న "ఆపరేషన్ బండ" పై పడుకున్నంత మాత్రానే కడుపులో ఉన్న గడ్డలు కరుగుతాయని భక్తుల ప్రగాఢ నమ్మకం.',
    ],
  },
  amavasya: {
    en: [
      'Every month, Rudra Homam is performed on Chaturdashi, the day before Amavasya. On Amavasya evening at 7 PM, Laksha Pushparchana is conducted for the Swamy with great grandeur, followed by a Vahana Seva procession around the temple and Pancharathi at the Koneru atop the hill, before the deity is taken back into the sanctum.',
      'Nearly a lakh devotees visit the temple every Amavasya. Many believe that sleeping in the temple premises on Amavasya night improves their health, fulfils their wishes, and betters their circumstances — some observe 3, 5, 7, 9, or even 11 consecutive Amavasyas with devotion.',
    ],
    te: [
      'ఈ దేవాలయములో ప్రతి నెల అమావాస్య ముందు రోజు చతుర్దశి రోజున రుద్రహోమము చేయుట ఇక్కడి ఆనవాయితి. ప్రతి అమావాస్య రోజు సాయంత్రము 7 గంటలకు స్వామివారికి లక్షపుష్పార్చన కార్యక్రమము అత్యంత వైభవముగా నిర్వహించి, తదనంతరం శ్రీ స్వామివారిని వాహనసేవలో దేవాలయము చుట్టూ ప్రదక్షిణంగావించి, గట్టుపైన గల కోనేరులో పంచహారతులు ఇచ్చి తిరిగి స్వామివారిని ఆలయములోకి ప్రవేశపెట్టుట ఆచారము.',
      'ప్రతి అమావాస్య రోజు ఈ దేవాలయమునకు సుమారుగా లక్ష పైచిలుకు భక్తులు విచ్చేయుదురు. దేవాలయ ప్రాంగణంలో నిద్రచేస్తే వారి ఆరోగ్యం, కోరికలు, స్థితిగతులు మెరుగుపడతాయనే నమ్మకంతో కొంతమంది భక్తులు 11 అమావాస్యలు, మరికొంతమంది 9, 7, 5, 3 అమావాస్యలు భక్తిశ్రద్ధలతో దర్శిస్తారు.',
    ],
  },
  highlights: [
    { labelEn: 'Santhana Prapti', labelTe: 'సంతాన ప్రాప్తి',
      en: 'Devotees blessed with children after praying here traditionally offer a young bull (kode) to the temple.',
      te: 'శ్రీ స్వామివారిని దర్శించే భక్తులు తమకు సంతానం కలిగితే కోడెను కట్టుట ఆచారము.' },
    { labelEn: 'New Vehicle Pujas', labelTe: 'నూతన వాహన పూజలు',
      en: 'Devotees from Nalgonda and neighbouring districts bring newly purchased vehicles for puja here.',
      te: 'ఈ జిల్లాలోనే గాక ప్రక్క జిల్లాలలోని భక్తులు నూతన వాహనములు ఖరీదు చేసి ఈ దేవాలయమునకు వచ్చి పూజా కార్యక్రమములు చేసుకొనుట భక్తుల ఆనవాయితి.' },
    { labelEn: 'Pournami', labelTe: 'పౌర్ణమి',
      en: 'Chandi Homam at the Amma Vari temple and Masa Kalyanam for the Swamy are conducted with great splendour every full moon.',
      te: 'ప్రతి నెల పౌర్ణమి రోజున శ్రీ అమ్మవారి దేవాలయమునందు చండీహోమము మరియు స్వామివారికి మాసకళ్యాణ కార్యక్రమము అత్యంత వైభవముగా నిర్వహించబడును.' },
    { labelEn: 'Swamy Vari Pushkarini', labelTe: 'స్వామివారి పుష్కరిణి',
      en: 'Devotees bathe in the temple\'s sacred pushkarini before darshan of the deity.',
      te: 'ఈ దేవాలయానికి విచ్చేసిన ప్రతి భక్తుడూ ఈ పుష్కరిణిలో స్నానం చేసి పవిత్రమై స్వామివారిని దర్శించుకోవటం ఆచారం.' },
    { labelEn: 'Swamy Vari Padalu (Hilltop)', labelTe: 'స్వామివారి పాదాలు (గట్టుపైన)',
      en: 'At the Swamy\'s footprints atop the hill, devotees perform 11, 21, or 41 pradakshinas as an act of devotion. A second Swamy Vari Padalu shrine stands separately at Yellareddigudem village, on the main road before Cheruvugattu.',
      te: 'గుట్టపైన శ్రీ స్వామివారి పాదాల వద్ద భక్తులు 11, 21 మరియు 41 ప్రదక్షిణలు చేసి భక్తిని చాటుకుంటారు. చెరువుగట్టుకు ముందు యెల్లారెడ్డిగూడెం గ్రామంలో ప్రధాన రహదారిపై మరొక స్వామివారి పాదాల ఆలయం వేరుగా కలదు.' },
    { labelEn: 'Moodu Gundlu', labelTe: 'భక్తుల కడగండ్లు తీర్చే మూడుగుండ్లు',
      en: 'Climbing the three sacred rock pools to seek the Swamy\'s darshan is believed to relieve devotees of sin and suffering.',
      te: 'మూడుగుండ్లు ఎక్కి శ్రీ స్వామివారిని దర్శించుకోవడం ద్వారా సమస్త పాపభీతి, కష్టాలు తొలగిపోతాయని నమ్మకం.' },
  ],
  festivals: [
    { name: 'Ugadi', nameTe: 'ఉగాది', desc: 'Laksha Bilwarchana and Panchanga Shravanam by Vedic scholars.', descTe: 'లక్షబిల్వార్చన మరియు వేదపండితులచే పంచాంగశ్రవణం.' },
    { name: 'Sri Hanuman Jayanti', nameTe: 'శ్రీ హనుమాన్ జయంతి', desc: 'Special abhishekams and Aaku Pujalu for Anjaneya Swamy.', descTe: 'ఆంజనేయస్వామివారికి విశేష అభిషేకములు, ఆకుపూజలు.' },
    { name: 'Toli Ekadasi', nameTe: 'తొలి ఏకాదశి', desc: 'Swamy Nama Parayana jagarana during Ashada Masam.', descTe: 'ఆషాఢమాసమునందు స్వామి నామపారాయణ జాగరణలు.' },
    { name: 'Ganesh Navaratri & Sri Krishnashtami', nameTe: 'గణేష్ నవరాత్రులు & శ్రీకృష్ణాష్టమి', desc: 'Special pujas and Utla Panduga celebrations.', descTe: 'విశేష పూజలు, ఉట్లపండుగ.' },
    { name: 'Devi Navaratrulu', nameTe: 'దేవీ నవరాత్రులు', desc: 'Sri Ammavari Sharannavaratrotsavams, Chandi Homam, and Vijayadashami celebrations.', descTe: 'శ్రీ అమ్మవారి శరన్నవరాత్రోత్సవములు, చండీహోమం, విజయదశమి వేడుకలు.' },
    { name: 'Karthika Masam', nameTe: 'కార్తీక మాసం', desc: 'Satyanarayana Swamy Vratams and the Swamy\'s Masa Kalyanam.', descTe: 'సత్యనారాయణ స్వామి వ్రతములు, స్వామివారి మాస కళ్యాణము.' },
    { name: 'Makara Sankranti', nameTe: 'మకర సంక్రాంతి', desc: 'Sri Ammavaru is taken up the hill in procession for Brahmotsavams.', descTe: 'శ్రీ అమ్మవారిని గట్టుపైకి ఊరేగింపుగా తీసుకువచ్చి బ్రహ్మోత్సవములు జరుపుట.' },
    { name: 'Sri Swamy Vari Vaarshika Brahmotsavams', nameTe: 'వార్షిక బ్రహ్మోత్సవములు', desc: 'Five days of Kalyanotsavams from Magha Shudda Saptami to Dwadasi, with about 5 lakh devotees, Teppotsavam, and Agnigundalu.', descTe: 'మాఘశుద్ధ సప్తమి నుండి ద్వాదశి వరకు ఐదురోజులపాటు కళ్యాణోత్సవాలు. సుమారు ఐదులక్షల మంది పాల్గొంటారు. తెప్పోత్సవం, అగ్నిగుండాలు విశేషం.' },
    { name: 'Maha Shivaratri', nameTe: 'మహాశివరాత్రి', desc: 'Rudrabhishekams, Laksha Bilwarchana, and all-night jagarana by devotees.', descTe: 'రుద్రాభిషేకములు, లక్షబిల్వార్చన, భక్తులచే జాగరణ.' },
  ],
};

export default function AboutTemple() {
  const { lang, setLang } = useLanguage();
  const tab = lang === 'te' ? 'telugu' : 'english';
  const onTabChange = (v) => setLang(v === 'telugu' ? 'te' : 'en');
  const te = lang === 'te';
  // Telugu body copy needs the Telugu face; English keeps the default Lato.
  const bodyFont = te ? 'font-telugu-body' : '';
  const headingFont = te ? 'font-telugu-heading' : 'font-english-heading';

  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <TopStrip />
      <Navbar />

      {/* Hero */}
      <div className="temple-gradient text-white py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className={`${headingFont} wordmark-outline text-2xl md:text-4xl mb-2`} data-testid="about-title">
            {te ? 'శ్రీ చెరువుగట్టు క్షేత్ర చరిత్ర' : 'Sthala Puranam: The Legend of Ikshwadri'}
          </h1>
          <p className="text-[#FFE0B2]/70 text-sm">Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* History Section with Parashurama Legend (Tabs). Heading kept to the
            same text-xl scale as every other section below - the hero above
            already carries the page-level title, so this doesn't need to
            repeat it at hero size. */}
        <section id="history" className="scroll-mt-24">
          <Tabs value={tab} onValueChange={onTabChange} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className={`${headingFont} text-xl text-[#621B00] mb-1`}>
                  {te ? 'ఆలయ చరిత్ర: 108వ పరశురామ లింగం' : 'Temple History: The 108th Parashurama Linga'}
                </h2>
                <p className="font-telugu-heading text-base text-[#8D6E63]">స్థల పురాణము</p>
              </div>
              <TabsList className="bg-[#FDFBF7] border border-[#E6DCCA] p-1 h-12 rounded-xl shadow-sm shrink-0">
                <TabsTrigger value="english" className="px-6 font-english-heading rounded-lg data-[state=active]:bg-[#621B00] data-[state=active]:text-white">English</TabsTrigger>
                <TabsTrigger value="telugu" className="px-6 font-telugu-heading rounded-lg data-[state=active]:bg-[#621B00] data-[state=active]:text-white">తెలుగు</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="english" className="mt-0">
              <div className="max-w-4xl mx-auto bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-10 shadow-sm">
                <div className="text-[#5D4037] text-base md:text-lg leading-relaxed md:leading-loose space-y-6">
                  
                  {/* Expanded Sthala Puranam - dhyana shloka (with transliteration
                      and translation), the Poorva Vruttam origin story, and the
                      Ikshvadri Mahatmyam broken into labeled sub-segments. Mirrors
                      the Telugu tab paragraph-for-paragraph. */}
                  <div className="text-center bg-[#FDFBF7] border border-[#E6DCCA]/50 rounded-2xl p-6 md:p-8">
                    <p className="font-english-heading text-sm tracking-wide text-[#C43E00] uppercase mb-3">Dhyāna Śloka</p>
                    <p className="italic text-[#621B00] leading-loose">
                      శ్లో॥ శ్రీమద్భార్గవరామనిర్మితమహాదివ్యాలయేసంస్థితం<br />
                      నీహారాచలకన్యకార్థవపుషంబాలేందురేఖాధరం |<br />
                      బ్రహ్మేంద్రాచ్యుతసేవ్యపాదజలజంసద్భక్తకల్పధృమం<br />
                      సేవేసుందరఇక్షుశైలనిలయం శ్రీరామలింగంభజే ॥
                    </p>
                    <p className="text-sm text-[#8D6E63] italic leading-relaxed mt-4">
                      Śrīmad-bhārgavarāma-nirmita-mahā-divyālayē saṁsthitam<br />
                      Nīhārācala-kanyakārdha-vapuṣaṁ bālēndu-rēkhā-dharam |<br />
                      Brahmēndrācyuta-sēvya-pāda-jalajaṁ sadbhakta-kalpadrumam<br />
                      Sēvē sundara-ikṣuśaila-nilayaṁ śrī-rāmaliṅgaṁ bhajē ॥
                    </p>
                    <p className="text-sm text-[#5D4037] border-t border-[#E6DCCA] mt-4 pt-4 text-left">
                      "I bow to Lord Sri Ramalingeshwara, enshrined in the magnificent divine temple established by Sri Bhargava Rama (Parashurama). He shares half His divine form with the daughter of the snowy mountain (Goddess Parvathi) and adorns the crescent moon upon His brow. His lotus feet are venerated by Brahma, Indra, and Achyuta (Vishnu), and He stands as the wish-fulfilling tree (Kalpavriksha) to true devotees. I worship Him, the presiding deity residing upon the sacred, enchanting hill of Ikshvadri."
                    </p>
                  </div>

                  <div>
                    <p className="font-english-heading text-xl md:text-2xl tracking-wide text-[#C43E00] uppercase mb-3">The Sacred Origins &middot; Poorva Vruttam</p>
                    <div className="space-y-4 text-lg md:text-xl text-[#621B00]">
                      <p>In the Treta Yuga, there lived an immensely powerful emperor named <strong>Kartavirya Arjuna</strong>. He was extraordinarily strong and possessed a thousand arms. One day, he went hunting in the forest with his entire retinue. Tired from the hunt, the king arrived at the nearby hermitage of the sage-king Jamadagni to rest. Sage Jamadagni, with the help of his divine wish-fulfilling cow <strong>Shabala</strong>, was able to arrange a sumptuous feast with all six flavours for the emperor's entire retinue within a very short time.</p>
                      <p>Delighted by this, Kartavirya Arjuna asked the sage to give him the wish-fulfilling cow. Jamadagni advised him, saying, "O King! By the power of its penance, this cow stays on its own accord only with sages; it cannot be kept by force by anyone." Ignoring these words, the emperor ordered his soldiers to forcibly bring the cow and its calf to his kingdom. Having no other option, Jamadagni went to the cow and prayed, "O Mother! I am unable to protect you. Protect yourself, and thereby protect me too." Then, from a hair on the cow's body, a warrior fully equipped with weapons emerged and, in an instant, destroyed Kartavirya Arjuna's entire army.</p>
                      <p>Unable to contain his anger, Kartavirya Arjuna came to wage war against Jamadagni, whereupon the sage's son, <strong>Parashurama</strong>, defeated him. Kartavirya Arjuna, burning with the desire for revenge, waited for a time when Parashurama was away, attacked the hermitage, and beheaded Sage Jamadagni.</p>
                      <p>When Parashurama returned to the hermitage and learned of this, he flew into a towering rage, attacked Kartavirya Arjuna's kingdom, severed his thousand arms, and slew him. Even then, his anger unabated, Parashurama circled the earth twenty-one times, slaying every Kshatriya he encountered, and donated the entire earth as a gift to the foremost of Brahmins, Kashyapa Prajapati, the mind-born son of Brahma. At the sacred ford of Shamantapanchaka, he offered tarpana (libations) to his father Jamadagni with that Kshatriya blood.</p>
                      <p>Thereafter, for the welfare of the universe and wishing the world to flourish in peace and happiness, he consecrated <strong>Shiva Lingas at 108 sacred sites</strong>, pouring the power of his penance — accumulated over hundreds of thousands of years — into each Shiva Linga he installed at every site, thereby establishing peace throughout the universe.</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-english-heading text-xl md:text-2xl tracking-wide text-[#C43E00] uppercase mb-3">The Divine Glory of Ikshvadri &middot; Ikshvadri Māhātmyam</p>
                    <div className="space-y-4 text-lg md:text-xl text-[#621B00]">
                      <p>The 108th and culminating Shiva Linga consecrated by Parashurama is enshrined at the holy <strong>Cheruvugattu kshetram</strong>, historically known as Ikshvadri.</p>

                      <div>
                        <p className="font-english-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">The Consecration of the Shiva Linga & Divine Penance</p>
                        <p>In accordance with the sacred truth "Śivāya Viṣṇu-rūpāya Śiva-rūpāya Viṣṇavē" — affirming that Lord Shiva and Lord Vishnu are one and the same — <strong>Sri Bhargava Rama, better known as Parashurama,</strong> is the divine avatar of Lord Vishnu, descended to cleanse the earth of adharma. Thus, it was Lord Vishnu Himself, in the form of Parashurama, who consecrated this sacred, <strong>west-facing Shiva Linga</strong> atop the holy hill and engaged in rigorous austerities across ages, seeking to infuse the Linga with the supreme fruits of his penance for universal harmony.</p>
                      </div>

                      <div>
                        <p className="font-english-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">The Divine Manifestation & The Sacred Markings</p>
                        <p>Despite performing penance here with steadfast devotion for hundreds of thousands of years, Lord Shiva did not initially appear. In a surge of devotional despair and righteous wrath, Parashurama struck the consecrated Shiva Linga with his sacred battle-axe (<em>Parashu</em>). Immediately, Lord Shiva manifested before him in a brilliant, radiant form with His divine matted locks (<em>Jadalu</em>) loosened and flowing. Appeased by such unyielding austerity, Lord Shiva declared, "For all these years you have performed penance and pleased me; this kshetram shall shine as one of the most renowned holy places. From here until the end of Kali Yuga, I shall remain and fulfil the long-cherished desires of my devotees," and with this solemn benediction, merged back into the sacred Shiva Linga. Unlike typical Shiva Lingas that possess a smooth, rounded summit, the crown of this divine Linga bears a distinct crescent moon-shaped cleft caused by the strike of Parashurama's axe, while the posterior surface exhibits a unique, uneven texture mirroring the Lord's flowing matted locks — giving the deity the venerated name <strong>Sri Jadala Ramalingeshwara Swamy</strong>.</p>
                      </div>

                      <div>
                        <p className="font-english-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">Parivara Devatas Atop the Hill</p>
                        <p>Ascending the sacred hill, the path passes the Koneru and Gogarbhamu to <strong>Sri Kalabhairava Swamy</strong> — the vigilant Kshetrapalaka (guardian deity) of the kshetram — before reaching the entrance of the Main Temple Complex, where <strong>Sri Maha Ganapathi</strong> is enshrined. After darshan of the principal deity, the path passes <strong>Sri Anjaneya Swamy</strong> and <strong>Sri Renuka Yellamma Devi</strong> on the way to Moodu Gundlu, the three sacred rock pools crowned by the revered <strong>Sri Urdhva Lingam</strong>; beside its exit path are enshrined <strong>Sri Parashurama Lingam</strong> and, next to it, <strong>Sri Atma Lingam</strong>. Devotees firmly believe these sacred spots fulfil heartfelt wishes and earnest prayers.</p>
                      </div>

                      <div>
                        <p className="font-english-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">Foot of the Hill</p>
                        <p>The temple of Sri Parvathi Devi is enshrined at the base of the hill, accompanied by Sri Mallikarjuna Swamy, Subrahmanya Swamy, and Sri Bhadrakali Sametha Veerabhadra Swamy as attendant deities.</p>
                      </div>

                      <div>
                        <p className="font-english-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">Arogyapradata &middot; The Divine Physician</p>
                        <p>Echoing the sacred proclamation of the Sri Rudram — the supreme Vedic hymn which extols Lord Shiva as <em>"Prathamo Daivyo Bhishak"</em> (the foremost and primordial divine physician) — <strong>Sri Parvathi Jadala Ramalingeshwara Swamy is worshipped by millions of pilgrims as Arogyapradata</strong> (the bestower of health), dispelling physical ailments, mental distress, and karmic afflictions.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="my-12 border-[#E6DCCA]" />

                  <div className="text-center mb-8">
                    <span className="text-[#D4AF37] text-5xl leading-none">ॐ</span>
                    <h3 className="font-english-heading text-2xl md:text-3xl text-[#621B00] mt-3">Lord Shiva’s Divine Proclamation</h3>
                  </div>
                  
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 items-stretch">
                    {[
                      <>This sacred Linga shall be known as <strong>Sri Jadala Ramalingeshwara Swamy</strong>.</>,
                      <>The kshetram shall be a powerful center of spiritual purification.</>,
                      <>Devotees worshipping here shall attain peace, prosperity, and Moksha.</>,
                      <>Parashurama shall eternally remain associated with this holy place.</>,
                    ].map((item, i) => (
                      <li key={i} className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center text-balance flex items-center justify-center">
                        {/* The <span> matters: without it the text node, the <strong>
                            and the trailing full stop each become their own flex item
                            and lay out as separate columns instead of flowing as one
                            sentence. */}
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="telugu" className="mt-0">
              <div className="max-w-4xl mx-auto bg-white border border-[#E6DCCA] rounded-xl p-6 md:p-10 shadow-sm">
                <div className="font-telugu-body text-[#5D4037] text-base md:text-lg leading-relaxed md:leading-loose space-y-6">
                  
                  {/* Expanded Sthala Puranam - shloka (with translation), Poorva
                      Vruttam origin story, and Ikshvadri Mahatmyam broken into
                      labeled sub-segments. Mirrors the English tab paragraph-for-
                      paragraph. No CSS drop cap: ::first-letter splits a Telugu
                      akshara (త్రే + తాయుగమున) and breaks the word. */}
                  <div className="text-center bg-[#FDFBF7] border border-[#E6DCCA]/50 rounded-2xl p-6 md:p-8">
                    <p className="font-telugu-heading text-sm text-[#C43E00] mb-3">ధ్యాన శ్లోకం</p>
                    <p className="italic text-[#621B00] leading-loose">
                      శ్లో॥ శ్రీమద్భార్గవరామనిర్మితమహాదివ్యాలయేసంస్థితం<br />
                      నీహారాచలకన్యకార్థవపుషంబాలేందురేఖాధరం |<br />
                      బ్రహ్మేంద్రాచ్యుతసేవ్యపాదజలజంసద్భక్తకల్పధృమం<br />
                      సేవేసుందరఇక్షుశైలనిలయం శ్రీరామలింగంభజే ॥
                    </p>
                    <p className="text-sm text-[#5D4037] border-t border-[#E6DCCA] mt-4 pt-4 text-left">
                      తాత్పర్యం: శ్రీ భార్గవరామునిచే (పరశురాముడు) ప్రతిష్ఠితమైన పరమ పవిత్ర దివ్యక్షేత్రమున కొలువై, హిమవంతుని పుత్రికయైన జగన్మాత పార్వతీదేవిని తన వామార్ధ భాగమున ధరించి, ఫాలభాగమున బాలచంద్రుని అలంకరించినవాడును; బ్రహ్మ, ఇంద్రుడు, శ్రీమహావిష్ణువులచే పూజింపబడే పాదపద్మములు కలవాడును; సద్భక్తుల పాలిట కొంగుబంగారమై సర్వకోరికలు తీర్చే కల్పవృక్షమైనవాడును; మనోహరమైన ఇక్షుశైలమున (చెరువుగట్టు) నివాసముండే శ్రీ రామలింగేశ్వర స్వామిని భక్తిశ్రద్ధలతో ప్రార్థిస్తున్నాను.
                    </p>
                  </div>

                  <div>
                    <p className="font-telugu-heading text-xl md:text-2xl text-[#C43E00] mb-3">పూర్వవృత్తం</p>
                    <div className="space-y-4 text-lg md:text-xl text-[#621B00]">
                      <p>త్రేతాయుగంలో వేయి బాహువులు కలిగి, అజేయమైన పరాక్రమంతో చక్రవర్తి కార్తవీర్యార్జునుడు రాజ్యపాలన సాగించాడు. ఒకనాడు అతడు సమస్త సేనాపరివారంతో కలిసి అరణ్యానికి వేటకు వెళ్ళి, అలసట తీర్చుకోవడానికై సమీపంలోని జమదగ్ని మహర్షి ఆశ్రమాన్ని ఆశ్రయించాడు. మహర్షి తన వద్దనున్న దివ్య హోమధేనువు 'శబల' అనుగ్రహంతో, క్షణాల వ్యవధిలోనే రాజపరివారమంతటికీ షడ్రసోపేతమైన విందును అత్యంత వైభవంగా సమకూర్చాడు.</p>
                      <p>ఆ ధేనువు మహిమకు సంభ్రమాశ్చర్యాలు చెందిన కార్తవీర్యార్జునుడు దానిని తనకు ఇవ్వవలసిందిగా కోరాడు. తపోమహిమతో వర్ధిల్లే దివ్యధేనువు కేవలం ఋషుల వద్ద మాత్రమే స్వేచ్ఛగా ఉండగలదని, దానిని ఎవరూ బలవంతంగా స్వాధీనం చేసుకోలేరని జమదగ్ని హితవు పలికాడు. దురహంకారంతో ఆ మాటలను పెడచెవిన పెట్టిన రాజు, ధేనువును మరియు దాని దూడను బలవంతంగా బంధించి తెమ్మని తన సైన్యాన్ని ఆదేశించాడు. అశక్తుడైన జమదగ్ని మహర్షి ఆ గోమాతను శరణువేడుతూ, "తల్లీ! నిన్ను రక్షించే శక్తి నాకు లేదు. నిన్ను నీవే రక్షించుకుని, నన్ను కూడా రక్షించు" అని ప్రార్థించాడు. వెంటనే ఆ హోమధేనువు రోమకూపం నుండి సర్వాయుధ సంపన్నుడైన దివ్యయోధుడు ఉద్భవించి, కార్తవీర్యార్జునుని సైన్యాన్ని క్షణమాత్రంలో తుదముట్టించాడు.</p>
                      <p>తీవ్ర క్రోధంతో కార్తవీర్యార్జునుడు ఆశ్రమంపై యుద్ధానికి రాగా, జమదగ్ని కుమారుడైన పరశురాముడు అతడిని సమర్థవంతంగా ఎదుర్కొని ఓడించాడు. ప్రతీకారేచ్ఛతో రగిలిపోతున్న రాజు, పరశురాముడు ఆశ్రమంలో లేని సమయం చూసి దండెత్తి, తపోనిష్ఠలోనున్న జమదగ్ని మహర్షి శిరస్సును ఖండించి సంహరించాడు.</p>
                      <p>ఆశ్రమానికి తిరిగివచ్చిన పరశురాముడు ఈ ఘోరాన్ని చూసి మహోదగ్రుడై కార్తవీర్యార్జునుని రాజ్యంపై విరుచుకుపడి, అతడి వేయి బాహువులను నరికి సంహరించాడు. అంతటితో ఆగక ఇరవై ఒక్క మార్లు భూప్రదక్షిణ చేసి దుష్ట క్షత్రియులను నిర్మూలించాడు. ఆ సమస్త భూమండలాన్ని బ్రహ్మ మానసపుత్రుడైన కశ్యప ప్రజాపతికి దానమిచ్చి, శమంతపంచక తీర్థంలో ఆ క్షత్రియ రక్తంతో తన పితృదేవుడైన జమదగ్నికి పితృతర్పణ గావించాడు.</p>
                      <p>అనంతరం విశ్వశాంతిని, లోకకళ్యాణాన్ని కాంక్షిస్తూ — జరిగిన రక్తపాతానికి ప్రాయశ్చిత్తంగా — భారతావనిలోని 108 పవిత్ర పుణ్యక్షేత్రాలలో శివలింగాలను ప్రతిష్ఠించాడు. తాను కొన్ని లక్షల సంవత్సరాలుగా సంపాదించిన అపార తపోశక్తినంతటినీ ఒక్కొక్క లింగంలో నింపి, సర్వలోకాలకు శాంతిభద్రతలను నెలకొల్పాడు.</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-telugu-heading text-xl md:text-2xl text-[#C43E00] mb-3">ఇక్ష్వాద్రి మాహాత్మ్యం</p>
                    <div className="space-y-4 text-lg md:text-xl text-[#621B00]">
                      <p>పరశురాముడు ప్రతిష్ఠించిన 108 శివలింగాలలో అత్యంత విశిష్టమైన చివరి లింగమే ఈ <strong>చెరువుగట్టు క్షేత్రం</strong> (ఇక్ష్వాద్రి).</p>

                      <div>
                        <p className="font-telugu-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">శివలింగ ప్రతిష్ఠాపన & తపోనిష్ఠ</p>
                        <p>"శివాయ విష్ణురూపాయ శివరూపాయ విష్ణవే" అన్న ఆర్యోక్తి ప్రకారం శివుడూ, విష్ణువూ వేర్వేరు కాదు — ఒక్కరే. భూలోకంలో అధర్మాన్ని రూపుమాపి ధర్మాన్ని నిలబెట్టడానికి అవతరించిన సాక్షాత్తు శ్రీమహావిష్ణువు యొక్క దివ్యావతారమే పరశురాముడు. అలా శ్రీహరియే స్వయంగా పరశురాముని రూపంలో ఈ పుణ్యగిరిపై <strong>పశ్చిమాభిముఖంగా</strong> పరమ పవిత్ర శివలింగాన్ని ప్రతిష్ఠించి, లోకకళ్యాణార్థం యుగాల తరబడి కఠోర తపస్సును ఆచరించాడు.</p>
                      </div>

                      <div>
                        <p className="font-telugu-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">దివ్య సాక్షాత్కారము & శ్రీ జడల రామలింగేశ్వర స్వామి వారి ఆవిర్భావ విశేషం</p>
                        <p>ఈ పుణ్యగిరిపై పరశురాముడు లక్షలాది సంవత్సరాలు అచంచల నిష్ఠతో తపస్సు ఆచరించినప్పటికీ శివుడు ప్రత్యక్షం కాలేదు. భక్తి పారవశ్యంతో కూడిన ఆవేదనతో, ఆగ్రహోదగ్రుడైన పరశురాముడు తాను ప్రతిష్ఠించిన శివలింగాన్ని తన పరశువుతో (గండ్రగొడ్డలి) బలంగా తాకించాడు. ఆ క్షణమే పరమశివుడు విరబోసిన జటామకుటంతో, పరమ తేజోవంతమైన రూపంలో సాక్షాత్కరించాడు. ఆ నిశ్చల భక్తికి మెచ్చిన భోళాశంకరుడు, "ఇన్ని సంవత్సరాలుగా నీవు చేసిన కఠోర తపస్సుకు సంతుష్టుడనయ్యాను. ఈ క్షేత్రం అత్యంత ప్రసిద్ధ పుణ్యక్షేత్రంగా వెలుగొందుతుంది. కలియుగాంతం వరకు నేనిక్కడే వెలసి, నా భక్తుల చిరకాల వాంఛితాలను తీరుస్తాను" అని వరమిచ్చి ఆ లింగమూర్తిలో అంతర్ధానమయ్యాడు. సాధారణంగా శివలింగాల పైభాగం నునుపుగా అండాకారంలో ఉంటుంది. కానీ ఇక్కడ పరశురాముని గండ్రగొడ్డలి తాకిడి వలన లింగ శిరోభాగంపై అర్ధచంద్రాకారపు గాటు ఏర్పడగా, వెనుకభాగంలో స్వామివారి విరబోసిన జటలు విలసిల్లినట్లు ఎగుడుదిగుడుగా అద్భుతమైన దివ్య ఆకృతి సంతరించుకుంది. అందుకే ఈ క్షేత్రేశ్వరునికి <strong>"శ్రీ జడల రామలింగేశ్వర స్వామి"</strong> అనే పరమ పవిత్ర నామధేయం సార్థకమైంది.</p>
                      </div>

                      <div>
                        <p className="font-telugu-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">గట్టు పైన కొలువైన ఇతర పరివార దేవతలు</p>
                        <p>గట్టు ఎక్కు మార్గములో కోనేరు, గోగర్భం దాటి <strong>శ్రీ కాలభైరవ స్వామి</strong> కొలువైయుండగా, క్షేత్రపాలకునిగా ఆయనే గట్టుకు కాపలా. అటుపిమ్మట భక్తులు ప్రధాన ఆలయ సముదాయ ప్రవేశద్వారమునకు చేరుకొందురు, అక్కడ <strong>శ్రీ మహాగణపతి</strong> కొలువైయున్నారు. ప్రధాన దేవుని దర్శనానంతరం, మార్గము <strong>శ్రీ ఆంజనేయ స్వామి</strong>, <strong>శ్రీ రేణుకా ఎల్లమ్మ దేవి</strong> ఆలయములు దాటి మూడు గుండ్లకు చేరుకొనును. మూడు గుండ్ల శిఖరాగ్రమున పరమ పవిత్రమైన <strong>శ్రీ ఊర్ధ్వ లింగము</strong> కొలువై ఉండగా, మూడు గుండ్ల నిష్క్రమణ మార్గము ప్రక్కన <strong>శ్రీ పరశురామ లింగము</strong> మరియు దాని పక్కనే <strong>శ్రీ ఆత్మ లింగము</strong> కొలువైయున్నాయి. ఈ దివ్య ప్రదేశాలు భక్తుల సమస్త మనోభీష్టాలను నెరవేర్చే మహిమాన్విత స్థలాలుగా విశేష పూజలందుకుంటున్నాయి.</p>
                      </div>

                      <div>
                        <p className="font-telugu-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">గిరి దిగువ భాగం</p>
                        <p>కొండ దిగువన శ్రీ పార్వతీ దేవి స్వయంభువుగా కొలువై ఉండగా, శ్రీ మల్లికార్జున స్వామి, సుబ్రహ్మణ్య స్వామి, శ్రీ భద్రకాళీ సమేత వీరభద్ర స్వామివార్లు పరివార దేవతలుగా భక్తులకు దర్శనమిస్తున్నారు.</p>
                      </div>

                      <div>
                        <p className="font-telugu-heading text-lg md:text-xl font-semibold text-[#8B3A1A] mb-1">ఆరోగ్యప్రదాత &middot; దివ్య వైద్యుడు</p>
                        <p>వేదవాఙ్మయంలో అత్యంత ఉత్కృష్టమైన శ్రీరుద్ర నమకంలో పరమశివుడిని <em>"ప్రథమో దైవ్యో భిషక్"</em> (దేవతలందరిలో ప్రథముడైన దివ్య వైద్యుడు) అని కీర్తించిన రీతిగా — ఇక్కడికి విచ్చేసే భక్తుల సకల శారీరక, మానసిక రుగ్మతలను, గ్రహదోషాలను నివారించే పరమ దివ్యవైద్యునిగా <strong>శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి "ఆరోగ్యప్రదాత"గా</strong> కోట్లాది భక్తులచే నిత్యం పూజింపబడుతున్నారు.</p>
                      </div>
                    </div>
                  </div>

                  <hr className="my-12 border-[#E6DCCA]" />

                  <div className="text-center mb-8">
                    <span className="text-[#D4AF37] text-5xl leading-none font-english-heading">ॐ</span>
                    <h3 className="font-telugu-heading text-2xl md:text-3xl text-[#621B00] mt-3">పరమేశ్వరుని వరప్రసాదము</h3>
                  </div>
                  
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 items-stretch">
                    {[
                      <>ఈ లింగము <strong>శ్రీ జడల రామలింగేశ్వర స్వామి</strong>గా ప్రసిద్ధి పొందెను.</>,
                      <>ఈ క్షేత్రము పాపవిమోచనమునకు మహిమాన్వితమైన కేంద్రముగా విరాజిల్లును.</>,
                      <>ఇక్కడ భక్తితో ప్రార్థించిన వారికి శాంతి, ఐశ్వర్యము, మోక్షము లభించును.</>,
                      <>పరశురాముడు ఈ పవిత్ర స్థలముతో శాశ్వతముగా ముడిపడి ఉండును.</>,
                    ].map((item, i) => (
                      <li key={i} className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E6DCCA]/50 text-center text-balance flex items-center justify-center">
                        {/* The <span> matters: without it the text node, the <strong>
                            and the trailing full stop each become their own flex item
                            and lay out as separate columns instead of flowing as one
                            sentence. */}
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Significance */}
        <section className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-6">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Spiritual Significance</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ఆధ్యాత్మిక ప్రాముఖ్యత</p>
          <div className={`text-sm text-[#5D4037] leading-relaxed space-y-3 ${bodyFont}`}>
            {(te ? CONTENT.significance.te : CONTENT.significance.en).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* Arogya Kshetram */}
        <section className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-6">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Arogya Kshetram (Temple of Healing)</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ఆరోగ్యక్షేత్రం</p>
          <div className={`text-sm text-[#5D4037] leading-relaxed space-y-3 ${bodyFont}`}>
            {(te ? CONTENT.arogya.te : CONTENT.arogya.en).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* Amavasya Jatara */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Amavasya Jatara</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">చెరువుగట్టులో అమావాస్య జాతర</p>
          <div className={`text-sm text-[#5D4037] leading-relaxed space-y-3 ${bodyFont}`}>
            {(te ? CONTENT.amavasya.te : CONTENT.amavasya.en).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* Important Highlights */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Important Highlights</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ముఖ్యమైన విశేషాలు</p>
          <ul className={`text-sm text-[#5D4037] leading-relaxed space-y-2 list-disc pl-5 ${bodyFont}`}>
            {CONTENT.highlights.map((h, i) => (
              <li key={i}><strong>{te ? h.labelTe : h.labelEn}:</strong> {te ? h.te : h.en}</li>
            ))}
          </ul>
        </section>

        {/* Brahmotsavam photographs */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className={`${headingFont} text-xl text-[#621B00] mb-1`}>
            {te ? 'వార్షిక బ్రహ్మోత్సవములు' : 'Vaarshika Brahmotsavams'}
          </h2>
          <p className={`text-sm text-[#5D4037] mb-5 ${bodyFont}`}>
            {te
              ? 'మాఘశుద్ధ సప్తమి నుండి ద్వాదశి వరకు ఐదురోజులపాటు జరుగు కళ్యాణోత్సవములు. సుమారు ఐదులక్షల మంది భక్తులు పాల్గొంటారు.'
              : 'Five days of Kalyanotsavams from Magha Shudda Saptami to Dwadasi, drawing nearly five lakh devotees.'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {BRAHMOTSAVAM.map((b, i) => (
              <figure key={i}>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#E6DCCA]">
                  <img src={b.img} alt={b.en} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <figcaption className={`mt-1.5 text-center text-xs text-[#8D6E63] ${te ? 'font-telugu-body' : ''}`}>
                  {te ? b.te : b.en}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Festivals */}
        <section id="festivals" className="scroll-mt-24">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Major Festivals</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">దేవస్థానంలో జరుపుకొను ముఖ్య పర్వదినములు</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTENT.festivals.map((f, i) => (
              <div key={i} className="bg-white border border-[#E6DCCA] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-[#C43E00] shrink-0" />
                  <h3 className={`font-medium text-[#2D1B0E] text-sm ${te ? 'font-telugu-heading' : ''}`}>{te ? f.nameTe : f.name}</h3>
                </div>
                <p className={`text-sm text-[#621B00] mb-1 ${te ? '' : 'font-telugu-body'}`}>{te ? f.name : f.nameTe}</p>
                <p className={`text-xs text-[#8D6E63] ${bodyFont}`}>{te ? f.descTe : f.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}