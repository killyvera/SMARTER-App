# Instrucciones para Regenerar Prisma Client

## Problema
El cliente de Prisma no está actualizado con los nuevos campos (`biometricEnabled` y modelo `BiometricCredential`).

## Solución

### Paso 1: Detener el servidor de desarrollo
Si tienes el servidor corriendo (`npm run dev`), deténlo con `Ctrl+C`.

### Paso 2: Regenerar Prisma Client
Desde el directorio `frontend/`, ejecuta:

```bash
cd frontend
npx prisma generate
```

### Paso 3: Verificar que se regeneró correctamente
Deberías ver un mensaje como:
```
✔ Generated Prisma Client (x.xx.x) to ./node_modules/@prisma/client in xxxms
```

### Paso 4: Reiniciar el servidor
```bash
npm run dev
```

## Nota
La base de datos ya está sincronizada (se aplicó con `prisma db push`), solo falta regenerar el cliente de Prisma para que reconozca los nuevos campos.

