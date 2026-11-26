import crypto from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-cambia-esto-en-produccion";

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPin(pin: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(pin, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function generateToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = crypto.randomBytes(3).toString("hex");
  return base ? `${base}-${suffix}` : `sorteo-${suffix}`;
}

export interface SessionPayload {
  groupId: string;
  participantId: string;
  pinVersion: number;
  exp: number;
}

export function signSession(payload: Omit<SessionPayload, "exp">): string {
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + sixtyDaysMs,
  };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expectedSig = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(data)
      .digest("base64url");

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as SessionPayload;

    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieName(groupId: string): string {
  return `ss_session_${groupId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
