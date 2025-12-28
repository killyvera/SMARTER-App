# ¿Dónde Lee el Proyecto las Variables de Entorno?

## 📍 Ubicación de Lectura

El proyecto lee las variables de entorno desde **`process.env`** en el archivo:

**`frontend/src/config/env.ts`**

Este archivo:
1. Lee todas las variables de `process.env`
2. Las valida con Zod
3. Las exporta como `env` para usar en toda la aplicación

```typescript
// frontend/src/config/env.ts
export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env); // ← Lee de process.env
  // ...
}
```

## 📂 Dónde se Configuran las Variables

### Desarrollo Local

**Archivo:** `frontend/.env.local`

Next.js carga automáticamente este archivo cuando:
- Ejecutas `npm run dev`
- Ejecutas `npm run build`
- Ejecutas cualquier script que use Next.js

**Ubicación completa:**
```
C:\Code\smarter-app\frontend\.env.local
```

### Producción (Netlify)

**Netlify Dashboard** → **Site settings** → **Environment variables**

Netlify inyecta estas variables como `process.env` durante el build y runtime.

## 🔍 Cómo Ver las Variables Actuales

### Opción 1: Ver el archivo .env.local

```bash
cd frontend
cat .env.local
# O en Windows PowerShell:
Get-Content .env.local
```

### Opción 2: Ver desde el código

El archivo `frontend/src/config/env.ts` muestra TODAS las variables que el proyecto espera:

```typescript
const envSchema = z.object({
  NODE_ENV: ...,
  JWT_SECRET: ...,
  DATABASE_URL: ...,
  OPENAI_API_KEY: ...,
  // ... todas las demás
});
```

## 📋 Lista Completa de Variables

Basándote en `frontend/src/config/env.ts`, estas son TODAS las variables:

### Requeridas:
1. `DATABASE_URL` - Conexión a Supabase
2. `JWT_SECRET` - Secret para JWT (mínimo 32 caracteres)

### Opcionales (con defaults):
3. `NODE_ENV` - development | production | test
4. `AI_PROVIDER` - openai | azure
5. `OPENAI_API_KEY` - Tu API key de OpenAI
6. `OPENAI_MODEL` - gpt-4 (default)
7. `AZURE_OPENAI_ENDPOINT` - Si usas Azure
8. `AZURE_OPENAI_API_KEY` - Si usas Azure
9. `AZURE_OPENAI_DEPLOYMENT_NAME` - Si usas Azure
10. `AZURE_OPENAI_API_VERSION` - 2024-02-15-preview (default)

### Protección Agent Core (opcionales, con defaults):
11. `AI_RATE_LIMIT_VALIDATE_GOAL` - 5 (default)
12. `AI_RATE_LIMIT_UNLOCK_MINITASK` - 3 (default)
13. `AI_RATE_LIMIT_QUERY_COACH` - 10 (default)
14. `AI_RATE_LIMIT_GLOBAL_PER_SECOND` - 20 (default)
15. `AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD` - 5 (default)
16. `AI_CIRCUIT_BREAKER_TIMEOUT` - 30000 (default)
17. `AI_CIRCUIT_BREAKER_SUCCESS_THRESHOLD` - 2 (default)
18. `AI_TIMEOUT_VALIDATE_GOAL` - 30000 (default)
19. `AI_TIMEOUT_UNLOCK_MINITASK` - 45000 (default)
20. `AI_TIMEOUT_QUERY_COACH` - 20000 (default)
21. `AI_RETRY_MAX_ATTEMPTS` - 3 (default)
22. `AI_RETRY_BACKOFF_BASE` - 1000 (default)
23. `AI_LOOP_DETECTION_THRESHOLD` - 3 (default)
24. `AI_LOOP_DETECTION_WINDOW` - 10000 (default)
25. `AI_LOOP_DETECTION_BLOCK_DURATION` - 60000 (default)

## 📤 Cómo Copiar a Netlify

### Paso 1: Ver tus variables actuales

```bash
cd frontend
Get-Content .env.local
```

### Paso 2: Copiar a Netlify

1. Ve a **Netlify Dashboard** → Tu sitio → **Site settings** → **Environment variables**
2. Para cada variable en `.env.local`, agrega:
   - **Key:** El nombre de la variable (ej: `DATABASE_URL`)
   - **Value:** El valor SIN comillas (ej: `postgresql://...`)

### Ejemplo:

**En `.env.local` (con comillas):**
```env
DATABASE_URL="postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
JWT_SECRET="mi_secret_super_seguro_12345678901234567890"
```

**En Netlify (SIN comillas):**
```
DATABASE_URL = postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
JWT_SECRET = mi_secret_super_seguro_12345678901234567890
```

## 🔄 Flujo de Carga

```
┌─────────────────────────────────────┐
│  Desarrollo Local                   │
├─────────────────────────────────────┤
│  frontend/.env.local                │
│         ↓                           │
│  Next.js carga automáticamente      │
│         ↓                           │
│  process.env                        │
│         ↓                           │
│  frontend/src/config/env.ts         │
│         ↓                           │
│  Validación con Zod                 │
│         ↓                           │
│  export const env                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Producción (Netlify)               │
├─────────────────────────────────────┤
│  Netlify Dashboard                  │
│  Environment Variables              │
│         ↓                           │
│  Netlify inyecta en process.env     │
│         ↓                           │
│  frontend/src/config/env.ts         │
│         ↓                           │
│  Validación con Zod                 │
│         ↓                           │
│  export const env                   │
└─────────────────────────────────────┘
```

## ✅ Checklist para Netlify

Copia estas variables desde tu `.env.local` a Netlify:

- [ ] `DATABASE_URL` (requerida)
- [ ] `JWT_SECRET` (requerida)
- [ ] `NODE_ENV=production`
- [ ] `AI_PROVIDER` (si no es "openai")
- [ ] `OPENAI_API_KEY` (si usas OpenAI)
- [ ] `OPENAI_MODEL` (si no es "gpt-4")
- [ ] Variables de Azure (si usas Azure OpenAI)
- [ ] Variables de protección Agent Core (opcional, tienen defaults)

## 🚨 Importante

1. **NO uses comillas** en los valores de Netlify
2. **NO incluyas espacios** antes o después del `=`
3. **Copia exactamente** el valor (sin las comillas del .env.local)
4. Las variables opcionales con defaults **NO son necesarias** en Netlify a menos que quieras cambiar los defaults

