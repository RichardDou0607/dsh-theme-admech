/**
 * Minimal Chrome DevTools Protocol driver — no npm dependencies.
 * Node 24 provides a global WebSocket and fetch.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

export function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error('no Chrome/Edge found');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchBrowser({ port = 9333, headless = true, profileDir } = {}) {
  const userDataDir = profileDir || fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-profile-'));
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-features=Translate,MediaRouter,OptimizationHints',
    '--no-proxy-server',
    '--metrics-recording-only',
    '--mute-audio',
    '--window-size=1440,900',
  ];
  if (headless) args.unshift('--headless=new');
  const proc = spawn(findChrome(), args, { stdio: 'ignore', windowsHide: true });

  let version = null;
  for (let i = 0; i < 100; i++) {
    await sleep(150);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) { version = await res.json(); break; }
    } catch { /* not up yet */ }
  }
  if (!version) {
    proc.kill();
    throw new Error('chrome devtools endpoint never came up');
  }
  return { proc, version, userDataDir, port, close: () => { try { proc.kill(); } catch { /* ignore */ } } };
}

export class Session {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result);
        return;
      }
      if (msg.method) for (const fn of this.listeners) fn(msg);
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 120000);
    });
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  waitFor(method, sessionId, timeoutMs = 60000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { off(); reject(new Error(`timeout waiting ${method}`)); }, timeoutMs);
      const off = this.on((msg) => {
        if (msg.method === method && (!sessionId || msg.sessionId === sessionId)) {
          clearTimeout(timer); off(); resolve(msg.params);
        }
      });
    });
  }
}

export async function connect(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/version`);
  const { webSocketDebuggerUrl } = await res.json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('ws error')), { once: true });
  });
  return new Session(ws);
}

/** Opens a new tab (flattened session) and returns { targetId, sessionId }. */
export async function newPage(session, url = 'about:blank') {
  const { targetId } = await session.send('Target.createTarget', { url });
  const { sessionId } = await session.send('Target.attachToTarget', { targetId, flatten: true });
  await session.send('Page.enable', {}, sessionId);
  await session.send('Runtime.enable', {}, sessionId);
  await session.send('Log.enable', {}, sessionId);
  return { targetId, sessionId };
}

/** Runs an async expression in the page and returns its JSON value. */
export async function evaluate(session, sessionId, expression) {
  const res = await session.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  }, sessionId);
  if (res.exceptionDetails) {
    throw new Error(`page exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
  }
  return res.result?.value;
}

export async function screenshot(session, sessionId, filePath) {
  const { data } = await session.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  }, sessionId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  return filePath;
}

export async function setViewport(session, sessionId, { width, height, dpr = 1, mobile = false }) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: dpr, mobile,
    screenWidth: width, screenHeight: height,
  }, sessionId);
}

/**
 * Emulates what the Electron preload sets on Windows desktop before the app
 * boots: the platform marker, the in-window titlebar band, and its height.
 */
export async function emulateWindowsDesktop(session, sessionId, { titlebarHeight = 40 } = {}) {
  const source = `(() => {
    const HEIGHT = ${JSON.stringify(String(titlebarHeight) + 'px')};
    const apply = () => {
      const de = document.documentElement;
      if (!de) return false;
      de.setAttribute('data-windows-titlebar', '');
      de.style.setProperty('--dsh-windows-titlebar-height', HEIGHT);
      return true;
    };
    if (!apply()) {
      const mo = new MutationObserver(() => { if (apply()) mo.disconnect(); });
      mo.observe(document, { childList: true, subtree: true });
    }
  })();`;
  await session.send('Page.addScriptToEvaluateOnNewDocument', { source }, sessionId);
}

export { sleep };
