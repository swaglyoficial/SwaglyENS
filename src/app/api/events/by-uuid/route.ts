/**
 * ============================================
 * API: GET /api/events/by-uuid
 * ============================================
 *
 * Busca un evento por su UUID/ID.
 *
 * Esta API es útil cuando se escanea un pasaporte físico con NFC/QR
 * que contiene el UUID del evento.
 *
 * Uso:
 * GET /api/events/by-uuid?uuid=550e8400-e29b-41d4-a716-446655440000
 *
 * Respuesta exitosa:
 * {
 *   success: true,
 *   event: {
 *     id: "550e8400-e29b-41d4-a716-446655440000",
 *     name: "ETH Bogotá 2024",
 *     description: "...",
 *     startDate: "...",
 *     endDate: "...",
 *     activities: [...],
 *     sponsors: [...]
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * ============================================
 * GET - Buscar Evento por UUID
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
          details: 'Debes proporcionar el UUID del evento en los query params',
        },
        { status: 400 }
      )
    }

    // Validar formato de UUID (opcional pero recomendado)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      // Permitir también IDs personalizados
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

    console.log(`🔍 Buscando evento con UUID: ${uuid}`)

    // ========================================
    // BUSCAR EVENTO EN LA BASE DE DATOS
    // ========================================

    const event = await prisma.event.findUnique({
      where: {
        id: uuid, // En nuestro esquema, el ID es el UUID
      },
      include: {
        activities: {
          select: {
            id: true,
            name: true,
            description: true,
            numOfTokens: true,
          },
        },
        sponsors: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    // ========================================
    // VERIFICAR SI SE ENCONTRÓ EL EVENTO
    // ========================================

    if (!event) {
      console.warn(`⚠️ Evento no encontrado: ${uuid}`)

      return NextResponse.json(
        {
          success: false,
          error: 'Evento no encontrado',
          details: `No existe un evento con el UUID: ${uuid}`,
        },
        { status: 404 }
      )
    }

    // ========================================
    // VERIFICAR SI EL EVENTO ESTÁ ACTIVO
    // ========================================

    const now = new Date()
    const isActive = event.startDate <= now && event.endDate >= now

    if (!isActive) {
      console.warn(`⚠️ Evento no está activo: ${event.name}`)

      // Nota: Aún retornamos el evento pero con una advertencia
      // El frontend puede decidir si permitir el registro o no
    }

    console.log(`✅ Evento encontrado: ${event.name}`)

    // ========================================
    // RETORNAR EVENTO ENCONTRADO
    // ========================================

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        isActive,
        activities: event.activities,
        sponsors: event.sponsors,
        createdAt: event.createdAt,
      },
    })
  } catch (error: any) {
    // ========================================
    // MANEJO DE ERRORES
    // ========================================

    console.error('❌ Error al buscar evento por UUID:', error)

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
