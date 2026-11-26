"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Gift,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  Save,
  Check,
  Calendar,
  Wallet,
  Sparkles,
  Mail,
} from "lucide-react";
import { detectDeviceLang, translations, type Lang } from "@/lib/i18n";

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

function GroupContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.groupId as string;
  const magicToken = searchParams.get("t");

  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Modal state
  const [selected, setSelected] = useState<ParticipantItem | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [email, setEmail] = useState("");
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Dashboard state
  const [revealed, setRevealed] = useState(false);
  const [myWishlist, setMyWishlist] = useState("");
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [emailSentBanner, setEmailSentBanner] = useState(false);

  useEffect(() => {
    setLang(detectDeviceLang());
  }, []);

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setPageError(data.error || "Could not load group.");
        return;
      }
      setGroup(data.group);
      setParticipants(data.participants);
      setSession(data.session);
      if (data.session) {
        setMyWishlist(data.session.wishlist || "");
      }
    } catch {
      setPageError("Connection error.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Si llega con ?t=magicToken (desde Brevo), autenticar directo y limpiar URL
  useEffect(() => {
    let active = true;
    async function init() {
      if (magicToken) {
        try {
          await fetch(`/api/groups/${groupId}/magic`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: magicToken }),
          });
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", `/g/${groupId}`);
          }
        } catch {
          // Si falla el token, simplemente cargamos la vista normal
        }
      }
      if (active) {
        await loadGroup();
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [groupId, magicToken, loadGroup]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setModalError("");

    if (!/^[0-9]{4}$/.test(pin)) {
      setModalError(t.pinError4Digits);
      return;
    }

    if (!selected.claimed && pin !== confirmPin) {
      setModalError(t.pinErrorMismatch);
      return;
    }

    const cleanEmail = email.trim();
    if (!selected.claimed && cleanEmail && !cleanEmail.includes("@")) {
      setModalError(t.emailInvalidError);
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
        body: JSON.stringify({
          participantId: selected.id,
          pin,
          email: !selected.claimed ? cleanEmail : undefined,
          lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || t.connectionError);
      } else {
        if (data.emailSent) {
          setEmailSentBanner(true);
        }
        setSelected(null);
        setPin("");
        setConfirmPin("");
        setEmail("");
        await loadGroup();
      }
    } catch {
      setModalError(t.connectionError);
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

  async function handleSwitchPerson() {
    if (!confirm(t.confirmSwitchPerson)) return;
    await fetch(`/api/groups/${groupId}/logout`, { method: "POST" });
    setSession(null);
    setRevealed(false);
    setEmailSentBanner(false);
    await loadGroup();
  }

  const langToggle = (
    <button
      type="button"
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white"
    >
      {lang === "es" ? "EN" : "ES"}
    </button>
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        {t.loadingDraw}
      </main>
    );
  }

  if (pageError || !group) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
          {pageError || t.groupNotFound}
        </p>
      </main>
    );
  }

  // Vista autenticada (directa con cookie de 60 días o magic link)
  if (session) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              {group.name}
            </p>
            <h1 className="text-2xl font-bold text-white">
              {t.helloUser(session.name)}
            </h1>
          </div>
          {langToggle}
        </div>

        {emailSentBanner && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            <Mail className="h-4 w-4 shrink-0" />
            <span>{t.emailSentBanner}</span>
          </div>
        )}

        {(group.budget || group.eventDate || group.notes) && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
            <div className="flex flex-wrap gap-4">
              {group.budget && (
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  {t.budgetPrefix}{" "}
                  <strong className="text-white">{group.budget}</strong>
                </span>
              )}
              {group.eventDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sky-400" />
                  {t.datePrefix}{" "}
                  <strong className="text-white">{group.eventDate}</strong>
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

        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <Gift className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-400">{t.youGot}</p>

          {revealed ? (
            <div className="mt-3">
              <p className="text-3xl font-extrabold tracking-tight text-white">
                {session.assignedTo?.name}
              </p>

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
                  {t.wishlistOf(session.assignedTo?.name || "")}
                </p>
                {session.assignedTo?.wishlist ? (
                  <p className="whitespace-pre-wrap text-sm text-slate-200">
                    {session.assignedTo.wishlist}
                  </p>
                ) : (
                  <p className="text-sm italic text-slate-500">
                    {t.noWishlistYet}
                  </p>
                )}
              </div>

              <button
                onClick={() => setRevealed(false)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <EyeOff className="h-3.5 w-3.5" /> {t.hideName}
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <button
                onClick={() => setRevealed(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 hover:bg-rose-500"
              >
                <Eye className="h-4 w-4" /> {t.tapToReveal}
              </button>
              <p className="mt-2 text-xs text-slate-500">
                {t.makeSureNobodyLooking}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">
              {t.myWishlistTitle}
            </h2>
          </div>
          <p className="mb-3 text-xs text-slate-400">{t.myWishlistDesc}</p>
          <textarea
            rows={4}
            value={myWishlist}
            onChange={(e) => setMyWishlist(e.target.value)}
            placeholder={t.myWishlistPlaceholder}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-emerald-400">
              {savedOk ? t.savedOk : ""}
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
              {savingWishlist ? t.savingBtn : t.saveListBtn}
            </button>
          </div>
        </div>

        {/* Footer discreto en lugar de botón "Salir" arriba */}
        <div className="mt-8 space-y-2 text-center">
          <p className="text-xs text-slate-500">{t.sessionSavedNote}</p>
          <button
            type="button"
            onClick={handleSwitchPerson}
            className="text-xs text-slate-500 underline decoration-slate-700 underline-offset-4 hover:text-slate-300"
          >
            {t.sharedDeviceLink}
          </button>
        </div>
      </main>
    );
  }

  // Vista pública del grupo (seleccionar nombre)
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-2 flex justify-end">{langToggle}</div>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
          <Gift className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">{group.name}</h1>
        <p className="mt-2 text-sm text-slate-400">{t.tapYourName}</p>
        {(group.budget || group.eventDate) && (
          <div className="mt-3 flex justify-center gap-4 text-xs text-slate-300">
            {group.budget && (
              <span>
                {t.budgetPrefix} {group.budget}
              </span>
            )}
            {group.eventDate && (
              <span>
                {t.datePrefix} {group.eventDate}
              </span>
            )}
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
              setEmail("");
              setModalError("");
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 text-left transition hover:border-rose-500/50 hover:bg-slate-900"
          >
            <span className="text-base font-semibold text-white">{p.name}</span>
            {p.claimed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                <Lock className="h-3 w-3" /> {t.claimedBadge}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                <UserCheck className="h-3 w-3" /> {t.availableBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        {t.privacyFooter}
      </p>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              {selected.claimed
                ? t.loginAs(selected.name)
                : t.confirmName(selected.name)}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {selected.claimed ? t.loginDesc : t.claimDesc}
            </p>

            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {t.pinLabel}
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
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      {t.confirmPinLabel}
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

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <Mail className="h-3.5 w-3.5 text-rose-400" />
                      {t.optionalEmailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.optionalEmailPlaceholder}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                    />
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                      {t.optionalEmailHelp}
                    </p>
                  </div>
                </>
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
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {submitting
                    ? t.enteringBtn
                    : selected.claimed
                    ? t.enterBtn
                    : t.createPinBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function GroupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-slate-400">
          Loading...
        </main>
      }
    >
      <GroupContent />
    </Suspense>
  );
}
