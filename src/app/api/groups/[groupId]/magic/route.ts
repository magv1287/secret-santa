import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { getSessionCookieName, signSession } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { token } = (await request.json()) as { token: string };

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid link." }, { status: 400 });
    }

    const db = getDb();
    const snap = await db
      .collection("groups")
      .doc(groupId)
      .collection("participants")
      .where("magicToken", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { error: "Invalid or expired link." },
        { status: 404 }
      );
    }

    const pDoc = snap.docs[0];
    const data = pDoc.data();
    const pinVersion = (data.pinVersion as number) || 1;

    // Si aún no estaba marcado como reclamado, lo marcamos al entrar por su enlace privado
    if (!data.claimed) {
      await pDoc.ref.update({
        claimed: true,
        updatedAt: new Date().toISOString(),
      });
    }

    const sessionToken = signSession({
      groupId,
      participantId: pDoc.id,
      pinVersion,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getSessionCookieName(groupId), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in magic login:", error);
    return NextResponse.json(
      { error: "Could not verify magic link." },
      { status: 500 }
    );
  }
}
