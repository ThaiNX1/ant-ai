# Bugfix Requirements Document

## Introduction

Running `nx serve ai-service` causes a silent crash (exit code 1, no error output) because the webpack bundler cannot handle native Node.js modules. Packages like `@google-cloud/text-to-speech` (gRPC native bindings) and `pino-pretty` (worker threads) fail when bundled into a single file by webpack. The fix is to migrate the entire monorepo build system from `@nx/webpack:webpack` to `@nx/js:tsc`, which preserves native modules by compiling TypeScript without bundling. This requires properly configuring TypeScript project references so that apps can compile libs without violating `rootDir` constraints.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `nx serve ai-service` is executed with the `@nx/webpack:webpack` executor THEN the system silently crashes with exit code 1 and produces no error output, because webpack bundles native Node.js modules (`@google-cloud/text-to-speech` gRPC bindings) into a single file that cannot load native bindings at runtime

1.2 WHEN `nx serve ai-service` is executed with the `@nx/webpack:webpack` executor THEN the system fails to initialize `pino-pretty` because webpack bundles worker-thread-based code that cannot function inside a single-file bundle

1.3 WHEN `nx serve customer-service` or `nx serve lesson-service` is executed with the `@nx/webpack:webpack` executor THEN the system exhibits the same silent crash behavior for any native or worker-thread-based dependencies

1.4 WHEN `nx build` is executed for any app using `@nx/js:tsc` without proper TypeScript project references THEN the TypeScript compiler reports errors that lib source files are "not under rootDir", because path aliases in `tsconfig.base.json` point to source `.ts` files outside the app's `rootDir`

### Expected Behavior (Correct)

2.1 WHEN `nx serve ai-service` is executed with the `@nx/js:tsc` executor and properly configured TypeScript project references THEN the system SHALL compile TypeScript to JavaScript without bundling, and the app SHALL start successfully on port 8081 with all native modules (`@google-cloud/text-to-speech`) loading correctly

2.2 WHEN `nx serve ai-service` is executed with the `@nx/js:tsc` executor THEN the system SHALL allow `pino-pretty` worker threads to function correctly because the compiled output preserves the original module structure without bundling

2.3 WHEN `nx serve customer-service` or `nx serve lesson-service` is executed with the `@nx/js:tsc` executor and properly configured TypeScript project references THEN the system SHALL start each app successfully without silent crashes

2.4 WHEN `nx build` is executed for any app using `@nx/js:tsc` with TypeScript project references (`composite: true` on libs, `references` in app tsconfigs) THEN the TypeScript compiler SHALL resolve `@ai-platform/*` path aliases to compiled lib output and compile without "not under rootDir" errors

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `nx test <project>` is executed for any app or lib THEN the system SHALL CONTINUE TO run Jest tests successfully with the same test configuration and pass/fail results

3.2 WHEN `nx lint <project>` is executed for any app or lib THEN the system SHALL CONTINUE TO run ESLint checks successfully

3.3 WHEN `nx build` is executed with the `dependsOn: ["^build"]` configuration THEN the system SHALL CONTINUE TO build libs before apps in the correct dependency order

3.4 WHEN apps import from `@ai-platform/common`, `@ai-platform/ai-core`, `@ai-platform/database`, or `@ai-platform/backend-client` THEN the system SHALL CONTINUE TO resolve these imports correctly at both compile time and runtime

3.5 WHEN `docker build` is executed for any app THEN the system SHALL CONTINUE TO produce working Docker images

3.6 WHEN NestJS decorator metadata (emitDecoratorMetadata, experimentalDecorators) is used in app and lib source code THEN the system SHALL CONTINUE TO emit decorator metadata correctly for dependency injection to function
