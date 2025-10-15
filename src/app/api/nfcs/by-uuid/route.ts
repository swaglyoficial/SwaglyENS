/**
 * ============================================
 * API: GET /api/nfcs/by-uuid
 * ============================================
 *
 * Busca un NFC por su UUID en lugar de por ID de base de datos.
 *
 * Esta API es necesaria para el escaneo real de NFC/QR, ya que el
 * UUID es lo que viene en el tag físico o en el código QR.
 *
 * Uso:
 * GET /api/nfcs/by-uuid?uuid=abc123-nfc-uuid
 *
 * Respuesta exitosa:
 * {
 *   success: true,
 *   nfc: {
 *     id: "...",
 *     uuid: "abc123-nfc-uuid",
 *     eventId: "...",
 *     activityId: "...",
 *     activity: {
 *       name: "...",
 *       description: "...",
 *       numOfTokens: 10
 *     },
 *     event: {
 *       name: "...",
 *       description: "..."
 *     }
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * ============================================
 * GET - Buscar NFC por UUID
 * ============================================
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================
    // OBTENER UUID DE LOS QUERY PARAMS
    // ========================================

    const searchParams = request.nextUrl.searchParams
    const uuid = searchParams.get('uuid')

    // ========================================
    // VALIDAR UUID
    // ========================================

    if (!uuid) {
      return NextResponse.json(
        {
          success: false,
          error: 'UUID es requerido',
          details: 'Debes proporcionar el UUID del NFC en los query params',
        },
        { status: 400 }
      )
    }

    // Validar formato de UUID (opcional pero recomendado)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      // Permitir también UUIDs sin guiones o formatos personalizados
      // Solo verificar que no esté vacío
      if (uuid.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'UUID inválido',
            details: 'El UUID proporcionado no es válido',
          },
          { status: 400 }
        )
      }
    }

    console.log(`🔍 Buscando NFC con UUID: ${uuid}`)

    // ========================================
    // BUSCAR NFC EN LA BASE DE DATOS
    // ========================================

    const nfc = await prisma.nFC.findUnique({
      where: {
        uuid: uuid,
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            description: true,
            numOfTokens: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sponsor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // ========================================
    // VERIFICAR SI SE ENCONTRÓ EL NFC
    // ========================================

    if (!nfc) {
      console.warn(`⚠️ NFC no encontrado: ${uuid}`)

      return NextResponse.json(
        {
          success: false,
          error: 'NFC no encontrado',
          details: `No existe un NFC con el UUID: ${uuid}`,
        },
        { status: 404 }
      )
    }

    console.log(`✅ NFC encontrado: ${nfc.uuid} - Actividad: ${nfc.activity.name}`)

    // ========================================
    // RETORNAR NFC ENCONTRADO
    // ========================================

    return NextResponse.json({
      success: true,
      nfc: {
        id: nfc.id,
        uuid: nfc.uuid,
        eventId: nfc.eventId,
        activityId: nfc.activityId,
        sponsorId: nfc.sponsorId,
        status: nfc.status,
        activity: nfc.activity,
        event: nfc.event,
        sponsor: nfc.sponsor,
      },
    })
  } catch (error: any) {
    // ========================================
    // MANEJO DE ERRORES
    // ========================================

    console.error('❌ Error al buscar NFC por UUID:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
