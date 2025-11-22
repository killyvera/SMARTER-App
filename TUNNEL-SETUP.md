# Configuración de Túneles para Exponer la Aplicación

Este documento explica cómo configurar túneles gratuitos para exponer tu aplicación Smarter App en internet.

## Opción 1: Cloudflare Tunnel (Recomendado) ⭐

**Ventajas:**
- ✅ Completamente gratuito
- ✅ Sin límites de tiempo
- ✅ No requiere registro para uso básico
- ✅ URLs aleatorias pero estables durante la sesión
- ✅ Muy confiable

### Instalación

1. **Descargar cloudflared:**
   ```powershell
   # Opción 1: Con winget (recomendado)
   winget install --id Cloudflare.cloudflared
   
   # Opción 2: Descarga manual
   # Visita: https://github.com/cloudflare/cloudflared/releases/latest
   # Descarga cloudflared-windows-amd64.exe
   # Renómbralo a cloudflared.exe y colócalo en una carpeta del PATH
   ```

2. **Verificar instalación:**
   ```powershell
   cloudflared --version
   ```

### Uso

**Opción A: Script automático**
```batch
start-with-tunnel.bat
```

**Opción B: Manual**
```batch
# Terminal 1: Iniciar servidor
cd frontend
npm run dev

# Terminal 2: Iniciar túnel
cloudflared tunnel --url http://localhost:3000
```

La URL pública aparecerá en la terminal (ej: `https://random-subdomain.trycloudflare.com`)

---

## Opción 2: ngrok

**Ventajas:**
- ✅ Muy popular y estable
- ✅ Dashboard web para monitoreo
- ✅ URLs personalizables (con cuenta)

**Desventajas:**
- ⚠️ Requiere registro (gratuito)
- ⚠️ Límite de tiempo en plan gratuito (2 horas por sesión)
- ⚠️ URLs aleatorias en plan gratuito

### Instalación

1. **Crear cuenta:**
   - Visita: https://ngrok.com
   - Crea una cuenta gratuita

2. **Descargar e instalar:**
   ```powershell
   # Con winget
   winget install ngrok
   
   # O descarga manual desde: https://ngrok.com/download
   ```

3. **Configurar authtoken:**
   ```powershell
   # Obtén tu authtoken desde: https://dashboard.ngrok.com/get-started/your-authtoken
   ngrok config add-authtoken TU_AUTHTOKEN_AQUI
   ```

### Uso

**Opción A: Script automático**
```batch
start-with-tunnel.bat
```

**Opción B: Manual**
```powershell
# Terminal 1: Iniciar servidor
cd frontend
npm run dev

# Terminal 2: Iniciar túnel
ngrok http 3000
```

Accede al dashboard en: http://localhost:4040 para ver la URL pública

---

## Comparación Rápida

| Característica | Cloudflare Tunnel | ngrok |
|---------------|-------------------|-------|
| Gratis | ✅ Sí | ✅ Sí |
| Requiere registro | ❌ No | ✅ Sí |
| Límite de tiempo | ❌ No | ⚠️ 2h/sesión |
| Dashboard | ❌ No | ✅ Sí |
| URLs personalizadas | ❌ No | ⚠️ Con pago |
| Estabilidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## Scripts Disponibles

1. **`setup-tunnel.bat`** - Guía interactiva para configurar túnel
2. **`start-with-tunnel.bat`** - Inicia servidor + túnel automáticamente

---

## Notas Importantes

⚠️ **Seguridad:**
- Los túneles exponen tu aplicación públicamente
- No uses en producción sin autenticación adecuada
- Las URLs son temporales (excepto con planes pagos)

⚠️ **Rendimiento:**
- Los túneles añaden latencia
- No son ideales para desarrollo intensivo
- Úsalos principalmente para pruebas y demos

---

## Solución de Problemas

### Cloudflare Tunnel no inicia
- Verifica que cloudflared esté en el PATH
- Asegúrate de que el puerto 3000 esté libre
- Revisa que el servidor Next.js esté corriendo

### ngrok muestra error de authtoken
- Ejecuta: `ngrok config add-authtoken TU_TOKEN`
- Verifica tu token en: https://dashboard.ngrok.com/get-started/your-authtoken

### No puedo acceder desde el móvil
- Verifica que la URL del túnel sea HTTPS (no HTTP)
- Asegúrate de usar la URL completa proporcionada por el túnel
- Revisa que no haya firewall bloqueando

