# Secret Santa (Sin Emails, Enlace Único + PIN + Cookie 60 días)

Aplicación de Amigo Secreto en Next.js (App Router) + Firebase Firestore + Vercel.

## Características
- **Un solo enlace para el grupo** (ideal para WhatsApp).
- **Nombre + PIN de 4 dígitos** (sin emails que bloqueen el sorteo).
- **Cookie segura de 60 días** (`HttpOnly`) para no volver a pedir el PIN en el mismo dispositivo.
- **100% ciego y a prueba de trampas**: toda la lógica y las lecturas de Firestore se ejecutan en el servidor con Firebase Admin SDK.
- **Panel de Admin Ciego**: permite resetear el PIN de cualquier participante en 1 clic sin ver jamás quién le tocó a quién.
- **Exclusiones** (ej. parejas que no pueden regalarse entre sí) y **Wishlist** editable.

## Despliegue rápido en Vercel
1. Crea un proyecto en Firebase y activa **Firestore Database** en modo producción.
2. En Firebase -> Firestore -> **Reglas**, pega el contenido de `firestore.rules` y publica.
3. En Firebase -> **Configuración del proyecto -> Cuentas de servicio**, genera una nueva clave privada (archivo JSON).
4. Sube este repositorio a GitHub (sin archivos `.env`).
5. Importa el repositorio en Vercel y añade estas 4 variables de entorno en **Settings -> Environment Variables**:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `AUTH_SECRET` (cualquier texto aleatorio largo)
