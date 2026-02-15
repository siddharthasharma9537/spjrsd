import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const navGroups = [
  { label: 'About', to: '/about' },
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

function Dropdown({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-white/10 transition-colors text-xs whitespace-nowrap">
        {label} <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#E6DCCA] rounded-lg shadow-xl py-1 min-w-[180px] z-50">
          {children.map((c, i) => (
            <Link key={i} to={c.to} onClick={() => setOpen(false)} className="block px-4 py-2 text-xs text-[#5D4037] hover:bg-[#E65100]/5 hover:text-[#E65100] transition-colors">{c.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, userType, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-[#621B00] text-white sticky top-0 z-50 shadow-lg" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Flame className="h-5 w-5 text-[#D4AF37]" />
            <span className="font-english-heading text-xs tracking-wide">SPJRS Devasthanams</span>
          </Link>
          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-0.5 text-xs">
            {navGroups.map((g, i) => (
              g.children ? <Dropdown key={i} label={g.label} children={g.children} /> : <Link key={i} to={g.to} className="px-2 py-1.5 rounded hover:bg-white/10 transition-colors whitespace-nowrap">{g.label}</Link>
            ))}
            <Link to="/print-ticket" className="px-2 py-1.5 rounded hover:bg-white/10 text-[#D4AF37] transition-colors">Print Ticket</Link>
            {user && userType === 'devotee' && (
              <>
                <Link to="/my-bookings" className="px-2 py-1.5 rounded hover:bg-white/10 transition-colors">My Bookings</Link>
                <button onClick={logout} className="px-2 py-1.5 text-[#FFE0B2] hover:text-white">Logout</button>
              </>
            )}
            {user && userType === 'admin' && (
              <>
                <Link to="/admin" className="px-2 py-1.5 rounded bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30">Dashboard</Link>
                <button onClick={logout} className="px-2 py-1.5 text-[#FFE0B2]">Logout</button>
              </>
            )}
            {!user && (
              <>
                <Link to="/login" className="px-3 py-1.5 rounded bg-[#D4AF37] text-[#2A1800] font-medium hover:bg-[#e6c44a] transition-colors" data-testid="nav-login">Sign In</Link>
                <Link to="/admin/login" className="px-2 py-1.5 text-[#FFE0B2]/50 hover:text-white text-xs" data-testid="nav-staff">Staff</Link>
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
    </nav>
  );
}
