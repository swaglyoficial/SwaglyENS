# 📱 Configuración PWA de Swagly - COMPLETADA

## ✅ Estado actual

La PWA está completamente configurada y lista para funcionar. Solo necesitas generar los iconos con el logo de Swagly.

## 🔧 Cambios realizados

### 1. **PWA Provider actualizado** ✅
- Ahora funciona en desarrollo Y producción
- Registra el service worker correctamente
- Detecta el evento `beforeinstallprompt`
- Logs mejorados para debugging

### 2. **Manifest configurado** ✅
- `public/manifest.webmanifest` con toda la metadata
- Iconos correctamente referenciados
- Shortcuts a páginas principales (Eventos, Tienda, Perfil)

### 3. **Service Worker listo** ✅
- `public/sw.js` con cache strategy
- Network-first para HTML
- Stale-while-revalidate para assets

### 4. **Layout actualizado** ✅
- Metadata PWA en `src/app/layout.tsx`
- Icons configurados
- Apple Web App capable

## 🎨 Generar iconos con logo de Swagly

### Opción A: Script automático (Recomendado)

```bash
# 1. Instalar dependencia para procesar imágenes
npm install sharp --save-dev

# 2. Ejecutar el script
npm run generate-icons

# 3. Reiniciar el servidor
npm run dev
```

El script tomará `public/images/LogoSwagly.png` y generará:
- `public/icons/icon-192x192.png`
- `public/icons/icon-512x512.png`
- `public/icons/apple-touch-icon.png`

### Opción B: Herramienta online

Si no quieres instalar sharp, usa:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

Sube `public/images/LogoSwagly.png` y descarga los iconos generados.

## 🧪 Probar la PWA

### En desarrollo (localhost)

1. **Chrome/Edge:**
   ```
   - Abre: http://localhost:3000
   - DevTools > Application > Manifest (verifica que cargue)
   - DevTools > Application > Service Workers (debe estar registrado)
   - Barra de direcciones: Aparecerá icono de instalación ⊕
   ```

2. **Consola del navegador:**
   ```
   Busca estos logs:
   [PWA] Service Worker registrado exitosamente
   [PWA] PWA puede ser instalada. Guardando prompt para después.
   ```

### En producción (Vercel)

1. Despliega a Vercel: `git push`
2. Abre la URL de producción en móvil
3. Chrome/Safari mostrará banner de instalación
4. O ve a menú > "Instalar aplicación" / "Añadir a pantalla de inicio"

## 📋 Checklist de verificación

- ✅ Service Worker registrado (check en DevTools > Application)
- ✅ Manifest cargado (check en DevTools > Application > Manifest)
- ✅ Iconos correctos en el manifest (192x192, 512x512, 180x180)
- ⚠️ **PENDIENTE**: Generar iconos con logo de Swagly (ver arriba)
- ✅ HTTPS en producción (Vercel lo hace automático)

## 🐛 Troubleshooting

### "No aparece el botón de instalación"

**Causas posibles:**
1. **Ya está instalada**: Revisa `chrome://apps` o la pantalla de inicio
2. **No es HTTPS**: En producción debe ser HTTPS (Vercel lo hace automático)
3. **Service Worker no registrado**:
   - Abre DevTools > Console
   - Busca errores de `[PWA]`
   - Verifica que `public/sw.js` existe
4. **Manifest inválido**:
   - DevTools > Application > Manifest
   - Revisa que no haya errores

### "Service Worker no se registra"

```bash
# 1. Limpia caché del navegador
# Chrome: DevTools > Application > Clear storage > Clear site data

# 2. Reinicia el servidor
npm run dev

# 3. Recarga la página con Ctrl+Shift+R (hard refresh)
```

### "Los iconos no aparecen"

```bash
# Verifica que los archivos existen:
ls public/icons/

# Deberías ver:
# icon-192x192.png
# icon-512x512.png
# apple-touch-icon.png

# Si no existen, generarlos:
npm run generate-icons
```

## 🚀 Features de la PWA

### Instalable
- ✅ Se puede instalar en escritorio y móvil
- ✅ Aparece como app nativa
- ✅ Icono en pantalla de inicio

### Offline (básico)
- ✅ Cache de assets estáticos
- ✅ Funciona sin conexión para páginas visitadas
- ⚠️ Funcionalidad limitada offline (requiere blockchain)

### Actualizaciones automáticas
- ✅ Detecta nuevas versiones
- ✅ Notifica al usuario
- ✅ Recarga automática opcional

### Shortcuts
- ✅ Acceso directo a Eventos
- ✅ Acceso directo a Tienda
- ✅ Acceso directo a Perfil

## 📱 Experiencia de instalación

### Android Chrome
1. Banner de instalación aparece automáticamente
2. O menú (⋮) > "Instalar aplicación"
3. Icono se agrega a pantalla de inicio
4. Abre en pantalla completa (sin barra del navegador)

### iOS Safari
1. Botón compartir > "Añadir a pantalla de inicio"
2. Icono personalizado aparece
3. Abre en modo standalone

### Desktop Chrome/Edge
1. Icono de instalación en barra de direcciones
2. O menú > "Instalar Swagly"
3. Se agrega a aplicaciones del sistema
4. Abre en ventana propia

## 🎯 Próximos pasos

1. **Ahora mismo**: Genera los iconos con el logo
   ```bash
   npm install sharp --save-dev
   npm run generate-icons
   ```

2. **Prueba local**: Verifica que todo funcione
   ```bash
   npm run dev
   # Abre http://localhost:3000
   # DevTools > Application > Manifest
   ```

3. **Despliega**: Push a Vercel
   ```bash
   git add .
   git commit -m "PWA configurada con logo de Swagly"
   git push
   ```

4. **Prueba en producción**: Abre en móvil y verifica instalación

## 📚 Recursos

- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Next.js PWA](https://ducanh-next-pwa.vercel.app/docs/next-pwa/getting-started)

---

**¿Dudas?** Revisa los logs en la consola del navegador buscando `[PWA]`.
