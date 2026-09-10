import asyncio
import hashlib
import hmac
import logging
import os
import re
import uuid
from datetime import datetime, timezone

import requests
from fastapi import APIRouter, HTTPException, Query, Request

from app.database.db import db
from app.services import chat_agent, intent_router

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN")
META_APP_SECRET = os.environ.get("META_APP_SECRET")

# Turns (user + assistant messages) of free-text chat kept per phone number in
# db.whatsapp_sessions.chat_history, for chat_agent conversational context and
# for intent_router to read a short reply ("book it") against what was just
# discussed. 6 turns = 3 exchanges - enough for that, not so much it bloats
# every classify()/ask() call.
CHAT_HISTORY_TURNS = 6

# All devotee-facing copy lives here, one language per menu item (chosen once
# per phone number and remembered in db.whatsapp_sessions), so it can be
# edited without touching the webhook/routing logic below. Add a new menu
# item by adding a key to both REPLIES_EN/REPLIES_TE and a matching line +
# keyword to MENU_KEYWORDS.
SITE = "https://cheruvugattu.online"

LANGUAGE_PROMPT = (
    "🙏 Please select your language / దయచేసి మీ భాషను ఎంచుకోండి:\n\n"
    "1️⃣ English\n"
    "2️⃣ తెలుగు"
)

# The menu is shown as two native WhatsApp list messages (tap-to-select,
# instead of the devotee having to type a number) - one list per message
# because WhatsApp caps a single list message at 10 rows total. Typing a
# number or keyword still works exactly as before; list rows just send the
# same "1".."12" ids that _resolve_option already understands.
MENU_LISTS_EN = [
    {
        "header": "Temple Info",
        "body": "🙏 Namaste! Welcome to Sri Parvathi Jadala Ramalingeshwara Swamy Devastanam.\n\nChoose an option below:",
        "footer": "Type 'telugu' to switch language",
        "rows": [
            {"id": "1", "title": "Temple Timings", "description": "Morning & evening darshan hours"},
            {"id": "2", "title": "Sevas & Booking", "description": "Popular sevas and online booking link"},
            {"id": "3", "title": "Donations", "description": "e-Hundi, Annadanam and other sevas"},
            {"id": "4", "title": "Accommodation", "description": "Rooms, cottages and dormitory rates"},
            {"id": "5", "title": "Address & Directions", "description": "How to reach the temple"},
            {"id": "6", "title": "Temple Office", "description": "Contact the executive officer"},
            {"id": "7", "title": "Temple History", "description": "Sthala Puranam - the temple's legend"},
            {"id": "8", "title": "Stotrams", "description": "Read temple stotrams online"},
        ],
    },
    {
        "header": "More Options",
        "body": "More ways we can help:",
        "footer": "Type 'telugu' to switch language",
        "rows": [
            {"id": "9", "title": "Photo & Video Gallery", "description": "Browse temple photos and videos"},
            {"id": "10", "title": "Live Blog", "description": "Follow live updates from the temple"},
            {"id": "11", "title": "Devotee Registration", "description": "Register to book sevas & accommodation"},
            {"id": "12", "title": "Volunteer Registration", "description": "Sign up to volunteer with the temple"},
        ],
    },
]

MENU_LISTS_TE = [
    {
        "header": "ఆలయ సమాచారం",
        "body": "🙏 నమస్తే! శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానానికి స్వాగతం.\n\nకింద ఒక ఎంపికను ఎంచుకోండి:",
        "footer": "'english' అని టైప్ చేయండి",
        "rows": [
            {"id": "1", "title": "ఆలయ సమయాలు", "description": "ఉదయం & సాయంత్రం దర్శన సమయాలు"},
            {"id": "2", "title": "సేవలు & బుకింగ్", "description": "ప్రసిద్ధ సేవలు, ఆన్‌లైన్ బుకింగ్"},
            {"id": "3", "title": "విరాళాలు", "description": "ఈ-హుండీ, అన్నదానం మరియు ఇతర సేవలు"},
            {"id": "4", "title": "వసతి", "description": "గదులు, కాటేజీలు, డార్మిటరీ ధరలు"},
            {"id": "5", "title": "చిరునామా", "description": "ఆలయానికి చేరుకునే విధానం"},
            {"id": "6", "title": "కార్యాలయం", "description": "కార్యనిర్వహణాధికారిని సంప్రదించండి"},
            {"id": "7", "title": "ఆలయ చరిత్ర", "description": "స్థల పురాణము - ఆలయ చరిత్ర గాథ"},
            {"id": "8", "title": "స్తోత్రాలు", "description": "ఆలయ స్తోత్రాలు చదవండి"},
        ],
    },
    {
        "header": "మరిన్ని ఎంపికలు",
        "body": "మరింత సహాయం కోసం:",
        "footer": "'english' అని టైప్ చేయండి",
        "rows": [
            {"id": "9", "title": "గ్యాలరీ", "description": "ఫోటోలు మరియు వీడియోలు"},
            {"id": "10", "title": "లైవ్ బ్లాగ్", "description": "ఆలయం నుండి తాజా వార్తలు"},
            {"id": "11", "title": "భక్తుల నమోదు", "description": "సేవలు, వసతి బుకింగ్ కోసం నమోదు"},
            {"id": "12", "title": "వాలంటీర్ నమోదు", "description": "వాలంటీర్‌గా చేరడానికి నమోదు"},
        ],
    },
]

REPLIES_EN = {
    "1": (
        "🕉️ Temple Timings\n\n"
        "Morning: 5:00 AM – 1:00 PM\n"
        "Evening: 3:00 PM – 7:00 PM"
    ),
    "2": (
        "🪔 Sevas & Booking\n\n"
        "Some popular sevas:\n"
        "- Kumkumarchana – ₹30\n"
        "- Abhishekam – ₹200\n"
        "- Sri Satyanarayana Swamy Vratam – ₹300\n"
        "- Swamy Vari Kalyanam – ₹1000\n\n"
        f"See the full list and book online: {SITE}/sevas"
    ),
    "3": (
        "🙏 Donations\n\n"
        "You can contribute towards e-Hundi, Annadanam, and other temple "
        "sevas online:\n"
        f"{SITE}/donations"
    ),
    "4": (
        "🛏️ Accommodation\n\n"
        "- Siva Nilayam (AC Room) – ₹800/day\n"
        "- Parvathi Sadanam (Non-AC Room) – ₹400/day\n"
        "- Nandi Cottage – ₹1500/day\n"
        "- Pilgrim Dormitory – ₹100/day\n\n"
        f"Check availability and book: {SITE}/accommodation"
    ),
    "5": (
        "📍 Address & Directions\n\n"
        "Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams, "
        "Cheruvugattu, Narketpally Mandal, Nalgonda District, "
        "Telangana - 508254, India"
    ),
    "6": (
        "☎️ Temple Office\n\n"
        "Sri S. Mohan Babu, Executive Officer\n"
        "Phone: +91 94910 00701\n"
        "Email: aceocheruvugattu@yahoo.in\n"
        "Website: info@cheruvugattu.online\n\n"
        f"Or write to us here: {SITE}/support/contact"
    ),
    # Sent as 2 messages - the combined shloka+Introduction+Main Legend text
    # is close to WhatsApp's ~4096-character-per-message limit on its own.
    # Kept in lockstep with the same verbatim Sthala Puranam text on the
    # /about#history page (AboutTemple.jsx, English tab).
    "7": [
        (
            "📜 Sthala Puranam (1/2)\n\n"
            "The Shloka\n\n"
            "I worship Sri Ramalingam, who resides in the great, divine temple built by the illustrious Bhargava Rama (Parashurama), who bears half His form as the daughter of the snow-capped mountain (Parvati) and wears the crescent moon, whose lotus feet are served by Brahma, Indra and Achyuta (Vishnu), who is the wish-fulfilling tree for true devotees, and who dwells beautifully upon the Ikshu hill (Ikshwadri).\n\n"
            "Introduction\n\n"
            "In the Treta Yuga, there lived an immensely powerful emperor named Kartavirya Arjuna. He was extraordinarily strong and possessed a thousand arms. One day, he went hunting in the forest with his entire retinue. Tired from the hunt, the king arrived at the nearby hermitage of the sage-king Jamadagni to rest. Sage Jamadagni, with the help of his divine wish-fulfilling cow Shabala, was able to arrange a sumptuous feast with all six flavours for the emperor's entire retinue within a very short time. Delighted by this, Kartavirya Arjuna asked the sage to give him the wish-fulfilling cow. Jamadagni advised him, saying, \"O King! By the power of its penance, this cow stays on its own accord only with sages; it cannot be kept by force by anyone.\" Ignoring these words, the emperor ordered his soldiers to forcibly bring the cow and its calf to his kingdom. Having no other option, Jamadagni went to the cow and prayed, \"O Mother! I am unable to protect you. Protect yourself, and thereby protect me too.\" Then, from a hair on the cow's body, a warrior fully equipped with weapons emerged and, in an instant, destroyed Kartavirya Arjuna's entire army. Unable to contain his anger, Kartavirya Arjuna came to wage war against Jamadagni, whereupon the sage's son, Parashurama, defeated him. Kartavirya Arjuna, burning with the desire for revenge, waited for a time when Parashurama was away, attacked the hermitage, and beheaded Sage Jamadagni. When Parashurama returned to the hermitage and learned of this, he flew into a towering rage, attacked Kartavirya Arjuna's kingdom, severed his thousand arms, and slew him. Even then, his anger unabated, Parashurama circled the earth twenty-one times, slaying every Kshatriya he encountered, and donated the entire earth as a gift to the foremost of Brahmins, Kashyapa Prajapati, the mind-born son of Brahma. At the sacred ford of Shamantapanchaka, he offered tarpana (libations) to his father Jamadagni with that Kshatriya blood. Thereafter, for the welfare of the universe and wishing the world to flourish in peace and happiness, he consecrated Shiva Lingas at 108 sacred sites, pouring the power of his penance - accumulated over hundreds of thousands of years - into each Shiva Linga he installed at every site, thereby establishing peace throughout the universe."
        ),
        (
            "📜 Sthala Puranam (2/2)\n\n"
            "The Main Legend\n\n"
            "Of the 108 Shiva Lingas consecrated by Parashurama, the last was installed at the Cheruvugattu kshetram. Even after performing penance here with unwavering devotion for hundreds of thousands of years, Shiva did not appear before him. Enraged, Parashurama struck the Shiva Linga he had installed with his axe (Parashu). Lord Shiva then appeared and declared, \"For all these years you have performed penance and pleased me; this kshetram shall shine as one of the most renowned holy places. From here until the end of Kali Yuga, I shall remain and fulfil the long-cherished desires of my devotees,\" and with this promise, vanished. Since that day, this kshetram has flourished, growing more glorious day by day, gaining fame as an illustrious Shaiva kshetram, and shining as a place of great sanctity for devotees. In this Devasthanam, the temple of Sri Parvathi Devi lies at the foot of the hill (Gattu). In the temple at the foot of the hill, Sri Parvathi Devi is enshrined, with Sri Mallikarjuna Swamy, Subrahmanya Swamy, and Sri Bhadrakali Veerabhadra Swamy as attendant deities. Atop the hill, Sri Swamy's attendant deities are Sri Vighneshwara Swamy, Sri Anjaneya Swamy, and Sri Yellamma Devi, with Kalabhairava Swamy as the Kshetrapalaka (guardian deity); and it is believed that the revered Urdhva Linga atop the three sacred rock pools (Moodu Gundlu), along with the Gogarbha pond beside the Koneru, fulfil the heartfelt wishes of devotees. In this kshetram, Sri Swamy is worshipped by devotees as the Arogyapradata (bestower of health)."
        ),
    ],
    "8": (
        "🎶 Stotrams\n\n"
        "Browse and read temple stotrams:\n"
        f"{SITE}/stotrams"
    ),
    "9": (
        "📸 Photo & Video Gallery\n\n"
        f"Photos: {SITE}/gallery\n"
        f"Videos: {SITE}/media/gallery/videos"
    ),
    "10": (
        "📰 Live Blog\n\n"
        "Follow live updates from the temple:\n"
        f"{SITE}/live-blog"
    ),
    "11": (
        "📝 Devotee Registration\n\n"
        "Register as a devotee to book sevas, accommodation, and more:\n"
        f"{SITE}/register"
    ),
    "12": (
        "🤝 Volunteer Registration\n\n"
        "Sign up to volunteer with the temple:\n"
        f"{SITE}/volunteer"
    ),
    # Not a numbered menu item - reached only via MENU_KEYWORDS, since
    # devotees ask about this specific seva's timings directly.
    "kalyana_katta": (
        "🙏 Kalyana Katta (Thalanelalu) Timings\n\n"
        "06:00 AM – 12:00 PM\n"
        "03:00 PM – 06:00 PM\n\n"
        "All days.\n\n"
        "Timings may vary +/- 30 minutes on certain days due to high/low public reach.\n\n"
        "Om Namo Bhagavate Ramalingaya 🙏"
    ),
}

REPLIES_TE = {
    "1": (
        "🕉️ ఆలయ సమయాలు\n\n"
        "ఉదయం: 5:00 - 1:00\n"
        "సాయంత్రం: 3:00 - 7:00"
    ),
    "2": (
        "🪔 సేవలు & బుకింగ్\n\n"
        "కొన్ని ప్రసిద్ధ సేవలు:\n"
        "- కుంకుమార్చన – ₹30\n"
        "- అభిషేకం – ₹200\n"
        "- శ్రీ సత్యనారాయణ స్వామి వ్రతం – ₹300\n"
        "- శ్రీ స్వామివారి కళ్యాణం – ₹1000\n\n"
        f"పూర్తి జాబితా మరియు బుకింగ్ కోసం: {SITE}/sevas"
    ),
    "3": (
        "🙏 విరాళాలు\n\n"
        "ఈ-హుండీ, అన్నదానం మరియు ఇతర ఆలయ సేవలకు ఆన్‌లైన్‌లో విరాళం అందించవచ్చు:\n"
        f"{SITE}/donations"
    ),
    "4": (
        "🛏️ వసతి\n\n"
        "- శివ నిలయం (ఏసీ రూమ్) – ₹800/రోజు\n"
        "- పార్వతి సదనం (నాన్ ఏసీ రూమ్) – ₹400/రోజు\n"
        "- నంది కాటేజ్ – ₹1500/రోజు\n"
        "- యాత్రికుల డార్మిటరీ – ₹100/రోజు\n\n"
        f"లభ్యత చూసి బుక్ చేసుకోండి: {SITE}/accommodation"
    ),
    "5": (
        "📍 చిరునామా\n\n"
        "శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం, చెరువుగట్టు, "
        "నార్కట్‌పల్లి మండలం, నల్గొండ జిల్లా, తెలంగాణ - 508254"
    ),
    "6": (
        "☎️ కార్యాలయం\n\n"
        "శ్రీ ఎస్. మోహన్ బాబు, కార్యనిర్వహణాధికారి\n"
        "ఫోన్: +91 94910 00701\n"
        "ఇమెయిల్: aceocheruvugattu@yahoo.in\n"
        "వెబ్‌సైట్: info@cheruvugattu.online\n\n"
        f"లేదా ఇక్కడ రాయండి: {SITE}/support/contact"
    ),
    # Sent as 2 messages, same reasoning as REPLIES_EN["7"].
    "7": [
        (
            "📜 స్థల పురాణము (1/2)\n\n"
            "శ్లో॥ శ్రీమద్భార్గవరామనిర్మితమహాదివ్యాలయేసంస్థితం\n"
            "నీహారాచలకన్యకార్థవపుషంబాలేందురేఖాధరం |\n"
            "బ్రహ్మేంద్రాచ్యుతసేవ్యపాదజలజంసద్భక్తకల్పధృమం\n"
            "సేవేసుందరఇక్షుశైలనిలయం శ్రీరామలింగంభజే ॥\n\n"
            "పరిచయం\n\n"
            "త్రేతాయుగంలో కార్తవీర్యార్జునుడు అనే మహాపరాక్రమశాలియైన చక్రవర్తి ఉండేవాడు. అతడు మహా బలవంతుడు. అతడికి వేయిచేతులు వుండేవి. అతడు ఒకరోజు తన సమస్త పరివారంతో కలిసి వేటకై అడవికి వెళ్ళాడు. వేటలో అలసిపోయిన రాజు విశ్రమించడానికై సమీపంలో గల జమదగ్ని మహారాజు ఆశ్రమానికి చేరుకున్నాడు. అప్పుడు జమదగ్ని మహర్షి తన వద్ద గల 'శబల' అనే హోమధేనువు సహాయంతో ఆ చక్రవర్తి యొక్క సమస్త పరివారానికి షడ్రసోపేతమైన విందును అతికొద్ది సమయంలో సమకూర్చగలిగాడు. అందుకు సంతోషించిన కార్తవీర్యార్జునుడు తనకు ఆ హోమధేనువును తనకిమ్మని మహర్షిని కోరాడు. అప్పుడు జమదగ్ని \"ఓ మహరాజా! ఈ హోమధేనువు తప:ప్రభావం వలన మహర్షుల వద్ద తనంతట తానుగా ఉంటుంది కాని, బలవంతంగా ఎవరివద్దా ఉంచుకొనుట సాధ్యంకాదు\" అని హితబోధ చేసాడు. ఆ మాటలు పట్టించుకోని చక్రవర్తి హోమధేనువును, దాని దూడను బలవంతంగా తన రాజ్యానికి తీసుకురమ్మని తన సైనికులను ఆజ్ఞాపించాడు. చేసేదేమి లేక జమదగ్ని మహర్షి ఆ గోవు వద్దకు వెళ్ళి, 'తల్లీ! నేను నిన్ను రక్షించలేకపోతున్నాను. నిన్ను నీవే రక్షించుకుని, నన్ను కూడా రక్షించు' అని ప్రార్ధించాడు. అప్పుడా హోమధేనువు శరీరము నుండి రోమమున (వెంట్రుక) సైనికుడు సమస్త ఆయుధాలతో ఆవిర్భవించి, కార్తవీర్యార్జునుని సైన్యానంతటినీ క్షణకాలంలో సంహరించారు. కోపం పట్టలేని కార్తవీర్యార్జునుడు జమదగ్ని మహర్షి పైకి యుద్ధానికి రాగా, మహర్షి కుమారుడు పరుశురాముడు కార్తవీర్యార్జునుడిని ఓడించాడు. ప్రతీకారంతో రగిలిపోతున్న కార్తవీర్యార్జునుడు పరశురాముడు లేని సమయం చూసి ఆశ్రమం పైకి దండెత్తి వెళ్ళి, జమదగ్ని మహర్షి తలను ఖండించి సంహరించాడు. ఆశ్రమానికి తిరిగి వచ్చిన పరశురాముడు ఈ విషయం తెలసుకుని మహోకోపోద్రేకుడై కార్తవీర్యార్జునుని రాజ్యంపై దండెత్తి అతడి వేయిచేతును ఖండించి, అతడిని సంహరించాడు. అయినా కోపం తగ్గని పరశురాముడు 21 మార్లు అలా భూప్రదక్షిణం చేసి క్షత్రియుడనేవాడు కనబడితే సంహరించి, భూమండలాన్నంతటినీ బ్రాహ్మణ శ్రేష్ఠుడు, బ్రహ్మ మానసపుత్రడైన కశ్యప ప్రజాపతికి దానదక్షిణగా సమర్పించి, శమంతపంచక తీర్ధంలో ఆ క్షత్రియ రక్తంతో తన తండ్రి అయిన జమదగ్నికి పితృతర్పణ చేసాడు. ఆ తర్వాత విశ్వకళ్యాణార్ధం కోసం, లోకం సుఖశాంతులతో వర్ధిల్లాలని భావించి, 108 పవిత్ర క్షేత్రాలలో శివలింగ ప్రతిష్ఠ చేసి, కొన్ని లక్షల సంవత్సరాల తన తపఃశ్శక్తిని ప్రతి క్షేత్రంలోను తాను ప్రతిష్ఠించిన శివలింగానికి ధారపోసి విశ్వశాంతిని నెలకొల్పాడు."
        ),
        (
            "📜 స్థల పురాణము (2/2)\n\n"
            "ముఖ్య గాథ\n\n"
            "పరశురాముడు ప్రతిష్ఠించిన 108 శివలింగాల్లో ఆఖరిది చెరువుగట్టు క్షేత్రంలో ప్రతిష్ఠించి ఈ స్థలంలోనే తపోనిష్ఠతో ఎన్నో లక్షల సంవత్సరాలు తపస్సు చేసినా, శివుడు ప్రత్యక్షం కానందున ఆగ్రహించి తాను ప్రతిష్టించిన శివలింగంపై తన పరశువుతో కొట్టాడు. అప్పుడు పరమశివుడు ప్రత్యక్షమై 'ఇన్నాళ్లు నువ్వు తపస్సు చేసి నన్ను మెప్పించిన ఈ క్షేత్రం సుప్రసిద్ధ క్షేత్రాలలో ఒకటై ప్రకాశిస్తుందని, ఇక్కడినుండి కలియుగాంతం వరకు నేను నిలిచియుండి భక్తుల యొక్క చిరకాల వాంఛలను నెరవేరుస్తుంటాను\" అని వాగ్దానం చేసి అంతర్థానమయ్యాడు. నాటినుండి ఈ క్షేత్రం దినదిన ప్రవర్ధమానంగా విరాజిల్లుతూ సుప్రసిద్ధ శైవక్షేత్రంగా పేరుపొంది, భక్తులపాలిట మహిమాన్వితక్షేత్రంగా వెలుగొందుతుంది. ఈ దేవస్థానమునందు పార్వతీ అమ్మవారి ఆలయం గట్టు (కొండ) క్రింద కలదు. కొండ క్రింద ఆలయములో శ్రీ పార్వతీ అమ్మవారు కొలువై, పరివార దేవతలుగా, శ్రీ మల్లిఖార్జున స్వామి, సుబ్రహ్మణ్య స్వామి, శ్రీ భద్రకాళీ వీరభద్రస్వామి దేవతలు పరివార దేవతలుగా కొలువైయున్నారు. గట్టుమీద శ్రీ స్వామివారికి పరివార దేవతలుగా శ్రీ విఘ్నేశ్వర స్వామి వారు, శ్రీ ఆంజనేయ స్వామి వారు, శ్రీ ఎల్లమ్మ అమ్మవారు మరియు క్షేత్రపాలకుడుగా కాలభైరవ స్వామివారు మరియు అతి ప్రశస్త్యమైన మూడు గుండ్లపై ఊర్ధ్వలింగము మరియు కోనేరు ప్రక్కన గోగర్భకొలను కొలువైయుండి భక్తుల మనోభీష్టాలను నెరవేరుస్తున్నారని ప్రతీతి. ఈ క్షేత్రంలో శ్రీ స్వామివారు ఆరోగ్యప్రదాతగా భక్తుల చేత పూజింపబడుచున్నారు."
        ),
    ],
    "8": (
        "🎶 స్తోత్రాలు\n\n"
        "ఆలయ స్తోత్రాలు చదవండి:\n"
        f"{SITE}/stotrams"
    ),
    "9": (
        "📸 గ్యాలరీ\n\n"
        f"ఫోటోలు: {SITE}/gallery\n"
        f"వీడియోలు: {SITE}/media/gallery/videos"
    ),
    "10": (
        "📰 లైవ్ బ్లాగ్\n\n"
        "ఆలయం నుండి తాజా వార్తలు:\n"
        f"{SITE}/live-blog"
    ),
    "11": (
        "📝 భక్తుల నమోదు\n\n"
        "సేవలు, వసతి మొదలైనవి బుక్ చేసుకోవడానికి భక్తునిగా నమోదు చేసుకోండి:\n"
        f"{SITE}/register"
    ),
    "12": (
        "🤝 వాలంటీర్ నమోదు\n\n"
        "ఆలయంతో వాలంటీర్‌గా చేరడానికి నమోదు చేసుకోండి:\n"
        f"{SITE}/volunteer"
    ),
    "kalyana_katta": (
        "🙏 కళ్యాణ కట్ట (తలనీలాలు) సమయాలు\n\n"
        "ఉదయం 06:00 - మధ్యాహ్నం 12:00\n"
        "మధ్యాహ్నం 03:00 - సాయంత్రం 06:00\n\n"
        "అన్ని రోజులు.\n\n"
        "ప్రజా రద్దీని బట్టి కొన్ని రోజుల్లో సమయాలు +/- 30 నిమిషాలు మారవచ్చు.\n\n"
        "ఓం నమో భగవతే రామలింగాయ 🙏"
    ),
}

# An exact-match request to see the menu - either explicitly ("menu", "help")
# or a bare greeting, which is what most devotees actually type to restart/
# reorient ("hi", "hai", "hello"). Checked before intent_router/chat_agent, so
# it always works regardless of whether the AI chat feature is configured.
# Deliberately exact match, not substring: "help me choose a seva" shouldn't
# short-circuit to the menu instead of being answered.
MENU_REQUEST_WORDS = {
    "menu", "help", "options",
    "hi", "hai", "hii", "hiii", "hello", "helo", "hlo", "hey", "namaste",
    "మెనూ", "సహాయం", "ఎంపికలు", "నమస్తే",
}

# Lets devotees type a keyword instead of memorizing the menu number. Checked
# as a substring against the lowercased (English) or exact (Telugu) message,
# in this order, before falling back to an exact match on the menu number.
MENU_KEYWORDS = {
    # Checked before "seva"/"book" below so "kalyana katta timings" doesn't
    # get swallowed by the generic Sevas & Booking match. Spelling varies a
    # lot in practice ("kalayan kattu", "kalyan katta", ...); the "kaly"/
    # "kalay" + "katt" combo check in _resolve_option below covers those, so only
    # the unambiguous keywords are listed here.
    "thalanelalu": "kalyana_katta",
    "thala neelalu": "kalyana_katta",
    "talaneelalu": "kalyana_katta",
    "tonsure": "kalyana_katta",
    "కళ్యాణ కట్ట": "kalyana_katta",
    "తలనీలాలు": "kalyana_katta",
    "timing": "1",
    "hour": "1",
    "సమయ": "1",
    "seva": "2",
    "book": "2",
    "సేవ": "2",
    "donat": "3",
    "hundi": "3",
    "annadanam": "3",
    "విరాళ": "3",
    "accommodation": "4",
    "room": "4",
    "stay": "4",
    "వసతి": "4",
    "address": "5",
    "location": "5",
    "direction": "5",
    "చిరునామా": "5",
    "contact": "6",
    "office": "6",
    "phone": "6",
    "కార్యాలయ": "6",
    "history": "7",
    "puranam": "7",
    "చరిత్ర": "7",
    "పురాణ": "7",
    "stotram": "8",
    "స్తోత్ర": "8",
    "gallery": "9",
    "photo": "9",
    "video": "9",
    "గ్యాలరీ": "9",
    "blog": "10",
    "బ్లాగ్": "10",
    # "volunteer"/"వాలంటీర్" are checked before the generic registration
    # entries so "volunteer registration" routes to 12, not 11.
    "volunteer": "12",
    "వాలంటీర్": "12",
    "regist": "11",
    "sign up": "11",
    "signup": "11",
    "నమోదు": "11",
}

# Devotee Registration (menu option 11) happens right here in chat instead of
# just linking to /register - the devotee has already proven ownership of
# this number by messaging us from it (WhatsApp's OTP-template Authentication
# category needs Meta business verification + a payment method, neither of
# which is set up), so a free-form conversational form within this
# customer-initiated session collects the same fields the website's sign-up
# form does, then hands off to main.py's shared _register_devotee (same
# email-verification-link flow as the website - no separate OTP step here).
# State lives in db.whatsapp_sessions alongside "language": reg_state is one
# of "name"/"email"/"gotram"/"password"/"confirm_password"/"newsletter" while
# a registration is in progress, and reg_data accumulates the answers. Both
# are unset again once finished (or cancelled), so a plain "11" always starts
# a fresh attempt.
REG_PROMPTS = {
    "en": {
        "already_registered": "You're already registered! Sign in at {site}/login with your mobile number and password.\n\nForgot your password? {site}/forgot-password",
        "ask_name": "📝 Let's create your devotee account.\n\nWhat's your full name?",
        "ask_email": "Email address? (this is required - we'll send a verification link here, and it's needed to book sevas/accommodation)",
        "invalid_email": "That doesn't look like a valid email address. Please try again.",
        "email_taken": "That email is already registered to another account. Sign in at {site}/login instead, or use a different email.",
        "ask_gotram": "Gotram? (optional - reply 'skip' to leave blank)",
        "ask_password": "Set a password (at least 4 characters) - you'll use this together with your mobile number to sign in on the website.\n\nReply 'cancel' any time to stop.",
        "password_too_short": "Password must be at least 4 characters. Please try again.",
        "ask_confirm_password": "Please retype your password to confirm.",
        "password_mismatch": "Those passwords didn't match. Let's try again - set a password (at least 4 characters).",
        "ask_newsletter": "Would you like to receive temple updates by email (festival announcements, news)? Reply 'yes' or 'no'.",
        "invalid_yes_no": "Please reply 'yes' or 'no'.",
        "cancelled": "Registration cancelled. Type 'register' any time to start again.",
        "done": "🎉 Registration complete!\n\nWe've sent a verification link to {email} - please open it to confirm your email (needed before you can book sevas or accommodation).\n\nSign in any time at {site}/login with your mobile number ({mobile}) and the password you just set.",
    },
    "te": {
        "already_registered": "మీరు ఇప్పటికే నమోదు అయ్యారు! మీ మొబైల్ నంబర్ మరియు పాస్‌వర్డ్‌తో {site}/login లో సైన్ ఇన్ చేయండి.\n\nపాస్‌వర్డ్ మర్చిపోయారా? {site}/forgot-password",
        "ask_name": "📝 మీ భక్తుల ఖాతాను సృష్టిద్దాం.\n\nమీ పూర్తి పేరు ఏమిటి?",
        "ask_email": "ఇమెయిల్ చిరునామా? (ఇది తప్పనిసరి - ధృవీకరణ లింక్ ఇక్కడికి పంపుతాము, సేవలు/వసతి బుక్ చేసుకోవడానికి కూడా ఇది అవసరం)",
        "invalid_email": "అది సరైన ఇమెయిల్ చిరునామాలా లేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.",
        "email_taken": "ఆ ఇమెయిల్ ఇప్పటికే మరొక ఖాతాకు నమోదు చేయబడింది. బదులుగా {site}/login లో సైన్ ఇన్ చేయండి, లేదా వేరే ఇమెయిల్ ఉపయోగించండి.",
        "ask_gotram": "గోత్రం? (ఐచ్ఛికం - ఖాళీగా ఉంచడానికి 'skip' అని పంపండి)",
        "ask_password": "పాస్‌వర్డ్ సెట్ చేయండి (కనీసం 4 అక్షరాలు) - వెబ్‌సైట్‌లో సైన్ ఇన్ చేయడానికి దీన్ని మీ మొబైల్ నంబర్‌తో పాటు ఉపయోగిస్తారు.\n\nఆపివేయడానికి ఎప్పుడైనా 'cancel' అని పంపండి.",
        "password_too_short": "పాస్‌వర్డ్ కనీసం 4 అక్షరాలు ఉండాలి. దయచేసి మళ్ళీ ప్రయత్నించండి.",
        "ask_confirm_password": "నిర్ధారించడానికి దయచేసి మీ పాస్‌వర్డ్‌ను మళ్ళీ టైప్ చేయండి.",
        "password_mismatch": "ఆ పాస్‌వర్డ్‌లు సరిపోలలేదు. మళ్ళీ ప్రయత్నిద్దాం - పాస్‌వర్డ్ సెట్ చేయండి (కనీసం 4 అక్షరాలు).",
        "ask_newsletter": "ఆలయ నవీకరణలు (పండుగ ప్రకటనలు, వార్తలు) ఇమెయిల్ ద్వారా పొందాలనుకుంటున్నారా? 'yes' లేదా 'no' అని పంపండి.",
        "invalid_yes_no": "దయచేసి 'yes' లేదా 'no' అని పంపండి.",
        "cancelled": "నమోదు రద్దు చేయబడింది. మళ్ళీ మొదలుపెట్టడానికి ఎప్పుడైనా 'register' అని పంపండి.",
        "done": "🎉 నమోదు పూర్తయింది!\n\nమీ ఇమెయిల్ ({email})కు ధృవీకరణ లింక్ పంపాము - సేవలు లేదా వసతి బుక్ చేసుకోవడానికి ముందు దాన్ని తెరిచి ధృవీకరించండి.\n\nమీ మొబైల్ నంబర్ ({mobile}) మరియు మీరు సెట్ చేసిన పాస్‌వర్డ్‌తో {site}/login లో ఎప్పుడైనా సైన్ ఇన్ చేయండి.",
    },
}


def _normalize_mobile(from_number: str) -> str:
    """WhatsApp reports the sender in E.164-ish form (e.g. "919390353848" -
    country code, no "+"), but the website's devotee records and login form
    both use a plain 10-digit Indian mobile number. Without this, a devotee
    registered here could never match by number when logging in on the site."""
    digits = "".join(c for c in from_number if c.isdigit())
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    return digits[-10:] if len(digits) > 10 else digits


def _hash_password(pw: str) -> str:
    # Deliberately duplicated from main.py's hash_password (also plain sha256
    # hexdigest) rather than imported - main.py imports this router at module
    # load time, so importing back from here would be circular. Only used to
    # compare the password/confirm-password pair here without persisting
    # either in plaintext in db.whatsapp_sessions between messages; the final
    # plaintext (once confirmed equal) is handed to main.py's _register_devotee,
    # which does the real, byte-for-byte-identical hash of the stored record.
    return hashlib.sha256(pw.encode()).hexdigest()


def _is_valid_email(value: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value))


async def _start_registration(to: str, language: str):
    mobile = _normalize_mobile(to)
    prompts = REG_PROMPTS[language]
    existing = await db.devotees.find_one({"mobile": mobile}, {"_id": 0})
    if existing:
        await _send_whatsapp_text(to, prompts["already_registered"].format(site=SITE))
        return
    await db.whatsapp_sessions.update_one(
        {"phone": to},
        {"$set": {"reg_state": "name", "reg_data": {}}},
    )
    await _send_whatsapp_text(to, prompts["ask_name"])


async def _handle_registration_reply(to: str, language: str, state: str, reg_data: dict, stripped: str):
    prompts = REG_PROMPTS[language]
    lowered = stripped.lower()

    if lowered in ("cancel", "రద్దు"):
        await db.whatsapp_sessions.update_one({"phone": to}, {"$unset": {"reg_state": "", "reg_data": ""}})
        await _send_whatsapp_text(to, prompts["cancelled"])
        return

    skip = lowered == "skip"

    if state == "name":
        if not stripped:
            await _send_whatsapp_text(to, prompts["ask_name"])
            return
        reg_data["name"] = stripped
        await db.whatsapp_sessions.update_one({"phone": to}, {"$set": {"reg_state": "email", "reg_data": reg_data}})
        await _send_whatsapp_text(to, prompts["ask_email"])

    elif state == "email":
        if not _is_valid_email(stripped):
            await _send_whatsapp_text(to, prompts["invalid_email"])
            return
        if await db.devotees.find_one({"email": stripped}, {"_id": 0}):
            await _send_whatsapp_text(to, prompts["email_taken"].format(site=SITE))
            return
        reg_data["email"] = stripped
        await db.whatsapp_sessions.update_one({"phone": to}, {"$set": {"reg_state": "gotram", "reg_data": reg_data}})
        await _send_whatsapp_text(to, prompts["ask_gotram"])

    elif state == "gotram":
        reg_data["gotram"] = "" if skip else stripped
        await db.whatsapp_sessions.update_one({"phone": to}, {"$set": {"reg_state": "password", "reg_data": reg_data}})
        await _send_whatsapp_text(to, prompts["ask_password"])

    elif state == "password":
        if len(stripped) < 4:
            await _send_whatsapp_text(to, prompts["password_too_short"])
            return
        # Stores only the hash of this first entry, never the plaintext, so
        # a devotee's password never sits at rest in db.whatsapp_sessions -
        # confirm_password below re-hashes its own input and compares hashes.
        reg_data["password_hash_pending"] = _hash_password(stripped)
        await db.whatsapp_sessions.update_one({"phone": to}, {"$set": {"reg_state": "confirm_password", "reg_data": reg_data}})
        await _send_whatsapp_text(to, prompts["ask_confirm_password"])

    elif state == "confirm_password":
        if _hash_password(stripped) != reg_data.get("password_hash_pending"):
            reg_data.pop("password_hash_pending", None)
            await db.whatsapp_sessions.update_one({"phone": to}, {"$set": {"reg_state": "password", "reg_data": reg_data}})
            await _send_whatsapp_text(to, prompts["password_mismatch"])
            return
        # The confirmed plaintext (not the hash) is what gets handed to
        # main.py's _register_devotee below, which does its own hashing.
        reg_data["password_plain"] = stripped
        await db.whatsapp_sessions.update_one({"phone": to}, {"$set": {"reg_state": "newsletter", "reg_data": reg_data}})
        await _send_whatsapp_text(to, prompts["ask_newsletter"])

    elif state == "newsletter":
        yes_words = ("yes", "y", "అవును")
        no_words = ("no", "n", "వద్దు", "కాదు")
        if lowered not in yes_words and lowered not in no_words:
            await _send_whatsapp_text(to, prompts["invalid_yes_no"])
            return
        subscribe = lowered in yes_words
        mobile = _normalize_mobile(to)

        # Lazy import - main.py imports this router at module load time, so
        # importing back from here at import time would be circular; safe
        # here since this only runs after main.py has fully loaded.
        from app.main import DevoteeRegister, _register_devotee

        try:
            devotee = await _register_devotee(DevoteeRegister(
                name=reg_data.get("name", ""), email=reg_data["email"], mobile=mobile,
                gotram=reg_data.get("gotram", ""), password=reg_data["password_plain"],
                subscribe_newsletter=subscribe,
            ))
        except ValueError:
            # Email got taken by someone else between the email step above and
            # now (rare race) - same message as the earlier, more common check.
            await db.whatsapp_sessions.update_one({"phone": to}, {"$unset": {"reg_state": "", "reg_data": ""}})
            await _send_whatsapp_text(to, prompts["email_taken"].format(site=SITE))
            return

        await db.whatsapp_sessions.update_one({"phone": to}, {"$unset": {"reg_state": "", "reg_data": ""}})
        await _send_whatsapp_text(to, prompts["done"].format(site=SITE, mobile=devotee["mobile"], email=devotee["email"]))


def _resolve_option(stripped: str) -> str | None:
    """Resolves a message to the menu option it matches (e.g. "11"), returning the key itself
    (e.g. "11") rather than its reply text - so the webhook handler can special-
    case option 11 (Devotee Registration) into the chat flow below instead of
    just sending back a link."""
    if stripped in REPLIES_EN:  # REPLIES_EN/REPLIES_TE share the same key set
        return stripped
    lowered = stripped.lower()
    if ("kaly" in lowered or "kalay" in lowered) and "katt" in lowered:
        return "kalyana_katta"
    for keyword, option in MENU_KEYWORDS.items():
        if keyword in lowered:
            return option
    return None


async def _handle_free_text(to: str, language: str, message: str):
    """A message that matched no menu number/keyword. intent_router decides
    whether it's trying to *do* something (book/pay/donate/cancel) or *ask*
    something. Transactional intent is sent back to the menu rather than
    handled here - chat_agent can only talk, it can never actually create a
    booking or take a payment, so keeping those on the deterministic flow is
    what makes it safe to let the conversational side use an LLM at all.
    """
    session = await db.whatsapp_sessions.find_one({"phone": to}, {"_id": 0, "chat_history": 1})
    history = (session or {}).get("chat_history") or []

    if await intent_router.classify(message, history) == "transact":
        await _send_menu(to, language)
        return

    reply = await chat_agent.ask(message, history)
    await _send_whatsapp_text(to, reply)

    updated_history = (history + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": reply},
    ])[-CHAT_HISTORY_TURNS:]
    await db.whatsapp_sessions.update_one(
        {"phone": to}, {"$set": {"chat_history": updated_history}}, upsert=True
    )


async def _send_whatsapp_payload(to: str, message_type: str, payload: dict):
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        logger.warning("Skipping WhatsApp reply to %s: WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID not configured", to)
        return
    # requests is a blocking call; run it off-thread so it doesn't freeze the
    # single async worker (and every other in-flight request) for the round
    # trip to Meta's API. See the fix for the same issue in chat_agent.py/
    # intent_router.py - this is the same problem, just via `requests`
    # instead of a sync SDK client.
    resp = await asyncio.to_thread(
        requests.post,
        f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages",
        headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}", "Content-Type": "application/json"},
        json={"messaging_product": "whatsapp", "to": to, "type": message_type, **payload},
        timeout=15,
    )
    if resp.status_code >= 300:
        logger.error("WhatsApp send to %s failed (%s): %s", to, resp.status_code, resp.text)


async def _send_whatsapp_text(to: str, body: str):
    await _send_whatsapp_payload(to, "text", {"text": {"body": body}})


async def _send_menu(to: str, language: str):
    """Sends the menu as native tap-to-select WhatsApp list messages (one
    message per list, since a single list message is capped at 10 rows)."""
    for menu_list in (MENU_LISTS_EN if language == "en" else MENU_LISTS_TE):
        await _send_whatsapp_payload(to, "interactive", {
            "interactive": {
                "type": "list",
                "header": {"type": "text", "text": menu_list["header"]},
                "body": {"text": menu_list["body"]},
                "footer": {"text": menu_list["footer"]},
                "action": {"button": "Select Option", "sections": [{"rows": menu_list["rows"]}]},
            }
        })


async def _send_language_prompt(to: str):
    """Sends the language choice as native quick-reply buttons instead of
    asking the devotee to type 1 or 2."""
    await _send_whatsapp_payload(to, "interactive", {
        "interactive": {
            "type": "button",
            "body": {"text": LANGUAGE_PROMPT},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": "lang_en", "title": "English"}},
                    {"type": "reply", "reply": {"id": "lang_te", "title": "తెలుగు"}},
                ]
            },
        }
    })


def _verify_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """Checks the X-Hub-Signature-256 header Meta signs each webhook delivery
    with, so forged requests can't make this endpoint send messages on the
    temple's behalf. Skipped (with a warning) if META_APP_SECRET isn't set."""
    if not META_APP_SECRET:
        return True
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(META_APP_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header.removeprefix("sha256="))


@router.get("/whatsapp/webhook")
async def verify_whatsapp_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    if not WHATSAPP_VERIFY_TOKEN:
        raise HTTPException(status_code=500, detail="WHATSAPP_VERIFY_TOKEN is not configured")
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp/webhook")
async def receive_whatsapp_webhook(request: Request):
    raw_body = await request.body()
    if not _verify_signature(raw_body, request.headers.get("x-hub-signature-256")):
        raise HTTPException(status_code=403, detail="Invalid signature")

    payload = await request.json()

    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                await _handle_inbound_message(message, value)

    # Meta only cares that this returns 200; delivery-status callbacks
    # ("sent"/"delivered"/"read") land in the same payload shape under
    # value.statuses and are intentionally ignored for now.
    return {"status": "ok"}


async def _handle_inbound_message(message: dict, value: dict):
    from_number = message.get("from")
    message_type = message.get("type")
    if message_type == "text":
        text_body = message.get("text", {}).get("body")
    elif message_type == "interactive":
        # Tapping a menu list row delivers its id ("1".."12") the same way a
        # typed number would; tapping a language button delivers "lang_en"/
        # "lang_te", normalized here to "english"/"telugu" so the rest of the
        # handler doesn't need to know buttons exist.
        interactive = message.get("interactive", {})
        if interactive.get("type") == "list_reply":
            text_body = interactive.get("list_reply", {}).get("id")
        elif interactive.get("type") == "button_reply":
            button_id = interactive.get("button_reply", {}).get("id")
            text_body = {"lang_en": "english", "lang_te": "telugu"}.get(button_id, button_id)
        else:
            text_body = None
    else:
        text_body = None

    contacts = value.get("contacts", [])
    profile_name = contacts[0]["profile"]["name"] if contacts else None

    await db.whatsapp_messages.insert_one({
        "id": str(uuid.uuid4()),
        "from": from_number,
        "profile_name": profile_name,
        "type": message_type,
        "text": text_body,
        "wa_message_id": message.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    if not from_number:
        return

    stripped = (text_body or "").strip()
    lowered = stripped.lower()

    session = await db.whatsapp_sessions.find_one({"phone": from_number}, {"_id": 0})
    language = session.get("language") if session else None
    reg_state = session.get("reg_state") if session else None

    # Mid-registration, every reply is an answer to the current question (name,
    # email, ...) rather than a command - so this is handled before the
    # language-switch shortcuts below, which would otherwise misfire on a
    # devotee whose actual name happens to be "English" or similar.
    if reg_state:
        await _handle_registration_reply(from_number, language or "en", reg_state, session.get("reg_data") or {}, stripped)
        return

    # Explicit language switch works at any time, regardless of prior state.
    if lowered == "english":
        await db.whatsapp_sessions.update_one({"phone": from_number}, {"$set": {"language": "en"}}, upsert=True)
        await _send_menu(from_number, "en")
        return
    if lowered == "telugu" or stripped == "తెలుగు":
        await db.whatsapp_sessions.update_one({"phone": from_number}, {"$set": {"language": "te"}}, upsert=True)
        await _send_menu(from_number, "te")
        return
    if lowered == "language" or stripped == "భాష":
        await _send_language_prompt(from_number)
        return

    if language is None:
        # First contact (or language never picked): "1"/"2" pick a language
        # here instead of meaning a menu item, since no language is set yet
        # (kept for devotees who type instead of tapping the button).
        if stripped == "1":
            await db.whatsapp_sessions.update_one({"phone": from_number}, {"$set": {"language": "en"}}, upsert=True)
            await _send_menu(from_number, "en")
        elif stripped == "2":
            await db.whatsapp_sessions.update_one({"phone": from_number}, {"$set": {"language": "te"}}, upsert=True)
            await _send_menu(from_number, "te")
        else:
            await _send_language_prompt(from_number)
        return

    # A devotee explicitly asking to see the menu again always gets it,
    # checked before intent_router/chat_agent even run. Without this, "menu"
    # or "help" would get intent-classified as CHAT and answered (or, with no
    # ANTHROPIC_API_KEY, met with a generic "please use the menu options"
    # reply that never actually shows the menu) - a dead end for anyone who
    # forgot it or just wants it back. This has to work with zero dependency
    # on the AI chat feature being configured at all.
    if lowered in MENU_REQUEST_WORDS:
        await _send_menu(from_number, language)
        return

    option = _resolve_option(stripped)
    if option == "11":
        await _start_registration(from_number, language)
        return

    replies = REPLIES_EN if language == "en" else REPLIES_TE
    reply = replies.get(option) if option else None
    if reply is None:
        # Didn't match a menu number or keyword - could still be a devotee
        # typing instead of tapping ("book abhishekam for sunday") or asking
        # a genuine question ("what does abhishekam cost"). _handle_free_text
        # decides which.
        await _handle_free_text(from_number, language, stripped)
        return
    parts = reply if isinstance(reply, list) else [reply]
    for part in parts:
        await _send_whatsapp_text(from_number, part)
