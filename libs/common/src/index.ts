// Config
export { envConfigSchema, validateEnvConfig } from './config/env.config';
export type { EnvConfig } from './config/env.config';

// Auth
export { SsrcAuthGuard } from './auth/auth.guard';

// DTOs
export { StudentProfileDto } from './dto/student-profile.dto';
export { LessonDto } from './dto/lesson.dto';
export { SessionDto } from './dto/session.dto';

// Utils
export { parseJsonFromModelOutput } from './utils/json-parser.util';
export { normalizeText, extractAssistantMessage } from './utils/text.util';
