# Phase 24 — Settings Split, Table Status Fix, Vertical Order Layout

## What's in this phase

```
1. Table status fix: gaming-only bills weren't freeing the table
2. Order Tracking Board: stacked (top/bottom), not side-by-side — reverses Phase 21 Step 5
3. Paper-only and screen-based kitchen tracking coexist cleanly
4. Settings split — every setting in its own focused model
5. Customer field bug — expanded, systematic debugging checklist
```

---

## Step 1 — Table status fix: gaming-only bills

### The bug

A table with a `GamingSession` but zero `Order`s — billed and paid —
wasn't freeing the table. The post-billing "does this table have
anything left?" check almost certainly only looked at `Order`s, missed
`GamingSession`s, or checked them separately in a way that didn't cover
the "gaming only, no food" case.

### The fix

One check, always looking at **both**, used everywhere a table's
free/occupied state gets decided (Save Bill, Phase 23 Step 4's
void-triggered reconciliation, anywhere else it comes up):

```js
// table.service.mjs
async function canTableBeFreed(tableId, tx) {
  const [openOrders, activeSessions] = await Promise.all([
    tx.order.count({ where: { tableId, status: "OPEN" } }),
    tx.gamingSession.count({ where: { tableId, status: "ACTIVE" } }),
  ]);
  return openOrders === 0 && activeSessions === 0;
}
```

Call this **one function** from Save Bill (Phase 22 Step 1), from the
void-reconciliation logic (Phase 23 Step 4), and anywhere else a table
status decision is made — never re-implement the check inline in more
than one place, which is almost certainly how this bug happened in the
first place (one path checked orders, another checked sessions, neither
checked both).

### Done when

Billing a table that only had a gaming session (no food/drink orders
at all) correctly frees it, exactly the same as any other fully-settled
table.

---

## Step 2 — Order Tracking Board: stacked, not side-by-side

### Scope correction

This is about the **Order Tracking Board** (Phase 9/18/21's live
Waiting/Cooking/Ready/Served board) — not the order-_placing_ workspace
(Phase 13 Step 2's categories/items/cart layout, which is unaffected by
this step and stays exactly as it was).

### The change — reverses Phase 21 Step 5

Phase 21 Step 5 put kitchen's two primary columns (Waiting, Cooking)
**side by side** to make better use of a landscape screen's width. In
practice, that's not working as well as expected — the request now is
to go back to a **stacked, top/bottom** arrangement instead:

```
WAITING (full width)
─────────────────────────────
COOKING (full width)
─────────────────────────────
Ready · 3   Served · 12  (collapsed strip, tap to expand)
```

Each of the two primary columns gets the full width, stacked instead of
split — this directly supersedes Phase 21 Step 5's layout for the same
screen; the underlying `boardColumnConfig` (which columns are primary
vs. collapsed, per role) doesn't change, just how the primary columns
are arranged on screen.

### Frontend

`OrdersBoard.jsx` renders its primary columns in a vertical stack
rather than a side-by-side grid — likely a better fit if the actual
kitchen device is closer to portrait orientation or a narrower screen
than originally assumed, which would explain why side-by-side ended up
feeling cramped rather than spacious.

### Done when

The Order Tracking Board shows Waiting and Cooking stacked full-width,
one above the other, with Ready/Served still collapsed into the
compact strip beneath — the order-_placing_ workspace elsewhere in the
app is untouched by this change.

---

## Step 3 — Paper-only and screen-based tracking coexist

### Clarifying, not rebuilding

Phase 23 Step 1's `paperOnlyKitchenTracking` only affects one thing: it
skips the _billing_ kitchen-status check. It does **not** hide the
Order Board, disable its action buttons, or prevent anyone from using
it. This is worth stating explicitly since the two modes need to
genuinely coexist:

- **Paper-only café**: kitchen never touches the board, prints are the
  only signal. Billing works regardless of `kitchenStatus` (Step 1's
  setting from Phase 23).
- **Screen-only café**: no kitchen printer configured (`PrinterConfig`
  for `KITCHEN` purpose doesn't exist or is disabled), kitchen
  exclusively uses the Order Board, `kitchenStatus` progresses normally
  and gates billing as originally designed (Phase 17 Step 5).
- **Hybrid**: both active at once — KOTs print _and_ the board gets
  used. Nothing about either system needs to know the other exists;
  they're independent by construction (`KitchenPrintSettings` controls
  printing, `kitchenStatus` tracks board interaction, and
  `paperOnlyKitchenTracking` is the only switch connecting the two, and
  only for the billing gate).

### Done when

All three combinations (paper-only, screen-only, hybrid) work without
any code path assuming only one of them is true.

---

## Step 4 — Settings split: every setting in its own focused model

### The principle

`BusinessProfile` had become a grab-bag — identity fields mixed with
tax rules, payment behavior, order workflow timing, and gaming
config. Same instinct that already split `PrinterConfig` and
`KitchenPrintSettings` out in Phases 20-21, now applied to everything
else that was still piled onto the business profile.

### What moved where

```
BusinessProfile   (identity only, nothing operational)
  businessName, address, phone, email, gstin, fssaiNumber, logoUrl, receiptFooterNote

TaxSettings
  defaultGstPercent, pricesIncludeTax

PaymentSettings
  upiId, upiPayeeName, autoMarkBillsPaidInFull, alwaysSaveAndPrint

OrderSettings
  orderCancellationWindowSeconds

GamingSettings
  gamingGracePeriodMinutes
```

All five are singletons (fetch via `findFirst()`, same pattern as
before) — this is a structural split, not a behavior change. Every
place that read `businessProfile.defaultGstPercent` etc. now reads from
the correct dedicated settings object instead.

### No backlinking issues — verified, not assumed

Nothing in the schema has ever pointed a foreign key _at_
`BusinessProfile` — it's always been a standalone singleton with zero
incoming relations. Splitting its fields into new standalone singleton
models carries no relational risk: no cascade rules to rewrite, no
existing foreign keys to redirect, nothing referencing rows that no
longer exist. This was confirmed by checking the schema before making
the change, not assumed.

### What does need attention: existing data

If your database already has a populated `BusinessProfile` row (real
Cafe Woody's config), this needs a **data migration**, not just a
schema migration — copy the relevant existing values into new rows in
`TaxSettings`, `PaymentSettings`, `OrderSettings`, and `GamingSettings`
before dropping the old columns, or those values are simply lost on
migration.

### Settings screen structure

Update the Settings UI to match — instead of one long Business Profile
form, separate sections/tabs: Business Profile, Tax, Payment, Order
Rules, Gaming Rules — each editing its own model, consistent with how
Printers already got its own section (Phase 20).

### Done when

`BusinessProfile` contains only true identity fields, every other
concern has its own focused model, and the Settings UI mirrors that
same separation rather than one long form.

---

## Step 5 — Customer field bug: expanded debugging checklist

This is the same reported symptom as before (Phase 20 Step 7), now
described more broadly — possibly typing itself isn't registering, not
just selection. Can't fix code I can't see, but here's a more complete
checklist, roughly in the order to check:

1. **Is the input actually a controlled component wired correctly?**
   `value={searchText} onChange={(e) => setSearchText(e.target.value)}`
   — if `value` is set from state but `onChange` is missing, wrongly
   named, or not actually calling the state setter, the field will look
   like it's not accepting input at all (a very common and easy-to-miss
   React bug).
2. **Does selecting a suggestion update the _parent_ component's
   state, not just something local to the dropdown?** If
   `CustomerResolveField` manages its own internal "selected" state but
   never calls a passed-down `onSelect(customer)` prop that the parent
   `BillView` actually listens to, the parent never finds out a
   selection happened — the UI has nothing to reflect because nothing
   upstream changed.
3. **Does anything actually render once a customer is selected?**
   Confirm there's a visible confirmation element (a chip/badge showing
   the selected name+phone with a clear/change action) tied to that
   state — if this UI piece was never built, correctly-updating state
   still wouldn't visibly "reflect" anything.
4. **Is the selected customer's id actually included in the Save Bill
   request** (Phase 22 Step 1's `customerId` field)? Check the actual
   network request payload, not just the UI state — it's possible the
   UI shows a selection correctly but the submit logic never reads it.
5. **Blur-before-click race** (the original diagnosis, Phase 20 Step 7) — still worth checking if 1-4 all look correct: use `onMouseDown`
   instead of `onClick` on suggestion rows, since `onBlur` can close the
   list before a click registers.

Check these roughly in order — 1 and 2 are the more likely root causes
given "doesn't even take the input" as part of the description this
time, not just "selection doesn't work."
