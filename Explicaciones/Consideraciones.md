Swagly
Problemática: 
🌐 Swagly: Redefiniendo la experiencia de los eventos Web3

Swagly nace con la misión de transformar la manera en que los asistentes interactúan y los organizadores gestionan los eventos dentro del ecosistema Web3. Nuestra aplicación combina tecnología NFC, Tokens SWAG y NFTs para crear experiencias gamificadas, una economía basada en el merch, y un robusto sistema de analítica de participación que ofrece datos valiosos tanto a organizadores como a patrocinadores.

🎟️ Experiencia del asistente

Al llegar al evento, cada participante recibe un kit de bienvenida que incluye un pasaporte físico con tecnología NFC. Al escanearlo, el usuario puede registrarse fácilmente mediante Reown , con una red social puede crear su wallet o conectar una propia. Esto genera un pasaporte digital único (basándose en el id de evento que le dio el NFC), que muestra todas las actividades disponibles durante el evento.

Cada vez que el participante complete una actividad, recibirá una pieza de merch equipada con NFC. Al escanearla, la actividad se marcará automáticamente como completada en su pasaporte y se le acreditarán Tokens SWAG. Estos tokens podrán canjearse en el stand de Swagly por merch exclusiva.

Al completar todas las actividades del pasaporte, el usuario obtiene un NFT conmemorativo y tokens adicionales, que le permitirán acceder a una línea limitada de merch legendaria, escasa y de colección.

Si el participante acumula tokens de SWAG adicionales, podrá utilizarlos en nuestra tienda exclusiva, intercambiándolos por productos premium o experiencias especiales.

En dado caso de que no tengas tokens y quieras adquirir alguna de nuestra merch puedes comprar nuestros tokens y adquirirlos.

📊 Analítica y valor para organizadores

Swagly no solo mejora la experiencia del usuario, sino que también proporciona una potente plataforma de analítica en tiempo real.
Los organizadores y patrocinadores pueden acceder a métricas detalladas como:
Niveles de participación y retención de los asistentes.
Actividades más populares y puntos de mayor interacción.
Volumen de tokens emitidos, redimidos y retenidos.
Segmentación de usuarios por comportamiento y preferencias.
Estos datos permiten optimizar futuras ediciones del evento, mejorar la toma de decisiones en marketing y ofrecer experiencias personalizadas que aumentan el compromiso del público.
Tecnologías.
Next.js (PWA): para que los usuarios accedan directamente desde la web sin necesidad de descargar una aplicación nativa.
Reown: encargado de gestionar el proceso de onboarding, permitiendo conectar una wallet existente o crear una nueva con redes sociales.
Supabase: base de datos y backend para almacenar la información relacionada con la analítica del evento y otros datos complementarios.
shadcn: Para usar componentes de UI en la aplicación.

Historia del usuario
El usuario, al ingresar al evento, recibe un pasaporte físico con tecnología NFC que debe escanear para acceder a la página de inicio de sesión. Desde ahí puede crear una nueva wallet o conectar una wallet existente mediante Reown. Una vez autenticado, se genera automáticamente su pasaporte digital y el usuario es redirigido a su dashboard personal. En este panel se muestra su pasaporte principal, el recién escaneado  junto con otros pasaportes que haya obtenido en diferentes eventos. También puede visualizar el listado de actividades disponibles y las que ya ha completado, así como una barra de progreso que indica su avance general. Durante el evento, cada vez que finaliza una actividad, el encargado le entrega una pieza de merch con NFC que, al ser escaneada, marca la actividad como completada dentro del pasaporte digital y otorga tokens SWAG al usuario. Estos tokens pueden usarse para reclamar merch especial o de lujo, dependiendo de su valor. Cuando el usuario completa todas las actividades de su pasaporte, el sistema genera automáticamente un Soulbound Token (NFT) que le permitirá reclamar una merch legendaria.
Historia de plataforma de Swagly
La plataforma Swagly está diseñada para ofrecer una experiencia inmersiva y gamificada en eventos, combinando tecnología NFC, Web3 y recompensas digitales. Su funcionamiento inicia con el onboarding del usuario, quien al llegar al evento recibe un pasaporte físico con chip NFC. Al escanearlo, es redirigido a la página de inicio de sesión donde puede autenticarse mediante Reown (crear su wallet con redes sociales o conectar una wallet existente). Una vez autenticado, se crea un perfil con una wallet asociada y se le solicita un apodo, después se genera automáticamente el pasaporte digital correspondiente al event_id del pasaporte físico con NFC (se debe verificar que el event_id del NFC coincida con el de la base de datos), vinculado al evento y a su identificación única dentro del sistema.
El pasaporte digital contiene información clave del evento: nombre, descripción y lista de actividades asignadas, junto con una barra de progreso que refleja su avance (por ejemplo, 4 de 10 actividades completadas). Cada pasaporte está asociado a un ID único y se almacena en la base de datos junto con la wallet del usuario. Desde el dashboard, el asistente puede visualizar sus actividades pendientes o completadas, así como los diferentes pasaportes escaneados en otros eventos, destacando siempre el más reciente como principal.
Durante el evento, el usuario puede interactuar con merch distribuidos por el recinto. Al presionar el botón de escanear dentro de la aplicación, puede leer los chips NFC integrados en los artículos o estaciones. El sistema valida cada identificador único del NFC y verifica si ya fue escaneado y verifica que conocida con el id de una actividad dentro del evento. Si el escaneo es válido, la actividad se marca como completada en el pasaporte, se actualiza la base de datos y se otorgan tokens SWAG en la wallet del usuario; si no, se muestra un mensaje de advertencia indicando que la merch ya fue escaneada.
Estos tokens SWAG forman parte de la economía gamificada del sistema: se acreditan automáticamente en la wallet del usuario. Además, las transacciones son gasless, lo que elimina la necesidad de pagar comisiones de red. Una vez que el usuario completa todas las actividades del evento, recibe un NFT Soulbound Token (no transferible) como reconocimiento de finalización.
Por otro lado, el panel de administración permite a los organizadores gestionar todos los aspectos del evento: crear, editar o eliminar eventos, configurar actividades, definir recompensas y registrar chips NFC. Determinar el número de tokens que otorga cada actividad y llevar control del estado de los NFC (disponible, escaneado, duplicado, etc.). El sistema cuenta con una sección analítica donde los organizadores y patrocinadores pueden visualizar métricas como el número de usuarios registrados, actividades completadas, ranking de popularidad, volumen total de tokens emitidos, así como datos de engagement y participación por sponsor.
MVP
MVP de Swagly
1. Onboarding y Autenticación
Crear/Login con Reown
Permitir registro/login mediante Reown (SDK de wallet-as-login compatible con Web3Auth o WalletConnect).
Alternativas: Google o redes sociales para usuarios no cripto.
Al autenticarse, se crea un perfil de usuario con su wallet asociada.

2. Pasaporte Digital
Generación automática del pasaporte digital una vez que el usuario inicia sesión y escanee el NFC del pasaporte inicial físico con el ID de evento del pasaporte que se le va a crear.
El pasaporte incluye:
Nombre del evento y descripción.
Lista de actividades asignadas al usuario (definidas por el organizador).
Progreso visual (por ejemplo, 4/10 actividades completadas).
Cada pasaporte tiene un ID único vinculado a la wallet del usuario.

3. Interacción con Merch y Escaneo NFC
Botón de escanear merch NFC
Escanear un chip NFC integrado en cada artículo de merch o punto del evento.
Al escanear:
Se valida el idDeNFC.
Se consulta si ya fue escaneado por este usuario.
Lógica:
Si no fue escaneado → se marca como actividad completada, se actualiza la base de datos, se otorgan tokens SWAGLY y se registra el timestamp.
Si ya fue escaneado → mostrar mensaje: “⚠️ Esta merch ya fue escaneada anteriormente”.

4. Economía Gamificada
Tokens SWAGLY
Cada actividad otorga una cantidad definida de tokens SWAGLY.
Los tokens se acreditan directamente en la wallet conectada del usuario.
Los tokens pueden:
Canjearse por merch exclusiva.
Comprarse directamente si el usuario no tiene saldo suficiente.
Implementar gass less para que no se necesite gas para la transferencia de tokens dentro de la wallet del usuario.
NFT conmemorativo (Soulbound Token)
Al completar todas las actividades, el sistema genera un NFT Soulbound (no transferible).
Este NFT sirve como medalla de finalización o acceso a merch legendaria.
Esto se realizará mediante smart contracts.

5. Gestión del Evento (Panel de Administración)
Funcionalidades principales:
Eventos
Crear, editar o eliminar eventos.
Cada evento incluye nombre, fecha, patrocinadores, actividades, y configuración de recompensas.
Actividades
Crear, editar o eliminar actividades asociadas a un evento.
Definir cuántos tokens SWAGLY otorga cada actividad.
Asignar identificadores NFC vinculados a cada actividad.


NFCs
Registrar, editar o eliminar los datos asociados a cada chip NFC.
Vincular cada NFC a una actividad específica.
Marcar el estado del NFC (disponible, escaneado, duplicado, etc.).



6. Analítica del Evento
Métricas para organizadores y patrocinadores:
Usuarios:
Cuántos asistentes registraron su pasaporte digital.
Nivel de retención (usuarios que completaron más de X actividades).
Actividades:
Cuántos realizaron cada actividad.
Ranking de actividades más completadas.


Sponsors:
Qué patrocinador tuvo más escaneos/interacciones.
Tiempo promedio de permanencia o engagement.
Economía:
Volumen total de tokens emitidos.
Tokens redimidos vs. retenidos.
Exportación de datos:
Panel gráfico con métricas de participación y conversión.

7. Seguridad y Validaciones
Cada merch NFC tiene un UUID único cifrado.
Antes de registrar un escaneo, se verifica:
Si el idNFC ya existe en la base de datos de escaneos.
Si pertenece al evento activo.
Si el escaneo es válido:
Se actualiza la base de datos (scanUsers).
Se notifica visualmente al usuario que ganó tokens.
Prevención de doble escaneo o clonación mediante hash temporal o firma del servidor.

8. Flujo del Usuario
Llega al evento → recibe pasaporte físico NFC.
Escanea → inicia sesión con Reown → se genera su pasaporte digital.
Consulta las actividades → realiza y escanea cada merch NFC.
Acumula tokens SWAGLY → los usa para canjear premios.
Al completar todas las actividades → recibe NFT conmemorativo.


9. Database en prisma
/// =========================
/// Enums
/// =========================
enum PassportActivityStatus {
  pending
  completed
}

enum NFCStatus {
  available
  scanned
}

enum UserRole {
  user
  admin
}

/// =========================
/// Usuarios y Autenticación
/// =========================
model User {
  id            String   @id @default(uuid()) @map("user_id")
  walletAddress String  @unique @map("wallet_address")
  role          UserRole  @default(user) @map("role")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relaciones
  passports Passport[]
  scans     Scan[]

  @@map("Users")
}

/// =========================
/// Gestión del Evento
/// =========================
model Event {
  id          String    @id @default(uuid()) @map("event_id")
  name        String
  description String
  startDate   DateTime @map("start_date") @db.Timestamptz(6)
  endDate     DateTime @map("end_date")   @db.Timestamptz(6)
  createdAt   DateTime  @default(now())    @map("created_at") @db.Timestamptz(6)

  // Relaciones
  sponsors   Sponsor[]
  activities Activity[]
  nfcTags    NFC[]      @relation("EventToNFC")
  passports  Passport[]

  @@map("Events")
}

model Sponsor {
  id          String  @id @default(uuid()) @map("sponsor_id")
  eventId     String  @map("event_id")
  name        String
  description String

  // Relaciones
  event      Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  activities Activity[]
  nfcTags    NFC[]     @relation("SponsorToNFC")

  @@index([eventId])
  @@map("Sponsors")
}

model Activity {
  id           String   @id @default(uuid()) @map("activity_id")
  eventId      String   @map("event_id")
  sponsorId    String  @map("sponsor_id")
  name         String
  description  String
  numOfTokens  Int      @default(0) @map("num_of_tokens")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relaciones
  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  sponsor    Sponsor @relation(fields: [sponsorId], references: [id], onDelete: SetNull)
  nfcTags    NFC[]
  activities PassportActivity[]

  @@index([eventId])
  @@index([sponsorId])
  @@map("Activities")
}

/// =========================
/// Pasaporte Digital
/// =========================
model Passport {
  id        String   @id @default(uuid()) @map("passport_id")
  userId    String   @map("user_id")
  eventId   String   @map("event_id")
  progress  Int      @default(0) // 0..100 sugerido
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relaciones
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  event      Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  activities PassportActivity[]

  // Un pasaporte único por (usuario, evento)
  @@unique([userId, eventId])
  @@index([eventId])
  @@map("Passports")
}

model PassportActivity {
  passportId String @map("passport_id")
  activityId String @map("activity_id")
  status     PassportActivityStatus @default(pending)
  timestamp  DateTime @default(now()) @db.Timestamptz(6)

  // Relaciones
  passport Passport @relation(fields: [passportId], references: [id], onDelete: Cascade)
  activity Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)

  // Evita duplicados; compone la PK
  @@id([passportId, activityId])
  @@index([activityId])
  @@map("PassportActivities")
}

/// =========================
/// Interacción con Merch y Escaneo NFC
/// =========================
model NFC {
  id         String   @id @default(uuid()) @map("nfc_id")
  uuid       String   @unique
  eventId    String   @map("event_id")
  sponsorId  String  @map("sponsor_id")
  activityId String   @map("activity_id")
  status     NFCStatus @default(available)
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relaciones
  event    Event    @relation("EventToNFC", fields: [eventId], references: [id], onDelete: Cascade)
  sponsor  Sponsor @relation("SponsorToNFC", fields: [sponsorId], references: [id], onDelete: SetNull)
  activity Activity @relation(fields: [activityId], references: [id], onDelete: Restrict)
  scans    Scan[]

  @@index([eventId])
  @@index([sponsorId])
  @@index([activityId])
  @@map("NFCs")
}

model Scan {
  id        String   @id @default(uuid()) @map("scan_id")
  userId    String   @map("user_id")
  nfcId     String   @map("nfc_id")
  timestamp DateTime @default(now()) @db.Timestamptz(6)
  isValid   Boolean  @default(true) @map("is_valid")

  // Relaciones
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  nfc  NFC  @relation(fields: [nfcId], references: [id], onDelete: Cascade)

  // Evita escaneo duplicado del mismo usuario al mismo chip
  @@unique([userId, nfcId])
  @@index([nfcId])
  @@map("Scans")
}




