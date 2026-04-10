---
inclusion: always
---

# Testing Standards

## Framework
- Jest 29 cho unit tests
- fast-check 3.23 cho property-based tests
- @nestjs/testing cho NestJS integration

## File Naming
- Unit tests: `<name>.spec.ts` (cùng thư mục với source file)
- Property tests: `<name>.property.spec.ts`

## Unit Test Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('FeatureService', () => {
  let service: FeatureService;
  let dependency: jest.Mocked<DependencyService>;

  beforeEach(async () => {
    const mockDependency = {
      method: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        { provide: DependencyService, useValue: mockDependency },
      ],
    }).compile();

    service = module.get(FeatureService);
    dependency = module.get(DependencyService) as jest.Mocked<DependencyService>;
  });

  describe('methodName', () => {
    it('should describe expected behavior', async () => {
      dependency.method.mockResolvedValue(expectedValue);
      const result = await service.methodName(input);
      expect(result).toEqual(expected);
    });

    it('should handle error case', async () => {
      dependency.method.mockRejectedValue(new Error('fail'));
      await expect(service.methodName(input)).rejects.toThrow('fail');
    });
  });
});
```

## Property-Based Test Pattern

```typescript
import * as fc from 'fast-check';

describe('Property: description', () => {
  it('should satisfy property for all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (input) => {
          const result = functionUnderTest(input);
          // Assert property holds
          expect(result).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Rules
- Mỗi test file test đúng 1 unit (controller, service, etc.)
- Mock tất cả external dependencies
- Không gọi API thật, không kết nối database thật trong unit tests
- Mỗi `describe` block = 1 method hoặc 1 endpoint
- Mỗi `it` block = 1 behavior cụ thể
- Test cả happy path và error cases
- Property tests: tối thiểu 100 iterations (`numRuns: 100`)
- Mỗi correctness property = đúng 1 test function

## Nx Test Commands
- Test 1 app: `npx nx test <app-name>`
- Test affected: `npx nx affected -t test`
- Test all: `npx nx run-many -t test`
