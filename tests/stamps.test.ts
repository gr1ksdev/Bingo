import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addStamp,
  createStamp,
  isCardStamp,
  normalizeArt,
  removeStamp,
  STAMP_TYPES,
} from "../lib/stamps";
import { createUnsignedCard } from "../lib/bingo/generate-card";
import { encodeUnsigned, parseToken } from "../lib/bingo/token";
import { signCard, verifyToken } from "../lib/bingo/token/signed.server";
import { isPlayer } from "../lib/storage/game";
import { getOrganicMarkStyle } from "../components/bingo/BingoCell";
const color = "#2374cc";
import type { Player } from "../lib/bingo/types";
const player = (): Player => ({
  v: 1 as const,
  card: createUnsignedCard(),
  color,
  marks: {},
  strokes: [],
  stamps: [],
  selectedTool: "mark" as const,
});
test("Legacy player defaults to mark and empty stamps without losing state", () => {
  const p = player();
  const { stamps, selectedTool, ...old } = p;
  void stamps;
  void selectedTool;
  const restored = normalizeArt(old);
  assert.deepEqual(restored, p);
  assert.ok(isPlayer(restored));
});
for (const type of STAMP_TYPES)
  test(`Apply and restore ${type} with selected color and stable organic parameters`, () => {
    const p = player();
    const s = createStamp(12, type, color);
    assert.ok(isCardStamp(s));
    const next = addStamp(p, s);
    assert.equal(next.stamps[0].color, color);
    assert.deepEqual(next.card, p.card);
    assert.deepEqual(next.marks, p.marks);
    assert.deepEqual(JSON.parse(JSON.stringify(next)), next);
    assert.ok(isPlayer(JSON.parse(JSON.stringify(next))));
  });
test("Tool and color selection are independent and persisted", () => {
  const p = { ...player(), selectedTool: "heart" as const };
  const changed = { ...p, color: "#813bb8" };
  assert.equal(changed.selectedTool, "heart");
  assert.equal(JSON.parse(JSON.stringify(changed)).selectedTool, "heart");
  assert.equal(
    createStamp(0, changed.selectedTool, changed.color).color,
    changed.color,
  );
});
test("Eraser removes one stamp and preserves other ink", () => {
  const p = {
    ...player(),
    stamps: [createStamp(0, "heart", color), createStamp(0, "cat", color)],
    marks: { 0: color },
  };
  const erased = removeStamp(p, p.stamps[1].id);
  assert.deepEqual(erased.stamps, [p.stamps[0]]);
  assert.deepEqual(erased.marks, p.marks);
  assert.deepEqual(erased.card, p.card);
});
test("Stamp count is bounded per cell", () => {
  let p = { ...player(), stamps: [createStamp(0, "heart", color)] };
  for (let i = 0; i < 20; i++) p = addStamp(p, createStamp(0, "star", color));
  assert.equal(p.stamps.length, 3);
});
test("Malformed persisted stamp and tool are rejected", () => {
  assert.equal(isPlayer({ ...player(), selectedTool: "unknown" }), false);
  assert.equal(
    isPlayer({
      ...player(),
      stamps: [{ ...createStamp(0, "cat", color), scale: NaN }],
    }),
    false,
  );
});
test("Unsigned token excludes local cosmetic state", () => {
  const p = addStamp(player(), createStamp(0, "heart", color));
  const decoded = parseToken(encodeUnsigned(p.card)).payload;
  assert.deepEqual(decoded, p.card);
  assert.equal(Object.hasOwn(decoded, "stamps"), false);
});
test("Signed token keeps authoritative identity and excludes stamps", () => {
  const secret = "a".repeat(32);
  const p = addStamp(player(), createStamp(0, "flower", color));
  const card = {
    v: 1 as const,
    cid: "card-1",
    gid: "local",
    uid: 123,
    name: "Pessoa",
    nums: p.card.nums,
    iat: 1700000000,
  };
  const result = verifyToken(signCard(card, secret), secret);
  assert.equal(result.valid, true);
  assert.equal(JSON.stringify(result).includes("stamps"), false);
  assert.deepEqual(p.card.nums, card.nums);
  assert.deepEqual(result.payload, card);
});
test("Organic mark still remains stable alongside decorative stamps", () => {
  assert.deepEqual(
    getOrganicMarkStyle(0, 5, color),
    getOrganicMarkStyle(0, 5, color),
  );
});
test("Player removes local Bingo action and messages while keeping rule utilities", () => {
  const source = readFileSync("components/bingo/PlayerScreen.tsx", "utf8");
  for (const obsolete of [
    "callBingo",
    "bingo-button",
    "Conferência local",
    "De olho na próxima pedra",
    "Nenhum pedido",
  ])
    assert.equal(source.includes(obsolete), false);
  assert.ok(
    readFileSync("lib/bingo/validation.ts", "utf8").includes("validateBingo"),
  );
});
