/* Transformer Formula & Concept Simulator — fills #sim on the Transformers page.
   One model drives everything: the animated diagram, the live readouts, the "what happens if I change this?"
   table, the graphs, the formula explorer and the practice questions.
   Model: single-phase transformer, approximate equivalent circuit referred to the secondary, E1 ≈ V1,
   linear core (no saturation), Steinmetz exponent 1.6 for hysteresis, eddy loss ∝ (f·Bm)². */
(() => {
  const root = document.getElementById('sim');
  if (!root || typeof D === 'undefined') return;
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plain = h => { const t = document.createElement('template'); t.innerHTML = h; return t.content.textContent.replace(/\s+/g, ' ').trim(); };
  const sig = (v, n = 3) => {
    if (!Number.isFinite(v)) return '–';
    if (v === 0) return '0';
    if (Math.abs(v - Math.round(v)) < 1e-9 && Math.abs(v) >= 10) return Math.round(v).toLocaleString('en-IN');
    const a = Math.abs(v), d = a >= 1000 ? 0 : Math.max(0, n - 1 - Math.floor(Math.log10(a)));
    return v.toLocaleString('en-IN', { minimumFractionDigits: Math.min(d, 4), maximumFractionDigits: Math.min(d, 4) });
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ================= topics (for progress tracking) ================= */
  const TAGS = { emf: 'EMF & flux', turns: 'Voltage & turns', cur: 'Currents', imp: 'Impedance & equivalent circuit', noload: 'No-load current & phasors', loss: 'Losses', eff: 'Efficiency',
    reg: 'Regulation', test: 'OC & SC tests', ph3: 'Three-phase & vector groups', auto: 'Autotransformer', par: 'Parallel operation', sat: 'Saturation, inrush, harmonics & hum', prot: 'Protection, CT & PT', other: 'Other' };
  const TAGRX = [['auto', /auto-?transformer/i], ['par', /parallel|load sharing|sharing/i], ['ph3', /three-phase|3-phase|3-φ|delta|Δ|star|vector group|\b[YD][ydz]\d|open delta|V–V|Scott|tertiary/i],
    ['sat', /inrush|harmonic|saturat|hum|magnetostriction/i], ['prot', /Buchholz|relay|protection|\bCT\b|\bPT\b/], ['test', /open-circuit|short-circuit|\bOC\b|\bSC\b/],
    ['reg', /regulation/i], ['eff', /efficien/i], ['noload', /no-load|magneti[sz]ing|I₀|Iμ|phasor/i], ['imp', /referred|impedance|R₀₁|equivalent/i], ['loss', /loss|hysteresis|eddy|lamination/i],
    ['cur', /current/i], ['turns', /turns|ratio|step-up|step-down/i], ['emf', /emf|flux|4\.44|frequenc|V\/f|\bHz\b/i]];
  const tagOf = t => (TAGRX.find(([, rx]) => rx.test(t)) || ['other'])[0];

  /* ================= model ================= */
  // Design (rated) point of the primary; rating S stays in kVA when turns are changed.
  const DES = { V: 2200, f: 50, N1: 1000 };
  const PHI0 = DES.V / (4.44 * DES.f * DES.N1);
  const IMU0 = 0.12;   // magnetising current at rated flux, primary side (A)
  // Magnetising current needed for a flux of b × rated: a typical saturation shape (assumed, not one core's data):
  // almost linear below rated flux, a knee near 1.1–1.3 × rated, then a steep straight line (deep saturation).
  const SATK = 1.3, SAT0 = SATK * (0.5 + 0.5 * SATK ** 8), SATD = 0.5 + 4.5 * SATK ** 8;
  const sat = b => { const x = Math.abs(b); return Math.sign(b) * (x <= SATK ? x * (0.5 + 0.5 * x ** 8) : SAT0 + SATD * (x - SATK)); };
  const DEF = { V1: 2200, f: 50, N1: 1000, N2: 100, pf: 0.8, pt: 'lag', R1: 5, R2: 0.05, X1: 10, X2: 0.1, S: 10, Pi0: 100, h: 0.6, load: 'Z', I2set: 0, ZL: 0, PL: 0, hrs: [6, 10, 8] };
  let st = { ...DEF, hrs: [...DEF.hrs] };

  const trig = s => {
    const cs = s.pt === 'unity' ? 1 : clamp(s.pf, 0.01, 1);
    const sn = (s.pt === 'lag' ? 1 : s.pt === 'lead' ? -1 : 0) * Math.sqrt(Math.max(0, 1 - cs * cs));
    return [cs, sn];
  };
  function solve(s) {
    const K = s.N2 / s.N1, phi = s.V1 / (4.44 * s.f * s.N1), E2 = s.V1 * K;
    const R02 = s.R2 + K * K * s.R1, X02 = s.X2 + K * K * s.X1, R01 = s.R1 + s.R2 / (K * K), X01 = s.X1 + s.X2 / (K * K);
    const [cs, sn] = trig(s);
    const A = R02 * cs + X02 * sn, B = X02 * cs - R02 * sn;
    const V2at = I => { const r = E2 * E2 - (I * B) ** 2; return r < 0 ? NaN : Math.sqrt(r) - I * A; };
    let I2;
    if (s.load === 'I') I2 = s.I2set;
    else if (s.load === 'Z') I2 = s.ZL > 0 ? E2 / Math.hypot(R02 + s.ZL * cs, X02 + s.ZL * sn) : 0;
    else {   // constant power: smallest current that delivers PL
      I2 = NaN;
      if (s.PL <= 0) I2 = 0;
      else {
        const Isc = E2 / Math.hypot(R02, X02), g = I => V2at(I) * I * cs - s.PL;
        let lo = 0, hi = NaN;
        for (let i = 1; i <= 240; i++) { const I = Isc * i / 240; if (g(I) >= 0) { hi = I; break; } lo = I; }
        if (Number.isFinite(hi)) { for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (g(m) >= 0) hi = m; else lo = m; } I2 = hi; }
      }
    }
    const V2 = s.load === 'Z' ? I2 * s.ZL : V2at(I2);
    const I2r = s.S * 1000 / (DES.V * K), I1r = s.S * 1000 / DES.V, x = I2 / I2r;
    const Br = phi / PHI0;
    const Ph = s.Pi0 * s.h * (s.f / DES.f) * Math.pow(Br, 1.6), Pe = s.Pi0 * (1 - s.h) * (s.f / DES.f) ** 2 * Br * Br, Pi = Ph + Pe;
    const Pcu = I2 * I2 * R02, Pout = V2 * I2 * cs, eta = Pout > 0 ? Pout / (Pout + Pi + Pcu) * 100 : 0;
    const Iw = Pi / s.V1, Imu = IMU0 * sat(Br) * (DES.N1 / s.N1), I0 = Math.hypot(Iw, Imu);
    // Phasors referred to the primary, V₂′ as reference: V₁ = V₂′ + I₂′(R₀₁ + jX₀₁); I₁ = I₂′ + I₀ (Iw along V₁, Iμ 90° behind V₁)
    const V2p = V2 / K, I1id = I2 * K, dR = I1id * (cs * R01 + sn * X01), dX = I1id * (cs * X01 - sn * R01), dl = Math.atan2(dX, V2p + dR);
    const i0x = Iw * Math.cos(dl) + Imu * Math.sin(dl), i0y = Iw * Math.sin(dl) - Imu * Math.cos(dl), i1x = I1id * cs + i0x, i1y = -I1id * sn + i0y;
    const I1 = Math.hypot(i1x, i1y);
    const PcuFL = I2r * I2r * R02, xm = Math.sqrt(Pi / PcuFL), Im = xm * I2r, Vm = V2at(Im), Pm = Vm * Im * cs;
    return { K, a: 1 / K, phi, Br, E2, V2, I2, I1, I1id, I0, Iw, Imu, R01, X01, Z01: Math.hypot(R01, X01), R02, X02, Z02: Math.hypot(R02, X02),
      Ph, Pe, Pi, Pcu, Pout, Pin: Pout + Pi + Pcu, eta, reg: (E2 - V2) / E2 * 100, regA: I2 * A / E2 * 100, x, I2r, I1r, PcuFL, xm, Im,
      etam: Pm > 0 ? Pm / (Pm + 2 * Pi) * 100 : 0, cs, sn, ph: { V2p, I2p: I1id, dl, i1x, i1y, phi1: dl - Math.atan2(i1y, i1x) }, ZLp: s.load === 'Z' ? s.ZL / (K * K) : (I2 > 0 ? V2 / I2 / (K * K) : NaN), V2at };
  }
  // Moving the load slider fixes the load at that current; constant-Z and constant-P loads are derived from it.
  function setLoad(s, I) {
    const t = { ...s, load: 'I', I2set: I }, o = solve(t);
    s.I2set = I; s.ZL = I > 0 ? o.V2 / I : 1e9; s.PL = o.V2 * I * o.cs;
  }
  setLoad(st, solve(st).I2r);
  const sync = s => { const I = solve(s).I2, t = { ...s }; if (Number.isFinite(I)) setLoad(t, I); return t; };

  /* ================= inputs ================= */
  const IN = [
    { k: 'V1', l: 'Primary voltage V₁', u: 'V', min: 500, max: 3500, step: 10 },
    { k: 'f', l: 'Frequency f', u: 'Hz', min: 20, max: 100, step: 1 },
    { k: 'N1', l: 'Primary turns N₁', u: '', min: 200, max: 3000, step: 10 },
    { k: 'N2', l: 'Secondary turns N₂', u: '', min: 10, max: 3000, step: 1 },
    { k: 'phi', l: 'Maximum flux Φm', u: 'mWb', min: 1, max: 30, step: 0.01, note: 'Φm is fixed by V₁, f and N₁ — moving this changes V₁' },
    { k: 'I2', l: 'Load current I₂', u: 'A', min: 0, max: 60, step: 0.01 },
    { k: 'pf', l: 'Load power factor cos φ', u: '', min: 0.1, max: 1, step: 0.01 },
    { k: 'R1', l: 'Primary resistance R₁', u: 'Ω', min: 0, max: 40, step: 0.1 },
    { k: 'R2', l: 'Secondary resistance R₂', u: 'Ω', min: 0, max: 0.4, step: 0.001 },
  ];
  const MORE = [
    { k: 'X1', l: 'Primary leakage reactance X₁', u: 'Ω', min: 0, max: 80, step: 0.1 },
    { k: 'X2', l: 'Secondary leakage reactance X₂', u: 'Ω', min: 0, max: 0.8, step: 0.001 },
    { k: 'S', l: 'Rating S', u: 'kVA', min: 1, max: 100, step: 1 },
    { k: 'Pi0', l: 'Core loss at rated V and f', u: 'W', min: 0, max: 600, step: 1 },
    { k: 'h', l: 'Hysteresis share of that core loss', u: '', min: 0, max: 1, step: 0.01 },
  ];
  const getIn = (k, o) => k === 'phi' ? o.phi * 1000 : k === 'I2' ? o.I2 : st[k];
  const ctl = c => `<div class="sm-c" data-k="${c.k}"><label for="sm-${c.k}">${c.l}${c.u ? ` <small>(${c.u})</small>` : ''}</label>
    <div class="sm-cr"><input type="range" id="sm-${c.k}" min="${c.min}" max="${c.max}" step="${c.step}" aria-label="${esc(c.l)}"><input type="number" min="${c.min}" max="${c.max}" step="${c.step}" aria-label="${esc(c.l)} value"></div>${c.note ? `<small class="sm-note">${c.note}</small>` : ''}</div>`;

  /* ================= outputs shown live ================= */
  const OUT = [
    ['phi', 'Max flux Φm', 'mWb', 1000], ['K', 'Turns ratio K = N₂/N₁', '', 1], ['E2', 'No-load secondary E₂', 'V', 1], ['V2', 'Secondary voltage V₂ (on load)', 'V', 1],
    ['I2', 'Secondary current I₂', 'A', 1], ['I1', 'Primary current I₁', 'A', 1], ['I0', 'No-load current I₀', 'A', 1], ['x', 'Load (fraction of full load)', '%', 100],
    ['Pcu', 'Copper loss', 'W', 1], ['Ph', 'Hysteresis loss', 'W', 1], ['Pe', 'Eddy-current loss', 'W', 1], ['Pi', 'Core loss (Ph + Pe)', 'W', 1],
    ['Pout', 'Output power', 'W', 1], ['eta', 'Efficiency η', '%', 1], ['reg', 'Voltage regulation', '%', 1], ['R01', 'R₀₁ (referred to primary)', 'Ω', 1],
  ];
  const ON = Object.fromEntries(OUT.map(o => [o[0], o]));
  const FORM = {
    phi: 'Φm = V₁ / (4.44 f N₁)', K: 'K = N₂ / N₁', E2: 'E₂ = V₁ N₂ / N₁', V2: 'V₂ = E₂ − I₂(R₀₂ cos φ ± X₀₂ sin φ) (approx.)', I2: 'set by the load',
    I1: 'I₁ ≈ K I₂ + I₀ (phasor sum)', I0: 'I₀ = √(Iw² + Iμ²), Iμ ∝ Φm / N₁, Iw = Pi / V₁', x: 'x = I₂ / I₂,rated', Pcu: 'Pcu = I₂² R₀₂ = x² Pcu,FL',
    Ph: 'Ph ∝ f Bm^1.6', Pe: 'Pe ∝ (f Bm)² ∝ V²', Pi: 'Pi = Ph + Pe', Pout: 'P = V₂ I₂ cos φ', eta: 'η = P / (P + Pi + Pcu)',
    reg: 'Reg = I₂(R₀₂ cos φ ± X₀₂ sin φ) / E₂', R01: 'R₀₁ = R₁ + R₂ (N₁/N₂)²',
  };
  const val = (k, o) => o[k] * (ON[k] ? ON[k][3] : 1);

  /* ================= what-if engine ================= */
  const PAR = {
    V1: ['Primary voltage V₁', 'V₁'], f: ['Frequency f', 'f'], N1: ['Primary turns N₁', 'N₁'], N2: ['Secondary turns N₂', 'N₂'],
    load: ['Load demand', 'load'], pf: ['Power factor cos φ', 'cos φ'], R: ['Winding resistance R₁, R₂', 'R'], X: ['Leakage reactance X₁, X₂', 'X'],
  };
  function perturb(s, p, fac, vf) {
    const t = { ...s };
    if (p === 'V1') t.V1 *= fac;
    else if (p === 'f') { t.f *= fac; if (vf) t.V1 *= fac; }
    else if (p === 'N1') t.N1 *= fac;
    else if (p === 'N2') t.N2 *= fac;
    else if (p === 'load') { t.I2set *= fac; t.ZL /= fac; t.PL *= fac; }
    else if (p === 'pf') { t.pf = clamp(t.pf * fac, 0.01, 1); if (t.pt === 'unity') t.pt = 'lag'; }
    else if (p === 'R') { t.R1 *= fac; t.R2 *= fac; }
    else if (p === 'X') { t.X1 *= fac; t.X2 *= fac; }
    return t;
  }
  const WK = ['phi', 'E2', 'V2', 'I2', 'I1', 'I0', 'Pcu', 'Ph', 'Pe', 'Pi', 'Pout', 'eta', 'reg', 'R01'];
  const dirOf = (a, b) => !Number.isFinite(a) || !Number.isFinite(b) ? 0 : Math.abs(b - a) <= 1e-4 * Math.max(Math.abs(a), Math.abs(b), 1e-9) ? 0 : b > a ? 1 : -1;
  const REL = [[1, '∝ #'], [-1, '∝ 1/#'], [2, '∝ #²'], [-2, '∝ 1/#²'], [0.5, '∝ √#'], [-0.5, '∝ 1/√#'], [1.6, '∝ #^1.6'], [-0.6, '∝ #^−0.6']];
  function relation(s, p, k, vf) {
    if (p === 'pf' || p === 'load' && k === 'eta') return '';
    const a = solve(s)[k], b = solve(perturb(s, p, 1.001, vf))[k];
    if (!(a > 0 && b > 0)) return '';
    const e = Math.log(b / a) / Math.log(1.001), sym = PAR[p][1];
    if (Math.abs(e) < 0.002) return 'no change';
    for (const [v, t] of REL) if (Math.abs(e - v) < 0.015) return t.replace('#', p === 'load' ? 'I₂' : sym);
    return e > 0 ? 'rises, not in proportion' : 'falls, not in proportion';
  }
  // Short reasons for the pairs exams ask about; any other row shows its formula.
  const WHY = {
    'V1.phi': 'The core flux adjusts until the back-emf equals V₁: Φm = V₁/(4.44 f N₁).',
    'f.phi': 'A faster-changing flux needs a smaller peak to induce the same emf: Φm = V₁/(4.44 f N₁).',
    'N1.phi': 'More turns share the same voltage, so each turn needs less flux.',
    'N2.phi': 'Φm is fixed by the primary (V₁, f, N₁); the secondary turns do not enter.',
    'load.phi': 'Load mmf N₂I₂ is cancelled by extra primary current, so the flux stays (almost) the same.',
    'f.E2': 'The voltage ratio is the turns ratio — frequency is not in it.',
    'N2.E2': 'Volts per turn are the same on both windings, so E₂ ∝ N₂.',
    'N1.E2': 'E₂ = V₁ N₂/N₁: more primary turns means fewer volts per turn.',
    'V1.Ph': 'Bm ∝ V, and Ph ∝ Bm^1.6.', 'V1.Pe': 'Pe ∝ (f Bm)² ∝ V².',
    'f.Ph': 'At fixed V, Bm ∝ 1/f, so Ph ∝ f·(1/f)^1.6 = f^−0.6.',
    'f.Pe': 'At fixed V, f·Bm stays the same, so Pe ∝ (f Bm)² does not change.',
    'load.Pi': 'Core loss depends on V₁ and f only, not on the load.',
    'load.Pcu': 'Copper loss ∝ I².',
    'load.I1': 'Every extra ampere-turn of load is matched by the primary: N₁I₁ ≈ N₂I₂.',
    'N1.I0': 'Iμ = Φm·ℛ/N₁ and Φm ∝ 1/N₁: Iμ falls about ∝ 1/N₁² below saturation, faster above it.',
    'V1.I0': 'Magnetising current rises with flux — gently below rated, steeply once the core saturates.',
    'f.I0': 'Lower flux at higher f needs less magnetising current.',
    'R.Pcu': 'Pcu = I² R.', 'X.Pcu': 'Reactance takes no real power.',
    'X.reg': 'The I X sin φ term grows (lagging pf).', 'R.reg': 'The I R cos φ term grows.',
    'pf.eta': 'Same current and losses, but more real output when cos φ is higher.',
    'pf.reg': 'Reg ≈ I(R cos φ ± X sin φ)/V changes with φ.',
    'f.Pi': 'At fixed V, hysteresis falls (∝ f^−0.6) and eddy loss stays the same, so core loss falls.',
    'fvf.phi': 'V/f is fixed, so Φm = V₁/(4.44 f N₁) stays the same.', 'fvf.Ph': 'Bm is constant, so Ph ∝ f.', 'fvf.Pe': 'Bm is constant, so Pe ∝ f².', 'fvf.Pi': 'Both parts rise: Ph ∝ f, Pe ∝ f².', 'fvf.E2': 'E₂ = V₁N₂/N₁ rises with V₁.',
    'N2.I2': 'Depends on the load: same power → I₂ ∝ 1/N₂; same impedance → I₂ ∝ N₂.', 'N2.I1': 'Depends on the load: same power → I₁ unchanged; same impedance → I₁ ∝ N₂².',
    'load.eta': 'η rises with load until copper loss = core loss, then falls.', 'load.V2': 'More I₂ means more drop in R₀₂ and X₀₂ (lagging pf).',
    'N2.R01': 'R₂ referred to the primary is R₂(N₁/N₂)².', 'N1.R01': 'R₂ referred to the primary is R₂(N₁/N₂)².',
  };
  function whatIf(s0, p, up, vf) {
    const s = sync(s0), fac = up ? 1.1 : 1 / 1.1, a = solve(s), t = perturb(s, p, fac, vf), b = solve(t);
    const alt = ['I', 'Z', 'P'].map(m => [m, solve({ ...s, load: m }), solve(perturb({ ...s, load: m }, p, fac, vf))]);
    return WK.map(k => {
      const d = dirOf(a[k], b[k]), dirs = alt.map(([m, x, y]) => [m, dirOf(x[k], y[k])]);
      const dep = new Set(dirs.map(x => x[1])).size > 1;
      return { k, a: val(k, a), b: val(k, b), d, dep, dirs, rel: relation(s, p, k, vf), why: (vf && WHY[`fvf.${k}`]) || WHY[`${p}.${k}`] || FORM[k] };
    });
  }
  const pm = v => (v > 0 ? '+' : v < 0 ? '−' : '') + sig(Math.abs(v), 2);
  const chg = (a, b, u) => u === '%' ? `${pm(b - a)} points` : `${pm((b / a - 1) * 100)} %`;
  const ARROW = d => d > 0 ? '<b class="up">↑</b>' : d < 0 ? '<b class="dn">↓</b>' : '<b class="eq">→</b>';
  const LOADN = { I: 'constant current', Z: 'constant impedance', P: 'constant power' };

  /* ================= graphs ================= */
  const GR = {
    Vphi: { t: 'Voltage V₁ vs flux Φm', p: 'V1', r: [500, 3500], y: [['phi', 'Φm']], xl: 'V₁ (V)', yl: 'mWb' },
    fphi: { t: 'Frequency f vs flux Φm', p: 'f', r: [20, 100], y: [['phi', 'Φm']], xl: 'f (Hz)', yl: 'mWb' },
    Nphi: { t: 'Primary turns N₁ vs flux Φm', p: 'N1', r: [200, 3000], y: [['phi', 'Φm']], xl: 'N₁', yl: 'mWb' },
    N2V: { t: 'Secondary turns N₂ vs voltage E₂', p: 'N2', r: [10, 2000], y: [['E2', 'E₂'], ['V2', 'V₂ on load']], xl: 'N₂', yl: 'V' },
    N1V: { t: 'Primary turns N₁ vs voltage E₂', p: 'N1', r: [200, 3000], y: [['E2', 'E₂']], xl: 'N₁', yl: 'V' },
    N2I: { t: 'Secondary turns N₂ vs currents', p: 'N2', r: [20, 400], y: [['I2', 'I₂'], ['I1', 'I₁']], xl: 'N₂', yl: 'A', note: 'Load behaves as the selected load type' },
    LI: { t: 'Load vs currents', p: 'x', r: [0, 1.25], y: [['I1', 'I₁'], ['I0', 'I₀']], xl: 'load (fraction of full load)', yl: 'A' },
    N2Z: { t: 'Secondary turns N₂ vs impedance referred to primary', p: 'N2', r: [40, 400], y: [['R01', 'R₀₁'], ['X01', 'X₀₁']], xl: 'N₂', yl: 'Ω' },
    Leta: { t: 'Load vs efficiency', p: 'x', r: [0.05, 1.25], y: [['eta', 'η']], xl: 'load (fraction of full load)', yl: '%', mark: 'xm' },
    Lcu: { t: 'Load vs copper loss and core loss', p: 'x', r: [0, 1.25], y: [['Pcu', 'Copper loss'], ['Pi', 'Core loss']], xl: 'load (fraction of full load)', yl: 'W', mark: 'xm' },
    fcore: { t: 'Frequency vs core loss (V₁ fixed)', p: 'f', r: [20, 100], y: [['Ph', 'Hysteresis'], ['Pe', 'Eddy'], ['Pi', 'Total']], xl: 'f (Hz)', yl: 'W' },
    fcorevf: { t: 'Frequency vs core loss (V/f fixed)', p: 'fvf', r: [20, 100], y: [['Ph', 'Hysteresis'], ['Pe', 'Eddy'], ['Pi', 'Total']], xl: 'f (Hz)', yl: 'W' },
    Vcore: { t: 'Voltage vs core loss', p: 'V1', r: [500, 3500], y: [['Ph', 'Hysteresis'], ['Pe', 'Eddy'], ['Pi', 'Total']], xl: 'V₁ (V)', yl: 'W' },
    VI0: { t: 'Voltage vs no-load current (OC test)', p: 'V1', r: [500, 3500], y: [['I0', 'I₀'], ['Imu', 'Iμ'], ['Iw', 'Iw']], xl: 'V₁ (V)', yl: 'A', note: 'Typical saturation curve (shape assumed): above rated voltage Iμ rises steeply.' },
    BH: { t: 'Magnetising curve — flux vs magnetising current', p: 'b', r: [0.2, 1.6], y: [['Imu', 'Iμ']], xl: 'flux (× rated)', yl: 'A', note: 'Typical shape (assumed): nearly straight up to rated flux, a knee near 1.1–1.3 × rated, then very steep.' },
    pfreg: { t: 'Power factor angle vs voltage regulation', p: 'ang', r: [-80, 80], y: [['reg', 'Exact'], ['regA', 'Book formula']], xl: '← leading · φ (°) · lagging →', yl: '%' },
    Lreg: { t: 'Load vs voltage regulation', p: 'x', r: [0, 1.25], y: [['reg', 'Regulation']], xl: 'load (fraction of full load)', yl: '%' },
  };
  const COL = ['#c62828', '#1d5fc4', '#2e8b57', '#7b4fd6'];
  function at(p, v) {
    const t = { ...st };
    if (p === 'x') { t.load = 'I'; t.I2set = v * solve(st).I2r; }
    else if (p === 'ang') { t.load = 'I'; t.I2set = solve(st).I2; t.pt = v < -0.01 ? 'lead' : v > 0.01 ? 'lag' : 'unity'; t.pf = Math.cos(Math.abs(v) * Math.PI / 180); }
    else if (p === 'fvf') { t.V1 = st.V1 * v / st.f; t.f = v; }
    else if (p === 'b') t.V1 = v * PHI0 * 4.44 * st.f * st.N1;
    else t[p] = v;
    return t;
  }
  const curX = (p, o) => p === 'b' ? o.Br : p === 'x' ? o.x : p === 'ang' ? (st.pt === 'lead' ? -1 : st.pt === 'lag' ? 1 : 0) * Math.acos(o.cs) * 180 / Math.PI : p === 'fvf' ? st.f : st[p];
  const nice = r => { const e = Math.pow(10, Math.floor(Math.log10(r))), m = r / e; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * e; };
  function plot(box, xs, series, opt) {
    const svg = box.querySelector('svg'), W = Math.max(260, Math.round(svg.getBoundingClientRect().width) || 520), H = 210;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const X0 = 52, X1 = W - 12, Y0 = 24, Y1 = H - 40, x0 = xs[0], x1 = xs[xs.length - 1];
    const all = series.flatMap(q => q[1]).filter(Number.isFinite).concat(opt.hline ? [opt.hline[0]] : []);
    let lo = opt.lo != null ? opt.lo : Math.min(0, ...all), hi = Math.max(...all);
    if (!(hi > lo)) hi = lo + 1;
    const step = nice((hi - lo) / 4); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const sx = v => X0 + (v - x0) / (x1 - x0) * (X1 - X0), sy = v => Y1 - (clamp(v, lo, hi) - lo) / (hi - lo) * (Y1 - Y0);
    let h = '';
    for (let t = lo; t <= hi + step / 2; t += step) h += `<line x1="${X0}" x2="${X1}" y1="${sy(t)}" y2="${sy(t)}" stroke="#e3e8f0"/><text x="${X0 - 6}" y="${sy(t) + 4}" text-anchor="end" font-size="10.5" fill="#56637a">${sig(t, 3)}</text>`;
    const xst = nice((x1 - x0) / 5);
    for (let t = Math.ceil(x0 / xst) * xst; t <= x1 + 1e-9; t += xst) h += `<text x="${sx(t)}" y="${Y1 + 15}" text-anchor="middle" font-size="10.5" fill="#56637a">${sig(t, 3)}</text>`;
    h += `<line x1="${X0}" x2="${X1}" y1="${Y1}" y2="${Y1}" stroke="#56637a"/><text x="${X1}" y="${H - 6}" text-anchor="end" font-size="11" fill="#56637a">${esc(opt.xl)}</text><text x="6" y="12" font-size="11" font-weight="700" fill="#56637a">${esc(opt.yl)}</text>`;
    if (opt.hline) h += `<line x1="${X0}" x2="${X1}" y1="${sy(opt.hline[0])}" y2="${sy(opt.hline[0])}" stroke="#e09a00" stroke-dasharray="5 4"/><text x="${X1 - 4}" y="${sy(opt.hline[0]) - 4}" text-anchor="end" font-size="10.5" fill="#a86a00">${esc(opt.hline[1])}</text>`;
    if (opt.mark != null && opt.mark >= x0 && opt.mark <= x1) h += `<line x1="${sx(opt.mark)}" x2="${sx(opt.mark)}" y1="${Y0}" y2="${Y1}" stroke="#e09a00" stroke-dasharray="4 4"/><text x="${sx(opt.mark) + 4}" y="${Y0 + 10}" font-size="10.5" fill="#a86a00">${esc(opt.markLabel || '')}</text>`;
    series.forEach((q, i) => {
      let d = '', pen = false;
      q[1].forEach((v, j) => { if (!Number.isFinite(v)) { pen = false; return; } d += `${pen ? 'L' : 'M'}${sx(xs[j]).toFixed(1)} ${sy(v).toFixed(1)}`; pen = true; });
      h += `<path d="${d}" fill="none" stroke="${COL[i]}" stroke-width="2.4" stroke-linejoin="round"${q[2] ? ` stroke-dasharray="${q[2]}"` : ''}/>`;
    });
    if (opt.cur != null && opt.cur >= x0 && opt.cur <= x1) {
      h += `<line x1="${sx(opt.cur)}" x2="${sx(opt.cur)}" y1="${Y0}" y2="${Y1}" stroke="#13265a" stroke-width=".8"/>`;
      (opt.curVals || []).forEach((v, i) => { if (Number.isFinite(v)) h += `<circle cx="${sx(opt.cur)}" cy="${sy(v)}" r="4.5" fill="#fff" stroke="${COL[i]}" stroke-width="2"/>`; });
    }
    svg.innerHTML = h;
    box.querySelector('.sm-leg').innerHTML = series.map((q, i) => { const v = opt.curVals ? opt.curVals[i] : NaN; return `<span><i style="background:${COL[i]}"></i>${q[0]}${Number.isFinite(v) ? ` = <b>${sig(v)}</b> ${opt.yl}` : ''}</span>`; }).join('');
  }
  function chart(box, id) {
    const g = GR[id], N = 90, xs = [];
    for (let i = 0; i <= N; i++) xs.push(g.r[0] + (g.r[1] - g.r[0]) * i / N);
    const sc = k => (ON[k] ? ON[k][3] : 1);
    const ser = g.y.map(([k, l]) => [l, xs.map(v => solve(at(g.p, v))[k] * sc(k))]);
    const o = solve(st), cx = curX(g.p, o), oc = solve(at(g.p, cx));
    let lo;
    if (g.p === 'x' && g.y[0][0] === 'eta') { const a = ser[0][1].filter(Number.isFinite); lo = Math.max(0, Math.floor(Math.min(...a) - 2)); }
    plot(box, xs, ser, { xl: g.xl, yl: g.yl, lo, mark: g.mark ? o[g.mark] : null, markLabel: 'max η: Cu = core', cur: cx, curVals: g.y.map(([k]) => oc[k] * sc(k)) });
  }
  const graphBox = id => `<figure class="sm-g" data-g="${id}"><figcaption>${GR[id].t}</figcaption><svg role="img" aria-label="${esc(GR[id].t)}"></svg><div class="sm-leg"></div>${GR[id].note ? `<small class="sm-note">${GR[id].note}</small>` : ''}</figure>`;

  /* ================= diagram ================= */
  const coil = (x, n, cls) => { let h = ''; for (let i = 0; i < n; i++) { const y = 98 + (i + 0.5) * 104 / n; h += `<path class="${cls}" d="M${x - 8} ${(y + 5).toFixed(1)} L${x + 58} ${(y - 5).toFixed(1)}"/>`; } return h; };
  const T = (id, x, y, a = '') => `<text id="smd-${id}" class="t-${id}" x="${x}" y="${y}" ${a}></text>`;
  function diagramInit() {
    root.querySelector('.sm-dg').innerHTML = `<svg viewBox="0 0 680 300" class="sm-svg" role="img" aria-label="Transformer: primary coil, secondary coil, alternating core flux and the currents">
      <rect x="190" y="40" width="300" height="220" rx="10" fill="#c9d3e0" stroke="#7d8aa0"/>${[0, 1, 2, 3, 4].map(i => `<line x1="190" x2="490" y1="${50 + i * 50}" y2="${50 + i * 50}" stroke="#b6c1d1" stroke-width=".6"/>`).join('')}
      <rect x="240" y="90" width="200" height="120" rx="6" fill="#fff" stroke="#7d8aa0"/>
      <rect id="smd-flux" class="sm-flux" x="215" y="65" width="250" height="170" rx="22" fill="none" stroke-dasharray="12 12" opacity=".85"/>
      <g id="smd-c1"></g><g id="smd-c2"></g>
      <path id="smd-w1" class="sm-wire" d="M60 128 V96 H182 M60 172 V204 H182"/><path id="smd-w2" class="sm-wire s2" d="M498 96 H600 V128 M498 204 H600 V172"/>
      <circle cx="60" cy="150" r="22" fill="#fff" stroke="#13265a" stroke-width="2"/><path d="M46 150 q7 -14 14 0 t14 0" fill="none" stroke="#13265a" stroke-width="2"/>
      <rect x="584" y="128" width="32" height="44" rx="4" fill="#fff" stroke="#13265a" stroke-width="2"/>${T('lt', 600, 155, 'text-anchor="middle" font-size="12" font-weight="700" fill="#13265a"')}
      ${T('V1', 4, 30, 'font-size="19" font-weight="700" fill="#13265a"')}${T('f', 4, 54, 'font-size="17" font-weight="700" fill="#56637a"')}${T('I1', 4, 86, 'font-size="17" font-weight="700" fill="#c62828"')}
      ${T('N1', 215, 288, 'text-anchor="middle" font-size="17" font-weight="700" fill="#b4531c"')}${T('N2', 465, 288, 'text-anchor="middle" font-size="17" font-weight="700" fill="#1d6b3a"')}
      ${T('phi', 340, 134, 'text-anchor="middle" font-size="19" font-weight="700"')}${T('st', 340, 160, 'text-anchor="middle" font-size="14" fill="#56637a"')}${T('K', 340, 186, 'text-anchor="middle" font-size="15" font-weight="700" fill="#13265a"')}
      ${T('I2', 500, 86, 'font-size="17" font-weight="700" fill="#1d6b3a"')}${T('V2', 678, 238, 'text-anchor="end" font-size="19" font-weight="700" fill="#13265a"')}${T('pf', 678, 262, 'text-anchor="end" font-size="15" fill="#56637a"')}
    </svg>`;
  }
  const dg = { n1: 0, n2: 0 };
  function diagramUpdate(o) {
    const q = id => root.querySelector('#smd-' + id), tx = (id, t) => { q(id).textContent = t; };
    const n1 = clamp(Math.round(st.N1 / 120), 3, 16), n2 = clamp(Math.round(n1 * st.N2 / st.N1), 1, 18);
    if (n1 !== dg.n1) { q('c1').innerHTML = coil(190, n1, 'sm-c1'); dg.n1 = n1; }
    if (n2 !== dg.n2) { q('c2').innerHTML = coil(440, n2, 'sm-c2'); dg.n2 = n2; }
    const sat = o.Br > 1.3 ? '#c62828' : o.Br > 1.1 ? '#e08a00' : '#1d5fc4';
    q('flux').setAttribute('stroke', sat); q('flux').setAttribute('stroke-width', clamp(2 + 5 * o.Br, 1.5, 13).toFixed(1));
    q('w1').setAttribute('stroke-width', clamp(1.5 + 4 * o.I1 / o.I1r, 1.5, 8).toFixed(1)); q('w2').setAttribute('stroke-width', clamp(1.5 + 4 * o.I2 / o.I2r, 1.5, 8).toFixed(1));
    root.querySelector('.sm-svg').style.setProperty('--fd', `${(1.6 * 50 / st.f).toFixed(2)}s`);
    q('phi').setAttribute('fill', sat);
    const b = base, ar = (k, v, w) => b ? (dirOf(w, v) > 0 ? ' ↑' : dirOf(w, v) < 0 ? ' ↓' : '') : '';
    tx('V1', `V₁ = ${sig(st.V1)} V${b ? ar(0, st.V1, b.V1in) : ''}`); tx('f', `f = ${sig(st.f)} Hz${b ? ar(0, st.f, b.fin) : ''}`);
    tx('I1', `I₁ = ${sig(o.I1)} A${b ? ar(0, o.I1, b.I1) : ''}`); tx('I2', `I₂ = ${sig(o.I2)} A${b ? ar(0, o.I2, b.I2) : ''}`);
    tx('N1', `N₁ = ${sig(st.N1)}`); tx('N2', `N₂ = ${sig(st.N2)}`); tx('phi', `Φm = ${sig(o.phi * 1000)} mWb${b ? ar(0, o.phi, b.phi) : ''}`);
    tx('st', o.Br > 1.1 ? '⚠ near saturation' : 'alternating flux');
    tx('K', `K = ${sig(o.K)} · ${o.K > 1 ? 'step-up' : o.K < 1 ? 'step-down' : '1 : 1'}`);
    tx('V2', `V₂ = ${sig(o.V2)} V${b ? ar(0, o.V2, b.V2) : ''}`); tx('pf', `cos φ = ${st.pt === 'unity' ? '1' : sig(st.pf, 2) + ' ' + st.pt}`); tx('lt', st.pt === 'unity' ? 'R' : st.pt === 'lag' ? 'R–L' : 'R–C');
  }

  /* ================= modules ================= */
  const live = (f, n) => `<div class="sm-lf"><span class="fx">${f}</span><span class="sm-eq">${n}</span></div>`;
  const EXPS = {
    m1: [['f', true, 'Raise f by 10 %'], ['f', false, 'Lower f by 10 % (same V)'], ['fvf', false, 'Lower f by 10 % with V/f fixed'], ['V1', true, 'Raise V₁ by 10 %'], ['N1', true, 'Add 10 % primary turns']],
    m2: [['N2', true, 'Add 10 % secondary turns'], ['N1', true, 'Add 10 % primary turns'], ['f', true, 'Raise f by 10 %']],
    m3: [['load', true, 'Increase the load 10 %'], ['N2', true, 'Add 10 % secondary turns'], ['V1', true, 'Raise V₁ by 10 %']],
    m4: [['N2', true, 'Add 10 % secondary turns'], ['R', true, 'Raise R₁, R₂ by 10 %'], ['X', true, 'Raise X₁, X₂ by 10 %']],
    m5: [['load', true, 'Increase the load 10 %'], ['f', true, 'Raise f by 10 % (same V)'], ['fvf', true, 'Raise f by 10 % with V/f fixed'], ['V1', true, 'Raise V₁ by 10 %'], ['pf', false, 'Lower cos φ by 10 %']],
    m6: [['V1', true, 'Raise V₁ by 10 % (OC reading)'], ['R', true, 'Raise R by 10 % (SC reading)']],
    m7: [['pf', false, 'Lower cos φ by 10 %'], ['X', true, 'Raise X by 10 %'], ['load', true, 'Increase the load 10 %']],
    m8: [['pf', false, 'Lower cos φ by 10 %'], ['load', true, 'Increase the load 10 %'], ['X', true, 'Raise X by 10 %']],
    m9: [['V1', true, 'Raise V₁ by 10 %'], ['f', false, 'Lower f by 10 % (same V)'], ['fvf', false, 'Lower f by 10 % with V/f fixed']],
  };
  const expBtns = m => `<div class="sm-exps"><b>Experiments</b>${EXPS[m].map(([p, u, l], i) => `<button class="btn" data-exp="${m}.${i}">${l}</button>`).join('')}</div><div class="sm-expres"></div>`;
  function modBody(m, o) {
    const s = st, P = v => sig(v), lagS = s.pt === 'lead' ? '−' : '+';
    if (m === 'm1') return `<div class="sm-live">${live('E₁ = 4.44 f N₁ Φm', `4.44 × ${P(s.f)} × ${P(s.N1)} × ${P(o.phi * 1000)} mWb = ${P(4.44 * s.f * s.N1 * o.phi)} V`)}
      ${live('Φm = V₁ / (4.44 f N₁)', `${P(s.V1)} / (4.44 × ${P(s.f)} × ${P(s.N1)}) = ${P(o.phi * 1000)} mWb`)}
      ${live('E₁ / E₂ = N₁ / N₂', `${P(s.V1)} / ${P(o.E2)} = ${P(s.N1)} / ${P(s.N2)} = ${P(s.N1 / s.N2)}`)}
      ${live('V / f', `${P(s.V1 / s.f)} V/Hz (rated ${P(DES.V / DES.f)} V/Hz) → flux is ${P(o.Br * 100)} % of rated`)}
      ${live('Volts per turn = 4.44 f Φm', `${P(4.44 * s.f * o.phi)} V per turn on both windings`)}</div>
      <ul class="sm-ul"><li><b class="up">V ↑</b> → Φm ↑ in proportion (f, N fixed).</li><li><b class="dn">f ↑</b> → Φm ↓ ∝ 1/f (V, N fixed). <b>f ↓ at the same V is dangerous:</b> flux rises, the core saturates, magnetising current and core loss shoot up.</li><li><b>N₁ ↑</b> → Φm ↓ ∝ 1/N₁. <b>N₂</b> does not change Φm.</li><li><b>V/f constant</b> → Φm constant (e.g. 40 Hz at 80 % voltage).</li><li>The load does not set the flux: V₁, f and N₁ do.</li></ul>`;
    if (m === 'm2') return `<div class="sm-live">${live('K = N₂ / N₁', `${P(s.N2)} / ${P(s.N1)} = ${P(o.K)} → ${o.K > 1 ? 'step-up' : o.K < 1 ? 'step-down' : 'isolation (1 : 1)'}`)}
      ${live('V₂ = V₁ N₂ / N₁ (no load, ideal)', `${P(s.V1)} × ${P(s.N2)} / ${P(s.N1)} = ${P(o.E2)} V`)}
      ${live('V₂ on load', `${P(o.V2)} V — drops by the I₂(R₀₂ cos φ ${lagS} X₀₂ sin φ) term`)}
      ${live('Regulation = (E₂ − V₂) / E₂', `(${P(o.E2)} − ${P(o.V2)}) / ${P(o.E2)} = ${P(o.reg)} %`)}</div>
      <ul class="sm-ul"><li>Same flux links both windings → same volts per turn → V ∝ N.</li><li><b class="up">N₂ ↑</b> → V₂ ↑ ∝ N₂; <b class="dn">N₁ ↑</b> → V₂ ↓ ∝ 1/N₁.</li><li>Frequency is the same on both sides and is not in the ratio.</li><li>On load, V₂ falls (lagging/unity pf) or can rise (leading pf) — that is regulation.</li></ul>`;
    if (m === 'm3') return `<div class="sm-live">${live('I₁ / I₂ = N₂ / N₁ (ideal)', `I₁ = ${P(o.K)} × ${P(o.I2)} = ${P(o.I1id)} A`)}
      ${live('I₁ with the no-load current', `|K I₂ + I₀| = ${P(o.I1)} A (I₀ = ${P(o.I0)} A = ${P(o.I0 / o.I1r * 100)} % of rated I₁)`)}
      ${live('mmf balance N₁ I₁ ≈ N₂ I₂', `${P(s.N1 * o.I1id)} AT = ${P(s.N2 * o.I2)} AT`)}
      ${live('Power in ≈ power out (ideal)', `V₁ I₁ = ${P(s.V1 * o.I1id / 1000)} kVA, E₂ I₂ = ${P(o.E2 * o.I2 / 1000)} kVA`)}
      ${live('Rated currents', `I₁ = ${P(o.I1r)} A, I₂ = ${P(o.I2r)} A at ${P(s.S)} kVA`)}</div>
      <ul class="sm-ul"><li>The HV side has more turns, more volts and <b>fewer amps</b>.</li><li><b class="up">Load ↑</b> → I₂ ↑ → I₁ ↑ (mmf balance). At no load I₁ = I₀ only.</li><li>Turns change with the <b>same load power</b>: I₂ ∝ 1/N₂ and I₁ stays the same. With the <b>same load impedance</b>: I₂ ∝ N₂ and I₁ ∝ N₂². Pick the load type below.</li></ul>`;
    if (m === 'm4') return `<div class="sm-live">${live('R₀₁ = R₁ + R₂ (N₁/N₂)²', `${P(s.R1)} + ${P(s.R2)} × ${P((s.N1 / s.N2) ** 2)} = ${P(o.R01)} Ω`)}
      ${live('X₀₁ = X₁ + X₂ (N₁/N₂)²', `${P(s.X1)} + ${P(s.X2)} × ${P((s.N1 / s.N2) ** 2)} = ${P(o.X01)} Ω`)}
      ${live('Z₀₁ = √(R₀₁² + X₀₁²)', `${P(o.Z01)} Ω`)}
      ${live('R₀₂ = R₂ + R₁ (N₂/N₁)²', `${P(o.R02)} Ω; X₀₂ = ${P(o.X02)} Ω; Z₀₂ = ${P(o.Z02)} Ω`)}
      ${live('Load seen from the primary Z′ = Z_L (N₁/N₂)²', Number.isFinite(o.ZLp) ? `${P(o.ZLp)} Ω` : '–')}
      ${live('Copper loss = I₂² R₀₂ = I₁² R₀₁', `${P(o.Pcu)} W`)}</div>
      <ul class="sm-ul"><li>Referring keeps I²R the same: R₂′ = R₂ (I₂/I₁)² = R₂ (N₁/N₂)².</li><li>Going to the side with <b>more turns</b> → multiply by (turns ratio)²; to fewer turns → divide.</li><li>Impedance matching: a load looks (N₁/N₂)² times bigger from the primary.</li></ul>`;
    if (m === 'm5') {
      const H = s.hrs, cyc = [[1, H[0]], [0.5, H[1]], [0, H[2]]], outE = cyc.reduce((n, [x, h]) => { const I = x * o.I2r; return n + o.V2at(I) * I * o.cs * h; }, 0), cuE = cyc.reduce((n, [x, h]) => n + (x * o.I2r) ** 2 * o.R02 * h, 0), tot = H[0] + H[1] + H[2], ad = outE / (outE + o.Pi * tot + cuE) * 100;
      return `<div class="sm-live">${live('Core loss Pi = Ph + Pe', `${P(o.Ph)} + ${P(o.Pe)} = ${P(o.Pi)} W (constant with load)`)}
      ${live('Copper loss = x² Pcu,FL', `${P(o.x)}² × ${P(o.PcuFL)} = ${P(o.Pcu)} W`)}
      ${live('η = P / (P + Pi + Pcu)', `${P(o.Pout)} / (${P(o.Pout)} + ${P(o.Pi)} + ${P(o.Pcu)}) = ${P(o.eta)} %`)}
      ${live('Max η when Pcu = Pi → x = √(Pi / Pcu,FL)', `√(${P(o.Pi)} / ${P(o.PcuFL)}) = ${P(o.xm)} → ${P(o.xm * 100)} % load, η max = ${P(o.etam)} %`)}
      ${live('All-day η = output kWh / input kWh (24 h)', `${P(ad)} % <small>for the day below, at the simulator's cos φ</small>`)}</div>
      <div class="sm-hrs"><b>Day</b><label>Full load <input type="number" min="0" max="24" step="1" data-h="0" value="${H[0]}"> h</label><label>Half load <input type="number" min="0" max="24" step="1" data-h="1" value="${H[1]}"> h</label><label>No load <input type="number" min="0" max="24" step="1" data-h="2" value="${H[2]}"> h</label>${tot !== 24 ? `<small class="dn">Hours add up to ${tot}, not 24</small>` : ''}</div>
      <ul class="sm-ul"><li>Core loss runs all day; copper loss only with load (∝ I²).</li><li>η rises with load until copper loss = core loss, then falls.</li><li>At the same kVA, lower cos φ → less output for the same losses → lower η.</li><li>At fixed V, <b>f ↑</b> → hysteresis ↓ (∝ f^−0.6), eddy unchanged. With V/f fixed, hysteresis ∝ f and eddy ∝ f².</li></ul>`;
    }
    if (m === 'm6') {
      const lvP = o.K < 1, V0 = lvP ? o.E2 : s.V1, I0lv = lvP ? o.I0 / o.K : o.I0, W0 = o.Pi, c0 = W0 / (V0 * I0lv), s0 = Math.sqrt(Math.max(0, 1 - c0 * c0));
      const Isc = lvP ? o.I1r : o.I2r, Zeq = lvP ? o.Z01 : o.Z02, Req = lvP ? o.R01 : o.R02, Vsc = Isc * Zeq, Wsc = Isc * Isc * Req, Vr = lvP ? s.V1 : o.E2;
      return `<div class="sm-tests"><div class="box"><h4>Open-circuit test — LV side, HV open, rated voltage</h4><table class="sm-t"><tr><td>Readings</td><td>V₀ = ${P(V0)} V · I₀ = ${P(I0lv)} A · W₀ = ${P(W0)} W</td></tr>
        <tr><td>Core loss</td><td>Pi = W₀ = ${P(W0)} W</td></tr><tr><td>cos φ₀ = W₀ / (V₀ I₀)</td><td>${P(c0)}</td></tr><tr><td>Iw = I₀ cos φ₀ · Iμ = I₀ sin φ₀</td><td>${P(I0lv * c0)} A · ${P(I0lv * s0)} A</td></tr>
        <tr><td>R₀ = V₀ / Iw · X₀ = V₀ / Iμ</td><td>${P(V0 / (I0lv * c0))} Ω · ${P(V0 / (I0lv * s0))} Ω (LV side)</td></tr></table></div>
        <div class="box"><h4>Short-circuit test — HV side, LV shorted, rated current</h4><table class="sm-t"><tr><td>Readings</td><td>V_sc = ${P(Vsc)} V · I_sc = ${P(Isc)} A · W_sc = ${P(Wsc)} W</td></tr>
        <tr><td>Full-load Cu loss</td><td>W_sc = ${P(Wsc)} W</td></tr><tr><td>R_eq = W_sc / I_sc²</td><td>${P(Req)} Ω</td></tr><tr><td>Z_eq = V_sc / I_sc</td><td>${P(Zeq)} Ω</td></tr>
        <tr><td>X_eq = √(Z_eq² − R_eq²)</td><td>${P(Math.sqrt(Math.max(0, Zeq * Zeq - Req * Req)))} Ω</td></tr><tr><td>cos φ_sc = W_sc / (V_sc I_sc)</td><td>${P(Wsc / (Vsc * Isc))}</td></tr><tr><td>% impedance = V_sc / V_rated</td><td>${P(Vsc / Vr * 100)} %</td></tr></table></div></div>
        <ul class="sm-ul"><li><b>OC test</b> → core loss and the shunt branch (R₀, X₀). Copper loss is negligible because I₀ is tiny.</li><li><b>SC test</b> → full-load copper loss and R_eq, X_eq. Core loss is negligible because only 5–10 % voltage is applied.</li><li>Quick solving: W₀ → Pi; W_sc → Pcu,FL; then η = xS cos φ / (xS cos φ + Pi + x² Pcu,FL). Copper loss at any other current = W_sc × (I / I_sc)².</li></ul>`;
    }
    if (m === 'm7') {
      const zeroA = Math.atan(o.R02 / o.X02) * 180 / Math.PI, maxA = Math.atan(o.X02 / o.R02) * 180 / Math.PI;
      return `<div class="sm-live">${live(`Reg ≈ I₂(R₀₂ cos φ ${lagS} X₀₂ sin φ) / E₂ (book formula)`, `${P(o.regA)} %`)}${live('Exact: (E₂ − V₂) / E₂', `${P(o.reg)} %`)}
      ${live('Zero regulation: leading, tan φ = R / X', `φ = ${P(zeroA)}° lead, cos φ = ${P(Math.cos(zeroA * Math.PI / 180))}`)}
      ${live('Maximum regulation: lagging, tan φ = X / R', `φ = ${P(maxA)}° lag, cos φ = R/Z = ${P(o.R02 / o.Z02)}`)}</div>
      <ul class="sm-ul"><li><b>Lagging</b> pf: both terms add → positive regulation (V₂ falls on load).</li><li><b>Unity</b> pf: only the I R term → small positive regulation.</li><li><b>Leading</b> pf: the X term subtracts → regulation can be zero or <b>negative</b> (V₂ rises on load).</li><li>More R or more X → more regulation at lagging pf.</li></ul>`;
    }
    return '';
  }
  const MODG = { m1: ['Vphi', 'fphi', 'Nphi'], m2: ['N2V', 'N1V'], m3: ['N2I', 'LI'], m4: ['N2Z', 'Lcu'], m5: ['Leta', 'Lcu', 'fcore', 'fcorevf', 'Vcore'], m6: ['VI0'], m7: ['pfreg', 'Lreg'], m8: [], m9: ['BH', 'VI0'], m10: [], m11: [], m12: [] };
  const MODT = { m1: 'EMF equation & flux', m2: 'Voltage & turns ratio', m3: 'Current relationships', m4: 'Impedance relationships', m5: 'Losses & efficiency', m6: 'Open- & short-circuit tests', m7: 'Voltage regulation',
    m8: 'Phasor diagram & equivalent circuit', m9: 'Saturation, inrush & harmonics', m10: 'Three-phase & vector groups', m11: 'Autotransformer', m12: 'Parallel operation' };

  /* ================= modules 8–12: phasors, saturation, three-phase, autotransformer, parallel ================= */
  const P3 = { S: 100, VL1: 11000, VL2: 433, hv: 'D', lv: 'y', clock: 11, open: false, par: 'Dy11' };
  const AU = { S: 50, VH: 2400, VL: 240, ser: 'L', pf: 1, Pi: 0.5, Pc: 1 };
  const PA = { S1: 500, S2: 250, mode: 'pc', R1: 1, X1: 5, R2: 1, X2: 5, S: 600, pf: 0.8, dE: 0 };
  const IR = { a: 0, r: 0 };   // inrush: voltage angle at switch-on (deg), residual flux (× rated)
  let MAG = 10;
  const D2R = Math.PI / 180, r3 = Math.sqrt(3);
  const num = (x, v, step, w) => `<input type="number" data-x="${x}" value="${v}" step="${step}" style="width:${w || 86}px">`;
  const segX = (x, cur, opts) => `<div class="seg">${opts.map(([v, t]) => `<button data-x="${x}" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${t}</button>`).join('')}</div>`;
  const kv = rows => `<div class="sm-kv">${rows.map(([l, v]) => `<div><span>${l}</span><b>${v}</b></div>`).join('')}</div>`;
  const rowsFrom = list => list.map(([p, q]) => D.qrows.find(r => r.p === p && r.q === q)).filter(Boolean);
  const qList = (title, rows) => rows.length ? `<div class="sm-pq"><b>${title}</b>${rows.map(r => `<div class="sm-pqr"><span class="ex ex-${r.g}">${esc(r.p)}</span> <b>Q${esc(r.q)}</b> · ${r.c}<div class="fx">${r.f.join('<br>')}</div><button class="btn sm-qa" data-a="${esc(r.a)}">Show answer</button></div>`).join('')}</div>` : '';
  const pyqBlock = chs => qList(`Asked in past papers (from your book — ${pyqList(chs).length}):`, pyqList(chs));
  const GROUPS = ['Yy0', 'Dd0', 'Dz0', 'Yy6', 'Dd6', 'Dz6', 'Yd1', 'Dy1', 'Yz1', 'Yd11', 'Dy11', 'Yz11', 'Dd10'];
  const odd3 = () => (P3.hv === 'Y' && P3.lv !== 'y') || (P3.hv === 'D' && P3.lv === 'y');
  const fixClock = () => { if (odd3() && P3.clock % 2 === 0) P3.clock = P3.hv === 'D' ? 11 : 1; if (!odd3() && P3.clock % 2) P3.clock = 0; };
  const AUP = ((D.keycards.find(k => k.no === '49') || { tables: [{ rows: [] }] }).tables[0].rows).map(r => {
    const m = r[0].match(/(\d+) kVA, (\d+)\/(\d+) V/); if (!m) return null;
    const S = +m[1], VH = +m[2], VL = +m[3], Vs = parseFloat(r[1]);
    return { S, VH, VL, ser: Vs === VL ? 'L' : 'H', kva: r[3], k: r[4], label: `${r[0]}, ${r[1]} in series` };
  }).filter(Boolean);
  function modCtl(m) {
    if (m === 'm8') return `<div class="sm-lc"><b>Draw the drops and I₀</b>${segX('mag', MAG, [[1, 'true size'], [5, '× 5'], [10, '× 10'], [20, '× 20']])}<small class="sm-note">The IR and IX drops and I₀ are only a few per cent of V and I — magnify them to see the triangle. Change the load and pf with the simulator controls above.</small></div>`;
    if (m === 'm9') return `<div class="sm-lc"><label>Switch-on point on the voltage wave α <input type="range" data-x="ir.a" min="0" max="90" step="1" value="${IR.a}"><output>${IR.a}°</output></label><label>Residual flux <input type="range" data-x="ir.r" min="-0.8" max="0.8" step="0.05" value="${IR.r}"><output>${Math.round(IR.r * 100)} %</output></label></div>`;
    if (m === 'm10') return `<div class="sm-lc"><label>Rating (kVA) ${num('p3.S', P3.S, 1)}</label><label>HV line voltage ${num('p3.VL1', P3.VL1, 1, 96)}</label><label>LV line voltage ${num('p3.VL2', P3.VL2, 1)}</label></div>
      <div class="sm-lc"><b>HV</b>${segX('p3.hv', P3.hv, [['Y', 'Star (Y)'], ['D', 'Delta (D)']])}<b>LV</b>${segX('p3.lv', P3.lv, [['y', 'star y'], ['d', 'delta d'], ['z', 'zig-zag z']])}
      <label>Clock number <select data-x="p3.clock">${(odd3() ? [1, 3, 5, 7, 9, 11] : [0, 2, 4, 6, 8, 10]).map(c => `<option value="${c}" ${c === P3.clock ? 'selected' : ''}>${c} (LV lags ${c * 30}°)</option>`).join('')}</select></label>
      ${P3.hv === 'D' && P3.lv === 'd' ? `<label><input type="checkbox" data-x="p3.open" ${P3.open ? 'checked' : ''}> Open delta (V–V): one of three units removed</label>` : ''}
      <label>Parallel with <select data-x="p3.par">${GROUPS.map(g => `<option ${g === P3.par ? 'selected' : ''}>${g}</option>`).join('')}</select></label></div>`;
    if (m === 'm11') return `<div class="sm-lc"><label>Two-winding rating (kVA) ${num('au.S', AU.S, 1)}</label><label>HV winding (V) ${num('au.VH', AU.VH, 1)}</label><label>LV winding (V) ${num('au.VL', AU.VL, 1)}</label><b>Winding in series</b>${segX('au.ser', AU.ser, [['L', 'LV winding'], ['H', 'HV winding']])}</div>
      <div class="sm-lc"><label>Load pf ${num('au.pf', AU.pf, 0.01, 70)}</label><label>Core loss (kW) ${num('au.Pi', AU.Pi, 0.1, 70)}</label><label>Full-load Cu loss (kW) ${num('au.Pc', AU.Pc, 0.1, 70)}</label><small class="sm-note">Losses are example values to compare efficiency — put in your question's numbers.</small></div>
      <div class="sm-lc"><b>Your book's table (key card 49)</b>${AUP.map((q, i) => `<button class="btn" data-preset="au.${i}">${esc(q.label)}</button>`).join('')}</div>`;
    if (m === 'm12') return `<div class="sm-lc"><label>T₁ rating (kVA) ${num('pa.S1', PA.S1, 1)}</label><label>T₂ rating (kVA) ${num('pa.S2', PA.S2, 1)}</label><b>Impedances as</b>${segX('pa.mode', PA.mode, [['pc', '% on own rating'], ['ohm', 'ohms, same side']])}</div>
      <div class="sm-lc"><label>Z₁ = R ${num('pa.R1', PA.R1, 0.1, 70)}</label><label>+ jX ${num('pa.X1', PA.X1, 0.1, 70)}</label><label>Z₂ = R ${num('pa.R2', PA.R2, 0.1, 70)}</label><label>+ jX ${num('pa.X2', PA.X2, 0.1, 70)}</label><small class="sm-note">${PA.mode === 'pc' ? '% values on each transformer\'s own rating' : 'ohms referred to the same side'}</small></div>
      <div class="sm-lc"><label>Total load (kVA) ${num('pa.S', PA.S, 1)}</label><label>Load pf (lagging) ${num('pa.pf', PA.pf, 0.01, 70)}</label>${PA.mode === 'pc' ? `<label>No-load voltage difference ${num('pa.dE', PA.dE, 0.1, 70)} %</label>` : ''}<button class="btn" data-preset="pa.gate">GATE 2015 Set 1 Q61 numbers (from your book)</button></div>`;
    return '';
  }
  function setX(path, v, el) {
    if (path === 'mag') { MAG = +v; renderPanel(solve(st), false); return; }
    const [o, k] = path.split('.'), obj = { p3: P3, au: AU, pa: PA, ir: IR }[o];
    obj[k] = typeof obj[k] === 'number' ? (Number.isFinite(+v) ? +v : 0) : typeof obj[k] === 'boolean' ? !!v : v;
    if (el && el.type === 'range' && el.nextElementSibling) el.nextElementSibling.textContent = k === 'a' ? `${v}°` : `${Math.round(v * 100)} %`;
    if (o === 'p3' && (k === 'hv' || k === 'lv')) { fixClock(); if (!(P3.hv === 'D' && P3.lv === 'd')) P3.open = false; }
    renderPanel(solve(st), !(el && (el.tagName === 'BUTTON' || (o === 'p3' && ['hv', 'lv', 'open'].includes(k)))));
  }

  // --- phasor diagram (equivalent-circuit view, referred to the primary) ---
  const ARC = (r, a1, a2, col) => { const p = a => [r * Math.cos(a), -r * Math.sin(a)], [x1, y1] = p(a1), [x2, y2] = p(a2), sw = a2 > a1 ? 0 : 1; return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 ${sw} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${col}" stroke-width="1.4"/>`; };
  function phasorSvg(o) {
    const p = o.ph;
    if (!Number.isFinite(o.V2) || !p || !Number.isFinite(p.V2p)) return '<p class="sm-bad">The load is too large for this transformer — reduce it to draw the phasors.</p>';
    const M = MAG, U = 300 / st.V1, Kc = 160 / Math.max(p.I2p, o.I1, 1e-6), a2 = Math.atan2(-o.sn, o.cs);
    const A = [p.V2p * U, 0], ir = p.I2p * o.R01 * U * M, ix = p.I2p * o.X01 * U * M;
    const B = [A[0] + ir * Math.cos(a2), A[1] + ir * Math.sin(a2)], C = [B[0] + ix * Math.cos(a2 + Math.PI / 2), B[1] + ix * Math.sin(a2 + Math.PI / 2)];
    const dlD = Math.atan2(C[1], C[0]);   // V₁ as drawn (drops magnified)
    const I2v = [p.I2p * o.cs * Kc, -p.I2p * o.sn * Kc];
    const I0v = [(o.Iw * Math.cos(dlD) + o.Imu * Math.sin(dlD)) * Kc * M, (o.Iw * Math.sin(dlD) - o.Imu * Math.cos(dlD)) * Kc * M];
    const I1v = [I2v[0] + I0v[0], I2v[1] + I0v[1]], Fv = [Math.sin(dlD) * 110, -Math.cos(dlD) * 110];
    const pts = [[0, 0], A, B, C, I2v, I0v, I1v, Fv], xs = pts.map(q => q[0]), ys = pts.map(q => -q[1]);
    const x0 = Math.min(...xs) - 70, y0 = Math.min(...ys) - 40, w = Math.max(...xs) - x0 + 90, h = Math.max(...ys) - y0 + 40;
    const S = q => `${q[0].toFixed(1)} ${(-q[1]).toFixed(1)}`;
    // label at the tip, or at the middle of the arrow (mid = true), nudged by dx, dy
    const ar = (f, t, col, lab, dash, dx = 6, dy = 5, mid = false) => { const L = mid ? [(f[0] + t[0]) / 2, (f[1] + t[1]) / 2] : t;
      return `<line x1="${f[0].toFixed(1)}" y1="${(-f[1]).toFixed(1)}" x2="${t[0].toFixed(1)}" y2="${(-t[1]).toFixed(1)}" stroke="${col}" stroke-width="2.6" marker-end="url(#ah-${col.slice(1)})"${dash ? ' stroke-dasharray="6 5"' : ''}/>` + (lab ? `<text x="${(L[0] + dx).toFixed(1)}" y="${(-L[1] + dy).toFixed(1)}" font-size="15" font-weight="700" fill="${col}">${lab}</text>` : ''); };
    const cols = ['#13265a', '#e08a00', '#7b4fd6', '#1b7a3a', '#c62828', '#8a94a6'];
    const a1d = Math.atan2(I1v[1], I1v[0]);
    return `<svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" role="img" aria-label="Phasor diagram of the loaded transformer">
      <defs>${cols.map(c => `<marker id="ah-${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>
      ${ARC(46, 0, a2, '#1b7a3a')}<text x="${(54 * Math.cos(a2 / 2)).toFixed(1)}" y="${(-54 * Math.sin(a2 / 2) + 5).toFixed(1)}" font-size="13" fill="#1b7a3a">φ</text>
      ${ARC(72, a1d, dlD, '#c62828')}<text x="${(80 * Math.cos((a1d + dlD) / 2)).toFixed(1)}" y="${(-80 * Math.sin((a1d + dlD) / 2) + 5).toFixed(1)}" font-size="13" fill="#c62828">φ₁</text>
      ${ar([0, 0], A, '#13265a', 'V₂′', false, -10, 20, true)}${ar(A, B, '#e08a00', 'I₂′R', false, 8, 16, true)}${ar(B, C, '#7b4fd6', 'I₂′X', false, 10, 6, true)}${ar([0, 0], C, '#13265a', 'V₁', false, -10, -10, true)}
      ${ar([0, 0], Fv, '#8a94a6', 'Φm', true, 6, 14)}${ar([0, 0], I2v, '#1b7a3a', 'I₂′', false, -34, 6)}${ar([0, 0], I0v, '#8a94a6', 'I₀', false, 6, -4)}${ar([0, 0], I1v, '#c62828', 'I₁', false, 8, 14)}
      <circle cx="0" cy="0" r="3" fill="#13265a"/></svg>`;
  }
  function circuitSvg(o) {
    const zz = (x1, y, x2) => { let d = `M${x1} ${y}`; const n = 6, w = (x2 - x1) / n; for (let i = 0; i < n; i++) d += ` L${x1 + w * (i + 0.5)} ${y + (i % 2 ? 8 : -8)}`; return d + ` L${x2} ${y}`; };
    const zv = (x, y1, y2) => { let d = `M${x} ${y1}`; const n = 6, h = (y2 - y1) / n; for (let i = 0; i < n; i++) d += ` L${x + (i % 2 ? 8 : -8)} ${y1 + h * (i + 0.5)}`; return d + ` L${x} ${y2}`; };
    const coilH = (x1, y, x2) => { let d = `M${x1} ${y}`; const n = 4, w = (x2 - x1) / n; for (let i = 0; i < n; i++) d += ` a${w / 2} ${w / 2} 0 0 1 ${w} 0`; return d; };
    const coilV = (x, y1, y2) => { let d = `M${x} ${y1}`; const n = 4, h = (y2 - y1) / n; for (let i = 0; i < n; i++) d += ` a${h / 2} ${h / 2} 0 0 1 0 ${h}`; return d; };
    const R0 = st.V1 / o.Iw, X0 = st.V1 / o.Imu, ZLp = o.ZLp, T = (x, y, t, a = 'middle', c = '#13265a', fs = 13) => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="${fs}" font-weight="700" fill="${c}">${t}</text>`;
    return `<svg viewBox="0 0 700 240" role="img" aria-label="Approximate equivalent circuit referred to the primary"><g fill="none" stroke="#13265a" stroke-width="2">
      <path d="M40 50 H130 M130 50 H230 M230 50 H300"/><path d="${zz(300, 50, 370)}"/><path d="M370 50 H400"/><path d="${coilH(400, 50, 470)}"/><path d="M470 50 H600 V82"/><rect x="586" y="82" width="28" height="76" rx="4"/><path d="M600 158 V190 H40"/>
      <path d="M130 50 V80"/><path d="${zv(130, 80, 160)}"/><path d="M130 160 V190"/><path d="M230 50 V80"/><path d="${coilV(230, 80, 160)}"/><path d="M230 160 V190"/></g>
      <circle cx="40" cy="50" r="5" fill="#fff" stroke="#13265a" stroke-width="2"/><circle cx="40" cy="190" r="5" fill="#fff" stroke="#13265a" stroke-width="2"/>
      ${T(18, 125, 'V₁', 'middle')}${T(18, 143, `${sig(st.V1)} V`, 'middle', '#56637a', 11)}
      ${T(85, 40, `I₁ = ${sig(o.I1)} A →`, 'middle', '#c62828', 12)}${T(180, 40, `I₀ = ${sig(o.I0)} A ↓`, 'middle', '#8a94a6', 12)}
      ${T(118, 125, 'R₀', 'end')}${T(118, 141, `${sig(R0)} Ω`, 'end', '#56637a', 11)}${T(150, 175, `Iw ${sig(o.Iw)} A`, 'start', '#8a94a6', 11)}
      ${T(250, 125, 'X₀', 'start')}${T(250, 141, `${sig(X0)} Ω`, 'start', '#56637a', 11)}${T(250, 175, `Iμ ${sig(o.Imu)} A`, 'start', '#8a94a6', 11)}
      ${T(335, 30, `R₀₁ = ${sig(o.R01)} Ω`)}${T(435, 30, `X₀₁ = ${sig(o.X01)} Ω`)}${T(530, 40, `I₂′ = ${sig(o.ph.I2p)} A →`, 'middle', '#1b7a3a', 12)}
      ${T(622, 112, 'Z_L′', 'start')}${T(622, 128, Number.isFinite(ZLp) ? `${sig(ZLp)} Ω` : '–', 'start', '#56637a', 11)}${T(622, 146, `V₂′ = ${sig(o.ph.V2p)} V`, 'start', '#56637a', 11)}
      ${T(350, 225, 'Approximate equivalent circuit referred to the primary — the shunt branch R₀ ∥ X₀ is moved to the input', 'middle', '#56637a', 11)}</svg>`;
  }

  // --- magnetising-current harmonics and inrush (from the saturation curve) ---
  function harm(Br) {
    const N = 360, i = []; for (let k = 0; k < N; k++) i.push(sat(Br * Math.sin(2 * Math.PI * k / N)));
    const b = n => 2 / N * i.reduce((acc, v, k) => acc + v * Math.sin(n * 2 * Math.PI * k / N), 0);
    return { i, b1: b(1), b3: b(3), b5: b(5) };
  }
  const inrushFlux = (Br, th) => Br * (Math.cos(IR.a * D2R) - Math.cos(th + IR.a * D2R)) + IR.r;
  function inrushH2(Br) {
    const N = 360, i = []; for (let k = 0; k < N; k++) i.push(sat(inrushFlux(Br, 2 * Math.PI * k / N)));
    const c = n => { let re = 0, im = 0; i.forEach((v, k) => { re += v * Math.cos(n * 2 * Math.PI * k / N); im -= v * Math.sin(n * 2 * Math.PI * k / N); }); return 2 / N * Math.hypot(re, im); };
    return c(2) / c(1) * 100;
  }
  function customPlot(box, o) {
    const id = box.dataset.pl;
    if (id === 'harm') {
      const H = harm(o.Br), mx = Math.max(...H.i.map(Math.abs)), xs = [], f = [], c = [], c1 = [];
      for (let d = 0; d <= 360; d += 3) { const t = d * D2R; xs.push(d); f.push(Math.sin(t)); c.push(sat(o.Br * Math.sin(t)) / mx); c1.push(H.b1 * Math.sin(t) / mx); }
      plot(box, xs, [['flux (sine)', f, '5 4'], ['magnetising current', c], ['its fundamental', c1, '2 3']], { xl: 'angle in one cycle (°)', yl: 'p.u.', lo: -1.1 });
    } else if (id === 'inrF') {
      const xs = [], f = []; for (let d = 0; d <= 1080; d += 6) { xs.push(d); f.push(inrushFlux(o.Br, d * D2R)); }
      plot(box, xs, [['core flux after switch-on', f]], { xl: 'angle from switch-on (°)', yl: '× rated Φm', lo: Math.min(0, ...f), hline: [SATK, 'knee — the core saturates above this'] });
    } else if (id === 'inrI') {
      const n0 = sat(o.Br), xs = [], i = []; for (let d = 0; d <= 1080; d += 6) { xs.push(d); i.push(sat(inrushFlux(o.Br, d * D2R)) / n0); }
      plot(box, xs, [['magnetising current', i]], { xl: 'angle from switch-on (°)', yl: '× normal peak' });
    } else if (id === 'par') {
      const Z = paZ(), f1 = cabs(cdiv(Z.Z2, cadd(Z.Z1, Z.Z2))), f2 = cabs(cdiv(Z.Z1, cadd(Z.Z1, Z.Z2))), Smax = Math.min(PA.S1 / f1, PA.S2 / f2), xs = [], l1 = [], l2 = [];
      for (let k = 0; k <= 60; k++) { const S = Smax * 1.4 * k / 60; xs.push(S); l1.push(f1 * S / PA.S1 * 100); l2.push(f2 * S / PA.S2 * 100); }
      plot(box, xs, [['T₁ loading', l1], ['T₂ loading', l2]], { xl: 'total load (kVA)', yl: '%', hline: [100, 'rated'], cur: PA.S, curVals: [f1 * PA.S / PA.S1 * 100, f2 * PA.S / PA.S2 * 100] });
    }
  }
  const plBox = (id, t, note = '') => `<figure class="sm-g sm-pl" data-pl="${id}"><figcaption>${t}</figcaption><svg role="img" aria-label="${esc(t)}"></svg><div class="sm-leg"></div>${note ? `<small class="sm-note">${note}</small>` : ''}</figure>`;

  // --- complex numbers for parallel operation ---
  const cz = (r, i) => ({ r, i }), cadd = (a, b) => cz(a.r + b.r, a.i + b.i), cmul = (a, b) => cz(a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r);
  const cdiv = (a, b) => { const d = b.r * b.r + b.i * b.i || 1e-12; return cz((a.r * b.r + a.i * b.i) / d, (a.i * b.r - a.r * b.i) / d); }, cabs = a => Math.hypot(a.r, a.i);
  const paZ = () => PA.mode === 'pc' ? { Z1: cz(PA.R1 / PA.S1, PA.X1 / PA.S1), Z2: cz(PA.R2 / PA.S2, PA.X2 / PA.S2) } : { Z1: cz(PA.R1, PA.X1), Z2: cz(PA.R2, PA.X2) };

  function clockSvg() {
    const R = 112, c = 150, P = (ang, r) => [c + r * Math.cos(ang * D2R), c - r * Math.sin(ang * D2R)];
    let h = `<svg viewBox="0 0 300 300" role="img" aria-label="Clock diagram of the vector group"><circle cx="${c}" cy="${c}" r="${R + 22}" fill="#f6f8fc" stroke="#dfe6ef"/>`;
    for (let k = 1; k <= 12; k++) { const [x, y] = P(90 - k * 30, R + 10); h += `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="${k === (P3.clock || 12) ? '#1b7a3a' : '#8a94a6'}">${k}</text>`; }
    const ph = (ang, r, col, lab) => { const [x, y] = P(ang, r), [lx, ly] = P(ang, r + 14); return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/><text x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle" font-size="14" font-weight="800" fill="${col}">${lab}</text>`; };
    ['A', 'B', 'C'].forEach((l, i) => { h += ph(90 - i * 120, R - 26, '#13265a', l); });
    ['a', 'b', 'c'].forEach((l, i) => { h += ph(90 - P3.clock * 30 - i * 120, R - 58, '#1b7a3a', l); });
    return h + `<circle cx="${c}" cy="${c}" r="4" fill="#13265a"/></svg>`;
  }

  function modExtra(m, o) {
    if (m === 'm8') {
      const lag = o.ph.phi1 >= 0, a1 = Math.abs(o.ph.phi1) / D2R;
      return `<div class="sm-ph"><div class="sm-phd">${phasorSvg(o)}</div>${kv([['V₁', `${sig(st.V1)} V`], ['V₂′ = V₂ (N₁/N₂)', `${sig(o.ph.V2p)} V`], ['I₂′ = I₂ (N₂/N₁)', `${sig(o.ph.I2p)} A`], ['I₂′R₀₁ drop', `${sig(o.ph.I2p * o.R01)} V`], ['I₂′X₀₁ drop', `${sig(o.ph.I2p * o.X01)} V`], ['I₀ (Iw, Iμ)', `${sig(o.I0)} A (${sig(o.Iw)}, ${sig(o.Imu)})`], ['I₁ = I₂′ + I₀', `${sig(o.I1)} A`], ['V₁ leads V₂′ by', `${sig(o.ph.dl / D2R, 2)}°`], ['Load pf cos φ', `${st.pt === 'unity' ? '1' : sig(st.pf, 2) + ' ' + st.pt}`], ['Input pf cos φ₁', `${sig(Math.cos(o.ph.phi1), 3)} ${lag ? 'lag' : 'lead'}`]])}</div>
        <div class="sm-ckt">${circuitSvg(o)}</div>
        <p class="sm-note">Exact (T) circuit: R₁ + jX₁ = ${sig(st.R1)} + j${sig(st.X1)} Ω, then the shunt branch R₀ ∥ jX₀, then R₂′ + jX₂′ = (R₂ + jX₂)(N₁/N₂)² = ${sig(st.R2 / o.K ** 2)} + j${sig(st.X2 / o.K ** 2)} Ω. The approximate circuit moves the shunt branch to the input so R₀₁ = R₁ + R₂′ and X₀₁ = X₁ + X₂′.</p>
        <ul class="sm-ul"><li><b>Lagging load:</b> I₂′ is below V₂′, the drop triangle points up and V₁ > V₂′ (positive regulation).</li><li><b>Leading load:</b> I₂′ is above V₂′; the IX drop tilts back and V₁ can be smaller than V₂′ (negative regulation).</li><li>I₀ = Iw (in phase with V₁, core loss) + Iμ (90° behind V₁, makes the flux Φm). It is why I₁ is not exactly I₂′.</li></ul>
        ${pyqBlock([6, 7, 18])}`;
    }
    if (m === 'm9') {
      const H = harm(o.Br), pk = o.Br * (1 + Math.cos(IR.a * D2R)) + IR.r;
      return `<div class="sm-live">${live('Flux now and the current it needs', `${sig(o.Br * 100)} % of rated flux → Iμ = ${sig(o.Imu)} A (${sig(sat(o.Br) / o.Br * 100)} % of a straight-line core)`)}
        ${live('3rd harmonic in the magnetising current (sinusoidal flux)', `${sig(Math.abs(H.b3 / H.b1) * 100)} % of the fundamental · 5th: ${sig(Math.abs(H.b5 / H.b1) * 100)} %`)}
        ${live('Inrush peak flux = Φm(1 + cos α) + Φr', `${sig(o.Br, 3)} × (1 + cos ${IR.a}°) + ${sig(IR.r, 2)} = ${sig(pk, 3)} × rated → ${pk > SATK ? '<b class="dn">above the knee: deep saturation, large inrush</b>' : '<b class="up">below the knee: little inrush</b>'}`)}
        ${live('2nd harmonic in the first-cycle inrush current', `${sig(inrushH2(o.Br))} % of the fundamental`)}
        ${live('Hum (magnetostriction) at 2f', `${sig(2 * st.f)} Hz`)}</div>
        <div class="sm-gs">${plBox('harm', 'Magnetising current for a sinusoidal flux', 'The peaky current is what saturation does; its 3rd harmonic must have a path.')}${plBox('inrF', 'Core flux after switch-on', 'Switching at voltage zero (α = 0°) doubles the flux swing; residual flux adds to it.')}${plBox('inrI', 'Inrush current after switch-on', 'One-sided peaks rich in 2nd harmonic. A real inrush dies out over several cycles as the dc offset decays — this model keeps it to show the shape.')}</div>
        <ul class="sm-ul"><li><b>Saturation:</b> above the knee a little more flux needs much more current. That is why 40 Hz at full voltage (or overvoltage) is dangerous.</li>
        <li><b>3rd harmonics in three-phase banks:</b> they are in phase in all three phases, so they need a path — an earthed neutral or a delta winding. In Y–y without either, the flux carries a 3rd harmonic and the phase voltages become peaky. Your book: tertiary winding = “Third winding (usually delta) on star-star transformers; typical rating about one-third of the main rating”.</li>
        <li><b>Inrush and protection:</b> your book (Vol 3 p 759, Code 400 · Protection additions): transformer protection uses “Differential (with harmonic restraint for inrush), Buchholz, REF, overfluxing (V/f)…” — “2nd-harmonic restraint prevents tripping on magnetising inrush.”</li>
        <li><b>Hum:</b> your book: “Core laminations change length with flux (magnetostriction) · twice per cycle → hum at 2f (100 Hz on 50 Hz)”.</li></ul>
        ${qList('Past questions on triplen harmonics and connections (from your book):', rowsFrom([['GATE 2009', '51'], ['GATE 2009', '52'], ['TNPSC Code 400 · April 2026', '182'], ['TNPSC Code 400 · September 2025', '183']]))}${pyqBlock([25, 15, 16])}`;
    }
    if (m === 'm10') {
      const P = P3, Vph1 = P.hv === 'Y' ? P.VL1 / r3 : P.VL1, Vln2 = P.VL2 / r3, Vw2 = P.lv === 'd' ? P.VL2 : P.lv === 'z' ? P.VL2 / 3 : Vln2;
      const IL1 = P.S * 1000 / (r3 * P.VL1), IL2 = P.S * 1000 / (r3 * P.VL2), Iph1 = P.hv === 'Y' ? IL1 : IL1 / r3, Iph2 = P.lv === 'd' ? IL2 / r3 : IL2;
      const name = P.hv + P.lv + P.clock, grp = { 0: 'Group I (0°)', 6: 'Group II (180°)', 1: 'Group III (−30°)', 11: 'Group IV (+30°)' }[P.clock] || 'not one of the four standard groups';
      const c2 = +P.par.match(/\d+$/)[0], dif = ((P.clock - c2) * 30 % 360 + 360) % 360, swap = (c2 === 1 && P.clock === 11) || (c2 === 11 && P.clock === 1), vd = 2 * Math.sin(Math.min(dif, 360 - dif) / 2 * D2R);
      const par = dif === 0 ? `<div class="sm-ok">✓ <b>${name}</b> with <b>${esc(P.par)}</b>: same phase shift — can be paralleled (with equal ratios, same polarity and phase sequence, similar per-unit impedance).</div>`
        : swap ? `<div class="sm-warn">⚡ <b>${name}</b> with <b>${esc(P.par)}</b>: groups III and IV differ by 60°. Your book: possible only with a phase-sequence swap on one side.</div>`
        : `<div class="sm-bad">✗ <b>${name}</b> with <b>${esc(P.par)}</b>: phase shifts differ by ${Math.min(dif, 360 - dif)}° → ${sig(vd * 100)} % of the phase voltage drives a circulating current through the two impedances. Do not parallel.</div>`;
      const trip = P.hv === 'Y' && P.lv === 'y' ? `<div class="sm-warn">⚡ <b>Y–y:</b> the triplen (3rd-harmonic) magnetising currents have no path unless the primary star point is earthed to the supply neutral → 3rd-harmonic flux and peaky phase voltages. Fix: a tertiary delta winding (your book, formula 22) or an earthed neutral.</div>`
        : P.lv === 'z' && P.hv === 'Y' ? `<div class="sm-ok">✓ <b>Zig-zag:</b> each phase is two half-windings on different limbs; their 3rd-harmonic voltages cancel.</div>`
        : `<div class="sm-ok">✓ A delta winding lets the triplen currents circulate, so the flux and phase voltages stay sinusoidal.</div>`;
      return `<div class="sm-ph"><div class="sm-clk">${clockSvg()}<p class="sm-note">HV (A, B, C) at 12 o'clock; LV (a, b, c) at ${P.clock || 12} o'clock → <b>${name}</b>: LV lags HV by ${P.clock * 30}°${P.clock === 11 ? ' (= leads by 30°)' : ''}. ${grp}.</p></div>
        ${kv([['HV phase voltage', `${sig(Vph1)} V (${P.hv === 'Y' ? 'V_L/√3' : '= V_L'})`], ['LV phase voltage', P.lv === 'z' ? `${sig(Vln2)} V line-to-neutral; ${sig(Vw2)} V per half-winding` : `${sig(Vw2)} V (${P.lv === 'y' ? 'V_L/√3' : '= V_L'})`], ['Line voltage ratio', sig(P.VL1 / P.VL2)], ['Turns ratio per phase N₁/N₂', `${sig(Vph1 / Vw2)}${P.lv === 'z' ? ' (per half-winding)' : ''}`],
          ['HV line current', `${sig(IL1)} A`], ['HV winding (phase) current', `${sig(Iph1)} A`], ['LV line current', `${sig(IL2)} A`], ['LV winding (phase) current', `${sig(Iph2)} A`],
          ...(P.open && P.hv === 'D' && P.lv === 'd' ? [['Open-delta (V–V) capacity', `${sig(P.S / r3)} kVA = 57.7 % of ${sig(P.S)} kVA (86.6 % of the two units)`]] : [])])}</div>
        ${par}${trip}
        <ul class="sm-ul"><li><b>Star:</b> V_L = √3 V_ph, I_L = I_ph. <b>Delta:</b> V_L = V_ph, I_L = √3 I_ph. Rating S = √3 V_L I_L on both sides.</li><li><b>Y–d and D–y</b> shift the phase by 30° (odd clock numbers); <b>Y–y and D–d</b> give 0° or 180° (even). Your book: “Y-Δ and Δ-Y → 30° phase shift; Y-Y and Δ-Δ → 0°”.</li><li>Your book's groups: I (0°) Yy0, Dd0, Dz0 · II (180°) Yy6, Dd6 · III (−30°) Yd1, Dy1, Yz1 · IV (+30°) Yd11, Dy11, Yz11. Clock number × 30° = LV lag behind HV. Dyn11 is the usual distribution transformer.</li><li>Open delta: two units carry 86.6 % of their own rating → 57.7 % of the three-unit bank.</li></ul>
        ${pyqBlock([1, 14])}`;
    }
    if (m === 'm11') {
      const A = AU, Vs = A.ser === 'L' ? A.VL : A.VH, Vc = A.ser === 'L' ? A.VH : A.VL, Vo = A.VH + A.VL, Sa = A.S * Vo / Vs, k = Vc / Vo, Ih = Sa * 1000 / Vo, Il = Sa * 1000 / Vc;
      const e2 = A.S * A.pf / (A.S * A.pf + A.Pi + A.Pc) * 100, ea = Sa * A.pf / (Sa * A.pf + A.Pi + A.Pc) * 100;
      const bk = AUP.find(q => q.S === A.S && q.VH === A.VH && q.VL === A.VL && q.ser === A.ser);
      const y = 30 + 190 * Vs / Vo;
      return `<div class="sm-ph"><div class="sm-ckt"><svg viewBox="0 0 440 250" role="img" aria-label="Autotransformer winding"><g fill="none" stroke-width="2.4">
          <path d="M200 30 V${y.toFixed(0)}" stroke="#c87533" stroke-width="10"/><path d="M200 ${y.toFixed(0)} V220" stroke="#2e8b57" stroke-width="10"/>
          <path d="M200 30 H390" stroke="#13265a"/><path d="M200 ${y.toFixed(0)} H50" stroke="#13265a"/><path d="M200 220 H390 M200 220 H50" stroke="#13265a"/></g>
          <circle cx="200" cy="${y.toFixed(0)}" r="5" fill="#13265a"/>
          <text x="390" y="22" text-anchor="end" font-size="14" font-weight="700" fill="#13265a">High side ${sig(Vo)} V · I = ${sig(Ih)} A</text>
          <text x="50" y="${(y - 10).toFixed(0)}" font-size="14" font-weight="700" fill="#13265a">Low side ${sig(Vc)} V · I = ${sig(Il)} A</text>
          <text x="214" y="${((30 + y) / 2).toFixed(0)}" font-size="13" font-weight="700" fill="#b4531c">series ${sig(Vs)} V · carries ${sig(Ih)} A</text>
          <text x="214" y="${((y + 220) / 2).toFixed(0)}" font-size="13" font-weight="700" fill="#1d6b3a">common ${sig(Vc)} V · carries ${sig(Il - Ih)} A</text>
          <text x="220" y="244" text-anchor="middle" font-size="11" fill="#56637a">One winding, tapped: both windings carry exactly their two-winding rated currents.</text></svg></div>
        ${kv([['Autotransformer ratio', `${sig(Vo)}/${sig(Vc)} V`], ['Rating S_auto = S × V_out / V_series', `${sig(A.S)} × ${sig(Vo)} / ${sig(Vs)} = ${sig(Sa)} kVA (${sig(Sa / A.S)}×)`], ['Transformed (by induction)', `${sig(A.S)} kVA`], ['Conducted (directly)', `${sig(Sa - A.S)} kVA`], ['k = V_low / V_high', sig(k, 3)], ['Copper saved = k × two-winding copper', `${sig(k * 100)} %`], ['Efficiency, two-winding at full load', `${sig(e2)} %`], ['Efficiency as autotransformer (same losses)', `${sig(ea)} %`]])}</div>
        ${bk ? `<div class="sm-ok">✓ Your book's table (key card 49) gives <b>${esc(bk.kva)} kVA</b> and <b>${esc(bk.k)}</b> copper saved for this case — the simulator agrees.</div>` : ''}
        <ul class="sm-ul"><li>The two-winding transformer's own windings still carry only their rated currents, so its kVA rating multiplies by V_out/V_series.</li><li>Copper saving k is largest when the ratio is close to 1 — that is where autotransformers pay off (e.g. 400/220 kV interconnectors).</li><li>No electrical isolation between the sides; a fault on the high side can reach the low side.</li><li>Autotransformer starting of induction motors is a different use: your book's Induction Motors topic (I_st, T_st = x² of DOL).</li></ul>
        ${pyqBlock([2, 12])}`;
    }
    if (m === 'm12') {
      const Z = paZ(), sum = cadd(Z.Z1, Z.Z2), sn2 = Math.sqrt(Math.max(0, 1 - PA.pf ** 2)), I = cz(PA.S * PA.pf, -PA.S * sn2);
      const I1 = cmul(I, cdiv(Z.Z2, sum)), I2 = cmul(I, cdiv(Z.Z1, sum)), S1 = cabs(I1), S2 = cabs(I2), pf = q => q.r / cabs(q);
      const f1 = cabs(cdiv(Z.Z2, sum)), f2 = cabs(cdiv(Z.Z1, sum)), Smax = Math.min(PA.S1 / f1, PA.S2 / f2), L1 = S1 / PA.S1 * 100, L2 = S2 / PA.S2 * 100;
      const zpc2 = PA.mode === 'pc' ? cz(PA.R2 * PA.S1 / PA.S2, PA.X2 * PA.S1 / PA.S2) : null, Ic = zpc2 ? PA.dE / cabs(cadd(cz(PA.R1, PA.X1), zpc2)) * 100 : NaN;
      const lead = L1 >= L2 ? 'T₁' : 'T₂';
      return `${kv([['T₁ share S₁ = S·Z₂/(Z₁+Z₂)', `${sig(S1)} kVA at pf ${sig(pf(I1), 3)}`], ['T₂ share S₂ = S·Z₁/(Z₁+Z₂)', `${sig(S2)} kVA at pf ${sig(pf(I2), 3)}`], ['T₁ loading', `${sig(L1)} %`], ['T₂ loading', `${sig(L2)} %`], ['Most load without overloading either', `${sig(Smax)} kVA (of ${sig(PA.S1 + PA.S2)} kVA installed)`], ...(PA.mode === 'pc' ? [['Circulating current from the voltage difference', PA.dE ? `${sig(Ic)} % of T₁ rated current, even at no load` : 'none (equal ratios)']] : [])])}
        ${Math.max(L1, L2) > 100 ? `<div class="sm-bad">✗ ${lead} is overloaded (${sig(Math.max(L1, L2))} %). The load divides inversely to impedance, not by rating.</div>` : `<div class="sm-ok">✓ Neither transformer is overloaded. ${Math.abs(L1 - L2) < 0.5 ? 'Equal per-unit impedances → load shared in proportion to the ratings.' : `${lead} reaches 100 % first.`}</div>`}
        <div class="sm-gs">${plBox('par', 'Total load vs loading of each transformer')}</div>
        <div class="ctab"><table class="sm-wt"><thead><tr><th>Condition (your book)</th><th>If it is not met</th></tr></thead><tbody>
          <tr><td>Same polarity</td><td>A dead short circuit through the two windings.</td></tr><tr><td>Same voltage ratio</td><td>A circulating current flows even at no load: I_c = ΔE / (Z₁ + Z₂).</td></tr>
          <tr><td>Same phase sequence (3-φ)</td><td>Phases short-circuit against each other.</td></tr><tr><td>Same phase shift (vector group)</td><td>A 30° difference puts 51.8 % of the phase voltage across the two impedances — a huge circulating current.</td></tr>
          <tr><td>Similar per-unit impedance (and X/R)</td><td>The one with lower per-unit impedance takes more than its share and overloads first; unequal X/R gives the two shares different pf.</td></tr></tbody></table></div>
        ${pyqBlock([13, 17])}`;
    }
    return '';
  }

  /* ================= formula explorer ================= */
  const FX = [
    { t: 'EMF equation', f: 'E = 4.44 f N Φm', sym: [['E', 'rms induced emf', 'V'], ['f', 'frequency', 'Hz'], ['N', 'turns of that winding', '—'], ['Φm', 'peak core flux', 'Wb']],
      from: 'φ = Φm sin ωt, so e = N dφ/dt = N ω Φm cos ωt. Peak = 2π f N Φm; rms = peak / √2 = 4.44 f N Φm (4.44 = 4 × form factor 1.11).',
      phys: 'Voltage comes from how fast the flux changes. A bigger flux, a faster change (higher f) or more turns all give more volts.',
      when: 'Finding Φm or Bm from the voltage, volts per turn, or what happens when V or f changes.',
      ex: o => `${sig(st.V1)} V, ${sig(st.f)} Hz, N₁ = ${sig(st.N1)} → Φm = ${sig(st.V1)} / (4.44 × ${sig(st.f)} × ${sig(st.N1)}) = ${sig(o.phi * 1000)} mWb.`,
      mist: 'Using 2π f N Φm (that is the peak emf). Forgetting mWb → Wb. Using line voltage for a delta/star phase winding.', tip: 'Volts per turn = 4.44 f Φm — the same on both windings.', ch: [3] },
    { t: 'Flux with voltage and frequency', f: 'Φm = V / (4.44 f N), Bm = Φm / A ∝ V / f', sym: [['V', 'applied voltage (≈ E₁)', 'V'], ['A', 'core cross-section', 'm²'], ['Bm', 'peak flux density', 'T']],
      from: 'The EMF equation turned round, with E₁ ≈ V₁ (the primary drop is small).',
      phys: 'The primary must induce a back-emf equal to the supply, so the core flux settles at whatever value does that. The supply, not the load, sets the flux.',
      when: '"Same transformer on 60 Hz / 40 Hz / lower voltage" questions; saturation and core-loss questions.',
      ex: o => `Now V/f = ${sig(st.V1 / st.f)} V/Hz; rated ${sig(DES.V / DES.f)} V/Hz → flux at ${sig(o.Br * 100)} % of rated.`,
      mist: 'Thinking load current changes the flux. Forgetting that f ↓ at the same V raises the flux.', tip: 'Keep V/f constant → flux constant.', ch: [25, 3] },
    { t: 'Voltage (turns) ratio', f: 'E₁ / E₂ = V₁ / V₂ = N₁ / N₂ = 1 / K', sym: [['K', 'transformation ratio N₂/N₁', '—'], ['N₁, N₂', 'turns', '—']],
      from: 'The same flux links both windings, so E₁ = 4.44 f N₁ Φm and E₂ = 4.44 f N₂ Φm; divide.',
      phys: 'Each turn gets the same volts, so the winding with more turns has more voltage.',
      when: 'Any step-up / step-down voltage or turns question.', ex: o => `V₂ = ${sig(st.V1)} × ${sig(st.N2)} / ${sig(st.N1)} = ${sig(o.E2)} V (no load).`,
      mist: 'Writing the ratio upside down. Expecting frequency to change — it never does.', tip: 'K > 1 step-up, K < 1 step-down.', ch: [4] },
    { t: 'Current ratio and mmf balance', f: 'I₁ / I₂ = N₂ / N₁, N₁ I₁ = N₂ I₂', sym: [['I₁, I₂', 'primary, secondary current', 'A'], ['N I', 'magnetomotive force', 'AT']],
      from: 'Ideal transformer: V₁I₁ = V₂I₂ with V₁/V₂ = N₁/N₂. Or: the load mmf N₂I₂ is cancelled by extra primary mmf so the flux stays the same.',
      phys: 'Secondary current tries to reduce the flux; the primary draws extra current to put it back. That is how the load reaches the supply.',
      when: 'Primary current from secondary current (or the reverse), and load-change questions.', ex: o => `I₁ = ${sig(o.K)} × ${sig(o.I2)} = ${sig(o.I1id)} A (ideal); with I₀ it is ${sig(o.I1)} A.`,
      mist: 'Inverting the ratio — the high-voltage side carries the LOWER current.', tip: 'HV side: more turns, more volts, fewer amps.', ch: [4] },
    { t: 'Full-load current from the rating', f: 'I = kVA × 1000 / V (1-φ), I = kVA × 1000 / (√3 V_L) (3-φ)', sym: [['kVA', 'rating', 'kVA'], ['V, V_L', 'winding voltage, line voltage', 'V']],
      from: 'S = V I for one phase; S = √3 V_L I_L for three phases.', phys: 'The rating is apparent power: the same on both sides, so each side\'s current is rating ÷ its voltage.',
      when: 'Rating, copper loss, protection and cable-size questions.', ex: o => `${sig(st.S)} kVA → I₁ = ${sig(o.I1r)} A at ${DES.V} V, I₂ = ${sig(o.I2r)} A at ${sig(DES.V * o.K)} V.`,
      mist: 'Forgetting √3 for 3-phase current (the book\'s trap).', tip: 'Same kVA on both sides.', ch: [], key: 23 },
    { t: 'Referred (equivalent) impedance', f: 'R₀₁ = R₁ + R₂ (N₁/N₂)², X₀₁ = X₁ + X₂ (N₁/N₂)², Z₀₁ = √(R₀₁² + X₀₁²)', sym: [['R₀₁, X₀₁', 'equivalent resistance, reactance referred to the primary', 'Ω'], ['R₀₂', 'R₂ + R₁ (N₂/N₁)²', 'Ω']],
      from: 'Moving R₂ to the primary must keep its loss: I₂² R₂ = I₁² R₂′ → R₂′ = R₂ (I₂/I₁)² = R₂ (N₁/N₂)².',
      phys: 'An impedance looks bigger from the side with more turns — the basis of impedance matching.',
      when: 'Equivalent circuit, copper loss, regulation and SC-test questions.', ex: o => `R₀₁ = ${sig(st.R1)} + ${sig(st.R2)} × ${sig((st.N1 / st.N2) ** 2)} = ${sig(o.R01)} Ω.`,
      mist: 'Not squaring the turns ratio, or squaring it the wrong way.', tip: 'To the side with more turns: multiply by (ratio)²; to fewer turns: divide.', ch: [5] },
    { t: 'No-load current', f: 'I₀ = √(Iw² + Iμ²), Iw = I₀ cos φ₀, Iμ = I₀ sin φ₀', sym: [['Iw', 'core-loss (working) component, in phase with V', 'A'], ['Iμ', 'magnetising component, lags V by 90°', 'A'], ['cos φ₀', 'no-load power factor', '—']],
      from: 'At no load the input is only core loss (V₁Iw) plus the reactive power that sets up the flux (V₁Iμ).', phys: 'Iμ makes the flux; Iw supplies the core loss. I₀ is small, so no-load pf is very low.',
      when: 'OC-test and no-load phasor questions.', ex: o => `Iw = ${sig(o.Iw)} A, Iμ = ${sig(o.Imu)} A → I₀ = ${sig(o.I0)} A, cos φ₀ = ${sig(o.Iw / o.I0)}.`,
      mist: 'Swapping Iw and Iμ. Taking I₀ as the full-load current.', tip: 'No-load pf is very low (~0.2).', ch: [6] },
    { t: 'Core loss: hysteresis and eddy current', f: 'Ph = kh f Bm^1.6 · vol, Pe = ke f² Bm² t² · vol, Pi = Ph + Pe', sym: [['kh, ke', 'material constants', '—'], ['t', 'lamination thickness', 'm'], ['Pi', 'core (iron) loss', 'W']],
      from: 'Steinmetz: each magnetic cycle wastes energy ∝ Bm^1.6, cycles per second = f. Eddy emf ∝ f Bm t, loss ∝ emf².',
      phys: 'Hysteresis: domains flipping back and forth. Eddy: circulating currents in the iron — cut by thin laminations.',
      when: 'Frequency/voltage-change and loss-separation questions (P/f = A + Bf).', ex: o => `Now Ph = ${sig(o.Ph)} W, Pe = ${sig(o.Pe)} W, Pi = ${sig(o.Pi)} W.`,
      mist: 'Scaling eddy loss with f² when V is fixed — at fixed V, Bm ∝ 1/f, so Pe ∝ V² does not change.', tip: 'Fixed V: f ↑ → Ph ↓, Pe same. Fixed V/f: Ph ∝ f, Pe ∝ f².', ch: [16, 25] },
    { t: 'Copper loss', f: 'Pcu = I₁² R₁ + I₂² R₂ = I₁² R₀₁ = I₂² R₀₂ = x² Pcu,FL', sym: [['x', 'fraction of full load', '—'], ['Pcu,FL', 'full-load copper loss (SC test)', 'W']],
      from: 'Joule heating in each winding; referring puts it all on one side.', phys: 'Grows with the square of the load current.',
      when: 'Efficiency at part load, maximum efficiency, all-day efficiency.', ex: o => `x = ${sig(o.x)} → Pcu = ${sig(o.x)}² × ${sig(o.PcuFL)} = ${sig(o.Pcu)} W.`,
      mist: 'Using x instead of x².', tip: 'Half load → quarter copper loss.', ch: [] },
    { t: 'Efficiency', f: 'η = x S cos φ / (x S cos φ + Pi + x² Pcu,FL)', sym: [['S', 'rating', 'VA'], ['cos φ', 'load power factor', '—'], ['Pi', 'core loss', 'W']],
      from: 'Output / (output + losses).', phys: 'Losses are small, so η is high (95–99 %); it is best at the load where the two losses are equal.',
      when: 'Efficiency at any load and power factor.', ex: o => `η = ${sig(o.Pout)} / (${sig(o.Pout)} + ${sig(o.Pi)} + ${sig(o.Pcu)}) = ${sig(o.eta)} %.`,
      mist: 'Leaving out cos φ (using kVA as kW). Using x for copper loss.', tip: 'Max η is at unity pf for a given load.', ch: [8] },
    { t: 'Maximum efficiency', f: 'Pcu = Pi → x = √(Pi / Pcu,FL)', sym: [['x', 'load (fraction of full load) at maximum η', '—']],
      from: 'dη/dI₂ = 0 gives I₂² R₀₂ = Pi: variable loss = constant loss.', phys: 'Below that load the constant core loss dominates; above it the copper loss grows faster than the output.',
      when: '"At what load is efficiency maximum?" — and to find Pi or Pcu,FL from the load at max η.', ex: o => `x = √(${sig(o.Pi)} / ${sig(o.PcuFL)}) = ${sig(o.xm)} → ${sig(o.xm * st.S)} kVA.`,
      mist: 'Assuming maximum efficiency is always at full load.', tip: 'Pi : Pcu,FL = 1 : 4 → max η at half load.', ch: [9] },
    { t: 'All-day efficiency', f: 'η_AD = output kWh / input kWh (over 24 h)', sym: [['kWh', 'energy over the day', 'kWh']],
      from: 'Energy, not power: core loss runs 24 h, copper loss only while loaded.', phys: 'Distribution transformers are energised all day but loaded only part of it.',
      when: 'Distribution-transformer questions with a load cycle.', ex: () => 'See module 5 for the day you set.', mist: 'Counting core loss only during loaded hours.', tip: 'Design for low core loss when the load is light for long hours.', ch: [10] },
    { t: 'Open- and short-circuit tests', f: 'OC: W₀ = Pi, cos φ₀ = W₀/(V₀I₀), R₀ = V₀/Iw, X₀ = V₀/Iμ · SC: W_sc = Pcu, R_eq = W_sc/I_sc², Z_eq = V_sc/I_sc', sym: [['W₀, V₀, I₀', 'OC readings', 'W, V, A'], ['W_sc, V_sc, I_sc', 'SC readings', 'W, V, A']],
      from: 'OC: rated voltage, tiny current → only core loss. SC: rated current, 5–10 % voltage → only copper loss.', phys: 'Each test isolates one loss, so the two can be measured without loading the transformer.',
      when: 'Finding Pi, Pcu,FL and the equivalent-circuit parameters.', ex: () => 'See module 6 for the readings this transformer would give.', mist: 'Doing the SC test on the LV side (needs a large current).', tip: 'OC on LV (HV open); SC on HV (LV shorted).', ch: [11] },
    { t: 'Voltage regulation', f: '% Reg ≈ (I R cos φ ± I X sin φ) / V × 100 (+ lagging, − leading)', sym: [['R, X', 'equivalent resistance, reactance (same side as I, V)', 'Ω'], ['V', 'rated (no-load) voltage of that side', 'V']],
      from: 'Phasor drop I(R + jX) projected on V: the in-phase part is I R cos φ ± I X sin φ.', phys: 'How much the output voltage falls from no load to full load.',
      when: 'Regulation at any pf; zero/negative regulation questions.', ex: o => `Reg ≈ ${sig(o.regA)} % (exact ${sig(o.reg)} %).`,
      mist: 'Wrong sign at leading pf. Mixing primary and secondary values.', tip: 'Zero at leading tan φ = R/X; maximum at lagging tan φ = X/R.', ch: [7] },
  ];
  const pyqList = chs => [...new Set(chs.flatMap(n => (D.ftags[n] || [])))].map(i => D.qrows[i]);

  /* ================= practice ================= */
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // q = {q, opts:[[text, why]], a:index, src}
  const mk = (q, right, wrongs, src, tag) => { const o = shuffle([[right[0], right[1], 1], ...wrongs.map(w => [w[0], w[1], 0])]); return { q, opts: o.map(x => [x[0], x[1]]), a: o.findIndex(x => x[2]), src, tag, id: 'gen:' + plain(q).slice(0, 90) }; };
  const W = 'Written for this page — not a past paper';
  const G = 'Practice numbers generated for this page — answer computed by code';
  const L1 = [
    () => mk('At constant voltage and turns, the supply frequency is increased. The maximum core flux Φm', ['decreases', 'Φm = V/(4.44 f N): f is in the denominator, so Φm ∝ 1/f.'], [['increases', 'That happens when f decreases at the same V.'], ['does not change', 'Only if V is raised in step with f (V/f constant).'], ['becomes zero', 'Flux falls but stays finite while AC is applied.']], W),
    () => mk('A 230/115 V transformer is connected to a 230 V DC supply. What happens?', ['The primary draws a very large current and burns', 'DC gives no changing flux, so no back-emf; only the small winding resistance limits the current.'], [['Secondary gives 115 V DC', 'No changing flux → no induced emf in the secondary.'], ['It works normally at lower efficiency', 'A transformer cannot work on DC at all.'], ['The core saturates but the current stays at rated', 'The current is limited only by R, so it is far above rated.']], W),
    () => mk('The frequency of the secondary voltage of a transformer is', ['the same as the primary frequency', 'Both windings are linked by the same alternating flux.'], [['higher in a step-up transformer', 'A transformer changes V and I, never f.'], ['lower in a step-down transformer', 'A transformer changes V and I, never f.'], ['zero', 'The secondary voltage alternates with the flux.']], W),
    () => mk('Which loss is measured by the open-circuit test?', ['Core (iron) loss', 'Rated voltage, tiny current: copper loss is negligible, the wattmeter reads core loss.'], [['Full-load copper loss', 'That is the short-circuit test.'], ['Stray load loss only', 'OC test gives the whole core loss.'], ['Dielectric loss only', 'Not separated by the OC test.']], W),
    () => mk('The load on a transformer increases (V₁ and f fixed). The core loss', ['stays (almost) the same', 'Core loss depends on V and f, which do not change with load.'], [['increases with I²', 'That is copper loss.'], ['decreases', 'Nothing that sets the flux has changed.'], ['doubles when the load doubles', 'Core loss does not depend on load current.']], W),
    () => mk('Maximum efficiency of a transformer occurs when', ['copper loss = core loss', 'dη/dI = 0 gives variable loss = constant loss.'], [['copper loss = 2 × core loss', 'No such condition comes from dη/dI = 0.'], ['core loss is zero', 'Core loss is present whenever the transformer is energised.'], ['the load is always full load', 'Only if the design makes Pcu,FL = Pi.']], W),
    () => mk('A resistance on the secondary is referred to the primary of a step-down transformer (N₁ > N₂). It', ['becomes larger, × (N₁/N₂)²', 'R₂′ = R₂ (N₁/N₂)²; the primary has more turns.'], [['becomes smaller, × (N₂/N₁)²', 'That is referring to the side with fewer turns.'], ['becomes larger, × N₁/N₂', 'The ratio must be squared.'], ['stays the same', 'Referred values scale with (turns ratio)².']], W),
    () => mk('The magnetising component Iμ of the no-load current', ['lags the applied voltage by 90°', 'It sets up the flux, which is in quadrature with V.'], [['is in phase with the voltage', 'That is Iw, the core-loss component.'], ['leads the voltage by 90°', 'A magnetising (inductive) current lags.'], ['is larger than the full-load current', 'I₀ is a few per cent of full-load current.']], W),
    () => mk('Thin laminations in the core mainly reduce', ['eddy-current loss', 'Pe ∝ t²: thin insulated sheets cut the eddy paths.'], [['hysteresis loss', 'That is reduced by silicon steel (low kh).'], ['copper loss', 'That depends on winding resistance.'], ['leakage reactance', 'That depends on the winding arrangement.']], W),
    () => mk('The factor 4.44 in E = 4.44 f N Φm comes from', ['2π/√2 = 4 × form factor 1.11', 'Peak emf 2πfNΦm divided by √2 for rms.'], [['√3 for three-phase', '√3 is not in the single-winding emf.'], ['π × √2', 'π√2 = 4.44 numerically, but the derivation is 2π/√2.'], ['the stacking factor of the core', 'Stacking factor affects area, not the 4.44.']], W),
    () => mk('Secondary turns are doubled (V₁, f, N₁ fixed). The core flux Φm', ['does not change', 'Φm = V₁/(4.44 f N₁) — set by the primary only.'], [['halves', 'That happens if N₁ is doubled.'], ['doubles', 'E₂ doubles, not the flux.'], ['depends on the load', 'The load does not set the flux.']], W),
    () => mk('The short-circuit test is normally done on the', ['HV side with the LV side shorted', 'The HV rated current is small, so meters of small range are enough, and only 5–10 % of HV voltage is needed.'], [['LV side with the HV side shorted', 'That needs a very large current.'], ['HV side with the LV side open', 'That is not a short-circuit test.'], ['LV side at rated voltage', 'Rated voltage on a short-circuit would be destructive.']], W),
  ];
  // Increasing/decreasing questions answered by the model (with stated assumptions).
  const DIRQ = [['f', 'phi', 'Z', false, 'V₁ and N₁ fixed'], ['V1', 'Pe', 'Z', false, 'f fixed'], ['f', 'Ph', 'Z', false, 'V₁ fixed'], ['f', 'Pe', 'Z', false, 'V₁ fixed'], ['f', 'Pi', 'Z', true, 'V/f fixed'],
    ['N1', 'E2', 'Z', false, 'V₁, f, N₂ fixed'], ['load', 'I1', 'Z', false, 'V₁, f fixed'], ['load', 'Pi', 'Z', false, 'V₁, f fixed'], ['N2', 'I2', 'P', false, 'same load power'], ['N2', 'I1', 'P', false, 'same load power'],
    ['N2', 'I2', 'Z', false, 'same load impedance'], ['X', 'Pcu', 'I', false, 'same load current'], ['pf', 'eta', 'I', false, 'same load current, lagging pf'], ['N1', 'I0', 'Z', false, 'V₁, f fixed']];
  const L1dir = () => {
    const [p, k, lm, vf, cond] = rnd(DIRQ), up = Math.random() < 0.6, s = { ...st, load: lm, pt: p === 'pf' ? 'lag' : st.pt };
    const r = whatIf(s, p, up, vf).find(x => x.k === k), names = { phi: 'maximum flux Φm', Pe: 'eddy-current loss', Ph: 'hysteresis loss', Pi: 'core loss', E2: 'secondary voltage E₂', I1: 'primary current I₁', I2: 'secondary current I₂', Pcu: 'copper loss', eta: 'efficiency', I0: 'no-load current I₀' };
    const T = { 1: 'increases', '-1': 'decreases', 0: 'does not change' }, why = `${r.why}${r.rel && r.rel !== 'no change' ? ` Here ${ON[k] ? ON[k][1] : k} ${r.rel}.` : ''} Model change: ${sig(r.a)} → ${sig(r.b)}.`;
    const right = T[r.d], wrongs = Object.entries(T).filter(([d]) => +d !== r.d).map(([d, t]) => [t, `Not with ${cond}: the result is "${right}".`]);
    wrongs.push(['cannot be said', `It can, once the condition (${cond}) is fixed.`]);
    return mk(`${PAR[p][0]} ${up ? 'increases' : 'decreases'} (${cond}). The ${names[k]}`, [right, why], wrongs.slice(0, 3), 'Written for this page — answer from the simulator model', { phi: 'emf', Pe: 'loss', Ph: 'loss', Pi: 'loss', E2: 'turns', I1: 'cur', I2: 'cur', Pcu: 'loss', eta: 'eff', I0: 'noload' }[k]);
  };
  const pick3 = (ans, ds) => {
    const out = [], far = (u, v) => Math.abs(u - v) > 0.02 * Math.abs(ans);
    for (const d of [...ds, [ans * 1.25, 'Close, but not what the formula gives — recheck the arithmetic.'], [ans * 0.8, 'Close, but not what the formula gives — recheck the arithmetic.'], [ans * 1.5, 'Not what the formula gives.']])
      if (Number.isFinite(d[0]) && far(d[0], ans) && out.every(o => far(o[0], d[0]))) out.push(d);
    return out.slice(0, 3);
  };
  const L2 = [
    () => { const V = rnd([230, 440, 1100, 2200, 3300, 6600, 11000]), f = rnd([50, 60]), N = rnd([100, 150, 200, 250, 400, 500, 600, 800, 1000, 1200, 1500, 2000]), a = V / (4.44 * f * N) * 1000;
      const ds = pick3(a, [[V / (f * N) * 1000, 'Forgot the 4.44 (used E = f N Φm).'], [V / (2 * Math.PI * f * N) * 1000, 'Used 2πfNΦm: that is the peak emf, not rms.'], [V * Math.SQRT2 / (4.44 * f * N) * 1000, 'Used the peak voltage √2 V in the rms formula.'], [a * 10, 'Unit slip when converting Wb → mWb.']]);
      return mk(`A ${V} V, ${f} Hz transformer has ${N} primary turns. The maximum core flux is`, [`${sig(a)} mWb`, `Φm = V / (4.44 f N) = ${V} / (4.44 × ${f} × ${N}) = ${sig(a)} mWb.`], ds.map(d => [`${sig(d[0])} mWb`, d[1]]), G); },
    () => { const S = rnd([5, 10, 25, 50, 100]), V1 = rnd([2200, 3300, 6600, 11000]), r = rnd([5, 10, 15, 20, 25, 30]), V2 = V1 / r, I1 = S * 1000 / V1, I2 = S * 1000 / V2;
      const o = [[`I₁ = ${sig(I1)} A, I₂ = ${sig(I2)} A`, `I = kVA × 1000 / V on each side: ${S}000/${V1} and ${S}000/${sig(V2)}.`], [`I₁ = ${sig(I2)} A, I₂ = ${sig(I1)} A`, 'Swapped: the HV side carries the smaller current.'], [`I₁ = ${sig(I1 / Math.sqrt(3))} A, I₂ = ${sig(I2 / Math.sqrt(3))} A`, '√3 is for three-phase only; this is single-phase.'], [`I₁ = ${sig(I1)} A, I₂ = ${sig(I1 / r)} A`, 'Current ratio inverted: I₂ = I₁ × N₁/N₂, not ÷.']];
      return mk(`A single-phase ${S} kVA, ${V1}/${sig(V2)} V transformer. Full-load currents are`, o[0], o.slice(1), G); },
    () => { const R1 = rnd([0.5, 1, 1.2, 2, 2.5, 4]), R2 = rnd([0.004, 0.005, 0.008, 0.01, 0.02]), r = rnd([5, 10, 20]), a = R1 + R2 * r * r;
      const ds = pick3(a, [[R1 + R2 * r, 'The turns ratio must be squared.'], [R1 + R2 / (r * r), 'Squared the wrong way: going to the side with more turns multiplies.'], [R1 + R2, 'R₂ was not referred at all.']]);
      return mk(`R₁ = ${R1} Ω, R₂ = ${R2} Ω, N₁/N₂ = ${r}. The equivalent resistance referred to the primary R₀₁ is`, [`${sig(a)} Ω`, `R₀₁ = R₁ + R₂ (N₁/N₂)² = ${R1} + ${R2} × ${r * r} = ${sig(a)} Ω.`], ds.map(d => [`${sig(d[0])} Ω`, d[1]]), G); },
    () => { const S = rnd([50, 100, 200, 250, 500]), Pi = rnd([0.5, 1, 1.5, 2, 2.5]), Pc = rnd([3, 4, 6, 8, 9]), a = Math.sqrt(Pi / Pc) * S;
      const ds = pick3(a, [[Pi / Pc * S, 'Forgot the square root: Pcu ∝ x², so x = √(Pi/Pcu).'], [Math.sqrt(Pc / Pi) * S, 'Ratio upside down.'], [S, 'Max efficiency is not always at full load.']]);
      return mk(`A ${S} kVA transformer: core loss ${Pi} kW, full-load copper loss ${Pc} kW. Maximum efficiency occurs at a load of`, [`${sig(a)} kVA`, `x = √(Pi/Pcu,FL) = √(${Pi}/${Pc}) = ${sig(a / S)} → ${sig(a)} kVA.`], ds.map(d => [`${sig(d[0])} kVA`, d[1]]), G); },
    () => { const S = rnd([50, 100, 200]), pf = rnd([0.8, 0.9, 1]), Pi = rnd([0.5, 1, 1.5]), Pc = rnd([2, 3, 4]), x = rnd([0.5, 0.75, 1.25]), out = x * S * pf, a = out / (out + Pi + x * x * Pc) * 100;
      const ds = pick3(a, [[out / (out + Pi + x * Pc) * 100, 'Used x instead of x² for copper loss.'], [x * S / (x * S + Pi + x * x * Pc) * 100, 'Left out cos φ (used kVA as kW).'], [out / (out + x * x * Pc) * 100, 'Forgot the core loss.']]);
      return mk(`${S} kVA, core loss ${Pi} kW, full-load Cu loss ${Pc} kW. Efficiency at ${x * 100} % load, pf ${pf}:`, [`${a.toFixed(2)} %`, `η = ${sig(out)} / (${sig(out)} + ${Pi} + ${x}² × ${Pc}) = ${a.toFixed(2)} %.`], ds.map(d => [`${d[0].toFixed(2)} %`, d[1]]), G); },
    () => { const er = rnd([1, 1.5, 2, 2.5, 3]), ex = rnd([3, 4, 5, 6]), pf = rnd([0.6, 0.8]), lag = Math.random() < 0.6, sn = Math.sqrt(1 - pf * pf), a = er * pf + (lag ? 1 : -1) * ex * sn;
      const ds = pick3(a, [[er * pf - (lag ? 1 : -1) * ex * sn, 'Wrong sign: + for lagging, − for leading.'], [er * sn + (lag ? 1 : -1) * ex * pf, 'cos and sin swapped.'], [Math.hypot(er, ex), 'That is the % impedance (maximum regulation), not the regulation at this pf.']]);
      return mk(`% resistance ${er} %, % reactance ${ex} %. Regulation at pf ${pf} ${lag ? 'lagging' : 'leading'} is about`, [`${a.toFixed(2)} %`, `ε = εr cos φ ${lag ? '+' : '−'} εx sin φ = ${er} × ${pf} ${lag ? '+' : '−'} ${ex} × ${sn.toFixed(1)} = ${a.toFixed(2)} %.`], ds.map(d => [`${d[0].toFixed(2)} %`, d[1]]), G); },
    () => { const Ph = rnd([400, 500, 600, 800]), Pe = rnd([200, 300, 400]), f1 = rnd([40, 60]), vf = Math.random() < 0.5, r = f1 / 50;
      const a = vf ? Ph * r + Pe * r * r : Ph * Math.pow(r, -0.6) + Pe;
      const ds = pick3(a, vf ? [[Ph * Math.pow(r, -0.6) + Pe, 'That is for fixed voltage; here V/f is fixed, so Bm is constant.'], [Ph + Pe, 'Losses change with f even at constant Bm.'], [(Ph + Pe) * r, 'Eddy loss goes with f², not f.']]
        : [[Ph * r + Pe * r * r, 'That assumes Bm constant; at fixed V, Bm ∝ 1/f.'], [Ph + Pe, 'Hysteresis loss changes: Ph ∝ f Bm^1.6 ∝ f^−0.6.'], [Ph * r + Pe, 'Bm also changes: Ph ∝ f^−0.6 at fixed V.']]);
      return mk(`At 50 Hz a transformer has hysteresis loss ${Ph} W and eddy loss ${Pe} W. It is used at ${f1} Hz with ${vf ? 'V/f kept constant' : 'the same voltage'}. New core loss (Steinmetz exponent 1.6):`, [`${sig(a)} W`, vf ? `Bm same: Ph × ${r} + Pe × ${r}² = ${sig(a)} W.` : `Bm ∝ 1/f: Ph × (${f1}/50)^−0.6 + Pe (unchanged, ∝ V²) = ${sig(a)} W.`], ds.map(d => [`${sig(d[0])} W`, d[1]]), G); },
    () => { const [R, X] = rnd([[3, 4], [1.2, 1.6], [5, 12], [0.6, 0.8], [2.4, 3.2], [8, 15]]), Z = Math.hypot(R, X), I = rnd([5, 10, 15, 20, 25]), V = I * Z, P = I * I * R;
      const ds = pick3(X, [[Z, 'That is Z_eq; X needs √(Z² − R²).'], [Z - R, 'Impedances add as phasors, not numbers.'], [P / I, 'R = W/I² — the current must be squared.']]);
      return mk(`SC test (HV side): ${sig(V)} V, ${I} A, ${sig(P)} W. The equivalent reactance X_eq is`, [`${sig(X)} Ω`, `R = ${sig(P)}/${I}² = ${sig(R)} Ω, Z = ${sig(V)}/${I} = ${sig(Z)} Ω, X = √(Z² − R²) = ${sig(X)} Ω.`], ds.map(d => [`${sig(d[0])} Ω`, d[1]]), G); },
    () => { const V = rnd([200, 230, 250, 400]), I0 = rnd([0.6, 0.8, 1, 1.2, 1.5]), c = rnd([0.15, 0.2, 0.25, 0.3]), W0 = V * I0 * c, s = Math.sqrt(1 - c * c), X0 = V / (I0 * s);
      const ds = pick3(X0, [[V / I0, 'Used the whole I₀; X₀ uses only Iμ = I₀ sin φ₀.'], [V / (I0 * c), 'That is R₀ = V₀/Iw.'], [V / (I0 * c * s), 'Mixed the two components.']]);
      return mk(`OC test (LV side): ${V} V, ${I0} A, ${sig(W0)} W. The magnetising reactance X₀ is`, [`${sig(X0)} Ω`, `cos φ₀ = ${sig(W0)}/(${V} × ${I0}) = ${c}; Iμ = I₀ sin φ₀ = ${sig(I0 * s)} A; X₀ = V₀/Iμ = ${sig(X0)} Ω.`], ds.map(d => [`${sig(d[0])} Ω`, d[1]]), G); },
    () => { const S = rnd([50, 100, 200]), Pi = rnd([0.5, 1, 1.5]), Pc = rnd([2, 3, 4]), h1 = rnd([4, 6, 8]), h2 = rnd([6, 8, 10]), h0 = 24 - h1 - h2;
      const out = S * h1 + S / 2 * h2, cu = Pc * h1 + Pc / 4 * h2, a = out / (out + Pi * 24 + cu) * 100;
      const ds = pick3(a, [[out / (out + Pi * (h1 + h2) + cu) * 100, 'Core loss runs all 24 h, not only while loaded.'], [out / (out + Pi * 24 + Pc * h1 + Pc / 2 * h2) * 100, 'Half load gives a quarter of the copper loss (x²), not half.'], [S / (S + Pi + Pc) * 100, 'That is the full-load (commercial) efficiency.']]);
      return mk(`${S} kVA, core loss ${Pi} kW, full-load Cu loss ${Pc} kW, unity pf. Day: ${h1} h full load, ${h2} h half load, ${h0} h no load. All-day efficiency:`, [`${a.toFixed(2)} %`, `Output ${sig(out)} kWh; losses ${Pi} × 24 + ${Pc} × ${h1} + ${Pc}/4 × ${h2} = ${sig(Pi * 24 + cu)} kWh → ${a.toFixed(2)} %.`], ds.map(d => [`${d[0].toFixed(2)} %`, d[1]]), G); },
  ];
  const tagged = (arr, tags) => arr.map((f, i) => { const g = () => ({ ...f(), tag: tags[i] }); g.tag = tags[i]; return g; });
  const AR = [['Both A and R are true, and R explains A', 0], ['Both A and R are true, but R does not explain A', 1], ['A is true, R is false', 2], ['A is false, R is true', 3]];
  const ar = (A, R, k, why, wrong, tag) => mk(`<b>Assertion (A):</b> ${A}<br><b>Reason (R):</b> ${R}`, [AR[k][0], why], AR.filter(x => x[1] !== k).map(x => [x[0], wrong[x[1]] || 'Does not match the facts above.']), W, tag);
  const L3 = [
    () => ar('A 50 Hz transformer overheats on a 40 Hz supply at rated voltage.', 'Φm ∝ V/f rises, the core saturates and the magnetising current and core loss rise.', 0, 'Both true, and the flux rise is exactly why it overheats.', { 1: 'R is the cause of A.', 2: 'R is true: Φm ∝ V/f.', 3: 'A is true — the core runs above rated flux.' }),
    () => ar('Core loss of a transformer is practically constant at all loads.', 'Core loss depends on V and f, which do not change with load.', 0, 'Both true; R is the reason.', { 1: 'R is precisely why A holds.', 2: 'R is true.', 3: 'A is true.' }),
    () => ar('Voltage regulation of a transformer can be negative.', 'At leading pf the I X sin φ term subtracts from I R cos φ.', 0, 'Both true; at leading pf with tan φ > R/X the regulation is negative.', { 1: 'R explains A directly.', 2: 'R is true.', 3: 'A is true.' }),
    () => ar('The secondary of a CT must never be opened while the primary carries current.', 'With no secondary mmf, the whole primary current magnetises the core — very high flux and induced voltage.', 0, 'Both true; R explains A (book: SHORT/OPEN rule).', { 1: 'R is the explanation.', 2: 'R is true.', 3: 'A is true.' }),
    () => ar('Eddy-current loss does not change when frequency changes at constant voltage.', 'Pe ∝ (f Bm)² and Bm ∝ V/f, so Pe ∝ V².', 0, 'Both true; R explains A.', { 1: 'R derives A exactly.', 2: 'R is true.', 3: 'A is true.' }),
    () => ar('A transformer always has maximum efficiency at full load.', 'Maximum efficiency occurs when copper loss equals core loss.', 3, 'A is false: max η is at x = √(Pi/Pcu,FL), full load only if Pi = Pcu,FL. R is true.', { 0: 'A is false.', 1: 'A is false.', 2: 'R is true and A is false.' }),
    () => ar('All-day efficiency of a distribution transformer is lower than its full-load efficiency.', 'Core loss occurs for all 24 hours while output is small for many hours.', 0, 'Both true; the 24-hour core loss with light load is why.', { 1: 'R is the reason.', 2: 'R is true.', 3: 'A is true.' }),
    () => ar('If N₂ is doubled while the load takes the same power, the primary current also doubles.', 'In an ideal transformer V₁I₁ = V₂I₂.', 3, 'A is false: same power and same V₁ → same I₁ (I₂ halves). R is true.', { 0: 'A is false.', 1: 'A is false.', 2: 'R is true.' }),
    () => ar('When frequency is raised with V/f constant, core loss increases.', 'With Bm constant, Ph ∝ f and Pe ∝ f².', 0, 'Both true; R explains A.', { 1: 'R is the reason.', 2: 'R is true.', 3: 'A is true.' }),
    () => mk('Two transformers in parallel with ohmic impedances Z₁ < Z₂ (same ratio) share a load. Which takes more load?', ['The one with smaller impedance Z₁', 'S₁ = S Z₂/(Z₁ + Z₂): load shares inversely to impedance.'], [['The one with larger impedance', 'Load divides inversely to impedance.'], ['They share equally', 'Only if Z₁ = Z₂.'], ['The one with higher kVA rating, whatever its impedance', 'Sharing follows impedance, not rating.']], W),
    () => mk('A transformer rated 220 V, 50 Hz is used at 110 V, 60 Hz. The flux density becomes about', ['0.42 × rated', 'Bm ∝ V/f: (110/60)/(220/50) = 0.417.'], [['0.5 × rated', 'That ignores the frequency change.'], ['0.6 × rated', 'That is (110/220) × (60/50) — f must divide.'], ['unchanged', 'V/f changed from 4.4 to 1.83.']], 'Same numbers as GATE 2026 Q31 in your book (Bm ∝ V/f)'),
  ];
  const BOOKS = [
    ...D.mcqs.map((m, k) => { const L = (plain(m.ans).match(/\(([a-d])\)/) || [])[1], right = m.opts.find(o => plain(o).startsWith(`(${L})`)) || '';
      return { id: `book:ch${k + 1}`, src: `Chapter practice MCQ ${k + 1} · Vol 2`, q: m.q.replace(/^Q\d+\.\s*/, ''), opts: m.opts, r: L, why: plain(m.ans).replace(/^Ans:\s*\([a-d]\)\s*/, '').replace(plain(right).replace(/^\([a-d]\)\s*/, ''), '').trim() || plain(m.ans), wrong: [] }; }),
    ...D.pyq.map(m => ({ id: `book:${m.src}`, src: m.src, q: m.q.replace(/^\d+\.\s*/, ''), opts: m.opts, r: (m.ans.match(/\((\d)\)/) || [])[1], why: m.why, wrong: m.wrong })),
    ...D.qbank.map(m => ({ id: `book:${m.src}`, src: m.src, q: m.q, opts: m.opts, r: m.r, why: m.why, wrong: m.wrong })),
  ].map(m => {
    const lab = o => (plain(o).match(/^\(([a-dA-D1-4])\)/) || [])[1];
    const f = () => {
      const opts = m.opts.map(o => { const l = lab(o), w = m.wrong.find(x => plain(x).startsWith(`(${l})`)); return [o.replace(/^\s*\([a-dA-D1-4]\)\s*/, ''), l === m.r ? m.why : w ? w.replace(/^\s*\([a-dA-D1-4]\)\s*/, '') : '']; });
      return { q: m.q, opts, a: m.opts.findIndex(o => lab(o) === m.r), src: `From your book — ${m.src}`, tag: f.tag, id: m.id };
    };
    f.tag = tagOf(plain(m.q + ' ' + m.opts.join(' '))); f.id = m.id;
    return f;
  });
  const BOOKQ = () => BOOKS;

  /* ----- questions for modules 8–12 (written for this page; numbers computed by code) ----- */
  const L1X = [
    [() => mk('In a Dy11 transformer the LV voltage', ['leads the HV voltage by 30°', 'Clock 11: LV lags by 11 × 30° = 330°, i.e. leads by 30° (group IV, +30°).'], [['lags the HV voltage by 30°', 'That is Dy1 (clock 1).'], ['is in phase with the HV voltage', 'That is group I (Yy0, Dd0, Dz0).'], ['is 180° out of phase', 'That is group II (Yy6, Dd6).']], W, 'ph3'), 'ph3'],
    [() => mk('Which pair can be paralleled directly (equal ratios and impedances)?', ['Yd1 and Dy1', 'Both are group III (−30°): the same phase shift.'], [['Yd1 and Yd11', 'Groups III and IV differ by 60°; your book: only with a phase-sequence swap.'], ['Yy0 and Yd1', '0° and −30°: a 30° shift drives a large circulating current.'], ['Dd0 and Dd6', '0° and 180°: a dead short circuit.']], W, 'ph3'), 'ph3'],
    [() => mk('Three 100 kVA single-phase units are in Δ–Δ. One is removed (open delta). The bank can now supply', ['173.2 kVA', 'Open delta = √3 × 100 = 173.2 kVA: 57.7 % of 300 kVA (86.6 % of the two units).'], [['200 kVA', 'Two units in V–V carry only 86.6 % of their own rating.'], ['150 kVA', 'Not √3 × one unit.'], ['100 kVA', 'Two units still give √3 × one unit.']], W, 'ph3'), 'ph3'],
    [() => mk('For a star-connected winding', ['V_L = √3 V_ph and I_L = I_ph', 'Line voltage is the phasor difference of two phase voltages 120° apart.'], [['V_L = V_ph and I_L = √3 I_ph', 'That is delta.'], ['V_L = 3 V_ph', 'The factor is √3.'], ['V_L = V_ph / √3', 'Inverted.']], W, 'ph3'), 'ph3'],
    [() => mk('Compared with a two-winding transformer of the same output, an autotransformer saves', ['k × the copper, where k = V_low / V_high', 'Your book: copper saving = k × (Cu of 2-winding).'], [['(1 − k) × the copper', 'That is the copper the autotransformer still needs.'], ['k² × the copper', 'Not squared.'], ['always 50 % of the copper', 'It depends on the ratio.']], W, 'auto'), 'auto'],
    [() => mk('An autotransformer is most economical when V_low / V_high is', ['close to 1', 'Copper saved = k, largest when k → 1.'], [['close to 0', 'Then almost nothing is saved.'], ['exactly 0.5', 'That saves only 50 %.'], ['any value — the saving does not depend on it', 'It does: saving = k.']], W, 'auto'), 'auto'],
    [() => mk('Two transformers with equal per-unit impedance (same X/R) run in parallel. They share the load', ['in proportion to their kVA ratings', 'Equal % impedance on own rating → ohmic impedance ∝ 1/rating → share ∝ rating.'], [['equally', 'Only if the ratings are equal.'], ['inversely to their kVA ratings', 'Reversed.'], ['in proportion to their % impedance', 'Load divides inversely to impedance.']], W, 'par'), 'par'],
    [() => mk('Magnetising inrush current of a transformer is rich in', ['the 2nd harmonic', 'Inrush is one-sided, so even harmonics (mainly the 2nd) are large; differential relays use 2nd-harmonic restraint (your book, Vol 3 p 759).'], [['the 3rd harmonic only', 'The 3rd is in the steady magnetising current; inrush is marked by the 2nd.'], ['the 5th harmonic', 'Not the main one.'], ['no harmonics', 'It is highly distorted.']], W, 'sat'), 'sat'],
    [() => mk('Inrush is worst when the transformer is switched on at', ['a voltage zero', 'Peak flux = Φm(1 + cos α) + Φr: 2Φm + Φr at α = 0°.'], [['a voltage peak', 'Then the flux starts at its normal value — little inrush.'], ['any instant — it does not matter', 'It depends strongly on the switching instant.'], ['full load only', 'Inrush is set by the switching instant and residual flux, not the load.']], W, 'sat'), 'sat'],
    [() => mk('Transformer hum is heard at', ['2f (100 Hz on 50 Hz)', 'Magnetostriction: laminations change length twice per cycle (your book).'], [['f', 'Twice per cycle, so 2f.'], ['3f', 'No.'], ['f/2', 'No.']], W, 'sat'), 'sat'],
    [() => mk('At no load the input power factor of a transformer is low because', ['Iμ is much larger than Iw', 'The no-load input is mostly reactive (magnetising); Iw only supplies core loss.'], [['copper loss is large', 'Copper loss is negligible at no load.'], ['V₂ is zero', 'V₂ is not zero; I₂ is.'], ['the flux is zero at no load', 'The flux is full at no load.']], W, 'noload'), 'noload'],
    [() => mk('On the phasor diagram for a lagging load, V₁ (referred) is', ['V₂′ plus the I₂′R and I₂′X drops, and larger than V₂′', 'V₁ = V₂′ + I₂′(R₀₁ + jX₀₁).'], [['smaller than V₂′', 'That can happen only at leading pf.'], ['in phase with I₁', 'Only at unity input pf.'], ['always equal to V₂′', 'Not on load.']], W, 'noload'), 'noload'],
  ];
  const L2X = [
    [() => { const S = rnd([25, 50, 100, 200, 500]), V = rnd([381, 415, 433, 3300, 6600, 11000]), a = S * 1000 / (3 * V);
      const ds = pick3(a, [[S * 1000 / (r3 * V), 'That is the line current; a delta winding carries I_L/√3.'], [S * 1000 / V, 'Missing the three phases.'], [S * 1000 / (r3 * V) * r3, 'Multiplied instead of dividing by √3.']]);
      return mk(`A 3-φ, ${S} kVA transformer has its ${V} V winding in delta. The current in each phase of that winding at full load is`, [`${sig(a)} A`, `I_ph = S / (3 V_ph) = ${S}000 / (3 × ${V}) = ${sig(a)} A.`], ds.map(d => [`${sig(d[0])} A`, d[1]]), G, 'ph3'); }, 'ph3'],
    [() => { const V = rnd([3300, 6600, 11000, 33000]), n = rnd([5, 10, 15, 20, 25, 30]), c = rnd(['Dy', 'Yd', 'Yy', 'Dd']), f = { Dy: r3, Yd: 1 / r3, Yy: 1, Dd: 1 }[c], a = V * f / n;
      const others = [[V * r3 / n, '√3/n is for delta–star only.'], [V / (r3 * n), '1/(√3 n) is for star–delta only.'], [V / n, 'That ignores the connection.'], [V * 3 / n, 'The factor is √3, not 3.']];
      const ds = pick3(a, others);
      return mk(`A 3-φ ${c} transformer: HV line ${V} V, turns ratio per phase N₁/N₂ = ${n}. The LV line voltage is`, [`${sig(a)} V`, `${c === 'Dy' ? 'V_L2 = √3 × V_L1/n' : c === 'Yd' ? 'V_L2 = V_L1/(√3 n)' : 'V_L2 = V_L1/n'} = ${sig(a)} V.`], ds.map(d => [`${sig(d[0])} V`, d[1]]), G, 'ph3'); }, 'ph3'],
    [() => { const S = rnd([5, 10, 15, 20, 25, 50]), VH = rnd([200, 220, 400, 1100, 2400]), r = rnd([2, 4, 5, 10]), VL = VH / r, serL = Math.random() < 0.6, Vs = serL ? VL : VH, Vc = serL ? VH : VL, Vo = VH + VL, a = S * Vo / Vs;
      const ds = pick3(a, [[S * Vo / Vc, 'Divide by the series winding voltage, not the common one.'], [S, 'The autotransformer handles more than the two-winding rating.'], [S * VH / VL, 'Use V_out/V_series.']]);
      return mk(`A ${S} kVA, ${VH}/${sig(VL)} V two-winding transformer is reconnected as an autotransformer with the ${serL ? 'LV' : 'HV'} winding in series (${sig(Vo)}/${sig(Vc)} V). Its rating is`, [`${sig(a)} kVA`, `S_auto = S × V_out / V_series = ${S} × ${sig(Vo)} / ${sig(Vs)} = ${sig(a)} kVA.`], ds.map(d => [`${sig(d[0])} kVA`, d[1]]), G, 'auto'); }, 'auto'],
    [() => { const S1 = rnd([200, 250, 500]), S2 = rnd([100, 250, 300]), z1 = rnd([4, 5, 6]), z2 = rnd([4, 5, 6, 8]), S = rnd([300, 400, 500]), y1 = S1 / z1, y2 = S2 / z2, a = S * y1 / (y1 + y2);
      const ds = pick3(a, [[S * S1 / (S1 + S2), 'That ignores the impedances — true only if the % impedances are equal.'], [S * y2 / (y1 + y2), 'That is T₂\'s share.'], [S / 2, 'Equal shares only for identical transformers.']]);
      return mk(`T₁: ${S1} kVA, ${z1} % impedance; T₂: ${S2} kVA, ${z2} % impedance (same X/R). They share ${S} kVA. T₁ carries`, [`${sig(a)} kVA`, `Share ∝ S_rated / z%: ${S1}/${z1} : ${S2}/${z2} → S₁ = ${S} × ${sig(y1)} / ${sig(y1 + y2)} = ${sig(a)} kVA.`], ds.map(d => [`${sig(d[0])} kVA`, d[1]]), G, 'par'); }, 'par'],
  ];
  const L3X = [
    [() => ar('A Y–y bank with an isolated neutral and no delta winding gives peaky phase voltages.', 'The triplen magnetising currents have no path, so the flux carries a 3rd harmonic.', 0, 'Both true, and R is the reason (your book: a tertiary delta winding cures it).', { 1: 'R is the cause.', 2: 'R is true.', 3: 'A is true.' }, 'ph3'), 'ph3'],
    [() => ar('Transformer differential relays use 2nd-harmonic restraint.', 'Magnetising inrush current contains a large 2nd harmonic.', 0, 'Both true; R explains A (your book, Vol 3 p 759).', { 1: 'R is the reason.', 2: 'R is true.', 3: 'A is true.' }, 'sat'), 'sat'],
    [() => ar('Vector groups III and IV can never be paralleled.', 'Their phase shifts are −30° and +30°.', 3, 'A is false: your book says III with IV works with a phase-sequence swap. R is true.', { 0: 'A is false.', 1: 'A is false.', 2: 'R is true.' }, 'ph3'), 'ph3'],
    [() => ar('An autotransformer saves more copper as its ratio approaches 1.', 'Copper saved = k = V_low / V_high.', 0, 'Both true; R explains A.', { 1: 'R is the formula behind A.', 2: 'R is true.', 3: 'A is true.' }, 'auto'), 'auto'],
    [() => ar('In parallel operation the transformer with the lower per-unit impedance takes more than its share.', 'Load divides inversely to impedance.', 0, 'Both true; R explains A.', { 1: 'R is the reason.', 2: 'R is true.', 3: 'A is true.' }, 'par'), 'par'],
  ];

  const L1T = [...tagged(L1, ['emf', 'emf', 'turns', 'test', 'loss', 'eff', 'imp', 'noload', 'loss', 'emf', 'emf', 'test']), ...L1X.map(([f, t]) => { f.tag = t; return f; })];
  const L2T = [...tagged(L2, ['emf', 'cur', 'imp', 'eff', 'eff', 'reg', 'loss', 'test', 'test', 'eff']), ...L2X.map(([f, t]) => { f.tag = t; return f; })];
  const L3T = [...tagged(L3, ['emf', 'loss', 'reg', 'prot', 'loss', 'eff', 'eff', 'cur', 'loss', 'par', 'emf']), ...L3X.map(([f, t]) => { f.tag = t; return f; })];
  window.TFQ = {
    TAGS, tagOf,
    levels: { 1: [...L1T, L1dir, L1dir, L1dir], 2: L2T, 3: [...L3T, ...BOOKS] },
    all: () => [...L1T, L1dir, ...L2T, ...L3T, ...BOOKS],
    byTag: tag => [...L1T, ...L2T, ...L3T, ...BOOKS].filter(f => f.tag === tag),
    byId: id => { const f = BOOKS.find(b => b.id === id); return f ? f() : null; },
  };

  /* ================= revision table ================= */
  const REV = [
    ['EMF and flux', [['E = 4.44 f N Φm', 'V', 'E ∝ f N Φm', 'sinusoidal flux; rms emf', '4.44 = 4 × 1.11'], ['Φm = V / (4.44 f N₁)', 'Wb', 'Φm ∝ V/f', 'E₁ ≈ V₁', 'Keep V/f constant → flux constant'], ['Bm = Φm / A', 'T', 'Bm ∝ V/(f N A)', '—', 'Saturation depends on Bm'], ['Volts per turn = 4.44 f Φm', 'V/turn', 'same on both windings', '—', 'Quick turns calculation']]],
    ['Voltage and turns', [['V₂/V₁ = E₂/E₁ = N₂/N₁ = K', '—', 'V₂ ∝ N₂, ∝ 1/N₁', 'ideal (no drop)', 'K > 1 step-up'], ['f₂ = f₁', 'Hz', 'no change', 'always', 'A transformer never changes f']]],
    ['Current', [['I₁/I₂ = N₂/N₁ = K', '—', 'I ∝ 1/N', 'ideal; I₀ neglected', 'HV side: fewer amps'], ['N₁I₁ = N₂I₂', 'AT', 'mmf balance', 'load component', 'Load mmf cancelled by primary'], ['I₀ = √(Iw² + Iμ²)', 'A', 'Iμ ∝ Φm', 'no load', 'I₀ is a few % of rated'], ['I = kVA×1000/V; ÷ √3 V_L for 3-φ', 'A', 'I ∝ kVA, ∝ 1/V', 'rated values', 'Do not forget √3']]],
    ['Power', [['S = V₁I₁ = V₂I₂', 'VA', 'same both sides', 'ideal', 'Same kVA rating'], ['P₂ = V₂I₂ cos φ', 'W', '∝ cos φ', 'pf set by the load', '—'], ['P₁ = P₂ + Pi + Pcu', 'W', '—', '—', 'Losses are the difference']]],
    ['Impedance', [['R₀₁ = R₁ + R₂(N₁/N₂)²', 'Ω', '∝ (turns ratio)²', '—', 'More turns → multiply'], ['X₀₁ = X₁ + X₂(N₁/N₂)², Z₀₁ = √(R₀₁² + X₀₁²)', 'Ω', '—', '—', '—'], ['R₀₂ = R₂ + R₁(N₂/N₁)²', 'Ω', '—', '—', 'Fewer turns → divide'], ["Z' = Z_L(N₁/N₂)²", 'Ω', '∝ (N₁/N₂)²', 'ideal', 'Impedance matching']]],
    ['Losses', [['Ph = kh f Bm^1.6 · vol', 'W', '∝ f Bm^1.6', 'Steinmetz', 'Silicon steel lowers it'], ['Pe = ke f² Bm² t² · vol', 'W', '∝ (f Bm t)² ∝ V² t²', '—', 'Laminations: ∝ t²'], ['Fixed V: Ph ∝ f^−0.6, Pe constant', 'W', 'Bm ∝ 1/f', 'V fixed', 'f ↑ → core loss ↓'], ['Fixed V/f: Ph ∝ f, Pe ∝ f²', 'W', 'Bm constant', 'V/f fixed', 'P/f = A + Bf separates them'], ['Pcu = I²R₀₂ = x² Pcu,FL', 'W', '∝ I²', '—', 'Half load → ¼ Cu loss']]],
    ['Efficiency', [['η = xS cos φ / (xS cos φ + Pi + x² Pcu,FL)', '—', '—', '—', 'Include cos φ'], ['Max η: Pcu = Pi, x = √(Pi/Pcu,FL)', '—', '—', '—', 'Pi : Pcu = 1 : 4 → half load'], ['η_AD = kWh out / kWh in (24 h)', '—', '—', 'load cycle', 'Core loss for all 24 h'], ['Same kVA, lower cos φ → lower η', '—', '—', 'same losses', 'Max η at unity pf']]],
    ['Voltage regulation', [['% Reg ≈ (I R cos φ ± I X sin φ)/V × 100', '%', '+ lag, − lead', 'approx.', 'Use one side\'s values'], ['ε = εr cos φ ± εx sin φ', '%', '—', 'per unit', 'GATE favourite'], ['Zero regulation: tan φ = R/X (leading)', '—', '—', '—', 'Negative beyond it'], ['Maximum regulation: tan φ = X/R (lagging) = εz', '%', '—', '—', 'cos φ = R/Z']]],
    ['OC and SC tests', [['OC: W₀ = Pi, cos φ₀ = W₀/(V₀I₀)', 'W', '—', 'LV side, HV open, rated V', 'Wattmeter reads core loss'], ['Iw = I₀ cos φ₀, Iμ = I₀ sin φ₀; R₀ = V₀/Iw, X₀ = V₀/Iμ', 'A, Ω', '—', '—', 'Shunt branch'], ['SC: W_sc = Pcu,FL, R_eq = W_sc/I_sc²', 'W, Ω', '—', 'HV side, LV shorted, rated I', '5–10 % voltage'], ['Z_eq = V_sc/I_sc, X_eq = √(Z_eq² − R_eq²)', 'Ω', '—', '—', 'Cu loss at I: W_sc (I/I_sc)²']]],
    ['Equivalent circuit', [['Exact: R₁ + jX₁ — shunt (R₀ ∥ X₀) — R₂′ + jX₂′', '—', '—', '—', 'Shunt branch carries I₀'], ['Approximate: shunt branch at the input; series R₀₁ + jX₀₁', '—', '—', 'I₀ ≪ I₁', 'Used for η and regulation']]],
  ];

  /* ================= render ================= */
  const TABS = [['wf', 'What happens if I change this?'], ...Object.entries(MODT).map(([k, t], i) => [k, `${i + 1} ${t}`]), ['fx', 'Formula explorer'], ['pr', 'Exam practice'], ['rv', 'Revision table']];
  root.innerHTML = `<div class="sm-top"><div class="sm-left"><div class="box sm-stage"><div class="sm-dg"></div><div class="sm-dgbar"><span>Compare with the start of your last change:</span><span class="up">↑ increased</span><span class="dn">↓ decreased</span><span class="eq">→ no change</span><button class="btn" id="sm-reset">Reset</button></div></div><div class="box sm-out"></div></div>
    <div class="box sm-ctl"><div class="sm-cs">${IN.map(ctl).join('')}<div class="sm-c sm-span"><label>Power factor type</label><div class="seg" id="sm-pt"><button data-v="lag">Lagging</button><button data-v="unity">Unity</button><button data-v="lead">Leading</button></div></div>
      <div class="sm-c sm-span"><label>Load behaves as</label><div class="seg" id="sm-lm"><button data-v="Z">Same impedance</button><button data-v="I">Same current</button><button data-v="P">Same power</button></div><small class="sm-note">Used when V, f or turns change. A heater or motor winding ≈ same impedance.</small></div></div>
      <details class="sm-more"><summary>More inputs: leakage reactance, rating, core loss</summary><div class="sm-cs">${MORE.map(ctl).join('')}</div></details></div></div>
    <nav class="sm-tabs" role="tablist">${TABS.map(([k, t]) => `<button role="tab" data-t="${k}" aria-selected="false">${t}</button>`).join('')}</nav>
    <div class="sm-panel box"></div>`;
  let tab = 'wf', base = null, wfp = 'f', wfu = true, wfvf = false, prl = 1, prq = null, prs = { r: 0, n: 0 };

  function syncInputs(o) {
    $$('.sm-c[data-k]').forEach(c => {
      const k = c.dataset.k, v = getIn(k, o), [r, n] = c.querySelectorAll('input');
      if (k === 'I2') { const mx = Math.ceil(o.I2r * 1.5 * 100) / 100; r.max = n.max = mx; }
      if (document.activeElement !== n) n.value = +(+v).toFixed(Math.max(0, -Math.floor(Math.log10(+r.step))));
      r.value = v;
    });
    $$('#sm-pt button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st.pt)));
    $$('#sm-lm button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st.load)));
    $('#sm-pf').disabled = st.pt === 'unity'; $('.sm-c[data-k="pf"] input[type=number]').disabled = st.pt === 'unity';
  }
  function setIn(k, v) {
    if (!Number.isFinite(v)) return;
    if (k === 'phi') st.V1 = clamp(4.44 * st.f * st.N1 * v / 1000, 50, 20000);
    else if (k === 'I2') setLoad(st, Math.max(0, v));
    else if (k === 'N1' || k === 'N2') st[k] = Math.max(1, v);
    else if (k === 'f') st.f = Math.max(1, v);
    else st[k] = v;
  }
  function readouts(o) {
    const b = base;
    $('.sm-out').innerHTML = OUT.map(([k, l, u, m]) => {
      const v = o[k] * m, d = b ? dirOf(b[k], o[k]) : 0;
      return `<div class="sm-r ${d > 0 ? 'u' : d < 0 ? 'd' : ''}"><span>${l}</span><b>${sig(v)}${u ? ` <small>${u}</small>` : ''}</b>${b ? `<i>${d ? `${d > 0 ? '↑' : '↓'} ${chg(b[k] * m, v, u)}` : '→'}</i>` : ''}</div>`;
    }).join('') + `<p class="sm-note sm-wide">Max efficiency at ${sig(o.xm * 100)} % load (η = ${sig(o.etam)} %). Model: E₁ ≈ V₁, approximate equivalent circuit, a typical saturation curve for the magnetising current (shape assumed), Ph ∝ f Bm^1.6, Pe ∝ (f Bm)².</p>`;
  }
  let raf = 0;
  const update = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
  function render() {
    const o = solve(st);
    diagramUpdate(o);
    syncInputs(o); readouts(o);
    renderPanel(o, true);
  }
  function wfTable(o) {
    const rows = whatIf(st, wfp, wfu, wfp === 'f' && wfvf), held = Object.keys(PAR).filter(p => p !== wfp && p !== 'load').map(p => PAR[p][1]).join(', ');
    return `<p class="lead">Pick a quantity and a direction. Every other quantity is recalculated with the same model (change of 10 %). Held constant: ${held}${wfp === 'f' && wfvf ? ' — and V₁ moves with f so V/f stays fixed' : wfp === 'f' ? ', V₁' : ''}; the load is <b>${LOADN[st.load]}</b>.</p>
      <div class="sm-wfc"><div class="seg" id="sm-wfp">${Object.entries(PAR).map(([k, v]) => `<button data-v="${k}" aria-pressed="${k === wfp}">${v[1]}</button>`).join('')}</div>
      <div class="seg" id="sm-wfu"><button data-v="1" aria-pressed="${wfu}">↑ Increase</button><button data-v="0" aria-pressed="${!wfu}">↓ Decrease</button></div>
      ${wfp === 'f' ? `<label class="chk"><input type="checkbox" id="sm-vf" ${wfvf ? 'checked' : ''}> Change V₁ with f (V/f constant)</label>` : ''}
      <button class="btn" id="sm-apply">Apply this change to the simulator</button></div>
      <div class="sm-key"><span><b class="up">↑</b> increases</span><span><b class="dn">↓</b> decreases</span><span><b class="eq">→</b> no change</span><span><b class="dp">⚡</b> depends on how the load behaves</span></div>
      <div class="ctab"><table class="sm-wt"><thead><tr><th>${PAR[wfp][0]} ${wfu ? '↑' : '↓'}</th><th>Result</th><th>Before → after</th><th>Relationship</th><th>Why</th></tr></thead><tbody>
      ${rows.map(r => `<tr${r.dep ? ' class="dep"' : ''}><td>${ON[r.k][1]}</td><td>${ARROW(r.d)}${r.dep ? ' <b class="dp" title="depends on the load type">⚡</b>' : ''}</td><td>${sig(r.a)} → ${sig(r.b)} ${ON[r.k][2]}${r.d ? ` <small>(${chg(r.a, r.b, ON[r.k][2])})</small>` : ''}</td>
        <td>${r.rel}</td><td>${esc(r.why)}${r.dep ? `<br><small class="dp">Depends on the load: ${r.dirs.map(([m, d]) => `${LOADN[m]} ${d > 0 ? '↑' : d < 0 ? '↓' : '→'}`).join(' · ')}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>
      <h4 class="sm-h">Exam rules — each with its condition</h4>
      <div class="ctab"><table class="sm-wt"><thead><tr><th>Change</th><th>Quantity</th><th>Result</th><th>Relationship</th><th>Holds when</th></tr></thead><tbody>${RULES.map(r => `<tr${r[2] === 'dep' ? ' class="dep"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2] === 'up' ? '<b class="up">↑</b>' : r[2] === 'down' ? '<b class="dn">↓</b>' : r[2] === 'same' ? '<b class="eq">→</b>' : '<b class="dp">⚡</b>'}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div>
      ${(() => { const t = D.tables.find(x => /what if/i.test(x.title)); return t ? `<h4 class="sm-h">From your book — ${esc(t.title)} (Vol 2)</h4><div class="ctab"><table class="sm-wt"><thead><tr>${t.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''; })()}`;
  }
  const RULES = [
    ['V₁ ↑', 'Flux Φm', 'up', 'Φm ∝ V₁', 'f and N₁ fixed'], ['f ↑', 'Flux Φm', 'down', 'Φm ∝ 1/f', 'V₁ and N₁ fixed'], ['N₁ ↑', 'Flux Φm', 'down', 'Φm ∝ 1/N₁', 'V₁ and f fixed'], ['N₂ ↑', 'Flux Φm', 'same', 'set by V₁, f, N₁ only', 'primary unchanged'],
    ['N₂ ↑', 'Secondary voltage E₂', 'up', 'E₂ ∝ N₂', 'V₁, f, N₁ fixed'], ['N₁ ↑', 'Secondary voltage E₂', 'down', 'E₂ = V₁N₂/N₁', 'V₁, f, N₂ fixed'], ['f ↑', 'Secondary voltage E₂', 'same', 'ratio = turns ratio', 'V₁ fixed'],
    ['N₂ ↑', 'Secondary current I₂', 'dep', '↓ ∝ 1/N₂ for the same load power; ↑ ∝ N₂ for the same load impedance', 'depends on the load'], ['N₂ ↑', 'Primary current I₁', 'dep', 'unchanged for the same load power; ↑ ∝ N₂² for the same load impedance', 'V₁ fixed; depends on the load'],
    ['Load ↑', 'Secondary current I₂', 'up', 'I₂ is the load current', '—'], ['Load ↑', 'Primary current I₁', 'up', 'N₁I₁ ≈ N₂I₂ (+ I₀)', '—'], ['Load ↑', 'Flux Φm', 'same', 'Φm ≈ V₁/(4.44 f N₁)', 'V₁, f fixed (small primary drop neglected)'],
    ['Load ↑', 'Core loss', 'same', 'depends on V₁, f only', 'V₁, f fixed'], ['Load ↑', 'Copper loss', 'up', '∝ I² (x² Pcu,FL)', '—'], ['Load ↑', 'Efficiency', 'dep', 'rises until Pcu = Pi, then falls', 'peak at x = √(Pi/Pcu,FL)'],
    ['Load ↑', 'Terminal voltage V₂', 'dep', 'falls at lagging/unity pf; can rise at leading pf', 'R, X fixed'], ['f ↑', 'Hysteresis loss', 'down', 'Ph ∝ f Bm^1.6 ∝ f^−0.6', 'V₁ fixed'], ['f ↑', 'Eddy-current loss', 'same', 'Pe ∝ (f Bm)² ∝ V²', 'V₁ fixed'],
    ['f ↑', 'Core loss', 'dep', 'falls if V₁ is fixed; rises (Ph ∝ f, Pe ∝ f²) if V/f is fixed', 'what is held'], ['V₁ ↑', 'Core loss', 'up', 'Ph ∝ V^1.6, Pe ∝ V²', 'f fixed'], ['V₁ ↑ or f ↓', 'Magnetising current Iμ', 'up', '∝ Φm; much faster near saturation', '—'],
    ['cos φ ↓ (lagging)', 'Regulation', 'up', 'I(R cos φ + X sin φ)/V', 'same current; cos φ above R/Z'], ['Leading pf', 'Regulation', 'dep', 'falls; zero at tan φ = R/X, negative beyond', 'same current'],
    ['cos φ ↓', 'Efficiency', 'down', 'same losses, less output', 'same current (kVA)'], ['R ↑', 'Copper loss', 'up', 'Pcu = I²R', 'same current'], ['X ↑', 'Copper loss', 'same', 'reactance takes no real power', 'same current'],
    ['N₁/N₂ ↑', 'Load impedance seen from primary', 'up', "Z' = Z_L(N₁/N₂)²", '—'], ['Lamination thickness ↑', 'Eddy-current loss', 'up', 'Pe ∝ t²', 'same V, f'],
  ];
  function renderPanel(o, soft) {
    $$('.sm-tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    const P = $('.sm-panel');
    if (tab === 'wf') P.innerHTML = wfTable(o);
    else if (MODT[tab]) {
      if (!soft || !P.querySelector('.sm-mod')) P.innerHTML = `<div class="sm-mod"><h3 class="sm-mh">${MODT[tab]}</h3>${modCtl(tab)}<div class="sm-mb"></div>${EXPS[tab] ? expBtns(tab) : ''}${MODG[tab].length ? `<div class="sm-gs">${MODG[tab].map(graphBox).join('')}</div>` : ''}</div>`;
      P.querySelector('.sm-mb').innerHTML = modBody(tab, o) + modExtra(tab, o);
      P.querySelectorAll('.sm-pl').forEach(b => customPlot(b, o));
      labelTables(P);
      P.querySelectorAll('.sm-g[data-g]').forEach(b => chart(b, b.dataset.g));
    } else if (tab === 'fx') { if (!soft || !P.querySelector('.sm-fx')) P.innerHTML = fxHtml(o); else P.querySelectorAll('[data-fxe]').forEach(e => e.innerHTML = FX[+e.dataset.fxe].ex(o)); }
    else if (tab === 'pr') { if (!soft || !P.querySelector('.sm-pr')) { P.innerHTML = prShell(); newQ(); } }
    else if (tab === 'rv') { if (!soft || !P.querySelector('.sm-rv')) P.innerHTML = rvHtml(); }
    labelTables(P);
  }
  function labelTables(P) {
    P.querySelectorAll('table.sm-wt').forEach(t => { const hs = [...t.querySelectorAll('thead th')].map(h => h.textContent); t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if (i && hs[i]) td.dataset.l = hs[i]; })); });
  }
  const fxHtml = o => `<div class="sm-fx"><p class="lead">Each formula with its symbols and units, where it comes from, why it works, when to use it, an example using the simulator's numbers right now, and the past questions your book tags on it.</p>${FX.map((c, i) => {
    const qs = c.ch.length ? pyqList(c.ch) : [];
    return `<details class="sm-fc"><summary><b>${c.t}</b><span class="fx">${c.f}</span></summary><div class="sm-fcb">
      <table class="sm-t"><thead><tr><th>Symbol</th><th>Meaning</th><th>SI unit</th></tr></thead><tbody>${c.sym.map(s => `<tr><td class="fx">${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td></tr>`).join('')}</tbody></table>
      <p><b>Where it comes from:</b> ${c.from}</p><p><b>Why it works:</b> ${c.phys}</p><p><b>Use it when:</b> ${c.when}</p>
      <p class="sm-ex"><b>Example with the simulator now:</b> <span data-fxe="${i}">${c.ex(o)}</span></p>
      <p class="sm-mi"><b>Common mistakes:</b> ${c.mist}</p><p class="sm-tp"><b>Shortcut:</b> ${c.tip}</p>
      ${qs.length ? `<div class="sm-pq"><b>Asked in past papers (from your book — ${qs.length}):</b>${qs.map(r => `<div class="sm-pqr"><span class="ex ex-${r.g}">${esc(r.p)}</span> <b>Q${esc(r.q)}</b> · ${r.c}<div class="fx">${r.f.join('<br>')}</div><button class="btn sm-qa" data-a="${esc(r.a)}">Show answer</button></div>`).join('')}</div>` : c.key ? `<p class="sm-note">Key formula card ${c.key} in your book — its "see also" points to the TNEB AE 2018 paper, Q70.</p>` : ''}
    </div></details>`; }).join('')}</div>`;
  const prShell = () => `<div class="sm-pr"><div class="sm-prc"><div class="seg" id="sm-lv"><button data-v="1" aria-pressed="${prl === 1}">Level 1 · Basic concepts</button><button data-v="2" aria-pressed="${prl === 2}">Level 2 · GATE numericals</button><button data-v="3" aria-pressed="${prl === 3}">Level 3 · TNEB tricky & past questions</button></div><span class="score">Score ${prs.r}/${prs.n}</span></div><div class="sm-q"></div></div>`;
  function newQ() {
    const pool = window.TFQ.levels[prl];
    prq = rnd(pool)();
    $('.sm-q').innerHTML = `<div class="sm-qs">${esc(prq.src)}</div><div class="sm-qq">${prq.q}</div><div class="opts">${prq.opts.map((o, i) => `<button class="opt" data-i="${i}"><i>${'ABCD'[i]}</i><span>${o[0]}</span></button>`).join('')}</div><div class="sm-qe" hidden></div><button class="btn" id="sm-next">Next question →</button>`;
  }
  const rvHtml = () => `<div class="sm-rv"><p class="lead">Every important transformer formula on one table, with units, how it varies, when it holds, and the exam shortcut.</p>${REV.map(([g, rows], i) => `<h4 class="sm-h">${i + 1}. ${g}</h4><div class="ctab"><table class="sm-wt"><thead><tr><th>Formula</th><th>Units</th><th>Relationship</th><th>Assumptions</th><th>Exam shortcut</th></tr></thead><tbody>${rows.map(r => `<tr><td class="fx">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div>`).join('')}</div>`;

  /* ================= events ================= */
  const snap = () => { base = { ...solve(st), V1in: st.V1, fin: st.f }; };
  root.addEventListener('pointerdown', e => { if (e.target.closest('.sm-ctl input, .sm-ctl button')) snap(); });
  root.addEventListener('focusin', e => { if (e.target.closest('.sm-ctl input[type=number]')) snap(); });
  root.addEventListener('keydown', e => { if (e.target.closest('.sm-ctl input[type=range]') && !e.repeat) snap(); });
  root.addEventListener('input', e => {
    const c = e.target.closest('.sm-c[data-k]');
    if (c) { setIn(c.dataset.k, +e.target.value); update(); return; }
    const x = e.target.closest('[data-x]'); if (x && x.tagName !== 'BUTTON') setX(x.dataset.x, x.type === 'checkbox' ? x.checked : x.value, x);
  });
  root.addEventListener('change', e => {
    const h = e.target.closest('[data-h]');
    if (h) { st.hrs[+h.dataset.h] = clamp(+h.value || 0, 0, 24); $('.sm-mb').innerHTML = modBody('m5', solve(st)); }
  });
  root.addEventListener('click', e => {
    const t = e.target;
    const pt = t.closest('#sm-pt button'); if (pt) { snap(); st.pt = pt.dataset.v; update(); return; }
    const lm = t.closest('#sm-lm button'); if (lm) { snap(); st = sync(st); st.load = lm.dataset.v; update(); return; }
    if (t.closest('#sm-reset')) { st = { ...DEF, hrs: [...DEF.hrs] }; setLoad(st, solve(st).I2r); base = null; update(); return; }
    const tb = t.closest('.sm-tabs button'); if (tb) { tab = tb.dataset.t; renderPanel(solve(st), false); return; }
    const wp = t.closest('#sm-wfp button'); if (wp) { wfp = wp.dataset.v; renderPanel(solve(st), false); return; }
    const wu = t.closest('#sm-wfu button'); if (wu) { wfu = wu.dataset.v === '1'; renderPanel(solve(st), false); return; }
    if (t.closest('#sm-vf')) { wfvf = t.checked; renderPanel(solve(st), false); return; }
    if (t.closest('#sm-apply')) { snap(); st = perturb(sync(st), wfp, wfu ? 1.1 : 1 / 1.1, wfp === 'f' && wfvf); update(); root.querySelector('.sm-stage').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const ex = t.closest('[data-exp]');
    if (ex) {
      const [m, i] = ex.dataset.exp.split('.'), [p0, up] = EXPS[m][+i], p = p0 === 'fvf' ? 'f' : p0, vf = p0 === 'fvf';
      const rows = whatIf(st, p, up, vf).filter(r => r.d !== 0 || ['phi', 'Pi', 'E2', 'I1'].includes(r.k));
      snap(); st = perturb(sync(st), p, up ? 1.1 : 1 / 1.1, vf); update();
      requestAnimationFrame(() => requestAnimationFrame(() => { const box = root.querySelector('.sm-expres'); if (box) box.innerHTML = `<div class="sm-er"><b>${EXPS[m][+i][2]}</b> — applied to the simulator (Reset to undo). What changed:<ul>${rows.map(r => `<li>${ARROW(r.d)} ${ON[r.k][1]}: ${sig(r.a)} → ${sig(r.b)} ${ON[r.k][2]}${r.rel ? ` · <i>${r.rel}</i>` : ''}${r.dep ? ' <b class="dp">⚡ depends on the load type</b>' : ''}</li>`).join('')}</ul></div>`; }));
      return;
    }
    const xb = t.closest('button[data-x]'); if (xb) { setX(xb.dataset.x, xb.dataset.v, xb); return; }
    const pr = t.closest('[data-preset]');
    if (pr) {
      const [o, i] = pr.dataset.preset.split('.');
      if (o === 'au') Object.assign(AU, AUP[+i]);
      if (o === 'pa') Object.assign(PA, { mode: 'ohm', R1: 1, X1: 6, R2: 0.8, X2: 4.8, S: 1000, dE: 0 });
      renderPanel(solve(st), false); return;
    }
    const qa = t.closest('.sm-qa'); if (qa) { const on = !qa.classList.contains('on'); qa.classList.toggle('on', on); qa.textContent = on ? 'Answer: ' + plain(qa.dataset.a) : 'Show answer'; return; }
    const lv = t.closest('#sm-lv button'); if (lv) { prl = +lv.dataset.v; $$('#sm-lv button').forEach(b => b.setAttribute('aria-pressed', String(b === lv))); newQ(); return; }
    if (t.closest('#sm-next')) { newQ(); return; }
    const op = t.closest('.sm-q .opt');
    if (op && prq && !prq.done) {
      prq.done = 1; const i = +op.dataset.i, ok = i === prq.a; prs.n++; if (ok) prs.r++;
      window.TFP?.record({ id: prq.id, tag: prq.tag || 'other', ok, q: prq });
      $$('.sm-q .opt').forEach((b, j) => { if (j === prq.a) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
      const E = $('.sm-qe'); E.hidden = false;
      E.innerHTML = `<p><b class="${ok ? 'up' : 'dn'}">${ok ? 'Correct.' : 'Not quite.'}</b> <b>${'ABCD'[prq.a]}</b> — ${prq.opts[prq.a][1]}</p>${prq.opts.map((o, j) => j === prq.a ? '' : `<p class="w">✘ <b>${'ABCD'[j]}</b> ${o[0]} — ${o[1] || 'the book gives no separate note for this option — see the working for the right answer.'}</p>`).join('')}`;
      $('.sm-pr .score').textContent = `Score ${prs.r}/${prs.n}`;
    }
  });
  // Pause the diagram animation when it is off screen.
  const stage = root.querySelector('.sm-stage');
  new IntersectionObserver(es => es.forEach(e => stage.classList.toggle('paused', !e.isIntersecting))).observe(stage);
  document.addEventListener('tf:pane', e => { if (e.detail === 'sim') renderPanel(solve(st), true); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => renderPanel(solve(st), true), 200); });
  diagramInit(); render();
})();
