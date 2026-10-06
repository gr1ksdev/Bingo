import test from "node:test";
import assert from "node:assert/strict";
import { drawBall, isDrawn } from "../lib/bingo/draw-ball";
import { generateCard } from "../lib/bingo/generate-card";
import { validateBingo } from "../lib/bingo/validation";
import { ballLabel } from "../lib/bingo/constants";
test("sorteio esgota exatamente 75 pedras sem repetir", () => {
  const drawn: number[] = [];
  for (let i = 0; i < 75; i++) {
    const ball = drawBall(drawn);
    assert.ok(ball !== null && !drawn.includes(ball));
    drawn.push(ball);
  }
  assert.equal(new Set(drawn).size, 75);
  assert.equal(drawBall(drawn), null);
  assert.deepEqual(
    [...drawn].sort((a, b) => a - b),
    Array.from({ length: 75 }, (_, i) => i + 1),
  );
});
test("históricos inválidos são recusados", () => {
  for (const bad of [[1, 1], [0], [76], [1.5], [NaN]]) {
    assert.equal(isDrawn(bad), false);
    assert.throws(() => drawBall(bad));
  }
});
test("letras e zeros de pedras respeitam fronteiras", () => {
  assert.deepEqual([1, 15, 16, 30, 31, 45, 46, 60, 61, 75].map(ballLabel), [
    "B-01",
    "B-15",
    "I-16",
    "I-30",
    "N-31",
    "N-45",
    "G-46",
    "G-60",
    "O-61",
    "O-75",
  ]);
});
const nums = generateCard(() => 0);
const at = (indices: number[]) =>
  indices.map((i) => nums[i]).filter((n): n is number => n !== null);
test("linha horizontal depende das pedras, incluindo FREE automático", () => {
  assert.equal(validateBingo(nums, []).won, false);
  const middle = at([10, 11, 12, 13, 14]);
  assert.equal(middle.length, 4);
  assert.equal(validateBingo(nums, middle).won, true);
  assert.equal(validateBingo(nums, middle.slice(0, 3)).won, false);
  assert.equal(
    validateBingo(nums, middle.slice(0, 3)).closest.missing.length,
    1,
  );
});
test("cada regra reconhece sua combinação e não confunde coluna com linha", () => {
  const column = at([0, 5, 10, 15, 20]);
  assert.equal(validateBingo(nums, column, "column").won, true);
  assert.equal(validateBingo(nums, column, "line").won, false);
  assert.equal(
    validateBingo(nums, at([0, 6, 12, 18, 24]), "diagonal").won,
    true,
  );
  assert.equal(validateBingo(nums, at([0, 4, 20, 24]), "corners").won, true);
  const all = nums.filter((n): n is number => n !== null);
  assert.equal(validateBingo(nums, all, "full").won, true);
  assert.equal(validateBingo(nums, all.slice(0, -1), "full").won, false);
});
test("validador rejeita dados inválidos", () => {
  assert.throws(() => validateBingo([], []));
  assert.throws(() => validateBingo(nums, [1, 1]));
});
