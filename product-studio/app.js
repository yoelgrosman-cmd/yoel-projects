// Product photo studio: background removal + uniform white-background output.
// Everything runs in the browser; images never leave the device.
import * as ort from './vendor/ort.webgpu.bundle.min.mjs';
import { zipSync } from './vendor/fflate.mjs';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const BASE_MAX = 2600;     // longest side kept for editing / output source
const MODEL_RES = 1024;    // ISNet input resolution
const MODEL_CACHE = 'studio-model';

// ---------------- settings ----------------
const DEFAULTS = { size: 1200, fill: 85, shadowMode: 'single', format: 'jpeg', quality: 0.9 };
const settings = { ...DEFAULTS };
try { Object.assign(settings, JSON.parse(localStorage.getItem('studio-settings') || '{}')); } catch {}
if (typeof settings.shadow === 'boolean') { settings.shadowMode = settings.shadow ? 'single' : 'none'; delete settings.shadow; }
const saveSettings = () => { try { localStorage.setItem('studio-settings', JSON.stringify(settings)); } catch {} };

// ---------------- helpers ----------------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}
const ctx2d = (c, opts) => c.getContext('2d', opts);
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
function canvasToBlob(c, type, q) { return new Promise((res) => c.toBlob(res, type, q)); }
async function loadImage(url) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return img;
}
function downscaleTo(src, maxSide) {
  const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
  const s = Math.min(1, maxSide / Math.max(w, h));
  const c = makeCanvas(w * s, h * s);
  const x = ctx2d(c); x.imageSmoothingQuality = 'high';
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
const outExt = () => (settings.format === 'webp' ? 'webp' : 'jpg');
const outMime = () => (settings.format === 'webp' ? 'image/webp' : 'image/jpeg');

// ---------------- model ----------------
let sessionPromise = null;
let backend = '';

async function fetchModelBytes(onProgress) {
  const meta = await (await fetch('model/model.json', { cache: 'no-cache' })).json();
  const key = `model/${meta.version}.onnx`;
  let cache = null;
  try { cache = await caches.open(MODEL_CACHE); } catch {}
  if (cache) {
    const hit = await cache.match(key);
    if (hit) { onProgress(1, true); return new Uint8Array(await hit.arrayBuffer()); }
  }
  const out = new Uint8Array(meta.size);
  let off = 0;
  for (const part of meta.parts) {
    const res = await fetch('model/' + part);
    if (!res.ok) throw new Error('model download failed: ' + res.status);
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out.set(value, off); off += value.length;
      onProgress(off / meta.size, false);
    }
  }
  if (off !== meta.size) throw new Error('model size mismatch');
  if (cache) {
    try {
      const old = await cache.keys();
      await Promise.all(old.filter((r) => !r.url.endsWith(key)).map((r) => cache.delete(r)));
      await cache.put(key, new Response(out));
    } catch {}
  }
  return out;
}

function getSession() {
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    const box = $('#modelStatus'), txt = box.querySelector('.ms-text'), fill = box.querySelector('.fill');
    box.hidden = false;
    txt.textContent = 'טוען את מנוע הסרת הרקע…';
    const bytes = await fetchModelBytes((p, cached) => {
      fill.style.width = Math.round(p * 100) + '%';
      txt.textContent = cached ? 'טוען את המנוע מהזיכרון…' : `מוריד את מנוע הסרת הרקע (פעם ראשונה בלבד) ${Math.round(p * 100)}%`;
      if (!$('#busy').hidden) $('#busy .busy-text').textContent = txt.textContent;
    });
    ort.env.wasm.wasmPaths = new URL('./vendor/', import.meta.url).href;
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1;
    let session = null;
    if (navigator.gpu) {
      try {
        session = await ort.InferenceSession.create(bytes, { executionProviders: ['webgpu'] });
        // smoke-test: some GPUs create the session but fail at run time
        await session.run({ input: new ort.Tensor('float32', new Float32Array(3 * MODEL_RES * MODEL_RES), [1, 3, MODEL_RES, MODEL_RES]) }, ['output']);
        backend = 'webgpu';
      } catch (e) { console.warn('WebGPU unavailable, falling back to WASM', e); session = null; }
    }
    if (!session) {
      session = await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });
      backend = 'wasm';
    }
    txt.textContent = 'המנוע מוכן ✓';
    setTimeout(() => (box.hidden = true), 1500);
    return session;
  })();
  sessionPromise.catch((e) => {
    console.error(e);
    sessionPromise = null;
    $('#modelStatus .ms-text').textContent = 'שגיאה בטעינת המנוע. בדוק חיבור לאינטרנט ונסה שוב.';
  });
  return sessionPromise;
}

// Remove small detached blobs (background leftovers) from a 1024x1024 alpha map.
function keepMainComponents(alpha, W, H) {
  const N = W * H, label = new Int32Array(N), sizes = [0];
  const stack = new Int32Array(N);
  let next = 1;
  for (let i = 0; i < N; i++) {
    if (alpha[i] < 25 || label[i]) continue;
    let sp = 0, size = 0; stack[sp++] = i; label[i] = next;
    while (sp) {
      const p = stack[--sp]; size++;
      const x = p % W, y = (p / W) | 0;
      if (x > 0 && !label[p - 1] && alpha[p - 1] >= 25) { label[p - 1] = next; stack[sp++] = p - 1; }
      if (x < W - 1 && !label[p + 1] && alpha[p + 1] >= 25) { label[p + 1] = next; stack[sp++] = p + 1; }
      if (y > 0 && !label[p - W] && alpha[p - W] >= 25) { label[p - W] = next; stack[sp++] = p - W; }
      if (y < H - 1 && !label[p + W] && alpha[p + W] >= 25) { label[p + W] = next; stack[sp++] = p + W; }
    }
    sizes.push(size); next++;
  }
  const max = Math.max(0, ...sizes);
  const minKeep = max * 0.005;
  for (let i = 0; i < N; i++) {
    const l = label[i];
    if (!l || sizes[l] < minKeep) alpha[i] = 0;
  }
}

async function segment(base) {
  const session = await getSession();
  const S = MODEL_RES;
  const c = makeCanvas(S, S), x = ctx2d(c, { willReadFrequently: true });
  x.imageSmoothingQuality = 'high';
  x.drawImage(base, 0, 0, S, S);
  const d = x.getImageData(0, 0, S, S).data;
  const plane = S * S, f = new Float32Array(3 * plane);
  for (let i = 0, j = 0; i < plane; i++, j += 4) {
    f[i] = (d[j] - 128) / 256;
    f[i + plane] = (d[j + 1] - 128) / 256;
    f[i + 2 * plane] = (d[j + 2] - 128) / 256;
  }
  const res = await session.run({ input: new ort.Tensor('float32', f, [1, 3, S, S]) }, ['output']);
  const o = res.output.data;
  const alpha = new Uint8ClampedArray(plane);
  for (let i = 0; i < plane; i++) {
    let v = o[i] * 255;
    if (v < 18) v = 0; else if (v > 240) v = 255;
    alpha[i] = v;
  }
  keepMainComponents(alpha, S, S);
  const small = new ImageData(S, S);
  for (let i = 0, j = 0; i < plane; i++, j += 4) small.data[j + 3] = alpha[i];
  const sc = makeCanvas(S, S); ctx2d(sc).putImageData(small, 0, 0);
  const mask = makeCanvas(base.width, base.height);
  const mx = ctx2d(mask); mx.imageSmoothingQuality = 'high';
  mx.drawImage(sc, 0, 0, mask.width, mask.height);
  return mask;
}

// Run the model on part of the image and return a full-size mask.
// Everything outside the region (and outside the polygon, if given) is removed.
async function segmentRegion(base, r, poly) {
  // The model sees the region in its natural context (masking it to white makes the
  // outline itself look like an object); the polygon is applied afterwards as a hard limit.
  const region = makeCanvas(r.w, r.h);
  ctx2d(region).drawImage(base, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
  const m = await segment(region);
  const full = makeCanvas(base.width, base.height), f = ctx2d(full);
  f.drawImage(m, r.x, r.y);
  if (poly) {
    f.globalCompositeOperation = 'destination-in';
    f.fillStyle = '#000'; tracePoly(f, poly, 0, 0); f.fill();
  }
  return full;
}
function tracePoly(x, poly, ox, oy) {
  x.beginPath();
  poly.forEach((p, i) => (i ? x.lineTo(p.x + ox, p.y + oy) : x.moveTo(p.x + ox, p.y + oy)));
  x.closePath();
}
function padRect(bb, pad, W, H) {
  const x0 = Math.max(0, Math.floor(bb.x - pad)), y0 = Math.max(0, Math.floor(bb.y - pad));
  const x1 = Math.min(W, Math.ceil(bb.x + bb.w + pad)), y1 = Math.min(H, Math.ceil(bb.y + bb.h + pad));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
// Two passes: find the product, then zoom in on it and run again for cleaner edges
// and fewer leftovers from the surroundings.
async function segmentRefined(base) {
  const m1 = await segment(base);
  const bb = maskBBox(m1);
  const W = base.width, H = base.height;
  if (bb.w < 16 || bb.h < 16 || bb.w * bb.h > 0.75 * W * H) return m1;
  const r = padRect(bb, 0.08 * Math.max(bb.w, bb.h), W, H);
  return segmentRegion(base, r, null);
}

// ---------------- adjustments & compose ----------------
function adjustedBase(item) {
  const { brightness: b, contrast: k } = item.adj;
  const key = `${b}|${k}`;
  if (item._adjKey === key && item._adj) return item._adj;
  if (!b && !k) { item._adj = item.base; item._adjKey = key; return item.base; }
  const gamma = 1 / (1 + b / 100 * 1.4 * (b > 0 ? 1 : 0.7));
  const cf = 1 + k / 100;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let t = Math.pow(v / 255, gamma);
    t = (t - 0.5) * cf + 0.5;
    lut[v] = t * 255;
  }
  const c = makeCanvas(item.base.width, item.base.height);
  const x = ctx2d(c, { willReadFrequently: true });
  x.drawImage(item.base, 0, 0);
  const id = x.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
  x.putImageData(id, 0, 0);
  item._adj = c; item._adjKey = key;
  return c;
}

function maskBBox(mask) {
  const w = mask.width, h = mask.height;
  const d = ctx2d(mask, { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (d[row + x * 4 + 3] > 100) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w, h };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function cutout(item) {
  const src = adjustedBase(item);
  if (item._cut && item._cutSrc === src && item._cutBB === item.bbox) return item._cut;
  const c = makeCanvas(src.width, src.height), x = ctx2d(c);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(item.mask, 0, 0);
  item._cut = c; item._cutSrc = src; item._cutBB = item.bbox;
  return c;
}

// ---- shadows ----
// Each shadow is stored relative to the product box: cx/cy as fractions of the
// product width/height (cy = 1 is the bottom edge), rx/ry as fractions of the width.
function singleShadow(bb) {
  return [{ cx: 0.5, cy: 0.99, rx: 0.48, ry: Math.max(0.035 * bb.h / bb.w, 0.014) }];
}
// Find where the product touches the ground (e.g. each bike wheel) from the mask's bottom profile.
function contactShadows(item) {
  const bb = item.bbox, m = item.mask;
  const d = ctx2d(m, { willReadFrequently: true }).getImageData(bb.x, bb.y, bb.w, bb.h).data;
  const bottom = new Int32Array(bb.w).fill(-1);
  for (let x = 0; x < bb.w; x++) {
    for (let y = bb.h - 1; y >= 0; y--) if (d[(y * bb.w + x) * 4 + 3] > 100) { bottom[x] = y; break; }
  }
  const maxB = Math.max(...bottom);
  const band = maxB - Math.max(2, bb.h * 0.035);
  const gap = Math.max(2, bb.w * 0.02);
  const groups = [];
  let g = null;
  for (let x = 0; x < bb.w; x++) {
    if (bottom[x] >= band) {
      if (g && x - g.end <= gap) g.end = x; else { g = { start: x, end: x }; groups.push(g); }
    }
  }
  const minW = bb.w * 0.015;
  const kept = groups.filter((q) => q.end - q.start >= minW);
  if (kept.length < 2) return singleShadow(bb);
  const ry = Math.max(0.03 * bb.h / bb.w, 0.012);
  return kept.slice(0, 4).map((q) => {
    const w = (q.end - q.start + 1) / bb.w;
    return { cx: (q.start + q.end + 1) / 2 / bb.w, cy: 0.995, rx: Math.min(0.3, Math.max(0.07, w * 0.95)), ry };
  });
}
function shadowList(item) {
  const sh = item.shadow;
  if (sh.mode === 'none') return [];
  if (!sh.list || sh.listFor !== item.bbox || sh.listMode !== sh.mode) {
    sh.list = sh.mode === 'split' ? contactShadows(item) : singleShadow(item.bbox);
    sh.listFor = item.bbox; sh.listMode = sh.mode;
  }
  return sh.list;
}
function layout(item) {
  const S = +settings.size;
  const bb = item.bbox || (item.bbox = maskBBox(item.mask));
  const scale = (settings.fill / 100) * S / Math.max(bb.w, bb.h);
  const dw = bb.w * scale, dh = bb.h * scale;
  const dx = (S - dw) / 2;
  let dy = (S - dh) / 2;
  if (item.shadow.mode !== 'none') dy -= S * 0.012;
  return { S, bb, dw, dh, dx, dy };
}
function shadowEllipses(item, L) {
  const k = item.shadow.size / 100;
  return shadowList(item).map((s) => ({
    s, x: L.dx + s.cx * L.dw, y: L.dy + s.cy * L.dh, rx: s.rx * L.dw * k, ry: Math.max(2, s.ry * L.dw * k),
  }));
}

function compose(item) {
  const L = layout(item);
  const { S, bb, dw, dh, dx, dy } = L;
  const out = makeCanvas(S, S), x = ctx2d(out);
  x.fillStyle = '#fff'; x.fillRect(0, 0, S, S);
  const a = item.shadow.strength / 100;
  for (const e of shadowEllipses(item, L)) {
    x.save();
    x.translate(e.x, e.y); x.scale(1, e.ry / e.rx);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, e.rx);
    g.addColorStop(0, `rgba(0,0,0,${Math.min(1, 0.24 * a)})`);
    g.addColorStop(0.55, `rgba(0,0,0,${Math.min(1, 0.11 * a)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, e.rx, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  x.imageSmoothingQuality = 'high';
  x.drawImage(cutout(item), bb.x, bb.y, bb.w, bb.h, dx, dy, dw, dh);
  return out;
}

// ---------------- items ----------------
const items = [];
let uid = 0;

function uniqueName(file) {
  const raw = (file.name || 'photo').replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'photo';
  let name = raw, n = 2;
  while (items.some((i) => i.name === name)) name = `${raw}-${n++}`;
  return name;
}

function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) continue;
    const item = {
      id: ++uid, name: uniqueName(file), file, url: URL.createObjectURL(file),
      base: null, mask: null, bbox: null, crop: null,
      adj: { brightness: 0, contrast: 0 },
      shadow: { mode: settings.shadowMode, size: 100, strength: 100, list: null },
      out: null, outUrl: null, status: 'new', error: '',
    };
    items.push(item);
  }
  renderQueue();
  getSession(); // start downloading the model right away
}

async function ensureBase(item) {
  if (item.base) return;
  const img = await loadImage(item.url);
  item.base = downscaleTo(img, BASE_MAX);
}

async function processItem(item, { force = false } = {}) {
  item.status = 'working'; renderQueue();
  try {
    await ensureBase(item);
    if (!item.mask || force) {
      item.mask = await segmentRefined(item.base);
      item.bbox = null;
    }
    await renderOutput(item);
    item.status = 'done';
  } catch (e) {
    console.error(e);
    item.status = 'error'; item.error = String(e.message || e);
  }
  renderQueue();
}

async function renderOutput(item) {
  const c = compose(item);
  const blob = await canvasToBlob(c, outMime(), settings.quality);
  if (item.outUrl) URL.revokeObjectURL(item.outUrl);
  item.out = blob; item.outUrl = URL.createObjectURL(blob);
  return c;
}

const STATUS = { new: 'ממתין', working: 'מעבד', done: 'מוכן', error: 'שגיאה' };

function renderQueue() {
  const ul = $('#queue');
  ul.innerHTML = '';
  for (const it of items) {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <button class="card-thumb ${it.outUrl ? '' : 'raw'}" aria-label="ערוך"><img alt=""><span class="badge ${it.status}"></span></button>
      <div class="card-foot">
        <span class="card-name"></span>
        ${it.status === 'done' ? '<button class="icon-btn dl" data-act="dl" aria-label="הורד"><svg><use href="#i-download"/></svg></button>' : ''}
        <button class="icon-btn" data-act="del" aria-label="מחק"><svg><use href="#i-trash"/></svg></button>
      </div>`;
    li.querySelector('img').src = it.outUrl || it.url;
    li.querySelector('.card-name').textContent = `${it.name}.${outExt()}`;
    const badge = li.querySelector('.badge');
    badge.textContent = STATUS[it.status];
    if (it.status === 'error') badge.title = it.error;
    li.querySelector('.card-thumb').onclick = () => openEditor(it);
    const dl = li.querySelector('[data-act="dl"]'); if (dl) dl.onclick = () => download(it);
    li.querySelector('[data-act="del"]').onclick = () => {
      items.splice(items.indexOf(it), 1);
      URL.revokeObjectURL(it.url); if (it.outUrl) URL.revokeObjectURL(it.outUrl);
      renderQueue();
    };
    ul.appendChild(li);
  }
  const done = items.filter((i) => i.status === 'done').length;
  $('#binCount').textContent = items.length ? `${done} / ${items.length} מוכנות` : '';
  $('#empty').hidden = items.length > 0;
  $('#bulkBar').hidden = items.length === 0;
  $('#btnZip').disabled = !done;
}

function download(item) {
  if (!item.out) return;
  const a = document.createElement('a');
  a.href = item.outUrl; a.download = `${item.name}.${outExt()}`;
  document.body.appendChild(a); a.click(); a.remove();
}

async function share(item) {
  if (!item.out) return;
  const file = new File([item.out], `${item.name}.${outExt()}`, { type: outMime() });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); } catch {}
  } else {
    download(item);
  }
}

// ---------------- home actions ----------------
$('#inCamera').onchange = (e) => { addFiles(e.target.files); e.target.value = ''; const last = items[items.length - 1]; if (last) openEditor(last); };
$('#inFiles').onchange = (e) => { addFiles(e.target.files); e.target.value = ''; };

$('#btnProcessAll').onclick = async () => {
  const btn = $('#btnProcessAll'); btn.disabled = true;
  for (const it of items) if (it.status !== 'done') await processItem(it);
  btn.disabled = false;
  toast('כל התמונות מוכנות');
};

$('#btnZip').onclick = async () => {
  const files = {};
  for (const it of items) if (it.out) files[`${it.name}.${outExt()}`] = [new Uint8Array(await it.out.arrayBuffer()), { level: 0 }];
  const zip = zipSync(files);
  const url = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
  const a = document.createElement('a'); a.href = url; a.download = 'bilu-studio-photos.zip';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

$('#btnClear').onclick = () => {
  if (!confirm('לנקות את כל התמונות מהרשימה?')) return;
  for (const it of items) { URL.revokeObjectURL(it.url); if (it.outUrl) URL.revokeObjectURL(it.outUrl); }
  items.length = 0; renderQueue();
};

// ---------------- settings ----------------
const dlg = $('#settings');
$('#btnSettings').onclick = () => {
  $('#setSize').value = settings.size; $('#setFill').value = settings.fill;
  $('#setFillVal').textContent = settings.fill + '%';
  $('#setShadow').value = settings.shadowMode; $('#setFormat').value = settings.format;
  dlg.showModal();
  paintRanges();
};
$('#setFill').oninput = (e) => ($('#setFillVal').textContent = e.target.value + '%');
dlg.addEventListener('close', async () => {
  if (dlg.returnValue !== 'ok') return;
  const changed = settings.size != $('#setSize').value || settings.fill != $('#setFill').value || settings.format !== $('#setFormat').value;
  settings.size = +$('#setSize').value; settings.fill = +$('#setFill').value;
  settings.shadowMode = $('#setShadow').value; settings.format = $('#setFormat').value;
  saveSettings();
  if (changed) {
    for (const it of items) if (it.status === 'done') await renderOutput(it);
    renderQueue();
    toast('ההגדרות עודכנו לכל התמונות');
  }
});

// ---------------- editor ----------------
let cur = null;        // item being edited
let cropper = null;
let cropState = { quarter: 0, fine: 0 };

let tool = 'crop';
function setTool(name) {
  tool = name;
  $$('.tool').forEach((t) => t.classList.toggle('active', t.dataset.tool === name));
  $$('.panel[data-panel]').forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
  const crop = name === 'crop';
  $('#stageCrop').hidden = !crop;
  $('#resultView').hidden = crop;
  if (crop) initCropper();
  else if (cropper) { cropper.destroy(); cropper = null; }
  paintRanges();
}
$$('.tool').forEach((t) => (t.onclick = () => {
  if (touchOn) return;
  const name = t.dataset.tool;
  if (name === tool) return;
  if (name !== 'crop' && !cur.mask) { applyCrop(name); return; }
  setTool(name);
  if (name !== 'crop') refreshResult();
}));

// slider fill (gold from the neutral point to the thumb)
function paintRange(el) {
  const min = +el.min, max = +el.max, v = +el.value;
  const c = el.dataset.center !== undefined ? +el.dataset.center : min;
  el.style.setProperty('--p', ((v - min) / (max - min)) * 100 + '%');
  el.style.setProperty('--c', ((c - min) / (max - min)) * 100 + '%');
}
function paintRanges() { $$('.range').forEach(paintRange); }
document.addEventListener('input', (e) => { if (e.target.classList && e.target.classList.contains('range')) paintRange(e.target); });
// double-tap a slider to reset it to its neutral value
$$('.range[data-center]').forEach((el) => el.addEventListener('dblclick', () => {
  el.value = el.dataset.center; el.dispatchEvent(new Event('input', { bubbles: true }));
}));

function openEditor(item) {
  cur = item;
  $('#home').hidden = true; $('#editor').hidden = false;
  setTouchMode(false);
  $('#bright').value = item.adj.brightness; $('#brightVal').textContent = item.adj.brightness;
  $('#contrast').value = item.adj.contrast; $('#contrastVal').textContent = item.adj.contrast;
  syncShadowUI();
  $('#edName').textContent = `${item.name}.${outExt()}`;
  $('#edMeta').textContent = `${settings.size}×${settings.size} · ${outExt().toUpperCase()}`;
  tool = '';
  if (item.mask) { setTool('cutout'); refreshResult(); } else setTool('crop');
}

function closeEditor() {
  if (cropper) { cropper.destroy(); cropper = null; }
  $('#editor').hidden = true; $('#home').hidden = false;
  cur = null; renderQueue();
}
$('#edBack').onclick = () => { if (touchOn) { finishTouch(false); } closeEditor(); };

function initCropper() {
  if (cropper) { cropper.destroy(); cropper = null; }
  const img = $('#cropImg');
  img.onload = () => {
    cropState = cur.crop ? { quarter: cur.crop.quarter, fine: cur.crop.fine } : { quarter: 0, fine: 0 };
    $('#straighten').value = cropState.fine; $('#straightenVal').textContent = cropState.fine + '°';
    cropper = new Cropper(img, {
      viewMode: 1, dragMode: 'move', autoCropArea: 1, background: false,
      toggleDragModeOnDblclick: false, responsive: true, checkOrientation: false,
      ready() {
        cropper.rotateTo(cropState.quarter * 90 + cropState.fine);
        if (cur.crop && cur.crop.data) cropper.setData(cur.crop.data); else if (cropState.quarter) fitAll();
      },
    });
  };
  img.src = cur.url;
}
function applyRotate(refit) {
  if (!cropper) return;
  cropper.rotateTo(cropState.quarter * 90 + cropState.fine);
  // after a 90° turn, refit the image to the screen and select all of it
  if (refit) fitAll();
}
function fitAll() {
  // Cropper won't shrink the canvas below the crop box, so collapse the box first.
  const ct = cropper.getContainerData();
  cropper.setCropBoxData({ left: ct.width / 2 - 5, top: ct.height / 2 - 5, width: 10, height: 10 });
  const cv = cropper.getCanvasData(); // natural* here are the rotated dimensions
  const s = Math.min(ct.width / cv.naturalWidth, ct.height / cv.naturalHeight);
  const w = cv.naturalWidth * s, h = cv.naturalHeight * s;
  cropper.setCanvasData({ left: (ct.width - w) / 2, top: (ct.height - h) / 2, width: w, height: h });
  cropper.setCropBoxData({ left: 0, top: 0, width: 1e5, height: 1e5 }); // clamped to the image (viewMode 1)
}
$('#rotL').onclick = () => { cropState.quarter = (cropState.quarter + 3) % 4; applyRotate(true); };
$('#rotR').onclick = () => { cropState.quarter = (cropState.quarter + 1) % 4; applyRotate(true); };
$('#straighten').oninput = (e) => { cropState.fine = +e.target.value; $('#straightenVal').textContent = cropState.fine + '°'; applyRotate(); };
$('#cropReset').onclick = () => { cropState = { quarter: 0, fine: 0 }; $('#straighten').value = 0; $('#straightenVal').textContent = '0°'; if (cropper) { cropper.reset(); cropper.rotateTo(0); fitAll(); } };

async function applyCrop(nextTool = 'cutout') {
  if (!cropper) return;
  const item = cur;
  item.crop = { data: cropper.getData(), quarter: cropState.quarter, fine: cropState.fine };
  const c = cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096, fillColor: '#fff', imageSmoothingQuality: 'high' });
  item.base = downscaleTo(c, BASE_MAX);
  item.mask = null; item.bbox = null; item._adj = null; item._adjKey = null;
  setTool(typeof nextTool === 'string' ? nextTool : 'cutout');
  await runSegmentation(item);
}
$('#cropApply').onclick = () => applyCrop('cutout');

async function runSegmentation(item, force = false) {
  $('#busy').hidden = false;
  $('#busy .busy-text').textContent = sessionPromise ? 'מסיר רקע…' : 'טוען מנוע…';
  await nextFrame();
  await processItem(item, { force });
  $('#busy').hidden = true;
  if (item.status === 'error') toast('שגיאה: ' + item.error, 5000);
  if (cur === item) refreshResult();
}

let refreshTimer = 0;
async function refreshResult() {
  if (!cur || !cur.mask) return;
  const c = await renderOutput(cur);
  const rc = $('#resultCanvas');
  rc.width = c.width; rc.height = c.height;
  ctx2d(rc).drawImage(c, 0, 0);
}
function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refreshResult, 120); }

$('#bright').oninput = (e) => { cur.adj.brightness = +e.target.value; $('#brightVal').textContent = e.target.value; scheduleRefresh(); };
$('#contrast').oninput = (e) => { cur.adj.contrast = +e.target.value; $('#contrastVal').textContent = e.target.value; scheduleRefresh(); };
function syncShadowUI() {
  const sh = cur.shadow;
  $$('.sh-btn').forEach((b) => b.classList.toggle('active', b.dataset.sh === sh.mode));
  $('#shadowOpts').hidden = sh.mode === 'none';
  $('#shSize').value = sh.size; $('#shSizeVal').textContent = sh.size + '%';
  $('#shStrength').value = sh.strength; $('#shStrengthVal').textContent = sh.strength + '%';
}
$$('.sh-btn').forEach((b) => (b.onclick = () => {
  cur.shadow.mode = b.dataset.sh; cur.shadow.list = null;
  syncShadowUI(); refreshResult();
  if (b.dataset.sh === 'split' && cur.shadow.list && cur.shadow.list.length < 2) toast('לא זוהו כמה נקודות מגע. גרור את הצל למקום הרצוי');
}));
$('#shSize').oninput = (e) => { cur.shadow.size = +e.target.value; $('#shSizeVal').textContent = e.target.value + '%'; drawPreview(); scheduleRefresh(); };
$('#shStrength').oninput = (e) => { cur.shadow.strength = +e.target.value; $('#shStrengthVal').textContent = e.target.value + '%'; drawPreview(); scheduleRefresh(); };
$('#shReset').onclick = () => { Object.assign(cur.shadow, { size: 100, strength: 100, list: null }); syncShadowUI(); refreshResult(); };

// fast redraw of the preview without encoding a file (used while dragging)
function drawPreview() {
  if (!cur || !cur.mask) return;
  const c = compose(cur), rc = $('#resultCanvas');
  if (rc.width !== c.width) { rc.width = c.width; rc.height = c.height; }
  ctx2d(rc).drawImage(c, 0, 0);
}

// drag a shadow on the result preview
{
  const rc = $('#resultCanvas');
  let drag = null;
  const pt = (e) => { const r = rc.getBoundingClientRect(); return { x: (e.clientX - r.left) * rc.width / r.width, y: (e.clientY - r.top) * rc.height / r.height, k: rc.width / r.width }; };
  rc.addEventListener('pointerdown', (e) => {
    if (!cur || !cur.mask || cur.shadow.mode === 'none') return;
    const p = pt(e), L = layout(cur);
    let best = null, bestD = Infinity;
    for (const el of shadowEllipses(cur, L)) {
      const rx = Math.max(el.rx, 40 * p.k), ry = Math.max(el.ry * 2.5, 40 * p.k);
      const d = ((p.x - el.x) / rx) ** 2 + ((p.y - el.y) / ry) ** 2;
      if (d <= 1 && d < bestD) { best = el; bestD = d; }
    }
    if (!best) return;
    e.preventDefault();
    rc.setPointerCapture(e.pointerId);
    drag = { s: best.s, p, cx: best.s.cx, cy: best.s.cy, L };
  });
  rc.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pt(e);
    drag.s.cx = drag.cx + (p.x - drag.p.x) / drag.L.dw;
    drag.s.cy = Math.min(1.25, Math.max(0.5, drag.cy + (p.y - drag.p.y) / drag.L.dh));
    drawPreview();
  });
  const end = () => { if (drag) { drag = null; refreshResult(); } };
  rc.addEventListener('pointerup', end);
  rc.addEventListener('pointercancel', end);
}
$('#btnRedo').onclick = () => runSegmentation(cur, true);

// before/after: hold to see the original crop
{
  const b = $('#btnCompare');
  const show = (e) => {
    if (!cur || !cur.base || tool === 'crop' || touchOn) return;
    e.preventDefault();
    const rc = $('#resultCanvas'), x = ctx2d(rc), S = rc.width || +settings.size;
    x.fillStyle = '#16181d'; x.fillRect(0, 0, S, S);
    const s = Math.min(S / cur.base.width, S / cur.base.height);
    x.drawImage(cur.base, (S - cur.base.width * s) / 2, (S - cur.base.height * s) / 2, cur.base.width * s, cur.base.height * s);
    $('#compareTag').hidden = false; b.classList.add('on');
  };
  const hide = () => { if (!$('#compareTag').hidden) { $('#compareTag').hidden = true; b.classList.remove('on'); drawPreview(); } };
  b.addEventListener('pointerdown', show);
  b.addEventListener('pointerup', hide);
  b.addEventListener('pointerleave', hide);
  b.addEventListener('pointercancel', hide);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
$('#btnDownload').onclick = () => download(cur);
$('#btnShare').onclick = () => share(cur);

// ---------------- touch-up brush ----------------
let touchOn = false, mode = 'erase', undoStack = [], painting = false, lastPt = null, drawQueued = false;
const tc = $('#touchCanvas');

function setTouchMode(on) {
  touchOn = on;
  $('#editor').classList.toggle('touching', on);
  $('#resultView').hidden = on || tool === 'crop';
  $$('.panel[data-panel]').forEach((p) => p.classList.toggle('active', !on && p.dataset.panel === tool));
  $('#touchView').hidden = !on; $('#touchControls').hidden = !on;
  if (on) paintRanges();
}
function openTouch(m) {
  undoStack = [];
  setTouchMode(true);
  setMode(m);
  tc.width = cur.base.width; tc.height = cur.base.height;
  applyZoom();
  drawTouch();
}
$('#btnTouch').onclick = () => openTouch('erase');
$('#btnLasso').onclick = () => openTouch('lasso');
function setMode(m) {
  mode = m;
  $$('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  $('#touchScroll').classList.toggle('pan', m === 'pan');
  $('#brushRow').hidden = m === 'lasso' || m === 'pan';
  $('#touchHint').textContent = m === 'lasso'
    ? 'הקף את כל המוצר באצבע בקו אחד רציף, עם קצת רווח מסביב. לא צריך להיות מדויק, אבל כל מה שמחוץ לקו יוסר (למשל יד או תווית).'
    : 'אזורים באדום יוסרו. "מחק" מסיר שאריות רקע, "שחזר" מחזיר חלקים של המוצר.';
}
$$('.seg-btn').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));

function applyZoom() {
  const z = +$('#zoom').value;
  $('#zoomVal').textContent = z + '×';
  const box = $('#touchScroll');
  const fit = Math.min((box.clientWidth - 4) / tc.width, (box.clientHeight - 4) / tc.height);
  tc.style.width = tc.width * fit * z + 'px';
  tc.style.height = tc.height * fit * z + 'px';
}
$('#zoom').oninput = applyZoom;
$('#brush').oninput = (e) => ($('#brushVal').textContent = e.target.value);

function drawTouch() {
  drawQueued = false;
  const x = ctx2d(tc);
  x.clearRect(0, 0, tc.width, tc.height);
  x.drawImage(adjustedBase(cur), 0, 0);
  // red overlay where the mask removes pixels
  const ov = drawTouch.ov && drawTouch.ov.width === tc.width && drawTouch.ov.height === tc.height ? drawTouch.ov : (drawTouch.ov = makeCanvas(tc.width, tc.height));
  const o = ctx2d(ov);
  o.globalCompositeOperation = 'source-over';
  o.clearRect(0, 0, ov.width, ov.height);
  o.fillStyle = 'rgba(229,72,77,0.55)'; o.fillRect(0, 0, ov.width, ov.height);
  o.globalCompositeOperation = 'destination-out';
  o.drawImage(cur.mask, 0, 0);
  x.drawImage(ov, 0, 0);
  if (lassoPts && lassoPts.length > 1) {
    const k = tc.width / tc.getBoundingClientRect().width;
    x.save();
    tracePoly(x, lassoPts, 0, 0);
    x.fillStyle = 'rgba(47,124,246,0.12)'; x.fill();
    x.lineWidth = 3 * k; x.strokeStyle = '#fff'; x.stroke();
    x.setLineDash([8 * k, 6 * k]); x.strokeStyle = '#2f7cf6'; x.stroke();
    x.restore();
  }
}
function queueDraw() { if (!drawQueued) { drawQueued = true; requestAnimationFrame(drawTouch); } }

function toCanvasPt(e) {
  const r = tc.getBoundingClientRect();
  return { x: (e.clientX - r.left) * tc.width / r.width, y: (e.clientY - r.top) * tc.height / r.height, k: tc.width / r.width };
}
function dab(p, radius) {
  const m = ctx2d(cur.mask);
  m.save();
  m.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
  const g = m.createRadialGradient(p.x, p.y, radius * 0.6, p.x, p.y, radius);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  m.fillStyle = g; m.beginPath(); m.arc(p.x, p.y, radius, 0, Math.PI * 2); m.fill();
  m.restore();
}
function strokeTo(p) {
  const radius = (+$('#brush').value / 2) * p.k;
  if (!lastPt) { dab(p, radius); lastPt = p; return; }
  const dist = Math.hypot(p.x - lastPt.x, p.y - lastPt.y);
  const step = Math.max(1, radius * 0.3);
  for (let t = step; t <= dist; t += step) {
    dab({ x: lastPt.x + (p.x - lastPt.x) * t / dist, y: lastPt.y + (p.y - lastPt.y) * t / dist }, radius);
  }
  lastPt = p;
}
let lassoPts = null, lassoBusy = false;
function pushUndo() {
  const snap = makeCanvas(cur.mask.width, cur.mask.height); ctx2d(snap).drawImage(cur.mask, 0, 0);
  undoStack.push(snap); if (undoStack.length > 4) undoStack.shift();
}
async function applyLasso(pts) {
  const W = cur.base.width, H = cur.base.height;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  if (x1 - x0 < 20 || y1 - y0 < 20) { lassoPts = null; drawTouch(); toast('הקו קטן מדי, נסה שוב'); return; }
  lassoBusy = true; $('#touchBusy').hidden = false;
  await nextFrame();
  try {
    pushUndo();
    const r = padRect({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, 2, W, H);
    const m = await segmentRegion(cur.base, r, pts);
    const mx = ctx2d(cur.mask); mx.clearRect(0, 0, W, H); mx.drawImage(m, 0, 0);
    cur.bbox = null;
    setMode('erase');
    toast('בוצע. אפשר להמשיך לתקן במברשת או ללחוץ "סיום"');
  } catch (e) { console.error(e); toast('שגיאה: ' + (e.message || e), 5000); }
  lassoBusy = false; lassoPts = null; $('#touchBusy').hidden = true;
  drawTouch();
}
tc.addEventListener('pointerdown', (e) => {
  if (mode === 'pan' || !touchOn || lassoBusy) return;
  e.preventDefault();
  tc.setPointerCapture(e.pointerId);
  if (mode === 'lasso') { const p = toCanvasPt(e); lassoPts = [{ x: p.x, y: p.y }]; painting = true; queueDraw(); return; }
  painting = true; lastPt = null;
  pushUndo();
  strokeTo(toCanvasPt(e)); queueDraw();
});
tc.addEventListener('pointermove', (e) => {
  if (!painting) return;
  const p = toCanvasPt(e);
  if (mode === 'lasso') {
    const l = lassoPts[lassoPts.length - 1];
    if (Math.hypot(p.x - l.x, p.y - l.y) > 3 * p.k) lassoPts.push({ x: p.x, y: p.y });
  } else strokeTo(p);
  queueDraw();
});
const endStroke = () => {
  painting = false; lastPt = null;
  if (mode === 'lasso' && lassoPts) { if (lassoPts.length > 8) applyLasso(lassoPts); else { lassoPts = null; drawTouch(); } }
};
tc.addEventListener('pointerup', endStroke);
tc.addEventListener('pointercancel', endStroke);

$('#touchUndo').onclick = () => {
  const s = undoStack.pop(); if (!s) return;
  const m = ctx2d(cur.mask); m.clearRect(0, 0, s.width, s.height); m.drawImage(s, 0, 0);
  drawTouch();
};
async function finishTouch(refresh = true) {
  setTouchMode(false);
  undoStack = [];
  cur.bbox = null;
  if (refresh) await refreshResult();
}
$('#touchDone').onclick = () => finishTouch(true);

// ---------------- boot ----------------
renderQueue();
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.__studio = { items, settings, getSession, processItem, compose, get backend() { return backend; } };
