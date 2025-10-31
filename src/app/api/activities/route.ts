import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/activities?eventId=xxx
 * Obtiene todas las actividades de un evento específico
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId es requerido' },
        { status: 400 }
      )
    }

    const activities = await prisma.activity.findMany({
      where: { eventId },
      include: {
        sponsor: true,
        nfcTags: true,
        activities: true, // PassportActivities
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ activities }, { status: 200 })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Error al obtener actividades' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/activities
 * Crea una nueva actividad para un evento
 * Body: {
 *   eventId: string,
 *   sponsorId: string,
 *   name: string,
 *   description: string,
 *   numOfTokens: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventId,
      sponsorId,
      name,
      description,
      numOfTokens,
      validationType,
      requiresProof,
      proofType,
      proofPrompt,
      transactionPrompt,
      referralPrompt,
      onChainValidationType,
      validationConfig,
      successMessage
    } = body

    // Validación de campos requeridos
    if (!eventId || !sponsorId || !name || !description) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validación del número de tokens
    if (numOfTokens !== undefined && numOfTokens < 0) {
      return NextResponse.json(
        { error: 'El número de tokens debe ser positivo' },
        { status: 400 }
      )
    }

    // Validar campos de validación manual
    if (validationType === 'manual' && requiresProof) {
      if (!proofType || !proofPrompt) {
        return NextResponse.json(
          { error: 'Para actividades con validación manual debes especificar el tipo de evidencia y las instrucciones' },
          { status: 400 }
        )
      }
    }

    // Validar campos de validación on-chain
    if (onChainValidationType) {
      // Solo permitir con auto_transaction
      if (validationType !== 'auto_transaction') {
        return NextResponse.json(
          { error: 'La validación on-chain solo está disponible para actividades de tipo "auto_transaction"' },
          { status: 400 }
        )
      }

      // Validar tipos permitidos
      const validOnChainTypes = ['usdc_transfer', 'cashback_event', 'token_transfer']
      if (!validOnChainTypes.includes(onChainValidationType)) {
        return NextResponse.json(
          { error: `Tipo de validación on-chain inválido. Debe ser: ${validOnChainTypes.join(', ')}` },
          { status: 400 }
        )
      }

      // Validar que venga validationConfig si se especifica tipo
      if (!validationConfig) {
        return NextResponse.json(
          { error: 'Se requiere validationConfig cuando se especifica onChainValidationType' },
          { status: 400 }
        )
      }

      // Validar estructura de validationConfig según el tipo
      if (onChainValidationType === 'usdc_transfer') {
        if (typeof validationConfig.minAmount !== 'number' || typeof validationConfig.decimals !== 'number') {
          return NextResponse.json(
            { error: 'Para "usdc_transfer" se requiere validationConfig con: { minAmount: number, decimals: number }' },
            { status: 400 }
          )
        }
      } else if (onChainValidationType === 'cashback_event') {
        if (typeof validationConfig.requirePaid !== 'boolean') {
          return NextResponse.json(
            { error: 'Para "cashback_event" se requiere validationConfig con: { requirePaid: boolean }' },
            { status: 400 }
          )
        }
      } else if (onChainValidationType === 'token_transfer') {
        if (!Array.isArray(validationConfig.tokenAddresses) || validationConfig.tokenAddresses.length === 0) {
          return NextResponse.json(
            { error: 'Para "token_transfer" se requiere validationConfig con: { tokenAddresses: string[] }' },
            { status: 400 }
          )
        }
      }
    }

    // Verificar que el evento y sponsor existen
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
    })

    if (!event || !sponsor) {
      return NextResponse.json(
        { error: 'Evento o sponsor no encontrado' },
        { status: 404 }
      )
    }

    // Crear la actividad
    const activity = await prisma.activity.create({
      data: {
        eventId,
        sponsorId,
        name,
        description,
        numOfTokens: numOfTokens || 0,
        validationType: validationType || 'scan',
        requiresProof: requiresProof || false,
        proofType: validationType === 'manual' ? proofType : null,
        proofPrompt: validationType === 'manual' ? (proofPrompt || null) : null,
        transactionPrompt: validationType === 'auto_transaction' ? (transactionPrompt || null) : null,
        referralPrompt: validationType === 'auto_referral_code' ? (referralPrompt || null) : null,
        onChainValidationType: validationType === 'auto_transaction' ? (onChainValidationType || null) : null,
        validationConfig: validationType === 'auto_transaction' ? (validationConfig || null) : null,
        successMessage: successMessage || null,
      },
      include: {
        sponsor: true,
      },
    })

    // ========================================
    // SINCRONIZAR CON PASAPORTES EXISTENTES
    // ========================================
    // Buscar todos los pasaportes que ya existen para este evento
    const existingPassports = await prisma.passport.findMany({
      where: { eventId },
      select: { id: true },
    })

    // Si hay pasaportes existentes, agregar esta nueva actividad a cada uno
    if (existingPassports.length > 0) {
      console.log(`📋 Sincronizando nueva actividad "${name}" con ${existingPassports.length} pasaporte(s) existente(s)`)

      // Crear PassportActivity para cada pasaporte existente
      await prisma.passportActivity.createMany({
        data: existingPassports.map((passport) => ({
          passportId: passport.id,
          activityId: activity.id,
          status: 'pending',
          requiresProof: requiresProof || false,
        })),
        skipDuplicates: true, // Evitar errores si ya existe
      })

      console.log(`✅ Actividad agregada a ${existingPassports.length} pasaporte(s)`)
    }

    return NextResponse.json({
      activity,
      passportsSynced: existingPassports.length, // Informar cuántos pasaportes se actualizaron
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Error al crear actividad' },
      { status: 500 }
    )
  }
}
