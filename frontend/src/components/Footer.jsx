import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Newsletter from '@/components/Newsletter';
import { MapPin, Phone, Mail, ExternalLink, Users, Eye } from 'lucide-react';

export default function Footer() {
  const [stats, setStats] = useState({ total_visitors: 0, todays_visitors: 0 });

  useEffect(() => {
    api.post('/visitor-stats/track').catch(() => {});
    api.get('/visitor-stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  /* Every link below must lead somewhere that actually shows what the label
     promises. Labels that pointed at an identical page ("Special Sevas",
     "Festive Sevas", "General Donation", duplicate "Seva Booking") were removed
     rather than left implying content that does not exist yet. */
  const footerLinks = {
    'About': [
      { to: '/about#history', label: 'History' },
      { to: '/about#administration', label: 'Temple Management' },
      { to: '/about#festivals', label: 'Festivals' },
      { to: '/about#timings', label: 'Timings' },
    ],
    'Sevas': [
      { to: '/sevas', label: 'Pratyaksha Seva' },
      { to: '/paroksha-seva', label: 'Paroksha Seva' },
      { to: '/print-ticket', label: 'Print a Ticket' },
    ],
    'Donations': [
      { to: '/donations', label: 'e-Hundi' },
      { to: '/donations/annaprasadam', label: 'Annadanam' },
    ],
    'Online Booking': [
      { to: '/booking/quick', label: 'Quick Booking' },
      { to: '/sevas', label: 'Seva Booking' },
      { to: '/accommodation', label: 'Accommodation' },
    ],
    'Media Room': [
      { to: '/news', label: 'News & Events' },
      { to: '/gallery', label: 'Photo Gallery' },
      { to: '/media/gallery/videos', label: 'Video Gallery' },
      { to: '/media/live-tv', label: 'Live TV' },
    ],
    'Support': [
      { to: '/support/contact', label: 'Contact Us' },
      { to: '/support/faq', label: 'FAQ' },
      { to: '/volunteer', label: 'Volunteer' },
    ],
  };

  return (
    <footer className="bg-[#2D1B0E] text-[#FFE0B2]">
      {/* Pre-footer: Newsletter */}
      <div className="border-b border-[#5D4037]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Newsletter />
        </div>
      </div>

      {/* Main footer links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-english-heading text-xs tracking-widest text-[#D4AF37] mb-3 uppercase">{category}</h4>
              <div className="space-y-1.5">
                {links.map((l, i) => (
                  <Link key={i} to={l.to} className="block text-xs text-[#FFE0B2]/50 hover:text-[#D4AF37] transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact + Visitor Stats */}
        <div className="border-t border-[#5D4037]/30 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-english-heading text-xs tracking-widest text-[#D4AF37] mb-2">TEMPLE ADDRESS</h4>
            <div className="text-xs text-[#FFE0B2]/50 space-y-1">
              <p className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams, Cheruvugattu, Narketpally Mandal, Nalgonda District, Telangana - 508254, India</p>
              <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> +91 94910 00701 (EO)</p>
              <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> info@spjrdevasthanams.org</p>
            </div>
          </div>
          <div>
            <h4 className="font-english-heading text-xs tracking-widest text-[#D4AF37] mb-2">VISITOR STATS</h4>
            <div className="flex gap-4" data-testid="visitor-stats">
              <div className="bg-[#3D1F0A] rounded-lg px-4 py-3 text-center">
                <Users className="h-4 w-4 text-[#D4AF37] mx-auto mb-1" />
                <p className="text-lg font-bold">{stats.total_visitors?.toLocaleString()}</p>
                <p className="text-xs text-[#FFE0B2]/40">Total Visitors</p>
              </div>
              <div className="bg-[#3D1F0A] rounded-lg px-4 py-3 text-center">
                <Eye className="h-4 w-4 text-[#D4AF37] mx-auto mb-1" />
                <p className="text-lg font-bold">{stats.todays_visitors?.toLocaleString()}</p>
                <p className="text-xs text-[#FFE0B2]/40">Today</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-english-heading text-xs tracking-widest text-[#D4AF37] mb-2">TEMPLE OFFICE</h4>
            <div className="text-xs text-[#FFE0B2]/50 space-y-1">
              <p>Sri S. Mohan Babu</p>
              <p>Executive Officer</p>
              <p>Telangana Endowments Department</p>
            </div>
            <div className="text-xs text-[#FFE0B2]/50 space-y-1 mt-3 pt-3 border-t border-[#5D4037]/30">
              <p>Sri Varala Ramesh</p>
              <p>Chairman, Dharmakartha Mandali</p>
            </div>
          </div>
        </div>

        {/* Not an official Devasthanam property - this must stay visible until
            the temple authority formally adopts the site. */}
        <div className="border-t border-[#5D4037]/30 pt-5 mt-6" data-testid="unofficial-notice">
          <p className="text-xs text-[#FFE0B2]/45 leading-relaxed max-w-4xl">
            <span className="text-[#D4AF37]/70 font-medium">A note to devotees:</span>{' '}
            this site is run independently by volunteers, purely to help pilgrims plan their
            visit — it is <strong className="font-medium">not an official channel</strong> of the
            temple or the Telangana Endowments Department. We&apos;ve done our best to keep seva
            timings, rates and festival dates accurate from the Devasthanam&apos;s own material,
            but please treat this as a guide, not the final word. For bookings, donations, or
            anything that needs to be official, the temple office is always the right place to
            call:{' '}
            <a href="tel:+919491000701" className="text-[#D4AF37]/80 hover:text-[#D4AF37] underline">
              +91 94910 00701
            </a>.
          </p>
          <p className="font-telugu-body text-xs text-[#FFE0B2]/45 leading-relaxed max-w-4xl mt-2">
            భక్తులకు మనవి: ఈ వెబ్‌సైట్‌ను భక్తులు యాత్రను ప్రణాళిక చేసుకోవడంలో సహాయపడేందుకు స్వచ్ఛందంగా
            నిర్వహిస్తున్నాము — ఇది దేవస్థానం లేదా దేవాదాయ శాఖ యొక్క అధికారిక మాధ్యమం కాదు. సేవా సమయాలు,
            రేట్లు, పండుగ తేదీలను దేవస్థానం ప్రచురించిన సమాచారం నుండి వీలైనంత కచ్చితంగా అందించే ప్రయత్నం
            చేశాము, అయినప్పటికీ దీనిని తుది సమాచారంగా కాక మార్గదర్శిగా భావించగలరు. బుకింగ్‌లు, విరాళాలు
            లేదా అధికారిక అవసరాల కొరకు దయచేసి దేవస్థాన కార్యాలయం +91 94910 00701 నందు సంప్రదించండి.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#5D4037]/30 pt-4 mt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8D6E63]">
          <p>&copy; {new Date().getFullYear()} Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanams. All rights reserved.</p>
          <div className="flex gap-3 mt-2 sm:mt-0">
            <Link to="/support/contact" className="hover:text-[#D4AF37]">Contact</Link>
            <Link to="/support/faq" className="hover:text-[#D4AF37]">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
