"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Shield,
  RotateCcw,
  Copy,
  Check,
  Lock,
  UserCheck,
  Mail,
} from "lucide-react";
import { detectDeviceLang, translations, type Lang } from "@/lib/i18n";

interface AdminParticipant {
  id: string;
  name: string;
  email: string;
  claimed: boolean;
  hasWishlist: boolean;
}

function AdminContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.groupId as string;
  const token = searchParams.get("token") || "";

  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLang(detectDeviceLang());
  }, []);

  const loadAdmin = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/groups/${groupId}/admin?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied.");
        return;
      }
      setGroupName(data.group.name);
      setParticipants(data.participants);
      const map: Record<string, string> = {};
      for (const p of data.participants) {
        map[p.id] = p.email || "";
      }
      setEmails(map);
    } catch {
      setError("Error loading admin panel.");
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  async function handleResetPin(participantId: string, name: string) {
    if (!confirm(t.confirmResetPin(name))) {
      return;
    }

    setResettingId(participantId);
    try {
      const res = await fetch(`/api/groups/${groupId}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, participantId, action: "reset_pin" }),
      });
      if (res.ok) {
        await loadAdmin();
      }
    } finally {
      setResettingId(null);
    }
  }

  async function handleSendEmail(participantId: string) {
    const email = (emails[participantId] || "").trim();
    if (!email) return;

    setSendingId(participantId);
    setSentId(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          participantId,
          action: "send_email",
          email,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t.sendEmailError);
      } else {
        setSentId(participantId);
        setTimeout(() => setSentId(null), 3000);
      }
    } finally {
      setSendingId(null);
    }
  }

  function copyGroupLink() {
    const url = `${window.location.origin}/g/${groupId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        {t.loadingAdmin}
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Shield className="h-3.5 w-3.5" /> {t.blindAdminBadge}
          </span>
          <h1 className="text-2xl font-bold text-white">{groupName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
          <button
            onClick={copyGroupLink}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-700"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? t.copied : t.copyGroupLinkBtn}
          </button>
        </div>
      </div>

      <p className="mb-5 text-xs text-slate-400">{t.adminDesc}</p>

      <div className="space-y-3">
        {participants.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{p.name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs">
                  {p.claimed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <Lock className="h-3 w-3" /> {t.statusClaimed}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <UserCheck className="h-3 w-3" /> {t.statusPending}
                    </span>
                  )}
                  {p.hasWishlist && (
                    <span className="text-amber-400">{t.hasWishlistBadge}</span>
                  )}
                </div>
              </div>

              {p.claimed && (
                <button
                  onClick={() => handleResetPin(p.id, p.name)}
                  disabled={resettingId === p.id}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {resettingId === p.id ? t.resettingBtn : t.resetPinBtn}
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder={t.emailPlaceholderAdmin}
                value={emails[p.id] || ""}
                onChange={(e) =>
                  setEmails({ ...emails, [p.id]: e.target.value })
                }
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
              <button
                onClick={() => handleSendEmail(p.id)}
                disabled={sendingId === p.id || !(emails[p.id] || "").trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-40"
              >
                {sentId === p.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                {sendingId === p.id
                  ? t.sendingBtn
                  : sentId === p.id
                  ? t.sentBtn
                  : t.sendBtn}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-slate-400">
          Loading...
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
