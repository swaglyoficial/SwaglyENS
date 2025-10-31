#!/usr/bin/env node

/**
 * Script para generar iconos PWA desde el logo de Swagly
 *
 * Requiere: npm install sharp --save-dev
 *
 * Uso: node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// Verificar si sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp no está instalado.');
  console.log('📦 Instala sharp con: npm install sharp --save-dev');
  process.exit(1);
}

const INPUT_IMAGE = path.join(__dirname, '../public/images/LogoSwagly.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Configuración de iconos
const ICON_SIZES = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcons() {
  console.log('🎨 Generando iconos PWA para Swagly...\n');

  // Verificar que el logo existe
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error(`❌ Error: No se encontró el logo en ${INPUT_IMAGE}`);
    process.exit(1);
  }

  // Crear directorio de salida si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Creado directorio: ${OUTPUT_DIR}\n`);
  }

  try {
    for (const config of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, config.name);

      console.log(`📱 Generando ${config.name} (${config.size}x${config.size})...`);

      await sharp(INPUT_IMAGE)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparente
        })
        .png()
        .toFile(outputPath);

      console.log(`   ✅ Guardado en: ${outputPath}`);
    }

    console.log('\n🎉 ¡Todos los iconos generados exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Reinicia el servidor: npm run dev');
    console.log('2. Abre DevTools > Application > Manifest');
    console.log('3. Verifica que los iconos aparezcan correctamente');
    console.log('4. Intenta instalar la PWA desde el navegador');

  } catch (error) {
    console.error('\n❌ Error al generar iconos:', error.message);
    process.exit(1);
  }
}

// Ejecutar
generateIcons();
