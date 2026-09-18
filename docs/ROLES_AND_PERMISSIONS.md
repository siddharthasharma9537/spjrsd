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
    "permissions": ["donations:view", "donations:edit", "bookings:view"],
    "is_system": False,             # True for the 4 seeded roles - see below
    "is_superuser": False,          # True only for EO - see below
    "created_at": "...",
}
```

### Permissions are `resource:action` pairs, not one flag per screen

The Clerk scoping below needs "can create a booking, can view bookings,
cannot edit or cancel one" — a single `manage_bookings` flag can't express
that; it's all-or-nothing. So every resource gets up to four independent
grants instead of one:

```
{resource}:view    {resource}:create    {resource}:edit    {resource}:delete
```

| Resource | Screen | Typical actions used |
|---|---|---|
| `sevas` | Sevas | view, create, edit, delete |
| `day_profiles` | Day Profiles | view, create, edit, delete |
| `slots` | Slots | view, create, edit, delete |
| `bookings` | Bookings / Counter Sale | view, create, edit, delete, reconcile (edit = status change; delete = cancel; reconcile = the end-of-day counter-sales totals view — Cashier-specific, distinct from just viewing individual bookings). A `bookings:view`-only account (e.g. Clerk) can't cancel directly - it can only *request* a cancellation, which a `bookings:edit` holder then approves (which actually cancels it) or rejects, via the Cancellation Requests screen. |
| `donations` | Donations | view (that's all that exists today — see note below) |
| `accommodations` | Accommodation | view, create, edit, delete |
| `news` | News | view, create, edit, delete |
| `panchangam` | Panchangam | view, create, edit, delete |
| `live_blog` | Live Blog | view, create, edit, delete |
| `gallery` | Gallery | view, create, edit, delete |
| `stotrams` | Stotrams | view, create, edit, delete |
| `devotees` | Devotees | view, edit, delete (no create — devotees self-register) |
| `newsletter` | Newsletter | view, create |
| `contact_messages` | Contact Messages | view, edit (mark handled) |
| `aashirvachanam` | Aashirvachanam | view, edit |
| `staff` | User Accounts screen | view, create, edit (role/counter/active status), delete |
| `counters` | Counters screen | view, create, edit (rename), delete |
| `roles` | Roles screen (new) | view, create, edit, delete |

Not every resource needs all four — e.g. nobody deletes a devotee record
or creates the Dashboard's summary data — so the Roles screen only shows
the actions that are actually meaningful per resource, not a blanket
4-column grid with dead checkboxes.

A role's `permissions` field becomes a flat list of the grants it holds,
e.g. `["bookings:view", "bookings:create", "donations:view"]`.

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

### The 2 default roles — everything else is created, not pre-seeded

Only two roles are seeded (`is_system: True` — name can't be renamed, role
can't be deleted, since staff accounts reference it by name), and both are
full superusers:

- **EO** — the temple's Executive Officer. Full access to every screen and
  action, including editing/cancelling/deleting a booking and managing
  staff/roles.

- **SysAdmin** — whoever administers the platform itself (not a temple
  role). Also `is_superuser: True`, same full access as EO — a separate
  login rather than sharing the EO's own credentials for system upkeep.

Cashier, Clerk, Priest, and any other narrower role (Accountant, Help
Desk, ...) are no longer pre-seeded — the EO creates them via `New Role`
on the Roles screen and scopes them with the permission matrix, same as
any custom role. The Cashier/Clerk split described below is kept as a
worked example of *how* to scope a counter-staff role with this system,
not as something every deployment starts with:

- A **Cashier**-style role would get `bookings:view`, `bookings:create`,
  `bookings:reconcile` — sells tickets at the counter (Counter Sale
  screen), can look up a booking to answer a devotee's question, and owns
  the cash drawer: sees the end-of-day "Today's Counter Sales" totals view
  for reconciliation. No edit/cancel/delete on a booking.

- A **Clerk**-style role would get `bookings:view`, `bookings:create` only
  — sits at the booking counter, creates and reads bookings, but doesn't
  see the reconciliation totals (that's the Cashier-style role's job) and
  can't edit, cancel, or delete a booking (EO/SysAdmin-only, regardless of
  who's asking or why).

## New endpoints

```
GET    /admin/roles              # list all roles (roles:view or superuser)
POST   /admin/roles              # create a role: {name, permissions: [...]}
PUT    /admin/roles/{id}         # edit name/permissions (blocked if is_system)
DELETE /admin/roles/{id}         # blocked if is_system, or if any staff account uses it
```

`POST /admin/bookings/counter` (the existing Counter Sale endpoint) swaps
its hardcoded `get_current_cashier` dependency for
`require_permission("bookings:create")` — which is exactly how Clerk gets
the same counter-creation access as Cashier without a second, parallel
endpoint.

`POST /admin/staff`'s `role` field now validates against the `roles`
collection (`db.roles.find_one({"name": data.role})`) instead of the
hardcoded `STAFF_ROLES` list — everything else about staff creation stays
the same.

## How screens actually get hidden

Two layers, not one — hiding a nav link is a UX nicety, not security:

1. **Frontend (UX):** on login, fetch the current user's role's permission
   list once (a small `GET /admin/me/permissions` endpoint, or embed it in
   the login response next to `user`). `AdminLayout.jsx`'s `navItems` array
   gets a `resource` field per item, and a nav link shows if the user holds
   *any* action on that resource (view is enough to show the link; the
   page itself then hides/disables buttons for actions they don't have —
   e.g. Clerk sees the Bookings list but no Cancel button on each row):
   ```jsx
   const visibleItems = navItems.filter(item => hasAnyPermission(item.resource));
   ```
   A Help Desk account simply never sees "Donations" or "Sevas" in the
   sidebar — less confusing than seeing a link that 403s.

   The Roles screen itself presents this as a matrix, not a flat
   checklist — one row per resource, one column per action, so "Clerk can
   view and create bookings but not edit or delete them" is four
   checkboxes in a row, not four differently-worded flags to hunt through:

   ```
                    View    Create   Edit    Delete
   Bookings          ☑        ☑       ☐        ☐
   Donations         ☐        ☐       ☐        ☐
   Sevas             ☐        ☐       ☐        ☐
   ...
   ```

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

**Accountant** — `donations:view`, `bookings:view`, nothing else. Sees
Donations and Bookings in the sidebar; Sevas, Gallery, News, Staff are
simply not there. Ties directly into the "who reconciles payments"
question from the Setu roadmap — this is that role, made real.

*Correcting a misrecorded donation isn't actually possible today* — there
is no admin endpoint to edit or delete a donation record at all, only the
public devotee-facing `POST /donations` that creates one. `donations:edit`
would need that endpoint built first; it's a real gap worth raising with
the EO (an Accountant who can see a mistake but not fix it isn't much use)
but it's a separate feature, not something to invent silently as part of
this permissions pass.

**Help Desk** — `devotees:view`, `bookings:view`, `contact_messages:view`,
`contact_messages:edit` (marking a query handled). Explicitly *not*
`sevas:edit` or `donations:edit` — a help desk answering "where's my
ticket" doesn't need to be able to change prices or issue refunds.

## Migration plan

1. Seed the `roles` collection with the 2 default roles (EO, SysAdmin)
2. Add `require_permission()` and the new `/admin/roles` endpoints
3. Go through all 48 generic `get_current_admin` call sites and replace
   each with the specific permission its screen actually needs — this is
   the bulk of the work, and worth doing a few endpoints at a time with a
   real test after each, not as one giant sweep
4. Add the Roles screen (EO-only) and the nav-filtering logic
5. Existing staff accounts keep working throughout — their `role` string
   doesn't change, only what that role is allowed to do

## Open questions to resolve before implementation

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
