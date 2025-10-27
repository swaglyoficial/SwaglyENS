import { NextRequest, NextResponse } from 'next/server'

/**
 * DEPRECADO: Este endpoint ya no se usa
 *
 * Las compras en la tienda ahora se procesan directamente desde el frontend
 * usando wagmi y el hook useTransferSwag.
 *
 * El usuario firma la transacción con su propia wallet para transferir
 * tokens SWAG al creador.
 *
 * Ver: src/hooks/useTransferSwag.ts
 * Ver: src/app/shop/page.tsx
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Este endpoint está deprecado',
      message: 'Las compras ahora se procesan directamente desde el frontend usando wagmi',
      details: 'El usuario debe firmar la transacción con su propia wallet',
    },
    { status: 410 } // 410 Gone - el recurso ya no está disponible
  )
}

export async function GET() {
  return NextResponse.json({
    status: 'deprecated',
    message: 'Este endpoint está deprecado',
    reason: 'Las compras ahora se procesan desde el frontend',
    migration: {
      hook: 'useTransferSwag',
      file: 'src/hooks/useTransferSwag.ts',
      usage: 'Ver src/app/shop/page.tsx para ejemplo de uso',
    },
  })
}
