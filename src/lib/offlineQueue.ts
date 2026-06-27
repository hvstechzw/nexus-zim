// Durable offline write queue for the live scorer. When an official score can't
// reach Supabase (no signal at the venue), the operation is parked in
// localStorage and replayed on reconnect — so scoring never blocks and nothing
// is lost. Pure over localStorage, so it's unit-testable.

export interface QueuedOp {
  id: string;
  ts: number;
  table: string;
  action: "insert" | "update";
  payload: Record<string, unknown>;
  /** For updates: the row match, e.g. { id: fixtureId }. */
  match?: Record<string, unknown>;
}

const KEY = "nexus-offline-queue-v1";

function read(): QueuedOp[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(ops: QueuedOp[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ops));
  } catch {
    /* storage full / unavailable — best effort */
  }
}

export function enqueue(op: Omit<QueuedOp, "id" | "ts">): QueuedOp {
  const full: QueuedOp = {
    ...op,
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
  };
  write([...read(), full]);
  return full;
}

/** Queued ops, oldest first (replay order). */
export function queued(): QueuedOp[] {
  return read().sort((a, b) => a.ts - b.ts);
}

export function queueSize(): number {
  return read().length;
}

export function removeOp(id: string): void {
  write(read().filter((o) => o.id !== id));
}

export function clearQueue(): void {
  write([]);
}
