import test from "node:test";
import assert from "node:assert/strict";
import {
  createUnsignedCard,
  generateCard,
  isCardNumbers,
} from "../lib/bingo/generate-card";
import { randomInt } from "../lib/bingo/random";
test("500 cartelas respeitam todos os ranges, unicidade e casa livre", () => {
  const distinct = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const card = generateCard();
    assert.equal(card.length, 25);
    assert.equal(card[12], null);
    assert.equal(new Set(card.filter((n) => n !== null)).size, 24);
    card.forEach((n, index) => {
      if (index !== 12) {
        const start = (index % 5) * 15 + 1;
        assert.ok(n !== null && n >= start && n <= start + 14);
      }
    });
    assert.equal(isCardNumbers(card), true);
    distinct.add(JSON.stringify(card));
  }
  assert.equal(distinct.size, 500);
});
test("geração aceita fonte determinística sem depender da UI", () => {
  const card = generateCard(() => 0);
  assert.deepEqual(card.slice(0, 5), [1, 16, 31, 46, 61]);
  assert.deepEqual(card.slice(10, 15), [3, 18, null, 48, 63]);
});
test("schema rejeita duplicação, coluna incorreta, frações e centro preenchido", () => {
  const card = generateCard();
  for (const [index, value] of [
    [5, card[0]],
    [0, 16],
    [0, 1.2],
    [12, 33],
    [0, null],
  ] as const) {
    const bad = [...card];
    bad[index] = value;
    assert.equal(isCardNumbers(bad), false);
  }
  assert.equal(isCardNumbers(card.slice(0, 24)), false);
  assert.equal(isCardNumbers("card"), false);
});
test("nome de cartela é limitado e não vazio", () => {
  assert.equal(createUnsignedCard("   ").name, "Visitante");
  assert.equal(createUnsignedCard("x".repeat(100)).name.length, 60);
});
test("Web Crypto retorna índice válido e rejeita limites inválidos", () => {
  assert.equal(randomInt(1), 0);
  for (let i = 0; i < 100; i++) {
    const n = randomInt(75);
    assert.ok(n >= 0 && n < 75 && Number.isInteger(n));
  }
  for (const bad of [0, -1, 2.2, NaN, Infinity, 0x100000001])
    assert.throws(() => randomInt(bad));
});
