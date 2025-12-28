# Solución: Error P1013 - Invalid Database URL en Netlify

## Problema

Netlify está fallando con el error:
```
Error: P1013: The provided database string is invalid. The provided arguments are not supported in database URL.
```

## Causa

La URL de conexión de PostgreSQL puede tener caracteres especiales que necesitan ser codificados (URL encoding), especialmente:
- Contraseñas con caracteres especiales (`@`, `:`, `/`, `?`, `#`, `[`, `]`, `&`, `%`)
- Parámetros de query string mal formateados

## Solución

### Paso 1: Verificar la URL Actual

La URL debería tener este formato:
```
postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

### Paso 2: Codificar la Contraseña (si tiene caracteres especiales)

Si tu contraseña tiene caracteres especiales, necesitas codificarlos usando URL encoding:

**Caracteres comunes y su codificación:**
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`
- `[` → `%5B`
- `]` → `%5D`
- `&` → `%26`
- `%` → `%25`
- ` ` (espacio) → `%20`

**Ejemplo:**
Si tu contraseña es `myp@ss:word`, la URL sería:
```
postgresql://postgres.ibeprsncarttfjjbqiwj:myp%40ss%3Aword@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

### Paso 3: Verificar el Formato en Netlify

1. Ve a **Netlify Dashboard** → Tu sitio → **Site settings** → **Environment variables**
2. Busca `DATABASE_URL`
3. **Asegúrate de que:**
   - NO tenga comillas al inicio o final
   - NO tenga espacios extra
   - La contraseña esté codificada si tiene caracteres especiales
   - Los parámetros de query estén correctos: `?pgbouncer=true&connection_limit=1`

### Paso 4: Formato Correcto para Netlify

En Netlify, el valor debe ser **exactamente así** (sin comillas):

```
postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

### Paso 5: Usar Herramienta de Codificación

Puedes usar PowerShell para codificar la contraseña:

```powershell
# Codificar una contraseña
$password = "tu-contraseña-con-caracteres-especiales"
[System.Web.HttpUtility]::UrlEncode($password)
```

O usar un codificador online: https://www.urlencoder.org/

## Verificación

### Opción 1: Probar la URL Localmente

Crea un archivo temporal `test-db-url.js`:

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
```

Ejecuta:
```bash
cd frontend
DATABASE_URL="tu-url-aqui" node test-db-url.js
```

### Opción 2: Verificar en Netlify Build Logs

1. Ve a **Deploys** → Selecciona el último deploy
2. Revisa los logs del build
3. Busca el mensaje de error de Prisma
4. Verifica qué parte de la URL está causando el problema

## Soluciones Alternativas

### Si la Contraseña Tiene Caracteres Especiales

**Opción A: Cambiar la Contraseña en Supabase**

1. Ve a Supabase Dashboard → **Settings** → **Database**
2. Haz clic en **Reset Database Password**
3. Genera una nueva contraseña **sin caracteres especiales**
4. Actualiza `DATABASE_URL` en Netlify con la nueva contraseña

**Opción B: Codificar la Contraseña**

Usa la herramienta de codificación mencionada arriba.

### Si el Problema Persiste

1. **Verifica que la URL no tenga espacios:**
   - Copia la URL directamente desde Supabase Dashboard
   - Pégala en un editor de texto plano primero
   - Luego cópiala a Netlify

2. **Usa el formato de Session Pooler:**
   ```
   postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
   ```

3. **Verifica que todos los parámetros estén presentes:**
   - `pgbouncer=true` (recomendado para Netlify)
   - `connection_limit=1` (requerido para pooler)

## Ejemplo Completo

**URL Original (con contraseña que tiene `@`):**
```
postgresql://postgres.ibeprsncarttfjjbqiwj:myP@ssw0rd@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**URL Codificada (correcta):**
```
postgresql://postgres.ibeprsncarttfjjbqiwj:myP%40ssw0rd@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

## Referencias

- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [URL Encoding](https://www.urlencoder.org/)

