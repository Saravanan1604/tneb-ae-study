/* Electrical Machines labs. Checks are the book's numbers. */
(() => {
  const PI = Math.PI, sq = Math.sqrt, deg = x => x * 180 / PI, rad = x => x * PI / 180;

  /* ---------- DC Machines ---------- */
  lab(475, { n: 'Generated EMF — lap and wave', rf: 'Generated EMF', c: 'E = PϕZN/(60A). Lap: A = P. Wave: A = 2, so a 4-pole wave winding gives twice the lap EMF.',
    i: [['P', 'Poles P', '', 4, 2, 24, 2], ['Z', 'Conductors Z', '', 500, 10, 5000, 10], ['phi', 'Flux per pole ϕ', 'Wb', 0.02, 0.001, 0.2, 0.001], ['N', 'Speed N', 'rpm', 1000, 10, 3000, 10], ['w', 'Winding', '', 'lap', ['lap', 'wave']]],
    o: [['A', 'Parallel paths A', '', v => v.w === 'lap' ? v.P : 2], ['E', 'Generated EMF', 'V', v => v.P * v.phi * v.Z * v.N / (60 * v.A)]],
    ck: [[{ P: 4, Z: 500, phi: 0.02, N: 1000, w: 'lap' }, { E: 166.7 }, 'Vol 2 p 488 · Sum 1'], [{ P: 4, Z: 500, phi: 0.02, N: 1500, w: 'lap' }, { E: 250 }, 'Vol 2 p 479 · key-formula example'], [{ P: 4, Z: 500, phi: 0.02, N: 1500, w: 'wave' }, { E: 500 }, 'Vol 2 p 479 · key-formula example (wave)']] });
  lab(475, { n: 'DC motor — back EMF, power and torque', rf: 'Motor back EMF', c: 'Eb = V − IaRa. Mechanical power Eb·Ia; torque T = EbIa/ω. The power is greatest when Eb = V/2 (only 50 % efficiency).',
    i: [['V', 'Supply V', 'V', 220, 10, 1000, 1], ['Ia', 'Armature current Ia', 'A', 20, 0.1, 1000, 0.1], ['Ra', 'Armature resistance Ra', 'Ω', 0.5, 0.01, 10, 0.01], ['N', 'Speed N', 'rpm', 1000, 10, 3000, 10]],
    o: [['Eb', 'Back EMF Eb', 'V', v => v.V - v.Ia * v.Ra], ['Pm', 'Mechanical power', 'kW', v => v.Eb * v.Ia / 1000], ['T', 'Torque', 'N·m', v => v.Eb * v.Ia / (2 * PI * v.N / 60)], ['eta', 'Armature efficiency Eb/V', '%', v => v.Eb / v.V * 100]],
    plot: { x: ['Ia', 'Armature current', 'A', 0, 500, ''], y: [['mechanical power (kW)', (x, v) => (v.V - x * v.Ra) * x / 1000]], yl: 'Mechanical power (kW)', mark: v => v.V / (2 * v.Ra) },
    ck: [[{ V: 220, Ia: 20, Ra: 0.5 }, { Eb: 210 }, 'Vol 2 p 488 · Sum 2'], [{ V: 220, Ia: 20, Ra: 0.5, N: 1000 }, { T: 40.1 }, 'Vol 2 p 488 · Sum 5'], [{ V: 230, Ia: 25, Ra: 0.4 }, { Eb: 220 }, 'Vol 2 p 478 · one-minute sum'], [{ V: 230, Ia: 10, Ra: 0.5 }, { Eb: 225 }, 'Vol 2 p 477 · quick check']] });
  lab(475, { n: 'DC motor speed — back EMF and flux', rf: 'Speed', c: 'N ∝ Eb/ϕ, so N₂ = N₁(Eb₂/Eb₁)(ϕ₁/ϕ₂). Weaken the field and the speed rises; for the same torque Ia rises as ϕ₁/ϕ₂.',
    i: [['N1', 'Speed N₁', 'rpm', 1000, 10, 3000, 10], ['E1', 'Back EMF Eb₁', 'V', 210, 1, 1000, 1], ['E2', 'Back EMF Eb₂', 'V', 200, 1, 1000, 1], ['ph', 'New flux ϕ₂', '% of ϕ₁', 100, 20, 150, 1]],
    o: [['N2', 'New speed N₂', 'rpm', v => v.N1 * (v.E2 / v.E1) * (100 / v.ph)], ['dN', 'Speed change', '%', v => (v.N2 / v.N1 - 1) * 100], ['Ir', 'Ia₂/Ia₁ for the same torque', '×', v => 100 / v.ph]],
    ck: [[{ N1: 1000, E1: 210, E2: 200, ph: 100 }, { N2: 952 }, 'Vol 2 p 488 · Sum 3'], [{ E1: 210, E2: 210, ph: 80 }, { dN: 25 }, 'Vol 2 p 478 · one-minute sum'], [{ E1: 210, E2: 210, ph: 90 }, { dN: 11.1, Ir: 1.11 }, 'Vol 2 p 490 · R3']] });
  lab(475, { n: 'Shunt generator — EMF on load', rf: 'Generator voltage', c: 'Ish = V/Rsh, Ia = IL + Ish, Eg = V + IaRa (+ brush drop).',
    i: [['V', 'Terminal V', 'V', 230, 10, 1000, 1], ['IL', 'Load current IL', 'A', 50, 0, 1000, 0.1], ['Rsh', 'Shunt field Rsh', 'Ω', 115, 1, 1000, 1], ['Ra', 'Armature Ra', 'Ω', 0.1, 0.001, 5, 0.001], ['Vb', 'Brush drop', 'V', 0, 0, 5, 0.1]],
    o: [['Ish', 'Field current Ish', 'A', v => v.V / v.Rsh], ['Ia', 'Armature current Ia', 'A', v => v.IL + v.Ish], ['Eg', 'Generated EMF Eg', 'V', v => v.V + v.Ia * v.Ra + v.Vb]],
    ck: [[{ V: 230, IL: 50, Rsh: 115, Ra: 0.1, Vb: 0 }, { Ish: 2, Ia: 52, Eg: 235.2 }, 'Vol 2 p 488 · Sum 4']] });
  lab(475, { n: 'Generator EMF at another speed or field', rf: 'Generated EMF', c: 'E ∝ ϕN: the same field current at 20 % more speed gives 20 % more EMF.',
    i: [['E1', 'EMF E₁', 'V', 200, 1, 1000, 1], ['N1', 'Speed N₁', 'rpm', 1000, 10, 3000, 10], ['N2', 'Speed N₂', 'rpm', 1200, 10, 3000, 10], ['ph', 'Flux ϕ₂', '% of ϕ₁', 100, 20, 150, 1]],
    o: [['E2', 'EMF E₂', 'V', v => v.E1 * (v.N2 / v.N1) * (v.ph / 100)]],
    ck: [[{ E1: 200, N1: 1000, N2: 1200, ph: 100 }, { E2: 240 }, 'Vol 2 p 489 · Sum 8']] });
  lab(475, { n: 'Compound generator — shorting the series field', rf: 'Compound machines', c: 'Cumulative: series aids shunt, so shorting it removes its share. Differential: series opposes shunt, so shorting it raises the flux.',
    i: [['se', 'Series field share', '% of flux', 20, 0, 60, 1], ['sh', 'Shunt field share', '% of flux', 80, 10, 100, 1], ['ty', 'Connection', '', 'cumulative', ['cumulative', 'differential']]],
    o: [['f0', 'Net flux before', '%', v => v.ty === 'cumulative' ? v.sh + v.se : v.sh - v.se], ['f1', 'Net flux after (series shorted)', '%', v => v.sh], ['dV', 'Change in voltage (∝ flux)', '%', v => (v.f1 / v.f0 - 1) * 100]],
    ck: [[{ se: 20, sh: 80, ty: 'cumulative' }, { dV: -20 }, 'Vol 2 p 489 · Sum 7'], [{ se: 20, sh: 80, ty: 'differential' }, { f0: 60, f1: 80, dV: 33.3 }, 'Vol 2 p 489 · Sum 6']] });
  lab(475, { n: 'Series motor — torque ∝ Ia²', rf: 'Torque', c: 'Unsaturated series motor: ϕ ∝ Ia, so T ∝ Ia² and N ∝ 1/Ia — it races on no load, so never run it unloaded.',
    i: [['I1', 'Current I₁', 'A', 10, 0.1, 1000, 0.1], ['I2', 'Current I₂', 'A', 20, 0.1, 1000, 0.1]],
    o: [['k', 'Torque ratio T₂/T₁', '×', v => (v.I2 / v.I1) ** 2], ['nk', 'Speed ratio N₂/N₁ (ignoring IaRa)', '×', v => v.I1 / v.I2]],
    ck: [[{ I1: 10, I2: 20 }, { k: 4 }, 'Vol 2 p 489 · R2']] });
  lab(475, { n: 'Speed–torque: shunt against series motor', rf: 'Speed', c: 'A shunt motor’s speed falls only a little with torque. A series motor’s speed falls steeply and rises without limit as the load goes.',
    i: [['V', 'Supply V', 'V', 220, 10, 1000, 1], ['Ra', 'Armature Ra', 'Ω', 0.5, 0.01, 10, 0.01], ['Ir', 'Rated Ia', 'A', 20, 1, 500, 1], ['Nr', 'Rated speed', 'rpm', 1000, 100, 3000, 10]],
    o: [['kf', 'kϕ (shunt)', 'V·s/rad', v => (v.V - v.Ir * v.Ra) / (2 * PI * v.Nr / 60)], ['Tr', 'Rated torque', 'N·m', v => v.kf * v.Ir], ['N0', 'Shunt no-load speed', 'rpm', v => v.V / v.kf * 60 / (2 * PI)], ['reg', 'Shunt speed regulation', '%', v => (v.N0 - v.Nr) / v.Nr * 100]],
    plot: { x: ['T', 'Torque', 'N·m', 2, 150, ''], y: [['shunt', (T, v) => (v.V - T / v.kf * v.Ra) / v.kf * 60 / (2 * PI)], ['series', (T, v) => { const c = v.kf / v.Ir, I = sq(T / c); return (v.V - I * v.Ra) / (c * I) * 60 / (2 * PI); }]], yl: 'Speed (rpm)', mark: v => v.Tr }, ck: [] });
  lab(475, { n: 'Armature-resistance speed control', rf: 'Speed control', c: 'Same flux and torque keep Ia; the new speed needs E₂ = E₁N₂/N₁, so R = (V − E₂)/Ia − Ra. Field weakening goes above base speed instead.',
    i: [['V', 'Supply V', 'V', 220, 10, 1000, 1], ['Ia', 'Armature current', 'A', 20, 0.1, 500, 0.1], ['Ra', 'Armature Ra', 'Ω', 0.5, 0.01, 10, 0.01], ['N1', 'Present speed', 'rpm', 1000, 10, 3000, 10], ['N2', 'Wanted speed', 'rpm', 800, 10, 3000, 10]],
    o: [['E1', 'Present Eb', 'V', v => v.V - v.Ia * v.Ra], ['E2', 'Needed Eb', 'V', v => v.E1 * v.N2 / v.N1], ['R', 'Series resistance', 'Ω', v => (v.V - v.E2) / v.Ia - v.Ra], ['Pl', 'Power lost in it', 'W', v => v.Ia * v.Ia * v.R]], ck: [] });
  lab(475, { n: 'Plugging current', rf: 'Plugging', c: 'Reversing the armature makes V and Eb add: Ibrake = (V + Eb)/(Ra + Rext). A resistor limits it.',
    i: [['V', 'Supply V', 'V', 220, 10, 1000, 1], ['Eb', 'Back EMF at the instant', 'V', 210, 0, 1000, 1], ['Ra', 'Armature Ra', 'Ω', 0.5, 0.01, 10, 0.01], ['Rx', 'External R', 'Ω', 10, 0, 100, 0.1]],
    o: [['Ib', 'Braking current', 'A', v => (v.V + v.Eb) / (v.Ra + v.Rx)], ['Ib0', 'Without the resistor', 'A', v => (v.V + v.Eb) / v.Ra]], ck: [] });
  lab(475, { n: 'Efficiency and maximum efficiency', rf: 'Losses & efficiency', c: 'Losses = copper Ia²Ra (varies with load) + constant losses. η is highest at the load where the two are equal: Ia = √(Pc/Ra).',
    i: [['V', 'Terminal V', 'V', 220, 10, 1000, 1], ['Ia', 'Load current', 'A', 40, 0.5, 500, 0.5], ['Ra', 'Armature Ra', 'Ω', 0.25, 0.01, 10, 0.01], ['Pc', 'Constant losses', 'W', 400, 0, 10000, 10]],
    o: [['Pcu', 'Copper loss', 'W', v => v.Ia ** 2 * v.Ra], ['eta', 'Efficiency (generator)', '%', v => v.V * v.Ia / (v.V * v.Ia + v.Pcu + v.Pc) * 100], ['Im', 'Current for ηmax', 'A', v => sq(v.Pc / v.Ra)]],
    plot: { x: ['Ia', 'Load current', 'A', 1, 200, ''], y: [['efficiency', (x, v) => v.V * x / (v.V * x + x * x * v.Ra + v.Pc) * 100]], yl: 'Efficiency (%)', mark: v => v.Im }, ck: [] });
  lab(475, { n: 'Retardation test', rf: 'retardation', c: 'Rotational loss P = Jω·(dω/dt) from the slope of the speed while coasting.',
    i: [['J', 'Inertia J', 'kg·m²', 5, 0.01, 100, 0.01], ['N', 'Speed', 'rpm', 1000, 10, 3000, 10], ['dN', 'Fall in speed', 'rpm/s', 10, 0.1, 200, 0.1]],
    o: [['P', 'Rotational loss', 'W', v => v.J * (2 * PI * v.N / 60) * (2 * PI * v.dN / 60)]], ck: [] });

  /* ---------- Transformers ---------- */
  lab(497, { n: 'Turns ratio — step-up or step-down, live circuit', rf: 'Turns ratio', c: 'V₁/V₂ = N₁/N₂ = I₂/I₁ = a. More secondary turns → step-up (a < 1): the voltage rises and the current falls in the same ratio, so the power is the same on both sides (ideal transformer).',
    i: [['V1', 'Primary V₁', 'V', 1100, 1, 100000, 1], ['N1', 'Primary turns N₁', '', 500, 1, 10000, 1], ['N2', 'Secondary turns N₂', '', 100, 1, 10000, 1], ['RL', 'Load resistance R_L', 'Ω', 50, 0.1, 100000, 0.1, 'log']],
    o: [['a', 'Turns ratio a = N₁/N₂', '', v => v.N1 / v.N2], ['ty', 'Type', '', v => v.N2 > v.N1 ? 'step-up' : v.N2 < v.N1 ? 'step-down' : '1 : 1'], ['V2', 'Secondary V₂', 'V', v => v.V1 * v.N2 / v.N1],
      ['I2', 'Secondary I₂ = V₂/R_L', 'A', v => v.V2 / v.RL], ['I1', 'Primary I₁ = I₂/a', 'A', v => v.I2 / v.a], ['P', 'Power in = power out', 'W', v => v.V2 * v.I2]],
    ck: [[{ V1: 1100, N1: 500, N2: 100 }, { V2: 220 }, 'Vol 2 p 514 · Sum 1'], [{ V1: 2200, N1: 1000, N2: 100 }, { V2: 220 }, 'Vol 2 p 497 · quick check'], [{ V1: 230, N1: 200, N2: 800 }, { V2: 920, ty: 'step-up' }, 'Vol 2 p 499 · quick check']],
    fig: (v, F) => {
      const O = '#ea580c', B = '#2563eb', up = v.N2 > v.N1, sp1 = Math.log10(1 + v.I1) * 1.6, sp2 = Math.log10(1 + v.I2) * 1.6, n1 = 3 + 9 * v.N1 / Math.max(v.N1, v.N2), n2 = 3 + 9 * v.N2 / Math.max(v.N1, v.N2);
      return F.svg(640, 330, `
        ${F.txt(16, 24, `${up ? '▲ Step-up' : v.N2 < v.N1 ? '▼ Step-down' : '■ 1 : 1'} transformer`, { c: 'fh', col: up ? '#16a34a' : v.N2 < v.N1 ? O : 'currentColor' })}${F.txt(624, 24, `a = ${F.t(v.a)}`, { a: 'end', c: 'fh' })}${F.txt(624, 42, 'ideal (lossless)', { a: 'end', c: 'fs' })}
        <rect x="250" y="52" width="140" height="170" rx="6" class="fcore"/><rect x="282" y="84" width="76" height="106" rx="3" fill="var(--paper)"/>${F.txt(320, 142, 'iron core', { a: 'middle', c: 'fs' })}
        ${F.arrow(300, 68, 340, 68, '#94a3b8', 1.6)}${F.arrow(374, 120, 374, 156, '#94a3b8', 1.6)}${F.arrow(340, 206, 300, 206, '#94a3b8', 1.6)}${F.arrow(266, 156, 266, 120, '#94a3b8', 1.6)}
        ${F.wire('M90,137 V70 H266 V92', O, sp1)}${F.wire('M266,182 V204 H90 V163', O, sp1)}${F.coil(266, 92, 182, n1, O, 1)}
        ${F.wire('M374,92 V70 H560 V100', B, sp2)}${F.wire('M560,174 V204 H374 V182', B, sp2)}${F.coil(374, 92, 182, n2, B, -1)}${F.resV(560, 100, 174, B)}
        ${F.src(90, 150, 22, O)}${F.txt(56, 154, 'V₁', { a: 'end', c: 'fl' })}${F.txt(90, 196, `${F.t(v.V1)} V`, { a: 'middle', c: 'fv', col: O })}
        ${F.txt(130, 62, `I₁ = ${F.t(v.I1)} A →`, { c: 'fv', col: O })}${F.txt(266, 242, `N₁ = ${F.t(v.N1)}`, { a: 'end', c: 'fv', col: O })}${F.txt(374, 242, `N₂ = ${F.t(v.N2)}`, { c: 'fv', col: B })}
        ${F.txt(548, 124, `R_L = ${F.t(v.RL)} Ω`, { a: 'end', c: 'fs' })}${F.txt(548, 146, `V₂ = ${F.t(v.V2)} V`, { a: 'end', c: 'fv', col: B })}${F.txt(400, 62, `I₂ = ${F.t(v.I2)} A →`, { c: 'fv', col: B })}
        ${F.waves(16, 252, 608, 70, [{ a: v.V1, col: O, l: `V₁ = ${F.t(v.V1)} V` }, { a: v.V2, col: B, l: `V₂ = ${F.t(v.V2)} V` }], 2)}`, `Transformer circuit: V1 ${v.V1} V, N1 ${v.N1}, N2 ${v.N2}, V2 ${F.t(v.V2)} V`);
    } });
  lab(497, { n: 'EMF equation', rf: 'EMF equation', c: 'E = 4.44 f N ϕm.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['N', 'Turns N', '', 200, 1, 10000, 1], ['phi', 'Peak flux ϕm', 'Wb', 0.01, 0.0001, 1, 0.0001, 'log']],
    o: [['E', 'RMS EMF', 'V', v => 4.44 * v.f * v.N * v.phi]],
    ck: [[{ f: 50, N: 200, phi: 0.01 }, { E: 444 }, 'Vol 2 p 514 · Sum 3']] });
  lab(497, { n: 'Changed voltage and frequency', rf: 'Changed voltage and frequency', c: 'Flux ϕ ∝ V/f. Keep V/f fixed to keep the flux; the same voltage at a higher frequency lowers the flux; double V at the same f saturates the core.',
    i: [['V1', 'Rated V₁', 'V', 230, 1, 100000, 1], ['f1', 'Rated f₁', 'Hz', 50, 1, 400, 1], ['V2', 'Applied V₂', 'V', 230, 1, 100000, 1], ['f2', 'New f₂', 'Hz', 60, 1, 400, 1]],
    o: [['Vs', 'Voltage for the same flux', 'V', v => v.V1 * v.f2 / v.f1], ['ph', 'Flux with V₂ at f₂', '× rated', v => (v.V2 / v.V1) / (v.f2 / v.f1)]],
    ck: [[{ V1: 230, f1: 50, f2: 60 }, { Vs: 276 }, 'Vol 2 p 515 · Sum 8'], [{ V1: 200, f1: 50, f2: 60 }, { Vs: 240 }, 'Vol 2 p 515 · Sum 6'], [{ V1: 200, V2: 200, f1: 50, f2: 60 }, { ph: 0.83 }, 'Vol 2 p 515 · Sum 7'], [{ V1: 230, V2: 460, f1: 50, f2: 50 }, { ph: 2 }, 'Vol 2 p 517 · R3']] });
  lab(497, { n: 'Full-load current', rf: 'full-load current', c: '1-φ: I = kVA × 1000/V. 3-φ: I = kVA × 1000/(√3 VL).',
    i: [['S', 'Rating', 'kVA', 20, 0.1, 100000, 0.1, 'log'], ['VH', 'HV voltage', 'V', 2000, 1, 400000, 1], ['VL', 'LV voltage', 'V', 200, 1, 400000, 1], ['ph', 'Phases', '', '1-phase', ['1-phase', '3-phase']]],
    o: [['IH', 'HV current', 'A', v => v.S * 1000 / (v.ph === '3-phase' ? sq(3) * v.VH : v.VH)], ['IL', 'LV current', 'A', v => v.S * 1000 / (v.ph === '3-phase' ? sq(3) * v.VL : v.VL)]],
    ck: [[{ S: 20, VH: 2000, VL: 200, ph: '1-phase' }, { IH: 10, IL: 100 }, 'Vol 2 p 514 · Sum 2'], [{ S: 100, VH: 11000, VL: 433, ph: '3-phase' }, { IH: 5.25, IL: 133 }, 'Vol 2 p 502 · key-formula example'], [{ S: 200, VL: 433, ph: '3-phase' }, { IL: 267 }, 'Vol 2 p 502 · one-minute sum'], [{ S: 10, VL: 230, ph: '1-phase' }, { IL: 43.5 }, 'Vol 2 p 502 · one-minute sum']] });
  lab(497, { n: 'Efficiency at any load and maximum efficiency', rf: 'Efficiency', c: 'η = xS cos ϕ/(xS cos ϕ + Pi + x²Pcu). Copper loss goes as x²; η is highest at x = √(Pi/Pcu), where copper loss = iron loss.',
    i: [['S', 'Rating', 'kVA', 10, 0.1, 10000, 0.1, 'log'], ['pf', 'Power factor', '', 0.8, 0.1, 1, 0.01], ['Pi', 'Iron loss Pi', 'W', 100, 1, 100000, 1, 'log'], ['Pcu', 'Full-load Cu loss', 'W', 200, 1, 100000, 1, 'log'], ['x', 'Load (fraction of full)', '', 1, 0.05, 1.5, 0.01]],
    o: [['Pcux', 'Cu loss at this load', 'W', v => v.x * v.x * v.Pcu], ['eta', 'Efficiency', '%', v => { const o = v.x * v.S * 1000 * v.pf; return o / (o + v.Pi + v.Pcux) * 100; }], ['xm', 'Load for ηmax', '% of full', v => sq(v.Pi / v.Pcu) * 100]],
    plot: { x: ['x', 'Load (fraction of full)', '', 0.05, 1.5, ''], y: [['efficiency', (x, v) => { const o = x * v.S * 1000 * v.pf; return o / (o + v.Pi + x * x * v.Pcu) * 100; }]], yl: 'Efficiency (%)', mark: v => sq(v.Pi / v.Pcu) },
    ck: [[{ S: 10, pf: 0.8, Pi: 100, Pcu: 200, x: 1 }, { eta: 96.4 }, 'Vol 2 p 515 · Sum 5'], [{ Pi: 400, Pcu: 900 }, { xm: 66.7 }, 'Vol 2 p 514 · Sum 4'], [{ Pi: 800, Pcu: 3200 }, { xm: 50 }, 'Vol 2 p 503 · one-minute sum'], [{ Pcu: 2000, x: 0.75 }, { Pcux: 1125 }, 'Vol 2 p 503 · one-minute sum'], [{ Pcu: 400, x: 0.5 }, { Pcux: 100 }, 'Vol 2 p 516 · R2']] });
  lab(497, { n: 'All-day efficiency', rf: 'All-day efficiency', c: 'ηAD = output kWh/input kWh over 24 h. Iron loss runs all day; copper loss only with load (∝ x²).',
    i: [['S', 'Rating', 'kVA', 100, 1, 10000, 1], ['Pi', 'Iron loss', 'kW', 1, 0.01, 100, 0.01], ['Pcu', 'Full-load Cu loss', 'kW', 2, 0.01, 100, 0.01], ['P1', 'Load 1', 'kW', 80, 0, 10000, 1], ['h1', 'for', 'h', 8, 0, 24, 0.5], ['P2', 'Load 2', 'kW', 30, 0, 10000, 1], ['h2', 'for', 'h', 10, 0, 24, 0.5], ['pf', 'Power factor', '', 1, 0.1, 1, 0.01]],
    o: [['Eo', 'Output', 'kWh', v => v.P1 * v.h1 + v.P2 * v.h2], ['Ec', 'Copper loss', 'kWh', v => v.Pcu * ((v.P1 / v.pf / v.S) ** 2 * v.h1 + (v.P2 / v.pf / v.S) ** 2 * v.h2)], ['Ei', 'Iron loss (24 h)', 'kWh', v => v.Pi * 24], ['eta', 'All-day efficiency', '%', v => v.Eo / (v.Eo + v.Ec + v.Ei) * 100]],
    ck: [[{ S: 100, Pi: 1, Pcu: 2, P1: 80, h1: 8, P2: 30, h2: 10, pf: 1 }, { eta: 96.31 }, 'Vol 2 p 515 · Sum 9', 0.0005]] });
  lab(497, { n: 'Voltage regulation', rf: 'Voltage regulation', c: '% Reg ≈ εr cos ϕ ± εx sin ϕ (+ lagging, − leading). A leading load can make the regulation negative.',
    i: [['er', 'Resistance drop εr', '%', 1.5, 0, 20, 0.1], ['ex', 'Reactance drop εx', '%', 4, 0, 30, 0.1], ['pf', 'Power factor', '', 0.8, 0, 1, 0.01], ['ty', 'Load', '', 'lagging', ['lagging', 'leading']]],
    o: [['R', 'Regulation', '%', v => v.er * v.pf + (v.ty === 'lagging' ? 1 : -1) * v.ex * sq(1 - v.pf * v.pf)], ['pz', 'pf for zero regulation (leading)', '', v => Math.cos(Math.atan(v.er / v.ex))]],
    plot: { x: ['pf', 'Power factor', '', 0, 1, ''], y: [['lagging', (p, v) => v.er * p + v.ex * sq(1 - p * p)], ['leading', (p, v) => v.er * p - v.ex * sq(1 - p * p)]], yl: 'Regulation (%)', mark: v => v.pf },
    ck: [[{ er: 1.5, ex: 4, pf: 0.8, ty: 'lagging' }, { R: 3.6 }, 'Vol 2 p 516 · Sum 11'], [{ er: 1.5, ex: 4, pf: 0.8, ty: 'leading' }, { R: -1.2 }, 'Vol 2 p 516 · Sum 11']] });
  lab(497, { n: 'Auto-transformer — copper saved, kVA transformed and conducted', rf: 'Auto-transformer', c: 'k = V_low/V_high. Copper saved = k × that of a two-winding transformer. kVA transformed = S(1 − k); the rest, S·k, is conducted straight through.',
    i: [['Vh', 'Higher voltage', 'V', 400, 1, 100000, 1], ['Vl', 'Lower voltage', 'V', 300, 1, 100000, 1], ['S', 'Load', 'kVA', 10, 0.1, 10000, 0.1]],
    o: [['k', 'k = V_low/V_high', '', v => v.Vl / v.Vh], ['cs', 'Copper saved', '%', v => v.k * 100], ['St', 'kVA transformed', 'kVA', v => v.S * (1 - v.k)], ['Sc', 'kVA conducted', 'kVA', v => v.S * v.k]],
    ck: [[{ Vh: 400, Vl: 300, S: 10 }, { cs: 75, St: 2.5, Sc: 7.5 }, 'Vol 2 p 516 · Sum 10'], [{ Vh: 345, Vl: 230 }, { cs: 66.7 }, 'Vol 2 p 504 · one-minute sum']] });
  lab(497, { n: 'Two-winding transformer reconnected as an auto', rf: 'Autotransformer from a two-winding', c: 'kVA(auto) = kVA(2-winding) × V_out/V(series winding). The winding still carries only its own rating.',
    i: [['S', 'Two-winding rating', 'kVA', 50, 0.1, 10000, 0.1], ['Vs', 'Series winding voltage', 'V', 240, 1, 100000, 1], ['Vo', 'Higher (output) voltage of the auto', 'V', 2640, 1, 100000, 1]],
    o: [['Sa', 'Auto rating', 'kVA', v => v.S * v.Vo / v.Vs], ['m', 'Times the two-winding rating', '×', v => v.Vo / v.Vs]],
    ck: [[{ S: 50, Vs: 240, Vo: 2640 }, { Sa: 550 }, 'Vol 2 p 504 · key-formula example'], [{ S: 20, Vs: 115, Vo: 345 }, { Sa: 60 }, 'Vol 2 p 504 · one-minute sum'], [{ S: 10, Vs: 200, Vo: 2200 }, { Sa: 110 }, 'Vol 2 p 501 · quick check']] });
  lab(497, { n: 'Load sharing of transformers in parallel', rf: 'Load sharing', c: 'Bring the % impedances to one kVA base; then each takes S × (the other’s Z)/(Z₁ + Z₂). The lower-impedance unit takes more.',
    i: [['S1', 'Unit 1 rating', 'kVA', 500, 1, 100000, 1], ['z1', 'Unit 1 Z', '%', 4, 0.5, 20, 0.1], ['S2', 'Unit 2 rating', 'kVA', 250, 1, 100000, 1], ['z2', 'Unit 2 Z', '%', 5, 0.5, 20, 0.1], ['S', 'Total load', 'kVA', 700, 1, 200000, 1]],
    o: [['Z1', 'Z₁ on unit-1 base', '%', v => v.z1], ['Z2', 'Z₂ on unit-1 base', '%', v => v.z2 * v.S1 / v.S2], ['L1', 'Load on unit 1', 'kVA', v => v.S * v.Z2 / (v.Z1 + v.Z2)], ['L2', 'Load on unit 2', 'kVA', v => v.S * v.Z1 / (v.Z1 + v.Z2)], ['ov', 'Overloaded?', '', v => v.L1 > v.S1 * 1.0001 ? 'unit 1' : v.L2 > v.S2 * 1.0001 ? 'unit 2' : 'no']],
    ck: [[{ S1: 500, z1: 4, S2: 250, z2: 5, S: 700 }, { L1: 500, L2: 200 }, 'Vol 2 p 516 · Sum 12']] });
  lab(497, { n: 'Separating hysteresis and eddy loss', rf: 'Separation of core losses', c: 'At constant V/f: P = Af + Bf². Hysteresis ∝ f, eddy ∝ f² (and ∝ lamination thickness²).',
    i: [['A', 'Hysteresis constant A', 'W/Hz', 4, 0, 100, 0.1], ['B', 'Eddy constant B', 'W/Hz²', 0.04, 0, 2, 0.001], ['f', 'Frequency', 'Hz', 50, 1, 400, 1]],
    o: [['Ph', 'Hysteresis loss', 'W', v => v.A * v.f], ['Pe', 'Eddy loss', 'W', v => v.B * v.f * v.f], ['P', 'Core loss', 'W', v => v.Ph + v.Pe]],
    plot: { x: ['f', 'Frequency', 'Hz', 10, 100, ''], y: [['P/f (straight line)', (f, v) => v.A + v.B * f]], yl: 'Core loss ÷ f (W/Hz)', mark: v => v.f }, ck: [] });

  /* ---------- Induction Motors ---------- */
  lab(526, { n: 'Synchronous speed, slip and rotor frequency', rf: 'Synchronous speed', c: 'Ns = 120f/P, s = (Ns − N)/Ns, rotor frequency fr = sf. N above Ns → negative slip → generating.',
    i: [['f', 'Supply frequency', 'Hz', 50, 1, 400, 1], ['P', 'Poles P', '', 4, 2, 48, 2], ['N', 'Rotor speed N', 'rpm', 1440, 0, 6000, 1]],
    o: [['Ns', 'Synchronous speed', 'rpm', v => 120 * v.f / v.P], ['s', 'Slip', '%', v => (v.Ns - v.N) / v.Ns * 100], ['fr', 'Rotor frequency', 'Hz', v => Math.abs(v.s) / 100 * v.f], ['ss', 'Slip speed', 'rpm', v => v.Ns - v.N], ['cr', 'Crawling speed ≈ Ns/7', 'rpm', v => v.Ns / 7], ['md', 'Mode', '', v => v.N > v.Ns ? 'generating' : v.N === v.Ns ? 'no torque (s = 0)' : 'motoring']],
    ck: [[{ f: 50, P: 4, N: 1440 }, { Ns: 1500, s: 4, fr: 2 }, 'Vol 2 p 542 · Sum 1'], [{ f: 60, P: 6 }, { Ns: 1200 }, 'Vol 2 p 542 · Sum 5'], [{ f: 50, P: 6, N: 970 }, { Ns: 1000, s: 3, fr: 1.5 }, 'Vol 2 p 543 · Sum 6'], [{ f: 50, P: 6, N: 950 }, { s: 5 }, 'Vol 2 p 532 · one-minute sum'], [{ f: 60, P: 4 }, { Ns: 1800 }, 'Vol 2 p 532 · one-minute sum'], [{ f: 50, P: 6 }, { Ns: 1000 }, 'Vol 2 p 526 · quick check'], [{ f: 50, P: 4, N: 1600 }, { md: 'generating' }, 'Vol 2 p 527 · quick check']] });
  lab(526, { n: 'Power flow and efficiency', rf: 'Power flow', c: 'Air-gap power splits 1 : s : (1 − s) into rotor copper loss and mechanical power. Torque = Pgap/ωs.',
    i: [['Pin', 'Input power', 'kW', 20, 0.1, 10000, 0.1], ['Pst', 'Stator losses', 'kW', 1, 0, 1000, 0.01], ['s', 'Slip', '%', 4, 0.1, 100, 0.1], ['Pfw', 'Friction & windage', 'kW', 0.3, 0, 100, 0.01], ['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['P', 'Poles', '', 4, 2, 48, 2]],
    o: [['Pg', 'Air-gap power', 'kW', v => v.Pin - v.Pst], ['Pcu', 'Rotor copper loss', 'kW', v => v.Pg * v.s / 100], ['Pm', 'Mechanical power', 'kW', v => v.Pg * (1 - v.s / 100)], ['Po', 'Output', 'kW', v => v.Pm - v.Pfw], ['eta', 'Efficiency', '%', v => v.Po / v.Pin * 100], ['T', 'Torque (air-gap)', 'N·m', v => v.Pg * 1000 / (2 * PI * (120 * v.f / v.P) / 60)]],
    ck: [[{ Pin: 10, Pst: 0, s: 4 }, { Pcu: 0.4, Pm: 9.6 }, 'Vol 2 p 542 · Sum 2'], [{ Pin: 10, Pst: 0, s: 5 }, { Pcu: 0.5 }, 'Vol 2 p 530 · quick check'], [{ Pin: 15, Pst: 0, f: 50, P: 4 }, { T: 95.5 }, 'Vol 2 p 543 · Sum 7'], [{ Pin: 20, Pst: 1, s: 4, Pfw: 0.3 }, { Po: 17.94, eta: 89.7 }, 'Vol 2 p 544 · Sum 11']] });
  lab(526, { n: 'Torque–slip curve', rf: 'Torque ratio', c: 'T/Tmax = 2s·sm/(s² + sm²) with sm = R₂/X₂. Extra rotor resistance moves the peak to a higher slip but keeps Tmax; Rext = X₂ − R₂ puts the peak at starting.',
    i: [['R2', 'Rotor resistance R₂', 'Ω', 0.2, 0.01, 5, 0.01], ['X2', 'Rotor reactance X₂', 'Ω', 1, 0.05, 10, 0.01], ['Rx', 'Extra rotor resistance', 'Ω', 0, 0, 10, 0.01], ['s', 'Operating slip', '', 0.05, 0.001, 1, 0.001]],
    o: [['sm', 'Slip at Tmax', '', v => (v.R2 + v.Rx) / v.X2], ['Tr', 'T/Tmax at this slip', '', v => 2 * v.s * v.sm / (v.s * v.s + v.sm * v.sm)], ['Ts', 'Tst/Tmax', '', v => 2 * v.sm / (1 + v.sm * v.sm)], ['Rm', 'Extra R for Tmax at start', 'Ω', v => v.X2 - v.R2]],
    plot: { x: ['s', 'Slip', '', 0.001, 1, ''], y: [['with R₂', (s, v) => { const m = v.R2 / v.X2; return 2 * s * m / (s * s + m * m); }], ['with R₂ + extra', (s, v) => { const m = (v.R2 + v.Rx) / v.X2; return 2 * s * m / (s * s + m * m); }]], yl: 'T / Tmax', mark: v => v.s },
    ck: [[{ R2: 0.2, X2: 1, Rx: 0 }, { sm: 0.2, Rm: 0.8 }, 'Vol 2 p 543 · Sum 8'], [{ R2: 0.2, X2: 1, Rx: 0 }, { Ts: 0.385 }, 'Vol 2 p 543 · Sum 9'], [{ R2: 0.2, X2: 1, Rx: 0, s: 0.05 }, { Tr: 0.471 }, 'Vol 2 p 543 · Sum 10'], [{ R2: 0.2, X2: 1 }, { sm: 0.2 }, 'Vol 2 p 529 · quick check']] });
  lab(526, { n: 'Supply voltage and torque', rf: 'Key formula', c: 'At the same slip T ∝ V²: a 10 % voltage dip costs 19 % of the torque.',
    i: [['Vp', 'Supply voltage', '% of rated', 90, 10, 120, 1]],
    o: [['Tp', 'Torque', '% of rated', v => v.Vp * v.Vp / 100], ['dT', 'Change', '%', v => v.Tp - 100]],
    ck: [[{ Vp: 90 }, { Tp: 81 }, 'Vol 2 p 542 · Sum 4'], [{ Vp: 90 }, { Tp: 81 }, 'Vol 2 p 544 · R1'], [{ Vp: 80 }, { dT: -36 }, 'Vol 2 p 533 · one-minute sum']] });
  lab(526, { n: 'Starters — DOL, star–delta and auto-transformer', rf: 'Starting methods', c: 'Star–delta gives ⅓ of the DOL current and torque. An auto-transformer at tap x gives x² of both.',
    i: [['Isc', 'DOL starting current', '× full-load I', 6, 1, 12, 0.1], ['Tst', 'DOL starting torque', '× full-load T', 1.5, 0.1, 4, 0.01], ['x', 'Auto-transformer tap', '%', 70, 10, 100, 1]],
    o: [['YI', 'Star–delta current', '× IFL', v => v.Isc / 3], ['YT', 'Star–delta torque', '× TFL', v => v.Tst / 3], ['k', 'Auto: fraction of DOL (x²)', '', v => (v.x / 100) ** 2], ['AI', 'Auto current from the line', '× IFL', v => v.k * v.Isc], ['AT', 'Auto starting torque', '× TFL', v => v.k * v.Tst]],
    ck: [[{ Isc: 6 }, { YI: 2 }, 'Vol 2 p 542 · Sum 3'], [{ Isc: 6, Tst: 1.5, x: 70 }, { AI: 2.94, AT: 0.735 }, 'Vol 2 p 544 · Sum 12'], [{ x: 60 }, { k: 0.36 }, 'Vol 2 p 533 · key-formula example'], [{ Tst: 1.5 }, { YT: 0.5 }, 'Vol 2 p 533 · one-minute sum']] });
  lab(526, { n: 'Starting torque from the short-circuit current', rf: 'Starting methods', c: 'Tst/Tfl = (Ist/Ifl)² × sfl, and with a tap x it is x² times that.',
    i: [['Ir', 'Ist/Ifl at full voltage', '×', 6, 1, 12, 0.1], ['sfl', 'Full-load slip', '', 0.04, 0.005, 0.2, 0.001], ['want', 'Wanted Tst/Tfl', '×', 0.5, 0.05, 3, 0.01]],
    o: [['Tr', 'Tst/Tfl direct on line', '×', v => v.Ir * v.Ir * v.sfl], ['x', 'Tap needed for the wanted torque', '%', v => sq(v.want / v.Tr) * 100]], ck: [] });
  lab(526, { n: 'Speed at part load (linear region)', rf: 'Torque ratio', c: 'Near synchronous speed T ∝ s: half the torque, half the slip.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['P', 'Poles', '', 4, 2, 48, 2], ['sf', 'Full-load slip', '%', 4, 0.1, 20, 0.1], ['Tp', 'Load torque', '% of full load', 50, 1, 150, 1]],
    o: [['s', 'Slip at this torque', '%', v => v.sf * v.Tp / 100], ['N', 'Speed', 'rpm', v => 120 * v.f / v.P * (1 - v.s / 100)]],
    ck: [[{ f: 50, P: 4, sf: 4, Tp: 50 }, { N: 1470 }, 'Vol 2 p 544 · Sum 13']] });
  lab(526, { n: 'Rotor-resistance speed control', rf: 'Rotor-resistance speed control', c: 'Constant load torque keeps R/s constant: R₂/s₁ = (R₂ + Rext)/s₂, so Rext = R₂(s₂ − s₁)/s₁.',
    i: [['R2', 'Rotor resistance R₂', 'Ω', 0.2, 0.01, 5, 0.01], ['s1', 'Present slip', '', 0.04, 0.001, 1, 0.001], ['s2', 'Wanted slip', '', 0.2, 0.001, 1, 0.001]],
    o: [['Rx', 'Extra rotor resistance', 'Ω', v => v.R2 * (v.s2 - v.s1) / v.s1], ['lost', 'Share of air-gap power lost in the rotor', '%', v => v.s2 * 100]], ck: [] });
  lab(526, { n: 'Measuring slip with a galvanometer', rf: 'Measuring slip', c: 'A centre-zero meter in the rotor swings at the rotor frequency sf: s = swings per minute/(60f).',
    i: [['n', 'Swings per minute', '', 120, 1, 1000, 1], ['f', 'Supply frequency', 'Hz', 50, 1, 400, 1]],
    o: [['fr', 'Rotor frequency', 'Hz', v => v.n / 60], ['s', 'Slip', '%', v => v.n / (60 * v.f) * 100]], ck: [] });

  /* ---------- Synchronous Machines ---------- */
  lab(550, { n: 'Poles, speed and frequency', rf: 'Frequency', c: 'f = PN/120. Slow hydro sets need many poles (salient-pole rotors); 2- and 4-pole turbo sets use cylindrical rotors.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['N', 'Speed', 'rpm', 300, 50, 3600, 1]],
    o: [['P', 'Poles needed', '', v => 120 * v.f / v.N], ['rt', 'Rotor type', '', v => v.P > 4 ? 'salient' : 'cylindrical']],
    ck: [[{ f: 50, N: 300 }, { P: 20 }, 'Vol 2 p 563 · Sum 1'], [{ f: 50, N: 300 }, { P: 20, rt: 'salient' }, 'Vol 2 p 551 · quick check']] });
  lab(550, { n: 'EMF equation of an alternator', rf: 'EMF equation', c: 'E = 4.44 Kp Kd f ϕ T per phase; Kw = Kp·Kd.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['T', 'Turns per phase', '', 100, 1, 5000, 1], ['phi', 'Flux per pole', 'Wb', 0.05, 0.001, 2, 0.001], ['Kw', 'Winding factor Kw', '', 0.95, 0.5, 1, 0.001]],
    o: [['E', 'EMF per phase', 'V', v => 4.44 * v.Kw * v.f * v.phi * v.T], ['EL', 'Line EMF (star)', 'V', v => sq(3) * v.E]],
    ck: [[{ f: 50, T: 100, phi: 0.05, Kw: 0.95 }, { E: 1054.5 }, 'Vol 2 p 563 · Sum 2']] });
  lab(550, { n: 'Pitch and distribution factors', rf: 'Pitch & distribution factor', c: 'Kp = cos(α/2) for a coil short by α. Kd = sin(mβ/2)/(m sin(β/2)) for m slots per pole per phase, β apart.',
    i: [['a', 'Short-pitch angle α', '° elec', 20, 0, 90, 1], ['m', 'Slots per pole per phase m', '', 3, 1, 12, 1], ['b', 'Slot angle β', '° elec', 20, 1, 60, 1]],
    o: [['Kp', 'Pitch factor Kp', '', v => Math.cos(rad(v.a / 2))], ['Kd', 'Distribution factor Kd', '', v => Math.sin(rad(v.m * v.b / 2)) / (v.m * Math.sin(rad(v.b / 2)))], ['Kw', 'Winding factor', '', v => v.Kp * v.Kd], ['h5', '5th-harmonic pitch factor', '', v => Math.cos(rad(5 * v.a / 2))]],
    ck: [[{ a: 20 }, { Kp: 0.985 }, 'Vol 2 p 563 · Sum 5']] });
  lab(550, { n: 'EMF at another speed (same field)', rf: 'EMF equation', c: 'E ∝ fϕ and f ∝ N: 50 → 60 Hz with the same field current gives 20 % more EMF.',
    i: [['E1', 'EMF E₁', 'V', 200, 1, 50000, 1], ['f1', 'Frequency f₁', 'Hz', 50, 1, 400, 1], ['f2', 'Frequency f₂', 'Hz', 60, 1, 400, 1]],
    o: [['E2', 'EMF E₂', 'V', v => v.E1 * v.f2 / v.f1]],
    ck: [[{ E1: 200, f1: 50, f2: 60 }, { E2: 240 }, 'Vol 2 p 564 · Sum 6']] });
  lab(550, { n: 'Voltage regulation', rf: 'Voltage regulation', c: '% Reg = (E₀ − V)/V × 100. By the EMF method E₀ = √((V cos ϕ + IRa)² + (V sin ϕ ± IXs)²): lagging loads need more excitation.',
    i: [['V', 'Terminal V (per phase)', 'V', 230, 1, 50000, 1], ['I', 'Load current', 'A', 10, 0, 5000, 0.1], ['Ra', 'Resistance Ra', 'Ω', 0.5, 0, 50, 0.01], ['Xs', 'Synchronous reactance Xs', 'Ω', 3, 0, 200, 0.01], ['pf', 'Power factor', '', 0.8, 0, 1, 0.01], ['ty', 'Load', '', 'lagging', ['lagging', 'leading', 'unity']], ['E0', 'Or: measured no-load E₀', 'V', 260, 1, 60000, 1]],
    o: [['Ec', 'E₀ by the EMF method', 'V', v => { const c = v.ty === 'unity' ? 1 : v.pf, s = v.ty === 'unity' ? 0 : sq(1 - c * c) * (v.ty === 'lagging' ? 1 : -1); return sq((v.V * c + v.I * v.Ra) ** 2 + (v.V * s + v.I * v.Xs) ** 2); }],
      ['Rc', 'Regulation (EMF method)', '%', v => (v.Ec - v.V) / v.V * 100], ['Rm', 'Regulation from measured E₀', '%', v => (v.E0 - v.V) / v.V * 100]],
    ck: [[{ V: 230, E0: 260 }, { Rm: 13 }, 'Vol 2 p 563 · Sum 3']] });
  lab(550, { n: 'Power–angle curve', rf: 'Power–angle equation', c: 'P = (EV/Xs) sin δ, greatest at δ = 90°. Synchronising power dP/dδ = (EV/Xs) cos δ falls to zero there — the stability limit.',
    i: [['E', 'Excitation EMF E', 'pu', 1, 0.1, 3, 0.01], ['V', 'Bus voltage V', 'pu', 1, 0.1, 2, 0.01], ['X', 'Reactance Xs', 'pu', 0.5, 0.05, 3, 0.01], ['d', 'Load angle δ', '°', 30, 0, 180, 1]],
    o: [['P', 'Power P', 'pu', v => v.E * v.V / v.X * Math.sin(rad(v.d))], ['Pm', 'Maximum power', 'pu', v => v.E * v.V / v.X], ['r', 'P/Pmax', '', v => v.P / v.Pm], ['Ps', 'Synchronising power', 'pu/rad', v => v.E * v.V / v.X * Math.cos(rad(v.d))]],
    plot: { x: ['d', 'Load angle δ', '°', 0, 180, ''], y: [['P', (d, v) => v.E * v.V / v.X * Math.sin(rad(d))], ['synchronising power', (d, v) => v.E * v.V / v.X * Math.cos(rad(d))]], yl: 'pu', mark: v => v.d },
    ck: [[{ E: 1, V: 1, X: 0.5, d: 30 }, { P: 1, Pm: 2 }, 'Vol 2 p 563 · Sum 4'], [{ d: 30 }, { r: 0.5 }, 'Vol 2 p 553 · key-formula example'], [{ E: 1, V: 1, X: 0.5, d: 30 }, { Pm: 2, P: 1 }, 'Vol 2 p 553 · one-minute sum'], [{ E: 1.2, V: 1, X: 0.5 }, { Pm: 2.4 }, 'Vol 2 p 564 · R1'], [{ E: 1, V: 1, X: 1 }, { Pm: 1 }, 'Vol 2 p 564 · R3']] });
  lab(550, { n: 'Excitation on an infinite bus — V-curve', rf: 'Excitation change', c: 'With P fixed, E sin δ stays fixed. Raise the excitation: δ falls and the current first falls (unity pf) then rises with a lagging pf (the generator supplies vars). Under-excited, it draws them (leading).',
    i: [['V', 'Bus voltage', 'pu', 1, 0.5, 1.5, 0.01], ['X', 'Synchronous reactance', 'pu', 1, 0.1, 3, 0.01], ['P', 'Power output', 'pu', 0.8, 0, 2, 0.01], ['E', 'Excitation EMF', 'pu', 1.5, 0.1, 3, 0.01]],
    o: [['d', 'Load angle δ', '°', v => deg(Math.asin(v.P * v.X / (v.E * v.V)))], ['Iq', 'Reactive part of I (+ lagging)', 'pu', v => (v.E * Math.cos(rad(v.d)) - v.V) / v.X], ['I', 'Armature current', 'pu', v => sq((v.P / v.V) ** 2 + v.Iq ** 2)], ['pf', 'Power factor', '', v => v.P / v.V / v.I], ['ty', 'Generator pf', '', v => Math.abs(v.Iq) < 1e-3 ? 'unity' : v.Iq > 0 ? 'lagging (over-excited)' : 'leading (under-excited)']],
    plot: { x: ['E', 'Excitation EMF', 'pu', 0.5, 2.5, ''], y: [['armature current (V-curve)', (E, v) => { const s = v.P * v.X / (E * v.V); if (s > 1) return NaN; const q = (E * Math.sqrt(1 - s * s) - v.V) / v.X; return sq((v.P / v.V) ** 2 + q * q); }]], yl: 'Armature current (pu)', mark: v => v.E }, ck: [] });
  lab(550, { n: 'Slip test — Xd and Xq', rf: 'Slip test', c: 'Xd = Vmax/Imin (rotor lined up with the field), Xq = Vmin/Imax. Salient pole: Xd > Xq. SCR = 1/Xd(pu).',
    i: [['Vx', 'Vmax', 'V', 200, 1, 10000, 1], ['Vn', 'Vmin', 'V', 190, 1, 10000, 1], ['Ix', 'Imax', 'A', 15, 0.1, 1000, 0.1], ['In', 'Imin', 'A', 10, 0.1, 1000, 0.1]],
    o: [['Xd', 'Xd', 'Ω', v => v.Vx / v.In], ['Xq', 'Xq', 'Ω', v => v.Vn / v.Ix], ['r', 'Xq/Xd', '', v => v.Xq / v.Xd]],
    ck: [[{ Vx: 200, Vn: 190, Ix: 15, In: 10 }, { Xd: 20, Xq: 12.67 }, 'Vol 2 p 564 · Sum 7']] });
  lab(550, { n: 'Salient-pole power — reluctance part', rf: 'Two-reaction', c: 'P = (EV/Xd) sin δ + (V²/2)(1/Xq − 1/Xd) sin 2δ. The second term exists even with no excitation, and moves the peak below 90°.',
    i: [['E', 'E', 'pu', 1.2, 0, 3, 0.01], ['V', 'V', 'pu', 1, 0.1, 2, 0.01], ['Xd', 'Xd', 'pu', 1, 0.1, 3, 0.01], ['Xq', 'Xq', 'pu', 0.6, 0.1, 3, 0.01], ['d', 'Load angle δ', '°', 30, 0, 180, 1]],
    o: [['P1', 'Excitation power', 'pu', v => v.E * v.V / v.Xd * Math.sin(rad(v.d))], ['P2', 'Reluctance power', 'pu', v => v.V * v.V / 2 * (1 / v.Xq - 1 / v.Xd) * Math.sin(rad(2 * v.d))], ['P', 'Total P', 'pu', v => v.P1 + v.P2]],
    plot: { x: ['d', 'Load angle δ', '°', 0, 180, ''], y: [['total', (d, v) => v.E * v.V / v.Xd * Math.sin(rad(d)) + v.V * v.V / 2 * (1 / v.Xq - 1 / v.Xd) * Math.sin(rad(2 * d))], ['excitation part', (d, v) => v.E * v.V / v.Xd * Math.sin(rad(d))], ['reluctance part', (d, v) => v.V * v.V / 2 * (1 / v.Xq - 1 / v.Xd) * Math.sin(rad(2 * d))]], yl: 'Power (pu)', mark: v => v.d }, ck: [] });

  /* ---------- Steppers (Synchronous Machines and Code 400 · Special Machines) ---------- */
  lab([550, 572], { n: 'Stepper motor — step angle from phases and teeth', rf: 'Stepper', c: 'β = 360°/(m·Nr) for m phases and Nr rotor teeth. Steps per revolution = 360°/β.',
    i: [['m', 'Phases m', '', 4, 1, 8, 1], ['Nr', 'Rotor teeth Nr', '', 50, 1, 200, 1]],
    o: [['b', 'Step angle β', '°', v => 360 / (v.m * v.Nr)], ['n', 'Steps per revolution', '', v => v.m * v.Nr]],
    ck: [[{ m: 4, Nr: 50 }, { b: 1.8, n: 200 }, 'Vol 2 p 576 · Sum 1'], [{ m: 3, Nr: 8 }, { b: 15, n: 24 }, 'Vol 2 p 553 · key-formula example']] });
  lab([550, 572], { n: 'Stepper motor — speed from pulse rate', rf: 'Stepper', c: 'Speed (rpm) = β × pulse rate × 60/360. Halve the step angle and twice the pulses are needed per turn.',
    i: [['b', 'Step angle β', '°', 1.8, 0.1, 90, 0.1], ['pps', 'Pulse rate', 'pulses/s', 400, 1, 10000, 1]],
    o: [['n', 'Steps per revolution', '', v => 360 / v.b], ['N', 'Speed', 'rpm', v => v.b * v.pps * 60 / 360]],
    ck: [[{ b: 1.8, pps: 400 }, { N: 120 }, 'Vol 2 p 576 · Sum 2'], [{ b: 1.8 }, { n: 200 }, 'Vol 2 p 553 · one-minute sum'], [{ b: 7.5, pps: 100 }, { N: 125 }, 'Vol 2 p 553 · one-minute sum'], [{ b: 0.9 }, { n: 400 }, 'Vol 2 p 576 · R1']] });

  /* ---------- Code 400 · Single-Phase & Special Machines ---------- */
  lab(572, { n: 'Single-phase motor — double revolving field', rf: 'Double revolving field', c: 'The pulsating field is two half fields turning opposite ways. At standstill their torques cancel (no starting torque); once turning, the forward one wins. Backward slip = 2 − s.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['P', 'Poles', '', 4, 2, 24, 2], ['s', 'Forward slip s', '', 0.05, 0.001, 1, 0.001], ['R', 'Rotor R′₂', 'Ω', 4, 0.1, 50, 0.1], ['X', 'Rotor X′₂', 'Ω', 4, 0.1, 50, 0.1]],
    o: [['sb', 'Backward slip', '', v => 2 - v.s], ['ff', 'Rotor frequency (forward field)', 'Hz', v => v.s * v.f], ['fb', 'Rotor frequency (backward field)', 'Hz', v => (2 - v.s) * v.f], ['N', 'Speed', 'rpm', v => 120 * v.f / v.P * (1 - v.s)]],
    plot: { x: ['N', 'Speed (fraction of Ns)', '', 0, 0.999, ''], y: [['forward', (n, v) => { const s = 1 - n, r = v.R / s; return r / (r * r + v.X * v.X); }], ['backward', (n, v) => { const s = 1 + n, r = v.R / s; return -r / (r * r + v.X * v.X); }], ['net', (n, v) => { const a = v.R / (1 - n), b = v.R / (1 + n); return a / (a * a + v.X * v.X) - b / (b * b + v.X * v.X); }]], yl: 'Torque (relative)', mark: v => 1 - v.s }, ck: [] });
  lab(572, { n: 'Linear induction motor', rf: 'Linear induction motor', c: 'Synchronous speed vs = 2τf (pole pitch τ). Slip s = (vs − v)/vs. Thrust F = Pgap/vs.',
    i: [['tau', 'Pole pitch τ', 'm', 0.25, 0.01, 2, 0.01], ['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['v', 'Speed v', 'm/s', 20, 0, 200, 0.1], ['Pg', 'Air-gap power', 'kW', 100, 0.1, 10000, 0.1]],
    o: [['vs', 'Synchronous speed', 'm/s', v => 2 * v.tau * v.f], ['kmh', 'in km/h', 'km/h', v => v.vs * 3.6], ['s', 'Slip', '', v => (v.vs - v.v) / v.vs], ['F', 'Thrust', 'kN', v => v.Pg / v.vs]], ck: [] });
  lab(572, { n: 'Reluctance motor torque', rf: 'Reluctance motor', c: 'T = (V²/2ω)(1/Xq − 1/Xd) sin 2δ: no field winding, torque only from the difference between Xd and Xq; peak at δ = 45°.',
    i: [['V', 'Voltage per phase', 'V', 230, 1, 1000, 1], ['f', 'Frequency', 'Hz', 50, 1, 400, 1], ['Xd', 'Xd', 'Ω', 40, 1, 500, 1], ['Xq', 'Xq', 'Ω', 15, 1, 500, 1], ['d', 'Load angle δ', '°', 30, 0, 90, 1]],
    o: [['T', 'Torque per phase', 'N·m', v => v.V * v.V / (2 * 2 * PI * v.f) * (1 / v.Xq - 1 / v.Xd) * Math.sin(rad(2 * v.d))], ['Tm', 'Peak (δ = 45°)', 'N·m', v => v.V * v.V / (2 * 2 * PI * v.f) * (1 / v.Xq - 1 / v.Xd)]],
    plot: { x: ['d', 'Load angle δ', '°', 0, 90, ''], y: [['torque', (d, v) => v.V * v.V / (2 * 2 * PI * v.f) * (1 / v.Xq - 1 / v.Xd) * Math.sin(rad(2 * d))]], yl: 'Torque (N·m)', mark: v => v.d }, ck: [] });
  lab(572, { n: 'BLDC motor', rf: 'BLDC motor', c: 'Eb = Ke·ω, T = Kt·I, so ω ≈ (V − IR)/Ke: speed falls in a straight line as the load rises.',
    i: [['V', 'Supply', 'V', 48, 1, 600, 1], ['R', 'Winding R', 'Ω', 0.5, 0.01, 20, 0.01], ['Ke', 'EMF constant Ke', 'V·s/rad', 0.1, 0.001, 2, 0.001], ['I', 'Current', 'A', 10, 0, 200, 0.1]],
    o: [['w', 'Speed', 'rad/s', v => (v.V - v.I * v.R) / v.Ke], ['N', 'Speed', 'rpm', v => v.w * 60 / (2 * PI)], ['T', 'Torque (Kt = Ke in SI)', 'N·m', v => v.Ke * v.I]], ck: [] });
  lab(572, { n: 'PMSM torque', rf: 'PMSM', c: 'T = (3P/2)[λm·iq + (Ld − Lq)·id·iq] with P pole pairs: magnet torque plus reluctance torque (needs Ld ≠ Lq).',
    i: [['P', 'Pole pairs P', '', 4, 1, 24, 1], ['lm', 'Magnet flux linkage λm', 'Wb', 0.1, 0.001, 2, 0.001], ['iq', 'iq', 'A', 20, 0, 500, 0.1], ['id', 'id', 'A', -5, -500, 500, 0.1], ['Ld', 'Ld', 'mH', 5, 0.01, 100, 0.01], ['Lq', 'Lq', 'mH', 8, 0.01, 100, 0.01]],
    o: [['Tm', 'Magnet torque', 'N·m', v => 1.5 * v.P * v.lm * v.iq], ['Tr', 'Reluctance torque', 'N·m', v => 1.5 * v.P * (v.Ld - v.Lq) * 1e-3 * v.id * v.iq], ['T', 'Total torque', 'N·m', v => v.Tm + v.Tr]], ck: [] });
})();
