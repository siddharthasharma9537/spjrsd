import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, ChevronDown, Home } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const navGroups = [
  { label: 'About', to: '/about' },
  { label: 'Temples', to: '/temples' },
  { label: 'Sevas & Darshanam', children: [
    { to: '/sevas', label: 'Pratyaksha Seva' },
    { to: '/paroksha-seva', label: 'Paroksha Seva' },
  ]},
  { label: 'Donations', children: [
    { to: '/donations', label: 'e-Hundi' },
    { to: '/donations/annaprasadam', label: 'AnnaPrasadam' },
  ]},
  { label: 'Booking', children: [
    { to: '/booking/quick', label: 'Quick Booking' },
    { to: '/sevas', label: 'Seva Booking' },
    { to: '/accommodation', label: 'Accommodation' },
  ]},
  { label: 'Media', children: [
    { to: '/news', label: 'News & Events' },
    { to: '/gallery', label: 'Photo Gallery' },
    { to: '/media/gallery/videos', label: 'Video Gallery' },
    { to: '/media/live-tv', label: 'Live TV' },
  ]},
  { label: 'Support', children: [
    { to: '/support/contact', label: 'Contact Us' },
    { to: '/support/faq', label: 'FAQ' },
    { to: '/volunteer', label: 'Volunteer' },
  ]},
];

/* Opens on hover (with a short close delay so the cursor can travel from the
   trigger into the panel), and still opens on click/keyboard focus for touch
   and accessibility. */
function Dropdown({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const closeTimer = useRef();

  const openNow = () => { clearTimeout(closeTimer.current); setOpen(true); };
  const closeSoon = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setOpen(false), 180); };

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => { document.removeEventListener('mousedown', handler); clearTimeout(closeTimer.current); };
  }, []);

  return (
    <div className="relative" ref={ref} onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        onClick={() => setOpen(o => !o)}
        onFocus={openNow}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 px-3 py-2.5 transition-colors text-xs whitespace-nowrap ${open ? 'bg-white/10' : 'hover:bg-white/10'}`}
      >
        {label} <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* Kept mounted so the panel can ease in and out rather than snapping. */}
      <div
        className={`absolute top-full left-0 bg-white border border-[#E6DCCA] rounded-b-lg shadow-xl py-1 min-w-[190px] z-50 origin-top transition-all duration-300 ease-out ${
          open ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-1.5 invisible'
        }`}
      >
        {children.map((c, i) => (
          <Link key={i} to={c.to} onClick={() => setOpen(false)} className="block px-4 py-2 text-xs text-[#5D4037] hover:bg-[#C43E00]/5 hover:text-[#C43E00] transition-colors">{c.label}</Link>
        ))}
      </div>
    </div>
  );
}

/* Radiating gold rays behind the banner images. Drawn in CSS rather than as an
   image so it scales cleanly; the mask fades the rays out before they reach the
   edge so they read as a glow rather than a hard-edged disc. */
function SunRays({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
      style={{
        backgroundImage:
          'repeating-conic-gradient(from 0deg, rgba(245,208,97,0.55) 0deg 3deg, rgba(245,208,97,0) 3deg 9deg)',
        WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 28%, rgba(0,0,0,0.9) 45%, transparent 72%)',
        maskImage: 'radial-gradient(circle, rgba(0,0,0,0.25) 28%, rgba(0,0,0,0.9) 45%, transparent 72%)',
      }}
    />
  );
}

export default function Navbar() {
  const { user, userType, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav data-testid="navbar">
      {/* Title banner - centred, scrolls away with the page. overflow-hidden keeps
          the sun rays from spilling into the strip above and the menu below. */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#7A2400] via-[#621B00] to-[#4A1400] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
            {/* Transparent-background logo, so the maroon banner shows through */}
            <span className="relative flex h-14 w-14 md:h-24 md:w-24 shrink-0 items-center justify-center">
              <SunRays className="h-[190%] w-[190%]" />
              <img
                src="/Assets/Temple_Logo_Transparent.webp"
                alt="Sri Jadala Ramalingeshwara Swamy"
                className="relative h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              />
            </span>
            {/* A soft, edgeless haze of light behind the wordmark - not a panel.
                It simply lifts the background so the lettering reads clearly. */}
            {/* A fine white outline traced around each letter, the way the TTD
                wordmark is drawn - it lifts the lettering off the banner
                without putting a panel or a box behind it. */}
            <Link to="/" className="relative text-center leading-tight">
              <span
                className="block font-telugu-heading text-base md:text-3xl text-[#F5D061]"
                style={{ paintOrder: 'stroke fill', WebkitTextStroke: '1px #FFFFFF' }}
              >
                శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం
              </span>
              <span
                className="block font-english-heading text-[11px] sm:text-sm md:text-xl tracking-[0.12em] uppercase text-[#C4381B] mt-1 md:mt-1.5"
                style={{ paintOrder: 'stroke fill', WebkitTextStroke: '0.6px #FFFFFF' }}
              >
                Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam
              </span>
              <span
                className="block font-telugu-body text-[10px] md:text-sm text-[#FFE0B2] mt-1"
                style={{ paintOrder: 'stroke fill', WebkitTextStroke: '1px rgba(255,255,255,0.55)' }}
              >
                చెరువుగట్టు, నల్లగొండ జిల్లా
              </span>
            </Link>
            <span className="relative hidden md:flex h-20 w-20 shrink-0 items-center justify-center">
              <SunRays className="h-[210%] w-[210%]" />
              <span className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-[#D4AF37] bg-gradient-to-b from-[#7A2400] to-[#3D1000] shadow-lg overflow-hidden">
                <img src="/Assets/Parvati_Devi_1.webp" alt="Sri Bhramarambha Devi (Sri Parvathi Devi)" className="h-full w-full object-cover object-top" />
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Menu bar - sticks to the top once the title scrolls past */}
      <div className="bg-gradient-to-b from-[#B22F30] to-[#7B0406] text-white sticky top-0 z-50 shadow-lg border-y border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end lg:justify-center min-h-[2.75rem]">
            {/* Desktop */}
            <div className="hidden lg:flex items-center text-xs divide-x divide-white/15">
              <Link to="/" className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-white/10 transition-colors whitespace-nowrap" data-testid="nav-home">
                <Home className="h-3.5 w-3.5" /> Home
              </Link>
              {navGroups.map((g, i) => (
                g.children ? <Dropdown key={i} label={g.label} children={g.children} /> : <Link key={i} to={g.to} className="px-3 py-2.5 hover:bg-white/10 transition-colors whitespace-nowrap">{g.label}</Link>
              ))}
              <Link to="/print-ticket" className="px-3 py-2.5 hover:bg-white/10 text-[#F5D061] transition-colors">Print Ticket</Link>
              {user && userType === 'devotee' && (
                <>
                  <Link to="/my-bookings" className="px-3 py-2.5 hover:bg-white/10 transition-colors">My Bookings</Link>
                  <button onClick={logout} className="px-3 py-2.5 text-[#FFE0B2] hover:text-white">Logout</button>
                </>
              )}
              {user && userType === 'admin' && (
                <>
                  <Link to="/admin" className="px-3 py-2.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30">Dashboard</Link>
                  <button onClick={logout} className="px-3 py-2.5 text-[#FFE0B2]">Logout</button>
                </>
              )}
              {!user && (
                <>
                  <Link to="/login" className="px-3 py-2.5 bg-[#D4AF37] text-[#2A1800] font-medium hover:bg-[#e6c44a] transition-colors" data-testid="nav-login">Sign In</Link>
                  <Link to="/admin/login" className="px-3 py-2.5 text-[#FFE0B2]/60 hover:text-white text-xs" data-testid="nav-staff">Staff</Link>
                </>
              )}
            </div>
            <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-btn">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      {mobileOpen && (
        <div className="lg:hidden bg-[#3D1F0A] border-t border-[#5D4037]/30 px-4 py-3 space-y-1 text-sm max-h-[70vh] overflow-y-auto">
          <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded">
            <Home className="h-4 w-4" /> Home
          </Link>
          {navGroups.map((g, i) => (
            g.children ? (
              <div key={i}>
                <p className="px-3 py-1 text-[#D4AF37] text-xs font-english-heading uppercase tracking-wide">{g.label}</p>
                {g.children.map((c, j) => (
                  <Link key={j} to={c.to} onClick={() => setMobileOpen(false)} className="block px-6 py-2 hover:bg-white/10 rounded">{c.label}</Link>
                ))}
              </div>
            ) : <Link key={i} to={g.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2 hover:bg-white/10 rounded">{g.label}</Link>
          ))}
          <Link to="/print-ticket" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-[#D4AF37]">Print Ticket</Link>
          {user && userType === 'devotee' && (
            <>
              <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="block px-3 py-2">My Bookings</Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="block px-3 py-2 text-[#FFE0B2] w-full text-left">Logout</button>
            </>
          )}
          {!user && <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 bg-[#D4AF37] text-[#2A1800] rounded text-center font-medium">Sign In</Link>}
        </div>
      )}
      </div>
    </nav>
  );
}
