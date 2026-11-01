/* Live diagrams for the most-asked machine, circuit, line and control labs. Each drawing follows the lab's own inputs
   and outputs (nothing is computed here that the lab does not already compute, except drawing coordinates). Attached by
   lab name, so the labs and their book checks are unchanged. Loaded after the lab files. */
(() => {
  const PI = Math.PI, sq = Math.sqrt, clamp = (x, a, b) => Math.max(a, Math.min(b, x)), O = '#ea580c', B = '#2563eb', G = '#16a34a', R = '#dc2626', P = '#7c3aed', Y = '#d97706';
  const add = (name, fig) => (window.LABS || []).filter(L => L.n === name).forEach(L => { L.fig = fig; });
  // a DC cell (long and short plates) on a vertical wire at x between y1 and y2, + at the top
  const cell = (F, x, y1, y2, col) => { const m = (y1 + y2) / 2; return F.line(x, y1, x, m - 6, col, 2.4) + F.line(x - 14, m - 6, x + 14, m - 6, col, 2.6) + F.line(x - 8, m + 4, x + 8, m + 4, col, 4) + F.line(x, m + 4, x, y2, col, 2.4) + F.txt(x + 18, m - 8, '+', { c: 'fs' }); };
  // a horizontal coil between x1 and x2 at height y
  const coilH = (x1, x2, y, n, col) => { const k = Math.max(2, n), w = (x2 - x1) / k; let d = `M${x1},${y}`; for (let i = 0; i < k; i++) d += ` a${w / 2},${w / 2} 0 0 1 ${w},0`; return `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.6"/>`; };
  const capH = (F, x, y, col, fill = 0) => F.line(x, y - 16, x, y + 16, col, 3) + F.line(x + 10, y - 16, x + 10, y + 16, col, 3) + (fill ? `<rect x="${x + 1.5}" y="${y - 16 + 32 * (1 - fill)}" width="7" height="${32 * fill}" fill="${col}" fill-opacity=".35"/>` : '');
  const capV = (F, x, y, col, fill = 0) => F.line(x - 18, y, x + 18, y, col, 3) + F.line(x - 18, y + 10, x + 18, y + 10, col, 3) + (fill ? `<rect x="${x - 17}" y="${y + 1.5}" width="34" height="7" fill="${col}" fill-opacity="${(0.12 + 0.6 * fill).toFixed(2)}"/>` : '');
  const sp = I => clamp(Math.log10(1 + Math.abs(I)) * 1.8, 0, 4);

  add('Thevenin of a divider and maximum power', (v, F) => {
    const f = v.Pmax ? clamp(v.PL / v.Pmax, 0, 1) : 0, best = Math.abs(v.RL / v.Rth - 1) < 0.05;
    return F.svg(640, 250, `${F.wire('M60,40 H330 V95', B, sp(v.IL))}${F.wire('M330,165 V210 H60', B, sp(v.IL))}${F.wire('M60,40 V100', B)}${F.wire('M60,150 V210', B)}${cell(F, 60, 100, 150, B)}
      ${F.resH(100, 180, 40, O)}${F.resV(230, 40, 210, O)}${F.resV(330, 95, 165, G)}
      ${F.txt(140, 28, `R₁ ${F.t(v.R1)} Ω`, { a: 'middle', c: 'fs' })}${F.txt(242, 130, `R₂ ${F.t(v.R2)} Ω`, { c: 'fs' })}${F.txt(342, 128, `R_L ${F.t(v.RL)} Ω`, { c: 'fv', col: G })}${F.txt(20, 130, `${F.t(v.Vs)} V`, { c: 'fv', col: B })}
      ${F.txt(200, 236, `I_L = ${F.t(v.IL)} A`, { a: 'middle', c: 'fv', col: B })}
      <rect x="420" y="30" width="200" height="90" rx="10" class="fbox"/>${F.txt(520, 52, 'Thevenin equivalent', { a: 'middle', c: 'fs' })}${F.txt(520, 78, `V_th = ${F.t(v.Vth)} V`, { a: 'middle', c: 'fv' })}${F.txt(520, 102, `R_th = ${F.t(v.Rth)} Ω`, { a: 'middle', c: 'fv' })}
      ${F.txt(420, 148, 'Load power', { c: 'fs' })}${F.bar(420, 156, 200, 22, 1, 'transparent')}<rect x="420" y="156" width="${200 * f}" height="22" rx="6" fill="${best ? G : Y}"/>
      ${F.txt(420, 198, `${F.t(v.PL)} W of P_max ${F.t(v.Pmax)} W`, { c: 'fv' })}${F.txt(420, 220, best ? '✓ R_L = R_th → maximum power' : `R_L / R_th = ${F.t(v.RL / v.Rth)} (max at 1)`, { c: 'fs', col: best ? G : 'currentColor' })}`, 'Divider, load and its Thevenin equivalent');
  });

  add('RC circuit — charging and discharging', (v, F) => {
    const f = clamp(v.vc / v.V, 0, 1), T5 = 5 * v.tau, X0 = 360, X1 = 620, Y0 = 200, Y1 = 40, sx = t => X0 + (X1 - X0) * clamp(t / T5, 0, 1), sy = y => Y0 - (Y0 - Y1) * y / v.V;
    let c = '', d = ''; for (let i = 0; i <= 60; i++) { const t = T5 * i / 60; c += `${i ? 'L' : 'M'}${sx(t).toFixed(1)},${sy(v.V * (1 - Math.exp(-t / v.tau))).toFixed(1)}`; d += `${i ? 'L' : 'M'}${sx(t).toFixed(1)},${sy(v.V * Math.exp(-t / v.tau)).toFixed(1)}`; }
    return F.svg(640, 240, `${F.wire('M50,40 H250 V100', B, sp(v.i))}${F.wire('M250,118 V200 H50', B, sp(v.i))}${F.wire('M50,40 V95', B)}${F.wire('M50,145 V200', B)}${cell(F, 50, 95, 145, B)}${F.resH(100, 190, 40, O)}${capV(F, 250, 100, P, f)}
      ${F.txt(145, 28, `R ${F.t(v.R)} kΩ`, { a: 'middle', c: 'fs' })}${F.txt(276, 112, `C ${F.t(v.C)} µF`, { c: 'fs' })}${F.txt(12, 124, `${F.t(v.V)} V`, { c: 'fv', col: B })}${F.txt(150, 228, `τ = RC = ${F.t(v.tau)} s · i = ${F.t(v.i)} mA`, { a: 'middle', c: 'fv' })}
      ${F.line(X0, Y1, X0, Y0, 'var(--ink-2)', 1.4)}${F.line(X0, Y0, X1, Y0, 'var(--ink-2)', 1.4)}<path d="${c}" fill="none" stroke="${P}" stroke-width="2.4"/><path d="${d}" fill="none" stroke="${O}" stroke-width="1.8" stroke-dasharray="5 4"/>
      ${F.line(sx(v.tau), Y0, sx(v.tau), sy(v.V * 0.632), 'var(--ink-2)', 1, '3 3')}${F.txt(sx(v.tau), Y0 + 14, '1τ', { a: 'middle', c: 'fs' })}${F.txt(X1, Y0 + 14, '5τ', { a: 'end', c: 'fs' })}
      ${v.t <= T5 ? `<circle cx="${sx(v.t)}" cy="${sy(v.vc)}" r="5" fill="${P}"/>` : ''}${F.txt(X0 + 6, Y1 - 6, `charging: v = ${F.t(v.vc)} V at t = ${F.t(v.t)} s (63.2 % at 1τ)`, { c: 'fs', col: P })}`, 'RC circuit and its charging curve');
  });

  add('Series R–L–C circuit — current, pf and power', (v, F) => {
    const VR = v.I * v.R, VL = v.I * v.XL, VC = v.I * v.XC, m = Math.max(v.V, VL, VC, 1e-9), s = 110 / m, ox = 440, oy = 130;
    const ang = Math.atan2(VL - VC, VR);
    return F.svg(640, 250, `${F.wire('M40,60 H120', B, sp(v.I))}${F.resH(120, 190, 60, O)}${F.wire('M190,60 H215', B)}${coilH(215, 280, 60, 5, G)}${F.wire('M280,60 H305', B)}${v.XC > 0 ? capH(F, 305, 60, P) + F.wire('M315,60 H350 V200 H40 V160', B, sp(v.I)) : F.wire('M305,60 H350 V200 H40 V160', B, sp(v.I))}${F.wire('M40,60 V100', B)}${F.src(40, 130, 26, B)}
      ${F.txt(155, 44, `R ${F.t(v.R)} Ω`, { a: 'middle', c: 'fs' })}${F.txt(247, 44, `X_L ${F.t(v.XL)} Ω`, { a: 'middle', c: 'fs', col: G })}${v.XC > 0 ? F.txt(312, 98, `X_C ${F.t(v.XC)} Ω`, { a: 'middle', c: 'fs', col: P }) : ''}
      ${F.txt(76, 134, `${F.t(v.V)} V`, { c: 'fv', col: B })}${F.txt(190, 232, `I = ${F.t(v.I)} A · pf ${F.t(v.pf)} ${v.XL > v.XC ? 'lagging' : v.XL < v.XC ? 'leading' : '(unity — resonance)'}`, { a: 'middle', c: 'fv' })}
      ${F.line(ox - 10, oy, ox + 170, oy, 'var(--line)', 1)}${F.arrow(ox, oy, ox + VR * s, oy, O)}${VL ? F.arrow(ox + VR * s, oy, ox + VR * s, oy - VL * s, G) : ''}${VC ? F.arrow(ox + VR * s, oy - VL * s, ox + VR * s, oy - (VL - VC) * s, P) : ''}${F.arrow(ox, oy, ox + VR * s, oy - (VL - VC) * s, B, 2.8)}
      ${F.txt(ox + VR * s / 2, oy + 16, `V_R ${F.t(VR)}`, { a: 'middle', c: 'fs', col: O })}${F.txt(ox + VR * s / 2 - 10, oy - (VL - VC) * s / 2 - 6, `V ${F.t(v.V)}`, { a: 'end', c: 'fs', col: B })}${F.txt(ox + 4, 22, `φ = ${F.t(Math.abs(ang * 180 / PI))}° · phasors drawn to scale`, { c: 'fs' })}`, 'Series RLC circuit and phasor diagram');
  });

  add('DC motor — back EMF, power and torque', (v, F) => {
    const loss = v.Ia * v.Ia * v.Ra, inp = v.V * v.Ia, fm = clamp(v.Eb * v.Ia / inp, 0, 1);
    return F.svg(640, 240, `${F.wire('M60,40 H330 V90', B, sp(v.Ia))}${F.wire('M330,170 V210 H60', B, sp(v.Ia))}${F.wire('M60,40 V100', B)}${F.wire('M60,150 V210', B)}${cell(F, 60, 100, 150, B)}${F.resH(130, 230, 40, O)}
      <circle cx="330" cy="130" r="40" fill="var(--paper)" stroke="${G}" stroke-width="3"/>${F.txt(330, 126, 'M', { a: 'middle', c: 'fh', col: G })}${F.txt(330, 146, `E_b ${F.t(v.Eb)} V`, { a: 'middle', c: 'fs' })}
      ${F.txt(180, 28, `R_a ${F.t(v.Ra)} Ω`, { a: 'middle', c: 'fs' })}${F.txt(20, 130, `${F.t(v.V)} V`, { c: 'fv', col: B })}${F.txt(180, 230, `I_a = ${F.t(v.Ia)} A → ${F.t(v.N)} rpm`, { a: 'middle', c: 'fv', col: B })}
      ${F.txt(420, 40, 'Input V·I_a splits into', { c: 'fs' })}<rect x="420" y="50" width="${200 * fm}" height="26" fill="${G}"/><rect x="${420 + 200 * fm}" y="50" width="${200 * (1 - fm)}" height="26" fill="${R}"/>
      ${F.txt(420, 96, `mechanical E_b·I_a = ${F.t(v.Pm)} kW`, { c: 'fv', col: G })}${F.txt(420, 118, `copper loss I_a²R_a = ${F.t(loss / 1000)} kW`, { c: 'fv', col: R })}${F.txt(420, 148, `torque T = ${F.t(v.T)} N·m`, { c: 'fh' })}${F.txt(420, 172, `E_b / V = ${F.t(v.eta)} %`, { c: 'fs' })}`, 'DC motor armature circuit');
  });

  add('Synchronous speed, slip and rotor frequency', (v, F) => {
    const mx = Math.max(v.Ns, v.N, 1) * 1.15, x = n => 40 + 560 * clamp(n / mx, 0, 1), gen = v.N > v.Ns;
    let wa = '', wb = ''; const fs_ = 3, fr_ = clamp(Math.abs(v.s) / 100 * 3 * 10, 0, 3);
    for (let i = 0; i <= 120; i++) { const t = i / 120; wa += `${i ? 'L' : 'M'}${40 + 260 * t},${190 - 18 * Math.sin(2 * PI * fs_ * t)}`; wb += `${i ? 'L' : 'M'}${340 + 260 * t},${190 - 18 * Math.sin(2 * PI * Math.max(fr_, 0.05) * t)}`; }
    return F.svg(640, 240, `<rect x="40" y="56" width="560" height="22" rx="8" class="fbox"/><rect x="${Math.min(x(v.N), x(v.Ns))}" y="56" width="${Math.abs(x(v.Ns) - x(v.N))}" height="22" fill="${gen ? Y : R}" fill-opacity=".45"/>
      ${F.line(x(v.Ns), 44, x(v.Ns), 90, B, 3)}${F.txt(x(v.Ns), 38, `N_s = 120f/P = ${F.t(v.Ns)} rpm`, { a: 'middle', c: 'fv', col: B })}${F.line(x(v.N), 50, x(v.N), 100, G, 3)}${F.txt(x(v.N), 116, `rotor N = ${F.t(v.N)} rpm`, { a: 'middle', c: 'fv', col: G })}
      ${F.txt(320, 22, `slip s = ${F.t(v.s)} % · ${v.md}`, { a: 'middle', c: 'fh', col: gen ? Y : 'currentColor' })}
      <path d="${wa}" fill="none" stroke="${B}" stroke-width="2"/><path d="${wb}" fill="none" stroke="${P}" stroke-width="2"/>${F.txt(40, 160, `stator ${F.t(v.f)} Hz`, { c: 'fs', col: B })}${F.txt(340, 160, `rotor f_r = s·f = ${F.t(v.fr)} Hz (drawn 10× faster)`, { c: 'fs', col: P })}`, 'Synchronous speed, rotor speed and slip');
  });

  add('Short line — voltage drop, regulation and efficiency', (v, F) => {
    const Vr = v.VL * 1000 / sq(3), lag = v.ty === 'lagging', ph = Math.acos(clamp(v.pf, 0, 1)) * (lag ? -1 : 1), k = 6;   // the drop is drawn k× larger so it can be seen
    const s = 200 / Vr, ox = 330, oy = 170, ir = v.I * v.R * k, ix = v.I * v.X * k;
    const ax = ox + Vr * s, ay = oy, bx = ax + ir * s * Math.cos(ph), by = ay - ir * s * Math.sin(ph), cx = bx - ix * s * Math.sin(ph), cy = by - ix * s * Math.cos(ph);
    return F.svg(640, 250, `${F.line(30, 40, 30, 100, 'var(--ink)', 5)}${F.wire('M30,70 H90', B, sp(v.I))}<rect x="90" y="56" width="120" height="28" rx="6" fill="${O}" fill-opacity=".18" stroke="${O}"/>${F.txt(150, 75, `${F.t(v.R)} + j${F.t(v.X)} Ω`, { a: 'middle', c: 'fs' })}${F.wire('M210,70 H270', B, sp(v.I))}${F.line(270, 40, 270, 100, 'var(--ink)', 5)}
      ${F.txt(30, 120, 'sending', { a: 'middle', c: 'fs' })}${F.txt(270, 120, `receiving ${F.t(v.VL)} kV`, { a: 'middle', c: 'fs' })}${F.txt(150, 30, `I = ${F.t(v.I)} A, pf ${F.t(v.pf)} ${v.ty}`, { a: 'middle', c: 'fv', col: B })}
      ${F.arrow(ox, oy, ax, ay, B, 2.8)}${F.arrow(ax, ay, bx, by, O)}${F.arrow(bx, by, cx, cy, G)}${F.arrow(ox, oy, cx, cy, R, 2.4)}${F.arrow(ox, oy, ox + 90 * Math.cos(ph), oy - 90 * Math.sin(ph), P, 1.8)}
      ${F.txt(ox + 4, oy + 18, 'V_R (per phase)', { c: 'fs', col: B })}${F.txt(ox + 92 * Math.cos(ph), oy - 92 * Math.sin(ph) + (lag ? 14 : -6), 'I', { c: 'fv', col: P })}${F.txt(bx + 6, by + 14, 'IR', { c: 'fs', col: O })}${F.txt(cx + 6, (by + cy) / 2, 'IX', { c: 'fs', col: G })}${F.txt(cx - 6, cy - 6, 'V_S', { a: 'end', c: 'fv', col: R })}
      ${F.txt(20, 160, `ΔV = ${F.t(v.dV)} V per phase`, { c: 'fv' })}${F.txt(20, 182, `regulation ${F.t(v.reg)} %`, { c: 'fv' })}${F.txt(20, 204, `efficiency ${F.t(v.eta)} %`, { c: 'fv' })}${F.txt(20, 236, `phasor diagram: IR and IX drawn ${k}× larger to be seen`, { c: 'fs' })}`, 'Short transmission line and its phasor diagram');
  });

  add('Second-order system — step response and specs', (v, F) => {
    const z = v.z, wn = v.wn, sig = z * wn, wd = z < 1 ? wn * sq(1 - z * z) : 0, m = Math.max(wn * 1.25, 1e-9), s = 95 / m, ox = 210, oy = 125;
    const poles = z < 1 ? [[-sig, wd], [-sig, -wd]] : [[-wn * (z - sq(z * z - 1)), 0], [-wn * (z + sq(z * z - 1)), 0]];
    let st = ''; const T = Number.isFinite(v.ts) && v.ts > 0 ? Math.max(v.ts * 1.2, z >= 1 ? 6 / Math.max(wn * (z - sq(Math.max(0, z * z - 1))), 1e-6) : 0) : 4 * 2 * PI / Math.max(wn, 1e-9); let ymax = 1;   /* ζ = 0 never settles: show four cycles */
    const pts = []; for (let i = 0; i <= 120; i++) { const t = T * i / 120; let y; if (z < 1) y = 1 - Math.exp(-sig * t) * (Math.cos(wd * t) + sig / Math.max(wd, 1e-9) * Math.sin(wd * t)); else if (Math.abs(z - 1) < 1e-6) y = 1 - Math.exp(-wn * t) * (1 + wn * t); else { const [p1, p2] = poles.map(p => -p[0]); y = 1 - (p2 * Math.exp(-p1 * t) - p1 * Math.exp(-p2 * t)) / (p2 - p1); } pts.push([t, y]); ymax = Math.max(ymax, y); }
    pts.forEach(([t, y], i) => { st += `${i ? 'L' : 'M'}${(380 + 240 * t / T).toFixed(1)},${(210 - 150 * y / (ymax * 1.05)).toFixed(1)}`; });
    return F.svg(640, 240, `${F.line(ox - 190, oy, ox + 40, oy, 'var(--ink-2)', 1.4)}${F.line(ox, 20, ox, 230, 'var(--ink-2)', 1.4)}${F.txt(ox + 6, 30, 'jω', { c: 'fs' })}${F.txt(ox + 30, oy - 6, 'σ', { c: 'fs' })}
      <circle cx="${ox}" cy="${oy}" r="${wn * s}" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>${z < 1 ? F.line(ox, oy, ox - sig * s, oy - wd * s, Y, 1.4, '4 3') + F.txt(ox - 22, oy - 8, 'θ = cos⁻¹ζ', { a: 'end', c: 'fs', col: Y }) : ''}
      ${poles.map(([re, im]) => `<path d="M${ox + re * s - 6},${oy - im * s - 6} l12,12 M${ox + re * s + 6},${oy - im * s - 6} l-12,12" stroke="${R}" stroke-width="3"/>`).join('')}
      ${F.txt(20, 22, `ζ = ${F.t(z)} (${v.ty}) · ω_n = ${F.t(wn)} rad/s`, { c: 'fv' })}${F.txt(20, 232, z < 1 ? `poles −${F.t(sig)} ± j${F.t(wd)}` : 'poles on the real axis: no overshoot', { c: 'fs', col: R })}
      ${F.line(380, 210, 620, 210, 'var(--ink-2)', 1.2)}${F.line(380, 60, 380, 210, 'var(--ink-2)', 1.2)}${F.line(380, 210 - 150 / (ymax * 1.05), 620, 210 - 150 / (ymax * 1.05), 'var(--line)', 1, '4 4')}<path d="${st}" fill="none" stroke="${B}" stroke-width="2.4"/>
      ${F.txt(384, 52, `unit-step response${z < 1 ? ` · overshoot ${F.t(v.Mp)} %` : ''}`, { c: 'fs', col: B })}`, 's-plane poles and step response');
  });
})();

/* ---- Drawings for the high-priority topics that have no lab experiments of their own: Electromagnetic Fields,
   Measurements, Control Systems, Signals & DSP, Digital Electronics. 400 units wide, so they stay readable on a
   phone. Each drawing shows the lab's own inputs and outputs; where a scale is needed it is a log scale, marked. ---- */
(() => {
  const PI = Math.PI, sq = Math.sqrt, cl = (x, a, b) => Math.max(a, Math.min(b, x)), O = '#ea580c', B = '#2563eb', G = '#16a34a', R = '#dc2626', P = '#7c3aed', Y = '#d97706', K = 'currentColor', M = 'var(--ink-2)';
  const add = (name, fig) => (window.LABS || []).filter(L => L.n === name).forEach(L => { L.fig = fig; });
  const lg = (x, a, b) => cl(Math.log10(Math.max(Math.abs(x), 1e-30) / a) / Math.log10(b / a), 0, 1);   // where |x| sits on a log scale a … b, 0 … 1
  const num = s => { const x = parseFloat(String(s).replace(/−/g, '-')); return Number.isFinite(x) ? x : NaN; };
  // "a", "a ± jb", "a − jb" → [re, im]
  const cpx = s => { s = String(s).replace(/−/g, '-').replace(/\s+/g, ''); const m = s.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)?(?:([+-])j(\d*\.?\d+(?:e[+-]?\d+)?))?$/i); if (!m) return null; const re = m[1] ? +m[1] : 0, im = m[3] ? (m[2] === '-' ? -1 : 1) * +m[3] : 0; return [re, im]; };
  const box = (F, x, y, w, h, lab, col = K, sub) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--paper)" stroke="${col}" stroke-width="2"/>${F.txt(x + w / 2, y + h / 2 + (sub ? -2 : 5), lab, { a: 'middle', c: 'fv', col })}${sub ? F.txt(x + w / 2, y + h / 2 + 14, sub, { a: 'middle', c: 'fs' }) : ''}`;
  const sum = (F, x, y) => `<circle cx="${x}" cy="${y}" r="11" fill="var(--paper)" stroke="${K}" stroke-width="2"/>${F.line(x - 6, y, x + 6, y, K, 1.6)}${F.line(x, y - 6, x, y + 6, K, 1.6)}`;
  const xm = (x, y, col = R) => `<path d="M${x - 6},${y - 6} L${x + 6},${y + 6} M${x + 6},${y - 6} L${x - 6},${y + 6}" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>`;
  const om = (x, y, col = G) => `<circle cx="${x}" cy="${y}" r="6" fill="var(--paper)" stroke="${col}" stroke-width="2.4"/>`;
  // an s-plane in the box x0…x1, y0…y1, scaled to fit the points; returns {g, X, Y}
  const splane = (F, x0, y0, x1, y1, pts) => {
    const neg = Math.max(1, ...pts.map(p => -p[0])) * 1.2, pos = Math.max(0, ...pts.map(p => p[0])) * 1.2, my = Math.max(1, ...pts.map(p => Math.abs(p[1]))) * 1.25;
    const cx = x0 + (x1 - x0) * cl(neg / (neg + Math.max(pos, neg * 0.25)), 0.3, 0.8), cy = (y0 + y1) / 2;
    const sx = Math.min((cx - x0 - 6) / neg, pos ? (x1 - cx - 6) / pos : Infinity), sy = (y1 - y0) / 2 / my, X = re => cl(cx + re * sx, x0 + 4, x1 - 4), Y = im => cl(cy - im * sy, y0 + 4, y1 - 4);
    return { X, Y, g: `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="8" class="fbox"/><rect x="${cx}" y="${y0}" width="${x1 - cx}" height="${y1 - y0}" fill="${R}" fill-opacity=".06"/>${F.line(x0 + 4, cy, x1 - 4, cy, M, 1.2)}${F.line(cx, y0 + 4, cx, y1 - 4, M, 1.2)}${F.txt(x1 - 6, cy - 5, 'σ', { a: 'end', c: 'fs' })}${F.txt(cx + 5, y0 + 13, 'jω', { c: 'fs' })}` };
  };
  // a bridge on a diamond: arms [label, value, colour] top-left, top-right, bottom-left, bottom-right; detector across the middle; source top to bottom
  const bridge = (F, cx, cy, r, arms, det = 'G', ok = true) => {
    const Tp = [cx, cy - r], Rt = [cx + r, cy], Bt = [cx, cy + r], Lf = [cx - r, cy];
    const arm = ([x1, y1], [x2, y2], [lab, val, col]) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = mx - cx, dy = my - cy, dd = Math.hypot(dx, dy) || 1;
      return F.line(x1, y1, x2, y2, col, 2.4) + `<rect x="${mx - 25}" y="${my - 11}" width="50" height="22" rx="6" fill="var(--paper)" stroke="${col}" stroke-width="2"/>` + F.txt(mx, my + 4.5, lab, { a: 'middle', c: 'fs', col }) + (val ? F.txt(mx + dx / dd * 44, my + dy / dd * 26 + 4, val, { a: 'middle', c: 'fv' }) : ''); };
    return arm(Tp, Lf, arms[0]) + arm(Tp, Rt, arms[1]) + arm(Lf, Bt, arms[2]) + arm(Rt, Bt, arms[3]) + F.line(Lf[0], cy, cx - 13, cy, K, 1.8) + F.line(cx + 13, cy, Rt[0], cy, K, 1.8)
      + `<circle cx="${cx}" cy="${cy}" r="13" fill="var(--paper)" stroke="${ok ? G : R}" stroke-width="2.2"/>` + F.txt(cx, cy + 4.5, det, { a: 'middle', c: 'fv', col: ok ? G : R })
      + `<path d="M${cx},${cy - r} V${cy - r - 14} H${cx + r + 34} V${cy + r + 14} H${cx} V${cy + r}" fill="none" stroke="${M}" stroke-width="1.6"/>` + F.src(cx + r + 34, cy, 12, M)
      + [Tp, Rt, Bt, Lf].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${K}"/>`).join('');
  };
  const charge = (F, x, y, q, rr) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${q >= 0 ? R : B}" fill-opacity=".85"/>${F.txt(x, y + 6, q >= 0 ? '+' : '−', { a: 'middle', c: 'fh', col: '#fff' })}`;
  const meter = (F, x, y, lab, col = K) => `<circle cx="${x}" cy="${y}" r="15" fill="var(--paper)" stroke="${col}" stroke-width="2.2"/>${F.txt(x, y + 5, lab, { a: 'middle', c: 'fv', col })}`;

  /* ================= Electromagnetic Fields ================= */
  add('Coulomb’s law', (v, F) => {
    const d = 60 + 190 * lg(v.r, 0.001, 10), x1 = 200 - d / 2, x2 = 200 + d / 2, r1 = 12 + 8 * lg(v.q1, 0.01, 100), r2 = 12 + 8 * lg(v.q2, 0.01, 100), rep = v.q1 * v.q2 >= 0, L = 18 + 46 * lg(v.F, 1e-6, 1e4);
    const ar = (x, s) => rep ? F.arrow(x + s * 4, 100, x + s * (4 + L), 100, O) : F.arrow(x + s * (4 + L), 100, x + s * 4, 100, O);
    return F.svg(400, 200, `${charge(F, x1, 100, v.q1, r1)}${charge(F, x2, 100, v.q2, r2)}${ar(x1 - r1, -1)}${ar(x2 + r2, 1)}
      ${F.line(x1, 150, x2, 150, M, 1.2)}${F.line(x1, 144, x1, 156, M, 1.2)}${F.line(x2, 144, x2, 156, M, 1.2)}${F.txt(200, 168, `r = ${F.t(v.r)} m (log scale)`, { a: 'middle', c: 'fs' })}
      ${F.txt(x1, 70 - r1 + 12, `q₁ = ${F.t(v.q1)} µC`, { a: 'middle', c: 'fs' })}${F.txt(x2, 70 - r2 + 12, `q₂ = ${F.t(v.q2)} µC`, { a: 'middle', c: 'fs' })}
      ${F.txt(200, 26, `F = ${F.t(v.F)} N · ${v.kind}`, { a: 'middle', c: 'fv', col: O })}${F.txt(200, 192, `εᵣ = ${F.t(v.er)} · arrow length: force (log scale)`, { a: 'middle', c: 'fs' })}`, 'Two charges and the force on each');
  });
  add('Field and potential of a point charge', (v, F) => {
    const cx = 70, cy = 110, px = cx + 40 + 230 * lg(v.r, 0.01, 100), L = 14 + 40 * lg(v.E, 1e-3, 1e6), s = v.Q >= 0 ? 1 : -1;
    let g = ''; for (let k = 0; k < 12; k++) { const a = k * PI / 6; g += F.line(cx + 20 * Math.cos(a), cy + 20 * Math.sin(a), cx + 190 * Math.cos(a), cy + 190 * Math.sin(a), s > 0 ? R : B, 1, '3 5'); }
    return F.svg(400, 220, `${g}<circle cx="${cx}" cy="${cy}" r="${px - cx}" fill="none" stroke="${P}" stroke-width="1.6" stroke-dasharray="6 4"/>
      ${charge(F, cx, cy, v.Q, 16)}<circle cx="${px}" cy="${cy}" r="5" fill="${K}"/>${s > 0 ? F.arrow(px + 6, cy, px + 6 + L, cy, O) : F.arrow(px - 6, cy, px - 6 - L, cy, O)}
      ${F.txt(px, cy - 16, `E = ${F.t(v.E)} V/m`, { a: 'middle', c: 'fv', col: O })}${F.txt(px, cy + 26, `V = ${F.t(v.V)} V`, { a: 'middle', c: 'fv', col: P })}
      ${F.txt(10, 20, `Q = ${F.t(v.Q)} nC · r = ${F.t(v.r)} m`, { c: 'fs' })}${F.txt(10, 212, 'dashed circle: an equipotential through the point (V ∝ 1/r); E ∝ 1/r²', { c: 'fs' })}`, 'A point charge, its radial field and an equipotential');
  });
  add('Infinite line and sheet of charge', (v, F) => {
    const px = 46 + 120 * lg(v.r, 0.01, 10), Ll = 12 + 40 * lg(v.El, 1e-2, 1e6), Ls = 12 + 40 * lg(v.Es * 1000, 1e-2, 1e8);
    let plus = ''; for (let y = 34; y <= 176; y += 18) plus += F.txt(30, y + 4, '+', { a: 'middle', c: 'fv', col: R });
    let sheet = ''; for (let y = 40; y <= 170; y += 26) sheet += F.arrow(300, y, 300 + Ls, y, O) + F.arrow(290, y, 290 - Ls, y, O);
    return F.svg(400, 220, `${F.line(36, 26, 36, 186, R, 3)}${plus}<circle cx="${px}" cy="105" r="4.5" fill="${K}"/>${F.arrow(px + 6, 105, px + 6 + Ll, 105, O)}
      ${F.txt(100, 18, `line λ = ${F.t(v.lam)} nC/m`, { a: 'middle', c: 'fs' })}${F.txt(px, 90, `${F.t(v.El)} V/m`, { a: 'middle', c: 'fv', col: O })}${F.txt(100, 206, `at r = ${F.t(v.r)} m · E ∝ 1/r`, { a: 'middle', c: 'fs' })}
      ${F.line(200, 20, 200, 196, 'var(--line)', 1)}<rect x="290" y="26" width="10" height="160" fill="${R}" fill-opacity=".25" stroke="${R}"/>${sheet}
      ${F.txt(295, 18, `sheet ρs = ${F.t(v.rs)} µC/m²`, { a: 'middle', c: 'fs' })}${F.txt(295, 206, `E = ${F.t(v.Es)} kV/m everywhere`, { a: 'middle', c: 'fv', col: O })}`, 'Field of a line charge and of a sheet of charge');
  });
  add('Energy stored in an electric field', (v, F) => {
    const f = lg(v.u, 1e-3, 1e5), di = v.er > 1;
    let ar = ''; for (let x = 70; x <= 250; x += 30) ar += F.arrow(x, 62, x, 152, O, 1.8);
    return F.svg(400, 210, `<rect x="50" y="60" width="220" height="96" fill="${di ? Y : P}" fill-opacity="${(0.08 + 0.5 * f).toFixed(2)}"/>${F.line(46, 56, 274, 56, R, 5)}${F.line(46, 160, 274, 160, B, 5)}${ar}
      ${F.txt(160, 44, `E = ${F.t(v.E)} kV/mm${di ? ` · dielectric εᵣ = ${F.t(v.er)}` : ' · air'}`, { a: 'middle', c: 'fs' })}
      ${F.txt(290, 96, 'energy density', { c: 'fs' })}${F.txt(290, 116, `u = ${F.t(v.u)} J/m³`, { c: 'fv', col: P })}${F.txt(290, 136, '= ½ ε₀ εᵣ E²', { c: 'fs' })}
      ${F.txt(160, 190, 'shading: energy density (log scale) — it grows with E²', { a: 'middle', c: 'fs' })}`, 'Parallel plates, the field between them and its energy density');
  });
  add('Magnetic field of a long wire', (v, F) => {
    const cx = 90, cy = 105, rp = 16 + 66 * lg(v.r, 0.001, 10), L = 12 + 34 * lg(v.B, 1e-3, 1e5);
    let g = ''; [22, 40, 60, 82].forEach(rr => { g += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${B}" stroke-width="1.4" stroke-opacity=".6"/>` + F.arrow(cx + rr, cy + 2, cx + rr, cy - 4, B, 1.4); });
    let cv = ''; for (let k = 0; k <= 60; k++) { const r = 0.2 + 2.8 * k / 60; cv += `${k ? 'L' : 'M'}${(220 + 160 * (r - 0.2) / 2.8).toFixed(1)},${(186 - 140 * (0.2 / r)).toFixed(1)}`; }
    return F.svg(400, 210, `${g}<circle cx="${cx}" cy="${cy}" r="9" fill="${O}"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="#fff"/>
      <circle cx="${cx + rp}" cy="${cy}" r="4" fill="${K}"/>${F.arrow(cx + rp, cy, cx + rp, cy - L, P)}${F.txt(cx + rp + 6, cy + 18, `r = ${F.t(v.r)} m`, { c: 'fs' })}
      ${F.txt(10, 20, `I = ${F.t(v.I)} A, out of the page`, { c: 'fs' })}${F.txt(10, 200, 'circles: field lines; arrow: B at the point (log)', { c: 'fs' })}
      <rect x="216" y="40" width="172" height="150" rx="8" class="fbox"/><path d="${cv}" fill="none" stroke="${P}" stroke-width="2"/>${F.txt(224, 56, 'B ∝ 1/r', { c: 'fs' })}
      ${F.txt(302, 26, `B = ${F.t(v.B)} µT · H = ${F.t(v.H)} A/m`, { a: 'middle', c: 'fv', col: P })}`, 'Field lines round a long wire and B against distance');
  });
  add('Solenoid — H, B and inductance', (v, F) => {
    const n = Math.round(6 + 10 * lg(v.N, 10, 1e4)), x0 = 70, x1 = 330, dx = (x1 - x0) / n;
    let back = '', front = ''; for (let k = 0; k < n; k++) { const x = x0 + k * dx + dx / 2; back += `<path d="M${x - dx / 3},62 Q${x},54 ${x + dx / 3},62" fill="none" stroke="${O}" stroke-width="2" stroke-opacity=".35"/>`; front += `<path d="M${x - dx / 3},148 L${x + dx / 3},62" fill="none" stroke="${O}" stroke-width="2.6"/>`; }
    let fl = ''; for (let y = 82; y <= 128; y += 23) fl += F.arrow(x0 + 10, y, x1 - 10, y, B, 1.8);
    return F.svg(400, 220, `${v.mr > 1 ? `<rect x="${x0}" y="70" width="${x1 - x0}" height="70" rx="6" class="fcore"/>` : ''}${back}${fl}${front}
      <path d="M${x1 - 10},105 C 390,105 390,200 200,200 C 10,200 10,105 ${x0 + 10},105" fill="none" stroke="${B}" stroke-width="1.4" stroke-dasharray="5 4"/>
      ${F.txt(200, 24, `N = ${F.t(v.N)} turns · l = ${F.t(v.l)} m · I = ${F.t(v.I)} A${v.mr > 1 ? ` · core μᵣ = ${F.t(v.mr)}` : ''}`, { a: 'middle', c: 'fs' })}
      ${F.txt(200, 44, `H = ${F.t(v.H)} A/m · B = ${F.t(v.B)} mT · L = ${F.t(v.L)} mH`, { a: 'middle', c: 'fv', col: B })}${F.txt(200, 216, 'field nearly uniform inside, returning outside', { a: 'middle', c: 'fs' })}`, 'A solenoid with its field lines');
  });
  add('Force between parallel conductors', (v, F) => {
    const d = 50 + 180 * lg(v.d, 0.001, 10), xa = 200 - d / 2, xb = 200 + d / 2, att = v.I1 * v.I2 > 0, L = 12 + 40 * lg(v.F, 1e-6, 1e4);
    const cur = (x, i) => F.line(x, 30, x, 180, O, 4) + (i >= 0 ? F.arrow(x + 12, 140, x + 12, 70, O, 2) : F.arrow(x + 12, 70, x + 12, 140, O, 2));
    return F.svg(400, 220, `${cur(xa, v.I1)}${cur(xb, v.I2)}${att ? F.arrow(xa - 6, 105, xa - 6 + L, 105, P) + F.arrow(xb - 6, 105, xb - 6 - L, 105, P) : F.arrow(xa - 6, 105, xa - 6 - L, 105, P) + F.arrow(xb + 6, 105, xb + 6 + L, 105, P)}
      ${F.txt(xa, 22, `I₁ = ${F.t(v.I1)} A`, { a: 'middle', c: 'fs' })}${F.txt(xb, 22, `I₂ = ${F.t(v.I2)} A`, { a: 'middle', c: 'fs' })}${F.line(xa, 196, xb, 196, M, 1.2)}${F.txt(200, 212, `d = ${F.t(v.d)} m (log scale)`, { a: 'middle', c: 'fs' })}
      ${F.txt(200, 60, `${F.t(v.F)} N/m`, { a: 'middle', c: 'fv', col: P })}${F.txt(200, 76, att ? 'same direction: attract' : 'opposite: repel', { a: 'middle', c: 'fs' })}`, 'Two parallel conductors and the force between them');
  });
  add('Motional EMF and force on a conductor', (v, F) => {
    const x = 230, L = 14 + 50 * lg(v.u, 0.01, 1000);
    let bx = ''; for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) bx += F.txt(70 + i * 44, 92 + j * 32, '×', { a: 'middle', c: 'fs', col: B });
    return F.svg(400, 220, `${bx}${F.line(40, 60, 370, 60, K, 2.4)}${F.line(40, 170, 370, 170, K, 2.4)}${F.resV(40, 60, 170, M)}
      <rect x="${x - 5}" y="52" width="10" height="126" rx="3" fill="${O}"/>${F.arrow(x + 10, 115, x + 10 + L, 115, G)}${F.arrow(x - 10, 196, x - 10 - 40, 196, R, 2)}
      ${F.txt(x + 14 + L, 110, `v = ${F.t(v.u)} m/s`, { c: 'fs' })}${F.txt(x - 54, 192, `F = BIl = ${F.t(v.F)} N (at I = ${F.t(v.I)} A)`, { a: 'end', c: 'fs', col: R })}
      ${F.txt(200, 24, `e = Blv = ${F.t(v.e)} V`, { a: 'middle', c: 'fv', col: O })}${F.txt(200, 42, `B = ${F.t(v.B)} T into the page · rod l = ${F.t(v.l)} m`, { a: 'middle', c: 'fs' })}`, 'A rod sliding on rails across a magnetic field');
  });
  add('Magnetic circuit with an air gap', (v, F) => {
    const gp = v.g > 0 ? 4 + 9 * Math.min(v.g, 6) : 0, w = cl(1.5 + 5 * v.Bf / 1.5, 1.2, 7);
    return F.svg(400, 220, `<path d="M60,40 H300 V${110 - gp / 2} M300,${110 + gp / 2} V190 H60 V40" fill="none" stroke="#94a3b8" stroke-opacity=".55" stroke-width="28" stroke-linejoin="round"/>
      ${F.coil(60, 70, 160, Math.min(14, Math.max(3, v.N / 60)), O, -1)}
      <path d="M60,40 H300 M300,190 H60 V40" fill="none" stroke="${B}" stroke-width="${w.toFixed(1)}" stroke-dasharray="7 5"/>${gp ? '' : F.line(300, 40, 300, 190, B, w)}${gp ? F.line(300, 40, 300, 110 - gp / 2, B, w) + F.line(300, 110 + gp / 2, 300, 190, B, w) + F.line(300, 110 - gp / 2, 300, 110 + gp / 2, B, w * 0.8, '2 3') : ''}
      ${gp ? F.txt(318, 114, `gap ${F.t(v.g)} mm`, { c: 'fs', col: R }) : F.txt(318, 114, 'no gap', { c: 'fs' })}${F.txt(30, 115, `${F.t(v.N)} T`, { a: 'end', c: 'fs', col: O })}
      ${F.txt(180, 90, `Φ = ${F.t(v.phi)} mWb`, { a: 'middle', c: 'fv', col: B })}${F.txt(180, 110, `B = ${F.t(v.Bf)} T`, { a: 'middle', c: 'fv', col: B })}
      ${F.txt(180, 140, `S iron ${F.t(v.Si)} · S gap ${F.t(v.Sg)} AT/Wb`, { a: 'middle', c: 'fs' })}${F.txt(180, 214, 'dashed path: the flux; its width follows B', { a: 'middle', c: 'fs' })}`, 'An iron core with a coil and an air gap, and the flux through it');
  });
  add('Plane wave in a medium', (v, F) => {
    let e = '', h = ''; for (let k = 0; k <= 160; k++) { const x = 40 + 330 * k / 160, s = Math.sin(4 * PI * k / 160); e += `${k ? 'L' : 'M'}${x.toFixed(1)},${(110 - 60 * s).toFixed(1)}`; h += `${k ? 'L' : 'M'}${(x - 14 * s).toFixed(1)},${(110 + 14 * s).toFixed(1)}`; }
    return F.svg(400, 220, `${F.arrow(30, 110, 388, 110, M, 1.4)}<path d="${e}" fill="none" stroke="${B}" stroke-width="2.4"/><path d="${h}" fill="none" stroke="${R}" stroke-width="2.4"/>
      ${F.line(40, 190, 205, 190, K, 1.2)}${F.line(40, 184, 40, 196, K, 1.2)}${F.line(205, 184, 205, 196, K, 1.2)}${F.txt(122, 208, `λ = ${F.t(v.lam)} m`, { a: 'middle', c: 'fv' })}
      ${F.txt(40, 30, 'E', { c: 'fv', col: B })}${F.txt(58, 30, 'and', { c: 'fs' })}${F.txt(84, 30, 'H', { c: 'fv', col: R })}${F.txt(98, 30, 'at right angles, in phase', { c: 'fs' })}
      ${F.txt(390, 30, `v = ${F.t(v.u / 1e6)} × 10⁶ m/s`, { a: 'end', c: 'fv' })}${F.txt(390, 48, `η = ${F.t(v.eta)} Ω`, { a: 'end', c: 'fv' })}${F.txt(390, 208, `f ${F.t(v.f)} MHz · εᵣ ${F.t(v.er)} · μᵣ ${F.t(v.mr)}`, { a: 'end', c: 'fs' })}`, 'A plane wave: E and H at right angles, and its wavelength');
  });
  add('Displacement current density', (v, F) => {
    let dash = ''; for (let y = 76; y <= 140; y += 16) dash += F.arrow(180, y, 214, y, O, 1.6);
    return F.svg(400, 220, `${F.src(40, 110, 16, K)}${F.wire('M40,94 V40 H176 V70', K, 1)}${F.wire('M40,126 V180 H218 V150', K, 1)}${F.line(176, 70, 176, 150, R, 5)}${F.line(218, 70, 218, 150, B, 5)}${dash}
      ${F.txt(197, 64, 'Jd', { a: 'middle', c: 'fv', col: O })}${F.txt(110, 32, 'conduction current', { a: 'middle', c: 'fs' })}${F.txt(10, 204, 'between the plates: displacement current', { c: 'fs' })}
      ${F.waves(240, 40, 150, 110, [{ a: 1, col: B, l: 'E' }, { a: 1, col: O, l: 'Jd', ph: -PI / 2 }], 1.5)}
      ${F.txt(390, 168, `peak Jd = ${F.t(v.Jd)} µA/m²`, { a: 'end', c: 'fv', col: O })}${F.txt(390, 184, `Em ${F.t(v.Em)} V/m · ω ${F.t(v.w)} rad/s`, { a: 'end', c: 'fs' })}${F.txt(390, 218, 'Jd leads E by 90°', { a: 'end', c: 'fs' })}`, 'Displacement current between capacitor plates, leading the field by 90 degrees');
  });
  add('Skin depth', (v, F) => {
    const Rc = 10, f = cl(v.d / Rc, 0, 1), r0 = 72, ri = r0 * (1 - f);
    let cv = ''; for (let k = 0; k <= 60; k++) { const x = 3 * k / 60; cv += `${k ? 'L' : 'M'}${(240 + 140 * x / 3).toFixed(1)},${(190 - 130 * Math.exp(-x)).toFixed(1)}`; }
    return F.svg(400, 220, `<circle cx="110" cy="112" r="${r0}" fill="${O}" fill-opacity=".75"/>${ri > 0.5 ? `<circle cx="110" cy="112" r="${ri.toFixed(1)}" fill="${O}" fill-opacity=".12" stroke="${O}" stroke-dasharray="4 3"/>` : ''}
      ${F.txt(110, 26, `δ = ${F.t(v.d)} mm`, { a: 'middle', c: 'fv', col: O })}${F.txt(10, 206, '20 mm conductor to scale: current flows in the skin', { c: 'fs' })}
      <rect x="232" y="44" width="156" height="154" rx="8" class="fbox"/><path d="${cv}" fill="none" stroke="${O}" stroke-width="2.2"/>${F.line(286.7, 60, 286.7, 190, M, 1, '3 3')}
      ${F.txt(240, 60, 'J / J₀ = e^(−x/δ)', { c: 'fs' })}${F.txt(290, 180, 'x = δ: 37 %', { c: 'fs' })}${F.txt(310, 36, `f ${F.t(v.f)} Hz · σ ${F.t(v.s)} MS/m · μᵣ ${F.t(v.mr)}`, { a: 'middle', c: 'fs' })}`, 'Cross-section of a conductor with the current crowded into a skin, and the fall of current density with depth');
  });
  add('Lifting force of a magnet', (v, F) => {
    const L = 16 + 50 * lg(v.F, 0.01, 1e5);
    return F.svg(400, 220, `<path d="M90,40 V130 M170,40 V130 M90,40 H170" fill="none" stroke="#94a3b8" stroke-width="26" stroke-linejoin="round"/>${F.coil(130, 30, 52, 4, O, 1)}
      <rect x="66" y="150" width="128" height="26" rx="4" fill="#94a3b8" fill-opacity=".55" stroke="#94a3b8"/>${F.txt(130, 168, 'iron', { a: 'middle', c: 'fs' })}
      <path d="M90,128 C90,162 170,162 170,128" fill="none" stroke="${B}" stroke-width="1.8" stroke-dasharray="5 4"/>${F.arrow(130, 150, 130, 150 - L, G)}
      ${F.txt(240, 70, `B = ${F.t(v.B)} T`, { c: 'fv' })}${F.txt(240, 92, `pole face ${F.t(v.A)} cm²`, { c: 'fs' })}${F.txt(240, 128, `pull F = ${F.t(v.F)} N`, { c: 'fv', col: G })}${F.txt(240, 148, 'per pole face: B²A / (2μ₀)', { c: 'fs' })}`, 'A horseshoe magnet lifting an iron bar');
  });

  /* ================= Measurements ================= */
  add('Ammeter shunt and voltmeter multiplier', (v, F) => {
    const ish = v.I - v.Im / 1000;
    return F.svg(400, 220, `${F.txt(100, 22, 'ammeter: shunt in parallel', { a: 'middle', c: 'fs' })}${F.wire('M10,110 H40 V70 H85 M115,70 H160 V110 H190', B, 1)}${F.wire('M40,110 V150 H65 M135,150 H160 V110', O, 1)}${meter(F, 100, 70, 'A', B)}${F.resH(65, 135, 150, O)}
      ${F.txt(100, 100, `Rm ${F.t(v.Rm)} Ω · ${F.t(v.Im)} mA`, { a: 'middle', c: 'fs' })}${F.txt(100, 176, `Rsh = ${F.t(v.Rsh)} Ω`, { a: 'middle', c: 'fv', col: O })}${F.txt(100, 194, `carries ${F.t(ish)} A of ${F.t(v.I)} A`, { a: 'middle', c: 'fs' })}
      ${F.line(200, 20, 200, 200, 'var(--line)', 1)}${F.txt(300, 22, 'voltmeter: multiplier in series', { a: 'middle', c: 'fs' })}${F.wire('M215,90 H235', K)}${F.resH(235, 305, 90, O)}${F.wire('M305,90 H330', K)}${meter(F, 345, 90, 'V', B)}${F.wire('M360,90 H385', K)}
      ${F.txt(270, 116, `Rse = ${F.t(v.Rse)} Ω`, { a: 'middle', c: 'fv', col: O })}${F.line(215, 140, 385, 140, M, 1.2)}${F.txt(300, 158, `${F.t(v.V)} V across both`, { a: 'middle', c: 'fs' })}${F.txt(300, 186, `sensitivity ${F.t(v.S)} Ω/V`, { a: 'middle', c: 'fv' })}`, 'A meter with a shunt for current and a multiplier for voltage');
  });
  add('Voltmeter loading', (v, F) => {
    const mx = Math.max(v.Vt, v.Vr, 1e-9);
    return F.svg(400, 220, `${F.src(40, 110, 15, K)}${F.wire('M40,95 V30 H140 V45', K)}${F.resV(140, 45, 100, O)}${F.resV(140, 120, 175, O)}${F.wire('M140,100 V120', K)}${F.wire('M140,175 V200 H40 V125', K)}
      ${F.wire('M140,115 H190 V128', B)}${meter(F, 190, 145, 'V', B)}${F.wire('M190,160 V188 H140', B)}
      ${F.txt(152, 76, `R₁ ${F.t(v.R1)} kΩ`, { c: 'fs' })}${F.txt(100, 150, `R₂ ${F.t(v.R2)} kΩ`, { a: 'end', c: 'fs' })}${F.txt(14, 74, `${F.t(v.V)} V`, { c: 'fs' })}${F.txt(212, 150, `Rv ${F.t(v.Rv)} kΩ`, { c: 'fs', col: B })}
      ${F.txt(258, 50, 'true', { c: 'fs' })}${F.bar(258, 56, 130, 18, 1, 'transparent')}<rect x="258" y="56" width="${(130 * v.Vt / mx).toFixed(1)}" height="18" rx="6" fill="${G}"/>${F.txt(258, 92, `${F.t(v.Vt)} V`, { c: 'fv', col: G })}
      ${F.txt(258, 120, 'meter reads', { c: 'fs' })}<rect x="258" y="126" width="${(130 * v.Vr / mx).toFixed(1)}" height="18" rx="6" fill="${O}"/>${F.txt(258, 162, `${F.t(v.Vr)} V`, { c: 'fv', col: O })}${F.txt(258, 190, `error ${F.t(v.e)} %`, { c: 'fv', col: R })}`, 'A voltmeter across part of a high-resistance divider reads low');
  });
  add('Wheatstone bridge', (v, F) => F.svg(400, 230, `${bridge(F, 160, 115, 82, [['P', `${F.t(v.P)} Ω`, B], ['Q', `${F.t(v.Q)} Ω`, B], ['R', `${F.t(v.R)} Ω`, O], ['S', `${F.t(v.S)} Ω`, G]])}
      ${F.txt(10, 222, `balanced (G reads 0) when P/Q = R/S → R = S × P / Q = ${F.t(v.R)} Ω`, { c: 'fs' })}`, 'A Wheatstone bridge at balance'));
  add('Energy meter — constant, speed and error', (v, F) => {
    const a = 2 * PI * (v.n % 1 || 0.3), mk = [200 + 90 * Math.cos(a), 120 + 22 * Math.sin(a)], err = cl(v.err, -10, 10);
    return F.svg(400, 220, `<rect x="90" y="30" width="220" height="150" rx="14" class="fbox"/><rect x="140" y="44" width="120" height="30" rx="5" fill="var(--bg)" stroke="${M}"/>${F.txt(200, 64, `${F.t(v.E)} kWh`, { a: 'middle', c: 'fv' })}
      <ellipse cx="200" cy="120" rx="90" ry="22" fill="#cbd5e1" fill-opacity=".5" stroke="${M}" stroke-width="2"/><circle cx="${mk[0].toFixed(1)}" cy="${mk[1].toFixed(1)}" r="5" fill="${R}"/>${F.txt(200, 160, `${F.t(v.n)} rev in ${F.t(v.t)} min`, { a: 'middle', c: 'fs' })}
      ${F.txt(200, 20, `K = ${F.t(v.K)} rev/kWh · shows ${F.t(v.P)} kW, true ${F.t(v.Pt)} kW`, { a: 'middle', c: 'fs' })}
      ${F.line(100, 200, 300, 200, M, 1.2)}${F.line(200, 194, 200, 206, M, 1.2)}<circle cx="${(200 + 10 * err).toFixed(1)}" cy="200" r="6" fill="${Math.abs(v.err) < 0.5 ? G : R}"/>${F.txt(96, 204, '−10 %', { a: 'end', c: 'fs' })}${F.txt(304, 204, '+10 %', { c: 'fs' })}
      ${F.txt(340, 120, `error`, { a: 'middle', c: 'fs' })}${F.txt(340, 138, `${F.t(v.err)} %`, { a: 'middle', c: 'fv', col: Math.abs(v.err) < 0.5 ? G : R })}${F.txt(340, 156, v.err < 0 ? 'runs slow' : v.err > 0 ? 'runs fast' : 'correct', { a: 'middle', c: 'fs' })}`, 'An energy meter with its disc, register and error');
  });
  add('CT ratio error', (v, F) => {
    const e = cl(v.e, -10, 10);
    return F.svg(400, 220, `${F.wire('M10,70 H390', O, 1)}<ellipse cx="110" cy="70" rx="14" ry="30" fill="none" stroke="${Y}" stroke-width="5"/>${F.wire('M102,100 V150 H130 M118,100 V125', B)}${meter(F, 145, 150, 'A', B)}${F.wire('M160,150 H175 V125 H118', B)}
      ${F.txt(20, 60, `Ip = ${F.t(v.Ip)} A`, { c: 'fs' })}${F.txt(145, 188, `Is = ${F.t(v.Is)} A`, { a: 'middle', c: 'fv', col: B })}${F.txt(110, 30, `CT ${F.t(v.Np)} / ${F.t(v.Ns)} A`, { a: 'middle', c: 'fs' })}
      ${F.txt(220, 110, `nominal Kn = ${F.t(v.Kn)}`, { c: 'fs' })}${F.txt(220, 130, `actual R = Ip / Is = ${F.t(v.R)}`, { c: 'fs' })}${F.txt(220, 156, `ratio error ${F.t(v.e)} %`, { c: 'fv', col: Math.abs(v.e) < 0.5 ? G : R })}
      ${F.line(220, 190, 380, 190, M, 1.2)}${F.line(300, 184, 300, 196, M, 1.2)}<circle cx="${(300 + 8 * e).toFixed(1)}" cy="190" r="6" fill="${Math.abs(v.e) < 0.5 ? G : R}"/>${F.txt(220, 208, '−10 %', { c: 'fs' })}${F.txt(380, 208, '+10 %', { a: 'end', c: 'fs' })}`, 'A current transformer, its secondary current and ratio error');
  });
  add('PMMC, moving-iron and rectifier meters on a waveform', (v, F) => {
    const w = v.w, f = th => w === 'sine' ? Math.sin(th) : w === 'half-wave' ? Math.max(0, Math.sin(th)) : w === 'full-wave' ? Math.abs(Math.sin(th)) : w === 'dc' ? 1 : Math.sin(th) >= 0 ? 1 : -1;
    const Yv = y => 92 - 56 * y / Math.max(v.Vm, 1e-9); let d = ''; for (let k = 0; k <= 160; k++) { const th = 4 * PI * k / 160; d += `${k ? 'L' : 'M'}${(16 + 200 * k / 160).toFixed(1)},${Yv(v.Vm * f(th)).toFixed(1)}`; }
    const mx = Math.max(Math.abs(v.pm), v.mi, v.rm, 1e-9), bar = (y, lab, x, col) => `${F.txt(240, y - 6, lab, { c: 'fs' })}<rect x="240" y="${y}" width="${(150 * Math.abs(x) / mx).toFixed(1)}" height="16" rx="5" fill="${col}"/>${F.txt(240, y + 32, `${F.t(x)} V`, { c: 'fv', col })}`;
    return F.svg(400, 220, `<rect x="10" y="26" width="212" height="132" rx="8" class="fbox"/>${F.line(14, 92, 218, 92, M, 1)}<path d="${d}" fill="none" stroke="${B}" stroke-width="2.4"/>
      ${F.line(14, Yv(v.mi), 218, Yv(v.mi), G, 1.4, '6 4')}${F.line(14, Yv(v.pm), 218, Yv(v.pm), O, 1.4, '3 3')}${F.txt(116, 20, `${w} · peak ${F.t(v.Vm)} V`, { a: 'middle', c: 'fs' })}${F.txt(116, 178, 'dashed: rms (green) and average (orange)', { a: 'middle', c: 'fs' })}
      ${bar(40, 'PMMC (average)', v.pm, O)}${bar(100, 'moving iron (rms)', v.mi, G)}${bar(160, 'rectifier (1.11 × rect. avg)', v.rm, P)}`, 'A waveform and what three kinds of meter read on it');
  });
  add('Maxwell inductance–capacitance bridge', (v, F) => F.svg(400, 258, `${bridge(F, 160, 124, 82, [['Lx, Rx', '', O], ['R₂', `${F.t(v.R2)} kΩ`, B], ['R₃', `${F.t(v.R3)} kΩ`, B], ['R₁ ∥ C₁', '', G]], 'D')}
      ${F.txt(10, 16, `R₁ ${F.t(v.R1)} kΩ ∥ C₁ ${F.t(v.C1)} µF · ${F.t(v.f)} Hz`, { c: 'fs', col: G })}${F.txt(10, 238, `Lx = R₂R₃C₁ = ${F.t(v.L)} H · Rx = R₂R₃/R₁ = ${F.t(v.R)} Ω`, { c: 'fv', col: O })}${F.txt(10, 254, `Q of the coil = ωC₁R₁ = ${F.t(v.Q)}`, { c: 'fs' })}`, 'Maxwell bridge: the coil opposite the R and C in parallel'));
  add('Schering bridge and Wien bridge', (v, F) => F.svg(400, 230, `${bridge(F, 90, 112, 56, [['Cx', '', O], ['C₂', '', B], ['R₃', '', B], ['R₄∥C₄', '', G]], 'D')}${bridge(F, 285, 112, 56, [['R–C', '', P], ['R₃', '', B], ['R ∥ C', '', P], ['R₄', '', B]], 'D')}
      ${F.txt(90, 20, 'Schering', { a: 'middle', c: 'fv' })}${F.txt(285, 20, 'Wien', { a: 'middle', c: 'fv' })}
      ${F.txt(90, 204, `Cx = C₂R₄/R₃ = ${F.t(v.Cx)} pF`, { a: 'middle', c: 'fv', col: O })}${F.txt(90, 222, `tan δ = ωC₄R₄ = ${F.t(v.td)}`, { a: 'middle', c: 'fs' })}
      ${F.txt(285, 204, `f = 1/(2πRC) = ${F.t(v.fw)} Hz`, { a: 'middle', c: 'fv', col: P })}${F.txt(285, 222, `R ${F.t(v.R)} kΩ · C ${F.t(v.C)} nF`, { a: 'middle', c: 'fs' })}`, 'A Schering bridge and a Wien bridge'));
  add('Q-meter — inductance from resonance', (v, F) => {
    let cv = ''; for (let k = 0; k <= 80; k++) { const u = 0.5 + k / 80, q = 30, y = 1 / Math.hypot(1, q * (u - 1 / u)); cv += `${k ? 'L' : 'M'}${(230 + 150 * k / 80).toFixed(1)},${(186 - 120 * y).toFixed(1)}`; }
    return F.svg(400, 220, `${F.src(40, 110, 15, K)}${F.wire('M40,95 V40 H90', K, 1)}<path d="M90,40 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0" fill="none" stroke="${O}" stroke-width="2.6"/>${F.wire('M154,40 H170 V96', K, 1)}${F.line(156, 96, 184, 96, B, 3)}${F.line(156, 106, 184, 106, B, 3)}${F.wire('M170,106 V180 H40 V125', K, 1)}
      ${F.wire('M170,70 H200 V96', M)}${meter(F, 200, 112, 'V', M)}${F.wire('M200,127 V150 H170', M)}${F.txt(122, 30, `L = ${F.t(v.L)} µH`, { a: 'middle', c: 'fv', col: O })}${F.txt(150, 130, `C ${F.t(v.C)} pF`, { a: 'end', c: 'fs', col: B })}
      <rect x="226" y="50" width="160" height="140" rx="8" class="fbox"/><path d="${cv}" fill="none" stroke="${P}" stroke-width="2.2"/>${F.line(305, 60, 305, 186, M, 1, '3 3')}${F.txt(305, 44, `resonance at ${F.t(v.f)} MHz`, { a: 'middle', c: 'fs' })}
      ${F.txt(8, 206, 'tune C to resonance, then L = 1/(4π²f²C)', { c: 'fs' })}`, 'A Q-meter circuit tuned to resonance');
  });
  add('CRO — deflection sensitivity and Lissajous figures', (v, F) => {
    const ph = Math.asin(cl(v.y, -1, 1)); let lj = ''; for (let k = 0; k <= 90; k++) { const t = 2 * PI * k / 90; lj += `${k ? 'L' : 'M'}${(330 + 46 * Math.sin(t)).toFixed(1)},${(110 - 46 * Math.sin(t + ph)).toFixed(1)}`; }
    return F.svg(400, 220, `<path d="M20,90 H90 L250,40 V180 L90,130 H20 Z" fill="var(--paper)" stroke="${M}" stroke-width="1.6"/><rect x="26" y="100" width="34" height="20" rx="4" fill="${M}" fill-opacity=".4"/>${F.txt(43, 146, 'gun', { a: 'middle', c: 'fs' })}
      ${F.line(110, 96, 150, 96, B, 4)}${F.line(110, 124, 150, 124, B, 4)}${F.txt(130, 88, 'Y plates', { a: 'middle', c: 'fs' })}<path d="M60,110 H110 L150,104 L250,72" fill="none" stroke="${G}" stroke-width="2"/>${F.line(250, 40, 250, 180, P, 3)}
      ${F.txt(130, 200, `S = ${F.t(v.S)} mm/V · G = ${F.t(v.G)} V/mm`, { a: 'middle', c: 'fv' })}${F.txt(130, 216, `L ${F.t(v.L)} m · l ${F.t(v.l)} cm · d ${F.t(v.d)} mm · Ea ${F.t(v.Ea)} kV`, { a: 'middle', c: 'fs' })}
      <circle cx="330" cy="110" r="56" fill="var(--bg)" stroke="${M}"/>${F.line(274, 110, 386, 110, 'var(--line)', 1)}${F.line(330, 54, 330, 166, 'var(--line)', 1)}<path d="${lj}" fill="none" stroke="${G}" stroke-width="2.2"/>
      ${F.txt(330, 186, `Y₀/Ymax ${F.t(v.y)} → ϕ = ${F.t(v.ph)}°`, { a: 'middle', c: 'fv', col: G })}`, 'A cathode-ray tube with its deflection plates, and a Lissajous ellipse');
  });
  add('DVM resolution', (v, F) => {
    const rv = v.res / 1000, mxv = (v.N - 1) * rv;   // resolution is in mV
    const txt = Number.isFinite(mxv) && rv > 0 ? mxv.toFixed(Math.max(0, Math.min(6, Math.ceil(-Math.log10(rv) - 1e-9)))) : '–';
    return F.svg(400, 200, `<rect x="40" y="30" width="320" height="90" rx="14" fill="#0f172a"/><text x="200" y="96" text-anchor="middle" style="font-size:44px;font-weight:800;fill:#4ade80;font-family:ui-monospace,monospace">${txt}</text>${F.txt(340, 112, 'V', { a: 'end', c: 'fs', col: '#4ade80' })}
      ${F.txt(200, 22, `${F.t(v.n)} full digits${v.h === 'yes' ? ' + a half digit (the leading 1)' : ''} · ${F.t(v.rg)} V range`, { a: 'middle', c: 'fs' })}
      ${F.txt(40, 146, `counts ${F.t(v.N)}`, { c: 'fv' })}${F.txt(360, 146, `resolution ${F.t(v.res)} mV`, { a: 'end', c: 'fv', col: P })}${F.txt(360, 164, `= ${F.t(v.pc)} % of the range`, { a: 'end', c: 'fs' })}
      ${F.txt(200, 180, 'shown: the largest reading on this range', { a: 'middle', c: 'fs' })}`, 'A digital voltmeter display at its largest reading');
  });
  add('Measurement error and limiting error', (v, F) => {
    const X = x => 200 + 150 * cl((x - v.t) / Math.max(Math.abs(v.t) * 0.06, 1e-9), -1, 1), mx = Math.max(v.ep, v.e1, v.e2, v.eq, 1e-9), bar = (y, lab, x, col) => `${F.txt(20, y + 12, lab, { c: 'fs' })}<rect x="200" y="${y}" width="${(180 * x / mx).toFixed(1)}" height="16" rx="5" fill="${col}"/>${F.txt(196, y + 12, `${F.t(x)} %`, { a: 'end', c: 'fv', col })}`;
    return F.svg(400, 230, `${F.line(50, 60, 350, 60, M, 1.4)}<circle cx="${X(v.t)}" cy="60" r="7" fill="${G}"/><circle cx="${X(v.m)}" cy="60" r="7" fill="${O}"/>${F.txt(X(v.t), 44, `true ${F.t(v.t)}`, { a: 'middle', c: 'fs', col: G })}${F.txt(X(v.m), 88, `measured ${F.t(v.m)}`, { a: 'middle', c: 'fs', col: O })}
      ${F.txt(200, 20, `error ${F.t(v.e)} % · correction ${F.t(v.c)}`, { a: 'middle', c: 'fv' })}
      ${bar(112, 'quantity 1', v.e1, B)}${bar(138, 'quantity 2', v.e2, B)}${bar(168, 'product / quotient: add', v.ep, R)}${bar(194, 'random: √(e₁² + e₂²)', v.eq, P)}`, 'Measured and true values, and how limiting errors combine');
  });
  add('CT and PT multiplying factor for a meter', (v, F) => F.svg(400, 200, `${F.wire('M10,60 H390', O, 1)}<ellipse cx="80" cy="60" rx="10" ry="22" fill="none" stroke="${Y}" stroke-width="4"/>${F.txt(80, 30, `CT ${F.t(v.ci)}`, { a: 'middle', c: 'fs' })}
      <circle cx="160" cy="92" r="11" fill="var(--paper)" stroke="${M}" stroke-width="2"/><circle cx="160" cy="108" r="11" fill="var(--paper)" stroke="${M}" stroke-width="2"/>${F.line(160, 60, 160, 81, M, 2)}${F.txt(178, 104, `PT ${F.t(v.pi)}`, { c: 'fs' })}
      ${F.wire('M80,82 V150 H230 M160,119 V140 H230', B)}${box(F, 230, 118, 150, 52, `reads ${F.t(v.R)} kWh`, B, `built for CT ${F.t(v.cm)}, PT ${F.t(v.pm)}`)}
      ${F.txt(200, 192, `MF = (${F.t(v.ci)}/${F.t(v.cm)}) × (${F.t(v.pi)}/${F.t(v.pm)}) = ${F.t(v.MF)} → actual ${F.t(v.E)} kWh`, { a: 'middle', c: 'fv', col: P })}`, 'A meter on a CT and PT different from those it was built for'));

  /* ================= Control Systems ================= */
  const loop = (F, blk, sub, hlab) => `${F.arrow(8, 60, 42, 60, K, 1.8)}${sum(F, 54, 60)}${F.arrow(65, 60, 100, 60, K, 1.8)}${box(F, 100, 38, 130, 44, blk, B, sub)}${F.arrow(230, 60, 268, 60, K, 1.8)}
    <path d="M250,60 V110 H${hlab ? 190 : 54} ${hlab ? '' : 'V71'}" fill="none" stroke="${K}" stroke-width="1.8"/>${hlab ? `${box(F, 120, 92, 70, 36, hlab, O)}<path d="M120,110 H54 V71" fill="none" stroke="${K}" stroke-width="1.8"/>` : ''}${F.arrow(54, 76, 54, 71.5, K, 1.8)}
    ${F.txt(8, 52, 'R', { c: 'fs' })}${F.txt(266, 52, 'C', { a: 'end', c: 'fs' })}${F.txt(44, 84, '−', { c: 'fv' })}`;
  add('Unity feedback around K/[s(s + a)]', (v, F) => {
    const sig = v.z * v.wn, wd = v.z < 1 ? v.wn * sq(1 - v.z * v.z) : 0, ps = v.z < 1 ? [[-sig, wd], [-sig, -wd]] : [[-sig + v.wn * sq(v.z * v.z - 1), 0], [-sig - v.wn * sq(v.z * v.z - 1), 0]], S = splane(F, 284, 20, 392, 200, [...ps, [-v.a, 0], [0, 0]]);
    return F.svg(400, 224, `${loop(F, `${F.t(v.K)} / [s(s + ${F.t(v.a)})]`, 'open loop')}${S.g}${xm(S.X(0), S.Y(0), M)}${xm(S.X(-v.a), S.Y(0), M)}${ps.map(p => xm(S.X(p[0]), S.Y(p[1]))).join('')}
      ${F.txt(8, 150, `ζ = ${F.t(v.z)} · ωn = ${F.t(v.wn)} rad/s`, { c: 'fv' })}${F.txt(8, 170, `overshoot ${F.t(v.Mp)} % · settling ${F.t(v.ts)} s`, { c: 'fs' })}${F.txt(8, 188, `ramp error ${F.t(v.er)} · phase margin ${F.t(v.PM)}°`, { c: 'fs' })}${F.txt(392, 218, 'grey ×: open loop · red ×: closed loop', { a: 'end', c: 'fs' })}`, 'Unity feedback loop and its closed-loop poles');
  });
  add('Steady-state error and error constants', (v, F) => {
    const ty = +v.ty, panel = (x0, k, nm, e) => { const inp = t => k === 0 ? 1 : k === 1 ? t : t * t, fin = e !== '∞' && Number.isFinite(+e); let a = '', b = '';
      for (let i = 0; i <= 40; i++) { const t = i / 40, yi = inp(t), yo = k === 0 ? (fin ? 1 - +e / Math.max(v.A, 1e-9) * (1 - Math.exp(-6 * t)) : 1 - Math.exp(-6 * t)) : fin ? Math.max(0, yi - Math.min(0.35, +e / Math.max(v.A, 1e-9) * 0.35 + (+e > 0 ? 0.08 : 0)) * (1 - Math.exp(-6 * t))) : yi * (1 - 0.6 * t);
        a += `${i ? 'L' : 'M'}${(x0 + 10 + 100 * t).toFixed(1)},${(150 - 90 * Math.min(yi, 1.05)).toFixed(1)}`; b += `${i ? 'L' : 'M'}${(x0 + 10 + 100 * t).toFixed(1)},${(150 - 90 * Math.min(Math.max(yo, 0), 1.05)).toFixed(1)}`; }
      return `<rect x="${x0}" y="40" width="120" height="124" rx="8" class="fbox"/><path d="${a}" fill="none" stroke="${M}" stroke-width="2" stroke-dasharray="5 4"/><path d="${b}" fill="none" stroke="${B}" stroke-width="2.4"/>${F.txt(x0 + 60, 32, nm, { a: 'middle', c: 'fs' })}${F.txt(x0 + 60, 186, `error ${e === '∞' ? '∞' : F.t(+e)}`, { a: 'middle', c: 'fv', col: e === '∞' ? R : +e === 0 ? G : O })}`; };
    return F.svg(400, 210, `${panel(8, 0, 'step', v.ss)}${panel(140, 1, 'ramp', v.sr)}${panel(272, 2, 'parabola', v.sp)}${F.txt(200, 14, `type ${ty} loop · constant ${F.t(v.K)} · input size ${F.t(v.A)}`, { a: 'middle', c: 'fs' })}${F.txt(200, 204, 'dashed: input · blue: output (sketch; the error is the lab’s)', { a: 'middle', c: 'fs' })}`, 'How a loop of this type follows a step, a ramp and a parabola');
  });
  add('First-order system', (v, F) => {
    let cv = ''; for (let i = 0; i <= 60; i++) { const t = 5 * i / 60; cv += `${i ? 'L' : 'M'}${(220 + 170 * t / 5).toFixed(1)},${(180 - 120 * (1 - Math.exp(-t))).toFixed(1)}`; }
    return F.svg(400, 210, `${F.arrow(8, 60, 50, 60, K, 1.8)}${box(F, 50, 36, 140, 48, `${F.t(v.K)} / (${F.t(v.a)}s + ${F.t(v.b)})`, B)}${F.arrow(190, 60, 210, 60, K, 1.8)}${F.txt(8, 52, `step ${F.t(v.A)}`, { c: 'fs' })}
      ${F.txt(8, 120, `τ = a/b = ${F.t(v.tau)} s`, { c: 'fv', col: P })}${F.txt(8, 142, `final value ${F.t(v.yf)}`, { c: 'fs' })}${F.txt(8, 160, `98 % at 4τ = ${F.t(v.ts)} s · rise ${F.t(v.tr)} s`, { c: 'fs' })}${F.txt(8, 178, `bandwidth ${F.t(v.wb)} rad/s`, { c: 'fs' })}
      <rect x="214" y="40" width="180" height="150" rx="8" class="fbox"/><path d="${cv}" fill="none" stroke="${B}" stroke-width="2.4"/>${F.line(254, 60, 254, 180, M, 1, '3 3')}${F.line(220, 104.2, 390, 104.2, M, 1, '3 3')}
      ${F.txt(258, 196, 'τ', { c: 'fs' })}${F.txt(388, 98, '63.2 %', { a: 'end', c: 'fs' })}${F.txt(304, 32, 'step response, time in τ', { a: 'middle', c: 'fs' })}`, 'A first-order block and its step response');
  });
  add('Feedback around a first-order plant', (v, F) => {
    const S = splane(F, 230, 136, 392, 204, [[-v.p, 0], [-v.pc, 0]]);
    return F.svg(400, 210, `${loop(F, `${F.t(v.K)} / (s + ${F.t(v.p)})`, 'plant', `H ${F.t(v.H)}`)}${S.g}${xm(S.X(-v.p), S.Y(0), M)}${xm(S.X(-v.pc), S.Y(0), R)}${F.arrow(S.X(-v.p), S.Y(0) - 14, S.X(-v.pc), S.Y(0) - 14, R, 1.6)}
      ${F.txt(8, 152, `closed-loop pole −${F.t(v.pc)} (was −${F.t(v.p)})`, { c: 'fv', col: R })}${F.txt(8, 172, `dc gain ${F.t(v.dc)} · τ ${F.t(v.tau)} s`, { c: 'fs' })}${F.txt(8, 190, `sensitivity ${F.t(v.S)}`, { c: 'fs' })}`, 'Feedback around a first-order plant moves its pole left');
  });
  add('Negative feedback around a gain', (v, F) => {
    const vals = [['G (no feedback)', v.G, M], ['1/H', v.H ? 1 / v.H : NaN, O], ['T = G/(1 + GH)', v.T, B]].filter(x => Number.isFinite(x[1])), mx = Math.max(...vals.map(x => Math.abs(x[1])), 1e-9);
    return F.svg(400, 210, `${loop(F, `G = ${F.t(v.G)}`, '', `H ${F.t(v.H)}`)}${vals.map(([n, x, c], k) => `${F.txt(290, 30 + k * 40, n, { c: 'fs' })}<rect x="290" y="${36 + k * 40}" width="${(100 * Math.abs(x) / mx).toFixed(1)}" height="12" rx="4" fill="${c}"/>${F.txt(290 + 100 * Math.abs(x) / mx + 4, 47 + k * 40, F.t(x), { c: 'fs' })}`).join('')}
      ${F.txt(8, 160, `closed-loop gain ${F.t(v.T)}`, { c: 'fv', col: B })}${F.txt(8, 180, `sensitivity 1/(1 + GH) = ${F.t(v.S)}`, { c: 'fs' })}${F.txt(8, 198, 'large GH: T → 1/H, almost free of G', { c: 'fs' })}`, 'A gain with negative feedback');
  });
  add('Routh test of a cubic', (v, F) => {
    const rows = [['s³', v.a3, v.a1], ['s²', v.a2, v.a0], ['s¹', v.c3, 0], ['s⁰', v.a0, '']], sg = rows.map(r => Math.sign(r[1]));
    const roots = String(v.r || '').split(/,\s*/).map(cpx).filter(Boolean), S = splane(F, 250, 20, 392, 200, roots.length ? roots : [[0, 0]]);
    let tb = rows.map(([s, a, b], k) => `${F.txt(30, 52 + k * 30, s, { c: 'fs' })}<rect x="54" y="${36 + k * 30}" width="70" height="24" rx="5" fill="${sg[k] < 0 ? R : G}" fill-opacity=".14" stroke="${sg[k] < 0 ? R : G}"/>${F.txt(89, 53 + k * 30, F.t(a), { a: 'middle', c: 'fv' })}${F.txt(160, 53 + k * 30, b === '' ? '' : F.t(b), { a: 'middle', c: 'fs' })}`).join('');
    for (let k = 1; k < 4; k++) if (sg[k] && sg[k - 1] && sg[k] !== sg[k - 1]) tb += F.arrow(130, 44 + (k - 1) * 30, 130, 44 + k * 30, R, 1.6);
    return F.svg(400, 210, `${F.txt(89, 24, 'first column', { a: 'middle', c: 'fs' })}${tb}${S.g}${roots.map(r => xm(S.X(r[0]), S.Y(r[1]), r[0] > 1e-9 ? R : B)).join('')}
      ${F.txt(10, 172, `${F.t(v.rhp)} sign change${v.rhp === 1 ? '' : 's'} → ${F.t(v.rhp)} pole${v.rhp === 1 ? '' : 's'} in the right half`, { c: 'fv', col: v.rhp ? R : G })}${F.txt(10, 192, `${v.st} · stable while a₀ < ${F.t(v.K)}`, { c: 'fs' })}`, 'The Routh array and the roots on the s-plane');
  });
  // roots of s³ + b s² + c s + d (Durand–Kerner)
  const cubic = (b, c, d) => { let r = [[0.4, 0.9], [-0.6, 0.3], [-1.1, -0.8]]; const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]], div = (p, q) => { const n = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / n, (p[1] * q[0] - p[0] * q[1]) / n]; };
    for (let it = 0; it < 300; it++) r = r.map((x, i) => { const x2 = mul(x, x), f = [x2[0] * x[0] - x2[1] * x[1] + b * x2[0] + c * x[0] + d, x2[0] * x[1] + x2[1] * x[0] + b * x2[1] + c * x[1]]; let den = [1, 0]; r.forEach((y, j) => { if (j !== i) den = mul(den, [x[0] - y[0], x[1] - y[1]]); }); const q = div(f, den); return [x[0] - q[0], x[1] - q[1]]; }); return r; };
  add('Root locus and margins of K/[s(s + p₁)(s + p₂)]', (v, F) => {
    const cl3 = cubic(v.p1 + v.p2, v.p1 * v.p2, v.K), S = splane(F, 150, 14, 392, 204, [[0, 0], [-v.p1, 0], [-v.p2, 0], [0, v.wpc * 1.1], ...cl3]);
    let lc = ''; for (let i = 1; i <= 90; i++) { const k = v.Km * 2.2 * (i / 90) ** 2; cubic(v.p1 + v.p2, v.p1 * v.p2, k).forEach(p => { lc += `<circle cx="${S.X(p[0]).toFixed(1)}" cy="${S.Y(p[1]).toFixed(1)}" r="1.3" fill="${P}" fill-opacity=".55"/>`; }); }
    return F.svg(400, 210, `${S.g}${lc}${[0, -v.p1, -v.p2].map(p => xm(S.X(p), S.Y(0), M)).join('')}${cl3.map(p => `<circle cx="${S.X(p[0]).toFixed(1)}" cy="${S.Y(p[1]).toFixed(1)}" r="5" fill="${R}"/>`).join('')}
      <circle cx="${S.X(0)}" cy="${S.Y(v.wpc)}" r="4" fill="none" stroke="${O}" stroke-width="2"/><circle cx="${S.X(0)}" cy="${S.Y(-v.wpc)}" r="4" fill="none" stroke="${O}" stroke-width="2"/>${F.txt(S.X(0) + 8, S.Y(v.wpc) + 4, `±j${F.t(v.wpc)}`, { c: 'fs', col: O })}
      ${F.txt(8, 36, `K = ${F.t(v.K)}`, { c: 'fv', col: R })}${F.txt(8, 58, `centroid ${F.t(v.cen)}`, { c: 'fs' })}${F.txt(8, 76, `break-away ${F.t(v.bk)}`, { c: 'fs' })}${F.txt(8, 94, `limit K = ${F.t(v.Km)}`, { c: 'fs' })}${F.txt(8, 116, `GM ${F.t(v.GM)} × (${F.t(v.GMdB)} dB)`, { c: 'fv', col: O })}
      ${F.txt(8, 150, 'grey ×: open-loop poles', { c: 'fs' })}${F.txt(8, 166, 'purple: the locus as K grows', { c: 'fs' })}${F.txt(8, 182, 'red: closed-loop poles now', { c: 'fs', col: R })}`, 'Root locus with the closed-loop poles at the chosen gain');
  });
  add('Gain margin from the real-axis crossing', (v, F) => {
    const k = 3 * v.x, cx = 250, cy = 105, sc = 70, G0 = w => { const re = [1, 0], d1 = [0, w], d2 = [1, w], d3 = [1, w / 2], m = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]], den = m(m(d1, d2), d3), n = den[0] ** 2 + den[1] ** 2; return [k * den[0] / n, -k * den[1] / n]; };
    let d = '', on = false; for (let i = 0; i <= 160; i++) { const w = 0.2 * (60 / 0.2) ** (i / 160), [re, im] = G0(w), x = cx + sc * re, y = cy - sc * im, inb = x > 12 && x < 388 && y > 12 && y < 186; if (inb) { d += `${on ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; } on = inb; }
    return F.svg(400, 210, `${F.line(20, cy, 390, cy, M, 1.2)}${F.line(cx, 12, cx, 200, M, 1.2)}<circle cx="${cx}" cy="${cy}" r="${sc}" fill="none" stroke="${M}" stroke-dasharray="4 4"/>${xm(cx - sc, cy, R)}${F.txt(cx - sc, cy + 22, '−1', { a: 'middle', c: 'fs', col: R })}
      <path d="${d}" fill="none" stroke="${B}" stroke-width="2.4"/><circle cx="${cx - sc * v.x}" cy="${cy}" r="5" fill="${O}"/>${F.txt(cx - sc * v.x, cy - 12, `−${F.t(v.x)}`, { a: 'middle', c: 'fv', col: O })}
      ${F.txt(10, 22, `GM = 1/x = ${F.t(v.GM)} × = ${F.t(v.GMdB)} dB`, { c: 'fv', col: O })}${F.txt(10, 200, `${F.t(v.dB)} dB = × ${F.t(v.K)}`, { c: 'fs' })}${F.txt(390, 200, 'a typical type-1 polar plot, scaled to cut at −x', { a: 'end', c: 'fs' })}`, 'A polar plot crossing the negative real axis');
  });
  add('Lead (or lag) network', (v, F) => {
    const S = splane(F, 200, 20, 392, 170, [[-v.z, 0], [-v.p, 0]]), lead = v.p > v.z;
    return F.svg(400, 210, `${F.txt(10, 26, `(s + ${F.t(v.z)}) / (s + ${F.t(v.p)})`, { c: 'fv' })}${F.wire('M10,90 H40', K)}${F.resH(40, 110, 90, O)}${F.wire('M110,90 H160', K)}${F.wire('M40,90 V60 H65', K)}${F.line(66, 48, 66, 72, B, 3)}${F.line(76, 48, 76, 72, B, 3)}${F.wire('M77,60 H110 V90', K)}${F.resV(140, 90, 150, O)}${F.wire('M140,150 V160', K)}${F.txt(10, 82, 'in', { c: 'fs' })}${F.txt(160, 82, 'out', { a: 'end', c: 'fs' })}
      ${S.g}${om(S.X(-v.z), S.Y(0))}${xm(S.X(-v.p), S.Y(0))}${F.txt(S.X(-v.z), S.Y(0) + 22, '−z', { a: 'middle', c: 'fs', col: G })}${F.txt(S.X(-v.p), S.Y(0) - 12, '−p', { a: 'middle', c: 'fs', col: R })}
      ${F.txt(10, 186, `${v.ty}: largest phase ${F.t(v.pm)}° at ωm = √(zp) = ${F.t(v.wm)} rad/s`, { c: 'fv', col: lead ? G : O })}${F.txt(10, 204, `gain there ${F.t(v.g)} dB above the low-frequency value`, { c: 'fs' })}`, 'A lead network and its pole and zero');
  });
  add('Mason’s gain formula — one path, two touching loops', (v, F) => {
    const xs = [24, 104, 184, 264, 344], y = 70, node = x => `<circle cx="${x}" cy="${y}" r="6" fill="${K}"/>`, br = (a, b, lab) => F.arrow(xs[a] + 7, y, xs[b] - 7, y, B, 2) + F.txt((xs[a] + xs[b]) / 2, y - 10, lab, { a: 'middle', c: 'fv', col: B });
    const fb = (a, b, dy, lab) => `<path d="M${xs[a]},${y + 7} C${xs[a]},${y + dy} ${xs[b]},${y + dy} ${xs[b]},${y + 7}" fill="none" stroke="${O}" stroke-width="2"/>${F.arrow(xs[b] + 2, y + 18, xs[b], y + 9, O, 2)}${F.txt((xs[a] + xs[b]) / 2, y + 7 + 0.75 * (dy - 7) + 15, lab, { a: 'middle', c: 'fs', col: O })}`;
    return F.svg(400, 220, `${xs.map(node).join('')}${br(0, 1, `G₁ ${F.t(v.G1)}`)}${br(1, 2, `G₂ ${F.t(v.G2)}`)}${br(2, 3, `G₃ ${F.t(v.G3)}`)}${br(3, 4, '1')}${fb(2, 1, 84, `−H₁ ${F.t(v.H1)}`)}${fb(3, 1, 140, `−H₂ ${F.t(v.H2)}`)}
      ${F.txt(24, 52, 'R', { a: 'middle', c: 'fs' })}${F.txt(344, 52, 'C', { a: 'middle', c: 'fs' })}
      ${F.txt(200, 22, `P₁ = ${F.t(v.P)} · L₁ = ${F.t(v.L1)} · L₂ = ${F.t(v.L2)} · Δ = ${F.t(v.D)}`, { a: 'middle', c: 'fs' })}${F.txt(200, 210, `T = P₁Δ₁/Δ = ${F.t(v.T)} (both loops touch the path: Δ₁ = 1)`, { a: 'middle', c: 'fv', col: P })}`, 'Signal-flow graph with one forward path and two loops');
  });
  add('2 × 2 state model — poles, controllability, observability', (v, F) => {
    const ps = v.wi ? [[v.s1, v.wi], [v.s1, -v.wi]] : [[v.s1, 0], [v.s2, 0]], S = splane(F, 230, 20, 392, 170, ps), mtx = (x, y, rows, lab) => `${F.txt(x - 6, y + rows.length * 9 + 4, lab, { a: 'end', c: 'fv' })}<path d="M${x + 4},${y} h-4 v${rows.length * 20} h4 M${x + 80},${y} h4 v${rows.length * 20} h-4" fill="none" stroke="${K}" stroke-width="1.6"/>${rows.map((r, k) => r.map((c, j) => F.txt(x + 22 + j * 38, y + 15 + k * 20, F.t(c), { a: 'middle', c: 'fs' })).join('')).join('')}`;
    return F.svg(400, 210, `${mtx(40, 20, [[v.a, v.b], [v.c, v.d]], 'A')}${mtx(160, 20, [[v.b1], [v.b2]], 'B')}${mtx(40, 80, [[v.c1, v.c2]], 'C')}
      ${S.g}${ps.map(p => xm(S.X(p[0]), S.Y(p[1]), p[0] > 1e-9 ? R : B)).join('')}${F.txt(10, 134, v.ce, { c: 'fv' })}
      ${F.txt(10, 160, `poles ${F.t(v.s1)}${v.wi ? ` ± j${F.t(v.wi)}` : `, ${F.t(v.s2)}`} · ${v.st}`, { c: 'fs' })}${F.txt(10, 182, `controllable: ${v.ctr}`, { c: 'fv', col: v.ctr === 'yes' ? G : R })}${F.txt(10, 202, `observable: ${v.obs}`, { c: 'fv', col: v.obs === 'yes' ? G : R })}`, 'A 2 by 2 state model and its poles');
  });
  add('P, PI, PD and PID controllers', (v, F) => {
    const zs = String(v.z || '').split(/,\s*/).map(cpx).filter(Boolean), pts = [...zs, ...(v.Ki ? [[0, 0]] : [])], S = splane(F, 250, 20, 392, 200, pts.length ? pts : [[0, 0]]);
    const br = (y, lab, on) => `${F.wire(`M30,105 V${y} H70`, on ? K : 'var(--line)')}${box(F, 70, y - 16, 90, 32, lab, on ? B : 'var(--line)')}${F.wire(`M160,${y} H200 V105`, on ? K : 'var(--line)')}`;
    return F.svg(400, 224, `${F.arrow(4, 105, 30, 105, K, 1.8)}${br(45, `Kp ${F.t(v.Kp)}`, v.Kp)}${br(105, `Ki/s ${F.t(v.Ki)}`, v.Ki)}${br(165, `Kd·s ${F.t(v.Kd)}`, v.Kd)}${sum(F, 214, 105)}${F.arrow(225, 105, 244, 105, K, 1.8)}
      ${S.g}${zs.map(z => om(S.X(z[0]), S.Y(z[1]))).join('')}${v.Ki ? xm(S.X(0), S.Y(0)) : ''}${F.txt(392, 218, `zero(s) ${v.z} · loop type ${F.t(v.ty)}`, { a: 'end', c: 'fs' })}`, 'A PID controller and its zeros');
  });

  /* ================= Signals & DSP ================= */
  add('Sampling and aliasing', (v, F) => {
    const ns = 14, Ts = 1 / v.fs, Tw = ns * Ts, X = t => 16 + 368 * t / Tw, Yv = y => 105 - 62 * y;
    let s = '', a = '', dots = ''; for (let i = 0; i <= 400; i++) { const t = Tw * i / 400; s += `${i ? 'L' : 'M'}${X(t).toFixed(1)},${Yv(Math.sin(2 * PI * v.f * t)).toFixed(1)}`; }
    const sgn = Math.sin(2 * PI * v.f * Ts) * Math.sin(2 * PI * v.al * Ts) < 0 ? -1 : 1; for (let i = 0; i <= 400; i++) { const t = Tw * i / 400; a += `${i ? 'L' : 'M'}${X(t).toFixed(1)},${Yv(sgn * Math.sin(2 * PI * v.al * t)).toFixed(1)}`; }
    for (let k = 0; k <= ns; k++) { const t = k * Ts, y = Math.sin(2 * PI * v.f * t); dots += F.line(X(t), 105, X(t), Yv(y), M, 1) + `<circle cx="${X(t).toFixed(1)}" cy="${Yv(y).toFixed(1)}" r="4" fill="${K}"/>`; }
    return F.svg(400, 210, `${F.line(16, 105, 384, 105, M, 1)}<path d="${s}" fill="none" stroke="${B}" stroke-width="1.6" stroke-opacity=".55"/>${v.ok === 'yes' ? `<path d="${a}" fill="none" stroke="${O}" stroke-width="2.2" stroke-dasharray="6 4"/>` : ''}${dots}
      ${F.txt(16, 24, `signal ${F.t(v.f)} kHz`, { c: 'fv', col: B })}${F.txt(384, 24, `sampled at ${F.t(v.fs)} kHz`, { a: 'end', c: 'fv' })}
      ${F.txt(200, 188, v.ok === 'yes' ? `aliasing: the samples trace a ${F.t(v.al)} kHz tone (dashed)` : `no aliasing: fs ≥ 2f (Nyquist rate ${F.t(v.ny)} kHz)`, { a: 'middle', c: 'fv', col: v.ok === 'yes' ? O : G })}${F.txt(200, 206, `${ns} sampling intervals shown`, { a: 'middle', c: 'fs' })}`, 'A tone, its samples and the alias they trace');
  });
  add('DFT and radix-2 FFT', (v, F) => {
    const L = x => 10 + 290 * lg(x, 1, 1e12);
    let bf = ''; const xs = [40, 90, 140, 190]; for (let s = 0; s < 3; s++) for (let k = 0; k < 8; k++) { const span = 4 >> s, j = (k % (2 * span)) < span ? k + span : k - span; bf += F.line(xs[s], 34 + k * 14, xs[s + 1], 34 + j * 14, P, 1, '') + F.line(xs[s], 34 + k * 14, xs[s + 1], 34 + k * 14, P, 1); }
    for (let s = 0; s < 4; s++) for (let k = 0; k < 8; k++) bf += `<circle cx="${xs[s]}" cy="${34 + k * 14}" r="2.4" fill="${K}"/>`;
    return F.svg(400, 220, `${bf}${F.txt(115, 22, '8-point FFT: 3 stages of butterflies', { a: 'middle', c: 'fs' })}
      ${F.txt(220, 44, `N = ${F.t(v.N)} · ${F.t(v.st)} stages`, { c: 'fv' })}${F.txt(220, 64, `Δf = fs/N = ${F.t(v.df)} Hz`, { c: 'fs' })}${F.txt(220, 84, `${F.t(v.r)} × fewer`, { c: 'fv', col: G })}${F.txt(220, 100, 'multiplications', { c: 'fs' })}
      ${F.txt(10, 162, 'direct DFT N²', { c: 'fs' })}<rect x="100" y="152" width="${(L(v.dft) - 10).toFixed(1)}" height="14" rx="4" fill="${R}"/>${F.txt(104 + L(v.dft) - 10, 164, F.t(v.dft), { c: 'fs' })}
      ${F.txt(10, 190, 'FFT (N/2) log₂N', { c: 'fs' })}<rect x="100" y="180" width="${(L(v.fft) - 10).toFixed(1)}" height="14" rx="4" fill="${G}"/>${F.txt(104 + L(v.fft) - 10, 192, F.t(v.fft), { c: 'fs' })}${F.txt(200, 214, 'bar length: log scale', { a: 'middle', c: 'fs' })}`, 'FFT butterflies and the multiplication count against the direct DFT');
  });
  add('Linear and circular convolution', (v, F) => {
    const arr = s => String(s || '').replace(/[\[\]]/g, '').split(/[,\s]+/).map(num).filter(Number.isFinite), xx = arr(v.x), hh = arr(v.h), ll = arr(v.lin), cc = arr(v.circ);
    const mx = Math.max(1, ...[...xx, ...hh, ...ll, ...cc].map(Math.abs)), stem = (x0, y0, a, lab, col) => `${F.txt(x0, y0 - 46, lab, { c: 'fs' })}${F.line(x0, y0, x0 + 170, y0, M, 1)}${a.slice(0, 10).map((y, k) => F.line(x0 + 10 + k * 16, y0, x0 + 10 + k * 16, y0 - 38 * y / mx, col, 2) + `<circle cx="${x0 + 10 + k * 16}" cy="${(y0 - 38 * y / mx).toFixed(1)}" r="3.4" fill="${col}"/>`).join('')}`;
    return F.svg(400, 220, `${stem(10, 80, xx, `x[n] = ${xx.join(', ')}`, B)}${stem(210, 80, hh, `h[n] = ${hh.join(', ')}`, O)}${stem(10, 180, ll, `linear: ${ll.length} samples`, G)}${stem(210, 180, cc, `${F.t(v.N)}-point circular`, P)}
      ${F.txt(10, 208, `[${ll.join(', ')}]`, { c: 'fv', col: G })}${F.txt(210, 208, `[${cc.join(', ')}]`, { c: 'fv', col: P })}`, 'Two sequences, their linear and circular convolutions');
  });
  add('Filter order — Butterworth and Chebyshev', (v, F) => {
    const e2 = 10 ** (v.Ap / 10) - 1, TN = (n, w) => w <= 1 ? Math.cos(n * Math.acos(w)) : Math.cosh(n * Math.acosh(w)), aB = w => 10 * Math.log10(1 + e2 * w ** (2 * v.NB)), aC = w => 10 * Math.log10(1 + e2 * TN(v.Nc, w) ** 2);
    const wm = v.r * 1.6, X = w => 30 + 360 * w / wm, Yd = a => 30 + 160 * Math.min(a, v.As * 1.5) / (v.As * 1.5);
    let b = '', c = ''; for (let i = 0; i <= 200; i++) { const w = wm * i / 200; b += `${i ? 'L' : 'M'}${X(w).toFixed(1)},${Yd(aB(w)).toFixed(1)}`; c += `${i ? 'L' : 'M'}${X(w).toFixed(1)},${Yd(aC(w)).toFixed(1)}`; }
    return F.svg(400, 220, `<rect x="30" y="30" width="360" height="160" rx="6" class="fbox"/><rect x="${X(0)}" y="${Yd(v.Ap)}" width="${X(1) - X(0)}" height="${190 - Yd(v.Ap)}" fill="${G}" fill-opacity=".08"/><rect x="${X(v.r)}" y="30" width="${390 - X(v.r)}" height="${Yd(v.As) - 30}" fill="${R}" fill-opacity=".08"/>
      ${F.line(X(1), 30, X(1), 190, G, 1, '3 3')}${F.line(X(v.r), 30, X(v.r), 190, R, 1, '3 3')}${F.line(30, Yd(v.As), 390, Yd(v.As), R, 1, '3 3')}<path d="${b}" fill="none" stroke="${B}" stroke-width="2.4"/><path d="${c}" fill="none" stroke="${O}" stroke-width="2.2"/>
      ${F.txt(30, 22, `Butterworth N = ${F.t(v.NB)}`, { c: 'fv', col: B })}${F.txt(390, 22, `Chebyshev N = ${F.t(v.Nc)}`, { a: 'end', c: 'fv', col: O })}${F.txt(X(1), 206, 'Ωp', { a: 'middle', c: 'fs' })}${F.txt(X(v.r), 206, 'Ωs', { a: 'middle', c: 'fs' })}
      ${F.txt(386, Yd(v.As) - 4, `${F.t(v.As)} dB`, { a: 'end', c: 'fs', col: R })}${F.txt(34, 46, 'attenuation (dB) ↓', { c: 'fs' })}`, 'Attenuation of the Butterworth and Chebyshev filters against the specification');
  });

  /* ---- three labs from other topics that also open on these pages ---- */
  add('Two-wattmeter method', (v, F) => {
    const ph = v.ph * PI / 180, cx = 316, cy = 104, r = 56, Va = -PI / 2;
    const ar = (a, l, col, lab) => F.arrow(cx, cy, cx + l * Math.cos(a), cy + l * Math.sin(a), col, 2.2) + F.txt(cx + (l + 14) * Math.cos(a), cy + (l + 14) * Math.sin(a) + 4, lab, { a: 'middle', c: 'fs', col });
    const wm = (y, lab, w) => `<rect x="70" y="${y - 14}" width="80" height="28" rx="6" fill="var(--paper)" stroke="${w < 0 ? R : B}" stroke-width="2"/>${F.txt(110, y + 5, `${lab} ${F.t(w)} kW`, { a: 'middle', c: 'fs', col: w < 0 ? R : B })}`;
    return F.svg(400, 220, `${F.wire('M10,50 H70 M150,50 H200', R, 1)}${F.wire('M10,110 H200', Y, 1)}${F.wire('M10,170 H70 M150,170 H200', B, 1)}${wm(50, 'W₁', v.W1)}${wm(170, 'W₂', v.W2)}
      ${F.line(110, 64, 110, 110, M, 1.2, '3 3')}${F.line(110, 156, 110, 110, M, 1.2, '3 3')}<rect x="200" y="36" width="20" height="148" rx="5" fill="var(--paper)" stroke="${K}"/>${F.txt(210, 30, 'load', { a: 'middle', c: 'fs' })}
      ${ar(Va, r, R, 'Vᵣ')}${ar(Va + 2 * PI / 3, r, Y, 'Vᵧ')}${ar(Va - 2 * PI / 3, r, B, 'Vb')}${ar(Va + ph, r * 0.62, O, 'Iᵣ')}
      ${F.txt(10, 206, `P = W₁ + W₂ = ${F.t(v.P)} kW · ϕ = ${F.t(v.ph)}° · pf ${F.t(v.pf)}`, { c: 'fv' })}${F.txt(390, 206, `Q ${F.t(v.Q)} kVAR`, { a: 'end', c: 'fs' })}`, 'Two wattmeters on a three-phase load, and the phasors');
  });
  add('CT secondary current and burden', (v, F) => F.svg(400, 210, `${F.wire('M10,60 H390', O, 1)}<ellipse cx="110" cy="60" rx="14" ry="30" fill="none" stroke="${Y}" stroke-width="5"/>${F.wire('M102,90 V160 H170 M118,90 V120 H170', B, 1)}
      <rect x="170" y="108" width="70" height="64" rx="8" fill="var(--paper)" stroke="${B}" stroke-width="2"/>${F.txt(205, 136, 'burden', { a: 'middle', c: 'fs' })}${F.txt(205, 154, `${F.t(v.Zb)} Ω`, { a: 'middle', c: 'fv' })}
      ${F.txt(20, 50, `Ip = ${F.t(v.Ip)} A`, { c: 'fs' })}${F.txt(110, 22, `CT ${F.t(v.Np)} / ${F.t(v.Ns)} A`, { a: 'middle', c: 'fs' })}
      ${F.txt(252, 120, `Is = ${F.t(v.Is)} A`, { c: 'fv', col: B })}${F.txt(252, 144, `Is²Z = ${F.t(v.VA)} VA`, { c: 'fv', col: O })}${F.txt(200, 198, 'never open a CT secondary on load', { a: 'middle', c: 'fs', col: R })}`, 'A CT feeding its burden'));
  add('ADC and DAC', (v, F) => {
    const n = Math.round(v.n), lv = 2 ** Math.min(n, 5), code = Math.round(cl(v.D, 0, 2 ** n - 1)), X = k => 30 + 300 * k / lv, Yv = y => 190 - 150 * y;
    let st = 'M30,190'; for (let k = 0; k < lv; k++) st += ` V${Yv(k / lv).toFixed(1)} H${X(k + 1).toFixed(1)}`;
    const fr = code / 2 ** n;
    return F.svg(400, 220, `<rect x="26" y="34" width="308" height="160" rx="6" class="fbox"/>${F.line(30, 190, 330, 40, M, 1, '4 4')}<path d="${st}" fill="none" stroke="${B}" stroke-width="2.2"/>
      <circle cx="${(30 + 300 * fr).toFixed(1)}" cy="${Yv(fr).toFixed(1)}" r="5" fill="${O}"/>${F.txt(30 + 300 * fr, Yv(fr) - 10, `code ${code} → ${F.t(v.Vo)} V`, { a: fr > 0.6 ? 'end' : 'start', c: 'fs', col: O })}
      ${F.txt(30, 24, `${n} bits: ${F.t(v.L)} levels of ${F.t(v.q)} mV over ${F.t(v.V)} V${n > 5 ? ' (32 steps drawn)' : ''}`, { c: 'fs' })}
      ${F.txt(340, 70, 'SAR', { c: 'fs' })}${F.txt(340, 86, `${F.t(v.sar)} µs`, { c: 'fv' })}${F.txt(340, 112, 'counter', { c: 'fs' })}${F.txt(340, 128, `${F.t(v.cnt)} µs`, { c: 'fv' })}${F.txt(340, 154, 'flash comp.', { c: 'fs' })}${F.txt(340, 170, F.t(v.cmp), { c: 'fv' })}
      ${F.txt(180, 212, 'staircase: the DAC output for each code', { a: 'middle', c: 'fs' })}`, 'The DAC staircase, a code and its output, and conversion times');
  });

  /* ================= Digital Electronics ================= */
  add('Number systems and 2’s complement', (v, F) => {
    const bits = String(v.tc || '').replace(/\s/g, ''), n = Math.min(bits.length, 16), w = Math.min(22, 360 / Math.max(n, 1)), x0 = 200 - n * w / 2;
    let g = ''; for (let k = 0; k < n; k++) g += `<rect x="${(x0 + k * w).toFixed(1)}" y="40" width="${(w - 2).toFixed(1)}" height="28" rx="4" fill="${bits[k] === '1' ? P : 'var(--paper)'}" stroke="${P}"/>${F.txt(x0 + k * w + (w - 2) / 2, 59, bits[k], { a: 'middle', c: 'fv', col: bits[k] === '1' ? '#fff' : K })}`;
    for (let k = n; k > 0; k -= 4) g += F.line(x0 + Math.max(0, k - 4) * w + 2, 76, x0 + k * w - 4, 76, O, 2);
    return F.svg(400, 210, `${F.txt(200, 26, `${F.t(v.N)} in ${F.t(v.n)}-bit 2’s complement`, { a: 'middle', c: 'fs' })}${g}${F.txt(200, 94, 'orange: groups of 4 bits = hex digits', { a: 'middle', c: 'fs' })}
      ${[['binary', v.bin], ['octal', v.oct], ['hex', v.hex], ['Gray', v.gray], ['BCD', v.bcd]].map(([k, x], i) => `${F.txt(110, 122 + i * 18, k, { a: 'end', c: 'fs' })}${F.txt(120, 122 + i * 18, x, { c: 'fv' })}`).join('')}`, 'A number as bits, with its other codes');
  });
  add('Counters', (v, F) => {
    const nf = Math.min(v.nf, 8), w = 300 / nf, N = Math.max(2, Math.round(v.N)), cyc = N <= 8 ? 2 : 1, tot = N * cyc, X = k => 64 + 326 * k / tot;
    let ffs = ''; for (let k = 0; k < nf; k++) ffs += box(F, 50 + k * w + 3, 30, w - 10, 34, `FF${k}`, P);
    let clk = 'M64,140', out = 'M64,190'; if (tot <= 64) for (let k = 0; k < tot; k++) { clk += ` V120 H${(X(k) + X(k + 1)) / 2} V140 H${X(k + 1)}`; } else clk = '';
    for (let c = 0; c < cyc; c++) { const a = X(c * N), m = X(c * N + Math.ceil(N / 2)), b = X((c + 1) * N); out += ` H${a} V170 H${m} V190 H${b}`; }
    return F.svg(400, 220, `${ffs}${F.txt(30, 52, 'clk', { a: 'end', c: 'fs' })}${F.txt(200, 22, `mod-${F.t(v.N)} counter: ${F.t(v.nf)} flip-flops (2ⁿ ≥ N)`, { a: 'middle', c: 'fs' })}
      ${clk ? `<path d="${clk}" fill="none" stroke="${B}" stroke-width="2"/>` : `<rect x="64" y="120" width="326" height="20" fill="${B}" fill-opacity=".35"/>`}<path d="${out}" fill="none" stroke="${O}" stroke-width="2.4"/>${F.txt(58, 134, `${F.t(v.f)} kHz`, { a: 'end', c: 'fs', col: B })}${F.txt(58, 184, `${F.t(v.fo)} kHz`, { a: 'end', c: 'fs', col: O })}
      ${F.txt(200, 92, `clock ÷ ${F.t(v.N)} · ring ${F.t(v.ring)} states · Johnson ${F.t(v.jn)} states · ripple fmax ${F.t(v.fmax)} MHz`, { a: 'middle', c: 'fs' })}${F.txt(200, 214, 'blue: clock · orange: output, one cycle per N clocks', { a: 'middle', c: 'fs' })}`, 'Flip-flops of a counter, the clock and the divided output');
  });
  add('Memory, address lines and MUX size', (v, F) => {
    const al = Math.min(v.a, 20), sl = Math.min(v.sel, 8), mi = Math.min(v.mi, 16);
    let ad = ''; for (let k = 0; k < al; k++) ad += F.line(20, 40 + k * (120 / Math.max(al, 1)), 60, 40 + k * (120 / Math.max(al, 1)), B, 1.4);
    let dl = ''; for (let k = 0; k < Math.min(v.w, 16); k++) dl += F.line(160, 50 + k * (100 / Math.min(v.w, 16)), 196, 50 + k * (100 / Math.min(v.w, 16)), G, 1.4);
    let mx = ''; for (let k = 0; k < mi; k++) mx += F.line(240, 40 + k * (120 / mi), 270, 40 + k * (120 / mi), O, 1.2); for (let k = 0; k < sl; k++) mx += F.line(290 + k * (60 / Math.max(sl, 1)), 172, 290 + k * (60 / Math.max(sl, 1)), 196, P, 1.4);
    return F.svg(400, 220, `${ad}<rect x="60" y="30" width="100" height="140" rx="8" fill="var(--paper)" stroke="${K}" stroke-width="2"/>${F.txt(110, 92, `${F.t(v.loc)}`, { a: 'middle', c: 'fv' })}${F.txt(110, 110, `× ${F.t(v.w)} bits`, { a: 'middle', c: 'fs' })}${F.txt(110, 128, `= ${F.t(v.KB)} KB`, { a: 'middle', c: 'fv', col: G })}${dl}
      ${F.txt(40, 22, `${F.t(v.a)} address`, { a: 'middle', c: 'fs', col: B })}${F.txt(178, 22, `${F.t(v.w)} data`, { a: 'middle', c: 'fs', col: G })}${F.txt(110, 196, `a ${F.t(v.kb)} KB chip needs ${F.t(v.need)} lines`, { a: 'middle', c: 'fs' })}
      ${mx}<path d="M270,30 L350,60 V140 L270,170 Z" fill="var(--paper)" stroke="${K}" stroke-width="2"/>${F.line(350, 100, 384, 100, K, 2)}${F.txt(310, 104, 'MUX', { a: 'middle', c: 'fv' })}${F.txt(250, 22, `${F.t(v.mi)} inputs`, { a: 'middle', c: 'fs', col: O })}${F.txt(320, 212, `${F.t(v.sel)} select lines`, { a: 'middle', c: 'fs', col: P })}`, 'A memory chip with its address and data lines, and a multiplexer');
  });
})();
