# Script SQL para Crear Tablas en Supabase

## Instrucciones

Este script crea todas las tablas necesarias para la aplicación SMARTER App en Supabase.

### Pasos para Ejecutar

1. **Abre el SQL Editor en Supabase:**
   - Ve a tu proyecto en Supabase Dashboard
   - Navega a **SQL Editor** en el menú lateral
   - Haz clic en **New Query**

2. **Copia y pega el script:**
   - Abre el archivo `frontend/prisma/create-tables-supabase.sql`
   - Copia todo el contenido
   - Pégalo en el SQL Editor de Supabase

3. **Ejecuta el script:**
   - Haz clic en **Run** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Espera a que se complete la ejecución

4. **Verifica las tablas:**
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver 12 tablas creadas:
     - User
     - Goal
     - SmarterScore
     - MiniTask
     - MiniTaskScore
     - Readjustment
     - SuggestedMiniTask
     - MiniTaskMetric
     - MiniTaskPlugin
     - MiniTaskJournalEntry
     - MiniTaskChecklistItem
     - BiometricCredential

### Verificación Rápida

Ejecuta esta query en el SQL Editor para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver las 12 tablas listadas.

### Características del Script

- ✅ Usa `CREATE TABLE IF NOT EXISTS` para evitar errores si las tablas ya existen
- ✅ Crea todos los índices necesarios para optimizar queries
- ✅ Configura todas las foreign keys con `ON DELETE CASCADE`
- ✅ Incluye valores por defecto para campos opcionales
- ✅ Verificación automática al final del script

### Notas Importantes

1. **Si las tablas ya existen:** El script no las sobrescribirá, solo creará las que falten.

2. **Si necesitas recrear todo:** Primero elimina las tablas existentes:
   ```sql
   DROP TABLE IF EXISTS "BiometricCredential" CASCADE;
   DROP TABLE IF EXISTS "MiniTaskChecklistItem" CASCADE;
   DROP TABLE IF EXISTS "MiniTaskJournalEntry" CASCADE;
   DROP TABLE IF EXISTS "MiniTaskPlugin" CASCADE;
   DROP TABLE IF EXISTS "MiniTaskMetric" CASCADE;
   DROP TABLE IF EXISTS "SuggestedMiniTask" CASCADE;
   DROP TABLE IF EXISTS "Readjustment" CASCADE;
   DROP TABLE IF EXISTS "MiniTaskScore" CASCADE;
   DROP TABLE IF EXISTS "MiniTask" CASCADE;
   DROP TABLE IF EXISTS "SmarterScore" CASCADE;
   DROP TABLE IF EXISTS "Goal" CASCADE;
   DROP TABLE IF EXISTS "User" CASCADE;
   ```
   Luego ejecuta el script de creación.

3. **Después de crear las tablas:** Ejecuta el seed para datos de ejemplo:
   ```bash
   cd frontend
   npm run db:seed
   ```

### Troubleshooting

**Error: "relation already exists"**
- Las tablas ya existen. Usa `DROP TABLE` primero si quieres recrearlas.

**Error: "permission denied"**
- Verifica que tengas permisos de administrador en el proyecto de Supabase.

**Error: "syntax error"**
- Asegúrate de copiar todo el script completo, incluyendo las comillas.

### Archivo del Script

El script completo está en: `frontend/prisma/create-tables-supabase.sql`

