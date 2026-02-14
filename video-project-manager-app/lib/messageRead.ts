const namespace = "vpm:lastSeen";

function getStorageKey(userId: string, projectId: string) {
  return `${namespace}:${userId}:${projectId}`;
}

export function getLastSeenAt(userId: string, projectId: string) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getStorageKey(userId, projectId));
}

export function setLastSeenAt(userId: string, projectId: string, timestamp: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId, projectId), timestamp);
}

export function isUnread(userId: string, projectId: string, createdAt: string) {
  const lastSeenAt = getLastSeenAt(userId, projectId);
  if (!lastSeenAt) return true;
  const seen = new Date(lastSeenAt).getTime();
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(seen) || Number.isNaN(created)) return false;
  return created > seen;
}
