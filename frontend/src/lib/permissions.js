// Permission checks against the `user` object stored by AuthContext after
// admin login, which now carries `permissions` (a flat list of
// "resource:action" strings) and `is_superuser` - see
// docs/ROLES_AND_PERMISSIONS.md. Mirrors the backend's require_permission:
// a superuser (EO) always passes, everyone else needs the exact grant.

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.is_superuser) return true;
  return (user.permissions || []).includes(permission);
}

// True if the user holds any action at all on this resource - used to
// decide whether a nav link/screen should show up (e.g. "view" is enough
// to show "Bookings" even if they can't edit one). The page itself still
// hides/disables the specific buttons for actions they don't hold.
export function hasAnyPermission(user, resource) {
  if (!user) return false;
  if (user.is_superuser) return true;
  return (user.permissions || []).some(p => p.startsWith(`${resource}:`));
}
