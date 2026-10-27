// Isolated software QA. Never attaches to a personal browser profile.
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = process.env.QA_BASE_URL || "http://localhost:3100";
const out = new URL("../.tmp/landing-qa/", import.meta.url);
const profile = new URL(`chrome-${Date.now()}/`, out);
await mkdir(profile, { recursive: true });
const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--enable-unsafe-swiftshader",
    "--remote-debugging-port=0",
    `--user-data-dir=${fileURLToPath(profile)}`,
  ],
  { windowsHide: true, stdio: "ignore" },
);
chrome.on("error", (error) => {
  throw error;
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let port;
for (let i = 0; i < 100; i++) {
  try {
    port = Number(
      (await readFile(new URL("DevToolsActivePort", profile), "utf8")).split(
        "\n",
      )[0],
    );
    break;
  } catch {
    await delay(100);
  }
}
if (!port) {
  chrome.kill();
  throw new Error("Isolated Chrome failed to start");
}
const version = await (
  await fetch(`http://127.0.0.1:${port}/json/version`)
).json();
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve) =>
  socket.addEventListener("open", resolve, { once: true }),
);
let id = 0;
const pending = new Map();
const errors = [],
  requests = [],
  results = [];
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const promise = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) promise.reject(new Error(message.error.message));
    else promise.resolve(message.result);
  } else if (message.method === "Runtime.exceptionThrown")
    errors.push(
      message.params.exceptionDetails.exception?.description ||
        message.params.exceptionDetails.text,
    );
  else if (message.method === "Network.requestWillBeSent")
    requests.push(message.params.request.url);
});
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    const timeout = setTimeout(() => {
      pending.delete(key);
      reject(new Error(`Timeout: ${method}`));
    }, 30000);
    pending.set(key, {
      resolve: (result) => {
        clearTimeout(timeout);
        resolve(result);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });
    socket.send(
      JSON.stringify({
        id: key,
        method,
        params,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
  });
}
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", {
  targetId,
  flatten: true,
});
const call = (method, params) => send(method, params, sessionId);
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text,
    );
  return result.result.value;
}
async function until(expression, label, count = 250) {
  for (let i = 0; i < count; i++) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await delay(120);
  }
  throw new Error(`Not ready: ${label}`);
}
async function dimensions(width, height, mobile = false) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
}
async function screenshot(name, clip) {
  clip ??= await evaluate(
    `({x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,scale:1})`,
  );
  const result = await call("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    ...(clip ? { clip } : {}),
  });
  await writeFile(
    new URL(`${name}.png`, out),
    Buffer.from(result.data, "base64"),
  );
}
async function assert(expression, label) {
  if (!(await evaluate(expression))) throw new Error(`FAIL: ${label}`);
  results.push(label);
}
async function navigate(path = "/") {
  await call("Page.navigate", { url: `${base}${path}` });
}

try {
  await call("Runtime.enable");
  await call("Page.enable");
  await call("Network.enable");
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  if (process.argv.includes("--poster")) {
    await dimensions(1100, 1000);
    await navigate("/lab/exercises-3d");
    await until(
      `Boolean(document.querySelector('canvas') && document.querySelector('button[aria-label="Reproduzir movimento"]') && !document.querySelector('section[aria-label^="Demonstração 3D"] [role="status"]'))`,
      "3D for poster",
      500,
    );
    await evaluate(
      `document.querySelector('canvas').scrollIntoView({block:'center'})`,
    );
    await evaluate(
      `document.querySelector('section[aria-label^="Demonstração 3D"]').querySelectorAll('button, .pointer-events-none').forEach(el=>el.style.visibility='hidden')`,
    );
    await delay(600);
    const clip = await evaluate(
      `(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1.5}})()`,
    );
    const result = await call("Page.captureScreenshot", {
      format: "webp",
      quality: 88,
      captureBeyondViewport: true,
      clip,
    });
    await mkdir(new URL("../public/landing/", import.meta.url), {
      recursive: true,
    });
    await writeFile(
      new URL("../public/landing/movement-preview.webp", import.meta.url),
      Buffer.from(result.data, "base64"),
    );
    console.log(
      "Rendered the existing exercise model into the landing poster.",
    );
  }
  if (process.argv.includes("--auth")) {
    for (const [name, width, height, mobile] of [
      ["desktop", 1440, 1000, false],
      ["tablet", 820, 1100, false],
      ["mobile", 390, 844, true],
      ["small-mobile", 320, 740, true],
    ]) {
      await dimensions(width, height, mobile);
      await navigate("/auth");
      await until(
        `document.querySelector('h1')?.textContent.includes('Bom ter') && document.querySelector('h1').getBoundingClientRect().height>0`,
        "signin",
      );
      await evaluate(`document.fonts.ready.then(()=>true)`);
      await delay(300);
      await assert(
        `document.documentElement.scrollWidth<=innerWidth`,
        `${name}: signin fits the viewport`,
      );
      await assert(
        `document.querySelectorAll('h1').length===1`,
        `${name}: signin has one heading`,
      );
      await screenshot(`auth-${name}-signin`);
      await navigate("/auth/signup");
      await until(
        `document.querySelector('[data-account-type="ATHLETE"]')?.getBoundingClientRect().height>0`,
        "signup",
      );
      await delay(300);
      await assert(
        `document.documentElement.scrollWidth<=innerWidth`,
        `${name}: signup fits the viewport`,
      );
      await assert(
        `document.querySelector('[data-account-type="ATHLETE"]').getAttribute('aria-pressed')==='true'`,
        `${name}: athlete is selected by default`,
      );
      await screenshot(`auth-${name}-signup`);
      await evaluate(
        `document.querySelector('[data-account-type="COACH"]').click()`,
      );
      await until(
        `(()=>{const b=document.querySelector('[data-account-type="COACH"]');if(b.getAttribute('aria-pressed')!=='true')b.click();return b.getAttribute('aria-pressed')==='true'})()`,
        "coach selection hydrated",
      );
      await until(
        `document.querySelector('[data-plan-code]') || document.querySelector('[role="alert"]') || document.body.textContent.includes('Nenhum plano disponível')`,
        "public coach plans",
      );
      await assert(
        `document.documentElement.scrollWidth<=innerWidth`,
        `${name}: coach plan selection fits`,
      );
      await screenshot(`auth-${name}-coach`);
      await evaluate(
        `document.querySelector('[data-account-type="ATHLETE"]').click()`,
      );
      await until(
        `document.querySelector('[data-account-type="ATHLETE"]').getAttribute('aria-pressed')==='true'`,
        "switch back to athlete",
      );
    }
    await dimensions(1440, 1000);
    await navigate("/auth?error=oauth&returnTo=%2Fconvite%2Fqa_token_123456");
    await until(
      `document.querySelector('[role="alert"]')`,
      "signin OAuth error",
    );
    await assert(
      `document.querySelector('a[href^="/auth/signup?returnTo="]')!==null`,
      "signin preserves invitation in signup link",
    );
    await screenshot("auth-desktop-error");
    await navigate(
      "/auth/signup?accountType=COACH&returnTo=%2Fconvite%2Fqa_token_123456",
    );
    await until(
      `document.querySelector('[data-account-type="COACH"]')?.getAttribute('aria-pressed')==='true'`,
      "direct coach signup",
    );
    await assert(
      `document.querySelector('a[href^="/auth?returnTo="]')!==null`,
      "signup preserves invitation in signin link",
    );
    await navigate("/auth/complete");
    await until(
      `document.querySelector('[role="alert"]')`,
      "unauthorized completion",
    );
    await screenshot("auth-desktop-completion");
    results.push("completion recovers with a signin link");
  }
  for (const [name, width, height, mobile] of [
    ["desktop", 1440, 1000, false],
    ["tablet", 820, 1100, false],
    ["mobile", 390, 844, true],
    ["small-mobile", 320, 740, true],
  ]) {
    await dimensions(width, height, mobile);
    await navigate();
    await until(`Boolean(document.querySelector('#hero-title'))`, name);
    await delay(350);
    console.log(
      `${name}: ${JSON.stringify(await evaluate(`Array.from(document.querySelectorAll('h1')).map(n=>n.textContent)`))}`,
    );
    await screenshot(`${name}-initial`);
    await assert(
      `document.documentElement.scrollWidth <= innerWidth`,
      `${name}: no horizontal overflow`,
    );
    await assert(
      `document.querySelectorAll('h1').length === 1`,
      `${name}: single page heading`,
    );
    await assert(
      `Array.from(document.images).every(i=>!i.complete || i.naturalWidth>0)`,
      `${name}: loaded images are valid`,
    );
    if (name === "desktop") {
      await assert(
        `!performance.getEntriesByType('resource').some(r=>/\.glb/.test(r.name))`,
        "3D model is not downloaded on entry",
      );
      await evaluate(
        `document.querySelector('button[aria-label="Concluir série 2"]').click()`,
      );
      await until(
        `document.querySelector('button[aria-label="Desmarcar série 2"]')`,
        "interactive set",
      );
      await assert(
        `document.querySelector('button[aria-label="Desmarcar série 2"]').getAttribute('aria-pressed')==='true'`,
        "set completion updates the demo",
      );
      await screenshot("desktop-hero");
      await evaluate(
        `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Sou personal').click()`,
      );
      await until(
        `document.querySelector('a[href="/auth/signup?accountType=COACH"]')`,
        "coach link",
      );
      await assert(
        `document.querySelector('a[href="/auth/signup?accountType=COACH"]').textContent.includes('Conhecer')`,
        "personal CTA preserves signup intent",
      );
      await evaluate(`document.querySelector('#duvidas details').open=true`);
      await assert(
        `document.querySelector('#duvidas details').open`,
        "FAQ expands",
      );
      await evaluate(
        `document.querySelector('#movimento').scrollIntoView({block:'start'})`,
      );
      await delay(250);
      await screenshot("desktop-3d");
      await evaluate(
        `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Experimente o 3D')).click()`,
      );
      await until(
        `Boolean(document.querySelector('canvas') && document.querySelector('button[aria-label="Reproduzir movimento"]') && !document.querySelector('section[aria-label^="Demonstração 3D"] [role="status"]'))`,
        "landing 3D",
        500,
      );
      await assert(
        `document.querySelector('canvas').width>0`,
        "live 3D opens and renders",
      );
      await screenshot("desktop-live-3d");
      await evaluate(
        `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Supino reto').click()`,
      );
      await until(
        `document.querySelector('section[aria-label="Demonstração 3D: Supino reto"]')`,
        "exercise switch",
      );
      await assert(
        `Boolean(document.querySelector('section[aria-label="Demonstração 3D: Supino reto"]'))`,
        "3D exercise selector switches to supino",
      );
      await evaluate(`document.querySelector('#cta-title').scrollIntoView()`);
      await until(`!document.querySelector('canvas')`, "offscreen disposal");
      results.push("3D canvas is released outside the section");
      await call("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
      });
      await evaluate(`scrollTo({top:0,behavior:'instant'})`);
      await delay(1300);
      await call("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: 1150,
        y: 350,
      });
      await delay(100);
      await assert(
        `document.querySelector('[data-motion]').style.getPropertyValue('--pointer-x')!==''`,
        "hero depth responds to desktop pointer",
      );
      await screenshot("desktop-motion");
      await evaluate(
        `document.querySelector('[data-spotlight]').scrollIntoView({block:'center',behavior:'instant'})`,
      );
      const point = await evaluate(
        `(()=>{const r=document.querySelector('[data-spotlight] h3').getBoundingClientRect();return {x:r.x+10,y:r.y+10}})()`,
      );
      await call("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
      await delay(100);
      await assert(
        `document.querySelector('[data-spotlight]').style.getPropertyValue('--spot-opacity')==='1'`,
        "feature card light follows pointer",
      );
      await evaluate(
        `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Pausar animações')).click()`,
      );
      await until(
        `document.querySelector('[data-motion="paused"]')`,
        "motion pause",
      );
      await call("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: point.x + 5,
        y: point.y + 5,
      });
      await delay(100);
      await assert(
        `document.querySelector('[data-motion]').style.getPropertyValue('--pointer-x')==='0px'`,
        "pause control stops pointer motion",
      );
      await assert(
        `getComputedStyle(document.querySelector('svg[viewBox="0 0 600 660"] path')).animationPlayState==='paused'`,
        "pause control stops animated signal trails",
      );
      await evaluate(
        `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Retomar animações')).click()`,
      );
      await call("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      });
      await assert(
        `getComputedStyle(document.querySelector('svg[viewBox="0 0 600 660"] path')).animationName==='none'`,
        "reduced motion disables added effects",
      );
    }
    if (name === "mobile") {
      await evaluate(
        `document.querySelector('button[aria-label="Abrir menu"]').click()`,
      );
      await until(
        `document.querySelector('button[aria-label="Fechar menu"]')`,
        "mobile menu",
      );
      await assert(
        `getComputedStyle(document.querySelector('#landing-nav')).display==='flex'`,
        "mobile navigation opens",
      );
      await evaluate(`document.querySelector('#landing-nav a').click()`);
      await until(
        `document.querySelector('button[aria-label="Abrir menu"]')`,
        "mobile menu closes",
      );
      await evaluate(`scrollTo(0,0)`);
      await delay(100);
      await screenshot("mobile-hero");
      await evaluate(
        `document.querySelector('#movimento').scrollIntoView({block:'start'})`,
      );
      await delay(100);
      await screenshot("mobile-3d");
    }
    const fullHeight = await evaluate(`document.documentElement.scrollHeight`);
    await screenshot(`${name}-full`, {
      x: 0,
      y: 0,
      width,
      height: fullHeight,
      scale: 1,
    });
  }
  // Existing iOS installations use navigator.standalone. Test on the public root.
  const { identifier } = await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `Object.defineProperty(navigator,'standalone',{get:()=>true,configurable:true});`,
  });
  await navigate();
  await until(
    `location.pathname==='/auth' && !document.querySelector('#hero-title')`,
    "installed PWA bypass",
  );
  await assert(
    `!document.querySelector('#hero-title')`,
    "installed iOS PWA goes to login without landing",
  );
  await call("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  const { identifier: androidId } = await call(
    "Page.addScriptToEvaluateOnNewDocument",
    {
      source: `const original=window.matchMedia.bind(window);window.matchMedia=q=>{const m=original(q);if(q.includes('display-mode: standalone'))Object.defineProperty(m,'matches',{value:true});return m};`,
    },
  );
  await navigate();
  await until(`location.pathname==='/auth'`, "standalone PWA bypass");
  results.push("standalone display mode goes directly to login");
  await call("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: androidId,
  });
  await writeFile(
    new URL("validation.json", out),
    JSON.stringify(
      {
        results,
        errors,
        modelRequests: requests.filter((u) => u.endsWith(".glb")),
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ results, errors }, null, 2));
  if (errors.length)
    throw new Error(
      "Browser runtime errors; see .tmp/landing-qa/validation.json",
    );
} finally {
  await send("Browser.close").catch(() => {});
  socket.close();
  if (chrome.exitCode === null) chrome.unref();
}
