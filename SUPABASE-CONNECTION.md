# Configuración de Conexión a Supabase

## Información de Conexión

**Password:** `7mEmXUY07WxWb4s7`

**Connection String (Session Pooler):**
```
postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

## Configuración en .env.local

Agrega la siguiente línea a tu archivo `frontend/.env.local`:

```env
DATABASE_URL="postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

### Parámetros Importantes

- `pgbouncer=true`: Indica que estamos usando el pooler de sesión de Supabase
- `connection_limit=1`: Limita las conexiones simultáneas (requerido para pooler)

## Verificar Conexión

Ejecuta el script de verificación:

```bash
cd frontend
npm run db:check-supabase
```

O directamente:

```bash
cd frontend
npx dotenv-cli -e .env.local -- tsx migrate-to-supabase.ts
```

## Ejecutar Migraciones

Una vez configurada la conexión, ejecuta las migraciones:

```bash
cd frontend
npm run db:migrate:deploy
```

Esto aplicará todas las migraciones pendientes a la base de datos de Supabase.

## Notas Importantes

1. **Session Pooler**: Estamos usando el pooler de sesión de Supabase, que es ideal para aplicaciones serverless (como Netlify Functions).

2. **Connection Limit**: El pooler requiere `connection_limit=1` para funcionar correctamente.

3. **Seguridad**: 
   - Nunca commitees el archivo `.env.local` al repositorio
   - La contraseña está en este documento por conveniencia, pero en producción debería estar solo en variables de entorno seguras

4. **Alternativa - Direct Connection**: Si necesitas una conexión directa (sin pooler), usa:
   ```
   postgresql://postgres.ibeprsncarttfjjbqiwj:7mEmXUY07WxWb4s7@aws-0-us-west-2.pooler.supabase.com:6543/postgres
   ```
   (Puerto 6543 en lugar de 5432)

## Troubleshooting

### Error: "P1001: Can't reach database server"
- Verifica que la URL de conexión sea correcta
- Verifica que la contraseña sea la correcta
- Verifica la conectividad de red

### Error: "P1003: Database does not exist"
- Ejecuta las migraciones: `npm run db:migrate:deploy`

### Error: "Connection limit exceeded"
- Verifica que `connection_limit=1` esté en la URL
- Verifica que estés usando el pooler (puerto 5432) y no la conexión directa

