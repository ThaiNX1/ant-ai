# Skill: Tạo NestJS Feature Module

Tạo một feature module hoàn chỉnh trong NestJS app theo đúng conventions của project.

## Input
- `appName`: Tên app (vd: `lesson-service`, `customer-service`)
- `featureName`: Tên feature (kebab-case, vd: `quiz`, `notification`)

## Steps

1. Tạo thư mục `apps/<appName>/src/app/<featureName>/`

2. Tạo DTO files trong `dto/`:
   - `create-<featureName>.dto.ts` — với class-validator decorators
   - `update-<featureName>.dto.ts` — extends PartialType(CreateDto)

3. Tạo `<featureName>.service.ts`:
   - Injectable service
   - Inject dependencies qua constructor
   - Business logic methods

4. Tạo `<featureName>.controller.ts`:
   - Controller với route prefix = featureName
   - Inject service
   - RESTful endpoints: GET, POST, PATCH, DELETE
   - Dùng DTOs cho request validation

5. Tạo `<featureName>.module.ts`:
   - Import dependencies
   - Declare controller và service
   - Export service nếu cần dùng ở module khác

6. Tạo test files:
   - `<featureName>.controller.spec.ts`
   - `<featureName>.service.spec.ts`
   - Mock tất cả dependencies
   - Test happy path + error cases

7. Import module vào `app.module.ts` của app

## Conventions
- File names: kebab-case
- Class names: PascalCase + suffix (Controller, Service, Module, Dto)
- Route prefix: kebab-case resource name
- DTOs: class-validator decorators, `!` cho required fields
- Tests: cùng thư mục, `.spec.ts` suffix
- Imports order: NestJS → third-party → @ai-platform/* → relative
