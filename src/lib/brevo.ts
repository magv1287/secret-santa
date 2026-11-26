import nodemailer from "nodemailer";
import type { Lang } from "@/lib/i18n";

export async function sendSecretSantaEmail({
  toEmail,
  toName,
  groupName,
  directUrl,
  pin,
  lang = "en",
}: {
  toEmail: string;
  toName: string;
  groupName: string;
  directUrl: string;
  pin?: string;
  lang?: Lang;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Faltan GMAIL_USER o GMAIL_APP_PASSWORD en las variables de entorno."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const isEs = lang === "es";

  const subject = "🎄 Secret Santa - Burrito Pandilla 🎅";

  const pinBlock = pin
    ? isEs
      ? `<div style="background:#f1f5f9;border-radius:10px;padding:14px 18px;margin:18px 0;text-align:center;">
           <p style="margin:0 0 6px 0;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Tu PIN de 4 dígitos</p>
           <p style="margin:0;font-size:28px;font-weight:bold;letter-spacing:6px;color:#0f172a;">${pin}</p>
         </div>`
      : `<div style="background:#f1f5f9;border-radius:10px;padding:14px 18px;margin:18px 0;text-align:center;">
           <p style="margin:0 0 6px 0;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Your 4-digit PIN</p>
           <p style="margin:0;font-size:28px;font-weight:bold;letter-spacing:6px;color:#0f172a;">${pin}</p>
         </div>`
    : "";

  const html = isEs
    ? `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #0f172a;">
        <h2>¡Hola, ${toName}! 🎄</h2>
        <p>Aquí tienes tu acceso personal y privado para entrar directo a tu cuenta de <strong>${groupName}</strong> (sin tener que volver a poner tu PIN):</p>
        ${pinBlock}
        <p style="margin: 24px 0; text-align: center;">
          <a href="${directUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Entrar a mi Amigo Secreto
          </a>
        </p>
        <p style="font-size: 12px; color: #64748b;">
          Guarda este correo por si cambias de teléfono o computadora. No compartas este botón con nadie más.
        </p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #0f172a;">
        <h2>Hi, ${toName}! 🎄</h2>
        <p>Here is your personal, private access to go straight into your <strong>${groupName}</strong> account (no need to re-enter your PIN):</p>
        ${pinBlock}
        <p style="margin: 24px 0; text-align: center;">
          <a href="${directUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Open my Secret Santa
          </a>
        </p>
        <p style="font-size: 12px; color: #64748b;">
          Keep this email in case you switch phones or computers. Please do not share this private link with anyone else.
        </p>
      </div>
    `;

  await transporter.sendMail({
    from: `"Secret Santa 🎄" <${user}>`,
    to: `"${toName}" <${toEmail}>`,
    subject,
    html,
  });
}
