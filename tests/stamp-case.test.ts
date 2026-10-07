import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addStamp,
  createStamp,
  isSelectedTool,
  normalizeArt,
  removeStamp,
  setStampCaseOpen,
} from "../lib/stamps";
import { isPlayer } from "../lib/storage/game";
import { createUnsignedCard } from "../lib/bingo/generate-card";
import type { Player } from "../lib/bingo/types";
const initial = (): Player => ({
  v: 1,
  card: createUnsignedCard(),
  color: "#2374cc",
  marks: { 0: "#2374cc" },
  strokes: [
    {
      id: "stroke",
      color: "#2374cc",
      width: 0.01,
      tool: "pen",
      points: [{ x: 0.2, y: 0.3 }],
    },
  ],
  stamps: [createStamp(1, "heart", "#2374cc")],
  selectedTool: "star",
  stampCaseOpen: true,
});
test("Legacy storage without case state defaults open and preserves every existing field", () => {
  const p = initial();
  const { stampCaseOpen, ...old } = p;
  void stampCaseOpen;
  const loaded = normalizeArt(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(loaded, p);
  assert.ok(isPlayer(loaded));
});
test("Old pre-stamp storage gains only local defaults", () => {
  const { stamps, selectedTool, stampCaseOpen, ...old } = initial();
  void stamps;
  void selectedTool;
  void stampCaseOpen;
  const p = normalizeArt(old) as Player;
  assert.deepEqual(p.card, old.card);
  assert.deepEqual(p.strokes, old.strokes);
  assert.deepEqual(p.marks, old.marks);
  assert.deepEqual(p.stamps, []);
  assert.equal(p.stampCaseOpen, true);
  assert.equal(p.selectedTool, "mark");
});
for (const open of [false, true])
  test(`Case ${open ? "open" : "closed"} survives serialization without changing held tool, color, stamps or paper`, () => {
    const p = initial();
    const next = setStampCaseOpen(p, open);
    const restored = normalizeArt(JSON.parse(JSON.stringify(next)));
    assert.deepEqual(restored, { ...p, stampCaseOpen: open });
    assert.ok(isPlayer(restored));
  });
test("Stamp continues to apply while case is closed", () => {
  const p = setStampCaseOpen(initial(), false);
  const next = addStamp(p, createStamp(2, p.selectedTool as "star", p.color));
  assert.equal(next.stampCaseOpen, false);
  assert.equal(next.stamps.at(-1)?.type, "star");
  assert.equal(next.stamps.at(-1)?.color, p.color);
  assert.deepEqual(next.card, p.card);
});
test("Invalid persisted case state is rejected", () => {
  assert.equal(isPlayer({ ...initial(), stampCaseOpen: "closing" }), false);
});
for (const tool of ["smile", "moon", "clover", "lightning", "crown"] as const) {
  test(`New ${tool} is selectable, applies, persists and erases independently`, () => {
    assert.equal(isSelectedTool(tool), true);
    const p = initial();
    const next = addStamp(p, createStamp(12, tool, p.color));
    assert.ok(isPlayer(next));
    assert.equal(next.stamps.at(-1)?.type, tool);
    assert.deepEqual(JSON.parse(JSON.stringify(next.stamps)), next.stamps);
    const erased = removeStamp(next, next.stamps.at(-1)!.id);
    assert.deepEqual(erased, p);
  });
  test(`New ${tool} still obeys three stamps per cell`, () => {
    let p = initial();
    for (let i = 0; i < 8; i++) p = addStamp(p, createStamp(24, tool, p.color));
    assert.equal(p.stamps.filter((s) => s.cellIndex === 24).length, 3);
  });
}
test("Every old stamp keeps its seed and visual parameters when case state changes", () => {
  const p = initial();
  assert.deepEqual(
    setStampCaseOpen(setStampCaseOpen(p, false), true).stamps,
    p.stamps,
  );
});
test("Case exposes accessible pull labels, controls and reduced-motion presentation", () => {
  const source = readFileSync("components/bingo/StampCase.tsx", "utf8");
  assert.ok(source.includes("open = true"));
  assert.ok(source.includes("aria-expanded={open}"));
  assert.ok(source.includes("aria-controls={contentId}"));
  assert.ok(source.includes("Fechar estojo de carimbos"));
  assert.ok(source.includes("Abrir estojo de carimbos"));
  assert.ok(source.includes("inert={!open}"));
  const css = readFileSync("app/globals.css", "utf8");
  assert.ok(css.includes("prefers-reduced-motion: reduce"));
  assert.ok(
    css.includes(
      ".case-pull, .case-closed, .case-open { transition: none !important; }",
    ),
  );
});
