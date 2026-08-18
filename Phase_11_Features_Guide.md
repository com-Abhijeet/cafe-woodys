# Phase 11 — Settings, GST, Discounts, Export & Reports

This is the phase that makes the app compliant enough to actually hand
an accountant real bills, and gives the owner visibility into how the
business is doing.

## What's in this phase

```
1. Business Profile & Settings screen
2. GST on bills (CGST/SGST breakdown + invoice numbering)
3. Receipt updates (business profile + GST breakdown on the printed bill)
4. Discounts (manual + automatic "happy hour" rules)
5. Bill export by date range
6. Reports & Analytics dashboard
```

---

## Step 1 — Business Profile & Settings

### Concept
One settings screen holding the business's real-world identity — name,
address, GSTIN, FSSAI number, logo, receipt footer note, and the GST
rate itself. `BusinessProfile` is a **singleton** — always exactly one
row, fetched via `findFirst()`, never by a specific known id (don't
hardcode an id anywhere in the app).

### Backend (`backend/src/modules/business-profile/`)

```
GET   /business-profile          fetch the one row (create a default empty one on first request if none exists)
PATCH /business-profile           update it — admin only
```

### Frontend (`frontend/src/features/settings/`)

- Settings screen (under the Sidebar's Settings section, admin-only —
  Phase 9's role visibility rules).
- Form: business name, address, phone, email, GSTIN, FSSAI number, logo
  upload (via Cloudinary, same pattern as Phase 7 Step 7's dish photos),
  receipt footer note, default GST % (used only as a fallback — see
  Step 2 for where the real per-item/per-zone rates get set).
- **`MenuItem.gstPercent` is set on each menu item's own edit form**
  (Phase 6 Step 3's menu item CRUD, extended with a GST % field) — not
  here in Settings, since it's a per-item property, not a business-wide
  one.
- **`Zone.gstPercent` is set on each zone's edit form** (Phase 6 Step
  1's zone CRUD, extended with a GST % field), same reasoning.
- This screen is also the natural home for the `DiscountRule` management
  UI (Step 4) — group them under one "Settings" area with sub-tabs
  (Business Profile / Tax / Discounts) rather than scattering config
  screens across the sidebar.

### Done when
The business's real details are stored once and referenced everywhere
they're needed (receipts, invoices) instead of being hardcoded.

---

## Step 2 — GST on bills (per-item, not business-wide)

### Why this isn't one flat rate

A single business-wide GST % is wrong for Cafe Woody's specifically:
food items can legitimately sit in different GST slabs (prepared food
commonly 5%, packaged/branded items often 12-18%, some items exempt),
and **gaming/amusement services are frequently taxed at a different
rate from food entirely** under Indian GST law. Get the actual correct
rates from the client's accountant per category/zone — don't guess
these, they have real compliance consequences.

### Rate resolution (fallback chain)

```
MenuItem.gstPercent ?? BusinessProfile.defaultGstPercent   (for food/drink items)
Zone.gstPercent ?? BusinessProfile.defaultGstPercent         (for gaming charges)
```

`BusinessProfile.defaultGstPercent` is a **fallback for anything
unset**, not "the rate" — most items should eventually have their own
explicit rate once the client confirms the correct slabs; the fallback
just means the app doesn't break before that data entry happens.

### Snapshotting (same pattern as price/rate snapshots elsewhere)

- `OrderItem.gstPercentSnapshot` — captured from the resolution chain
  above **at the moment the order is placed**.
- `GamingSession.gstPercentSnapshot` — captured **at session start**.

A later change to a menu item's or zone's GST rate must never alter an
already-placed order or an already-running session's tax — exactly the
same reasoning as `priceSnapshot` and the gaming rate snapshots.

### Billing calculation (`billing.service.mjs`)

Tax is computed **per line**, not on the bill's grand total, since
different lines can carry different rates:

```js
function calculateLineTax(taxableAmount, gstPercent) {
  const totalTax = Math.round(taxableAmount * (gstPercent / 100));
  // Split evenly into CGST/SGST — standard for intra-state supply.
  // Inter-state (IGST) is out of scope unless the client actually
  // needs it — a single physical café location almost certainly
  // doesn't, confirm before building IGST handling.
  return { cgst: Math.round(totalTax / 2), sgst: totalTax - Math.round(totalTax / 2) };
}

// At bill generation:
// 1. For each OrderItem: taxable = priceSnapshot * quantity (minus its
//    share of any discount, if discount is applied proportionally —
//    see note below), tax = calculateLineTax(taxable, gstPercentSnapshot)
// 2. For each GamingSession: taxable = calculateSlotCharge(...), tax =
//    calculateLineTax(taxable, gstPercentSnapshot)
// 3. Bill.cgstAmount = sum of all line cgst; Bill.sgstAmount = sum of all line sgst
```

**Discount and multi-rate interaction is a real decision, not a detail
to skip**: if a bill has a ₹50 discount and lines taxed at both 5% and
18%, how is that discount distributed across rate slabs before tax?
Simplest defensible approach — apply the discount proportionally across
all lines by value before computing each line's tax — but confirm this
with the client's accountant rather than assuming, since GST filing
treats this specifically.

### Invoice numbering
Unchanged from the original spec — sequential `Bill.invoiceNumber`,
generated inside the same transaction as bill creation.

```js
// Simple sequential format: CW/<year>/<zero-padded-sequence>
// Sequence resets per financial year if the client's accountant wants
// that convention — confirm before hardcoding calendar-year vs
// financial-year (April-March) reset behavior.
async function generateInvoiceNumber(tx) {
  const year = new Date().getFullYear();
  const count = await tx.bill.count({ where: { invoiceNumber: { startsWith: `CW/${year}/` } } });
  return `CW/${year}/${String(count + 1).padStart(6, '0')}`;
}
```

Generate this **inside the same transaction** as bill creation, using
the count query and insert atomically — two simultaneous bill
generations must not collide on the same invoice number. If you hit
real concurrency issues with this approach at scale, a DB sequence is
the more robust fix, but the count-based approach is fine for a single
café's order volume.

### Done when
A bill with both food (5%) and gaming (say, 18%) lines computes correct
CGST/SGST for each independently, sums to the right total, and a later
rate change never affects historical bills.

---

## Step 3 — Receipt updates

### What the printed receipt now includes
Update `receiptFormatter.js` (Phase 6 Step 5) to pull in:

```
[BusinessProfile.businessName]
[BusinessProfile.address]
[BusinessProfile.phone]
GSTIN: [BusinessProfile.gstin]
Invoice #: [Bill.invoiceNumber]
Date: [Bill.createdAt]
Table: [Table.name]
─────────────────────
[itemized food lines]
[gaming charge line, if any]
─────────────────────
Subtotal: ₹X
Discount: -₹X  ([Bill.discountReason])   <- only shown if discountAmount > 0
CGST: ₹X
SGST: ₹X
Grand Total: ₹X
─────────────────────
Paid via: [payment method(s)]
[BusinessProfile.receiptFooterNote]
```

Since lines can carry different GST rates (food at 5%, gaming at a
different rate, per Step 2), the receipt shows the **summed**
CGST/SGST totals rather than a single rate label — printing "CGST
(2.5%)" as a fixed label would be wrong once rates vary by line. If the
client wants a fully itemized rate-wise breakdown on the receipt (e.g.
"5% GST on ₹500: ₹25" and "18% GST on ₹200: ₹36" as separate lines),
that's a reasonable extension once the multi-rate calculation from Step
2 is working — not required for a first correct version.

If `BusinessProfile.gstin` is empty, omit the GSTIN line entirely
rather than printing a blank field — same for FSSAI if you add it to
the receipt.

### Done when
A printed receipt looks like a real GST invoice, pulling every business
detail from Settings rather than anything hardcoded in the formatter.

---

## Step 4 — Discounts

### Manual discount (always available)
At the billing step (Phase 6 Step 4 / Phase 8 Step 4's billing UI), add
a discount field: amount or percentage (staff picks), plus a **required
reason** when a discount is applied — `Bill.discountReason` should never
be empty when `discountAmount > 0`, so there's always an audit trail for
"why was this bill discounted."

### Automatic "happy hour" rules

`DiscountRule` defines a recurring automatic discount:
- `scope`: whole bill, food only, gaming only, or a specific zone.
- `daysOfWeek` + `startTime`/`endTime`: when it applies (empty
  `daysOfWeek` = every day, null times = all day).
- `type`/`value`: percentage or flat amount off.

### Backend (`backend/src/modules/discount-rule/`)

```
POST/GET/PATCH/DELETE  /discount-rules       admin only
```

At bill-generation time, `billing.service.mjs`:
1. Finds any `DiscountRule` where `isActive = true`, today's day-of-week
   is in `daysOfWeek` (or it's empty), and the current time falls within
   `startTime`/`endTime` (or they're null), matching the bill's
   `scope`.
2. If more than one rule matches, **apply only the single
   highest-value one** — don't stack multiple automatic discounts
   silently, that's a fast way to give away more than intended. Flag to
   the client that this is the chosen behavior (vs. stacking) so it
   matches their expectation.
3. Pre-fill `discountAmount`/`discountReason` from the matching rule,
   but staff can still see and override it before finalizing the bill
   (manual discount UI from above, just pre-populated).

### Frontend (`frontend/src/features/settings/` for rule management,
billing UI for application)

- Discount rule management: list, create/edit form (name, type, value,
  scope, zone picker if scope=ZONE, days-of-week checkboxes, time range).
- Billing screen: shows an auto-applied discount (if any matched) with
  its reason visible and editable, alongside the option to add/adjust a
  manual discount.

### Done when
A configured happy-hour rule automatically discounts matching bills at
the right time/day, staff can see and override it, and every discount
on every bill has a recorded reason.

---

## Step 5 — Bill export by date range

### Backend (`backend/src/modules/bill/` or a small `export` module)

```
GET /bills/export?dateFrom=&dateTo=&format=csv
    - streams a CSV: invoiceNumber, date, table, customer name/phone,
      foodTotal, gamingTotal, discountAmount, cgstAmount, sgstAmount,
      grandTotal, paymentStatus, payment method(s)
    - one row per Bill, in the given date range
```

Use a streaming CSV response rather than building the whole file in
memory if the date range could be large (a full year of bills) — but
for a café this size, a straightforward in-memory CSV build is likely
fine; only reach for streaming if you actually see it get slow.

Same pattern applies to purchases — worth adding
`GET /purchase-orders/export?dateFrom=&dateTo=&format=csv` alongside
this for symmetry, since an accountant will want both sides.

### Frontend (`frontend/src/features/billing/`, `frontend/src/features/purchases/`)

- A date range picker + "Export CSV" button on the Bill History screen
  (Phase 8 Step 5) and the Purchases list (Phase 7 Step 4) — triggers a
  file download of the export endpoint's response.

### Done when
The owner can pick a date range (e.g. "last month") and download a CSV
of every bill (or purchase) in that window, ready to hand to an
accountant.

---

## Step 6 — Reports & Analytics

### Concept
Read-only aggregation views over data that already exists — no new
core schema needed beyond what Phases 6-11 already capture.

### Backend (`backend/src/modules/reports/`)

```
GET /reports/sales-summary?dateFrom=&dateTo=&groupBy=day|week|month
    -> revenue over time, split into foodTotal/gamingTotal/grandTotal per bucket

GET /reports/top-items?dateFrom=&dateTo=&limit=10
    -> best-selling MenuItems by quantity and by revenue, in the range

GET /reports/zone-performance?dateFrom=&dateTo=
    -> revenue and bill count per Zone (café vs. gaming, and per-table
       breakdown within gaming for utilization)

GET /reports/staff-performance?dateFrom=&dateTo=
    -> bills generated and orders taken per Staff member

GET /reports/payment-methods?dateFrom=&dateTo=
    -> breakdown of totals by PaymentMethod (cash/UPI/card/other) — useful for daily cash reconciliation
```

Each of these is a Prisma aggregation/groupBy query — write them in
`reports.repository.mjs`, keep the query logic there rather than
computing aggregates in JS after fetching raw rows (let Postgres do the
grouping/summing).

### Frontend (`frontend/src/features/reports/`)

- Dashboard screen (Sidebar's "Reports" section, admin-only): date range
  picker at the top, applying to every chart below it.
- Sales summary — line/bar chart of revenue over the selected range and
  grouping.
- Top items — simple ranked list, not necessarily a chart.
- Zone performance — comparison of café vs. gaming revenue, and a
  gaming-table utilization view (hours occupied vs. available — useful
  for the client to see which gaming tables are underused).
- Payment method breakdown — pie/bar chart, doubles as a daily cash-up
  reference alongside the Payments page from Phase 8.
- Use `recharts` for charts (already in your frontend toolset) — keep
  each chart reading from its own report endpoint rather than one
  giant "give me everything" endpoint that's slow and wasteful when
  only one chart is visible.

### Done when
The owner can pick a date range and see revenue trends, best-sellers,
zone/table performance, staff activity, and a payment-method breakdown
— all from data that was already being captured, just not previously
surfaced anywhere.