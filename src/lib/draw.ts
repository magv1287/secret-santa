export interface DrawParticipant {
  id: string;
  exclusions: string[];
}

export function runSecretSantaDraw(
  participants: DrawParticipant[]
): Map<string, string> | null {
  if (participants.length < 3) return null;

  const sorted = [...participants].sort(
    (a, b) => b.exclusions.length - a.exclusions.length
  );

  const allIds = participants.map((p) => p.id);
  const used = new Set<string>();
  const result = new Map<string, string>();

  function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function backtrack(index: number): boolean {
    if (index === sorted.length) return true;

    const current = sorted[index];
    const excludedSet = new Set([current.id, ...current.exclusions]);

    const candidates = shuffle(
      allIds.filter((id) => !used.has(id) && !excludedSet.has(id))
    );

    for (const candidateId of candidates) {
      used.add(candidateId);
      result.set(current.id, candidateId);

      if (backtrack(index + 1)) {
        return true;
      }

      used.delete(candidateId);
      result.delete(current.id);
    }

    return false;
  }

  return backtrack(0) ? result : null;
}
