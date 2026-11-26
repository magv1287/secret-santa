import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import {
  getSessionCookieName,
  signSession,
  verifyPin,
} from "@/lib/crypto";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { participantId, pin } = (await request.json()) as {
      participantId: string;
      pin: string;
    };

    if (!participantId || !/^[0-9]{4}$/.test(pin || "")) {
      return NextResponse.json(
        { error: "Introduce un PIN válido de 4 dígitos." },
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
      return NextResponse.json(
        { error: "Participante no encontrado." },
        { status: 404 }
      );
    }

    const data = pSnap.data()!;
    if (!data.claimed || !data.pinHash) {
      return NextResponse.json(
        { error: "Este perfil aún no tiene PIN. Reclámalo primero." },
        { status: 400 }
      );
    }

    if (!verifyPin(pin, data.pinHash)) {
      return NextResponse.json(
        { error: "PIN incorrecto. Inténtalo de nuevo." },
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
      maxAge: 60 * 60 * 24 * 60, // 60 días
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      { error: "Error al iniciar sesión." },
      { status: 500 }
    );
  }
}
