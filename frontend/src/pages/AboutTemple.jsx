import TopStrip from '@/components/TopStrip';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapPin, Clock, Phone, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

/* Parivara devatas, grouped by their actual location - the foot-of-hill group
   (Sri Parvathi Devi Temple complex) and the hilltop group. Confirmed against
   the temple's own hand-drawn layout maps; do not merge these back into one
   undifferentiated list. */
const PARIVARA_HILL = [
  { img: '/Assets/Anjaneya_Swamy_1.webp', en: 'Sri Anjaneya Swamy', te: 'శ్రీ ఆంజనేయ స్వామి' },
];
const PARIVARA_FOOTHILL = [
  { img: '/Assets/Mallikharjuna_Swamy_Down_Hill_1.webp', en: 'Sri Mallikarjuna Swamy', te: 'శ్రీ మల్లిఖార్జున స్వామి' },
  { img: '/Assets/Ganapati_Swamy_Down_Hill.webp', en: 'Sri Ganapati', te: 'శ్రీ గణపతి' },
  { img: '/Assets/Subrahmanya_Swamy_Down_Hill.webp', en: 'Sri Subrahmanya Swamy', te: 'శ్రీ సుబ్రహ్మణ్య స్వామి' },
  { img: '/Assets/Veerabhadra_Swamy_Down_Hill.webp', en: 'Sri Veerabhadra Swamy', te: 'శ్రీ వీరభద్ర స్వామి' },
  { img: '/Assets/Bhadrakali_Ammavaru_Down_Hill.webp', en: 'Sri Bhadrakali Devi', te: 'శ్రీ భద్రకాళీ దేవి' },
];

/* The Executive Officer is a government appointee who oversees the temple
   administration, not a member of the Dharmakartha Mandali - shown as its
   own entry, separate from the trustee board below. */
const EXECUTIVE_OFFICER = { nameEn: 'Sri S. Mohan Babu', nameTe: 'శ్రీ ఎస్. మోహన్ బాబు గారు', roleEn: 'Assistant Commissioner & Executive Officer', roleTe: 'అసిస్టెంట్ కమీషనర్ & కార్యనిర్వహణాధికారి' };

/* Transcribed from the Dharmakartha Mandali board at the temple office. */
const TRUST_BOARD = [
  { nameEn: 'Sri Varala Ramesh', nameTe: 'శ్రీ వారాల రమేష్ గారు', roleEn: 'Chairman', roleTe: 'చైర్మన్' },
  { nameEn: 'Sri Kommu Sreenu', nameTe: 'శ్రీ కొమ్ము శ్రీను గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Mandula Narsimha', nameTe: 'శ్రీ మందుల నర్సింహ్మా గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Ranga Sravan Kumar', nameTe: 'శ్రీ రంగా శ్రవణ్ కుమార్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Smt. Nalla Anitha', nameTe: 'శ్రీమతి నల్ల అనిత గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Pala Mahesh', nameTe: 'శ్రీ పాల మహేష్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Veeravelli Raghunadh', nameTe: 'శ్రీ వీరవెల్లి రఘునాధ్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Marri Lingaswamy', nameTe: 'శ్రీ మర్రి లింగస్వామి గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Gaddaguti Yadayya', nameTe: 'శ్రీ గద్దగూటి యాదయ్య గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Regatte Srinivas Reddy', nameTe: 'శ్రీ రేగట్టె శ్రీనివాస్ రెడ్డి గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Prajnapuram Satyanarayana', nameTe: 'శ్రీ ప్రజ్ఞాపురం సత్యనారాయణ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Idukulla Sampath', nameTe: 'శ్రీ ఇడుకుళ్ళ సంపత్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Kammalapalli Mallesh', nameTe: 'శ్రీ కమ్మలపల్లి మల్లేష్ గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Sri Gouridevi Lakshmayya', nameTe: 'శ్రీ గౌరిదేవి లక్ష్మయ్య గారు', roleEn: 'Trustee', roleTe: 'ధర్మకర్త' },
  { nameEn: 'Dr. P. Ramalingeshwara Sharma', nameTe: 'డా. పి. రామలింగేశ్వర శర్మ గారు', roleEn: 'Ex-Officio Member & Pradhana Archaka', roleTe: 'ఎక్స్ అఫీషియో సభ్యులు & ప్రధాన అర్చకులు' },
];

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
  admin: {
    en: [
      'Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam is located in Cheruvugattu village, Narketpally Mandal, Nalgonda District, on the Narketpally-Addanki road, about 4 km from Narketpally (on the Hyderabad-Vijayawada National Highway) and 15 km from Nalgonda town. Believed to date back to the Treta Yuga, it is one of Telangana\'s most prominent Shaiva pilgrimage centres.',
      'The temple was published under Section 6(a) and registered under Section 43 of the Telangana Charitable and Hindu Religious Institutions and Endowments Act 30/87. It ranks among the state\'s prominent temples with Assistant Commissioner status, and is administered by an Executive Officer appointed by the Government of Telangana.',
    ],
    te: [
      'శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామివారి దేవస్థానము నల్లగొండ జిల్లా నార్కట్‌పల్లి మండలములోని చెరువుగట్టు గ్రామంలో వుంది. ఈ క్షేత్రము హైదరాబాదు - విజయవాడ జాతీయ రహదారిపై గల నార్కట్‌పల్లికి 4 కి.మీ. దూరంలో నార్కట్‌పల్లి - అద్దంకి రహదారిపై ఉండి, నల్లగొండ పట్టణానికి 15 కి.మీ. దూరంలో వుంది. త్రేతాయుగం నాటిదని భావిస్తున్న ఈ పుణ్యక్షేత్రము తెలంగాణ రాష్ట్రములోని ప్రముఖ శైవ పుణ్యక్షేత్రంగా విరాజిల్లుతూ, భక్తుల పాలిట కొంగుబంగారంగా మారింది.',
      'రాష్ట్ర దేవాదాయ ధర్మాదాయ శాఖ చట్టం 30/87 నందలి సెక్షన్ 6(ఎ) ప్రకారం పబ్లికేషన్ కాబడి, సెక్షన్ 43 ప్రకారం దేవాదాయ ధర్మాదాయ శాఖ నందు రిజిష్టర్ కాబడి, రాష్ట్రంలోని అనేక ప్రముఖ దేవస్థానములతో పాటు అసిస్టెంటు కమీషనరు హోదా కలిగిన దేవాలయంగా ఉండి, తెలంగాణ ప్రభుత్వం చేత నియామకం చేయబడిన సహాయ కమీషనరుచే కార్యనిర్వహణాధికారిగా ఈ దేవస్థాన పరిపాలన నిర్వహింపబడుతోంది.',
    ],
  },
  deities: [
    {
      titleEn: 'At the foot of the hill (గట్టు క్రింద)', titleTe: 'గట్టు క్రింద',
      img: '/Assets/Parvati_Devi_1.webp', alt: 'Sri Parvathi Devi adorned in silk and garlands',
      en: 'Sri Bhramarambha Devi (Sri Parvathi Devi), with Sri Mallikarjuna Swamy — a manifestation of the Swamy\'s own Shivalingam — as her consort. Sri Ganapati and Sri Subrahmanya Swamy are worshipped in the connecting Antharaalayam, and Sri Bhadrakali sametha Veerabhadra Swamy in an adjoining shrine of the same complex.',
      te: 'కొండ క్రింద ఆలయములో శ్రీ భ్రమరాంబ దేవి (శ్రీ పార్వతీ అమ్మవారు) కొలువై యుండగా, ఆమె సఖునిగా శ్రీ స్వామివారి శివలింగ స్వరూపమే అయిన శ్రీ మల్లిఖార్జున స్వామి కొలువైయున్నారు. అంతరాళయంలో శ్రీ గణపతి, శ్రీ సుబ్రహ్మణ్య స్వామి, అదే ప్రాంగణంలోని ఉపాలయంలో శ్రీ భద్రకాళీ సమేత వీరభద్ర స్వామి కొలువైయున్నారు.',
    },
    {
      titleEn: 'Atop the hill (గట్టు మీద)', titleTe: 'గట్టు మీద',
      img: '/Assets/Sri_Swamy_Varu_1.webp', alt: 'Sri Jadala Ramalingeshwara Swamy adorned for puja',
      en: 'Sri Ramalingeshwara Swamy, with Sri Anjaneya Swamy and Sri Renuka Yellamma as neighbouring shrines along the hilltop, and Sri Kalabhairava Swamy as Kshetrapalaka (guardian deity) at the entrance of the steps path.',
      te: 'గట్టుమీద శ్రీ స్వామివారికి సమీపముననే శ్రీ ఆంజనేయ స్వామివారు, శ్రీ రేణుకా ఎల్లమ్మ అమ్మవారు ఆలయములు కలవు. మెట్ల మార్గపు ప్రవేశద్వారము వద్ద క్షేత్రపాలకుడుగా శ్రీ కాలభైరవ స్వామివారు కొలువైయున్నారు.',
    },
    {
      titleEn: 'Moodu Gundlu (మూడు గుండ్లు)', titleTe: 'మూడు గుండ్లు',
      img: '/Assets/Mudu_Gundlu_Shivalingam_6.webp', alt: 'The Moodu Gundlu Shivalingam beneath a five-hooded naga canopy',
      en: 'The revered Urdhva Lingam is situated atop three sacred rock pools (Moodu Gundlu). Devotees believe that climbing to worship here removes sins and hardships.',
      te: 'అతి ప్రశస్తమైన మూడు గుండ్లపై ఊర్ధ్వలింగము కొలువైయుండి భక్తుల మనోభీష్టాలను నెరవేరుస్తుంది. మూడుగుండ్లు ఎక్కి శ్రీ స్వామివారిని దర్శించుకోవడం ద్వారా సమస్త పాపభీతి, కష్టాలు తొలగిపోతాయని నమ్మకం.',
    },
    {
      /* No photograph of the Gogarbha pond yet - deliberately left imageless
         rather than captioning a lingam photo as the kolanu. */
      titleEn: 'Gogarbha Kolanu (గోగర్భ కొలను)', titleTe: 'గోగర్భ కొలను',
      en: 'A sacred pond next to the Koneru, used for the Swamy\'s daily morning abhishekam. Devotees carry this holy water home and sprinkle it on their farmland for a good harvest.',
      te: 'కోనేరు ప్రక్కన గోగర్భ కొలను కలదు. ఇందలి జలముతో ప్రతిరోజు శ్రీ స్వామివారి ప్రాతఃకాల అభిషేకము చేయుదురు. అట్టి జలమును భక్తులు తమ స్వగ్రామములకు తీసుకువెళ్ళి పంటపొలములలో చల్లినచో పంటలు బాగా పండునని వారి ప్రగాఢ విశ్వాసం.',
    },
  ],
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
  reach: {
    locationEn: 'Cheruvugattu, Narketpally Mandal, Nalgonda District, Telangana, India',
    locationTe: 'చెరువుగట్టు, నార్కట్‌పల్లి మండలం, నల్లగొండ జిల్లా, తెలంగాణ',
    timingsEn: ['Morning: 6:00 AM - 12:00 PM', 'Evening: 4:00 PM - 8:00 PM'],
    timingsTe: ['ఉదయం: 6:00 - 12:00', 'సాయంత్రం: 4:00 - 8:00'],
    adminEn: ['Telangana Endowments Department', 'Sri S. Mohan Babu, Executive Officer', '+91 94910 00701'],
    adminTe: ['తెలంగాణ దేవాదాయ ధర్మాదాయ శాఖ', 'శ్రీ ఎస్. మోహన్ బాబు, కార్యనిర్వహణాధికారి', '+91 94910 00701'],
    modes: [
      { labelEn: 'By Road', labelTe: 'రోడ్డు మార్గము',
        en: '4 km from Narketpally on the Narketpally-Addanki road (Narketpally lies on the Hyderabad-Vijayawada National Highway), and about 15 km from Nalgonda town.',
        te: 'హైదరాబాదు - విజయవాడ జాతీయ రహదారిపై గల నార్కట్‌పల్లి నుండి నార్కట్‌పల్లి - అద్దంకి రహదారిపై 4 కి.మీ. దూరంలో, నల్లగొండ పట్టణానికి 15 కి.మీ. దూరంలో కలదు.' },
      { labelEn: 'By Rail', labelTe: 'రైలు మార్గము',
        en: 'Nearest railway station is Nalgonda. Auto-rickshaws and buses available from the station.',
        te: 'సమీప రైల్వే స్టేషన్ నల్లగొండ. స్టేషన్ నుండి ఆటోలు, బస్సు సౌకర్యము కలదు.' },
      { labelEn: 'By Air', labelTe: 'విమాన మార్గము',
        en: 'Nearest airport is Rajiv Gandhi International Airport, Hyderabad (approx. 150 km).',
        te: 'సమీప విమానాశ్రయం రాజీవ్ గాంధీ అంతర్జాతీయ విమానాశ్రయం, హైదరాబాదు (సుమారు 150 కి.మీ.).' },
    ],
  },
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

        {/* UPDATED: History Section with Parashurama Legend (Tabs) */}
        <section id="history" className="scroll-mt-24">
          <div className="text-center mb-10">
            <h2 className={`${headingFont} text-3xl md:text-4xl text-[#621B00] mb-2`}>
              {te ? 'ఆలయ చరిత్ర: 108వ పరశురామ లింగం' : 'Temple History: The 108th Parashurama Linga'}
            </h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto rounded-full"></div>
          </div>

          <Tabs value={tab} onValueChange={onTabChange} className="w-full">
            <div className="flex justify-center mb-10">
              <TabsList className="bg-[#FDFBF7] border border-[#E6DCCA] p-1 h-14 rounded-xl shadow-sm">
                <TabsTrigger value="english" className="px-10 font-english-heading text-lg rounded-lg data-[state=active]:bg-[#621B00] data-[state=active]:text-white">English</TabsTrigger>
                <TabsTrigger value="telugu" className="px-10 font-telugu-heading text-lg rounded-lg data-[state=active]:bg-[#621B00] data-[state=active]:text-white">తెలుగు</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="english" className="mt-0">
              <div className="max-w-4xl mx-auto bg-white border border-[#E6DCCA] rounded-[2rem] p-8 md:p-14 shadow-sm">
                <div className="text-[#5D4037] text-base md:text-lg leading-relaxed md:leading-loose space-y-6">
                  
                  {/* Lead-in sizing rather than a ::first-letter drop cap, so this
                      matches the Telugu tab (where a drop cap would split an akshara). */}
                  <p className="text-lg md:text-xl text-[#621B00]">
                    In the sacred Treta Yuga, when Adharma spread across the earth, the sixth incarnation of Lord Vishnu, <strong>Lord Parashurama</strong>, incarnated to re-establish Dharma.
                    After destroying Kartavirya Arjuna and cleansing the earth of corrupt Kshatriya rulers, Parashurama felt the burden of the bloodshed. Following the divine guidance of Sage Jamadagni, he undertook a sacred pilgrimage and consecrated <strong>108 Shiva Lingas</strong> across Bharata Varsha to atone and restore cosmic balance.
                  </p>

                  <p>
                    After installing 107 Lingas, Parashurama arrived at the sacred hill known as <strong>Ikshwadri (present-day Cheruvugattu)</strong>. Recognizing its immense spiritual potency, he consecrated the <strong>108th and final Shiva Linga</strong> within a cave on this hill, installing it in a rare and powerful <strong>west-facing direction</strong>.
                  </p>

                  <p>
                    Engaging in intense penance, Parashurama’s tapas radiated divine energy, causing the Linga to rise on its own. When he gently struck it with his axe (<em>Parashu</em>), Lord Shiva manifested in divine form with radiant matted locks (<em>Jadala</em>), and blessed Parashurama with absolution.
                  </p>

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
              <div className="max-w-4xl mx-auto bg-white border border-[#E6DCCA] rounded-[2rem] p-8 md:p-14 shadow-sm">
                <div className="font-telugu-body text-[#5D4037] text-base md:text-lg leading-relaxed md:leading-loose space-y-6">
                  
                  {/* No CSS drop cap here: ::first-letter splits a Telugu akshara
                      (త్రే + తాయుగమున) and breaks the word. Lead-in sizing instead. */}
                  <p className="text-lg md:text-xl text-[#621B00]">
                    త్రేతాయుగమున అధర్మము విస్తరించెడి కాలమున, శ్రీమహావిష్ణువు ఆరవ అవతారముగా <strong>శ్రీ పరశురాముడు</strong> అవతరించెను. కార్తవీర్యార్జునుని సంహరించి, అధర్మపరులైన క్షత్రియ రాజులనుండి భూమిని శుద్ధిచేసిన అనంతరం, ఆ సంహార పాపభారము తన హృదయమునకు భారముగా అనిపించగా, జమదగ్ని మహర్షి ఉపదేశముచేత పరమేశ్వరుని అనుగ్రహార్థము భారతదేశమంతట <strong>108 శివలింగములను</strong> ప్రతిష్ఠించెను.
                  </p>

                  <p>
                    107 శివలింగములను ప్రతిష్ఠించిన అనంతరం, నేటి <strong>చెరువుగట్టు అను ఇక్ష్వాద్రి గిరిపై</strong> చేరుకొనెను. ఆ గిరి యొక్క అపారమైన ఆధ్యాత్మిక శక్తిని గుర్తించి, ఆ కొండపైగల గుహలో <strong>108వ మరియు చివరి శివలింగమును</strong> అత్యంత అరుదైన, మహిమాన్వితమైన పశ్చిమాభిముఖముగా ప్రతిష్ఠించెను.
                  </p>

                  <p>
                    అక్కడ ఉగ్రమైన తపస్సు ఆచరించగా, పరశురాముని తపఃశక్తి దివ్యతేజస్సును వెదజల్లి ఆ లింగము స్వయంగా పైకెత్తబడెను. పరశురాముడు తన పరశువుతో (గొడ్డలితో) మెల్లగా తాకగా, పరమేశ్వరుడు ప్రకాశవంతమైన <strong>జడలతో</strong> దివ్యరూపమున ప్రత్యక్షమై, పరశురామునకు పాపవిమోచనమును అనుగ్రహించెను.
                  </p>

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
        <section className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-6 mt-10">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Spiritual Significance</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ఆధ్యాత్మిక ప్రాముఖ్యత</p>
          <div className={`text-sm text-[#5D4037] leading-relaxed space-y-3 ${bodyFont}`}>
            {(te ? CONTENT.significance.te : CONTENT.significance.en).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* Deities of the Temple */}
        <section className="bg-white border border-[#E6DCCA] rounded-xl p-6">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Deities of the Temple</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">దేవస్థానంలో దేవతలు</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#5D4037]">
            {CONTENT.deities.map((d, i) => (
              <div key={i}>
                {d.img && (
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-[#FDFBF7] border border-[#E6DCCA]">
                    <img src={d.img} alt={d.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                )}
                <p className={`font-medium text-[#2D1B0E] mb-2 ${te ? 'font-telugu-heading' : ''}`}>{te ? d.titleTe : d.titleEn}</p>
                <p className={`leading-relaxed ${bodyFont}`}>{te ? d.te : d.en}</p>
              </div>
            ))}
          </div>

          {/* Parivara devatas, split by their actual location on the hill vs. at its foot */}
          <div className="mt-8">
            <p className={`text-sm font-medium text-[#2D1B0E] mb-3 ${te ? 'font-telugu-heading' : ''}`}>
              {te ? 'పరివార దేవతలు — గట్టుమీద' : 'Parivara Devatas — Atop the Hill'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PARIVARA_HILL.map((p, i) => (
                <figure key={i}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#E6DCCA]">
                    <img src={p.img} alt={p.en} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <figcaption className={`mt-1.5 text-center text-xs text-[#8D6E63] ${te ? 'font-telugu-body' : ''}`}>
                    {te ? p.te : p.en}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className={`text-sm font-medium text-[#2D1B0E] mb-3 ${te ? 'font-telugu-heading' : ''}`}>
              {te ? 'పరివార దేవతలు — గట్టు క్రింద' : 'Parivara Devatas — At the Foot of the Hill'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PARIVARA_FOOTHILL.map((p, i) => (
                <figure key={i}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#E6DCCA]">
                    <img src={p.img} alt={p.en} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <figcaption className={`mt-1.5 text-center text-xs text-[#8D6E63] ${te ? 'font-telugu-body' : ''}`}>
                    {te ? p.te : p.en}
                  </figcaption>
                </figure>
              ))}
            </div>
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

        {/* How to Reach */}
        <section id="timings" className="bg-white border border-[#E6DCCA] rounded-xl p-6 scroll-mt-24">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">How to Reach</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">ఎలా చేరుకోవాలి</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`space-y-3 text-sm text-[#5D4037] ${bodyFont}`}>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">{te ? 'ప్రదేశము' : 'Location'}</p>
                  <p>{te ? CONTENT.reach.locationTe : CONTENT.reach.locationEn}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">{te ? 'ఆలయ సమయములు' : 'Temple Timings'}</p>
                  {(te ? CONTENT.reach.timingsTe : CONTENT.reach.timingsEn).map((l, i) => <p key={i}>{l}</p>)}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#C43E00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2D1B0E]">{te ? 'పరిపాలన' : 'Administration'}</p>
                  {(te ? CONTENT.reach.adminTe : CONTENT.reach.adminEn).map((l, i) => <p key={i}>{l}</p>)}
                </div>
              </div>
            </div>
            <div className={`text-sm text-[#5D4037] space-y-2 ${bodyFont}`}>
              {CONTENT.reach.modes.map((m, i) => (
                <p key={i}><strong>{te ? m.labelTe : m.labelEn}:</strong> {te ? m.te : m.en}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Temple Administration & Location */}
        <section id="administration" className="bg-white border border-[#E6DCCA] rounded-xl p-6 scroll-mt-24">
          <h2 className="font-english-heading text-xl text-[#621B00] mb-1">Temple & Administration</h2>
          <p className="font-telugu-heading text-base text-[#8D6E63] mb-4">దేవస్థానం - పరిపాలన</p>
          <div className={`text-sm text-[#5D4037] leading-relaxed space-y-3 ${bodyFont}`}>
            {(te ? CONTENT.admin.te : CONTENT.admin.en).map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {/* Executive Officer - a government appointee overseeing the temple's
              administration, kept apart from the Dharmakartha Mandali below. */}
          <div className="mt-6 pt-6 border-t border-[#E6DCCA]">
            <p className={`text-sm font-medium text-[#2D1B0E] mb-3 ${te ? 'font-telugu-heading' : ''}`}>
              {te ? 'కార్యనిర్వహణాధికారి' : 'Executive Officer'}
            </p>
            <div className="flex items-baseline justify-between gap-3 text-sm text-[#5D4037]">
              <span className={te ? 'font-telugu-body' : ''}>{te ? EXECUTIVE_OFFICER.nameTe : EXECUTIVE_OFFICER.nameEn}</span>
              <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full bg-[#621B00]/10 text-[#621B00] ${te ? 'font-telugu-body' : ''}`}>
                {te ? EXECUTIVE_OFFICER.roleTe : EXECUTIVE_OFFICER.roleEn}
              </span>
            </div>
          </div>

          {/* Dharmakartha Mandali - transcribed from the board at the temple office */}
          <div className="mt-6 pt-6 border-t border-[#E6DCCA]">
            <p className={`text-sm font-medium text-[#2D1B0E] mb-3 ${te ? 'font-telugu-heading' : ''}`}>
              {te ? 'ధర్మకర్తల మండలి' : 'Dharmakartha Mandali (Board of Trustees)'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#5D4037]">
              {TRUST_BOARD.map((m, i) => (
                <div key={i} className="flex items-baseline justify-between gap-3 py-1 border-b border-[#E6DCCA]/60">
                  <span className={te ? 'font-telugu-body' : ''}>{i + 1}. {te ? m.nameTe : m.nameEn}</span>
                  <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full ${i === 0 ? 'bg-[#D4AF37]/20 text-[#8D2800] font-medium' : i === TRUST_BOARD.length - 1 ? 'bg-[#621B00]/10 text-[#621B00]' : 'text-[#8D6E63]'} ${te ? 'font-telugu-body' : ''}`}>
                    {te ? m.roleTe : m.roleEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}