/* ============================================================================
   globe.js — Three.js scene: dot-matrix Earth, country picking, starfield,
   and instanced 3D "people" that drop from the sky / vanish as population
   rises and falls.
   ========================================================================== */

const GLOBE_R = 1.0;
const UP = new THREE.Vector3(0, 1, 0);

class GlobeViz {
  constructor(container) {
    this.container = container;
    this.onSelect = () => {};
    this.selected = null;            // country name
    this.landDotsByCountry = {};     // name -> [THREE.Vector3 unit normals]
    this.candidatesByName = {};      // name -> Float32Array of candidate normals
    this.crowd = new Map();          // posIdx -> person (the people around the man)
    this.meshes = {};                // bracket -> InstancedMesh
    this.outlineMeshes = {};         // bracket -> InstancedMesh (inverted hull)
    this._fps = {};                  // name -> farthest-point-sampling state
    this.man = null;                 // the single protagonist figure
    this.manActive = false;
    this.manState = null;
    this.MAN_FALL = 0.35;            // seconds the man takes to fall in
    this.MAN_SCALE = 1.0;            // normal size — only the drop HEIGHT is small
    this.crowdScale = 1;             // adaptive: shrinks for densely-packed countries
    this.clock = new THREE.Clock();
    this._ready = false; // set true after loadGeo so _animate skips work until then
    this._initScene();
  }

  _initScene() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.01, 100);
    this.camera.position.set(0, 0.35, 3.05);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0xffffff);

    // lights — soft, neutral, just enough to give the white sphere form
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe4ec, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 0.55);
    key.position.set(1.4, 1.8, 2.0);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xeef1f6, 0.3);
    fill.position.set(-2.0, -0.4, -1.2);
    this.scene.add(fill);

    // base sphere — white ocean; land is painted on as a light-gray texture
    // base sphere — white ocean; land is painted on as a light-gray texture.
    // Radius kept just under 1.0 so the outlines sit almost flush (no parallax).
    const baseGeo = new THREE.SphereGeometry(GLOBE_R * 0.9995, 96, 64);
    this.baseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    this.baseMesh = new THREE.Mesh(baseGeo, this.baseMat);
    this.scene.add(this.baseMesh);

    // rim outline — a slightly larger back-facing sphere shows only at the limb,
    // drawing a clean edge around the whole globe.
    const rimGeo = new THREE.SphereGeometry(GLOBE_R * 1.006, 96, 64);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x9aa4b2, side: THREE.BackSide });
    this.scene.add(new THREE.Mesh(rimGeo, rimMat));

    // invisible pick sphere
    this.pickSphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_R, 48, 32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.scene.add(this.pickSphere);

    // controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.rotateSpeed = 0.55;
    this.controls.minDistance = 1.05;
    this.controls.maxDistance = 6;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.35;

    // figure geometry + per-bracket instanced meshes
    this._buildFigureMeshes();

    // raycaster + click-vs-drag
    this.raycaster = new THREE.Raycaster();
    this._down = null;
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => { this._down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointerup', (e) => {
      if (!this._down) return;
      const dx = e.clientX - this._down.x, dy = e.clientY - this._down.y;
      if (Math.hypot(dx, dy) < 6) this._handleClick(e);
      this._down = null;
    });

    window.addEventListener('resize', () => this._resize());
    this._animate();
  }

  _addStars() {
    const N = 1600;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 14 + Math.random() * 26;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pos[i*3+2] = r * Math.cos(ph);
      const t = 0.5 + Math.random() * 0.5;
      col[i*3] = t * 0.8; col[i*3+1] = t * 0.85; col[i*3+2] = t;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.09, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.85,
    })));
  }

  // ---- figures -------------------------------------------------------------
  // A small capsule for a rounded limb/torso (cylinder with spherical caps).
  _capsule(r, len, seg) {
    const cyl = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
    const caps = Math.max(4, Math.round(seg / 2));
    const top = new THREE.SphereGeometry(r, seg, caps); top.translate(0, len / 2, 0);
    const bot = new THREE.SphereGeometry(r, seg, caps); bot.translate(0, -len / 2, 0);
    return THREE.BufferGeometryUtils.mergeBufferGeometries([cyl, top, bot]);
  }

  // A smooth, rounded 3D-mannequin: big sphere head, chunky rounded torso,
  // arms resting at the sides, two legs. Base at y=0 (feet), grows along +Y.
  _figureGeometry() {
    const seg = 8;
    const parts = [];
    const cap = (r, len) => this._capsule(r, len, seg);

    const legR = 0.0044, legLen = 0.018;
    for (const s of [-1, 1]) {
      const leg = cap(legR, legLen);
      leg.translate(0, legLen / 2, 0);
      leg.rotateZ(s * 0.05);
      leg.translate(s * 0.0046, 0, 0);
      parts.push(leg);
    }

    const torsoR = 0.0076, torsoLen = 0.019, hipY = legLen;
    const torso = cap(torsoR, torsoLen);
    torso.scale(1.12, 1, 0.88);
    torso.translate(0, hipY + torsoLen / 2, 0);
    parts.push(torso);

    // rounded shoulders
    const shoulderY = hipY + torsoLen * 0.96;
    const shoulders = new THREE.SphereGeometry(torsoR, seg, Math.round(seg / 2));
    shoulders.scale(1.4, 0.7, 0.92);
    shoulders.translate(0, shoulderY, 0);
    parts.push(shoulders);

    // arms rest at the sides
    const armR = 0.0033, armLen = 0.018;
    for (const s of [-1, 1]) {
      const arm = cap(armR, armLen);
      arm.translate(0, -armLen / 2, 0);
      arm.rotateZ(s * 0.06);
      arm.translate(s * (torsoR * 1.12 + armR * 0.55), shoulderY - 0.001, 0);
      parts.push(arm);
    }

    // slim neck + sphere head
    const neck = cap(0.0036, 0.005);
    neck.translate(0, shoulderY + 0.0035, 0);
    parts.push(neck);
    const headR = 0.0092;
    const head = new THREE.SphereGeometry(headR, seg + 2, seg);
    head.translate(0, shoulderY + 0.0035 + headR * 0.72, 0);
    parts.push(head);

    const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(parts);
    merged.computeBoundingBox();
    merged.translate(0, -merged.boundingBox.min.y, 0); // plant the feet at y=0
    return merged;
  }

  // Push every vertex out along its normal — a slightly inflated hull used,
  // rendered back-faces-only in a dark color, as a clean outline.
  _expandGeometry(geo, delta) {
    const g = geo.clone();
    const pos = g.attributes.position, nor = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i,
        pos.getX(i) + nor.getX(i) * delta,
        pos.getY(i) + nor.getY(i) * delta,
        pos.getZ(i) + nor.getZ(i) * delta);
    }
    pos.needsUpdate = true;
    g.computeBoundingSphere();
    return g;
  }

  _buildFigureMeshes() {
    const geo = this._figureGeometry();
    const outlineGeo = this._expandGeometry(geo, 0.0011);
    this.outlineMat = new THREE.MeshBasicMaterial({ color: 0x4a5260, side: THREE.BackSide });
    const CAP = 6000;
    for (const b of BRACKETS) {
      const mat = new THREE.MeshStandardMaterial({
        color: b.color, emissive: b.color, emissiveIntensity: 0.1,
        roughness: 0.4, metalness: 0.0,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, CAP);
      mesh.count = 0;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.meshes[b.key] = mesh;

      const om = new THREE.InstancedMesh(outlineGeo, this.outlineMat, CAP);
      om.count = 0;
      om.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      om.frustumCulled = false;
      om.renderOrder = -1;
      this.scene.add(om);
      this.outlineMeshes[b.key] = om;
    }
    // the single "man" who falls in first — use the "young adult" bracket color
    const manColor = new THREE.Color(BRACKETS[1].color);
    const manMat = new THREE.MeshStandardMaterial({
      color: manColor, emissive: manColor, emissiveIntensity: 0.1,
      roughness: 0.4, metalness: 0.0,
    });
    this.man = new THREE.Mesh(geo, manMat);
    this.man.frustumCulled = false;
    this.man.visible = false;
    const manOutline = new THREE.Mesh(outlineGeo, this.outlineMat);
    manOutline.renderOrder = -1;
    this.man.add(manOutline);   // inherits the man's transform
    this.scene.add(this.man);

    this._dummy = new THREE.Object3D();
  }

  // ---- geo loading + dot field -------------------------------------------
  async loadGeo(onProgress) {
    onProgress && onProgress('Fetching world geometry…');
    const [landTopo, ctyTopo] = await Promise.all([
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json').then(r => r.json()),
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json()),
    ]);
    this.landFeat = topojson.feature(landTopo, landTopo.objects.land);
    const fc = topojson.feature(ctyTopo, ctyTopo.objects.countries);
    this.allFeats = fc.features;
    // all country boundaries (incl. coastlines) as one MultiLineString
    this.borderMesh = topojson.mesh(ctyTopo, ctyTopo.objects.countries);
    // only keep features we have data for
    this.countryFeats = fc.features.filter(f => COUNTRY_BY_NAME[f.properties.name]);
    this.featByName = {};
    this.bboxByName = {};
    for (const f of this.countryFeats) {
      this.featByName[f.properties.name] = f;
      this.bboxByName[f.properties.name] = d3.geoBounds(f); // [[w,s],[e,n]]
    }

    onProgress && onProgress('Drawing countries…');
    this._buildRegions();     // fills landDotsByCountry (for placement + focus)
    this._buildLandTexture(); // light-gray land painted onto the white sphere
    this._buildOutlines();    // clean country borders on the sphere
    this._ready = true;       // allow _animate to start rendering
    this._prewarmAsync();     // background: build candidates + FPS so first click is instant
  }

  _latLngToVec(lat, lng, r = GLOBE_R) {
    const phi = lat * Math.PI / 180, lam = lng * Math.PI / 180;
    return new THREE.Vector3(
      r * Math.cos(phi) * Math.sin(lam),
      r * Math.sin(phi),
      r * Math.cos(phi) * Math.cos(lam)
    );
  }

  _buildRegions() {
    // Rasterize a country-index map once, then sample a fibonacci sphere to tag
    // which of our data countries each surface point falls in. Seeds
    // landDotsByCountry (used for camera focus). Even-placement candidates are
    // built separately, on demand, per country (see _buildCandidates).
    const W = 1024, H = 512;
    const proj = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    const ctyCv = document.createElement('canvas'); ctyCv.width = W; ctyCv.height = H;
    const cctx = ctyCv.getContext('2d');
    const cpath = d3.geoPath(proj, cctx);
    cctx.fillStyle = '#000'; cctx.fillRect(0, 0, W, H);
    this.countryFeats.forEach((f, i) => {
      cctx.fillStyle = 'rgb(' + (i + 1) + ',0,0)';
      cctx.beginPath(); cpath(f); cctx.fill();
    });
    const ctyData = cctx.getImageData(0, 0, W, H).data;

    const N = 17000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
      const lat = Math.asin(y) * 180 / Math.PI;
      const lng = Math.atan2(x, z) * 180 / Math.PI;
      const px = Math.min(W - 1, Math.max(0, Math.floor((lng + 180) / 360 * W)));
      const py = Math.min(H - 1, Math.max(0, Math.floor((90 - lat) / 180 * H)));
      const idx = ctyData[(py * W + px) * 4];
      if (idx > 0 && idx <= this.countryFeats.length) {
        const name = this.countryFeats[idx - 1].properties.name;
        (this.landDotsByCountry[name] ||= []).push(new THREE.Vector3(x, y, z).normalize());
      }
    }
  }

  // Interior sample points for one country. Built once per country and cached.
  // Uses a dense bounding-box grid filtered by geoContains for every country.
  // The old Fibonacci fast-path had two bugs: canvas antialiasing mis-tagged
  // border dots to wrong countries, and the sparse sphere gave too few
  // candidates for large-population countries (China: 305 instead of 1410).
  // The grid always generates enough candidates and is inherently correct.
  _buildCandidates(name) {
    if (this.candidatesByName[name]) return this.candidatesByName[name];

    const feat = this.featByName[name];
    const bb = this.bboxByName[name];
    if (!feat || !bb) return (this.candidatesByName[name] = new Float32Array(0));
    let [[w, s], [e, n]] = bb;
    if (e < w) e += 360; // dateline wrap
    const GRID = 130;
    const out = [];
    for (let iy = 0; iy < GRID; iy++) {
      const lat = s + (n - s) * (iy + 0.5) / GRID;
      const phi = lat * Math.PI / 180, cphi = Math.cos(phi), sphi = Math.sin(phi);
      for (let ix = 0; ix < GRID; ix++) {
        const lngRaw = w + (e - w) * (ix + 0.5) / GRID;
        const lng = ((lngRaw + 540) % 360) - 180;
        if (d3.geoContains(feat, [lng, lat])) {
          const lam = lng * Math.PI / 180;
          out.push(cphi * Math.sin(lam), sphi, cphi * Math.cos(lam));
        }
      }
    }
    return (this.candidatesByName[name] = new Float32Array(out));
  }

  // Kick off background pre-warming of candidates + FPS for all countries.
  // Yields one grid ROW per tick (130 geoContains calls, ~1–3 ms) so the
  // main thread is never blocked long enough to drop a frame.
  _prewarmAsync() {
    const GRID = 130;
    const names = Object.keys(this.landDotsByCountry)
      .sort((a, b) => (this.landDotsByCountry[b]?.length || 0) - (this.landDotsByCountry[a]?.length || 0));

    let ni = 0;          // country index
    let ri = 0;          // row index within current country
    let wn, wf, wb;      // working name / feature / adjusted bbox [w,s,e,n]
    let acc = [];        // candidate accumulator for current country

    const advance = () => {
      // Move to the next country that hasn't been cached yet (user may have clicked it already).
      while (!wf) {
        if (ni >= names.length) return false; // all done
        const name = names[ni++];
        if (this.candidatesByName[name]) continue;
        const feat = this.featByName[name];
        const bb   = this.bboxByName[name];
        if (!feat || !bb) continue;
        let [[w, s], [e, n]] = bb;
        if (e < w) e += 360;
        wn = name; wf = feat; wb = [w, s, e, n]; ri = 0; acc = [];
      }
      return true;
    };

    const step = () => {
      if (!advance()) return; // nothing left to do

      // Process one row of the bounding-box grid.
      const [w, s, e, n] = wb;
      const lat = s + (n - s) * (ri + 0.5) / GRID;
      const phi = lat * Math.PI / 180, cphi = Math.cos(phi), sphi = Math.sin(phi);
      for (let ix = 0; ix < GRID; ix++) {
        const lngRaw = w + (e - w) * (ix + 0.5) / GRID;
        const lng = ((lngRaw + 540) % 360) - 180;
        if (d3.geoContains(wf, [lng, lat])) {
          const lam = lng * Math.PI / 180;
          acc.push(cphi * Math.sin(lam), sphi, cphi * Math.cos(lam));
        }
      }
      ri++;

      if (ri >= GRID) {
        // Country finished — store candidates and seed FPS.
        this.candidatesByName[wn] = new Float32Array(acc);
        this._buildFPS(wn, 600);
        wf = null; // trigger advance() on next tick
      }

      setTimeout(step, 0);
    };

    setTimeout(step, 1200); // start after the first rendered frame settles
  }

  // unit normal pointing at a country's centroid (for the man's landing spot)
  _centroidNormal(name) {
    const pool = this.landDotsByCountry[name];
    if (pool && pool.length) {
      const c = new THREE.Vector3();
      pool.forEach(n => c.add(n));
      return c.normalize();
    }
    if (this.featByName[name]) {
      const ctr = d3.geoCentroid(this.featByName[name]);
      return this._latLngToVec(ctr[1], ctr[0]).normalize();
    }
    return null;
  }

  // Farthest-point sampling: ordered, evenly-spread points filling the country.
  // Index 0 is the candidate nearest the centroid (where the man stands); every
  // prefix of the returned list is an even covering of the whole territory.
  _buildFPS(name, need) {
    const cands = this._buildCandidates(name);
    if (!cands || cands.length < 3) return null;
    const M = cands.length / 3;
    let st = this._fps[name];
    if (!st) {
      // area-weighted centroid (mean of interior points), snapped to the
      // nearest real interior point — that's where the man stands.
      let mx = 0, my = 0, mz = 0;
      for (let i = 0; i < M; i++) { mx += cands[i*3]; my += cands[i*3+1]; mz += cands[i*3+2]; }
      const ml = Math.hypot(mx, my, mz) || 1; mx /= ml; my /= ml; mz /= ml;
      let seed = 0, bd = -2;
      for (let i = 0; i < M; i++) {
        const d = cands[i*3]*mx + cands[i*3+1]*my + cands[i*3+2]*mz;
        if (d > bd) { bd = d; seed = i; }
      }
      const minDist = new Float32Array(M);
      const sx = cands[seed*3], sy = cands[seed*3+1], sz = cands[seed*3+2];
      for (let i = 0; i < M; i++) minDist[i] = 1 - (cands[i*3]*sx + cands[i*3+1]*sy + cands[i*3+2]*sz);
      minDist[seed] = -1;
      st = { chosenVecs: [new THREE.Vector3(sx, sy, sz)], minDist };
      this._fps[name] = st;
    }
    const target = Math.min(need, M);
    const md = st.minDist;
    while (st.chosenVecs.length < target) {
      let best = -1, bd = -1;
      for (let i = 0; i < M; i++) { if (md[i] > bd) { bd = md[i]; best = i; } }
      if (best < 0) break;
      const bx = cands[best*3], by = cands[best*3+1], bz = cands[best*3+2];
      st.chosenVecs.push(new THREE.Vector3(bx, by, bz));
      md[best] = -1;
      for (let i = 0; i < M; i++) {
        const d = 1 - (cands[i*3]*bx + cands[i*3+1]*by + cands[i*3+2]*bz);
        if (d < md[i]) md[i] = d;
      }
    }
    return st.chosenVecs;
  }

  // Build an evenly-interleaved sequence of bracket keys (so colors mix across
  // the country rather than clumping), matching the year's age proportions.
  _bracketSeq(want, T) {
    const keys = BRACKETS.map(b => b.key);
    const counts = keys.map(k => Math.max(0, want[k] || 0));
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    const acc = keys.map(() => 0);
    const seq = new Array(T);
    for (let i = 0; i < T; i++) {
      let best = 0, bd = -Infinity;
      for (let k = 0; k < keys.length; k++) {
        const d = (i + 1) * counts[k] / total - acc[k];
        if (d > bd) { bd = d; best = k; }
      }
      acc[best]++; seq[i] = keys[best];
    }
    return seq;
  }

  // Convert GeoJSON line strings to a flat segment-pair array hugging the sphere.
  _linesToSegments(lines, r, maxStep = 1.6) {
    const pos = [];
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i], b = line[i + 1];
        const dlng = b[0] - a[0], dlat = b[1] - a[1];
        if (Math.abs(dlng) > 180) continue; // antimeridian wrap — don't draw across the globe
        const steps = Math.max(1, Math.ceil(Math.hypot(dlng, dlat) / maxStep));
        let prev = this._latLngToVec(a[1], a[0], r);
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const v = this._latLngToVec(a[1] + dlat * t, a[0] + dlng * t, r);
          pos.push(prev.x, prev.y, prev.z, v.x, v.y, v.z);
          prev = v;
        }
      }
    }
    return new Float32Array(pos);
  }

  _ringsOf(feat) {
    const g = feat.geometry, out = [];
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) for (const ring of poly) out.push(ring);
    return out;
  }

  _buildLandTexture() {
    // Paint land as light gray on a white (ocean) equirectangular canvas, then
    // map it onto the base sphere. offset.x aligns the texture with the
    // outlines, which are placed directly from lat/lng via _latLngToVec.
    const W = 2048, H = 1024;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';          // ocean
    ctx.fillRect(0, 0, W, H);
    const proj = d3.geoEquirectangular()
      .scale(W / (2 * Math.PI))
      .translate([W / 2, H / 2]);
    const path = d3.geoPath(proj, ctx);
    // All land — light gray base
    ctx.fillStyle = '#dde1e8';
    ctx.beginPath(); path(this.landFeat); ctx.fill();

    // Data countries — slightly more defined (interactive)
    ctx.fillStyle = '#b8c0ce';
    for (const f of this.countryFeats) {
      ctx.beginPath(); path(f); ctx.fill();
    }

    // Non-data countries — diagonal hatching to show they're not interactive
    const dataNames = new Set(this.countryFeats.map(f => f.properties.name));
    const patSz = 7;
    const patCv = document.createElement('canvas');
    patCv.width = patSz; patCv.height = patSz;
    const pc = patCv.getContext('2d');
    pc.fillStyle = '#dde1e8';
    pc.fillRect(0, 0, patSz, patSz);
    pc.strokeStyle = 'rgba(130,142,162,0.55)';
    pc.lineWidth = 1;
    pc.beginPath();
    pc.moveTo(0, 0);       pc.lineTo(patSz, patSz);
    pc.moveTo(-patSz, 0);  pc.lineTo(0, patSz);
    pc.moveTo(patSz, 0);   pc.lineTo(patSz * 2, patSz);
    pc.stroke();
    const hatch = ctx.createPattern(patCv, 'repeat');
    for (const f of this.allFeats) {
      if (!dataNames.has(f.properties.name)) {
        ctx.fillStyle = hatch;
        ctx.beginPath(); path(f); ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.offset.x = 0.25;                // align seam with the 3D outlines
    tex.anisotropy = 4;
    this.baseMat.map = tex;
    this.baseMat.needsUpdate = true;
  }

  _buildOutlines() {
    // Build outlines from each country's actual polygon rings (real coast/border
    // loops). This avoids the spurious connector lines that topojson.mesh can
    // introduce. Shared land borders draw twice — visually negligible.
    let lines = [];
    for (const f of this.allFeats) for (const ring of this._ringsOf(f)) lines.push(ring);
    const segs = this._linesToSegments(lines, GLOBE_R * 1.0006);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(segs, 3));
    this.outlines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: 0x9aa4b2, transparent: true, opacity: 0.9,
    }));
    this.outlines.renderOrder = 1;
    this.scene.add(this.outlines);

    // reusable highlight outline for the selected country
    this.hl = new THREE.LineSegments(new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x1f6feb, transparent: true, opacity: 0.95 }));
    this.hl.renderOrder = 2;
    this.hl.visible = false;
    this.scene.add(this.hl);
  }

  _highlightCountryDots(name) {
    if (!this.hl) return;
    if (!name) { this.hl.visible = false; return; }
    const feat = this.featByName[name];
    if (!feat) return;
    const segs = this._linesToSegments(this._ringsOf(feat), GLOBE_R * 1.0014);
    this.hl.geometry.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(segs, 3));
    this.hl.geometry = g;
    this.hl.visible = true;
  }

  _handleClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.pickSphere)[0];
    if (!hit) return;
    const p = hit.point.clone().normalize();
    const lat = Math.asin(p.y) * 180 / Math.PI;
    const lng = Math.atan2(p.x, p.z) * 180 / Math.PI;
    for (const f of this.countryFeats) {
      if (d3.geoContains(f, [lng, lat])) {
        this.onSelect(f.properties.name);
        return;
      }
    }
    this.onSelect(null); // clicked land/ocean with no data
  }

  // ---- figure population ---------------------------------------------------
  // total clear (when switching country)
  clearFigures() {
    this.crowd.clear();
    for (const b of BRACKETS) {
      this.meshes[b.key].count = 0;
      this.outlineMeshes[b.key].count = 0;
    }
    if (this.man) this.man.visible = false;
    this.manActive = false;
    this.manState = null;
  }

  _spawnMan(n, now, instant, bracketKey) {
    const q = new THREE.Quaternion().setFromUnitVectors(UP, n);
    // use the bracket's material so the man is visually counted in the population
    if (bracketKey && this.meshes[bracketKey]) {
      this.man.material = this.meshes[bracketKey].material;
    }
    this.man.visible = true;
    this.manActive = true;
    this.manState = {
      n, q,
      phase: instant ? 'rest' : 'appear',
      t0: now,
      dur: 0.45,
    };
  }

  _addCrowd(idx, n, bracket, now, delay) {
    const q = new THREE.Quaternion().setFromUnitVectors(UP, n);
    this.crowd.set(idx, {
      idx, n, q, bracket,
      phase: 'appear',
      t0: now + delay,
      dur: 0.42 + Math.random() * 0.22,
      scale: 0,
    });
  }

  _leave(p, now) {
    p.phase = 'leave';
    p.t0 = now;
    p.dur = 0.4 + Math.random() * 0.2;
  }

  // Match the figures to a year's age structure (millions per bracket).
  // mode 'drop' = the man falls in then the crowd appears around him;
  // mode 'diff' = keep the man, add/remove people smoothly as population shifts.
  setFigures(name, bracketMillions, mode = 'diff') {
    const want = {};
    let T = 0;
    for (const b of BRACKETS) {
      const v = Math.max(0, Math.round((bracketMillions[b.key] || 0) / PERSONS_PER_FIGURE));
      want[b.key] = v; T += v;
    }
    if (T < 1) T = 1;

    const positions = this._buildFPS(name, T);
    if (!positions || !positions.length) { this.clearFigures(); return; }
    T = Math.min(T, positions.length);
    const seq = this._bracketSeq(want, T);
    const now = this.clock.elapsedTime;
    const c0 = positions[0];

    // Adaptive figure size: measure the spacing of the placed people (distance
    // from the last point to its nearest neighbor) and shrink the figures when
    // the country is tightly packed, so dense places (Korea/Japan/India) don't
    // overflow while sparse ones (Russia/Canada) stay full size.
    let sc = 1;
    if (T > 1) {
      const last = positions[T - 1];
      let md = Infinity;
      for (let i = 0; i < T - 1; i++) { const d = 1 - last.dot(positions[i]); if (d < md) md = d; }
      const spacing = Math.sqrt(Math.max(0, 2 * md)); // ~angular gap in globe units
      sc = Math.max(0.55, Math.min(1, spacing / 0.028));
    }
    this.crowdScale = sc;

    if (mode === 'drop') {
      this.clearFigures();
      this._spawnMan(positions[0], now, false, seq[0]);  // man uses his age-bracket color
      for (let i = 1; i < T; i++) {                 // the crowd appears, rippling out
        const ring = 1 - positions[i].dot(c0);      // ~angular distance from center
        const delay = 0.06 + ring * 2.6 + Math.random() * 0.1;
        this._addCrowd(i, positions[i], seq[i], now, delay);
      }
    } else {
      // Update man bracket (aging)
      if (!this.manActive) {
        this._spawnMan(positions[0], now, true, seq[0]);
      } else if (this.man && this.meshes[seq[0]]) {
        this.man.material = this.meshes[seq[0]].material;
      }

      // Figures beyond new total leave — force to senior color first (they die of old age)
      for (const [idx, p] of this.crowd) {
        if (idx >= T && p.phase !== 'leave') {
          p.bracket = 'senior';
          this._leave(p, now);
        }
      }

      // Add newcomers as children (births); age resting figures forward via surplus counting
      for (let i = 1; i < T; i++) {
        const p = this.crowd.get(i);
        if (!p) {
          this._addCrowd(i, positions[i], 'child', now, Math.random() * 0.3);
        }
      }

      // Target bracket counts for this year (from seq)
      const seqCounts = { child: 0, young: 0, adult: 0, senior: 0 };
      for (let i = 1; i < T; i++) seqCounts[seq[i]]++;

      // Collect pools of RESTING figures (never touch newly spawned 'appear' ones)
      const agePools = { child: [], young: [], adult: [], senior: [] };
      for (const [idx, p] of this.crowd) {
        if (idx >= 1 && idx < T && p.phase === 'rest') agePools[p.bracket].push(p);
      }

      // Promote surplus from each bracket forward — never backward, never newly spawned
      const promote = (from, to) => {
        const excess = Math.max(0, agePools[from].length - seqCounts[from]);
        for (let i = agePools[from].length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [agePools[from][i], agePools[from][j]] = [agePools[from][j], agePools[from][i]];
        }
        for (let i = 0; i < excess; i++) {
          agePools[from][i].bracket = to;
          agePools[to].push(agePools[from][i]);
        }
      };
      promote('child', 'young');
      promote('young', 'adult');
      promote('adult', 'senior');
    }
  }

  selectCountry(name) {
    this.selected = name;
    this._highlightCountryDots(name);
  }

  _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  _easeInQuad(t) { return t * t; }
  _easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  _updateFigures() {
    const now = this.clock.elapsedTime;
    let anyActive = false;
    const R = GLOBE_R + 0.001;

    // crowd — reset each bracket mesh and re-pack instances
    const ctr = {};
    for (const b of BRACKETS) ctr[b.key] = 0;
    for (const [idx, p] of this.crowd) {
      let s = p.scale;
      if (p.phase === 'appear') {
        const t = (now - p.t0) / p.dur;
        if (t < 0) { s = 0; anyActive = true; }
        else if (t < 1) { s = Math.max(0, this._easeOutBack(t)); anyActive = true; }
        else { p.phase = 'rest'; s = 1; }
      } else if (p.phase === 'leave') {
        const t = (now - p.t0) / p.dur;
        if (t >= 1) { this.crowd.delete(idx); continue; }
        s = 1 - this._easeOutCubic(Math.min(1, t));
        anyActive = true;
      } else { s = 1; }
      p.scale = s;
      const mesh = this.meshes[p.bracket];
      const om = this.outlineMeshes[p.bracket];
      const d = this._dummy;
      d.position.copy(p.n).multiplyScalar(R);
      d.quaternion.copy(p.q);
      d.scale.setScalar(s * this.crowdScale);
      d.updateMatrix();
      const ci = ctr[p.bracket]++;
      mesh.setMatrixAt(ci, d.matrix);
      om.setMatrixAt(ci, d.matrix);
    }
    for (const b of BRACKETS) {
      const m = this.meshes[b.key], om = this.outlineMeshes[b.key];
      m.count = ctr[b.key];
      om.count = ctr[b.key];
      m.instanceMatrix.needsUpdate = true;
      om.instanceMatrix.needsUpdate = true;
    }

    // the man
    if (this.manActive && this.manState) {
      const ms = this.manState;
      let s = 1;
      if (ms.phase === 'appear') {
        const t = (now - ms.t0) / ms.dur;
        if (t < 0) { s = 0; anyActive = true; }
        else if (t < 1) { s = Math.max(0, this._easeOutBack(t)); anyActive = true; }
        else { ms.phase = 'rest'; }
      }
      this.man.position.copy(ms.n).multiplyScalar(GLOBE_R + 0.001);
      this.man.quaternion.copy(ms.q);
      this.man.scale.setScalar(s * this.MAN_SCALE * this.crowdScale);
    }
    return anyActive;
  }

  setAutoRotate(on) { if (this.controls) this.controls.autoRotate = on; }

  resetCamera() {
    // Pull back to a globe overview along the current viewing direction,
    // and return the orbit target to the globe centre.
    const DEFAULT_DIST = 3.0;
    const toPos = this.camera.position.clone().normalize().multiplyScalar(DEFAULT_DIST);
    this._focus = {
      fromPos: this.camera.position.clone(),
      toPos,
      fromTarget: this.controls.target.clone(),
      toTarget: new THREE.Vector3(0, 0, 0),
      fromUp: this.camera.up.clone(),
      toUp: new THREE.Vector3(0, 1, 0),
      t0: this.clock.elapsedTime,
      dur: 1.0,
      onComplete: () => {
        this.controls.minDistance = 1.05;
        this.controls.maxDistance = 6;
      },
    };
  }

  // Fix winding-order issues: use min(a, 4π−a) so we always get true polygon area
  _mainlandFeat(name) {
    const feat = this.featByName[name];
    if (!feat) return null;
    const g = feat.geometry;
    if (g.type === 'Polygon') return feat;
    let bestArea = -1, bestCoords = null;
    for (const poly of g.coordinates) {
      const a = d3.geoArea({ type: 'Feature', geometry: { type: 'Polygon', coordinates: poly } });
      const real = Math.min(a, 4 * Math.PI - a); // normalize winding direction
      if (real > bestArea) { bestArea = real; bestCoords = poly; }
    }
    return bestCoords
      ? { type: 'Feature', properties: feat.properties, geometry: { type: 'Polygon', coordinates: bestCoords } }
      : feat;
  }

  focusCountry(name) {
    if (!this.featByName[name]) return;

    // Centroid from interior candidate points — area-weighted, so metropolitan France
    // dominates over French Guiana, main Japan over small islands, etc.
    // Falls back to d3.geoCentroid if no candidates yet.
    let c;
    const cands = this._buildCandidates(name);
    if (cands && cands.length >= 3) {
      const M = cands.length / 3;
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < M; i++) { cx += cands[i*3]; cy += cands[i*3+1]; cz += cands[i*3+2]; }
      const len = Math.hypot(cx, cy, cz);
      c = new THREE.Vector3(cx / len, cy / len, cz / len);
    } else {
      const ctr = d3.geoCentroid(this.featByName[name]);
      c = this._latLngToVec(ctr[1], ctr[0]).normalize();
    }

    const mainland = this._mainlandFeat(name);
    const area = mainland ? d3.geoArea(mainland) : 0.001;
    // How far the camera sits from the surface centroid point (not globe centre).
    // Smaller countries get closer; larger ones need more room.
    const distFromSurface = Math.max(0.35, Math.min(1.4, 0.2 + Math.sqrt(area) / 0.18));

    // Equatorward tangent at the centroid — the direction the camera swings toward
    // so figures appear as 3D people looking across the horizon, not flat from above.
    const worldY = new THREE.Vector3(0, 1, 0);
    const sinLat = c.y;
    let equatorDir;
    if (Math.abs(sinLat) > 0.05) {
      const upTangent = new THREE.Vector3().copy(worldY).addScaledVector(c, -sinLat).normalize();
      equatorDir = upTangent.clone().multiplyScalar(-Math.sign(sinLat));
    } else {
      // Near equator: swing the camera east instead
      equatorDir = new THREE.Vector3().crossVectors(worldY, c);
      if (equatorDir.length() < 0.01) equatorDir.set(1, 0, 0);
      equatorDir.normalize();
    }

    // Camera sits at 30° above the horizon (tangent plane) in the equatorward direction,
    // and looks directly at the surface centroid — giving a horizon-level perspective.
    const ELEV = Math.PI / 6; // 30°
    const camOffset = equatorDir.clone().multiplyScalar(Math.cos(ELEV))
      .addScaledVector(c, Math.sin(ELEV)).normalize();
    const surfacePoint = c.clone().multiplyScalar(GLOBE_R);
    const toPos = surfacePoint.clone().addScaledVector(camOffset, distFromSurface);

    // Allow the camera to sit close to the surface point — OrbitControls' default
    // minDistance (1.05) is relative to the target and would kick the camera away
    // once the animation finishes and controls take over.
    this.controls.minDistance = 0.05;
    this.controls.maxDistance = 4;

    this._focus = {
      fromPos: this.camera.position.clone(),
      toPos,
      fromTarget: this.controls.target.clone(),
      toTarget: surfacePoint,
      fromUp: this.camera.up.clone(),
      toUp: c.clone(),          // surface normal = local "up" for this country
      t0: this.clock.elapsedTime,
      dur: 1.3,
    };
  }

  _applyFocus() {
    if (!this._focus) return;
    const f = this._focus;
    const t = Math.min(1, (this.clock.elapsedTime - f.t0) / f.dur);
    const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; // easeInOut
    this.camera.position.lerpVectors(f.fromPos, f.toPos, e);
    this.controls.target.lerpVectors(f.fromTarget, f.toTarget, e);
    if (f.fromUp && f.toUp) {
      this.camera.up.lerpVectors(f.fromUp, f.toUp, e).normalize();
    }
    // Orient the camera ourselves — controls.update() is skipped during animation
    // to prevent its damping state from fighting the lerp.
    this.camera.lookAt(this.controls.target);
    if (t >= 1) {
      if (f.onComplete) f.onComplete();
      this._focus = null;
    }
  }

  _resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    this.clock.getDelta(); // always advance clock so elapsedTime is correct post-load
    if (!this._ready) return;
    if (!this._focus) this.controls.update(); // skip while focus animation owns the camera
    this._applyFocus();
    this._updateFigures();
    this.renderer.render(this.scene, this.camera);
  }
}
