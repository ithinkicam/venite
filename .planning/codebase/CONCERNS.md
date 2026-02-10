# Codebase Concerns

**Analysis Date:** 2026-02-09

## Tech Debt

**User Preferences Hardcoded:**
- Issue: User preferences are not actually being used; instead defaultPrefs is always used in compilation
- Files: `commonprayer/src/services/compile-service.ts` (line 68)
- Impact: Users cannot customize preferences like calendar, psalter, or bible version
- Fix approach: Implement proper preference handling by passing actual user preferences instead of ignoring them

**Incomplete Lectionary/Psalter Lookup:**
- Issue: TODO comment indicates lectionary and psalter lookups are not fully implemented
- Files: `commonprayer/src/services/compile-service.ts` (line 206)
- Impact: Some liturgical lookups may fail or return incorrect data
- Fix approach: Complete the lectionary and psalter lookup implementation

**Entity Replacement in DOCX Output:**
- Issue: HTML entities in bible readings are not being replaced in DOCX output
- Files: `docx/src/bible-reading-to-docx.ts` (line 1-3)
- Impact: DOCX files contain HTML entities instead of proper characters
- Fix approach: Add entity replacement logic in the DOCX rendering pipeline

**Image Styling in DOCX Metadata:**
- Issue: Image styling is not fully implemented in DOCX metadata
- Files: `docx/src/image-to-docx.ts` (line 1-2)
- Impact: Images in DOCX output lack proper styling
- Fix approach: Implement metadata styling for images

**Bible Reading HTML Generation Incomplete:**
- Issue: Introductions and other content not included in HTML rendering for bible readings
- Files: `html/src/bible-reading.ts` (line 65)
- Impact: Bible reading HTML output is missing content
- Fix approach: Include additional content types (intros, etc.) in HTML generation

**Kludgey Scroll Behavior:**
- Issue: setTimeout-based scroll hash handling is fragile
- Files: `app/src/app/pray/pray.page.ts` (line 233)
- Impact: Scroll-to-section behavior may be unreliable
- Fix approach: Use proper scroll anchoring mechanism instead of setTimeout

**Missing Error Handling in Async Operations:**
- Issue: Async forEach operations without await in loadReadings function
- Files: `commonprayer/src/pages/calendar-calculator/calendar-ui.ts` (line 159)
- Impact: Race conditions and unhandled promise rejections; if a reading fails to load, it won't be caught
- Fix approach: Convert to Promise.all() or proper async iteration with error handling

**Copy Static Return Incomplete:**
- Issue: Function marked with TODO and returns empty object
- Files: `commonprayer/src/ssg/copy-static.ts` (line 72)
- Impact: Static file copying may not be working correctly in SSG
- Fix approach: Implement proper return value and error handling

**Missing 404 Page Implementation:**
- Issue: Placeholder 404 responses in dev server
- Files: `commonprayer/src/ssg/dev-server.ts` (lines 291, 316)
- Impact: 404 errors show empty response instead of proper 404 page
- Fix approach: Implement proper 404 page template

**Speech Synthesis Preferences Incomplete:**
- Issue: Not all speech service preferences are handled
- Files: `app/src/app/services/speech.service.ts` (line 96)
- Impact: Speech synthesis may not respect all user preferences
- Fix approach: Complete preference handling for speech synthesis

**Incomplete Test Coverage:**
- Issue: Placeholder TODO comment indicates missing tests
- Files: `app/src/app/app.component.spec.ts` (line 44)
- Impact: Core app component lacks proper test coverage
- Fix approach: Add comprehensive test suite

**Speech Error Handling Stubs:**
- Issue: Empty error callbacks and completion callbacks for speech
- Files: `app/src/app/services/media-session.service.ts` (lines 359, 361)
- Impact: Speech errors are silently ignored
- Fix approach: Implement proper error handling and completion callbacks

**Internationalization Incomplete:**
- Issue: Alert header marked with TODO for i18n translation
- Files: `app/src/app/bulletins/create-document-button/create-document-button.component.ts` (line 61)
- Impact: UI strings are not translated for other languages
- Fix approach: Implement i18n for all UI strings

---

## Security Considerations

**CORS Wildcard Access in Cloud Functions:**
- Risk: `Access-Control-Allow-Origin: *` allows any website to make requests
- Files: `app/functions/src/index.ts` (lines 42, 109, 135)
- Impact: Could expose data to cross-origin attacks; sensitive endpoints should restrict origins
- Recommendations: Replace wildcard with specific allowed origins; use environment-based origin lists

**Weak Permission Check in saveDocument Function:**
- Risk: Incomplete permission validation - TODO comment indicates "allow all users" was considered
- Files: `app/functions/src/index.ts` (line 70)
- Impact: Currently checks ownership/collaboration but could be bypassed if conditions are relaxed
- Recommendations: Ensure permission checks are comprehensive and not removed without security review

**Hardcoded User ID in Document Service:**
- Risk: Hardcoded developer UID in commented conditional
- Files: `app/src/app/services/document.service.ts` (line 677)
- Impact: Security bypass risk if condition is accidentally uncommented
- Recommendations: Remove hardcoded IDs and implement role-based access control

**String Concatenation in Error Messages:**
- Risk: Error messages directly include exception details
- Files: `app/functions/src/index.ts` (lines 96, 124, 154, 201, 399)
- Impact: May leak sensitive information in error responses
- Recommendations: Sanitize error messages before sending to client; log full errors server-side only

---

## Performance Bottlenecks

**Large Component Files:**
- Problem: Several components exceed 1500+ lines of TypeScript
- Files:
  - `app/src/app/pray/pray.page.ts` (1705 lines)
  - `app/src/app/pray-menu/liturgy-select/liturgy-select.component.ts` (1188 lines)
  - `app/src/app/pray/pray.service.ts` (1174 lines)
  - `app/src/app/editor/ldf-editor/editor.service.ts` (766 lines)
- Impact: Difficult to maintain, increased memory usage, slower change detection
- Improvement path: Break into smaller services/components with clear separation of concerns

**Large Build Script:**
- Problem: `commonprayer/utils/build-canticles.ts` is 3820 lines
- Files: `commonprayer/utils/build-canticles.ts`
- Impact: Slow build times, difficult to maintain and test
- Improvement path: Refactor into multiple modules; extract data processing logic

**Synchronous DOM Operations in Calendar Loading:**
- Problem: Multiple synchronous DOM queries and manipulations
- Files: `commonprayer/src/pages/calendar-calculator/calendar-ui.ts` (lines 45-128)
- Impact: Could cause jank during calendar navigation
- Improvement path: Batch DOM updates; use virtual scrolling for large datasets

**Inline External CDN Imports:**
- Problem: Direct CDN skypack imports in service files may cause latency
- Files: `commonprayer/src/services/compile-service.ts` (lines 1, 17)
- Impact: Network latency on each service initialization
- Improvement path: Bundle dependencies locally or use import maps

---

## Fragile Areas

**Calendar Calculation Dependencies:**
- Files: `ldf/src/calendar/utils/liturgical-week.ts` (lines 43, 53)
- Why fragile: Easter cycle calculations have TODOs indicating incomplete logic for calendar.easterCycleBegins
- Safe modification: Add comprehensive tests for edge cases around Easter dates before modifying
- Test coverage: Needs specific test cases for different calendar configurations

**Editor Change Management:**
- Files: `app/src/app/editor/ldf-editor/editor.service.ts`
- Why fragile: Complex state management with pending/rejected changes; unclear error handling for permission failures
- Safe modification: Add state machine pattern; implement comprehensive logging
- Test coverage: Gaps in error scenarios and race conditions

**Document Service Caching:**
- Files: `app/src/app/services/document.service.ts` (line 62)
- Why fragile: Simple Record cache without invalidation strategy or TTL
- Safe modification: Implement proper cache invalidation; add RxJS subject for cache updates
- Test coverage: Missing tests for cache behavior

**Psalm and Scripture Conversion:**
- Files: `adapter/src/venite1.ts` (line 251)
- Why fragile: Psalm conversion marked with "TODO?" - unclear if logic is complete
- Safe modification: Add test data to verify behavior before changes
- Test coverage: Needs specific tests for psalm/scripture edge cases

---

## Dependencies at Risk

**Outdated Angular Version:**
- Risk: Application uses Angular 12.2.17 which is out of LTS support
- Files: `app/package.json` (lines 16-23)
- Impact: No security patches, missing modern features, harder to hire developers
- Migration plan: Plan major version upgrade to Angular 14+ or latest LTS; test all features

**Outdated RxJS Version:**
- Risk: RxJS 6.5.1 is very old and missing features
- Files: `app/package.json` (line 77)
- Impact: Missing bug fixes and performance improvements
- Migration plan: Upgrade to RxJS 7.x; review operator usage for compatibility

**Firebase SDK Age:**
- Risk: Firebase 8.3.1 is outdated; security patches available in newer versions
- Files: `app/package.json` (line 70)
- Impact: Potential security vulnerabilities
- Migration plan: Update to Firebase 9.x; test all authentication flows

**Legacy Ionic Dependencies:**
- Risk: Uses mix of old Ionic Native plugins and newer Capacitor
- Files: `app/package.json` (lines 40-44)
- Impact: Maintenance burden; inconsistent behavior across platforms
- Migration plan: Migrate all Ionic Native to Capacitor equivalents

---

## Missing Critical Features

**Real User Preferences System:**
- Problem: User preferences are read but not applied - complete feature not implemented
- Blocks: Customization of calendar, psalter, bible version, language, display settings
- Fix approach: Implement preference storage in Firestore; pass to compilation service

**Error Reporting System:**
- Problem: Error logging is stubbed (console.warn only)
- Blocks: Production debugging and error tracking
- Fix approach: Integrate Sentry or similar error tracking service

**Proper File Management for Downloaded Files:**
- Problem: TODOs indicate uncertainty about handling unopened files (Android)
- Blocks: Reliable file download functionality
- Fix approach: Implement proper file handling for both iOS and Android with fallback behavior

---

## Test Coverage Gaps

**Prayer Page Component:**
- What's not tested: Main prayer rendering component, scroll behavior, preference application
- Files: `app/src/app/pray/pray.page.ts`
- Risk: Core functionality could break unnoticed; 1700+ lines with minimal test coverage
- Priority: HIGH

**Editor Service:**
- What's not tested: Change management, permission validation, state transitions
- Files: `app/src/app/editor/ldf-editor/editor.service.ts`
- Risk: Critical data loss or corruption bugs could exist
- Priority: HIGH

**Document Service Firestore Queries:**
- What's not tested: Query building logic, permission checks, caching behavior
- Files: `app/src/app/services/document.service.ts`
- Risk: Incorrect data being returned or exposed to wrong users
- Priority: HIGH

**Calendar Calculations:**
- What's not tested: Edge cases around transferable feasts, different calendar configurations
- Files: `ldf/src/calendar/utils/liturgical-week.ts`
- Risk: Incorrect liturgical day calculations for certain dates
- Priority: MEDIUM

**Compile Service Lookups:**
- What's not tested: Bible reading lookup, lectionary resolution, canticle selection
- Files: `commonprayer/src/services/compile-service.ts`
- Risk: Wrong readings selected for services
- Priority: MEDIUM

**Firebase Cloud Functions:**
- What's not tested: Authorization checks, CORS handling, error responses
- Files: `app/functions/src/index.ts`
- Risk: Security vulnerabilities or data leaks
- Priority: HIGH

**Speech Service:**
- What's not tested: Voice selection, rate/pitch preferences, error handling
- Files: `app/src/app/services/speech.service.ts`
- Risk: Speech synthesis failures not handled gracefully
- Priority: MEDIUM

---

*Concerns audit: 2026-02-09*
