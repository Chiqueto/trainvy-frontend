// Software QA only: a disposable headless Chrome profile, never a personal tab.
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const out = new URL("../.tmp/anatomy-qa/", import.meta.url);
const profile = new URL(
  `../.tmp/chrome-anatomy-cdp-${Date.now()}/`,
  import.meta.url,
);
await mkdir(profile, { recursive: true });
await mkdir(out, { recursive: true });
const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${fileURLToPath(profile)}`,
  ],
  { windowsHide: true, stdio: "ignore" },
);
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
if (!port)
  throw new Error("Headless Chrome did not open its disposable QA profile");
const version = await (
  await fetch(`http://127.0.0.1:${port}/json/version`)
).json();
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve) =>
  socket.addEventListener("open", resolve, { once: true }),
);
let id = 0;
const pending = new Map(),
  errors = [],
  requests = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const p = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) p.reject(new Error(message.error.message));
    else p.resolve(message.result);
  } else if (message.method === "Runtime.exceptionThrown")
    errors.push(message.params.exceptionDetails.text);
  else if (
    message.method === "Runtime.consoleAPICalled" &&
    message.params.type === "error"
  )
    errors.push(
      message.params.args.map((a) => a.value ?? a.description ?? "").join(" "),
    );
  else if (message.method === "Network.requestWillBeSent")
    requests.push(message.params.request.url);
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    socket.send(
      JSON.stringify({
        id: key,
        method,
        params,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
  });
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", {
  targetId,
  flatten: true,
});
const evaluate = async (expression) => {
  const r = await send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sessionId,
  );
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
};
async function ready() {
  for (let i = 0; i < 400; i++) {
    if (
      await evaluate(
        `Boolean(document.querySelector('canvas') && document.querySelector('button[aria-label="Reproduzir movimento"]') && !document.querySelector('section[aria-label^="Demonstração 3D"] [role="status"]'))`,
      )
    ) {
      await evaluate(
        `new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`,
      );
      return;
    }
    await delay(100);
  }
  throw new Error("Anatomical viewer did not become ready");
}
const results = [];
try {
  await send("Runtime.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);
  await send("Page.enable", {}, sessionId);
  await send(
    "Emulation.setEmulatedMedia",
    { features: [{ name: "prefers-reduced-motion", value: "reduce" }] },
    sessionId,
  );
  for (const [name, width, height, mobile] of [
    ["desktop", 1440, 1200, false],
    ["mobile", 390, 844, true],
  ]) {
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 1, mobile },
      sessionId,
    );
    await send(
      "Page.navigate",
      { url: "http://127.0.0.1:3100/lab/exercises-3d" },
      sessionId,
    );
    await ready();
    const dimensions = await evaluate(
      `({viewport:innerWidth,document:document.documentElement.scrollWidth})`,
    );
    if (dimensions.document > width)
      throw new Error(
        `${name} overflows horizontally: ${JSON.stringify(dimensions)}`,
      );
    for (const exercise of ["squat", "bench"]) {
      if (exercise === "bench") {
        await evaluate(
          `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Supino reto')).click()`,
        );
        await ready();
      }
      await evaluate(
        `document.querySelector('section[aria-label^="Demonstração 3D"]').scrollIntoView({block:'start'})`,
      );
      for (const position of [0, 0.5, 1]) {
        await evaluate(
          `(()=>{const input=document.querySelector('input[aria-label="Posição do movimento"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${position * 1000});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
        );
        await evaluate(
          `new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`,
        );
        const rect = await evaluate(
          `(()=>{const r=document.querySelector('section[aria-label^="Demonstração 3D"]').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()`,
        );
        const screenshot = await send(
          "Page.captureScreenshot",
          { format: "png", captureBeyondViewport: true, clip: rect },
          sessionId,
        );
        await writeFile(
          new URL(`web-${name}-${exercise}-${position}.png`, out),
          Buffer.from(screenshot.data, "base64"),
        );
      }
      results.push({
        viewport: name,
        exercise,
        ...dimensions,
        controls: await evaluate(
          `({viewButtons:document.querySelectorAll('[aria-label="Ângulo da câmera"] button').length,phase:Number(document.querySelector('input[aria-label="Posição do movimento"]').value),model:document.querySelector('section[aria-label^="Demonstração 3D"]').getAttribute('aria-label')})`,
        ),
      });
    }
  }
  const remoteAssets = requests.filter(
    (url) =>
      /\.(glb|hdr|wasm)(\?|$)/.test(url) &&
      !url.startsWith("http://127.0.0.1:3100/"),
  );
  await writeFile(
    new URL("browser-validation.json", out),
    JSON.stringify({ results, errors, remoteAssets }, null, 2),
  );
  if (errors.length || remoteAssets.length)
    throw new Error(JSON.stringify({ errors, remoteAssets }));
  console.log(JSON.stringify({ results, errors, remoteAssets }, null, 2));
} finally {
  await send("Browser.close").catch(() => {});
  socket.close();
  if (chrome.exitCode === null) chrome.unref();
}
