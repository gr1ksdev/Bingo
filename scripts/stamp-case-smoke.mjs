// Optional QA; Playwright is kept outside production dependencies.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(process.env.BINGO_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.BINGO_SMOKE_URL || "http://localhost:3000";
const artifacts = process.env.BINGO_SMOKE_ARTIFACTS || "/tmp/bingo-case-smoke";
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const collection = [
 ["coração", "heart"], ["estrela", "star"], ["patinha", "paw"], ["gatinho", "cat"],
 ["flor", "flower"], ["lua", "moon"], ["carinha feliz", "smile"], ["trevo", "clover"],
 ["raio", "lightning"], ["coroa", "crown"], ["espiral", "spiral"],
];
let page;
try {
 const context = await browser.newContext({ viewport:{width:390,height:844}, hasTouch:true, reducedMotion:"reduce" });
 page = await context.newPage();
 page.on("pageerror", e => errors.push(e.message));
 await page.goto(base+"/play");
 const close = () => page.getByRole("button",{name:"Fechar estojo de carimbos"});
 const open = () => page.getByRole("button",{name:"Abrir estojo de carimbos"});
 const read = () => page.evaluate(()=>JSON.parse(localStorage.getItem("bingo:player:v1")));
 await close().waitFor();
 await page.evaluate(()=>document.fonts.ready);
 assert.equal((await read()).stampCaseOpen,true);
 assert.equal(await close().getAttribute("aria-expanded"),"true");
 const initial = await read();
 const cardBox = await page.locator(".bingo-paper").boundingBox();
 const cardTypography = await page.locator(".cell-number").first().evaluate(el => ({
   font: getComputedStyle(el).font, color: getComputedStyle(el).color
 }));
 // Reload an actual legacy snapshot, including existing art.
 await page.getByRole("button",{name:"Usar carimbo coração"}).tap();
 await page.locator(".number-grid button").first().tap();
 const legacy = await read();
 await page.evaluate(()=> {
   const p = JSON.parse(localStorage.getItem("bingo:player:v1"));
   delete p.stampCaseOpen;
   localStorage.setItem("bingo:player:v1",JSON.stringify(p));
 });
 await page.reload();
 await close().waitFor();
 assert.deepEqual(await read(),{...legacy,stampCaseOpen:true});
 // Every glyph selects and applies in the active color.
 const colors = ["azul","rosa","verde"];
 for (let i=0;i<collection.length;i++) {
   const [label,type] = collection[i];
   await page.getByRole("button",{name:"Usar carimbo "+label}).tap();
   await page.getByRole("button",{name:"Canetinha "+colors[i%3]}).tap();
   assert.equal((await read()).selectedTool,type);
   await page.locator(".number-grid button").nth(i).tap();
   const p = await read();
   assert.equal(p.stamps.at(-1).type,type);
   assert.equal(p.stamps.at(-1).color,p.color);
 }
 await page.getByRole("button",{name:"Usar desenho livre"}).tap();
 assert.equal((await read()).selectedTool,"freehand");
 assert.equal(await page.locator(".drawing-active").count(),1);
 await page.getByRole("button",{name:"Usar carimbo coroa"}).tap();
 await page.getByRole("button",{name:"Canetinha azul"}).tap();
 const held = await read();
 const openHeight = (await page.locator(".stamp-case").boundingBox()).height;
 await close().tap();
 assert.equal(await open().getAttribute("aria-expanded"),"false");
 assert.equal(await page.getByRole("button",{name:"Usar carimbo coroa"}).count(),0);
 const closedHeight = (await page.locator(".stamp-case").boundingBox()).height;
 assert.ok(closedHeight <= 125 && closedHeight < openHeight*.35);
 assert.deepEqual(await read(),{...held,stampCaseOpen:false});
 await page.evaluate(()=>window.scrollTo(0,0));
 assert.deepEqual(await page.locator(".bingo-paper").boundingBox(),cardBox);
 assert.deepEqual(await page.locator(".cell-number").first().evaluate(el => ({
   font:getComputedStyle(el).font,color:getComputedStyle(el).color
 })),cardTypography);
 await page.reload();
 await open().waitFor();
 assert.deepEqual(await read(),{...held,stampCaseOpen:false});
 await page.locator(".number-grid button").nth(20).tap();
 assert.equal((await read()).stamps.at(-1).type,"crown");
 assert.equal((await read()).stamps.at(-1).color,held.color);
 for (let i=0;i<3;i++) { await open().tap(); await close().tap(); }
 await open().focus();
 await page.keyboard.press("Space");
 await close().waitFor();
 assert.equal(await page.getByRole("button",{name:"Usar carimbo coroa"}).getAttribute("aria-pressed"),"true");
 await page.reload();
 await close().waitFor();
 assert.equal((await read()).stampCaseOpen,true);
 // All new stamps remain individually erasable through the existing canvas.
 await page.getByRole("button",{name:"Borracha dos rabiscos"}).tap();
 for (const type of ["moon","smile","clover","lightning","crown"]) {
   const stamp = (await read()).stamps.find(s=>s.type===type);
   await page.locator("canvas").scrollIntoViewIfNeeded();
   const box = await page.locator(".number-grid button").nth(stamp.cellIndex).boundingBox();
   await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
   assert.equal((await read()).stamps.some(s=>s.id===stamp.id),false);
 }
 assert.deepEqual((await read()).card,initial.card);
 // Normal motion visibly carries the pull across the body; reduced motion turns it off.
 await page.getByRole("button",{name:"Usar carimbo estrela"}).tap();
 await page.emulateMedia({reducedMotion:"no-preference"});
 await close().scrollIntoViewIfNeeded();
 const startX = (await close().boundingBox()).x;
 await close().click();
 await page.waitForTimeout(100);
 const middleX = (await open().boundingBox()).x;
 await page.waitForTimeout(250);
 const endX = (await open().boundingBox()).x;
 assert.ok(middleX < startX && middleX > endX,"Pull must run across the zipper");
 await open().click();
 await page.waitForTimeout(350);
 await page.emulateMedia({reducedMotion:"reduce"});
 assert.equal(await page.locator(".case-pull").evaluate(el=>getComputedStyle(el).transitionDuration),"0s");
 // QA frames preserve the paper, shell and whole zipper, including its pull.
 for (const [width,height] of [[360,800],[375,812],[390,844],[412,915],[430,932],[1280,900]]) {
   await page.setViewportSize({width,height});
   for (const state of ["open","closed"]) {
     const desired = state==="open";
     if ((await read()).stampCaseOpen!==desired) await (desired?open():close()).click();
     await page.evaluate(()=>document.fonts.ready);
     await page.evaluate(()=> {document.activeElement?.blur();window.scrollTo(0,0);});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
     const box = await page.locator(".stamp-case").boundingBox();
     const paper = await page.locator(".bingo-paper").boundingBox();
     assert.ok(Math.abs(box.width-paper.width)<=12);
     assert.ok(box.width<500);
     const pull = await page.locator(".case-pull").boundingBox();
     assert.ok(pull.width>=44 && pull.height>=44 && pull.x>=0 && pull.x+pull.width<=width);
     if(desired) {
       const blocks = await page.locator(".wood-stamp").evaluateAll(els=>els.map(el=> {
         const b=el.getBoundingClientRect();return {w:b.width,h:b.height,top:b.top};
       }));
       assert.equal(blocks.length,12);
       assert.ok(blocks.every(b=>b.w>=44&&b.h>=44));
       assert.equal(await page.locator(".stamp-nest").evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length),4);
       const pens = await page.locator(".marker-slot").evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
       assert.ok(pens.every(w=>w>=44), "Pen touch width at "+width);
     } else assert.ok(box.height<=125);
     if(width===390||width===1280) await page.screenshot({
       path:artifacts+"/play-stamp-case-"+state+"-"+(width===390?"390":"desktop")+".png",fullPage:true
     });
   }
 }
 // Telegram adapter remains progressive, both with and without haptics.
 for(const withHaptics of [false,true]) {
   const tg = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:"reduce"});
   await tg.route("https://telegram.org/js/telegram-web-app.js",r=>r.abort());
   await tg.addInitScript(({withHaptics})=>{
     window.qaImpacts=0;
     window.Telegram={WebApp:{initData:"qa-candidate",ready(){},expand(){},
       ...(withHaptics?{HapticFeedback:{impactOccurred(){window.qaImpacts++;},selectionChanged(){}}}:{})
     }};
   },{withHaptics});
   await tg.route("**/api/auth/telegram",r=>r.fulfill({json:{authenticated:true,user:{id:123,firstName:"Pessoa QA",displayName:"Pessoa QA"}}}));
   const tp = await tg.newPage();
   tp.on("pageerror",e=>errors.push(e.message));
   await tp.goto(base+"/play");
   await tp.getByText(/Jogando como Pessoa QA/).waitFor();
   await tp.getByRole("button",{name:"Usar carimbo coroa"}).tap();
   await tp.getByRole("button",{name:"Fechar estojo de carimbos"}).tap();
   await tp.locator(".number-grid button").first().tap();
   await tp.getByRole("button",{name:"Abrir estojo de carimbos"}).tap();
   assert.equal(await tp.getByRole("button",{name:"Usar carimbo coroa"}).getAttribute("aria-pressed"),"true");
   if(withHaptics) assert.ok(await tp.evaluate(()=>window.qaImpacts)>=4);
   await tg.close();
 }
 assert.deepEqual(errors,[]);
 console.log("Stamp case smoke passed: legacy storage, 12 tools, colors, close/open/reload, held stamp, keyboard, new-stamp eraser, moving pull, reduced motion, 12 layouts and Telegram with/without haptics.");
 console.log("Screenshots: "+artifacts);
} catch(error) {
 if(page) await page.screenshot({path:artifacts+"/failure.png",fullPage:true});
 throw error;
} finally {await browser.close();}
