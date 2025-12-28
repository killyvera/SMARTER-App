# Guía de Variables de Entorno

## Archivos de Ejemplo

1. **`frontend/.env.example`** - Para desarrollo local
2. **`.env.netlify.example`** - Para Netlify (formato sin comillas)

## Configuración por Entorno

### Desarrollo Local

1. Copia el archivo de ejemplo:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Edita `.env.local` y completa con tus valores reales

3. **NUNCA** commitees `.env.local` al repositorio

### Netlify (Producción)

1. Ve a tu sitio en Netlify Dashboard
2. **Site settings** → **Environment variables**
3. Agrega cada variable una por una
4. **Importante:** NO uses comillas en los valores en Netlify

#### Variables Requeridas para Netlify:

```
DATABASE_URL=postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-tu-api-key
OPENAI_MODEL=gpt-4
NODE_ENV=production
```

#### Variables Opcionales (con defaults):

Las siguientes tienen valores por defecto, pero puedes configurarlas si necesitas ajustar:

```
AI_RATE_LIMIT_VALIDATE_GOAL=5
AI_RATE_LIMIT_UNLOCK_MINITASK=3
AI_RATE_LIMIT_QUERY_COACH=10
AI_RATE_LIMIT_GLOBAL_PER_SECOND=20
AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
AI_CIRCUIT_BREAKER_TIMEOUT=30000
AI_CIRCUIT_BREAKER_SUCCESS_THRESHOLD=2
AI_TIMEOUT_VALIDATE_GOAL=30000
AI_TIMEOUT_UNLOCK_MINITASK=45000
AI_TIMEOUT_QUERY_COACH=20000
AI_RETRY_MAX_ATTEMPTS=3
AI_RETRY_BACKOFF_BASE=1000
AI_LOOP_DETECTION_THRESHOLD=3
AI_LOOP_DETECTION_WINDOW=10000
AI_LOOP_DETECTION_BLOCK_DURATION=60000
```

## Generar JWT Secret Seguro

### En Windows (PowerShell):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### En Linux/Mac:
```bash
openssl rand -base64 32
```

O usa un generador online: https://generate-secret.vercel.app/32

## Verificar Variables de Entorno

### Desarrollo Local:
```bash
cd frontend
npm run db:test-connection
```

### Netlify:
- Ve a **Deploys** → Selecciona un deploy → **Deploy log**
- Verifica que no haya errores de variables faltantes

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Verifica que `.env.local` exista en `frontend/`
- Verifica que la variable esté escrita correctamente
- Reinicia el servidor de desarrollo

### Error: "Invalid DATABASE_URL"
- Verifica que la URL de Supabase sea correcta
- Verifica que la contraseña esté incluida
- Verifica que `pgbouncer=true&connection_limit=1` esté presente

### Error en Netlify: "Build failed"
- Verifica que todas las variables requeridas estén configuradas
- Verifica que no haya espacios extra en los valores
- Verifica que no uses comillas en los valores de Netlify

## Seguridad

1. **NUNCA** commitees archivos `.env` o `.env.local`
2. **NUNCA** compartas tus secrets públicamente
3. Rota tus secrets regularmente (especialmente JWT_SECRET)
4. Usa diferentes secrets para desarrollo y producción
5. Limita el acceso a las variables de entorno en Netlify

## Archivos a Ignorar

Asegúrate de que `.gitignore` incluya:
```
.env
.env.local
.env*.local
```

