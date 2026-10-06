import test from "node:test";
import assert from "node:assert/strict";
import { generateCard } from "../lib/bingo/generate-card";
import {
  decodeBase64Url,
  encodeBase64Url,
  encodeUnsigned,
  parseToken,
} from "../lib/bingo/token";
const card = {
  v: 1 as const,
  name: "João ✦",
  nums: generateCard(() => 0),
  createdAt: 1234567,
};
test("Base64URL roundtrip preserva UTF-8 e não produz padding", () => {
  for (const text of ["Bingo", "João 🖍️ 日本語", JSON.stringify(card)]) {
    const encoded = encodeBase64Url(text);
    assert.match(encoded, /^[\w-]+$/);
    assert.equal(decodeBase64Url(encoded), text);
  }
});
test("Base64URL recusa formato não canônico, UTF-8 inválido e tamanho excessivo", () => {
  for (const bad of [
    "",
    "a",
    "====",
    "Zg==",
    "Z+g",
    "Zh",
    "_w",
    "x".repeat(4097),
  ])
    assert.throws(() => decodeBase64Url(bad));
});
test("token unsigned reconstrói cartela sem declarar confiança", () => {
  const token = encodeUnsigned(card);
  const parsed = parseToken(token);
  assert.equal(parsed.kind, "unsigned");
  assert.deepEqual(parsed.payload, card);
  assert.deepEqual(parseToken(` ${token}\n`).payload, card);
});
test("parser rejeita versão, campos, números e formatos inválidos", () => {
  const payloads = [
    { ...card, v: 2 },
    { ...card, nums: [] },
    { ...card, name: "" },
    { ...card, createdAt: -1 },
    { ...card, nums: card.nums.map((n, i) => (i === 5 ? card.nums[0] : n)) },
    { ...card, nums: card.nums.map((n, i) => (i === 0 ? 16 : n)) },
  ];
  payloads.forEach((p) =>
    assert.throws(() =>
      parseToken(`BNG1U.${encodeBase64Url(JSON.stringify(p))}`),
    ),
  );
  for (const bad of [
    "BNG2U.abc",
    "BNG1U",
    "BNG1U.e30.extra",
    "BNG1S.e30",
    "BNG1U.%%%%",
    `BNG1U.${encodeBase64Url("not json")}`,
    "x".repeat(4601),
  ])
    assert.throws(() => parseToken(bad));
});
test("signed parsing apenas identifica estrutura; autenticidade exige servidor", () => {
  const signed = {
    v: 1,
    uid: 123,
    gid: "local",
    cid: "test",
    nums: card.nums,
    iat: 123,
  };
  const token = `BNG1S.${encodeBase64Url(JSON.stringify(signed))}.${"A".repeat(43)}`;
  assert.equal(parseToken(token).kind, "signed");
  assert.throws(() => parseToken(token.replace(/A+$/, "short")));
  assert.throws(() =>
    parseToken(
      `BNG1S.${encodeBase64Url(JSON.stringify({ ...signed, uid: -1 }))}.${"A".repeat(43)}`,
    ),
  );
});
