"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Gift,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  LogOut,
  Save,
  Check,
  Calendar,
  Wallet,
  Sparkles,
} from "lucide-react";

interface GroupInfo {
  id: string;
  name: string;
  budget: string;
  eventDate: string;
  notes: string;
}

interface ParticipantItem {
  id: string;
  name: string;
  claimed: boolean;
}

interface SessionInfo {
  participantId: string;
  name: string;
  wishlist: string;
  assignedTo: {
    name: string;
    wishlist: string;
  } | null;
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Modal state
  const [selected, setSelected] = useState<ParticipantItem | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dashboard state
  const [revealed, setRevealed] = useState(false);
  const [myWishlist, setMyWishlist] = useState("");
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setPageError(data.error || "No se pudo cargar el grupo.");
        return;
      }
      setGroup(data.group);
      setParticipants(data.participants);
      setSession(data.session);
      if (data.session) {
        setMyWishlist(data.session.wishlist || "");
      }
    } catch {
      setPageError("Error de conexión al cargar el grupo.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setModalError("");

    if (!/^[0-9]{4}$/.test(pin)) {
      setModalError("El PIN debe ser de exactamente 4 números.");
      return;
    }

    if (!selected.claimed && pin !== confirmPin) {
      setModalError("Los dos PIN no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = selected.claimed
        ? `/api/groups/${groupId}/login`
        : `/api/groups/${groupId}/claim`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: selected.id, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Error al entrar.");
      } else {
        setSelected(null);
        setPin("");
        setConfirmPin("");
        await loadGroup();
      }
    } catch {
      setModalError("Error de conexión.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveWishlist() {
    setSavingWishlist(true);
    setSavedOk(false);
    try {
      const res = await fetch(`/api/groups/${groupId}/wishlist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlist: myWishlist }),
      });
      if (res.ok) {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2500);
      }
    } finally {
      setSavingWishlist(false);
    }
  }

  async function handleLogout() {
    await fetch(`/api/groups/${groupId}/logout`, { method: "POST" });
    setSession(null);
    setRevealed(false);
    await loadGroup();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        Cargando sorteo...
      </main>
    );
  }

  if (pageError || !group) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          {pageError || "Grupo no encontrado."}
        </p>
      </main>
    );
  }

  // Vista autenticada (ya entró con su PIN o con su cookie de 60 días)
  if (session) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              {group.name}
            </p>
            <h1 className="text-2xl font-bold text-white">
              Hola, {session.name} 👋
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </div>

        {/* Detalles del grupo */}
        {(group.budget || group.eventDate || group.notes) && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            <div className="flex flex-wrap gap-4">
              {group.budget && (
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  Presupuesto: <strong className="text-white">{group.budget}</strong>
                </span>
              )}
              {group.eventDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  Fecha: <strong className="text-white">{group.eventDate}</strong>
                </span>
              )}
            </div>
            {group.notes && (
              <p className="mt-2 border-t border-slate-800 pt-2 text-xs text-slate-400">
                {group.notes}
              </p>
            )}
          </div>
        )}

        {/* Tarjeta del Amigo Secreto */}
        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <Gift className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-400">Te tocó regalarle a:</p>

          {revealed ? (
            <div className="mt-3">
              <p className="text-3xl font-extrabold tracking-tight text-white">
                {session.assignedTo?.name}
              </p>

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Lista de deseos de {session.assignedTo?.name}
                </p>
                {session.assignedTo?.wishlist ? (
                  <p className="whitespace-pre-wrap text-sm text-slate-200">
                    {session.assignedTo.wishlist}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-500">
                    Todavía no ha escrito ideas de regalo. Vuelve a revisar más
                    adelante.
                  </p>
                )}
              </div>

              <button
                onClick={() => setRevealed(false)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <EyeOff className="h-3.5 w-3.5" /> Ocultar nombre
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <button
                onClick={() => setRevealed(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500"
              >
                <Eye className="h-4 w-4" /> Tocar para revelar
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Asegúrate de que nadie esté mirando tu pantalla 😉
              </p>
            </div>
          )}
        </div>

        {/* Mi Wishlist */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              Mi lista de deseos (pistas para quien te regala)
            </h2>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            Escribe ideas, tallas, colores o enlaces. Solo la persona a la que
            le tocaste podrá leer esto.
          </p>
          <textarea
            rows={4}
            value={myWishlist}
            onChange={(e) => setMyWishlist(e.target.value)}
            placeholder="Ej: Talla M, me gustan los chocolates oscuros, libros de ciencia ficción..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-emerald-400">
              {savedOk ? "✓ Guardado correctamente" : ""}
            </span>
            <button
              onClick={handleSaveWishlist}
              disabled={savingWishlist}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {savedOk ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingWishlist ? "Guardando..." : "Guardar lista"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Vista pública del grupo (seleccionar nombre)
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
          <Gift className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">{group.name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Toca tu nombre para ver tu Amigo Secreto.
        </p>
        {(group.budget || group.eventDate) && (
          <div className="mt-3 flex justify-center gap-4 text-xs text-slate-300">
            {group.budget && <span>Presupuesto: {group.budget}</span>}
            {group.eventDate && <span>Fecha: {group.eventDate}</span>}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {participants.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSelected(p);
              setPin("");
              setConfirmPin("");
              setModalError("");
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 text-left transition hover:border-rose-500/50 hover:bg-slate-900"
          >
            <span className="text-base font-semibold text-white">{p.name}</span>
            {p.claimed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                <Lock className="h-3 w-3" /> Ya reclamado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                <UserCheck className="h-3 w-3" /> Disponible
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Tu PIN se guarda encriptado y tu sesión queda abierta 60 días en este
        dispositivo. Ni siquiera el organizador puede ver a quién te tocó.
      </p>

      {/* Modal de PIN */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              {selected.claimed
                ? `Entrar como ${selected.name}`
                : `¿Seguro que eres ${selected.name}?`}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {selected.claimed
                ? "Introduce tu PIN de 4 dígitos."
                : "Crea un PIN de 4 dígitos para proteger tu perfil. Nadie más podrá abrirlo."}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  PIN de 4 dígitos
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {!selected.claimed && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Confirma tu PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {modalError && (
                <p className="text-xs text-rose-400">{modalError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {submitting
                    ? "Entrando..."
                    : selected.claimed
                    ? "Entrar"
                    : "Crear PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
