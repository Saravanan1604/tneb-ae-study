/* Power Systems labs (generation, renewables, storage, lines, HVDC, cables, faults, stability, protection). Checks are the book's numbers. */
(() => {
  const PI = Math.PI, sq = Math.sqrt, deg = x => x * 180 / PI, rad = x => x * PI / 180, e0 = 8.854e-12;

  /* ---------- Generation & economics ---------- */
  lab([580, 601], { n: 'Load, demand, diversity and capacity factors', rf: 'Load factor', c: 'LF = average/maximum demand, DF = maximum demand/connected load (≤ 1), diversity = Σ individual maxima/group maximum (≥ 1), capacity factor = average/installed capacity.',
    i: [['avg', 'Average load', 'MW', 50, 0.1, 10000, 0.1], ['md', 'Maximum demand', 'MW', 100, 0.1, 10000, 0.1], ['cl', 'Connected load', 'MW', 125, 0.1, 20000, 0.1], ['cap', 'Installed capacity', 'MW', 200, 0.1, 20000, 0.1], ['sim', 'Σ individual maximum demands', 'MW', 130, 0.1, 20000, 0.1]],
    o: [['LF', 'Load factor', '', v => v.avg / v.md], ['DF', 'Demand factor', '', v => v.md / v.cl], ['Div', 'Diversity factor', '', v => v.sim / v.md], ['CF', 'Capacity factor', '', v => v.avg / v.cap], ['UF', 'Utilisation factor', '', v => v.md / v.cap], ['E', 'Energy per year', 'GWh', v => v.avg * 8760 / 1000]],
    ck: [[{ avg: 50, md: 100 }, { LF: 0.5, E: 438 }, 'Vol 2 p 591 · Sum 1'], [{ avg: 50, cap: 200 }, { CF: 0.25 }, 'Vol 2 p 591 · Sum 2'], [{ md: 80, cl: 100 }, { DF: 0.8 }, 'Vol 2 p 592 · Sum 4'], [{ avg: 60, md: 100 }, { LF: 0.6 }, 'Vol 2 p 581 · quick check'], [{ avg: 50, cap: 100 }, { CF: 0.5, E: 438 }, 'Vol 2 p 592 · R2'],
      [{ md: 50, avg: 30, cap: 60 }, { LF: 0.6, CF: 0.5 }, 'Vol 3 p 603 · Sum 2'], [{ avg: 60, cap: 100 }, { E: 525.6 }, 'Vol 3 p 603 · R2']] });
  lab([580, 614], { n: 'Hydro power', rf: 'Hydro power', c: 'P = 9.81 Q H η kW (Q in m³/s, H in m). Power is proportional to both flow and head.',
    i: [['Q', 'Discharge Q', 'm³/s', 20, 0.01, 1000, 0.01, 'log'], ['H', 'Head H', 'm', 100, 1, 1000, 1], ['eta', 'Efficiency η', '', 0.85, 0.3, 1, 0.01]],
    o: [['P', 'Power', 'kW', v => 9.81 * v.Q * v.H * v.eta], ['E', 'Energy per day', 'MWh', v => v.P * 24 / 1000]],
    ck: [[{ Q: 20, H: 100, eta: 0.85 }, { P: 16700 }, 'Vol 2 p 592 · Sum 3'], [{ Q: 10, H: 50, eta: 0.9 }, { P: 4415 }, 'Vol 2 p 581 · key-formula example'], [{ Q: 20, H: 30, eta: 0.85 }, { P: 5000 }, 'Vol 2 p 581 · one-minute sum'], [{ Q: 0.5, H: 20, eta: 0.8 }, { P: 78.5 }, 'Vol 3 p 617 · Sum 2']] });
  lab([580, 614], { n: 'Wind turbine power', rf: 'Wind power', c: 'P = ½ρπR²v³Cp: twice the wind speed gives 8 × the power, twice the rotor diameter 4 ×. Cp can never exceed the Betz limit 16/27 = 0.593. Tip-speed ratio λ = ωR/v.',
    i: [['rho', 'Air density ρ', 'kg/m³', 1.225, 0.9, 1.4, 0.001], ['R', 'Rotor radius R', 'm', 40, 1, 150, 0.5], ['v', 'Wind speed v', 'm/s', 10, 0, 30, 0.1], ['Cp', 'Power coefficient Cp', '', 0.4, 0, 0.593, 0.001], ['N', 'Rotor speed', 'rpm', 15, 1, 100, 0.5]],
    o: [['A', 'Swept area', 'm²', v => PI * v.R * v.R], ['Pw', 'Power in the wind', 'kW', v => 0.5 * v.rho * v.A * v.v ** 3 / 1000], ['P', 'Turbine power', 'kW', v => v.Pw * v.Cp], ['Pb', 'Betz maximum', 'kW', v => v.Pw * 16 / 27], ['pd', 'Power density ½ρv³', 'W/m²', v => 0.5 * v.rho * v.v ** 3], ['lam', 'Tip-speed ratio λ', '', v => 2 * PI * v.N / 60 * v.R / v.v]],
    plot: { x: ['v', 'Wind speed', 'm/s', 0, 25, ''], y: [['turbine power (kW)', (x, v) => 0.5 * v.rho * PI * v.R * v.R * x ** 3 * v.Cp / 1000], ['Betz limit (kW)', (x, v) => 0.5 * v.rho * PI * v.R * v.R * x ** 3 * 16 / 27 / 1000]], yl: 'Power (kW)', mark: v => v.v },
    ck: [[{ rho: 1.225, R: 40, v: 10, Cp: 0.4 }, { P: 1230 }, 'Vol 2 p 583 · key-formula example'], [{ rho: 1.225, R: 20, v: 10, Cp: 0.4 }, { P: 308 }, 'Vol 2 p 583 · one-minute sum'], [{ rho: 1.225, R: 20, v: 10, Cp: 0.4 }, { P: 308 }, 'Vol 3 p 617 · Sum 1']] });
  lab([580, 607], { n: 'Solar PV energy yield', rf: 'PV energy yield', c: 'E (kWh/day) = kWp × peak sun hours × performance ratio PR.',
    i: [['kWp', 'Plant size', 'kWp', 5, 0.1, 10000, 0.1], ['psh', 'Peak sun hours', 'h/day', 5, 1, 8, 0.1], ['PR', 'Performance ratio', '', 0.8, 0.5, 1, 0.01]],
    o: [['Ed', 'Energy per day', 'kWh', v => v.kWp * v.psh * v.PR], ['Ey', 'Energy per year', 'kWh', v => v.Ed * 365], ['CUF', 'Capacity utilisation factor', '%', v => v.Ed / (v.kWp * 24) * 100]],
    ck: [[{ kWp: 5, psh: 5, PR: 1 }, { Ed: 25 }, 'Vol 2 p 592 · Sum 5'], [{ kWp: 3, psh: 4.5, PR: 0.8 }, { Ed: 10.8, Ey: 3942 }, 'Vol 2 p 582 · key-formula example'], [{ kWp: 5, psh: 5, PR: 0.8 }, { Ed: 20 }, 'Vol 2 p 582 · one-minute sum']] });
  lab([580, 607], { n: 'PV module — fill factor and efficiency', rf: 'Fill factor', c: 'FF = Pmax/(Voc·Isc) = VmpImp/(VocIsc). η = Pmax/(G × A).',
    i: [['Voc', 'Open-circuit voltage Voc', 'V', 22, 0.1, 1500, 0.1], ['Isc', 'Short-circuit current Isc', 'A', 5, 0.01, 50, 0.01], ['Pm', 'Maximum power Pmax', 'W', 82.5, 0.1, 1000, 0.1], ['G', 'Irradiance G', 'W/m²', 1000, 100, 1200, 10], ['A', 'Module area', 'm²', 0.6, 0.01, 5, 0.01]],
    o: [['FF', 'Fill factor', '', v => v.Pm / (v.Voc * v.Isc)], ['eta', 'Efficiency', '%', v => v.Pm / (v.G * v.A) * 100]],
    ck: [[{ Voc: 22, Isc: 5, Pm: 82.5 }, { FF: 0.75 }, 'Vol 3 p 610 · Sum 1'], [{ Voc: 40, Isc: 9, Pm: 270 }, { FF: 0.75 }, 'Vol 2 p 582 · one-minute sum'], [{ Voc: 0.6, Isc: 3.2, Pm: 1.5 }, { FF: 0.78 }, 'Vol 3 p 607 · quick check'], [{ Pm: 256, G: 1000, A: 1.6 }, { eta: 16 }, 'Vol 3 p 610 · Sum 2']] });
  lab(607, { n: 'PV array — cells in series and parallel', rf: 'Series / parallel PV', c: 'Ns cells in series multiply the voltage, Np strings in parallel multiply the current; P = Ns·Np·Pcell.',
    i: [['Vc', 'Cell voltage', 'V', 0.5, 0.1, 1, 0.01], ['Ic', 'Cell current', 'A', 3, 0.1, 15, 0.1], ['Ns', 'Cells in series', '', 36, 1, 200, 1], ['Np', 'Strings in parallel', '', 1, 1, 100, 1]],
    o: [['V', 'Array voltage', 'V', v => v.Vc * v.Ns], ['I', 'Array current', 'A', v => v.Ic * v.Np], ['P', 'Array power', 'W', v => v.V * v.I]],
    ck: [[{ Vc: 0.5, Ns: 36 }, { V: 18 }, 'Vol 3 p 611 · R3']] });
  lab(607, { n: 'PV cell I–V and P–V curves', rf: 'PV cell equation', c: 'I = IL − I₀(e^(V/nVt·Ns) − 1). Less sunlight lowers the current (and power) almost in proportion; heat lowers Voc and the power. The maximum-power point sits near 0.76–0.8 Voc.',
    i: [['G', 'Irradiance G', 'W/m²', 1000, 50, 1200, 10], ['T', 'Cell temperature', '°C', 25, -10, 80, 1], ['Isc', 'Cell Isc at STC', 'A', 8, 0.5, 15, 0.1], ['Ns', 'Cells in series', '', 36, 1, 144, 1], ['n', 'Ideality factor n', '', 1.3, 1, 2, 0.01]],
    o: [['Vt', 'Thermal voltage', 'mV', v => 1.380649e-23 * (v.T + 273.15) / 1.602177e-19 * 1000], ['I0', 'Saturation current I₀', 'A', v => 1e-9 * ((v.T + 273.15) / 298.15) ** 3 * Math.exp(1.12 / (v.n * 8.617e-5) * (1 / 298.15 - 1 / (v.T + 273.15)))],
      ['IL', 'Light current IL', 'A', v => v.Isc * v.G / 1000], ['Voc', 'Module Voc', 'V', v => v.Ns * v.n * v.Vt / 1000 * Math.log(v.IL / v.I0 + 1)],
      ['Pm', 'Maximum power', 'W', v => { let b = 0; for (let k = 1; k < 400; k++) { const V = v.Voc * k / 400, I = v.IL - v.I0 * (Math.exp(V / (v.Ns * v.n * v.Vt / 1000)) - 1); b = Math.max(b, V * I); } return b; }],
      ['FF', 'Fill factor', '', v => v.Pm / (v.Voc * v.IL)]],
    plot: { x: ['V', 'Module voltage', 'V', 0, 26, ''], y: [['current (A)', (V, v) => { const I = v.IL - v.I0 * (Math.exp(V / (v.Ns * v.n * v.Vt / 1000)) - 1); return I >= 0 ? I : NaN; }], ['power ÷ 10 (W)', (V, v) => { const I = v.IL - v.I0 * (Math.exp(V / (v.Ns * v.n * v.Vt / 1000)) - 1); return I >= 0 ? V * I / 10 : NaN; }]], yl: 'Current (A) and power ÷ 10 (W)' }, ck: [] });
  lab([580, 696], { n: 'Economic dispatch of two units', rf: 'Economic dispatch', c: 'Lossless: run both units at the same incremental cost dC/dP = λ. With Ci = ai + biPi + ciPi², λ = (PD + Σbi/2ci)/(Σ1/2ci).',
    i: [['b1', 'Unit 1 b₁', 'Rs/MWh', 200, 0, 2000, 1], ['c1', 'Unit 1 c₁', 'Rs/MW²h', 0.5, 0.001, 10, 0.001], ['b2', 'Unit 2 b₂', 'Rs/MWh', 220, 0, 2000, 1], ['c2', 'Unit 2 c₂', 'Rs/MW²h', 0.4, 0.001, 10, 0.001], ['PD', 'Total demand', 'MW', 300, 1, 5000, 1]],
    o: [['lam', 'λ (incremental cost)', 'Rs/MWh', v => (v.PD + v.b1 / (2 * v.c1) + v.b2 / (2 * v.c2)) / (1 / (2 * v.c1) + 1 / (2 * v.c2))], ['P1', 'Unit 1 output', 'MW', v => (v.lam - v.b1) / (2 * v.c1)], ['P2', 'Unit 2 output', 'MW', v => (v.lam - v.b2) / (2 * v.c2)]], ck: [] });
  lab(580, { n: 'Two-part tariff and load factor', rf: 'Tariff', c: 'Bill = A × kW of maximum demand + B × kWh. A better load factor spreads the demand charge over more units, so the cost per unit falls.',
    i: [['A', 'Demand charge A', 'Rs/kW/yr', 1200, 0, 10000, 10], ['B', 'Energy charge B', 'Rs/kWh', 5, 0, 20, 0.1], ['MD', 'Maximum demand', 'kW', 100, 1, 100000, 1], ['LF', 'Load factor', '', 0.5, 0.05, 1, 0.01]],
    o: [['E', 'Energy per year', 'kWh', v => v.MD * v.LF * 8760], ['bill', 'Yearly bill', 'Rs', v => v.A * v.MD + v.B * v.E], ['u', 'Cost per unit', 'Rs/kWh', v => v.bill / v.E]],
    plot: { x: ['LF', 'Load factor', '', 0.05, 1, ''], y: [['cost per unit', (x, v) => (v.A * v.MD + v.B * v.MD * x * 8760) / (v.MD * x * 8760)]], yl: 'Rs per kWh', mark: v => v.LF }, ck: [] });
  lab(580, { n: 'Nuclear fission energy', rf: 'Nuclear fission', c: '≈ 200 MeV per fission of U-235; 1 kg fully fissioned ≈ 8 × 10¹³ J.',
    i: [['m', 'Mass of U-235 fissioned', 'g', 1000, 0.001, 100000, 0.001, 'log'], ['MeV', 'Energy per fission', 'MeV', 200, 150, 220, 1]],
    o: [['E', 'Energy', 'J', v => v.m / 235 * 6.022e23 * v.MeV * 1.602e-13], ['MWh', 'Energy', 'MWh', v => v.E / 3.6e9]],
    ck: [[{ m: 1000, MeV: 200 }, { E: 8e13 }, 'Vol 2 p 589 · formula 27', 0.03]] });
  lab([580, 601], { n: 'Heat rate and fuel', rf: 'Thermal plant', c: 'Heat rate = heat input per kWh; efficiency = 3600/heat rate. Fuel for the same energy is proportional to the heat rate.',
    i: [['h1', 'Heat rate before', 'kJ/kWh', 10000, 7000, 16000, 10], ['h2', 'Heat rate after', 'kJ/kWh', 9000, 7000, 16000, 10]],
    o: [['e1', 'Efficiency before', '%', v => 3600 / v.h1 * 100], ['e2', 'Efficiency after', '%', v => 3600 / v.h2 * 100], ['df', 'Change in fuel', '%', v => (v.h2 / v.h1 - 1) * 100]],
    ck: [[{ h1: 10000, h2: 9000 }, { df: -10 }, 'Vol 3 p 603 · R1']] });
  lab(601, { n: 'Depreciation — straight line and sinking fund', rf: 'Depreciation', c: 'Straight line: (P − S)/n per year. Sinking fund: q = (P − S)r/[(1 + r)ⁿ − 1], smaller because the deposits earn interest.',
    i: [['P', 'Cost P', 'Rs crore', 10, 0.1, 10000, 0.1], ['S', 'Salvage S', 'Rs crore', 1, 0, 1000, 0.1], ['n', 'Life n', 'years', 20, 1, 60, 1], ['r', 'Interest rate', '%', 8, 0.1, 20, 0.1]],
    o: [['sl', 'Straight-line per year', 'Rs crore', v => (v.P - v.S) / v.n], ['sf', 'Sinking-fund deposit per year', 'Rs crore', v => (v.P - v.S) * (v.r / 100) / ((1 + v.r / 100) ** v.n - 1)]],
    ck: [[{ P: 10, S: 1, n: 20 }, { sl: 0.45 }, 'Vol 3 p 602 · Sum 1']] });
  lab(601, { n: 'Pumped storage and cogeneration', rf: 'Pumped-storage', c: 'Pumped storage: η = ηpump × ηturbine (≈ 70–80 %). CHP: (electricity + useful heat)/fuel (≈ 70–90 %).',
    i: [['ep', 'Pump efficiency', '', 0.88, 0.5, 1, 0.01], ['et', 'Turbine efficiency', '', 0.9, 0.5, 1, 0.01], ['Pe', 'CHP electricity', 'MW', 30, 0, 1000, 1], ['Qh', 'CHP useful heat', 'MW', 45, 0, 1000, 1], ['F', 'CHP fuel input', 'MW', 100, 1, 3000, 1]],
    o: [['eps', 'Pumped storage overall', '%', v => v.ep * v.et * 100], ['chp', 'CHP overall', '%', v => (v.Pe + v.Qh) / v.F * 100]], ck: [] });

  /* ---------- Storage, EV ---------- */
  lab([621, 998, 1055], { n: 'Battery bank and UPS — energy and backup time', rf: 'Battery energy', c: 'E = V × Ah. Series adds volts, parallel adds Ah; both store the same energy. Backup = E × DOD × inverter η/load.',
    i: [['V', 'Battery voltage', 'V', 12, 1, 800, 0.1], ['Ah', 'Capacity', 'Ah', 150, 1, 5000, 1], ['ns', 'In series', '', 1, 1, 50, 1], ['np', 'In parallel', '', 1, 1, 50, 1], ['dod', 'Depth of discharge', '', 0.8, 0.1, 1, 0.01], ['eta', 'Inverter efficiency', '', 0.9, 0.5, 1, 0.01], ['L', 'Load', 'W', 360, 1, 100000, 1], ['pf', 'Load power factor', '', 0.8, 0.3, 1, 0.01]],
    o: [['Vb', 'Bank voltage', 'V', v => v.V * v.ns], ['Ab', 'Bank capacity', 'Ah', v => v.Ah * v.np], ['E', 'Stored energy', 'kWh', v => v.Vb * v.Ab / 1000], ['t', 'Backup time', 'h', v => v.E * 1000 * v.dod * v.eta / v.L], ['VA', 'UPS rating W/pf', 'kVA', v => v.L / v.pf / 1000]],
    ck: [[{ V: 12, Ah: 150, ns: 1, np: 1, dod: 0.8, eta: 0.9, L: 360 }, { t: 3.6 }, 'Vol 3 p 623 · Sum 1'], [{ V: 12, Ah: 100, ns: 2, np: 1 }, { Vb: 24, Ab: 100, E: 2.4 }, 'Vol 3 p 623 · R1'], [{ V: 12, Ah: 100, ns: 1, np: 2 }, { Vb: 12, Ab: 200, E: 2.4 }, 'Vol 3 p 623 · R1'], [{ V: 48, Ah: 100, ns: 1, np: 1, dod: 1, eta: 0.85, L: 600 }, { t: 6.8 }, 'Vol 4 p 1002 · Sum 1'], [{ L: 2000, pf: 0.8 }, { VA: 2.5 }, 'Vol 4 p 1002 · Sum 2'],
      [{ V: 12, Ah: 150, ns: 1, np: 1, dod: 0.8, eta: 0.85, L: 400 }, { t: 3.06 }, 'Vol 4 p 1056 · key-formula example'], [{ V: 24, Ah: 100, ns: 1, np: 1, dod: 0.8, eta: 0.9, L: 600 }, { t: 2.88 }, 'Vol 4 p 1056 · one-minute sum'], [{ V: 12, Ah: 200, ns: 1, np: 1 }, { E: 2.4 }, 'Vol 4 p 1056 · one-minute sum']] });
  lab(621, { n: 'C-rate and Peukert’s law', rf: 'Peukert', c: '1C empties the battery in 1 h. Ideal time = C/I; Peukert t = H(C/IH)^k shows that heavy currents give less than the rated Ah (k > 1).',
    i: [['C', 'Rated capacity C', 'Ah', 100, 1, 5000, 1], ['cr', 'C-rate', 'C', 0.5, 0.05, 5, 0.05], ['H', 'Rated discharge time H', 'h', 20, 1, 100, 1], ['k', 'Peukert constant k', '', 1, 1, 1.5, 0.01]],
    o: [['I', 'Current', 'A', v => v.cr * v.C], ['t0', 'Ideal time', 'h', v => v.C / v.I], ['t', 'Peukert time', 'h', v => v.H * (v.C / (v.I * v.H)) ** v.k]],
    ck: [[{ C: 100, cr: 0.5, k: 1 }, { I: 50, t0: 2 }, 'Vol 3 p 624 · R3']] });
  lab(621, { n: 'Battery efficiency — Ah and Wh', rf: 'Battery efficiency', c: 'Ah efficiency = Ah out/Ah in. Wh efficiency is lower, because the battery discharges at a lower voltage than it charges.',
    i: [['Ai', 'Ah charged', 'Ah', 120, 1, 10000, 1], ['Ao', 'Ah returned', 'Ah', 102, 1, 10000, 1], ['Vi', 'Average charging voltage', 'V', 2.3, 0.5, 5, 0.01], ['Vo', 'Average discharge voltage', 'V', 1.95, 0.5, 5, 0.01]],
    o: [['ah', 'Ah efficiency', '%', v => v.Ao / v.Ai * 100], ['wh', 'Wh efficiency', '%', v => v.Ao * v.Vo / (v.Ai * v.Vi) * 100]],
    ck: [[{ Ai: 120, Ao: 102 }, { ah: 85 }, 'Vol 3 p 623 · Sum 2']] });
  lab(621, { n: 'Supercapacitor and flywheel energy', rf: 'Supercapacitor', c: 'Capacitor: E = ½CV². Flywheel: E = ½Jω² — doubling the speed stores four times the energy.',
    i: [['C', 'Capacitance', 'F', 100, 0.1, 10000, 0.1, 'log'], ['V', 'Voltage', 'V', 2.7, 0.1, 1000, 0.1], ['J', 'Flywheel inertia J', 'kg·m²', 10, 0.01, 1000, 0.01, 'log'], ['N', 'Flywheel speed', 'rpm', 3000, 10, 50000, 10]],
    o: [['Ec', 'Capacitor energy', 'J', v => 0.5 * v.C * v.V * v.V], ['Ech', 'Capacitor energy', 'Wh', v => v.Ec / 3600], ['Ef', 'Flywheel energy', 'kJ', v => 0.5 * v.J * (2 * PI * v.N / 60) ** 2 / 1000]], ck: [] });
  lab(621, { n: 'Fuel-cell stack', rf: 'Fuel cell', c: 'Ideal cell voltage 1.23 V (practical 0.6–0.8 V); ideal efficiency ΔG/ΔH ≈ 83 %. Cells in series give the stack voltage.',
    i: [['n', 'Cells in series', '', 100, 1, 1000, 1], ['Vc', 'Cell voltage on load', 'V', 0.7, 0.3, 1.23, 0.01], ['I', 'Current', 'A', 100, 1, 1000, 1]],
    o: [['V', 'Stack voltage', 'V', v => v.n * v.Vc], ['P', 'Stack power', 'kW', v => v.V * v.I / 1000], ['ev', 'Voltage efficiency Vc/1.23', '%', v => v.Vc / 1.23 * 100]], ck: [] });
  lab(614, { n: 'Electric-vehicle range', rf: 'EV range', c: 'Range = usable battery energy/consumption per km.',
    i: [['E', 'Battery size', 'kWh', 30, 1, 200, 1], ['u', 'Usable fraction', '', 0.9, 0.5, 1, 0.01], ['c', 'Consumption', 'Wh/km', 140, 50, 400, 1]],
    o: [['R', 'Range', 'km', v => v.E * v.u * 1000 / v.c]], ck: [] });

  /* ---------- Transmission lines ---------- */
  lab(627, { n: 'Line constants — L, C, surge impedance and wave speed', rf: 'Inductance per phase', c: 'L = 2 × 10⁻⁷ ln(D/r′) H/m with r′ = 0.7788r; C = 2πε₀/ln(D/r). Their product is fixed, so the wave speed 1/√LC comes out close to light speed; Zc = √(L/C) ≈ 400 Ω for an overhead line.',
    i: [['D', 'Spacing D', 'm', 4, 0.1, 20, 0.01], ['r', 'Conductor radius r', 'cm', 1, 0.1, 5, 0.01], ['f', 'Frequency', 'Hz', 50, 1, 400, 1]],
    o: [['L', 'Inductance', 'mH/km', v => 2e-7 * Math.log(v.D / (0.7788 * v.r / 100)) * 1e6], ['C', 'Capacitance', 'nF/km', v => 2 * PI * e0 / Math.log(v.D / (v.r / 100)) * 1e12], ['X', 'Reactance', 'Ω/km', v => 2 * PI * v.f * v.L * 1e-3],
      ['Zc', 'Surge impedance', 'Ω', v => sq(v.L * 1e-3 / (v.C * 1e-9))], ['u', 'Wave speed', 'm/s', v => 1e3 / sq(v.L * 1e-3 * v.C * 1e-9)]], ck: [] });
  lab(627, { n: 'Surge impedance loading', rf: 'SIL', c: 'SIL = V²/Zc: at this load the line’s reactive power balances itself (flat voltage). SIL ∝ V².',
    i: [['V', 'Line voltage', 'kV', 400, 11, 1200, 1], ['Zc', 'Surge impedance Zc', 'Ω', 400, 20, 600, 1]],
    o: [['SIL', 'SIL', 'MW', v => v.V * v.V / v.Zc]],
    ck: [[{ V: 400, Zc: 400 }, { SIL: 400 }, 'Vol 3 p 644 · Sum 2'], [{ V: 400, Zc: 400 }, { SIL: 400 }, 'Vol 3 p 630 · key-formula example'], [{ V: 132, Zc: 400 }, { SIL: 43.6 }, 'Vol 3 p 630 · one-minute sum']] });
  lab([627, 696], { n: 'Power transfer, load angle and reactive flow', rf: 'Power transfer', c: 'P = (VsVr/X) sin δ. Reactive power flows from the higher voltage to the lower: Qs = (Vs² − VsVr cos δ)/X. The synchronising coefficient is (VsVr/X) cos δ.',
    i: [['Vs', 'Sending voltage', 'pu', 1.1, 0.8, 1.2, 0.001], ['Vr', 'Receiving voltage', 'pu', 1, 0.8, 1.2, 0.001], ['X', 'Reactance X', 'pu', 0.5, 0.05, 2, 0.01], ['P', 'Power sent', 'pu', 1.1, 0, 5, 0.01]],
    o: [['Pm', 'Maximum power', 'pu', v => v.Vs * v.Vr / v.X], ['d', 'Load angle δ', '°', v => deg(Math.asin(v.P / v.Pm))], ['Ps', 'Synchronising coefficient', 'pu/rad', v => v.Pm * Math.cos(rad(v.d))], ['Qs', 'Q sent', 'pu', v => (v.Vs * v.Vs - v.Vs * v.Vr * Math.cos(rad(v.d))) / v.X], ['Qr', 'Q received', 'pu', v => (v.Vs * v.Vr * Math.cos(rad(v.d)) - v.Vr * v.Vr) / v.X]],
    plot: { x: ['d', 'Load angle δ', '°', 0, 180, ''], y: [['P', (d, v) => v.Pm * Math.sin(rad(d))]], yl: 'Power (pu)', mark: v => v.d },
    ck: [[{ Vs: 1.1, Vr: 1, X: 0.5 }, { Pm: 2.2 }, 'Vol 3 p 706 · Sum 1'], [{ Vs: 1.1, Vr: 1, X: 0.5, P: 1.1 }, { d: 30 }, 'Vol 3 p 706 · Sum 2'], [{ Vs: 1, Vr: 1, X: 0.5, P: 1 }, { d: 30, Ps: 1.732 }, 'Vol 3 p 706 · Sum 6']] });
  lab([627, 714], { n: 'What raises Pmax — voltage, circuits, compensation, length', rf: 'Effect of reactance on Pmax', c: 'Pmax = VsVr/X ∝ V²/X. Double circuit halves X; series compensation k makes X(1 − k); double the length doubles X.',
    i: [['P1', 'Present Pmax', 'MW', 500, 1, 10000, 1], ['V1', 'Present voltage', 'kV', 220, 11, 1200, 1], ['V2', 'New voltage', 'kV', 220, 11, 1200, 1], ['X', 'Present reactance', 'Ω or pu', 0.5, 0.01, 1000, 0.01], ['k', 'Series compensation k', '%', 0, 0, 80, 1], ['nc', 'Circuits in parallel', '', 1, 1, 4, 1], ['lr', 'Length × ', '', 1, 0.25, 4, 0.05]],
    o: [['Xn', 'New reactance', 'Ω or pu', v => v.X * (1 - v.k / 100) * v.lr / v.nc], ['r', 'Pmax ratio', '×', v => (v.V2 / v.V1) ** 2 * v.X / v.Xn], ['P2', 'New Pmax', 'MW', v => v.P1 * v.r]],
    ck: [[{ P1: 500, V1: 220, V2: 400 }, { P2: 1653 }, 'Vol 3 p 645 · Sum 7'], [{ V1: 800, V2: 400 }, { r: 0.25 }, 'Vol 3 p 645 · Sum 6'], [{ k: 40 }, { r: 1.67 }, 'Vol 3 p 646 · Sum 10'], [{ nc: 2 }, { r: 2 }, 'Vol 3 p 646 · Sum 11'], [{ lr: 2 }, { r: 0.5 }, 'Vol 3 p 646 · Sum 12'],
      [{ k: 50 }, { r: 2 }, 'Vol 3 p 634 · key-formula example'], [{ k: 40 }, { r: 1.67 }, 'Vol 3 p 634 · one-minute sum'], [{ X: 0.5, k: 40 }, { Xn: 0.3, r: 1.67 }, 'Vol 3 p 719 · Sum 2'], [{ k: 50 }, { r: 2 }, 'Vol 3 p 719 · R2']] });
  lab(714, { n: 'Degree of series compensation', rf: 'Series compensation', c: 'k = XC/XL; the line then behaves as XL(1 − k).',
    i: [['XL', 'Line reactance XL', 'Ω', 100, 1, 1000, 1], ['XC', 'Series capacitor XC', 'Ω', 30, 0, 1000, 1]],
    o: [['k', 'Degree of compensation k', '', v => v.XC / v.XL], ['Xe', 'Effective reactance', 'Ω', v => v.XL - v.XC], ['r', 'Pmax ratio', '×', v => v.XL / v.Xe]],
    ck: [[{ XL: 100, XC: 30 }, { k: 0.3 }, 'Vol 3 p 634 · one-minute sum']] });
  lab(627, { n: 'Short line — voltage drop, regulation and efficiency', rf: 'Short line', c: 'ΔV ≈ I(R cos ϕ + X sin ϕ) per phase (− X sin ϕ for leading). Regulation is zero for a leading pf with tan ϕ = R/X.',
    i: [['VL', 'Receiving line voltage', 'kV', 11, 0.4, 765, 0.1], ['I', 'Line current', 'A', 100, 1, 5000, 1], ['R', 'R per phase', 'Ω', 2, 0, 200, 0.01], ['X', 'X per phase', 'Ω', 4, 0, 400, 0.01], ['pf', 'Power factor', '', 0.8, 0, 1, 0.01], ['ty', 'Load', '', 'lagging', ['lagging', 'leading']]],
    o: [['dV', 'Drop per phase ΔV', 'V', v => v.I * (v.R * v.pf + (v.ty === 'lagging' ? 1 : -1) * v.X * sq(1 - v.pf * v.pf))], ['reg', 'Regulation', '%', v => v.dV / (v.VL * 1000 / sq(3)) * 100], ['Pr', 'Power received', 'MW', v => sq(3) * v.VL * v.I * v.pf / 1000], ['Pl', 'Line loss', 'MW', v => 3 * v.I * v.I * v.R / 1e6], ['eta', 'Efficiency', '%', v => v.Pr / (v.Pr + v.Pl) * 100], ['pz', 'Leading pf for zero regulation', '', v => Math.cos(Math.atan(v.R / v.X))]],
    ck: [[{ I: 100, R: 2, X: 4, pf: 0.8, ty: 'lagging' }, { dV: 400 }, 'Vol 3 p 631 · key-formula example']] });
  lab(627, { n: 'Regulation and efficiency from end values', rf: 'Key formula', c: '% Reg = (Vs − Vr)/Vr × 100; η = P received/(P received + loss).',
    i: [['Vs', 'Sending-end voltage', 'kV', 11.6, 0.1, 1000, 0.01], ['Vr', 'Receiving-end voltage', 'kV', 11, 0.1, 1000, 0.01], ['Pr', 'Power received', 'MW', 10, 0.01, 5000, 0.01], ['Pl', 'Line loss', 'MW', 0.5, 0, 500, 0.01]],
    o: [['reg', 'Regulation', '%', v => (v.Vs - v.Vr) / v.Vr * 100], ['eta', 'Efficiency', '%', v => v.Pr / (v.Pr + v.Pl) * 100]],
    ck: [[{ Vs: 11.6, Vr: 11 }, { reg: 5.45 }, 'Vol 3 p 644 · Sum 1'], [{ Vs: 11.5, Vr: 11 }, { reg: 4.5 }, 'Vol 3 p 631 · one-minute sum'], [{ Pr: 10, Pl: 0.5 }, { eta: 95.2 }, 'Vol 3 p 645 · Sum 3']] });
  lab(627, { n: 'Raising the transmission voltage', rf: 'Effect of transmission voltage', c: 'For the same power and pf: I ∝ 1/V, loss and % drop ∝ 1/V², conductor volume for the same % loss ∝ 1/V², Pmax and SIL ∝ V².',
    i: [['n', 'New voltage ÷ old', '×', 2, 0.25, 5, 0.01]],
    o: [['I', 'Current', '×', v => 1 / v.n], ['L', 'Line loss', '×', v => 1 / v.n ** 2], ['vol', 'Conductor volume (same % loss)', '×', v => 1 / v.n ** 2], ['P', 'Pmax and SIL', '×', v => v.n ** 2]],
    ck: [[{ n: 2 }, { L: 0.25 }, 'Vol 3 p 646 · Sum 8'], [{ n: 2 }, { vol: 0.25 }, 'Vol 3 p 646 · Sum 9'], [{ n: 2 }, { L: 0.25 }, 'Vol 3 p 647 · R2'], [{ n: 2 }, { P: 4 }, 'Vol 3 p 647 · R3'], [{ n: 0.5 }, { P: 0.25 }, 'Vol 3 p 647 · R1']] });
  lab(627, { n: 'Sag of an overhead line', rf: 'Sag', c: 'S = wl²/(8T). Twice the span → 4 × the sag; twice the tension → half. With ice and wind, w = √((w + wᵢ)² + w_w²).',
    i: [['l', 'Span l', 'm', 200, 10, 1000, 1], ['w', 'Conductor weight w', 'N/m', 10, 0.1, 100, 0.1], ['wi', 'Ice load wᵢ', 'N/m', 0, 0, 100, 0.1], ['ww', 'Wind load w_w', 'N/m', 0, 0, 100, 0.1], ['T', 'Tension T', 'kN', 20, 0.1, 500, 0.1]],
    o: [['wt', 'Total load', 'N/m', v => sq((v.w + v.wi) ** 2 + v.ww ** 2)], ['S', 'Sag', 'm', v => v.wt * v.l * v.l / (8 * v.T * 1000)]],
    plot: { x: ['l', 'Span', 'm', 10, 500, ''], y: [['sag', (l, v) => v.wt * l * l / (8 * v.T * 1000)]], yl: 'Sag (m)', mark: v => v.l },
    ck: [[{ l: 200, w: 10, wi: 0, ww: 0, T: 20 }, { S: 2.5 }, 'Vol 3 p 645 · Sum 4'], [{ l: 200, w: 10, wi: 0, ww: 0, T: 20 }, { S: 2.5 }, 'Vol 3 p 632 · key-formula example']] });
  lab(627, { n: 'String efficiency from the shunt capacitance ratio', rf: 'String efficiency', c: 'With m = Cshunt/Cself each disc nearer the line carries more: V(k+1) = V(k) + m·ΣV. η = total/(n × line-disc voltage); η = 100 % only if m = 0.',
    i: [['n', 'Discs n', '', 3, 1, 30, 1], ['m', 'm = Cshunt/Cself', '', 0.1, 0, 0.5, 0.001], ['V', 'Phase voltage', 'kV', 33, 1, 500, 0.1]],
    o: [['vs', 'Disc voltages (top → line, × V₁)', '', v => { const a = [1]; for (let k = 1; k < v.n; k++) a.push(a[k - 1] + v.m * a.reduce((s, x) => s + x, 0)); return a.map(x => x.toFixed(3)).join(', '); }],
      ['eta', 'String efficiency', '%', v => { const a = [1]; for (let k = 1; k < v.n; k++) a.push(a[k - 1] + v.m * a.reduce((s, x) => s + x, 0)); return a.reduce((s, x) => s + x, 0) / (v.n * a[v.n - 1]) * 100; }],
      ['Vl', 'Voltage across the line disc', 'kV', v => { const a = [1]; for (let k = 1; k < v.n; k++) a.push(a[k - 1] + v.m * a.reduce((s, x) => s + x, 0)); return v.V * a[v.n - 1] / a.reduce((s, x) => s + x, 0); }]],
    ck: [[{ n: 3, m: 0.1 }, { eta: 86.8 }, 'Vol 3 p 632 · key-formula example']] });
  lab(627, { n: 'String efficiency from disc voltages', rf: 'String efficiency', c: 'η = V(total)/(n × V(line disc)) × 100.',
    i: [['V', 'Total voltage across the string', 'kV', 37, 1, 500, 0.1], ['Vn', 'Voltage across the line disc', 'kV', 15, 0.1, 200, 0.1], ['n', 'Discs n', '', 3, 1, 30, 1]],
    o: [['eta', 'String efficiency', '%', v => v.V / (v.n * v.Vn) * 100]],
    ck: [[{ V: 37, Vn: 15, n: 3 }, { eta: 82.2 }, 'Vol 3 p 645 · Sum 5'], [{ V: 44, Vn: 14, n: 4 }, { eta: 78.6 }, 'Vol 3 p 632 · one-minute sum']] });
  lab(627, { n: 'Corona — critical voltage and Peek’s loss', rf: 'Corona', c: 'Vd = 21.1 m δ r ln(D/r) kV (rms per phase, r in cm), δ = 3.92b/(273 + t). Above Vd, loss = (242/δ)(f + 25)√(r/D)(V − Vd)² × 10⁻⁵ kW/km/phase.',
    i: [['r', 'Conductor radius', 'cm', 1, 0.2, 5, 0.01], ['D', 'Spacing', 'cm', 300, 20, 2000, 1], ['m', 'Irregularity factor m', '', 0.85, 0.5, 1, 0.01], ['b', 'Pressure', 'cm of Hg', 76, 50, 80, 0.1], ['t', 'Temperature', '°C', 25, -20, 50, 1], ['V', 'Phase voltage', 'kV', 76, 1, 500, 0.1], ['f', 'Frequency', 'Hz', 50, 25, 60, 1]],
    o: [['dl', 'Air density factor δ', '', v => 3.92 * v.b / (273 + v.t)], ['Vd', 'Critical voltage', 'kV', v => 21.1 * v.m * v.dl * v.r * Math.log(v.D / v.r)], ['P', 'Corona loss', 'kW/km/phase', v => v.V > v.Vd ? 242 / v.dl * (v.f + 25) * sq(v.r / v.D) * (v.V - v.Vd) ** 2 * 1e-5 : 0]], ck: [] });
  lab(627, { n: 'Economical voltage — Still’s formula', rf: 'Still', c: 'V = 5.5 √(l/1.6 + P/100) kV, l in km, P in kW; then pick the next standard voltage.',
    i: [['l', 'Line length', 'km', 100, 1, 1000, 1], ['P', 'Power', 'kW', 20000, 100, 1000000, 100, 'log']],
    o: [['V', 'Economical voltage', 'kV', v => 5.5 * sq(v.l / 1.6 + v.P / 100)]],
    ck: [[{ l: 100, P: 20000 }, { V: 89 }, 'Vol 3 p 646 · Sum 13']] });
  lab(627, { n: 'Ferranti effect on an open line', rf: 'Ferranti', c: 'Lossless open line: VR = VS/cos βl with β = ω√LC ≈ 0.06°/km at 50 Hz, so a long line lifts the far-end voltage at light load.',
    i: [['Vs', 'Sending voltage', 'kV', 400, 11, 1200, 1], ['l', 'Length', 'km', 400, 1, 1500, 1], ['f', 'Frequency', 'Hz', 50, 1, 60, 1], ['u', 'Wave speed', '× 10⁸ m/s', 3, 1, 3, 0.01]],
    o: [['bl', 'βl', '°', v => deg(2 * PI * v.f / (v.u * 1e8) * v.l * 1e3)], ['Vr', 'Receiving-end voltage', 'kV', v => v.Vs / Math.cos(rad(v.bl))], ['rise', 'Rise', '%', v => (v.Vr / v.Vs - 1) * 100]],
    plot: { x: ['l', 'Length', 'km', 1, 1200, ''], y: [['rise (%)', (l, v) => (1 / Math.cos(2 * PI * v.f / (v.u * 1e8) * l * 1e3) - 1) * 100]], yl: 'Voltage rise (%)', mark: v => v.l }, ck: [] });
  lab([627, 723], { n: 'Travelling wave at a junction', rf: 'Travelling waves', c: 'Γ = (ZL − Zc)/(ZL + Zc), transmitted voltage = 2ZL/(ZL + Zc) × V. Open end → doubles; short → zero; matched → no reflection; line into a cable → much smaller.',
    i: [['V', 'Incident surge', 'kV', 100, 1, 5000, 1], ['Zc', 'Line surge impedance', 'Ω', 400, 10, 1000, 1], ['ZL', 'Impedance met (very large = open)', 'Ω', 40, 0.001, 1e9, 0.001, 'log']],
    o: [['G', 'Reflection coefficient Γ', '', v => (v.ZL - v.Zc) / (v.ZL + v.Zc)], ['Vr', 'Reflected voltage', 'kV', v => v.G * v.V], ['Vt', 'Voltage beyond the junction', 'kV', v => 2 * v.ZL / (v.ZL + v.Zc) * v.V], ['It', 'Transmitted current', 'kA', v => v.Vt / v.ZL]],
    ck: [[{ V: 100, Zc: 400, ZL: 40 }, { Vt: 18.2 }, 'Vol 3 p 744 · Sum 8'], [{ V: 100, Zc: 400, ZL: 1e9 }, { Vt: 200 }, 'Vol 3 p 744 · Sum 7']] });
  lab(723, { n: 'Surge velocity', rf: 'Travelling-wave velocity', c: 'v = c/√(μᵣεᵣ): ≈ 3 × 10⁸ m/s on an overhead line, about half that in a cable (εᵣ ≈ 4).',
    i: [['er', 'Relative permittivity εᵣ', '', 4, 1, 10, 0.1], ['mr', 'μᵣ', '', 1, 1, 2, 0.01], ['d', 'Distance', 'km', 100, 0.1, 1000, 0.1]],
    o: [['v', 'Speed', 'm/s', v => 3e8 / sq(v.mr * v.er)], ['t', 'Travel time', 'µs', v => v.d * 1e3 / v.v * 1e6]],
    ck: [[{ er: 4, mr: 1 }, { v: 1.5e8 }, 'Vol 3 p 730 · formula 1']] });

  /* ---------- HVDC ---------- */
  lab([627, 657], { n: '6-pulse converter output', rf: '6-pulse bridge', c: 'Vd0 = (3√2/π)VLL = 1.35 VLL; Vd = Vd0 cos α − (3/π)XcId. Rectifier for α < 90°, inverter for α > 90°; the converter draws Q ≈ P tan ϕ with cos ϕ ≈ cos α.',
    i: [['VL', 'AC line voltage (rms)', 'kV', 100, 1, 600, 1], ['a', 'Firing angle α', '°', 30, 0, 170, 1], ['Xc', 'Commutating reactance Xc', 'Ω', 0, 0, 100, 0.1], ['Id', 'DC current', 'kA', 1, 0, 5, 0.01]],
    o: [['Vd0', 'Vd0', 'kV', v => 3 * sq(2) / PI * v.VL], ['dv', 'Overlap drop', 'kV', v => 3 / PI * v.Xc * v.Id], ['Vd', 'DC voltage Vd', 'kV', v => v.Vd0 * Math.cos(rad(v.a)) - v.dv], ['P', 'DC power', 'MW', v => v.Vd * v.Id], ['Q', 'Reactive power drawn', 'MVAR', v => Math.abs(v.P * Math.tan(rad(v.a)))], ['md', 'Mode', '', v => v.a < 90 ? 'rectifier' : v.a > 90 ? 'inverter' : 'zero output']],
    plot: { x: ['a', 'Firing angle α', '°', 0, 180, ''], y: [['Vd', (a, v) => v.Vd0 * Math.cos(rad(a)) - v.dv]], yl: 'DC voltage (kV)', mark: v => v.a },
    ck: [[{ VL: 100, a: 0, Xc: 0 }, { Vd0: 135, Vd: 135 }, 'Vol 3 p 659 · Sum 1'], [{ VL: 100, a: 30, Xc: 0 }, { Vd: 116.9 }, 'Vol 3 p 659 · Sum 2'], [{ VL: 100, a: 0, Xc: 0 }, { Vd: 135 }, 'Vol 3 p 657 · quick check'], [{ VL: 100, a: 15, Xc: 0 }, { Vd: 130.4 }, 'Vol 3 p 633 · key-formula example'], [{ VL: 200, a: 0, Xc: 0 }, { Vd0: 270 }, 'Vol 3 p 633 · one-minute sum'], [{ VL: 200, a: 60, Xc: 0 }, { Vd: 135 }, 'Vol 3 p 659 · R2']] });
  lab(657, { n: 'DC link — current, power and loss', rf: 'DC link power', c: 'Id = (Vdr − Vdi)/R; P = VdId. For the same power, doubling Vd halves Id and quarters the loss. Bipolar = two poles → twice a monopole.',
    i: [['Vr', 'Rectifier voltage', 'kV', 500, 1, 1000, 1], ['Vi', 'Inverter voltage', 'kV', 495, 1, 1000, 1], ['R', 'Line resistance', 'Ω', 5, 0.1, 100, 0.1], ['np', 'Poles', '', 1, 1, 2, 1]],
    o: [['Id', 'DC current', 'kA', v => (v.Vr - v.Vi) / v.R], ['P', 'Power sent', 'MW', v => v.np * v.Vr * v.Id], ['L', 'Line loss', 'MW', v => v.np * v.Id * v.Id * v.R]], ck: [] });
  lab(657, { n: 'Converter harmonics', rf: 'Harmonics', c: 'A p-pulse converter makes AC-side harmonics pk ± 1 and DC-side harmonics pk.',
    i: [['p', 'Pulse number p', '', 6, 6, 24, 6]],
    o: [['ac', 'AC-side harmonics', '', v => [1, 2].flatMap(k => [v.p * k - 1, v.p * k + 1]).join(', ')], ['dc', 'DC-side harmonics', '', v => [1, 2].map(k => v.p * k).join(', ')]],
    ck: [[{ p: 6 }, { ac: '5, 7, 11, 13' }, 'Vol 3 p 658 · formula 4'], [{ p: 6 }, { dc: '6, 12' }, 'Vol 3 p 658 · formula 4']] });

  /* ---------- Cables & distribution ---------- */
  lab(663, { n: 'Single-core cable — capacitance, stress and insulation resistance', rf: 'Dielectric stress', c: 'g = V/(x ln(R/r)) is largest at the conductor (x = r). For a given r and V, the stress at the conductor is least when R/r = e. Insulation resistance ∝ ln(R/r)/l; capacitance ∝ l/ln(R/r).',
    i: [['V', 'Voltage core to sheath', 'kV', 11, 0.1, 400, 0.1], ['r', 'Conductor radius r', 'cm', 1, 0.1, 5, 0.01], ['R', 'Sheath radius R', 'cm', 2.5, 0.2, 20, 0.01], ['er', 'εᵣ of insulation', '', 4, 1, 10, 0.1], ['l', 'Length', 'km', 1, 0.01, 100, 0.01], ['rho', 'Resistivity ρ', '× 10¹² Ω·m', 5, 0.01, 100, 0.01]],
    o: [['gm', 'Maximum stress (at r)', 'kV/cm', v => v.V / (v.r * Math.log(v.R / v.r))], ['gn', 'Minimum stress (at R)', 'kV/cm', v => v.V / (v.R * Math.log(v.R / v.r))], ['C', 'Capacitance', 'µF', v => 2 * PI * e0 * v.er * v.l * 1e3 / Math.log(v.R / v.r) * 1e6], ['Ri', 'Insulation resistance', 'MΩ', v => v.rho * 1e12 / (2 * PI * v.l * 1e3) * Math.log(v.R / v.r) / 1e6], ['Re', 'Most economical sheath radius e·r', 'cm', v => Math.E * v.r]],
    ck: [[{ V: 11, r: 1, R: 2.5 }, { gm: 12 }, 'Vol 3 p 670 · Sum 2'], [{ r: 1 }, { Re: 2.72 }, 'Vol 3 p 670 · Sum 3']] });
  lab(663, { n: 'Cable charging current', rf: 'Cable capacitance', c: 'Ic = Vph·ωC per phase. Twice the length → twice C and twice the charging current.',
    i: [['VL', 'Line voltage', 'kV', 11, 0.4, 400, 0.1], ['C', 'Capacitance per phase', 'µF', 3, 0.01, 100, 0.01], ['f', 'Frequency', 'Hz', 50, 1, 400, 1]],
    o: [['Ic', 'Charging current', 'A', v => v.VL * 1000 / sq(3) * 2 * PI * v.f * v.C * 1e-6], ['Q', 'Charging kVAR (3 phases)', 'kVAR', v => sq(3) * v.VL * v.Ic]],
    ck: [[{ VL: 11, C: 3, f: 50 }, { Ic: 6 }, 'Vol 3 p 670 · Sum 1', 0.02]] });
  lab(663, { n: 'Three-core cable capacitance', rf: 'Three-core cable', c: 'Per phase CN = Cs + 3Cc. Tests: all cores bunched to sheath C₁ = 3Cs; two cores to sheath C₂ = Cs + 2Cc; between two cores CN/2.',
    i: [['Cs', 'Core–sheath Cs', 'µF', 0.2, 0.001, 10, 0.001], ['Cc', 'Core–core Cc', 'µF', 0.1, 0.001, 10, 0.001]],
    o: [['CN', 'Per phase CN', 'µF', v => v.Cs + 3 * v.Cc], ['C1', 'Test 1 reading C₁', 'µF', v => 3 * v.Cs], ['C2', 'Test 2 reading C₂', 'µF', v => v.Cs + 2 * v.Cc], ['Ccc', 'Between two cores', 'µF', v => v.CN / 2]],
    ck: [[{ Cs: 0.2, Cc: 0.1 }, { CN: 0.5 }, 'Vol 3 p 664 · quick check']] });
  lab(663, { n: 'Dielectric loss of a cable', rf: 'Dielectric loss', c: 'Loss = ωCV² tan δ; the cable pf ≈ tan δ.',
    i: [['V', 'Phase voltage', 'kV', 6.35, 0.1, 230, 0.01], ['C', 'Capacitance', 'µF', 0.5, 0.001, 50, 0.001], ['td', 'tan δ', '', 0.004, 0.0001, 0.05, 0.0001], ['f', 'Frequency', 'Hz', 50, 1, 400, 1]],
    o: [['P', 'Dielectric loss per phase', 'W', v => 2 * PI * v.f * v.C * 1e-6 * (v.V * 1000) ** 2 * v.td]], ck: [] });
  lab(663, { n: 'Distributor drop — concentrated load', rf: 'Distributors', c: 'Drop = I × loop resistance: two wires, so 2 × distance × resistance per km per conductor.',
    i: [['I', 'Load current', 'A', 100, 0.1, 2000, 0.1], ['d', 'Distance from the feed', 'm', 200, 1, 5000, 1], ['r', 'Resistance per conductor', 'Ω/km', 0.1, 0.001, 10, 0.001], ['w', 'Conductors in the loop', '', 2, 1, 2, 1]],
    o: [['R', 'Loop resistance', 'Ω', v => v.w * v.d / 1000 * v.r], ['dV', 'Voltage drop', 'V', v => v.I * v.R]],
    ck: [[{ I: 100, d: 200, r: 0.1, w: 2 }, { dV: 4 }, 'Vol 3 p 670 · Sum 4']] });
  lab([663, 759], { n: 'Uniformly loaded DC distributor', rf: 'DC distributor', c: 'Fed at one end: drop = irl²/2 at the far end. Fed at both ends at equal voltage: the lowest point is the middle, drop = irl²/8 (a quarter).',
    i: [['i', 'Load per metre', 'A/m', 1, 0.01, 10, 0.01], ['r', 'Resistance per metre (both wires)', 'Ω/m', 1e-4, 1e-6, 1e-2, 1e-6, 'log'], ['l', 'Length', 'm', 500, 10, 5000, 1]],
    o: [['d1', 'Drop, fed at one end', 'V', v => v.i * v.r * v.l * v.l / 2], ['d2', 'Drop, fed at both ends', 'V', v => v.i * v.r * v.l * v.l / 8]],
    ck: [[{ i: 1, r: 1e-4, l: 500 }, { d1: 12.5, d2: 3.125 }, 'Vol 3 p 761 · Sum 1']] });
  lab(663, { n: 'Murray loop test', rf: '', c: 'Loop the faulty core with a sound one (total 2L). At balance the distance to the fault x = 2L·Q/(P + Q), Q being the arm on the faulty core.',
    i: [['P', 'Arm P', 'Ω', 3, 0.01, 1000, 0.01], ['Q', 'Arm Q (faulty core side)', 'Ω', 1, 0.01, 1000, 0.01], ['L', 'Cable length', 'm', 500, 1, 50000, 1]],
    o: [['x', 'Distance to the fault', 'm', v => 2 * v.L * v.Q / (v.P + v.Q)]],
    ck: [[{ P: 3, Q: 1, L: 500 }, { x: 250 }, 'Vol 3 p 670 · Sum 6']] });
  lab(663, { n: 'AT&C losses', rf: 'AT&C losses', c: 'AT&C loss = (1 − billing efficiency × collection efficiency) × 100. Billing eff. = units billed/units input; collection eff. = amount realised/amount billed.',
    i: [['Ui', 'Units input', 'MU', 100, 1, 100000, 1], ['Ub', 'Units billed', 'MU', 85, 0, 100000, 1], ['Ab', 'Amount billed', 'Rs crore', 50, 0.1, 100000, 0.1], ['Ar', 'Amount realised', 'Rs crore', 47, 0, 100000, 0.1]],
    o: [['be', 'Billing efficiency', '%', v => v.Ub / v.Ui * 100], ['ce', 'Collection efficiency', '%', v => v.Ar / v.Ab * 100], ['atc', 'AT&C loss', '%', v => (1 - v.be / 100 * v.ce / 100) * 100]], ck: [] });
  lab(663, { n: 'Reliability indices — SAIFI, SAIDI, CAIDI', rf: 'Reliability indices', c: 'SAIFI = customer interruptions/customers; SAIDI = customer-minutes off/customers; CAIDI = SAIDI/SAIFI (average length of one outage).',
    i: [['N', 'Customers served', '', 10000, 1, 10000000, 1, 'log'], ['ci', 'Customer interruptions in the year', '', 25000, 1, 1e8, 1, 'log'], ['cm', 'Customer-minutes of interruption', '', 2000000, 1, 1e10, 1, 'log']],
    o: [['saifi', 'SAIFI', 'per customer', v => v.ci / v.N], ['saidi', 'SAIDI', 'min per customer', v => v.cm / v.N], ['caidi', 'CAIDI', 'min per interruption', v => v.saidi / v.saifi]], ck: [] });

  /* ---------- Per unit & faults ---------- */
  lab(678, { n: 'Base quantities', rf: 'Base quantities', c: 'Ibase = MVA/(√3 kV) kA, Zbase = kV²/MVA; Zpu = Z/Zbase.',
    i: [['S', 'Base MVA', 'MVA', 100, 1, 10000, 1], ['V', 'Base kV (line)', 'kV', 11, 0.4, 765, 0.1], ['Z', 'Actual impedance', 'Ω', 0.5, 0.001, 1000, 0.001, 'log']],
    o: [['Ib', 'Base current', 'A', v => v.S * 1000 / (sq(3) * v.V)], ['Zb', 'Base impedance', 'Ω', v => v.V * v.V / v.S], ['Zpu', 'Impedance in pu', 'pu', v => v.Z / v.Zb]],
    ck: [[{ S: 100, V: 11 }, { Ib: 5249, Zb: 1.21 }, 'Vol 3 p 688 · Sum 1']] });
  lab(678, { n: 'Change of base', rf: 'Change of base', c: 'Zpu,new = Zpu,old × (MVAnew/MVAold) × (kVold/kVnew)². Double the MVA base → Zpu × 2; double the kV base → Zpu ÷ 4.',
    i: [['Z', 'Zpu on the old base', 'pu', 0.2, 0.001, 5, 0.001], ['S1', 'Old MVA', 'MVA', 50, 1, 10000, 1], ['V1', 'Old kV', 'kV', 11, 0.4, 765, 0.1], ['S2', 'New MVA', 'MVA', 100, 1, 10000, 1], ['V2', 'New kV', 'kV', 11.5, 0.4, 765, 0.1]],
    o: [['Zn', 'Zpu on the new base', 'pu', v => v.Z * (v.S2 / v.S1) * (v.V1 / v.V2) ** 2]],
    ck: [[{ Z: 0.1, S1: 50, V1: 11, S2: 100, V2: 11 }, { Zn: 0.2 }, 'Vol 3 p 688 · Sum 2'], [{ Z: 0.2, S1: 50, V1: 11, S2: 100, V2: 11.5 }, { Zn: 0.366 }, 'Vol 3 p 689 · Sum 6'], [{ Z: 0.1, S1: 50, V1: 11, S2: 100, V2: 11 }, { Zn: 0.2 }, 'Vol 3 p 681 · one-minute sum']] });
  lab(678, { n: 'Three-phase fault level', rf: 'Symmetrical fault', c: 'Fault MVA = base MVA/Zpu; If = fault MVA/(√3 kV). Parallel sources lower Zth; a series reactor raises it and limits the fault level.',
    i: [['S', 'Base MVA', 'MVA', 100, 1, 10000, 1], ['V', 'Fault-point kV', 'kV', 11, 0.4, 765, 0.1], ['Zg', 'Each generator (0 = infinite bus)', 'pu', 0.2, 0, 2, 0.001], ['ng', 'Generators in parallel', '', 1, 1, 10, 1], ['Zt', 'Transformer / line in series', 'pu', 0, 0, 2, 0.001], ['lim', 'Wanted fault level limit', 'MVA', 250, 1, 100000, 1]],
    o: [['Zth', 'Thevenin impedance', 'pu', v => v.Zg / v.ng + v.Zt], ['F', 'Fault level', 'MVA', v => v.S / v.Zth], ['If', 'Fault current', 'kA', v => v.F / (sq(3) * v.V)], ['Xr', 'Reactor to meet the limit', 'pu', v => Math.max(0, v.S / v.lim - v.Zth)], ['Xo', 'Reactor in ohms', 'Ω', v => v.Xr * v.V * v.V / v.S]],
    ck: [[{ S: 100, Zg: 0.2, ng: 1, Zt: 0 }, { F: 500 }, 'Vol 3 p 688 · Sum 3'], [{ S: 100, V: 11, Zg: 0.2, ng: 1, Zt: 0 }, { If: 26.2 }, 'Vol 3 p 689 · Sum 5'], [{ S: 20, Zg: 0, ng: 1, Zt: 0.1 }, { F: 200 }, 'Vol 3 p 690 · Sum 9'], [{ S: 100, V: 11, Zg: 0.2, ng: 2, Zt: 0.1 }, { If: 26.2 }, 'Vol 3 p 690 · Sum 10'],
      [{ S: 100, V: 11, Zg: 0.25, ng: 1, Zt: 0, lim: 250 }, { Xo: 0.1815 }, 'Vol 3 p 690 · Sum 11'], [{ S: 100, Zg: 0.1, ng: 1, Zt: 0 }, { F: 1000 }, 'Vol 3 p 681 · key-formula example'], [{ S: 100, Zg: 0.05, ng: 1, Zt: 0 }, { F: 2000 }, 'Vol 3 p 681 · one-minute sum']] });
  lab(678, { n: 'Unsymmetrical faults', rf: 'LG fault', c: 'LG: If = 3E/(Z₁ + Z₂ + Z₀ + 3Zf). LL: √3E/(Z₁ + Z₂). LLG: Ia1 = E/(Z₁ + Z₂∥Z₀), ground current 3Ia0. 3-φ: E/Z₁. An LG fault can exceed the 3-φ fault when Z₀ is small.',
    i: [['E', 'Prefault voltage E', 'pu', 1, 0.5, 1.2, 0.01], ['Z1', 'Positive-sequence Z₁', 'pu', 0.2, 0.01, 2, 0.001], ['Z2', 'Negative-sequence Z₂', 'pu', 0.2, 0.01, 2, 0.001], ['Z0', 'Zero-sequence Z₀', 'pu', 0.1, 0.001, 5, 0.001], ['Zf', 'Fault/neutral impedance Zf', 'pu', 0, 0, 2, 0.001]],
    o: [['I3', '3-φ fault', 'pu', v => v.E / v.Z1], ['ILG', 'LG fault', 'pu', v => 3 * v.E / (v.Z1 + v.Z2 + v.Z0 + 3 * v.Zf)], ['ILL', 'LL fault', 'pu', v => sq(3) * v.E / (v.Z1 + v.Z2)],
      ['ILLG', 'LLG ground current 3Ia0', 'pu', v => { const zp = v.Z2 * (v.Z0 + 3 * v.Zf) / (v.Z2 + v.Z0 + 3 * v.Zf), i1 = v.E / (v.Z1 + zp); return 3 * i1 * v.Z2 / (v.Z2 + v.Z0 + 3 * v.Zf); }]],
    ck: [[{ E: 1, Z1: 0.2, Z2: 0.2, Z0: 0.1, Zf: 0 }, { ILG: 6 }, 'Vol 3 p 689 · Sum 4'], [{ E: 1, Z1: 0.2, Z2: 0.2, Z0: 0.1, Zf: 0 }, { ILG: 6 }, 'Vol 3 p 679 · quick check'], [{ E: 1, Z1: 0.25, Z2: 0.25, Z0: 0.15, Zf: 0 }, { ILL: 3.46 }, 'Vol 3 p 689 · Sum 7'], [{ E: 1, Z1: 0.25, Z2: 0.25, Z0: 0.15, Zf: 0 }, { ILLG: 5.45 }, 'Vol 3 p 689 · Sum 8'],
      [{ E: 1, Z1: 0.1, Z2: 0.1, Z0: 0.05, Zf: 0 }, { ILG: 12, I3: 10 }, 'Vol 3 p 682 · key-formula example'], [{ E: 1, Z1: 0.1, Z2: 0.1, Z0: 0.1, Zf: 0 }, { ILG: 10 }, 'Vol 3 p 682 · one-minute sum'], [{ E: 1, Z1: 0.2, Z2: 0.2 }, { ILL: 4.33 }, 'Vol 3 p 682 · one-minute sum']] });
  lab(678, { n: 'Symmetrical components', rf: 'Symmetrical components', c: 'V0 = (Va + Vb + Vc)/3, V1 = (Va + aVb + a²Vc)/3, V2 = (Va + a²Vb + aVc)/3 with a = 1∠120°. A balanced set has only V1.',
    i: [['A', '|Va|', 'V', 1, 0, 2, 0.01], ['a', '∠Va', '°', 0, -180, 180, 1], ['B', '|Vb|', 'V', 1, 0, 2, 0.01], ['b', '∠Vb', '°', -120, -180, 180, 1], ['C', '|Vc|', 'V', 0.8, 0, 2, 0.01], ['c', '∠Vc', '°', 120, -180, 180, 1]],
    o: [['V0', '|V0|', 'V', v => { const re = v.A * Math.cos(rad(v.a)) + v.B * Math.cos(rad(v.b)) + v.C * Math.cos(rad(v.c)), im = v.A * Math.sin(rad(v.a)) + v.B * Math.sin(rad(v.b)) + v.C * Math.sin(rad(v.c)); return Math.hypot(re, im) / 3; }],
      ['V1', '|V1|', 'V', v => { const re = v.A * Math.cos(rad(v.a)) + v.B * Math.cos(rad(v.b + 120)) + v.C * Math.cos(rad(v.c + 240)), im = v.A * Math.sin(rad(v.a)) + v.B * Math.sin(rad(v.b + 120)) + v.C * Math.sin(rad(v.c + 240)); return Math.hypot(re, im) / 3; }],
      ['V2', '|V2|', 'V', v => { const re = v.A * Math.cos(rad(v.a)) + v.B * Math.cos(rad(v.b + 240)) + v.C * Math.cos(rad(v.c + 120)), im = v.A * Math.sin(rad(v.a)) + v.B * Math.sin(rad(v.b + 240)) + v.C * Math.sin(rad(v.c + 120)); return Math.hypot(re, im) / 3; }],
      ['u', 'Unbalance V2/V1', '%', v => v.V2 / v.V1 * 100]], ck: [] });
  lab(678, { n: 'Peterson coil (arc-suppression coil)', rf: 'Neutral grounding', c: 'Tune the neutral reactor to the line charging: XL = 1/(3ωC), so the fault current through the coil cancels the capacitive current.',
    i: [['C', 'Capacitance per phase to earth', 'µF', 1, 0.01, 100, 0.01], ['f', 'Frequency', 'Hz', 50, 1, 400, 1]],
    o: [['X', 'Coil reactance', 'Ω', v => 1 / (3 * 2 * PI * v.f * v.C * 1e-6)], ['L', 'Coil inductance', 'H', v => v.X / (2 * PI * v.f)]], ck: [] });

  /* ---------- Load flow & stability ---------- */
  lab(696, { n: 'Inertia, stored energy and rotor oscillation', rf: 'Swing equation', c: 'Stored energy = H·G MJ; M = GH/(πf). Small swings oscillate at ωn = √(ωs·Ps/2H), Ps = Pmax cos δ₀: more inertia → slower swings (÷ √2 when H doubles).',
    i: [['H', 'Inertia constant H', 's', 5, 0.5, 15, 0.1], ['G', 'Machine rating', 'MVA', 100, 1, 2000, 1], ['f', 'Frequency', 'Hz', 50, 1, 60, 1], ['Pm', 'Pmax', 'pu', 2, 0.1, 5, 0.01], ['d0', 'Operating angle δ₀', '°', 30, 0, 89, 1]],
    o: [['KE', 'Stored energy', 'MJ', v => v.H * v.G], ['M', 'Inertia M', 'MJ·s/elec rad', v => v.G * v.H / (PI * v.f)], ['Mpu', 'Inertia M (pu)', 'pu·s²/rad', v => v.H / (PI * v.f)], ['Ps', 'Synchronising coefficient', 'pu/rad', v => v.Pm * Math.cos(rad(v.d0))], ['wn', 'Oscillation ωn', 'rad/s', v => sq(2 * PI * v.f * v.Ps / (2 * v.H))], ['fn', 'Oscillation fn', 'Hz', v => v.wn / (2 * PI)]],
    ck: [[{ H: 5, G: 100 }, { KE: 500 }, 'Vol 3 p 706 · Sum 3'], [{ H: 5, G: 100, f: 50 }, { M: 3.18, Mpu: 0.0318 }, 'Vol 3 p 706 · Sum 4'], [{ H: 5, f: 50, Pm: 2, d0: 30 }, { wn: 7.38, fn: 1.17 }, 'Vol 3 p 707 · Sum 7']] });
  lab(696, { n: 'Equal-area criterion — critical clearing', rf: 'Critical clearing angle', c: 'Fault with no power transfer, cleared back to the same line: cos δc = (π − 2δ₀) sin δ₀ − cos δ₀. The accelerating area must not exceed the decelerating area. Clearing time tc = √(2M(δc − δ₀)/Pm).',
    i: [['Pmax', 'Pmax', 'pu', 2, 0.5, 5, 0.01], ['Pm', 'Mechanical input Pm', 'pu', 1, 0.05, 4, 0.01], ['H', 'Inertia constant H', 's', 5, 0.5, 15, 0.1], ['f', 'Frequency', 'Hz', 50, 1, 60, 1]],
    o: [['d0', 'Initial angle δ₀', '°', v => deg(Math.asin(v.Pm / v.Pmax))], ['dc', 'Critical clearing angle δc', '°', v => deg(Math.acos((PI - 2 * rad(v.d0)) * Math.sin(rad(v.d0)) - Math.cos(rad(v.d0))))], ['tc', 'Critical clearing time', 's', v => sq(2 * (v.H / (PI * v.f)) * (rad(v.dc) - rad(v.d0)) / v.Pm)], ['dm', 'Last stable angle π − δ₀', '°', v => 180 - v.d0]],
    plot: { x: ['d', 'Rotor angle δ', '°', 0, 180, ''], y: [['electrical power', (d, v) => v.Pmax * Math.sin(rad(d))], ['mechanical input', (d, v) => v.Pm]], yl: 'Power (pu)', mark: v => v.dc }, ck: [] });
  lab(696, { n: 'Load-flow size and Ybus', rf: 'Jacobian size', c: 'Newton–Raphson (polar): 2(N − 1) − N_PV equations. Each line adds two off-diagonal Ybus terms; for a line of reactance x, Y₁₂ = −1/(jx).',
    i: [['N', 'Buses N', '', 5, 2, 500, 1], ['npv', 'PV buses', '', 1, 0, 100, 1], ['nl', 'Lines', '', 7, 1, 1000, 1], ['x', 'One line reactance x', 'pu', 0.2, 0.01, 2, 0.001]],
    o: [['eq', 'NR equations (Jacobian order)', '', v => 2 * (v.N - 1) - v.npv], ['nz', 'Non-zero off-diagonal Ybus terms', '', v => 2 * v.nl], ['sp', 'Ybus sparsity (zeros)', '%', v => (1 - (v.N + 2 * v.nl) / (v.N * v.N)) * 100], ['B12', 'Y₁₂ = +j…', 'pu', v => 1 / v.x]],
    ck: [[{ N: 5, npv: 1 }, { eq: 7 }, 'Vol 3 p 706 · Sum 5'], [{ x: 0.2 }, { B12: 5 }, 'Vol 3 p 697 · quick check']] });
  lab(696, { n: 'Penalty factor', rf: 'Coordination equation', c: 'With losses, dispatch on (dC/dP) × L = λ, L = 1/(1 − ∂PL/∂P). A unit whose output raises losses is penalised.',
    i: [['dl', 'Incremental loss ∂PL/∂P', '', 0.2, -0.5, 0.9, 0.01], ['ic', 'Incremental cost', 'Rs/MWh', 2000, 1, 20000, 1]],
    o: [['L', 'Penalty factor', '', v => 1 / (1 - v.dl)], ['lam', 'Effective cost (× L)', 'Rs/MWh', v => v.ic * v.L]],
    ck: [[{ dl: 0.2 }, { L: 1.25 }, 'Vol 3 p 696 · quick check']] });
  lab(696, { n: 'Load-frequency control (one area)', rf: 'Load frequency control', c: 'Steady state Δf = −ΔPD/(D + 1/R). Stiffer droop (smaller R) or more load damping D → smaller frequency dip. Units share by rating ÷ droop.',
    i: [['dP', 'Load increase ΔPD', 'pu', 0.1, 0, 1, 0.001], ['R', 'Droop R', 'pu (Hz/pu ÷ f)', 0.05, 0.01, 0.2, 0.001], ['D', 'Load damping D', 'pu', 1, 0, 5, 0.01], ['f', 'Frequency', 'Hz', 50, 1, 60, 1]],
    o: [['df', 'Frequency change', 'pu', v => -v.dP / (v.D + 1 / v.R)], ['dfh', 'Frequency change', 'Hz', v => v.df * v.f], ['beta', 'Area frequency response β', 'pu', v => v.D + 1 / v.R]], ck: [] });

  /* ---------- Compensation ---------- */
  lab(714, { n: 'Shunt capacitor output at reduced voltage', rf: 'Shunt compensation', c: 'Qc = V²ωC: a 10 % voltage dip leaves only 81 % of the kVAR — just when it is needed most (a STATCOM holds its current better).',
    i: [['Qr', 'Rated output', 'kVAR', 100, 1, 100000, 1], ['Vp', 'Voltage', '% of rated', 90, 50, 120, 1]],
    o: [['Q', 'Actual output', 'kVAR', v => v.Qr * (v.Vp / 100) ** 2]],
    ck: [[{ Qr: 100, Vp: 90 }, { Q: 81 }, 'Vol 3 p 719 · Sum 1'], [{ Qr: 100, Vp: 90 }, { Q: 81 }, 'Vol 3 p 719 · R1']] });
  lab(714, { n: 'Voltage drop from P and Q', rf: 'Voltage–reactive power', c: 'ΔV ≈ (RP + XQ)/V; with X ≫ R the voltage depends mainly on Q — inject Q to hold the voltage up.',
    i: [['R', 'R', 'pu', 0.02, 0, 1, 0.001], ['X', 'X', 'pu', 0.1, 0, 2, 0.001], ['P', 'P', 'pu', 1, 0, 5, 0.01], ['Q', 'Q', 'pu', 0.5, -2, 2, 0.01], ['V', 'V', 'pu', 1, 0.8, 1.2, 0.001]],
    o: [['dV', 'Voltage drop', 'pu', v => (v.R * v.P + v.X * v.Q) / v.V], ['dVq', 'Part due to Q', 'pu', v => v.X * v.Q / v.V]], ck: [] });

  /* ---------- Protection & switchgear ---------- */
  lab(723, { n: 'IDMT relay — plug setting and operating time', rf: 'IDMT curve types', c: 'PSM = fault current/(plug setting × CT primary). Time = TMS × curve(PSM): standard inverse 0.14/(PSM^0.02 − 1), very inverse 13.5/(PSM − 1), extremely inverse 80/(PSM² − 1), long-time 120/(PSM − 1).',
    i: [['CT', 'CT primary', 'A', 400, 1, 5000, 1], ['PS', 'Plug setting', '%', 125, 50, 200, 5], ['If', 'Fault current (primary)', 'A', 4000, 1, 100000, 1], ['TMS', 'Time multiplier TMS', '', 0.2, 0.025, 1.5, 0.005], ['cv', 'Curve', '', 'standard inverse', ['standard inverse', 'very inverse', 'extremely inverse', 'long-time inverse']]],
    o: [['pick', 'Primary pickup', 'A', v => v.PS / 100 * v.CT], ['PSM', 'PSM', '', v => v.If / v.pick], ['t', 'Operating time', 's', v => { const p = v.PSM; return v.TMS * (v.cv === 'standard inverse' ? 0.14 / (p ** 0.02 - 1) : v.cv === 'very inverse' ? 13.5 / (p - 1) : v.cv === 'extremely inverse' ? 80 / (p * p - 1) : 120 / (p - 1)); }]],
    plot: { x: ['PSM', 'Plug setting multiplier', '', 1.3, 30, 'log'], y: [['standard inverse', (p, v) => v.TMS * 0.14 / (p ** 0.02 - 1)], ['very inverse', (p, v) => v.TMS * 13.5 / (p - 1)], ['extremely inverse', (p, v) => v.TMS * 80 / (p * p - 1)]], yl: 'Operating time (s)', mark: v => v.PSM },
    ck: [[{ CT: 400, PS: 125, If: 4000 }, { PSM: 8 }, 'Vol 3 p 743 · Sum 1'], [{ CT: 400, PS: 125, If: 4000, TMS: 0.2, cv: 'standard inverse' }, { t: 0.66 }, 'Vol 3 p 743 · Sum 2'], [{ CT: 400, PS: 125 }, { pick: 500 }, 'Vol 3 p 744 · Sum 9'],
      [{ CT: 400, PS: 125, If: 5000, TMS: 0.3, cv: 'standard inverse' }, { PSM: 10, t: 0.89 }, 'Vol 3 p 744 · Sum 10'], [{ CT: 400, PS: 125, If: 5000, TMS: 0.2, cv: 'very inverse' }, { t: 0.3 }, 'Vol 3 p 744 · Sum 11'], [{ CT: 400, PS: 125, If: 5000, TMS: 0.5, cv: 'extremely inverse' }, { t: 0.40 }, 'Vol 3 p 744 · Sum 12'],
      [{ CT: 400, PS: 125, If: 5000, TMS: 0.5, cv: 'standard inverse' }, { t: 1.49 }, 'Vol 3 p 729 · key-formula example'], [{ CT: 400, PS: 100, If: 2000, TMS: 0.2, cv: 'standard inverse' }, { PSM: 5, t: 0.86 }, 'Vol 3 p 729 · one-minute sum']] });
  lab(723, { n: 'Relay grading and fault clearing time', rf: 'Relay grading', c: 'Upstream relay = downstream time + margin (≈ 0.4 s). Clearing time = relay time + breaker opening time.',
    i: [['td', 'Downstream relay time', 's', 0.5, 0, 5, 0.01], ['m', 'Grading margin', 's', 0.4, 0.1, 1, 0.01], ['tr', 'Relay operating time', 's', 0.04, 0, 5, 0.01], ['cy', 'Breaker opening', 'cycles', 3, 1, 10, 0.5], ['f', 'Frequency', 'Hz', 50, 1, 60, 1]],
    o: [['tu', 'Upstream relay time', 's', v => v.td + v.m], ['tc', 'Fault clearing time', 's', v => v.tr + v.cy / v.f]],
    ck: [[{ td: 0.5, m: 0.4 }, { tu: 0.9 }, 'Vol 3 p 744 · Sum 13'], [{ tr: 0.04, cy: 3, f: 50 }, { tc: 0.1 }, 'Vol 3 p 745 · Sum 14']] });
  lab([723, 807], { n: 'CT secondary current and burden', rf: 'CT burden', c: 'Is = Ip × (secondary rating/primary rating). Burden VA = Is² × Zburden. Never open a CT secondary on load.',
    i: [['Np', 'CT primary rating', 'A', 1000, 1, 10000, 1], ['Ns', 'CT secondary rating', 'A', 5, 1, 5, 4], ['Ip', 'Primary current', 'A', 800, 0, 100000, 1], ['Zb', 'Burden impedance', 'Ω', 0.4, 0.01, 50, 0.01]],
    o: [['Is', 'Secondary current', 'A', v => v.Ip * v.Ns / v.Np], ['VA', 'Burden', 'VA', v => v.Is * v.Is * v.Zb]],
    ck: [[{ Np: 1000, Ns: 5, Ip: 800 }, { Is: 4 }, 'Vol 3 p 743 · Sum 3'], [{ Np: 1000, Ns: 5, Ip: 1000, Zb: 0.4 }, { Is: 5, VA: 10 }, 'Vol 3 p 745 · Sum 17'], [{ Np: 200, Ns: 5, Ip: 160 }, { Is: 4 }, 'Vol 3 p 811 · one-minute sum']] });
  lab([678, 723], { n: 'Breaker ratings — breaking and making', rf: 'Breaker ratings', c: 'Breaking capacity = √3 × kV × kA (MVA). Making current = 2.55 × the symmetrical breaking current (DC offset doubling).',
    i: [['V', 'Rated voltage', 'kV', 11, 0.4, 765, 0.1], ['I', 'Symmetrical breaking current', 'kA', 20, 0.1, 100, 0.1]],
    o: [['S', 'Breaking capacity', 'MVA', v => sq(3) * v.V * v.I], ['Im', 'Making current (peak)', 'kA', v => 2.55 * v.I]],
    ck: [[{ V: 11, I: 20 }, { S: 381 }, 'Vol 3 p 743 · Sum 4']] });
  lab(723, { n: 'Fusing factor and Preece’s law', rf: 'Fusing current', c: 'Fusing factor = minimum fusing current/rated current (> 1). Preece: I = K·d^(3/2).',
    i: [['Ir', 'Rated current', 'A', 10, 0.1, 1000, 0.1], ['If', 'Minimum fusing current', 'A', 15, 0.1, 2000, 0.1], ['K', 'Preece constant K', '', 80, 1, 500, 1], ['d', 'Wire diameter', 'mm', 0.5, 0.05, 5, 0.01]],
    o: [['FF', 'Fusing factor', '', v => v.If / v.Ir], ['Ip', 'Fusing current by Preece', 'A', v => v.K * v.d ** 1.5]],
    ck: [[{ Ir: 10, If: 15 }, { FF: 1.5 }, 'Vol 3 p 743 · Sum 5']] });
  lab(723, { n: 'Current chopping and restriking voltage', rf: 'Current chopping', c: 'Chopping current i before zero leaves ½Li² that charges C: v = i√(L/C). After a fault is cleared, the restriking voltage oscillates at fn = 1/(2π√LC) towards ≈ 2Vm; RRRV = 2Vm/t(peak).',
    i: [['i', 'Current chopped', 'A', 5, 0.1, 100, 0.1], ['L', 'Inductance L', 'H', 5, 0.001, 50, 0.001, 'log'], ['C', 'Capacitance C', 'nF', 5, 0.1, 10000, 0.1, 'log'], ['Vm', 'Peak system voltage', 'kV', 9, 0.1, 400, 0.1]],
    o: [['v', 'Chopping overvoltage', 'kV', v => v.i * sq(v.L / (v.C * 1e-9)) / 1000], ['fn', 'Restriking frequency', 'Hz', v => 1 / (2 * PI * sq(v.L * v.C * 1e-9))], ['tp', 'Time to peak', 'ms', v => PI * sq(v.L * v.C * 1e-9) * 1000], ['RRRV', 'RRRV (2Vm/t peak)', 'kV/µs', v => 2 * v.Vm / (v.tp * 1000)]],
    plot: { x: ['t', 'Time', 'ms', 0, 3, ''], y: [['restriking voltage', (t, v) => v.Vm * (1 - Math.cos(2 * PI * v.fn * t / 1000))]], yl: 'Voltage across the breaker (kV)' },
    ck: [[{ i: 5, L: 5, C: 5 }, { v: 158 }, 'Vol 3 p 743 · Sum 6']] });
  lab(723, { n: 'Impedance seen by a distance relay', rf: 'Impedance seen', c: 'Zrelay = Zprimary × CT ratio/PT ratio. Zone 1 is set to about 80 % of the line.',
    i: [['Z', 'Line impedance (primary)', 'Ω', 10, 0.1, 500, 0.1], ['CTp', 'CT primary', 'A', 400, 1, 5000, 1], ['CTs', 'CT secondary', 'A', 5, 1, 5, 4], ['PTp', 'PT primary', 'kV', 132, 0.4, 765, 0.1], ['PTs', 'PT secondary', 'V', 110, 100, 120, 1], ['z1', 'Zone-1 reach', '%', 80, 50, 95, 1]],
    o: [['Zr', 'Z seen by the relay', 'Ω', v => v.Z * (v.CTp / v.CTs) / (v.PTp * 1000 / v.PTs)], ['Z1', 'Zone-1 setting', 'Ω', v => v.Zr * v.z1 / 100]],
    ck: [[{ Z: 10, CTp: 400, CTs: 5, PTp: 132, PTs: 110, z1: 80 }, { Zr: 0.667, Z1: 0.533 }, 'Vol 3 p 745 · Sum 15']] });
  lab(723, { n: 'Biased (percentage) differential relay', rf: 'Percentage', c: 'Trip only if |I₁ − I₂| > k(I₁ + I₂)/2: the bias lets CT mismatch on through-faults pass.',
    i: [['I1', 'Current I₁', 'A', 5, 0, 100, 0.01], ['I2', 'Current I₂', 'A', 4.2, 0, 100, 0.01], ['k', 'Bias k', '%', 20, 0, 50, 1]],
    o: [['d', 'Difference |I₁ − I₂|', 'A', v => Math.abs(v.I1 - v.I2)], ['th', 'Threshold k(I₁ + I₂)/2', 'A', v => v.k / 100 * (v.I1 + v.I2) / 2], ['trip', 'Trip?', '', v => v.d > v.th ? 'yes' : 'no']],
    ck: [[{ I1: 5, I2: 4.2, k: 20 }, { trip: 'no' }, 'Vol 3 p 745 · Sum 16'], [{ I1: 10, I2: 9, k: 10 }, { d: 1, th: 0.95, trip: 'yes' }, 'Vol 3 p 728 · quick check']] });

  /* ---------- Earthing & energy audit ---------- */
  lab(759, { n: 'Earth-rod resistance', rf: 'Earthing', c: 'R = (ρ/2πl) ln(4l/d). n rods far apart in parallel ≈ R/n. Touch voltage ∝ fault current × R.',
    i: [['rho', 'Soil resistivity ρ', 'Ω·m', 100, 1, 10000, 1, 'log'], ['l', 'Rod length', 'm', 3, 0.5, 30, 0.1], ['d', 'Rod diameter', 'mm', 16, 5, 100, 1], ['n', 'Rods in parallel (far apart)', '', 1, 1, 20, 1], ['If', 'Earth-fault current', 'A', 100, 1, 10000, 1]],
    o: [['R', 'One rod', 'Ω', v => v.rho / (2 * PI * v.l) * Math.log(4 * v.l / (v.d / 1000))], ['Rn', 'n rods', 'Ω', v => v.R / v.n], ['Vt', 'Earth-potential rise If × R', 'V', v => v.If * v.Rn]], ck: [] });
  lab(759, { n: 'Energy-saving payback', rf: 'Energy conservation', c: 'Energy saved = (old − new) power × hours; simple payback = investment/annual saving.',
    i: [['Po', 'Old power', 'W', 60, 1, 100000, 1], ['Pn', 'New power', 'W', 9, 0, 100000, 1], ['n', 'Number of units', '', 100, 1, 100000, 1], ['h', 'Hours per year', 'h', 3000, 1, 8760, 1], ['t', 'Tariff', 'Rs/kWh', 7, 0.1, 30, 0.1], ['I', 'Investment', 'Rs', 20000, 0, 1e8, 100]],
    o: [['E', 'Energy saved', 'kWh/year', v => (v.Po - v.Pn) * v.n * v.h / 1000], ['S', 'Money saved', 'Rs/year', v => v.E * v.t], ['pb', 'Simple payback', 'years', v => v.I / v.S]], ck: [] });
})();
