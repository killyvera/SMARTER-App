import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string(),
  // OpenAI API (default)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  // Azure OpenAI (opcional)
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_DEPLOYMENT_NAME: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-02-15-preview'),
  // Provider selection
  AI_PROVIDER: z.enum(['openai', 'azure']).default('openai'),
  // Rate Limiting (opcional, con defaults)
  AI_RATE_LIMIT_VALIDATE_GOAL: z.string().default('5'),
  AI_RATE_LIMIT_UNLOCK_MINITASK: z.string().default('3'),
  AI_RATE_LIMIT_QUERY_COACH: z.string().default('10'),
  AI_RATE_LIMIT_GLOBAL_PER_SECOND: z.string().default('20'),
  // Circuit Breaker (opcional, con defaults)
  AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.string().default('5'),
  AI_CIRCUIT_BREAKER_TIMEOUT: z.string().default('30000'),
  AI_CIRCUIT_BREAKER_SUCCESS_THRESHOLD: z.string().default('2'),
  // Timeouts (opcional, con defaults)
  AI_TIMEOUT_VALIDATE_GOAL: z.string().default('30000'),
  AI_TIMEOUT_UNLOCK_MINITASK: z.string().default('45000'),
  AI_TIMEOUT_QUERY_COACH: z.string().default('20000'),
  // Retry (opcional, con defaults)
  AI_RETRY_MAX_ATTEMPTS: z.string().default('3'),
  AI_RETRY_BACKOFF_BASE: z.string().default('1000'),
  // Loop Detection (opcional, con defaults)
  AI_LOOP_DETECTION_THRESHOLD: z.string().default('3'),
  AI_LOOP_DETECTION_WINDOW: z.string().default('10000'),
  AI_LOOP_DETECTION_BLOCK_DURATION: z.string().default('60000'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  
  const env = parsed.data;
  
  // Validar que tengamos las credenciales necesarias según el proveedor
  if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY no configurada. Las validaciones SMARTER no funcionarán.');
  }
  
  if (env.AI_PROVIDER === 'azure') {
    if (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_API_KEY || !env.AZURE_OPENAI_DEPLOYMENT_NAME) {
      console.warn('⚠️ Credenciales de Azure OpenAI incompletas. Las validaciones SMARTER no funcionarán.');
    }
  }
  
  return env;
}

export const env = validateEnv();

