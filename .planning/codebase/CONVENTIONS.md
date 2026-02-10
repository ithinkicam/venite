# Coding Conventions

**Analysis Date:** 2026-02-09

## Naming Patterns

**Files:**
- TypeScript classes: PascalCase (e.g., `Citation`, `DisplaySettings`, `DarkmodeService`)
- Component files: kebab-case with feature name (e.g., `label-bar.tsx`, `member-chip.component.ts`)
- Service files: service-name.service.ts (e.g., `organization.service.ts`, `preferences.service.ts`)
- Spec files: [name].spec.ts (e.g., `pray.service.spec.ts`)

**Functions:**
- Methods and functions: camelCase (e.g., `toString()`, `compile()`, `find()`)
- Factory/constructor functions: camelCase (e.g., `venite1toLDF()`)
- Private methods: prefixed with underscore not used; use `private` access modifier instead

**Variables:**
- Local variables: camelCase (e.g., `category`, `slugify`, `userProfile$`)
- Observable variables: suffixed with `$` (e.g., `user$`, `bulletins$`, `organization$`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `STYLES`, `TYPES`, `LOADING`)
- Enums: PascalCase with values as uppercase strings (e.g., `enum Book { Genesis = 'Genesis' }`)

**Types/Classes:**
- Interface names: PascalCase (e.g., `Organization`, `UserProfile`, `DisplaySettings`)
- Type aliases: PascalCase (e.g., `TypeTuple`, `DisplayFormat`, `Lookup`)
- Branded types: Use literal unions for constrained values (e.g., `'psalm' | 'canticle' | 'invitatory'`)

## Code Style

**Formatting:**
- Prettier is used for code formatting across the monorepo
- Config file: `.prettierrc` (varies per package)

**Prettier Settings (observed):**
- `printWidth`: 120 (in `ldf/.prettierrc`)
- `singleQuote`: true (single quotes for strings)
- `trailingComma`: "all" (trailing commas in multi-line structures)

**Linting:**
- TSLint is configured in some packages
- Config: `tslint.json` with `tslint-config-prettier` to avoid conflicts with Prettier
- No ESLint configuration detected at root level; uses per-package TSLint

**TypeScript Compiler:**
- `strict: true` enabled across packages
- `strictPropertyInitialization: false` in some packages (allows uninitialized properties)
- Target: ES6 or ES2015 depending on package
- Module: commonjs or es2020 depending on package context

## Import Organization

**Order:**
1. Angular and third-party imports (e.g., `@angular/core`, `rxjs`)
2. Venite internal packages (e.g., `@venite/ldf`, `@venite/components`)
3. Local application imports (e.g., relative paths)

**Path Examples:**
- `import { Injectable } from "@angular/core"`
- `import { LiturgicalDocument } from "@venite/ldf"`
- `import { OrganizationService } from "./organization.service"`

**Path Aliases:**
- Used in Angular app: `reminders`, `interfaces`, `service-api`, `localstorage`, `darkmode`, `platform`, `pray-menu`
- Relative imports common in LDF and adapter packages

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (e.g., in `OrganizationService.join()`)
- `catch (e)` or `catch (error)` variable naming
- Fallback behavior in catch blocks (e.g., `.set()` if `.update()` fails)
- `console.warn()` for non-critical errors (seen in organization service)
- No error types specified; generic catch blocks

**Example from codebase:**
```typescript
try {
  return await this.afs.doc(`Users/${uid}`).update({...});
} catch (e) {
  console.warn(e);
  return await this.afs.doc(`Users/${uid}`).set({...});
}
```

## Logging

**Framework:** `console` object (native browser/Node.js logging)

**Usage:**
- `console.log()` for debug output
- `console.warn()` for warnings (seen in error handling)
- Commented-out logging common in codebase (e.g., `//console.log('...')`)
- No structured logging library detected

**Patterns:**
- Inline debugging: `console.log("variable = ", variable)`
- Used in template creation and service methods
- Often commented out for release builds

## Comments

**When to Comment:**
- JSDoc/TSDoc used for public class methods (e.g., `Citation.toString()`)
- Inline comments used for non-obvious logic
- Parameter documentation in JSDoc format
- Return type documentation

**JSDoc/TSDoc:**
- Format: `/** ... */` for documented elements
- Includes `@param` for parameters, `@example` for usage
- Example from codebase:
```typescript
/** Citation within that source
 * @example
 * `'p. 812'`, `'#126'`, `'10.1.13'` */
citation: string;
```

- Comments within code: `// explanation` for complex logic
- Commented-out code left in place (not deleted)

## Function Design

**Size:** Functions span from single-line utilities to methods handling 20+ lines of logic

**Parameters:**
- Type annotations required (TypeScript strict mode)
- Destructured parameters for objects with multiple properties
- Optional parameters with defaults (e.g., `suppressSource: boolean = false`)
- Default values in constructor parameters (e.g., `DisplaySettings` constructor)

**Return Values:**
- Explicit return types in function signatures
- Observable returns for async/reactive code (e.g., `Observable<LiturgicalDocument>`)
- Generic types for collections (e.g., `UserProfile[]`)
- Void for operations with side effects only

**Example:**
```typescript
public toString(suppressSource: boolean = false): string {
  return suppressSource ? this.citation : `${this.source} ${this.citation}`;
}
```

## Module Design

**Exports:**
- Explicit exports with `export class`, `export enum`, `export type`
- Named exports preferred over default exports
- Re-exports from index files (barrel exports): `export * from './module-name'`

**Barrel Files:**
- `index.ts` files aggregate and re-export public API
- Used extensively in `ldf/src/index.ts` to expose all classes and types
- Enables clean imports: `import { Citation } from '@venite/ldf'`

**Example from `ldf/src/index.ts`:**
```typescript
export * from './liturgical-document';
export * from './bible-reading/bible-reading';
export * from './citation/citation';
export * from './calendar/calendar';
```

## Class Design

**Access Modifiers:**
- `private` for internal implementation details
- `readonly` for immutable properties
- Class properties declared with type annotations
- Constructor parameter properties: `constructor(private readonly afs: AngularFirestore) {}`

**Angular Services:**
- `@Injectable({ providedIn: 'root' })` for singleton services
- Injected dependencies in constructor
- Type annotations for all dependencies

**Stencil Components:**
- `@Component` decorator with tag, styleUrl, shadow: true
- `@Prop` decorators for component inputs with type and default values
- `render()` method returns JSX

**Example Stencil:**
```typescript
@Component({
  tag: 'ldf-label-bar',
  styleUrl: 'label-bar.scss',
  shadow: true
})
export class LabelBarComponent {
  @Prop({ reflect: true }) center: boolean = false;

  render() {
    // JSX logic
  }
}
```

---

*Convention analysis: 2026-02-09*
