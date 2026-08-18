# Phase 16 — Tax Mode, Mobile Nav, Branding, Receipt Template, UPI QR, Quick Payment

## What's in this phase

```
1. Inclusive vs exclusive tax pricing (global toggle)
2. Mobile bottom nav fix (less crowded)
3. Developer branding / About section
4. Thermal receipt template — live preview, editable, auto roll-width
5. UPI QR code with embedded amount on bills
6. "Mark paid in full" default, overridable per bill
```

---

## Step 1 — Inclusive vs exclusive tax pricing

### The setting

`BusinessProfile.pricesIncludeTax` — **global, not per-item.** Letting
some menu items be tax-inclusive and others exclusive would make price
entry genuinely confusing for whoever's managing the menu ("does this
number include GST or not?" shouldn't be a per-item question). One
switch for the whole business.

### Calculation change (`billing.service.mjs`)

```js
function calculateLineAmounts(amount, gstPercent, pricesIncludeTax) {
  if (pricesIncludeTax) {
    // amount already contains tax — extract it rather than add it
    const taxableBase = amount / (1 + gstPercent / 100);
    const totalTax = amount - taxableBase;
    return {
      taxableBase: Math.round(taxableBase),
      totalTax: Math.round(totalTax),
      lineTotal: amount,
    };
  }
  // current default behavior — tax added on top
  const totalTax = amount * (gstPercent / 100);
  return {
    taxableBase: amount,
    totalTax: Math.round(totalTax),
    lineTotal: amount + Math.round(totalTax),
  };
}
```

Split `totalTax` into CGST/SGST halves as already spec'd in Phase 11.
This function replaces the tax portion of the per-line calculation from
Phase 11 Step 2 — everything else there (snapshotting, per-line rates,
summing to the bill total) stays the same.

### Frontend

One toggle in Settings (Business Profile screen, Phase 11 Step 1):
"Menu prices include GST" — with a short explanation line so whoever's
setting it up understands what it changes (e.g. "On: your menu prices
are the final price customers pay. Off: GST is added on top of your
menu prices.").

### Done when

Switching the toggle correctly changes how every bill's tax is derived
from the same underlying prices, without needing to re-enter any menu
item.

---

## Step 2 — Mobile bottom nav fix

### The problem

Phase 13's mobile redesign put the _entire_ sidebar into a bottom bar —
too many items, feels cramped on a phone-width screen.

### The fix

Bottom bar shows only the **4 most-used sections** per role (Tables,
Live Orders, Customers, and one role-appropriate 4th — e.g. Payments
for counter/admin, nothing extra for kitchen since they mostly live on
one screen anyway). Everything else moves into a **"More" sheet** — a
5th bottom-bar item that opens the remaining sections as a simple list
(Menu & Recipes, Inventory, Purchases, Reports, Settings, etc.).

```
frontend/src/components/layout/
  BottomNav.jsx        # 4 primary items + "More"
  MoreSheet.jsx          # slide-up sheet listing the rest
```

Which 4 are "primary" should follow the same `sidebarConfig.js`
role-based visibility already established (Phase 9 Step 6) — just a
second, mobile-specific view of the same config, not a separately
maintained list that can drift out of sync.

### Done when

The mobile bottom nav shows a manageable number of items per role, with
everything else one tap away in "More" rather than all crammed into one
row.

---

## Step 3 — Developer branding / About section

### Where this goes

Not plastered across every working screen — that would clutter the UI
you've been deliberately keeping clean. One dedicated spot:

- A small **"About"** entry in Settings (or the "More" sheet on
  mobile), opening a simple screen:

```
Cafe Woody's App

Developed by Kosh Technologies, Jalna
Contact: Abhijeet Shinde
Phone: 9370294078
Email: contact@getkosh.co.in
```

- Optionally, a small unobtrusive single line at the bottom of the
  login screen ("Developed by Kosh Technologies") — low-key, not
  competing with the login form itself.

### Frontend

```
frontend/src/features/settings/components/
  AboutSection.jsx
```

### Done when

The credit is genuinely present and easy to find, without adding visual
noise to the screens staff use all day.

---

## Step 4 — Thermal receipt template: preview, edit, auto roll-width

### Concept

A Settings sub-screen where the actual printed receipt can be previewed
and adjusted before it ever goes to paper — rather than only finding
out what it looks like from a real printout.

### Roll width auto-adjustment

`BusinessProfile.thermalPaperWidth` (58mm or 80mm) drives the character
width used throughout `receiptFormatter.js` — line wrapping for long
item names, the width of divider lines, and center-alignment padding
all derive from this one value rather than being hardcoded:

```js
const CHAR_WIDTH = { MM_58: 32, MM_80: 48 }; // confirm against the
// actual printer's spec sheet during Phase 15 testing — these are
// common defaults for standard font, not guaranteed for every model
```

### What's editable vs. what's a live preview

This is a **live preview of existing settings**, not a freeform
drag-and-drop template builder — scoping it that way keeps this
buildable in a reasonable amount of time and covers what actually
varies:

- Roll width selector (Step's core addition).
- Everything already in `BusinessProfile` (Phase 11 Step 1: business
  name, address, GSTIN, footer note, etc.) — editing any of these
  updates the preview live.
- The preview renders using a real sample bill (dummy data) through the
  actual `receiptFormatter.js`, in a monospace, roll-width-constrained
  panel — what you see is genuinely what will print, not an
  approximation.

If the client wants deeper customization later (reordering sections,
toggling specific line items on/off) that's a real scope increase
worth its own phase — don't build a generic template engine
speculatively now.

### Frontend

```
frontend/src/features/settings/components/
  ReceiptPreview.jsx    # renders receiptFormatter output live as settings change
```

### Done when

Changing any receipt-related setting (business info, footer note, roll
width) shows an accurate live preview, and switching roll width
visibly re-wraps the preview correctly.

---

## Step 5 — UPI QR code with embedded amount

### Concept

A QR code on the bill that already has the exact amount filled in —
customer scans, their UPI app opens with the payee and amount
pre-populated, no manual entry.

### UPI deep-link format

```
upi://pay?pa=<upiId>&pn=<upiPayeeName>&am=<amount>&cu=INR&tn=<note>
```

Built from `BusinessProfile.upiId` / `upiPayeeName` (Step 1's schema
addition) and the bill's `grandTotal` (or remaining balance, if
partially paid).

### Generating the QR

```bash
npm install qrcode
```

```js
import QRCode from "qrcode";
const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${(amountPaise / 100).toFixed(2)}&cu=INR`;
const qrDataUrl = await QRCode.toDataURL(upiUri); // for on-screen display in the app
```

### On the printed receipt

Thermal printers commonly support printing QR codes natively via
ESC/POS commands — check whether `thermal-printer-ionic` (Phase 14)
exposes a direct QR-printing call or an image-printing call and use
whichever it provides, rather than assuming a specific method name
without confirming against the library's actual API during
implementation.

### On-screen

Also show the same QR in the app's bill detail view (Phase 8 Step 5) —
useful if a customer wants to pay by scanning the tablet screen
directly rather than waiting for a printout.

### Done when

Every bill's printed receipt and on-screen detail view carries a QR
code that opens the customer's UPI app with the exact amount already
filled in.

---

## Step 6 — "Mark paid in full" default, with per-bill override

### The setting

`BusinessProfile.autoMarkBillsPaidInFull` — when on, generating a bill
skips the separate "record payment" step for the common case (customer
pays the full amount immediately): staff pick a payment method, one
`Payment` row for the full `grandTotal` is created automatically, and
`paymentStatus` is immediately `PAID`.

### The override

A visible toggle on the billing screen — **"Record payment
differently"** or similar — switches back to the normal split/partial
payment flow (Phase 8's `FilterBar`-driven Payments, Phase 6's
multi-payment support) for the specific bill that needs it, e.g. a
regular customer running a tab who isn't paying in full right now.

### Frontend

On the billing view (Phase 13 Step 2's full-page billing step):

- If `autoMarkBillsPaidInFull` is on: default view is "Paid in full —
  select method" (one tap: Cash/UPI/Card), with the override toggle
  visible but not selected.
- If off: normal payment entry flow, unchanged from Phase 8.

### A useful companion, low-cost to add alongside this

A **bulk "Mark as Paid" action** on the Bill History list (Phase 8 Step
5, admin-only) for cleaning up old `UNPAID`/`PARTIALLY_PAID` bills in
one action — different from the per-bill default above (this is a
manual reconciliation tool, not an automatic behavior), but uses the
same underlying payment-recording logic, so it's a small addition once
Step 6's core is built.

### Done when

With the setting on, closing a typical bill is a two-tap flow (generate
bill → pick payment method), while a tab customer's bill can still be
handled with full partial-payment flexibility via the override.
