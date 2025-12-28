# Fix para Build de Netlify

## Problema Detectado

El build en Netlify está fallando porque:
1. Necesita ejecutar las migraciones de Prisma antes del build
2. El comando de build debe usar las variables de entorno directamente (no necesita `dotenv-cli`)

## Solución Aplicada

Se actualizó `netlify.toml` con el siguiente comando de build:

```toml
[build]
  command = "cd frontend && npm install && npx prisma migrate deploy && npx prisma generate && npm run build"
  publish = "frontend/.next"
```

## Explicación

1. **`npm install`**: Instala las dependencias
2. **`npx prisma migrate deploy`**: Aplica las migraciones a la base de datos de Supabase (usa `DATABASE_URL` de las variables de entorno)
3. **`npx prisma generate`**: Genera el cliente de Prisma
4. **`npm run build`**: Compila Next.js

## Variables de Entorno Requeridas en Netlify

Asegúrate de tener configuradas en Netlify Dashboard → Environment Variables:

```
DATABASE_URL=postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres
NODE_ENV=production
AI_PROVIDER=openai
OPENAI_API_KEY=tu_key
OPENAI_MODEL=gpt-4
```

## Nota sobre dotenv-cli

En Netlify, **NO necesitas** `dotenv-cli` porque las variables de entorno están disponibles directamente en `process.env`. El comando `prisma migrate deploy` leerá automáticamente `DATABASE_URL` de las variables de entorno de Netlify.

## Próximos Pasos

1. Hacer commit y push de los cambios en `netlify.toml`
2. Verificar que todas las variables de entorno estén configuradas en Netlify
3. Disparar un nuevo build en Netlify
4. Verificar los logs del build para confirmar que las migraciones se ejecutaron correctamente

