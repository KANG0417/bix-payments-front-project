const EDITED_POST_IDS_KEY = "edited_ids";

function readEditedIds() {
  if (typeof window === "undefined") return [] as number[];

  try {
    const raw = window.localStorage.getItem(EDITED_POST_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
  } catch {
    return [];
  }
}

function writeEditedIds(ids: number[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(EDITED_POST_IDS_KEY, JSON.stringify(ids));
  } catch {
    // no-op
  }
}

export function markLocallyEditedPost(postId: number) {
  if (!Number.isFinite(postId) || postId <= 0) return;

  const ids = readEditedIds();
  if (!ids.includes(postId)) {
    ids.push(postId);
    writeEditedIds(ids);
  }
}

export function isLocallyEditedPost(postId: number) {
  if (!Number.isFinite(postId) || postId <= 0) return false;
  return readEditedIds().includes(postId);
}
