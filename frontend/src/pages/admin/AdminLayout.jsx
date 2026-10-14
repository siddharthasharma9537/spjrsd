import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { prefetchCached } from '@/lib/cachedGet';
import TasksWidget from './TasksWidget';
import { ShieldCheck, LayoutDashboard, Flame as FlameIcon, Calendar, Clock, BookOpen, Users, LogOut, HandCoins, BedDouble, Newspaper, Camera, Sun, Radio, Mail, MessageSquare, Gift, ScrollText, Settings, Receipt, UserCog, KeyRound, PanelLeftClose, PanelLeftOpen, Store, BarChart3, Ban, ScanLine, Star, ChevronDown, Globe, ExternalLink, Ticket, FileText, HeartHandshake, Menu, X } from 'lucide-react';

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
// Daily work, shown in the sidebar under folding group headings. Collapsed,
// each labelled group becomes one rail icon (`icon`) that opens a menu of its
// screens, so the rail stays a handful of icons however many screens exist.
// `prefetch` lists the GETs (url, params) the screen opens with - the same
// ones it passes to useCachedGet - so resting the pointer on the link warms
// the cache and the screen usually opens with its data already there.
const navGroups = [
  { items: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', prefetch: [['/admin/stats']] },
  ] },
  { label: 'Bookings & Counter', icon: Ticket, items: [
    { path: '/admin/bookings', icon: BookOpen, label: 'Bookings', resource: 'bookings', prefetch: [['/admin/bookings'], ['/sevas', { active_only: 'false' }]] },
    // The approval queue for cancellation requests a bookings:view-only
    // account raises from the Bookings screen (they can't cancel directly -
    // see request_booking_cancellation in the backend). Gated on
    // bookings:edit since that's the same permission that lets an account
    // cancel a booking outright.
    { path: '/admin/cancellation-requests', icon: Ban, label: 'Cancellation Requests', permission: 'bookings:edit', prefetch: [['/admin/cancellation-requests', { status: 'Pending' }]] },
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
  { label: 'Content', icon: FileText, items: [
    { path: '/admin/live-blog', icon: Radio, label: 'Live Blog', resource: 'live_blog', prefetch: [['/admin/live-blog']] },
    { path: '/admin/news', icon: Newspaper, label: 'News', resource: 'news', prefetch: [['/news', { active_only: 'false' }]] },
    { path: '/admin/gallery', icon: Camera, label: 'Gallery', resource: 'gallery', prefetch: [['/gallery', { active_only: 'false' }]] },
    { path: '/admin/panchangam', icon: Sun, label: 'Panchangam', resource: 'panchangam', prefetch: [['/admin/panchangam']] },
    { path: '/admin/stotrams', icon: ScrollText, label: 'Stotrams', resource: 'stotrams', prefetch: [['/stotrams', { active_only: 'false' }], ['/sevas']] },
    { path: '/admin/aashirvachanam', icon: Gift, label: 'Aashirvachanam', resource: 'aashirvachanam', prefetch: [['/admin/aashirvachanam']] },
  ] },
  { label: 'Devotees', icon: HeartHandshake, items: [
    { path: '/admin/devotees', icon: Users, label: 'Devotees', resource: 'devotees', prefetch: [['/admin/devotees']] },
    { path: '/admin/donations', icon: HandCoins, label: 'Donations', resource: 'donations', prefetch: [['/admin/donations'], ['/admin/donation-stats']] },
    { path: '/admin/contact-messages', icon: MessageSquare, label: 'Contact Messages', resource: 'contact_messages', prefetch: [['/admin/contact-messages']] },
    { path: '/admin/newsletter', icon: Mail, label: 'Newsletter', resource: 'newsletter', prefetch: [['/admin/newsletter/subscribers']] },
    { path: '/admin/reviews', icon: Star, label: 'Google Reviews', resource: 'reviews', prefetch: [['/admin/reviews', { status: 'pending' }]] },
  ] },
];

// Set-up screens that rarely change. They live as cards on the Settings
// page instead of the sidebar; Settings stays highlighted while on them.
export const settingsSections = [
  { label: 'Temple setup', items: [
    { path: '/admin/sevas', icon: FlameIcon, label: 'Sevas', resource: 'sevas', prefetch: [['/sevas', { active_only: 'false' }]] },
    { path: '/admin/profiles', icon: Calendar, label: 'Day Profiles', resource: 'day_profiles', prefetch: [['/day-profiles']] },
    { path: '/admin/slots', icon: Clock, label: 'Slots', resource: 'slots', prefetch: [['/schedule-slots'], ['/sevas', { active_only: 'false' }], ['/day-profiles']] },
    { path: '/admin/accommodations', icon: BedDouble, label: 'Accommodation', resource: 'accommodations', prefetch: [['/accommodations', { active_only: 'false' }]] },
  ] },
  { label: 'Staff & access', items: [
    { path: '/admin/staff', icon: UserCog, label: 'User Accounts', resource: 'staff', prefetch: [['/admin/staff'], ['/admin/roles'], ['/admin/counters']] },
    { path: '/admin/roles', icon: KeyRound, label: 'Roles', resource: 'roles', prefetch: [['/admin/roles']] },
    { path: '/admin/counters', icon: Store, label: 'Counters', resource: 'counters', prefetch: [['/admin/counters']] },
  ] },
];

const settingsItem = { path: '/admin/settings', icon: Settings, label: 'Settings' };
const settingsPaths = [settingsItem.path, ...settingsSections.flatMap(s => s.items.map(i => i.path))];
const GROUPS_CLOSED_KEY = 'admin-sidebar-closed-groups';

// Warms the cache for an item's `prefetch` GETs once the pointer has rested
// on its link for 80 ms (a pass-over doesn't fire it). Shared with the
// Settings cards.
export function usePrefetchOnRest() {
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const start = (item) => {
    if (!item.prefetch) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => item.prefetch.forEach(([url, params]) => prefetchCached(url, params)), 80);
  };
  const stop = () => clearTimeout(timer.current);
  return { start, stop };
}

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
  const closeTimer = useRef(null);
  const flyoutTimer = useRef(null);
  // The section menu open off the collapsed rail: { label, top, anchor, focusFirst }.
  const [flyout, setFlyout] = useState(null);
  const flyoutRef = useRef(null);
  // Opened from the keyboard: move focus into the menu.
  useEffect(() => { if (flyout?.focusFirst) flyoutRef.current?.querySelector('a')?.focus(); }, [flyout]);
  // Installing from any admin screen installs the admin app (see index.html),
  // also when the admin was reached from the public site without a reload.
  useEffect(() => {
    document.getElementById('app-manifest')?.setAttribute('href', '/admin.webmanifest');
  }, []);
  useEffect(() => {
    const onChange = (e) => setHoverMode(e.detail);
    window.addEventListener(HOVER_MODE_EVENT, onChange);
    return () => window.removeEventListener(HOVER_MODE_EVENT, onChange);
  }, []);
  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(flyoutTimer.current); }, []);
  // "Pinned" = open and holding its full width in the layout. Otherwise the
  // layout only ever holds the icon rail, and the panel opens over the page
  // (hover mode), so the content never jumps sideways.
  const pinned = !hoverMode && !collapsedPref;
  const expanded = pinned || (hoverMode && hovered);
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
  // Phone menu (below md). Each screen mounts its own AdminLayout, so it
  // starts closed again after every navigation.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentItem = [...groups.flatMap(g => g.items), ...settingsSections.flatMap(s => s.items), settingsItem]
    .find(item => location.pathname === item.path);

  // Opens at once; closes a beat later so a diagonal move towards a link
  // that briefly leaves the panel doesn't snap it shut.
  const onSidebarEnter = () => { clearTimeout(closeTimer.current); setHovered(true); };
  const onSidebarLeave = () => { closeTimer.current = setTimeout(() => setHovered(false), 120); };

  const { start: startPrefetch, stop: stopPrefetch } = usePrefetchOnRest();

  // Rail icon names, shown at once on hover or keyboard focus (a `title`
  // takes about a second). One label drawn outside the panel, because the
  // panel's clip-path would cut off anything inside it past the rail.
  const [railTip, setRailTip] = useState(null);
  const tipEvents = (text, { onEnter, onLeave } = {}) => ({
    onPointerEnter: (e) => {
      if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setRailTip({ text, y: r.top + r.height / 2 }); }
      onEnter?.();
    },
    onPointerLeave: () => { setRailTip(null); onLeave?.(); },
    onFocus: (e) => {
      if (!expanded && e.currentTarget.matches(':focus-visible')) { const r = e.currentTarget.getBoundingClientRect(); setRailTip({ text, y: r.top + r.height / 2 }); }
      onEnter?.();
    },
    onBlur: () => { setRailTip(null); onLeave?.(); },
  });

  // One sidebar that folds, Atlas-style, rather than two layouts swapped:
  // icons sit in a fixed 56px box centred on the rail (x = 40px) in both
  // states, so they never move sideways. Collapsing folds every section's
  // links away (grid rows 1fr -> 0fr), which slides the section icons up
  // into a short column; expanding unfolds them and the icons spread back
  // out to their headings. Labels fade, and the panel's width is revealed
  // with clip-path - nothing outside the panel is re-laid out.
  const EASE = '[transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]';
  const label = (text, extra = '') => (
    <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'} ${extra}`}>{text}</span>
  );
  const iconBox = (Icon, highlighted) => (
    <span className={`w-14 h-9 shrink-0 flex items-center justify-center rounded-lg ${highlighted ? 'bg-[#C43E00] text-white' : ''}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
  const rowCls = (active) => `group flex items-center w-full rounded-lg text-sm transition-colors ${
    expanded ? (active ? 'bg-[#C43E00] text-white' : 'hover:bg-white/5 text-[#FFE0B2]/80') : (active ? 'text-white' : 'text-[#FFE0B2]/80 hover:text-white')}`;

  const navLink = (item) => (
    <Link key={item.path} to={item.path} aria-label={expanded ? undefined : item.label}
      {...tipEvents(item.label, { onEnter: () => startPrefetch(item), onLeave: stopPrefetch })}
      className={rowCls(isActive(item))} data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}>
      {iconBox(item.icon, !expanded && isActive(item))}
      {label(item.label)}
    </Link>
  );

  // Section menus off the collapsed rail (when it isn't in hover mode, where
  // the whole panel unfolds instead). Like hover mode they open at once and
  // close 120 ms after the pointer leaves both the icon and the menu.
  const flyoutsOn = !expanded && !hoverMode;
  const openFlyout = (g, e, { focusFirst = false } = {}) => {
    if (!flyoutsOn) return;
    clearTimeout(flyoutTimer.current);
    const anchor = e.currentTarget;
    const r = anchor.getBoundingClientRect();
    const height = 48 + g.items.length * 40; // header + rows; keeps it on screen
    setFlyout({ label: g.label, top: Math.max(8, Math.min(r.top - 8, window.innerHeight - height - 8)), anchor, focusFirst });
  };
  const keepFlyout = () => clearTimeout(flyoutTimer.current);
  const closeFlyoutSoon = () => { flyoutTimer.current = setTimeout(() => setFlyout(null), 120); };
  const flyoutKeys = (e) => {
    const links = [...e.currentTarget.querySelectorAll('a')];
    const at = links.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); flyout.anchor.focus(); setFlyout(null); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); links[(at + 1) % links.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); links[(at - 1 + links.length) % links.length]?.focus(); }
  };
  const flyoutGroup = flyoutsOn && flyout && groups.find(g => g.label === flyout.label);

  // A section heading: the fold toggle when expanded, the rail icon (with
  // its menu) when collapsed.
  const sectionHeading = (g) => {
    const slug = g.label.toLowerCase().replace(/[^a-z]+/g, '-');
    const menuOpen = flyoutGroup?.label === g.label;
    return (
      <button type="button" aria-label={expanded ? undefined : g.label}
        aria-expanded={expanded ? isOpen(g) : menuOpen} aria-haspopup={expanded ? undefined : 'menu'}
        onClick={(e) => (expanded ? toggleGroup(g.label) : openFlyout(g, e))}
        onPointerEnter={(e) => openFlyout(g, e)} onPointerLeave={closeFlyoutSoon}
        onKeyDown={(e) => { if (!expanded && ['Enter', ' ', 'ArrowRight'].includes(e.key)) { e.preventDefault(); openFlyout(g, e, { focusFirst: true }); } }}
        className={`group flex items-center w-full rounded-lg text-[11px] uppercase tracking-wider ${expanded ? 'text-[#D4AF37]/80 hover:text-[#D4AF37]' : menuOpen ? 'text-white' : 'text-[#FFE0B2]/80 hover:text-white'}`}
        data-testid={expanded ? `admin-nav-group-${slug}` : `admin-nav-section-${slug}`}>
        {iconBox(g.icon, !expanded && g.items.some(isActive))}
        {label(g.label, 'flex-1 text-left')}
        <ChevronDown className={`h-3.5 w-3.5 mr-3 shrink-0 transition-[transform,opacity] duration-200 ${expanded ? 'opacity-100' : 'opacity-0'} ${isOpen(g) ? '' : '-rotate-90'}`} />
      </button>
    );
  };

  const toggleCollapsed = () => {
    setFlyout(null);
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex">
      {/* Sidebar - desktop only; the mobile header below has its own
          always-compact, icon-only layout so it isn't affected. The aside
          only snaps between w-20 and w-64 (pinned); the panel inside it is
          always w-64, absolutely placed, and folds as described above. */}
      <aside className={`${pinned ? 'w-64' : 'w-20'} hidden md:block shrink-0 md:sticky md:top-0 md:h-screen z-40`}
        onMouseEnter={onSidebarEnter} onMouseLeave={onSidebarLeave} data-testid="admin-sidebar">
        <div className={`absolute inset-y-0 left-0 w-64 bg-[#2D1B0E] text-[#FFE0B2] flex flex-col transition-[clip-path,box-shadow] duration-200 ${EASE} ${
          expanded ? '[clip-path:inset(0_-48px_0_0)]' : '[clip-path:inset(0_176px_0_0)]'} ${expanded && !pinned ? 'shadow-2xl' : ''}`}
          data-testid="admin-sidebar-panel">
          <div className="h-[4.75rem] px-3 border-b border-[#5D4037]/30 flex items-center">
            <span className="w-14 shrink-0 flex justify-center"><ShieldCheck className="h-5 w-5 text-[#D4AF37]" /></span>
            <div className={`flex-1 min-w-0 transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
              <span className="font-english-heading text-xs tracking-wide whitespace-nowrap">ADMIN PORTAL</span>
              <p className="text-xs text-[#8D6E63] truncate">{user?.name} ({user?.role})</p>
            </div>
            {!hoverMode && <button
              onClick={toggleCollapsed}
              className={`text-[#FFE0B2]/60 hover:text-white transition-colors shrink-0 ${expanded ? 'mr-1' : 'absolute left-[3.75rem] top-2'}`}
              title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              data-testid="admin-sidebar-toggle"
            >
              {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
            </button>}
          </div>
          <nav className={`flex-1 p-3 space-y-1 ${expanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            {groups.map((g, i) => g.label ? (
              <div key={g.label} className={`transition-[padding] duration-200 ${EASE} ${expanded ? 'pt-2' : ''}`}>
                {sectionHeading(g)}
                {/* 0fr <-> 1fr animates the links' height; inert while folded
                    so Tab never lands on a hidden link. */}
                <div className={`grid transition-[grid-template-rows] duration-200 ${EASE} ${expanded && isOpen(g) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  inert={!(expanded && isOpen(g))}>
                  <div className="overflow-hidden space-y-1 pt-1">{g.items.map(navLink)}</div>
                </div>
              </div>
            ) : <div key={i} className="space-y-1">{g.items.map(navLink)}</div>)}
          </nav>
          {/* Pinned below the scrolling list so Settings and Logout are always in view.
              "View website" opens the public site in a new tab, so the admin
              screen (and anything half-edited on it) stays where it was. */}
          <div className="p-3 border-t border-[#5D4037]/30 space-y-1">
            <a href="/" target="_blank" rel="noopener" {...tipEvents('View website')}
              aria-label={expanded ? undefined : 'View website (opens in a new tab)'} title={expanded ? 'Opens in a new tab' : undefined}
              className={rowCls(false)} data-testid="admin-view-website">
              {iconBox(Globe, false)}
              {label('View website', 'flex-1')}
              <ExternalLink className={`h-3 w-3 mr-3 transition-opacity duration-200 ${expanded ? 'opacity-60' : 'opacity-0'}`} />
            </a>
            {navLink(settingsItem)}
            <button onClick={logout} {...tipEvents('Logout')} aria-label={expanded ? undefined : 'Logout'}
              className={rowCls(false)} data-testid="admin-logout">
              {iconBox(LogOut, false)}
              {label('Logout')}
            </button>
          </div>
        </div>
        {railTip && !expanded && (
          <span aria-hidden="true" style={{ top: railTip.y }}
            className="pointer-events-none fixed left-[5.5rem] -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-[#1E1209] px-2.5 py-1 text-xs text-[#FFE0B2] shadow-lg ring-1 ring-[#5D4037]/60"
            data-testid="admin-rail-tip">
            {railTip.text}
          </span>
        )}
        {flyoutGroup && (
          // `fixed` so the rail's clip doesn't hide it; the transparent pl-2
          // strip keeps the pointer "inside" on its way across.
          <div ref={flyoutRef} role="menu" aria-label={flyoutGroup.label} onPointerEnter={keepFlyout} onPointerLeave={closeFlyoutSoon} onKeyDown={flyoutKeys}
            style={{ top: flyout.top }}
            className="fixed left-20 z-50 pl-2 animate-in fade-in-0 zoom-in-90 slide-in-from-left-3 duration-200 [animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)] origin-top-left"
            data-testid="admin-nav-flyout">
            <div className="w-56 rounded-xl bg-[#2D1B0E] text-[#FFE0B2] p-2 space-y-1 shadow-2xl ring-1 ring-[#5D4037]/60">
              <p className="px-4 pt-1 pb-1 text-[11px] uppercase tracking-wider text-[#D4AF37]/70">{flyoutGroup.label}</p>
              {flyoutGroup.items.map(item => (
                <Link key={item.path} to={item.path} role="menuitem"
                  onPointerEnter={() => startPrefetch(item)} onPointerLeave={stopPrefetch} onFocus={() => startPrefetch(item)} onBlur={stopPrefetch}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${isActive(item) ? 'bg-[#C43E00] text-white' : 'hover:bg-white/5 text-[#FFE0B2]/80'}`}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Phone header: a short bar with a menu, not a row of every screen's
            icon (19 icons forced the whole page to lay out ~884px wide, so
            phones shrank every admin screen to fit). */}
        <header className={`md:hidden sticky top-0 bg-[#2D1B0E] text-[#FFE0B2] ${mobileMenuOpen ? 'z-[60]' : 'z-40'}`} data-testid="admin-mobile-header">
          <div className="h-14 px-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37] shrink-0" />
            <span className="flex-1 min-w-0 truncate text-sm font-english-heading text-white">{currentItem?.label || 'Admin'}</span>
            <button type="button" onClick={() => setMobileMenuOpen(o => !o)} aria-expanded={mobileMenuOpen} aria-controls="admin-mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} className="-mr-2 h-11 w-11 flex items-center justify-center rounded-lg hover:bg-white/10"
              data-testid="admin-mobile-menu-toggle">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <nav id="admin-mobile-menu" className="border-t border-[#5D4037]/40 px-3 pb-4 max-h-[calc(100dvh-3.5rem)] overflow-y-auto" data-testid="admin-mobile-menu">
              <p className="px-3 pt-3 pb-1 text-xs text-[#8D6E63]">{user?.name} ({user?.role})</p>
              {[...groups, { label: 'More', items: [settingsItem] }].map((g, i) => (
                <div key={g.label || i} className="pt-2">
                  {g.label && <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-[#D4AF37]/70">{g.label}</p>}
                  {g.items.map(item => (
                    <Link key={item.path} to={item.path} aria-current={isActive(item) ? 'page' : undefined}
                      className={`flex items-center gap-3 px-3 h-11 rounded-lg text-sm ${isActive(item) ? 'bg-[#C43E00] text-white' : 'active:bg-white/10'}`}>
                      <item.icon className="h-4 w-4 shrink-0" />{item.label}
                    </Link>
                  ))}
                </div>
              ))}
              <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 px-3 h-11 rounded-lg text-sm active:bg-white/10">
                <Globe className="h-4 w-4 shrink-0" /><span className="flex-1">View website</span><ExternalLink className="h-3 w-3 opacity-60" />
              </a>
              <button type="button" onClick={logout} className="w-full flex items-center gap-3 px-3 h-11 rounded-lg text-sm active:bg-white/10">
                <LogOut className="h-4 w-4 shrink-0" />Logout
              </button>
            </nav>
          )}
        </header>
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
          {title && <h1 className="font-english-heading text-2xl text-[#621B00] mb-6" data-testid="admin-page-title">{title}</h1>}
          {children}
        </main>
        <TasksWidget />
      </div>
    </div>
  );
}
