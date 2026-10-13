import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import TasksWidget from './TasksWidget';
import { ShieldCheck, LayoutDashboard, Flame as FlameIcon, Calendar, Clock, BookOpen, Users, LogOut, HandCoins, BedDouble, Newspaper, Camera, Sun, Radio, Mail, MessageSquare, Gift, ScrollText, Settings, Receipt, UserCog, KeyRound, PanelLeftClose, PanelLeftOpen, Store, BarChart3, Ban, ScanLine, Star, ChevronDown } from 'lucide-react';

// Remembered across page loads/navigations, not just component state - so
// the sidebar doesn't snap back open every time an admin clicks between
// screens after collapsing it once.
const COLLAPSE_KEY = 'admin-sidebar-collapsed';

// Settings > "Open sidebar on hover": the sidebar stays as icons and opens
// over the page while the mouse is on it. Per browser, like the collapse state.
const HOVER_MODE_KEY = 'admin-sidebar-hover-open';
const HOVER_MODE_EVENT = 'admin-sidebar-hover-open-changed';

export function getSidebarHoverMode() {
  try { return localStorage.getItem(HOVER_MODE_KEY) === 'true'; } catch { return false; }
}

export function setSidebarHoverMode(on) {
  try { localStorage.setItem(HOVER_MODE_KEY, String(on)); } catch { /* applies for this visit only */ }
  window.dispatchEvent(new CustomEvent(HOVER_MODE_EVENT, { detail: on }));
}

// `resource` matches the resource half of a "resource:action" permission
// (see docs/ROLES_AND_PERMISSIONS.md). No `resource` = always shown to any
// logged-in staff member (Dashboard, Settings - nothing role-specific there).
// Daily work, shown in the sidebar under folding group headings.
const navGroups = [
  { items: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  ] },
  { label: 'Bookings & Counter', items: [
    { path: '/admin/bookings', icon: BookOpen, label: 'Bookings', resource: 'bookings' },
    // The approval queue for cancellation requests a bookings:view-only
    // account raises from the Bookings screen (they can't cancel directly -
    // see request_booking_cancellation in the backend). Gated on
    // bookings:edit since that's the same permission that lets an account
    // cancel a booking outright.
    { path: '/admin/cancellation-requests', icon: Ban, label: 'Cancellation Requests', permission: 'bookings:edit' },
    // The seva-location and Prasadam Counter scanning station - same
    // permission as Complete/Confirm since scanning just drives the same
    // status transitions (plus prasadam redemption) via a barcode/QR scanner
    // instead of a button click. See scan_complete_booking/scan_redeem_prasadam.
    { path: '/admin/scan-ticket', icon: ScanLine, label: 'Scan Ticket', permission: 'bookings:edit' },
    // Counter Sale is a bookings:create workflow, not just a bookings viewer -
    // showing it to view-only roles (e.g. an Accountant with bookings:view)
    // would land them on a screen they can't actually use.
    { path: '/admin/counter-sale', icon: Receipt, label: 'Counter Sale', permission: 'bookings:create' },
    // Reconciliation, not sales - so gated on bookings:reconcile alone rather
    // than needing bookings:create too. An Accountant-style account (no
    // counter_id of its own) sees every counter here; a counter login sees
    // only its own - see /admin/counters/today-summary in the backend.
    { path: '/admin/counter-reports', icon: BarChart3, label: 'Counter Reports', permission: 'bookings:reconcile' },
  ] },
  { label: 'Content', items: [
    { path: '/admin/live-blog', icon: Radio, label: 'Live Blog', resource: 'live_blog' },
    { path: '/admin/news', icon: Newspaper, label: 'News', resource: 'news' },
    { path: '/admin/gallery', icon: Camera, label: 'Gallery', resource: 'gallery' },
    { path: '/admin/panchangam', icon: Sun, label: 'Panchangam', resource: 'panchangam' },
    { path: '/admin/stotrams', icon: ScrollText, label: 'Stotrams', resource: 'stotrams' },
    { path: '/admin/aashirvachanam', icon: Gift, label: 'Aashirvachanam', resource: 'aashirvachanam' },
  ] },
  { label: 'Devotees', items: [
    { path: '/admin/devotees', icon: Users, label: 'Devotees', resource: 'devotees' },
    { path: '/admin/donations', icon: HandCoins, label: 'Donations', resource: 'donations' },
    { path: '/admin/contact-messages', icon: MessageSquare, label: 'Contact Messages', resource: 'contact_messages' },
    { path: '/admin/newsletter', icon: Mail, label: 'Newsletter', resource: 'newsletter' },
    { path: '/admin/reviews', icon: Star, label: 'Google Reviews', resource: 'reviews' },
  ] },
];

// Set-up screens that rarely change. They live as cards on the Settings
// page instead of the sidebar; Settings stays highlighted while on them.
export const settingsSections = [
  { label: 'Temple setup', items: [
    { path: '/admin/sevas', icon: FlameIcon, label: 'Sevas', resource: 'sevas' },
    { path: '/admin/profiles', icon: Calendar, label: 'Day Profiles', resource: 'day_profiles' },
    { path: '/admin/slots', icon: Clock, label: 'Slots', resource: 'slots' },
    { path: '/admin/accommodations', icon: BedDouble, label: 'Accommodation', resource: 'accommodations' },
  ] },
  { label: 'Staff & access', items: [
    { path: '/admin/staff', icon: UserCog, label: 'User Accounts', resource: 'staff' },
    { path: '/admin/roles', icon: KeyRound, label: 'Roles', resource: 'roles' },
    { path: '/admin/counters', icon: Store, label: 'Counters', resource: 'counters' },
  ] },
];

const settingsItem = { path: '/admin/settings', icon: Settings, label: 'Settings' };
const settingsPaths = [settingsItem.path, ...settingsSections.flatMap(s => s.items.map(i => i.path))];
const GROUPS_CLOSED_KEY = 'admin-sidebar-closed-groups';

export function canSee(user, item) {
  if (item.permission) return hasPermission(user, item.permission);
  return !item.resource || hasAnyPermission(user, item.resource);
}

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsedPref, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');
  const [hoverMode, setHoverMode] = useState(getSidebarHoverMode);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const onChange = (e) => setHoverMode(e.detail);
    window.addEventListener(HOVER_MODE_EVENT, onChange);
    return () => window.removeEventListener(HOVER_MODE_EVENT, onChange);
  }, []);
  const collapsed = hoverMode ? !hovered : collapsedPref;
  const [closedGroups, setClosedGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem(GROUPS_CLOSED_KEY)) || []; } catch { return []; }
  });
  const groups = navGroups
    .map(g => ({ ...g, items: g.items.filter(item => canSee(user, item)) }))
    .filter(g => g.items.length > 0);
  const isActive = (item) => item === settingsItem
    ? settingsPaths.includes(location.pathname)
    : location.pathname === item.path;
  // The group holding the current page always shows, even if folded earlier.
  const isOpen = (g) => !g.label || !closedGroups.includes(g.label) || g.items.some(isActive);
  const toggleGroup = (label) => {
    setClosedGroups(prev => {
      const next = prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label];
      try { localStorage.setItem(GROUPS_CLOSED_KEY, JSON.stringify(next)); } catch { /* not remembered; fine */ }
      return next;
    });
  };
  const mobileItems = [...groups.flatMap(g => g.items), settingsItem];

  const navLink = (item) => (
    <Link key={item.path} to={item.path} title={collapsed ? item.label : undefined} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${collapsed ? 'justify-center px-2' : ''} ${
      isActive(item) ? 'bg-[#C43E00] text-white' : 'hover:bg-white/5 text-[#FFE0B2]/80'
    }`} data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}>
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && item.label}
    </Link>
  );

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex">
      {/* Sidebar - collapsible on desktop only; the mobile header below has
          its own always-compact, icon-only layout so it isn't affected. */}
      {/* In hover mode the aside keeps its icon width in the layout and the
          panel inside opens over the page, so the content doesn't jump. */}
      <aside className={`${hoverMode || collapsed ? 'w-20' : 'w-64'} hidden md:block shrink-0 transition-all duration-200 md:sticky md:top-0 md:h-screen z-40`}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} data-testid="admin-sidebar">
       <div className={`${collapsed ? 'w-20' : 'w-64'} h-full bg-[#2D1B0E] text-[#FFE0B2] flex flex-col transition-all duration-200 ${hoverMode ? 'absolute inset-y-0 left-0' : ''} ${hoverMode && !collapsed ? 'shadow-2xl' : ''}`}>
        <div className="p-5 border-b border-[#5D4037]/30 flex items-start justify-between gap-2">
          <div className={collapsed ? 'sr-only' : ''}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-[#D4AF37] shrink-0" />
              <span className="font-english-heading text-xs tracking-wide">ADMIN PORTAL</span>
            </div>
            <p className="text-xs text-[#8D6E63]">{user?.name} ({user?.role})</p>
          </div>
          {collapsed && <ShieldCheck className="h-5 w-5 text-[#D4AF37] mx-auto" />}
          {!hoverMode && <button
            onClick={toggleCollapsed}
            className="text-[#FFE0B2]/60 hover:text-white transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-testid="admin-sidebar-toggle"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>}
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {groups.map((g, i) => (
            <div key={g.label || i} className={g.label ? (collapsed ? 'pt-2 mt-2 border-t border-[#5D4037]/40 space-y-1' : 'pt-3 space-y-1') : 'space-y-1'}>
              {g.label && !collapsed && (
                <button onClick={() => toggleGroup(g.label)} className="w-full flex items-center justify-between px-4 pb-1 text-[11px] uppercase tracking-wider text-[#D4AF37]/70 hover:text-[#D4AF37]" aria-expanded={isOpen(g)} data-testid={`admin-nav-group-${g.label.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
                  {g.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen(g) ? '' : '-rotate-90'}`} />
                </button>
              )}
              {(collapsed || isOpen(g)) && g.items.map(navLink)}
            </div>
          ))}
        </nav>
        {/* Pinned below the scrolling list so Settings and Logout are always in view. */}
        <div className="p-3 border-t border-[#5D4037]/30 space-y-1">
          {navLink(settingsItem)}
          <button onClick={logout} title={collapsed ? 'Logout' : undefined} className={`flex items-center gap-3 px-4 py-2.5 text-sm text-[#FFE0B2]/60 hover:text-white transition-colors w-full ${collapsed ? 'justify-center px-2' : ''}`} data-testid="admin-logout">
            <LogOut className="h-4 w-4 shrink-0" /> {!collapsed && 'Logout'}
          </button>
        </div>
       </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden bg-[#2D1B0E] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
            <span className="text-sm font-english-heading">Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {mobileItems.map(item => (
              <Link key={item.path} to={item.path} className={`p-2 rounded ${isActive(item) ? 'bg-[#C43E00]' : ''}`}>
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
        <TasksWidget />
      </div>
    </div>
  );
}
