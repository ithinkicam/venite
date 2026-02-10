# Testing Patterns

**Analysis Date:** 2026-02-09

## Test Framework

**Angular App Tests (Primary):**
- Framework: Jasmine with Karma runner
- Config: `karma.conf.js`
- Test command: `npm test` (via `ng test`)

**Isolated Package Tests:**
- Framework: Jest for packages (`ldf`, `adapter`, `components`, `bible-api`)
- Config files: `jest.config.js` in each package
- Test command: `npm test` (runs `npx jest`)

**Run Commands:**
```bash
npm test              # Run all tests in current package
npm test.watch      # Watch mode (in some packages like components)
```

**Coverage:**
- Configured in `karma.conf.js` with istanbul reporter
- Coverage reports: HTML, lcovonly, text-summary formats
- Output directory: `../coverage` (relative to karma config)

## Test File Organization

**Location:**
- Angular app: Co-located with source files
- Pattern: `feature.component.spec.ts` next to `feature.component.ts`
- Packages: Test files alongside source in `src/` directory

**Naming:**
- `.spec.ts` suffix for all test files
- Matches source file name: `service.ts` → `service.spec.ts`
- File paths indicate hierarchy: `app/projects/pray/src/lib/pray.service.spec.ts`

**Structure (sample from app):**
```
app/src/app/
├── app.component.ts
├── app.component.spec.ts
└── services/
    ├── document.service.ts
    ├── document.service.spec.ts
    └── ...
```

## Test Structure

**Describe/It Pattern:**
```typescript
describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceName);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

**Patterns Observed:**

1. **Service Tests** (`PrayService`, `DarkmodeService`):
   - Use `TestBed.configureTestingModule({})`
   - Inject service via `TestBed.inject(ServiceName)`
   - Basic smoke test: verify service instantiates

2. **Component Tests** (`PrayPage`, `DisplaySettingsComponent`):
   - Use `TestBed.configureTestingModule()` with component declarations
   - Import test modules: `IonicModule.forRoot()`
   - Create fixture: `TestBed.createComponent(ComponentName)`
   - Call `fixture.detectChanges()` in beforeEach
   - Basic assertions: verify component creation

3. **Setup Pattern:**
   - `beforeEach(async(() => {...}))` for async setup (deprecated async helper)
   - Alternative: `beforeEach(async() => {...})` in modern Jasmine
   - `TestBed.configureTestingModule()` for dependency injection setup

4. **Teardown Pattern:**
   - Implicit cleanup via TestBed
   - No explicit teardown observed in codebase

5. **Assertion Pattern:**
   - `expect(variable).toBeTruthy()` for existence checks
   - `expect(service).toBeDefined()` (common pattern)
   - Jasmine matchers: `toBeTruthy`, `toBeFalsy`, etc.

## Mocking

**Framework:** Jasmine spies (native to framework)

**Patterns:**
```typescript
// Not extensively used in current tests; mostly basic instantiation tests
// Mocking would use spyOn:
spyOn(service, 'methodName').and.returnValue(mockValue);
```

**What to Mock:**
- External service dependencies (Firebase, HTTP services)
- Observable streams that need controlled responses
- Angular services injected via TestBed

**What NOT to Mock:**
- Core logic being tested
- Internal method calls (test behavior, not implementation)
- LDF classes and data structures

**Current Practice:**
- Most test files are minimal "should be created" tests
- No complex mocking observed
- TestBed handles Angular framework mocking automatically

## Fixtures and Factories

**Test Data:**
- Not extensively used in current test suite
- Inline test data in test methods when needed
- Example: `new DisplaySettings(...)` for component configuration

**Location:**
- Test data created inline in test files
- No centralized fixtures directory detected
- Factory functions not observed in test suite

**Pattern Opportunity:**
- Could use factory functions for complex LDF objects
- Could create fixture files in `fixtures/` directories

## Coverage

**Requirements:** Not enforced (no coverage thresholds in karma config)

**View Coverage:**
```bash
npm test                           # Generate coverage report
open ../coverage/index.html        # View HTML report (macOS)
cat ../coverage/lcov.info          # View LCOV format
```

## Test Types

**Unit Tests:**
- Scope: Individual services and components
- Approach: Jasmine/TestBed setup with minimal configuration
- Current state: ~86 test files identified
- Depth: Mostly initialization tests (verify "should be created")

**Integration Tests:**
- Scope: Not extensively used
- Current pattern: Component tests with module imports approach integration testing
- Example: PrayPage test imports `IonicModule.forRoot()`

**E2E Tests:**
- Framework: Protractor (ng e2e in scripts)
- Current state: Not actively maintained based on test file count
- Command: `npm run e2e` (Angular CLI)
- Implementation: Likely in `e2e/` directory (not analyzed)

## Common Patterns

**Async Testing:**
```typescript
// Deprecated pattern (seen in codebase):
beforeEach(async(() => {
  TestBed.configureTestingModule({...}).compileComponents();
  fixture = TestBed.createComponent(Component);
  component = fixture.componentInstance;
  fixture.detectChanges();
}));

// Modern pattern (waitForAsync):
beforeEach(waitForAsync(() => {
  // ...
}));
```

**Component Initialization:**
```typescript
let component: MyComponent;
let fixture: ComponentFixture<MyComponent>;

beforeEach(async(() => {
  TestBed.configureTestingModule({
    declarations: [MyComponent],
    imports: [IonicModule.forRoot()]
  }).compileComponents();

  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
}));
```

**Error Testing:**
- Pattern not observed in current test suite
- Would use `expect(() => { ... }).toThrow(...)`
- Observable error testing: subscribe and check error cases

## Jasmine Configuration

**Global Setup:**
- Configured via `karma.conf.js`
- Test environment: Chrome browser
- Single run: false (watch mode by default)
- Auto-watch: true

**Assertion Library:** Jasmine's built-in expect() API

**Report Formats:**
- Progress reporter: Text output to console
- kjhtml reporter: HTML report in Karma UI
- Coverage Istanbul reporter: Code coverage analysis

## Package-Specific Test Configs

**LDF Package** (`ldf/jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node'
};
```

**Adapter Package** (`adapter/jest.config.js`):
- Uses Jest for Node.js environment testing
- ts-jest preset for TypeScript compilation

**Components Package** (`components/jest.config.js`):
- Uses Jest for Stencil component testing
- Handles Stencil-specific JSX compilation

## Test Gaps

**Minimal Test Depth:**
- Most tests verify instantiation only ("should be created")
- No behavioral tests observed
- No error condition testing
- Observable streams not tested for actual values

**Files with Limited Coverage:**
- Complex services: `PrayService.compile()` has 100+ lines, no tests of logic
- Component rendering: Stencil components not tested for JSX output
- Adapter transformations: `venite1toLDF()` not tested

**Priority Areas for Testing:**
1. Data transformation logic (adapter, liturgy compilation)
2. Observable stream transformations (pray service)
3. Error handling paths (service methods with try-catch)
4. Conditional rendering in components

---

*Testing analysis: 2026-02-09*
