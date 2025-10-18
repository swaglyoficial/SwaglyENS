# 🔧 Configuración de Thirdweb para Swagly

Esta guía te ayudará a configurar correctamente Thirdweb para que tu aplicación Swagly pueda enviar tokens automáticamente a los usuarios cuando escaneen merch.

## 📋 Tabla de Contenidos

1. [Configuración en Thirdweb Dashboard](#1-configuración-en-thirdweb-dashboard)
2. [Configuración del Smart Contract](#2-configuración-del-smart-contract)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Flujo de Funcionamiento](#4-flujo-de-funcionamiento)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Configuración en Thirdweb Dashboard

### 1.1 Crear Cuenta en Thirdweb

1. Ve a [https://thirdweb.com](https://thirdweb.com)
2. Crea una cuenta o inicia sesión
3. Conecta tu wallet (la que desplegó el contrato)

### 1.2 Obtener API Keys

1. Ve a **Dashboard** → **Settings** → **API Keys**
2. Verás dos tipos de keys:

   **a) Client ID (Público)** - Ya configurado en el proyecto:
   ```
   ba7a96650ddbf17991e91a37adc04faf
   ```
   - Se usa en el frontend para conectar wallets
   - Es seguro exponerlo públicamente

   **b) Secret Key (Privada)** - DEBES OBTENER UNA:
   ```
   w2eFsou5nA2a0Bnkce1p-vf2lyr_iDXtKUUvdMUNp6KdRR8452ipc29Bs3CtWESrdlTyQVrrTmpdjQrbOK-80A
   ```
   - Se usa en el backend para firmar transacciones
   - **NUNCA la expongas en el frontend o GitHub**
   - Guárdala en el archivo `.env.local`

3. Copia tu **Secret Key** y guárdala en `.env.local`:
   ```env
   THIRDWEB_SECRET_KEY="tu_secret_key_aqui"
   ```

### 1.3 Configurar Thirdweb Engine (Opcional pero Recomendado)

Thirdweb Engine permite ejecutar transacciones gasless (sin gas fees para el usuario).

1. Ve a **Dashboard** → **Engine**
2. Si no tienes uno, haz click en **"Create Engine"**
3. Sigue el wizard de configuración:
   - Selecciona el plan (hay un plan gratuito)
   - Conecta una wallet para que sea la "backend wallet"
   - Esta wallet firmará las transacciones automáticamente

4. Una vez creado, copia la **Engine URL** y agrégala a `.env.local`:
   ```env
   THIRDWEB_ENGINE_URL="https://your-engine-url.thirdweb.com"
   ```

> **Nota:** Si no usas Engine, las transacciones se ejecutarán con la API estándar de Thirdweb, pero necesitas fondos en la wallet configurada.

---

## 2. Configuración del Smart Contract

Tu contrato ERC-1155 ya está desplegado en **Scroll Sepolia**:
```
Dirección: 0x05668BC3Fb05c2894988142a0b730149122192eB
Chain ID: 534351 (Scroll Sepolia)
```

### 2.1 Configurar Claim Conditions en Thirdweb UI

Las **Claim Conditions** definen cómo los usuarios pueden reclamar tokens. Como NO tienes precio en tus tokens, debes configurarlas para que sean **GRATIS**.

**Opción A: Configurar desde Thirdweb Dashboard (Recomendado)**

1. Ve a [https://thirdweb.com/scroll-sepolia/0x05668BC3Fb05c2894988142a0b730149122192eB](https://thirdweb.com/scroll-sepolia/0x05668BC3Fb05c2894988142a0b730149122192eB)

2. Haz click en la pestaña **"Claim Conditions"**

3. Haz click en **"Add Phase"** o **"Set Claim Conditions"**

4. Configura la condición con estos valores:

   | Campo | Valor | Descripción |
   |-------|-------|-------------|
   | **When will this phase start?** | `Now` o fecha específica | Cuándo los usuarios pueden empezar a reclamar |
   | **How many NFTs can be claimed?** | `Unlimited` o número específico | Cantidad total disponible para reclamar |
   | **How much do you want to charge?** | `Free` o `0` | **IMPORTANTE: Ponlo en FREE/GRATIS** |
   | **What currency?** | `Native Token (ETH)` | Moneda (no aplica si es gratis) |
   | **Who can claim?** | `Any wallet` | Sin whitelist = cualquiera puede reclamar |
   | **How many per wallet?** | `Unlimited` o número | Límite por wallet (ej: 10 tokens máximo) |

5. Haz click en **"Save Conditions"**

6. Firma la transacción con tu wallet (necesitas un poco de ETH en Scroll Sepolia)

**Opción B: Configurar mediante API (Avanzado)**

Si prefieres configurar las condiciones mediante código, puedes usar este endpoint:

```typescript
// Este código se ejecuta UNA VEZ como administrador
const response = await fetch("https://api.thirdweb.com/v1/contracts/write", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-secret-key": "TU_SECRET_KEY",
  },
  body: JSON.stringify({
    calls: [{
      contractAddress: "0x05668BC3Fb05c2894988142a0b730149122192eB",
      method: "function setClaimConditions((uint256 startTimestamp, uint256 maxClaimableSupply, uint256 supplyClaimed, uint256 quantityLimitPerWallet, bytes32 merkleRoot, uint256 pricePerToken, address currency, string metadata)[] _conditions, bool _resetClaimEligibility)",
      params: [
        [
          {
            startTimestamp: 0, // 0 = disponible inmediatamente
            maxClaimableSupply: 0, // 0 = sin límite
            supplyClaimed: 0, // siempre 0 al inicio
            quantityLimitPerWallet: 0, // 0 = sin límite por wallet
            merkleRoot: "0x0000000000000000000000000000000000000000000000000000000000000000", // sin whitelist
            pricePerToken: 0, // 0 = GRATIS
            currency: "0x0000000000000000000000000000000000000000", // address(0) = nativa
            metadata: "" // metadata opcional
          }
        ],
        false // resetClaimEligibility = false
      ],
    }],
    chainId: 534351,
    from: "TU_WALLET_ADDRESS", // wallet con permisos de admin
  }),
});
```

### 2.2 Configurar Permisos de Minter

Para que tu backend pueda enviar tokens automáticamente, necesitas dar permisos de **MINTER** a la wallet que usará el backend.

**Opción A: Desde Thirdweb Dashboard**

1. Ve a tu contrato en Thirdweb Dashboard
2. Haz click en la pestaña **"Permissions"**
3. Busca el rol **"MINTER_ROLE"** o **"Minter"**
4. Haz click en **"Add Address"**
5. Pega la wallet address que usarás en el backend:
   - Si usas Engine: la wallet configurada en Engine
   - Si no: tu wallet personal o una wallet dedicada
6. Guarda y firma la transacción

**Opción B: Desde el Contrato Directamente**

Si tu contrato usa `AccessControl` de OpenZeppelin, puedes llamar a:
```solidity
grantRole(MINTER_ROLE, WALLET_ADDRESS_DEL_BACKEND)
```

### 2.3 Fondear la Wallet del Backend

La wallet que firma las transacciones necesita un poco de ETH para pagar gas fees:

1. Obtén ETH de Scroll Sepolia desde un faucet:
   - [Scroll Sepolia Faucet](https://sepolia.scroll.io/faucet)
   - [Alchemy Faucet](https://sepoliafaucet.com/)

2. Envía al menos **0.01 ETH** a la wallet del backend

---

## 3. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con estas variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/swagly"

# Thirdweb
THIRDWEB_SECRET_KEY="tu_secret_key_de_thirdweb"
CREATOR_WALLET_ADDRESS="0xTuWalletConPermisosMinter"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**⚠️ IMPORTANTE:**
- Nunca subas el archivo `.env.local` a GitHub
- Ya existe un `.gitignore` que lo excluye
- Usa `.env.example` como referencia

---

## 4. Flujo de Funcionamiento

### 🔄 Cómo funciona el sistema completo:

```
1. 👤 Usuario hace click en "Escanear Merch"
   ↓
2. 🖱️ Selecciona la actividad/NFC de la lista
   ↓
3. 📡 Frontend llama a /api/scans
   {
     userId: "uuid",
     nfcId: "uuid",
     walletAddress: "0x..."
   }
   ↓
4. 🗄️ Backend valida y registra el scan en la BD
   ↓
5. 🔗 Backend llama a /api/claim-tokens
   {
     receiverAddress: "0x...",
     quantity: 10, // tokens de la actividad
     activityName: "Escanear Merch"
   }
   ↓
6. 🔧 API de claim-tokens usa Thirdweb API
   - Usa la configuración de thirdweb-config.ts
   - Usa la THIRDWEB_SECRET_KEY
   - Llama a la función claim() del contrato
   ↓
7. ⛓️ Thirdweb ejecuta la transacción en blockchain
   - Firma con la wallet del backend
   - Envía los tokens al usuario
   - Usuario NO paga gas fees
   - Usuario NO firma transacción
   ↓
8. ✅ Tokens aparecen en la wallet del usuario
   ↓
9. 🎉 Usuario ve mensaje de éxito con transaction hash
```

### 📄 Archivos Clave:

- **`src/lib/thirdweb-config.ts`**: Configuración centralizada de Thirdweb
- **`src/app/api/claim-tokens/route.ts`**: API que envía tokens usando Thirdweb
- **`src/app/api/scans/route.ts`**: API que registra scans y llama a claim-tokens
- **`src/components/scan-merch-dialog.tsx`**: UI para escanear merch

---

## 5. Troubleshooting

### ❌ Error: "No MINTER_ROLE"

**Problema:** La wallet del backend no tiene permisos para mintear tokens.

**Solución:**
1. Ve a Thirdweb Dashboard → Permissions
2. Da el rol MINTER a la wallet configurada en `CREATOR_WALLET_ADDRESS`
3. Verifica que la dirección en `.env.local` sea correcta

---

### ❌ Error: "Insufficient funds"

**Problema:** La wallet del backend no tiene ETH para pagar gas fees.

**Solución:**
1. Obtén ETH de Scroll Sepolia desde un faucet
2. Envía al menos 0.01 ETH a la wallet del backend

---

### ❌ Error: "Invalid claim conditions"

**Problema:** Las claim conditions no están configuradas o tienen un precio.

**Solución:**
1. Ve a Thirdweb Dashboard → Claim Conditions
2. Verifica que el precio esté en **0** (gratis)
3. Verifica que la fase esté **activa** (fecha de inicio pasada)

---

### ❌ Error: "THIRDWEB_SECRET_KEY not found"

**Problema:** La variable de entorno no está configurada.

**Solución:**
1. Crea el archivo `.env.local` en la raíz del proyecto
2. Agrega: `THIRDWEB_SECRET_KEY="tu_key_aqui"`
3. Reinicia el servidor de desarrollo (`npm run dev`)

---

### 🔍 Verificar que todo funciona:

1. **Verificar configuración:**
   ```bash
   curl http://localhost:3000/api/claim-tokens
   ```
   Debería devolver la configuración actual.

2. **Probar claim manual:**
   ```bash
   curl -X POST http://localhost:3000/api/claim-tokens \
     -H "Content-Type: application/json" \
     -d '{
       "receiverAddress": "0xTuWalletAddress",
       "quantity": 1,
       "activityName": "Test"
     }'
   ```

3. **Ver transacciones en el explorador:**
   - [Scroll Sepolia Explorer](https://sepolia.scrollscan.com/)
   - Busca tu contrato: `0x05668BC3Fb05c2894988142a0b730149122192eB`
   - Verifica que aparezcan las transacciones de claim

---

## 📝 Notas Finales

### ✅ Checklist de Configuración:

- [ ] Cuenta de Thirdweb creada
- [ ] Client ID y Secret Key obtenidas
- [ ] Archivo `.env.local` creado con las variables
- [ ] Claim Conditions configuradas (precio = 0)
- [ ] Permisos MINTER otorgados a la wallet del backend
- [ ] Wallet del backend fondeada con ETH de Scroll Sepolia
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Probado el flujo completo de escaneo

### 🎯 Configuración para Producción:

Cuando vayas a producción, recuerda:

1. **Cambiar el contrato a mainnet** (si aplica)
2. **Cambiar `NEXT_PUBLIC_APP_URL`** a tu dominio real
3. **Usar variables de entorno seguras** en tu hosting (Vercel, Railway, etc)
4. **NO hardcodear** la Secret Key en el código
5. **Monitorear** las transacciones y gas fees

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs** en la consola del servidor
2. **Verifica en Thirdweb Dashboard** el estado de tu contrato
3. **Consulta la documentación** oficial:
   - [Thirdweb Docs](https://portal.thirdweb.com/)
   - [Thirdweb API Reference](https://portal.thirdweb.com/typescript/v5)
   - [Scroll Sepolia Docs](https://docs.scroll.io/)

---

**🎉 ¡Listo! Tu aplicación Swagly está configurada para enviar tokens automáticamente cuando los usuarios escaneen merch.**
