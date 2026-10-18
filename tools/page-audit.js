/**
 * Injected into the page: collects Windows-relevant layout / font evidence.
 * Serialized as a string and evaluated with Runtime.evaluate.
 */
export const AUDIT_FN = String.raw`
(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = {};

  /* ---------- environment ---------- */
  const de = document.documentElement;
  out.env = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    dpr: window.devicePixelRatio,
    docClientWidth: de.clientWidth,
    docScrollWidth: de.scrollWidth,
    docClientHeight: de.clientHeight,
    docScrollHeight: de.scrollHeight,
    verticalScrollbar: window.innerWidth - de.clientWidth,
    horizontalScrollbar: window.innerHeight - de.clientHeight,
    bodyScrollWidth: document.body.scrollWidth,
    ua: navigator.userAgent,
    platform: navigator.platform,
  };

  /* ---------- font availability probe ---------- */
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const widthOf = (text, font) => { ctx.font = font; return ctx.measureText(text).width; };
  const hasFont = (family) => {
    const probe = "mmmmmmmmmmlliWWQ@#";
    const withFamily = widthOf(probe, '72px "' + family + '", monospace');
    const mono = widthOf(probe, "72px monospace");
    const serif = widthOf(probe, "72px serif");
    const sans = widthOf(probe, "72px sans-serif");
    return !(
      Math.abs(withFamily - mono) < 0.5 ||
      Math.abs(withFamily - serif) < 0.5 ||
      Math.abs(withFamily - sans) < 0.5
    );
  };
  const candidates = [
    "Palatino", "Palatino Linotype", "Book Antiqua", "Georgia", "Cambria", "Times New Roman",
    "SimSun", "NSimSun", "Microsoft YaHei", "Microsoft YaHei Light", "Microsoft YaHei UI",
    "KaiTi", "FangSong", "DengXian", "Segoe UI", "Segoe UI Variable", "Segoe UI Symbol",
    "Cascadia Mono", "Cascadia Code", "Consolas", "Courier New", "Lucida Console",
    "Noto Serif CJK SC", "Noto Serif SC", "Noto Sans SC", "Source Han Serif SC", "Songti SC",
    "Menlo", "SFMono-Regular", "Arial", "Verdana", "Tahoma", "Bahnschrift", "Sitka Text",
    "Constantia", "Candara", "Corbel", "Franklin Gothic Medium", "Garamond"
  ];
  out.fontsPresent = {};
  for (const f of candidates) out.fontsPresent[f] = hasFont(f);

  /* ---------- theme state ---------- */
  out.theme = {
    rootAttr: de.getAttribute("data-dsh-admech"),
    os: de.getAttribute("data-admech-os"),
    hairline: getComputedStyle(de).getPropertyValue("--admech-hairline").trim(),
    scrollbarVar: getComputedStyle(document.body).getPropertyValue("--dsh-scrollbar-width").trim(),
    titlebarMarker: de.hasAttribute("data-windows-titlebar"),
    stylePresent: !!document.querySelector('style[data-dsh-theme="admech"]'),
    iconStats: window.__admechIconStats || null,
    splashPresent: !!document.querySelector("[data-admech-splash]"),
    taggedNodes: document.querySelectorAll("[data-admech]").length,
    themedIcons: document.querySelectorAll("svg[data-admech-icon]").length,
    totalSvg: document.querySelectorAll("svg").length,
    // resolved font stacks actually reported by the engine
    resolverSerif: getComputedStyle(de).getPropertyValue("--admech-serif").trim(),
    resolverMono: getComputedStyle(de).getPropertyValue("--admech-mono").trim(),
  };

  /* ---------- which physical font a given stack really uses ---------- */
  // Compare rendered width of a probe against every single-family stack:
  // the family whose metrics match is the one the engine selected.
  const stacks = {
    serif: ["Palatino Linotype", "SimSun", "NSimSun", "Microsoft YaHei", "Georgia", "Times New Roman", "Cambria"],
    mono: ["Cascadia Mono", "Consolas", "Courier New", "Lucida Console", "Menlo"],
  };
  const identify = (fontFamily, text) => {
    const actual = widthOf(text, "32px " + fontFamily);
    const hits = [];
    for (const fam of [...stacks.serif, ...stacks.mono]) {
      if (!hasFont(fam)) continue;
      const w = widthOf(text, '32px "' + fam + '"');
      if (Math.abs(w - actual) < 0.6) hits.push(fam);
    }
    return { width: Math.round(actual * 100) / 100, hits };
  };
  out.fontResolution = {
    serifLatin: identify(getComputedStyle(de).getPropertyValue("--admech-serif").trim() || "serif", "Forge Cathedral 0123"),
    serifCjk: identify(getComputedStyle(de).getPropertyValue("--admech-serif").trim() || "serif", "铸造圣殿机械神教"),
    monoLatin: identify(getComputedStyle(de).getPropertyValue("--admech-mono").trim() || "monospace", "FORGE 0123"),
  };

  /* ---------- per-element font metrics for key regions ---------- */
  const KEY = [
    ["sidebar", '[data-slot="sidebar"]'],
    ["brandRow", '[data-admech="brandrow"]'],
    ["newSession", '[data-admech="new-session"]'],
    ["header", '[data-admech="header"]'],
    ["hero", '[data-slot="conversation.hero"], [data-admech="hero-headline"]'],
    ["composer", '[data-slot="composer"], textarea, [contenteditable="true"]'],
    ["sessionRow", '[data-admech="session"]'],
  ];
  out.regions = {};
  for (const [name, sel] of KEY) {
    const el = document.querySelector(sel);
    if (!el) { out.regions[name] = null; continue; }
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    out.regions[name] = {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      fontWeight: cs.fontWeight,
      textTransform: cs.textTransform,
      box: [Math.round(r.width), Math.round(r.height)],
      scroll: [el.scrollWidth, el.scrollHeight],
      text: (el.textContent || "").trim().slice(0, 40),
    };
  }

  /* ---------- clipped / overflowing text ---------- */
  const clipped = [];
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const all = document.querySelectorAll("body *");
  for (const el of all) {
    if (el.children.length > 0 && !(el.childNodes.length === 1 && el.firstChild.nodeType === 3)) continue;
    const text = (el.textContent || "").trim();
    if (!text || text.length < 1) continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const hiddenX = cs.overflowX === "hidden" || cs.overflowX === "clip";
    const hiddenY = cs.overflowY === "hidden" || cs.overflowY === "clip";
    const overX = el.scrollWidth - el.clientWidth;
    const overY = el.scrollHeight - el.clientHeight;
    const nowrap = cs.whiteSpace === "nowrap" || cs.whiteSpace === "pre";
    if ((hiddenX || nowrap) && overX > 1) {
      clipped.push({ axis: "x", over: overX, text: text.slice(0, 40), tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), box: [Math.round(el.clientWidth), Math.round(el.scrollWidth)] });
    } else if (hiddenY && overY > 2) {
      clipped.push({ axis: "y", over: overY, text: text.slice(0, 40), tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 60), box: [Math.round(el.clientHeight), Math.round(el.scrollHeight)] });
    }
    if (clipped.length > 40) break;
  }
  out.clippedText = clipped;

  /* ---------- overlapping interactive elements ---------- */
  const interactives = [...document.querySelectorAll("button, a[href], input, textarea, select, [role=button], [role=link], [contenteditable=true]")]
    .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed")
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 4 && r.height > 4);
  const overlaps = [];
  for (let i = 0; i < interactives.length; i++) {
    for (let j = i + 1; j < interactives.length; j++) {
      const a = interactives[i], b = interactives[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const x = Math.max(0, Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left));
      const y = Math.max(0, Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top));
      const area = x * y;
      if (area < 40) continue;
      const minArea = Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
      if (area / minArea < 0.12) continue;
      overlaps.push({
        a: (a.el.getAttribute("aria-label") || a.el.textContent || "").trim().slice(0, 24),
        b: (b.el.getAttribute("aria-label") || b.el.textContent || "").trim().slice(0, 24),
        area: Math.round(area),
        boxA: [Math.round(a.r.left), Math.round(a.r.top), Math.round(a.r.width), Math.round(a.r.height)],
        boxB: [Math.round(b.r.left), Math.round(b.r.top), Math.round(b.r.width), Math.round(b.r.height)],
      });
      if (overlaps.length > 25) break;
    }
    if (overlaps.length > 25) break;
  }
  out.overlaps = overlaps;

  /* ---------- decoration boxes vs viewport ---------- */
  const fixedEls = [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.position === "fixed" && cs.display !== "none";
  }).map((el) => {
    const r = el.getBoundingClientRect();
    return {
      cls: String(el.className).slice(0, 50),
      inset: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      pointerEvents: getComputedStyle(el).pointerEvents,
      z: getComputedStyle(el).zIndex,
    };
  }).slice(0, 40);
  out.fixedLayers = fixedEls;

  /* ---------- scroll containers ---------- */
  const scrollers = [...document.querySelectorAll("*")].filter((el) => {
    const cs = getComputedStyle(el);
    return /(auto|scroll|overlay)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2;
  }).slice(0, 12).map((el) => ({
    cls: String(el.className).slice(0, 50),
    slot: el.getAttribute("data-slot"),
    clientWidth: el.clientWidth,
    offsetWidth: el.offsetWidth,
    gutter: el.offsetWidth - el.clientWidth,
    scrollbarWidthStyle: getComputedStyle(el, "::-webkit-scrollbar").width,
  }));
  out.scrollers = scrollers;

  out.ok = true;
  return out;
})()
`;

/** Toggles the theme off in-place and returns before/after evidence. */
export const UNTHEME_FN = String.raw`
(() => {
  const style = document.querySelector('style[data-dsh-theme="admech"]');
  if (style) style.remove();
  document.documentElement.removeAttribute("data-dsh-admech");
  return true;
})()
`;

/** Dismisses the startup splash and any blocking dialog (close button first). */export const DISMISS_FN = String.raw`
(() => {
  const clicked = [];
  const splash = document.querySelector("[data-admech-splash]");
  if (splash) { splash.click(); clicked.push("admech-splash"); }
  for (const dlg of document.querySelectorAll('[role=dialog]')) {
    const close = dlg.querySelector('button[aria-label="关闭"], button[aria-label="Close"], .uKWioa_close');
    if (close) { close.click(); clicked.push("dialog-close"); return clicked; }
    const pattern = /^(继续|知道了|关闭|稍后|确定|开始使用|我知道了|跳过)$/;
    for (const btn of dlg.querySelectorAll("button")) {
      const t = (btn.textContent || "").trim();
      if (pattern.test(t)) { btn.click(); clicked.push(t); return clicked; }
    }
  }
  return clicked;
})()
`;

/** Builds a specimen board of the theme's framed surfaces. */
export const SPECIMEN_FN = String.raw`
(() => {
  const old = document.getElementById("admech-specimen");
  if (old) old.remove();
  const host = document.createElement("div");
  host.id = "admech-specimen";
  host.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#0b0906;padding:36px 40px;display:grid;grid-template-columns:1fr 1fr;gap:26px;overflow:auto;align-content:start";
  host.innerHTML = [
    '<div data-changed-files style="min-height:180px">',
    '  <div class="header" style="min-height:62px;display:flex;align-items:center;gap:10px">',
    '    <svg width="18" height="18" viewBox="0 0 16 16"><path d="M3 2h7l3 3v9H3z"/></svg>',
    '    <span class="title">changed-files card 26px corners</span>',
    '  </div>',
    '  <div class="list" style="padding:8px 0">',
    '    <div class="row">src/styles.css</div>',
    '    <div class="row">src/client-template.js</div>',
    '  </div>',
    '</div>',
    '<div data-presented-file style="min-height:120px;padding:16px">',
    '  <div class="fileIcon" style="width:34px;height:34px;display:inline-flex"></div>',
    '  <div class="fileName">presented-file card 20px corners</div>',
    '  <div class="description">secondary line</div>',
    '</div>',
    '<div data-composer-card style="padding:18px 20px;min-height:110px;margin-top:60px">',
    '  <div data-composer-placeholder data-admech-placeholder="true" data-admech-ph="composer 42px corners + shrine">placeholder</div>',
    '</div>',
    '<div data-chat-flow-kind="user" style="padding:26px 0 0 26px">',
    '  <div class="bubble" style="padding:14px 22px 14px 16px;max-width:340px">user bubble + seal</div>',
    '</div>',
  ].join("");
  document.body.appendChild(host);
  return true;
})()
`;

/** Puts the small-corner variables back to the authored weight (A/B control). */
export const SPECIMEN_LEGACY_FN = String.raw`
(() => {
  const de = document.documentElement;
  for (const corner of ["tl", "tr", "br", "bl"]) {
    const value = getComputedStyle(de).getPropertyValue("--admech-corner-" + corner);
    de.style.setProperty("--admech-corner-sm-" + corner, value);
  }
  return true;
})()
`;