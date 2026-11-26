import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { generateToken, slugify } from "@/lib/crypto";
import { runSecretSantaDraw } from "@/lib/draw";

export const dynamic = "force-dynamic";

interface CreateGroupBody {
  name: string;
  budget?: string;
  eventDate?: string;
  notes?: string;
  participants: string[];
  exclusions?: Array<[number, number]>;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateGroupBody;

    const groupName = body.name?.trim();
    if (!groupName) {
      return NextResponse.json(
        { error: "Group name is required / El nombre del grupo es obligatorio." },
        { status: 400 }
      );
    }

    const cleanNames = (body.participants || [])
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (cleanNames.length < 3) {
      return NextResponse.json(
        { error: "At least 3 participants are required / Se necesitan al menos 3 participantes." },
        { status: 400 }
      );
    }

    const lowerSet = new Set(cleanNames.map((n) => n.toLowerCase()));
    if (lowerSet.size !== cleanNames.length) {
      return NextResponse.json(
        { error: "Duplicate names are not allowed / No puede haber nombres duplicados." },
        { status: 400 }
      );
    }

    const participantsWithIds = cleanNames.map((name, idx) => ({
      id: `p_${idx + 1}_${generateToken(4)}`,
      name,
      exclusions: [] as string[],
    }));

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

    const assignments = runSecretSantaDraw(
      participantsWithIds.map((p) => ({ id: p.id, exclusions: p.exclusions }))
    );

    if (!assignments) {
      return NextResponse.json(
        {
          error:
            "Impossible draw with those exclusions / No fue posible hacer el sorteo con esas exclusiones.",
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
        email: "",
        magicToken: generateToken(16),
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
      { error: "Internal error creating group." },
      { status: 500 }
    );
  }
}
