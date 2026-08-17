import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, ChevronDown, Home } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function LangToggle({ className = '' }) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      role="group"
      aria-label="Site language"
      className={`flex items-center rounded-full bg-black/25 p-0.5 ${className}`}
      data-testid="nav-language-selector"
    >
      {[
        { code: 'en', label: 'En', full: 'English' },
        { code: 'te', label: 'తె', full: 'తెలుగు' },
      ].map(({ code, label, full }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          aria-label={full}
          title={full}
          className={`px-2 py-1 rounded-full text-xs leading-5 transition-colors ${
            lang === code ? 'bg-[#D4AF37] text-[#2A1800] font-medium' : 'text-white/80 hover:text-white'
          }`}
          data-testid={`nav-lang-${code}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const navGroups = [
  { label: 'About', to: '/about' },
  { label: 'Temples', to: '/temples' },
  { label: 'Panchangam', to: '/panchangam' },
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
    { to: '/live-blog', label: 'Live Blog' },
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

export default function Navbar() {
  const { user, userType, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // A Fragment, not a wrapping <nav>: position:sticky is constrained to
    // stay within its own DOM parent's box. A <nav> wrapping both the banner
    // and the sticky bar would only ever be as tall as the two of them
    // combined (~200px) - the sticky bar would run out of room to stick in
    // and scroll away the moment the page scrolls past that point. As a
    // Fragment, the banner and the (now itself a <nav>) sticky bar become
    // direct children of the page's own top-level wrapper, which spans the
    // full page height, so the bar can stay pinned for the whole scroll.
    <>
      {/* Title banner - the Swamy and Ammavaru flanking the name, in matching
          gold medallions. Photographs sit on a plain maroon ground rather than
          an illustrated one, so the two do not fight each other. */}
      <div className="temple-header-banner text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-4">
          {/* One link wraps the whole lockup, so assistive tech announces a
              single "home" destination rather than three in a row. */}
          <Link
            to="/"
            className="grid grid-cols-1 md:grid-cols-[minmax(6rem,8rem)_1fr_minmax(6rem,8rem)] items-center gap-3 md:gap-5 lg:gap-8"
          >
            {/* Transparent-background logo, so the maroon banner shows through
                instead of a white box. No medallion ring - the logo carries
                its own gold detailing already. */}
            <span className="hidden md:flex justify-center">
              <img
                src="/Assets/Temple_Logo_Transparent.webp"
                alt="Sri Jadala Ramalingeshwara Swamy"
                width="600"
                height="496"
                className="h-24 w-24 lg:h-28 lg:w-28 object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.55)]"
              />
            </span>

            {/* Centre: name stack, Telugu leading as it does on the temple's own
                signage, then English, then the district line. */}
            <span className="block text-center leading-tight px-1 min-w-0">
              <span className="block font-telugu-heading temple-header-te text-lg sm:text-2xl md:text-[1.7rem] lg:text-[2rem] leading-snug">
                శ్రీ పార్వతీ జడల రామలింగేశ్వర స్వామి దేవస్థానం
              </span>
              <span className="temple-header-divider" aria-hidden="true">
                <span className="temple-header-divider-dot" />
              </span>
              <span className="block font-english-heading temple-header-en text-[11px] sm:text-sm md:text-base lg:text-lg tracking-[0.06em] uppercase mt-1 md:mt-1.5">
                Sri Parvathi Jadala Ramalingeshwara Swamy Devasthanam
              </span>
              <span className="block font-telugu-body temple-header-loc text-sm sm:text-base md:text-lg mt-1">
                చెరువుగట్టు, నల్లగొండ జిల్లా
              </span>
              {/* Stands in for the side medallions once they drop away */}
              <img
                src="/Assets/Temple_Logo_Transparent.webp"
                alt=""
                aria-hidden="true"
                width="600"
                height="496"
                className="md:hidden mx-auto mt-2 h-14 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
              />
            </span>

            <span className="hidden md:flex justify-center">
              <span className="temple-header-medallion h-24 w-24 lg:h-28 lg:w-28">
                <img
                  src="/Assets/Parvati_Devi_1.webp"
                  alt="Sri Bhramarambha Devi (Sri Parvathi Devi)"
                  width="1500"
                  height="2000"
                  className="h-full w-full object-cover object-top"
                />
              </span>
            </span>
          </Link>
        </div>
      </div>

      {/* Menu bar - sticks to the top once the title scrolls past. Its own
          tag, not a wrapper's - see the Fragment comment above. */}
      <nav data-testid="navbar" className="bg-gradient-to-b from-[#B22F30] to-[#7B0406] text-white sticky top-0 z-50 shadow-lg border-y border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between lg:justify-center min-h-[2.75rem]">
            {/* Mobile-only Home shortcut - previously only reachable by opening
                the hamburger menu. Hidden at lg+ since the full desktop row
                below already has its own Home link. */}
            <Link to="/" className="lg:hidden flex items-center gap-1.5 py-2.5 pr-2 text-xs hover:text-[#FFE0B2] transition-colors" data-testid="nav-home-mobile">
              <Home className="h-4 w-4" /> Home
            </Link>
            {/* Desktop */}
            <div className="hidden lg:flex items-center text-xs divide-x divide-white/15">
              <Link to="/" className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-white/10 transition-colors whitespace-nowrap" data-testid="nav-home">
                <Home className="h-3.5 w-3.5" /> Home
              </Link>
              {navGroups.map((g, i) => (
                g.children ? <Dropdown key={i} label={g.label} children={g.children} /> : <Link key={i} to={g.to} className="px-3 py-2.5 hover:bg-white/10 transition-colors whitespace-nowrap">{g.label}</Link>
              ))}
              <span className="pl-3 pr-1">
                <LangToggle />
              </span>
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
            <div className="lg:hidden flex items-center gap-2">
              <LangToggle />
              <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-btn">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      {mobileOpen && (
        <div className="lg:hidden bg-[#3D1F0A] border-t border-[#5D4037]/30 px-4 py-3 space-y-1 text-sm max-h-[70vh] overflow-y-auto">
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
          {user && userType === 'devotee' && (
            <>
              <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="block px-3 py-2">My Bookings</Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="block px-3 py-2 text-[#FFE0B2] w-full text-left">Logout</button>
            </>
          )}
          {user && userType === 'admin' && (
            <>
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 bg-[#D4AF37]/20 rounded">Dashboard</Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="block px-3 py-2 text-[#FFE0B2] w-full text-left">Logout</button>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 bg-[#D4AF37] text-[#2A1800] rounded text-center font-medium" data-testid="nav-login-mobile">Sign In</Link>
              <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-[#FFE0B2]/60 text-xs text-center" data-testid="nav-staff-mobile">Staff</Link>
            </>
          )}
        </div>
      )}
      </nav>
    </>
  );
}
