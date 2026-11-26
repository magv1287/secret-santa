import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/firebase-admin";
import { getSessionCookieName, verifySession } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const db = getDb();
    const groupSnap = await db.collection("groups").doc(groupId).get();

    if (!groupSnap.exists) {
      return NextResponse.json(
        { error: "Group not found." },
        { status: 404 }
      );
    }

    const groupData = groupSnap.data()!;
    const participantsSnap = await groupSnap.ref
      .collection("participants")
      .orderBy("name", "asc")
      .get();

    const participants = participantsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name as string,
        claimed: Boolean(d.claimed),
      };
    });

    let sessionData = null;
    const cookieName = getSessionCookieName(groupId);
    const cookieVal = cookies().get(cookieName)?.value;

    if (cookieVal) {
      const payload = verifySession(cookieVal);
      if (payload && payload.groupId === groupId) {
        const meDoc = participantsSnap.docs.find(
          (d) => d.id === payload.participantId
        );
        if (meDoc) {
          const me = meDoc.data();
          if (me.claimed && me.pinVersion === payload.pinVersion) {
            const targetDoc = participantsSnap.docs.find(
              (d) => d.id === me.assignedToId
            );
            const target = targetDoc?.data();

            sessionData = {
              participantId: meDoc.id,
              name: me.name as string,
              wishlist: (me.wishlist as string) || "",
              assignedTo: target
                ? {
                    name: target.name as string,
                    wishlist: (target.wishlist as string) || "",
                  }
                : null,
            };
          }
        }
      }
    }

    return NextResponse.json({
      group: {
        id: groupSnap.id,
        name: groupData.name,
        budget: groupData.budget,
        eventDate: groupData.eventDate,
        notes: groupData.notes,
      },
      participants,
      session: sessionData,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Error loading group." },
      { status: 500 }
    );
  }
}
