import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import {
  generateToken,
  getSessionCookieName,
  hashPin,
  signSession,
} from "@/lib/crypto";
import { sendSecretSantaEmail } from "@/lib/brevo";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { participantId, pin, email, lang } = (await request.json()) as {
      participantId: string;
      pin: string;
      email?: string;
      lang?: Lang;
    };

    const userLang: Lang = lang === "es" ? "es" : "en";

    if (!participantId || !/^[0-9]{4}$/.test(pin || "")) {
      return NextResponse.json(
        {
          error:
            userLang === "es"
              ? "El PIN debe tener exactamente 4 dígitos numéricos."
              : "PIN must be exactly 4 digits.",
        },
        { status: 400 }
      );
    }

    const cleanEmail = (email || "").trim();
    if (cleanEmail && !cleanEmail.includes("@")) {
      return NextResponse.json(
        {
          error:
            userLang === "es"
              ? "El correo electrónico no es válido."
              : "Invalid email address.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const groupRef = db.collection("groups").doc(groupId);
    const pRef = groupRef.collection("participants").doc(participantId);

    const result = await db.runTransaction(async (tx) => {
      const [groupSnap, snap] = await Promise.all([
        tx.get(groupRef),
        tx.get(pRef),
      ]);

      if (!groupSnap.exists || !snap.exists) {
        return { error: "Not found.", status: 404 };
      }

      const data = snap.data()!;
      if (data.claimed) {
        return {
          error:
            userLang === "es"
              ? "Este perfil ya fue reclamado. Entra usando tu PIN."
              : "This profile is already claimed. Sign in with your PIN.",
          status: 409,
        };
      }

      const pinVersion = (data.pinVersion as number) || 1;
      const magicToken = (data.magicToken as string) || generateToken(16);

      const updateData: Record<string, unknown> = {
        claimed: true,
        pinHash: hashPin(pin),
        magicToken,
        updatedAt: new Date().toISOString(),
      };
      if (cleanEmail) {
        updateData.email = cleanEmail;
      }

      tx.update(pRef, updateData);

      return {
        status: 200,
        pinVersion,
        magicToken,
        participantName: data.name as string,
        groupName: groupSnap.data()!.name as string,
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Enviar correo opcional con el PIN y enlace directo (nunca bloquea el acceso si falla)
    let emailSent = false;
    if (cleanEmail) {
      try {
        const origin = new URL(request.url).origin;
        const directUrl = `${origin}/g/${groupId}?t=${result.magicToken}`;
        await sendSecretSantaEmail({
          toEmail: cleanEmail,
          toName: result.participantName!,
          groupName: result.groupName!,
          directUrl,
          pin,
          lang: userLang,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("Optional email send failed (non-blocking):", mailErr);
      }
    }

    const token = signSession({
      groupId,
      participantId,
      pinVersion: result.pinVersion!,
    });

    const response = NextResponse.json({ ok: true, emailSent });
    response.cookies.set(getSessionCookieName(groupId), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error claiming profile:", error);
    return NextResponse.json(
      { error: "Could not claim profile." },
      { status: 500 }
    );
  }
}
