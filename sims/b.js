/* Basic Engineering & Sciences labs: Engineering Mechanics, Thermodynamics, Fluids, Physics, Chemistry & Materials,
   Computers & C, General Aptitude. Each lab is built on the book formula named in rf; every check is a number the book
   itself works out (chapter sums, the Question Book's solutions, the look-up shelf's quick checks). Each lab draws a
   live diagram (fig) that follows the inputs. */
(() => {
  const PI = Math.PI, sq = Math.sqrt, rad = x => x * PI / 180, g0 = 9.81, e0 = 1.602e-19;
  const O = '#ea580c', B = '#2563eb', G = '#16a34a', R = '#dc2626', P = '#7c3aed', Y = '#d97706';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- Engineering Mechanics ---------- */
  lab(252, { n: 'Projectile — time of flight, height and range', rf: 'Projectile', c: 'T = 2u sin θ/g, H = u² sin²θ/2g, R = u² sin 2θ/g. The range is largest at θ = 45° (R = u²/g); θ and 90° − θ give the same range.',
    i: [['u', 'Launch speed u', 'm/s', 20, 1, 200, 0.1], ['th', 'Angle θ', '°', 45, 1, 89, 1], ['g', 'g', 'm/s²', 9.81, 1, 25, 0.01]],
    o: [['T', 'Time of flight T', 's', v => 2 * v.u * Math.sin(rad(v.th)) / v.g], ['H', 'Maximum height H', 'm', v => (v.u * Math.sin(rad(v.th))) ** 2 / (2 * v.g)], ['R', 'Range R', 'm', v => v.u ** 2 * Math.sin(rad(2 * v.th)) / v.g], ['Rm', 'Largest range (45°)', 'm', v => v.u ** 2 / v.g]],
    plot: { x: ['th', 'Launch angle θ', '°', 1, 89], y: [['Range R', (x, v) => v.u ** 2 * Math.sin(rad(2 * x)) / v.g], ['Height H', (x, v) => (v.u * Math.sin(rad(x))) ** 2 / (2 * v.g)]], yl: 'metres', mark: v => v.th },
    fig: (v, F) => { const W = 600, H = 250, X0 = 40, Y0 = 210, s = Math.min((W - 70) / v.Rm, (Y0 - 30) / (v.Rm / 2));
      const path = (th, col, w, dash) => { const T = 2 * v.u * Math.sin(rad(th)) / v.g; let d = ''; for (let i = 0; i <= 60; i++) { const t = T * i / 60, x = v.u * Math.cos(rad(th)) * t, y = v.u * Math.sin(rad(th)) * t - v.g * t * t / 2; d += `${i ? 'L' : 'M'}${(X0 + x * s).toFixed(1)},${(Y0 - y * s).toFixed(1)}`; } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}"${dash ? ' stroke-dasharray="5 5"' : ''}/>`; };
      return F.svg(W, H, F.line(20, Y0, W - 10, Y0, 'var(--ink-2)', 2) + (Math.abs(v.th - 45) > 0.5 ? path(45, '#94a3b8', 1.6, 1) + F.txt(X0 + v.Rm * s, Y0 + 16, '45°', { a: 'middle', c: 'fs' }) : '') + path(v.th, B, 3)
        + F.line(X0 + v.R * s / 2, Y0, X0 + v.R * s / 2, Y0 - v.H * s, O, 1.6, '4 4') + F.txt(X0 + v.R * s / 2 + 6, Y0 - v.H * s / 2, `H = ${F.t(v.H)} m`, { c: 'fv', col: O })
        + F.arrow(X0, Y0 + 26, X0 + v.R * s, Y0 + 26, G, 1.8) + F.txt(X0 + v.R * s / 2, Y0 + 40, `R = ${F.t(v.R)} m`, { a: 'middle', c: 'fv', col: G })
        + F.arrow(X0, Y0, X0 + 46 * Math.cos(rad(v.th)), Y0 - 46 * Math.sin(rad(v.th)), R, 2.4) + F.txt(X0 + 50, Y0 - 8, `θ = ${F.t(v.th)}°`, { c: 'fs' }) + F.txt(W - 14, 22, `T = ${F.t(v.T)} s`, { a: 'end', c: 'fh' }), 'Projectile path'); } });
  lab(252, { n: 'Equations of motion — the speed–time graph', rf: 'Equations of motion', c: 'v = u + at, s = ut + ½at², v² = u² + 2as. On a speed–time graph the slope is the acceleration and the area under the line is the distance.',
    i: [['u', 'Initial speed u', 'm/s', 5, 0, 100, 0.1], ['a', 'Acceleration a', 'm/s²', 2, -10, 20, 0.1], ['t', 'Time t', 's', 10, 0.1, 100, 0.1]],
    o: [['v', 'Final speed v = u + at', 'm/s', v => v.u + v.a * v.t], ['s', 'Distance s = ut + ½at²', 'm', v => v.u * v.t + v.a * v.t ** 2 / 2], ['v2', 'Check: √(u² + 2as)', 'm/s', v => sq(Math.max(0, v.u ** 2 + 2 * v.a * v.s))]],
    fig: (v, F) => { const W = 600, H = 230, X0 = 50, Y0 = 190, mx = Math.max(Math.abs(v.u), Math.abs(v.v), 1), sy = (Y0 - 30) / mx, sx = (W - 90) / v.t;
      return F.svg(W, H, `<path d="M${X0},${Y0} L${X0},${Y0 - v.u * sy} L${X0 + v.t * sx},${Y0 - v.v * sy} L${X0 + v.t * sx},${Y0} Z" fill="${B}" fill-opacity=".16"/>` + F.line(X0, Y0 - v.u * sy, X0 + v.t * sx, Y0 - v.v * sy, B, 3)
        + F.line(X0, 20, X0, Y0, 'var(--ink-2)', 1.6) + F.line(X0, Y0, W - 20, Y0, 'var(--ink-2)', 1.6) + F.txt(X0 - 6, 26, 'speed', { a: 'end', c: 'fs' }) + F.txt(W - 20, Y0 + 18, 'time', { a: 'end', c: 'fs' })
        + F.txt(X0 + v.t * sx / 2, Y0 - Math.min(v.u, v.v) * sy / 2 + 4, `area = s = ${F.t(v.s)} m`, { a: 'middle', c: 'fv', col: B }) + F.txt(X0 + v.t * sx / 2, Y0 - (v.u + v.v) / 2 * sy - 12, `slope = a = ${F.t(v.a)} m/s²`, { a: 'middle', c: 'fv', col: O })
        + F.txt(X0 - 6, Y0 - v.u * sy + 4, `u ${F.t(v.u)}`, { a: 'end', c: 'fs' }) + F.txt(X0 + v.t * sx + 6, Y0 - v.v * sy + 4, `v ${F.t(v.v)}`, { c: 'fs' }) + F.txt(X0 + v.t * sx, Y0 + 18, `t = ${F.t(v.t)} s`, { a: 'middle', c: 'fs' }), 'Speed–time graph'); } });
  lab(252, { n: 'Stone thrown straight up', rf: 'Vertical projection', c: 'T = 2u/g, H = u²/2g. The time of flight is proportional to the launch speed and does not depend on the mass.',
    i: [['u', 'Launch speed u', 'm/s', 20, 0.1, 100, 0.1], ['g', 'g', 'm/s²', 9.81, 1, 25, 0.01]],
    o: [['T', 'Time of flight T = 2u/g', 's', v => 2 * v.u / v.g], ['H', 'Height H = u²/2g', 'm', v => v.u ** 2 / (2 * v.g)], ['tu', 'Time to the top', 's', v => v.u / v.g]],
    fig: (v, F) => { const W = 600, H = 230, Y0 = 200, s = (Y0 - 30) / Math.max(v.H, 1e-9); let dots = '';
      for (let i = 0; i <= 10; i++) { const t = v.T * i / 10 / 2, y = v.u * t - v.g * t * t / 2; dots += `<circle cx="${150}" cy="${(Y0 - y * s).toFixed(1)}" r="5" fill="${B}" fill-opacity="${0.25 + 0.075 * i}"/>`; }
      return F.svg(W, H, F.line(60, Y0, 300, Y0, 'var(--ink-2)', 2) + dots + F.arrow(190, Y0, 190, Y0 - v.H * s, O, 1.8) + F.txt(198, Y0 - v.H * s / 2, `H = ${F.t(v.H)} m`, { c: 'fv', col: O })
        + F.txt(330, 70, `up: ${F.t(v.tu)} s`, { c: 'fv' }) + F.txt(330, 96, `down: ${F.t(v.tu)} s`, { c: 'fv' }) + F.txt(330, 128, `T = 2u/g = ${F.t(v.T)} s`, { c: 'fh', col: B }) + F.txt(330, 152, 'equal times up and down', { c: 'fs' }), 'Vertical throw'); } });
  lab([252, 316], { n: 'Train crossing a platform or bridge', rf: 'Train crossing', c: 'Distance = train length + platform (or bridge) length = speed × time. Passing a pole or a man: distance = train length only. km/h × 5/18 → m/s.',
    i: [['Lt', 'Train length', 'm', 200, 0, 2000, 1], ['Lb', 'Platform / bridge length', 'm', 300, 0, 5000, 1], ['v', 'Speed', 'km/h', 72, 1, 400, 1]],
    o: [['ms', 'Speed in m/s', 'm/s', v => v.v * 5 / 18], ['d', 'Distance covered', 'm', v => v.Lt + v.Lb], ['t', 'Time to cross', 's', v => v.d / v.ms], ['tp', 'Time to pass a pole', 's', v => v.Lt / v.ms]],
    ck: [[{ Lt: 200, Lb: 300, v: 72 }, { ms: 20, t: 25 }, 'Vol 2 p 327 · Sum 8']],
    fig: (v, F) => { const W = 600, H = 150, s = (W - 60) / Math.max(v.Lt + v.Lb, 1); const tx = 30, bx = tx + v.Lt * s;
      let cars = ''; const n = Math.max(1, Math.min(10, Math.round(v.Lt / 25))); for (let i = 0; i < n; i++) cars += `<rect x="${tx + i * v.Lt * s / n + 1}" y="52" width="${v.Lt * s / n - 2}" height="26" rx="4" fill="${i === n - 1 ? R : O}"/>`;
      return F.svg(W, H, `<rect x="${bx}" y="80" width="${v.Lb * s}" height="16" fill="#94a3b8"/>` + cars + F.line(20, 80, W - 20, 80, 'var(--ink-2)', 2)
        + F.txt(tx + v.Lt * s / 2, 44, `train ${F.t(v.Lt)} m`, { a: 'middle', c: 'fs' }) + F.txt(bx + v.Lb * s / 2, 114, `platform ${F.t(v.Lb)} m`, { a: 'middle', c: 'fs' })
        + F.arrow(tx, 132, bx + v.Lb * s, 132, B, 1.8) + F.txt(W - 20, 22, `${F.t(v.d)} m ÷ ${F.t(v.ms)} m/s = ${F.t(v.t)} s`, { a: 'end', c: 'fh', col: B }), 'Train and platform'); } });
  lab(252, { n: 'Stress, strain and elongation of a bar', rf: 'Stress & strain', c: 'σ = P/A, ε = δL/L, E = σ/ε → δL = PL/AE. Double the length → double the stretch; double the area → half.',
    i: [['P', 'Load P', 'kN', 50, 0.1, 2000, 0.1], ['A', 'Area A', 'mm²', 100, 1, 100000, 1, 'log'], ['L', 'Length L', 'm', 2, 0.01, 50, 0.01], ['E', 'Young’s modulus E', 'GPa', 200, 1, 400, 1]],
    o: [['s', 'Stress σ = P/A', 'MPa', v => v.P * 1e3 / v.A], ['e', 'Strain ε = σ/E', '', v => v.s / (v.E * 1e3)], ['dL', 'Elongation δL = PL/AE', 'mm', v => v.e * v.L * 1e3]],
    fig: (v, F) => { const W = 600, H = 140, st = clamp(v.e * 2000, 0, 1), L0 = 380, L1 = L0 * (1 + 0.25 * st), h = clamp(Math.sqrt(v.A) / 4, 8, 40);
      return F.svg(W, H, `<rect x="30" y="20" width="14" height="100" fill="#94a3b8"/><rect x="44" y="${70 - h / 2}" width="${L0}" height="${h}" fill="none" stroke="#94a3b8" stroke-dasharray="4 4"/><rect x="44" y="${70 - h / 2}" width="${L1}" height="${h}" fill="${B}" fill-opacity=".25" stroke="${B}" stroke-width="2"/>`
        + F.arrow(44 + L1, 70, 44 + L1 + 60, 70, R, 3) + F.txt(44 + L1 + 64, 74, `P ${F.t(v.P)} kN`, { c: 'fv', col: R }) + F.txt(60, 128, `σ = ${F.t(v.s)} MPa · ε = ${F.t(v.e)} · δL = ${F.t(v.dL)} mm (drawn larger)`, { c: 'fs' }), 'Bar under tension'); } });

  /* ---------- Thermodynamics & Heat Transfer ---------- */
  lab(265, { n: 'First law — closed system', rf: 'First law', c: 'Q = ΔU + W. Heat in and work out are positive. If the internal energy stays the same, all the heat leaving equals the work done on the gas.',
    i: [['Q', 'Heat supplied Q (− = leaves)', 'kJ', -300, -2000, 2000, 1], ['dU', 'Change in internal energy ΔU', 'kJ', 0, -2000, 2000, 1]],
    o: [['W', 'Work done BY the gas W = Q − ΔU', 'kJ', v => v.Q - v.dU], ['Won', 'Work done ON the gas', 'N·m', v => -v.W * 1000]],
    ck: [[{ Q: -300, dU: 0 }, { W: -300, Won: 300000 }, 'Question Book B1 · TANGEDCO AE 2018 · Q29 (p 235)']],
    fig: (v, F) => { const W = 600, H = 200, x = clamp(300 - v.W / 8, 180, 420);
      return F.svg(W, H, `<rect x="120" y="50" width="360" height="100" rx="6" fill="none" stroke="var(--ink-2)" stroke-width="3"/><rect x="123" y="53" width="${x - 123}" height="94" fill="${R}" fill-opacity="${clamp(0.12 + v.dU / 4000, 0.05, 0.5)}"/><rect x="${x}" y="53" width="14" height="94" fill="#64748b"/>`
        + F.line(x + 14, 100, 540, 100, '#64748b', 6) + (v.Q >= 0 ? F.arrow(60, 170, 150, 140, R, 3) + F.txt(40, 192, `Q in ${F.t(v.Q)} kJ`, { c: 'fv', col: R }) : F.arrow(150, 140, 60, 170, B, 3) + F.txt(40, 192, `Q out ${F.t(-v.Q)} kJ`, { c: 'fv', col: B }))
        + (v.W >= 0 ? F.arrow(500, 80, 570, 80, G, 3) + F.txt(560, 70, `W by gas ${F.t(v.W)} kJ`, { a: 'end', c: 'fv', col: G }) : F.arrow(570, 80, 500, 80, P, 3) + F.txt(560, 70, `W on gas ${F.t(-v.W)} kJ`, { a: 'end', c: 'fv', col: P }))
        + F.txt(200, 106, `ΔU = ${F.t(v.dU)} kJ`, { a: 'middle', c: 'fh' }), 'Piston and cylinder'); } });
  lab(265, { n: 'Carnot engine, refrigerator and heat pump', rf: 'Carnot efficiency', c: 'η = 1 − T₂/T₁ (kelvin). COP of a refrigerator = T₂/(T₁ − T₂), of a heat pump = T₁/(T₁ − T₂) = COP_R + 1. The closer the two temperatures, the lower η and the higher the COP.',
    i: [['T1', 'Hot reservoir T₁', 'K', 600, 2, 3000, 1], ['T2', 'Cold reservoir T₂', 'K', 300, 1, 3000, 1], ['Q1', 'Heat taken from the hot side Q₁', 'kJ', 100, 1, 10000, 1]],
    o: [['eta', 'Carnot efficiency η', '%', v => (1 - v.T2 / v.T1) * 100], ['W', 'Work out W = ηQ₁', 'kJ', v => v.Q1 * v.eta / 100], ['Q2', 'Heat rejected Q₂', 'kJ', v => v.Q1 - v.W], ['cr', 'COP refrigerator', '', v => v.T2 / (v.T1 - v.T2)], ['ch', 'COP heat pump', '', v => v.T1 / (v.T1 - v.T2)]],
    fig: (v, F) => { const W = 600, H = 250, f = clamp(v.eta / 100, 0, 1), w1 = 22, w = 4 + 18 * f, w2 = 4 + 18 * (1 - f);
      return F.svg(W, H, `<rect x="150" y="12" width="300" height="40" rx="8" fill="${R}" fill-opacity=".18" stroke="${R}"/><rect x="150" y="198" width="300" height="40" rx="8" fill="${B}" fill-opacity=".18" stroke="${B}"/><circle cx="300" cy="125" r="38" fill="var(--paper)" stroke="var(--ink-2)" stroke-width="2.4"/>`
        + F.txt(300, 37, `hot T₁ = ${F.t(v.T1)} K`, { a: 'middle', c: 'fv', col: R }) + F.txt(300, 223, `cold T₂ = ${F.t(v.T2)} K`, { a: 'middle', c: 'fv', col: B }) + F.txt(300, 130, 'engine', { a: 'middle', c: 'fs' })
        + `<path d="M300,52 V87" stroke="${R}" stroke-width="${w1}" stroke-opacity=".55"/><path d="M300,163 V198" stroke="${B}" stroke-width="${w2}" stroke-opacity=".55"/><path d="M338,125 H470" stroke="${G}" stroke-width="${w}" stroke-opacity=".7"/>`
        + F.txt(318, 74, `Q₁ ${F.t(v.Q1)}`, { c: 'fs' }) + F.txt(318, 186, `Q₂ ${F.t(v.Q2)}`, { c: 'fs' }) + F.txt(478, 130, `W ${F.t(v.W)} kJ`, { c: 'fv', col: G }) + F.txt(20, 130, `η = ${F.t(v.eta)} %`, { c: 'fh' }), 'Carnot engine'); } });
  lab(265, { n: 'Polytropic compression — work on a p–V diagram', rf: 'Polytropic process', c: 'pVⁿ = constant. W = (p₁V₁ − p₂V₂)/(n − 1); isothermal (n = 1): W = p₁V₁ ln(V₂/V₁). Heat Q = [(γ − n)/(γ − 1)] W. For the same compression a higher n needs more work.',
    i: [['p1', 'p₁', 'kPa', 100, 1, 10000, 1], ['V1', 'V₁', 'm³', 1, 0.01, 100, 0.01], ['V2', 'V₂', 'm³', 0.5, 0.01, 100, 0.01], ['n', 'Index n', '', 1.3, 1, 1.67, 0.01], ['gm', 'γ', '', 1.4, 1.01, 1.67, 0.01]],
    o: [['p2', 'p₂ = p₁(V₁/V₂)ⁿ', 'kPa', v => v.p1 * (v.V1 / v.V2) ** v.n], ['W', 'Work done by the gas W', 'kJ', v => Math.abs(v.n - 1) < 1e-6 ? v.p1 * v.V1 * Math.log(v.V2 / v.V1) : (v.p1 * v.V1 - v.p2 * v.V2) / (v.n - 1)], ['Wi', 'Isothermal work (n = 1)', 'kJ', v => v.p1 * v.V1 * Math.log(v.V2 / v.V1)], ['Q', 'Heat Q = (γ − n)/(γ − 1) · W', 'kJ', v => (v.gm - v.n) / (v.gm - 1) * v.W]],
    fig: (v, F) => { const W = 600, H = 240, X0 = 60, Y0 = 210, va = Math.min(v.V1, v.V2), vb = Math.max(v.V1, v.V2), pmax = Math.max(v.p1, v.p2) * 1.1, sx = (W - 100) / (vb * 1.1), sy = (Y0 - 20) / pmax;
      const cur = (n, col, wd, fill) => { let d = ''; for (let i = 0; i <= 50; i++) { const V = va + (vb - va) * i / 50, p = v.p1 * (v.V1 / V) ** n; d += `${i ? 'L' : 'M'}${(X0 + V * sx).toFixed(1)},${(Y0 - p * sy).toFixed(1)}`; } return fill ? `<path d="${d} L${X0 + vb * sx},${Y0} L${X0 + va * sx},${Y0} Z" fill="${col}" fill-opacity=".14"/>` : `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}"/>`; };
      return F.svg(W, H, cur(v.n, B, 0, 1) + cur(1, '#94a3b8', 1.8) + cur(v.n, B, 3) + F.line(X0, 14, X0, Y0, 'var(--ink-2)', 1.6) + F.line(X0, Y0, W - 20, Y0, 'var(--ink-2)', 1.6) + F.txt(X0 - 8, 22, 'p', { a: 'end', c: 'fs' }) + F.txt(W - 20, Y0 + 18, 'V', { a: 'end', c: 'fs' })
        + `<circle cx="${X0 + v.V1 * sx}" cy="${Y0 - v.p1 * sy}" r="5" fill="${O}"/><circle cx="${X0 + v.V2 * sx}" cy="${Y0 - v.p2 * sy}" r="5" fill="${R}"/>` + F.txt(X0 + v.V1 * sx + 8, Y0 - v.p1 * sy - 6, '1', { c: 'fv', col: O }) + F.txt(X0 + v.V2 * sx + 8, Y0 - v.p2 * sy - 6, '2', { c: 'fv', col: R })
        + F.txt(W - 24, 28, `pVⁿ, n = ${F.t(v.n)}`, { a: 'end', c: 'fv', col: B }) + F.txt(W - 24, 48, 'grey: isothermal n = 1', { a: 'end', c: 'fs' }) + F.txt(X0 + (va + vb) / 2 * sx, Y0 - 12, `area = |W| = ${F.t(Math.abs(v.W))} kJ`, { a: 'middle', c: 'fv', col: B }), 'p–V diagram'); } });
  lab(265, { n: 'Heat conduction through a wall', rf: 'Conduction', c: 'Q = kAΔT/L (watts). Thicker wall or a poorer conductor → less heat; the temperature falls linearly across a plain wall.',
    i: [['k', 'Conductivity k', 'W/m·K', 0.8, 0.01, 400, 0.01, 'log'], ['A', 'Area A', 'm²', 10, 0.1, 1000, 0.1], ['T1', 'Hot face', '°C', 40, -50, 1500, 1], ['T2', 'Cold face', '°C', 10, -50, 1500, 1], ['L', 'Thickness L', 'm', 0.2, 0.001, 2, 0.001]],
    o: [['Q', 'Heat flow Q', 'W', v => v.k * v.A * (v.T1 - v.T2) / v.L], ['q', 'Heat flux q = Q/A', 'W/m²', v => v.Q / v.A], ['Rt', 'Thermal resistance L/kA', 'K/W', v => v.L / (v.k * v.A)]],
    fig: (v, F) => { const W = 600, H = 170, w = clamp(v.L * 400, 30, 300), x0 = (W - w) / 2;
      return F.svg(W, H, `<defs><linearGradient id="fgw" x1="0" x2="1"><stop offset="0" stop-color="${R}" stop-opacity=".55"/><stop offset="1" stop-color="${B}" stop-opacity=".55"/></linearGradient></defs><rect x="${x0}" y="20" width="${w}" height="120" fill="url(#fgw)" stroke="var(--ink-2)"/>`
        + F.line(x0, 40, x0 + w, 130, 'var(--ink)', 2, '6 4') + F.txt(x0 - 10, 40, `${F.t(v.T1)} °C`, { a: 'end', c: 'fv', col: R }) + F.txt(x0 + w + 10, 134, `${F.t(v.T2)} °C`, { c: 'fv', col: B })
        + F.arrow(40, 80, x0 - 10, 80, R, 2 + clamp(Math.log10(1 + Math.abs(v.Q)), 0, 5)) + F.arrow(x0 + w + 10, 80, W - 40, 80, R, 2 + clamp(Math.log10(1 + Math.abs(v.Q)), 0, 5)) + F.txt(W / 2, 160, `L = ${F.t(v.L)} m · Q = ${F.t(v.Q)} W`, { a: 'middle', c: 'fh' }), 'Plane wall'); } });

  /* ---------- Fluid Mechanics & Hydraulic Machines ---------- */
  lab(275, { n: 'Pitot tube — velocity from the pressure difference', rf: 'Bernoulli', c: 'Bernoulli between the free stream and the stagnation point: Δp = ½ρV² → V = √(2Δp/ρ). The column rises h = Δp/ρg = V²/2g.',
    i: [['dp', 'Pressure difference Δp', 'kN/m²', 10, 0.01, 1000, 0.01, 'log'], ['rho', 'Density ρ', 'kg/m³', 1000, 1, 15000, 1]],
    o: [['V', 'Velocity V = √(2Δp/ρ)', 'm/s', v => sq(2 * v.dp * 1000 / v.rho)], ['h', 'Head h = Δp/ρg', 'm', v => v.dp * 1000 / (v.rho * g0)]],
    ck: [[{ dp: 10, rho: 1000 }, { V: 4.47 }, 'Question Book B1 · TNPSC CTSE (400) 04/2026 · Q159 (p 236)']],
    fig: (v, F) => { const W = 600, H = 200, hh = clamp(v.h * 40, 6, 120);
      return F.svg(W, H, `<rect x="20" y="130" width="560" height="50" fill="${B}" fill-opacity=".14" stroke="${B}"/>` + [0, 1, 2].map(i => F.wire(`M${40},${145 + i * 12} H${300}`, B, v.V)).join('')
        + `<path d="M330,155 H380 V${130 - hh - 10}" fill="none" stroke="var(--ink-2)" stroke-width="5"/><rect x="376" y="${130 - hh}" width="8" height="${hh + 25}" fill="${B}" fill-opacity=".6"/>`
        + F.line(400, 130, 400, 130 - hh, O, 1.6) + F.txt(408, 130 - hh / 2, `h = ${F.t(v.h)} m`, { c: 'fv', col: O }) + F.txt(40, 120, `V = ${F.t(v.V)} m/s →`, { c: 'fh', col: B }) + F.txt(330, 196, 'stagnation point', { c: 'fs' }), 'Pitot tube'); } });
  lab(275, { n: 'Hydraulic turbine — power from flow and head', rf: 'Hydraulic power', c: 'Water power P = ρgQH (W) = 9.81 QH (kW). Shaft power = η × water power.',
    i: [['Q', 'Discharge Q', 'm³/s', 30, 0.01, 1000, 0.01, 'log'], ['Hd', 'Net head H', 'm', 10, 0.1, 1500, 0.1, 'log'], ['eta', 'Overall efficiency η', '', 0.866, 0.1, 1, 0.001], ['rho', 'Density ρ', 'kg/m³', 1000, 900, 1100, 1]],
    o: [['Pw', 'Water power ρgQH', 'kW', v => v.rho * g0 * v.Q * v.Hd / 1000], ['P', 'Power developed ηρgQH', 'kW', v => v.eta * v.Pw], ['MW', 'in MW', 'MW', v => v.P / 1000]],
    ck: [[{ Q: 30, Hd: 10, eta: 0.866 }, { P: 2549 }, 'Question Book B2 · TANGEDCO AE 2018 · Q42 (p 237)']],
    fig: (v, F) => { const W = 600, H = 220, hh = clamp(Math.log10(1 + v.Hd) * 55, 20, 170);
      return F.svg(W, H, `<path d="M20,${200 - hh} H150 V200 H20 Z" fill="${B}" fill-opacity=".25"/>` + F.wire(`M150,${205 - hh} L420,190`, B, Math.log10(1 + v.Q)) + `<circle cx="450" cy="190" r="22" fill="var(--paper)" stroke="${G}" stroke-width="3"/>`
        + F.line(70, 200 - hh, 70, 200, O, 1.6, '4 4') + F.txt(78, 200 - hh / 2, `H = ${F.t(v.Hd)} m`, { c: 'fv', col: O }) + F.txt(450, 160, `${F.t(v.P)} kW`, { a: 'middle', c: 'fh', col: G }) + F.txt(300, 150, `Q = ${F.t(v.Q)} m³/s`, { a: 'middle', c: 'fs' }), 'Reservoir, penstock and turbine'); } });
  lab(275, { n: 'Reynolds number — laminar or turbulent?', rf: 'Reynolds number', c: 'Re = ρVD/μ. In a pipe: laminar below about 2000, turbulent above about 4000, transition in between.',
    i: [['rho', 'Density ρ', 'kg/m³', 1000, 0.5, 15000, 0.5, 'log'], ['V', 'Velocity V', 'm/s', 0.15, 0.001, 50, 0.001, 'log'], ['D', 'Diameter D', 'm', 0.01, 0.001, 5, 0.001, 'log'], ['mu', 'Viscosity μ', 'Pa·s', 0.001, 1e-5, 2, 1e-5, 'log']],
    o: [['Re', 'Reynolds number Re', '', v => v.rho * v.V * v.D / v.mu], ['flow', 'Flow', '', v => v.Re < 2000 ? 'laminar' : v.Re > 4000 ? 'turbulent' : 'transition']],
    ck: [[{ rho: 1000, V: 0.15, D: 0.01, mu: 0.001 }, { Re: 1500, flow: 'laminar' }, 'Vol 6 p 1704 · quick check: Re = 1500 → laminar (ρ, V, D, μ chosen to give 1500)']],
    fig: (v, F) => { const W = 600, H = 150, amp = v.Re < 2000 ? 0 : v.Re > 4000 ? 9 : 4; let g = '';
      for (let k = 0; k < 5; k++) { let d = ''; for (let i = 0; i <= 60; i++) { const x = 30 + 540 * i / 60, y = 40 + k * 17 + (amp ? amp * Math.sin(i * (0.9 + k * 0.37) + k) * Math.sin(i * 0.21 + k * 2) : 0); d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; } g += `<path d="${d}" fill="none" stroke="${v.Re < 2000 ? B : v.Re > 4000 ? R : Y}" stroke-width="2"/>`; }
      return F.svg(W, H, F.line(20, 28, 580, 28, 'var(--ink-2)', 3) + F.line(20, 120, 580, 120, 'var(--ink-2)', 3) + g + F.txt(300, 142, `Re = ${F.t(v.Re)} → ${v.flow}`, { a: 'middle', c: 'fh', col: v.Re < 2000 ? B : v.Re > 4000 ? R : Y }), 'Flow in a pipe'); } });
  lab(275, { n: 'Continuity and pipe friction loss', rf: 'Darcy', c: 'A₁V₁ = A₂V₂ = Q: a narrower pipe runs faster (V ∝ 1/D²). Darcy–Weisbach: h_f = fLV²/(2gD).',
    i: [['D1', 'Diameter D₁', 'm', 0.3, 0.01, 5, 0.01], ['D2', 'Diameter D₂', 'm', 0.15, 0.01, 5, 0.01], ['V1', 'Velocity V₁', 'm/s', 2, 0.01, 30, 0.01], ['f', 'Friction factor f', '', 0.02, 0.005, 0.1, 0.001], ['L', 'Length of pipe 2', 'm', 100, 1, 10000, 1]],
    o: [['Q', 'Flow Q = A₁V₁', 'm³/s', v => PI * v.D1 ** 2 / 4 * v.V1], ['V2', 'Velocity V₂', 'm/s', v => v.V1 * (v.D1 / v.D2) ** 2], ['hf', 'Head loss in pipe 2', 'm', v => v.f * v.L * v.V2 ** 2 / (2 * g0 * v.D2)]],
    fig: (v, F) => { const W = 600, H = 170, m = Math.max(v.D1, v.D2), h1 = 110 * v.D1 / m, h2 = 110 * v.D2 / m;
      return F.svg(W, H, `<path d="M20,${80 - h1 / 2} H260 L330,${80 - h2 / 2} H580 V${80 + h2 / 2} H330 L260,${80 + h1 / 2} H20 Z" fill="${B}" fill-opacity=".12" stroke="${B}" stroke-width="2"/>`
        + F.arrow(60, 80, 60 + clamp(v.V1 * 20, 10, 190), 80, B, 3) + F.arrow(360, 80, 360 + clamp(v.V2 * 20, 10, 210), 80, R, 3) + F.txt(60, 72 - h1 / 4, `V₁ ${F.t(v.V1)} m/s`, { c: 'fv', col: B }) + F.txt(360, 72 - h2 / 4, `V₂ ${F.t(v.V2)} m/s`, { c: 'fv', col: R })
        + F.txt(300, 162, `Q = ${F.t(v.Q)} m³/s on both sides`, { a: 'middle', c: 'fs' }), 'Pipe narrowing'); } });
  lab(275, { n: 'Hydrostatic pressure', rf: 'Hydrostatic pressure', c: 'p = ρgh: the gauge pressure grows linearly with depth and does not depend on the shape of the vessel.',
    i: [['rho', 'Density ρ', 'kg/m³', 1000, 1, 15000, 1], ['h', 'Depth h', 'm', 10, 0, 1000, 0.1]],
    o: [['p', 'Gauge pressure p = ρgh', 'kPa', v => v.rho * g0 * v.h / 1000], ['bar', 'in bar', 'bar', v => v.p / 100], ['hw', 'Equal water head', 'm', v => v.p * 1000 / (1000 * g0)]],
    fig: (v, F) => F.svg(600, 170, F.bar(220, 15, 160, 140, 1, `${B}55`) + F.line(380, 15 + 140 * clamp(1 - v.h / Math.max(v.h, 1) * 0.9, 0, 1), 470, 15 + 140 * 0.95, O, 1.6) + `<circle cx="300" cy="${15 + 140 * 0.95}" r="6" fill="${O}"/>`
      + F.txt(480, 150, `p = ${F.t(v.p)} kPa`, { c: 'fh', col: O }) + F.txt(200, 85, `h = ${F.t(v.h)} m`, { a: 'end', c: 'fv' }), 'Tank') });

  /* ---------- Physics ---------- */
  lab(283, { n: 'de Broglie wavelength of an electron', rf: 'de Broglie', c: 'λ = h/p = h/mv. An electron accelerated through V volts: λ = 12.27/√V Å. Four times the voltage → half the wavelength.',
    i: [['V', 'Accelerating voltage V', 'V', 100, 1, 100000, 1, 'log']],
    o: [['lam', 'Wavelength λ = 12.27/√V', 'Å', v => 12.27 / sq(v.V)], ['vel', 'Speed of the electron', 'm/s', v => sq(2 * e0 * v.V / 9.109e-31)]],
    ck: [[{ V: 100 }, { lam: 1.227 }, 'Vol 6 p 1704 · quick check']],
    fig: (v, F) => { const W = 600, H = 130, wl = clamp(v.lam / 1.227 * 60, 6, 260); let d = ''; for (let x = 0; x <= 520; x += 2) d += `${x ? 'L' : 'M'}${40 + x},${65 - 34 * Math.sin(2 * PI * x / wl)}`;
      return F.svg(W, H, `<path d="${d}" fill="none" stroke="${P}" stroke-width="2.4"/>` + F.arrow(40, 112, 40 + wl, 112, O, 1.8) + F.txt(44 + wl, 116, `λ = ${F.t(v.lam)} Å (at 100 V: 1.227 Å)`, { c: 'fv', col: O }), 'Electron wave'); } });
  lab(283, { n: 'Photon energy and Wien’s law', rf: 'Photon energy', c: 'E = hf = hc/λ; E(eV) = 1240/λ(nm). Wien: λ_max T = 2.898 × 10⁻³ m·K — the hotter the body, the shorter its peak wavelength.',
    i: [['lam', 'Wavelength λ', 'nm', 500, 100, 2000, 1], ['T', 'Temperature of the body T', 'K', 5800, 300, 20000, 10, 'log']],
    o: [['E', 'Photon energy E = 1240/λ', 'eV', v => 1240 / v.lam], ['f', 'Frequency f = c/λ', 'Hz', v => 3e8 / (v.lam * 1e-9)], ['lmax', 'Peak wavelength λ_max = b/T', 'nm', v => 2.898e-3 / v.T * 1e9]],
    ck: [[{ T: 5800 }, { lmax: 500 }, 'Vol 6 p 1705 · quick check'], [{ lam: 620 }, { E: 2.0 }, 'Vol 6 p 1704 · quick check: a 620 nm photon']],
    fig: (v, F) => { const W = 600, H = 140, x = n => 30 + (clamp(n, 100, 2000) - 100) / 1900 * 540;
      return F.svg(W, H, `<defs><linearGradient id="fgs" x1="0" x2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="${(x(380) - 30) / 540}" stop-color="#7c3aed"/><stop offset="${(x(450) - 30) / 540}" stop-color="#2563eb"/><stop offset="${(x(520) - 30) / 540}" stop-color="#16a34a"/><stop offset="${(x(580) - 30) / 540}" stop-color="#eab308"/><stop offset="${(x(650) - 30) / 540}" stop-color="#dc2626"/><stop offset="${(x(750) - 30) / 540}" stop-color="#7f1d1d"/><stop offset="1" stop-color="#3f0d0d"/></linearGradient></defs><rect x="30" y="50" width="540" height="30" rx="6" fill="url(#fgs)"/>`
        + F.txt(30, 98, '100 nm UV', { c: 'fs' }) + F.txt(x(565), 98, 'visible', { a: 'middle', c: 'fs' }) + F.txt(570, 98, '2000 nm IR', { a: 'end', c: 'fs' })
        + `<path d="M${x(v.lam)},44 l-7,-12 h14 z" fill="var(--ink)"/>` + F.txt(x(v.lam), 26, `λ ${F.t(v.lam)} nm · ${F.t(v.E)} eV`, { a: 'middle', c: 'fv' })
        + `<path d="M${x(v.lmax)},86 l-7,12 h14 z" fill="${O}"/>` + F.txt(x(v.lmax), 126, `peak at ${F.t(v.T)} K: ${F.t(v.lmax)} nm`, { a: 'middle', c: 'fv', col: O }), 'Spectrum'); } });
  lab(283, { n: 'X-ray tube — current, voltage and the shortest wavelength', rf: 'X-ray radiography', c: 'Beam current I = (electrons per second) × e; power P = VI. The shortest X-ray wavelength λ_min = hc/eV = 12.4/V(kV) Å.',
    i: [['ne', 'Electrons per second', '/s', 1e15, 1e12, 1e19, 1e12, 'log'], ['P', 'Power', 'W', 4, 0.1, 100000, 0.1, 'log']],
    o: [['I', 'Current I = n e', 'A', v => v.ne * e0], ['V', 'Voltage V = P/I', 'kV', v => v.P / v.I / 1000], ['lmin', 'λ_min = 12.4/V(kV)', 'Å', v => 12.4 / v.V]],
    ck: [[{ ne: 1e15, P: 4 }, { V: 25 }, 'Question Book B3 · UPSC ESE 2026 Paper II · Q103 (p 240)']],
    fig: (v, F) => { const W = 600, H = 150; let el = ''; for (let i = 0; i < 6; i++) el += `<circle cx="${190 + i * 36}" cy="75" r="4" fill="${B}"/>`;
      return F.svg(W, H, `<rect x="120" y="30" width="360" height="90" rx="45" fill="none" stroke="var(--ink-2)" stroke-width="2.4"/><rect x="150" y="55" width="16" height="40" fill="#64748b"/><path d="M430,50 L460,75 L430,100 Z" fill="#64748b"/>` + el
        + F.wire('M190,75 H420', B, Math.log10(v.ne) - 11) + F.arrow(440, 100, 500, 140, P, 2) + F.arrow(452, 96, 540, 120, P, 2) + F.txt(158, 26, 'cathode', { a: 'middle', c: 'fs' }) + F.txt(448, 26, 'anode', { a: 'middle', c: 'fs' })
        + F.txt(300, 140, `${F.t(v.V)} kV · ${F.t(v.I)} A`, { a: 'middle', c: 'fh' }), 'X-ray tube'); } });
  lab(283, { n: 'Young’s double slit — fringe width', rf: 'Young', c: 'β = λD/d. Wider fringes with a longer wavelength or a farther screen; narrower with slits farther apart.',
    i: [['lam', 'Wavelength λ', 'nm', 600, 300, 1000, 1], ['D', 'Slit-to-screen distance D', 'm', 1, 0.1, 5, 0.01], ['d', 'Slit separation d', 'mm', 0.5, 0.05, 5, 0.01]],
    o: [['beta', 'Fringe width β = λD/d', 'mm', v => v.lam * 1e-9 * v.D / (v.d * 1e-3) * 1e3]],
    fig: (v, F) => { const W = 600, H = 120, px = clamp(v.beta * 40, 6, 300); let g = ''; for (let x = -300; x <= 300; x += 3) { const I = Math.cos(PI * x / px) ** 2; g += `<rect x="${300 + x}" y="20" width="3.2" height="60" fill="${B}" fill-opacity="${I.toFixed(2)}"/>`; }
      return F.svg(W, H, g + F.arrow(300, 96, 300 + px, 96, O, 1.8) + F.txt(306 + px, 100, `β = ${F.t(v.beta)} mm`, { c: 'fv', col: O }), 'Fringe pattern'); } });
  lab(283, { n: 'Optical fibre — numerical aperture', rf: 'Fibre optics', c: 'NA = √(n₁² − n₂²) = sin θ_a; Δ = (n₁ − n₂)/n₁; NA ≈ n₁√(2Δ). Light inside the acceptance cone is guided by total internal reflection.',
    i: [['n1', 'Core index n₁', '', 1.5, 1.01, 3, 0.001], ['n2', 'Cladding index n₂', '', 1.46, 1, 3, 0.001]],
    o: [['NA', 'NA = √(n₁² − n₂²)', '', v => sq(Math.max(0, v.n1 ** 2 - v.n2 ** 2))], ['ta', 'Acceptance angle θ_a', '°', v => Math.asin(Math.min(1, v.NA)) * 180 / PI], ['dl', 'Δ = (n₁ − n₂)/n₁', '', v => (v.n1 - v.n2) / v.n1], ['tc', 'Critical angle at the core wall', '°', v => Math.asin(Math.min(1, v.n2 / v.n1)) * 180 / PI]],
    fig: (v, F) => { const W = 600, H = 170, a = clamp(v.ta, 0, 80), y0 = 85, L = 60; let d = `M60,${y0}`, x = 60, y = y0, s = 1; const tr = rad(Math.asin(Math.sin(rad(a)) / v.n1) * 180 / PI);
      while (x < 560) { const dx = Math.min(560 - x, (40 / Math.max(Math.tan(tr), 0.05))); x += dx; y = y0 - s * 40 * dx / (40 / Math.max(Math.tan(tr), 0.05)); d += ` L${x.toFixed(1)},${y.toFixed(1)}`; s = -s; if (dx < 1) break; }
      return F.svg(W, H, `<rect x="100" y="30" width="480" height="110" fill="${B}" fill-opacity=".08"/><rect x="100" y="45" width="480" height="80" fill="${B}" fill-opacity=".14"/>` + `<path d="M100,${y0} L${100 - L},${y0 - L * Math.tan(rad(a))} M100,${y0} L${100 - L},${y0 + L * Math.tan(rad(a))}" stroke="${O}" stroke-width="1.6" stroke-dasharray="4 4"/>`
        + `<path d="M40,${y0 + 20 * Math.tan(rad(a))} L100,${y0}" stroke="${R}" stroke-width="2.4"/><path d="${d.replace('M60', 'M100')}" fill="none" stroke="${R}" stroke-width="2.4"/>` + F.txt(30, 22, `θ_a = ${F.t(v.ta)}° · NA = ${F.t(v.NA)}`, { c: 'fh' }) + F.txt(590, 160, 'core n₁ · cladding n₂', { a: 'end', c: 'fs' }), 'Optical fibre'); } });
  lab(283, { n: 'Beats and the musical interval', rf: 'Beats', c: 'Beat frequency = |f₁ − f₂|. The musical interval is the RATIO f₁/f₂ (not the difference): 320 and 240 Hz → 4/3.',
    i: [['f1', 'f₁', 'Hz', 320, 1, 5000, 1], ['f2', 'f₂', 'Hz', 240, 1, 5000, 1]],
    o: [['fb', 'Beat frequency |f₁ − f₂|', 'Hz', v => Math.abs(v.f1 - v.f2)], ['iv', 'Musical interval f₁/f₂', '', v => v.f1 / v.f2]],
    ck: [[{ f1: 320, f2: 240 }, { iv: 4 / 3, fb: 80 }, 'Question Book B1 · TANGEDCO AE 2018 · Q31 (p 239)']],
    fig: (v, F) => { const W = 600, H = 160, sc = 12 / Math.max(v.f1, v.f2); let a = '', b = '', c = ''; for (let i = 0; i <= 560; i += 1.5) { const t = i / 560, y1 = Math.sin(2 * PI * v.f1 * sc * t * 4), y2 = Math.sin(2 * PI * v.f2 * sc * t * 4); a += `${i ? 'L' : 'M'}${20 + i},${35 - 14 * y1}`; b += `${i ? 'L' : 'M'}${20 + i},${80 - 14 * y2}`; c += `${i ? 'L' : 'M'}${20 + i},${128 - 12 * (y1 + y2)}`; }
      return F.svg(W, H, `<path d="${a}" fill="none" stroke="${O}" stroke-width="1.8"/><path d="${b}" fill="none" stroke="${B}" stroke-width="1.8"/><path d="${c}" fill="none" stroke="${P}" stroke-width="2"/>` + F.txt(24, 14, `f₁ ${F.t(v.f1)} Hz`, { c: 'fs', col: O }) + F.txt(24, 60, `f₂ ${F.t(v.f2)} Hz`, { c: 'fs', col: B }) + F.txt(24, 104, `together: beats ${F.t(v.fb)} Hz · interval ${F.t(v.iv)}`, { c: 'fs', col: P }), 'Two tones and their sum'); } });

  /* ---------- Chemistry, Materials & Environment ---------- */
  lab(296, { n: 'Resistance changes with temperature', rf: 'Temperature coefficient', c: 'R₂ = R₁[1 + α(T₂ − T₁)]. Metals: α > 0, R rises when hot (copper α ≈ 0.004/°C). Semiconductors have a negative coefficient: R falls when heated.',
    i: [['R1', 'R₁', 'Ω', 10, 0.001, 100000, 0.001, 'log'], ['T1', 'at T₁', '°C', 20, -100, 500, 1], ['al', 'α at T₁', '/°C', 0.00393, -0.08, 0.01, 0.00001], ['T2', 'New temperature T₂', '°C', 75, -100, 1000, 1]],
    o: [['R2', 'R₂ = R₁[1 + α(T₂ − T₁)]', 'Ω', v => v.R1 * (1 + v.al * (v.T2 - v.T1))], ['pc', 'Change', '%', v => (v.R2 / v.R1 - 1) * 100]],
    ck: [[{ R1: 10, T1: 20, al: 0.00393, T2: 75 }, { R2: 12.16 }, 'Vol 2 p 302 · Sum 1'], [{ R1: 10, T1: 20, al: 0.004, T2: 70 }, { pc: 20 }, 'Vol 2 p 303 · R1']],
    fig: (v, F) => { const hot = clamp((v.T2 + 50) / 600, 0, 1);
      return F.svg(600, 150, F.coil(150, 30, 120, 6, `rgb(${Math.round(37 + 183 * hot)},${Math.round(99 - 60 * hot)},${Math.round(235 - 200 * hot)})`, 1) + F.coil(150, 30, 120, 6, 'transparent', -1)
        + F.bar(330, 20, 22, 110, clamp((v.T2 + 100) / 1100, 0, 1), R) + F.txt(360, 30, `${F.t(v.T2)} °C`, { c: 'fv', col: R }) + F.txt(210, 70, `R ${F.t(v.R1)} → ${F.t(v.R2)} Ω`, { c: 'fh' }) + F.txt(210, 94, `${v.pc >= 0 ? '+' : ''}${F.t(v.pc)} %`, { c: 'fv', col: v.pc >= 0 ? R : B }), 'Coil and thermometer'); } });
  lab(296, { n: 'Resistance of a wire', rf: 'Resistance of a wire', c: 'R = ρL/A. Double the length → double R; double the diameter → a quarter of R.',
    i: [['rho', 'Resistivity ρ', 'Ω·m', 1.72e-8, 1e-9, 1e-5, 1e-10, 'log'], ['L', 'Length L', 'm', 100, 0.01, 100000, 0.01, 'log'], ['A', 'Area A', 'mm²', 1, 0.01, 1000, 0.01, 'log']],
    o: [['R', 'R = ρL/A', 'Ω', v => v.rho * v.L / (v.A * 1e-6)], ['d', 'Diameter for this area', 'mm', v => sq(4 * v.A / PI)]],
    ck: [[{ rho: 1.72e-8, L: 100, A: 1 }, { R: 1.72 }, 'Vol 2 p 302 · Sum 2']],
    fig: (v, F) => { const h = clamp(sq(v.A) * 12, 4, 60), w = clamp(Math.log10(v.L) * 120, 60, 520);
      return F.svg(600, 120, `<rect x="40" y="${55 - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${O}" fill-opacity=".7"/>` + F.txt(40 + w / 2, 104, `L = ${F.t(v.L)} m · A = ${F.t(v.A)} mm²`, { a: 'middle', c: 'fs' }) + F.txt(580, 24, `R = ${F.t(v.R)} Ω`, { a: 'end', c: 'fh' }), 'Wire'); } });
  lab(296, { n: 'Electroplating — Faraday’s law', rf: 'Faraday', c: 'm = ZIt (Z = electro-chemical equivalent, M/nF). Double the current or the time → double the mass deposited.',
    i: [['Z', 'Z (ECE)', 'mg/C', 0.329, 0.001, 5, 0.001], ['I', 'Current I', 'A', 2, 0.01, 1000, 0.01], ['t', 'Time t', 's', 3600, 1, 360000, 1]],
    o: [['q', 'Charge Q = It', 'C', v => v.I * v.t], ['m', 'Mass deposited m = ZIt', 'g', v => v.Z * 1e-3 * v.q]],
    ck: [[{ Z: 0.329, I: 2, t: 3600 }, { m: 2.37 }, 'Vol 2 p 302 · Sum 3']],
    fig: (v, F) => { const th = clamp(Math.log10(1 + v.m) * 10, 1, 26); let ions = ''; for (let i = 0; i < 6; i++) ions += F.arrow(330 - i % 2 * 10, 70 + i * 14, 250 + i % 2 * 10, 70 + i * 14, O, 1.4);
      return F.svg(600, 190, `<rect x="140" y="50" width="320" height="120" rx="8" fill="${B}" fill-opacity=".12" stroke="var(--ink-2)"/><rect x="200" y="30" width="${10 + th}" height="120" fill="${O}" fill-opacity=".85"/><rect x="200" y="30" width="10" height="120" fill="#64748b"/><rect x="390" y="30" width="14" height="120" fill="${O}"/>`
        + ions + F.wire('M205,30 V12 H397 V30', 'var(--ink-2)', v.I / 4) + F.txt(205, 184, 'cathode (plated)', { a: 'middle', c: 'fs' }) + F.txt(397, 184, 'copper anode', { a: 'middle', c: 'fs' }) + F.txt(560, 100, `${F.t(v.m)} g`, { a: 'end', c: 'fh', col: O }), 'Electrolytic cell'); } });
  lab(296, { n: 'pH of an acid or a base', rf: 'pH', c: 'pH = −log[H⁺], pH + pOH = 14 (25 °C). Ten times the acid → pH falls by 1. 0.001 M HCl (a strong acid) → pH 3.',
    i: [['H', '[H⁺]', 'mol/L', 0.001, 1e-14, 1, 1e-15, 'log']],
    o: [['pH', 'pH = −log[H⁺]', '', v => -Math.log10(v.H)], ['pOH', 'pOH = 14 − pH', '', v => 14 - v.pH], ['OH', '[OH⁻]', 'mol/L', v => 10 ** -v.pOH], ['kind', 'Solution', '', v => v.pH < 6.95 ? 'acidic' : v.pH > 7.05 ? 'basic' : 'neutral']],
    ck: [[{ H: 0.001 }, { pH: 3 }, 'Vol 2 p 302 · Sum 4']],
    fig: (v, F) => F.svg(600, 110, `<defs><linearGradient id="fgp" x1="0" x2="1"><stop offset="0" stop-color="#dc2626"/><stop offset=".35" stop-color="#f59e0b"/><stop offset=".5" stop-color="#16a34a"/><stop offset=".7" stop-color="#0ea5e9"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs><rect x="30" y="40" width="540" height="26" rx="6" fill="url(#fgp)"/>`
      + [0, 7, 14].map(k => F.txt(30 + 540 * k / 14, 86, String(k), { a: 'middle', c: 'fs' })).join('') + `<path d="M${30 + 540 * clamp(v.pH, 0, 14) / 14},36 l-8,-14 h16 z" fill="var(--ink)"/>` + F.txt(30 + 540 * clamp(v.pH, 0, 14) / 14, 16, `pH ${F.t(v.pH)} · ${v.kind}`, { a: 'middle', c: 'fv' }), 'pH scale') });
  lab(296, { n: 'Free electrons — drift velocity and conductivity', rf: 'Free-electron', c: 'Drift velocity v_d = J/(nq) — millimetres per second, although signals travel near the speed of light. Drude: σ = ne²τ/m.',
    i: [['J', 'Current density J', 'A/m²', 1e7, 1, 1e10, 1, 'log'], ['n', 'Free electrons n', '/m³', 1e28, 1e20, 1e30, 1e19, 'log'], ['tau', 'Collision time τ', 's', 2e-14, 1e-16, 1e-11, 1e-17, 'log']],
    o: [['vd', 'Drift velocity v_d = J/(ne)', 'm/s', v => v.J / (v.n * e0)], ['sig', 'Conductivity σ = ne²τ/m', 'S/m', v => v.n * e0 ** 2 * v.tau / 9.1e-31], ['mu', 'Mobility μ = eτ/m', 'm²/V·s', v => e0 * v.tau / 9.1e-31]],
    ck: [[{ J: 1e7, n: 1e28 }, { vd: 6.24e-3 }, 'Question Book B2 · UPSC ESE 2026 Paper II · Q91 (p 246)'], [{ n: 8.5e28, tau: 2e-14 }, { sig: 4.8e7 }, 'Question Book B3 · UPSC ESE 2026 Paper II · Q98 (p 246)']],
    fig: (v, F) => { let e = ''; for (let i = 0; i < 14; i++) e += `<circle cx="${50 + i * 37}" cy="${50 + (i * 37) % 40}" r="5" fill="${B}"/>`;
      return F.svg(600, 130, `<rect x="30" y="30" width="540" height="60" rx="30" fill="${O}" fill-opacity=".14" stroke="${O}"/>` + e + F.wire('M40,60 H560', B, Math.log10(v.vd * 1e5)) + F.txt(300, 118, `v_d = ${F.t(v.vd)} m/s (slow drift) · σ = ${F.t(v.sig)} S/m`, { a: 'middle', c: 'fs' }), 'Electrons drifting'); } });
  lab(296, { n: 'Matthiessen’s rule — impurity resistivity', rf: 'Matthiessen', c: 'ρ = ρ_thermal(T) + ρ_impurity. The alloy’s extra resistivity over the pure metal is the impurity part (nearly independent of temperature).',
    i: [['rt', 'Alloy resistivity', '× 10⁻⁸ Ω·m', 7.0, 0.1, 200, 0.01], ['rp', 'Pure metal resistivity', '× 10⁻⁸ Ω·m', 1.8, 0.1, 200, 0.01]],
    o: [['ri', 'Impurity part ρ_i = ρ − ρ_pure', '× 10⁻⁸ Ω·m', v => v.rt - v.rp], ['sh', 'Share of the impurity part', '%', v => (v.rt - v.rp) / v.rt * 100]],
    ck: [[{ rt: 7.0, rp: 1.8 }, { ri: 5.2 }, 'Question Book B4 · UPSC ESE 2026 Paper II · Q100 (p 247)']],
    fig: (v, F) => { const s = 440 / Math.max(v.rt, v.rp, 1e-9);
      return F.svg(600, 100, `<rect x="120" y="20" width="${v.rp * s}" height="26" fill="${B}"/><rect x="${120 + v.rp * s}" y="20" width="${Math.max(0, v.ri) * s}" height="26" fill="${O}"/>` + F.txt(112, 38, 'alloy', { a: 'end', c: 'fs' })
        + F.txt(120, 66, `thermal ${F.t(v.rp)}`, { c: 'fv', col: B }) + F.txt(120 + v.rp * s, 86, `+ impurity ${F.t(v.ri)}`, { c: 'fv', col: O }), 'Resistivity split'); } });

  /* ---------- Computers & C Programming ---------- */
  lab(308, { n: 'C integer division and remainder', rf: 'C basics', c: 'With int operands, a/b keeps only the whole part (truncates towards zero) and a%b is the remainder: a = (a/b)·b + a%b. % needs integers.',
    i: [['a', 'int a', '', 7, -60, 60, 1], ['b', 'int b', '', 2, 1, 12, 1]],
    o: [['q', 'a / b', '', v => Math.trunc(v.a / v.b)], ['r', 'a % b', '', v => v.a - Math.trunc(v.a / v.b) * v.b], ['f', '(float) a / b', '', v => v.a / v.b]],
    ck: [[{ a: 7, b: 2 }, { q: 3, r: 1 }, 'Vol 2 p 310 · Sum 1']],
    fig: (v, F) => { const n = Math.min(Math.abs(v.a), 60), b = Math.max(1, v.b), full = Math.abs(v.q) * b; let g = ''; for (let i = 0; i < n; i++) { const grp = Math.floor(i / b), x = 30 + i * 9 + grp * 8; g += `<rect x="${x}" y="40" width="7" height="22" rx="2" fill="${i < full ? B : O}"/>`; }
      return F.svg(600, 110, g + F.txt(30, 26, `${v.a} items in groups of ${v.b}: ${v.q} full groups (blue), remainder ${v.r} (orange)`, { c: 'fs' }) + F.txt(30, 92, `printf("%d %d", a/b, a%b); → ${v.q} ${v.r}`, { c: 'fv' }), 'Groups and remainder'); } });
  lab(308, { n: 'A for loop that adds — trace it', rf: 'C basics', c: 'for (i = a; i <= b; i++) s += i; adds every i from a to b. Watch the bounds: i < 5 stops at 4. Sum a..b = (b − a + 1)(a + b)/2.',
    i: [['a', 'Start i = a', '', 0, -20, 50, 1], ['b', 'Last value of i (≤)', '', 4, -20, 100, 1]],
    o: [['n', 'Times the loop body runs', '', v => Math.max(0, v.b - v.a + 1)], ['s', 'Final s', '', v => v.n * (v.a + v.b) / 2]],
    ck: [[{ a: 0, b: 4 }, { s: 10 }, 'Vol 2 p 311 · Sum 2 (for i = 0; i < 5)'], [{ a: 1, b: 5 }, { s: 15 }, 'Vol 2 p 311 · Sum 4 (for i = 1; i <= 5)']],
    fig: (v, F) => { let g = '', s = 0; const L = []; for (let i = v.a; i <= v.b && L.length < 12; i++) { s += i; L.push([i, s]); }
      L.forEach(([i, sm], k) => { g += `<rect x="${30 + k * 46}" y="40" width="40" height="28" rx="5" fill="${B}" fill-opacity=".14" stroke="${B}"/>` + F.txt(50 + k * 46, 59, String(i), { a: 'middle', c: 'fv' }) + F.txt(50 + k * 46, 88, String(sm), { a: 'middle', c: 'fs', col: O }); });
      return F.svg(600, 120, F.txt(30, 24, `for (i = ${v.a}; i <= ${v.b}; i++) s += i;`, { c: 'fv' }) + g + F.txt(24, 59, 'i', { a: 'end', c: 'fs' }) + F.txt(24, 88, 's', { a: 'end', c: 'fs', col: O }) + (v.n > 12 ? F.txt(580, 112, `… ${v.n} steps in all`, { a: 'end', c: 'fs' }) : ''), 'Loop trace'); } });
  lab(308, { n: 'Address bus width and memory size', rf: 'Computer organisation', c: 'An n-bit address bus reaches 2ⁿ locations: 16 bits → 65,536 = 64 KB (1 byte each); 20 bits → 1 MB; 32 bits → 4 GB.',
    i: [['bits', 'Address lines n', '', 16, 1, 40, 1]],
    o: [['N', 'Locations 2ⁿ', '', v => 2 ** v.bits], ['sz', 'Memory (1 byte each)', '', v => { const u = ['bytes', 'KB', 'MB', 'GB', 'TB'], k = Math.min(4, Math.floor(v.bits / 10)); return `${2 ** (v.bits - 10 * k)} ${u[k]}`; }]],
    ck: [[{ bits: 16 }, { sz: '64 KB' }, 'Vol 2 p 311 · Sum 3']],
    fig: (v, F) => { let g = ''; const n = Math.min(v.bits, 40); for (let i = 0; i < n; i++) g += F.line(120, 20 + i * 100 / n, 440, 20 + i * 100 / n, B, 1.4);
      return F.svg(600, 140, `<rect x="40" y="16" width="80" height="108" rx="8" fill="${O}" fill-opacity=".2" stroke="${O}"/><rect x="440" y="16" width="120" height="108" rx="8" fill="${G}" fill-opacity=".15" stroke="${G}"/>` + g + F.txt(80, 74, 'CPU', { a: 'middle', c: 'fh' }) + F.txt(500, 66, 'memory', { a: 'middle', c: 'fs' }) + F.txt(500, 88, v.sz, { a: 'middle', c: 'fh', col: G }) + F.txt(280, 136, `${v.bits} address lines`, { a: 'middle', c: 'fs' }), 'Address bus'); } });
  lab([308, 316], { n: 'Number bases — binary, octal, hexadecimal', rf: 'bases', c: 'Divide by the base and read the remainders upward. Binary → hex: group 4 bits from the right (11001 = 1 1001 = 19₁₆).',
    i: [['N', 'Decimal number', '', 25, 0, 65535, 1]],
    o: [['b2', 'Binary', '', v => Math.round(v.N).toString(2)], ['b8', 'Octal', '', v => Math.round(v.N).toString(8)], ['b16', 'Hexadecimal', '', v => Math.round(v.N).toString(16).toUpperCase()]],
    ck: [[{ N: 25 }, { b2: '11001', b16: '19' }, 'Vol 2 p 311 · Sum 6']],
    fig: (v, F) => { const s = v.b2.padStart(Math.max(8, v.b2.length), '0').slice(-16), n = s.length, w = Math.min(34, 540 / n); let g = '';
      for (let i = 0; i < n; i++) { const on = s[i] === '1'; g += `<rect x="${30 + i * w}" y="36" width="${w - 3}" height="30" rx="4" fill="${on ? B : 'var(--paper)'}" stroke="${B}"/>` + F.txt(30 + i * w + (w - 3) / 2, 56, s[i], { a: 'middle', c: 'fv', col: on ? '#fff' : 'var(--ink-2)' }) + F.txt(30 + i * w + (w - 3) / 2, 82, String(2 ** (n - 1 - i)), { a: 'middle', c: 'fs', s: 9 }); }
      return F.svg(600, 110, g + F.txt(30, 24, `${Math.round(v.N)} = ${v.b2}₂ = ${v.b8}₈ = ${v.b16}₁₆`, { c: 'fh' }), 'Place values'); } });
  lab(308, { n: 'Pointers and arrays — *(p + k)', rf: 'Pointers', c: 'int a[] = {2, 4, 6}; int *p = a; then *(p + k) is a[k]. p + 1 moves by sizeof(int) bytes (4 here), not by 1 byte.',
    i: [['k', 'k in *(p + k)', '', 2, 0, 2, 1], ['base', 'Address of a[0]', '', 1000, 0, 65535, 4]],
    o: [['val', '*(p + k)', '', v => [2, 4, 6][clamp(Math.round(v.k), 0, 2)]], ['addr', 'Address p + k', '', v => v.base + 4 * Math.round(v.k)]],
    ck: [[{ k: 2 }, { val: 6 }, 'Vol 2 p 311 · Sum 5']],
    fig: (v, F) => { const k = clamp(Math.round(v.k), 0, 2); let g = ''; [2, 4, 6].forEach((x, i) => { g += `<rect x="${170 + i * 100}" y="50" width="96" height="40" rx="6" fill="${i === k ? O : B}" fill-opacity="${i === k ? '.8' : '.14'}" stroke="${B}"/>` + F.txt(218 + i * 100, 76, String(x), { a: 'middle', c: 'fh', col: i === k ? '#fff' : 'var(--ink)' }) + F.txt(218 + i * 100, 108, `a[${i}] · ${v.base + 4 * i}`, { a: 'middle', c: 'fs' }); });
      return F.svg(600, 130, g + F.txt(30, 76, 'p →', { c: 'fh', col: P }) + F.arrow(70, 70, 168 + k * 100, 70, P, 2) + F.txt(30, 26, `*(p + ${k}) = a[${k}] = ${v.val}`, { c: 'fv' }), 'Array in memory'); } });
  lab(308, { n: 'Mirrored drives — mean time to data loss', rf: 'Reliability', c: 'Availability = MTBF/(MTBF + MTTR). A mirrored pair loses data only if the second drive fails during the repair of the first: MTTDL ≈ MTBF²/(2 × MTTR).',
    i: [['mtbf', 'MTBF of one drive', 'h', 100000, 100, 1e7, 1, 'log'], ['mttr', 'MTTR', 'h', 10, 0.1, 1000, 0.1, 'log']],
    o: [['A', 'Availability of one drive', '%', v => v.mtbf / (v.mtbf + v.mttr) * 100], ['mttdl', 'MTTDL ≈ MTBF²/(2·MTTR)', 'h', v => v.mtbf ** 2 / (2 * v.mttr)], ['yr', 'in years', 'years', v => v.mttdl / 8760]],
    ck: [[{ mtbf: 100000, mttr: 10 }, { mttdl: 5e8, yr: 57000 }, 'Question Book B1 · UPSC ESE 2026 Paper II · Q137 (p 250)', 0.02]],
    fig: (v, F) => F.svg(600, 120, [0, 1].map(i => `<rect x="${120 + i * 220}" y="30" width="140" height="60" rx="10" fill="${B}" fill-opacity=".14" stroke="${B}"/>` + F.txt(190 + i * 220, 66, `drive ${i + 1}`, { a: 'middle', c: 'fv' })).join('') + F.line(260, 60, 340, 60, G, 2, '5 4') + F.txt(300, 50, 'mirror', { a: 'middle', c: 'fs', col: G })
      + F.txt(300, 112, `MTTDL ≈ ${F.t(v.yr)} years`, { a: 'middle', c: 'fh' }), 'Mirrored pair') });

  /* ---------- General Aptitude ---------- */
  lab(316, { n: 'Work together — and pipes that fill or empty', rf: 'Time, speed, distance & work', c: 'Rates add: 1/T = 1/T₁ + 1/T₂. An emptying pipe (a leak) subtracts: 1/T = 1/T₁ − 1/T₂.',
    i: [['T1', 'A (or the filling pipe) alone', 'h or days', 12, 0.1, 200, 0.1], ['T2', 'B (or the second pipe) alone', 'h or days', 18, 0.1, 200, 0.1], ['m', 'B', '', 'helps', ['helps', 'empties (a leak)']]],
    o: [['r', 'Part done per unit time', '', v => 1 / v.T1 + (v.m === 'helps' ? 1 : -1) / v.T2], ['T', 'Time for the whole job', '', v => v.r > 0 ? 1 / v.r : NaN]],
    ck: [[{ T1: 12, T2: 18 }, { T: 7.2 }, 'Vol 2 p 327 · Sum 6'], [{ T1: 6, T2: 9, m: 'empties (a leak)' }, { T: 18 }, 'Vol 2 p 327 · Sum 7'], [{ T1: 2, T2: 4 }, { T: 4 / 3 }, 'Vol 5 p 1421 · sheet: pipes 2 h and 4 h together → 4/3 h']],
    fig: (v, F) => { const f1 = 1 / v.T1, f2 = (v.m === 'helps' ? 1 : -1) / v.T2, sc = 300 / Math.max(f1, Math.abs(f2), Math.abs(v.r), 1e-9);
      return F.svg(600, 140, `<rect x="150" y="20" width="${f1 * sc}" height="24" fill="${B}"/><rect x="150" y="56" width="${Math.abs(f2) * sc}" height="24" fill="${f2 >= 0 ? G : R}"/><rect x="150" y="92" width="${Math.max(0, v.r) * sc}" height="24" fill="${P}"/>`
        + F.txt(142, 37, `A: 1/${F.t(v.T1)}`, { a: 'end', c: 'fs' }) + F.txt(142, 73, `B: ${f2 >= 0 ? '+' : '−'}1/${F.t(v.T2)}`, { a: 'end', c: 'fs' }) + F.txt(142, 109, 'together', { a: 'end', c: 'fs' }) + F.txt(160 + Math.max(0, v.r) * sc, 109, Number.isFinite(v.T) ? `→ ${F.t(v.T)}` : 'never fills', { c: 'fv', col: P }), 'Rates'); } });
  lab(316, { n: 'Boats and streams', rf: 'Boats, streams', c: 'Downstream = u + v, upstream = u − v → still water u = (down + up)/2, stream v = (down − up)/2.',
    i: [['dn', 'Downstream speed', 'km/h', 18, 0.1, 200, 0.1], ['up', 'Upstream speed', 'km/h', 12, 0, 200, 0.1]],
    o: [['u', 'Boat in still water', 'km/h', v => (v.dn + v.up) / 2], ['s', 'Stream', 'km/h', v => (v.dn - v.up) / 2]],
    ck: [[{ dn: 18, up: 12 }, { u: 15, s: 3 }, 'Vol 2 p 328 · Sum 17'], [{ dn: 6, up: 2 }, { u: 4, s: 2 }, 'Vol 5 p 1421 · sheet: up 2, down 6 → still water 4']],
    fig: (v, F) => { const s = 220 / Math.max(v.dn, 1e-9);
      return F.svg(600, 150, `<rect x="0" y="40" width="600" height="80" fill="${B}" fill-opacity=".14"/>` + F.wire('M20,110 H580', B, v.s / 3) + F.arrow(300, 60, 300 + v.dn * s, 60, G, 3) + F.arrow(300, 88, 300 - v.up * s, 88, R, 3)
        + F.txt(304 + v.dn * s, 56, `down ${F.t(v.dn)}`, { c: 'fv', col: G }) + F.txt(296 - v.up * s, 84, `up ${F.t(v.up)}`, { a: 'end', c: 'fv', col: R }) + F.txt(300, 142, `boat ${F.t(v.u)} km/h · stream ${F.t(v.s)} km/h →`, { a: 'middle', c: 'fh' }), 'River'); } });
  lab(316, { n: 'Clock — angle between the hands', rf: 'Clock, calendar', c: 'θ = |30H − 5.5M|. The minute hand moves 6°/min, the hour hand 0.5°/min; if θ > 180°, the other angle is 360° − θ.',
    i: [['H', 'Hour H', '', 3, 0, 12, 1], ['M', 'Minutes M', '', 30, 0, 59, 1]],
    o: [['th', 'θ = |30H − 5.5M|', '°', v => Math.abs(30 * (v.H % 12) - 5.5 * v.M)], ['sm', 'Smaller angle', '°', v => Math.min(v.th, 360 - v.th)]],
    ck: [[{ H: 3, M: 30 }, { sm: 75 }, 'Vol 6 p 1705 · quick check'], [{ H: 4, M: 20 }, { sm: 10 }, 'Vol 2 p 328 · Sum 12']],
    fig: (v, F) => { const cx = 300, cy = 100, r = 80, ha = rad(30 * (v.H % 12) + 0.5 * v.M - 90), ma = rad(6 * v.M - 90); let tk = ''; for (let i = 0; i < 12; i++) { const a = rad(i * 30 - 90); tk += F.line(cx + (r - 10) * Math.cos(a), cy + (r - 10) * Math.sin(a), cx + r * Math.cos(a), cy + r * Math.sin(a), 'var(--ink-2)', 2) + F.txt(cx + (r - 22) * Math.cos(a), cy + (r - 22) * Math.sin(a) + 4, String(i || 12), { a: 'middle', c: 'fs' }); }
      return F.svg(600, 200, `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--paper)" stroke="var(--ink-2)" stroke-width="2.4"/>` + tk + F.line(cx, cy, cx + 46 * Math.cos(ha), cy + 46 * Math.sin(ha), O, 5) + F.line(cx, cy, cx + 68 * Math.cos(ma), cy + 68 * Math.sin(ma), B, 3)
        + F.txt(cx, 196, `${v.H}:${String(v.M).padStart(2, '0')} → ${F.t(v.sm)}°`, { a: 'middle', c: 'fh' }), 'Clock face'); } });
  lab(316, { n: 'Unit digit of a power', rf: 'Unit-digit cyclicity', c: 'Last digits repeat with period 4 (2: 2,4,8,6; 3: 3,9,7,1; 7: 7,9,3,1; 8: 8,4,2,6); 0, 1, 5, 6 never change. Use n mod 4 (0 → the 4th in the cycle).',
    i: [['a', 'Base a', '', 3, 0, 999, 1], ['n', 'Power n', '', 424, 1, 100000, 1]],
    o: [['u', 'Unit digit of aⁿ', '', v => { let r = 1; const d = Math.round(v.a) % 10; for (let k = 0; k < ((Math.round(v.n) - 1) % 4) + 1 + 4; k++) r = (r * d) % 10; return r; }], ['m4', 'n mod 4', '', v => Math.round(v.n) % 4]],
    ck: [[{ a: 3, n: 424 }, { u: 1 }, 'Question Book B32 · GATE EE 2016 Set 2 · GA Q.10 (p 89)']],
    fig: (v, F) => { const d = Math.round(v.a) % 10, cyc = [1, 2, 3, 4].map(k => { let r = 1; for (let i = 0; i < k; i++) r = r * d % 10; return r; }), pos = (Math.round(v.n) - 1) % 4;
      return F.svg(600, 140, cyc.map((x, i) => `<circle cx="${180 + i * 80}" cy="62" r="26" fill="${i === pos ? O : B}" fill-opacity="${i === pos ? '.9' : '.15'}" stroke="${B}"/>` + F.txt(180 + i * 80, 68, String(x), { a: 'middle', c: 'fh', col: i === pos ? '#fff' : 'var(--ink)' }) + F.txt(180 + i * 80, 108, `${d}^${i + 1}…`, { a: 'middle', c: 'fs' })).join('')
        + F.txt(300, 132, `n = ${Math.round(v.n)} → position ${pos + 1} in the cycle → ${v.u}`, { a: 'middle', c: 'fv' }), 'Cycle of last digits'); } });
  lab(316, { n: 'Endless roots and the sum of cubes', rf: 'Number tricks', c: 'x = √(a + √(a + …)) → x² − x − a = 0; with minus: x² + x − a = 0. Write a = n(n + 1): plus → n + 1, minus → n. √(1³ + … + n³) = n(n + 1)/2.',
    i: [['a', 'a', '', 30, 0.1, 10000, 0.1], ['n', 'n (for the cubes)', '', 25, 1, 1000, 1]],
    o: [['xp', '√(a + √(a + …))', '', v => (1 + sq(1 + 4 * v.a)) / 2], ['xm', '√(a − √(a − …))', '', v => (-1 + sq(1 + 4 * v.a)) / 2], ['sc', '√(1³ + 2³ + … + n³)', '', v => v.n * (v.n + 1) / 2]],
    ck: [[{ a: 30 }, { xp: 6, xm: 5 }, 'Vol 2 p 327 · Sum 5'], [{ n: 25 }, { sc: 325 }, 'Vol 2 p 326 · Sum 2']],
    fig: (v, F) => { let x = 0, d = '', g = ''; const s = 150 / Math.max(v.xp, 1); for (let i = 0; i < 7; i++) { const nx = sq(v.a + x); g += `<circle cx="${60 + i * 70}" cy="${130 - nx * s * 0.6}" r="5" fill="${B}"/>` + F.txt(60 + i * 70, 122 - nx * s * 0.6, F.t(nx), { a: 'middle', c: 'fs' }); d += `${i ? 'L' : 'M'}${60 + i * 70},${130 - nx * s * 0.6}`; x = nx; }
      return F.svg(600, 150, `<path d="${d}" fill="none" stroke="${B}" stroke-width="1.6"/>` + g + F.txt(580, 145, `settles at ${F.t(v.xp)}`, { a: 'end', c: 'fv', col: B }), 'Each extra root brings the value closer'); } });
  lab(316, { n: 'Discounts, mark-up and successive changes', rf: 'Percentages', c: 'Discounts on the TOTAL fare add (10 % + 5 % = 15 %). A mark-up then a discount multiply: 125 × 0.9 = 112.5 → 12.5 % profit. +10 % then −10 % → a 1 % fall.',
    i: [['F1', 'One-way fare per person', '₹', 100, 1, 100000, 1], ['np', 'People (round trip)', '', 5, 1, 100, 1], ['d1', 'Discount 1', '%', 10, 0, 90, 0.5], ['d2', 'Discount 2 (groups of 4+)', '%', 5, 0, 90, 0.5], ['mu', 'Mark-up on cost', '%', 25, 0, 300, 0.5], ['dc', 'Discount on the marked price', '%', 10, 0, 90, 0.5]],
    o: [['tot', 'Fare: discounts added on the total', '₹', v => v.np * 2 * v.F1 * (1 - (v.np >= 4 ? v.d1 + v.d2 : v.d1) / 100)], ['comp', 'If compounded instead (the common mistake)', '₹', v => v.np * 2 * v.F1 * (1 - v.d1 / 100) * (v.np >= 4 ? 1 - v.d2 / 100 : 1)], ['pf', 'Profit after mark-up and discount', '%', v => ((1 + v.mu / 100) * (1 - v.dc / 100) - 1) * 100]],
    ck: [[{ F1: 100, np: 5, d1: 10, d2: 5 }, { tot: 850, comp: 855 }, 'Question Book B36 · GATE EE 2014 Set 1 · GA Q.8 (p 90)'], [{ mu: 25, dc: 10 }, { pf: 12.5 }, 'Vol 2 p 327 · Sum 9']],
    fig: (v, F) => { const full = v.np * 2 * v.F1, s = 440 / Math.max(full, 1e-9);
      return F.svg(600, 120, `<rect x="120" y="20" width="${full * s}" height="24" fill="#94a3b8"/><rect x="120" y="56" width="${v.tot * s}" height="24" fill="${G}"/>` + F.txt(112, 37, 'full fare', { a: 'end', c: 'fs' }) + F.txt(112, 73, 'you pay', { a: 'end', c: 'fs' })
        + F.txt(124 + full * s, 37, `₹${F.t(full)}`, { c: 'fs' }) + F.txt(124 + v.tot * s, 73, `₹${F.t(v.tot)}`, { c: 'fv', col: G }) + F.txt(120, 108, `mark-up ${F.t(v.mu)} % then −${F.t(v.dc)} % → profit ${F.t(v.pf)} %`, { c: 'fs' }), 'Fare'); } });
})();
