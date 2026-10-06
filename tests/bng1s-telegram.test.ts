import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { generateCard } from "../lib/bingo/generate-card";
import {
  encodeUnsigned,
  parseToken,
  isSignedCard,
  isUnsignedCard,
  type SignedCard,
} from "../lib/bingo/token";
import {
  signCard,
  verifyCard,
  verifyToken,
} from "../lib/bingo/token/signed.server";
import { verifyTelegramInitData } from "../lib/telegram/auth.server";
import { POST as signedRoute } from "../app/api/cards/signed/route";
import { POST as verifyRoute } from "../app/api/cards/verify/route";
import { POST as authRoute } from "../app/api/auth/telegram/route";

const TEST_SECRET = "bingo-ultra-secure-test-signing-secret-key-32chars";
const ALT_SECRET = "bingo-alternate-different-test-secret-key-32chars";
const BOT_TOKEN = "123456789:ABCdefGhIJKlmNoPQRstuvwxYZ_TEST_BOT";

function createValidInitData(
  user: { id: number; first_name: string; username?: string },
  authDate: number,
  botToken = BOT_TOKEN,
) {
  const fields: Record<string, string> = {
    auth_date: String(authDate),
    query_id: "AAG123_test",
    user: JSON.stringify(user),
  };

  const checkString = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(checkString).digest("hex");

  return new URLSearchParams({ ...fields, hash }).toString();
}

test("1. BNG1S round-trip, assinatura válida e estrutura determinística", () => {
  const nums = generateCard(() => 0);
  const card: SignedCard = {
    v: 1,
    cid: "card-uuid-1234",
    gid: "game-local-1",
    nums,
    iat: 1700000000,
    uid: 987654,
    name: "Maria da Sorte",
  };

  assert.ok(isSignedCard(card));

  const token = signCard(card, TEST_SECRET);
  assert.match(token, /^BNG1S\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/);

  // Parsing identifica estrutura sem precisar do secret
  const parsed = parseToken(token);
  assert.equal(parsed.kind, "signed");
  if (parsed.kind !== "signed") throw new Error("Expected signed");
  assert.deepEqual(parsed.payload, card);

  // Verificação criptográfica com secret correto
  const verified = verifyCard(token, TEST_SECRET);
  assert.deepEqual(verified, card);

  // Verificação estruturada via verifyToken
  const result = verifyToken(token, TEST_SECRET);
  assert.equal(result.valid, true);
  if (!result.valid) throw new Error("Expected valid result");
  assert.equal(result.kind, "signed");
  assert.equal(result.signatureValid, true);
  assert.deepEqual(result.payload, card);
});

test("2. Alteração de um único byte do payload invalida a assinatura", () => {
  const nums = generateCard(() => 0);
  const card: SignedCard = {
    v: 1,
    cid: "card-1",
    gid: "game-1",
    nums,
    iat: 1700000000,
    uid: "user-1",
    name: "Ana",
  };

  const token = signCard(card, TEST_SECRET);
  const [prefix, payloadB64, sig] = token.split(".");

  // Altera um único caractere no payload Base64URL
  const lastChar = payloadB64.slice(-1);
  const flippedChar = lastChar === "A" ? "B" : "A";
  const tamperedPayloadB64 = payloadB64.slice(0, -1) + flippedChar;
  const tamperedToken = `${prefix}.${tamperedPayloadB64}.${sig}`;

  // Tentativa de verificação direta deve falhar
  assert.throws(
    () => verifyCard(tamperedToken, TEST_SECRET),
    /Assinatura inválida|Conteúdo do código inválido|Cartela signed inválida/,
  );

  // verifyToken deve retornar valid: false com INVALID_SIGNATURE ou erro de payload
  const result = verifyToken(tamperedToken, TEST_SECRET);
  assert.equal(result.valid, false);
});

test("3. Alteração da assinatura é rejeitada", () => {
  const card: SignedCard = {
    v: 1,
    cid: "card-1",
    gid: "game-1",
    nums: generateCard(() => 0),
    iat: 1700000000,
    uid: 12345,
  };

  const token = signCard(card, TEST_SECRET);
  const [prefix, payloadB64, sig] = token.split(".");

  // Altera o último caractere da assinatura
  const flippedSig = sig.slice(0, -1) + (sig.endsWith("a") ? "b" : "a");
  const tamperedToken = `${prefix}.${payloadB64}.${flippedSig}`;

  assert.throws(() => verifyCard(tamperedToken, TEST_SECRET), /Assinatura inválida/);

  const result = verifyToken(tamperedToken, TEST_SECRET);
  assert.equal(result.valid, false);
  if (result.valid) throw new Error("Expected invalid result");
  assert.equal(result.error.code, "INVALID_SIGNATURE");
});

test("4. Assinatura com secret diferente rejeita a verificação", () => {
  const card: SignedCard = {
    v: 1,
    cid: "card-alt",
    gid: "game-1",
    nums: generateCard(() => 0),
    iat: 1700000000,
    uid: "player-99",
  };

  const token = signCard(card, TEST_SECRET);
  assert.throws(() => verifyCard(token, ALT_SECRET), /Assinatura inválida/);

  const result = verifyToken(token, ALT_SECRET);
  assert.equal(result.valid, false);
  if (result.valid) throw new Error("Expected invalid result");
  assert.equal(result.error.code, "INVALID_SIGNATURE");
});

test("5. Secret ausente desativa assinatura com erro de serviço", () => {
  const card: SignedCard = {
    v: 1,
    cid: "card-no-secret",
    gid: "game-1",
    nums: generateCard(() => 0),
    iat: 1700000000,
  };

  assert.throws(() => signCard(card, ""), /Configuração ou cartela inválida/);
  assert.throws(() => signCard(card, "short-secret-under-32-chars"), /Configuração ou cartela inválida/);

  const token = signCard(card, TEST_SECRET);
  const result = verifyToken(token, null);
  assert.equal(result.valid, false);
  if (result.valid) throw new Error("Expected invalid result");
  assert.equal(result.error.code, "SERVICE_UNAVAILABLE");
});

test("6. BNG1U continua 100% compatível", () => {
  const unsigned = {
    v: 1 as const,
    name: "Jogador Local",
    nums: generateCard(() => 0),
    createdAt: 1700000000000,
  };

  assert.ok(isUnsignedCard(unsigned));
  const token = encodeUnsigned(unsigned);
  assert.match(token, /^BNG1U\.[A-Za-z0-9_-]+$/);

  const parsed = parseToken(token);
  assert.equal(parsed.kind, "unsigned");
  assert.deepEqual(parsed.payload, unsigned);

  const result = verifyToken(token, TEST_SECRET);
  assert.equal(result.valid, true);
  if (!result.valid) throw new Error("Expected valid result");
  assert.equal(result.kind, "unsigned");
  assert.equal(result.signatureValid, false);
  assert.deepEqual(result.payload, unsigned);
});

test("7. Telegram initData válido: validação, replay freshness e extração segura", () => {
  const now = 1700000500;
  const user = { id: 777888, first_name: "Carlos", username: "carlos_bingo" };
  const validData = createValidInitData(user, now - 60);

  // 1. Validação com sucesso
  const verifiedUser = verifyTelegramInitData(validData, BOT_TOKEN, { now });
  assert.equal(verifiedUser.id, 777888);
  assert.equal(verifiedUser.firstName, "Carlos");
  assert.equal(verifiedUser.username, "carlos_bingo");

  // 2. Token bot incorreto rejeita
  assert.throws(
    () => verifyTelegramInitData(validData, "wrong-bot-token-999:AAA", { now }),
    /Identidade Telegram não confirmada/,
  );

  // 3. Adulteração do payload (trocar ID do usuário mantendo o hash) rejeita
  const tamperedData = validData.replace("777888", "999999");
  assert.throws(
    () => verifyTelegramInitData(tamperedData, BOT_TOKEN, { now }),
    /Identidade Telegram não confirmada/,
  );

  // 4. auth_date expirado (> 300 segundos no passado) rejeita
  const expiredData = createValidInitData(user, now - 305);
  assert.throws(
    () => verifyTelegramInitData(expiredData, BOT_TOKEN, { now, maxAgeSeconds: 300 }),
    /Sessão Telegram expirada/,
  );

  // 5. auth_date excessivamente no futuro (> now + 30s) rejeita
  const futureData = createValidInitData(user, now + 35);
  assert.throws(
    () => verifyTelegramInitData(futureData, BOT_TOKEN, { now }),
    /auth_date no futuro/,
  );

  // 6. Campos duplicados rejeitam
  assert.throws(
    () => verifyTelegramInitData(`${validData}&auth_date=123`, BOT_TOKEN, { now }),
    /Campos duplicados/,
  );
});

test("8. Endpoint POST /api/cards/signed gera cartela com autoridade e recusa números do client", async () => {
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  const prevBot = process.env.TELEGRAM_BOT_TOKEN;

  try {
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;

    const fakeNumbers = Array(25).fill(99);
    const now = Math.floor(Date.now() / 1000);
    const validData = createValidInitData({ id: 112233, first_name: "Beatriz" }, now);

    // O cliente tenta injetar seus próprios números 'fakeNumbers' e seu próprio uid '666666'
    const req = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: validData,
        nums: fakeNumbers,
        uid: 666666,
      }),
    });

    const res = await signedRoute(req);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.valid, true);
    assert.ok(typeof body.token === "string");

    // Decodifica e verifica o token assinado gerado pelo servidor
    const verified = verifyCard(body.token, TEST_SECRET);

    // uid DEVE vir do Telegram verificado (112233), NÃO do que o cliente enviou (666666)!
    assert.equal(verified.uid, 112233);
    assert.equal(verified.name, "Beatriz");

    // Os números DEVEM ter sido gerados pelo servidor (nums válidos com centro null), NÃO fakeNumbers!
    assert.notDeepEqual(verified.nums, fakeNumbers);
    assert.equal(verified.nums[12], null);
    assert.equal(verified.nums.length, 25);
  } finally {
    process.env.BINGO_SIGNING_SECRET = prevSecret;
    process.env.TELEGRAM_BOT_TOKEN = prevBot;
  }
});

test("9. Endpoint POST /api/cards/verify retorna estrutura completa para signed, unsigned e adulterado", async () => {
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  try {
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;

    const card: SignedCard = {
      v: 1,
      cid: "verify-test-1",
      gid: "local",
      nums: generateCard(() => 0),
      iat: Math.floor(Date.now() / 1000),
      uid: "player-1",
      name: "João",
    };
    const signedToken = signCard(card, TEST_SECRET);

    // 1. Signed válido
    const resSigned = await verifyRoute(
      new Request("https://example.test/api/cards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: signedToken }),
      }),
    );
    assert.equal(resSigned.status, 200);
    const bodySigned = await resSigned.json();
    assert.equal(bodySigned.valid, true);
    assert.equal(bodySigned.signatureValid, true);
    assert.equal(bodySigned.kind, "signed");
    assert.equal(bodySigned.payload.cid, "verify-test-1");

    // 2. Unsigned válido
    const unsignedToken = encodeUnsigned({
      v: 1,
      name: "Visitante",
      nums: card.nums,
      createdAt: Date.now(),
    });
    const resUnsigned = await verifyRoute(
      new Request("https://example.test/api/cards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: unsignedToken }),
      }),
    );
    assert.equal(resUnsigned.status, 200);
    const bodyUnsigned = await resUnsigned.json();
    assert.equal(bodyUnsigned.valid, true);
    assert.equal(bodyUnsigned.signatureValid, false);
    assert.equal(bodyUnsigned.kind, "unsigned");

    // 3. Signed adulterado (assinatura inválida)
    const [p, b64] = signedToken.split(".");
    const tamperedToken = `${p}.${b64}.${"B".repeat(43)}`;
    const resTampered = await verifyRoute(
      new Request("https://example.test/api/cards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tamperedToken }),
      }),
    );
    assert.equal(resTampered.status, 400);
    const bodyTampered = await resTampered.json();
    assert.equal(bodyTampered.valid, false);
    assert.equal(bodyTampered.signatureValid, false);
    assert.equal(bodyTampered.error.code, "INVALID_SIGNATURE");
  } finally {
    process.env.BINGO_SIGNING_SECRET = prevSecret;
  }
});

test("10. Endpoint POST /api/auth/telegram valida identidade e não expõe secrets", async () => {
  const prevBot = process.env.TELEGRAM_BOT_TOKEN;
  try {
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;

    const now = Math.floor(Date.now() / 1000);
    const initData = createValidInitData({ id: 554433, first_name: "Lucia", username: "lucia_b" }, now);

    const res = await authRoute(
      new Request("https://example.test/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      }),
    );

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.authenticated, true);
    assert.equal(data.user.id, 554433);
    assert.equal(data.user.firstName, "Lucia");

    // Garante que secrets, tokens ou hashes internos não são vazados
    assert.equal(data.token, undefined);
    assert.equal(data.secret, undefined);
    assert.equal(data.hash, undefined);
    assert.equal(data.botToken, undefined);
  } finally {
    process.env.TELEGRAM_BOT_TOKEN = prevBot;
  }
});
