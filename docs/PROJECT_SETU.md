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
- [ ] Decide whether WhatsApp (already wired for OTP + chatbot) should also
      support starting or checking a booking, given the inbound webhook
      already exists
- [ ] Confirm refund/cancellation policy and build it into the admin
      Bookings panel
- [ ] Load-test the Slots/Bookings admin flow for festival-day traffic
      (e.g. Amavasya Jatara, Brahmotsavam)

## Open questions to resolve before implementation

- Which payment gateway/provider does the temple trust and have merchant
  onboarding for?
- Who reconciles payments — is there a treasurer/accounts role in the admin
  panel already, or does one need to be added?
- Is remote/Paroksha seva payment handled the same way as in-person, given
  it currently shows manual UPI note-based payment instructions
  (`SevaBooking.jsx`, `ParokshaPaymentSection`)?
