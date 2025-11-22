# Solución: Error DNS Probe Finished en Celular

## Problema
El túnel funciona en PC pero en el celular aparece "dns probe finished" o "ERR_NAME_NOT_RESOLVED".

## Soluciones

### Solución 1: Esperar unos minutos ⏱️
Los túneles de Cloudflare pueden tardar 1-2 minutos en propagarse completamente. Espera y vuelve a intentar.

### Solución 2: Verificar la URL exacta 🔗
Asegúrate de usar la URL **exacta** que aparece en la terminal del túnel:
```
https://bracket-permalink-brief-enhancement.trycloudflare.com
```

**IMPORTANTE:**
- ✅ Debe empezar con `https://` (no `http://`)
- ✅ Debe incluir `.trycloudflare.com` al final
- ❌ No uses `localhost:3000` desde el celular

### Solución 3: Limpiar caché DNS del celular 📱

**Android:**
1. Configuración → Conexiones → Wi-Fi
2. Mantén presionado tu red Wi-Fi
3. Selecciona "Modificar red" o "Configurar red"
4. Cambia DNS a: `8.8.8.8` (Google DNS) o `1.1.1.1` (Cloudflare DNS)
5. Guarda y reconecta

**iPhone:**
1. Configuración → Wi-Fi
2. Toca el ⓘ junto a tu red
3. Desplázate a "Configurar DNS"
4. Selecciona "Manual"
5. Agrega: `1.1.1.1` y `1.0.0.1` (Cloudflare DNS)
6. Guarda

### Solución 4: Usar datos móviles en lugar de Wi-Fi 📶
A veces el Wi-Fi tiene restricciones. Prueba con datos móviles del celular.

### Solución 5: Verificar que el túnel esté activo 🔍
En la terminal donde corre el túnel, deberías ver:
```
INF Registered tunnel connection
```

Si no aparece, el túnel no está conectado correctamente.

### Solución 6: Reiniciar el túnel 🔄
1. Detén el túnel (Ctrl+C)
2. Espera 10 segundos
3. Inícialo nuevamente:
   ```batch
   test-tunnel.bat
   ```
4. Usa la NUEVA URL que aparezca

### Solución 7: Verificar firewall del router 🛡️
Algunos routers bloquean ciertos dominios. Prueba:
- Conectando el celular a otra red Wi-Fi
- O usando datos móviles

## Verificación Rápida

1. ✅ ¿El servidor está corriendo en localhost:3000?
2. ✅ ¿El túnel muestra "Registered tunnel connection"?
3. ✅ ¿Estás usando la URL completa con `https://`?
4. ✅ ¿Has esperado 1-2 minutos después de iniciar el túnel?

## Alternativa: Usar ngrok

Si Cloudflare sigue dando problemas, prueba con ngrok:

1. Instala ngrok: `winget install ngrok`
2. Configura: `ngrok config add-authtoken TU_TOKEN`
3. Inicia: `ngrok http 3000`
4. Usa la URL que aparezca (ej: `https://xxxx-xxxx.ngrok-free.app`)

## Contacto

Si nada funciona, verifica:
- Que el servidor Next.js esté corriendo
- Que el túnel esté activo (no cerrado)
- Que uses la URL exacta del túnel

