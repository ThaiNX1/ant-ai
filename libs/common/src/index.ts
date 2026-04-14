// Config
export { envConfigSchema, validateEnvConfig } from './config/env.config';
export type { EnvConfig } from './config/env.config';

// Auth
export { SsrcAuthGuard } from './auth/auth.guard';
export { ApiKeyGuard } from './auth/api-key.guard';
export { DbApiKeyGuard } from './auth/db-api-key.guard';
export type { IApiKeyValidator, ApiKeyPayload } from './auth/db-api-key.guard';
export { API_KEY_VALIDATOR } from './auth/db-api-key.guard';
export { RootApiKeyGuard } from './auth/root-api-key.guard';

// DTOs
export { StudentProfileDto } from './dto/student-profile.dto';
export { LessonDto } from './dto/lesson.dto';
export { SessionDto } from './dto/session.dto';

// Utils
export { parseJsonFromModelOutput } from './utils/json-parser.util';
export { normalizeText, extractAssistantMessage } from './utils/text.util';
