# Guía de Inicialización Manual - Smarter App

Esta guía te ayudará a inicializar el proyecto completo desde cero.

## 📋 Prerrequisitos

- Node.js >= 18.0.0
- npm instalado
- Git instalado (opcional, para clonar el repositorio)

## 🚀 Pasos de Inicialización

### 1. Instalar Dependencias

Desde la raíz del proyecto:

```bash
npm install
```

Esto instalará las dependencias de todos los workspaces (frontend, shared).

### 2. Configurar Variables de Entorno

Crea el archivo `.env.local` en el directorio `frontend/`:

```bash
cd frontend
```

Crea el archivo `.env.local` con el siguiente contenido:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="GENERA_UN_SECRETO_SEGURO_AQUI"
AI_PROVIDER="openai"
OPENAI_API_KEY="tu-api-key-de-openai-aqui"
OPENAI_MODEL="gpt-4"
```

**Generar JWT_SECRET seguro:**

Puedes generar un JWT_SECRET seguro de varias formas:

**Opción 1: Usando Node.js (recomendado)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opción 2: Usando OpenSSL (si está instalado)**
```bash
openssl rand -hex 32
```

**Opción 3: Online**
Visita https://generate-secret.vercel.app/32 y copia el resultado.

**Nota:** 
- El JWT_SECRET debe tener al menos 32 caracteres
- Reemplaza `GENERA_UN_SECRETO_SEGURO_AQUI` con el secreto generado
- Reemplaza `tu-api-key-de-openai-aqui` con tu API key real de OpenAI
- **NUNCA** compartas tu JWT_SECRET o lo subas a repositorios públicos

### 3. Configurar Base de Datos

Ejecuta los siguientes comandos desde el directorio `frontend/`:

```bash
# Generar cliente Prisma
npm run db:generate

# Sincronizar esquema de base de datos
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

**Explicación:**
- `db:generate`: Genera el cliente de Prisma basado en el schema
- `db:migrate`: Sincroniza el esquema con la base de datos (usa `prisma db push`)
- `db:seed`: Crea el usuario por defecto y datos de ejemplo

### 4. Verificar Instalación

Opcional: Abre Prisma Studio para verificar que la base de datos se creó correctamente:

```bash
npm run db:studio
```

Esto abrirá Prisma Studio en http://localhost:5555

### 5. Iniciar la Aplicación

Desde la raíz del proyecto:

```bash
npm run dev
```

O desde el directorio `frontend/`:

```bash
cd frontend
npm run dev
```

### 6. Acceder a la Aplicación

Abre tu navegador en:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api

## 🔐 Credenciales por Defecto

Después de ejecutar el seed, puedes iniciar sesión con:

- **Email:** `user@local`
- **Password:** `password123`

## 📝 Comandos Útiles

### Desarrollo
```bash
npm run dev              # Inicia servidor de desarrollo
```

### Base de Datos
```bash
npm run db:generate      # Regenera cliente Prisma
npm run db:migrate       # Sincroniza esquema
npm run db:seed          # Ejecuta seed
npm run db:studio        # Abre Prisma Studio
```

### Build y Producción
```bash
npm run build            # Construye para producción
npm run start            # Inicia servidor de producción
```

## 🛠️ Solución de Problemas

### Error: "Environment variable not found: DATABASE_URL"

Asegúrate de que el archivo `.env.local` existe en `frontend/` y contiene `DATABASE_URL`.

### Error: "Cannot find module '@smarter-app/shared'"

Ejecuta `npm install` desde la raíz del proyecto para instalar todos los workspaces.

### Error: "Prisma schema validation"

Verifica que el archivo `frontend/prisma/schema.prisma` existe y está correcto.

### La base de datos no se crea

Asegúrate de tener permisos de escritura en el directorio `frontend/prisma/`.

## 📦 Estructura del Proyecto

```
smarter-app/
├── frontend/           # Aplicación Next.js
│   ├── prisma/        # Schema y seed de Prisma
│   ├── src/           # Código fuente
│   │   ├── app/       # Rutas Next.js (incluye API)
│   │   ├── lib/       # Utilidades
│   │   ├── repositories/  # Acceso a datos
│   │   └── services/  # Lógica de negocio
│   └── .env.local     # Variables de entorno (crear manualmente)
├── shared/            # Código compartido (esquemas Zod)
└── package.json       # Workspace root
```

## ✅ Checklist de Inicialización

- [ ] Node.js >= 18.0.0 instalado
- [ ] `npm install` ejecutado desde la raíz
- [ ] Archivo `frontend/.env.local` creado con todas las variables
- [ ] `npm run db:generate` ejecutado exitosamente
- [ ] `npm run db:migrate` ejecutado exitosamente
- [ ] `npm run db:seed` ejecutado exitosamente
- [ ] `npm run dev` inicia sin errores
- [ ] Aplicación accesible en http://localhost:3000

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación estará lista para usar. Puedes:

- Crear nuevos objetivos (Goals)
- Validarlos con IA usando el método SMARTER
- Crear minitasks
- Registrar check-ins
- Y mucho más...

