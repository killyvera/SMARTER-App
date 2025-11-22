# Instrucciones para Abrir Puerto 3000 en Windows Firewall

## Método 1: Script Automático (Más Fácil)

1. Haz clic derecho en `open-firewall-port.bat`
2. Selecciona "Ejecutar como administrador"
3. Confirma el aviso de UAC
4. Listo! El puerto estará abierto

## Método 2: Manual

1. Abre "Windows Defender Firewall con seguridad avanzada"
   - Presiona `Win + R`
   - Escribe: `wf.msc`
   - Presiona Enter

2. En el panel izquierdo, haz clic en "Reglas de entrada"

3. En el panel derecho, haz clic en "Nueva regla..."

4. Selecciona "Puerto" y haz clic en "Siguiente"

5. Selecciona "TCP" y "Puertos locales específicos"
   - Escribe: `3000`
   - Haz clic en "Siguiente"

6. Selecciona "Permitir la conexión" y haz clic en "Siguiente"

7. Marca todas las casillas (Dominio, Privada, Pública) y haz clic en "Siguiente"

8. Nombre: "Next.js Dev Server"
   - Descripción: "Permite acceso al servidor de desarrollo desde la red local"
   - Haz clic en "Finalizar"

## Verificar que Funciona

1. Reinicia el servidor con `start-dev.bat`
2. Desde tu celular (en la misma red Wi-Fi), abre:
   `http://192.168.100.21:3000`

## Notas Importantes

- Asegúrate de que tu celular esté en la misma red Wi-Fi
- El firewall solo necesita abrirse una vez
- Si cambias de red, puede que necesites verificar la IP nuevamente

