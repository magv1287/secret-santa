import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requerido." }, { status: 401 });
    }

    const db = getDb();
    const groupSnap = await db.collection("groups").doc(groupId).get();
    if (!groupSnap.exists) {
      return NextResponse.json({ error: "Grupo no encontrado." }, { status: 404 });
    }

    const groupData = groupSnap.data()!;
    if (groupData.adminToken !== token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 403 });
    }

    const participantsSnap = await groupSnap.ref
      .collection("participants")
      .orderBy("name", "asc")
      .get();

    // IMPORTANTE: Nunca devolver assignedToId aquí (panel 100% ciego)
    const participants = participantsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name as string,
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
      { error: "Error cargando el panel de administración." },
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
    const { token, participantId } = (await request.json()) as {
      token: string;
      participantId: string;
    };

    if (!token || !participantId) {
      return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
    }

    const db = getDb();
    const groupRef = db.collection("groups").doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
      return NextResponse.json({ error: "Grupo no encontrado." }, { status: 404 });
    }

    if (groupSnap.data()?.adminToken !== token) {
      return NextResponse.json({ error: "Token inválido." }, { status: 403 });
    }

    const pRef = groupRef.collection("participants").doc(participantId);
    const pSnap = await pRef.get();
    if (!pSnap.exists) {
      return NextResponse.json(
        { error: "Participante no encontrado." },
        { status: 404 }
      );
    }

    const currentVersion = (pSnap.data()?.pinVersion as number) || 1;

    // Resetea el PIN e invalida cualquier cookie vieja de ese usuario
    await pRef.update({
      claimed: false,
      pinHash: null,
      pinVersion: currentVersion + 1,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error resetting PIN:", error);
    return NextResponse.json(
      { error: "No se pudo resetear el PIN." },
      { status: 500 }
    );
  }
}
