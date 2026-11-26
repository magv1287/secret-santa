"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  Plus,
  Trash2,
  ShieldCheck,
  Copy,
  Check,
  Users,
  Sparkles,
  Ban,
} from "lucide-react";
import { detectDeviceLang, translations, type Lang } from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState<string[]>(["", "", ""]);
  const [exclusions, setExclusions] = useState<Array<[number, number]>>([]);
  const [exclA, setExclA] = useState<string>("");
  const [exclB, setExclB] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    groupId: string;
    adminToken: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setLang(detectDeviceLang());
  }, []);

  const validParticipants = participants
    .map((p, i) => ({ name: p.trim(), idx: i }))
    .filter((p) => p.name.length > 0);

  function addParticipant() {
    setParticipants([...participants, ""]);
  }

  function updateParticipant(index: number, value: string) {
    const next = [...participants];
    next[index] = value;
    setParticipants(next);
  }

  function removeParticipant(index: number) {
    if (participants.length <= 3) return;
    setParticipants(participants.filter((_, i) => i !== index));
    setExclusions([]);
  }

  function addExclusion() {
    const a = Number(exclA);
    const b = Number(exclB);
    if (isNaN(a) || isNaN(b) || exclA === "" || exclB === "" || a === b) return;
    const exists = exclusions.some(
      ([x, y]) => (x === a && y === b) || (x === b && y === a)
    );
    if (!exists) {
      setExclusions([...exclusions, [a, b]]);
    }
    setExclA("");
    setExclB("");
  }

  function removeExclusion(index: number) {
    setExclusions(exclusions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanList: string[] = [];
      const indexMap = new Map<number, number>();
      participants.forEach((p, idx) => {
        const trimmed = p.trim();
        if (trimmed) {
          indexMap.set(idx, cleanList.length);
          cleanList.push(trimmed);
        }
      });

      const mappedExclusions: Array<[number, number]> = [];
      for (const [a, b] of exclusions) {
        const na = indexMap.get(a);
        const nb = indexMap.get(b);
        if (na !== undefined && nb !== undefined && na !== nb) {
          mappedExclusions.push([na, nb]);
        }
      }

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          budget,
          eventDate,
          notes,
          participants: cleanList,
          exclusions: mappedExclusions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.createGroupError);
      } else {
        setCreated(data);
      }
    } catch {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const langToggle = (
    <div className="mb-4 flex justify-end">
      <button
        type="button"
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white"
      >
        {lang === "es" ? "EN" : "ES"}
      </button>
    </div>
  );

  if (created) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const groupUrl = `${origin}/g/${created.groupId}`;
    const adminUrl = `${origin}/g/${created.groupId}/admin?token=${created.adminToken}`;
    const whatsappMsg = t.whatsappMessage(name, groupUrl);

    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        {langToggle}
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {t.createdTitle}
              </h1>
              <p className="text-sm text-slate-400">{t.createdSubtitle}</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {t.groupLinkTitle}
              </p>
              <p className="mb-3 break-all text-sm text-slate-200">{groupUrl}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyText("group", groupUrl)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  {copiedKey === "group" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedKey === "group" ? t.copied : t.copyLink}
                </button>
                <button
                  onClick={() => copyText("wa", whatsappMsg)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  {copiedKey === "wa" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedKey === "wa" ? t.copiedWhatsApp : t.copyWhatsApp}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                {t.adminLinkTitle}
              </p>
              <p className="mb-2 text-xs text-slate-400">{t.adminLinkDesc}</p>
              <p className="mb-3 break-all text-xs text-slate-300">{adminUrl}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyText("admin", adminUrl)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
                >
                  {copiedKey === "admin" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copiedKey === "admin" ? t.copied : t.copyAdminLink}
                </button>
                <a
                  href={adminUrl}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
                >
                  {t.openAdminPanel}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {langToggle}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
          <Gift className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          {t.homeTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{t.homeSubtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {t.groupNameLabel}
            </label>
            <input
              type="text"
              required
              placeholder={t.groupNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                {t.budgetLabel}
              </label>
              <input
                type="text"
                placeholder={t.budgetPlaceholder}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                {t.eventDateLabel}
              </label>
              <input
                type="text"
                placeholder={t.eventDatePlaceholder}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {t.notesLabel}
            </label>
            <textarea
              rows={2}
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4 text-rose-400" />
              {t.participantsLabel} ({validParticipants.length})
            </label>
            <button
              type="button"
              onClick={addParticipant}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" /> {t.addPerson}
            </button>
          </div>

          <div className="space-y-2.5">
            {participants.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`${t.participantPlaceholder} ${idx + 1}`}
                  value={p}
                  onChange={(e) => updateParticipant(idx, e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                />
                {participants.length > 3 && (
                  <button
                    type="button"
                    onClick={() => removeParticipant(idx)}
                    className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:border-rose-500/40 hover:text-rose-400"
                    title={t.removeTitle}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {validParticipants.length >= 4 && (
          <div className="border-t border-slate-800 pt-5">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <Ban className="h-4 w-4 text-amber-400" />
              {t.exclusionsTitle}
            </label>
            <p className="mb-3 text-xs text-slate-400">
              {t.exclusionsSubtitle}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={exclA}
                onChange={(e) => setExclA(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="">{t.selectPerson1}</option>
                {validParticipants.map((p) => (
                  <option key={p.idx} value={p.idx}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={exclB}
                onChange={(e) => setExclB(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="">{t.selectPerson2}</option>
                {validParticipants.map((p) => (
                  <option key={p.idx} value={p.idx}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addExclusion}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                {t.addBtn}
              </button>
            </div>

            {exclusions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {exclusions.map(([a, b], i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                  >
                    {participants[a]} ↔ {participants[b]}
                    <button
                      type="button"
                      onClick={() => removeExclusion(i)}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500 disabled:opacity-50"
        >
          <ShieldCheck className="h-5 w-5" />
          {loading ? t.creatingBtn : t.createBtn}
        </button>
      </form>
    </main>
  );
}
