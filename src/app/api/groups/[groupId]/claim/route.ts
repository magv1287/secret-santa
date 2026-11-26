import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import {
  getSessionCookieName,
  hashPin,
  signSession,
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
        { error: "El PIN debe tener exactamente 4 dígitos numéricos." },
        { status: 400 }
      );
    }

    const db = getDb();
    const pRef = db
      .collection("groups")
      .doc(groupId)
      .collection("participants")
      .doc(participantId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(pRef);
      if (!snap.exists) {
        return { error: "Participante no encontrado.", status: 404 };
      }

      const data = snap.data()!;
      if (data.claimed) {
        return {
          error: "Este perfil ya fue reclamado. Entra usando tu PIN.",
          status: 409,
        };
      }

      const pinVersion = (data.pinVersion as number) || 1;
      tx.update(pRef, {
        claimed: true,
        pinHash: hashPin(pin),
        updatedAt: new Date().toISOString(),
      });

      return { status: 200, pinVersion };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const token = signSession({
      groupId,
      participantId,
      pinVersion: result.pinVersion!,
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
    console.error("Error claiming profile:", error);
    return NextResponse.json(
      { error: "No se pudo reclamar el perfil." },
      { status: 500 }
    );
  }
}
