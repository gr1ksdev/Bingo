import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { POST as create } from "../app/api/cards/create/route";
import { POST as verify } from "../app/api/cards/verify/route";
import { parseToken } from "../lib/bingo/token";
const request = (body: unknown) =>
  new Request("https://example.test/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
test("Route Handlers: ausência de secrets, identidade confirmada e rejeição de dados manipulados", async () => {
  const previousSecret = process.env.BINGO_SIGNING_SECRET;
  const previousBot = process.env.TELEGRAM_BOT_TOKEN;
  try {
    delete process.env.BINGO_SIGNING_SECRET;
    delete process.env.TELEGRAM_BOT_TOKEN;
    assert.equal((await create(request({}))).status, 503);
    assert.equal((await verify(request({ token: "fake" }))).status, 503);
    process.env.BINGO_SIGNING_SECRET =
      "test-only-route-handler-secret-32-characters";
    process.env.TELEGRAM_BOT_TOKEN = "123:test-route-handler-bot";
    assert.equal((await create(request({ uid: 123 }))).status, 401);
    assert.equal((await create(request({ initData: "fake" }))).status, 400);
    const fields = {
      auth_date: String(Math.floor(Date.now() / 1000)),
      user: JSON.stringify({ id: 456789 }),
    };
    const check = Object.entries(fields)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    const key = createHmac("sha256", "WebAppData")
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();
    const hash = createHmac("sha256", key).update(check).digest("hex");
    const initData = new URLSearchParams({ ...fields, hash }).toString();
    const response = await create(
      request({
        initData,
        uid: 999999,
        gid: "fake-remote",
        nums: Array(25).fill(1),
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const body: { token: string } = await response.json();
    const parsed = parseToken(body.token);
    assert.equal(parsed.kind, "signed");
    if (parsed.kind !== "signed") throw new Error("Signed token expected");
    assert.equal(parsed.payload.uid, 456789);
    assert.equal(parsed.payload.gid, "local");
    const verified = await verify(request({ token: body.token }));
    assert.equal(verified.status, 200);
    assert.equal((await verified.json()).verified, true);
    assert.equal((await verify(request({ token: "fake" }))).status, 400);
    assert.equal((await verify(request({}))).status, 400);
    assert.equal(
      (await create(request({ initData: "x".repeat(13000) }))).status,
      400,
    );
  } finally {
    if (previousSecret === undefined) delete process.env.BINGO_SIGNING_SECRET;
    else process.env.BINGO_SIGNING_SECRET = previousSecret;
    if (previousBot === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousBot;
  }
});
