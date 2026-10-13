import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyPermission, hasPermission } from '@/lib/permissions';
import { prefetchCached } from '@/lib/cachedGet';
import TasksWidget from './TasksWidget';
import { ShieldCheck, LayoutDashboard, Flame as FlameIcon, Calendar, Clock, BookOpen, Users, LogOut, HandCoins, BedDouble, Newspaper, Camera, Sun, Radio, Mail, MessageSquare, Gift, ScrollText, Settings, Receipt, UserCog, KeyRound, PanelLeftClose, PanelLeftOpen, Store, BarChart3, Ban, ScanLine, Star, ChevronDown, Globe, ExternalLink, Ticket, FileText, HeartHandshake } from 'lucide-react';

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
  { label: 'Content', icon: FileText, items: [
    { path: '/admin/live-blog', icon: Radio, label: 'Live Blog', resource: 'live_blog', prefetch: [['/admin/live-blog']] },
    { path: '/admin/news', icon: Newspaper, label: 'News', resource: 'news' },
    { path: '/admin/gallery', icon: Camera, label: 'Gallery', resource: 'gallery' },
    { path: '/admin/panchangam', icon: Sun, label: 'Panchangam', resource: 'panchangam', prefetch: [['/admin/panchangam']] },
    { path: '/admin/stotrams', icon: ScrollText, label: 'Stotrams', resource: 'stotrams' },
    { path: '/admin/aashirvachanam', icon: Gift, label: 'Aashirvachanam', resource: 'aashirvachanam' },
  ] },
  { label: 'Devotees', icon: HeartHandshake, items: [
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
  const closeTimer = useRef(null);
  const prefetchTimer = useRef(null);
  const flyoutTimer = useRef(null);
  // The section menu open off the collapsed rail: { label, top, anchor }.
  const [flyout, setFlyout] = useState(null);
  const flyoutRef = useRef(null);
  // Opened from the keyboard: move focus into the menu.
  useEffect(() => { if (flyout?.focusFirst) flyoutRef.current?.querySelector('a')?.focus(); }, [flyout]);
  useEffect(() => {
    const onChange = (e) => setHoverMode(e.detail);
    window.addEventListener(HOVER_MODE_EVENT, onChange);
    return () => window.removeEventListener(HOVER_MODE_EVENT, onChange);
  }, []);
  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(prefetchTimer.current); clearTimeout(flyoutTimer.current); }, []);
  // "Pinned" = open and holding its full width in the layout. Otherwise the
  // layout only ever holds the icon rail, and the full panel opens over the
  // page (hover mode), so the content never jumps sideways.
  const pinned = !hoverMode && !collapsedPref;
  const panelOpen = pinned || (hoverMode && hovered);
  // Counts openings of the panel during this visit, so its links spring in
  // when it opens - but not on every page load while it's pinned open.
  const [prevPanelOpen, setPrevPanelOpen] = useState(panelOpen);
  const [panelOpenings, setPanelOpenings] = useState(0);
  if (panelOpen !== prevPanelOpen) {
    setPrevPanelOpen(panelOpen);
    if (panelOpen) setPanelOpenings(n => n + 1);
  }
  // A group folded open by hand springs its links in the same way.
  const [justUnfolded, setJustUnfolded] = useState(null);  const [closedGroups, setClosedGroups] = useState(() => {
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
    setJustUnfolded(closedGroups.includes(label) ? label : null);
    setClosedGroups(prev => {
      const next = prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label];
      try { localStorage.setItem(GROUPS_CLOSED_KEY, JSON.stringify(next)); } catch { /* not remembered; fine */ }
      return next;
    });
  };
  const mobileItems = [...groups.flatMap(g => g.items), settingsItem];

  // Opens at once; closes a beat later so a diagonal move towards a link
  // that briefly leaves the panel doesn't snap it shut.
  const onSidebarEnter = () => { clearTimeout(closeTimer.current); setHovered(true); };
  const onSidebarLeave = () => { closeTimer.current = setTimeout(() => setHovered(false), 120); };

  const startPrefetch = (item) => {
    if (!item.prefetch) return;
    clearTimeout(prefetchTimer.current);
    prefetchTimer.current = setTimeout(() => item.prefetch.forEach(([url, params]) => prefetchCached(url, params)), 80);
  };
  const stopPrefetch = () => clearTimeout(prefetchTimer.current);

  // Shown at once on hover/keyboard focus of a rail icon (a `title` takes
  // about a second). It's `fixed` so the rail's scroll box doesn't clip it,
  // which means CSS alone can't know where the (possibly scrolled) row is:
  // placeTip hands it the row's height on screen as --tip-y.
  const placeTip = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--tip-y', `${r.top + r.height / 2}px`);
  };
  const tip = (label, { onHover = true } = {}) => (
    <span aria-hidden="true" className={`pointer-events-none fixed left-[5.5rem] top-[var(--tip-y)] -translate-y-1/2 z-50 hidden ${onHover ? 'group-hover:block' : ''} group-focus-visible:block whitespace-nowrap rounded-md bg-[#1E1209] px-2.5 py-1 text-xs text-[#FFE0B2] shadow-lg ring-1 ring-[#5D4037]/60`}>
      {label}
    </span>
  );

  // The sidebar is drawn twice: the icon rail (collapsed) and the full panel.
  // Only the one on screen is `live` - it carries the data-testids, and the
  // other is `inert` so keyboard focus and tests never land on a hidden copy.
  const testId = (live, id) => (live ? id : undefined);

  // Ease with a slight overshoot - the "elastic" settle.
  const SPRING = 'animate-in fade-in-0 zoom-in-90 slide-in-from-left-2 duration-300 [animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)] fill-mode-both origin-left';
  const navLink = (item, collapsed, live, { spring = false, index = 0, role } = {}) => (
    <Link key={item.path} to={item.path} aria-label={collapsed ? item.label : undefined} role={role}
      style={spring ? { animationDelay: `${index * 18}ms` } : undefined}
      onPointerEnter={(e) => { placeTip(e); startPrefetch(item); }} onPointerLeave={stopPrefetch}
      onFocus={(e) => { placeTip(e); startPrefetch(item); }} onBlur={stopPrefetch}
      className={`group flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${spring ? SPRING : ''} ${collapsed ? 'justify-center px-2' : ''} ${
      isActive(item) ? 'bg-[#C43E00] text-white' : 'hover:bg-white/5 text-[#FFE0B2]/80'
    }`} data-testid={testId(live, `admin-nav-${item.label.toLowerCase().replace(' ', '-')}`)}>
      <item.icon className="h-4 w-4 shrink-0" />
      {collapsed ? tip(item.label) : item.label}
    </Link>
  );

  // Section menus off the collapsed rail. Like hover mode they open at once
  // and close 120 ms after the pointer leaves both the icon and the menu.
  const openFlyout = (g, e, { focusFirst = false } = {}) => {
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

  const sectionButton = (g, live) => {
    const active = g.items.some(isActive);
    const open = flyout?.label === g.label;
    return (
      <button key={g.label} type="button" aria-label={g.label} aria-haspopup="menu" aria-expanded={open}
        onPointerEnter={(e) => { placeTip(e); openFlyout(g, e); }} onPointerLeave={closeFlyoutSoon} onFocus={placeTip}
        onClick={(e) => openFlyout(g, e)}
        onKeyDown={(e) => { if (['Enter', ' ', 'ArrowRight'].includes(e.key)) { e.preventDefault(); openFlyout(g, e, { focusFirst: true }); } }}
        className={`group w-full flex items-center justify-center px-2 py-2 rounded-lg text-sm transition-colors ${
          active ? 'bg-[#C43E00] text-white' : open ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-[#FFE0B2]/80'}`}
        data-testid={testId(live, `admin-nav-section-${g.label.toLowerCase().replace(/[^a-z]+/g, '-')}`)}>
        <g.icon className="h-4 w-4 shrink-0" />
        {!open && tip(g.label, { onHover: false })}
      </button>
    );
  };

  const flyoutGroup = !panelOpen && flyout && groups.find(g => g.label === flyout.label);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  };

  const sidebar = (collapsed, live) => (
    <>
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
            data-testid={testId(live, 'admin-sidebar-toggle')}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>}
        </div>
        {collapsed ? (
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {groups.map(g => g.label ? sectionButton(g, live) : g.items.map(item => navLink(item, true, live)))}
        </nav>
        ) : (
        <nav key={panelOpenings} className="flex-1 p-3 space-y-1 overflow-y-auto">
          {groups.map((g, i) => (
            <div key={g.label || i} className={g.label ? 'pt-3 space-y-1' : 'space-y-1'}>
              {g.label && (
                <button onClick={() => toggleGroup(g.label)} className="w-full flex items-center justify-between px-4 pb-1 text-[11px] uppercase tracking-wider text-[#D4AF37]/70 hover:text-[#D4AF37]" aria-expanded={isOpen(g)} data-testid={testId(live, `admin-nav-group-${g.label.toLowerCase().replace(/[^a-z]+/g, '-')}`)}>
                  {g.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen(g) ? '' : '-rotate-90'}`} />
                </button>
              )}
              {isOpen(g) && g.items.map((item, j) => navLink(item, false, live,
                { spring: panelOpenings > 0 || justUnfolded === g.label, index: j }))}
            </div>
          ))}
        </nav>
        )}
        {/* Pinned below the scrolling list so Settings and Logout are always in view.
            "View website" opens the public site in a new tab, so the admin
            screen (and anything half-edited on it) stays where it was. */}
        <div className="p-3 border-t border-[#5D4037]/30 space-y-1">
          <a href="/" target="_blank" rel="noopener" onPointerEnter={placeTip} onFocus={placeTip} aria-label={collapsed ? 'View website (opens in a new tab)' : undefined} title={collapsed ? undefined : 'Opens in a new tab'}
            className={`group flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-white/5 text-[#FFE0B2]/80 transition-colors ${collapsed ? 'justify-center px-2' : ''}`} data-testid={testId(live, 'admin-view-website')}>
            <Globe className="h-4 w-4 shrink-0" />
            {collapsed ? tip('View website') : <><span className="flex-1">View website</span><ExternalLink className="h-3 w-3 opacity-60" /></>}
          </a>
          {navLink(settingsItem, collapsed, live)}
          <button onClick={logout} onPointerEnter={placeTip} onFocus={placeTip} aria-label={collapsed ? 'Logout' : undefined} className={`group flex items-center gap-3 px-4 py-2.5 text-sm text-[#FFE0B2]/60 hover:text-white transition-colors w-full ${collapsed ? 'justify-center px-2' : ''}`} data-testid={testId(live, 'admin-logout')}>
            <LogOut className="h-4 w-4 shrink-0" /> {collapsed ? tip('Logout') : 'Logout'}
          </button>
        </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FFFCF5] flex">
      {/* Sidebar - desktop only; the mobile header below has its own
          always-compact, icon-only layout so it isn't affected.
          Its width never animates: pinned/collapsed snaps the layout between
          w-64 and w-20 in one step, and only the panel on top fades/slides
          (transform + opacity, which the browser composites without
          re-laying out the page). */}
      <aside className={`${pinned ? 'w-64' : 'w-20'} hidden md:block shrink-0 md:sticky md:top-0 md:h-screen z-40`}
        onMouseEnter={onSidebarEnter} onMouseLeave={onSidebarLeave} data-testid="admin-sidebar">
        <div className="w-20 h-full bg-[#2D1B0E] text-[#FFE0B2] flex flex-col" inert={panelOpen}>
          {sidebar(true, !panelOpen)}
        </div>
        {flyoutGroup && (
          // `fixed` so the rail's scroll box doesn't clip it; the transparent
          // pl-2 strip keeps the pointer "inside" on its way across.
          <div ref={flyoutRef} role="menu" aria-label={flyoutGroup.label} onPointerEnter={keepFlyout} onPointerLeave={closeFlyoutSoon} onKeyDown={flyoutKeys}
            style={{ top: flyout.top }}
            className="fixed left-20 z-50 pl-2 animate-in fade-in-0 zoom-in-90 slide-in-from-left-3 duration-200 [animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)] origin-top-left"
            data-testid="admin-nav-flyout">
            <div className="w-56 rounded-xl bg-[#2D1B0E] text-[#FFE0B2] p-2 space-y-1 shadow-2xl ring-1 ring-[#5D4037]/60">
              <p className="px-4 pt-1 pb-1 text-[11px] uppercase tracking-wider text-[#D4AF37]/70">{flyoutGroup.label}</p>
              {flyoutGroup.items.map(item => navLink(item, false, true, { role: 'menuitem' }))}
            </div>
          </div>
        )}
        <div className={`absolute inset-y-0 left-0 w-64 bg-[#2D1B0E] text-[#FFE0B2] flex flex-col transition-[transform,opacity] duration-150 ease-out ${
          panelOpen ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0 pointer-events-none'} ${pinned ? '' : 'shadow-2xl'}`}
          inert={!panelOpen}>
          {sidebar(false, panelOpen)}
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
            <a href="/" target="_blank" rel="noopener" aria-label="View website (opens in a new tab)" className="p-2"><Globe className="h-4 w-4" /></a>
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
