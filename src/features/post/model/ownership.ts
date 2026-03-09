import type { AuthUser } from "@entities/user/model/types";

type AnyRecord = Record<string, unknown>;

function normalizeIdentity(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
}

export function parseJwtPayload(token?: string | null): AnyRecord | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(decoded) as AnyRecord;
  } catch {
    return null;
  }
}

export function getMyIdentityCandidates(
  accessToken?: string | null,
  user?: AuthUser | null,
) {
  const jwtPayload = parseJwtPayload(accessToken);

  const values = [
    user?.id,
    user?.email,
    user?.displayName,
    jwtPayload?.sub,
    jwtPayload?.userId,
    jwtPayload?.id,
    jwtPayload?.username,
    jwtPayload?.email,
    jwtPayload?.name,
    jwtPayload?.nickname,
  ];

  return Array.from(
    new Set(values.map(normalizeIdentity).filter(Boolean) as string[]),
  );
}

export function getPostOwnerCandidates(post: AnyRecord) {
  const author = post.author as AnyRecord | undefined;
  const user = post.user as AnyRecord | undefined;
  const member = post.member as AnyRecord | undefined;

  const values = [
    post.writerId,
    post.memberId,
    post.accountId,
    post.authorId,
    post.userId,
    post.ownerId,
    post.username,
    post.userName,
    post.email,
    post.writerEmail,
    post.writer,
    post.name,
    post.nickname,
    post.authorName,
    post.createdBy,
    post.author,
    post.user,
    post.member,
    author?.id,
    author?.username,
    author?.name,
    author?.nickname,
    author?.email,
    user?.id,
    user?.username,
    user?.name,
    user?.nickname,
    user?.email,
    member?.id,
    member?.username,
    member?.name,
    member?.nickname,
    member?.email,
  ];

  return Array.from(
    new Set(values.map(normalizeIdentity).filter(Boolean) as string[]),
  );
}

export function isMinePost(post: AnyRecord, myIdentities: string[]) {
  if (!myIdentities.length) return false;
  const owners = getPostOwnerCandidates(post);
  if (!owners.length) return false;
  return owners.some((owner) => myIdentities.includes(owner));
}
