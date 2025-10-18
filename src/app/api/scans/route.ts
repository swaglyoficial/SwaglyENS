import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/scans
 * Escanear merch - Verificar NFC, crear scan y dar tokens
 *
 * Este endpoint maneja el flujo completo de escaneo de merch:
 * 1. Valida los datos de entrada
 * 2. Verifica que el NFC no haya sido escaneado antes
 * 3. Registra el escaneo en la base de datos
 * 4. Actualiza el progreso del pasaporte del usuario
 * 5. Llama al smart contract para dar tokens al usuario
 *
 * Body:
 * {
 *   "userId": "uuid",
 *   "nfcId": "uuid",
 *   "walletAddress": "0x..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, nfcId, walletAddress } = body

    // ========================================
    // PASO 1: Validación de datos de entrada
    // ========================================
    if (!userId || !nfcId || !walletAddress) {
      return NextResponse.json(
        { error: 'userId, nfcId y walletAddress son requeridos' },
        { status: 400 }
      )
    }

    // ========================================
    // PASO 2: Verificar que el NFC no haya sido escaneado
    // ========================================
    // Verificamos si el NFC ya fue escaneado por CUALQUIER usuario
    // (no solo el usuario actual). Esto previene reutilización de merch.
    const existingScan = await prisma.scan.findFirst({
      where: {
        nfcId,
      },
    })

    if (existingScan) {
      return NextResponse.json(
        { error: 'Esta merch ya fue escaneada' },
        { status: 400 }
      )
    }

    // ========================================
    // PASO 3: Obtener información del NFC y la actividad
    // ========================================
    // Obtenemos el NFC con su actividad relacionada para saber
    // cuántos tokens dar y a qué actividad pertenece
    const nfc = await prisma.nFC.findUnique({
      where: { id: nfcId },
      include: {
        activity: true, // Incluye info de la actividad (tokens, nombre, etc)
      },
    })

    if (!nfc) {
      return NextResponse.json(
        { error: 'NFC no encontrado' },
        { status: 404 }
      )
    }

    // ========================================
    // PASO 4: Registrar el escaneo en la base de datos
    // ========================================
    // Creamos el registro del scan
    const scan = await prisma.scan.create({
      data: {
        userId,
        nfcId,
        isValid: true,
      },
    })

    // Actualizamos el status del NFC a 'scanned' para que no se pueda volver a usar
    await prisma.nFC.update({
      where: { id: nfcId },
      data: { status: 'scanned' },
    })

    // Buscamos el pasaporte del usuario para el evento relacionado con el NFC
    const passport = await prisma.passport.findFirst({
      where: {
        userId,
        eventId: nfc.eventId,
      },
    })

    // Si el usuario tiene un pasaporte para este evento, actualizamos su progreso
    if (passport) {
      // Marcamos la actividad como completada en el pasaporte
      await prisma.passportActivity.update({
        where: {
          passportId_activityId: {
            passportId: passport.id,
            activityId: nfc.activityId,
          },
        },
        data: {
          status: 'completed',
        },
      })

      // Recalculamos el progreso del pasaporte (% de actividades completadas)
      const allActivities = await prisma.passportActivity.findMany({
        where: { passportId: passport.id },
      })
      const completedCount = allActivities.filter(a => a.status === 'completed').length
      const progress = Math.round((completedCount / allActivities.length) * 100)

      // Actualizamos el progreso en la base de datos
      await prisma.passport.update({
        where: { id: passport.id },
        data: { progress },
      })
    }

    // ========================================
    // PASO 5: Reclamar tokens automáticamente desde el backend
    // ========================================
    // El escaneo se registró exitosamente en la BD
    // Ahora llamamos a la API de claim-tokens para enviar los tokens automáticamente
    // El usuario NO necesita firmar ninguna transacción

    console.log('====================================')
    console.log('✅ SCAN VALIDADO Y REGISTRADO')
    console.log('====================================')
    console.log('Wallet Address:', walletAddress)
    console.log('Cantidad de Tokens:', nfc.activity.numOfTokens)
    console.log('Activity ID:', nfc.activityId)
    console.log('Activity Name:', nfc.activity.name)
    console.log('NFC ID:', nfcId)
    console.log('Enviando tokens automáticamente desde el backend...')
    console.log('====================================')

    // Llamar a la API de claim-tokens para enviar los tokens desde el backend
    // Esto usa la API de Thirdweb para ejecutar la transacción gasless
    try {
      // Construir la URL base correctamente para desarrollo y producción
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
      const baseUrl = `${protocol}://${host}`

      console.log('📡 Llamando a claim-tokens API:', `${baseUrl}/api/claim-tokens`)

      const claimResponse = await fetch(`${baseUrl}/api/claim-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverAddress: walletAddress,
          quantity: nfc.activity.numOfTokens,
          activityName: nfc.activity.name,
        }),
      })

      const claimData = await claimResponse.json()

      // Si el claim falla, devolver error pero mantener el scan registrado
      if (!claimResponse.ok) {
        console.error('❌ Error al enviar tokens:', claimData)
        return NextResponse.json(
          {
            success: false,
            error: 'Scan registrado pero error al enviar tokens',
            details: claimData.error || 'Error desconocido al enviar tokens',
            scan, // Devolvemos el scan de todas formas (está registrado en BD)
            scanData: {
              walletAddress,
              tokens: nfc.activity.numOfTokens,
              activityId: nfc.activityId,
              activityName: nfc.activity.name,
              nfcId,
            },
          },
          { status: 500 }
        )
      }

      // ========================================
      // PASO 6: Tokens enviados exitosamente
      // ========================================
      console.log('====================================')
      console.log('🎉 TOKENS ENVIADOS EXITOSAMENTE')
      console.log('====================================')
      console.log('🎫 Tokens:', nfc.activity.numOfTokens)
      console.log('👤 Receptor:', walletAddress)
      console.log('🔗 Transaction Hash:', claimData.data?.transactionHash || 'N/A')
      console.log('====================================')

      // Respuesta exitosa: scan registrado y tokens enviados
      return NextResponse.json({
        success: true,
        message: `Merch escaneada exitosamente. ${nfc.activity.numOfTokens} tokens enviados a tu wallet.`,
        scan,
        claimResult: claimData.data, // Datos de la transacción de tokens
        scanData: {
          walletAddress,
          tokens: nfc.activity.numOfTokens,
          activityId: nfc.activityId,
          activityName: nfc.activity.name,
          nfcId,
          transactionHash: claimData.data?.transactionHash,
        },
      })
    } catch (claimError) {
      // Si hay un error de red o inesperado al llamar a claim-tokens
      console.error('❌ Error inesperado al enviar tokens:', claimError)
      return NextResponse.json(
        {
          success: false,
          error: 'Scan registrado pero error al enviar tokens',
          details: claimError instanceof Error ? claimError.message : 'Error desconocido',
          scan,
          scanData: {
            walletAddress,
            tokens: nfc.activity.numOfTokens,
            activityId: nfc.activityId,
            activityName: nfc.activity.name,
            nfcId,
          },
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error al escanear merch:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scans?userId=xxx
 * Obtener todos los scans de un usuario
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    const scans = await prisma.scan.findMany({
      where: { userId },
      include: {
        nfc: {
          include: {
            activity: true,
            event: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json({ scans })
  } catch (error) {
    console.error('Error al obtener scans:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
