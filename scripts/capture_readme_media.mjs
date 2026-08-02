#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FRONTEND_URL = (process.env.TRUSTLINE_FRONTEND_URL || "https://trust-line-rho.vercel.app").replace(/\/$/, "");
const BACKEND_URL = (process.env.TRUSTLINE_BACKEND_URL || "https://trustline-t8vl.onrender.com").replace(/\/$/, "");
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const SCREENSHOTS = join(ROOT, "docs", "screenshots");
const DEMOS = join(ROOT, "docs", "demos");
const TEMP = join(ROOT, ".capture-temp");

function findPlaywright() {
  const explicit = process.env.PLAYWRIGHT_MODULE;
  const local = join(ROOT, "frontend", "node_modules", "playwright", "index.mjs");
  if (explicit && existsSync(explicit)) return explicit;
  if (existsSync(local)) return local;
  const npxRoot = join(homedir(), ".npm", "_npx");
  if (existsSync(npxRoot)) {
    const candidates = readdirSync(npxRoot)
      .map((entry) => join(npxRoot, entry, "node_modules", "playwright", "index.mjs"))
      .filter(existsSync)
      .sort((a, b) => b.localeCompare(a));
    if (candidates[0]) return candidates[0];
  }
  throw new Error("Playwright was not found. Run `cd frontend && npm install --no-save --package-lock=false playwright`. ");
}

async function api(path, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      });
      if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}: ${await response.text()}`);
      return response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 1000));
    }
  }
  throw lastError;
}

async function stablePage(page, path) {
  await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.locator("main").waitFor({ state: "visible", timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1400);
}

async function resetDemo() {
  await api("/demo/reset", { method: "POST" });
}

async function captureScreenshots(browser, atlasId) {
  const routes = [
    ["overview", "/"],
    ["presentation", "/presentation"],
    ["agents", "/agents"],
    ["registration", "/agents/new"],
    ["agent-detail", `/agents/${atlasId}`],
    ["demo", "/demo-lab"],
    ["analytics", "/analytics"],
    ["audit", "/audit"],
    ["system", "/system"],
  ];
  const viewports = [
    ["desktop", { width: 1440, height: 900 }],
    ["tablet", { width: 1024, height: 768 }],
    ["mobile", { width: 390, height: 844 }],
  ];
  for (const [size, viewport] of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const [name, path] of routes) {
      await stablePage(page, path);
      if (viewport.width === 390) {
        await page.addStyleTag({ content: "html,body,#root{max-width:100vw!important;overflow-x:hidden!important}main,main section,main .grid,main .bezel,main .bezel-core{min-width:0!important;max-width:100%!important}pre,code{max-width:100%!important}" });
      }
      await page.screenshot({ path: join(SCREENSHOTS, `${name}-${size}.png`), fullPage: path !== "/presentation" });
    }
    await context.close();
  }
}

async function record(browser, name, run) {
  const videoDir = join(TEMP, name);
  mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await run(page);
  await page.waitForTimeout(1600);
  const video = page.video();
  await context.close();
  const output = join(TEMP, `${name}.webm`);
  await video.saveAs(output);
  return output;
}

async function selectScenario(page, title) {
  const selector = page.getByRole("button", { name: new RegExp(title, "i") });
  await selector.scrollIntoViewIfNeeded();
  await selector.click();
}

async function runStory(page) {
  const start = page.getByRole("button", { name: /start story/i }).last();
  await start.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await start.click();
  await page.getByText("Proof complete").waitFor({ state: "visible", timeout: 30_000 });
}

function encodeGif(input, output, { fps = 10, width = 1100, colors = 96, dither = "bayer:bayer_scale=3" } = {}) {
  const palette = join(TEMP, `${output.split("/").pop()}.palette.png`);
  execFileSync("ffmpeg", ["-y", "-i", input, "-vf", `fps=${fps},scale=${width}:-2:flags=lanczos,palettegen=max_colors=${colors}`, "-frames:v", "1", "-update", "1", palette], { stdio: "inherit" });
  execFileSync("ffmpeg", ["-y", "-i", input, "-i", palette, "-lavfi", `fps=${fps},scale=${width}:-2:flags=lanczos[x];[x][1:v]paletteuse=dither=${dither}`, output], { stdio: "inherit" });
}

function contactSheets() {
  for (const size of ["desktop", "tablet", "mobile"]) {
    const files = ["overview", "presentation", "agents", "registration", "agent-detail", "demo", "analytics", "audit", "system"]
      .map((name) => join(SCREENSHOTS, `${name}-${size}.png`));
    execFileSync("magick", ["montage", ...files, "-thumbnail", "420x520>", "-tile", "3x3", "-geometry", "+16+16", "-background", "#F4F0E6", join(SCREENSHOTS, `${size}-contact-sheet.png`)], { stdio: "inherit" });
  }
}

async function main() {
  mkdirSync(SCREENSHOTS, { recursive: true });
  mkdirSync(DEMOS, { recursive: true });
  rmSync(TEMP, { recursive: true, force: true });
  mkdirSync(TEMP, { recursive: true });
  const playwrightPath = findPlaywright();
  const { chromium } = await import(pathToFileURL(playwrightPath).href);
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  await api("/health");
  await resetDemo();
  const catalog = await api("/demo/scenarios");
  const atlas = catalog.scenarios.find((scenario) => scenario.agent_name === "Atlas Procurement Bot")?.agent;
  if (!atlas?.id) throw new Error("Atlas Procurement Bot is missing after reset.");
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    if (process.env.CAPTURE_SCREENSHOTS !== "false") {
      await captureScreenshots(browser, atlas.id);
    }

    if (process.env.CAPTURE_GIFS !== "false") {
      await resetDemo();
      const successVideo = await record(browser, "success-cycle", async (page) => {
      await stablePage(page, "/demo-lab");
      await selectScenario(page, "Complete success cycle");
      await runStory(page);
    });

      await resetDemo();
      const coldVideo = await record(browser, "cold-start", async (page) => {
      await stablePage(page, "/demo-lab");
      await selectScenario(page, "Cold-start boundary");
      await page.getByRole("button", { name: "Technical evidence" }).click();
      await runStory(page);
    });
      await resetDemo();
      const failureVideo = await record(browser, "failed-repayment", async (page) => {
      await stablePage(page, "/demo-lab");
      await selectScenario(page, "Failed repayment");
      await page.getByRole("button", { name: "Technical evidence" }).click();
      await runStory(page);
    });
      const concatFile = join(TEMP, "enforcement.txt");
      writeFileSync(concatFile, `file '${coldVideo}'\nfile '${failureVideo}'\n`);
      const enforcementVideo = join(TEMP, "enforcement.webm");
      execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", enforcementVideo], { stdio: "inherit" });

      await resetDemo();
      const analyticsVideo = await record(browser, "analytics-simulator", async (page) => {
      await stablePage(page, "/analytics");
      const simulator = page.getByText("Ask the gateway without moving money");
      await simulator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.getByLabel("Amount").fill("900");
      await page.locator("label", { hasText: "Merchant category" }).locator("select").selectOption("CRYPTO_EXCHANGE");
      await page.locator("label", { hasText: "Repayment outcome" }).locator("select").selectOption("FAIL");
      await page.getByRole("button", { name: /run non-mutating check/i }).click();
      await page.getByText("REJECTED", { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    });

      encodeGif(successVideo, join(DEMOS, "trustline-success-cycle.gif"));
      encodeGif(enforcementVideo, join(DEMOS, "trustline-enforcement-proof.gif"), { fps: 6, width: 900, colors: 48, dither: "none" });
      encodeGif(analyticsVideo, join(DEMOS, "trustline-analytics-simulator.gif"));
    }
    if (process.env.CAPTURE_SCREENSHOTS !== "false") contactSheets();
  } finally {
    await browser.close();
    await resetDemo();
    rmSync(TEMP, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
