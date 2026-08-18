# Phase 15 — Building a Signed Production APK

This app isn't going through the Play Store — it's a private internal
tool, sideloaded onto the counter device(s). That's a simpler path than
a public release: no Play Console, no review process, no app bundle
requirement — just a signed APK you install directly.

Depends on Phase 14 (Capacitor setup + native printing) already being
in place.

## Steps

**1. Point the build at production, not localhost.** Before syncing,
make sure `frontend/.env.production` (or however your Vite env is set
up) has the real Railway backend URL and `wss://` WebSocket URL — the
Capacitor build bakes in whatever `npm run build` produces, so a build
done against a local dev backend will ship that into the APK.

```bash
npm run build
npx cap sync android
```

**2. Generate a signing key — once, ever.** This identifies your app;
you need the _same_ key for every future update, so back this file up
somewhere safe outside the repo (not committed to git) the moment it's
created. Losing it means you can never issue an update under the same
app identity again — you'd have to uninstall and reinstall as a
"different" app.

```bash
keytool -genkey -v -keystore cafewoodys-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias cafewoodys
```

You'll be prompted for a keystore password and some identity details —
keep the password somewhere safe too, you'll need it for every build.

**3. Configure signing in the Android project.** In
`android/app/build.gradle`, add a `signingConfigs` block referencing the
keystore (path, passwords, alias), and point the `release` build type
at it. Android Studio's _Build → Generate Signed Bundle / APK_ wizard
can also do this interactively the first time and writes the config for
you — either way works, the wizard is less error-prone if this is your
first time through it.

**4. Set app identity and version.** In `capacitor.config.json` /
`android/app/build.gradle`:

- `applicationId` — e.g. `com.cafewoodys.app`, set once, never changed
  after the first real install (changing it makes Android treat it as
  a different app).
- `versionCode` — an integer, **incremented on every build** you intend
  to install as an update (Android uses this, not `versionName`, to
  decide if something is a newer version).
- `versionName` — the human-readable version string (e.g. `"1.0.0"`),
  free to set however you like.

**5. Icons and splash screen.** Generate all required Android icon
sizes from one source image rather than hand-editing each density
folder:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

**6. Build the signed release APK:**

```bash
cd android
./gradlew assembleRelease
```

Output lands at
`android/app/build/outputs/apk/release/app-release.apk`. (Android
Studio's _Generate Signed Bundle / APK_ menu does the same thing with a
UI, if you'd rather not use the command line.)

**7. Test the actual release build on the actual counter device**
before calling it done — not just a debug build in an emulator. Confirm:
the app opens and reaches the production backend, the WebSocket
connects, and — the whole point of this phase — a real print goes
through to the real printer over the café's WiFi.

**8. Install it.** Since there's no Play Store involved, transfer the
APK to the tablet directly (USB cable + file manager, or a private
download link) and install it — Android will prompt to allow installs
from that source the first time, which is expected for a sideloaded
app.

**9. Updates.** For a single device, the practical process is: bump
`versionCode`, rebuild, and reinstall the new APK over the old one
(same `applicationId` + same signing key = Android treats it as an
update, keeps app data). No auto-update mechanism is needed at this
scale — don't build one.

## The one thing to burn into memory before Step 2

**Back up the keystore file somewhere outside the repo immediately** —
a password manager, a private cloud folder, wherever — the moment it's
created. If it's ever lost, there's no recovery path, only starting
over with a new app identity and losing the ability to cleanly update
the existing install.
