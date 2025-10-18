# Formato de Datos para Tags NFC y Códigos QR - Swagly

Este documento especifica el formato de datos que deben contener los tags NFC físicos y los códigos QR para que funcionen correctamente con la aplicación Swagly.

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Formato para Pasaportes](#formato-para-pasaportes)
3. [Formato para Actividades](#formato-para-actividades)
4. [Ejemplos](#ejemplos)
5. [Generación de Códigos QR](#generación-de-códigos-qr)
6. [Programación de Tags NFC](#programación-de-tags-nfc)
7. [Validación y Pruebas](#validación-y-pruebas)

---

## Introducción

La aplicación Swagly soporta dos métodos de escaneo:

- **NFC (Near Field Communication)**: Para dispositivos Android con Chrome/Edge (versión 89+)
- **QR (Códigos QR)**: Para todos los dispositivos con cámara (incluye iOS/Safari)

Ambos métodos usan el mismo formato de datos, asegurando compatibilidad universal.

---

## Formato para Pasaportes

Los pasaportes físicos contienen el **UUID del evento** al que pertenecen.

### Formato Recomendado (JSON)

```json
{
  "type": "passport",
  "eventUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Formato Alternativo (String Simple)

```
passport:550e8400-e29b-41d4-a716-446655440000
```

### Campos

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `type` | string | Debe ser exactamente `"passport"` | Sí |
| `eventUuid` | string | UUID del evento en la base de datos | Sí |

### Notas Importantes

- El `eventUuid` debe corresponder al campo `id` de un evento en la tabla `Events` de la base de datos
- El sistema validará que el evento existe antes de crear el pasaporte digital
- Si el usuario ya tiene un pasaporte para ese evento, se mostrará un error

---

## Formato para Actividades

Las piezas de merch (actividades completadas) contienen el **UUID del tag NFC** registrado en la base de datos.

### Formato Recomendado (JSON)

```json
{
  "type": "activity",
  "nfcUuid": "abc123-nfc-uuid-12345"
}
```

### Formato Alternativo (String Simple)

```
activity:abc123-nfc-uuid-12345
```

### Campos

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `type` | string | Debe ser exactamente `"activity"` | Sí |
| `nfcUuid` | string | UUID del tag NFC en la base de datos | Sí |

### Notas Importantes

- El `nfcUuid` debe corresponder al campo `uuid` de un registro en la tabla `NFCs` de la base de datos
- El sistema buscará el NFC por este UUID y obtendrá la actividad asociada
- Si el usuario ya escaneó este NFC, se mostrará un error de duplicado
- Cada NFC está vinculado a una actividad específica que otorga tokens

---

## Ejemplos

### Ejemplo 1: Pasaporte de ETH Bogotá 2024

**Formato JSON:**
```json
{
  "type": "passport",
  "eventUuid": "d7e3f1a2-8b4c-4e9d-a5f6-1c2b3d4e5f6a"
}
```

**Formato String:**
```
passport:d7e3f1a2-8b4c-4e9d-a5f6-1c2b3d4e5f6a
```

**Uso:**
- El usuario escanea este tag al llegar al evento
- Se crea su pasaporte digital con las actividades del evento
- Aparece en su dashboard como pasaporte principal

---

### Ejemplo 2: Actividad "Visitar Stand de Polygon"

**Formato JSON:**
```json
{
  "type": "activity",
  "nfcUuid": "nfc-polygon-stand-001"
}
```

**Formato String:**
```
activity:nfc-polygon-stand-001
```

**Uso:**
- El usuario completa la actividad en el stand de Polygon
- Recibe una pieza de merch con este tag NFC
- Al escanearlo, la actividad se marca como completada
- Recibe tokens SWAG automáticamente en su wallet

---

### Ejemplo 3: Actividad "Asistir a Workshop de Smart Contracts"

**Formato JSON:**
```json
{
  "type": "activity",
  "nfcUuid": "nfc-workshop-sc-2024-05-15"
}
```

**Formato String:**
```
activity:nfc-workshop-sc-2024-05-15
```

---

## Generación de Códigos QR

Para generar códigos QR que funcionen con Swagly, usa cualquier generador de códigos QR con el texto en el formato especificado.

### Herramientas Recomendadas

1. **Online:**
   - https://www.qr-code-generator.com/
   - https://www.qrcode-monkey.com/
   - https://qr.io/

2. **CLI (para generación masiva):**
   ```bash
   npm install -g qrcode
   qrcode -o pasaporte.png "passport:550e8400-e29b-41d4-a716-446655440000"
   ```

3. **Programáticamente (Node.js):**
   ```javascript
   const QRCode = require('qrcode');

   const eventUuid = '550e8400-e29b-41d4-a716-446655440000';
   const data = `passport:${eventUuid}`;

   QRCode.toFile('pasaporte.png', data, {
     color: {
       dark: '#000000',
       light: '#FFFFFF'
     },
     width: 300
   });
   ```

### Configuración Recomendada

- **Tamaño mínimo:** 300x300 píxeles
- **Nivel de corrección de errores:** M (Medium) o H (High)
- **Formato de salida:** PNG o SVG (para impresión)
- **Colores:** Alto contraste (negro sobre blanco preferible)

---

## Programación de Tags NFC

Para programar tags NFC físicos, necesitarás:

1. **Hardware:**
   - Tags NFC (NTAG213, NTAG215 o NTAG216 recomendados)
   - Smartphone Android con soporte NFC
   - O un lector/grabador NFC USB

2. **Software:**
   - **Android:** NFC Tools (https://play.google.com/store/apps/details?id=com.wakdev.wdnfc)
   - **PC:** NFC Tools PC/Mac

### Pasos para Programar un Tag NFC

#### Usando NFC Tools (Android)

1. Abre la app **NFC Tools**
2. Ve a la pestaña **"Escribir"**
3. Selecciona **"Agregar un registro"**
4. Elige **"Texto"**
5. Ingresa el texto en el formato especificado:
   ```
   passport:550e8400-e29b-41d4-a716-446655440000
   ```
   o
   ```
   activity:abc123-nfc-uuid-12345
   ```
6. Presiona **"OK"**
7. Presiona **"Escribir"**
8. Acerca el tag NFC a tu teléfono
9. Espera la confirmación de escritura

#### Configuración Avanzada (Opcional)

- **Proteger contra escritura:** Activar para evitar modificaciones accidentales
- **Modo de solo lectura:** Recomendado para producción
- **Cifrado:** No necesario (la validación se hace en el backend)

---

## Validación y Pruebas

### Validar un Tag NFC o Código QR

Antes de distribuir tags o imprimir códigos QR, valídalos:

1. **Prueba de Escaneo:**
   - Abre la aplicación Swagly
   - Navega a la funcionalidad correspondiente (Agregar Pasaporte o Escanear Merch)
   - Escanea el tag/QR de prueba
   - Verifica que se reconoce correctamente

2. **Verificación de Datos:**
   - Para pasaportes: Verifica que el nombre del evento es correcto
   - Para actividades: Verifica que la actividad y cantidad de tokens son correctos

3. **Prueba de Duplicados:**
   - Intenta escanear el mismo tag dos veces
   - Debe mostrar un error indicando que ya fue escaneado

### Checklist de Producción

Antes de producir tags en masa:

- [ ] Todos los UUIDs existen en la base de datos
- [ ] El formato de datos es correcto (JSON o string simple)
- [ ] Los códigos QR son legibles (prueba con diferentes dispositivos)
- [ ] Los tags NFC tienen suficiente capacidad de memoria
- [ ] Se probó en diferentes dispositivos (Android con NFC, iOS con QR)
- [ ] Los tags están protegidos contra escritura (opcional pero recomendado)

---

## Registro en Base de Datos

### Para Pasaportes

No se requiere registro adicional. Solo necesitas que el evento exista en la tabla `Events`:

```sql
INSERT INTO Events (event_id, name, description, start_date, end_date)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'ETH Bogotá 2024',
  'El evento de Ethereum más grande de Latinoamérica',
  '2024-06-01 09:00:00',
  '2024-06-03 18:00:00'
);
```

### Para Actividades

Debes crear un registro en la tabla `NFCs` vinculado a una actividad:

```sql
-- Primero, crea la actividad
INSERT INTO Activities (activity_id, event_id, sponsor_id, name, description, num_of_tokens)
VALUES (
  'activity-uuid-123',
  '550e8400-e29b-41d4-a716-446655440000',
  'sponsor-uuid-456',
  'Visitar Stand de Polygon',
  'Visita el stand de Polygon y aprende sobre scaling',
  50
);

-- Luego, crea el registro NFC
INSERT INTO NFCs (nfc_id, uuid, event_id, sponsor_id, activity_id, status)
VALUES (
  'nfc-db-id-789',
  'nfc-polygon-stand-001',  -- Este UUID va en el tag físico
  '550e8400-e29b-41d4-a716-446655440000',
  'sponsor-uuid-456',
  'activity-uuid-123',
  'available'
);
```

---

## Troubleshooting

### Problemas Comunes

**1. "No se encontró el NFC escaneado"**
- Verifica que el UUID existe en la tabla `NFCs` con `SELECT * FROM NFCs WHERE uuid = 'tu-uuid'`
- Verifica que el formato del tag es correcto

**2. "No se encontró el evento del pasaporte escaneado"**
- Verifica que el UUID del evento existe en la tabla `Events`
- Verifica que el evento está activo (fecha de inicio <= hoy <= fecha de fin)

**3. "Este código ya fue escaneado"**
- Es el comportamiento esperado para evitar duplicados
- Cada usuario solo puede escanear cada NFC una vez

**4. "NFC no está disponible en este dispositivo"**
- El dispositivo no soporta Web NFC API (probablemente iOS)
- El usuario debe usar la opción de código QR

**5. Código QR no se escanea correctamente**
- Asegúrate de que hay buena iluminación
- Verifica que el código QR tiene suficiente contraste
- Prueba con diferentes niveles de corrección de errores

---

## Recursos Adicionales

- **Web NFC API Docs:** https://web.dev/nfc/
- **html5-qrcode Library:** https://github.com/mebjas/html5-qrcode
- **NFC Tags Guide:** https://www.nfctags.com/nfc-tags-guide/

---

## Contacto y Soporte

Si tienes preguntas sobre el formato de datos o encuentras problemas:

1. Revisa este documento primero
2. Verifica los logs de la consola del navegador
3. Contacta al equipo de desarrollo de Swagly

---

**Última actualización:** 2025-10-13
**Versión del documento:** 1.0
