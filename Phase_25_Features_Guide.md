# Phase 25 — Customer Loyalty Points

## Your three decisions, and what they drove

- **Earn on food + gaming** (not tax) — the earning calculation is
  scoped to those two totals specifically, tax excluded.
- **Credit only when fully paid** — earning is tied to the payment
  event, not bill generation — which means earning and redeeming
  happen at genuinely different moments in a bill's life (see Step 2).
- **Admin-configurable redemption cap** —
  `LoyaltySettings.maxRedemptionPercentOfBill` is nullable (no cap by
  default) rather than a hardcoded number — strongly worth actually
  setting once live, otherwise a bill could theoretically be reduced
  to ₹0 via points.

## What's in this phase

```
1. Loyalty settings (rate, cap, master on/off)
2. Redemption rules (the "how many points -> how much off" tiers)
3. Earning points — only on full payment
4. Redeeming points — at Save Bill time, not payment time
5. Reversal on void (both earning and redemption undo cleanly)
6. Customer profile: the points table
```

---

## Step 1 — Loyalty settings

### Schema

```
LoyaltySettings (singleton, findFirst())
  isEnabled                    // master switch
  pointsEarnedPerUnit, spendUnitInRupees   // "1 point per ₹10" as two integers, not a fraction
  maxRedemptionPercentOfBill   // nullable = no cap
```

Two integers instead of one decimal rate (`pointsEarnedPerUnit` /
`spendUnitInRupees`) so an admin can type "1 point per ₹10 spent" in
plain terms rather than working out a decimal points-per-rupee value.

### Frontend

Settings gets a new "Loyalty" section (same neighborhood as Tax,
Payment, Order Rules — Phase 24's settings split): the earn rate as two
plain-language number inputs ("Give **[1]** point(s) for every
**[10]** rupees spent"), the master enable toggle, and the redemption
cap — with a visible warning if it's left unset, since that's the
setting most likely to cause an unwanted ₹0 bill if forgotten.

### Done when

The earn rate and redemption cap are both admin-configurable, in plain
terms, with the feature fully off by default until explicitly enabled.

---

## Step 2 — Redemption rules

### Concept

Discrete tiers — "spend 100 points, get ₹50 off" — configured in
advance, not a continuous points-to-rupee slider. Lives in the same
Settings area as `DiscountRule` (Phase 11 Step 4) but is a distinct
model: `DiscountRule` is automatic/time-based, this is a menu of
choices a customer actively redeems against their own balance.

```
LoyaltyRedemptionRule
  pointsRequired, discountType (PERCENTAGE | FLAT), discountValue, isActive
```

### Backend

```
GET/POST/PATCH/DELETE  /loyalty-redemption-rules   admin only
```

### Frontend

A simple list under the Loyalty settings section — name isn't needed
per rule, just the points/discount pairing, e.g. "100 pts -> ₹50 off,"
"250 pts -> 10% off."

### v1 scope, on purpose

**One redemption rule per bill** — a customer redeems against exactly
one qualifying tier, not multiple stacked together. Simpler to reason
about and matches what was actually asked for; revisit only if a real
need for combining tiers shows up in practice.

### Done when

An admin can define any number of point-to-discount tiers, each
independently enabled/disabled.

---

## Step 3 — Earning points (only on full payment)

### Where this hooks in

Not at Save Bill — at the moment `Bill.paymentStatus` actually becomes
`PAID` (Phase 22 Step 1's payment recording, whether that happens
immediately via "always mark paid" or later via a top-up payment on a
previously partial bill).

```js
// payment.service.mjs — after recomputing paymentStatus
async function creditLoyaltyPointsIfEarned(bill, tx) {
  const settings = await getLoyaltySettings(tx);
  if (!settings.isEnabled) return;
  if (bill.paymentStatus !== "PAID") return;
  if (!bill.customerId) return; // can't earn points with no customer attached

  // idempotency: never double-credit if this bill was already fully
  // paid and this check somehow runs again
  const alreadyEarned = await tx.loyaltyTransaction.findFirst({
    where: { billId: bill.id, type: "EARNED" },
  });
  if (alreadyEarned) return;

  const earningBase =
    bill.foodTotal +
    bill.gamingTotal -
    bill.discountAmount -
    bill.loyaltyDiscountAmount;
  const points =
    Math.floor(earningBase / 100 / settings.spendUnitInRupees) *
    settings.pointsEarnedPerUnit;
  // (earningBase is in paise — /100 converts to rupees before applying spendUnitInRupees)

  if (points > 0) {
    await tx.loyaltyTransaction.create({
      data: {
        customerId: bill.customerId,
        billId: bill.id,
        type: "EARNED",
        pointsDelta: points,
      },
    });
  }
}
```

Earning is based on the **net** amount actually paid for food+gaming —
after both the regular discount and any loyalty redemption discount
are subtracted, never the gross pre-discount total. You can't earn
points on money that was never actually charged.

### Done when

Points appear on a customer's balance exactly when their bill crosses
into fully paid, correctly net of any discounts, and never twice for
the same bill.

---

## Step 4 — Redeeming points (at Save Bill, not payment time)

### Why this is a different moment than earning

Redemption needs to be locked in **before** the final total is
computed — it directly changes what's owed. Earning is a reward for
money that's already changed hands; redemption is part of determining
how much money needs to change hands in the first place. Different
purposes, different timing, intentionally.

### Flow

On the unified `BillView` (Phase 21-23), once a customer is attached
(Phase 13 Step 3's resolve field), show their current points balance
(computed live — see Step 6 on why it's never cached) and any
`LoyaltyRedemptionRule`s they currently qualify for, filtered by:

- `pointsRequired <= customer's current balance`
- the resulting discount doesn't exceed `maxRedemptionPercentOfBill`
  (if set) relative to the bill's pre-redemption total

Staff/customer picks one (or none). Applying it, as part of Save Bill:

```js
Bill.loyaltyPointsRedeemed = rule.pointsRequired;
Bill.loyaltyDiscountAmount = calculatedDiscountFromRule;
Bill.loyaltyRedemptionRuleId = rule.id;
```

and creates the deduction immediately:

```js
LoyaltyTransaction.create({
  customerId,
  billId,
  type: "REDEEMED",
  pointsDelta: -rule.pointsRequired,
});
```

— in the **same transaction** as the bill's creation (Phase 22 Step
1's Save Bill transaction), so a failed bill save can't leave points
deducted with no bill to show for it.

### Interaction with tax and the regular discount

`loyaltyDiscountAmount` is subtracted alongside `discountAmount` before
tax, same position in the calculation as the existing discount (Phase
11 Step 2):

```
taxableAmount = foodTotal + gamingTotal - discountAmount - loyaltyDiscountAmount
```

### Done when

Redeeming points immediately reduces the bill total and deducts the
points, at the moment the bill is saved — regardless of how or when
that bill ends up getting paid.

---

## Step 5 — Reversal on void

### The scenario

A bill that already earned points (was `PAID`) or had points redeemed
gets voided for correction (Phase 19). Both effects need to be undone,
or the customer's balance drifts from reality.

```js
// bill.service.mjs — inside the void action
async function reverseLoyaltyOnVoid(bill, tx) {
  const earned = await tx.loyaltyTransaction.findFirst({
    where: { billId: bill.id, type: "EARNED" },
  });
  if (earned) {
    await tx.loyaltyTransaction.create({
      data: {
        customerId: bill.customerId,
        billId: bill.id,
        type: "REVERSED",
        pointsDelta: -earned.pointsDelta,
        note: "Reversed — bill voided",
      },
    });
  }
  if (bill.loyaltyPointsRedeemed > 0) {
    await tx.loyaltyTransaction.create({
      data: {
        customerId: bill.customerId,
        billId: bill.id,
        type: "REVERSED",
        pointsDelta: bill.loyaltyPointsRedeemed,
        note: "Points returned — bill voided",
      },
    });
  }
}
```

### An accepted edge case, not a blocker

If a customer already redeemed points elsewhere between earning them
and the original bill being voided, this reversal could push their
balance negative. That's allowed to happen rather than blocking a
legitimate bill void over a loyalty side-effect — it's rare, and
visible in the points table (Step 6) for an admin to notice and handle
manually if it ever comes up.

### Done when

Voiding a bill that had earned or redeemed points always leaves the
customer's balance exactly where it would be had that bill never
existed — the corrected reissued bill then earns/redeems fresh, on its
own, once it's finalized.

---

## Step 6 — Customer profile: the points table

### Balance is always computed, never cached

Same principle as the Customer Ledger (Phase 10) — no
`Customer.pointsBalance` field. The balance is the sum of every
`LoyaltyTransaction.pointsDelta` for that customer, computed on read:

```
GET /customers/:id/loyalty
    -> { balance: <sum>, transactions: [...] }  // chronological, all types
```

A cached balance field risks drifting from reality if any code path
ever forgets to update it — summing the ledger is always correct by
construction, and at this data volume, computing it live costs nothing
noticeable.

### Frontend

A new **"Loyalty"** tab on the customer profile page, alongside the
existing Ledger tab (Phase 10): current balance prominently at the
top, then the full earned/redeemed/reversed/adjusted history below,
each entry showing what caused it (linked bill, or the manual note for
an `ADJUSTED` entry).

### Manual adjustments

Admin can create an `ADJUSTED` entry directly (goodwill points, or
correcting a genuine error) — always requires a `note`, same principle
as every other place a manual override exists in this app (discount
reasons, void reasons).

### Done when

Opening any customer's profile shows their real-time points balance
and a complete, honest history of everything that changed it.
