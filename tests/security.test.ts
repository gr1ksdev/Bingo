import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { generateCard } from "../lib/bingo/generate-card";
import { encodeBase64Url, encodeUnsigned } from "../lib/bingo/token";
import { getSigningSecret, signCard, verifyCard } from "../lib/server/signing";
import { verifyTelegramInitData } from "../lib/server/telegram";
import { readJson } from "../lib/server/request";
const secret = "test-only-secret-with-at-least-32-characters";
const card = {
  v: 1 as const,
  uid: 123456,
  gid: "local",
  cid: "TEST-1",
  nums: generateCard(() => 0),
  iat: 1000000,
};
test("HMAC roundtrip verifica identidade e números", () => {
  const token = signCard(card, secret);
  assert.deepEqual(verifyCard(token, secret), card);
  const parts = token.split(".");
  assert.equal(
    parts[2],
    createHmac("sha256", secret)
      .update(parts.slice(0, 2).join("."))
      .digest("base64url"),
  );
});
test("assinatura recusa adulteração, segredo incorreto e token unsigned", () => {
  const token = signCard(card, secret);
  const parts = token.split(".");
  assert.throws(() => verifyCard(token, "other-secret"));
  assert.throws(() =>
    verifyCard(
      `BNG1S.${encodeBase64Url(JSON.stringify({ ...card, uid: 999 }))}.${parts[2]}`,
      secret,
    ),
  );
  assert.throws(() =>
    verifyCard(`${parts[0]}.${parts[1]}.${"A".repeat(43)}`, secret),
  );
  assert.throws(() =>
    verifyCard(
      encodeUnsigned({ v: 1, name: "X", nums: card.nums, createdAt: 0 }),
      secret,
    ),
  );
  assert.throws(() => signCard(card, "short"));
});
test("configuração ausente ou curta desativa assinatura sem fallback", () => {
  const previous = process.env.BINGO_SIGNING_SECRET;
  try {
    delete process.env.BINGO_SIGNING_SECRET;
    assert.equal(getSigningSecret(), null);
    process.env.BINGO_SIGNING_SECRET = "short";
    assert.equal(getSigningSecret(), null);
  } finally {
    if (previous === undefined) delete process.env.BINGO_SIGNING_SECRET;
    else process.env.BINGO_SIGNING_SECRET = previous;
  }
});
const bot = "123:test-bot-token";
function initData(authDate: number) {
  const values = {
    auth_date: String(authDate),
    query_id: "query-1",
    user: JSON.stringify({ id: 123456, first_name: "João" }),
  };
  const check = Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const key = createHmac("sha256", "WebAppData").update(bot).digest();
  const hash = createHmac("sha256", key).update(check).digest("hex");
  return new URLSearchParams({ ...values, hash }).toString();
}
test("Telegram exige HMAC válido e auth_date recente", () => {
  const data = initData(1000);
  assert.equal(verifyTelegramInitData(data, bot, 1100), 123456);
  assert.throws(() => verifyTelegramInitData(data, "wrong", 1100));
  assert.throws(() =>
    verifyTelegramInitData(data.replace("123456", "999999"), bot, 1100),
  );
  assert.throws(() => verifyTelegramInitData(data, bot, 1400));
  assert.throws(() => verifyTelegramInitData(data, bot, 900));
  assert.throws(() =>
    verifyTelegramInitData(`${data}&auth_date=1000`, bot, 1100),
  );
  assert.throws(() => verifyTelegramInitData("user=123", bot, 1100));
});
test("JSON de API possui limite real de bytes sem depender de Content-Length", async () => {
  const make = (body: string) =>
    new Request("https://example.test", { method: "POST", body });
  assert.deepEqual(await readJson(make('{"token":"abc"}')), { token: "abc" });
  await assert.rejects(readJson(make('"string"')));
  await assert.rejects(readJson(make("invalid")));
  await assert.rejects(
    readJson(make(JSON.stringify({ token: "x".repeat(100) })), 50),
  );
});
