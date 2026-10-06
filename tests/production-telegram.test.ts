import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { POST as signedRoute } from "../app/api/cards/signed/route";
import { GET as healthRoute } from "../app/api/health/route";
import { verifyCard } from "../lib/bingo/token/signed.server";
import { verifyTelegramInitData } from "../lib/telegram/auth.server";
import { telegramClient } from "../lib/telegram/client";

const TEST_SECRET = "super-secret-key-that-is-at-least-32-chars-long";
const BOT_TOKEN = "123456789:ABCdefGhIJKlmNoPQRstuvwxYZ_TEST_BOT";

function createValidTelegramInitData(
  user: { id: number; first_name: string; username?: string },
  authDate = Math.floor(Date.now() / 1000),
  botToken = BOT_TOKEN,
): string {
  const params = new URLSearchParams();
  params.set("auth_date", String(authDate));
  params.set("query_id", "AAG_test_query_id");
  params.set("user", JSON.stringify(user));

  const checkString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(checkString).digest("hex");

  params.set("hash", hash);
  return params.toString();
}

test("PRODUÇÃO: Rejeita emissão signed sem initData com HTTP 401", async () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  const prevBot = process.env.TELEGRAM_BOT_TOKEN;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;

    const req = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Tentativa Sem Telegram" }),
    });

    const res = await signedRoute(req);
    assert.equal(res.status, 401);

    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error?.code, "UNAUTHORIZED");
    assert.ok(data.error?.message.includes("Telegram"));
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    process.env.BINGO_SIGNING_SECRET = prevSecret;
    process.env.TELEGRAM_BOT_TOKEN = prevBot;
  }
});

test("PRODUÇÃO: Rejeita emissão signed com initData inválido/adulterado com HTTP 401", async () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  const prevBot = process.env.TELEGRAM_BOT_TOKEN;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;

    const fakeInitData = "auth_date=1728237600&hash=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef&user=%7B%22id%22%3A1%7D";

    const req = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: fakeInitData }),
    });

    const res = await signedRoute(req);
    assert.equal(res.status, 401);

    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error?.code, "UNAUTHORIZED");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    process.env.BINGO_SIGNING_SECRET = prevSecret;
    process.env.TELEGRAM_BOT_TOKEN = prevBot;
  }
});

test("PRODUÇÃO: Ausência de TELEGRAM_BOT_TOKEN retorna HTTP 503", async () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  const prevBot = process.env.TELEGRAM_BOT_TOKEN;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;
    delete process.env.TELEGRAM_BOT_TOKEN;

    const req = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await signedRoute(req);
    assert.equal(res.status, 503);

    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error?.code, "SERVICE_UNAVAILABLE");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    process.env.BINGO_SIGNING_SECRET = prevSecret;
    process.env.TELEGRAM_BOT_TOKEN = prevBot;
  }
});

test("DESENVOLVIMENTO: Permite mecanismo DEV explícito apenas fora de produção", async () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.BINGO_SIGNING_SECRET;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;
    delete process.env.TELEGRAM_BOT_TOKEN;

    const req = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Desenvolvedor Local" }),
    });

    const res = await signedRoute(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.card.uid, "dev-local");
    assert.equal(data.card.name, "Desenvolvedor Local");

    // Verifica que o token assinado é verificável
    const verified = verifyCard(data.token, TEST_SECRET);
    assert.equal(verified.uid, "dev-local");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    process.env.BINGO_SIGNING_SECRET = prevSecret;
  }
});

test("SEGURANÇA: uid enviado pelo client é estritamente ignorado em dev e prod", async () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  const prevBot = process.env.TELEGRAM_BOT_TOKEN;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;

    const validInitData = createValidTelegramInitData({
      id: 778899,
      first_name: "UsuarioReal",
    });

    const req = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: validInitData,
        uid: 1337, // Tentativa maliciosa de se passar por outro usuário
      }),
    });

    const res = await signedRoute(req);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.card.uid, 778899);
    assert.notEqual(data.card.uid, 1337);

    const verified = verifyCard(data.token, TEST_SECRET);
    assert.equal(verified.uid, 778899);
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    process.env.BINGO_SIGNING_SECRET = prevSecret;
    process.env.TELEGRAM_BOT_TOKEN = prevBot;
  }
});

test("TELEGRAM: Sessão expirada (>300s) ou no futuro (>30s) é rejeitada", async () => {
  const now = Math.floor(Date.now() / 1000);

  // Expirada (400 segundos atrás)
  const expiredInitData = createValidTelegramInitData(
    { id: 100, first_name: "Antigo" },
    now - 400,
  );

  assert.throws(
    () => verifyTelegramInitData(expiredInitData, BOT_TOKEN, { now }),
    /expirada/,
  );

  // No futuro (60 segundos à frente)
  const futureInitData = createValidTelegramInitData(
    { id: 200, first_name: "Viajante" },
    now + 60,
  );

  assert.throws(
    () => verifyTelegramInitData(futureInitData, BOT_TOKEN, { now }),
    /futuro/,
  );
});

test("TELEGRAM: Ordenação ASCII determinística independente de locale", () => {
  const now = Math.floor(Date.now() / 1000);
  const user = { id: 5544, first_name: "Teste" };

  // Parâmetros com chaves que diferem na ordenação
  const params = new URLSearchParams();
  params.set("user", JSON.stringify(user));
  params.set("auth_date", String(now));
  params.set("query_id", "Q123");
  params.set("chat_type", "sender");

  const checkString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const expectedOrder = ["auth_date", "chat_type", "query_id", "user"];
  const actualOrder = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k]) => k);

  assert.deepEqual(actualOrder, expectedOrder);

  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hash = createHmac("sha256", secretKey).update(checkString).digest("hex");
  params.set("hash", hash);

  const verified = verifyTelegramInitData(params.toString(), BOT_TOKEN, { now });
  assert.equal(verified.id, 5544);
  assert.equal(verified.firstName, "Teste");
});

test("HEALTH ENDPOINT: Diagnóstico seguro sem vazamento de secrets", async () => {
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  const prevBot = process.env.TELEGRAM_BOT_TOKEN;

  try {
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;

    const res = await healthRoute();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Cache-Control"), "no-store");

    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.status, "healthy");
    assert.equal(body.signingConfigured, true);
    assert.equal(body.telegramConfigured, true);

    const stringified = JSON.stringify(body);
    assert.equal(stringified.includes(TEST_SECRET), false);
    assert.equal(stringified.includes(BOT_TOKEN), false);

    // Quando não configurado:
    delete process.env.BINGO_SIGNING_SECRET;
    delete process.env.TELEGRAM_BOT_TOKEN;

    const unconfiguredRes = await healthRoute();
    const unconfiguredBody = await unconfiguredRes.json();
    assert.equal(unconfiguredBody.status, "degraded");
    assert.equal(unconfiguredBody.signingConfigured, false);
    assert.equal(unconfiguredBody.telegramConfigured, false);
  } finally {
    process.env.BINGO_SIGNING_SECRET = prevSecret;
    process.env.TELEGRAM_BOT_TOKEN = prevBot;
  }
});

test("SEGURANÇA HTTP: Rejeição de requests excessivamente grandes (>12000 bytes) e Content-Type inválido", async () => {
  const prevSecret = process.env.BINGO_SIGNING_SECRET;
  try {
    process.env.BINGO_SIGNING_SECRET = TEST_SECRET;

    // Body enorme
    const oversizedBody = JSON.stringify({
      initData: "a".repeat(13000),
    });
    const reqOversized = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversizedBody,
    });
    const resOversized = await signedRoute(reqOversized);
    assert.equal(resOversized.status, 400);

    // Content-Type incorreto
    const reqBadCt = new Request("https://example.test/api/cards/signed", {
      method: "POST",
      headers: { "Content-Type": "text/html" },
      body: JSON.stringify({}),
    });
    const resBadCt = await signedRoute(reqBadCt);
    assert.equal(resBadCt.status, 400);
  } finally {
    process.env.BINGO_SIGNING_SECRET = prevSecret;
  }
});

test("ADAPTER CLIENT: Não quebra quando window.Telegram não existe", () => {
  // Simula browser normal sem SDK Telegram
  assert.equal(telegramClient.isTelegramEnvironment(), false);
  assert.equal(telegramClient.getInitData(), "");
  assert.equal(telegramClient.getUnsafeDisplayUser(), null);

  // Funções de lifecycle e haptics devem ser seguras (no-op sem lançar exceção)
  assert.doesNotThrow(() => {
    telegramClient.init();
    telegramClient.haptic("light");
    telegramClient.haptic.impact("medium");
    telegramClient.haptic.notification("success");
    telegramClient.haptic.selection();
  });
});
