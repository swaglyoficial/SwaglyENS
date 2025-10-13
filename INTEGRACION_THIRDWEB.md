# Integración de Thirdweb para Claim de Tokens

Este documento explica cómo funciona la integración con Thirdweb para el claim automático de tokens en Swagly.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Archivos Modificados/Creados](#archivos-modificadoscreados)
- [Flujo de Funcionamiento](#flujo-de-funcionamiento)
- [Configuración](#configuración)
- [APIs Creadas](#apis-creadas)
- [Componentes Actualizados](#componentes-actualizados)

---

## 📝 Descripción General

La integración permite que los usuarios reciban tokens automáticamente cuando escanean merch, **sin necesidad de firmar transacciones** ni pagar gas fees. Todo el proceso se maneja desde el backend usando las APIs de Thirdweb.

### Ventajas de este enfoque:

✅ **Gasless**: El usuario no paga gas fees
✅ **Sin firma**: No se requiere que el usuario firme transacciones
✅ **Automático**: Los tokens se envían inmediatamente después del scan
✅ **Backend seguro**: Las claves privadas nunca se exponen al frontend

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Frontend      │
│  (scan-merch-   │
│   dialog.tsx)   │
└────────┬────────┘
         │
         │ 1. Usuario escanea NFC
         │
         ▼
┌─────────────────┐
│  API /scans     │
│  (route.ts)     │
└────────┬────────┘
         │
         │ 2. Valida y registra scan en BD
         │
         ▼
┌─────────────────┐
│ API /claim-     │
│    tokens       │
│  (route.ts)     │
└────────┬────────┘
         │
         │ 3. Llama a Thirdweb API
         │
         ▼
┌─────────────────┐
│  Thirdweb API   │
│  (External)     │
└────────┬────────┘
         │
         │ 4. Ejecuta transacción en blockchain
         │
         ▼
┌─────────────────┐
│   Smart         │
│   Contract      │
│   (Scroll)      │
└─────────────────┘
```

---

## 📁 Archivos Modificados/Creados

### Archivos CREADOS:

1. **`src/lib/thirdweb-config.ts`**
   - Configuración centralizada para Thirdweb
   - Constantes del contrato, wallets, y chain ID
   - Configuración por defecto para claims

2. **`src/app/api/claim-tokens/route.ts`**
   - API route para ejecutar el claim de tokens
   - Llama a la API de Thirdweb
   - Maneja errores y valida parámetros

### Archivos MODIFICADOS:

1. **`src/app/api/scans/route.ts`**
   - Ahora llama automáticamente a `/api/claim-tokens` después de validar el scan
   - Devuelve información del claim junto con el scan

2. **`src/components/scan-merch-dialog.tsx`**
   - Simplificado: ya no usa el hook `useClaimTokens`
   - Ya no requiere que el usuario firme transacciones
   - Interfaz más simple y directa

### Archivos que YA NO SE USAN (pero se mantienen por compatibilidad):

1. **`src/hooks/useClaimTokens.ts`**
   - Hook de wagmi para hacer claims desde el frontend
   - Ya no se usa en el nuevo flujo, pero se mantiene por si se necesita en el futuro

---

## 🔄 Flujo de Funcionamiento

### Paso a Paso:

#### 1️⃣ Usuario selecciona NFC

```tsx
// En scan-merch-dialog.tsx
// El usuario abre el diálogo y selecciona un NFC de la lista
<Select value={selectedNfcId} onValueChange={setSelectedNfcId}>
  {nfcs.map((nfc) => (
    <SelectItem key={nfc.id} value={nfc.id}>
      {nfc.activity.name} - {nfc.activity.numOfTokens} tokens
    </SelectItem>
  ))}
</Select>
```

#### 2️⃣ Usuario hace click en "Escanear"

```tsx
// Se llama a la función handleScan
const handleScan = async () => {
  const response = await fetch('/api/scans', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      nfcId: selectedNfcId,
      walletAddress,
    }),
  })
  // ...
}
```

#### 3️⃣ API /scans valida y registra el scan

```typescript
// En src/app/api/scans/route.ts

// 1. Validar que el NFC no haya sido usado
const existingScan = await prisma.scan.findFirst({
  where: { nfcId }
})

// 2. Registrar el scan en la BD
const scan = await prisma.scan.create({
  data: { userId, nfcId, isValid: true }
})

// 3. Actualizar progreso del pasaporte
// ...
```

#### 4️⃣ API /scans llama a /claim-tokens

```typescript
// En src/app/api/scans/route.ts

const claimResponse = await fetch('/api/claim-tokens', {
  method: 'POST',
  body: JSON.stringify({
    receiverAddress: walletAddress,
    quantity: nfc.activity.numOfTokens,
    activityName: nfc.activity.name,
  }),
})
```

#### 5️⃣ API /claim-tokens llama a Thirdweb

```typescript
// En src/app/api/claim-tokens/route.ts

const response = await fetch('https://api.thirdweb.com/v1/contracts/write', {
  method: 'POST',
  headers: {
    'x-secret-key': THIRDWEB_SECRET_KEY,
  },
  body: JSON.stringify({
    calls: [{
      contractAddress: SWAGLY_CONTRACT_ADDRESS,
      method: 'function claim(...)',
      params: [receiverAddress, quantity, ...],
    }],
    chainId: SCROLL_SEPOLIA_CHAIN_ID,
    from: THIRDWEB_WALLET_ADDRESS,
  }),
})
```

#### 6️⃣ Thirdweb ejecuta la transacción

- Thirdweb firma la transacción con su wallet
- Ejecuta el claim en el smart contract
- Devuelve el transaction hash

#### 7️⃣ Usuario recibe confirmación

```tsx
// En scan-merch-dialog.tsx
// Se muestra mensaje de éxito con link al explorador de bloques
<CheckCircle2 />
<p>¡Tokens enviados exitosamente a tu wallet!</p>
<a href={`https://sepolia.scrollscan.com/tx/${transactionHash}`}>
  Ver en el explorador de bloques →
</a>
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env.local` y llena las variables:

```bash
cp .env.example .env.local
```

Variables requeridas:

```env
# Thirdweb
THIRDWEB_SECRET_KEY=tu_secret_key_aqui
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=tu_client_id_aqui

# Otras
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

### 2. Obtener Secret Key de Thirdweb

1. Ve a [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Crea un proyecto (o usa uno existente)
3. Ve a **Settings** → **API Keys**
4. Crea una nueva **Secret Key**
5. Copia y pega en tu `.env.local`

⚠️ **IMPORTANTE**: Nunca compartas tu Secret Key ni la subas a git.

### 3. Configurar Wallet Creator

⚠️ **IMPORTANTE**: La wallet del creator (`0x645AC03F1db27080A11d3f3a01030c455c7021bD`) es la **ÚNICA** wallet con permisos de **MINTER** en el contrato ERC-1155.

Esta wallet:
- Ya tiene permisos de MINTER (no necesitas otorgarlos)
- Es la que ejecuta todas las transacciones de claim
- Debe estar configurada en Thirdweb Dashboard

Para configurar la wallet en Thirdweb:
1. Ve a [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Importa tu wallet creator usando la private key o seed phrase
3. Asegúrate de que tenga suficiente ETH para gas en Scroll Sepolia

---

## 🔌 APIs Creadas

### POST `/api/claim-tokens`

Envía tokens a un usuario usando Thirdweb.

**Request Body:**

```json
{
  "receiverAddress": "0x...",  // Wallet del usuario
  "quantity": 10,               // Cantidad de tokens
  "activityName": "Escanear QR" // Opcional
}
```

**Response (éxito):**

```json
{
  "success": true,
  "message": "10 tokens enviados exitosamente a 0x...",
  "data": {
    "receiverAddress": "0x...",
    "quantity": 10,
    "transactionHash": "0xabc123...",
    "chainId": 534351,
    "contractAddress": "0x05668..."
  }
}
```

**Response (error):**

```json
{
  "error": "Error al ejecutar claim en blockchain",
  "details": "Insufficient funds"
}
```

### GET `/api/claim-tokens`

Devuelve información sobre la configuración del claim.

**Response:**

```json
{
  "message": "Endpoint para reclamar tokens usando Thirdweb API",
  "contractAddress": "0x05668BC3Fb05c2894988142a0b730149122192eB",
  "chainId": 534351,
  "claimConfig": {
    "currency": "0xEeee...",
    "pricePerToken": 0
  }
}
```

---

## 🎨 Componentes Actualizados

### `scan-merch-dialog.tsx`

**Cambios principales:**

1. **Eliminado** el hook `useClaimTokens` (wagmi)
2. **Eliminados** los estados: `step`, `isWritePending`, `isConfirming`, `isConfirmed`, `hash`
3. **Simplificado** el flujo: ahora solo llama a `/api/scans` y espera respuesta
4. **Agregado** estado `transactionHash` para mostrar el hash del claim
5. **Actualizado** el UI para reflejar el nuevo flujo

**Antes** (con wagmi):

```tsx
// Usuario tenía que firmar transacción
await claimTokens({
  receiverAddress: walletAddress,
  quantity: BigInt(tokens),
})
// Esperar confirmación...
```

**Ahora** (con Thirdweb backend):

```tsx
// Todo se hace en el backend automáticamente
const response = await fetch('/api/scans', {
  method: 'POST',
  body: JSON.stringify({ userId, nfcId, walletAddress }),
})
// ¡Listo! Tokens enviados
```

---

## 🔐 Seguridad

### Buenas prácticas implementadas:

✅ **Secret Key en backend**: Nunca se expone al frontend
✅ **Validaciones**: Se valida wallet address, cantidad, y NFC
✅ **Single-use NFCs**: Cada NFC solo se puede escanear una vez
✅ **Logs detallados**: Todas las operaciones se registran en consola
✅ **Manejo de errores**: Errores claros y descriptivos

### Consideraciones de seguridad:

⚠️ **Rate limiting**: Considera agregar rate limiting a las APIs
⚠️ **Autenticación**: Asegúrate de que solo usuarios autenticados puedan escanear
⚠️ **Monitoring**: Monitorea transacciones sospechosas o excesivas

---

## 🧪 Testing

### Probar el flujo completo:

1. **Inicia el servidor de desarrollo:**

```bash
npm run dev
```

2. **Abre la aplicación** en `http://localhost:3000`

3. **Conecta tu wallet** (asegúrate de estar en Scroll Sepolia)

4. **Haz click en "Escanear Merch"**

5. **Selecciona un NFC** de la lista

6. **Haz click en "Escanear"**

7. **Espera** a que se procese (2-5 segundos)

8. **Verifica** que recibes el mensaje de éxito

9. **Revisa tu wallet** para confirmar que recibiste los tokens

### Verificar transacción:

Puedes ver la transacción en el explorador de bloques:

```
https://sepolia.scrollscan.com/tx/{TRANSACTION_HASH}
```

---

## 🐛 Troubleshooting

### Error: "receiverAddress inválida"

**Causa**: La wallet address no tiene el formato correcto

**Solución**: Verifica que la wallet address comience con `0x` y tenga 42 caracteres

### Error: "Error al ejecutar claim en blockchain"

**Causa**: La wallet del creator no tiene permisos MINTER o no está configurada correctamente

**Solución**:
- Verifica que la wallet `0x645AC03F1db27080A11d3f3a01030c455c7021bD` tenga permisos MINTER
- Asegúrate de que esta wallet esté configurada en Thirdweb Dashboard
- Verifica que la Secret Key de Thirdweb corresponda a esta wallet

### Error: "Insufficient funds"

**Causa**: La wallet del creator no tiene suficiente ETH para gas

**Solución**: Envía ETH a `0x645AC03F1db27080A11d3f3a01030c455c7021bD` en Scroll Sepolia

### Error: "Esta merch ya fue escaneada"

**Causa**: El NFC ya fue usado por otro usuario

**Solución**: Este es el comportamiento esperado. Cada NFC solo se puede usar una vez.

---

## 📚 Recursos

- [Thirdweb Docs](https://portal.thirdweb.com/)
- [Thirdweb API Reference](https://portal.thirdweb.com/references/api)
- [Scroll Sepolia Explorer](https://sepolia.scrollscan.com/)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)

---

## 🎉 Conclusión

La integración con Thirdweb permite una experiencia de usuario fluida y sin fricciones. Los usuarios pueden recibir tokens instantáneamente sin necesidad de conocimientos técnicos sobre blockchain, wallets o gas fees.

**¡Happy claiming!** 🎫✨
