import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firebase-admin";
import { getSessionCookieName, verifySession } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const cookieVal = cookies().get(getSessionCookieName(groupId))?.value;
    if (!cookieVal) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = verifySession(cookieVal);
    if (!payload || payload.groupId !== groupId) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
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
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    await pRef.update({
      wishlist: cleanWishlist,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, wishlist: cleanWishlist });
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return NextResponse.json(
      { error: "Could not save wishlist." },
      { status: 500 }
    );
  }
}
