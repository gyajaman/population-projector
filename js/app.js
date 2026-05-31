/* ============================================================================
   app.js — orchestration: rail, stats panel, population pyramid, timeline.
   ========================================================================== */

const State = {
  country: null,      // country object
  year: START_YEAR,
  scenario: 'current',
  playing: false,
  playTimer: null,
};

let globe;
const $ = (s) => document.querySelector(s);

// ---------- formatting ------------------------------------------------------
function fmtPop(m) {
  if (m >= 1000) return (m / 1000).toFixed(2) + 'B';
  if (m >= 100) return m.toFixed(0) + 'M';
  if (m >= 10) return m.toFixed(1) + 'M';
  return m.toFixed(2) + 'M';
}
function fmtSigned(m) {
  const v = m * 1e6; // persons
  const sign = v >= 0 ? '+' : '−';
  const a = Math.abs(v);
  let s;
  if (a >= 1e6) s = (a / 1e6).toFixed(2) + 'M';
  else if (a >= 1e3) s = (a / 1e3).toFixed(0) + 'K';
  else s = a.toFixed(0);
  return sign + s;
}

// ---------- left rail -------------------------------------------------------
function buildRail() {
  const scroll = $('#railScroll');
  // sort by 2100 change under "current" so the collapse is the story up top
  const rows = COUNTRIES.map(c => {
    const p = getProjection(c, 'current');
    const change = (p.endTotal - p.startTotal) / p.startTotal;
    return { c, change };
  }).sort((a, b) => a.change - b.change);

  rows.forEach(({ c, change }) => {
    const el = document.createElement('div');
    el.className = 'rail-item';
    el.dataset.name = c.name;
    const dir = change < -0.03 ? 'dn' : (change > 0.03 ? 'up' : 'fl');
    const arrow = dir === 'dn' ? '▼' : dir === 'up' ? '▲' : '–';
    el.innerHTML = `<span class="arrow ${dir}">${arrow}</span>
      <span class="nm">${c.label}</span>
      <span class="tfr">${c.tfr.toFixed(2)}</span>`;
    el.addEventListener('click', () => selectCountry(c.name, true));
    scroll.appendChild(el);
  });
}
function markRail(name) {
  document.querySelectorAll('.rail-item').forEach(el => {
    el.classList.toggle('active', el.dataset.name === name);
  });
}

// ---------- selection -------------------------------------------------------
function selectCountry(name, fromRail) {
  if (!name || !COUNTRY_BY_NAME[name]) {
    if (!State.country) toast('No projection data for that region — pick a highlighted country.');
    return;
  }
  // Don't re-select the already-active country
  if (State.country && State.country.name === name) return;
  const c = COUNTRY_BY_NAME[name];
  State.country = c;
  stopPlay();
  // Clear pyramid animation state so the new country draws instantly on first show
  const proj = getProjection(c, State.scenario);
  proj._prevBinVals = null;
  setYear(START_YEAR);
  globe.selectCountry(name);
  globe.focusCountry(name);
  globe.setAutoRotate(false);
  markRail(name);
  $('#panelEmpty').style.display = 'none';
  $('#panelBody').classList.add('show');
  // drop figures fresh for the current year
  const stat = currentStat();
  globe.setFigures(name, stat.bracket, 'drop');
  renderPanel();
}

function deselect() {
  if (!State.country) return;
  State.country = null;
  stopPlay();
  globe.clearFigures();
  globe.selectCountry(null);
  globe.resetCamera();
  globe.setAutoRotate(true);
  document.querySelectorAll('.rail-item').forEach(el => el.classList.remove('active'));
  $('#panelBody').classList.remove('show');
  $('#panelEmpty').style.display = '';
}

function currentProjection() { return getProjection(State.country, State.scenario); }
function currentStat() { return currentProjection().stats[yearIndex(State.year)]; }

// ---------- year + scenario -------------------------------------------------
function setYear(y, redrop) {
  State.year = Math.max(START_YEAR, Math.min(END_YEAR, Math.round(y)));
  $('#yearLabel').textContent = State.year;
  $('#yearSlider').value = State.year;
  const percent = ((State.year - START_YEAR) / (END_YEAR - START_YEAR)) * 100;
  $('#yearSlider').style.setProperty('--p', percent + '%');
  if (State.country) {
    const stat = currentStat();
    globe.setFigures(State.country.name, stat.bracket, redrop ? 'drop' : 'diff');
    renderPanel();
  }
}

function setScenario(s) {
  State.scenario = s;
  document.querySelectorAll('.scn button').forEach(b => b.classList.toggle('on', b.dataset.s === s));
  if (State.country) {
    const stat = currentStat();
    globe.setFigures(State.country.name, stat.bracket, 'diff'); // diff = smooth update, no respawn
    renderPanel();
  }
}

// ---------- playback --------------------------------------------------------
function togglePlay() {
  if (!State.country) { toast('Select a country first.'); return; }
  State.playing ? stopPlay() : startPlay();
}
function startPlay() {
  if (State.year >= END_YEAR) setYear(START_YEAR);
  State.playing = true;
  $('#playIcon').innerHTML = '<rect x="3" y="2" width="4" height="12"/><rect x="9" y="2" width="4" height="12"/>';
  State.playTimer = setInterval(() => {
    if (State.year >= END_YEAR) { stopPlay(); return; }
    setYear(State.year + 1);
  }, 620);
}
function stopPlay() {
  State.playing = false;
  clearInterval(State.playTimer);
  if (State._playRaf) cancelAnimationFrame(State._playRaf);
  $('#playIcon').innerHTML = '<path d="M3 2l11 6-11 6z"/>';
}

// ---------- panel rendering -------------------------------------------------
function renderPanel() {
  const c = State.country;
  const proj = currentProjection();
  const stat = currentStat();
  const start = proj.stats[0];

  $('#chIso').textContent = c.iso;
  $('#chName').textContent = c.label;
  $('#chYear').textContent = State.year;

  $('#popVal').textContent = fmtPop(stat.total);
  const net = $('#popNet');
  net.textContent = fmtSigned(stat.netChange) + '/yr';
  net.className = 'net ' + (stat.netChange < 0 ? 'neg' : 'pos');

  // tfr gauge (max scale 7)
  const tfr = stat.tfr;
  $('#tfrVal').textContent = tfr.toFixed(2);
  const fill = $('#tfrFill');
  fill.style.width = Math.min(100, tfr / 7 * 100) + '%';
  fill.style.background = tfr < REPLACEMENT_TFR ? 'var(--danger)' : 'var(--good)';
  $('#tfrRepl').style.left = (REPLACEMENT_TFR / 7 * 100) + '%';
  const tag = $('#tfrTag');
  if (tfr < REPLACEMENT_TFR) {
    tag.className = 'tfr-tag below';
    tag.textContent = `Below the 2.1 replacement line — each generation shrinks`;
  } else {
    tag.className = 'tfr-tag above';
    tag.textContent = `At or above replacement — population sustains itself`;
  }

  // stat grid
  $('#sMedian').innerHTML = stat.medianAge + ' <small>yrs</small>';
  $('#sO65').innerHTML = (stat.pctO65 * 100).toFixed(1) + ' <small>%</small>';
  $('#sDep').innerHTML = stat.dependency.toFixed(0) + ' <small>/100</small>';
  $('#sChild').innerHTML = (stat.pctU15 * 100).toFixed(1) + ' <small>%</small>';
  $('#sBirths').innerHTML = (stat.births * 1e6 >= 1e6 ? (stat.births).toFixed(2) + 'M' : (stat.births * 1e3).toFixed(0) + 'K');
  $('#sDeaths').innerHTML = (stat.deaths).toFixed(2) + 'M';

  drawPyramid(proj);
  renderNarrative(proj, stat, start);
}

function renderNarrative(proj, stat, start) {
  const c = State.country;
  const end = proj.stats[proj.stats.length - 1];
  const change = (end.total - start.total) / start.total * 100;
  const el = $('#narr');
  if (c.tfr < REPLACEMENT_TFR) {
    const gap = REPLACEMENT_TFR - c.tfr;
    const dist = gap < 0.1 ? 'slightly below' : gap < 0.4 ? 'below' : gap < 0.8 ? 'well below' : 'far below';
    if (change < 0) {
      const peakNote = proj.peakYear > START_YEAR
        ? ` Its population peaked in <b>${proj.peakYear}</b>.`
        : '';
      el.innerHTML = `At a fertility rate of <b>${c.tfr.toFixed(2)}</b> — ${dist} the <b>2.1</b>
        needed to replace a generation — ${c.label} is projected to
        <span class="hot">shrink ${Math.abs(change).toFixed(0)}%</span>
        by 2100, from <b>${fmtPop(start.total)}</b> to <b>${fmtPop(end.total)}</b>.${peakNote}`;
    } else {
      el.innerHTML = `At a fertility rate of <b>${c.tfr.toFixed(2)}</b> — ${dist} the <b>2.1</b>
        needed to replace a generation — ${c.label}'s population will peak around
        <b>${proj.peakYear}</b>, then <span class="hot">decline</span>, reaching
        <b>${fmtPop(end.total)}</b> by 2100 — still up <b>${change.toFixed(0)}%</b>
        from today due to population momentum.`;
    }
  } else {
    el.innerHTML = `With a fertility rate of <b>${c.tfr.toFixed(2)}</b>, ${c.label}'s population
      is projected to grow from <b>${fmtPop(start.total)}</b> to <b>${fmtPop(end.total)}</b>
      by 2100 — a rise of <b>${change.toFixed(0)}%</b>.`;
  }
}

// ---------- smooth animation between year ticks -----------------------------
const Anim = {
  bFrom: null, bTo: null, bT0: 0, bMax: 1, // pyramid bin values
  _raf: null,
  DUR: 560, // ms — completes just before the next 620ms tick

  bins(from, to, max) { this.bFrom = from; this.bTo = to; this.bT0 = performance.now(); this.bMax = max; this._kick(); },
  _kick() { if (!this._raf) this._raf = requestAnimationFrame(n => this._tick(n)); },
  _ease(t) { return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; },
  _tick(now) {
    let live = false;

    // pyramid bars
    if (this.bFrom && this.bTo) {
      const pt = (now - this.bT0) / this.DUR;
      const e  = this._ease(Math.min(1, pt));
      _paintBins(this.bFrom.map((v, i) => v + (this.bTo[i] - v) * e), this.bMax);
      if (pt < 1) live = true; else { this.bFrom = null; }
    }

    this._raf = live ? requestAnimationFrame(n => this._tick(n)) : null;
  }
};

// Low-level pyramid draw from a flat array of bin values
function _paintBins(vals, maxBin) {
  const cv = $('#pyramid'); if (!cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const n = vals.length, padB = 14, padT = 4;
  const rowH = (H - padB - padT) / n, cx = W / 2, halfMax = W / 2 - 6;
  ctx.strokeStyle = 'rgba(150,175,215,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, padT); ctx.lineTo(cx, H - padB); ctx.stroke();
  vals.forEach((v, i) => {
    const y = H - padB - (i + 1) * rowH, w = (v / maxBin) * halfMax, bh = Math.max(1, rowH - 1.4);
    ctx.fillStyle = bracketColor(i * 5);
    ctx.fillRect(cx - w, y + 0.7, w, bh);
    ctx.fillRect(cx, y + 0.7, w, bh);
  });
  ctx.fillStyle = 'rgba(120,135,160,0.7)'; ctx.font = '9px IBM Plex Mono, monospace'; ctx.textBaseline = 'middle';
  [['0',0],['20',4],['40',8],['65',13],['85',17]].forEach(([lab,i]) => {
    const y = H - padB - (i + 0.5) * rowH; ctx.textAlign = 'left'; ctx.fillText(lab, 2, y);
  });
  ctx.textAlign = 'center'; ctx.fillText('age structure', cx, H - 5);
}

// ---------- population pyramid (canvas) -------------------------------------
function bracketForAge(a) {
  if (a <= 14) return '--child';
  if (a <= 39) return '--young';
  if (a <= 64) return '--adult';
  return '--senior';
}
const _css = getComputedStyle(document.documentElement);
function bracketColor(a) { return _css.getPropertyValue(bracketForAge(a)).trim(); }

function bins5(ages) {
  const out = [];
  for (let g = 0; g <= 20; g++) {
    let s = 0;
    const lo = g * 5, hi = Math.min(MAX_AGE, lo + 4);
    for (let a = lo; a <= hi; a++) s += ages[a] || 0;
    out.push({ lo, val: s });
  }
  return out;
}

function drawPyramid(proj) {
  const ages = proj.ages[yearIndex(State.year)];
  const bins = bins5(ages);
  if (!proj._maxBin) {
    let mx = 0;
    proj.ages.forEach(ag => bins5(ag).forEach(b => { if (b.val > mx) mx = b.val; }));
    proj._maxBin = mx;
  }
  const maxBin = proj._maxBin || 1;
  const newVals = bins.map(b => b.val);

  if (proj._prevBinVals) {
    Anim.bins(proj._prevBinVals, newVals, maxBin);
  } else {
    _paintBins(newVals, maxBin);
  }
  proj._prevBinVals = newVals;
}

// ---------- toast -----------------------------------------------------------
let _toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- boot ------------------------------------------------------------
async function boot() {
  globe = new GlobeViz($('#globe'));
  globe.onSelect = (name) => selectCountry(name, false);

  buildRail();

  // timeline wiring
  $('#closePanel').addEventListener('click', deselect);
  $('#yearSlider').addEventListener('input', (e) => {
    stopPlay();
    setYear(+e.target.value);
  });
  $('#playBtn').addEventListener('click', togglePlay);
  document.querySelectorAll('.scn button').forEach(b =>
    b.addEventListener('click', () => setScenario(b.dataset.s)));
  setYear(START_YEAR);

  try {
    await globe.loadGeo((m) => { $('#loaderProg').textContent = m; });
  } catch (err) {
    $('#loaderProg').textContent = 'Failed to load map data: ' + err.message;
    return;
  }
  // Wait for the globe to actually paint one frame before revealing the UI,
  // so the transition from loader → globe is never a blank or half-drawn flash.
  await new Promise(r => requestAnimationFrame(r));
  const loader = $('#loader');
  loader.classList.add('gone');
  setTimeout(() => loader.remove(), 900);
  toast('Click a glowing country — or pick one from the list.');
}

window.addEventListener('DOMContentLoaded', boot);
