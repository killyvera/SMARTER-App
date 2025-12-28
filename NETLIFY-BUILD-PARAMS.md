# Parámetros de Build para Netlify - Next.js

## Configuración Actual

Tu proyecto usa **Next.js 14.0.4** con el plugin oficial de Netlify (`@netlify/plugin-nextjs`).

## Parámetros Correctos para Netlify Dashboard

### Opción 1: Usando el Plugin de Next.js (Recomendado)

Si ya tienes `netlify.toml` con el plugin configurado, **NO necesitas configurar manualmente** en el dashboard. El plugin maneja todo automáticamente.

Pero si quieres configurarlo manualmente en el dashboard:

#### Build command:
```
cd frontend && npm run build
```

**Nota:** NO incluyas `npm install` porque Netlify lo ejecuta automáticamente antes del build.

#### Publish directory:
```
frontend/.next
```

**⚠️ IMPORTANTE:** Si usas el plugin `@netlify/plugin-nextjs`, este parámetro puede ser ignorado porque el plugin maneja el output automáticamente.

#### Functions directory:
```
netlify/functions
```

O déjalo vacío si no tienes funciones serverless personalizadas (Next.js API routes se manejan automáticamente).

---

### Opción 2: Sin Plugin (Configuración Manual Completa)

Si prefieres NO usar el plugin, configura así:

#### Build command:
```
cd frontend && npm install && npm run build
```

#### Publish directory:
```
frontend/.next
```

#### Functions directory:
```
netlify/functions
```

---

## Verificación de tu Configuración Actual

Tu `netlify.toml` actual tiene:

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/.next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Recomendación

**Opción A: Dejar que el plugin maneje todo (Recomendado)**

En el dashboard de Netlify, puedes dejar los campos vacíos o usar:

- **Build command:** `cd frontend && npm run build` (sin `npm install`)
- **Publish directory:** `frontend/.next` (aunque el plugin puede ignorarlo)
- **Functions directory:** `netlify/functions` o vacío

**Opción B: Configuración manual sin plugin**

1. Remueve el plugin de `netlify.toml`
2. Usa en el dashboard:
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/.next`
   - **Functions directory:** `netlify/functions`

---

## Script de Build en package.json

Tu script actual es:
```json
"build": "prisma generate && next build"
```

Esto es correcto. El build:
1. Genera el cliente de Prisma
2. Compila Next.js

---

## Variables de Entorno Necesarias

Asegúrate de configurar en Netlify Dashboard → Environment Variables:

### Requeridas:
```
DATABASE_URL=postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres
```

### Opcionales (para IA):
```
OPENAI_API_KEY=tu_key
OPENAI_MODEL=gpt-4
AI_PROVIDER=openai
```

---

## Resumen Rápido

**Para la configuración en el dashboard de Netlify:**

```
Project to deploy: frontend
Build command: cd frontend && npm run build
Publish directory: frontend/.next
Functions directory: netlify/functions (o vacío)
```

**O mejor aún:** Deja que `netlify.toml` maneje la configuración y solo verifica que las variables de entorno estén configuradas.

