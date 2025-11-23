# Cómo Ver la Consola del Celular para Debugging

## Métodos para Ver la Consola del Celular

### 1. Chrome DevTools (Recomendado para Android)

#### Requisitos:
- Celular Android
- Chrome instalado en el celular
- Chrome en tu computadora
- Ambos dispositivos en la misma red WiFi

#### Pasos:

1. **En el celular:**
   - Abre Chrome
   - Ve a `chrome://inspect` (o usa la URL de tu app)
   - Activa "USB Debugging" en Opciones de Desarrollador

2. **En tu computadora:**
   - Abre Chrome
   - Ve a `chrome://inspect`
   - Deberías ver tu dispositivo listado
   - Haz clic en "inspect" debajo de tu dispositivo

3. **Alternativa con USB:**
   - Conecta el celular por USB
   - Activa "Depuración USB" en Opciones de Desarrollador
   - Abre Chrome DevTools en tu PC
   - Ve a `chrome://inspect`

### 2. Safari Web Inspector (iOS)

#### Requisitos:
- iPhone/iPad
- Mac con Safari
- Ambos en la misma red WiFi

#### Pasos:

1. **En el iPhone:**
   - Configuración > Safari > Avanzado
   - Activa "Web Inspector"

2. **En el Mac:**
   - Abre Safari
   - Safari > Preferencias > Avanzado
   - Activa "Mostrar menú Desarrollar"
   - Desarrollar > [Tu iPhone] > [URL de la app]

### 3. Eruda (Consola Móvil en la Página)

Si no puedes usar DevTools, puedes agregar Eruda que muestra una consola directamente en la página.

#### Instalación:
```bash
npm install eruda
```

#### Uso:
Agrega esto temporalmente en `frontend/src/app/layout.tsx`:
```typescript
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('eruda').then(eruda => eruda.default.init());
}
```

### 4. RemoteJS (Alternativa)

Similar a Eruda, pero más ligero:
```bash
npm install remotejs
```

## Ver Logs en Tiempo Real

### Opción 1: Usar `console.log` con Prefijos

Los logs ya están agregados con emojis para fácil identificación:
- 🔵 = Inicio de proceso
- ✅ = Éxito
- ❌ = Error
- 🔄 = Actualización
- 🌐 = Petición API
- 📡 = Respuesta API

### Opción 2: Filtrar Logs en la Consola

En Chrome DevTools:
1. Abre la consola
2. Usa el filtro y busca: `VALIDATE MINITASK` o `API REQUEST`

### Opción 3: Ver Network Requests

En Chrome DevTools:
1. Abre la pestaña "Network"
2. Filtra por "validate" o "unlock"
3. Haz clic en la petición para ver detalles

## Logs Agregados en el Código

### Frontend (Cliente):
- `🔵 [VALIDATE MINITASK]` - Inicio de validación
- `✅ [VALIDATE MINITASK]` - Validación exitosa
- `❌ [VALIDATE MINITASK]` - Error en validación
- `🌐 [API REQUEST]` - Petición HTTP
- `📡 [API REQUEST]` - Respuesta HTTP
- `🔓 [MINITASK CARD]` - Acciones en la tarjeta

### Backend (Servidor):
- Logs en `/api/minitasks/[id]/validate/route.ts`
- Logs en `validateMiniTaskService`

## Solución de Problemas

### No veo mi dispositivo en chrome://inspect
- Asegúrate de que ambos estén en la misma WiFi
- Verifica que "USB Debugging" esté activado
- Reinicia Chrome en ambos dispositivos

### Los logs no aparecen
- Verifica que estés en modo desarrollo
- Asegúrate de que la consola no esté filtrada
- Revisa que no haya errores de JavaScript bloqueando los logs

### No puedo conectar por USB
- Instala los drivers USB de tu dispositivo
- Verifica que el cable permita transferencia de datos
- Activa "Depuración USB" en Opciones de Desarrollador

## Activar Opciones de Desarrollador

### Android:
1. Configuración > Acerca del teléfono
2. Toca "Número de compilación" 7 veces
3. Regresa a Configuración > Sistema > Opciones de desarrollador
4. Activa "Depuración USB"

### iOS:
1. Configuración > Safari > Avanzado
2. Activa "Web Inspector"

