# Tasks

## 1. Configure TypeScript project references for libs
- [x] 1.1 Update `libs/common/tsconfig.lib.json`: add `"composite": true`, `"declarationMap": true`, set `"rootDir": "src"`, set `"outDir": "../../dist/libs/common"`
- [x] 1.2 Update `libs/ai-core/tsconfig.lib.json`: add `"composite": true`, `"declarationMap": true`, set `"rootDir": "src"`, set `"outDir": "../../dist/libs/ai-core"`
- [x] 1.3 Update `libs/database/tsconfig.lib.json`: add `"composite": true`, `"declarationMap": true`, set `"rootDir": "src"`, set `"outDir": "../../dist/libs/database"`
- [x] 1.4 Update `libs/backend-client/tsconfig.lib.json`: add `"composite": true`, `"declarationMap": true`, set `"rootDir": "src"`, set `"outDir": "../../dist/libs/backend-client"`

## 2. Add project references to app tsconfigs
- [x] 2.1 Update `apps/ai-service/tsconfig.app.json`: add `"references": [{ "path": "../../libs/ai-core/tsconfig.lib.json" }]`
- [x] 2.2 Update `apps/customer-service/tsconfig.app.json`: add `"references": [{ "path": "../../libs/ai-core/tsconfig.lib.json" }, { "path": "../../libs/database/tsconfig.lib.json" }, { "path": "../../libs/common/tsconfig.lib.json" }]`
- [x] 2.3 Update `apps/lesson-service/tsconfig.app.json`: add `"references": [{ "path": "../../libs/ai-core/tsconfig.lib.json" }, { "path": "../../libs/common/tsconfig.lib.json" }]`

## 3. Update Dockerfiles for tsc output structure
- [x] 3.1 Update `apps/ai-service/Dockerfile`: copy full `dist/` directory and `node_modules/`, update CMD entrypoint to match tsc output path, remove comment about webpack-generated package.json
- [x] 3.2 Update `apps/customer-service/Dockerfile`: copy full `dist/` directory and `node_modules/`, update CMD entrypoint to match tsc output path, remove comment about webpack-generated package.json

## 4. Remove webpack dependencies
- [x] 4.1 Remove `@nx/webpack` and `webpack` from `devDependencies` in `package.json`

## 5. Verify build pipeline
- [x] 5.1 Run `npx nx run-many -t build` and verify all 7 projects build successfully
- [x] 5.2 Run `npx nx run-many -t test` and verify all tests pass
- [x] 5.3 Run `npx nx run-many -t lint` and verify all lint checks pass
