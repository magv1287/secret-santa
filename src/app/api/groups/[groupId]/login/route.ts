import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import {
  getSessionCookieName,
  signSession,
  verifyPin,
} from "@/lib/crypto";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { participantId, pin, lang } = (await request.json()) as {
      participantId: string;
      pin: string;
      lang?: Lang;
    };

    const userLang: Lang = lang === "es" ? "es" : "en";

    if (!participantId || !/^[0-9]{4}$/.test(pin || "")) {
      return NextResponse.json(
        {
          error:
            userLang === "es"
              ? "Introduce un PIN válido de 4 dígitos."
              : "Enter a valid 4-digit PIN.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const pSnap = await db
      .collection("groups")
      .doc(groupId)
      .collection("participants")
      .doc(participantId)
      .get();

    if (!pSnap.exists) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const data = pSnap.data()!;
    if (!data.claimed) {
      return NextResponse.json(
        {
          error:
            userLang === "es"
              ? "Este perfil aún no tiene PIN. Reclámalo primero."
              : "This profile has no PIN yet. Claim it first.",
        },
        { status: 400 }
      );
    }

    if (!data.pinHash) {
      return NextResponse.json(
        {
          error:
            userLang === "es"
              ? "Este perfil entró por enlace de correo y no tiene PIN. Usa el enlace de tu email."
              : "This profile signed in via email link without a PIN. Please use your email link.",
        },
        { status: 400 }
      );
    }

    if (!verifyPin(pin, data.pinHash)) {
      return NextResponse.json(
        {
          error:
            userLang === "es"
              ? "PIN incorrecto. Inténtalo de nuevo."
              : "Incorrect PIN. Please try again.",
        },
        { status: 401 }
      );
    }

    const token = signSession({
      groupId,
      participantId,
      pinVersion: (data.pinVersion as number) || 1,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getSessionCookieName(groupId), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      { error: "Error signing in." },
      { status: 500 }
    );
  }
}
