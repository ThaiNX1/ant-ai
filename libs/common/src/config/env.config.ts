import * as Joi from 'joi';

export const envConfigSchema = Joi.object({
  GEMINI_API_KEY: Joi.string().required(),
  OPENAI_API_KEY: Joi.string().required(),
  ELEVENLABS_API_KEY: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
}).options({ allowUnknown: true });

export interface EnvConfig {
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
}

/**
 * Validates environment variables against the schema.
 * Returns the validated config or throws an error describing invalid/missing vars.
 */
export function validateEnvConfig(
  env: Record<string, unknown>,
): EnvConfig {
  const { error, value } = envConfigSchema.validate(env, {
    abortEarly: false,
  });

  if (error) {
    const missingVars = error.details.map((d) => d.message).join('; ');
    throw new Error(`Config validation error: ${missingVars}`);
  }

  return value as EnvConfig;
}
