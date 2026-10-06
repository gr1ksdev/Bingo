// Optional manual QA. Playwright stays outside production dependencies.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.BINGO_PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.BINGO_SMOKE_URL || "http://localhost:3000";
const artifacts = process.env.BINGO_SMOKE_ARTIFACTS || "/tmp/bingo-smoke";
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BINGO_BROWSER_EXECUTABLE
    ? { executablePath: process.env.BINGO_BROWSER_EXECUTABLE }
    : {}),
});
const errors = [];
let currentPage;
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const play = await context.newPage();
  currentPage = play;
  play.on("pageerror", (error) => errors.push(error.message));
  play.on("dialog", (dialog) => dialog.accept());
  await play.goto(`${base}/play`);
  await play.getByRole("button", { name: "Canetinha roxa" }).waitFor();
  await play.evaluate(() => document.fonts.ready);
  const getPlayer = () =>
    play.evaluate(() => JSON.parse(localStorage.getItem("bingo:player:v1")));
  const inkPixels = () =>
    play.locator("canvas").evaluate((canvas) => {
      const data = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let alpha = 0;
      for (let i = 3; i < data.length; i += 4) alpha += data[i];
      return alpha;
    });
  const initial = await getPlayer();
  await play.getByRole("button", { name: "Canetinha azul" }).tap();
  const firstCell = play.locator(".number-grid button").first();
  await firstCell.tap();
  assert.equal((await getPlayer()).marks[0], "#2374cc");
  assert.equal(await firstCell.getAttribute("aria-pressed"), "true");
  await play.getByRole("button", { name: "Rabiscar", exact: true }).tap();
  await play.waitForFunction(
    () => document.querySelector(".drawing-active") !== null,
  );
  const draw = async (xOffset = 0) => {
    const box = await play.locator("canvas").boundingBox();
    const session = await context.newCDPSession(play);
    const start = {
      x: box.x + box.width * 0.4 + xOffset,
      y: box.y + box.height * 0.4,
    };
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [start],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: start.x + 35, y: start.y + 20 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
    await play.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  };
  await draw();
  await play.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("bingo:player:v1")).strokes.length === 1,
  );
  assert.equal((await getPlayer()).strokes[0].tool, "pen");
  const penInk = await inkPixels();
  assert.ok(penInk > 0);
  await play.getByRole("button", { name: "Borracha dos rabiscos" }).click();
  await play.waitForFunction(
    () =>
      document
        .querySelector('button[aria-label="Borracha dos rabiscos"]')
        ?.getAttribute("aria-pressed") === "true",
  );
  await draw(5);
  await play.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("bingo:player:v1")).strokes.length === 2,
  );
  assert.equal((await getPlayer()).strokes[1].tool, "eraser");
  assert.ok((await inkPixels()) < penInk, "Eraser removes only canvas ink.");
  assert.deepEqual((await getPlayer()).card, initial.card);
  assert.equal((await getPlayer()).marks[0], "#2374cc");
  await play.getByRole("button", { name: "Desfazer último rabisco" }).click();
  assert.equal((await getPlayer()).strokes.length, 1);
  await play.reload();
  await play.getByRole("button", { name: "Canetinha azul" }).waitFor();
  await play.evaluate(() => document.fonts.ready);
  const restored = await getPlayer();
  assert.deepEqual(restored.card, initial.card);
  assert.equal(restored.strokes.length, 1);
  assert.equal(restored.marks[0], "#2374cc");
  await play.getByRole("button", { name: "Rabiscar", exact: true }).tap();
  await play.waitForFunction(
    () => document.querySelector(".drawing-active") !== null,
  );
  await play.getByRole("button", { name: "Limpar desenhos" }).click();
  await play.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("bingo:player:v1")).strokes.length === 0,
  );
  assert.equal((await getPlayer()).marks[0], "#2374cc");
  await draw();
  await play.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("bingo:player:v1")).strokes.length === 1,
  );
  await play.locator(".play-actions button").first().click();
  await play.waitForFunction(
    () =>
      Object.keys(JSON.parse(localStorage.getItem("bingo:player:v1")).marks)
        .length === 0,
  );
  assert.equal((await getPlayer()).strokes.length, 1);
  await play.getByRole("button", { name: "Marcar", exact: true }).click();
  await play.waitForFunction(
    () => document.querySelector(".drawing-active") === null,
  );
  await play.locator(".number-grid button").first().tap();
  await play.getByText("Sua cartela & código", { exact: false }).click();
  await play.getByLabel("Nome na cartela").fill("João QA");
  await play.getByRole("button", { name: "Copiar código" }).click();
  const token = await play
    .getByLabel("Código da cartela", { exact: true })
    .inputValue();
  assert.ok(token.startsWith("BNG1U."));
  assert.equal(
    await play.evaluate(() => navigator.clipboard.readText()),
    token,
  );
  const admin = await context.newPage();
  currentPage = admin;
  admin.on("pageerror", (error) => errors.push(error.message));
  admin.on("dialog", (dialog) => dialog.accept());
  await admin.goto(`${base}/admin`);
  const drawButton = admin.getByRole("button", { name: "SORTEAR PEDRA" });
  await drawButton.waitFor();
  await admin.evaluate(() => document.fonts.ready);
  for (let i = 0; i < 12; i++) await drawButton.click();
  const game = await admin.evaluate(() =>
    JSON.parse(localStorage.getItem("bingo:game:v1")),
  );
  assert.equal(game.drawn.length, 12);
  assert.equal(new Set(game.drawn).size, 12);
  await play.waitForFunction(
    () => document.querySelector(".draw-count")?.textContent === "12/75",
  );
  await admin.getByLabel("Código da cartela", { exact: true }).fill(token);
  await admin.getByRole("button", { name: "VALIDAR CARTELA" }).click();
  await admin.locator(".validation-result").scrollIntoViewIfNeeded();
  await admin
    .getByText("Cartela não verificada", { exact: true })
    .waitFor({ state: "attached", timeout: 5000 });
  await admin.getByText("João QA", { exact: true }).waitFor();
  assert.equal(
    await admin.locator(".validation-result .bingo-cell").count(),
    25,
  );
  await admin.getByText("Histórico completo", { exact: false }).click();
  assert.equal(await admin.locator(".history-grid li").count(), 12);
  await admin.reload();
  await drawButton.waitFor();
  assert.equal(
    (
      await admin.evaluate(() =>
        JSON.parse(localStorage.getItem("bingo:game:v1")),
      )
    ).drawn.length,
    12,
  );
  for (let i = 12; i < 75; i++) await drawButton.click();
  await admin.getByRole("button", { name: "Todas saíram!" }).waitFor();
  assert.equal(
    await admin.getByRole("button", { name: "Todas saíram!" }).isDisabled(),
    true,
  );
  await play.waitForFunction(
    () => document.querySelector(".draw-count")?.textContent === "75/75",
  );
  await play.getByRole("button", { name: "BINGO!" }).click();
  await play.locator(".result-note").scrollIntoViewIfNeeded();
  await play
    .getByText("B I N G O", { exact: true })
    .waitFor({ state: "attached" });
  for (const width of [360, 375, 390, 412, 430]) {
    for (const route of ["/", "/play", "/admin"]) {
      await play.setViewportSize({ width, height: 844 });
      await play.goto(`${base}${route}`);
      await play.waitForLoadState("networkidle");
      assert.equal(
        await play.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Overflow: ${route} at ${width}px`,
      );
      if (width === 390)
        await play.screenshot({
          path: `${artifacts}/${route === "/" ? "landing" : route.slice(1)}-390.png`,
          fullPage: true,
        });
    }
  }
  const unavailable = await context.request.post(`${base}/api/cards/create`, {
    data: {},
  });
  assert.equal(
    unavailable.status(),
    503,
    "Smoke QA expects no signing/Telegram secrets on local preview.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: touch, ink, drawing, eraser, undo, persistence, copy, admin, unsigned validator, 75 draws, Bingo and 15 mobile layouts.",
  );
  console.log(`Screenshots: ${artifacts}`);
} catch (error) {
  if (currentPage) {
    await currentPage.screenshot({
      path: `${artifacts}/failure.png`,
      fullPage: true,
    });
  }
  throw error;
} finally {
  await browser.close();
}
