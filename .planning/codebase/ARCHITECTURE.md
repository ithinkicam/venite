# Architecture

**Analysis Date:** 2026-02-09

## Pattern Overview

**Overall:** Layered modular monorepo with clear separation between domain model (LDF), UI frameworks (Angular/Ionic), backend services (NestJS), and shared libraries.

**Key Characteristics:**
- **LDF-centric**: Liturgical Document Format is the central domain model shared across all layers
- **Multi-package monorepo**: Separate publishable packages for different concerns (LDF, components, adapters, services)
- **Dependency injection**: Angular's DI system with service interfaces for loose coupling
- **Lazy-loaded feature modules**: Routes use lazy loading with Angular's router for code splitting
- **Observable-based data flow**: RxJS heavily used for async operations and state management

## Layers

**Domain/Model Layer:**
- Purpose: Defines core liturgical document structures and transformations
- Location: `ldf/src/`
- Contains: TypeScript classes for `LiturgicalDocument`, `Liturgy`, `LiturgicalDay`, `BibleReading`, `Psalm`, `ResponsivePrayer`, etc.
- Depends on: Nothing (pure domain logic)
- Used by: All application layers

**Data Transformation Layer:**
- Purpose: Converts between different document formats and older versions
- Location: `adapter/src/`, `html/src/`, `docx/src/`
- Contains: Format converters (e.g., `venite1.ts` converts v1 to LDF), HTML and DOCX renderers
- Depends on: LDF classes
- Used by: Service layer and components

**Service/API Layer:**
- Purpose: Defines and implements service interfaces for data access and business logic
- Location: `app/projects/service-api/src/lib/` (interfaces), `app/src/app/services/` (implementations)
- Contains: Service interfaces (`DocumentServiceInterface`, `BibleServiceInterface`, `LectionaryServiceInterface`, etc.) and their Angular implementations
- Depends on: LDF, RxJS, external APIs (Firebase, Bible APIs)
- Used by: Feature components and pages

**Component Library:**
- Purpose: Reusable web components for rendering liturgical documents
- Location: `components/src/`
- Contains: Stencil-based custom elements for psalms, readings, responsive prayers, etc.
- Depends on: LDF
- Used by: Angular application and can be embedded in any HTML

**UI/Application Layer:**
- Purpose: Feature modules, pages, and components for the Ionic Angular application
- Location: `app/src/app/`
- Contains: Feature modules (pray, bulletins, editor, etc.), pages, route guards, and components
- Depends on: Service APIs, LDF, Ionic, RxJS
- Used by: Bootstrap module

**Backend API Layer:**
- Purpose: REST endpoints for data operations
- Location: `server/src/`
- Contains: NestJS controllers and modules for collaborative editing
- Depends on: LDF, NestJS
- Used by: Client applications

## Data Flow

**Liturgy Compilation Flow (Main Prayer Path):**

1. User navigates to `/pray` route with liturgical day context
2. `PrayService.compile()` initializes with selected `Liturgy` template
3. Service recursively resolves document lookups:
   - `DocumentService.findDocumentsBySlug()` fetches document from API or cache
   - `LectionaryService` retrieves appointed readings via `LectionaryServiceInterface`
   - `CanticleTableService` retrieves canticle selections
   - `BibleService` retrieves bible translations
4. Each `LiturgicalDocument.include()` evaluates conditions against `LiturgicalDay` and user `ClientPreferences`
5. Compiled liturgy is returned as `Observable<LiturgicalDocument>`
6. Components render document tree using custom elements from `@venite/components`

**Document Lookup Resolution:**

```
Lookup definition in document:
  { type: 'psalm', lookup: { table: 'bcp1979', item: 1 } }
    ↓
Service determines if lookup type (psalm, lectionary, canticle, category, slug, collect)
    ↓
Call appropriate service (DocumentService, LectionaryService, etc.)
    ↓
Apply filters (seasonal, evening, day)
    ↓
Return resolved document(s)
```

**User Preferences Flow:**

1. `PreferencesService` manages user choices (Bible version, language, liturgy version, etc.)
2. Preferences stored in `LocalStorageService` or Firebase (`@angular/fire`)
3. Preferences passed as `ClientPreferences` object to compilation functions
4. Document conditions and preferences metadata use preference keys to customize compilation
5. Examples: `{ preference: "bibleVersion" }`, `{ preference: "psalterVersion" }`

**State Management:**

- No centralized store; RxJS Observables used as primary state management tool
- Services expose Observables that components subscribe to
- `async` pipe in templates handles subscription and unsubscription
- Local component state for UI-only concerns (form inputs, toggles)
- Firebase Firestore for persistent user data (bulletins, favorites, preferences)

## Key Abstractions

**LiturgicalDocument:**
- Purpose: Base class representing any piece of a liturgy, from complete service to single prayer
- Examples: `liturgy/src/liturgy/liturgy.ts`, `ldf/src/bible-reading/bible-reading.ts`, `ldf/src/psalm.ts`
- Pattern: Factory/builder approach using `Object.assign()` in constructor; child classes extend with type-specific metadata
- Key methods: `include()` evaluates conditions, `availableDisplayFormats()` returns format options

**Service Interfaces (Dependency Injection):**
- Purpose: Define contracts for external data sources without tying implementation details
- Examples: `DocumentServiceInterface`, `BibleServiceInterface`, `LectionaryServiceInterface`
- Pattern: Interface-based contracts with injection tokens (`DOCUMENT_SERVICE`, `BIBLE_SERVICE`, etc.)
- Location: `app/projects/service-api/src/lib/`

**Lookup System:**
- Purpose: Defer resolution of referenced documents until compilation time
- Pattern: `Lookup` object contains type, table name, item identifier, and resolution modifiers (rotate, random, filter)
- Usage: Allows templates to reference dynamic content based on liturgical day without hardcoding
- Example: Psalm lookups use table name + item to resolve from canticle tables; lectionary lookups resolve readings by type

**Preferences/Metadata Pattern:**
- Purpose: Enable flexible configuration and user customization
- Pattern: Documents carry metadata (additional properties per type) and `Preferences` for compilation-time options
- Example: `Liturgy` metadata includes `preferences` (like `bibleVersion`, `psalterVersion`) and `special_preferences` for temporary choices

## Entry Points

**Web Application:**
- Location: `app/src/main.ts`
- Triggers: Browser load of `index.html`
- Responsibilities: Bootstrap Angular module, load Capacitor APIs, define custom elements from `@venite/components`

**Pray Feature:**
- Location: `app/src/app/pray/pray.module.ts` (lazy-loaded from routing)
- Triggers: Route navigation to `/pray` or `/bulletin`
- Responsibilities: Lazy-load pray module with service providers; render liturgy compilation workflow

**Editor Module:**
- Location: `app/src/app/editor/` (feature module)
- Triggers: Route navigation to editing paths
- Responsibilities: Collaborative document editing using Operational Transformation (OT)

**Backend Server:**
- Location: `server/src/main.ts`
- Triggers: Server startup on port 3000
- Responsibilities: Expose REST endpoints via `EditorModule` for collaborative operations

**API Services (for external integrations):**
- `BibleService` (`app/src/app/services/bible.service.ts`): Interfaces with Bible translation APIs
- `LectionaryService`: Interfaces with lectionary database
- `CalendarService`: Provides liturgical calendar calculations
- `DocumentService`: Fetches liturgical documents from Firestore or API

## Error Handling

**Strategy:** Mostly permissive with fallback values; errors caught in `catchError()` operators

**Patterns:**
- Observable operators use `catchError()` to return fallback values (empty array, default document, etc.)
- Example in `PrayService.compile()`: Unresolved lookups return empty or "Loading..." documents
- HTTP errors caught at service layer; UI components show empty states
- Validation: `LiturgicalDocument.include()` safely handles missing conditions

## Cross-Cutting Concerns

**Logging:** Console-based (no structured logger detected); debug comments visible in code (e.g., `//console.log` in liturgy.ts)

**Validation:** Primarily at model construction; `include()` method validates conditions against day and preferences

**Authentication:**
- Route guard `LoginGuard` (`app/src/app/login.guard.ts`) protects routes requiring login
- Firebase Auth integration via `@angular/fire`
- `AuthService` manages login state and tokens

**Internationalization (i18n):**
- `@ngx-translate/core` provides runtime translation
- HTTP loader loads translation files
- Language preference persisted in user preferences
- LiturgicalDocument language field tracks document language

**Display Rendering:**
- Custom elements from `@venite/components` handle most rendering
- Responsive design via `responsive` field on documents (all-sizes, small-only, small-hidden)
- Display format system (unison, abbreviated, default, etc.) controls presentation modes
- Font and styling preferences passed to components

---

*Architecture analysis: 2026-02-09*
