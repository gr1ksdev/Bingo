import { COLORS } from "./bingo/constants";
export const STAMP_TYPES = [
  "heart",
  "star",
  "paw",
  "cat",
  "flower",
  "spiral",
] as const;
export type StampType = (typeof STAMP_TYPES)[number];
export type SelectedTool = "mark" | "freehand" | "eraser" | StampType;
export type CardStamp = {
  id: string;
  cellIndex: number;
  type: StampType;
  color: string;
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
  seed: number;
  createdAt: number;
};
export const MAX_STAMPS = 150;
export const TOOL_LABELS: Record<SelectedTool, string> = {
  mark: "Marcar",
  freehand: "Livre",
  eraser: "Borracha",
  heart: "coração",
  star: "estrela",
  paw: "patinha",
  cat: "gatinho",
  flower: "flor",
  spiral: "espiral",
};
export function isSelectedTool(v: unknown): v is SelectedTool {
  return typeof v === "string" && Object.hasOwn(TOOL_LABELS, v);
}
export function isCardStamp(v: unknown): v is CardStamp {
  if (!v || typeof v !== "object") return false;
  const s = v as CardStamp;
  return (
    typeof s.id === "string" &&
    s.id.length > 0 &&
    s.id.length <= 64 &&
    Number.isInteger(s.cellIndex) &&
    s.cellIndex >= 0 &&
    s.cellIndex < 25 &&
    STAMP_TYPES.includes(s.type) &&
    COLORS.some((c) => c.hex === s.color) &&
    Number.isSafeInteger(s.createdAt) &&
    s.createdAt >= 0 &&
    Number.isInteger(s.seed) &&
    s.seed >= 0 &&
    s.seed <= 65535 &&
    Number.isFinite(s.rotation) &&
    Math.abs(s.rotation) <= 5 &&
    Number.isFinite(s.scale) &&
    s.scale >= 0.85 &&
    s.scale <= 1 &&
    Number.isFinite(s.offsetX) &&
    Math.abs(s.offsetX) <= 3 &&
    Number.isFinite(s.offsetY) &&
    Math.abs(s.offsetY) <= 3 &&
    Number.isFinite(s.opacity) &&
    s.opacity >= 0.4 &&
    s.opacity <= 0.65
  );
}
export function createStamp(
  cellIndex: number,
  type: StampType,
  color: string,
): CardStamp {
  const seed = crypto.getRandomValues(new Uint16Array(1))[0];
  return {
    id: crypto.randomUUID(),
    cellIndex,
    type,
    color,
    seed,
    rotation: (seed % 11) - 5,
    scale: 0.88 + (seed % 9) / 100,
    offsetX: (seed % 5) - 2,
    offsetY: ((seed >> 3) % 5) - 2,
    opacity: 0.46 + (seed % 12) / 100,
    createdAt: Date.now(),
  };
}
export function addStamp<T extends { stamps: CardStamp[] }>(
  p: T,
  stamp: CardStamp,
): T {
  if (
    p.stamps.length >= MAX_STAMPS ||
    p.stamps.filter((s) => s.cellIndex === stamp.cellIndex).length >= 3
  )
    return p;
  return { ...p, stamps: [...p.stamps, stamp] };
}
export function removeStamp<T extends { stamps: CardStamp[] }>(
  p: T,
  id: string,
): T {
  return { ...p, stamps: p.stamps.filter((s) => s.id !== id) };
}
export function normalizeArt(v: unknown): unknown {
  if (!v || typeof v !== "object" || Array.isArray(v)) return v;
  const p = v as Record<string, unknown>;
  return {
    ...p,
    stamps: p.stamps ?? [],
    selectedTool: p.selectedTool ?? "mark",
  };
}
