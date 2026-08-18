# Phase 12 — Operational Optimizations

These are the fixes that come from actually running a café day-to-day
— the gap between "the billing logic is correct" and "the billing logic
survives real people walking to a counter." Covers your four requests
plus a few more I'd flag at this stage.

## What's in this phase

```
1. Simple sequential invoice numbers, reset every financial year (1 Apr)
2. Table/session status protection (can't clear an occupied/unbilled table)
3. Grace period on gaming slab billing
4. Manual end-time selection when closing a gaming session
5. Additional optimizations worth considering now
```

---

## Step 1 — Simple sequential invoice numbers, FY reset

### Schema change already made
`Bill.invoiceNumber` is now a plain `Int` (1, 2, 3...), paired with
`Bill.financialYear` (e.g. `"2025-26"`). The two together are the
unique key (`@@unique([invoiceNumber, financialYear])`) — the bare
number alone isn't globally unique, since it's meant to legitimately
repeat every financial year (invoice #1 exists in FY 2025-26 and again
in FY 2026-27).

### Generation logic (`billing.service.mjs`)

```js
function getFinancialYear(date) {
  const year = date.getFullYear();
  const isBeforeApril = date.getMonth() < 3; // Jan/Feb/Mar -> still previous FY
  const startYear = isBeforeApril ? year - 1 : year;
  return `${startYear}-${String(startYear + 1).slice(-2)}`; // "2025-26"
}

async function generateInvoiceNumber(tx, billDate = new Date()) {
  const financialYear = getFinancialYear(billDate);
  const count = await tx.bill.count({ where: { financialYear } });
  return { invoiceNumber: count + 1, financialYear };
}
```

Generate inside the same transaction as bill creation, same
concurrency reasoning as before — two simultaneous bills must not both
compute the same next number.

### Done when
Bills display as "Invoice #1," "#2," etc., and the sequence correctly
restarts at 1 on April 1 each year without colliding with the previous
year's numbers.

---

## Step 2 — Table & session status protection

### The problem this prevents
Staff manually changing a table's status (or a session/order's state)
out of sequence can silently orphan real data — marking a table `FREE`
while players are still seated and unbilled loses track of an active
gaming session; nothing currently stops that from happening by mistake.

### The rule
A `Table.status` can only be set to `FREE` through the billing flow's
own logic (Phase 6 Step 4 — after a bill is generated and, depending
on your chosen release-timing, after full payment). **Any direct manual
attempt to set a table's status is rejected if:**
- it has one or more `GamingSession` rows with `status = 'ACTIVE'`, or
- it has one or more `Order` rows with `status = 'OPEN'`.

```js
// table.service.mjs
async function updateTableStatus(tableId, newStatus, tx) {
  if (newStatus === 'FREE') {
    const hasActiveSessions = await tx.gamingSession.count({ where: { tableId, status: 'ACTIVE' } });
    const hasOpenOrders = await tx.order.count({ where: { tableId, status: 'OPEN' } });
    if (hasActiveSessions > 0 || hasOpenOrders > 0) {
      throw new ConflictError('Cannot free a table with active sessions or unbilled orders — generate the bill first.');
    }
  }
  // ...
}
```

Same principle extends to editing a table's core config
(`zoneId`, `halfHourRate`, `hourlyRate`, `maxPlayers`) while it has
active sessions or open orders — block it with the same style of error,
since changing a table's rate mid-use is confusing even though
already-active sessions have their rates snapshotted and technically
wouldn't be affected. Simpler for staff if the app just says "settle
this table first" rather than let them edit config on an occupied table
and wonder why nothing changed.

### Frontend
Surface this as a clear, specific error message when it happens — "Table
4 has an active gaming session, generate the bill before freeing it,"
not a generic failure. This is exactly the kind of guardrail that
prevents a real mistake during a busy shift.

### Done when
It's structurally impossible for a table to show as `FREE` while it
still has unbilled activity — the only path back to `FREE` runs through
billing.

---

## Step 3 — Grace period on gaming slab billing

### The problem
A player's actual play session (30 min) and the moment staff process
their checkout at the counter (a few minutes later) aren't the same
timestamp — without a grace window, a player who played exactly 30
minutes but got checked out at 33 minutes gets bumped into the more
expensive 31-60 min slab for 3 minutes they didn't actually play.

### The fix — grace applied at each 30-minute boundary
`BusinessProfile.gamingGracePeriodMinutes` (default 5, admin-configurable
in Settings) is applied at **every** 30-minute boundary, not just once:

```js
function applyGracePeriod(elapsedMinutes, graceMinutes) {
  const remainderInto30 = elapsedMinutes % 30;
  // If they're within `graceMinutes` just past a 30-min boundary,
  // round back down to that boundary before slab calculation.
  if (remainderInto30 > 0 && remainderInto30 <= graceMinutes) {
    return elapsedMinutes - remainderInto30;
  }
  return elapsedMinutes;
}

function calculateSlotCharge(elapsedMinutesRaw, halfHourRate, hourlyRate, graceMinutes) {
  const elapsedMinutes = applyGracePeriod(elapsedMinutesRaw, graceMinutes);
  const fullHours = Math.floor(elapsedMinutes / 60);
  const remainder = elapsedMinutes % 60;
  let charge = fullHours * hourlyRate;
  if (remainder > 0) {
    charge += remainder <= 30 ? halfHourRate : hourlyRate;
  }
  return charge;
}
```

Verified against the scenarios this needs to handle: 32 minutes raw →
grace rounds to 30 → `halfHourRate` only (not bumped to `hourlyRate`).
63 minutes raw → grace rounds to 60 → exactly `hourlyRate` (not
`hourlyRate + halfHourRate`). 95 minutes raw → grace rounds to 90 →
`hourlyRate + halfHourRate`, correctly following the repeating pattern
from Phase 6.

A session under 30 minutes with no boundary crossed (e.g. 22 minutes)
is untouched by grace — it's not a blanket discount, it only forgives
the small overshoot right after a boundary.

### Done when
A player who played exactly one slab's worth of time and gets checked
out a few minutes late is billed for the slab they actually used, not
bumped into the next one.

---

## Step 4 — Manual end-time selection on session close

### The gap
Right now closing a `GamingSession` defaults `endTime` to the moment
the button is tapped — which, per Step 3's problem, isn't necessarily
when the player actually stopped playing. Grace handles small
unavoidable delays automatically; this step handles the case where
staff know the real stop time and it's more than a trivial gap (e.g. it
was genuinely busy and checkout took 15 minutes).

### Backend change (`gaming-session.service.mjs`)

```
PATCH /tables/:tableId/gaming-sessions/:id/close
      body: { endTime? }   // ISO timestamp, optional — defaults to now() if omitted
      - reject if endTime is before session.startTime
      - reject if endTime is in the future
      - reasonable sanity bound: reject if endTime is more than, say,
        60 minutes before now (confirm this ceiling with the client —
        it exists so a mistaken/very-late entry doesn't wildly
        undercharge a session, while still allowing real short delays)
```

### Frontend
On the "End session" action (Phase 6 Step 2's UI), default to "now" but
let admin/counter staff adjust it — a simple time picker, not a
free-text field, to avoid malformed input.

### Done when
Staff can back-date a session's actual end time within a sane window,
and the estimate shown to them updates live as they adjust it.

---

## Step 5 — A few more worth considering now

### Bill void / credit note, instead of editing a paid bill
Nothing in the current design lets you correct a bill after it's been
generated (wrong item, customer dispute, staff mistake) — and per
standard invoicing practice, a GST-numbered bill **shouldn't be
silently edited** once issued anyway. I added `Bill.voidedAt`,
`voidReason`, `voidedByStaffId` to the schema for this: voiding a bill
marks it rather than deleting or editing it (its invoice number stays
issued and accounted for, just flagged void), and a corrected new bill
gets its own fresh invoice number. Worth confirming with the client
whether voiding should be admin-only (I'd default to yes — this is a
financial-record action, not a routine one).

### Long-running session flag
Same spirit as Phase 9's "order age warning" — a `GamingSession` still
`ACTIVE` past an unusually long duration (say, 3+ hours — confirm what's
actually unusual for this café) gets a visual flag on the table so staff
notice a table that might've been forgotten about, rather than
discovering it at closing time.

### Rate quick-reference for staff
A simple read-only view (maybe just a tooltip/expand on each table
card) showing the table's current effective rate (half-hour, hourly,
any active discount rule) — saves staff from digging into Settings
every time a customer asks "how much is this table an hour."

### What I'd deliberately skip for now
A formal printer-retry queue (tracking failed print jobs and
auto-retrying) is more infrastructure than this café needs — the
existing reprint action (Phase 6 Step 5) already covers the realistic
failure case (staff notices it didn't print, taps reprint). Don't build
the queue unless reprint proves genuinely insufficient in practice.