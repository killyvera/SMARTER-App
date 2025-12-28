# Guía: Solucionar Error P3005 - Baseline de Migraciones de Prisma

## Problema

Cuando intentas ejecutar `prisma migrate deploy` en Netlify, obtienes el error:

```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
```

## Causa

Este error ocurre cuando:
- La base de datos **ya tiene tablas** (creadas con `db push` o manualmente)
- Prisma **no tiene un historial** de qué migraciones se aplicaron
- Prisma intenta aplicar migraciones pero encuentra que la base de datos no está vacía

## Solución: Hacer Baseline de las Migraciones

### Opción 1: Usar el Script Automático (Recomendado)

1. **Ejecuta el script de baseline localmente:**
   ```bash
   cd frontend
   npm run db:baseline
   ```

2. **El script:**
   - Verifica la conexión a la base de datos
   - Crea la tabla `_prisma_migrations` si no existe
   - Marca todas las migraciones existentes como "aplicadas"
   - Permite que Prisma sepa qué migraciones ya están en la base de datos

3. **Después del baseline, verifica:**
   ```bash
   npm run db:migrate:deploy
   ```

### Opción 2: Hacer Baseline Manualmente

Si prefieres hacerlo manualmente:

1. **Conecta a tu base de datos de Supabase:**
   - Ve a Supabase Dashboard → SQL Editor

2. **Crea la tabla de migraciones (si no existe):**
   ```sql
   CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
     "id" VARCHAR(36) PRIMARY KEY,
     "checksum" VARCHAR(64) NOT NULL,
     "finished_at" TIMESTAMP,
     "migration_name" VARCHAR(255) NOT NULL,
     "logs" TEXT,
     "rolled_back_at" TIMESTAMP,
     "started_at" TIMESTAMP NOT NULL DEFAULT now(),
     "applied_steps_count" INTEGER NOT NULL DEFAULT 0
   );
   ```

3. **Marca cada migración como aplicada:**
   ```sql
   INSERT INTO "_prisma_migrations" (
     "id",
     "checksum",
     "finished_at",
     "migration_name",
     "started_at",
     "applied_steps_count"
   ) VALUES (
     gen_random_uuid()::text,
     'checksum-aqui',  -- Puedes usar un hash SHA-256 del archivo migration.sql
     NOW(),
     '20250101000000_add_minitask_metrics_plugins',
     NOW(),
     1
   );
   ```

   Repite para cada migración en `frontend/prisma/migrations/`.

### Opción 3: Usar Prisma Migrate Resolve

Para cada migración, ejecuta:

```bash
cd frontend
npx prisma migrate resolve --applied 20250101000000_add_minitask_metrics_plugins
npx prisma migrate resolve --applied 20250101000000_add_time_tracking
npx prisma migrate resolve --applied 20250101000001_add_biometric_auth
npx prisma migrate resolve --applied 20250102000000_add_minitask_order_priority_dependencies
```

## Verificación

Después de hacer el baseline:

1. **Verifica que las migraciones estén marcadas:**
   ```bash
   cd frontend
   npx prisma migrate status
   ```

2. **Intenta hacer deploy de migraciones:**
   ```bash
   npm run db:migrate:deploy
   ```

   Debería mostrar: "All migrations have already been applied"

## Para Netlify

Una vez que hayas hecho el baseline localmente:

1. **El baseline se aplica a la base de datos de producción** (Supabase)
2. **Netlify podrá ejecutar `prisma migrate deploy` sin problemas**
3. **Los builds futuros funcionarán correctamente**

## Migraciones Futuras

Después del baseline:

- Las nuevas migraciones se aplicarán normalmente
- Usa `npm run db:migrate:dev` para crear nuevas migraciones
- Usa `npm run db:migrate:deploy` para aplicarlas en producción

## Troubleshooting

### Error: "Table _prisma_migrations already exists"

- La tabla ya existe, solo necesitas marcar las migraciones como aplicadas
- Usa el script `npm run db:baseline` que maneja esto automáticamente

### Error: "Migration already applied"

- La migración ya está marcada como aplicada
- Esto es normal, el script omite las migraciones ya marcadas

### Error: "Connection failed"

- Verifica que `DATABASE_URL` esté configurada correctamente
- Verifica la conexión con `npm run db:test-connection`

## Referencias

- [Prisma Migrate Baseline](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baseline-your-production-environment)
- [Prisma Migrate Resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)

