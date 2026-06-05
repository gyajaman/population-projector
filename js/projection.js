/* ============================================================================
   projection.js — Cohort-component population projection (single year of age)
   Drives the year slider. Two scenarios:
     'current'  — today's fertility rate persists unchanged ("if trends hold")
     'recovery' — UN-style gradual convergence toward a long-run equilibrium
                  TFR of ~1.7, matching the UN WPP 2024 medium-variant
                  assumption for most countries by 2100.
   ========================================================================== */

const START_YEAR = 2025;
const END_YEAR = 2100;
const LONG_RUN_TFR = 1.7;

function tfrAt(c, year, scenario) {
  if (scenario === 'current') return c.tfr;

  const p = Math.min(1, Math.max(0, (year - START_YEAR) / (END_YEAR - START_YEAR)));
  return c.tfr + (LONG_RUN_TFR - c.tfr) * p;
}

// Per-country mortality multiplier so lower-life-expectancy nations see
// higher death rates. Small annual improvement applied over time.
function mortalityFactor(c, year) {
  const base = Math.max(0.6, Math.min(2.6, 82 / c.lifeExp));
  const improve = Math.pow(0.996, year - START_YEAR); // ~0.4%/yr longevity gain
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
