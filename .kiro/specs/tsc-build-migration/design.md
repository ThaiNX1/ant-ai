# TSC Build Migration Bugfix Design

## Overview

The monorepo's 3 NestJS apps (ai-service, customer-service, lesson-service) silently crash when served via `@nx/webpack:webpack` because webpack bundles native Node.js modules (`@google-cloud/text-to-speech` gRPC bindings, `pino-pretty` worker threads) into a single file that cannot load native bindings at runtime. The fix migrates the build system to `@nx/js:tsc`, which compiles TypeScript without bundling, preserving native module resolution. This requires configuring TypeScript project references (`composite: true` on libs, `references` in app tsconfigs) so that `tsc` can resolve `@ai-platform/*` path aliases without violating `rootDir` constraints.

## Glossary

- **Bug_Condition (C)**: Building/serving any NestJS app using `@nx/webpack:webpack` executor, which bundles native Node.js modules into a single file that fails at runtime
- **Property (P)**: Apps build and serve successfully using `@nx/js:tsc` with native modules loading correctly
- **Preservation**: Jest tests, ESLint, dependency build order, import resolution, Docker builds, and NestJS decorator metadata must continue working unchanged
- **`composite`**: TypeScript compiler option that enables project references by enforcing declaration emit and incremental compilation
- **`rootDir`**: TypeScript compiler option that constrains which source files can be included; `tsc` errors if files outside `rootDir` are referenced
- **Project References**: TypeScript feature where a `tsconfig.json` declares `references` to other tsconfig files, allowing `tsc` to resolve cross-project imports via compiled `.d.ts` output instead of source `.ts` files

## Bug Details

### Bug Condition

The bug manifests when any NestJS app is built or served using the `@nx/webpack:webpack` executor. Webpack bundles all code (including native Node.js modules) into a single JavaScript file. Native modules with binary bindings (gRPC) or worker-thread-based code (pino-pretty) cannot function inside a single-file bundle.

When attempting to switch to `@nx/js:tsc` without project references, a secondary failure occurs: `tsc` reports "file is not under rootDir" because path aliases in `tsconfig.base.json` point to source `.ts` files in other projects.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type BuildConfig
  OUTPUT: boolean

  RETURN (input.executor == "@nx/webpack:webpack"
          AND input.project.hasDependency(nativeModule)
          AND nativeModule IN ["@google-cloud/text-to-speech", "pino-pretty"])
         OR (input.executor == "@nx/js:tsc"
             AND input.project.tsconfig.references IS EMPTY
             AND input.project.imports("@ai-platform/*")
             AND pathAlias.pointsToSourceTs == true)
END FUNCTION
```

### Examples

- `nx serve ai-service` with webpack executor → silent crash (exit code 1), `@google-cloud/text-to-speech` gRPC bindings fail to load
- `nx serve ai-service` with webpack executor → `pino-pretty` worker threads fail inside bundled output
- `nx build ai-service` with `@nx/js:tsc` but no `composite`/`references` → TS error: `libs/ai-core/src/index.ts` is not under `rootDir` of `apps/ai-service`
- `nx build customer-service` with `@nx/js:tsc` but no `composite`/`references` → TS error for `libs/common`, `libs/ai-core`, `libs/database` source files

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `nx test <project>` runs Jest tests successfully with existing configuration for all apps and libs
- `nx lint <project>` runs ESLint checks successfully for all projects
- `nx build` with `dependsOn: ["^build"]` builds libs before apps in correct dependency order
- Imports from `@ai-platform/common`, `@ai-platform/ai-core`, `@ai-platform/database`, `@ai-platform/backend-client` resolve correctly at compile time and runtime
- `docker build` produces working Docker images for ai-service and customer-service
- NestJS decorator metadata (`emitDecoratorMetadata`, `experimentalDecorators`) emits correctly for dependency injection
- IDE navigation and autocompletion via `@ai-platform/*` path aliases continue working

**Scope:**
All non-build operations (testing, linting, IDE tooling) should be completely unaffected by this fix. The build output structure changes from a single bundled file to a directory of compiled `.js` files, which affects Dockerfiles and runtime startup.

## Hypothesized Root Cause

Based on the bug analysis, the issues are:

1. **Webpack Bundling of Native Modules**: `@nx/webpack:webpack` bundles all code into a single file. Native Node.js addons (`.node` files from gRPC) and worker-thread code (`pino-pretty`) cannot be loaded from within a bundle. This is a fundamental incompatibility — webpack is designed for browser-like environments, not Node.js servers with native dependencies.

2. **Missing TypeScript Project References**: When switching to `@nx/js:tsc`, the compiler enforces `rootDir` constraints. Path aliases in `tsconfig.base.json` point to source `.ts` files (`libs/common/src/index.ts`), which are outside each app's `rootDir`. Without `composite: true` on lib tsconfigs and `references` in app tsconfigs, `tsc` cannot resolve cross-project imports.

3. **Path Alias Dual-Purpose Gap**: `tsconfig.base.json` paths serve IDE resolution (pointing to source `.ts`) but `tsc` build needs them to resolve to compiled output. The `@nx/js:tsc` executor handles this by building libs first (via `dependsOn: ["^build"]`) and using project references to resolve to `.d.ts` declarations.

4. **Dockerfile Assumes Single-File Output**: Current Dockerfiles copy `dist/apps/<name>` and run `node main.js`, assuming webpack's single-file output. With `tsc`, the output is a directory tree mirroring the source structure, and lib code is compiled separately into `dist/libs/`. Dockerfiles need to copy both app and lib dist output, and `node_modules` must be available at runtime.

## Correctness Properties

Property 1: Bug Condition - TSC Build Succeeds for All Projects

_For any_ project (app or lib) in the monorepo, when built using `@nx/js:tsc` with properly configured TypeScript project references (`composite: true` on lib tsconfigs, `references` in app tsconfigs), the build SHALL complete without errors and produce valid JavaScript output in the `dist/` directory.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Test and Lint Behavior

_For any_ project in the monorepo, when `nx test` or `nx lint` is executed after the build migration, the results SHALL be identical to the results before the migration, preserving all existing test passes/failures and lint results.

**Validates: Requirements 3.1, 3.2, 3.3, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**1. Lib tsconfig.lib.json — Add `composite: true` and set `rootDir`**

Files: `libs/common/tsconfig.lib.json`, `libs/ai-core/tsconfig.lib.json`, `libs/database/tsconfig.lib.json`, `libs/backend-client/tsconfig.lib.json`

For each lib, add `composite: true` and `rootDir: "src"` to `compilerOptions`, and set `outDir` to the lib's dist path:
```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "../../dist/libs/<lib-name>",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
```

**2. App tsconfig.app.json — Add `references` to dependent libs**

Files: `apps/ai-service/tsconfig.app.json`, `apps/customer-service/tsconfig.app.json`, `apps/lesson-service/tsconfig.app.json`

Add `references` array pointing to each lib's `tsconfig.lib.json` that the app imports from. Based on dependency analysis:
- **ai-service**: references `ai-core`
- **customer-service**: references `ai-core`, `database`, `common`
- **lesson-service**: references `ai-core`, `common`

```jsonc
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "module": "commonjs",
    "types": ["node"],
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"],
  "include": ["src/**/*.ts"],
  "references": [
    { "path": "../../libs/ai-core/tsconfig.lib.json" }
  ]
}
```

**3. project.json — Already migrated to `@nx/js:tsc`**

All 3 apps and 4 libs already have `"executor": "@nx/js:tsc"` in their `project.json` files. No changes needed here.

**4. Dockerfiles — Update for tsc output structure**

Files: `apps/ai-service/Dockerfile`, `apps/customer-service/Dockerfile`

With `tsc`, the output is no longer a single bundled file. The compiled app code is in `dist/apps/<name>/` and lib code in `dist/libs/<lib>/`. Dockerfiles must:
- Copy the entire `dist/` directory (or both app and lib dist)
- Copy `node_modules/` for runtime dependencies (since tsc doesn't bundle)
- Update the `CMD` entrypoint to point to the correct main.js path within the dist structure

**5. Remove `@nx/webpack` and `webpack` from devDependencies**

File: `package.json`

Remove `"@nx/webpack"` and `"webpack"` from `devDependencies` since webpack is no longer used. All webpack.config.js files have already been deleted.

**6. tsconfig.base.json — Path aliases remain unchanged**

The `paths` in `tsconfig.base.json` continue pointing to source `.ts` files for IDE resolution. The `@nx/js:tsc` executor + project references handle build-time resolution via compiled `.d.ts` files. No changes needed to `tsconfig.base.json`.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the build system produces correct output for all projects, then verify existing functionality (tests, lint, Docker) is preserved.

### Exploratory Bug Condition Checking

**Goal**: Confirm that the current webpack-based build fails with native modules, and that `tsc` without project references fails with `rootDir` errors.

**Test Plan**: Attempt to build each app with the current configuration and observe failures.

**Test Cases**:
1. **Webpack Native Module Failure**: `nx serve ai-service` with webpack executor crashes silently (confirms root cause 1)
2. **TSC Without References**: `nx build ai-service` with `@nx/js:tsc` but without `composite`/`references` produces `rootDir` errors (confirms root cause 2)
3. **All Apps Affected**: `nx serve customer-service` and `nx serve lesson-service` exhibit same webpack crash (confirms scope)

**Expected Counterexamples**:
- Webpack build produces exit code 1 with no useful error output for native module failures
- TSC build produces `error TS6059: File 'libs/*/src/index.ts' is not under 'rootDir'`

### Fix Checking

**Goal**: Verify that for all projects, the `@nx/js:tsc` build with project references succeeds.

**Pseudocode:**
```
FOR ALL project IN [common, ai-core, database, backend-client, ai-service, customer-service, lesson-service] WHERE isBugCondition(project.buildConfig) DO
  result := nxBuild(project, executor="@nx/js:tsc", withProjectReferences=true)
  ASSERT result.exitCode == 0
  ASSERT result.outputDir.contains("main.js") OR result.outputDir.contains("index.js")
  ASSERT result.outputDir.contains("*.d.ts") FOR libs
END FOR
```

### Preservation Checking

**Goal**: Verify that tests, lint, Docker builds, and runtime behavior are unchanged after migration.

**Pseudocode:**
```
FOR ALL project IN allProjects WHERE NOT isBugCondition(project.testConfig) DO
  ASSERT nxTest(project).exitCode == nxTest_original(project).exitCode
  ASSERT nxLint(project).exitCode == nxLint_original(project).exitCode
END FOR
```

**Testing Approach**: Manual verification is most appropriate for this infrastructure-level change because:
- Build system changes affect file output structure, not application logic
- Property-based testing is not applicable to build configuration changes
- Integration testing (full build + serve + health check) provides the strongest validation

**Test Plan**: After applying all changes, run the full build pipeline and verify each app starts correctly.

**Test Cases**:
1. **Build All Projects**: `nx run-many -t build` succeeds for all 7 projects
2. **Test All Projects**: `nx run-many -t test` passes with same results as before
3. **Lint All Projects**: `nx run-many -t lint` passes with same results as before
4. **Serve Each App**: `nx serve ai-service`, `nx serve customer-service`, `nx serve lesson-service` each start without crashes
5. **Docker Build**: `docker build` for ai-service and customer-service produces working images
6. **Decorator Metadata**: NestJS dependency injection works correctly (verified by successful app startup)

### Unit Tests

- Verify each lib builds independently with `composite: true` and produces `.js` + `.d.ts` output
- Verify each app builds with project references and resolves `@ai-platform/*` imports
- Verify `emitDecoratorMetadata` is preserved in compiled output

### Property-Based Tests

- Not applicable for this infrastructure/build-system migration. The "properties" are verified through build pipeline execution rather than code-level property testing.

### Integration Tests

- Full `nx run-many -t build` across all projects
- `nx serve <app>` for each app, verify health endpoint responds
- Docker multi-stage build produces working container for each app
- End-to-end: build → serve → HTTP request to health endpoint succeeds
