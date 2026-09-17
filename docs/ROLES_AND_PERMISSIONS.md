# Roles & Permissions

Spec for turning the current fixed, hardcoded role list into something the
EO can actually manage — create a new role (e.g. **Accountant**, **Help
Desk**), decide exactly which admin screens it can see, and assign staff to
it — without a developer touching code.

## The real current state (not just "4 roles, need more")

It's tempting to think today's system is "4 roles, each properly scoped,
we just need a 5th." It isn't. Of the 54 admin-gated endpoints in
`backend/app/main.py`, only **6** actually check for a specific role
(Counter Sale: Cashier/EO; Staff management: EO-only). The other **48** —
Sevas, Bookings, Donations, Devotees, News, Gallery, everything else — use
one generic `get_current_admin` dependency that lets **any** of the four
roles through:

```python
async def get_current_admin(...):
    if payload.get("role") not in ["EO", "Clerk", "Cashier", "Priest"]:
        raise HTTPException(status_code=403, detail="Not an admin")
    return payload
```

So today, a Priest or Clerk account has exactly the same access as the EO
to donations, devotee records, and every content screen — the "role" is
really just "is this any kind of staff member," not a real permission
boundary. This spec is as much about closing that gap as it is about
adding new roles.

## Data model

Replace the hardcoded `STAFF_ROLES` list with a real collection:

```python
# roles collection
{
    "id": "uuid",
    "name": "Accountant",           # what shows in the Staff screen's dropdown
    "permissions": ["view_donations", "view_bookings", "manage_donations"],
    "is_system": False,             # True for the 4 seeded roles - see below
    "is_superuser": False,          # True only for EO - see below
    "created_at": "...",
}
```

### Permissions, one per admin screen

Each permission maps to one screen/feature, matching the existing admin
nav almost 1:1:

| Permission | Screen / capability |
|---|---|
| `manage_sevas` | Sevas |
| `manage_day_profiles` | Day Profiles |
| `manage_slots` | Slots |
| `view_bookings` / `manage_bookings` | Bookings (read vs. status changes — an Accountant might need to *see* bookings for reconciliation without being able to cancel one) |
| `sell_counter_tickets` | Counter Sale (replaces the current hardcoded Cashier/EO check) |
| `manage_staff` | Staff screen — create/disable accounts |
| `manage_roles` | The new Roles screen this spec adds |
| `view_donations` / `manage_donations` | Donations |
| `manage_accommodations` | Accommodation |
| `manage_news` | News |
| `manage_panchangam` | Panchangam |
| `manage_live_blog` | Live Blog |
| `manage_gallery` | Gallery |
| `manage_stotrams` | Stotrams |
| `view_devotees` / `manage_devotees` | Devotees |
| `manage_newsletter` | Newsletter |
| `view_contact_messages` | Contact Messages |
| `manage_aashirvachanam` | Aashirvachanam |

Splitting a few into view/manage pairs (bookings, donations, devotees) is
deliberate — it's exactly what makes an Accountant or Help Desk role
possible: read access to the data they need without edit rights over
things outside their job.

### EO stays a superuser, not an enumerated list

Don't give EO an explicit list of 20 permissions to keep in sync by hand
every time a new screen is added — that's how today's "everyone gets
everything" bug happened in the first place, just moved up a level. Instead:

```python
async def require_permission(permission: str):
    async def check(credentials: HTTPAuthorizationCredentials = Depends(security)):
        payload = decode_token(credentials.credentials)
        role = await db.roles.find_one({"name": payload.get("role")})
        if not role:
            raise HTTPException(status_code=403, detail="Role not found")
        if role.get("is_superuser") or permission in role.get("permissions", []):
            return payload
        raise HTTPException(status_code=403, detail=f"Missing permission: {permission}")
    return check
```

`EO` is seeded with `is_superuser: True` and is never editable or
deletable — the same self-protection the current "can't deactivate your
own account" guard exists for, extended to "can't lock the EO role out of
its own system."

### The 4 existing roles, migrated

Seeded as `is_system: True` (name can't be renamed, role can't be
deleted — staff accounts reference it by name) with a starting permission
set. This migration is also the natural moment to actually decide what
Clerk and Priest should be scoped to, since today they're accidentally
unscoped:

- **EO** — `is_superuser: True`
- **Cashier** — `sell_counter_tickets`, `view_bookings`
- **Clerk** — *(needs a real decision — see Open Questions)*
- **Priest** — *(needs a real decision — see Open Questions)*

## New endpoints

```
GET    /admin/roles              # list all roles (manage_roles or superuser)
POST   /admin/roles              # create a role: {name, permissions: [...]}
PUT    /admin/roles/{id}         # edit name/permissions (blocked if is_system)
DELETE /admin/roles/{id}         # blocked if is_system, or if any staff account uses it
```

`POST /admin/staff`'s `role` field now validates against the `roles`
collection (`db.roles.find_one({"name": data.role})`) instead of the
hardcoded `STAFF_ROLES` list — everything else about staff creation stays
the same.

## How screens actually get hidden

Two layers, not one — hiding a nav link is a UX nicety, not security:

1. **Frontend (UX):** on login, fetch the current user's role's permission
   list once (a small `GET /admin/me/permissions` endpoint, or embed it in
   the login response next to `user`). `AdminLayout.jsx`'s `navItems` array
   gets a `permission` field per item and filters at render time:
   ```jsx
   const visibleItems = navItems.filter(item => hasPermission(item.permission));
   ```
   A Help Desk account simply never sees "Donations" or "Sevas" in the
   sidebar — less confusing than seeing a link that 403s.

2. **Backend (actual security):** every endpoint swaps its
   `Depends(get_current_admin)` for `Depends(require_permission("..."))`.
   This is the layer that matters — the frontend filter is convenience,
   this is enforcement. A Help Desk account hitting `/admin/donations`
   directly (browser URL, curl, anything) gets a real 403 regardless of
   what the sidebar shows.

This is also, concretely, the fix for the 48-endpoint gap above: each of
those `get_current_admin` calls becomes a specific `require_permission(...)`
call instead, matching the table above.

## Worked examples, per the two roles you named

**Accountant** — `view_donations`, `view_bookings`, `manage_donations`
(to correct a misrecorded payment), nothing else. Sees Donations and
Bookings in the sidebar; Sevas, Gallery, News, Staff are simply not
there. Ties directly into the "who reconciles payments" question from
the Setu roadmap — this is that role, made real.

**Help Desk** — `view_devotees`, `view_bookings`, `view_contact_messages`,
maybe `manage_newsletter` if they also handle subscriber questions.
Explicitly *not* `manage_sevas` or `manage_donations` — a help desk
answering "where's my ticket" doesn't need to be able to change prices or
issue refunds.

## Migration plan

1. Seed the `roles` collection with the 4 existing roles + their decided
   permission sets (blocking on the Open Questions below)
2. Add `require_permission()` and the new `/admin/roles` endpoints
3. Go through all 48 generic `get_current_admin` call sites and replace
   each with the specific permission its screen actually needs — this is
   the bulk of the work, and worth doing a few endpoints at a time with a
   real test after each, not as one giant sweep
4. Add the Roles screen (EO-only) and the nav-filtering logic
5. Existing staff accounts keep working throughout — their `role` string
   doesn't change, only what that role is allowed to do

## Open questions to resolve before implementation

- **What should Clerk and Priest actually be scoped to?** Today they're
  unscoped by accident. This is a real decision for the EO, not something
  to guess at — worth a short conversation about what each role's job
  actually is day-to-day.
- **Do permission changes apply immediately or on next login?** The
  simplest implementation (above) checks the `roles` collection fresh on
  every request, so a permission change is live immediately — no token
  refresh needed. The tradeoff is one extra DB lookup per admin request;
  worth an in-memory cache with a short TTL if that ever shows up as a
  real performance concern, but not before then.
- **Can a role be deleted if staff are still assigned to it?** Spec above
  says no (blocked) — simplest and safest; reassigning staff first is a
  small, deliberate extra step rather than silently orphaning an account's
  access.
