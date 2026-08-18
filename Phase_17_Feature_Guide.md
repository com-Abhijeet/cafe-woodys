# Phase 17 — Native Android Integrations

Everything here only applies to the counter/admin Capacitor build
(Phase 14) — kitchen and waiter devices stay plain browser and are
unaffected by any of this.

## What's in this phase

```
1. Camera capture for menu item photos (camera + gallery, one picker)
2. Essential native integrations (back button, resume-refresh, keyboard)
3. Polish integrations (haptics, splash/status bar branding, network status)
4. Push notifications — bigger, optional, scoped separately
5. Kitchen status check before bill generation
6. Split "Generate Bill" into View Bill (preview) / Generate Bill (commit)
```

---

## Step 1 — Camera capture for menu item photos

### The good news

`@capacitor/camera`'s `CameraSource.Prompt` mode already gives you
"both" for free — it shows a native action sheet letting the user pick
Camera or Photo Library, rather than you needing to build two separate
buttons.

```bash
npm install @capacitor/camera
npx cap sync android
```

```js
// lib/media/pickMenuItemPhoto.js
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";

export async function pickMenuItemPhoto() {
  if (!Capacitor.isNativePlatform()) {
    return null; // web build falls through to the existing <input type="file"> flow, Phase 7 Step 7 — unchanged
  }
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt, // shows "Camera" / "Photo Library" choice natively
    quality: 80,
  });
  return photo;
}
```

### Upload flow stays the same either way

Whichever path produces the image (native camera/gallery or the web
file input), it still goes through the same Cloudinary upload endpoint
from Phase 7 Step 7 — this step only changes _how the image gets
picked_, not what happens to it afterward.

### Frontend

The menu item edit form's image field checks
`Capacitor.isNativePlatform()` and renders either the native picker
button or the existing web file input — one component, one branch, not
two separate flows to maintain.

### Done when

On the counter app, adding a menu item photo can go straight from the
café's camera in one tap, with gallery selection available in the same
prompt; the web version keeps working exactly as before.

---

## Step 2 — Essential native integrations

These aren't optional polish — a Capacitor app that skips these tends
to feel broken in small but annoying ways.

### Android back button

Without explicit handling, the hardware/gesture back button can exit
the app unexpectedly instead of navigating back within it — a real
usability problem for a counter device someone's using all day.

```bash
npm install @capacitor/app
```

```js
import { App } from "@capacitor/app";

App.addListener("backButton", ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back(); // let your router handle it
  } else {
    App.exitApp(); // only exit from a true root screen
  }
});
```

### Refresh on resume

When the app comes back to the foreground after being backgrounded,
data can be stale — re-fetch or reconnect the WebSocket on resume
rather than trusting whatever was last held in memory.

```js
App.addListener("appStateChange", ({ isActive }) => {
  if (isActive) {
    reconnectWebSocket(); // ties into the existing reconnect-resync rule from the backend edge-case rules
    refetchCurrentScreenData();
  }
});
```

### Keyboard handling

On forms with several inputs (billing screen, menu item edit), make
sure the on-screen keyboard resizes the view rather than covering the
active field:

```bash
npm install @capacitor/keyboard
```

Configure resize behavior so an input field being edited stays visible
above the keyboard.

### Done when

The back button behaves predictably, data refreshes correctly after
switching away and back, and no input field ever gets hidden behind the
keyboard.

---

## Step 3 — Polish integrations

Smaller, genuinely nice, low-effort additions:

- **Haptics** (`@capacitor/haptics`) — a brief tactile buzz on key
  confirmations (bill generated, payment recorded, order submitted).
  Cheap to add, makes the app feel more responsive on a touchscreen.
- **Splash screen & status bar branding** (`@capacitor/splash-screen`,
  `@capacitor/status-bar`) — use the actual Cafe Woody's branding for
  the launch splash and set the status bar color to match the app's
  theme (`--color-brand` from `theme.css`) rather than leaving Android
  defaults.
- **Native network status** (`@capacitor/network`) — more reliable
  connectivity detection than the browser's `navigator.onLine` in some
  Android WebView configurations; feeds the existing offline/
  reconnecting indicator (already required by the backend edge-case
  rules) with a more trustworthy signal on the native build.

### Done when

The app launches with real branding, gives tactile feedback on key
actions, and its connectivity indicator is driven by native status
rather than a less reliable browser API.

---

## Step 4 — Push notifications (bigger, optional — scope this separately)

### Worth being honest about the actual benefit here

Your existing in-app notification system (Phase 9) already covers new-
order and order-ready alerts — but that system reaches **kitchen and
waiter devices**, which are plain browsers, not the Capacitor app. Push
notifications would only benefit the counter/admin device specifically,
for the case where that device is genuinely backgrounded or the screen
is off. That's a real but narrower win than it might first sound like —
worth deciding if it's worth the setup cost before committing.

### What it actually requires

- A Firebase project (Firebase Cloud Messaging) — new external
  dependency and account to manage.
- `@capacitor/push-notifications`, plus device token registration:
  each installed device registers a token, which the backend needs to
  store (a small new table — e.g. `StaffDeviceToken(staffId, token,
platform)` — only worth adding if you commit to building this).
- Backend sends pushes via the Firebase Admin SDK when relevant events
  fire (new order, order ready), in addition to the existing WebSocket
  broadcast — two delivery paths for the same events, more moving parts
  to keep in sync.

### Recommendation

Given the actual reach (admin/counter only, and only helps when that
one device is backgrounded), I'd hold off unless you specifically hit
this as a real problem in practice — it's meaningfully more
infrastructure for a fairly narrow benefit. If the counter device really
is left backgrounded often enough to matter, this is the right fix —
just not a default "add it because we can" addition.

### Done when (if you proceed)

A new order or ready-status change reaches the counter device as a
real Android notification even when the app is backgrounded, with
device tokens correctly registered and cleaned up when a staff member
logs out or a device is retired.

---

## Step 5 — Kitchen status check before bill generation

### The gap

Right now generating a bill clears the table without checking whether
the kitchen has actually finished — an order still `PENDING`,
`PREPARING`, or `READY` (not yet `SERVED`) could get billed away and
the table cleared while food is still being made or waiting to be
carried out. That's a real service problem, not just a data-integrity
one.

### The check

Runs when "Generate Bill" (Step 6) is pressed — **not** on "View Bill,"
since viewing is non-destructive and shouldn't be gated on anything.

```js
// billing.service.mjs — same pattern as Phase 13's Close Day check
async function checkKitchenStatusBeforeBilling(tableId, tx) {
  const unfinished = await tx.order.findMany({
    where: { tableId, status: "OPEN", kitchenStatus: { not: "SERVED" } },
  });
  return unfinished; // empty array = clear to bill
}
```

If `unfinished` isn't empty, **don't silently proceed** — return the
specifics (which items, current status: Waiting/Cooking/Ready) so the
UI can show exactly what's still outstanding, then let staff choose:
go back and wait, or "Generate Anyway" (a genuine confirm step, not a
default). Same warn-with-specifics-then-override pattern as Close Day
— consistent behavior across the app rather than a new pattern for
this one case. If you'd rather this be a hard block with no override
at all, that's a legitimate alternative — flag it, since I defaulted
to override-allowed for flexibility (e.g. a customer paying for what's
ready and leaving before a slow item finishes) rather than assuming a
hard stop is always correct.

### Done when

Generating a bill for a table with unfinished kitchen orders always
surfaces a specific warning first, never silently clears the table out
from under an order still being cooked.

---

## Step 6 — Split "Generate Bill" into View Bill / Generate Bill

### The problem

The current single button both computes _and_ commits (creates the
`Bill`, marks orders `BILLED`, clears the table) in one tap — too much
riding on one irreversible action, and it means just wanting to _look_
at the total carries the same weight as actually closing the table out.

### The fix — two distinct actions

**"View Bill"** (replaces the old "Checkout & Generate Bill" button)
transitions the table workspace modal into the billing view (Phase 13
Step 2) and calls a **read-only preview** — nothing is persisted,
nothing is checked or locked, completely safe to tap and back out of:

```
GET /tables/:tableId/bill-preview
    -> same calculation as bill generation (food/gaming totals,
       CGST/SGST, any auto-discount) but creates nothing — no Bill row,
       no status changes on Orders/GamingSessions/Table
```

**"Generate Bill"** — a distinct button _inside_ the billing view,
which is the actual commit:

1. Runs Step 5's kitchen-status check.
2. If clear (or overridden), calls the existing commit endpoint
   (`POST /tables/:tableId/bill`) — creates the `Bill`, links orders/
   sessions, marks them `BILLED`/`CLOSED`, transitions the table per
   the status-protection rules already in place (Phase 12 Step 2).

### One detail worth being careful about

If staff views the bill, goes back to add another item, then presses
"Generate Bill" — **always recompute fresh from the current `OPEN`
orders at commit time**, never trust whatever the preview showed
earlier. The preview is a convenience snapshot, not a cached value the
commit step should reuse.

### Frontend

```
frontend/src/features/tables/components/
  TableWorkspaceModal.jsx   # 'ordering' | 'billing' view state, unchanged structurally from Phase 13
  BillPreview.jsx             # renders the read-only preview, "Generate Bill" action lives here
```

### Done when

Opening the billing view never commits anything by itself — only the
explicit "Generate Bill" action inside it does, and that action always
checks kitchen status first.
