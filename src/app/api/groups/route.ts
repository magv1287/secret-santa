import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { generateToken, slugify } from "@/lib/crypto";
import { runSecretSantaDraw } from "@/lib/draw";

interface CreateGroupBody {
  name: string;
  budget?: string;
  eventDate?: string;
  notes?: string;
  participants: string[];
  exclusions?: Array<[number, number]>; // pares de índices que no pueden regalarse entre sí
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateGroupBody;

    const groupName = body.name?.trim();
    if (!groupName) {
      return NextResponse.json(
        { error: "El nombre del grupo es obligatorio." },
        { status: 400 }
      );
    }

    const cleanNames = (body.participants || [])
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (cleanNames.length < 3) {
      return NextResponse.json(
        { error: "Necesitas al menos 3 participantes para hacer el sorteo." },
        { status: 400 }
      );
    }

    // Verificar nombres duplicados
    const lowerSet = new Set(cleanNames.map((n) => n.toLowerCase()));
    if (lowerSet.size !== cleanNames.length) {
      return NextResponse.json(
        { error: "No puede haber participantes con el mismo nombre exacto." },
        { status: 400 }
      );
    }

    // Crear IDs temporales para los participantes
    const participantsWithIds = cleanNames.map((name, idx) => ({
      id: `p_${idx + 1}_${generateToken(4)}`,
      name,
      exclusions: [] as string[],
    }));

    // Aplicar exclusiones mutuas (ej. parejas)
    if (Array.isArray(body.exclusions)) {
      for (const [idxA, idxB] of body.exclusions) {
        if (
          idxA !== idxB &&
          participantsWithIds[idxA] &&
          participantsWithIds[idxB]
        ) {
          const idA = participantsWithIds[idxA].id;
          const idB = participantsWithIds[idxB].id;
          if (!participantsWithIds[idxA].exclusions.includes(idB)) {
            participantsWithIds[idxA].exclusions.push(idB);
          }
          if (!participantsWithIds[idxB].exclusions.includes(idA)) {
            participantsWithIds[idxB].exclusions.push(idA);
          }
        }
      }
    }

    // Ejecutar el sorteo en el servidor
    const assignments = runSecretSantaDraw(
      participantsWithIds.map((p) => ({ id: p.id, exclusions: p.exclusions }))
    );

    if (!assignments) {
      return NextResponse.json(
        {
          error:
            "No fue posible realizar el sorteo con esas exclusiones. Quita alguna restricción o añade más participantes.",
        },
        { status: 400 }
      );
    }

    const db = getDb();
    const groupId = slugify(groupName);
    const adminToken = generateToken(24);
    const now = new Date().toISOString();

    const batch = db.batch();
    const groupRef = db.collection("groups").doc(groupId);

    batch.set(groupRef, {
      name: groupName,
      budget: body.budget?.trim() || "",
      eventDate: body.eventDate?.trim() || "",
      notes: body.notes?.trim() || "",
      adminToken,
      createdAt: now,
    });

    for (const p of participantsWithIds) {
      const pRef = groupRef.collection("participants").doc(p.id);
      batch.set(pRef, {
        name: p.name,
        assignedToId: assignments.get(p.id),
        exclusions: p.exclusions,
        claimed: false,
        pinHash: null,
        pinVersion: 1,
        wishlist: "",
        updatedAt: now,
      });
    }

    await batch.commit();

    return NextResponse.json({
      groupId,
      adminToken,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Error interno al crear el grupo. Revisa la configuración de Firebase." },
      { status: 500 }
    );
  }
}
