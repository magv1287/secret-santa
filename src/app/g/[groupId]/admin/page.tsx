"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  RotateCcw,
  Copy,
  Check,
  Lock,
  UserCheck,
  Mail,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { detectDeviceLang, translations, type Lang } from "@/lib/i18n";

interface AdminParticipant {
  id: string;
  name: string;
  hasEmail: boolean;
  claimed: boolean;
  hasWishlist: boolean;
}

function AdminContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const token = searchParams.get("token") || "";

  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        body: JSON.stringify({ token, participantId }),
      });
      if (res.ok) {
        await loadAdmin();
      }
    } finally {
      setResettingId(null);
    }
  }

  async function handleDeleteGroup() {
    const msg =
      lang === "es"
        ? `¿Seguro que quieres ELIMINAR permanentemente el grupo "${groupName}" y todos sus participantes de la base de datos? Esta acción no se puede deshacer.`
        : `Are you sure you want to permanently DELETE "${groupName}" and all its participants from the database? This cannot be undone.`;

    if (!confirm(msg)) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/admin?token=${encodeURIComponent(token)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        alert(data.error || "Error deleting group.");
      }
    } finally {
      setDeleting(false);
    }
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const groupUrl = `${origin}/g/${groupId}`;
  const whatsappMsg = t.whatsappMessage(groupName, groupUrl);

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Shield className="h-3.5 w-3.5" /> {t.blindAdminBadge}
          </span>
          <h1 className="text-2xl font-bold text-white">{groupName}</h1>
        </div>
        <button
          type="button"
          onClick={() => setLang(lang === "es" ? "en" : "es")}
          className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
        >
          {lang === "es" ? "EN" : "ES"}
        </button>
      </div>

      {/* Tarjeta de Enlace del Grupo + Mensaje de WhatsApp */}
      <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          {t.groupLinkTitle}
        </p>
        <p className="mb-3 break-all text-sm text-slate-200">{groupUrl}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => copyText("group", groupUrl)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-500"
          >
            {copiedKey === "group" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedKey === "group" ? t.copied : t.copyLink}
          </button>
          <button
            onClick={() => copyText("wa", whatsappMsg)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            {copiedKey === "wa" ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            {copiedKey === "wa" ? t.copiedWhatsApp : t.copyWhatsApp}
          </button>
        </div>
      </div>

      <p className="mb-5 text-xs text-slate-400">
        {lang === "es"
          ? "Aquí puedes ver quién ya entró, si registró correo y resetear PINs. Las asignaciones y los correos nunca se muestran."
          : "Track who has joined, whether they added an email, and reset PINs. Draw matches and email addresses are never shown."}
      </p>

      <div className="space-y-3">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
          >
            <div>
              <p className="font-semibold text-white">{p.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                {p.claimed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Lock className="h-3 w-3" /> {t.statusClaimed}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <UserCheck className="h-3 w-3" /> {t.statusPending}
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 ${
                    p.hasEmail ? "text-sky-400" : "text-slate-500"
                  }`}
                >
                  • <Mail className="h-3 w-3" />{" "}
                  {p.hasEmail
                    ? lang === "es"
                      ? "Con correo"
                      : "Has email"
                    : lang === "es"
                    ? "Sin correo"
                    : "No email"}
                </span>

                {p.hasWishlist && (
                  <span className="text-amber-400">{t.hasWishlistBadge}</span>
                )}
              </div>
            </div>

            {p.claimed && (
              <button
                onClick={() => handleResetPin(p.id, p.name)}
                disabled={resettingId === p.id}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resettingId === p.id ? t.resettingBtn : t.resetPinBtn}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Zona de eliminación del grupo */}
      <div className="mt-10 border-t border-slate-800 pt-6 text-center">
        <button
          type="button"
          onClick={handleDeleteGroup}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting
            ? lang === "es"
              ? "Eliminando grupo..."
              : "Deleting group..."
            : lang === "es"
            ? "Eliminar este grupo de la base de datos"
            : "Delete this group from database"}
        </button>
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
