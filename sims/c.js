/* Circuits & Fields labs. Inputs are in the units shown; formulas convert to SI. Checks are the book's numbers. */
(() => {
  const PI = Math.PI, e0 = 8.854e-12, mu0 = 4 * PI * 1e-7, K = 8.9875e9, sq = Math.sqrt, deg = x => x * 180 / PI, rad = x => x * PI / 180;
  const par = (a, b) => a * b / (a + b);

  /* ---------- DC Circuits & Network Theorems ---------- */
  lab(339, { n: 'Ohm’s law and power', rf: 'Power', c: 'I = V/R and P = VI = I²R = V²/R. Double V on the same R and the power goes up four times.',
    i: [['V', 'Voltage V', 'V', 12, 0.5, 500, 0.5], ['R', 'Resistance R', 'Ω', 6, 0.1, 1000, 0.1, 'log']],
    o: [['I', 'Current I', 'A', v => v.V / v.R], ['P', 'Power P', 'W', v => v.V * v.V / v.R]],
    ck: [[{ V: 12, R: 6 }, { I: 2 }, 'Vol 2 p 353 · Sum 1 (12 V across the 6 Ω total)']] });
  lab(339, { n: 'Rated power at another voltage', rf: 'Power', c: 'A heater keeps its resistance R = V²rated/Prated, so P ∝ V².',
    i: [['Pr', 'Rated power', 'W', 1000, 10, 5000, 10], ['Vr', 'Rated voltage', 'V', 230, 50, 500, 1], ['V', 'Supply voltage', 'V', 200, 10, 500, 1]],
    o: [['R', 'Resistance', 'Ω', v => v.Vr * v.Vr / v.Pr], ['P', 'Power drawn', 'W', v => v.V * v.V * v.Pr / (v.Vr * v.Vr)]],
    ck: [[{ Pr: 1000, Vr: 230, V: 200 }, { P: 756 }, 'Vol 2 p 356 · Sum 15'], [{ Pr: 1000, Vr: 230, V: 115 }, { P: 250 }, 'Vol 2 p 357 · R2 (V halved → P ÷ 4)']] });
  lab(339, { n: 'Energy and electricity units', rf: 'Energy', c: 'E = P × t. 1 unit = 1 kWh.',
    i: [['P', 'Power', 'W', 100, 1, 5000, 1], ['h', 'Hours a day', 'h', 10, 0.5, 24, 0.5], ['d', 'Days', '', 30, 1, 365, 1]],
    o: [['E', 'Energy', 'kWh', v => v.P * v.h * v.d / 1000]],
    ck: [[{ P: 100, h: 10, d: 30 }, { E: 30 }, 'Vol 2 p 354 · Sum 5']] });
  lab(339, { n: 'Resistance of a wire and stretching it', rf: 'Resistance of a wire', c: 'R = ρL/A. Stretching n times (same volume) makes L × n and A ÷ n, so R × n².',
    i: [['rho', 'Resistivity ρ', '× 10⁻⁸ Ω·m', 1.72, 1, 100, 0.01], ['L', 'Length L', 'm', 100, 1, 1000, 1], ['A', 'Area A', 'mm²', 1, 0.1, 50, 0.1], ['n', 'Stretched n times', '', 2, 1, 5, 0.1]],
    o: [['R', 'Resistance R', 'Ω', v => v.rho * 1e-8 * v.L / (v.A * 1e-6)], ['Rn', 'After stretching', 'Ω', v => v.n * v.n * v.R], ['k', 'Ratio Rnew / R', '×', v => v.Rn / v.R]],
    ck: [[{ n: 2 }, { k: 4 }, 'Vol 2 p 357 · R1 (twice the length → × 4)']] });
  lab(339, { n: 'Temperature coefficient of resistance', rf: 'Temperature coefficient', c: 'RT = R₀[1 + α(T − T₀)]. Metals have α > 0; carbon has α < 0.',
    i: [['R0', 'R at T₀', 'Ω', 2, 0.1, 1000, 0.1], ['a', 'α at T₀', '/°C', 0.00393, -0.0007, 0.006, 0.00001], ['T0', 'Reference T₀', '°C', 20, 0, 100, 1], ['T', 'Temperature T', '°C', 70, -50, 300, 1]],
    o: [['RT', 'Resistance at T', 'Ω', v => v.R0 * (1 + v.a * (v.T - v.T0))]], ck: [] });
  lab(339, { n: 'Series–parallel network', rf: 'Series / parallel', c: 'R₁ ∥ R₂ = R₁R₂/(R₁ + R₂), then add the series resistor.',
    i: [['R1', 'R₁ (in parallel)', 'Ω', 6, 0.1, 1000, 0.1, 'log'], ['R2', 'R₂ (in parallel)', 'Ω', 3, 0.1, 1000, 0.1, 'log'], ['R3', 'R₃ (in series)', 'Ω', 4, 0, 1000, 0.1], ['V', 'Supply V', 'V', 12, 1, 500, 1]],
    o: [['Rp', 'R₁ ∥ R₂', 'Ω', v => par(v.R1, v.R2)], ['Rt', 'Total R', 'Ω', v => v.Rp + v.R3], ['I', 'Supply current', 'A', v => v.V / v.Rt]],
    ck: [[{ R1: 6, R2: 3, R3: 4, V: 12 }, { Rp: 2, I: 2 }, 'Vol 2 p 353 · Sum 1'], [{ R1: 15, R2: 10, R3: 0 }, { Rp: 6 }, 'Vol 2 p 344 · one-minute sum']] });
  lab(339, { n: 'Current and voltage divider', rf: 'Current divider', c: 'Current divides inversely: I₁ = I·R₂/(R₁ + R₂). Voltage divides directly: V₂ = V·R₂/(R₁ + R₂).',
    i: [['I', 'Total current', 'A', 10, 0.1, 100, 0.1], ['V', 'Total voltage', 'V', 12, 1, 500, 1], ['R1', 'R₁', 'Ω', 2, 0.1, 1000, 0.1, 'log'], ['R2', 'R₂', 'Ω', 3, 0.1, 1000, 0.1, 'log']],
    o: [['I1', 'Current in R₁', 'A', v => v.I * v.R2 / (v.R1 + v.R2)], ['I2', 'Current in R₂', 'A', v => v.I * v.R1 / (v.R1 + v.R2)], ['V2', 'Voltage across R₂', 'V', v => v.V * v.R2 / (v.R1 + v.R2)]],
    ck: [[{ I: 10, R1: 2, R2: 3 }, { I1: 6 }, 'Vol 2 p 354 · Sum 3']] });
  lab(339, { n: 'Delta → star conversion', rf: 'Star', c: 'Star arm = product of the two adjacent delta arms ÷ sum of all three. Equal arms: R_Y = R_Δ/3.',
    i: [['Rab', 'R_ab', 'Ω', 10, 0.1, 1000, 0.1], ['Rbc', 'R_bc', 'Ω', 20, 0.1, 1000, 0.1], ['Rca', 'R_ca', 'Ω', 30, 0.1, 1000, 0.1]],
    o: [['S', 'Sum', 'Ω', v => v.Rab + v.Rbc + v.Rca], ['Ra', 'R_a', 'Ω', v => v.Rab * v.Rca / v.S], ['Rb', 'R_b', 'Ω', v => v.Rab * v.Rbc / v.S], ['Rc', 'R_c', 'Ω', v => v.Rbc * v.Rca / v.S]],
    ck: [[{ Rab: 10, Rbc: 20, Rca: 30 }, { Ra: 5, Rb: 3.33, Rc: 10 }, 'Vol 2 p 356 · Sum 12'], [{ Rab: 9, Rbc: 9, Rca: 9 }, { Ra: 3 }, 'Vol 2 p 354 · Sum 4']] });
  lab(339, { n: 'Thevenin of a divider and maximum power', rf: 'Maximum power transfer', c: 'Vth = Vs·R₂/(R₁ + R₂), Rth = R₁ ∥ R₂. The load gets the most power when RL = Rth: Pmax = Vth²/4Rth.',
    i: [['Vs', 'Source Vs', 'V', 12, 1, 500, 1], ['R1', 'Series R₁', 'Ω', 6, 0.1, 1000, 0.1, 'log'], ['R2', 'Shunt R₂', 'Ω', 3, 0.1, 1000, 0.1, 'log'], ['RL', 'Load RL', 'Ω', 2, 0.1, 1000, 0.1, 'log']],
    o: [['Vth', 'Vth', 'V', v => v.Vs * v.R2 / (v.R1 + v.R2)], ['Rth', 'Rth', 'Ω', v => par(v.R1, v.R2)], ['IL', 'Load current', 'A', v => v.Vth / (v.Rth + v.RL)], ['PL', 'Load power', 'W', v => v.IL * v.IL * v.RL], ['Pmax', 'Maximum power', 'W', v => v.Vth * v.Vth / (4 * v.Rth)]],
    plot: { x: ['RL', 'Load RL', 'Ω', 0.1, 50, 'log'], y: [['Load power', (x, v) => (v.Vth / (v.Rth + x)) ** 2 * x]], yl: 'Load power (W)', mark: v => v.Rth },
    ck: [[{ Vs: 12, R1: 6, R2: 3 }, { Vth: 4, Rth: 2, Pmax: 2 }, 'Vol 2 p 353 · Sum 2']] });
  lab(339, { n: 'Thevenin from open-circuit voltage and short-circuit current', rf: 'Thevenin', c: 'Rth = Voc/Isc, Pmax = Voc²/4Rth = Voc·Isc/4.',
    i: [['Voc', 'Open-circuit voltage', 'V', 24, 0.1, 500, 0.1], ['Isc', 'Short-circuit current', 'A', 2, 0.01, 100, 0.01]],
    o: [['Rth', 'Rth', 'Ω', v => v.Voc / v.Isc], ['Pmax', 'Maximum power', 'W', v => v.Voc * v.Isc / 4]],
    ck: [[{ Voc: 24, Isc: 2 }, { Rth: 12, Pmax: 12 }, 'Vol 2 p 339 · quick check']] });
  lab(339, { n: 'Node with a voltage source and a current source', rf: 'Superposition', c: 'Node voltage Vn = (V/R₁ + Is)/(1/R₁ + 1/R₂). By superposition each source contributes separately.',
    i: [['V', 'Source V (through R₁)', 'V', 12, 0, 100, 0.5], ['R1', 'R₁', 'Ω', 3, 0.1, 100, 0.1], ['R2', 'R₂ to ground', 'Ω', 6, 0.1, 100, 0.1], ['Is', 'Current source into node', 'A', 2, 0, 20, 0.1]],
    o: [['Vn', 'Node voltage', 'V', v => (v.V / v.R1 + v.Is) / (1 / v.R1 + 1 / v.R2)], ['I2', 'Current in R₂', 'A', v => v.Vn / v.R2], ['Iv', 'from V alone', 'A', v => v.V / (v.R1 + v.R2)], ['Ii', 'from Is alone', 'A', v => v.Is * v.R1 / (v.R1 + v.R2)]],
    ck: [[{ V: 12, R1: 3, R2: 6, Is: 2 }, { I2: 2 }, 'Vol 2 p 355 · Sum 10'], [{ V: 10, R1: 2, R2: 4, Is: 2 }, { Vn: 9.33 }, 'Vol 2 p 355 · Sum 8']] });
  lab(339, { n: 'Two-mesh analysis', rf: 'KCL and KVL', c: '(Ra + Rm)I₁ − Rm·I₂ = E₁ and −Rm·I₁ + (Rm + Rb)I₂ = −E₂ (E₂ opposing), solved by Cramer’s rule.',
    i: [['E1', 'E₁ (mesh 1)', 'V', 10, 0, 100, 0.5], ['Ra', 'Ra (mesh 1)', 'Ω', 2, 0.1, 100, 0.1], ['Rm', 'Shared R', 'Ω', 4, 0.1, 100, 0.1], ['Rb', 'Rb (mesh 2)', 'Ω', 3, 0.1, 100, 0.1], ['E2', 'E₂ opposing (mesh 2)', 'V', 5, 0, 100, 0.5]],
    o: [['D', 'Determinant', '', v => (v.Ra + v.Rm) * (v.Rm + v.Rb) - v.Rm * v.Rm], ['I1', 'Mesh current I₁', 'A', v => (v.E1 * (v.Rm + v.Rb) - v.Rm * v.E2) / v.D], ['I2', 'Mesh current I₂', 'A', v => ((v.Ra + v.Rm) * -v.E2 + v.Rm * v.E1) / v.D], ['Im', 'Current in shared R', 'A', v => v.I1 - v.I2]],
    ck: [[{ E1: 10, Ra: 2, Rm: 4, Rb: 3, E2: 5 }, { I1: 1.92, I2: 0.385 }, 'Vol 2 p 355 · Sum 9']] });
  lab(339, { n: 'Cells in series and parallel', rf: 'Cells in series', c: 'n cells in series per row, m rows: EMF nE, internal resistance nr/m, I = nE/(nr/m + R).',
    i: [['E', 'Cell EMF', 'V', 1.5, 0.5, 24, 0.1], ['r', 'Cell internal r', 'Ω', 0.3, 0.01, 5, 0.01], ['n', 'Cells in series', '', 3, 1, 20, 1], ['m', 'Rows in parallel', '', 2, 1, 10, 1], ['R', 'Load R', 'Ω', 0.45, 0.01, 100, 0.01, 'log']],
    o: [['Et', 'Battery EMF', 'V', v => v.n * v.E], ['rt', 'Battery r', 'Ω', v => v.n * v.r / v.m], ['I', 'Load current', 'A', v => v.Et / (v.rt + v.R)]],
    ck: [[{ E: 1.5, r: 0.3, n: 3, m: 2, R: 0.45 }, { I: 5 }, 'Vol 2 p 354 · Sum 7']] });
  lab(339, { n: 'Millman’s theorem (three branches)', rf: 'Millman', c: 'V = (E₁/R₁ + E₂/R₂ + E₃/R₃)/(1/R₁ + 1/R₂ + 1/R₃). A plain resistor is a branch with E = 0.',
    i: [['E1', 'E₁', 'V', 10, -100, 100, 0.5], ['R1', 'R₁', 'Ω', 2, 0.1, 100, 0.1], ['E2', 'E₂', 'V', 20, -100, 100, 0.5], ['R2', 'R₂', 'Ω', 4, 0.1, 100, 0.1], ['E3', 'E₃', 'V', 0, -100, 100, 0.5], ['R3', 'R₃', 'Ω', 4, 0.1, 100, 0.1]],
    o: [['V', 'Common voltage', 'V', v => (v.E1 / v.R1 + v.E2 / v.R2 + v.E3 / v.R3) / (1 / v.R1 + 1 / v.R2 + 1 / v.R3)], ['Req', 'Equivalent R', 'Ω', v => 1 / (1 / v.R1 + 1 / v.R2 + 1 / v.R3)]],
    ck: [[{ E1: 10, R1: 2, E2: 20, R2: 4, E3: 0, R3: 4 }, { V: 10 }, 'Vol 2 p 356 · Sum 14']] });
  lab(339, { n: 'Wheatstone bridge — galvanometer current', rf: 'Thevenin', c: 'Balance when P/Q = R/S. Off balance, Thevenin across the galvanometer: Vth = V[Q/(P+Q) − S/(R+S)], Rth = P∥Q + R∥S.',
    i: [['V', 'Supply', 'V', 10, 1, 100, 1], ['P', 'P', 'Ω', 100, 1, 1000, 1], ['Q', 'Q', 'Ω', 100, 1, 1000, 1], ['R', 'R', 'Ω', 100, 1, 1000, 1], ['S', 'S', 'Ω', 110, 1, 1000, 1], ['G', 'Galvanometer', 'Ω', 50, 1, 1000, 1]],
    o: [['Vth', 'Vth', 'V', v => v.V * (v.S / (v.R + v.S) - v.Q / (v.P + v.Q))], ['Rth', 'Rth', 'Ω', v => par(v.P, v.Q) + par(v.R, v.S)], ['Ig', 'Galvanometer current', 'mA', v => Math.abs(v.Vth) / (v.Rth + v.G) * 1000]],
    ck: [[{ V: 10, P: 100, Q: 100, R: 100, S: 110, G: 50 }, { Ig: 1.56 }, 'Vol 2 p 355 · Sum 11']] });
  lab(339, { n: 'Network topology — loops and tree', rf: 'Network topology', c: 'Independent loops (links) = B − N + 1; tree branches = N − 1.',
    i: [['B', 'Branches B', '', 8, 1, 50, 1], ['N', 'Nodes N', '', 5, 2, 30, 1]],
    o: [['L', 'Independent loops', '', v => v.B - v.N + 1], ['t', 'Tree branches', '', v => v.N - 1]],
    ck: [[{ B: 8, N: 5 }, { L: 4 }, 'Vol 2 p 340 · quick check']] });

  /* ---------- Capacitors, Inductors & Transients ---------- */
  lab(365, { n: 'Capacitor — charge and energy', rf: 'Capacitor', c: 'Q = CV, W = ½CV². Double V → Q × 2, W × 4.',
    i: [['C', 'Capacitance', 'µF', 10, 0.01, 10000, 0.01, 'log'], ['V', 'Voltage', 'V', 100, 1, 1000, 1]],
    o: [['Q', 'Charge Q', 'mC', v => v.C * 1e-6 * v.V * 1e3], ['W', 'Energy W', 'J', v => 0.5 * v.C * 1e-6 * v.V * v.V]],
    ck: [[{ C: 10, V: 100 }, { Q: 1, W: 0.05 }, 'Vol 2 p 374 · Sum 1']] });
  lab(365, { n: 'Parallel-plate capacitor', rf: 'Parallel-plate', c: 'C = ε₀εᵣA/d. Fill with a dielectric εᵣ = 5 → C × 5; double the gap → C ÷ 2.',
    i: [['er', 'Relative permittivity εᵣ', '', 1, 1, 100, 0.1], ['A', 'Plate area', 'm²', 0.01, 0.0001, 1, 0.0001, 'log'], ['d', 'Gap d', 'mm', 1, 0.01, 20, 0.01, 'log']],
    o: [['C', 'Capacitance', 'pF', v => e0 * v.er * v.A / (v.d * 1e-3) * 1e12]],
    ck: [[{ er: 1, A: 0.01, d: 1 }, { C: 88.5 }, 'Vol 2 p 454 · Sum 3 (Electromagnetic Fields)']] });
  lab(365, { n: 'Capacitors in series and parallel', rf: 'Capacitors series', c: 'Series: 1/Cs = 1/C₁ + 1/C₂ (smaller than either). Parallel: Cp = C₁ + C₂.',
    i: [['C1', 'C₁', 'µF', 2, 0.01, 1000, 0.01, 'log'], ['C2', 'C₂', 'µF', 3, 0.01, 1000, 0.01, 'log']],
    o: [['Cs', 'In series', 'µF', v => par(v.C1, v.C2)], ['Cp', 'In parallel', 'µF', v => v.C1 + v.C2]],
    ck: [[{ C1: 2, C2: 3 }, { Cs: 1.2, Cp: 5 }, 'Vol 2 p 374 · Sum 4']] });
  lab(365, { n: 'RC circuit — charging and discharging', rf: 'RC circuit', c: 'τ = RC. Charging v = V(1 − e^(−t/τ)): 63.2 % at 1τ, 99.3 % at 5τ. Discharging v = V e^(−t/τ): 36.8 % at 1τ.',
    i: [['V', 'Supply / initial voltage', 'V', 12, 1, 500, 1], ['R', 'R', 'kΩ', 10, 0.01, 10000, 0.01, 'log'], ['C', 'C', 'µF', 100, 0.001, 10000, 0.001, 'log'], ['t', 'Time t', 's', 1, 0, 100, 0.001]],
    o: [['tau', 'Time constant τ', 's', v => v.R * 1e3 * v.C * 1e-6], ['vc', 'v while charging', 'V', v => v.V * (1 - Math.exp(-v.t / v.tau))], ['vd', 'v while discharging', 'V', v => v.V * Math.exp(-v.t / v.tau)], ['i', 'Charging current', 'mA', v => v.V / (v.R * 1e3) * Math.exp(-v.t / v.tau) * 1e3]],
    plot: { x: ['t', 'Time t', 's', 0, 5, ''], y: [['charging', (x, v) => v.V * (1 - Math.exp(-x / v.tau))], ['discharging', (x, v) => v.V * Math.exp(-x / v.tau)]], yl: 'Capacitor voltage (V)', mark: v => v.t },
    ck: [[{ V: 12, R: 10, C: 100, t: 1 }, { vc: 7.59 }, 'Vol 2 p 374 · Sum 2'], [{ V: 10, R: 1000, C: 1, t: 1 }, { vd: 3.68 }, 'Vol 2 p 367 · key-formula example'], [{ R: 2, C: 5 }, { tau: 0.01 }, 'Vol 2 p 367 · one-minute sum (τ = 10 ms)']] });
  lab(365, { n: 'RL circuit — current rise', rf: 'RL circuit', c: 'τ = L/R, final current V/R, i = (V/R)(1 − e^(−t/τ)). Double R → τ ÷ 2.',
    i: [['V', 'Supply', 'V', 12, 1, 500, 1], ['R', 'R', 'Ω', 4, 0.1, 1000, 0.1, 'log'], ['L', 'L', 'H', 2, 0.001, 100, 0.001, 'log'], ['t', 'Time t', 's', 0.5, 0, 50, 0.001]],
    o: [['tau', 'Time constant τ', 's', v => v.L / v.R], ['If', 'Final current', 'A', v => v.V / v.R], ['i', 'Current at t', 'A', v => v.If * (1 - Math.exp(-v.t / v.tau))]],
    plot: { x: ['t', 'Time t', 's', 0, 3, ''], y: [['i(t)', (x, v) => v.If * (1 - Math.exp(-x / v.tau))]], yl: 'Current (A)', mark: v => v.t },
    ck: [[{ V: 12, R: 4, L: 2 }, { tau: 0.5, If: 3 }, 'Vol 2 p 374 · Sum 3'], [{ V: 20, R: 10, L: 2, t: 0.2 }, { If: 2, tau: 0.2, i: 1.264 }, 'Vol 2 p 413 · Sum 2 (Code 400)']] });
  lab(365, { n: 'Inductor energy and coupled coils', rf: 'Inductors series', c: 'W = ½LI². Coupled coils in series: L = L₁ + L₂ ± 2M with M = k√(L₁L₂).',
    i: [['L', 'Inductance (energy)', 'H', 0.5, 0.001, 100, 0.001, 'log'], ['I', 'Current', 'A', 4, 0.01, 100, 0.01], ['L1', 'L₁', 'H', 1, 0.01, 100, 0.01], ['L2', 'L₂', 'H', 4, 0.01, 100, 0.01], ['k', 'Coupling k', '', 0.5, 0, 1, 0.01]],
    o: [['W', 'Stored energy', 'J', v => 0.5 * v.L * v.I * v.I], ['M', 'Mutual M', 'H', v => v.k * sq(v.L1 * v.L2)], ['La', 'Series aiding', 'H', v => v.L1 + v.L2 + 2 * v.M], ['Lo', 'Series opposing', 'H', v => v.L1 + v.L2 - 2 * v.M]],
    ck: [[{ L: 0.5, I: 4 }, { W: 4 }, 'Vol 2 p 374 · Sum 5'], [{ L1: 1, L2: 4, k: 0.5 }, { La: 7 }, 'Vol 2 p 380 · quick check']] });
  lab(365, { n: 'Any first-order response', rf: 'Key formula', c: 'x(t) = x(∞) + [x(0⁺) − x(∞)] e^(−t/τ): only three numbers are needed.',
    i: [['x0', 'Initial x(0⁺)', '', 2, -100, 100, 0.1], ['xf', 'Final x(∞)', '', 10, -100, 100, 0.1], ['tau', 'τ', 's', 1, 0.001, 100, 0.001, 'log'], ['t', 'Time t', 's', 1, 0, 100, 0.01]],
    o: [['x', 'x(t)', '', v => v.xf + (v.x0 - v.xf) * Math.exp(-v.t / v.tau)]],
    plot: { x: ['t', 'Time t', 's', 0, 6, ''], y: [['x(t)', (x, v) => v.xf + (v.x0 - v.xf) * Math.exp(-x / v.tau)]], yl: 'x(t)', mark: v => v.t },
    ck: [[{ x0: 2, xf: 10, tau: 1, t: 1 }, { x: 7.06 }, 'Vol 2 p 409 · quick check (Code 400)']] });
  lab(365, { n: 'Transient-free switching angle', rf: 'Transient-free', c: 'Close a sine source at θ = tan⁻¹(ωL/R) for series RL, or tan⁻¹(ωRC) for series RC, and no transient appears.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 1000, 1], ['R', 'R', 'Ω', 10, 0.1, 10000, 0.1, 'log'], ['L', 'L (series RL)', 'mH', 31.83, 0.01, 10000, 0.01, 'log'], ['C', 'C (series RC)', 'µF', 1.838, 0.001, 10000, 0.001, 'log']],
    o: [['tL', 'θ for series RL', '°', v => deg(Math.atan(2 * PI * v.f * v.L * 1e-3 / v.R))], ['tC', 'θ for series RC', '°', v => deg(Math.atan(2 * PI * v.f * v.R * v.C * 1e-6))]],
    ck: [[{ f: 50, R: 10, L: 31.83 }, { tL: 45 }, 'Vol 2 p 374 · Sum 6'], [{ f: 50, R: 1000, C: 1.838 }, { tC: 30 }, 'Vol 2 p 375 · Sum 7']] });

  /* ---------- AC Circuits ---------- */
  lab(380, { n: 'Sine wave — peak, RMS, average, frequency', rf: 'RMS & average', c: 'Vrms = Vm/√2 = 0.707Vm, Vavg = 2Vm/π = 0.637Vm, f = ω/2π, T = 1/f.',
    i: [['Vm', 'Peak Vm', 'V', 325, 1, 1000, 1], ['w', 'ω', 'rad/s', 314, 1, 10000, 1]],
    o: [['Vrms', 'RMS', 'V', v => v.Vm / sq(2)], ['Vavg', 'Average (half cycle)', 'V', v => 2 * v.Vm / PI], ['f', 'Frequency', 'Hz', v => v.w / (2 * PI)], ['T', 'Period', 'ms', v => 1000 / v.f]],
    ck: [[{ Vm: 325, w: 314 }, { Vrms: 230, f: 50 }, 'Vol 2 p 397 · Sum 1'], [{ Vm: 100 }, { Vrms: 70.7, Vavg: 63.7 }, 'Vol 2 p 383 · quick check'], [{ Vm: 200 }, { Vrms: 141 }, 'Vol 2 p 385 · one-minute sum']] });
  lab(380, { n: 'Waveform factors — RMS and average', rf: 'Form & peak', c: 'Form factor = RMS/average, peak factor = peak/RMS. A pulse train of duty D has RMS = Vp√D.',
    i: [['w', 'Waveform', '', 'half-wave', ['sine', 'square', 'triangle', 'half-wave', 'full-wave']], ['Vm', 'Peak', 'V', 100, 1, 1000, 1]],
    o: [['rms', 'RMS', 'V', v => v.Vm * { sine: 1 / sq(2), square: 1, triangle: 1 / sq(3), 'half-wave': 0.5, 'full-wave': 1 / sq(2) }[v.w]],
      ['avg', 'Average', 'V', v => v.Vm * { sine: 2 / PI, square: 1, triangle: 0.5, 'half-wave': 1 / PI, 'full-wave': 2 / PI }[v.w]], ['ff', 'Form factor', '', v => v.rms / v.avg], ['pf', 'Peak factor', '', v => v.Vm / v.rms]],
    ck: [[{ w: 'half-wave', Vm: 100 }, { avg: 31.8, rms: 50 }, 'Vol 2 p 400 · Sum 16'], [{ w: 'sine' }, { ff: 1.11, pf: 1.414 }, 'Vol 2 p 389 · formula 5 (sine)'], [{ w: 'square' }, { ff: 1, pf: 1 }, 'Vol 2 p 389 · formula 5 (square)'], [{ w: 'triangle' }, { ff: 1.155, pf: 1.732 }, 'Vol 2 p 389 · formula 5 (triangle)'], [{ w: 'half-wave' }, { ff: 1.57, pf: 2 }, 'Vol 2 p 389 · formula 5 (half-wave)']] });
  lab(380, { n: 'Pulse train RMS', rf: 'RMS of any waveform', c: 'RMS = Vp√D for a rectangular pulse train of duty ratio D.',
    i: [['Vp', 'Pulse height', 'V', 10, 0.1, 1000, 0.1], ['D', 'Duty ratio D', '', 0.25, 0.01, 1, 0.01]],
    o: [['rms', 'RMS', 'V', v => v.Vp * sq(v.D)], ['avg', 'Average', 'V', v => v.Vp * v.D]],
    ck: [[{ Vp: 10, D: 0.25 }, { rms: 5 }, 'Vol 2 p 381 · quick check']] });
  lab(380, { n: 'Phase difference as a time delay', rf: 'Frequency', c: 'Delay = (angle/360°) × T, with T = 1/f.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 1000, 1], ['a', 'Phase angle', '°', 90, 0, 360, 1]],
    o: [['T', 'Period', 'ms', v => 1000 / v.f], ['d', 'Time delay', 'ms', v => v.a / 360 * v.T]],
    ck: [[{ f: 50, a: 90 }, { d: 5 }, 'Vol 2 p 384 · key-formula example'], [{ f: 50, a: 36 }, { d: 2 }, 'Vol 2 p 384 · one-minute sum'], [{ f: 25 }, { T: 40 }, 'Vol 2 p 384 · one-minute sum']] });
  lab(380, { n: 'Reactance of L and C', rf: 'Reactance', c: 'XL = 2πfL rises with f; XC = 1/(2πfC) falls with f. At 50 Hz: XL = 314L, XC = 3183/C(µF).',
    i: [['f', 'Frequency', 'Hz', 50, 1, 100000, 1, 'log'], ['L', 'L', 'H', 0.1, 0.0001, 10, 0.0001, 'log'], ['C', 'C', 'µF', 100, 0.001, 10000, 0.001, 'log']],
    o: [['XL', 'XL', 'Ω', v => 2 * PI * v.f * v.L], ['XC', 'XC', 'Ω', v => 1 / (2 * PI * v.f * v.C * 1e-6)]],
    plot: { x: ['f', 'Frequency', 'Hz', 1, 10000, 'log'], y: [['XL', (x, v) => 2 * PI * x * v.L], ['XC', (x, v) => 1 / (2 * PI * x * v.C * 1e-6)]], yl: 'Reactance (Ω)', mark: v => v.f },
    ck: [[{ f: 50, L: 0.1, C: 100 }, { XL: 31.4, XC: 31.8 }, 'Vol 2 p 397 · Sum 3'], [{ f: 50, C: 10 }, { XC: 318 }, 'Vol 2 p 386 · key-formula example'], [{ f: 50, L: 0.3, C: 25 }, { XL: 94.2, XC: 127.3 }, 'Vol 2 p 386 · one-minute sums']] });
  lab(380, { n: 'Series R–L–C circuit — current, pf and power', rf: 'Series RL, RC, RLC', c: 'Z = √(R² + (XL − XC)²), I = V/Z, pf = R/Z, P = I²R. XL > XC → lagging.',
    i: [['V', 'Supply V', 'V', 230, 1, 1000, 1], ['R', 'R', 'Ω', 6, 0.1, 1000, 0.1], ['XL', 'XL', 'Ω', 8, 0, 1000, 0.1], ['XC', 'XC', 'Ω', 0, 0, 1000, 0.1]],
    o: [['Z', '|Z|', 'Ω', v => sq(v.R ** 2 + (v.XL - v.XC) ** 2)], ['I', 'Current', 'A', v => v.V / v.Z], ['pf', 'Power factor', '', v => v.R / v.Z], ['ph', 'Phase angle', '°', v => deg(Math.atan2(v.XL - v.XC, v.R))], ['P', 'Real power', 'W', v => v.I * v.I * v.R], ['Q', 'Reactive power', 'VAR', v => v.I * v.I * (v.XL - v.XC)]],
    ck: [[{ V: 230, R: 6, XL: 8, XC: 0 }, { I: 23, pf: 0.6, P: 3174 }, 'Vol 2 p 397 · Sum 2'], [{ R: 6, XL: 8, XC: 0 }, { Z: 10, pf: 0.6 }, 'Vol 2 p 383 · quick check']] });
  lab(380, { n: 'Series resonance — fr, Q and bandwidth', rf: 'Series resonance', c: 'fr = 1/(2π√LC). At fr, Z = R (minimum) and I is maximum. Q = (1/R)√(L/C), BW = fr/Q.',
    i: [['R', 'R', 'Ω', 5, 0.1, 1000, 0.1, 'log'], ['L', 'L', 'mH', 20, 0.01, 10000, 0.01, 'log'], ['C', 'C', 'µF', 50, 0.001, 10000, 0.001, 'log'], ['V', 'Supply V', 'V', 10, 1, 500, 1]],
    o: [['fr', 'Resonant frequency', 'Hz', v => 1 / (2 * PI * sq(v.L * 1e-3 * v.C * 1e-6))], ['Q', 'Q factor', '', v => sq(v.L * 1e-3 / (v.C * 1e-6)) / v.R], ['BW', 'Bandwidth', 'Hz', v => v.fr / v.Q], ['Im', 'Current at resonance', 'A', v => v.V / v.R]],
    plot: { x: ['f', 'Frequency', 'Hz', 10, 10000, 'log'], y: [['|I|', (x, v) => v.V / sq(v.R ** 2 + (2 * PI * x * v.L * 1e-3 - 1 / (2 * PI * x * v.C * 1e-6)) ** 2)]], yl: 'Current (A)', mark: v => v.fr },
    ck: [[{ R: 5, L: 20, C: 50 }, { fr: 159.2, Q: 4, BW: 39.8 }, 'Vol 2 p 399 · Sum 11'], [{ L: 10, C: 10 }, { fr: 503 }, 'Vol 2 p 397 · Sum 4'], [{ R: 10, L: 100, C: 10 }, { Q: 10 }, 'Vol 2 p 397 · Sum 5'], [{ L: 10, C: 1 }, { fr: 1592 }, 'Vol 2 p 387 · key-formula example']] });
  lab(380, { n: 'Parallel R, L and C — current triangle', rf: 'Parallel RL', c: 'I = √(IR² + (IL − IC)²), pf = IR/I. IL > IC → lagging.',
    i: [['V', 'Supply V', 'V', 12, 1, 1000, 1], ['R', 'R', 'Ω', 4, 0.1, 10000, 0.1, 'log'], ['XL', 'XL', 'Ω', 2, 0.1, 1e6, 0.1, 'log'], ['XC', 'XC', 'Ω', 6, 0.1, 1e9, 0.1, 'log']],
    o: [['IR', 'IR', 'A', v => v.V / v.R], ['IL', 'IL', 'A', v => v.V / v.XL], ['IC', 'IC', 'A', v => v.V / v.XC], ['I', 'Line current', 'A', v => sq(v.IR ** 2 + (v.IL - v.IC) ** 2)], ['pf', 'Power factor', '', v => v.IR / v.I]],
    ck: [[{ V: 12, R: 4, XL: 2, XC: 6 }, { I: 5, pf: 0.6 }, 'Vol 2 p 399 · Sum 10'], [{ V: 100, R: 20, XL: 20, XC: 1e9 }, { IR: 5, IL: 5, I: 7.07, pf: 0.707 }, 'Vol 2 p 399 · Sum 12']] });
  lab(380, { n: 'AC power triangle', rf: 'AC power', c: 'P = VI cos ϕ, Q = VI sin ϕ, S = VI = √(P² + Q²), pf = P/S.',
    i: [['V', 'Voltage', 'V', 230, 1, 1000, 1], ['I', 'Current', 'A', 10, 0.1, 1000, 0.1], ['ph', 'Angle ϕ (lag +)', '°', 30, -90, 90, 1]],
    o: [['P', 'P', 'W', v => v.V * v.I * Math.cos(rad(v.ph))], ['Q', 'Q', 'VAR', v => v.V * v.I * Math.sin(rad(v.ph))], ['S', 'S', 'VA', v => v.V * v.I], ['pf', 'Power factor', '', v => Math.cos(rad(v.ph))]],
    ck: [[{ V: 230, I: 10, ph: 30 }, { P: 1992, Q: 1150, S: 2300 }, 'Vol 2 p 399 · Sum 13']] });
  lab(380, { n: 'kW, kVA and kVAR from power factor', rf: 'AC power', c: 'S = P/pf, Q = P·tan ϕ.',
    i: [['P', 'Real power', 'kW', 50, 0.1, 10000, 0.1], ['pf', 'Power factor', '', 0.8, 0.05, 1, 0.01]],
    o: [['S', 'Apparent power', 'kVA', v => v.P / v.pf], ['Q', 'Reactive power', 'kVAR', v => v.P * Math.tan(Math.acos(v.pf))]],
    ck: [[{ P: 50, pf: 0.8 }, { S: 62.5 }, 'Vol 2 p 387 · one-minute sum'], [{ P: 80, pf: 0.8 }, { S: 100, Q: 60 }, 'Vol 2 p 387 · key-formula example']] });
  lab(380, { n: 'Power factor correction', rf: 'Power factor correction', c: 'Qc = P(tan ϕ₁ − tan ϕ₂), C = Qc/(ωV²).',
    i: [['P', 'Load', 'kW', 10, 0.1, 10000, 0.1], ['pf1', 'Present pf', '', 0.8, 0.1, 1, 0.01], ['pf2', 'Target pf', '', 1, 0.1, 1, 0.01], ['V', 'Voltage', 'V', 230, 1, 33000, 1], ['f', 'Frequency', 'Hz', 50, 1, 400, 1]],
    o: [['Qc', 'Capacitor kVAR', 'kVAR', v => v.P * (Math.tan(Math.acos(v.pf1)) - Math.tan(Math.acos(v.pf2)))], ['C', 'Capacitance', 'µF', v => v.Qc * 1e3 / (2 * PI * v.f * v.V * v.V) * 1e6]],
    ck: [[{ P: 10, pf1: 0.8, pf2: 1, V: 230, f: 50 }, { Qc: 7.5, C: 451 }, 'Vol 2 p 399 · Sum 14'], [{ P: 50, pf1: 0.8, pf2: 1 }, { Qc: 37.5 }, 'Vol 2 p 387 · one-minute sum']] });
  lab(380, { n: 'AC maximum power transfer', rf: 'Maximum power', c: 'ZL = Zth* (conjugate): the reactances cancel and Pmax = Vth²/(4Rth).',
    i: [['Vth', 'Vth (rms)', 'V', 30, 1, 1000, 1], ['Rth', 'Rth', 'Ω', 3, 0.1, 1000, 0.1], ['Xth', 'Xth', 'Ω', 4, -1000, 1000, 0.1]],
    o: [['RL', 'Load R', 'Ω', v => v.Rth], ['XL', 'Load X', 'Ω', v => -v.Xth], ['Pmax', 'Maximum power', 'W', v => v.Vth * v.Vth / (4 * v.Rth)]],
    ck: [[{ Vth: 30, Rth: 3, Xth: 4 }, { RL: 3, XL: -4, Pmax: 75 }, 'Vol 2 p 400 · Sum 15']] });
  lab(380, { n: 'Series R–L locus — current circle', rf: 'Locus', c: 'With V fixed and X varied, the current tip moves on a semicircle of diameter V/R.',
    i: [['V', 'Voltage', 'V', 100, 1, 1000, 1], ['R', 'R', 'Ω', 4, 0.1, 1000, 0.1]],
    o: [['D', 'Circle diameter', 'A', v => v.V / v.R]],
    ck: [[{ V: 100, R: 4 }, { D: 25 }, 'Vol 2 p 398 · Sum 9'], [{ V: 100, R: 10 }, { D: 10 }, 'Vol 2 p 382 · quick check']] });
  lab(380, { n: 'Supply voltage from VR, VL and VC', rf: 'Series RL, RC, RLC', c: 'V = √(VR² + (VL − VC)²): the voltages add as phasors, not as numbers.',
    i: [['VR', 'VR', 'V', 30, 0, 1000, 1], ['VL', 'VL', 'V', 90, 0, 1000, 1], ['VC', 'VC', 'V', 50, 0, 1000, 1]],
    o: [['V', 'Supply V', 'V', v => sq(v.VR ** 2 + (v.VL - v.VC) ** 2)], ['pf', 'Power factor', '', v => v.VR / v.V]],
    ck: [[{ VR: 30, VL: 90, VC: 50 }, { V: 50 }, 'Vol 2 p 383 · quick check']] });
  lab(380, { n: 'RC low-pass filter', rf: 'RC filters', c: 'Cut-off fc = 1/(2πRC); |Vout/Vin| = 1/√(1 + (f/fc)²), −3 dB at fc.',
    i: [['R', 'R', 'kΩ', 1, 0.01, 1000, 0.01, 'log'], ['C', 'C', 'µF', 0.1, 0.0001, 1000, 0.0001, 'log'], ['f', 'Frequency', 'Hz', 1000, 1, 1e6, 1, 'log']],
    o: [['fc', 'Cut-off fc', 'Hz', v => 1 / (2 * PI * v.R * 1e3 * v.C * 1e-6)], ['g', 'Gain |Vout/Vin|', '', v => 1 / sq(1 + (v.f / v.fc) ** 2)], ['db', 'Gain', 'dB', v => 20 * Math.log10(v.g)], ['ph', 'Phase', '°', v => -deg(Math.atan(v.f / v.fc))]],
    plot: { x: ['f', 'Frequency', 'Hz', 1, 1e6, 'log'], y: [['low-pass', (x, v) => 20 * Math.log10(1 / sq(1 + (x / v.fc) ** 2))], ['high-pass', (x, v) => 20 * Math.log10((x / v.fc) / sq(1 + (x / v.fc) ** 2))]], yl: 'Gain (dB)', mark: v => v.fc }, ck: [] });

  /* ---------- Code 400 · Electrical Circuits: Responses ---------- */
  lab(409, { n: 'Series RLC — roots and damping', rf: 'Series RLC', c: 's = −α ± √(α² − ω₀²), α = R/2L, ω₀ = 1/√LC, ζ = α/ω₀. ζ > 1 overdamped, = 1 critical, < 1 underdamped.',
    i: [['R', 'R', 'Ω', 4, 0.01, 1000, 0.01, 'log'], ['L', 'L', 'H', 1, 0.001, 100, 0.001, 'log'], ['C', 'C', 'F', 1 / 3, 0.0001, 10, 0.0001, 'log']],
    o: [['a', 'α', '/s', v => v.R / (2 * v.L)], ['w0', 'ω₀', 'rad/s', v => 1 / sq(v.L * v.C)], ['z', 'Damping ratio ζ', '', v => v.a / v.w0],
      ['s1', 's₁ (real part)', '/s', v => v.a > v.w0 ? -v.a + sq(v.a ** 2 - v.w0 ** 2) : -v.a], ['s2', 's₂ (real part)', '/s', v => v.a > v.w0 ? -v.a - sq(v.a ** 2 - v.w0 ** 2) : -v.a],
      ['wd', 'Damped ω_d', 'rad/s', v => v.a < v.w0 ? sq(v.w0 ** 2 - v.a ** 2) : 0], ['type', 'Response', '', v => Math.abs(v.z - 1) < 1e-3 ? 'critically damped' : v.z > 1 ? 'overdamped' : 'underdamped']],
    plot: { x: ['t', 'Time t', 's', 0, 10, ''], y: [['unit-step capacitor voltage', (t, v) => { const a = v.a, w = v.w0; if (Math.abs(a - w) < 1e-6) return 1 - (1 + a * t) * Math.exp(-a * t); if (a > w) { const r = sq(a * a - w * w), p1 = -a + r, p2 = -a - r; return 1 - (p2 * Math.exp(p1 * t) - p1 * Math.exp(p2 * t)) / (p2 - p1); } const d = sq(w * w - a * a); return 1 - Math.exp(-a * t) * (Math.cos(d * t) + a / d * Math.sin(d * t)); }]], yl: 'v_C for a 1 V step' },
    ck: [[{ R: 4, L: 1, C: 1 / 3 }, { s1: -1, s2: -3, type: 'overdamped' }, 'Vol 2 p 412 · Sum 1'], [{ R: 8, L: 1, C: 1 / 3 }, { z: 2 * 4 / (2 * sq(3)) / 1 }, 'Vol 2 p 413 · R2 (R doubles → ζ × 2)']] });
  lab(409, { n: 'Parallel RLC — damping', rf: 'Parallel RLC', c: 'α = 1/(2RC), ω₀ = 1/√LC; critical damping when R = ½√(L/C). Raising R lowers the damping.',
    i: [['R', 'R', 'Ω', 10, 0.01, 10000, 0.01, 'log'], ['L', 'L', 'H', 1, 0.001, 100, 0.001, 'log'], ['C', 'C', 'F', 0.01, 0.0001, 10, 0.0001, 'log']],
    o: [['a', 'α', '/s', v => 1 / (2 * v.R * v.C)], ['w0', 'ω₀', 'rad/s', v => 1 / sq(v.L * v.C)], ['z', 'Damping ratio ζ', '', v => v.a / v.w0], ['Rc', 'R for critical damping', 'Ω', v => 0.5 * sq(v.L / v.C)]], ck: [] });

  /* ---------- Three-Phase Systems ---------- */
  lab(417, { n: 'Balanced star or delta load', rf: 'Three-phase power', c: 'Star: Vph = VL/√3, IL = Iph. Delta: Vph = VL, IL = √3·Iph. The same impedances in delta take 3 × the star power.',
    i: [['VL', 'Line voltage', 'V', 400, 100, 33000, 1], ['R', 'R per phase', 'Ω', 10, 0.1, 1000, 0.1], ['X', 'X per phase', 'Ω', 0, 0, 1000, 0.1], ['cn', 'Connection', '', 'star', ['star', 'delta']]],
    o: [['Vph', 'Phase voltage', 'V', v => v.cn === 'star' ? v.VL / sq(3) : v.VL], ['Z', 'Phase |Z|', 'Ω', v => sq(v.R ** 2 + v.X ** 2)], ['Iph', 'Phase current', 'A', v => v.Vph / v.Z], ['IL', 'Line current', 'A', v => v.cn === 'star' ? v.Iph : sq(3) * v.Iph],
      ['pf', 'Power factor', '', v => v.R / v.Z], ['P', 'Total power', 'kW', v => 3 * v.Iph ** 2 * v.R / 1000]],
    ck: [[{ VL: 400, R: 10, X: 0, cn: 'star' }, { Vph: 231, IL: 23.1, P: 16 }, 'Vol 2 p 422 · Sum 1'], [{ VL: 400, R: 20, X: 0, cn: 'delta' }, { Iph: 20, IL: 34.6, P: 24 }, 'Vol 2 p 422 · Sum 2']] });
  lab([417, 663], { n: 'Three-phase power from line values', rf: 'Three-phase power', c: 'P = √3·VL·IL·cos ϕ, Q = √3·VL·IL·sin ϕ, S = √3·VL·IL.',
    i: [['VL', 'Line voltage', 'V', 415, 100, 33000, 1], ['IL', 'Line current', 'A', 20, 0.1, 5000, 0.1], ['pf', 'Power factor', '', 0.8, 0.05, 1, 0.01]],
    o: [['P', 'P', 'kW', v => sq(3) * v.VL * v.IL * v.pf / 1000], ['Q', 'Q', 'kVAR', v => sq(3) * v.VL * v.IL * Math.sin(Math.acos(v.pf)) / 1000], ['S', 'S', 'kVA', v => sq(3) * v.VL * v.IL / 1000], ['Vph', 'Phase V (star)', 'V', v => v.VL / sq(3)]],
    ck: [[{ VL: 415, IL: 20, pf: 0.8 }, { P: 11.5 }, 'Vol 2 p 423 · Sum 3'], [{ VL: 415, IL: 10, pf: 0.8 }, { P: 5.75 }, 'Vol 2 p 418 · one-minute sum'], [{ VL: 11000 }, { Vph: 6350 }, 'Vol 2 p 418 · key-formula example'], [{ VL: 11000, IL: 100 }, { S: 1905 }, 'Vol 3 p 670 · Sum 5']] });
  lab([417, 807], { n: 'Two-wattmeter method', rf: 'Two-wattmeter', c: 'P = W₁ + W₂, tan ϕ = √3(W₁ − W₂)/(W₁ + W₂). W₁ = W₂ → pf 1; one reads zero → pf 0.5; one negative → pf < 0.5.',
    i: [['W1', 'W₁', 'kW', 5, -100, 100, 0.1], ['W2', 'W₂', 'kW', 3, -100, 100, 0.1]],
    o: [['P', 'Total power', 'kW', v => v.W1 + v.W2], ['ph', 'Angle ϕ', '°', v => deg(Math.atan(sq(3) * (v.W1 - v.W2) / (v.W1 + v.W2)))], ['pf', 'Power factor', '', v => Math.cos(rad(v.ph))], ['Q', 'Reactive power', 'kVAR', v => sq(3) * (v.W1 - v.W2)]],
    ck: [[{ W1: 5, W2: 3 }, { P: 8, pf: 0.918 }, 'Vol 2 p 423 · Sum 4'], [{ W1: 5, W2: 0 }, { pf: 0.5 }, 'Vol 2 p 417 · quick check'], [{ W1: 4, W2: 4 }, { pf: 1 }, 'Vol 2 p 423 · R2'], [{ W1: 8, W2: 2 }, { P: 10, pf: 0.693 }, 'Vol 3 p 825 · Sum 11'], [{ W1: 8, W2: 4 }, { pf: 0.866 }, 'Vol 3 p 812 · one-minute sum'], [{ W1: 5, W2: -1 }, { P: 4 }, 'Vol 3 p 812 · one-minute sum'], [{ W1: 2, W2: 1 }, { pf: 0.866 }, 'Vol 3 p 812 · key-formula example']] });

  /* ---------- Two-Port Networks ---------- */
  lab(429, { n: 'Z parameters → ABCD, reciprocity and symmetry', rf: 'Z parameters', c: 'Reciprocal: Z₁₂ = Z₂₁ (AD − BC = 1). Symmetric: also Z₁₁ = Z₂₂ (A = D).',
    i: [['z11', 'Z₁₁', 'Ω', 10, -100, 100, 0.5], ['z12', 'Z₁₂', 'Ω', 5, -100, 100, 0.5], ['z21', 'Z₂₁', 'Ω', 5, -100, 100, 0.5], ['z22', 'Z₂₂', 'Ω', 20, -100, 100, 0.5]],
    o: [['dz', 'ΔZ', 'Ω²', v => v.z11 * v.z22 - v.z12 * v.z21], ['A', 'A', '', v => v.z11 / v.z21], ['B', 'B', 'Ω', v => v.dz / v.z21], ['C', 'C', 'S', v => 1 / v.z21], ['D', 'D', '', v => v.z22 / v.z21],
      ['rec', 'Reciprocal?', '', v => v.z12 === v.z21 ? 'yes' : 'no'], ['sym', 'Symmetric?', '', v => v.z12 === v.z21 && v.z11 === v.z22 ? 'yes' : 'no']],
    ck: [[{ z11: 10, z12: 5, z21: 5, z22: 20 }, { rec: 'yes', sym: 'no' }, 'Vol 2 p 434 · Sum 1']] });
  lab(429, { n: 'ABCD parameters — checks and inverse', rf: 'ABCD', c: 'Reciprocal ⇔ AD − BC = 1; symmetric ⇔ A = D. Inverse transmission: A′ = D/Δ, B′ = B/Δ, C′ = C/Δ, D′ = A/Δ.',
    i: [['A', 'A', '', 2, -10, 10, 0.1], ['B', 'B', 'Ω', 3, -100, 100, 0.1], ['C', 'C', 'S', 1, -10, 10, 0.01], ['D', 'D', '', 2, -10, 10, 0.1]],
    o: [['dt', 'Δ = AD − BC', '', v => v.A * v.D - v.B * v.C], ['rec', 'Reciprocal?', '', v => Math.abs(v.dt - 1) < 1e-9 ? 'yes' : 'no'], ['sym', 'Symmetric?', '', v => v.A === v.D ? 'yes' : 'no'],
      ['Ai', 'A′', '', v => v.D / v.dt], ['Bi', 'B′', 'Ω', v => v.B / v.dt], ['Ci', 'C′', 'S', v => v.C / v.dt], ['Di', 'D′', '', v => v.A / v.dt]],
    ck: [[{ A: 2, B: 3, C: 1, D: 2 }, { rec: 'yes', sym: 'yes' }, 'Vol 2 p 434 · Sum 2'], [{ A: 2, B: 3, C: 1, D: 2 }, { Ai: 2, Bi: 3, Ci: 1, Di: 2 }, 'Vol 2 p 435 · Sum 7']] });
  lab(429, { n: 'Cascade: series Z then shunt Y', rf: 'ABCD', c: '[1 Z; 0 1] × [1 0; Y 1] = [1 + ZY  Z; Y  1].',
    i: [['Z', 'Series Z', 'Ω', 10, 0, 1000, 0.1], ['Y', 'Shunt Y', 'S', 0.1, 0, 10, 0.001]],
    o: [['A', 'A', '', v => 1 + v.Z * v.Y], ['B', 'B', 'Ω', v => v.Z], ['C', 'C', 'S', v => v.Y], ['D', 'D', '', v => 1]],
    ck: [[{ Z: 10, Y: 0.1 }, { A: 2, B: 10, C: 0.1, D: 1 }, 'Vol 2 p 435 · Sum 5'], [{ Z: 10, Y: 0 }, { A: 1, B: 10, C: 0, D: 1 }, 'Vol 2 p 435 · Sum 3']] });
  lab(429, { n: 'h parameters → g parameters', rf: 'h parameters', c: 'g = h⁻¹: g₁₁ = h₂₂/Δh, g₁₂ = −h₁₂/Δh, g₂₁ = −h₂₁/Δh, g₂₂ = h₁₁/Δh.',
    i: [['h11', 'h₁₁', 'Ω', 2, -100, 100, 0.1], ['h12', 'h₁₂', '', 0.5, -10, 10, 0.01], ['h21', 'h₂₁', '', -0.5, -100, 100, 0.01], ['h22', 'h₂₂', 'S', 0.25, -10, 10, 0.01]],
    o: [['dh', 'Δh', '', v => v.h11 * v.h22 - v.h12 * v.h21], ['g11', 'g₁₁', 'S', v => v.h22 / v.dh], ['g12', 'g₁₂', '', v => -v.h12 / v.dh], ['g21', 'g₂₁', '', v => -v.h21 / v.dh], ['g22', 'g₂₂', 'Ω', v => v.h11 / v.dh]],
    ck: [[{ h11: 2, h12: 0.5, h21: -0.5, h22: 0.25 }, { g11: 0.333, g12: -0.667, g21: 0.667, g22: 2.667 }, 'Vol 2 p 435 · Sum 6']] });
  lab(429, { n: 'T network Z parameters', rf: 'T-network', c: 'Z₁₁ = Za + Zc, Z₂₂ = Zb + Zc, Z₁₂ = Z₂₁ = Zc (shunt arm).',
    i: [['Za', 'Series arm Za', 'Ω', 1, 0, 100, 0.1], ['Zb', 'Series arm Zb', 'Ω', 1, 0, 100, 0.1], ['Zc', 'Shunt arm Zc', 'Ω', 2, 0, 100, 0.1]],
    o: [['z11', 'Z₁₁', 'Ω', v => v.Za + v.Zc], ['z22', 'Z₂₂', 'Ω', v => v.Zb + v.Zc], ['z12', 'Z₁₂ = Z₂₁', 'Ω', v => v.Zc]],
    ck: [[{ Za: 1, Zb: 1, Zc: 2 }, { z11: 3 }, 'Vol 2 p 429 · quick check']] });

  /* ---------- Electromagnetic Fields ---------- */
  lab(440, { n: 'Coulomb’s law', rf: 'Coulomb', c: 'F = q₁q₂/(4πε₀εᵣr²) = 9 × 10⁹ q₁q₂/r² in air. Double both charges and the distance → same force.',
    i: [['q1', 'q₁', 'µC', 1, -100, 100, 0.01], ['q2', 'q₂', 'µC', 1, -100, 100, 0.01], ['r', 'Distance r', 'm', 0.1, 0.001, 10, 0.001, 'log'], ['er', 'εᵣ', '', 1, 1, 100, 0.1]],
    o: [['F', 'Force', 'N', v => K * v.q1 * 1e-6 * v.q2 * 1e-6 / (v.er * v.r * v.r)], ['kind', 'Kind', '', v => v.q1 * v.q2 >= 0 ? 'repulsion' : 'attraction']],
    ck: [[{ q1: 1, q2: 1, r: 0.1 }, { F: 0.9 }, 'Vol 2 p 453 · Sum 1'], [{ q1: 1, q2: 1, r: 1 }, { F: 0.009 }, 'Vol 2 p 443 · key-formula example'], [{ q1: 2, q2: 2, r: 0.2 }, { F: 0.9 }, 'Vol 2 p 457 · R1 (all doubled → same)']] });
  lab(440, { n: 'Field and potential of a point charge', rf: 'Electric field', c: 'E = Q/(4πε₀r²) falls as 1/r²; V = Q/(4πε₀r) falls as 1/r.',
    i: [['Q', 'Charge Q', 'nC', 1, -10000, 10000, 0.01], ['r', 'Distance r', 'm', 1, 0.001, 100, 0.001, 'log']],
    o: [['E', 'Field E', 'V/m', v => K * v.Q * 1e-9 / (v.r * v.r)], ['V', 'Potential V', 'V', v => K * v.Q * 1e-9 / v.r]],
    plot: { x: ['r', 'Distance r', 'm', 0.1, 10, 'log'], y: [['E', (x, v) => K * v.Q * 1e-9 / (x * x)], ['V', (x, v) => K * v.Q * 1e-9 / x]], yl: 'E (V/m) and V (V)', mark: v => v.r },
    ck: [[{ Q: 1, r: 1 }, { E: 9 }, 'Vol 2 p 453 · Sum 2'], [{ Q: 1000, r: 3 }, { E: 1000 }, 'Vol 2 p 443 · one-minute sum']] });
  lab(440, { n: 'Infinite line and sheet of charge', rf: 'Electric field', c: 'Line: E = λ/(2πε₀r), halves when r doubles. Sheet: E = ρs/(2ε₀), the same at every distance.',
    i: [['lam', 'Line charge λ', 'nC/m', 2, 0.01, 10000, 0.01, 'log'], ['r', 'Distance from line', 'm', 0.5, 0.001, 100, 0.001, 'log'], ['rs', 'Sheet charge ρs', 'µC/m²', 1, 0.001, 1000, 0.001, 'log']],
    o: [['El', 'Field of the line', 'V/m', v => v.lam * 1e-9 / (2 * PI * e0 * v.r)], ['Es', 'Field of the sheet', 'kV/m', v => v.rs * 1e-6 / (2 * e0) / 1000]],
    ck: [[{ lam: 2, r: 0.5 }, { El: 71.9 }, 'Vol 2 p 454 · Sum 6'], [{ rs: 1 }, { Es: 56.5 }, 'Vol 2 p 454 · Sum 7']] });
  lab(440, { n: 'Energy stored in an electric field', rf: 'Energy density', c: 'u = ½ε₀εᵣE² J/m³ (and ½B²/μ for a magnetic field).',
    i: [['E', 'Field E', 'kV/mm', 1, 0.001, 100, 0.001, 'log'], ['er', 'εᵣ', '', 1, 1, 100, 0.1]],
    o: [['u', 'Energy density', 'J/m³', v => 0.5 * e0 * v.er * (v.E * 1e6) ** 2]],
    ck: [[{ E: 1, er: 1 }, { u: 4.43 }, 'Vol 2 p 455 · Sum 8']] });
  lab(440, { n: 'Magnetic field of a long wire', rf: 'Magnetic field of conductors', c: 'H = I/(2πr), B = μ₀I/(2πr): halves when the distance doubles.',
    i: [['I', 'Current I', 'A', 10, 0.01, 10000, 0.01, 'log'], ['r', 'Distance r', 'm', 0.1, 0.001, 10, 0.001, 'log']],
    o: [['H', 'H', 'A/m', v => v.I / (2 * PI * v.r)], ['B', 'B', 'µT', v => mu0 * v.H * 1e6]],
    ck: [[{ I: 10, r: 0.1 }, { B: 20 }, 'Vol 2 p 454 · Sum 4 (2 × 10⁻⁵ T)'], [{ I: 10, r: 0.5 }, { H: 3.18 }, 'Vol 2 p 441 · quick check'], [{ I: 10, r: 0.02 }, { B: 100 }, 'Vol 2 p 443 · one-minute sum']] });
  lab(440, { n: 'Solenoid — H, B and inductance', rf: 'Inductance', c: 'H = NI/l, B = μ₀μᵣNI/l, L = μ₀μᵣN²A/l. Double the turns → L × 4.',
    i: [['N', 'Turns N', '', 1000, 1, 10000, 1], ['l', 'Length l', 'm', 0.5, 0.01, 10, 0.01], ['I', 'Current I', 'A', 2, 0.01, 100, 0.01], ['A', 'Area A', 'cm²', 4, 0.01, 1000, 0.01, 'log'], ['mr', 'μᵣ of the core', '', 1, 1, 10000, 1, 'log']],
    o: [['H', 'H inside', 'A/m', v => v.N * v.I / v.l], ['B', 'B inside', 'mT', v => mu0 * v.mr * v.H * 1e3], ['L', 'Inductance', 'mH', v => mu0 * v.mr * v.N * v.N * v.A * 1e-4 / v.l * 1e3]],
    ck: [[{ N: 1000, l: 0.5, I: 2 }, { H: 4000, B: 5.03 }, 'Vol 2 p 455 · Sum 9'], [{ N: 500, A: 4, l: 0.2 }, { L: 0.628 }, 'Vol 2 p 455 · Sum 10']] });
  lab(440, { n: 'Force between parallel conductors', rf: 'Force between parallel', c: 'F/l = μ₀I₁I₂/(2πd). Same direction attract, opposite repel.',
    i: [['I1', 'I₁', 'A', 100, 0.1, 100000, 0.1, 'log'], ['I2', 'I₂', 'A', 100, 0.1, 100000, 0.1, 'log'], ['d', 'Spacing d', 'm', 0.2, 0.001, 10, 0.001, 'log']],
    o: [['F', 'Force per metre', 'N/m', v => mu0 * v.I1 * v.I2 / (2 * PI * v.d)]],
    ck: [[{ I1: 100, I2: 100, d: 0.2 }, { F: 0.01 }, 'Vol 2 p 455 · Sum 11']] });
  lab(440, { n: 'Motional EMF and force on a conductor', rf: 'Force on conductor', c: 'e = Blv (generator action), F = BIl (motor action).',
    i: [['B', 'Flux density B', 'T', 0.5, 0.01, 3, 0.01], ['l', 'Length l', 'm', 1, 0.01, 10, 0.01], ['u', 'Speed v', 'm/s', 10, 0, 100, 0.1], ['I', 'Current I', 'A', 10, 0, 1000, 0.1]],
    o: [['e', 'Induced EMF', 'V', v => v.B * v.l * v.u], ['F', 'Force', 'N', v => v.B * v.I * v.l]],
    ck: [[{ B: 0.5, l: 1, u: 10 }, { e: 5 }, 'Vol 2 p 454 · Sum 5'], [{ B: 0.5, l: 0.2, I: 10 }, { F: 1 }, 'Vol 2 p 454 · Sum 5']] });
  lab(440, { n: 'Magnetic circuit with an air gap', rf: 'Magnetic circuit', c: 'S = l/(μ₀μᵣA). A 1 mm gap has the reluctance of a long iron path, so the flux drops sharply.',
    i: [['lm', 'Iron path length', 'm', 0.5, 0.01, 5, 0.01], ['A', 'Area A', 'cm²', 5, 0.1, 1000, 0.1, 'log'], ['mr', 'μᵣ of iron', '', 1000, 1, 10000, 1, 'log'], ['N', 'Turns N', '', 500, 1, 10000, 1], ['I', 'Current I', 'A', 1, 0.01, 100, 0.01], ['g', 'Air gap', 'mm', 0, 0, 10, 0.01]],
    o: [['Si', 'Iron reluctance', 'AT/Wb', v => v.lm / (mu0 * v.mr * v.A * 1e-4)], ['Sg', 'Gap reluctance', 'AT/Wb', v => v.g * 1e-3 / (mu0 * v.A * 1e-4)], ['phi', 'Flux Φ', 'mWb', v => v.N * v.I / (v.Si + v.Sg) * 1e3], ['Bf', 'Flux density B', 'T', v => v.phi * 1e-3 / (v.A * 1e-4)]],
    ck: [[{ lm: 0.5, A: 5, mr: 1000, N: 500, I: 1, g: 0 }, { Si: 7.96e5, phi: 0.628 }, 'Vol 2 p 456 · Sum 12'], [{ lm: 0.5, A: 5, mr: 1000, N: 500, I: 1, g: 1 }, { phi: 0.209 }, 'Vol 2 p 456 · Sum 13']] });
  lab(440, { n: 'Plane wave in a medium', rf: 'EM waves', c: 'v = c/√(μᵣεᵣ), λ = v/f, η = 377√(μᵣ/εᵣ) Ω.',
    i: [['f', 'Frequency', 'MHz', 100, 0.001, 100000, 0.001, 'log'], ['er', 'εᵣ', '', 9, 1, 100, 0.1], ['mr', 'μᵣ', '', 1, 1, 100, 0.1]],
    o: [['u', 'Speed v', 'm/s', v => 1 / sq(mu0 * v.mr * e0 * v.er)], ['lam', 'Wavelength λ', 'm', v => v.u / (v.f * 1e6)], ['eta', 'Intrinsic impedance η', 'Ω', v => sq(mu0 * v.mr / (e0 * v.er))]],
    ck: [[{ f: 100, er: 9, mr: 1 }, { u: 1e8, lam: 1, eta: 125.7 }, 'Vol 2 p 456 · Sum 14']] });
  lab(440, { n: 'Displacement current density', rf: 'Maxwell', c: 'Jd = ∂D/∂t: for E = Em sin ωt, the peak Jd = ωε₀εᵣEm.',
    i: [['Em', 'Peak field Em', 'V/m', 10, 0.01, 1e6, 0.01, 'log'], ['w', 'ω', 'rad/s', 1e6, 1, 1e12, 1, 'log'], ['er', 'εᵣ', '', 1, 1, 100, 0.1]],
    o: [['Jd', 'Peak Jd', 'µA/m²', v => v.w * e0 * v.er * v.Em * 1e6]],
    ck: [[{ Em: 10, w: 1e6, er: 1 }, { Jd: 88.5 }, 'Vol 2 p 456 · Sum 15']] });
  lab(440, { n: 'Skin depth', rf: 'Skin depth', c: 'δ = 1/√(πfμσ): higher frequency or better conductor → thinner skin.',
    i: [['f', 'Frequency', 'Hz', 50, 1, 1e9, 1, 'log'], ['s', 'Conductivity σ', 'MS/m', 58, 0.1, 100, 0.1], ['mr', 'μᵣ', '', 1, 1, 10000, 1, 'log']],
    o: [['d', 'Skin depth δ', 'mm', v => 1 / sq(PI * v.f * mu0 * v.mr * v.s * 1e6) * 1e3]], ck: [] });
  lab(440, { n: 'Lifting force of a magnet', rf: 'Coupled-coil energy', c: 'Pull per pole face F = B²A/(2μ₀).',
    i: [['B', 'Flux density B', 'T', 1, 0.01, 3, 0.01], ['A', 'Pole-face area', 'cm²', 1, 0.1, 10000, 0.1, 'log']],
    o: [['F', 'Pull', 'N', v => v.B * v.B * v.A * 1e-4 / (2 * mu0)]],
    ck: [[{ B: 1, A: 1 }, { F: 39.8 }, 'Vol 2 p 442 · quick check']] });

  /* ---------- Code 400 · Fields: charge configurations & coupled circuits ---------- */
  lab(468, { n: 'Coupled coils in series and parallel', rf: 'Series coupled', c: 'Series: L = L₁ + L₂ ± 2M. Parallel: L = (L₁L₂ − M²)/(L₁ + L₂ ∓ 2M). k = M/√(L₁L₂).',
    i: [['L1', 'L₁', 'H', 2, 0.01, 100, 0.01], ['L2', 'L₂', 'H', 8, 0.01, 100, 0.01], ['M', 'Mutual M', 'H', 3, 0, 100, 0.01]],
    o: [['k', 'Coupling k', '', v => v.M / sq(v.L1 * v.L2)], ['La', 'Series aiding', 'H', v => v.L1 + v.L2 + 2 * v.M], ['Lo', 'Series opposing', 'H', v => v.L1 + v.L2 - 2 * v.M], ['Pa', 'Parallel aiding', 'H', v => (v.L1 * v.L2 - v.M ** 2) / (v.L1 + v.L2 - 2 * v.M)]],
    ck: [[{ L1: 2, L2: 8, M: 3 }, { La: 16, Lo: 4 }, 'Vol 2 p 471 · Sum 1']] });
  lab(468, { n: 'Reluctance of an air gap', rf: 'air gap', c: 'S_gap = l_g/(μ₀A): 1 mm of air over 10 cm² ≈ 8 × 10⁵ AT/Wb.',
    i: [['g', 'Gap length', 'mm', 1, 0.01, 50, 0.01], ['A', 'Area', 'm²', 0.001, 0.00001, 1, 0.00001, 'log']],
    o: [['S', 'Gap reluctance', 'AT/Wb', v => v.g * 1e-3 / (mu0 * v.A)]],
    ck: [[{ g: 1, A: 0.001 }, { S: 7.96e5 }, 'Vol 2 p 471 · Sum 2']] });
  lab(468, { n: 'Capacitance of a sphere and of a spherical capacitor', rf: 'Capacitance configurations', c: 'Isolated sphere C = 4πε₀εᵣa; concentric spheres C = 4πε₀εᵣab/(b − a).',
    i: [['a', 'Inner radius a', 'cm', 5, 0.1, 100, 0.1], ['b', 'Outer radius b', 'cm', 10, 0.2, 200, 0.1], ['er', 'εᵣ', '', 1, 1, 100, 0.1]],
    o: [['Ci', 'Isolated sphere (radius a)', 'pF', v => 4 * PI * e0 * v.er * v.a * 1e-2 * 1e12], ['Cs', 'Spherical capacitor', 'pF', v => 4 * PI * e0 * v.er * v.a * v.b * 1e-4 / ((v.b - v.a) * 1e-2) * 1e12]], ck: [] });
})();
