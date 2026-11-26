# Secret Santa (Bilingüe ES/EN + PIN + Cookie 60 días + Brevo)

Aplicación de Amigo Secreto en Next.js (App Router) + Firebase Firestore + Brevo + Vercel.

## Características
- **Idioma automático (ES/EN):** Detecta el idioma del dispositivo; si es español muestra español, para inglés o cualquier otro idioma muestra inglés (con botón rápido ES/EN).
- **Sesión persistente (60 días):** Sin botón visible de "Salir" arriba para evitar cierres accidentales; incluye un enlace discreto al final solo para teléfonos compartidos.
- **Correo opcional con PIN + enlace directo:** Al crear su PIN, cada participante puede poner su correo (opcional) para recibir su PIN y un enlace directo sin PIN vía Brevo. Si hay un error en el correo, nunca bloquea el acceso.
- **Panel de Admin Ciego:** Permite enviar/corregir enlaces directos por Brevo y resetear PINs en 1 clic sin ver jamás las parejas del sorteo.

## Variables de entorno en Vercel
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `AUTH_SECRET`
- `BREVO_API_KEY` (opcional)
- `BREVO_SENDER_EMAIL` (opcional)
