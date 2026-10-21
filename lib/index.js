/**
 * dsh-theme-admech — host half.
 *
 * Two duties:
 *
 * 1. Serve the Forge-Cathedral backdrop SVG the boot prelude paints before any
 *    client bundle can run.
 * 2. Inject a boot prelude into every index the Host renders. The stock Web
 *    shell paints its own "HARNESS / Loading plugins…" screen while the client
 *    graph activates; the theme used to appear only afterwards, so opening DSH
 *    showed the original startup animation *and* the kit ignition sequence.
 *    The injected prelude starts at first paint, hides the native boot screen,
 *    and hands over to the client ignition splash with carried progress.
 *
 * The prelude is plain HTML/CSS plus a tiny classic script; it never mutates
 * the React tree and removes itself as soon as the client splash (or the app)
 * takes over.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, "..", "assets");

/** Boot prelude backdrop route. Document-relative URLs resolve under it. */
const BACKDROP_ROUTE = "/theme-admech/forge-cathedral.svg";

function readAsset(name) {
  try {
    return readFileSync(join(ASSETS, name));
  } catch {
    return null;
  }
}

const backdrop = readAsset("forge-cathedral.svg");
const emblem = readAsset("gear-skull-gold-128.png");
const EMBLEM_URI = emblem === null ? "" : "data:image/png;base64," + emblem.toString("base64");
const EMBLEM_MARKUP = EMBLEM_URI === "" ? "" : '<img src="' + EMBLEM_URI + '" alt="">';

const BOOT_CSS = "html[data-admech-booting] [data-dsh-boot],\nhtml:has(#admech-boot-prelude) [data-dsh-boot] { display: none !important; }\nhtml[data-admech-booting],\nhtml:has(#admech-boot-prelude) { background: #060402 !important; }\nhtml[data-admech-booting] body,\nhtml:has(#admech-boot-prelude) body { background: #060402 !important; }\n\n#admech-boot-prelude {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n  background-color: #060402;\n  background-image:\n    radial-gradient(620px 460px at 50% 46%, rgba(201, 161, 90, 0.13), transparent 68%),\n    radial-gradient(900px 700px at 50% 108%, rgba(142, 31, 26, 0.18), transparent 70%),\n    linear-gradient(180deg, rgba(4, 3, 2, 0.78) 0%, rgba(6, 4, 2, 0.46) 46%, rgba(3, 2, 1, 0.94) 100%),\n    url(\"./theme-admech/forge-cathedral.svg\");\n  background-size: cover, cover, cover, cover;\n  background-position: center, center, center, center bottom;\n  background-repeat: no-repeat;\n  color: #ece2cc;\n  font-family: \"PingFang SC\", \"Noto Sans CJK SC\", \"Microsoft YaHei\", \"微软雅黑\", sans-serif;\n  cursor: default;\n  user-select: none;\n  -webkit-font-smoothing: antialiased;\n  animation: admechBootVeil 280ms ease-out both;\n}\n#admech-boot-prelude::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  background:\n    radial-gradient(ellipse at 50% 52%, transparent 32%, rgba(0, 0, 0, 0.62) 100%),\n    repeating-linear-gradient(180deg, rgba(201, 161, 90, 0.028) 0 1px, transparent 1px 3px);\n}\n#admech-boot-prelude::after {\n  content: \"\";\n  position: absolute;\n  inset: 12px;\n  pointer-events: none;\n  border: 1px solid rgba(201, 161, 90, 0.20);\n  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 90px rgba(0, 0, 0, 0.55);\n}\n#admech-boot-prelude .admech-boot-ray {\n  position: absolute;\n  left: 50%;\n  top: 42%;\n  width: 120vmax;\n  height: 120vmax;\n  transform: translate(-50%, -50%);\n  background: conic-gradient(from 0deg, transparent 0deg, rgba(227, 193, 132, 0.05) 12deg, transparent 24deg, transparent 52deg, rgba(227, 193, 132, 0.032) 62deg, transparent 76deg, transparent 120deg, rgba(227, 193, 132, 0.042) 130deg, transparent 145deg, transparent 190deg, rgba(227, 193, 132, 0.03) 200deg, transparent 214deg, transparent 268deg, rgba(227, 193, 132, 0.046) 278deg, transparent 292deg, transparent 330deg, rgba(227, 193, 132, 0.032) 340deg, transparent 355deg);\n  animation: admechBootRay 30s linear infinite;\n  pointer-events: none;\n}\n#admech-boot-prelude .admech-boot-scan {\n  position: absolute;\n  left: 0;\n  right: 0;\n  height: 1px;\n  top: 12%;\n  background: linear-gradient(90deg, transparent, rgba(227, 193, 132, 0.42), transparent);\n  box-shadow: 0 0 18px rgba(227, 193, 132, 0.22);\n  opacity: 0.32;\n  animation: admechBootScan 5.4s linear infinite;\n  pointer-events: none;\n}\n#admech-boot-prelude .admech-boot-content {\n  position: relative;\n  z-index: 2;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  width: min(420px, 82vw);\n  text-align: center;\n}\n#admech-boot-prelude .admech-boot-content::before {\n  content: \"\";\n  position: absolute;\n  inset: -50px -70px;\n  z-index: -1;\n  pointer-events: none;\n  background:\n    radial-gradient(ellipse at 50% 36%, rgba(5, 3, 2, 0.88) 0%, rgba(5, 3, 2, 0.56) 54%, transparent 76%),\n    radial-gradient(ellipse at 50% 38%, rgba(201, 161, 90, 0.10), transparent 64%);\n}\n#admech-boot-prelude .kicker {\n  font-family: \"Menlo\", \"SFMono-Regular\", \"Cascadia Mono\", \"Consolas\", \"Noto Sans Mono CJK SC\", monospace;\n  font-size: 8px;\n  letter-spacing: 0.32em;\n  color: rgba(201, 161, 90, 0.65);\n  margin-bottom: 18px;\n  white-space: nowrap;\n}\n#admech-boot-prelude .sigil {\n  position: relative;\n  width: 92px;\n  height: 92px;\n  margin: 0 auto 14px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  filter: drop-shadow(0 0 26px rgba(227, 193, 132, 0.38));\n  animation: admechBootSigil 900ms ease-out both, admechBootPulse 3.4s ease-in-out 1s infinite;\n}\n#admech-boot-prelude .sigil::before {\n  content: \"\";\n  position: absolute;\n  inset: -13px;\n  border-radius: 50%;\n  border: 1px solid rgba(201, 161, 90, 0.26);\n  border-top-color: rgba(227, 193, 132, 0.72);\n  border-right-color: rgba(201, 161, 90, 0.12);\n  animation: admechBootRing 8s linear infinite;\n}\n#admech-boot-prelude .sigil::after {\n  content: \"\";\n  position: absolute;\n  inset: -23px;\n  border-radius: 50%;\n  border: 1px dashed rgba(201, 161, 90, 0.16);\n  animation: admechBootRing 22s linear infinite reverse;\n}\n#admech-boot-prelude .sigil img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  display: block;\n}\n#admech-boot-prelude h1 {\n  font-family: \"Noto Serif CJK SC\", \"Noto Serif SC\", \"Source Han Serif SC\", \"Songti SC\", \"Palatino Linotype\", \"Palatino\", \"Georgia\", serif;\n  font-size: 38px;\n  line-height: 1.12;\n  font-weight: 400;\n  letter-spacing: 0.16em;\n  color: #f3e7cd;\n  margin: 0 0 8px;\n  text-shadow: 0 0 26px rgba(201, 161, 90, 0.22), 0 2px 0 rgba(0, 0, 0, 0.6);\n}\n#admech-boot-prelude .sub {\n  font-family: \"Noto Serif CJK SC\", \"Songti SC\", \"Palatino Linotype\", \"Palatino\", \"Georgia\", serif;\n  font-size: 10px;\n  letter-spacing: 0.46em;\n  color: rgba(201, 161, 90, 0.82);\n  margin-left: 0.46em;\n  margin-bottom: 7px;\n}\n#admech-boot-prelude .latin {\n  font-family: \"Menlo\", \"SFMono-Regular\", \"Cascadia Mono\", \"Consolas\", \"Noto Sans Mono CJK SC\", monospace;\n  font-size: 8px;\n  letter-spacing: 0.22em;\n  color: rgba(195, 179, 148, 0.55);\n  margin-bottom: 20px;\n}\n#admech-boot-prelude .log-space {\n  width: min(360px, 76vw);\n  height: 53px;\n  margin: 0 0 14px;\n}\n#admech-boot-prelude .rail {\n  position: relative;\n  width: min(320px, 70vw);\n  height: 4px;\n  margin: 2px 0 7px;\n  background: rgba(201, 161, 90, 0.14);\n  border-top: 1px solid rgba(201, 161, 90, 0.30);\n  border-bottom: 1px solid rgba(0, 0, 0, 0.6);\n  overflow: hidden;\n}\n#admech-boot-prelude .rail::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  background: repeating-linear-gradient(90deg, transparent 0 10px, rgba(0, 0, 0, 0.55) 10px 12px);\n  pointer-events: none;\n}\n#admech-boot-prelude .rail i {\n  display: block;\n  width: 0;\n  height: 100%;\n  background: linear-gradient(90deg, rgba(142, 31, 26, 0.9), #c9a15a 55%, #f0d49a);\n  box-shadow: 0 0 14px rgba(201, 161, 90, 0.55);\n}\n#admech-boot-prelude .status {\n  display: flex;\n  justify-content: space-between;\n  width: min(320px, 70vw);\n  font-family: \"Menlo\", \"SFMono-Regular\", \"Cascadia Mono\", \"Consolas\", \"Noto Sans Mono CJK SC\", monospace;\n  font-size: 8px;\n  letter-spacing: 0.18em;\n  color: rgba(201, 161, 90, 0.64);\n}\n#admech-boot-prelude .status .pct { color: rgba(227, 193, 132, 0.9); }\n#admech-boot-prelude .admech-boot-footer {\n  position: absolute;\n  left: 50%;\n  bottom: 26px;\n  z-index: 2;\n  transform: translateX(-50%);\n  width: min(760px, 88vw);\n  text-align: center;\n  font-family: \"Menlo\", \"SFMono-Regular\", \"Cascadia Mono\", \"Consolas\", \"Noto Sans Mono CJK SC\", monospace;\n  font-size: 8px;\n  letter-spacing: 0.20em;\n  color: rgba(195, 179, 148, 0.40);\n  pointer-events: none;\n  white-space: nowrap;\n}\n#admech-boot-prelude.is-out { opacity: 0; transition: opacity 320ms ease; pointer-events: none; }\n@keyframes admechBootVeil { from { opacity: 0; } to { opacity: 1; } }\n@keyframes admechBootRing { to { transform: rotate(360deg); } }\n@keyframes admechBootRay { to { transform: translate(-50%, -50%) rotate(360deg); } }\n@keyframes admechBootScan { 0% { top: 10%; opacity: 0; } 12% { opacity: 0.35; } 88% { opacity: 0.35; } 100% { top: 92%; opacity: 0; } }\n@keyframes admechBootSigil { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }\n@keyframes admechBootPulse { 0%, 100% { filter: drop-shadow(0 0 22px rgba(227, 193, 132, 0.30)); } 50% { filter: drop-shadow(0 0 38px rgba(227, 193, 132, 0.48)); } }\n@keyframes admechBootRail { from { width: 0; } to { width: 100%; } }\n@media (prefers-reduced-motion: reduce) {\n  #admech-boot-prelude, #admech-boot-prelude * { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition: none !important; }\n  #admech-boot-prelude .rail i { width: 100% !important; }\n}";

const PRELUDE_HTML = "<div id=\"admech-boot-prelude\" role=\"status\" aria-label=\"铸造圣殿启动\">\n  <div class=\"admech-boot-ray\"></div>\n  <div class=\"admech-boot-scan\"></div>\n  <div class=\"admech-boot-content\">\n    <div class=\"kicker\">DEEPSEEK HARNESS // NOOSPHERE LINK</div>\n    <div class=\"sigil\">__ADMECH_EMBLEM_MARKUP__</div>\n    <h1>铸造圣殿</h1>\n    <div class=\"sub\">FORGE-CATHEDRAL</div>\n    <div class=\"latin\">MACHINA · MARS · LUX AETERNA</div>\n    <div class=\"log-space\" aria-hidden=\"true\"></div>\n    <div class=\"rail\"><i></i></div>\n    <div class=\"status\"><span>IGNITING FORGE</span><span class=\"pct\">000%</span></div>\n  </div>\n  <div class=\"admech-boot-footer\">OMNISSIAH · DEUS MACHINA · EX FERRO · EX IGNE · IN TENEBRIS LUX AETERNA</div>\n</div>".split("__ADMECH_EMBLEM_MARKUP__").join(EMBLEM_MARKUP);

const BOOT_JS = "(function () {\n  var doc = document;\n  var prelude = doc.getElementById('admech-boot-prelude');\n  if (!prelude) return;\n  var root = doc.documentElement;\n  root.setAttribute('data-admech-booting', 'true');\n  var removed = false;\n  var raf = 0;\n\n  function removePrelude(fadeDelay) {\n    if (removed) return;\n    removed = true;\n    if (raf) { try { cancelAnimationFrame(raf); } catch (e) {} raf = 0; }\n    root.removeAttribute('data-admech-booting');\n    var wait = fadeDelay || 0;\n    if (wait > 0) {\n      prelude.classList.add('is-out');\n      setTimeout(function () { if (prelude.parentNode) prelude.parentNode.removeChild(prelude); }, wait);\n    } else if (prelude.parentNode) {\n      prelude.parentNode.removeChild(prelude);\n    }\n  }\n  window.__admechBootPrelude = { remove: removePrelude, element: prelude };\n\n  var start = (window.performance && performance.now) ? performance.now() : Date.now();\n  var DUR = 3200;\n  var fill = prelude.querySelector('.rail i');\n  var pctEl = prelude.querySelector('.pct');\n  var reduced = false;\n  try { reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}\n\n  function tick(now) {\n    if (removed) return;\n    var pct = Math.max(0, Math.min(97, ((now - start) / DUR) * 100));\n    if (fill && !fill.style.width) fill.style.width = pct + '%';\n    if (pctEl) pctEl.textContent = ('00' + Math.floor(pct)).slice(-3) + '%';\n    raf = window.requestAnimationFrame(tick);\n  }\n  if (!reduced) raf = window.requestAnimationFrame(tick);\n\n  var lastSplash = false;\n  function check() {\n    if (removed) return;\n    var splash = doc.querySelector('.admech-splash');\n    if (splash) {\n      if (!lastSplash) {\n        lastSplash = true;\n        setTimeout(function () { removePrelude(0); }, 80);\n      }\n      return;\n    }\n    var boot = doc.querySelector('[data-dsh-boot]');\n    var failed = false;\n    if (boot) {\n      var cls = typeof boot.className === 'string' ? boot.className : '';\n      failed = /failed/i.test(cls) || /Failed to load plugins/i.test(boot.textContent || '');\n    }\n    if (failed) {\n      if (prelude.parentNode) prelude.parentNode.removeChild(prelude);\n      removed = true;\n      if (raf) { try { cancelAnimationFrame(raf); } catch (e) {} raf = 0; }\n      root.removeAttribute('data-admech-booting');\n      return;\n    }\n    var mounted = doc.querySelector('[data-composer-card], [data-slot=\"sidebar\"], [data-slot=\"main\"]');\n    if (mounted) {\n      setTimeout(function () { if (!doc.querySelector('.admech-splash')) removePrelude(320); }, 3200);\n    }\n  }\n  var observer = new MutationObserver(check);\n  observer.observe(doc.documentElement, { childList: true, subtree: true });\n  check();\n  setTimeout(function () { if (!doc.querySelector('.admech-splash')) removePrelude(320); }, 22000);\n})();";

export function apply(ctx) {
  if (backdrop !== null) {
    ctx.inject(["webServer"], (webCtx) => {
      webCtx.effect(() => webCtx.webServer.register({
        kind: "exact",
        path: BACKDROP_ROUTE,
        handler(request, response) {
          if (request.method !== "GET" && request.method !== "HEAD") {
            response.writeHead(405, { allow: "GET, HEAD" });
            response.end();
            return;
          }
          response.writeHead(200, {
            "content-type": "image/svg+xml; charset=utf-8",
            "content-length": String(backdrop.length),
            "cache-control": "public, max-age=86400",
          });
          response.end(request.method === "HEAD" ? undefined : backdrop);
        },
      }), "theme-admech: boot backdrop");
    });
  }

  ctx.on("webserver/index-inject", (table) => {
    table.push({ kind: "style", text: BOOT_CSS });
    table.push({ kind: "html", placement: "body", html: PRELUDE_HTML });
    table.push({ kind: "script", placement: "body", text: BOOT_JS });
  });
}
