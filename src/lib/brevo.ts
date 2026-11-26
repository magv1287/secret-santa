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
    auth: { user, pass },
  });

  const isEs = lang === "es";

  const subject = isEs
    ? `Secret Santa - ${groupName}`
    : `Secret Santa - ${groupName}`;

  const text = isEs
    ? [
        `Hola ${toName},`,
        ``,
        `Aquí tienes tu enlace para entrar al sorteo de ${groupName}:`,
        `${directUrl}`,
        pin ? `\nTu código de 4 dígitos por si lo necesitas: ${pin}` : "",
        ``,
        `Guarda este correo por si entras desde otro teléfono o computadora.`,
      ]
        .filter((line) => line !== undefined)
        .join("\n")
    : [
        `Hi ${toName},`,
        ``,
        `Here is your link for the ${groupName} Secret Santa:`,
        `${directUrl}`,
        pin ? `\nYour 4-digit code just in case: ${pin}` : "",
        ``,
        `Keep this email in case you open it from another phone or computer.`,
      ]
        .filter((line) => line !== undefined)
        .join("\n");

  await transporter.sendMail({
    from: `"Secret Santa" <${user}>`,
    to: toEmail,
    subject,
    text,
  });
}
