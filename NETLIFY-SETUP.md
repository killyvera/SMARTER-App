# Guía de Despliegue en Netlify

## Requisitos Previos

1. ✅ Cuenta en Netlify (gratuita): https://app.netlify.com
2. ✅ Node.js instalado
3. ✅ Git configurado (opcional, pero recomendado)

## Pasos Rápidos

### 1. Instalar y Configurar Netlify CLI

```batch
setup-netlify.bat
```

Este script:
- Instala Netlify CLI globalmente
- Te permite iniciar sesión
- Configura el sitio (nuevo o existente)

### 2. Configurar Variables de Entorno

**IMPORTANTE:** Antes de hacer deploy, configura las variables de entorno en Netlify:

1. Ve a tu sitio en Netlify Dashboard
2. **Site settings** → **Environment variables**
3. Agrega las siguientes variables:

#### Variables Requeridas:

```
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=tu_jwt_secret_aqui_minimo_32_caracteres
```

#### Variables Opcionales (según tu configuración):

**Para OpenAI:**
```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4
AI_PROVIDER=openai
```

**Para Azure OpenAI:**
```
AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com/
AZURE_OPENAI_API_KEY=tu_key
AZURE_OPENAI_DEPLOYMENT_NAME=tu-deployment
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AI_PROVIDER=azure
```

### 3. Hacer Deploy

**Deploy de prueba (draft):**
```batch
deploy-netlify.bat
# Selecciona opción 1
```

**Deploy a producción:**
```batch
deploy-netlify.bat
# Selecciona opción 2
```

O manualmente:
```bash
netlify deploy --prod
```

## Configuración de Base de Datos

⚠️ **IMPORTANTE:** SQLite no funciona bien en Netlify (es read-only).

### Opción 1: Usar PostgreSQL (Recomendado)

1. Crea una base de datos PostgreSQL gratuita en:
   - [Supabase](https://supabase.com) (gratis)
   - [Neon](https://neon.tech) (gratis)
   - [Railway](https://railway.app) (gratis con límites)

2. Obtén la connection string (ej: `postgresql://user:pass@host:5432/dbname`)

3. Actualiza `DATABASE_URL` en Netlify:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

4. Actualiza `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

5. Ejecuta migraciones:
   ```bash
   cd frontend
   npx prisma migrate deploy
   ```

### Opción 2: Usar SQLite con Volumen Persistente

Netlify no soporta volúmenes persistentes, así que esta opción **NO funciona** en producción.

## Estructura del Proyecto

```
smarter-app/
├── netlify.toml          # Configuración de Netlify
├── frontend/
│   ├── .next/           # Build output (generado)
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── setup-netlify.bat     # Script de configuración
```

## Comandos Útiles

**Ver estado del sitio:**
```bash
netlify status
```

**Ver logs en tiempo real:**
```bash
netlify logs
```

**Abrir dashboard:**
```bash
netlify open
```

**Ver variables de entorno:**
```bash
netlify env:list
```

**Agregar variable de entorno:**
```bash
netlify env:set VARIABLE_NAME "valor"
```

## Solución de Problemas

### Error: "Prisma Client not generated"

**Solución:** Agrega `postinstall` script en `package.json`:
```json
"postinstall": "prisma generate"
```

Ya está incluido en el `package.json` actualizado.

### Error: "Database is locked" (SQLite)

**Solución:** Cambia a PostgreSQL. SQLite no funciona en Netlify.

### Error: Build timeout

**Solución:** 
- Verifica que `netlify.toml` esté configurado correctamente
- Reduce el tamaño del build eliminando dependencias innecesarias

### Variables de entorno no se cargan

**Solución:**
- Verifica que las variables estén en **Site settings** → **Environment variables**
- Asegúrate de que los nombres coincidan exactamente
- Reinicia el build después de agregar variables

## Deploy Automático con Git

Si conectas tu repositorio Git a Netlify:

1. **Netlify Dashboard** → **Site settings** → **Build & deploy**
2. Conecta tu repositorio (GitHub, GitLab, Bitbucket)
3. Configura:
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/.next`
4. Cada push a `main`/`master` hará deploy automático

## URLs

Después del deploy, tendrás:
- **URL de producción:** `https://tu-sitio.netlify.app`
- **URL de draft:** `https://xxxx--tu-sitio.netlify.app` (para previews)

## Notas Importantes

⚠️ **Base de Datos:** SQLite NO funciona en Netlify. Usa PostgreSQL.

⚠️ **Variables de Entorno:** Nunca commitees `.env.local` al repositorio.

⚠️ **Build Time:** El primer build puede tardar varios minutos.

⚠️ **Límites Gratuitos:**
- 100 GB bandwidth/mes
- 300 minutos de build/mes
- Funciones serverless limitadas

## Próximos Pasos

1. ✅ Configura PostgreSQL
2. ✅ Actualiza `DATABASE_URL` en Netlify
3. ✅ Ejecuta migraciones
4. ✅ Haz deploy
5. ✅ Verifica que todo funcione

