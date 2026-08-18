# Phase 13 — UI/UX Refinement

Based on the actual built screens, here's what's changing. Most of this
is frontend-only; one piece (Close Day) needs the schema change already
made above.

## What's in this phase

```
1. Close Day (end-of-day reset for the live order tracker)
2. Billing as a full-page step, not a separate popup
3. One unified customer field (search or create, same flow)
4. Responsive layout for mobile/small screens
5. Card consistency: equal heights, pinned buttons, no side stripe
6. Plain-language terminology pass (no dev jargon in the UI)
7. Table workspace: tabs instead of two permanently-stacked panels
```

---

## Step 1 — Close Day

### Concept

The live order tracker (internally "Orders Board" — see Step 6 on
naming) accumulates `SERVED` tickets all day. "Close Day" is an
explicit admin action that clears it for the next day, with a safety
check first.

### The schema piece (already added)

`Order.boardClearedAt` — set when an order is cleared off the board.
**This never touches `status` or `kitchenStatus`** — those stay as the
permanent historical record. Close Day only affects what's _visible_ on
the live tracker, never the underlying data.

### Flow

```
POST /orders/close-day
```

1. Check for any `Order` where `status = 'OPEN'` (not yet billed) or
   `kitchenStatus` is not `SERVED` and not cleared.
2. If any exist, **don't close** — return the list (table, item count,
   current status) so the frontend can show a specific warning: "3
   orders are still in progress — Table 4 (Cooking), Table 7
   (Waiting)..." not a vague "are you sure?"
3. Admin sees this list and chooses: go handle them first, or "Close
   Anyway."
4. **On "Close Anyway"**: set `boardClearedAt = now()` on every
   `SERVED` order (the normal case). For orders that were still in an
   earlier stage (abnormal — something got missed), **don't silently
   force them to `SERVED` or `CANCELLED`** — that's a real-world fact
   the app shouldn't guess at. Clear them from the board too
   (`boardClearedAt` set) but leave their `kitchenStatus` exactly as it
   was, flagged for admin follow-up. **Confirm with the client what "or
   other necessary action" should actually mean** — my default (clear
   from the visible board, don't fabricate a status) is the safe
   choice, but they may want something more specific, like
   auto-cancelling unbilled orphaned orders.

### Frontend

- "Close Day" button — admin-only.
- Confirmation view listing exactly what's still open, with a genuine
  "Close Anyway" confirm step, not a single accidental tap.
- After closing, the board is empty, ready for the next day.

### Done when

An admin can close out the day, gets warned with specifics if anything's
still unresolved, and closing never silently rewrites what actually
happened to an order.

---

## Step 2 — Billing as a full-page step

### The change

The table workspace (order-taking) is already a full-screen modal —
good. "Checkout & Generate Bill" should transition **that same
full-screen surface** into a billing view, not pop open a separate,
smaller dialog on top of it. One continuous full-screen experience:
order-taking → billing → payment, not a jarring shift in scale partway
through.

### Frontend

`TableWorkspaceModal` gets an internal view state (`'ordering'` |
`'billing'`) rather than being two separate modal components. Tapping
"Checkout & Generate Bill" switches the view, keeping the same
full-screen container. The billing view shows: itemized breakdown
(food, gaming charge if any, discount, CGST/SGST), the unified customer
field (Step 3), and payment entry — all at full-page scale, matching
the ordering view that came before it.

### Done when

Checkout doesn't feel like a smaller popup interrupting the flow — it's
the natural next full-page step in the same modal.

---

## Step 3 — One unified customer field

### The problem

Search-existing and create-new are currently two different actions.
They should be one.

### The fix

A single input: staff types a name or phone number.

- As they type, it searches existing customers live (debounced) and
  shows matches as selectable suggestions below the field.
- If they tap a suggestion, that customer is attached — done.
- If nothing matches and they finish typing a name and a valid phone
  number, there's no separate "create" button to hunt for — finalizing
  the bill with an unmatched name+phone **is** the create action. One
  flow, not two screens or two buttons for what's conceptually the same
  task.

### Backend

No new endpoint — this composes the existing `GET /customers?search=`
and `POST /customers` (Phase 8 Step 4) into one frontend flow instead
of two separate UI steps.

### Frontend

```
frontend/src/features/customers/components/
  CustomerResolveField.jsx   # the single input: search, suggest, or implicitly create
```

Used in the billing view (Step 2) and anywhere else a customer needs to
be attached to something.

### Done when

Attaching a customer to a bill is one typing motion, whether they're a
returning customer or brand new.

---

## Step 4 — Responsive layout for mobile/small screens

### The problem

The current layout (persistent sidebar, 3-column table workspace, grid
cards) assumes a wide tablet viewport and breaks down on narrower
screens.

### What changes at each breakpoint

- **Sidebar**: collapses to a bottom tab bar (icon + label, the 4-5
  most-used sections) below a certain width, rather than a squeezed
  icon-only sidebar — a bottom bar is the more natural touch pattern on
  a narrow screen.
- **Table/entity grids**: column count reduces with viewport width
  (CSS Grid `auto-fill`/`minmax`, not a hardcoded column count) — 4-5
  columns on a wide tablet, 2 on a narrow tablet, 1 on a phone-width
  screen.
- **Table workspace modal**: the 3-column layout (categories | items |
  cart) **stacks vertically** on narrow screens — categories become a
  horizontal scrolling chip row at the top, items below as a 1-2 column
  grid, and the order tabs (Step 7) become a bottom sheet that can
  expand/collapse rather than a fixed side panel.
- **Reports/charts**: stack vertically, full-width, rather than a
  multi-column dashboard grid.

### Frontend

Define breakpoint values once in `theme.css`
(`--breakpoint-tablet-narrow`, `--breakpoint-phone`), used consistently
— don't let individual components invent their own pixel breakpoints.

### Done when

Every screen built so far is usable — not just technically visible — on
a phone-width viewport, not only on a full-size tablet.

---

## Step 5 — Card consistency: equal heights, pinned buttons, no stripe

### What's actually wrong in the screenshots

Buttons _are_ pinned to the bottom of each individual card already —
but cards in the same row have different heights (a café table card has
no rate line, a gaming table card does), so buttons still don't align
across a row. Pinning within a card isn't enough; cards in a row need
**equal height**.

### The fix

- Use CSS Grid for card grids — Grid gives equal row height across
  siblings by default, which wrapped flexbox doesn't reliably do.
- **Reserve the same structural slots on every card of a given type**,
  even when a value doesn't apply — a café table's card shows a "Rate"
  line too, reading "—" rather than omitting the line entirely.
  Conditionally-omitted content is exactly what causes uneven heights.

### Remove the zone color side-stripe

The colored left-border accent is going away — the zone badge
(Gaming/Café pill, already in the screenshots) is sufficient
distinction on its own. Update `frontend-theme-and-design.md`'s zone
color-coding guidance: zone distinction now lives **only** in the
badge, not a border accent.

### Done when

Every card in a grid row lines up — same height, same button position —
regardless of content, and no card has a colored border stripe.

---

## Step 6 — Plain-language terminology pass

### The rule

The client isn't technical and shouldn't need to be. Nothing
dev-flavored appears anywhere in the UI — not a label, not an empty
state, not an error message.

### Terminology mapping (internal name → what the client sees)

| Internal/dev term                            | Client-facing label                                 |
| -------------------------------------------- | --------------------------------------------------- |
| Orders Board / Kanban Board                  | **Live Orders**                                     |
| `PENDING` / `PREPARING` / `READY` / `SERVED` | Waiting / Cooking / Ready / Served                  |
| `PARTIALLY_PAID`                             | Partially Paid                                      |
| `GAMING_ONLY` (discount scope)               | Gaming charges only                                 |
| Entity / CRUD / endpoint                     | stays out of the UI entirely — code-only vocabulary |
| `ACTIVE` / `CLOSED` (gaming session)         | Playing / Ended                                     |

This isn't exhaustive — it's the pattern. Whenever a raw enum value or
internal name would otherwise leak into a label, badge, or message, it
gets translated, centralized in one place (`frontend/src/lib/labels.js`
— a lookup table from internal value to display text) rather than
re-translated ad hoc in every component.

### Done when

A non-technical person reading any screen never encounters a raw enum,
a dev term, or anything that sounds written for a programmer.

---

## Step 7 — Table workspace: tabs instead of two stacked panels

### The problem

"Current Order Batch" (the cart being built) and "Unbilled Orders
Submitted This Visit" (past submissions) currently both take up
permanent space, competing for room — especially bad on the mobile
layout from Step 4.

### The fix

Two tabs (or an accordion where the active one expands and the other
collapses to a compact summary bar):

- **"Building Order"** — the current cart, quantity steppers, submit
  action. Active by default while browsing the menu.
- **"Order History (This Visit)"** — everything already submitted,
  read-only, with the running subtotal. Switches to active
  automatically right after a submission, then can be tapped back to
  "Building Order" to keep going.

Whichever tab is inactive collapses to a slim summary strip (e.g.
"Order History · 1 order · ₹230.00") rather than disappearing entirely
— staff always sees the total without needing to switch tabs.

### Frontend

```
frontend/src/features/tables/components/
  OrderTabs.jsx    # the two-tab / accordion container, replaces the separate always-visible panels
```

### Done when

Only one of "building" or "history" takes full space at a time, the
other stays visible as a compact summary, and this collapses sanely
into the mobile layout from Step 4.
