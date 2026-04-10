# Skill: Thêm AI Adapter mới

Thêm một adapter mới (LLM, TTS, STT, hoặc Realtime) vào `libs/ai-core`.

## Input
- `adapterType`: Loại adapter — `llm`, `tts`, `stt`, `realtime`
- `providerName`: Tên provider (vd: `anthropic`, `azure-openai`, `google-tts`)
- `sdkPackage`: NPM package của provider SDK

## Steps

1. Cài SDK:
   ```bash
   npm install <sdkPackage>
   ```

2. Tạo adapter file `libs/ai-core/src/adapters/<providerName>-<adapterType>.adapter.ts`:
   ```typescript
   import { I<Type>Adapter } from '../interfaces/<type>.interface';

   export class <ProviderName><Type>Adapter implements I<Type>Adapter {
     constructor(
       private readonly model: string,
       private readonly apiKey: string,
     ) {}

     // Implement interface methods
   }
   ```

3. Đăng ký trong `AdapterFactory`:
   - Thêm case mới trong `create<Type>()` method
   - Map provider name → adapter class

4. Export adapter từ `libs/ai-core/src/index.ts`

5. Tạo unit tests `<providerName>-<adapterType>.adapter.spec.ts`:
   - Mock SDK calls
   - Test generate/synthesize/transcribe methods
   - Test error handling (AdapterError)

6. Cập nhật README-AI-CONFIG.md với ví dụ cấu hình mới

## Conventions
- Adapter implements interface tương ứng (ILlmAdapter, ITtsAdapter, etc.)
- Throw `AdapterError` với provider name, error code, message
- Không expose SDK-specific types ra ngoài adapter
- Mỗi adapter là stateless — config qua constructor
