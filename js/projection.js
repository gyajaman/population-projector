/* ============================================================================
   projection.js — Cohort-component population projection (single year of age)
   Drives the year slider. Two scenarios:
     'current'  — today's fertility rate persists unchanged ("if trends hold")
     'recovery' — UN WPP 2024 medium-variant style: each country converges
                  toward a long-run TFR calibrated to its starting level.
                  Ultra-low fertility countries (S. Korea, Japan) recover only
                  to ~1.3–1.4; high-fertility SSA countries decline toward
                  ~2.4–2.6 but remain above replacement. Mortality improves
                  faster for lower-LE countries (more headroom). Methodology
                  follows the UN cohort-component method. Net migration is
                  omitted — this affects mainly USA, Germany, and Australia.
   ========================================================================== */

const START_YEAR = 2025;
const END_YEAR = 2100;

// Country-specific long-run TFR target for the recovery scenario.
// Calibrated to UN WPP 2024 medium-variant 2100 fertility assumptions:
//   - Ultra-low (<1.0):  countries like S. Korea barely recover → ~1.30
//   - Very low  (1–1.5): Japan, China, Italy → ~1.40
//   - Below-rep (1.5–2.1): France, Germany, Brazil → ~1.65
//   - Near-rep+ (2.1–4): significant decline, stays near replacement level
//   - Very high  (≥4.0): large decline but SSA countries remain above 2.1
function recoveryTFR(c) {
  const t = c.tfr;
  if (t < 1.0) return 1.30;
  if (t < 1.5) return 1.40;
  if (t < 2.1) return 1.65;
  if (t < 4.0) return 2.10 + (t - 2.10) * 0.15; // e.g. Philippines 2.78→2.21, Pakistan 3.35→2.29
  return        2.35 + (t - 4.00) * 0.08;         // e.g. Nigeria 5.1→2.44, Niger 6.7→2.56
}

function tfrAt(c, year, scenario) {
  if (scenario === 'current') return c.tfr;
  const target = recoveryTFR(c);
  const p = Math.min(1, Math.max(0, (year - START_YEAR) / (END_YEAR - START_YEAR)));
  return c.tfr + (target - c.tfr) * p;
}

// Per-country mortality multiplier. Annual improvement rate is tiered by
// life expectancy: high-LE countries are near a ceiling; low-LE countries
// have more headroom and improve faster (UN WPP 2024 assumption).
function mortalityFactor(c, year) {
  const base = Math.max(0.6, Math.min(2.6, 82 / c.lifeExp));
  // improvement rate: ~0.2%/yr for LE>80, ~0.4% for LE 70-80, ~0.6% for LE<70
  const rate = c.lifeExp > 80 ? 0.998 : c.lifeExp > 70 ? 0.996 : 0.994;
  const improve = Math.pow(rate, year - START_YEAR);
  return base * improve;
}

// Summary stats from a single-year age array (millions).
function summarize(pop, births, deaths, tfr) {
  let total = 0, u15 = 0, work = 0, o65 = 0;
  const bracket = { child: 0, young: 0, adult: 0, senior: 0 };
  for (let a = 0; a <= MAX_AGE; a++) {
    const v = pop[a];
    total += v;
    if (a <= 14) { u15 += v; bracket.child += v; }
    else if (a <= 39) { work += v; bracket.young += v; }
    else if (a <= 64) { work += v; bracket.adult += v; }
    else { o65 += v; bracket.senior += v; }
  }
  // median age
  let cum = 0, median = 0;
  for (let a = 0; a <= MAX_AGE; a++) {
    cum += pop[a];
    if (cum >= total / 2) { median = a; break; }
  }
  const workingAge = u15 < total ? (total - u15 - o65) : 0;
  return {
    total, tfr,
    births, deaths,
    netChange: births - deaths,
    birthRate: total > 0 ? births / total * 1000 : 0,
    deathRate: total > 0 ? deaths / total * 1000 : 0,
    medianAge: median,
    pctU15: total > 0 ? u15 / total : 0,
    pctWorking: total > 0 ? workingAge / total : 0,
    pctO65: total > 0 ? o65 / total : 0,
    // old-age dependency: 65+ per 100 working-age (15-64)
    dependency: workingAge > 0 ? o65 / workingAge * 100 : 0,
    bracket, // millions per display bracket
  };
}

// Project a country across the whole horizon. Returns timeline keyed by year.
function projectCountry(c, scenario) {
  let pop = buildInitialAges(c).slice();
  const years = [];
  const stats = [];
  const ages = []; // store age arrays for the pyramid + figures

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const tfr = tfrAt(c, year, scenario);
    const mFac = mortalityFactor(c, year);

    // births this year (millions): sum over reproductive ages of females * asfr*TFR
    let births = 0;
    for (let a = 15; a <= 49; a++) births += pop[a] * FEMALE_FRAC * tfr * ASFR[a];

    // deaths + aging
    let deaths = 0;
    const next = new Float64Array(MAX_AGE + 1);
    for (let a = 0; a <= MAX_AGE; a++) {
      const q = Math.min(0.85, baseMortality(a) * mFac);
      deaths += pop[a] * q;
    }
    next[0] = births;
    for (let a = 0; a < MAX_AGE; a++) {
      const q = Math.min(0.85, baseMortality(a) * mFac);
      next[a + 1] += pop[a] * (1 - q);
    }
    const qTop = Math.min(0.85, baseMortality(MAX_AGE) * mFac);
    next[MAX_AGE] += pop[MAX_AGE] * (1 - qTop);

    years.push(year);
    stats.push(summarize(pop, births, deaths, tfr));
    ages.push(pop.slice());

    pop = next;
  }

  // peak year + total
  let peakYear = START_YEAR, peakTotal = -Infinity;
  stats.forEach((s, i) => { if (s.total > peakTotal) { peakTotal = s.total; peakYear = years[i]; } });

  return { country: c, scenario, years, stats, ages, peakYear, peakTotal,
           startTotal: stats[0].total, endTotal: stats[stats.length - 1].total };
}

// cache so we don't recompute on every slider tick
const _projCache = new Map();
function getProjection(c, scenario) {
  const key = c.name + '|' + scenario;
  if (!_projCache.has(key)) _projCache.set(key, projectCountry(c, scenario));
  return _projCache.get(key);
}
function clearProjectionCache() { _projCache.clear(); }

function yearIndex(year) { return Math.round(year) - START_YEAR; }
