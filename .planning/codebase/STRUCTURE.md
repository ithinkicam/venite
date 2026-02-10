# Codebase Structure

**Analysis Date:** 2026-02-09

## Directory Layout

```
venite/
├── app/                              # Main Ionic Angular application
│   ├── src/
│   │   ├── app/                      # Feature modules and pages
│   │   ├── assets/                   # Static assets (images, media)
│   │   ├── environments/             # Configuration for dev/prod
│   │   ├── main.ts                   # Application entry point
│   │   └── index.html                # Root HTML template
│   ├── projects/                     # Angular library packages
│   │   ├── service-api/              # Service interface definitions
│   │   ├── pray/                     # Prayer display library
│   │   ├── pray-menu/                # Menu component library
│   │   ├── darkmode/                 # Dark mode service
│   │   ├── platform/                 # Platform service
│   │   ├── reminders/                # Reminders feature
│   │   └── localstorage/             # Local storage service
│   └── package.json                  # Application dependencies
├── ldf/                              # Liturgical Document Format (domain model)
│   ├── src/
│   │   ├── liturgy/                  # Liturgy and compilation logic
│   │   ├── calendar/                 # Liturgical calendar (day, colors, etc.)
│   │   ├── bible-reading/            # Bible reading classes
│   │   ├── psalm/                    # Psalm and canticle classes
│   │   ├── citation/                 # Citation and source references
│   │   ├── responsive-prayer.ts      # Responsive prayer line classes
│   │   ├── heading.ts                # Heading document type
│   │   ├── meditation.ts             # Meditation document type
│   │   ├── image.ts                  # Image document type
│   │   ├── condition.ts              # Condition evaluation logic
│   │   ├── liturgical-document.ts    # Base document class (central)
│   │   └── index.ts                  # Public API exports
│   └── tests/                        # LDF unit tests
├── components/                       # Reusable Stencil web components
│   └── src/
│       ├── components/               # Custom element implementations
│       │   ├── psalm/
│       │   ├── bible-reading/
│       │   ├── responsive-prayer/
│       │   ├── text/
│       │   ├── heading/
│       │   ├── option/
│       │   ├── editable-text/        # Collaborative editing
│       │   └── ...
│       ├── utils/                    # Utility functions
│       ├── interfaces/               # Component interfaces
│       └── index.ts                  # Component exports
├── server/                           # NestJS backend server
│   └── src/
│       ├── main.ts                   # Server entry point
│       ├── app.module.ts             # Root NestJS module
│       └── editor/                   # Collaborative editing module
├── adapter/                          # Data format adapters
│   └── src/
│       ├── venite1.ts                # Convert Venite v1 → LDF
│       └── index.ts
├── html/                             # LDF → HTML conversion
│   └── src/
│       ├── index.ts                  # Main render function
│       ├── psalm.ts                  # Psalm HTML rendering
│       ├── bible-reading.ts
│       ├── heading.ts
│       ├── responsive-prayer.ts
│       └── style.css
├── docx/                             # LDF → DOCX conversion
│   └── src/
│       ├── index.ts                  # Main DOCX generation
│       └── ...
├── bible-api/                        # Bible translation API client
│   └── src/
│       └── index.ts
├── hymnal-api/                       # Hymnal/music API client
│   └── index.ts
├── commonprayer/                     # Common Prayer utilities
├── angular/                          # Angular utilities library
├── http/                             # HTTP utilities
├── ldf-docs/                         # LDF specification docs
├── liturgy_backups/                  # Data backups/seed data
└── .planning/
    └── codebase/                     # Generated documentation
```

## Directory Purposes

**app/src/app/:**
- Purpose: Feature modules organized by domain (pray, bulletins, editor, favorites, etc.)
- Contains: Pages, route modules, services, and component-level code
- Key structure:
  - Each feature is a lazy-loaded module with routing
  - `shared/` contains reusable components (menu, auth button, etc.)
  - `services/` contains app-level services (Bible, Calendar, Document, etc.)
  - `auth/` handles authentication flows
  - Guards: `login.guard.ts` protects routes requiring authentication

**ldf/src/:**
- Purpose: Core domain model - TypeScript classes representing liturgical documents
- Contains: Type definitions, class implementations, enums, and utilities
- Critical files:
  - `liturgical-document.ts`: Base class for all document types
  - `liturgy/liturgy.ts`: Represents compilable liturgy templates
  - `calendar/liturgical-day.ts`: Represents a specific day in the liturgical year
  - `condition.ts`: Evaluates whether documents should be included
  - `preference.ts`: Configuration points for compilation
  - Type definitions for all document kinds (Heading, Text, Option, Rubric, etc.)

**components/src/components/:**
- Purpose: Reusable Stencil web components for rendering documents
- Contains: Custom element implementations that can be embedded in any HTML
- Each component:
  - Handles its own rendering logic
  - Accepts document data via properties
  - Manages responsive behavior and display options
  - Components include: psalm, bible-reading, responsive-prayer, text, heading, editable-text, etc.

**app/projects/service-api/:**
- Purpose: Shared service interface contracts for dependency injection
- Contains:
  - `*-service.interface.ts`: Defines service contracts without implementation
  - `injection-tokens.ts`: DI tokens (e.g., `DOCUMENT_SERVICE`, `BIBLE_SERVICE`)
  - Consumed by: All service implementations to ensure consistent contracts

**app/src/app/services/:**
- Purpose: Application-level service implementations
- Contains:
  - `document.service.ts`: Fetches liturgical documents (Firestore + offline cache)
  - `bible.service.ts`: Manages Bible translation fetching
  - `calendar.service.ts`: Liturgical calendar calculations and lookups
  - `lectionary.service.ts`: Appointed readings for days/seasons
  - `canticle-table.service.ts`: Canticle/psalm selection tables
  - `preferences.service.ts`: User preference persistence (Firebase + local)
  - `auth.service.ts`: Authentication state management
  - `local-storage.service.ts`: Offline/local data storage

**server/src/:**
- Purpose: Backend server for collaborative editing
- Contains: NestJS modules and controllers
- Entry point: `main.ts` bootstraps server on port 3000
- Module: `editor/` handles collaborative document operations

**adapter/src/:**
- Purpose: Data migration and format conversion
- Contains: `venite1.ts` converts legacy Venite 1 data to LDF format
- Used by: Data import tools, legacy system integration

**html/src/ and docx/src/:**
- Purpose: Rendering pipeline - convert LDF documents to output formats
- html/src: Contains renderers for each document type to HTML/CSS
- docx/src: Contains Word document generation from LDF

## Key File Locations

**Entry Points:**
- `app/src/main.ts`: Web application bootstrap (Angular platform)
- `app/src/index.html`: Root HTML document
- `server/src/main.ts`: Backend NestJS server startup
- `components/src/index.ts`: Web components public API

**Configuration:**
- `app/src/environments/environment.ts`: App environment config (Firebase, API URLs)
- `app/src/app/app.module.ts`: Root Angular module with dependency injection setup
- Angular library configs: `app/projects/*/angular.json`

**Core Logic:**
- `ldf/src/liturgical-document.ts`: Base class for all documents
- `ldf/src/liturgy/liturgy.ts`: Liturgy template with preferences
- `app/src/app/pray/pray.service.ts`: Main liturgy compilation orchestrator
- `app/src/app/services/document.service.ts`: Document data access (30KB - large)
- `app/src/app/services/calendar.service.ts`: Day/calendar logic (18KB)

**Testing:**
- Test files co-located with source: `*.spec.ts`
- End-to-end tests: `app/e2e/`
- Component tests: `components/src/components/*/*.e2e.ts`
- Karma test runner configured in `app/karma.conf.js`

## Naming Conventions

**Files:**
- Components: `[feature].component.ts` + `[feature].component.html` + `[feature].component.scss`
- Services: `[service-name].service.ts`
- Modules: `[feature].module.ts`
- Interfaces: `[thing].interface.ts`
- Tests: `[file].spec.ts` (unit) or `[file].e2e.ts` (integration)
- Example: `app/src/app/pray/pray.service.ts`, `app/src/app/pray/pray.module.ts`

**Directories:**
- Feature modules in lowercase: `app/src/app/[feature]/`
- Shared utilities: `app/src/app/shared/`
- Services: `app/src/app/services/` (core services) or feature-level `[feature]/[service].service.ts`
- Example: `app/src/app/pray/`, `app/src/app/bulletins/`

## Where to Add New Code

**New Feature (e.g., New Prayer Page):**
- Primary code: `app/src/app/[feature]/[feature].module.ts` with routing
- Page component: `app/src/app/[feature]/[feature].page.ts` + `.html` + `.scss`
- Add route to: `app/src/app/app-routing.module.ts`
- Tests: `app/src/app/[feature]/[feature].page.spec.ts`
- Example structure:
  ```
  app/src/app/my-feature/
  ├── my-feature.module.ts
  ├── my-feature.page.ts
  ├── my-feature.page.html
  ├── my-feature.page.scss
  ├── my-feature.page.spec.ts
  └── my-feature-routing.module.ts (if complex)
  ```

**New Document Type in LDF:**
- Type definition: `ldf/src/[type-name].ts` (create class extending `LiturgicalDocument`)
- Add to type exports: `ldf/src/index.ts`
- Add rendering component: `components/src/components/[type-name]/[type-name].tsx`
- Add HTML renderer: `html/src/[type-name].ts`
- Tests: `ldf/tests/[type-name].spec.ts`

**New Service:**
- Service interface: `app/projects/service-api/src/lib/[service]-service.interface.ts`
- Add injection token: `app/projects/service-api/src/lib/injection-tokens.ts`
- Implementation: `app/src/app/services/[service].service.ts`
- Provide in: `app/src/app/app.module.ts` via `providers:` array
- Test: `app/src/app/services/[service].service.spec.ts`

**New Web Component (Reusable):**
- Component logic: `components/src/components/[component-name]/[component-name].tsx`
- Styles: `components/src/components/[component-name]/[component-name].css`
- Tests: `components/src/components/[component-name]/[component-name].e2e.ts`
- Export: `components/src/index.ts`

**Utilities:**
- Shared functions: `components/src/utils/[util-name].ts` (for component utils)
- LDF utils: `ldf/src/utils/[util-name].ts` (if adding to core)
- Service utils: `app/src/app/services/` or within feature folder

## Special Directories

**app/projects/:**
- Purpose: Angular library packages that are published to npm under `@venite/` namespace
- Generated: No
- Committed: Yes
- Each project has own `package.json` and can be built independently
- Used by: Both main app and external consumers of Venite libraries

**app/offline/:**
- Purpose: Offline service worker and caching logic
- Generated: No
- Committed: Yes
- Handles offline-first data synchronization

**app/functions/:**
- Purpose: Firebase Cloud Functions (serverless backend)
- Generated: No
- Committed: Yes
- Provides additional backend logic beyond NestJS server

**liturgy_backups/:**
- Purpose: Seed data and database backups for liturgical documents
- Generated: No
- Committed: Yes
- Used for bootstrapping with standard prayer book content

**components/src/components/editable-text/:**
- Purpose: Collaborative editing component for operational transformation
- Generated: No
- Committed: Yes
- Contains: Text editing logic with change tracking (`handle-input.ts`, `.spec.ts`)

---

*Structure analysis: 2026-02-09*
