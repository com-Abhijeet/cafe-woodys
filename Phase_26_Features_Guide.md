# Phase 26 — Daybook, Quick Gaming Charges, Full-Page Ledgers

## What's in this phase

```
1. Daybook page (opening/closing, in/out totals, row-level detail, export)
2. Quick-add gaming charge on the billing screen (no session workflow needed)
3. Shared duration selector — gaming session screen and billing screen
4. Customer/Supplier ledgers become real pages, not modals
5. All Balances screen (every customer/supplier, sortable, at a glance)
```

---

## Step 1 — Daybook

### Why `CashTransaction` had to be added

A daybook that only summed `Payment`/`Refund`/`PurchasePayment` would
be incomplete — real cafés move cash for reasons the billing/purchasing
flow never sees (owner draws, small untracked expenses, float
top-ups). Without a place to record those, the daybook could never
actually reconcile to real cash-in-hand. `CashTransaction` fills that
gap, always with a required reason.

### The one number that can't be computed: the starting point

`DaybookSettings.initialCashBalance` — the cash-in-hand on the day this
app started being used. Everything after that is **computed, never
cached**, same principle as the Loyalty balance (Phase 25) and Customer
Ledger (Phase 10):

```js
// daybook.service.mjs
async function getDaybook(date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const openingBalance = await computeCashPosition(dayStart); // sum of everything before this day, plus initialCashBalance
  const [payments, refunds, purchasePayments, cashTx] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.refund.findMany({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.purchasePayment.findMany({
      where: { paidAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.cashTransaction.findMany({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
  ]);

  const totalIn =
    sum(payments) + sum(cashTx.filter((t) => t.type === "CASH_IN"));
  const totalOut =
    sum(refunds) +
    sum(purchasePayments) +
    sum(cashTx.filter((t) => t.type === "CASH_OUT"));

  return {
    openingBalance,
    totalIn,
    totalOut,
    closingBalance: openingBalance + totalIn - totalOut,
    entries: mergeAndSortChronologically(
      payments,
      refunds,
      purchasePayments,
      cashTx,
    ),
  };
}
```

### Backend

```
GET /daybook?date=YYYY-MM-DD
GET /daybook/export?dateFrom=&dateTo=&format=csv
POST /cash-transactions
     body: { type: 'CASH_IN'|'CASH_OUT', amount, reason }   // admin/counter
```

### Frontend

```
frontend/src/features/daybook/components/
  DaybookPage.jsx
```

Top: opening balance, total in, total out, closing balance — four clear
numbers. Below: a chronological row list (in = green, out = red or
similar visual distinction), each row showing type, amount, and
description (customer/supplier name for billing-related rows, the
reason text for manual `CashTransaction` rows). Date picker at the top,
defaulting to today. Export button using the same CSV pattern as bill
export (Phase 11 Step 5).

A small "+ Add Cash Movement" action for recording a `CashTransaction`
directly from this page — this is the natural place someone would
think to log an owner draw or petty expense.

### Done when

Any day's opening balance, total in, total out, and closing balance are
visible at a glance, backed by every real transaction (billing,
purchasing, and manual cash movements) for that day, with export
available for handing to an accountant.

---

## Step 2 — Quick-add gaming charge on the billing screen

### The gap

Sometimes a gaming charge needs to go on a bill without the full
Start Session → wait → End Session flow — e.g. adding it after the
fact, or a quick manual charge that was never tracked live.

### The design — still creates real `GamingSession` rows

Rather than a separate "flat charge" mechanism that would leave gaming
revenue reporting (Phase 11 Step 6) incomplete, quick-add still
produces genuine `GamingSession` records — it just skips the live
start/stop interaction:

- Staff enters: player count, duration (Step 3's selector), and
  confirms the rate (defaults from the zone/table's config, editable).
- The system creates **one `GamingSession` row per player**
  (consistent with the existing per-player design, Phase 6), each with
  `startTime = now - duration`, `endTime = now`, `status = 'CLOSED'`,
  and the snapshotted rates — computed through the same
  `calculateSlotCharge` (with grace period, Phase 12) as a normally
  tracked session.
- An optional flat-override field lets staff type an exact amount
  instead of relying on the slab calculation, for a genuine one-off
  manual charge — used sparingly, but real cases exist (a manager
  comp'ing a specific amount).

### Backend

```
POST /tables/:tableId/gaming-sessions/quick-add
     body: { playerCount, durationMinutes, flatAmountOverride? }
```

### Frontend

A "+ Add Gaming Charge" action on the billing view (`BillView`, Phase
21-23) alongside the itemized breakdown — opens a small inline form
with the player count, the duration selector (Step 3), and the
computed estimate shown before confirming.

### Done when

A gaming charge can be added directly at billing time without ever
touching the live session start/stop flow, while still producing real,
reportable `GamingSession` data.

---

## Step 3 — Shared duration selector

### One component, two places

- **Ending a session manually** (Phase 12 Step 4) — instead of only
  picking an exact clock time, staff can pick a duration directly
  ("this lasted 45 minutes"), which the system converts to an end time
  (`startTime + duration`).
- **Quick-add gaming charge** (Step 2) — the duration the charge should
  represent.

```
frontend/src/components/ui/
  DurationSelector.jsx   # preset buttons (15/30/45/60/90/120 min) + a custom input for anything else
```

Both contexts use this same component rather than each building their
own time-entry UI — one place to get the interaction right, reused
wherever "how long" needs to be specified.

### Done when

Both the session-end flow and the quick-add flow use the identical
duration-picking interaction.

---

## Step 4 — Customer/Supplier ledgers: full pages, not modals

### The fix

Phase 10's Ledger (customer and supplier) becomes a genuine **route**,
not a tab-in-a-modal — consistent with Phase 8's original principle
that substantial detail views are routes with real navigation, not
overlays:

```
/customers/:id/ledger
/suppliers/:id/ledger
```

Each gets its own export action (CSV, same pattern as Step 1's daybook
export and Phase 11's bill export) — a ledger is exactly the kind of
thing someone wants to hand to an accountant or keep for their own
records.

### Done when

Opening a ledger is a real page with a URL and a back button, not a
popup — and can be exported.

---

## Step 5 — All Balances screen

### Concept

One screen per side (Customers / Suppliers) listing **everyone with a
computed balance**, sortable — "who owes us money" and "who do we owe"
at a glance, rather than checking one profile at a time.

### Backend

```
GET /customers/balances?sort=balance|name
    -> [{ customerId, name, phone, outstandingBalance }, ...]
     // outstandingBalance = totalBilled - totalPaid, same calc as the Ledger (Phase 10)

GET /suppliers/balances?sort=balance|name
    -> [{ supplierId, name, outstandingBalance }, ...]
```

### Frontend

```
frontend/src/features/customers/components/AllBalancesPage.jsx
frontend/src/features/suppliers/components/AllBalancesPage.jsx
```

A list (per the established list-vs-card rule, Phase 13) using
`FilterBar` for sort — by balance (highest first is the useful
default) or name. Each row taps through to that customer/supplier's
full ledger page (Step 4).

### Done when

One screen shows every customer's (or supplier's) outstanding balance
at once, sortable, with a direct path into the detailed ledger for
any of them.
