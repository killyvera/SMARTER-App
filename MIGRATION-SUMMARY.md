# Resumen de Migración a Supabase

## Cambios Realizados

### 1. Schema de Prisma Actualizado
- ✅ Cambiado de `sqlite` a `postgresql` en `frontend/prisma/schema.prisma`
- ✅ El schema ahora usa PostgreSQL como provider

### 2. Documentación Creada
- ✅ `SUPABASE-SETUP.md` - Guía completa de configuración de Supabase
- ✅ `NETLIFY-SETUP.md` - Actualizado con información de Supabase
- ✅ `MIGRATION-SUMMARY.md` - Este archivo

### 3. Scripts Agregados
- ✅ `frontend/migrate-to-supabase.ts` - Script de verificación de migración
- ✅ Nuevos comandos en `package.json`:
  - `db:migrate:deploy` - Para ejecutar migraciones en producción
  - `db:migrate:dev` - Para crear nuevas migraciones en desarrollo
  - `db:check-supabase` - Para verificar conexión a Supabase

## Próximos Pasos

### 1. Crear Proyecto en Supabase
1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Guarda la contraseña de la base de datos

### 2. Configurar Variables de Entorno

#### Desarrollo Local
Crea/actualiza `frontend/.env.local`:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
JWT_SECRET="tu_jwt_secret_aqui_minimo_32_caracteres"
AI_PROVIDER="openai"
OPENAI_API_KEY="tu-api-key"
OPENAI_MODEL="gpt-4"
```

#### Netlify
1. Ve a Netlify Dashboard → Site settings → Environment variables
2. Agrega las mismas variables

### 3. Ejecutar Migraciones

```bash
cd frontend
npm run db:migrate:deploy
```

O si prefieres usar `db push` (solo desarrollo):
```bash
npm run db:migrate
```

### 4. Verificar Conexión

```bash
npm run db:check-supabase
```

### 5. (Opcional) Ejecutar Seed

```bash
npm run db:seed
```

## Notas Importantes

### Connection Pooling
- **Recomendado para producción**: Usa puerto `6543` con `pgbouncer=true`
- **Solo desarrollo**: Puedes usar puerto `5432` directamente

### Migraciones Existentes
Las migraciones actuales fueron creadas para SQLite. Para PostgreSQL:
- Usa `prisma db push` para sincronizar el schema directamente, O
- Crea nuevas migraciones con `prisma migrate dev --name init_postgresql`

### Base de Datos Local
- La base de datos SQLite local (`dev.db`) se mantiene para desarrollo
- Puedes seguir usando SQLite localmente cambiando temporalmente el provider
- Para producción (Netlify), siempre usa Supabase

## Troubleshooting

### Error: "Connection timeout"
- Verifica la connection string
- Asegúrate de usar el puerto correcto (6543 para pooling, 5432 para directo)
- Verifica que tu IP no esté bloqueada en Supabase

### Error: "Schema does not match"
- Ejecuta `npx prisma db push` para sincronizar
- O crea nuevas migraciones con `npx prisma migrate dev`

### Error: "Too many connections"
- Usa connection pooling (puerto 6543)
- Reduce `connection_limit` en la connection string

## Archivos Modificados

- `frontend/prisma/schema.prisma` - Provider cambiado a postgresql
- `frontend/package.json` - Nuevos scripts agregados
- `NETLIFY-SETUP.md` - Actualizado con info de Supabase
- `SUPABASE-SETUP.md` - Nuevo archivo con guía completa

## Archivos Nuevos

- `SUPABASE-SETUP.md` - Guía de configuración
- `frontend/migrate-to-supabase.ts` - Script de verificación
- `MIGRATION-SUMMARY.md` - Este resumen

