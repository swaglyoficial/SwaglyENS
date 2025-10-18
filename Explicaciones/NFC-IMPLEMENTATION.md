# Implementación de Escaneo NFC y QR - Swagly

## Resumen

Este documento describe la implementación completa del sistema de escaneo NFC y QR en Swagly, que permite a los usuarios escanear tags físicos en lugar de seleccionar manualmente items de una lista.

---

## Cambios Principales

### Antes ❌
- Usuario seleccionaba un NFC de una lista desplegable
- No había escaneo real
- Solo funcionaba con datos pre-cargados

### Ahora ✅
- Usuario escanea tags NFC físicos o códigos QR
- Detección automática de compatibilidad del dispositivo
- Soporte para Android (NFC) e iOS (QR)
- Experiencia fluida y realista

---

## Arquitectura de la Solución

```
┌─────────────────────────────────────┐
│    Usuario abre diálogo             │
└─────────────┬───────────────────────┘
              │
              v
┌─────────────────────────────────────┐
│ UnifiedScanner detecta capacidades  │
│ del dispositivo                      │
└─────────────┬───────────────────────┘
              │
       ┌──────┴──────┐
       │             │
      SÍ NFC        NO NFC
       │             │
       v             v
┌──────────────┐  ┌──────────────┐
│ Mostrar      │  │ Mostrar      │
│ Botón NFC    │  │ Scanner QR   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                v
┌─────────────────────────────────────┐
│ Escanear → Obtener UUID             │
└─────────────┬───────────────────────┘
              │
              v
┌─────────────────────────────────────┐
│ Buscar en BD por UUID               │
│ (usando nueva API /api/.../by-uuid) │
└─────────────┬───────────────────────┘
              │
              v
┌─────────────────────────────────────┐
│ Procesar: registrar escaneo         │
│ y otorgar tokens                    │
└─────────────────────────────────────┘
```

---

## Archivos Creados

### 1. Utilidades y Hooks

#### `src/lib/nfc-utils.ts`
Contiene todas las utilidades para trabajar con NFC:
- `isNFCSupported()`: Detecta si el navegador soporta NFC
- `scanNFC()`: Lee un tag NFC y retorna los datos
- `parseNFCData()`: Parsea los datos del tag (JSON o string)
- `isValidUUID()`: Valida formato de UUIDs
- Manejo de errores y permisos

#### `src/hooks/useNFCScanner.ts`
Hook React para escaneo NFC:
- Encapsula la lógica de escaneo
- Manejo de estados (idle, scanning, success, error)
- Callbacks para éxito y error
- Timeout configurable
- Cancelación de escaneo

#### `src/hooks/useQRScanner.ts`
Hook React para escaneo QR:
- Integración con librería `html5-qrcode`
- Manejo de permisos de cámara
- Estados similares a useNFCScanner
- Detiene automáticamente después de escanear

### 2. Componentes

#### `src/components/qr-scanner.tsx`
Componente visual para escanear códigos QR:
- Interfaz de cámara en vivo
- Estados visuales (iniciando, escaneando, éxito, error)
- Botones de control (cancelar, reintentar)
- Consejos para el usuario

#### `src/components/unified-scanner.tsx`
Componente unificado que decide entre NFC y QR:
- Detecta automáticamente capacidades del dispositivo
- Muestra la opción apropiada (NFC o QR)
- Modo `auto`: Elige automáticamente el mejor método
- Modo `both`: Muestra tabs para que el usuario elija
- Interfaz consistente independiente del método

### 3. APIs

#### `src/app/api/nfcs/by-uuid/route.ts`
Nueva API para buscar NFCs por UUID:
- **Endpoint:** `GET /api/nfcs/by-uuid?uuid=xxx`
- Busca en la BD usando el campo `uuid` en lugar de `id`
- Retorna el NFC con actividad, evento y sponsor
- Manejo de errores (no encontrado, UUID inválido)

#### `src/app/api/events/by-uuid/route.ts`
Nueva API para buscar eventos por UUID:
- **Endpoint:** `GET /api/events/by-uuid?uuid=xxx`
- Busca eventos por su ID (que es el UUID)
- Retorna el evento con actividades y sponsors
- Verifica si el evento está activo

### 4. Componentes Modificados

#### `src/components/scan-merch-dialog.tsx`
Modificado para usar escaneo real:
- **Antes:** Selector manual de NFCs
- **Ahora:** UnifiedScanner para escaneo NFC/QR
- Al escanear, busca el NFC por UUID
- Valida que sea de tipo `activity`
- Procesa el escaneo y otorga tokens

#### `src/components/add-passport-dialog.tsx`
Modificado para usar escaneo real:
- **Antes:** Selector manual de eventos
- **Ahora:** UnifiedScanner para escaneo NFC/QR
- Al escanear, busca el evento por UUID
- Valida que sea de tipo `passport`
- Crea el pasaporte digital automáticamente

### 5. Documentación

#### `NFC-QR-FORMAT.md`
Documentación completa del formato de datos:
- Formatos para pasaportes y actividades
- Ejemplos de JSON y string simple
- Guía para generar códigos QR
- Guía para programar tags NFC
- Checklist de validación

#### `NFC-IMPLEMENTATION.md` (este archivo)
Documentación técnica de la implementación

---

## Flujos de Usuario

### Flujo 1: Escanear Merch (Actividad)

1. Usuario abre el diálogo "Escanear Merch"
2. Sistema detecta si el dispositivo soporta NFC
   - **Android con NFC:** Muestra botón de escaneo NFC
   - **iOS o sin NFC:** Muestra cámara para escaneo QR
3. Usuario escanea el tag de la merch:
   - **NFC:** Acerca el teléfono al tag
   - **QR:** Apunta la cámara al código QR
4. Sistema lee el UUID del tag
5. Sistema busca el NFC en la BD por UUID (`GET /api/nfcs/by-uuid`)
6. Sistema obtiene la actividad asociada
7. Sistema registra el escaneo (`POST /api/scans`)
8. Sistema otorga tokens automáticamente (gasless)
9. Usuario ve confirmación y hash de transacción
10. Diálogo se cierra automáticamente

### Flujo 2: Agregar Pasaporte

1. Usuario abre el diálogo "Agregar Pasaporte"
2. Sistema detecta si el dispositivo soporta NFC
3. Usuario escanea el pasaporte físico del evento
4. Sistema lee el UUID del evento del tag
5. Sistema busca el evento en la BD (`GET /api/events/by-uuid`)
6. Sistema verifica que el usuario no tenga ya este pasaporte
7. Sistema crea el pasaporte digital (`POST /api/passports`)
8. Usuario ve confirmación con el nombre del evento
9. Diálogo se cierra y el dashboard se actualiza

---

## Compatibilidad de Dispositivos

### ✅ Soportado con NFC
- Android 10+ con Chrome/Edge 89+
- Requiere hardware NFC habilitado

### ✅ Soportado con QR
- iOS 11+ con Safari/Chrome/etc
- Android con cualquier navegador
- Desktop con webcam

### ❌ No Soportado
- Navegadores muy antiguos sin soporte para:
  - Web NFC API (para NFC)
  - getUserMedia API (para QR)

---

## Requerimientos Técnicos

### Dependencias NPM

```json
{
  "html5-qrcode": "^2.x.x"  // Para escaneo QR
}
```

### APIs del Navegador

- **Web NFC API**: Para escaneo NFC (solo Android/Chrome)
- **MediaDevices API**: Para acceso a cámara (escaneo QR)
- **Permissions API**: Para verificar permisos

### Base de Datos

Se requiere que el campo `uuid` en la tabla `NFCs` sea único y esté indexado:

```sql
ALTER TABLE "NFCs" ADD CONSTRAINT "NFCs_uuid_unique" UNIQUE ("uuid");
CREATE INDEX "NFCs_uuid_idx" ON "NFCs" ("uuid");
```

---

## Configuración y Desarrollo

### Instalación

```bash
# Instalar dependencias
npm install

# La librería html5-qrcode ya está instalada
```

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Acceder a:
# - http://localhost:3000 (funciona con QR)
# - Para probar NFC, necesitas:
#   - Dispositivo Android con NFC
#   - Acceso HTTPS (usar ngrok o similar)
```

### Testing

#### Probar NFC (Android)

1. Abre Chrome en un dispositivo Android
2. Habilita NFC en configuración del dispositivo
3. Accede a la app (debe ser HTTPS)
4. Abre el diálogo de escaneo
5. Acerca un tag NFC de prueba

#### Probar QR (Cualquier dispositivo)

1. Genera un código QR de prueba:
   ```
   passport:550e8400-e29b-41d4-a716-446655440000
   ```
2. Abre la app en cualquier dispositivo
3. Abre el diálogo de escaneo
4. Apunta la cámara al código QR

---

## Seguridad

### Validaciones Implementadas

1. **UUID Único:** Cada tag NFC tiene un UUID único que no se puede duplicar
2. **Validación de Tipo:** El sistema verifica que el tag sea del tipo correcto (passport o activity)
3. **Anti-Duplicado:** Cada usuario solo puede escanear cada NFC una vez
4. **Validación de Evento:** Se verifica que el evento exista y esté activo
5. **Rate Limiting:** Las APIs tienen límites de peticiones (configurar según necesidad)

### Consideraciones

- **Clonación de Tags:** Los tags NFC pueden ser clonados. Para mayor seguridad:
  - Usar tags con protección contra escritura
  - Implementar validación adicional en el backend (límite de escaneos totales por tag)
  - Usar tags con funciones criptográficas (más costoso)

- **Códigos QR:** Son más fáciles de copiar que NFC
  - Imprimir con técnicas anti-falsificación (hologramas, tintas especiales)
  - Rotar UUIDs periódicamente
  - Limitar tiempo de validez de cada código

---

## Troubleshooting

### Problema: NFC no funciona en Android

**Posibles causas:**
- NFC no está habilitado en el dispositivo
- Navegador no soporta Web NFC API
- No se está usando HTTPS
- El tag NFC está dañado o vacío

**Solución:**
1. Verificar que NFC esté habilitado: Configuración → Conexiones → NFC
2. Usar Chrome o Edge versión 89+
3. Asegurarse de que la app esté en HTTPS
4. Probar con otro tag NFC

### Problema: QR no se escanea

**Posibles causas:**
- Mala iluminación
- Código QR borroso o dañado
- Permisos de cámara denegados
- Código QR muy pequeño

**Solución:**
1. Mejorar la iluminación
2. Asegurarse de que el código QR sea claro y nítido
3. Permitir acceso a la cámara en el navegador
4. Usar códigos QR de al menos 3x3 cm

### Problema: "No se encontró el NFC escaneado"

**Causa:** El UUID del tag no existe en la base de datos

**Solución:**
1. Verificar en la BD: `SELECT * FROM NFCs WHERE uuid = 'uuid-escaneado'`
2. Si no existe, crear el registro correspondiente
3. Verificar que el formato del tag sea correcto

---

## Mejoras Futuras

### Corto Plazo
- [ ] Agregar sonido/vibración al escanear exitosamente
- [ ] Implementar cache de escaneos offline
- [ ] Agregar animaciones más fluidas
- [ ] Soporte para múltiples idiomas

### Mediano Plazo
- [ ] Historial de escaneos en el perfil del usuario
- [ ] Estadísticas de escaneos (mapa de calor, tiempos, etc.)
- [ ] Modo "bulk scan" para organizadores
- [ ] Exportar datos de escaneos (CSV, PDF)

### Largo Plazo
- [ ] Implementar NFC con firma criptográfica (mayor seguridad)
- [ ] Integración con wearables (smartwatches con NFC)
- [ ] AR (Realidad Aumentada) para escaneo visual de merch
- [ ] Blockchain logging de todos los escaneos

---

## Recursos y Referencias

### Documentación Oficial
- [Web NFC API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)
- [Web NFC - web.dev](https://web.dev/nfc/)
- [html5-qrcode - GitHub](https://github.com/mebjas/html5-qrcode)

### Tutoriales
- [NFC Tags Guide](https://www.nfctags.com/nfc-tags-guide/)
- [QR Code Best Practices](https://www.qr-code-generator.com/qr-code-marketing/qr-codes-basics/)

### Herramientas
- **NFC Tools (Android):** https://play.google.com/store/apps/details?id=com.wakdev.wdnfc
- **QR Code Generator:** https://www.qr-code-generator.com/
- **NFC Tag Specs:** https://www.nxp.com/products/rfid-nfc/nfc-hf/ntag

---

## Contacto y Contribución

Para preguntas, reportar bugs o contribuir:

1. Revisa esta documentación
2. Revisa `NFC-QR-FORMAT.md` para formato de datos
3. Consulta los logs de la consola del navegador
4. Contacta al equipo de desarrollo

---

**Implementado por:** Claude Code
**Fecha:** Octubre 2025
**Versión:** 1.0
**Status:** ✅ Producción Ready
