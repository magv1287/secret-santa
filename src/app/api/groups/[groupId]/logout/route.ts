import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { groupId: string } }
) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(params.groupId), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
