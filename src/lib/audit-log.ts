export type AuditEvent = {
  id: string;
  at: string;
  kind: string;
  actor: string;
  target: string;
  meta?: Record<string, unknown>;
};

const AUDIT_STORAGE_KEY = 'folio-audit-events';
const MAX_AUDIT_EVENTS = 500;

export function loadAuditEvents(): AuditEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendAuditEvent(
  kind: string,
  actor: string,
  target: string,
  meta: Record<string, unknown> = {},
): AuditEvent[] {
  if (typeof window === 'undefined') return [];

  const nextEvent: AuditEvent = {
    id: `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    kind,
    actor,
    target,
    meta,
  };

  const next = [nextEvent, ...loadAuditEvents()].slice(0, MAX_AUDIT_EVENTS);
  try {
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}
