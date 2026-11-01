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
