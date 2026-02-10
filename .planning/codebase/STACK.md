# Technology Stack

**Analysis Date:** 2026-02-09

## Languages

**Primary:**
- TypeScript 3.8-4.3 - Used across all modules (app, server, libraries, functions)
- HTML5 - Templates for Angular components and Stencil web components
- SCSS/SASS - Styling in Stencil components and Angular projects
- JavaScript - Runtime for Node.js environments

**Secondary:**
- XML - Firestore rules configuration
- JSON - Configuration and data formats

## Runtime

**Environment:**
- Node.js 20 (Firebase Cloud Functions) - Specified in `app/functions/package.json`
- Browser environment - Ionic/Angular app runs in web and mobile contexts
- Node.js 12+ (General backend support) - Server targets ES2017

**Package Manager:**
- npm 7.6.3+ - Primary package manager
- Lockfile: Present (package-lock.json files)

## Frameworks

**Core Frontend:**
- Angular 12.2.17 - `app/package.json` - Main web framework
- Ionic 6.2.5 - `app/package.json` - Mobile/hybrid framework
- Stencil 2.17.4 - `components/package.json` - Web component library builder

**Backend:**
- NestJS 7.0.9 - `server/package.json` - Server framework for WebSocket-based collaboration
- Firebase Cloud Functions 3.6.1 - `app/functions/package.json` - Serverless functions platform

**Build & Development:**
- Angular CLI 12.2.18 - `app/package.json`
- Capacitor 7.0.0 - `app/package.json` - Native bridge for iOS/Android
- Ionic CLI (via @ionic/angular-toolkit) - `app/package.json`
- TypeScript Compiler (tsc) - Compilation in each module

**Testing:**
- Jest 25-26 - `ldf/`, `bible-api/`, `components/`, `server/package.json`
- Karma 6.4.1 - `app/package.json` - Angular test runner
- Jasmine 3.5 - `app/package.json` - Assertion library for Karma
- Jasmine Core/HTML Reporter - `app/package.json` - Test reporting

**Code Quality:**
- TSLint 6.1.2 - Linting (deprecated, used in legacy setup)
- Prettier 2.0.5 - Code formatting in ldf, bible-api, components
- TypeDoc 0.17+ - Documentation generation for TypeScript

## Key Dependencies

**Critical:**
- @angular/fire 6.0.4 - `app/package.json` - Firebase integration for Angular
- firebase 8.3.1 - `app/package.json` - Firebase SDK for client
- firebase-admin 8.10.0 - `app/functions/package.json` - Firebase Admin SDK
- @venite/ldf 0.21.52 - `app/package.json` - Core Liturgy Document Format library
- @venite/components 0.16.52 - `app/package.json` - Rendering components for LDF
- RxJS 6.5.1 - `app/package.json` - Reactive programming library
- rxjs 6.5.5 - `server/package.json` - Backend reactive library

**Infrastructure & Data:**
- automerge 0.14.0 - `server/package.json` - CRDT library for conflict-free sync
- ot-json0 1.1.0 - `server/package.json` - Operational Transformation library
- ot-json1 1.0.2 - `app/package.json` - Alternative OT implementation

**Mobile & Platform:**
- @capacitor/core 7.0.0 - `app/package.json` - Cross-platform native runtime
- @capacitor/android 7.0.0 - `app/package.json` - Android platform
- @capacitor/ios 7.0.0 - `app/package.json` - iOS platform
- @capacitor-community/firebase-analytics 6.0.0 - `app/package.json` - Analytics plugin
- @capacitor-community/text-to-speech 4.1.0 - `app/package.json` - TTS plugin
- @capacitor-community/keep-awake 7.1.0 - `app/package.json` - Screen wake plugin
- capacitor-firebase-auth 3.0.0 - `app/package.json` - Firebase auth on native

**UI & Presentation:**
- @ionic/core 6.2.5 - `app/package.json` and `components/package.json` - Ionic UI framework
- ngx-translate/core 12.1.2 - `app/package.json` - i18n for Angular
- ngx-translate/http-loader 4.0.0 - `app/package.json` - Translation loading
- ngx-pinch-zoom 2.5.5 - `app/package.json` - Touch zoom functionality
- showdown 1.9.1 - `components/package.json` - Markdown to HTML conversion
- diff-match-patch 1.0.4 - `components/package.json` - Diff/patch utilities

**Document Processing:**
- docx 5.4.0 - `app/functions/package.json` - Word document generation
- @venite/docx 0.2.3-0.2.4 - LDF to DOCX conversion
- node-html-parser 1.2.20 - `bible-api/package.json` - HTML parsing

**Liturgy & Bible Data:**
- @venite/hymnal-api 0.1.2 - `app/package.json` - Hymnal.org integration wrapper
- @venite/bible-api 0.2.9 - `app/functions/package.json`, `app/package.json` - Bible text scraping utilities
- string-similarity 4.0.4 - `ldf/package.json` - String matching for Bible citation parsing

**Media & Plugins:**
- @ionic-native/core 5.29.0 - `app/package.json` - Cordova plugin wrappers
- @ionic-native/media 5.31.1 - `app/package.json` - Audio playback
- @ionic-native/file-opener 5.32.0 - `app/package.json` - File operations
- cordova-plugin-media 5.0.3 - `app/package.json` - Audio plugin
- cordova-plugin-file 7.0.0 - `app/package.json` - File system plugin
- @jofr/capacitor-media-session 4.0.0 - `app/package.json` - Media session control

**Utilities:**
- clipboard-polyfill 3.0.1 - `app/package.json` - Cross-browser clipboard
- json-pointer 0.6.0 - `app/package.json`, `components/package.json` - JSON Pointer RFC 6901
- values.js 1.1.1 - `components/package.json` - Color manipulation
- pleasejs 0.4.2 - `server/package.json` - Color generation

## Configuration

**Environment:**
- Firebase project configuration via `app/firebase.json` - Hosting, Firestore, Cloud Functions, Storage
- Ionic configuration via `app/ionic.config.json` - Ionic build settings
- Capacitor configuration via `app/capacitor.config.json` - Native app configuration
- Appflow configuration via `appflow.config.json` - Build/deployment pipeline
- Environment variables loaded from Firebase/Firestore for secrets
- Node.js 20 engine requirement in Cloud Functions (`app/functions/package.json`)

**Build:**
- `tsconfig.json` files across modules - TypeScript compilation settings
- `tsconfig.build.json` in server - Production build configuration
- `jest.config.js` - Test configuration in multiple modules
- `stencil.config.ts` - Web component build configuration
- `.eslintrc`, `tslint.json` - Legacy linting configuration

## Platform Requirements

**Development:**
- Node.js 20+ (for Cloud Functions)
- npm 7+
- Git
- TypeScript knowledge
- Angular/Ionic development experience

**Production:**
- Firebase (Hosting, Firestore, Cloud Functions, Storage, Authentication)
- Google Cloud infrastructure (Firebase runs on GCP)
- Capacitor for native app deployment
- App Store and Google Play for mobile distribution

---

*Stack analysis: 2026-02-09*
