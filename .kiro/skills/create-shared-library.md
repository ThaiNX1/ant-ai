# Skill: Tạo Shared Library

Tạo một shared library mới trong `libs/` theo đúng conventions của monorepo.

## Input
- `libName`: Tên library (kebab-case, vd: `notification`, `cache`)
- `isDynamic`: Có cần Dynamic Module pattern không (true/false)

## Steps

1. Generate library:
   ```bash
   npx nx g @nx/nest:lib libs/<libName>
   ```

2. Cấu trúc thư mục:
   ```
   libs/<libName>/src/
     index.ts              — barrel file export public API
     <libName>.module.ts   — NestJS module
     interfaces/           — TypeScript interfaces
     services/             — Business logic
     constants/            — Injection tokens, constants
   ```

3. Nếu `isDynamic = true`, tạo Dynamic Module:
   ```typescript
   @Module({})
   export class FeatureModule {
     static register(options: FeatureModuleOptions): DynamicModule {
       return {
         module: FeatureModule,
         providers: [...],
         exports: [...],
       };
     }
   }
   ```

4. Tạo barrel file `src/index.ts`:
   - Export module
   - Export interfaces (dùng `export type` cho type-only)
   - Export services
   - Export constants

5. Thêm path alias vào `tsconfig.base.json`:
   ```json
   "@ai-platform/<libName>": ["libs/<libName>/src/index.ts"]
   ```

6. Tạo unit tests cho services

## Conventions
- Public API chỉ qua `index.ts` — không import trực tiếp từ internal files
- Dùng injection tokens cho abstract dependencies
- Dùng `export type` cho type-only exports
- Mỗi library phải có README nếu có configuration phức tạp
