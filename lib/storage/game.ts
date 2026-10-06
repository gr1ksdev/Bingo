"use client";
import { createStore } from "./store";
import { createUnsignedCard } from "@/lib/bingo/generate-card";
import { isUnsignedCard } from "@/lib/bingo/token";
import { isDrawn } from "@/lib/bingo/draw-ball";
import { COLORS, DEFAULT_COLOR, PATTERN_LABELS } from "@/lib/bingo/constants";
import type { Game, Player, Stroke } from "@/lib/bingo/types";
import {
  MAX_STROKES,
  MAX_STROKE_POINTS,
  MAX_DRAWING_POINTS,
} from "@/lib/drawing";
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const isColor = (v: unknown): v is string =>
  typeof v === "string" && COLORS.some((c) => c.hex === v);
function isStroke(v: unknown): v is Stroke {
  return (
    isObject(v) &&
    typeof v.id === "string" &&
    v.id.length <= 64 &&
    isColor(v.color) &&
    typeof v.width === "number" &&
    v.width >= 0.001 &&
    v.width <= 0.1 &&
    (v.tool === "pen" || v.tool === "eraser") &&
    Array.isArray(v.points) &&
    v.points.length > 0 &&
    v.points.length <= MAX_STROKE_POINTS &&
    v.points.every(
      (p) =>
        isObject(p) &&
        typeof p.x === "number" &&
        Number.isFinite(p.x) &&
        p.x >= 0 &&
        p.x <= 1 &&
        typeof p.y === "number" &&
        Number.isFinite(p.y) &&
        p.y >= 0 &&
        p.y <= 1,
    )
  );
}
function isPlayer(v: unknown): v is Player {
  return (
    isObject(v) &&
    v.v === 1 &&
    isUnsignedCard(v.card) &&
    isColor(v.color) &&
    isObject(v.marks) &&
    Object.entries(v.marks).every(
      ([key, c]) =>
        /^(?:[0-9]|1[0-9]|2[0-4])$/.test(key) && key !== "12" && isColor(c),
    ) &&
    Array.isArray(v.strokes) &&
    v.strokes.length <= MAX_STROKES &&
    v.strokes.every(isStroke) &&
    v.strokes.reduce(
      (total, stroke: Stroke) => total + stroke.points.length,
      0,
    ) <= MAX_DRAWING_POINTS
  );
}
function isGame(v: unknown): v is Game {
  return (
    isObject(v) &&
    v.v === 1 &&
    typeof v.id === "string" &&
    /^[\w-]{1,64}$/.test(v.id) &&
    isDrawn(v.drawn) &&
    typeof v.startedAt === "number" &&
    Number.isSafeInteger(v.startedAt) &&
    typeof v.pattern === "string" &&
    Object.hasOwn(PATTERN_LABELS, v.pattern)
  );
}
export const newGame = (): Game => ({
  v: 1,
  id: crypto.randomUUID().slice(0, 8).toUpperCase(),
  drawn: [],
  startedAt: Date.now(),
  pattern: "line",
});
export const playerStore = createStore<Player>(
  "bingo:player:v1",
  () => ({
    v: 1,
    card: createUnsignedCard(),
    color: DEFAULT_COLOR,
    marks: {},
    strokes: [],
  }),
  isPlayer,
);
export const gameStore = createStore<Game>("bingo:game:v1", newGame, isGame);
