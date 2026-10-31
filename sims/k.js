/* Control Systems and Measurements labs. Checks are the book's numbers. */
(() => {
  const PI = Math.PI, sq = Math.sqrt, deg = x => x * 180 / PI, rad = x => x * PI / 180, ln = Math.log;
  // unit-step response of ωn²/(s² + 2ζωn s + ωn²)
  const step2 = (t, z, w) => {
    if (z < 1 - 1e-6) { const d = w * sq(1 - z * z), th = Math.acos(z); return 1 - Math.exp(-z * w * t) * Math.sin(d * t + th) / sq(1 - z * z); }
    if (z > 1 + 1e-6) { const r = w * sq(z * z - 1), p1 = -z * w + r, p2 = -z * w - r; return 1 - (p2 * Math.exp(p1 * t) - p1 * Math.exp(p2 * t)) / (p2 - p1); }
    return 1 - (1 + w * t) * Math.exp(-w * t);
  };
  const spec2 = (z, w) => ({
    wd: z < 1 ? w * sq(1 - z * z) : 0, Mp: z < 1 ? Math.exp(-PI * z / sq(1 - z * z)) * 100 : 0, tp: z < 1 ? PI / (w * sq(1 - z * z)) : NaN,
    tr: z < 1 ? (PI - Math.acos(z)) / (w * sq(1 - z * z)) : NaN, ts2: 4 / (z * w), ts5: 3 / (z * w),
    wb: w * sq(1 - 2 * z * z + sq(4 * z ** 4 - 4 * z * z + 2)), Mr: z < 0.707 ? 1 / (2 * z * sq(1 - z * z)) : 1, wr: z < 0.707 ? w * sq(1 - 2 * z * z) : 0 });
  const damp = z => Math.abs(z - 1) < 1e-6 ? 'critically damped' : z > 1 ? 'overdamped' : z === 0 ? 'undamped' : 'underdamped';
  // roots of a real polynomial (highest power first) by Durand–Kerner
  function roots(c) {
    const n = c.length - 1, a = c.map(x => x / c[0]); let r = Array.from({ length: n }, (_, k) => [0.4 * Math.cos(2.1 * k + 0.3), 0.9 * Math.sin(2.1 * k + 0.3)]);
    const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]], div = (p, q) => { const d = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
    for (let it = 0; it < 500; it++) r = r.map((x, i) => { let f = [1, 0]; for (let k = 1; k <= n; k++) f = [mul(f, x)[0] + a[k], mul(f, x)[1]]; let d = [1, 0]; r.forEach((y, j) => { if (j !== i) d = mul(d, [x[0] - y[0], x[1] - y[1]]); }); const q = div(f, d); return [x[0] - q[0], x[1] - q[1]]; });
    return r;
  }
  const rootStr = r => r.map(([x, y]) => Math.abs(y) < 1e-6 ? `${+x.toFixed(3)}` : `${+x.toFixed(3)} ${y < 0 ? '−' : '+'} j${+Math.abs(y).toFixed(3)}`).join(', ').replace(/-/g, '−');

  /* ---------- Control Systems ---------- */
  lab(767, { n: 'Second-order system — step response and specs', rf: 'Standard 2nd-order', c: 'From s² + 2ζωn s + ωn²: Mp = e^(−πζ/√(1 − ζ²)), tp = π/ωd, tr = (π − cos⁻¹ζ)/ωd, ts = 4/ζωn (2 %). ζ = 1 is the fastest response without overshoot.',
    i: [['a1', 'Coefficient of s (2ζωn)', '', 8, 0, 100, 0.01], ['a0', 'Constant term (ωn²)', '', 64, 0.01, 10000, 0.01, 'log']],
    o: [['wn', 'ωn', 'rad/s', v => sq(v.a0)], ['z', 'Damping ratio ζ', '', v => v.a1 / (2 * v.wn)], ['ty', 'Response', '', v => damp(v.z)], ['wd', 'Damped frequency ωd', 'rad/s', v => spec2(v.z, v.wn).wd], ['Mp', 'Peak overshoot', '%', v => spec2(v.z, v.wn).Mp], ['tp', 'Peak time', 's', v => spec2(v.z, v.wn).tp],
      ['tr', 'Rise time', 's', v => spec2(v.z, v.wn).tr], ['ts', 'Settling time (2 %)', 's', v => spec2(v.z, v.wn).ts2], ['ts5', 'Settling time (5 %)', 's', v => spec2(v.z, v.wn).ts5], ['Mr', 'Resonant peak Mr', '', v => spec2(v.z, v.wn).Mr], ['wb', 'Bandwidth ωb', 'rad/s', v => spec2(v.z, v.wn).wb]],
    plot: { x: ['t', 'Time', 's', 0, 2, ''], y: [['unit-step response', (t, v) => step2(t, v.z, v.wn)]], yl: 'Output for a unit step', mark: v => v.tp },
    ck: [[{ a1: 8, a0: 64 }, { z: 0.5, wn: 8, Mp: 16.3, tp: 0.453, ts: 1 }, 'Vol 3 p 787 · Sum 8'], [{ a1: 8, a0: 64 }, { tr: 0.302 }, 'Vol 3 p 787 · Sum 9'], [{ a1: 10, a0: 100 }, { wb: 12.7 }, 'Vol 3 p 786 · Sum 6'],
      [{ a1: 2, a0: 4 }, { wn: 2, z: 0.5, Mp: 16.3, ts: 4 }, 'Vol 3 p 772 · key-formula example'], [{ a1: 4, a0: 16 }, { z: 0.5 }, 'Vol 3 p 772 · one-minute sum'], [{ a1: 6, a0: 9 }, { z: 1, ty: 'critically damped' }, 'Vol 3 p 772 · one-minute sum']] });
  lab(767, { n: 'Unity feedback around K/[s(s + a)]', rf: 'Unity feedback', c: 'Closed loop s² + as + K: ωn = √K, ζ = a/(2√K). Raising K speeds it up but cuts ζ (more overshoot). Type 1: zero step error, ramp error a/K. Phase margin = 90° − tan⁻¹(ωgc/a).',
    i: [['K', 'Gain K', '', 10, 0.1, 10000, 0.1, 'log'], ['a', 'Pole a', '', 2, 0.1, 100, 0.1]],
    o: [['wn', 'ωn', 'rad/s', v => sq(v.K)], ['z', 'ζ', '', v => v.a / (2 * v.wn)], ['Mp', 'Peak overshoot', '%', v => spec2(v.z, v.wn).Mp], ['ts', 'Settling time (2 %)', 's', v => spec2(v.z, v.wn).ts2], ['es', 'Step error', '', v => 0], ['Kv', 'Kv', '/s', v => v.K / v.a], ['er', 'Ramp error 1/Kv', '', v => v.a / v.K],
      ['wgc', 'Gain-crossover ωgc', 'rad/s', v => sq((-v.a * v.a + sq(v.a ** 4 + 4 * v.K * v.K)) / 2)], ['PM', 'Phase margin', '°', v => 90 - deg(Math.atan(v.wgc / v.a))]],
    plot: { x: ['t', 'Time', 's', 0, 8, ''], y: [['unit-step response', (t, v) => step2(t, v.z, v.wn)]], yl: 'Output for a unit step' },
    ck: [[{ K: 10, a: 2 }, { z: 0.316, wn: 3.16, Mp: 35 }, 'Vol 3 p 786 · Sum 1'], [{ K: 10, a: 2 }, { ts: 4 }, 'Vol 3 p 786 · Sum 2'], [{ K: 10, a: 2 }, { er: 0.2 }, 'Vol 3 p 786 · Sum 4'], [{ K: 50, a: 5 }, { es: 0, er: 0.1 }, 'Vol 3 p 787 · Sum 10'], [{ K: 100, a: 10 }, { wgc: 7.86, PM: 51.8 }, 'Vol 3 p 788 · Sum 14']] });
  lab(767, { n: 'Steady-state error and error constants', rf: 'Steady-state error', c: 'Step: 1/(1 + Kp); ramp: 1/Kv; parabola: 1/Ka. Each pole at the origin (type) removes one kind of error; a type-0 loop cannot follow a ramp.',
    i: [['ty', 'System type', '', '1', ['0', '1', '2']], ['K', 'Kp, Kv or Ka (the finite constant of this type)', '', 5, 0.01, 1000, 0.01, 'log'], ['A', 'Input size', '', 1, 0.01, 100, 0.01]],
    o: [['ss', 'Step error', '', v => v.ty === '0' ? v.A / (1 + v.K) : 0], ['sr', 'Ramp error', '', v => v.ty === '0' ? '∞' : v.ty === '1' ? v.A / v.K : 0], ['sp', 'Parabolic error', '', v => v.ty === '2' ? v.A / v.K : '∞']],
    ck: [[{ ty: '0', K: 9, A: 1 }, { ss: 0.1 }, 'Vol 3 p 786 · Sum 3'], [{ ty: '1', K: 5, A: 1 }, { sr: 0.2 }, 'Vol 3 p 786 · Sum 4'], [{ ty: '2', K: 5, A: 1 }, { sp: 0.2 }, 'Vol 3 p 788 · Sum 11'], [{ ty: '2', K: 25, A: 1 }, { sp: 0.04 }, 'Vol 3 p 777 · formula 17']] });
  lab(767, { n: 'First-order system', rf: 'First-order system', c: 'K/(as + b): time constant τ = a/b, final value = (K/b) × input; 63.2 % at τ, 98 % (2 % settling) at 4τ, 10–90 % rise in 2.2τ.',
    i: [['K', 'Numerator K', '', 5, 0.01, 1000, 0.01], ['a', 'Coefficient of s', '', 2, 0.001, 100, 0.001], ['b', 'Constant term', '', 1, 0.001, 100, 0.001], ['A', 'Step size', '', 2, 0.01, 100, 0.01]],
    o: [['tau', 'Time constant τ', 's', v => v.a / v.b], ['yf', 'Final value', '', v => v.K / v.b * v.A], ['ts', 'Time to 98 % (4τ)', 's', v => 4 * v.tau], ['tr', 'Rise time 2.2τ', 's', v => 2.2 * v.tau], ['wb', 'Bandwidth 1/τ', 'rad/s', v => 1 / v.tau]],
    plot: { x: ['t', 'Time', 's', 0, 12, ''], y: [['response', (t, v) => v.yf * (1 - Math.exp(-t / v.tau))]], yl: 'Output' },
    ck: [[{ K: 5, a: 2, b: 1, A: 2 }, { tau: 2, yf: 10, ts: 8 }, 'Vol 3 p 790 · Sum 21']] });
  lab(767, { n: 'Feedback around a first-order plant', rf: 'Closed-loop transfer function', c: 'C/R = G/(1 + GH). With G = K/(s + p): T = K/(s + p + KH) — feedback makes it faster and lowers the dc gain to K/(p + KH). Sensitivity to G falls as 1/(1 + GH).',
    i: [['K', 'Plant gain K', '', 20, 0.1, 1000, 0.1], ['p', 'Plant pole p', '', 4, 0, 100, 0.1], ['H', 'Feedback H', '', 0.25, 0, 10, 0.01]],
    o: [['pc', 'Closed-loop pole at −', '', v => v.p + v.K * v.H], ['dc', 'Closed-loop dc gain', '', v => v.K / (v.p + v.K * v.H)], ['tau', 'Closed-loop τ', 's', v => 1 / v.pc], ['S', 'Sensitivity at dc 1/(1 + GH)', '', v => 1 / (1 + v.K / v.p * v.H)]],
    ck: [[{ K: 20, p: 4, H: 0.25 }, { pc: 9, dc: 2.22 }, 'Vol 3 p 787 · Sum 7']] });
  lab(767, { n: 'Negative feedback around a gain', rf: 'Closed-loop transfer function', c: 'T = G/(1 + GH); when GH ≫ 1, T ≈ 1/H, almost free of G.',
    i: [['G', 'Forward gain G', '', 10, 0.01, 10000, 0.01, 'log'], ['H', 'Feedback H', '', 0.1, 0, 10, 0.001]],
    o: [['T', 'Closed-loop gain', '', v => v.G / (1 + v.G * v.H)], ['S', 'Sensitivity 1/(1 + GH)', '', v => 1 / (1 + v.G * v.H)]],
    ck: [[{ G: 10, H: 0.1 }, { T: 5 }, 'Vol 3 p 770 · quick check']] });
  lab(767, { n: 'Routh test of a cubic', rf: 'Routh', c: 'a₃s³ + a₂s² + a₁s + a₀ is stable only if all coefficients are positive and a₂a₁ > a₃a₀. Sign changes in the first column = poles in the right half. At the limit it oscillates at ω = √(a₁/a₃).',
    i: [['a3', 'a₃ (s³)', '', 1, 0.01, 100, 0.01], ['a2', 'a₂ (s²)', '', 2, -100, 100, 0.01], ['a1', 'a₁ (s)', '', 3, -100, 100, 0.01], ['a0', 'a₀', '', 10, -1000, 1000, 0.01]],
    o: [['c3', 'Routh s¹ entry', '', v => (v.a2 * v.a1 - v.a3 * v.a0) / v.a2], ['rhp', 'Poles in the right half', '', v => { const col = [v.a3, v.a2, (v.a2 * v.a1 - v.a3 * v.a0) / v.a2, v.a0]; let n = 0; for (let k = 1; k < 4; k++) if (Math.sign(col[k]) !== Math.sign(col[k - 1])) n++; return n; }],
      ['st', 'Verdict', '', v => v.rhp ? 'unstable' : Math.abs(v.a2 * v.a1 - v.a3 * v.a0) < 1e-9 ? 'marginal (oscillates)' : 'stable'], ['K', 'Largest a₀ for stability (a₂a₁/a₃)', '', v => v.a2 * v.a1 / v.a3], ['w', 'Oscillation at the limit √(a₁/a₃)', 'rad/s', v => sq(v.a1 / v.a3)], ['r', 'Roots', '', v => rootStr(roots([v.a3, v.a2, v.a1, v.a0]))]],
    ck: [[{ a3: 1, a2: 2, a1: 3, a0: 10 }, { rhp: 2, st: 'unstable' }, 'Vol 3 p 786 · Sum 5'], [{ a3: 1, a2: 4, a1: 5 }, { K: 20, w: 2.24 }, 'Vol 3 p 788 · Sum 12']] });
  lab(767, { n: 'Root locus and margins of K/[s(s + p₁)(s + p₂)]', rf: 'Root locus rules', c: 'Three asymptotes at 60°, 180°, 300° from the centroid −(p₁ + p₂)/3; break-away where dK/ds = 0. The locus crosses the jω axis at ω = √(p₁p₂) when K = p₁p₂(p₁ + p₂); gain margin = that K ÷ your K.',
    i: [['p1', 'Pole p₁', '', 2, 0.1, 50, 0.1], ['p2', 'Pole p₂', '', 4, 0.1, 50, 0.1], ['K', 'Gain K', '', 2, 0.01, 10000, 0.01, 'log']],
    o: [['cen', 'Centroid', '', v => -(v.p1 + v.p2) / 3], ['ang', 'Asymptote angles', '', v => '60°, 180°, 300°'], ['bk', 'Break-away point', '', v => (-2 * (v.p1 + v.p2) + sq(4 * (v.p1 + v.p2) ** 2 - 12 * v.p1 * v.p2)) / 6],
      ['wpc', 'Phase crossover (jω crossing)', 'rad/s', v => sq(v.p1 * v.p2)], ['Km', 'K at the stability limit', '', v => v.p1 * v.p2 * (v.p1 + v.p2)], ['GM', 'Gain margin', '×', v => v.Km / v.K], ['GMdB', 'Gain margin', 'dB', v => 20 * Math.log10(v.GM)]],
    plot: { x: ['w', 'Frequency ω', 'rad/s', 0.01, 100, 'log'], y: [['|G(jω)| in dB', (w, v) => 20 * Math.log10(v.K / (w * sq(w * w + v.p1 * v.p1) * sq(w * w + v.p2 * v.p2)))], ['phase ÷ 10 (°)', (w, v) => (-90 - deg(Math.atan(w / v.p1)) - deg(Math.atan(w / v.p2))) / 10]], yl: 'dB, and phase ÷ 10', mark: v => v.wpc },
    ck: [[{ p1: 2, p2: 4 }, { cen: -2, bk: -0.845 }, 'Vol 3 p 788 · Sum 13'], [{ p1: 1, p2: 2, K: 2 }, { wpc: 1.414, GM: 3, GMdB: 9.54 }, 'Vol 3 p 789 · Sum 15']] });
  lab(767, { n: 'Gain margin from the real-axis crossing', rf: 'Gain & phase margin', c: 'If the polar plot cuts the negative real axis at −x, GM = 1/x (20 log 1/x dB). Gain from dB: K = 10^(dB/20).',
    i: [['x', 'Crossing magnitude', '', 0.5, 0.01, 2, 0.01], ['dB', 'A gain in dB', 'dB', 20, -60, 60, 0.1]],
    o: [['GM', 'Gain margin', '×', v => 1 / v.x], ['GMdB', 'Gain margin', 'dB', v => 20 * Math.log10(1 / v.x)], ['K', 'dB as a ratio', '×', v => 10 ** (v.dB / 20)]],
    ck: [[{ x: 0.5 }, { GM: 2, GMdB: 6 }, 'Vol 3 p 770 · quick check']] });
  lab(767, { n: 'Lead (or lag) network', rf: 'Lead/lag maximum phase', c: '(s + z)/(s + p) with p > z leads. Largest lead at ωm = √(zp), sin ϕm = (p − z)/(p + z), and the gain there is 10 log(p/z) dB above the low-frequency value.',
    i: [['z', 'Zero z', '', 1, 0.01, 100, 0.01], ['p', 'Pole p', '', 3, 0.01, 1000, 0.01]],
    o: [['wm', 'Frequency of maximum phase ωm', 'rad/s', v => sq(v.z * v.p)], ['pm', 'Maximum phase', '°', v => deg(Math.asin((v.p - v.z) / (v.p + v.z)))], ['g', 'Extra gain at ωm', 'dB', v => 10 * Math.log10(v.p / v.z)], ['ty', 'Type', '', v => v.p > v.z ? 'lead' : v.p < v.z ? 'lag' : 'none']],
    plot: { x: ['w', 'Frequency ω', 'rad/s', 0.01, 100, 'log'], y: [['phase (°)', (w, v) => deg(Math.atan(w / v.z) - Math.atan(w / v.p))]], yl: 'Phase (°)', mark: v => v.wm },
    ck: [[{ z: 1, p: 3 }, { wm: 1.73, pm: 30 }, 'Vol 3 p 789 · Sum 16'], [{ z: 1, p: 4 }, { pm: 36.9 }, 'Vol 3 p 769 · quick check']] });
  lab(767, { n: 'Mason’s gain formula — one path, two touching loops', rf: 'Mason', c: 'T = ΣPkΔk/Δ with Δ = 1 − ΣL + Σ(non-touching pairs) …; loops that touch the path are removed from Δk, so here Δk = 1.',
    i: [['G1', 'G₁', '', 2, -100, 100, 0.1], ['G2', 'G₂', '', 5, -100, 100, 0.1], ['G3', 'G₃', '', 1, -100, 100, 0.1], ['H1', 'H₁ (loop −G₂H₁)', '', 0.2, -10, 10, 0.01], ['H2', 'H₂ (loop −G₂G₃H₂)', '', 0.4, -10, 10, 0.01]],
    o: [['P', 'Path gain P₁', '', v => v.G1 * v.G2 * v.G3], ['L1', 'Loop L₁', '', v => -v.G2 * v.H1], ['L2', 'Loop L₂', '', v => -v.G2 * v.G3 * v.H2], ['D', 'Δ = 1 − (L₁ + L₂)', '', v => 1 - (v.L1 + v.L2)], ['T', 'Overall gain', '', v => v.P / v.D]],
    ck: [[{ G1: 2, G2: 5, G3: 1, H1: 0.2, H2: 0.4 }, { T: 2.5 }, 'Vol 3 p 789 · Sum 17']] });
  lab([767, 800], { n: '2 × 2 state model — poles, controllability, observability', rf: 'Controllability', c: 'Poles = eigenvalues of A (s² − trace·s + det = 0). Controllable ⇔ [B AB] has rank 2; observable ⇔ [C; CA] has rank 2. Scaling A by k scales every pole by k.',
    i: [['a', 'A₁₁', '', 0, -20, 20, 0.1], ['b', 'A₁₂', '', 1, -20, 20, 0.1], ['c', 'A₂₁', '', -6, -50, 50, 0.1], ['d', 'A₂₂', '', -5, -50, 50, 0.1], ['b1', 'B₁', '', 0, -10, 10, 0.1], ['b2', 'B₂', '', 1, -10, 10, 0.1], ['c1', 'C₁', '', 1, -10, 10, 0.1], ['c2', 'C₂', '', 0, -10, 10, 0.1]],
    o: [['tr', 'Trace', '', v => v.a + v.d], ['det', 'Determinant', '', v => v.a * v.d - v.b * v.c], ['ce', 'Characteristic equation', '', v => `s² ${-v.tr >= 0 ? '+' : '−'} ${+Math.abs(v.tr).toFixed(3)}s ${v.det >= 0 ? '+' : '−'} ${+Math.abs(v.det).toFixed(3)} = 0`],
      ['s1', 'Pole 1 (real part)', '', v => { const D = v.tr * v.tr - 4 * v.det; return D >= 0 ? (v.tr + sq(D)) / 2 : v.tr / 2; }], ['s2', 'Pole 2 (real part)', '', v => { const D = v.tr * v.tr - 4 * v.det; return D >= 0 ? (v.tr - sq(D)) / 2 : v.tr / 2; }], ['wi', 'Imaginary part ±', '', v => { const D = v.tr * v.tr - 4 * v.det; return D < 0 ? sq(-D) / 2 : 0; }],
      ['st', 'Stability', '', v => Math.max(v.s1, v.s2) < 0 ? 'stable' : Math.max(v.s1, v.s2) === 0 ? 'marginal' : 'unstable'], ['ctr', 'Controllable?', '', v => Math.abs(v.b1 * (v.c * v.b1 + v.d * v.b2) - v.b2 * (v.a * v.b1 + v.b * v.b2)) > 1e-9 ? 'yes' : 'no'], ['obs', 'Observable?', '', v => Math.abs(v.c1 * (v.c1 * v.b + v.c2 * v.d) - v.c2 * (v.c1 * v.a + v.c2 * v.c)) > 1e-9 ? 'yes' : 'no']],
    ck: [[{ a: 0, b: 1, c: -6, d: -5 }, { s1: -2, s2: -3, st: 'stable' }, 'Vol 3 p 789 · Sum 18'], [{ a: 0, b: 1, c: -2, d: -3, b1: 0, b2: 1 }, { ctr: 'yes' }, 'Vol 3 p 789 · Sum 19'], [{ a: 0, b: 1, c: -2, d: -3 }, { s1: -1, s2: -2, st: 'stable' }, 'Vol 3 p 803 · Sum 1'], [{ a: 0, b: 1, c: -2, d: -3, b1: 0, b2: 1 }, { ctr: 'yes' }, 'Vol 3 p 803 · Sum 2'], [{ a: 0, b: 2, c: -4, d: -6 }, { s1: -2, s2: -4 }, 'Vol 3 p 803 · R3']] });
  lab([767, 800], { n: 'P, PI, PD and PID controllers', rf: 'PID', c: 'Gc = Kp + Ki/s + Kd·s. The integral term adds a pole at the origin (type + 1, step error → 0) and a zero at −Ki/Kp (PI). Derivative action adds a zero and damping.',
    i: [['Kp', 'Kp', '', 2, 0, 100, 0.01], ['Ki', 'Ki', '/s', 4, 0, 100, 0.01], ['Kd', 'Kd', 's', 0, 0, 100, 0.01], ['t0', 'Plant type', '', 0, 0, 2, 1]],
    o: [['z', 'Controller zero(s)', '', v => v.Kd ? rootStr(roots([v.Kd, v.Kp, v.Ki])) : v.Ki && v.Kp ? (-v.Ki / v.Kp).toFixed(3).replace('-', '−') : '—'], ['ty', 'Loop type', '', v => v.t0 + (v.Ki ? 1 : 0)], ['ess', 'Step error with Kp only (type 0)', '', v => 1 / (1 + v.Kp)]],
    ck: [[{ Kp: 2, Ki: 4, Kd: 0, t0: 0 }, { z: '−2.000', ty: 1 }, 'Vol 3 p 790 · Sum 20']] });

  /* ---------- Measurements ---------- */
  lab(807, { n: 'Ammeter shunt and voltmeter multiplier', rf: 'Ammeter shunt', c: 'm = I/Im: Rsh = Rm/(m − 1). m = V/(ImRm): Rse = Rm(m − 1). Sensitivity = 1/Im Ω per volt.',
    i: [['Rm', 'Meter resistance Rm', 'Ω', 10, 0.1, 100000, 0.1, 'log'], ['Im', 'Full-scale current Im', 'mA', 1, 0.001, 100, 0.001, 'log'], ['I', 'Wanted current range', 'A', 1, 0.001, 1000, 0.001, 'log'], ['V', 'Wanted voltage range', 'V', 100, 0.01, 10000, 0.01, 'log']],
    o: [['mI', 'Current multiplying power', '', v => v.I / (v.Im / 1000)], ['Rsh', 'Shunt', 'Ω', v => v.Rm / (v.mI - 1)], ['mV', 'Voltage multiplying power', '', v => v.V / (v.Im / 1000 * v.Rm)], ['Rse', 'Series multiplier', 'Ω', v => v.Rm * (v.mV - 1)], ['S', 'Sensitivity', 'Ω/V', v => 1000 / v.Im]],
    ck: [[{ Rm: 10, Im: 1, I: 1 }, { Rsh: 0.01 }, 'Vol 3 p 823 · Sum 1'], [{ Rm: 100, Im: 1, V: 100 }, { Rse: 99900 }, 'Vol 3 p 824 · Sum 2'], [{ Rm: 100, Im: 1, I: 1 }, { Rsh: 0.1001 }, 'Vol 3 p 810 · key-formula example'], [{ Rm: 5, Im: 10, I: 1 }, { Rsh: 0.0505 }, 'Vol 3 p 810 · one-minute sum'], [{ Rm: 100, Im: 1, V: 10 }, { Rse: 9900 }, 'Vol 3 p 810 · one-minute sum'], [{ Rm: 1000, Im: 0.05, V: 10 }, { Rse: 199000 }, 'Vol 3 p 808 · quick check']] });
  lab(807, { n: 'Voltmeter loading', rf: 'Errors', c: 'A voltmeter of S Ω/V on range V has resistance S × V. Across a high-resistance divider it draws current and reads low.',
    i: [['S', 'Sensitivity', 'Ω/V', 20000, 100, 1e6, 100, 'log'], ['rg', 'Range used', 'V', 10, 1, 1000, 1], ['R1', 'Upper resistor', 'kΩ', 100, 0.1, 10000, 0.1, 'log'], ['R2', 'Lower resistor (meter across it)', 'kΩ', 100, 0.1, 10000, 0.1, 'log'], ['V', 'Supply', 'V', 20, 1, 1000, 1]],
    o: [['Rv', 'Meter resistance', 'kΩ', v => v.S * v.rg / 1000], ['Vt', 'True voltage', 'V', v => v.V * v.R2 / (v.R1 + v.R2)], ['Vr', 'Reading', 'V', v => { const p = v.R2 * v.Rv / (v.R2 + v.Rv); return v.V * p / (v.R1 + p); }], ['e', 'Error', '%', v => (v.Vr - v.Vt) / v.Vt * 100]],
    ck: [[{ S: 20000, rg: 10, R1: 100, R2: 100, V: 20 }, { Vr: 8, e: -20 }, 'Vol 3 p 825 · Sum 9']] });
  lab(807, { n: 'Wheatstone bridge', rf: 'Wheatstone bridge', c: 'Balance when P/Q = R/S, so R = S × P/Q. Best sensitivity with equal arms; Kelvin double bridge for < 1 Ω.',
    i: [['P', 'Ratio arm P', 'Ω', 100, 1, 10000, 1], ['Q', 'Ratio arm Q', 'Ω', 10, 1, 10000, 1], ['S', 'Standard arm S', 'Ω', 50, 0.01, 100000, 0.01]],
    o: [['R', 'Unknown R', 'Ω', v => v.S * v.P / v.Q]],
    ck: [[{ P: 100, Q: 10, S: 50 }, { R: 500 }, 'Vol 3 p 824 · Sum 3'], [{ P: 10, Q: 100, S: 50 }, { R: 5 }, 'Vol 3 p 810 · quick check']] });
  lab(807, { n: 'Energy meter — constant, speed and error', rf: 'Energy meter', c: 'Revolutions = kWh × meter constant. Error = (recorded − true)/true × 100: negative means the meter runs slow.',
    i: [['K', 'Meter constant', 'rev/kWh', 1200, 100, 10000, 10], ['n', 'Revolutions counted', '', 60, 1, 10000, 1], ['t', 'Time taken', 'min', 1, 0.1, 600, 0.1], ['Pt', 'True load (V·I·pf)', 'kW', 3, 0.01, 1000, 0.01]],
    o: [['E', 'Energy recorded', 'kWh', v => v.n / v.K], ['P', 'Load shown by the meter', 'kW', v => v.E / (v.t / 60)], ['Et', 'True energy', 'kWh', v => v.Pt * v.t / 60], ['ne', 'Revolutions it should make', '', v => v.K * v.Et], ['err', 'Error', '%', v => (v.E - v.Et) / v.Et * 100]],
    ck: [[{ K: 1200, n: 60, t: 1 }, { P: 3 }, 'Vol 3 p 824 · Sum 4'], [{ K: 1200, n: 40, t: 2, Pt: 1.15 }, { err: -13 }, 'Vol 3 p 825 · Sum 10', 0.02], [{ K: 600, t: 60, Pt: 1 }, { ne: 600 }, 'Vol 3 p 811 · key-formula example'], [{ K: 1200, t: 30, Pt: 2 }, { ne: 1200 }, 'Vol 3 p 811 · one-minute sum'], [{ K: 1200, n: 600 }, { E: 0.5 }, 'Vol 3 p 807 · quick check']] });
  lab(807, { n: 'CT ratio error', rf: 'Instrument transformers', c: 'Ratio error = (Kn − R)/R × 100 with nominal ratio Kn and actual ratio R = Ip/Is.',
    i: [['Np', 'CT primary rating', 'A', 1000, 1, 10000, 1], ['Ns', 'CT secondary rating', 'A', 5, 1, 5, 4], ['Ip', 'Primary current', 'A', 1000, 1, 100000, 1], ['Is', 'Measured secondary current', 'A', 4.9, 0.01, 10, 0.01]],
    o: [['Kn', 'Nominal ratio', '', v => v.Np / v.Ns], ['R', 'Actual ratio', '', v => v.Ip / v.Is], ['e', 'Ratio error', '%', v => (v.Kn - v.R) / v.R * 100]],
    ck: [[{ Np: 1000, Ns: 5, Ip: 1000, Is: 4.9 }, { e: -2 }, 'Vol 3 p 825 · Sum 12']] });
  lab(807, { n: 'PMMC, moving-iron and rectifier meters on a waveform', rf: 'PMMC instrument', c: 'PMMC reads the average (zero on pure AC); moving iron reads the true rms; a rectifier meter reads 1.11 × the rectified average (correct only for a sine).',
    i: [['w', 'Waveform', '', 'half-wave', ['sine', 'half-wave', 'full-wave', 'square ±', 'dc']], ['Vm', 'Peak', 'V', 10, 0.1, 1000, 0.1]],
    o: [['pm', 'PMMC reading (average)', 'V', v => v.Vm * { sine: 0, 'half-wave': 1 / PI, 'full-wave': 2 / PI, 'square ±': 0, dc: 1 }[v.w]], ['mi', 'Moving-iron reading (rms)', 'V', v => v.Vm * { sine: 1 / sq(2), 'half-wave': 0.5, 'full-wave': 1 / sq(2), 'square ±': 1, dc: 1 }[v.w]],
      ['rm', 'Rectifier-meter reading', 'V', v => 1.11 * v.Vm * { sine: 2 / PI, 'half-wave': 1 / PI, 'full-wave': 2 / PI, 'square ±': 1, dc: 1 }[v.w]]],
    ck: [[{ w: 'half-wave', Vm: 10 }, { pm: 3.18, mi: 5 }, 'Vol 3 p 824 · Sum 7'], [{ w: 'sine' }, { pm: 0 }, 'Vol 3 p 809 · quick check']] });
  lab(807, { n: 'Maxwell inductance–capacitance bridge', rf: 'Maxwell', c: 'Lx = R₂R₃C₁, Rx = R₂R₃/R₁ (C₁ ∥ R₁ in the opposite arm). Q = ωC₁R₁; suits medium-Q coils (1–10).',
    i: [['R1', 'R₁ (∥ C₁)', 'kΩ', 4, 0.01, 1000, 0.01], ['C1', 'C₁', 'µF', 0.5, 0.001, 10, 0.001], ['R2', 'R₂', 'kΩ', 1, 0.01, 1000, 0.01], ['R3', 'R₃', 'kΩ', 2, 0.01, 1000, 0.01], ['f', 'Frequency', 'Hz', 1000, 50, 10000, 10]],
    o: [['L', 'Lx', 'H', v => v.R2 * 1e3 * v.R3 * 1e3 * v.C1 * 1e-6], ['R', 'Rx', 'Ω', v => v.R2 * 1e3 * v.R3 * 1e3 / (v.R1 * 1e3)], ['Q', 'Q of the coil', '', v => 2 * PI * v.f * v.C1 * 1e-6 * v.R1 * 1e3]],
    ck: [[{ R1: 4, C1: 0.5, R2: 1, R3: 2 }, { L: 1, R: 500 }, 'Vol 3 p 825 · Sum 8']] });
  lab(807, { n: 'Schering bridge and Wien bridge', rf: 'Schering bridge', c: 'Schering: Cx = C₂R₄/R₃, tan δ = ωC₄R₄ (insulation and capacitor loss). Wien: f = 1/(2π√(R₁R₂C₁C₂)) = 1/(2πRC).',
    i: [['C2', 'Standard C₂', 'pF', 100, 1, 10000, 1], ['R3', 'R₃', 'Ω', 1000, 1, 100000, 1], ['R4', 'R₄', 'Ω', 500, 1, 100000, 1], ['C4', 'C₄', 'µF', 0.1, 0.001, 10, 0.001], ['R', 'Wien R', 'kΩ', 10, 0.1, 1000, 0.1], ['C', 'Wien C', 'nF', 10, 0.1, 1000, 0.1], ['f', 'Frequency', 'Hz', 50, 1, 10000, 1]],
    o: [['Cx', 'Cx', 'pF', v => v.C2 * v.R4 / v.R3], ['td', 'tan δ', '', v => 2 * PI * v.f * v.C4 * 1e-6 * v.R4], ['fw', 'Wien frequency', 'Hz', v => 1 / (2 * PI * v.R * 1e3 * v.C * 1e-9)]], ck: [] });
  lab(807, { n: 'Q-meter — inductance from resonance', rf: 'Series resonance', c: 'At resonance f = 1/(2π√LC), so L = 1/(4π²f²C).',
    i: [['f', 'Resonant frequency', 'MHz', 1, 0.001, 100, 0.001, 'log'], ['C', 'Tuning capacitance', 'pF', 100, 1, 10000, 1, 'log']],
    o: [['L', 'Inductance', 'µH', v => 1 / (4 * PI * PI * (v.f * 1e6) ** 2 * v.C * 1e-12) * 1e6]],
    ck: [[{ f: 1, C: 100 }, { L: 253 }, 'Vol 3 p 826 · Sum 13']] });
  lab(807, { n: 'CRO — deflection sensitivity and Lissajous figures', rf: 'CRO deflection sensitivity', c: 'S = L·l/(2dEa) m/V; deflection factor G = 1/S. Lissajous ellipse: ϕ = sin⁻¹(Y₀/Ymax); fy/fx = horizontal tangencies/vertical tangencies.',
    i: [['L', 'Plates to screen L', 'm', 0.2, 0.05, 0.5, 0.01], ['l', 'Plate length l', 'cm', 2, 0.5, 10, 0.1], ['d', 'Plate gap d', 'mm', 5, 1, 20, 0.1], ['Ea', 'Accelerating voltage Ea', 'kV', 2, 0.5, 20, 0.1], ['y', 'Y₀/Ymax of the ellipse', '', 0.5, 0, 1, 0.01]],
    o: [['S', 'Sensitivity', 'mm/V', v => v.L * v.l / 100 / (2 * v.d / 1000 * v.Ea * 1000) * 1000], ['G', 'Deflection factor', 'V/mm', v => 1 / v.S], ['ph', 'Phase from the ellipse', '°', v => deg(Math.asin(v.y))]],
    ck: [[{ L: 0.2, l: 2, d: 5, Ea: 2 }, { S: 0.2, G: 5 }, 'Vol 3 p 824 · Sum 6'], [{ y: 0.5 }, { ph: 30 }, 'Vol 3 p 809 · quick check']] });
  lab(807, { n: 'DVM resolution', rf: 'Digital instruments', c: 'n full digits + a half digit = 2 × 10ⁿ counts; resolution = range/counts.',
    i: [['n', 'Full digits', '', 3, 2, 7, 1], ['h', 'Half digit?', '', 'yes', ['yes', 'no']], ['rg', 'Range', 'V', 2, 0.2, 1000, 0.1]],
    o: [['N', 'Counts', '', v => (v.h === 'yes' ? 2 : 1) * 10 ** v.n], ['res', 'Resolution', 'mV', v => v.rg / v.N * 1000], ['pc', 'as % of range', '%', v => 100 / v.N]],
    ck: [[{ n: 3, h: 'yes', rg: 2 }, { res: 1, pc: 0.05 }, 'Vol 3 p 826 · Sum 14']] });
  lab(807, { n: 'Measurement error and limiting error', rf: 'Errors', c: 'Error = (measured − true)/true. For a product or quotient the limiting % errors add; for a sum the absolute errors add.',
    i: [['m', 'Measured', '', 102, 0.001, 100000, 0.001], ['t', 'True', '', 100, 0.001, 100000, 0.001], ['e1', 'Limiting error of quantity 1', '%', 1, 0, 10, 0.01], ['e2', 'Limiting error of quantity 2', '%', 2, 0, 10, 0.01]],
    o: [['e', 'Error', '%', v => (v.m - v.t) / v.t * 100], ['c', 'Correction', '', v => v.t - v.m], ['ep', 'Limiting error of a product or quotient', '%', v => v.e1 + v.e2], ['eq', 'Random (rms) combination', '%', v => sq(v.e1 ** 2 + v.e2 ** 2)]],
    ck: [[{ m: 102, t: 100 }, { e: 2 }, 'Vol 3 p 824 · Sum 5']] });
  lab(807, { n: 'CT and PT multiplying factor for a meter', rf: 'CT-operated metering', c: 'Actual energy = meter reading × MF, MF = (CT ratio installed/CT ratio of the meter) × (PT ratio installed/PT ratio of the meter).',
    i: [['ci', 'CT ratio installed', '', 40, 1, 1000, 1], ['cm', 'CT ratio of the meter', '', 20, 1, 1000, 1], ['pi', 'PT ratio installed', '', 100, 1, 10000, 1], ['pm', 'PT ratio of the meter', '', 100, 1, 10000, 1], ['R', 'Meter reading', 'kWh', 1500, 0, 1e7, 1]],
    o: [['MF', 'Multiplying factor', '', v => v.ci / v.cm * (v.pi / v.pm)], ['E', 'Actual energy', 'kWh', v => v.R * v.MF]], ck: [] });

  /* ---------- Code 400 · Modern Measurement & Instrumentation ---------- */
  lab([838, 913, 935], { n: 'ADC and DAC', rf: 'ADC types', c: 'Resolution = V/2ⁿ (two more bits → a quarter). SAR takes n clocks, flash one clock with 2ⁿ − 1 comparators, counter up to 2ⁿ clocks. DAC output = Vref × code/2ⁿ.',
    i: [['n', 'Bits n', '', 8, 1, 24, 1], ['V', 'Full-scale range', 'V', 10, 0.1, 100, 0.1], ['f', 'Clock', 'MHz', 1, 0.001, 1000, 0.001, 'log'], ['D', 'Digital code (decimal)', '', 128, 0, 16777215, 1]],
    o: [['L', 'Levels 2ⁿ', '', v => 2 ** v.n], ['q', 'Resolution (1 LSB)', 'mV', v => v.V / 2 ** v.n * 1000], ['sar', 'SAR conversion time', 'µs', v => v.n / v.f], ['cnt', 'Counter-type worst case', 'µs', v => 2 ** v.n / v.f], ['cmp', 'Flash comparators', '', v => 2 ** v.n - 1], ['Vo', 'DAC output for the code', 'V', v => v.V * Math.min(v.D, 2 ** v.n - 1) / 2 ** v.n]],
    ck: [[{ n: 8, V: 10 }, { q: 39.06 }, 'Vol 3 p 843 · Sum 1'], [{ n: 10, f: 1 }, { sar: 10 }, 'Vol 3 p 843 · Sum 2'], [{ n: 10, V: 10 }, { q: 9.766 }, 'Vol 3 p 844 · R3'], [{ n: 8, V: 5 }, { q: 19.5 }, 'Vol 4 p 925 · Sum 5'], [{ n: 4, V: 10, D: 11 }, { q: 625, Vo: 6.875 }, 'Vol 4 p 925 · Sum 7'], [{ n: 12 }, { L: 4096 }, 'Vol 4 p 916 · one-minute sum'], [{ n: 8 }, { cmp: 255 }, 'Vol 4 p 915 · quick check']] });
  lab(838, { n: 'Strain gauge and its bridge', rf: 'Strain gauge', c: 'ΔR = GF × ε × R. Quarter bridge output ≈ (V/4)·GF·ε; half bridge × 2; full bridge × 4.',
    i: [['GF', 'Gauge factor', '', 2, 1, 200, 0.1], ['R', 'Gauge resistance', 'Ω', 120, 50, 1000, 1], ['eps', 'Strain', 'µε', 500, 1, 10000, 1], ['V', 'Bridge supply', 'V', 10, 1, 24, 0.1], ['arms', 'Active arms', '', 1, 1, 4, 1]],
    o: [['dR', 'Change in R', 'Ω', v => v.GF * v.eps * 1e-6 * v.R], ['pc', 'ΔR/R', '%', v => v.GF * v.eps * 1e-6 * 100], ['Vo', 'Bridge output', 'mV', v => v.V / 4 * v.GF * v.eps * 1e-6 * v.arms * 1000]],
    ck: [[{ GF: 2, R: 120, eps: 500 }, { dR: 0.12 }, 'Vol 3 p 843 · Sum 3'], [{ GF: 2, eps: 500 }, { pc: 0.1 }, 'Vol 3 p 844 · R1']] });
  lab(838, { n: 'RTD, thermocouple and thermal noise', rf: 'Temperature transducers', c: 'RTD: RT = R₀(1 + αΔT), Pt α ≈ 0.00385/°C. Thermocouple EMF ∝ ΔT. Thermal noise Vn = √(4kTRB).',
    i: [['R0', 'RTD R₀', 'Ω', 100, 10, 1000, 1], ['a', 'α', '/°C', 0.00385, 0.001, 0.007, 0.00001], ['dT', 'Temperature rise ΔT', '°C', 100, -100, 800, 1], ['S', 'Thermocouple sensitivity', 'µV/°C', 41, 5, 80, 1], ['R', 'Noise resistor', 'kΩ', 10, 0.01, 10000, 0.01, 'log'], ['B', 'Bandwidth', 'kHz', 10, 0.01, 10000, 0.01, 'log'], ['T', 'Temperature', 'K', 300, 1, 1000, 1]],
    o: [['RT', 'RTD resistance', 'Ω', v => v.R0 * (1 + v.a * v.dT)], ['e', 'Thermocouple EMF', 'mV', v => v.S * v.dT / 1000], ['Vn', 'Thermal noise (rms)', 'µV', v => sq(4 * 1.380649e-23 * v.T * v.R * 1e3 * v.B * 1e3) * 1e6]], ck: [] });
  lab(838, { n: 'THD, crest factor and DSO rise time', rf: 'Wave / distortion analyzer', c: 'THD = √(V₂² + V₃² + …)/V₁. Crest factor = peak/rms. A DSO of bandwidth BW shows rise times down to ≈ 0.35/BW.',
    i: [['V1', 'Fundamental V₁', 'V', 230, 1, 1000, 1], ['V3', '3rd harmonic', 'V', 10, 0, 200, 0.1], ['V5', '5th harmonic', 'V', 8, 0, 200, 0.1], ['V7', '7th harmonic', 'V', 5, 0, 200, 0.1], ['BW', 'Scope bandwidth', 'MHz', 100, 1, 10000, 1]],
    o: [['thd', 'THD', '%', v => sq(v.V3 ** 2 + v.V5 ** 2 + v.V7 ** 2) / v.V1 * 100], ['rms', 'Total rms', 'V', v => sq(v.V1 ** 2 + v.V3 ** 2 + v.V5 ** 2 + v.V7 ** 2)], ['tr', 'Fastest rise time shown', 'ns', v => 0.35 / v.BW * 1000]], ck: [] });
})();
