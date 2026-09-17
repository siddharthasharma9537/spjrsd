import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { ShieldCheck, LayoutDashboard, Flame as FlameIcon, Calendar, Clock, BookOpen, Users, LogOut, HandCoins, BedDouble, Newspaper, Camera, Sun, Radio, Mail, MessageSquare, Gift, ScrollText, Settings, Receipt, UserCog, KeyRound } from 'lucide-react';

// `resource` matches the resource half of a "resource:action" permission
// (see docs/ROLES_AND_PERMISSIONS.md). No `resource` = always shown to any
// logged-in staff member (Dashboard, Settings - nothing role-specific there).
const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/sevas', icon: FlameIcon, label: 'Sevas', resource: 'sevas' },
  { path: '/admin/profiles', icon: Calendar, label: 'Day Profiles', resource: 'day_profiles' },
  { path: '/admin/slots', icon: Clock, label: 'Slots', resource: 'slots' },
  { path: '/admin/bookings', icon: BookOpen, label: 'Bookings', resource: 'bookings' },
  // Counter Sale is a bookings:create workflow, not just a bookings viewer -
  // showing it to view-only roles (e.g. an Accountant with bookings:view)
  // would land them on a screen they can't actually use.
  { path: '/admin/counter-sale', icon: Receipt, label: 'Counter Sale', permission: 'bookings:create' },
  { path: '/admin/staff', icon: UserCog, label: 'Staff', resource: 'staff' },
  { path: '/admin/roles', icon: KeyRound, label: 'Roles', resource: 'roles' },
  { path: '/admin/donations', icon: HandCoins, label: 'Donations', resource: 'donations' },
  { path: '/admin/accommodations', icon: BedDouble, label: 'Accommodation', resource: 'accommodations' },
  { path: '/admin/news', icon: Newspaper, label: 'News', resource: 'news' },
  { path: '/admin/panchangam', icon: Sun, label: 'Panchangam', resource: 'panchangam' },
  { path: '/admin/live-blog', icon: Radio, label: 'Live Blog', resource: 'live_blog' },
  { path: '/admin/gallery', icon: Camera, label: 'Gallery', resource: 'gallery' },
  { path: '/admin/stotrams', icon: ScrollText, label: 'Stotrams', resource: 'stotrams' },
  { path: '/admin/devotees', icon: Users, label: 'Devotees', resource: 'devotees' },
  { path: '/admin/newsletter', icon: Mail, label: 'Newsletter', resource: 'newsletter' },
  { path: '/admin/contact-messages', icon: MessageSquare, label: 'Contact Messages', resource: 'contact_messages' },
  { path: '/admin/aashirvachanam', icon: Gift, label: 'Aashirvachanam', resource: 'aashirvachanam' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const visibleItems = navItems.filter(item => {
    if (item.permission) return hasPermission(user, item.permission);
    return !item.resource || hasAnyPermission(user, item.resource);
  });

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2D1B0E] text-[#FFE0B2] hidden md:flex flex-col shrink-0">
        <div className="p-5 border-b border-[#5D4037]/30">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            <span className="font-english-heading text-xs tracking-wide">ADMIN PORTAL</span>
          </div>
          <p className="text-xs text-[#8D6E63]">{user?.name} ({user?.role})</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
              location.pathname === item.path ? 'bg-[#C43E00] text-white' : 'hover:bg-white/5 text-[#FFE0B2]/80'
            }`} data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#5D4037]/30">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#FFE0B2]/60 hover:text-white transition-colors w-full" data-testid="admin-logout">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-[#2D1B0E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            <span className="text-sm font-english-heading">Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {visibleItems.map(item => (
              <Link key={item.path} to={item.path} className={`p-2 rounded ${location.pathname === item.path ? 'bg-[#C43E00]' : ''}`}>
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
            <button onClick={logout} className="p-2"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">
          {title && <h1 className="font-english-heading text-2xl text-[#621B00] mb-6" data-testid="admin-page-title">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
