import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'

/**
 * POST /api/upload-proof-image
 * Sube una imagen de evidencia a Vercel Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const userId = formData.get('userId') as string
    const activityId = formData.get('activityId') as string

    console.log('📤 Upload request received:', { userId, activityId, fileType: file?.type, fileSize: file?.size })

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten JPG, PNG y WEBP' },
        { status: 400 }
      )
    }

    // Sin restricción de tamaño - cualquier tamaño es aceptado

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `proofs/${userId}/${activityId}-${timestamp}.${file.type.split('/')[1]}`

    console.log('📁 Uploading to Vercel Blob:', fileName)

    // Subir a Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log('✅ Upload successful:', blob.url)

    return NextResponse.json(
      {
        success: true,
        url: blob.url,
        imageUrl: blob.url, // Mantener compatibilidad
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error uploading image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      {
        error: 'Error al subir la imagen',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
