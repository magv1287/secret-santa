import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const expected = process.env.SUPER_ADMIN_KEY;
  if (!expected) return false;
  const provided = request.headers.get("x-admin-key") || "";
  return provided === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Clave incorrecta o SUPER_ADMIN_KEY no configurada." },
      { status: 401 }
    );
  }

  try {
    const db = getDb();
    const snap = await db
      .collection("groups")
      .orderBy("createdAt", "desc")
      .get();

    const groups = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: (d.name as string) || doc.id,
        adminToken: (d.adminToken as string) || "",
        createdAt: (d.createdAt as string) || "",
      };
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error listing all groups:", error);
    return NextResponse.json(
      { error: "Error cargando los sorteos." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const deleteAll = searchParams.get("all") === "true";

    const db = getDb();

    if (deleteAll) {
      const snap = await db.collection("groups").get();
      await Promise.all(
        snap.docs.map((doc) => db.recursiveDelete(doc.ref))
      );
      return NextResponse.json({ ok: true, deleted: snap.size });
    }

    if (groupId) {
      const groupRef = db.collection("groups").doc(groupId);
      await db.recursiveDelete(groupRef);
      return NextResponse.json({ ok: true, deleted: 1 });
    }

    return NextResponse.json(
      { error: "Falta indicar groupId o all=true." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting groups:", error);
    return NextResponse.json(
      { error: "Error al eliminar." },
      { status: 500 }
    );
  }
}
