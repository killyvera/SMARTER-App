# Configuración de DATABASE_URL para Netlify

## URL Correcta (SIN comillas)

Para tu proyecto, la URL debe configurarse así en Netlify:

```
postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

## ⚠️ IMPORTANTE: NO uses comillas en Netlify

### ❌ INCORRECTO (con comillas):
```
DATABASE_URL="postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

### ✅ CORRECTO (sin comillas):
```
postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

## Pasos para Configurar en Netlify

1. **Ve a Netlify Dashboard**
   - Abre tu sitio
   - Click en **Site settings**
   - Click en **Environment variables**

2. **Busca o crea `DATABASE_URL`**
   - Si ya existe, haz click en el ícono de editar (lápiz)
   - Si no existe, haz click en **Add a variable**

3. **Pega el valor SIN comillas**
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1`
   - **NO incluyas comillas dobles o simples**

4. **Guarda y redeploy**
   - Click en **Save**
   - Ve a **Deploys** y haz click en **Trigger deploy** → **Deploy site**

## Verificación

Después de configurar, verifica en los logs del build:

1. Ve a **Deploys** → Selecciona el último deploy
2. Revisa los logs
3. Busca la línea que dice:
   ```
   Datasource "db": PostgreSQL database "postgres"...
   ```
4. Si ves un error `P1013`, significa que la URL aún tiene problemas

## Problemas Comunes

### Error: "P1013: The provided database string is invalid"

**Causas posibles:**
1. ✅ Tienes comillas alrededor del valor en Netlify
2. ✅ Hay espacios al inicio o final del valor
3. ✅ La URL se cortó al copiar/pegar

**Solución:**
- Copia la URL directamente desde este documento
- Pégala en Netlify SIN comillas
- Asegúrate de que no haya espacios antes o después

### Error: "Connection timeout" o "Can't reach database server"

**Causas posibles:**
1. El pooler de Supabase está temporalmente no disponible
2. Hay restricciones de IP (poco probable con pooler)

**Solución:**
- Espera unos minutos e intenta de nuevo
- Verifica el estado de Supabase: https://status.supabase.com

## URL para Desarrollo Local (.env.local)

En tu archivo `frontend/.env.local`, usa CON comillas:

```env
DATABASE_URL="postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Nota:** En archivos `.env` locales SÍ se usan comillas, pero en Netlify NO.

## Comando para Validar Localmente

```bash
cd frontend
npm run db:validate-url "postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

Si el comando muestra "✅ La URL parece estar bien formateada", entonces el problema está en cómo está configurada en Netlify.

