# Project Setu

**Setu** ("bridge") is the ticketing/booking system that connects a devotee
who finds the temple through Sannidhi (website, Google Business Profile,
Facebook) to an actual, paid, confirmed seva/darshan/accommodation slot.

## Important: this is not a from-scratch build

The booking engine already exists inside the Sannidhi codebase — seva
booking, quick booking, accommodation booking, ticket generation/lookup, and
the admin Slots/Bookings panel are all implemented (see
`PROJECT_SANNIDHI.md`, section "Devotee-facing booking & account features").

Setu is therefore the next **phase of work on that existing system**, not a
second codebase. Its job is to take booking from "built and mocked" to
"live, paid, and reachable from every Sannidhi surface."

## What's blocking it from being live today

1. **No real payment gateway.** `DONATION_FORM_PAUSED` and `BOOKINGS_PAUSED`
   (`frontend/src/lib/bookingStatus.js`) are both `true` specifically because
   there is no real payment integration — bookings and donations currently
   generate a mocked "Paid" status instead of taking money. This is the
   single biggest gap between what exists and a working ticketing system.
2. **No link from Google Business Profile or Facebook to a booking flow.**
   Once payments are real, GBP supports a "Book" / appointment link, and a
   Facebook Page can carry a "Book Now" CTA button — both currently unset
   since neither presence is documented yet (see `PROJECT_SANNIDHI.md`,
   sections 2–3).

## Third channel: the physical ticket counter

Setu is not just "website + WhatsApp." The temple already sells tickets
in person at a counter, and the data model shows this was anticipated but
never finished:

- Every `schedule_slots` document already carries **two separate capacity
  numbers** — `online_quota` and `counter_quota` (`backend/app/main.py`,
  `SlotCreate`/`SlotUpdate`; visible in the admin Slots screen as "O:x C:x").
  Someone designed for online demand to never be able to eat into the
  capacity reserved for walk-in devotees.
- A **`Cashier` admin role** already exists in the JWT role check
  (`backend/app/main.py:208`), alongside `EO`, `Clerk`, `Priest`.
- **But** the only booking-creation endpoint, `POST /bookings`
  (`backend/app/main.py:916`), requires a logged-in devotee account and
  checks capacity against `online_quota` only. There is no endpoint that
  lets counter staff create a booking, take a cash payment, and consume
  `counter_quota`. Counter sales today happen entirely outside this system.

So Setu's real scope is **three channels sharing one booking engine and one
slot capacity** — online, WhatsApp, and the counter — not two. See "Counter
booking endpoint — spec" below.

## Planned scope (draft — refine as decisions are made)

- [ ] Integrate a real payment gateway (e.g. Razorpay/UPI) into the existing
      seva booking, accommodation booking, and donation flows
- [ ] Reconcile payment webhooks with booking/donation status in MongoDB
      (replace the mocked "Paid" write path)
- [ ] Flip `BOOKINGS_PAUSED` and `DONATION_FORM_PAUSED` to `false` once
      payments are verified end-to-end in a staging environment
- [ ] Add a "Book Now" link/button on the Facebook Page pointing at
      `/booking/quick` or `/sevas`
- [ ] Add a booking/appointment link on the Google Business Profile listing
- [ ] Extend the WhatsApp bot to collect seva + date, create a pending
      booking, and send a Razorpay Payment Link as the reply — reusing the
      same payment-confirmation webhook as the website (see
      `backend/app/routes/whatsapp.py`)
- [ ] Build the **counter booking endpoint** so ticket-counter sales write
      into the same `bookings` collection and respect `counter_quota` (spec
      below)
- [ ] Add a `channel` field (`online` / `whatsapp` / `counter`) to every
      booking, so admin reporting and reconciliation can tell channels apart
- [ ] A lightweight counter UI for Cashier-role staff — pick seva/slot,
      enter devotee name + mobile, confirm cash/card/UPI, print the ticket
      via the existing `BookingTicket.jsx` — so a counter ticket looks
      identical to an online one
- [ ] Confirm refund/cancellation policy and build it into the admin
      Bookings panel
- [ ] Load-test the Slots/Bookings admin flow for festival-day traffic
      (e.g. Amavasya Jatara, Brahmotsavam) — including the counter endpoint,
      since festival days are exactly when the counter is busiest

## Counter booking endpoint — spec

Mirrors `POST /bookings` (`backend/app/main.py:916`) closely, so a booking
looks the same in the database and on a printed ticket no matter which
channel created it — only the auth, the quota it checks, and the payment
handling differ.

### `POST /admin/bookings/counter`

**Auth:** admin token, role restricted to `Cashier` or `EO` (not `Clerk`/
`Priest` — counter staff sell tickets and handle cash; other admin roles
manage content, they don't need this).

**Request body** (`CounterBookingCreate`):

```python
class CounterBookingCreate(BaseModel):
    seva_id: str
    slot_id: str
    for_date: str
    number_of_persons: int = 1
    devotee_name: str
    devotee_mobile: str
    gotram: str = ""
    nakshatra: Optional[str] = ""
    rashi: Optional[str] = ""
    payment_method: str  # "cash" | "card" | "upi_counter"
```

No `devotee_id` — counter walk-ins are not required to have an account.
Ticket lookup by `booking_number` or mobile (`GET /bookings/lookup/ticket`,
already implemented) works without one, exactly as it does for online
Quick Booking today.

**Logic** (parallels `create_booking` at `main.py:917-948`, differences
called out):

```python
@api_router.post("/admin/bookings/counter")
async def create_counter_booking(data: CounterBookingCreate, user=Depends(get_current_cashier)):
    seva = await db.sevas.find_one({"id": data.seva_id}, {"_id": 0})
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")
    slot = await db.schedule_slots.find_one({"id": data.slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if data.number_of_persons < 1 or data.number_of_persons > seva.get("max_persons_per_ticket", 4):
        raise HTTPException(status_code=400, detail=f"Number of persons must be 1-{seva.get('max_persons_per_ticket', 4)}")

    # Differs from create_booking: counts ALL non-cancelled bookings for the
    # slot (both channels), but checks against counter_quota's own share of
    # capacity, not the combined total - so online and counter each protect
    # their own reserved seats and can't starve the other.
    counter_booked = await db.bookings.count_documents({
        "slot_id": data.slot_id, "for_date": data.for_date,
        "status": {"$nin": ["Cancelled"]}, "channel": "counter",
    })
    if counter_booked >= slot.get("counter_quota", 10):
        raise HTTPException(status_code=400, detail="No counter slots available for this time")

    booking = {
        "id": str(uuid.uuid4()),
        "booking_number": f"SPJRS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}",
        "devotee_id": None, "devotee_name": data.devotee_name,
        "devotee_mobile": data.devotee_mobile,
        "seva_id": data.seva_id, "seva_name_english": seva.get("name_english", ""),
        "seva_name_telugu": seva.get("name_telugu", ""),
        "slot_id": data.slot_id, "slot_start_time": slot.get("start_time", ""),
        "slot_end_time": slot.get("end_time", ""),
        "booking_date_time": datetime.now(timezone.utc).isoformat(),
        "for_date": data.for_date, "status": "Confirmed",
        # Real "Paid" here, unlike the online flow's current mock - cash/card/UPI
        # was physically collected at the counter before this call is made.
        "payment_status": "Paid", "payment_method": data.payment_method,
        "channel": "counter", "created_by": user["sub"],
        "number_of_persons": data.number_of_persons, "gotram": data.gotram,
        "is_paroksha": False,
        "nakshatra": data.nakshatra or "", "rashi": data.rashi or "",
        "amount": seva.get("base_price", 0),
        "note_to_devotee": seva.get("special_instructions", "")
    }
    await db.bookings.insert_one(booking)
    return {k: v for k, v in booking.items() if k != "_id"}
```

**Also needed:**
- `get_current_cashier` — same shape as the existing `get_current_admin`
  dependency (`main.py:206-211`), but its role check is `role in ["Cashier", "EO"]`
- Backfill `channel: "online"` onto existing/future `POST /bookings`
  records, and `channel: "whatsapp"` once the WhatsApp booking flow lands,
  so all three channels are queryable the same way from day one
- The frontend counter UI calls this endpoint and immediately renders
  `BookingTicket.jsx` for printing — no separate ticket template needed

### Why the quota check differs from the online endpoint

The online endpoint (`main.py:927`) checks *all* non-cancelled bookings
against `online_quota` — meaning today, a slot's real limit is whichever
number is smaller, since nothing stops online from also silently eating
into what should be counter capacity. Once this ships, **each channel
should count only its own bookings against its own quota** (as the sketch
above does for counter) — that's the actual fix that makes `online_quota`/
`counter_quota` mean what the schema always implied they should.

## Open questions to resolve before implementation

- Which payment gateway/provider does the temple trust and have merchant
  onboarding for?
- Who reconciles payments — is there a treasurer/accounts role in the admin
  panel already, or does one need to be added?
- Is remote/Paroksha seva payment handled the same way as in-person, given
  it currently shows manual UPI note-based payment instructions
  (`SevaBooking.jsx`, `ParokshaPaymentSection`)?
- Who is actually assigned the `Cashier` role today, and do they have a
  device (tablet/PC) at the counter to run this on, or does that need to be
  procured as part of Setu too?
- Should a counter booking require the devotee's mobile number at minimum
  (for later ticket lookup / an SMS confirmation), or should a truly
  anonymous cash sale be allowed?
