/**
 * Screenshot + layout audit runner for the DSH web UI on Windows.
 *
 *   node tools/win-audit/run-audit.mjs --url 'http://127.0.0.1:3080/?token=...' --out shots/win --scenario desktop
 *
 * Scenarios describe viewport width/height and device scale factor; Windows
 * display scaling 125% / 150% is emulated through deviceScaleFactor.
 */
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, connect, newPage, evaluate, screenshot, setViewport, emulateWindowsDesktop, sleep } from './cdp.mjs';
import { AUDIT_FN, DISMISS_FN, SPECIMEN_FN, SPECIMEN_LEGACY_FN } from './page-audit.js';

const SCENARIOS = {
  desktop: { width: 1440, height: 900, dpr: 1 },
  'desktop-125': { width: 1440, height: 900, dpr: 1.25 },
  'desktop-150': { width: 1440, height: 900, dpr: 1.5 },
  laptop: { width: 1280, height: 800, dpr: 1.25 },
  'snap-half': { width: 1100, height: 760, dpr: 1 },
  'snap-third': { width: 900, height: 720, dpr: 1 },
  narrow: { width: 760, height: 640, dpr: 1 },
  'small-hi': { width: 1920, height: 1080, dpr: 1.5 },
  // A 1920x1080 laptop at 125% / 150% Windows display scaling (CSS viewport).
  'win-1080p-125': { width: 1536, height: 864, dpr: 1.25 },
  'win-1080p-150': { width: 1280, height: 720, dpr: 1.5 },
  // 2x render for typography crops.
  hidpi: { width: 1440, height: 900, dpr: 2 },
};

function parseArgs(argv) {
  const args = { url: 'http://127.0.0.1:3080/', out: 'shots/win', scenario: ['desktop'], wait: 8000, splash: false, port: 9333 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') args.url = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--scenario') args.scenario = argv[++i].split(',');
    else if (a === '--wait') args.wait = Number(argv[++i]);
    else if (a === '--splash') args.splash = true;
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a === '--zoom') args.zoom = true;
    else if (a === '--desktop-win') args.desktopWin = true;
    else if (a === '--media') args.media = argv[++i];
    else if (a === '--specimen') args.specimen = true;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args.out);
fs.mkdirSync(outDir, { recursive: true });

const browser = await launchBrowser({ port: args.port });
const session = await connect(args.port);
const results = {};

try {
  for (const name of args.scenario) {
    const sc = SCENARIOS[name];
    if (!sc) throw new Error(`unknown scenario ${name}`);
    const page = await newPage(session, 'about:blank');
    const logs = [];
    const off = session.on((msg) => {
      if (msg.sessionId !== page.sessionId) return;
      if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
        logs.push({ type: msg.params.type, text: msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 300) });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        logs.push({ type: 'exception', text: (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text || '').slice(0, 400) });
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        logs.push({ type: 'log', text: String(msg.params.entry.text).slice(0, 300) });
      }
    });

    await setViewport(session, page.sessionId, sc);
    if (args.desktopWin) await emulateWindowsDesktop(session, page.sessionId);
    if (args.media) {
      const [name, value] = args.media.split('=');
      await session.send('Emulation.setEmulatedMedia', { features: [{ name, value }] }, page.sessionId);
    }
    await session.send('Page.navigate', { url: args.url }, page.sessionId);
    await session.waitFor('Page.loadEventFired', page.sessionId, 90000).catch(() => {});

    let splashShot = null;
    if (args.splash) {
      await sleep(1100);
      splashShot = await screenshot(session, page.sessionId, path.join(outDir, `${name}-splash.png`));
    }

    // Wait for the app shell, then let the theme finish its icon/tagging pass.
    const deadline = Date.now() + 60000;
    let ready = false;
    while (Date.now() < deadline) {
      ready = await evaluate(session, page.sessionId, `!!(document.querySelector('[data-slot="sidebar"]') || document.querySelector('[data-slot="main"]'))`).catch(() => false);
      if (ready) break;
      await sleep(400);
    }
    await sleep(args.splash ? 3200 : 800);

    // Clear the ignition splash and the one-time "preview version" dialog so the
    // measured surface is the real app, not an onboarding gate.
    let dismissed = [];
    for (let i = 0; i < 4; i++) {
      const clicked = await evaluate(session, page.sessionId, DISMISS_FN).catch(() => []);
      dismissed = dismissed.concat(clicked || []);
      if (!clicked || clicked.length === 0) break;
      await sleep(700);
    }
    await sleep(args.wait);

    const probe = await evaluate(session, page.sessionId, AUDIT_FN);
    const shot = await screenshot(session, page.sessionId, path.join(outDir, `${name}.png`));

    // Specimen board: the theme's framed surfaces rendered on synthetic nodes,
    // then the same board with the legacy small-corner weight for an A/B.
    if (args.specimen) {
      await evaluate(session, page.sessionId, SPECIMEN_FN);
      await sleep(600);
      await screenshot(session, page.sessionId, path.join(outDir, `${name}-specimen.png`));
      await evaluate(session, page.sessionId, SPECIMEN_LEGACY_FN);
      await sleep(500);
      await screenshot(session, page.sessionId, path.join(outDir, `${name}-specimen-legacy.png`));
      await evaluate(session, page.sessionId, `(() => { const n = document.getElementById("admech-specimen"); if (n) n.remove(); return true; })()`);
      await sleep(300);
    }

    // 2x zoomed crops of the typography-heavy regions, for eyeballing fonts.
    if (args.zoom) {
      const regions = {
        hero: '[data-slot="conversation.hero"]',
        composer: '[data-slot="conversation.composer"]',
        sidebar: '[data-slot="sidebar"]',
      };
      for (const [label, sel] of Object.entries(regions)) {
        const rect = await evaluate(session, page.sessionId, `(() => {
          const el = document.querySelector(${JSON.stringify(sel)});
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const pad = 8;
          return { x: Math.max(0, r.left - pad), y: Math.max(0, r.top - pad), width: Math.min(innerWidth, r.width + pad * 2), height: Math.min(innerHeight, r.height + pad * 2) };
        })()`).catch(() => null);
        if (!rect || rect.width < 10 || rect.height < 10) continue;
        const { data } = await session.send('Page.captureScreenshot', {
          format: 'png', fromSurface: true, captureBeyondViewport: false,
          clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 2 },
        }, page.sessionId);
        fs.writeFileSync(path.join(outDir, `${name}-${label}-2x.png`), Buffer.from(data, 'base64'));
      }
    }

    results[name] = { scenario: sc, ready, dismissed, probe, console: logs, shot, splashShot };
    off();
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(results[name], null, 2), 'utf8');
    await session.send('Target.closeTarget', { targetId: page.targetId });
    console.log(`[${name}] ${sc.width}x${sc.height}@${sc.dpr} ready=${ready} clipped=${probe.clippedText?.length ?? '?'} overlaps=${probe.overlaps?.length ?? '?'} icons=${probe.theme?.themedIcons}/${probe.theme?.totalSvg}`);
  }
} finally {
  try { browser.close(); } catch { /* ignore */ }
}

fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('wrote', path.join(outDir, 'summary.json'));
