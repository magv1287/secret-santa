import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firebase-admin";
import { getSessionCookieName, verifySession } from "@/lib/crypto";

export async function PATCH(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const cookieVal = cookies().get(getSessionCookieName(groupId))?.value;
    if (!cookieVal) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const payload = verifySession(cookieVal);
    if (!payload || payload.groupId !== groupId) {
      return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
    }

    const { wishlist } = (await request.json()) as { wishlist: string };
    const cleanWishlist = (wishlist || "").slice(0, 1500);

    const db = getDb();
    const pRef = db
      .collection("groups")
      .doc(groupId)
      .collection("participants")
      .doc(payload.participantId);

    const snap = await pRef.get();
    if (!snap.exists || snap.data()?.pinVersion !== payload.pinVersion) {
      return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
    }

    await pRef.update({
      wishlist: cleanWishlist,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, wishlist: cleanWishlist });
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return NextResponse.json(
      { error: "No se pudo guardar tu lista de deseos." },
      { status: 500 }
    );
  }
}
