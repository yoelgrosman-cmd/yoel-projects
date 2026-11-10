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
const DEFAULTS = { size: 1200, fill: 85, shadow: true, format: 'jpeg', quality: 0.9 };
const settings = { ...DEFAULTS };
try { Object.assign(settings, JSON.parse(localStorage.getItem('studio-settings') || '{}')); } catch {}
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
  const c = makeCanvas(src.width, src.height), x = ctx2d(c);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(item.mask, 0, 0);
  return c;
}

function compose(item) {
  const S = +settings.size;
  const out = makeCanvas(S, S), x = ctx2d(out);
  x.fillStyle = '#fff'; x.fillRect(0, 0, S, S);
  const bb = item.bbox || (item.bbox = maskBBox(item.mask));
  const scale = (settings.fill / 100) * S / Math.max(bb.w, bb.h);
  const dw = bb.w * scale, dh = bb.h * scale;
  const dx = (S - dw) / 2;
  let dy = (S - dh) / 2;
  if (item.shadow) {
    dy -= S * 0.012;
    const rx = dw * 0.48, ry = Math.max(dh * 0.035, S * 0.012);
    const cy = dy + dh - ry * 0.35;
    x.save();
    x.translate(S / 2, cy); x.scale(1, ry / rx);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(0,0,0,0.22)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill();
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
      adj: { brightness: 0, contrast: 0 }, shadow: settings.shadow,
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
      item.mask = await segment(item.base);
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

const STATUS = { new: 'ממתין', working: 'מעבד…', done: 'מוכן ✓', error: 'שגיאה' };

function renderQueue() {
  const ul = $('#queue');
  ul.innerHTML = '';
  for (const it of items) {
    const li = document.createElement('li');
    li.className = 'q-item';
    li.innerHTML = `
      <img alt="">
      <div><div class="q-name"></div><div class="q-status ${it.status}"></div></div>
      <div class="q-actions">
        <button class="btn" data-act="edit">ערוך</button>
        ${it.status === 'done' ? '<button class="btn primary" data-act="dl">הורד</button>' : ''}
        <button class="btn ghost danger" data-act="del">מחק</button>
      </div>`;
    li.querySelector('img').src = it.outUrl || it.url;
    li.querySelector('.q-name').textContent = `${it.name}.${outExt()}`;
    li.querySelector('.q-status').textContent = it.status === 'error' ? `${STATUS.error}: ${it.error}` : STATUS[it.status];
    li.querySelector('[data-act="edit"]').onclick = () => openEditor(it);
    const dl = li.querySelector('[data-act="dl"]'); if (dl) dl.onclick = () => download(it);
    li.querySelector('[data-act="del"]').onclick = () => {
      items.splice(items.indexOf(it), 1);
      URL.revokeObjectURL(it.url); if (it.outUrl) URL.revokeObjectURL(it.outUrl);
      renderQueue();
    };
    ul.appendChild(li);
  }
  $('#empty').hidden = items.length > 0;
  $('#bulkBar').hidden = items.length === 0;
  $('#btnZip').disabled = !items.some((i) => i.status === 'done');
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
  const a = document.createElement('a'); a.href = url; a.download = 'product-photos.zip';
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
  $('#setShadow').checked = settings.shadow; $('#setFormat').value = settings.format;
  dlg.showModal();
};
$('#setFill').oninput = (e) => ($('#setFillVal').textContent = e.target.value + '%');
dlg.addEventListener('close', async () => {
  if (dlg.returnValue !== 'ok') return;
  const changed = settings.size != $('#setSize').value || settings.fill != $('#setFill').value || settings.format !== $('#setFormat').value;
  settings.size = +$('#setSize').value; settings.fill = +$('#setFill').value;
  settings.shadow = $('#setShadow').checked; settings.format = $('#setFormat').value;
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

function showTab(name) {
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  $('#tabCrop').hidden = name !== 'crop';
  $('#tabResult').hidden = name !== 'result';
  if (name === 'crop') initCropper();
}
$$('.tab').forEach((t) => (t.onclick = () => {
  if (t.dataset.tab === 'result' && !cur.mask) { applyCrop(); return; }
  if (t.dataset.tab === 'result') { showTab('result'); refreshResult(); return; }
  showTab(t.dataset.tab);
}));

function openEditor(item) {
  cur = item;
  $('#home').hidden = true; $('#editor').hidden = false;
  setTouchMode(false);
  $('#bright').value = item.adj.brightness; $('#brightVal').textContent = item.adj.brightness;
  $('#contrast').value = item.adj.contrast; $('#contrastVal').textContent = item.adj.contrast;
  $('#shadow').checked = item.shadow;
  if (item.mask) { showTab('result'); refreshResult(); } else showTab('crop');
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

async function applyCrop() {
  if (!cropper) return;
  const item = cur;
  item.crop = { data: cropper.getData(), quarter: cropState.quarter, fine: cropState.fine };
  const c = cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096, fillColor: '#fff', imageSmoothingQuality: 'high' });
  item.base = downscaleTo(c, BASE_MAX);
  item.mask = null; item.bbox = null; item._adj = null; item._adjKey = null;
  showTab('result');
  await runSegmentation(item);
}
$('#cropApply').onclick = applyCrop;

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
$('#shadow').onchange = (e) => { cur.shadow = e.target.checked; scheduleRefresh(); };
$('#btnRedo').onclick = () => runSegmentation(cur, true);
$('#btnDownload').onclick = () => download(cur);
$('#btnShare').onclick = () => share(cur);

// ---------------- touch-up brush ----------------
let touchOn = false, mode = 'erase', undoStack = [], painting = false, lastPt = null, drawQueued = false;
const tc = $('#touchCanvas');

function setTouchMode(on) {
  touchOn = on;
  $('#resultView').hidden = on; $('#adjControls').hidden = on;
  $('#touchView').hidden = !on; $('#touchControls').hidden = !on;
}
$('#btnTouch').onclick = () => {
  undoStack = [];
  setTouchMode(true);
  setMode('erase');
  tc.width = cur.base.width; tc.height = cur.base.height;
  applyZoom();
  drawTouch();
};
function setMode(m) {
  mode = m;
  $$('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  $('#touchScroll').classList.toggle('pan', m === 'pan');
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
tc.addEventListener('pointerdown', (e) => {
  if (mode === 'pan' || !touchOn) return;
  e.preventDefault();
  tc.setPointerCapture(e.pointerId);
  painting = true; lastPt = null;
  const snap = makeCanvas(cur.mask.width, cur.mask.height); ctx2d(snap).drawImage(cur.mask, 0, 0);
  undoStack.push(snap); if (undoStack.length > 4) undoStack.shift();
  strokeTo(toCanvasPt(e)); queueDraw();
});
tc.addEventListener('pointermove', (e) => { if (!painting) return; strokeTo(toCanvasPt(e)); queueDraw(); });
const endStroke = () => { painting = false; lastPt = null; };
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
