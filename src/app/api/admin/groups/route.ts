import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const expected = process.env.SUPER_ADMIN_KEY;
  if (!expected) return false;
  const provided = request.headers.get("x-admin-key") || "";
  return provided === expected;
}

interface DrawAudit {
  totalParticipants: number;
  uniqueAssignedTargets: number;
  isValid: boolean;
  missingRecipients: string[];
  duplicateRecipients: { name: string; count: number }[];
  selfAssignments: string[];
  missingGivers: string[];
}

async function auditGroupDraw(
  groupRef: FirebaseFirestore.DocumentReference
): Promise<DrawAudit> {
  const snap = await groupRef.collection("participants").get();
  const docs = snap.docs.map((d) => ({
    id: d.id,
    name: (d.data().name as string) || d.id,
    assignedTo: (d.data().assignedTo as string) || "",
  }));

  const nameById = new Map<string, string>();
  for (const p of docs) {
    nameById.set(p.id, p.name);
  }

  const receiveCount = new Map<string, number>();
  for (const p of docs) {
    receiveCount.set(p.id, 0);
  }

  const selfAssignments: string[] = [];
  const missingGivers: string[] = [];

  for (const p of docs) {
    if (!p.assignedTo) {
      missingGivers.push(p.name);
      continue;
    }
    if (p.assignedTo === p.id) {
      selfAssignments.push(p.name);
    }
    receiveCount.set(p.assignedTo, (receiveCount.get(p.assignedTo) || 0) + 1);
  }

  const missingRecipients: string[] = [];
  const duplicateRecipients: { name: string; count: number }[] = [];
  let uniqueAssignedTargets = 0;

  for (const [id, count] of receiveCount.entries()) {
    const label = nameById.get(id) || id;
    if (count === 0) {
      missingRecipients.push(label);
    } else {
      uniqueAssignedTargets += 1;
      if (count > 1) {
        duplicateRecipients.push({ name: label, count });
      }
    }
  }

  const isValid =
    docs.length > 0 &&
    missingGivers.length === 0 &&
    selfAssignments.length === 0 &&
    missingRecipients.length === 0 &&
    duplicateRecipients.length === 0;

  return {
    totalParticipants: docs.length,
    uniqueAssignedTargets,
    isValid,
    missingRecipients,
    duplicateRecipients,
    selfAssignments,
    missingGivers,
  };
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

    const groups = await Promise.all(
      snap.docs.map(async (doc) => {
        const d = doc.data();
        const audit = await auditGroupDraw(doc.ref);
        return {
          id: doc.id,
          name: (d.name as string) || doc.id,
          adminToken: (d.adminToken as string) || "",
          createdAt: (d.createdAt as string) || "",
          audit,
        };
      })
    );

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
