"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Trash2,
  ExternalLink,
  Shield,
  RefreshCw,
  Lock,
} from "lucide-react";

interface GroupRow {
  id: string;
  name: string;
  adminToken: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState("");

  async function loadGroups(keyToUse = adminKey) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/groups", {
        headers: { "x-admin-key": keyToUse },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Acceso denegado.");
        setAuthenticated(false);
        return;
      }
      setGroups(data.groups);
      setAuthenticated(true);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKey.trim()) return;
    await loadGroups(adminKey.trim());
  }

  async function handleDeleteOne(id: string, name: string) {
    if (
      !confirm(
        `¿Seguro que quieres eliminar "${name}" y todos sus participantes?`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/admin/groups?groupId=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { "x-admin-key": adminKey },
        }
      );
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== id));
      } else {
        alert("No se pudo eliminar el grupo.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteAll() {
    if (
      !confirm(
        `⚠️ ¿Seguro que quieres BORRAR TODOS los sorteos (${groups.length}) de la base de datos? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setDeletingAll(true);
    try {
      const res = await fetch("/api/admin/groups?all=true", {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        setGroups([]);
      } else {
        alert("No se pudieron eliminar los grupos.");
      }
    } finally {
      setDeletingAll(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-2 text-amber-400">
            <Lock className="h-5 w-5" />
            <h1 className="text-lg font-bold text-white">Super Admin</h1>
          </div>
          <p className="mb-4 text-xs text-slate-400">
            Introduce tu clave maestra (<code className="text-slate-300">SUPER_ADMIN_KEY</code>) para gestionar todos los sorteos.
          </p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Clave maestra"
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <ShieldAlert className="h-3.5 w-3.5" /> Gestión Global
          </span>
          <h1 className="text-2xl font-bold text-white">
            Todos los sorteos ({groups.length})
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadGroups()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refrescar
          </button>

          {groups.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deletingAll ? "Borrando todos..." : "Borrar TODOS"}
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-sm text-slate-400">
          No hay ningún sorteo en la base de datos.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div
              key={g.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold text-white">{g.name}</p>
                <p className="text-xs text-slate-400">
                  ID: <code className="text-slate-300">{g.id}</code>
                  {g.createdAt && (
                    <> • {new Date(g.createdAt).toLocaleString()}</>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/g/${g.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Grupo
                </a>

                {g.adminToken && (
                  <a
                    href={`/g/${g.id}/admin?token=${encodeURIComponent(
                      g.adminToken
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
                  >
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </a>
                )}

                <button
                  onClick={() => handleDeleteOne(g.id, g.name)}
                  disabled={deletingId === g.id}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingId === g.id ? "Borrando..." : "Borrar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
