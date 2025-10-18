# Flujo Completo: Cómo se Distribuyen los Tokens en Swagly

Este documento explica el flujo completo de cómo los usuarios reciben tokens al escanear merch/NFCs en Swagly.

## 📋 Tabla de Contenidos

1. [Resumen del Flujo](#resumen-del-flujo)
2. [Componentes del Sistema](#componentes-del-sistema)
3. [Flujo Paso a Paso](#flujo-paso-a-paso)
4. [Configuración de Precios](#configuración-de-precios)
5. [APIs Disponibles](#apis-disponibles)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Resumen del Flujo

Cuando un usuario escanea un NFC de merch en un evento:

1. **Frontend**: Usuario selecciona un NFC y hace clic en "Escanear" (`ScanMerchDialog`)
2. **API de Scans** (`/api/scans`): Valida el NFC, registra el scan en la BD
3. **API de Claim Tokens** (`/api/claim-tokens`): Llama a Thirdweb para enviar tokens automáticamente
4. **Thirdweb**: Ejecuta la transacción en blockchain (gasless, sin firma del usuario)
5. **Resultado**: Usuario recibe tokens en su wallet sin pagar gas ni firmar transacción

---

## 🧩 Componentes del Sistema

### Frontend

#### 1. `src/components/scan-merch-dialog.tsx`
Componente UI que permite al usuario:
- Ver lista de NFCs disponibles del evento
- Seleccionar un NFC para escanear
- Ver información de la actividad y tokens que recibirá
- Ejecutar el scan (llama a `/api/scans`)

**Props requeridas:**
```typescript
{
  userId: string          // ID del usuario
  walletAddress: string   // Wallet del usuario
  eventId: string         // ID del evento actual
  onScanSuccess: () => void  // Callback cuando se completa el scan
}
```

#### 2. `src/hooks/useClaimTokens.ts`
Hook de Wagmi para reclamar tokens **desde el frontend** (requiere firma del usuario).
**Nota:** Actualmente NO se usa, porque usamos el flujo gasless del backend.

---

### Backend (APIs)

#### 1. `/api/scans` - Procesar Scan de Merch
**Ruta:** `src/app/api/scans/route.ts`

**POST** - Escanear un NFC y dar tokens automáticamente

**Body:**
```json
{
  "userId": "uuid del usuario",
  "nfcId": "uuid del NFC escaneado",
  "walletAddress": "0x... wallet del usuario"
}
```

**Qué hace:**
1. ✅ Valida que el NFC no haya sido escaneado antes
2. 📝 Registra el scan en la base de datos
3. 📊 Actualiza el progreso del pasaporte del usuario
4. 🎫 Llama a `/api/claim-tokens` para enviar tokens automáticamente

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Merch escaneada exitosamente. X tokens enviados a tu wallet.",
  "scan": { /* datos del scan */ },
  "claimResult": { /* resultado del claim de tokens */ },
  "scanData": {
    "walletAddress": "0x...",
    "tokens": 10,
    "activityId": "uuid",
    "activityName": "Escanear QR",
    "nfcId": "uuid",
    "transactionHash": "0x..."
  }
}
```

---

#### 2. `/api/claim-tokens` - Enviar Tokens (Gasless)
**Ruta:** `src/app/api/claim-tokens/route.ts`

**POST** - Enviar tokens a una wallet usando Thirdweb (sin gas para el usuario)

**Body:**
```json
{
  "receiverAddress": "0x... wallet que recibe",
  "quantity": 10,
  "activityName": "Escanear QR" // opcional
}
```

**Qué hace:**
1. 🔐 Valida los parámetros (dirección, cantidad)
2. 📦 Prepara los parámetros para la función `claim` del contrato
3. 🚀 Llama a la API de Thirdweb para ejecutar la transacción
4. ✅ Devuelve el hash de la transacción

**Configuración actual:**
- ✅ Tokens **GRATIS** (pricePerToken = 0)
- ✅ Sin límite por wallet
- ✅ Sin whitelist
- ✅ Gasless (usuario no paga gas ni firma transacción)

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "10 tokens enviados exitosamente a 0x...",
  "data": {
    "receiverAddress": "0x...",
    "quantity": 10,
    "activityName": "Escanear QR",
    "transactionHash": "0x...",
    "chainId": 534351,
    "contractAddress": "0x05668BC3Fb05c2894988142a0b730149122192eB"
  }
}
```

---

#### 3. `/api/set-claim-conditions` - Configurar Precios/Condiciones
**Ruta:** `src/app/api/set-claim-conditions/route.ts`

**POST** - Configurar las condiciones de claim (precio, límites, fechas, etc.)

**Body:**
```json
{
  "conditions": [
    {
      "startTimestamp": 0,
      "maxClaimableSupply": "1000000000000",
      "supplyClaimed": "0",
      "quantityLimitPerWallet": "0",
      "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "pricePerToken": "0",
      "currency": "0x0000000000000000000000000000000000000000",
      "metadata": ""
    }
  ],
  "resetClaimEligibility": false
}
```

**Casos de uso:**
- 💰 Establecer precio a los tokens (ej: 0.001 ETH por token)
- 🔢 Limitar cuántos tokens puede reclamar cada wallet
- 📅 Programar fechas de inicio/fin del claim
- 🎯 Crear whitelist (solo ciertas wallets pueden reclamar)

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Claim conditions configuradas exitosamente",
  "data": {
    "conditionsCount": 1,
    "resetClaimEligibility": false,
    "transactionHash": "0x...",
    "chainId": 534351,
    "contractAddress": "0x05668BC3Fb05c2894988142a0b730149122192eB"
  }
}
```

---

### Configuración

#### 1. `src/lib/thirdweb-config.ts`
Configuración centralizada de Thirdweb:
- Client ID y Secret Key
- Dirección del contrato
- Chain ID (Scroll Sepolia)
- Configuración de claim por defecto
- Funciones helper para crear condiciones personalizadas

#### 2. `src/lib/thirdweb-client.ts`
Cliente de Thirdweb y conexión al contrato:
- Cliente de Thirdweb
- Configuración de la chain (Scroll Sepolia)
- Instancia del contrato

---

## 🔄 Flujo Paso a Paso

### Flujo Normal: Usuario Escanea Merch

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario abre ScanMerchDialog                                 │
│    - Ve lista de NFCs disponibles del evento                    │
│    - Selecciona un NFC                                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Usuario hace clic en "Escanear"                              │
│    - Frontend llama a POST /api/scans                           │
│    - Body: { userId, nfcId, walletAddress }                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. API /api/scans valida el NFC                                 │
│    ✅ Verifica que el NFC no haya sido escaneado antes          │
│    ✅ Obtiene información de la actividad (tokens a dar)        │
│    ✅ Registra el scan en la base de datos                      │
│    ✅ Actualiza el progreso del pasaporte                       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API /api/scans llama a /api/claim-tokens                     │
│    - Body: {                                                    │
│        receiverAddress: walletAddress,                          │
│        quantity: activity.numOfTokens,                          │
│        activityName: activity.name                              │
│      }                                                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API /api/claim-tokens prepara parámetros                     │
│    - receiverAddress: quien recibe los tokens                   │
│    - quantity: cuántos tokens                                   │
│    - currency: 0x0 (gratis)                                     │
│    - pricePerToken: 0 (gratis)                                  │
│    - allowlistProof: sin whitelist                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. API /api/claim-tokens llama a Thirdweb API                   │
│    POST https://api.thirdweb.com/v1/contracts/write            │
│    Headers:                                                     │
│      - x-secret-key: THIRDWEB_SECRET_KEY                        │
│    Body:                                                        │
│      - calls: [función claim con parámetros]                    │
│      - chainId: 534351 (Scroll Sepolia)                         │
│      - from: CREATOR_WALLET_ADDRESS (wallet con permisos)       │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Thirdweb ejecuta la transacción en blockchain                │
│    - Firma la transacción con la wallet del creator             │
│    - Ejecuta la función claim del contrato                      │
│    - Usuario NO firma transacción                               │
│    - Usuario NO paga gas                                        │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Thirdweb devuelve resultado                                  │
│    - Transaction hash                                           │
│    - API /api/claim-tokens devuelve resultado                   │
│    - API /api/scans devuelve resultado                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. Frontend muestra resultado                                   │
│    ✅ Mensaje de éxito                                          │
│    ✅ Hash de la transacción                                    │
│    ✅ Link al explorador de bloques                             │
│    ✅ Cierra el diálogo después de 2.5 segundos                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Configuración de Precios

### Estado Actual: GRATIS ✅

Actualmente los tokens son **completamente gratis**:
- ✅ Usuario NO paga nada
- ✅ Usuario NO firma transacción
- ✅ Usuario NO paga gas
- ✅ Tokens se envían automáticamente al escanear merch

### Cambiar a Tokens con Precio

Si en el futuro quieres que los tokens tengan un precio, usa la API `/api/set-claim-conditions`:

#### Ejemplo 1: Establecer precio de 0.001 ETH por token

```bash
POST /api/set-claim-conditions
Content-Type: application/json

{
  "conditions": [
    {
      "startTimestamp": 0,
      "maxClaimableSupply": "1000000000000",
      "supplyClaimed": "0",
      "quantityLimitPerWallet": "0",
      "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "pricePerToken": "1000000000000000",  // 0.001 ETH en wei
      "currency": "0x0000000000000000000000000000000000000000",
      "metadata": ""
    }
  ],
  "resetClaimEligibility": false
}
```

#### Ejemplo 2: Limitar a 10 tokens por wallet

```bash
POST /api/set-claim-conditions
Content-Type: application/json

{
  "conditions": [
    {
      "startTimestamp": 0,
      "maxClaimableSupply": "1000000000000",
      "supplyClaimed": "0",
      "quantityLimitPerWallet": "10",  // Máximo 10 tokens por wallet
      "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "pricePerToken": "0",
      "currency": "0x0000000000000000000000000000000000000000",
      "metadata": ""
    }
  ],
  "resetClaimEligibility": false
}
```

#### Ejemplo 3: Claim que comienza en una fecha futura

```bash
POST /api/set-claim-conditions
Content-Type: application/json

{
  "conditions": [
    {
      "startTimestamp": 1735689600,  // 1 de enero de 2025 (timestamp Unix)
      "maxClaimableSupply": "1000000000000",
      "supplyClaimed": "0",
      "quantityLimitPerWallet": "0",
      "merkleRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "pricePerToken": "0",
      "currency": "0x0000000000000000000000000000000000000000",
      "metadata": ""
    }
  ],
  "resetClaimEligibility": false
}
```

---

## 🛠️ APIs Disponibles

### 1. POST /api/scans
Escanear merch y dar tokens automáticamente

**Usar cuando:** El usuario escanea un NFC de merch en un evento

### 2. GET /api/scans?userId=xxx
Obtener historial de scans de un usuario

**Usar cuando:** Quieres ver todos los scans que ha hecho un usuario

### 3. POST /api/claim-tokens
Enviar tokens a una wallet (gasless)

**Usar cuando:** Quieres enviar tokens manualmente a alguien (no relacionado a scans)

### 4. GET /api/claim-tokens
Ver información de la configuración actual de claim

### 5. POST /api/set-claim-conditions
Configurar precios, límites y condiciones de claim

**Usar cuando:** Quieres cambiar el precio de los tokens, agregar límites, fechas, etc.

### 6. GET /api/set-claim-conditions
Ver ejemplos de cómo configurar claim conditions

---

## 📝 Ejemplos de Uso

### Frontend: Integrar el botón de escanear merch

```tsx
import { ScanMerchDialog } from '@/components/scan-merch-dialog'

function Dashboard() {
  const userId = 'uuid-del-usuario'
  const walletAddress = '0x...' // wallet conectada del usuario
  const eventId = 'uuid-del-evento'

  const handleScanSuccess = () => {
    // Actualizar datos del usuario (balance, pasaporte, etc.)
    console.log('¡Scan exitoso! Tokens enviados.')
  }

  return (
    <div>
      <ScanMerchDialog
        userId={userId}
        walletAddress={walletAddress}
        eventId={eventId}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  )
}
```

### Backend: Enviar tokens manualmente

```typescript
// Enviar 50 tokens a una wallet específica
const response = await fetch('/api/claim-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiverAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    quantity: 50,
    activityName: 'Bonus Manual',
  }),
})

const data = await response.json()
console.log('Transaction Hash:', data.data.transactionHash)
```

### Backend: Establecer precio de 0.001 ETH

```typescript
const response = await fetch('/api/set-claim-conditions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conditions: [
      {
        startTimestamp: 0,
        maxClaimableSupply: '1000000000000',
        supplyClaimed: '0',
        quantityLimitPerWallet: '0',
        merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
        pricePerToken: '1000000000000000', // 0.001 ETH
        currency: '0x0000000000000000000000000000000000000000',
        metadata: '',
      },
    ],
    resetClaimEligibility: false,
  }),
})

const data = await response.json()
console.log('Precio actualizado:', data)
```

---

## ⚙️ Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu `.env` o `.env.local`:

```env
# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=ba7a96650ddbf17991e91a37adc04faf
THIRDWEB_SECRET_KEY=w2eFsou5nA2a0Bnkce1p-vf2lyr_iDXtKUUvdMUNp6KdRR8452ipc29Bs3CtWESrdlTyQVrrTmpdjQrbOK-80A

# Wallet del creador (con permisos MINTER en el contrato)
CREATOR_WALLET_ADDRESS=0xTU_WALLET_ADDRESS

# URL de la app (para llamadas internas de API)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # en desarrollo
# NEXT_PUBLIC_APP_URL=https://tudominio.com  # en producción
```

---

## 🎉 Resumen

Ya tienes todo configurado para:

✅ **Escanear merch y dar tokens automáticamente** (gratis, gasless)
✅ **Cambiar precios y condiciones** cuando lo necesites
✅ **Rastrear todos los scans** en la base de datos
✅ **Actualizar progreso del pasaporte** automáticamente

El usuario solo necesita:
1. Conectar su wallet
2. Seleccionar un NFC
3. Hacer clic en "Escanear"
4. ¡Recibir tokens automáticamente! 🎫

¡Todo funciona sin que el usuario firme transacciones ni pague gas! 🚀
