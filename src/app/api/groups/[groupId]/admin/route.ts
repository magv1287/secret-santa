import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { generateToken } from "@/lib/crypto";
import { sendSecretSantaEmail } from "@/lib/brevo";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required." }, { status: 401 });
    }

    const db = getDb();
    const groupSnap = await db.collection("groups").doc(groupId).get();
    if (!groupSnap.exists) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const groupData = groupSnap.data()!;
    if (groupData.adminToken !== token) {
      return NextResponse.json({ error: "Invalid token." }, { status: 403 });
    }

    const participantsSnap = await groupSnap.ref
      .collection("participants")
      .orderBy("name", "asc")
      .get();

    const participants = participantsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name as string,
        email: (d.email as string) || "",
        claimed: Boolean(d.claimed),
        hasWishlist: Boolean(d.wishlist && String(d.wishlist).trim().length > 0),
      };
    });

    return NextResponse.json({
      group: {
        id: groupSnap.id,
        name: groupData.name,
        budget: groupData.budget,
        eventDate: groupData.eventDate,
        notes: groupData.notes,
      },
      participants,
    });
  } catch (error) {
    console.error("Error in admin GET:", error);
    return NextResponse.json(
      { error: "Error loading admin panel." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const body = (await request.json()) as {
      token: string;
      participantId: string;
      action?: "reset_pin" | "send_email";
      email?: string;
      lang?: Lang;
    };

    const { token, participantId, action = "reset_pin", email, lang } = body;
    const emailLang: Lang = lang === "es" ? "es" : "en";

    if (!token || !participantId) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const db = getDb();
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const groupData = groupSnap.data()!;
    if (groupData.adminToken !== token) {
      return NextResponse.json({ error: "Invalid token." }, { status: 403 });
    }

    const pRef = groupRef.collection("participants").doc(participantId);
    const pSnap = await pRef.get();
    if (!pSnap.exists) {
      return NextResponse.json(
        { error: "Participant not found." },
        { status: 404 }
      );
    }

    const pData = pSnap.data()!;

    if (action === "send_email") {
      const cleanEmail = (email || "").trim();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json(
          { error: "Invalid email address." },
          { status: 400 }
        );
      }

      const magicToken = (pData.magicToken as string) || generateToken(16);
      const origin = new URL(request.url).origin;
      const directUrl = `${origin}/g/${groupId}?t=${magicToken}`;

      await sendSecretSantaEmail({
        toEmail: cleanEmail,
        toName: pData.name as string,
        groupName: groupData.name as string,
        directUrl,
        lang: emailLang,
      });

      await pRef.update({
        email: cleanEmail,
        magicToken,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ ok: true });
    }

    const currentVersion = (pData.pinVersion as number) || 1;
    await pRef.update({
      claimed: false,
      pinHash: null,
      pinVersion: currentVersion + 1,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in admin POST:", error);
    return NextResponse.json(
      { error: "Error processing action." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required." }, { status: 401 });
    }

    const db = getDb();
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const groupData = groupSnap.data()!;
    if (groupData.adminToken !== token) {
      return NextResponse.json({ error: "Invalid token." }, { status: 403 });
    }

    const participantsSnap = await groupRef.collection("participants").get();
    const batch = db.batch();
    participantsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    batch.delete(groupRef);
    await batch.commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in admin DELETE:", error);
    return NextResponse.json(
      { error: "Error deleting group." },
      { status: 500 }
    );
  }
}
