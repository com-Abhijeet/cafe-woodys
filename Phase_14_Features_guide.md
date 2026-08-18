# Phase 14 — Capacitor Printing & Performance

Replaces RawBT with a self-contained native printing path via
Capacitor, and covers the performance work needed now that the app is
running across very different devices (a counter Android build, a
kitchen smart-TV browser, and waiters' personal phones).

## What's in this phase

```
1. Capacitor setup — one codebase, two outputs (web + Android)
2. Print Service — isolated, native on counter, absent everywhere else
3. Native ESC/POS printing via an open-source library, not a black-box app
4. Device role matrix
5. Performance optimizations
```

---

## Step 1 — Capacitor setup

### Adding Capacitor to the existing frontend

```bash
cd frontend
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npx cap init "Cafe Woody's" "com.cafewoodys.app"
npm run build              # your normal Vite build, unchanged
npx cap add android
npx cap sync android       # copies the web build into the native shell
```

This does **not** change how the web app is built or deployed — Vercel
deployment stays exactly as it is. `npx cap sync` just copies the same
built output into an Android project that Android Studio can compile
into an APK. Run this sync step after every frontend build you want
reflected in the counter app.

### Detecting which environment you're in

```js
import { Capacitor } from '@capacitor/core';

Capacitor.isNativePlatform(); // true only inside the Android build, false in any browser
```

This one check is what everything else in this phase branches on.

### Done when
The same frontend codebase produces both a Vercel-deployed web app and
an installable Android APK, from one `npm run build`.

---

## Step 2 — Print Service (isolated, resilient)

### The isolation principle
Printing must never be able to crash or hang the rest of the app —
per your ask, and consistent with the existing edge-case rule that
"printing is a side effect of a successful bill, not a precondition."
This gets a dedicated module with a stable public interface, so
everything else in the app only ever talks to one thing:

```
frontend/src/lib/print/
  PrintService.js         # the ONLY thing feature code imports — printReceipt(bill), reprintReceipt(billId)
  nativePrinter.js          # Capacitor plugin calls — only ever invoked when isNativePlatform()
  webFallback.js             # what happens when printing is attempted somewhere it can't work
  receiptFormatter.js         # bill -> formatted receipt text (already spec'd, Phase 6 Step 5)
```

```js
// PrintService.js
export async function printReceipt(bill) {
  const text = formatReceipt(bill);
  if (!Capacitor.isNativePlatform()) {
    return webFallback(text); // see below — not a crash, a clear message
  }
  try {
    await nativePrinter.print(text);
    return { success: true };
  } catch (err) {
    // Never throw out of here. The bill already exists and is valid —
    // a print failure is reported, not propagated as an app error.
    return { success: false, error: err.message };
  }
}
```

### Resilience specifics
- Every native plugin call wrapped in try/catch — nothing propagates as
  an uncaught exception.
- A reasonable client-side timeout (5-8 seconds) around the native call
  — if the printer's unreachable, fail fast with a clear "Printer not
  responding" message rather than hanging the checkout screen.
- Wrap the print-triggering UI in a React error boundary as a second
  layer of protection — even a bug in the print UI itself can't take
  down the surrounding billing screen.
- `printReceipt` is called **after** the bill is already successfully
  created server-side — never blocks bill generation, and a failed
  print always offers "Reprint" (Phase 6 Step 5), not a dead end.

### The web fallback
On any device that isn't the native counter app (kitchen browser,
waiter's phone, or the counter app before it's installed), printing
isn't silently broken — it's explicitly unavailable, and the UI reflects
that: the "Print Bill" action either doesn't render at all outside the
native app, or shows a clear "Printing is only available from the
counter device" message rather than a button that does nothing.

### Done when
A printer being offline, unreachable, or erroring never crashes or
freezes any part of the app — it's always just a failed print with a
retry option, isolated from everything else happening on screen.

---

## Step 3 — Native ESC/POS printing

### Library choice — and why this solves the reliability complaint

Use **`thermal-printer-ionic`** (the actively maintained Capacitor/
Ionic wrapper around `DantSu/ESCPOS-ThermalPrinter-Android`, a
well-established open-source ESC/POS library, not a random unmaintained
package). <cite index="5-1">Printing via TCP is straightforward — you call it with the printer's IP, port, and formatted text, plus success/error callbacks.</cite>

This is fundamentally different from RawBT: **the printing code lives
inside your own app's build**, not a separate third-party app you're
depending on staying installed, configured, and working. If something
breaks, it's your code to debug — no external app's update cycle, no
separate permissions dance, no app-switching UX.

```bash
npm install thermal-printer-ionic
npx cap sync android
```

```js
// nativePrinter.js
import { ThermalPrinter } from 'thermal-printer-ionic';

export function print(formattedText) {
  return new Promise((resolve, reject) => {
    ThermalPrinter.printFormattedText(
      {
        type: 'tcp',
        address: PRINTER_IP,   // from Settings (Phase 11's Business Profile is a natural home for this)
        port: 9100,
        id: 'counter-printer',
        text: formattedText,
      },
      () => resolve(),
      (error) => reject(new Error(error)),
    );
  });
}
```

<cite index="2-1">The AndroidManifest.xml needs BLUETOOTH and INTERNET permissions for TCP, handled automatically by Capacitor's plugin sync</cite> — no manual manifest editing needed for the TCP path specifically.

### Store the printer IP in Settings, not hardcoded
Add a `printerIpAddress` field to `BusinessProfile` (Phase 11) — set
once from the counter device's Settings screen, read by
`nativePrinter.js` at print time. If the printer's IP ever changes
(router reassigns it, printer replaced), it's a Settings edit, not a
code change.

### Done when
The counter app prints directly to the WiFi thermal printer with no
third-party app involved, and a wrong/unreachable printer IP fails
clearly (Step 2) rather than silently.

---

## Step 4 — Device role matrix

| Device | What it runs | Printing |
|---|---|---|
| Counter / Admin | Capacitor Android build (installed APK) | Native, via Step 3 |
| Kitchen display | Any browser (smart TV, mini touchscreen, old tablet, whatever's on hand) | None — kitchen never prints |
| Waiters | Personal phone browser | None — waiters never print |

This is worth stating plainly in your own documentation and to the
client: **only the counter device(s) need the APK installed.**
Everyone else just opens a URL. This keeps onboarding trivial for
waiters (bookmark a link, done) and means the kitchen "device" can
genuinely be whatever screen with a browser is cheapest/most convenient
— no app compatibility to worry about there at all.

### A nice side effect: make the web version installable too
Even without Capacitor, add a web app manifest + service worker (Vite's
PWA plugin) so waiters can "Add to Home Screen" from their browser —
gives them an app-like icon and faster repeat loads with zero
app-store friction, zero permissions beyond a normal website. This
isn't required for anything to function, but it's a nearly-free
improvement to how "installed" the app feels for non-counter devices.

### Done when
A new waiter can start using the app by opening a link on their own
phone — nothing to install, nothing to configure, no printing
capability to worry about since they never need it.

---

## Step 5 — Performance optimizations

Now that devices range from a proper tablet down to a waiter's older
phone and a kitchen smart TV, payload size and render efficiency matter
more than they did on a single reference device.

### Code splitting
Lazy-load feature routes so a kitchen device never downloads
admin-only code (Settings, Reports, Purchases) it'll never use:
```js
const ReportsPage = React.lazy(() => import('./features/reports/ReportsPage'));
```
Wrap route-level lazy imports in `<Suspense>` with a lightweight
loading state — this is the single highest-impact change for the
lower-spec devices in this setup.

### List virtualization
Bills, Payments, and Customers lists (Phase 8) can grow into the
thousands over time — render them with a virtualized list (e.g.
`react-window`) rather than mounting every row's DOM at once, so these
screens stay fast regardless of history size.

### Pagination on list endpoints
Every list endpoint (`/bills`, `/payments`, `/purchase-orders`,
`/customers`, etc.) should support `limit`/`offset` (or cursor-based)
pagination server-side — never return an unbounded result set. Combine
with `FilterBar` (Phase 8) so the common case (recent/filtered results)
stays a small, fast query.

### WebSocket update batching
If several events arrive in quick succession (a busy few seconds of
order activity), batch resulting re-renders with a short buffer window
rather than re-rendering per-event — prevents a burst of WebSocket
messages from causing a visible stutter on lower-spec devices like the
kitchen display.

### Lightweight in-memory caching for rarely-changing data
`BusinessProfile` and `Zone` config change rarely but get read on nearly
every screen (rates, tax settings). Since the backend is an always-on
process (not serverless), a short-TTL in-memory cache (a plain `Map`
with a timestamp, refreshed every minute or on explicit update) cuts a
real number of redundant DB round-trips on hot paths. Keep this simple
— don't reach for Redis at this scale, an in-process cache is enough.

### Done when
The kitchen's smart TV and a waiter's older phone both load quickly and
stay responsive during a busy service, not just the counter tablet
they were probably first tested on.## Step 5 — Performance optimizations

Now that devices range from a proper tablet down to a waiter's older
phone and a kitchen smart TV, payload size and render efficiency matter
more than they did on a single reference device.

### Code splitting
Lazy-load feature routes so a kitchen device never downloads
admin-only code (Settings, Reports, Purchases) it'll never use:
```js
const ReportsPage = React.lazy(() => import('./features/reports/ReportsPage'));
```
Wrap route-level lazy imports in `<Suspense>` with a lightweight
loading state — this is the single highest-impact change for the
lower-spec devices in this setup.

### List virtualization
Bills, Payments, and Customers lists (Phase 8) can grow into the
thousands over time — render them with a virtualized list (e.g.
`react-window`) rather than mounting every row's DOM at once, so these
screens stay fast regardless of history size.

### Pagination on list endpoints
Every list endpoint (`/bills`, `/payments`, `/purchase-orders`,
`/customers`, etc.) should support `limit`/`offset` (or cursor-based)
pagination server-side — never return an unbounded result set. Combine
with `FilterBar` (Phase 8) so the common case (recent/filtered results)
stays a small, fast query.

### WebSocket update batching
If several events arrive in quick succession (a busy few seconds of
order activity), batch resulting re-renders with a short buffer window
rather than re-rendering per-event — prevents a burst of WebSocket
messages from causing a visible stutter on lower-spec devices like the
kitchen display.

### Lightweight in-memory caching for rarely-changing data
`BusinessProfile` and `Zone` config change rarely but get read on nearly
every screen (rates, tax settings). Since the backend is an always-on
process (not serverless), a short-TTL in-memory cache (a plain `Map`
with a timestamp, refreshed every minute or on explicit update) cuts a
real number of redundant DB round-trips on hot paths. Keep this simple
— don't reach for Redis at this scale, an in-process cache is enough.

### Done when
The kitchen's smart TV and a waiter's older phone both load quickly and
stay responsive during a busy service, not just the counter tablet
they were probably first tested on.