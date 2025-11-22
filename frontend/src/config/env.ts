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

