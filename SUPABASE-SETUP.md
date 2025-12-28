# Guía de Configuración de Supabase

## Requisitos Previos

1. ✅ Cuenta en Supabase (gratuita): https://supabase.com
2. ✅ Proyecto creado en Supabase

## Pasos de Configuración

### 1. Crear Proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta (si no tienes una)
2. Haz clic en **"New Project"**
3. Completa el formulario:
   - **Name**: Nombre de tu proyecto (ej: `smarter-app`)
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Selecciona la región más cercana
   - **Pricing Plan**: Free (para empezar)

### 2. Obtener Connection String

1. En tu proyecto de Supabase, ve a **Settings** → **Database**
2. Busca la sección **"Connection string"**
3. Selecciona **"URI"** en el dropdown
4. Copia la connection string, se verá así:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Reemplaza `[YOUR-PASSWORD]` con la contraseña que configuraste al crear el proyecto

### 3. Configurar Variables de Entorno

#### Para Desarrollo Local

Crea o actualiza `frontend/.env.local`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
JWT_SECRET="tu_jwt_secret_aqui_minimo_32_caracteres"
AI_PROVIDER="openai"
OPENAI_API_KEY="tu-api-key-de-openai"
OPENAI_MODEL="tu-modelo-aqui"
```

**Nota:** El parámetro `pgbouncer=true` es recomendado para Supabase en producción.

#### Para Netlify

1. Ve a tu sitio en Netlify Dashboard
2. **Site settings** → **Environment variables**
3. Agrega:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
   JWT_SECRET=tu_jwt_secret_aqui_minimo_32_caracteres
   AI_PROVIDER=openai
   OPENAI_API_KEY=tu-api-key-de-openai
   OPENAI_MODEL=tu-modelo-aqui
   ```

### 4. Ejecutar Migraciones

Una vez configurado el `DATABASE_URL`:

```bash
cd frontend
npx prisma migrate deploy
```

O si prefieres usar `db push` (para desarrollo):

```bash
cd frontend
npx prisma db push
```

### 5. Generar Prisma Client

```bash
cd frontend
npx prisma generate
```

### 6. (Opcional) Ejecutar Seed

Si quieres poblar la base de datos con datos de ejemplo:

```bash
cd frontend
npm run db:seed
```

## Diferencias entre SQLite y PostgreSQL

### Cambios en el Schema

El schema ya está actualizado para usar PostgreSQL. Las principales diferencias:

- **Provider**: Cambiado de `sqlite` a `postgresql`
- **Tipos de datos**: PostgreSQL soporta más tipos nativos
- **Índices**: PostgreSQL tiene mejor soporte para índices complejos

### Migraciones Existentes

Las migraciones existentes fueron creadas para SQLite. Necesitarás:

1. **Opción 1 (Recomendada)**: Usar `prisma db push` para sincronizar el schema directamente
2. **Opción 2**: Crear nuevas migraciones para PostgreSQL ejecutando:
   ```bash
   npx prisma migrate dev --name init_postgresql
   ```

## Configuración de Connection Pooling (Recomendado)

Supabase recomienda usar connection pooling para aplicaciones serverless (como Netlify Functions).

### Connection String con Pooling

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1
```

**Nota:** El puerto cambia de `5432` a `6543` cuando usas pooling.

### Sin Pooling (Solo para desarrollo)

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Verificar Conexión

Puedes verificar que la conexión funciona:

```bash
cd frontend
npx prisma studio
```

Esto abrirá Prisma Studio conectado a tu base de datos de Supabase.

## Límites del Plan Gratuito de Supabase

- **500 MB** de base de datos
- **2 GB** de bandwidth
- **500 MB** de file storage
- **50,000** monthly active users
- **2 million** edge function invocations

## Seguridad

### Variables de Entorno

⚠️ **NUNCA** commitees archivos `.env.local` o `.env` al repositorio.

### Connection String

- Mantén tu contraseña segura
- Usa diferentes proyectos para desarrollo y producción
- Rota las contraseñas periódicamente

### Row Level Security (RLS)

Supabase tiene Row Level Security habilitado por defecto. Para esta aplicación, puedes:

1. **Deshabilitar RLS** (solo si confías en tu aplicación):
   ```sql
   ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
   -- Repite para todas las tablas
   ```

2. **O configurar políticas RLS** apropiadas para tu caso de uso.

## Troubleshooting

### Error: "Connection timeout"

**Solución:** Verifica que:
- La connection string sea correcta
- Tu IP no esté bloqueada (Supabase puede tener restricciones de IP)
- Estés usando el puerto correcto (5432 para directo, 6543 para pooling)

### Error: "Password authentication failed"

**Solución:** 
- Verifica que la contraseña en la connection string sea correcta
- Puedes resetear la contraseña en Supabase Dashboard → Settings → Database

### Error: "Too many connections"

**Solución:** 
- Usa connection pooling (puerto 6543)
- Reduce `connection_limit` en la connection string

### Error: "Schema does not match"

**Solución:**
- Ejecuta `npx prisma db push` para sincronizar
- O crea nuevas migraciones con `npx prisma migrate dev`

## Próximos Pasos

1. ✅ Crear proyecto en Supabase
2. ✅ Obtener connection string
3. ✅ Configurar `DATABASE_URL` en `.env.local` y Netlify
4. ✅ Ejecutar migraciones
5. ✅ Verificar conexión con Prisma Studio
6. ✅ Ejecutar seed (opcional)
7. ✅ Hacer deploy a Netlify

