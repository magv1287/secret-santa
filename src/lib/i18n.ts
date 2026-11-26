export type Lang = "es" | "en";

/**
 * Detecta el idioma del dispositivo/navegador.
 * Solo soporta Español ('es') o Inglés ('en').
 * Cualquier otro idioma cae automáticamente en Inglés ('en').
 */
export function detectDeviceLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const langs =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language || "en"];

  const primary = (langs[0] || "en").toLowerCase();
  return primary.startsWith("es") ? "es" : "en";
}
function buildWhatsAppMessage(_groupName: string, url: string) {
  return `Español:

🎄 ¡Ya está listo el sorteo del Amigo Secreto!

Entra aquí, toca tu nombre y crea un PIN de 4 dígitos para descubrir a quién te tocó y dejar tu lista de deseos:
${url}

📌 *Nota:* Puedes poner tu correo (es opcional) para recibir tu PIN y un enlace directo por si cambias de dispositivo. Si no lo ves en tu bandeja de entrada, revisa la carpeta de *Spam / Correo no deseado*.

───────────────

English:

🎄 The Secret Santa draw is ready!

Open this link, tap your name, and create a 4-digit PIN to see who you got and add your wishlist:
${url}

📌 *Note:* You can optionally enter your email to receive a backup of your PIN and a direct login link in case you switch devices. If you don't see it in your inbox, please check your *Spam / Junk* folder.`;
}
export const translations = {
  es: {
    // Home / Create Group
    homeTitle: "Secret Santa",
    homeSubtitle:
      "Un solo enlace para el grupo. Cada quien entra con su nombre, crea su PIN y su sesión queda abierta.",
    groupNameLabel: "Nombre del grupo *",
    groupNamePlaceholder: "Ej: Navidad Familia 2026",
    budgetLabel: "Presupuesto (opcional)",
    budgetPlaceholder: "Ej: $50 o 40€",
    eventDateLabel: "Fecha de entrega (opcional)",
    eventDatePlaceholder: "Ej: 24 de diciembre",
    notesLabel: "Notas o reglas (opcional)",
    notesPlaceholder:
      "Ej: No se valen tarjetas de regalo, poner pista en el paquete...",
    participantsLabel: "Participantes",
    addPerson: "Añadir persona",
    participantPlaceholder: "Participante",
    removeTitle: "Eliminar",
    exclusionsTitle: "Exclusiones opcionales (ej. parejas)",
    exclusionsSubtitle:
      "Las personas emparejadas aquí no se regalarán entre sí.",
    selectPerson1: "Selecciona persona 1",
    selectPerson2: "Selecciona persona 2",
    addBtn: "Añadir",
    creatingBtn: "Realizando sorteo...",
    createBtn: "Crear grupo y hacer sorteo",
    connectionError: "Error de conexión. Inténtalo de nuevo.",
    createGroupError: "Error al crear el grupo.",

    // Created success
    createdTitle: "¡Sorteo creado con éxito!",
    createdSubtitle: "100% ciego. Nadie sabe a quién le tocó cada quien.",
    groupLinkTitle: "1. Enlace único para el grupo (WhatsApp)",
    copyLink: "Copiar enlace",
    copied: "¡Copiado!",
    copyWhatsApp: "Copiar mensaje WhatsApp",
    copiedWhatsApp: "¡Mensaje copiado!",
    adminLinkTitle: "2. Tu enlace privado de Administrador (¡Guárdalo!)",
    adminLinkDesc:
      "Úsalo para enviar invitaciones por correo o resetear PINs en 1 clic. Nunca verás las parejas del sorteo.",
    copyAdminLink: "Copiar enlace de Admin",
    openAdminPanel: "Abrir Panel Admin →",
    whatsappMessage: buildWhatsAppMessage,
    // Group Page
    loadingDraw: "Cargando sorteo...",
    groupNotFound: "Grupo no encontrado.",
    loadGroupError: "No se pudo cargar el grupo.",
    tapYourName: "Toca tu nombre para ver tu Amigo Secreto.",
    budgetPrefix: "Presupuesto:",
    datePrefix: "Fecha:",
    claimedBadge: "Ya reclamado",
    availableBadge: "Disponible",
    privacyFooter:
      "Tu PIN se guarda encriptado y tu sesión queda abierta 60 días en este dispositivo. Ni siquiera el organizador puede ver a quién te tocó.",

    // Modal PIN + Optional Email
    loginAs: (name: string) => `Entrar como ${name}`,
    confirmName: (name: string) => `¿Seguro que eres ${name}?`,
    loginDesc: "Introduce tu PIN de 4 dígitos.",
    claimDesc:
      "Crea un PIN de 4 dígitos para proteger tu perfil. Nadie más podrá abrirlo.",
    pinLabel: "PIN de 4 dígitos",
    confirmPinLabel: "Confirma tu PIN",
    optionalEmailLabel: "Tu correo electrónico (opcional)",
    optionalEmailPlaceholder: "tu@correo.com",
    optionalEmailHelp:
      "¿Para qué sirve? Si lo pones, te enviaremos tu PIN y un enlace de acceso directo por si olvidas el PIN o cambias de dispositivo. Si no quieres, déjalo vacío.",
    pinError4Digits: "El PIN debe ser de exactamente 4 números.",
    pinErrorMismatch: "Los dos PIN no coinciden.",
    emailInvalidError: "El correo electrónico no parece válido.",
    cancelBtn: "Cancelar",
    enteringBtn: "Entrando...",
    enterBtn: "Entrar",
    createPinBtn: "Crear PIN y entrar",

    // Logged in Dashboard
    helloUser: (name: string) => `Hola, ${name} 👋`,
    youGot: "Te tocó regalarle a:",
    wishlistOf: (name: string) => `Lista de deseos de ${name}`,
    noWishlistYet:
      "Todavía no ha escrito ideas de regalo. Vuelve a revisar más adelante.",
    hideName: "Ocultar nombre",
    tapToReveal: "Tocar para revelar",
    makeSureNobodyLooking: "Asegúrate de que nadie esté mirando tu pantalla 😉",
    myWishlistTitle: "Mi lista de deseos (pistas para quien te regala)",
    myWishlistDesc:
      "Escribe ideas, tallas, colores o enlaces. Solo la persona a la que le tocaste podrá leer esto.",
    myWishlistPlaceholder:
      "Ej: Talla M, me gustan los chocolates oscuros, libros de ciencia ficción...",
    savedOk: "✓ Guardado correctamente",
    savingBtn: "Guardando...",
    saveListBtn: "Guardar lista",
    sessionSavedNote:
      "Tu sesión queda guardada automáticamente en este dispositivo. Solo cierra la pestaña cuando termines.",
    sharedDeviceLink: "¿Teléfono compartido? Cambiar de persona",
    confirmSwitchPerson:
      "¿Seguro que quieres cerrar sesión en este dispositivo? Necesitarás tu PIN (o el enlace de tu correo) para volver a entrar.",
    emailSentBanner:
      "Te enviamos un correo con tu PIN y tu enlace directo de acceso (revisa Spam si no lo ves).",

    // Admin Page
    loadingAdmin: "Cargando panel de administrador...",
    accessDenied: "Acceso denegado.",
    blindAdminBadge: "Panel Ciego de Admin",
    copyGroupLinkBtn: "Copiar link grupo",
    adminDesc:
      "Aquí puedes ver quién ya entró, enviar o corregir correos (con enlace directo sin PIN) y resetear PINs. Las asignaciones del sorteo nunca se muestran.",
    statusClaimed: "Reclamado",
    statusPending: "Pendiente",
    hasWishlistBadge: "• Con wishlist",
    resettingBtn: "Reseteando...",
    resetPinBtn: "Resetear PIN",
    confirmResetPin: (name: string) =>
      `¿Seguro que quieres resetear el PIN de ${name}? Podrá entrar de nuevo y elegir un PIN nuevo sin cambiar el sorteo.`,
    emailPlaceholderAdmin: "correo@ejemplo.com (opcional)",
    sendingBtn: "Enviando...",
    sentBtn: "Enviado",
    sendBtn: "Enviar link",
    sendEmailError: "No se pudo enviar el correo.",
  },
  en: {
    // Home / Create Group
    homeTitle: "Secret Santa",
    homeSubtitle:
      "One single link for the group. Everyone picks their name, sets a PIN, and stays logged in.",
    groupNameLabel: "Group name *",
    groupNamePlaceholder: "e.g. Family Christmas 2026",
    budgetLabel: "Budget (optional)",
    budgetPlaceholder: "e.g. $50 or €40",
    eventDateLabel: "Gift exchange date (optional)",
    eventDatePlaceholder: "e.g. December 24",
    notesLabel: "Notes or rules (optional)",
    notesPlaceholder:
      "e.g. No gift cards, write a clue on the gift tag...",
    participantsLabel: "Participants",
    addPerson: "Add person",
    participantPlaceholder: "Participant",
    removeTitle: "Remove",
    exclusionsTitle: "Optional exclusions (e.g. couples)",
    exclusionsSubtitle:
      "People paired here will not be assigned to each other.",
    selectPerson1: "Select person 1",
    selectPerson2: "Select person 2",
    addBtn: "Add",
    creatingBtn: "Drawing names...",
    createBtn: "Create group & draw names",
    connectionError: "Connection error. Please try again.",
    createGroupError: "Could not create the group.",

    // Created success
    createdTitle: "Secret Santa created!",
    createdSubtitle: "100% blind draw. Nobody knows who got whom.",
    groupLinkTitle: "1. Single link for the group (WhatsApp / Chat)",
    copyLink: "Copy link",
    copied: "Copied!",
    copyWhatsApp: "Copy WhatsApp message",
    copiedWhatsApp: "Message copied!",
    adminLinkTitle: "2. Your private Admin link (Save it!)",
    adminLinkDesc:
      "Use it to send email invites or reset PINs in 1 click. You will never see the draw assignments.",
    copyAdminLink: "Copy Admin link",
    openAdminPanel: "Open Admin Panel →",
    
    whatsappMessage: buildWhatsAppMessage,    

    // Group Page
    loadingDraw: "Loading draw...",
    groupNotFound: "Group not found.",
    loadGroupError: "Could not load the group.",
    tapYourName: "Tap your name to see your Secret Santa match.",
    budgetPrefix: "Budget:",
    datePrefix: "Date:",
    claimedBadge: "Claimed",
    availableBadge: "Available",
    privacyFooter:
      "Your PIN is encrypted and your session stays active for 60 days on this device. Not even the organizer can see who you got.",

    // Modal PIN + Optional Email
    loginAs: (name: string) => `Sign in as ${name}`,
    confirmName: (name: string) => `Are you sure you're ${name}?`,
    loginDesc: "Enter your 4-digit PIN.",
    claimDesc:
      "Create a 4-digit PIN to protect your profile so nobody else can open it.",
    pinLabel: "4-digit PIN",
    confirmPinLabel: "Confirm your PIN",
    optionalEmailLabel: "Your email (optional)",
    optionalEmailPlaceholder: "you@example.com",
    optionalEmailHelp:
      "Why add it? We'll email you a backup of your PIN and a direct login link in case you forget your PIN or switch devices. Totally optional.",
    pinError4Digits: "The PIN must be exactly 4 digits.",
    pinErrorMismatch: "The two PINs do not match.",
    emailInvalidError: "Please enter a valid email address.",
    cancelBtn: "Cancel",
    enteringBtn: "Signing in...",
    enterBtn: "Sign in",
    createPinBtn: "Create PIN & enter",

    // Logged in Dashboard
    helloUser: (name: string) => `Hi, ${name} 👋`,
    youGot: "You are gifting to:",
    wishlistOf: (name: string) => `${name}'s wishlist`,
    noWishlistYet:
      "They haven't added gift ideas yet. Check back later!",
    hideName: "Hide name",
    tapToReveal: "Tap to reveal",
    makeSureNobodyLooking: "Make sure nobody is looking at your screen 😉",
    myWishlistTitle: "My wishlist (hints for your Secret Santa)",
    myWishlistDesc:
      "Add gift ideas, sizes, favorite colors, or links. Only the person gifting to you can see this.",
    myWishlistPlaceholder:
      "e.g. Size M, I love dark chocolate, sci-fi books...",
    savedOk: "✓ Saved successfully",
    savingBtn: "Saving...",
    saveListBtn: "Save wishlist",
    sessionSavedNote:
      "Your session stays logged in automatically on this device. Just close the tab when you're done.",
    sharedDeviceLink: "Shared device? Switch person",
    confirmSwitchPerson:
      "Are you sure you want to sign out on this device? You will need your PIN (or the direct link from your email) to sign back in.",
    emailSentBanner:
      "We emailed you a backup of your PIN and your direct login link (check Spam if you don't see it).",

    // Admin Page
    loadingAdmin: "Loading admin panel...",
    accessDenied: "Access denied.",
    blindAdminBadge: "Blind Admin Panel",
    copyGroupLinkBtn: "Copy group link",
    adminDesc:
      "Track who has joined, send or fix invite emails (with a 1-click direct login link), and reset PINs. Draw matches are never shown.",
    statusClaimed: "Claimed",
    statusPending: "Pending",
    hasWishlistBadge: "• Has wishlist",
    resettingBtn: "Resetting...",
    resetPinBtn: "Reset PIN",
    confirmResetPin: (name: string) =>
      `Are you sure you want to reset ${name}'s PIN? They will be able to set a new PIN without changing the draw.`,
    emailPlaceholderAdmin: "email@example.com (optional)",
    sendingBtn: "Sending...",
    sentBtn: "Sent",
    sendBtn: "Send link",
    sendEmailError: "Could not send the email.",
  },
} as const;
