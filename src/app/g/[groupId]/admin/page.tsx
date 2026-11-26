"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Shield, RotateCcw, Copy, Check, Lock, UserCheck } from "lucide-react";

interface AdminParticipant {
  id: string;
  name: string;
  claimed: boolean;
  hasWishlist: boolean;
}

function AdminContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.groupId as string;
  const token = searchParams.get("token") || "";

  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAdmin = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/groups/${groupId}/admin?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Acceso denegado.");
        return;
      }
      setGroupName(data.group.name);
      setParticipants(data.participants);
    } catch {
      setError("Error al cargar el panel.");
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  async function handleResetPin(participantId: string, name: string) {
    if (
      !confirm(
        `¿Seguro que quieres resetear el PIN de ${name}? Podrá entrar de nuevo y elegir un PIN nuevo sin cambiar el sorteo.`
      )
    ) {
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

  function copyGroupLink() {
    const url = `${window.location.origin}/g/${groupId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        Cargando panel de administrador...
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
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Shield className="h-3.5 w-3.5" /> Panel Ciego de Admin
          </span>
          <h1 className="text-2xl font-bold text-white">{groupName}</h1>
        </div>
        <button
          onClick={copyGroupLink}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-700"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "¡Copiado!" : "Copiar link grupo"}
        </button>
      </div>

      <p className="mb-5 text-xs text-slate-400">
        Aquí puedes ver quién ya reclamó su perfil y resetear el PIN si alguien
        lo olvidó o entró por error. Las asignaciones del sorteo nunca se
        muestran.
      </p>

      <div className="space-y-2.5">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3.5"
          >
            <div>
              <p className="font-semibold text-white">{p.name}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs">
                {p.claimed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Lock className="h-3 w-3" /> Reclamado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <UserCheck className="h-3 w-3" /> Pendiente
                  </span>
                )}
                {p.hasWishlist && (
                  <span className="text-amber-400">• Con wishlist</span>
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
                {resettingId === p.id ? "Reseteando..." : "Resetear PIN"}
              </button>
            )}
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
          Cargando...
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
