# External Integrations

**Analysis Date:** 2026-02-09

## APIs & External Services

**Bible Text APIs:**
- Oremus Bible API (`bible-api/src/oremus.ts`) - Provides KJV, NRSV, NRSVAE, BCP, CW, LP versions
  - Client: Custom HTTP requests via `request-html`
  - URL: `https://bible.oremus.org/`
  - No auth required

- ESV Bible API (`bible-api/src/esv.ts`) - English Standard Version text
  - SDK/Client: Custom HTTP requests
  - Auth: Token-based (`Authorization: Token ${API_TOKEN}`)
  - URL: `https://api.esv.org/v3/passage/text/`
  - Requires: ESV_BIBLE_API_TOKEN environment variable

- Bible Gateway (`bible-api/src/bible-gateway.ts`) - Web scraping fallback
  - Client: HTML parsing via node-html-parser
  - URL: `https://www.biblegateway.com/passage/`
  - No direct API, web scraping only

- YouVersion Bible API (`bible-api/src/you-version.ts`) - Mobile Bible app integration
  - Client: Custom web scraping
  - URL: `https://www.bible.com/bible/{bibleNumber}/{bookCode}.{chapter}.{bibleCode}`
  - Reverse-engineered from mobile app

**Hymnary Integration:**
- Hymnary.org (`hymnal-api/src/index.ts`) - Hymn text and sheet music
  - SDK/Client: @venite/hymnal-api (`hymnal-api/package.json`)
  - Implementation: `loadText()` and `loadScore()` functions
  - URL: Hymnary.org indices and content
  - Authentication: None (public data)
  - Access: Via Firebase Cloud Functions endpoints at `/api/hymnary/*`

## Data Storage

**Databases:**
- Firestore (Google Cloud Firestore)
  - Connection: Firebase project configured via `app/firebase.json`
  - Client: @angular/fire (`@angular/fire 6.0.4`) and firebase-admin (backend)
  - Collections used:
    - `Document` - Liturgical documents with sharing permissions
    - `Organization` - User organizations
    - `Users` - User profiles
    - `Preferences` - User preferences and stored preferences
    - `PrayerList` - Prayer list entries
    - `Favorites` - User favorites
    - `LiturgicalWeek` - Calendar week data indexed by kalendar, cycle, week
    - `HolyDay` - Holy days indexed by kalendar, slug, mmdd
  - Emulator: Port 8082 (dev environment via `app/firebase.json`)
  - Access patterns:
    - Angular app: `AngularFirestore` service (`@angular/fire/firestore`)
    - Cloud Functions: `admin.firestore()` from firebase-admin
    - Server: WebSocket-based sync via automerge/OT

**File Storage:**
- Firebase Cloud Storage
  - Rules: `app/storage.rules`
  - Primary use: User-generated documents
  - Client: Firebase SDK
  - Emulator: UI available in Firebase emulator suite

**Caching:**
- Browser cache via HTTP headers - Cloud Functions set `Cache-Control: public, max-age=2592000` (30 days) for Bible and hymnal endpoints
- No external caching service (Redis, Memcached)

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication
  - Implementation: Multi-provider OAuth
  - Methods configured in `app/capacitor.config.json`:
    - Google OAuth (via firebase.auth.GoogleAuthProvider)
    - Twitter OAuth (via firebase.auth.TwitterAuthProvider)
    - Apple Sign-In (via firebase.auth.OAuthProvider("apple.com"))
  - Mobile app: Capacitor Firebase Auth plugin (`capacitor-firebase-auth/alternative`)
  - Web: Direct Firebase SDK integration (`firebase/app` SDK 8.3.1)
  - Token verification: Cloud Functions verify ID tokens via `admin.auth().verifyIdToken()`
  - Environment: Configured in `app/capacitor.config.json` with languageCode: "en", nativeAuth: false
  - Auth files:
    - `app/src/app/auth/auth.service.ts` - Main auth orchestration
    - `app/src/app/auth/edit-avatar/edit-avatar.component.ts` - Avatar management
    - `app/functions/src/index.ts` - Token verification in Cloud Functions

## Monitoring & Observability

**Error Tracking:**
- Firebase Crashlytics (via @capacitor-community/firebase-analytics)
  - Android/iOS crash reporting and analytics
  - Not explicitly configured for web (Angular)
  - Imported in `app/src/app/app.component.ts`

**Logs:**
- Console logging - Standard `console.debug()`, `console.log()`
- Firebase Cloud Functions logs via Firebase Console
- Local development: `firebase functions:log` (see `app/functions/package.json`)
- No centralized logging service (Datadog, Splunk, etc.)

**Analytics:**
- Firebase Analytics
  - Client: @capacitor-community/firebase-analytics 6.0.0
  - Primarily for mobile (iOS/Android via Capacitor)
  - Configured in `app/capacitor.config.json` as CapacitorFirebaseAuth plugin

## CI/CD & Deployment

**Hosting:**
- Firebase Hosting
  - Public directory: `app/www/` (built Angular app)
  - Configuration: `app/firebase.json`
  - Redirects: Legacy API redirects to classic.venite.app (lines 9-29 in firebase.json)
  - Rewrites: SPA routing via index.html rewrite
  - Emulator: Port 5000

**Cloud Functions Deployment:**
- Firebase Cloud Functions
  - Runtime: Node.js 20 (`app/functions/package.json`)
  - Source: `app/functions/`
  - Deploy: `firebase deploy --only functions` (see `app/functions/package.json` scripts)
  - Pre-deploy: Automatic lint and build via predeploy hooks (firebase.json)
  - Emulator: Port 5002
  - Functions exposed:
    - `saveDocument` - HTTP endpoint for document persistence
    - `bible` - HTTP endpoint for Bible text via query params (citation, version)
    - `youVersion` - HTTP endpoint for YouVersion Bible access
    - `hymnText` - HTTP endpoint for hymn text from Hymnary.org
    - `hymnImages` - HTTP endpoint for hymn sheet music
    - `docx` - HTTP endpoint for LDF to DOCX conversion (POST with doc/settings)
    - `calendar` - HTTP endpoint for liturgical calendar data

**Appflow (Ionic):**
- Configuration: `appflow.config.json` - Ionic's cloud build platform
- Used for native app builds and deployments

**CI Pipeline:**
- No explicit GitHub Actions or similar configured
- Firebase predeploy hooks in `app/firebase.json` handle pre-deployment validation
- Local development commands in package.json scripts

## Environment Configuration

**Required env vars:**
- `ESV_BIBLE_API_TOKEN` - For ESV Bible text fetching (if using ESV provider)
- Firebase project credentials - Handled by Firebase SDK configuration
- None explicitly documented; Firebase auto-configures from project

**Secrets location:**
- Firebase project configuration (web API keys in public code OK, service account keys secure)
- No `.env` files in git (standard practice)
- Cloud Functions: Firebase automatically injects service account credentials
- Web app: Uses Firebase project configuration from `firebase.json` (project ID, API key, etc.)
- Local development: Firebase emulators can be used without real credentials

## Webhooks & Callbacks

**Incoming:**
- Cloud Functions HTTP endpoints serve as webhooks:
  - `/api/saveDocument` - Receives document updates with authorization header
  - `/api/bible` - Query-based API for Bible text
  - `/api/youVersion` - Query-based API for YouVersion
  - `/api/hymnText` - Query-based API for hymnal
  - `/api/hymnImages` - Query-based API for hymnal sheet music
  - `/api/docx` - POST endpoint for DOCX generation
  - `/api/calendar` - Query-based API for liturgical calendar
- Legacy API redirects (lines 9-29 in `app/firebase.json`) redirect to classic.venite.app for backward compatibility

**Outgoing:**
- No active outgoing webhooks detected
- Potential future: Sending notifications via Firebase Cloud Messaging (not implemented in current stack)

**WebSocket Connections:**
- Server (`server/package.json`) uses NestJS with @nestjs/websockets and socket.io
- Purpose: Real-time collaborative editing
- Implementation: Automerge CRDT + OT-json0 for conflict-free synchronization
- Emulator: Runs on default NestJS port 3000 (see `server/src/main.ts`)

## Third-Party Libraries & Services

**Icons & Assets:**
- Ion Icons (built into Ionic)

**Fonts & Typography:**
- Standard system fonts (no external font service detected)

**CDN:**
- Firebase Hosting serves as CDN for web app and Cloud Functions

**Payment Processing:**
- None detected

**Email:**
- None detected

**SMS:**
- None detected

---

*Integration audit: 2026-02-09*
