# Panel de Administración - Swagly

## 📋 Descripción

El panel de administración de Swagly permite a los organizadores gestionar todos los aspectos del evento: crear, editar o eliminar eventos, configurar actividades, definir recompensas y registrar chips NFC. También incluye un dashboard completo de analíticas con métricas en tiempo real.

## 🚀 Estructura del Panel

### 1. Página Principal (`/admin`)
Dashboard principal con acceso rápido a todas las funcionalidades:
- Estadísticas generales del sistema
- Enlaces a gestión de eventos, actividades y analíticas
- Resumen de eventos activos y usuarios totales

### 2. Gestión de Eventos (`/admin/events`)
Permite administrar eventos completos:
- ✅ Crear nuevos eventos
- ✅ Editar eventos existentes (nombre, descripción, fechas)
- ✅ Eliminar eventos (cascada elimina sponsors, actividades, NFCs)
- ✅ Ver estado del evento (Activo/Inactivo)
- ✅ Ver estadísticas por evento (sponsors, actividades, NFCs, usuarios)

**Funcionalidades:**
- Formularios con validación de fechas
- Vista de tabla con todos los eventos
- Indicadores visuales de estado

### 3. Gestión de Sponsors (`/admin/sponsors`)
Administra los patrocinadores de cada evento:
- ✅ Crear nuevos sponsors
- ✅ Editar sponsors existentes (nombre, descripción)
- ✅ Eliminar sponsors (cascada elimina sus actividades y NFCs)
- ✅ Ver estadísticas por sponsor (actividades, NFCs)
- ✅ Selector de evento para filtrar sponsors

**Funcionalidades:**
- Formulario de creación/edición con validación
- Vista de tabla organizada por evento
- Contador de actividades y NFCs asociados
- Indicadores visuales con iconos

### 4. Gestión de Actividades y NFCs (`/admin/activities`)
Control completo sobre actividades y chips NFC:

#### Actividades:
- ✅ Crear/editar/eliminar actividades
- ✅ Asignar sponsor a cada actividad
- ✅ **Definir número de tokens SWAG** que otorga cada actividad
- ✅ Ver número de NFCs asociados a cada actividad

#### NFCs:
- ✅ Registrar nuevos chips NFC con UUID único
- ✅ Vincular NFC a una actividad específica
- ✅ Asignar sponsor al NFC
- ✅ **Control de estado** (disponible/escaneado)
- ✅ Ver número de escaneos por NFC
- ✅ Prevención de duplicados de UUID

**Características Especiales:**
- Selector de eventos para filtrar actividades/NFCs
- Validación de UUID únicos
- No se pueden eliminar actividades con NFCs asociados (protección de integridad)

### 5. Dashboard de Analíticas (`/admin/analytics`)
Visualización completa de métricas del evento:

#### Métricas de Usuarios:
- ✅ Total de usuarios registrados
- ✅ Usuarios con alto engagement (>50% progreso)
- ✅ Usuarios que completaron el 100%
- ✅ Nivel de retención

#### Métricas de Actividades:
- ✅ Total de actividades del evento
- ✅ Actividades completadas vs pendientes
- ✅ **Ranking de popularidad** (actividades más completadas)
- ✅ Completaciones por actividad

#### Métricas de Economía:
- ✅ **Volumen total de tokens SWAG emitidos**
- ✅ Promedio de tokens por usuario
- ✅ Tokens emitidos por actividad
- ✅ Total de tokens por sponsor

#### Engagement por Sponsor:
- ✅ Total de actividades por sponsor
- ✅ Completaciones por sponsor
- ✅ **Tokens emitidos por sponsor**
- ✅ **Escaneos NFC por sponsor**
- ✅ Datos de participación

#### Estado de NFCs:
- ✅ Total de NFCs registrados
- ✅ NFCs disponibles
- ✅ NFCs escaneados
- ✅ Porcentaje de utilización

#### Engagement General:
- ✅ Progreso promedio de usuarios
- ✅ Tasa de retención (usuarios >50%)
- ✅ Tasa de completación (usuarios 100%)
- ✅ Barras de progreso visuales

## 📊 API Routes Implementadas

### Eventos
- `GET /api/events` - Obtener todos los eventos
- `POST /api/events` - Crear nuevo evento
- `GET /api/events/[id]` - Obtener evento específico
- `PUT /api/events/[id]` - Actualizar evento
- `DELETE /api/events/[id]` - Eliminar evento

### Sponsors
- `GET /api/sponsors?eventId=xxx` - Obtener sponsors de un evento
- `POST /api/sponsors` - Crear sponsor
- `GET /api/sponsors/[id]` - Obtener sponsor específico
- `PUT /api/sponsors/[id]` - Actualizar sponsor
- `DELETE /api/sponsors/[id]` - Eliminar sponsor

### Actividades
- `GET /api/activities?eventId=xxx` - Obtener actividades de un evento
- `POST /api/activities` - Crear actividad (con numOfTokens)
- `GET /api/activities/[id]` - Obtener actividad específica
- `PUT /api/activities/[id]` - Actualizar actividad y tokens
- `DELETE /api/activities/[id]` - Eliminar actividad

### NFCs
- `GET /api/nfcs?eventId=xxx` - Obtener NFCs de un evento
- `POST /api/nfcs` - Registrar nuevo NFC
- `GET /api/nfcs/[id]` - Obtener NFC específico
- `PUT /api/nfcs/[id]` - Actualizar NFC (cambiar estado, actividad)
- `DELETE /api/nfcs/[id]` - Eliminar NFC

### Analíticas
- `GET /api/analytics?eventId=xxx` - Obtener todas las métricas del evento

**Métricas retornadas:**
```json
{
  "event": { ... },
  "users": {
    "total": 150,
    "highEngagement": 75,
    "completed": 30
  },
  "activities": {
    "total": 10,
    "completed": 450,
    "pending": 50,
    "ranking": [...]
  },
  "tokens": {
    "totalIssued": 25000,
    "avgPerUser": 166.67
  },
  "sponsors": [...],
  "nfcs": {
    "available": 50,
    "scanned": 150,
    "total": 200
  },
  "engagement": {
    "avgProgress": 65.5,
    "retentionRate": 50,
    "completionRate": 20
  }
}
```

## 🎨 Componentes UI Creados

Todos los componentes están basados en **shadcn/ui** y **Radix UI**:

- ✅ **Table** - Tablas de datos responsivas
- ✅ **Dialog** - Modales para formularios
- ✅ **Input** - Campos de texto
- ✅ **Textarea** - Áreas de texto
- ✅ **Label** - Etiquetas de formulario
- ✅ **Select** - Dropdowns de selección
- ✅ **Progress** - Barras de progreso
- ✅ **Badge** - Etiquetas de estado
- ✅ **Card** - Tarjetas de contenido
- ✅ **Button** - Botones de acción

## 🔧 Funcionalidades Clave

### Control de Tokens SWAG
Cada actividad define cuántos tokens otorga al completarse. Los organizadores pueden:
- Establecer el valor en tokens de cada actividad
- Ver el total de tokens emitidos
- Analizar qué actividades generan más tokens

### Control de Estado de NFCs
Sistema completo para gestionar el ciclo de vida de los chips NFC:
- **Disponible**: NFC registrado, listo para escanear
- **Escaneado**: NFC ya utilizado por usuarios
- Los organizadores pueden:
  - Ver qué NFCs han sido escaneados
  - Verificar duplicados
  - Controlar el inventario de chips

### Analíticas en Tiempo Real
Dashboard completo con:
- Métricas actualizadas al cambiar de evento
- Visualizaciones claras con iconos
- Tablas ordenadas por popularidad
- Progreso visual con barras

### Validaciones y Seguridad
- ✅ Validación de fechas (inicio < fin)
- ✅ Validación de UUID únicos en NFCs
- ✅ Prevención de eliminación con dependencias
- ✅ Confirmaciones antes de eliminar
- ✅ Mensajes de error claros

## 📁 Estructura de Archivos

```
src/
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── sponsors/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── activities/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── nfcs/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── analytics/
│   │       └── route.ts
│   └── admin/
│       ├── page.tsx              # Dashboard principal
│       ├── events/
│       │   └── page.tsx          # Gestión de eventos
│       ├── sponsors/
│       │   └── page.tsx          # Gestión de sponsors
│       ├── activities/
│       │   └── page.tsx          # Gestión de actividades y NFCs
│       └── analytics/
│           └── page.tsx          # Dashboard de analíticas
├── components/
│   └── ui/
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── progress.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── separator.tsx
└── lib/
    └── prisma.ts                 # Cliente de Prisma
```

## 🚦 Cómo Usar

### 1. Configurar Base de Datos
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev
```

### 2. Acceder al Panel
```
http://localhost:3000/admin
```

### 3. Flujo de Trabajo Típico

1. **Crear un Evento**
   - Ir a `/admin/events`
   - Hacer clic en "Crear Evento"
   - Completar nombre, descripción y fechas

2. **Agregar Sponsors**
   - Ir a `/admin/sponsors`
   - Seleccionar el evento
   - Hacer clic en "Crear Sponsor"
   - Completar nombre y descripción

3. **Crear Actividades**
   - Ir a `/admin/activities`
   - Seleccionar el evento
   - Crear actividades y definir tokens

4. **Registrar NFCs**
   - En la misma página de actividades
   - Registrar chips con UUID único
   - Vincular a actividad y sponsor

5. **Monitorear Analíticas**
   - Ir a `/admin/analytics`
   - Seleccionar el evento
   - Ver métricas en tiempo real

## 📈 Métricas Disponibles

### Para Organizadores:
- Nivel de participación general
- Actividades más populares
- Tasa de retención de usuarios
- Estado de recursos (NFCs disponibles)

### Para Sponsors:
- Número de interacciones (escaneos)
- Completaciones de sus actividades
- Tokens generados por sus actividades
- Nivel de engagement de su marca

## 🔐 Notas de Seguridad

- Todas las APIs validan datos de entrada
- Las eliminaciones en cascada protegen la integridad
- Los UUID de NFC son únicos en todo el sistema
- Se previenen duplicados y conflictos

## 🎯 Próximas Mejoras Sugeridas

- [ ] Autenticación de administradores (verificar role=admin)
- [ ] Exportación de datos analíticos a CSV/Excel
- [ ] Gráficas visuales (charts)
- [ ] Filtros avanzados en tablas
- [ ] Búsqueda de eventos/actividades/sponsors
- [ ] Paginación en tablas grandes
- [ ] Notificaciones en tiempo real
- [ ] Upload de logos de sponsors
- [ ] Generación masiva de NFCs (importar CSV)

## 🎨 Tema Visual

El panel utiliza el tema de Swagly con:
- Fondo oscuro (bg-black)
- Acentos en cyan/azul
- Efectos neon sutiles
- Componentes con glassmorphism
- Iconos de Lucide React

---

**Desarrollado para Swagly** - Panel de administración completo para gestión de eventos Web3 con NFC y tokens SWAG.
