/* Materials (samagri) lists for select sevas, as supplied by the temple.
   Keyed by seva id (from the /api/sevas record). Each item is
   { en, te, qty?, optional? } or a group { en, te, children: [...] }.
   Rendered read-only on the seva's info page - not tied to the booking form. */

const panchamrutham = (qty) => ({
  en: 'Panchamrutham (5 items)', te: 'పంచామృతములు',
  children: [
    { en: "Milk (cow's milk only)", te: 'పాలు (ఆవు పాలు మాత్రమే)', qty: qty.paalu },
    { en: 'Curd', te: 'పెరుగు', qty: qty.perugu },
    { en: 'Honey', te: 'తేనె', qty: qty.tene },
    { en: 'Ghee', te: 'నెయ్యి', qty: qty.neyyi },
    { en: 'Sugar', te: 'పంచదార (చక్కెర)', qty: qty.panchadara },
  ],
});

const rakshaSutramulu = {
  en: 'Protection threads (Raksha Sutramulu)', te: 'రక్షా సూత్రములు',
  children: [
    { en: 'Chilli-lemon thread (evil-eye ward)', te: 'మిరప దారము' },
    { en: 'Black thread', te: 'నల్ల దారము' },
    { en: 'Cowrie-shell string, etc.', te: 'గవ్వల పట్టి దండ, తదితరాలు' },
  ],
};

const vehiclePujaItems = [
  { en: 'Turmeric', te: 'పసుపు', qty: '50g' },
  { en: 'Kumkum', te: 'కుంకుమ', qty: '50g' },
  { en: 'Sandalwood paste', te: 'గంధం', qty: '1 box' },
  rakshaSutramulu,
  { en: 'Incense sticks', te: 'అగరుబత్తులు', qty: '1 box' },
  { en: 'Coconuts', te: 'కొబ్బరికాయలు', qty: '1 or 2' },
  { en: 'Camphor for aarti', te: 'హారతి కర్పూరం', qty: '50g' },
];

export const SEVA_SAMAGRI = {

  // A) Swamy Vari Nija Abhishekam
  '93a765c0-33bd-40c3-85fa-29449f297659': [
    { en: 'Turmeric', te: 'పసుపు', qty: '50g' },
    { en: 'Kumkum', te: 'కుంకుమ', qty: '50g' },
    { en: 'Sandalwood paste', te: 'గంధం', qty: '50g' },
    { en: 'Betel leaves', te: 'తమలపాకులు', qty: '5-10 pcs' },
    { en: 'Betel nuts', te: 'వక్కలు', qty: '50g' },
    { en: 'Dates', te: 'ఖర్జూరాలు', qty: '50g' },
    { en: 'Incense sticks', te: 'అగరుబత్తులు', qty: '1' },
    panchamrutham({ paalu: '1/2 L', perugu: '1/2 L', tene: '100g', neyyi: '50g', panchadara: '100g' }),
    { en: 'Fruit juices', te: 'పండ్ల రసములు', qty: 'as suitable', optional: true },
    { en: 'Tender coconut water', te: 'కొబ్బరి నీళ్లు', qty: '1/4 L', optional: true },
    { en: 'Rose water', te: 'పన్నీరు', qty: '100ml' },
    { en: 'Vetiver roots', te: 'వట్టివేళ్లు', qty: 'as suitable', optional: true },
    { en: 'Bilva leaves', te: 'బిల్వపత్రి', qty: 'as suitable' },
    { en: 'Flowers', te: 'పువ్వులు', children: [
      { en: 'Loose flowers', te: 'విడి పువ్వులు', qty: '50g' },
      { en: 'Garland (Chrysanthemum/Lily)', te: 'దండ (చామంతి/లిల్లీ)', qty: '1' },
    ]},
    { en: 'Fruits', te: 'పండ్లు', qty: 'even no., 5 or 10 pcs' },
    { en: 'Cloth (Angavastram)', te: 'వస్త్రము (ఖండువ)', qty: 'Dhoti/Pancha', optional: true },
    { en: 'Sacred thread (Jandhyam)', te: 'యజ్ఞోపవీతం (జందెం)', optional: true },
    { en: 'Coconuts (large, well-husked)', te: 'కొబ్బరికాయలు (పెద్దవి, పీచు తీసినవి)', qty: '1 or 2' },
    { en: 'Camphor for aarti', te: 'హారతి కర్పూరం', qty: '20g', optional: true },
    { en: 'Tamboolam (fennel seeds)', te: 'తాంబూలం (సోంపు)', optional: true },
    { en: 'Sweet', te: 'స్వీట్', optional: true },
    { en: 'Fragrant items', te: 'సుగంధ ద్రవ్యములు', optional: true },
  ],

  // B) Abhishekam (Rudrabhishekam)
  '0d3dbbc7-a0b2-4ecd-a19a-1d3321850e46': [
    { en: 'Turmeric', te: 'పసుపు' },
    { en: 'Kumkum', te: 'కుంకుమ' },
    { en: 'Sandalwood paste', te: 'గంధం' },
    panchamrutham({ paalu: '', perugu: '', tene: '', neyyi: '', panchadara: '' }),
    { en: 'Vetiver roots', te: 'వట్టివేళ్లు', optional: true },
    { en: 'Flowers', te: 'పువ్వులు' },
    { en: 'Fruits', te: 'పండ్లు' },
    { en: 'Coconuts', te: 'కొబ్బరికాయలు' },
    { en: 'Camphor for aarti', te: 'హారతి కర్పూరం' },
    { en: 'Cloth (Angavastram)', te: 'వస్త్రము (ఖండువ)', qty: 'Dhoti/Pancha', optional: true },
  ],

  // C) Ashtottaram (Archana)
  '3f827b4b-2c41-402e-844b-d87b8635c93c': [
    { en: 'Flowers', te: 'పువ్వులు' },
    { en: 'Fruits', te: 'పండ్లు' },
  ],

  // D) Hanumanthudiki Abhishekam
  '84922da6-488b-4093-8a4a-62815890b3dc': [
    panchamrutham({ paalu: '', perugu: '', tene: '', neyyi: '', panchadara: '' }),
    { en: 'Vermilion (Sindhooram)', te: 'సిందూరం', qty: '200g' },
    { en: 'Sesame oil', te: 'నువ్వుల నూనె', qty: '250g' },
    { en: 'Betel leaves', te: 'తమలపాకులు', qty: '1 dozen (more optional)' },
    { en: 'Silver-plated patri', te: 'వెండి పూత పత్రి', optional: true },
    { en: 'Flowers', te: 'పువ్వులు', children: [
      { en: 'Loose flowers', te: 'విడి పువ్వులు', qty: '100g' },
      { en: 'Garland (Chrysanthemum/Lily)', te: 'దండ (చామంతి/లిల్లీ)', qty: '1' },
    ]},
    { en: 'Fruits', te: 'పండ్లు', qty: 'even no., 2 types' },
    { en: 'Incense sticks', te: 'అగరుబత్తులు', qty: '1' },
  ],

  // Yellamma Bonam
  '390ea5a1-23b2-4723-bb6c-bf3cbdcc85f5': [
    { en: 'Sweet rice offering (Paramannam)', te: 'పరమాన్నం (నైవేద్యం)' },
    { en: 'Flowers', te: 'పువ్వులు' },
    { en: 'Fruits', te: 'పండ్లు' },
  ],

  // E) Sri Satyanarayana Swamy Vratam
  'b8bd0ca3-3bc4-4c97-9d31-4e9bd380f14a': [
    { en: 'Turmeric', te: 'పసుపు', qty: '100g' },
    { en: 'Kumkum', te: 'కుంకుమ', qty: '100g' },
    { en: 'Sandalwood paste', te: 'గంధం', qty: '100g' },
    { en: 'Bukka (fragrant powder)', te: 'బుక్క', qty: '100g', optional: true },
    { en: 'Gulal', te: 'గులాల్', qty: '100g', optional: true },
    { en: 'Betel leaves', te: 'తమలపాకులు', qty: '2 dozen' },
    { en: 'Betel nuts', te: 'వక్కలు', qty: '200g (24 pcs)' },
    { en: 'Dates', te: 'ఖర్జూరాలు', qty: '200g (24 pcs)' },
    panchamrutham({ paalu: '1/4 L', perugu: '1/4 L', tene: '100g', neyyi: '100g', panchadara: '100g' }),
    { en: 'Rose water', te: 'పన్నీరు', qty: '1 bottle' },
    { en: 'Flowers', te: 'పువ్వులు', children: [
      { en: 'Loose flowers', te: 'విడి పువ్వులు', qty: '100g' },
      { en: 'Garland (Chrysanthemum/Lily/Jasmine)', te: 'దండ (చామంతి/లిల్లీ/మల్లెపూలు)', qty: '1' },
    ]},
    { en: 'Fruits', te: 'పండ్లు', children: [
      { en: 'Bananas', te: 'అరటి పండ్లు', qty: '1 dozen (12 pcs)' },
      { en: 'Pomegranate', te: 'దానిమ్మ', qty: '2', optional: true },
      { en: 'Apple', te: 'యాపిల్', qty: '2', optional: true },
      { en: 'Fresh dates', te: 'పచ్చి ఖర్జూరం', optional: true },
    ]},
    { en: 'Incense sticks or dhoop', te: 'అగరుబత్తులు / ధూప్ స్టిక్స్', qty: '1 packet' },
    { en: 'Naivedyam: sweet rice (Paramannam)', te: 'నైవేద్యం: పరమాన్నం' },
    { en: 'Prasadam ingredients', te: 'ప్రసాదం సామాగ్రి', children: [
      { en: 'Fine semolina (Rava)', te: 'సన్న రవ్వ', qty: '1/2 kg' },
      { en: 'Sugar', te: 'పంచదార (చక్కెర)', qty: '1/2 kg' },
      { en: 'Almonds', te: 'బాదం పప్పు', qty: 'as suitable' },
      { en: 'Raisins', te: 'ఎండు ద్రాక్ష (కిస్మిస్)', qty: 'as suitable' },
      { en: 'Other lentils/nuts', te: 'ఇతర పప్పులు', optional: true },
    ]},
    { en: 'Coconuts (large, well-husked)', te: 'కొబ్బరికాయలు (పెద్దవి, పీచు తీసినవి)', qty: '7 or 8' },
    { en: 'Camphor for aarti', te: 'హారతి కర్పూరం', qty: '50g' },
    { en: 'Cloth', te: 'వస్త్రములు', children: [
      { en: 'Angavastram (to spread on the peetham)', te: 'ఖండువ (పీట పైన పరచడానికి)' },
      { en: 'Blouse piece (to place over the kalasham)', te: 'రవిక (కలశం పైన పెట్టడానికి)', qty: '1 or 2' },
    ]},
    { en: 'Rice (for peetham + akshintalu)', te: 'బియ్యం (పీటపై పోయడానికి + అక్షింతలకు)', qty: '1.5 kg' },
    { en: 'Mango leaves (for decoration)', te: 'మామిడి ఆకులు (అలంకరణకు)' },
    { en: 'Marigold / Jasmine garlands (for decoration)', te: 'బంతి పువ్వుల / మల్లె పువ్వుల దండలు (అలంకరణకు)' },
    { en: 'Water', te: 'నీళ్లు', qty: '1 L' },
    { en: 'Copper pot (Kalasham)', te: 'రాగి చెంబు (కలశం)', qty: '1' },
    { en: 'Achamanam set (small glass, spoon, plate)', te: 'ఆచమన పాత్రలు (గ్లాసు, చెంచా, ప్లేటు)', qty: '1 set' },
    { en: 'Large basin (for mixing prasadam)', te: 'పెద్ద గిన్నె (ప్రసాదం కలుపుటకు)' },
  ],

  // F) Laksha Pushparchana
  'fabe8faa-f7a1-47c5-a3ca-4d7d500d662f': [
    { en: 'Flowers', te: 'పువ్వులు' },
    { en: 'Fruits', te: 'పండ్లు' },
    { en: 'Cloth', te: 'వస్త్రములు', optional: true },
  ],

  // G) Swamy Vari Masa Kalyanam
  '1f6dec8c-4b23-4c22-908c-209aa95fa507': [
    { en: 'Turmeric', te: 'పసుపు', qty: '50g' },
    { en: 'Kumkum', te: 'కుంకుమ', qty: '50g' },
    { en: 'Sandalwood paste', te: 'గంధం', qty: '50g' },
    { en: 'Flowers', te: 'పువ్వులు', children: [
      { en: 'Loose flowers', te: 'విడి పువ్వులు', qty: '100g' },
      { en: 'Garlands (for Swamy and Ammavaru)', te: 'దండలు (స్వామివారికి, అమ్మవారికి)', qty: '2' },
    ]},
    { en: 'Fruits', te: 'పండ్లు', children: [
      { en: 'Apple', te: 'యాపిల్', qty: '2' },
      { en: 'Bananas', te: 'అరటి పండ్లు', qty: '1 dozen' },
      { en: 'Pomegranate', te: 'దానిమ్మ', qty: '2' },
      { en: 'Grapes', te: 'ద్రాక్ష', qty: '1/2 kg' },
      { en: 'Etc.', te: 'మొదలైనవి' },
    ]},
    { en: 'Silk cloth', te: 'పట్టు వస్త్రములు', children: [
      { en: 'Dhoti/Pancha (for Swamy)', te: 'ధోతి/పంచె (స్వామివారికి)', qty: '1' },
      { en: 'Saree (for Ammavaru)', te: 'చీర (అమ్మవారికి)', qty: '1' },
      { en: 'Angavastram', te: 'ఖండువ', qty: '1' },
      { en: 'Blouse pieces', te: 'బ్లౌజ్ పీసులు', qty: '2' },
    ]},
    { en: 'Dried coconut pieces', te: 'ఎండు కొబ్బరి కుడుకలు', qty: '5' },
    { en: 'Betel nuts', te: 'వక్కలు', qty: '50g' },
    { en: 'Dates', te: 'ఖర్జూరాలు', qty: '50g' },
    { en: 'Betel leaves', te: 'తమలపాకులు', qty: '1 dozen' },
    { en: 'Jaggery', te: 'బెల్లం', qty: '20g' },
    { en: 'Thalambralu rice', te: 'తలంబ్రాల బియ్యం', qty: '1.25 kg' },
    { en: 'For the Kalyanam: Mangalsutra, toe rings', te: 'కళ్యాణానికి: పుస్తెలు, మెట్టెలు', optional: true },
  ],

  // H) Kumkumarchana
  '9a747367-c76b-4e7c-8bd4-fc42982b2a0d': [
    { en: 'Turmeric', te: 'పసుపు', qty: '50g' },
    { en: 'Kumkum (original Gopuram brand, maroon)', te: 'కుంకుమ (ఒరిజినల్ గోపురం బ్రాండ్, మెరూన్)', qty: '200g' },
    { en: 'Flowers, Jasmine garland', te: 'పువ్వులు, మల్లె పువ్వుల దండ', qty: '50g, 2-3 strings' },
    { en: 'Fruits (any two types)', te: 'పండ్లు (ఏవైనా రెండు రకములు)', qty: 'even no.' },
    { en: 'Coconut', te: 'కొబ్బరికాయ', qty: '1' },
    { en: 'Cloth', te: 'వస్త్రములు', children: [
      { en: 'Angavastram (for Swamy)', te: 'ఖండువ (స్వామివారికి)', qty: '1' },
      { en: 'Blouse piece (for Amma)', te: 'బ్లౌజ్ పీస్ (అమ్మవారికి)', qty: '2' },
      { en: 'Saree (for Amma)', te: 'చీర (అమ్మవారికి)', qty: '1' },
    ]},
    { en: 'Etc.', te: 'మొదలైనవి' },
  ],

  // I) Mokkubadi Kode Trippikattuta
  '75505f16-8d3a-4324-af13-8c6d5b2ca7aa': [
    { en: 'Turmeric', te: 'పసుపు', qty: '50g' },
    { en: 'Kumkum', te: 'కుంకుమ', qty: '50g' },
    { en: 'Sandalwood paste', te: 'గంధం', qty: '50g' },
    { en: 'Flowers', te: 'పువ్వులు', children: [
      { en: 'Loose flowers', te: 'విడి పువ్వులు', qty: '50g' },
      { en: 'Garland', te: 'దండ', qty: '1' },
    ]},
    { en: 'Feed for the bull (Graasam)', te: 'గ్రాసం (కోడెకు తినిపించుటకు)', children: [
      { en: 'Cowpeas, soaked in water', te: 'బొబ్బర్లు (నీటిలో నానబెట్టినవి)', qty: '1/4 or 1/2 kg' },
      { en: 'Nine grains, soaked in water', te: 'నవధాన్యములు (నీటిలో నానబెట్టినవి)', qty: '1/4 or 1/2 kg' },
    ]},
    { en: 'Coconut', te: 'కొబ్బరికాయ', qty: '1 or 2' },
    { en: 'Camphor for aarti', te: 'హారతి కర్పూరం', qty: '50g' },
    { en: 'Etc.', te: 'మొదలైనవి' },
  ],

  // J) Ammavari Alayam Pallaki Seva
  '2d634010-82b3-4de4-ac03-670621ec9fa9': [
    { en: 'Turmeric', te: 'పసుపు', qty: '50g' },
    { en: 'Kumkum', te: 'కుంకుమ', qty: '50g' },
    { en: 'Betel leaves', te: 'తమలపాకులు', qty: '1/2 dozen (6 pcs)' },
    { en: 'Betel nuts', te: 'వక్కలు', qty: '20g' },
    { en: 'Dates', te: 'ఖర్జూరాలు', qty: '20g' },
    { en: 'Flowers', te: 'పువ్వులు', children: [
      { en: 'Loose flowers', te: 'విడి పువ్వులు', qty: '100g' },
      { en: 'Garlands (1 for the Utsava Murthulu in the Pallaki, 1 for Parvathi Ammavaru)', te: 'దండలు (1 పల్లకి సేవలో ఉత్సవ మూర్తులకు, 1 పార్వతి అమ్మవారికి)', qty: '2' },
    ]},
    { en: 'Fruits (any two types)', te: 'పండ్లు (ఏవైనా రెండు రకములు)', qty: 'even no.' },
    { en: 'Cloth', te: 'వస్త్రములు', optional: true },
    { en: 'Incense sticks', te: 'అగరుబత్తులు', qty: '1 packet' },
    { en: 'Coconut', te: 'కొబ్బరికాయ', qty: '1 or 2' },
    { en: 'Camphor for aarti', te: 'హారతి కర్పూరం', qty: '50g' },
    { en: 'Naivedyam ingredients (Pulihora or Paramannam)', te: 'నైవేద్యం సామాగ్రి (పులిహోర లేదా పరమాన్నం)', optional: true },
  ],

  // K) Vahana Puja (2-Wheeler)
  '3a224812-4900-4382-b2dc-46d63f4e3bdc': vehiclePujaItems,

  // L) Auto Puja (3-Wheeler)
  'b0f1d7d2-4947-4913-a0a6-e61f5ff3e387': vehiclePujaItems,

  // M) Vahana Puja (4-Wheeler)
  'ef56f8d5-c485-4283-8211-7bba1782f0da': vehiclePujaItems,

  // N) Bhari Vahana Puja (Lorry, JCB)
  '72aee361-4053-4a3d-b225-d35406532db5': [
    ...vehiclePujaItems,
    { en: 'Pumpkin (large, optional)', te: 'గుమ్మడికాయ (పెద్దది, ఐచ్ఛికం)', qty: '1', optional: true },
  ],

  // O) Vivaham
  '5aa77829-8fb5-4763-a903-2ff014e1b4ff': [
    { en: 'Wedding ritual materials (Vivaha Samagri)', te: 'వివాహ సామాగ్రి' },
    { en: 'Valid identification and address documents of bride and groom, for verification', te: 'వధూవరుల చెల్లుబాటు అయ్యే గుర్తింపు మరియు చిరునామా పత్రములు, ధృవీకరణ కొరకు', note: 'Mandatory' },
    { en: "Authorization documentation from the Sarpanch of the bride's and groom's respective villages", te: 'వధూవరుల గ్రామాల సర్పంచ్ నుండి సంబంధిత అనుమతి పత్రము', note: 'Mandatory' },
    { en: 'For other relevant information, contact the temple authority', te: 'ఇతర వివరముల కొరకు దేవస్థాన కార్యాలయమును సంప్రదించండి' },
  ],
};

// Display order given by the temple for the Pratyaksha Seva list, A through O.
// Sevas not on this list keep their existing relative order, after these.
export const SEVA_PRIORITY_ORDER = [
  '93a765c0-33bd-40c3-85fa-29449f297659', // A) Nija Rudra Abhishekam
  '0d3dbbc7-a0b2-4ecd-a19a-1d3321850e46', // B) Rudrabhishekam
  '3f827b4b-2c41-402e-844b-d87b8635c93c', // C) Archana
  '84922da6-488b-4093-8a4a-62815890b3dc', // D) Hanuman Abhishekam
  '390ea5a1-23b2-4723-bb6c-bf3cbdcc85f5', // D) Yellamma Bonam
  'b8bd0ca3-3bc4-4c97-9d31-4e9bd380f14a', // E) Sri Satyanarayana Swamy Vratam
  'fabe8faa-f7a1-47c5-a3ca-4d7d500d662f', // F) Laksha Pushparchana
  '1f6dec8c-4b23-4c22-908c-209aa95fa507', // G) Masa Kalyanam
  '9a747367-c76b-4e7c-8bd4-fc42982b2a0d', // H) Kumkumarchana
  '75505f16-8d3a-4324-af13-8c6d5b2ca7aa', // I) Kode Trippi Kattuta
  '2d634010-82b3-4de4-ac03-670621ec9fa9', // J) Pallaki Seva
  '3a224812-4900-4382-b2dc-46d63f4e3bdc', // K) Dwichakra Vahanamu Pooja
  'b0f1d7d2-4947-4913-a0a6-e61f5ff3e387', // L) Tri Chakra Vahanamu Pooja
  'ef56f8d5-c485-4283-8211-7bba1782f0da', // M) Chathushchakra Vahana Pooja
  '72aee361-4053-4a3d-b225-d35406532db5', // N) Bhari Vahana Pooja
  '5aa77829-8fb5-4763-a903-2ff014e1b4ff', // O) Vivaham
];

export function sortByPriority(sevas) {
  const rank = new Map(SEVA_PRIORITY_ORDER.map((id, i) => [id, i]));
  return [...sevas].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Infinity;
    const rb = rank.has(b.id) ? rank.get(b.id) : Infinity;
    return ra - rb;
  });
}
