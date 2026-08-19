# Phase 19 — Order & Bill Correction Workflow

Handles staff mistakes at every stage: before a bill exists, after a
bill exists but nothing's paid, and after money has already changed
hands. Different stakes, different fixes — never one generic "edit"
button.

## What's in this phase

```
1. Item-level void on an in-progress order (before kitchen starts cooking)
2. Void + reissue for a generated, unpaid bill
3. Void + reissue + refund/additional-payment for a paid bill
4. Permissions: who can do what, at which stage
5. Where all this is visible (bill detail, audit trail)
```

---

## Step 1 — Item-level void on an in-progress order

### When this applies

A mistake caught in an already-submitted `Order` (not the current
cart — that's just editable normally before submit), while the
kitchen hasn't started on it yet.

### The rule

An `OrderItem` can be voided **only while its parent `Order`'s
`kitchenStatus` is still `PENDING`.** Once kitchen has moved it to
`PREPARING` or beyond, this path is closed — see Step 2/3 for
corrections after that point (which may also involve
`InventoryAdjustment` with reason `WASTAGE` if food was actually
started, Phase 7).

```
PATCH /order-items/:id/void
      body: { reason }   // required, non-empty
      - 409 if the parent order's kitchenStatus is not PENDING
      - sets voidedAt, voidReason, voidedByStaffId
      - voided items are excluded from: the kitchen board (Phase 9),
        the running order total (Phase 13's tab/history view), and the
        eventual bill calculation
```

This is a different, complementary action from the existing
time-limited quick-undo (Phase 9 Step 7 /
`orderCancellationWindowSeconds`, Phase 18) — the quick-undo is for an
immediate "wrong button" tap, no reason required, short window. Item
void is available for as long as `kitchenStatus` stays `PENDING`
(which could be longer or shorter than the undo window), always
requires a reason, and is logged per-item rather than voiding an
entire order for one wrong line.

### Frontend

On the order-taking view (Phase 13 Step 2) or the submitted-orders tab
(Step 7 of the same phase), each already-submitted item gets a "Void"
action with a required reason field — visually distinct from just
removing an item from the still-being-built cart.

### Done when

A wrong item caught before the kitchen has touched it can be voided
individually, with a reason, without needing to cancel the whole
order.

---

## Step 2 — Void + reissue for an unpaid generated bill

### When this applies

A `Bill` exists (has an invoice number) but `paymentStatus = UNPAID` —
no money has moved yet, but per the "never edit an issued invoice"
principle (Phase 12), the fix is still void + reissue, not a live edit.

### Flow

```
PATCH /bills/:id/void
      body: { reason }   // required
      - only allowed if paymentStatus === 'UNPAID'  (see Step 3 for paid bills)
      - sets voidedAt, voidReason, voidedByStaffId
      - unlinks the bill's Orders/GamingSessions (billId -> null, status back to OPEN/ACTIVE as appropriate) so they're billable again
```

Staff then corrects the order (Step 1's item void, or adds/removes
items on the now-reopened `Order`), and runs the normal View Bill →
Generate Bill flow (Phase 17 Step 6) again. The new bill gets a fresh
`invoiceNumber` and sets `correctionOfBillId` pointing at the voided
one, so the two are traceably linked.

### Permission

Lower stakes than a paid bill — reasonable to allow **counter staff**,
not just admin, since no cash reconciliation is involved yet (see Step
4 for the full permission table).

### Done when

An unpaid bill with a mistake can be voided and cleanly replaced, with
the new bill's invoice number linked back to what it corrected.

---

## Step 3 — Void + reissue + reconcile for a paid bill

### When this applies

The real case — a bill was generated, payment was recorded
(`PARTIALLY_PAID` or `PAID`), and _then_ a mistake surfaces.

### Flow

```
PATCH /bills/:id/void
      body: { reason }   // required
      - allowed regardless of paymentStatus
      - existing Payment rows STAY exactly as they are, attached to
        the voided bill — this is the historical record of what was
        actually collected, never modified or deleted
      - unlinks Orders/GamingSessions as in Step 2, billable again
```

Staff corrects the order, generates the new bill (fresh
`invoiceNumber`, `correctionOfBillId` set). The system then shows the
**explicit reconciliation step** — comparing what was already
collected (sum of the voided bill's `Payment`s) against the new bill's
`grandTotal`:

- **New total is lower** → record a `Refund` against the _original_
  (voided) bill: amount, reason, method, which staff member processed
  it. This is a deliberate action a staff member performs — the system
  shows the suggested amount (difference) but doesn't create the
  `Refund` row automatically without someone confirming it actually
  happened.
- **New total is higher** → record an additional `Payment` on the
  _new_ bill for the difference — same payment-recording flow already
  built (Phase 6/8), just pre-filled with the shortfall amount.
- **Totals match** → nothing further needed; the correction was purely
  about _what_ was billed, not the amount.

### Why refunds live on the original bill, not the new one

A `Refund` is money returning against what was actually collected —
that transaction happened on the original bill, so that's where its
record belongs. The new bill's own `Payment` records reflect what's
actually owed and paid on the corrected version. Together, the two
bills plus their payments/refunds give a complete, honest trail of
what really happened financially — nothing hidden, nothing silently
adjusted.

### Frontend

Bill detail view (Phase 8 Step 5) gets a "Void & Correct" action
(paid-bill version), which after the new bill is generated shows a
clear reconciliation panel: "Originally collected: ₹500. Corrected
total: ₹450. Refund ₹50 to customer" — with the refund-recording form
right there, not a separate screen to hunt for.

### Done when

A paid bill with a mistake can be voided, corrected, and reissued, with
the resulting refund or additional payment explicitly recorded by a
staff member — never auto-applied without a person confirming what
actually happened with the cash.

---

## Step 4 — Permissions

| Action                         | Who                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Void an `OrderItem` (Step 1)   | Any role that can take orders (waiter, counter, admin)                                               |
| Void an unpaid `Bill` (Step 2) | Counter, admin                                                                                       |
| Void a paid `Bill` (Step 3)    | **Admin only** — this is a real financial-control action, involves reconciling actual money movement |
| Record a `Refund`              | Admin only, same reasoning                                                                           |

This is a default worth confirming with the client rather than treating
as settled — some café owners will want counter staff able to handle
same-day, small corrections themselves without needing an admin
present; others will want every void gated through them personally.
Easy to adjust either way since it's just a `requireRole()` check per
action, not a structural decision.

---

## Step 5 — Visibility and audit trail

### On the bill detail view

- A voided bill clearly shows its status (voided, reason, who, when)
  and, if corrected, a direct link to the bill that replaced it.
- A corrected bill shows a direct link back to the original it
  replaced.
- Any `Refund`s tied to a bill are listed alongside its `Payment`s, not
  hidden in a separate area.

### In Reports (Phase 11 Step 6)

Voided bills and refunds should be **excluded from revenue totals**
(they were never real, final revenue) but the _count_ of void/
correction events is worth surfacing somewhere admin-visible — a
café doing an unusually high number of corrections is a signal worth
noticing, not something to bury.

### Done when

Anyone looking at a bill's history can see its full correction
lineage — what it replaced, what replaced it, and every payment/refund
involved — without needing to piece it together from separate screens.
