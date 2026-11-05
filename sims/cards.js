/* Visual cards: original illustrated cards — the power system from the generator to your home (10 cards) and three
   maths shortcuts. Every number on a card is worked out live from the formula printed on that card.
   Loaded only when #cards opens; app.js shows the gallery and one card at a time (window.VC). */
(() => {
  'use strict';
  const W = window, PI = Math.PI, sq = Math.sqrt;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = (x, d) => !Number.isFinite(x) ? '–' : d != null ? x.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : (+x.toPrecision(4)).toLocaleString('en-IN', { maximumFractionDigits: 6 });
  const R = '#e5484d', Y = '#d99a0b', B = '#3b6fe0', G = '#16a34a', GR = '#94a3b8';
  const T = (x, y, t, c = 'vt', a = 'start') => `<text x="${x}" y="${y}" class="${c}" text-anchor="${a}">${t}</text>`;
  const L = (x1, y1, x2, y2, c = 'vl') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}"/>`;
  const P = (d, c = 'vl', st = '') => `<path d="${d}" class="${c}"${st ? ` style="${st}"` : ''}/>`;
  const svg = (body, lab, h = 220) => `<svg viewBox="0 0 360 ${h}" class="vcs" role="img" aria-label="${esc(lab)}">${body}</svg>`;
  const earth = (x, y) => L(x, y, x, y + 8) + L(x - 9, y + 8, x + 9, y + 8) + L(x - 6, y + 12, x + 6, y + 12) + L(x - 3, y + 16, x + 3, y + 16);
  const bolt = (x, y, c = R) => `<path d="M${x} ${y} l-9 18 h8 l-6 16 l16 -21 h-8 l6 -13 z" fill="${c}" class="vbolt"/>`;
  const sine = (x0, w, yc, A, per, ph) => { let d = ''; for (let x = 0; x <= w; x += 2) d += `${x ? 'L' : 'M'}${(x0 + x).toFixed(1)} ${(yc - A * Math.sin(2 * PI * x / per + ph)).toFixed(1)}`; return d; };
  const CARDS = [];
  const card = c => CARDS.push(c);

  /* ======================= the power system, from the generator to your home ======================= */
  card({ id: 'generator', grp: 'ps', n: 'Synchronous generator', sub: 'A turbine spins a magnet inside three coils: three voltages, 120° apart.', t: ['550', '580'],
    ctl: [['P', 'Number of poles', '', 4, 2, 48, 2]],
    calc: s => [['Synchronous speed N<sub>s</sub> = 120 f / P (f = 50 Hz)', `${nf(120 * 50 / s.P)} rpm`], ['Rotor', s.P <= 4 ? 'high speed: steam and gas turbines use 2 or 4 poles on a cylindrical rotor' : 'low speed: hydro turbines use many poles on a salient-pole rotor']],
    svg: (s, u) => {
      const n = Math.min(s.P, 16), dur = (0.6 + s.P / 8).toFixed(2);
      let rotor = ''; for (let i = 0; i < n; i++) rotor += `<g transform="rotate(${(i * 360 / n).toFixed(2)} 110 112)"><rect x="104" y="${s.P > 8 ? 70 : 62}" width="12" height="${s.P > 8 ? 36 : 44}" rx="6" fill="${i % 2 ? B : R}" opacity=".85"/></g>`;
      let coils = ''; [R, Y, B].forEach((c, k) => { [0, 180].forEach(o => { coils += `<g transform="rotate(${-90 + k * 120 + o} 110 112)"><rect x="170" y="100" width="12" height="24" rx="4" fill="${c}" opacity="${o ? 0.45 : 0.95}"/></g>`; }); });
      let waves = ''; [[R, 0], [Y, -2 * PI / 3], [B, 2 * PI / 3]].forEach(([c, ph], k) => { waves += P(sine(214, 210, 64 + k * 46, 14, 60, ph), 'vw', `stroke:${c}`); });
      return svg(`<defs><clipPath id="${u}c"><rect x="212" y="40" width="140" height="160"/></clipPath></defs>
        <circle cx="110" cy="112" r="79" class="vst"/><circle cx="110" cy="112" r="64" class="vl"/>${coils}
        <g class="spin" style="--dur:${dur}s">${rotor}<circle cx="110" cy="112" r="11" class="vhub"/></g>
        ${L(8, 112, 30, 112, 'vshaft')}${T(8, 100, 'turbine', 'vts')}
        <g clip-path="url(#${u}c)"><g class="scroll">${waves}</g></g>
        ${T(204, 68, 'R', 'vtb', 'end')}${T(204, 114, 'Y', 'vtb', 'end')}${T(204, 160, 'B', 'vtb', 'end')}
        ${T(282, 208, `${nf(120 * 50 / s.P)} rpm · 50 Hz`, 'vtb', 'middle')}${T(110, 210, 'stator: R, Y, B windings', 'vts', 'middle')}`, 'Generator: rotating poles inside a three-phase stator, and the three output voltages');
    },
    pts: ['A turbine (steam, gas or water) turns the rotor. Its DC-excited poles sweep past the three stator windings and induce three voltages 120° apart.',
      'The speed is locked to the frequency: N<sub>s</sub> = 120 f / P. More poles, slower rotor.',
      'Field current (excitation) sets the terminal voltage and the reactive power; the turbine sets the real power.',
      'Generators run at a medium voltage — typically 11 kV to about 25 kV — and feed a step-up transformer.'],
    fx: 'N<sub>s</sub> = 120 f / P', tip: 'At 50 Hz: 2 poles → 3000 rpm, 4 → 1500, 6 → 1000, 8 → 750. A question giving the speed and the frequency is asking for P = 120 f / N.' });

  card({ id: 'step-up', grp: 'ps', n: 'Generator (step-up) transformer', sub: 'Raises the voltage for the journey, and cuts the current by the same ratio.', t: ['497'],
    ctl: [['S', 'Power', 'MVA', 250, 50, 600, 10], ['V', 'Transmission voltage', 'kV', '400', [['110', '110 kV'], ['230', '230 kV'], ['400', '400 kV']]]],
    calc: s => { const i1 = s.S * 1e6 / (sq(3) * 11e3), i2 = s.S * 1e6 / (sq(3) * s.V * 1e3); return [['Generator side, 11 kV: I = S / (√3 × 11 kV)', `${nf(i1, 0)} A`], [`Line side, ${s.V} kV: I = S / (√3 × V)`, `${nf(i2, 0)} A`], ['Voltage ratio = current ratio', `${nf(s.V / 11, 2)} : 1`]]; },
    svg: (s, u) => {
      const i1 = s.S * 1e6 / (sq(3) * 11e3), i2 = s.S * 1e6 / (sq(3) * s.V * 1e3), w1 = Math.min(10, 2 + i1 / 3000), w2 = Math.max(1.4, Math.min(6, 1 + i2 / 400));
      let lv = '', hv = ''; for (let k = 0; k < 4; k++) lv += `<ellipse cx="128" cy="${70 + k * 26}" rx="18" ry="9" fill="none" stroke="${B}" stroke-width="4"/>`;
      for (let k = 0; k < 11; k++) hv += `<ellipse cx="232" cy="${62 + k * 10}" rx="17" ry="5" fill="none" stroke="${R}" stroke-width="1.6"/>`;
      return svg(`<rect x="122" y="40" width="116" height="140" rx="8" class="vcore"/><rect x="142" y="60" width="76" height="100" rx="4" class="vwin"/>
        <rect x="150" y="66" width="60" height="88" rx="10" class="vflux flow"/>${lv}${hv}
        <circle cx="40" cy="110" r="22" class="vbox"/>${T(40, 115, 'G', 'vtb', 'middle')}
        ${P('M62 110 H110', 'vflowl flow', `stroke-width:${w1.toFixed(1)}`)}${P('M250 110 H312', 'vflowl flow', `stroke-width:${w2.toFixed(1)}`)}
        <path d="M322 160 L330 70 L338 160 M316 84 H344 M318 98 H342" class="vl"/>
        ${T(86, 92, '11 kV', 'vtb', 'middle')}${T(86, 136, `${nf(i1, 0)} A`, 'vt', 'middle')}${T(282, 92, `${s.V} kV`, 'vtb', 'middle')}${T(282, 136, `${nf(i2, 0)} A`, 'vt', 'middle')}
        ${T(128, 200, 'LV: few turns, thick', 'vts', 'middle')}${T(236, 200, 'HV: many turns, thin', 'vts', 'middle')}${T(180, 32, 'laminated core — flux', 'vts', 'middle')}`, 'Step-up transformer: low-voltage winding with heavy current, high-voltage winding with small current');
    },
    pts: ['The generator voltage is stepped up for transmission; for the same power the current falls by the same ratio.',
      'Thick, few-turn winding on the generator side (high current); thin, many-turn winding on the line side.',
      'Usually delta on the generator side and star with an earthed neutral on the high-voltage side.',
      'Losses are tiny compared with what it saves in the lines: efficiency of large power transformers is above 99 %.'],
    fx: 'V<sub>2</sub> / V<sub>1</sub> = N<sub>2</sub> / N<sub>1</sub> = I<sub>1</sub> / I<sub>2</sub>', tip: 'For the same kVA, current is inversely proportional to voltage: I = S / (√3 V) for three phase.' });

  card({ id: 'line', grp: 'ps', n: 'Transmission line', sub: 'High voltage keeps the current — and the I²R loss — small.', t: ['627'],
    ctl: [['V', 'Line voltage', 'kV', '230', [['66', '66 kV'], ['110', '110 kV'], ['230', '230 kV'], ['400', '400 kV']]]],
    calc: s => { const I = 100e6 / (sq(3) * s.V * 1e3), Pl = 3 * I * I * 10 / 1e6; return [['Sending 100 MW at unity pf: I = P / (√3 V)', `${nf(I, 0)} A`], ['Loss in 10 Ω a phase: 3 I² R', `${nf(Pl, 2)} MW`], ['Loss as a share of 100 MW', `${nf(Pl, 1)} %`]]; },
    svg: (s, u) => {
      const I = 100e6 / (sq(3) * s.V * 1e3), Pl = 3 * I * I * 10 / 1e6, tower = x => `<path d="M${x - 14} 200 L${x - 4} 52 L${x + 4} 52 L${x + 14} 200 M${x - 9} 140 L${x + 9} 140 M${x - 6} 100 L${x + 6} 100 M${x - 11} 170 L${x + 6} 120 M${x + 11} 170 L${x - 6} 120" class="vl"/><path d="M${x - 34} 60 H${x + 34} M${x - 24} 80 H${x + 24}" class="vl"/>`;
      let c = ''; [[R, 60, -34], [Y, 60, 34], [B, 80, -24]].forEach(([col, y, dx]) => { const a = 60 + dx, b = 300 + dx, d = `M${a} ${y + 10} Q 180 ${y + 62} ${b} ${y + 10}`; c += P(d, 'vcond') + P(d, 'vdots flow', `stroke:${col}`) + L(a, y, a, y + 10, 'vins') + L(b, y, b, y + 10, 'vins'); });
      return svg(`${tower(60)}${tower(300)}${c}
        <rect x="96" y="186" width="168" height="12" rx="6" class="vbar0"/><rect x="96" y="186" width="${Math.max(3, Math.min(168, 168 * Pl / 25)).toFixed(1)}" height="12" rx="6" fill="${Pl > 5 ? R : Pl > 1 ? Y : G}"/>
        ${T(180, 180, `loss ${nf(Pl, 1)} % of 100 MW at ${s.V} kV`, 'vtb', 'middle')}${T(180, 24, `I = ${nf(I, 0)} A`, 'vtb', 'middle')}`, 'Transmission line between two towers, with the power loss at the chosen voltage');
    },
    pts: ['For the same power and power factor, I = P / (√3 V cos φ): raise the voltage and the current falls.',
      'The heating loss is 3 I² R, so it falls as 1/V²: double the voltage and the loss is a quarter.',
      'Conductors are usually ACSR — a steel core for strength, aluminium strands for conduction — hung from insulator strings.',
      'A long line lightly loaded at night can deliver a higher voltage than it was sent (Ferranti effect).'],
    fx: 'P<sub>loss</sub> = 3 I² R, I = P / (√3 V cos φ) → P<sub>loss</sub> ∝ 1 / V²', tip: 'Same power, same line: loss ratio = (V<sub>1</sub> / V<sub>2</sub>)². Going from 110 kV to 400 kV cuts the loss (400/110)² ≈ 13 times.' });

  card({ id: 'busbar', grp: 'ps', n: 'Busbars & substations', sub: 'The meeting point of lines, transformers and feeders — and how a fault is kept in one section.', t: ['723', '759'],
    ctl: [['sch', 'Busbar', '', 'sect', [['single', 'Single bus'], ['sect', 'Sectionalised bus']]], ['f', 'Fault', '', 'none', [['none', 'No fault'], ['f1', 'Fault on section 1']]]],
    calc: s => { const dead = s.f === 'f1' ? (s.sch === 'single' ? 4 : 2) : 0; return [['Feeders still supplied', `${4 - dead} of 4`], ['What the protection did', s.f === 'none' ? 'nothing to do' : s.sch === 'single' ? 'tripped every breaker on the bus: the whole substation is off' : 'tripped section 1 and the bus-section breaker: section 2 stays on']]; },
    svg: (s, u) => {
      const f = s.f === 'f1', sect = s.sch === 'sect', on1 = !f, on2 = !f || sect, col = on => on ? G : GR;
      const brk = (x, y, on) => `<rect x="${x - 8}" y="${y}" width="16" height="16" rx="3" class="vcb" style="fill:${on ? 'var(--paper)' : 'var(--bg)'};stroke:${on ? 'var(--ink)' : GR}"/>${on ? '' : L(x - 6, y + 2, x + 6, y + 14, 'vx')}`;
      let g = '';
      [[100, on1], [260, on2]].forEach(([x, on]) => { g += P(`M${x} 6 V36`, on ? 'vlive flow' : 'vdead') + brk(x, 40, on) + P(`M${x} 56 V100`, on ? 'vlive' : 'vdead'); });
      [[50, on1], [130, on1], [230, on2], [310, on2]].forEach(([x, on], k) => { g += P(`M${x} 100 V128`, on ? 'vlive' : 'vdead') + brk(x, 128, on) + P(`M${x} 144 V176`, on ? 'vlive flow' : 'vdead') + `<circle cx="${x}" cy="184" r="8" class="vbox"/><circle cx="${x}" cy="196" r="8" class="vbox"/>` + T(x, 214, `feeder ${k + 1}`, 'vts', 'middle'); });
      g += sect ? P('M24 100 H166', 'vbus', `stroke:${col(on1)}`) + P('M194 100 H336', 'vbus', `stroke:${col(on2)}`) + brk(180, 92, !f) + T(180, 86, 'bus-section breaker', 'vts', 'middle') : P('M24 100 H336', 'vbus', `stroke:${col(on1)}`);
      if (f) g += bolt(76, 76) + T(70, 120, 'fault', 'vtb', 'end');
      g += T(30, 92, sect ? 'section 1' : 'busbar', 'vts') + (sect ? T(330, 92, 'section 2', 'vts', 'end') : '') + T(100, 20, 'line 1', 'vts', 'end') + T(268, 20, 'line 2', 'vts');
      return svg(g, 'Substation single-line diagram: two incoming lines, a busbar and four feeders', 222);
    },
    pts: ['A busbar is a common conductor where incoming lines, transformers and outgoing feeders all connect, each through its own breaker and isolators.',
      'Single bus: simple and cheap, but a bus fault — or bus maintenance — takes out every circuit.',
      'Sectionalised bus: a bus-section breaker splits the bus, so a fault takes out only one half.',
      'Double-bus and one-and-a-half-breaker schemes keep circuits on during maintenance; they are used at important EHV substations.'],
    fx: 'Bus protection: Σ I<sub>in</sub> − Σ I<sub>out</sub> = 0 unless the fault is on the bus', tip: 'Busbar protection is differential (the Kirchhoff current law): for a fault outside, the currents into the bus add to zero; for a bus fault they do not.' });

  card({ id: 'breaker', grp: 'ps', n: 'Circuit breakers & isolators', sub: 'The breaker interrupts even fault current; the isolator only opens a dead circuit.', t: ['723'],
    ctl: [['V', 'System voltage', 'kV', '230', [['11', '11 kV'], ['33', '33 kV'], ['110', '110 kV'], ['230', '230 kV'], ['400', '400 kV']]], ['I', 'Breaking current', 'kA', 40, 10, 63, 1]],
    calc: s => [['Breaking capacity = √3 × V × I<sub>break</sub>', `${nf(sq(3) * s.V * s.I, 0)} MVA`], ['Usual interrupting medium at this voltage', +s.V <= 33 ? 'vacuum' : 'SF₆ gas']],
    svg: (s, u) => {
      const med = +s.V <= 33 ? 'vacuum' : 'SF₆ gas';
      return svg(`<rect x="96" y="54" width="168" height="76" rx="22" class="vcham"/>${T(180, 46, `interrupter · ${med}`, 'vts', 'middle')}
        ${P('M10 92 H120', 'vlive flow cbline')}${P('M240 92 H350', 'vlive flow cbline')}
        <rect x="120" y="80" width="46" height="24" rx="4" class="vcont"/><g class="cbmove"><rect x="168" y="80" width="72" height="24" rx="4" class="vcont"/></g>
        <path d="M166 92 l6 -7 l6 12 l6 -12 l6 12 l6 -12 l6 7" class="cbarc"/>
        ${T(143, 122, 'fixed', 'vts', 'middle')}${T(204, 122, 'moving', 'vts', 'middle')}
        <g class="cbflash">${bolt(330, 60)}</g>${T(180, 152, 'fault → contacts part → arc → out at a current zero', 'vt', 'middle')}
        ${P('M60 190 H150', 'vl')}<path d="M150 190 L196 172" class="vl"/>${P('M200 190 H300', 'vl')}<circle cx="150" cy="190" r="3" class="vhub"/><circle cx="200" cy="190" r="3" class="vhub"/>
        ${T(180, 212, 'isolator: opened only after the breaker, with no current', 'vts', 'middle')}`, 'Circuit breaker contacts opening with an arc, and an isolator below');
    },
    pts: ['A breaker makes and breaks any current up to its rating — including fault current many times the normal load.',
      'As the contacts part, an arc keeps the current flowing. It goes out at a current zero, when the medium (SF₆ gas, vacuum) removes the charge carriers faster than the voltage across the gap recovers.',
      'Vacuum breakers dominate at 11 and 33 kV; SF₆ breakers at higher voltages. Older types used oil or an air blast.',
      'An isolator has no arc-quenching ability: it only provides a visible open point for safe work.'],
    fx: 'Breaking capacity (MVA) = √3 × V<sub>rated</sub> (kV) × I<sub>break</sub> (kA)', tip: 'Switching order: to open — breaker first, then the isolators; to close — isolators first, then the breaker.' });

  card({ id: 'ct-vt', grp: 'ps', n: 'Current & voltage transformers (CT, VT)', sub: 'They bring kiloamperes and kilovolts down to 1 A and 110 V for meters and relays.', t: ['807', '723'],
    ctl: [['r', 'CT ratio', '', '400/1', [['100/1', '100/1'], ['400/1', '400/1'], ['800/5', '800/5']]], ['I', 'Line current', 'A', 300, 0, 900, 10], ['V', 'Line voltage', 'kV', 11, 9.9, 12.1, 0.1]],
    calc: s => { const [a, b] = s.r.split('/').map(Number), i2 = s.I * b / a; return [[`CT secondary: I<sub>2</sub> = I<sub>1</sub> × ${b} / ${a}`, `${nf(i2, 3)} A${s.I > a ? ' — above rating' : ''}`], ['VT secondary (11 kV / 110 V): V<sub>2</sub> = V<sub>1</sub> / 100', `${nf(s.V * 1000 / 100, 1)} V`]]; },
    svg: (s, u) => {
      const [a, b] = s.r.split('/').map(Number), i2 = s.I * b / a;
      let wind = ''; for (let k = 0; k < 7; k++) wind += L(98 + k * 4, 38, 98 + k * 4, 50, 'vwire');
      return svg(`${P('M8 64 H352', 'vlive flow')}${T(14, 56, `I₁ = ${nf(s.I, 0)} A · ${nf(s.V, 1)} kV`, 'vtb')}
        <ellipse cx="110" cy="64" rx="15" ry="30" class="vtor"/>${wind}${T(110, 26, `CT ${s.r}`, 'vtb', 'middle')}
        ${P('M102 94 V150 H72 M118 94 V150 H148', 'vwire2')}<circle cx="72" cy="164" r="15" class="vbox"/>${T(72, 169, 'A', 'vtb', 'middle')}<rect x="132" y="150" width="34" height="28" rx="5" class="vbox"/>${T(149, 168, 'relay', 'vts', 'middle')}
        ${T(110, 198, `I₂ = ${nf(i2, 3)} A`, 'vtb', 'middle')}${T(110, 214, 'never open a live CT secondary', 'vwarn', 'middle')}
        ${L(250, 64, 250, 84)}<circle cx="250" cy="96" r="12" class="vbox"/><circle cx="250" cy="116" r="12" class="vbox"/>${L(250, 128, 250, 140)}${earth(250, 140)}
        ${P('M262 116 H300 V150', 'vwire2')}<circle cx="300" cy="164" r="15" class="vbox"/>${T(300, 169, 'V', 'vtb', 'middle')}${T(300, 198, `V₂ = ${nf(s.V * 10, 1)} V`, 'vtb', 'middle')}${T(232, 106, 'VT', 'vtb', 'end')}`, 'A CT around the line feeding an ammeter and a relay, and a VT across the line feeding a voltmeter');
    },
    pts: ['CT: its primary is the line itself, in series; its secondary gives 1 A or 5 A at rated current into an ammeter or relay coil — a near short circuit.',
      'Never open the secondary of a CT carrying current: nothing then opposes the primary ampere-turns, the core saturates and a dangerously high voltage appears.',
      'VT (PT): connected across the line like a small, accurate transformer; secondary 110 V between lines.',
      'Both isolate meters and relays from the high voltage and let one standard instrument serve any line.'],
    fx: 'I<sub>2</sub> = I<sub>1</sub> × (rated secondary / rated primary)', tip: 'Before removing a meter from a CT circuit, short-circuit the CT secondary. A VT secondary is never short-circuited.' });

  card({ id: 'relay', grp: 'ps', n: 'Protective relays', sub: 'The brain of protection: sees a fault through the CT and trips the breaker — faster for bigger faults.', t: ['723'],
    ctl: [['If', 'Fault current', 'A', 4000, 600, 10000, 100], ['PS', 'Plug setting', '%', '100', [['50', '50 %'], ['100', '100 %'], ['150', '150 %'], ['200', '200 %']]], ['TMS', 'Time multiplier (TMS)', '', 0.2, 0.05, 1, 0.05]],
    calc: s => { const pk = 400 * s.PS / 100, m = s.If / pk, t = m > 1.05 ? s.TMS * 0.14 / (m ** 0.02 - 1) : NaN; return [['Pick-up (CT 400/1, 1 A relay): 400 A × plug setting', `${nf(pk, 0)} A`], ['PSM = fault current / pick-up', nf(m, 2)], ['Standard inverse: t = TMS × 0.14 / (PSM<sup>0.02</sup> − 1)', Number.isFinite(t) ? `${nf(t, 2)} s` : 'no trip — below pick-up']]; },
    svg: (s, u) => {
      const pk = 400 * s.PS / 100, m = s.If / pk, t = m > 1.05 ? s.TMS * 0.14 / (m ** 0.02 - 1) : NaN;
      const X = p => 176 + 170 * Math.log10(p) / Math.log10(30), Yt = tt => 190 - 160 * (Math.log10(tt) + 1.3) / 3.3;
      let cv = ''; for (let p = 1.1; p <= 30; p *= 1.06) { const tt = s.TMS * 0.14 / (p ** 0.02 - 1); if (tt <= 100 && tt >= 0.05) cv += `${cv ? 'L' : 'M'}${X(p).toFixed(1)} ${Yt(tt).toFixed(1)}`; }
      const grid = [0.1, 1, 10].map(tt => L(176, Yt(tt), 346, Yt(tt), 'vgrid') + T(172, Yt(tt) + 3, `${tt} s`, 'vts', 'end')).join('') + [1, 2, 5, 10, 20].map(p => L(X(p), 30, X(p), 190, 'vgrid') + T(X(p), 204, p, 'vts', 'middle')).join('');
      const pt = Number.isFinite(t) && m <= 30 ? `<circle cx="${X(m).toFixed(1)}" cy="${Yt(Math.max(0.05, Math.min(100, t))).toFixed(1)}" r="6" class="vpt"/>` : '';
      return svg(`${P('M8 150 H150', 'vlive flow')}<ellipse cx="34" cy="150" rx="7" ry="14" class="vtor"/><rect x="62" y="141" width="18" height="18" rx="3" class="vbox"/>${bolt(132, 116)}
        <rect x="16" y="56" width="70" height="40" rx="8" class="vrel"/>${T(51, 80, 'relay', 'vtb', 'middle')}${P('M34 136 V96', 'vwire2')}${P('M71 141 V96', 'vwire2 flow')}
        ${T(51, 46, 'sees I through CT', 'vts', 'middle')}${T(71, 178, 'breaker', 'vts', 'middle')}${T(132, 178, 'fault', 'vts', 'middle')}
        ${grid}${P(cv, 'vcurve')}${pt}${T(261, 20, 'IDMT: time vs PSM', 'vtb', 'middle')}${T(261, 218, 'plug setting multiplier', 'vts', 'middle')}
        ${T(110, 214, Number.isFinite(t) ? `trips in ${nf(t, 2)} s` : 'no trip', 'vtb', 'middle')}`, 'Relay fed by a CT trips a breaker; the inverse time curve with the operating point');
    },
    pts: ['A relay watches the CT and VT secondaries and decides whether there is a fault in its zone; if so, it energises the breaker’s trip coil.',
      'Overcurrent (IDMT) relays trip faster for bigger faults: inverse time, with a definite minimum.',
      'Differential relays compare the current into and out of a transformer, generator or bus; distance relays measure V/I, which is small for a nearby fault.',
      'Plug setting sets the pick-up current; the time multiplier (TMS) slides the whole curve up or down, for grading with the next relay.'],
    fx: 't = TMS × 0.14 / (PSM<sup>0.02</sup> − 1), PSM = I<sub>relay</sub> / (plug setting × rated current)', tip: 'On the standard-inverse curve, PSM 10 gives about 3 s at TMS 1 (2.97 s). The trip time is that × TMS.' });

  card({ id: 'arrester', grp: 'ps', n: 'Surge (lightning) arresters', sub: 'A non-linear resistor: shut at normal voltage, wide open to earth for a surge.', t: ['723', '759'],
    ctl: [['v', 'Voltage across it, × its reference voltage', '× V<sub>ref</sub>', 1.4, 0.5, 1.8, 0.05]],
    calc: s => { const I = 1e-3 * s.v ** 30; return [['ZnO characteristic I = 1 mA × (V / V<sub>ref</sub>)<sup>30</sup> (illustrative α = 30)', I < 1 ? `${nf(I * 1000, 3)} mA` : I < 1000 ? `${nf(I, 3)} A` : `${nf(I / 1000, 3)} kA`], ['State', s.v < 1 ? 'blocks: practically no current' : 'conducts: the surge goes to earth']]; },
    svg: (s, u) => {
      const I = 1e-3 * s.v ** 30, X = i => 20 + 130 * (Math.log10(i) + 6) / 11, Yv = v => 210 - 70 * v / 1.8;
      let cv = ''; for (let v = 0.3; v <= 1.8; v += 0.02) { const i = 1e-3 * v ** 30; if (i >= 1e-6 && i <= 1e5) cv += `${cv ? 'L' : 'M'}${X(i).toFixed(1)} ${Yv(v).toFixed(1)}`; }
      return svg(`${P('M8 60 H300', 'vlive')}<g class="surge"><path d="M40 60 l10 -26 l22 26" class="vsurge"/></g>${bolt(52, 4)}
        <rect x="292" y="44" width="40" height="40" rx="6" class="vbox"/>${T(312, 69, 'Tx', 'vtb', 'middle')}${T(312, 98, 'protected', 'vts', 'middle')}
        ${L(220, 60, 220, 74)}${[0, 1, 2, 3].map(k => `<rect x="210" y="${74 + k * 14}" width="20" height="12" rx="2" class="varr${s.v >= 1 ? ' on' : ''}"/>`).join('')}${L(220, 130, 220, 140)}${earth(220, 140)}
        ${P('M220 64 V138', s.v >= 1 ? 'vdots flow' : 'vnone', `stroke:${R}`)}${T(238, 104, 'ZnO arrester', 'vts')}
        ${L(20, 210, 150, 210, 'vaxis')}${L(20, 210, 20, 140, 'vaxis')}${P(cv, 'vcurve')}<circle cx="${X(Math.min(1e5, Math.max(1e-6, I))).toFixed(1)}" cy="${Yv(s.v).toFixed(1)}" r="5" class="vpt"/>
        ${T(85, 222, 'current (log)', 'vts', 'middle')}${T(16, 150, 'V', 'vts', 'end')}${T(90, 136, 'knee', 'vts', 'middle')}`, 'A surge on a line is sent to earth by a zinc-oxide arrester before the transformer; its V–I curve');
    },
    pts: ['Lightning, or switching a long line, launches a voltage surge that travels along the conductors.',
      'The arrester sits between line and earth, right beside the equipment it protects. At normal voltage it passes almost no current; above its knee it conducts heavily and holds the voltage down.',
      'Modern arresters are zinc-oxide (metal-oxide) blocks with no series gap; older ones used silicon carbide with spark gaps.',
      'Overhead earth (shield) wires and a low tower-footing resistance keep direct strokes off the phase conductors in the first place.'],
    fx: 'I = k V<sup>α</sup> (α ≈ 25 – 50 for ZnO)', tip: 'An arrester is a voltage-dependent resistor: very high resistance at normal voltage, very low during a surge.' });

  card({ id: 'capacitor', grp: 'ps', n: 'Capacitor banks & reactors', sub: 'Supplying (or absorbing) reactive power where it is needed.', t: ['380', '714', '1055'],
    ctl: [['P', 'Load', 'kW', 100, 10, 500, 10], ['p1', 'Power factor now', '', 0.7, 0.5, 0.95, 0.01], ['p2', 'Target power factor', '', 0.95, 0.8, 1, 0.01]],
    calc: s => { const t1 = Math.tan(Math.acos(s.p1)), t2 = Math.tan(Math.acos(Math.max(s.p1, s.p2))), qc = s.P * (t1 - t2); return [['Q<sub>C</sub> = P (tan φ<sub>1</sub> − tan φ<sub>2</sub>)', `${nf(qc, 1)} kVAR`], ['Apparent power: P / pf, before → after', `${nf(s.P / s.p1, 1)} → ${nf(s.P / Math.max(s.p1, s.p2), 1)} kVA`], ['Line current falls by', `${nf((1 - s.p1 / Math.max(s.p1, s.p2)) * 100, 1)} %`]]; },
    svg: (s, u) => {
      const p2 = Math.max(s.p1, s.p2), q1 = s.P * Math.tan(Math.acos(s.p1)), q2 = s.P * Math.tan(Math.acos(p2)), k = Math.min(190 / s.P, 150 / Math.max(q1, 1e-9)), x0 = 26, y0 = 34, xp = x0 + s.P * k;
      return svg(`${P(`M${x0} ${y0} H${xp}`, 'vtri', `stroke:${B}`)}${P(`M${xp} ${y0} V${y0 + q1 * k}`, 'vtri', `stroke:${R}`)}${P(`M${x0} ${y0} L${xp} ${y0 + q1 * k}`, 'vtri', 'stroke:var(--ink)')}
        ${P(`M${x0} ${y0} L${xp} ${y0 + q2 * k}`, 'vtri2', `stroke:${G}`)}${P(`M${xp + 10} ${y0 + q1 * k} V${y0 + q2 * k + 6}`, 'vtri', `stroke:${G}`)}<path d="M${xp + 4} ${y0 + q2 * k + 12} l6 -10 l6 10 z" fill="${G}"/>
        ${T((x0 + xp) / 2, y0 - 8, `P = ${nf(s.P, 0)} kW`, 'vtb', 'middle')}${T(xp + 18, y0 + (q1 + q2) * k / 2, `Q<tspan dy="3" font-size="8">C</tspan><tspan dy="-3"> = ${nf(q1 - q2, 1)} kVAR</tspan>`, 'vtb')}
        ${T(x0 + 6, y0 + q1 * k * 0.62 + 16, `S₁ = ${nf(s.P / s.p1, 0)} kVA`, 'vt')}${T(xp - 4, y0 + q1 * k + 16, `Q₁ = ${nf(q1, 0)} kVAR`, 'vt', 'end')}
        <g transform="translate(300 150)">${L(0, -40, 0, -10)}${L(-14, -10, 14, -10, 'vplate')}${L(-14, -2, 14, -2, 'vplate')}${L(0, -2, 0, 14)}${earth(0, 14)}</g>${T(300, 98, 'shunt', 'vts', 'middle')}${T(300, 214, 'capacitor bank', 'vts', 'middle')}`, 'Power triangle before and after adding a capacitor bank');
    },
    pts: ['Induction motors and transformers draw lagging reactive power: it adds current, and I²R loss, without doing useful work.',
      'A shunt capacitor bank supplies that reactive power locally: the line current, the loss and the voltage drop fall, and the power factor rises.',
      'A shunt reactor does the opposite — it absorbs reactive power, holding the voltage down on long, lightly loaded EHV lines (Ferranti rise).',
      'Series capacitors cancel part of a long line’s reactance, raising the power it can carry.'],
    fx: 'Q<sub>C</sub> = P (tan φ<sub>1</sub> − tan φ<sub>2</sub>)', tip: 'kVAR to raise the pf: take tan of both angles, subtract, multiply by the kW. (pf 0.7 → 0.95 on 100 kW: 69.2 kVAR.)' });

  card({ id: 'distribution', grp: 'ps', n: 'Distribution transformer & your home', sub: '11 kV down to 433 V, three phases and a neutral down your street.', t: ['497', '663'],
    ctl: [['a', 'Home on R phase', 'kW', 5, 0, 10, 0.5], ['b', 'Home on Y phase', 'kW', 3, 0, 10, 0.5], ['c', 'Home on B phase', 'kW', 2, 0, 10, 0.5]],
    calc: s => { const I = [s.a, s.b, s.c].map(p => p * 1000 / 240), x = I[0] - I[1] / 2 - I[2] / 2, y = (I[2] - I[1]) * sq(3) / 2, n = Math.hypot(x, y); return [['Phase currents (240 V, unity pf): I = P / V', I.map(i => `${nf(i, 1)} A`).join(' · ')], ['Neutral current = phasor sum I<sub>R</sub> + I<sub>Y</sub> + I<sub>B</sub>', `${nf(n, 2)} A`], ['Balance', n < 0.05 ? 'balanced: the neutral carries nothing' : 'unbalanced: the difference returns on the neutral']]; },
    svg: (s, u) => {
      const I = [s.a, s.b, s.c].map(p => p * 1000 / 240), mx = Math.max(1, ...I), ang = [90, -30, 210], cx = 300, cy = 52, sc = 34 / mx;
      const vec = (i, a, col) => { const x = cx + i * sc * Math.cos(a * PI / 180), y = cy - i * sc * Math.sin(a * PI / 180); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>`; };
      const nx = I.reduce((a, i, k) => a + i * Math.cos(ang[k] * PI / 180), 0), ny = I.reduce((a, i, k) => a + i * Math.sin(ang[k] * PI / 180), 0);
      const house = (x, col, kw, ph) => `<path d="M${x - 16} 200 V180 L${x} 166 L${x + 16} 180 V200 Z" class="vhouse"/>${P(`M${x} 166 V${ph}`, 'vwire2', `stroke:${col}`)}${P(`M${x + 8} 172 V156`, 'vwire2', 'stroke:var(--ink-2)')}${T(x, 214, `${nf(kw, 1)} kW`, 'vtb', 'middle')}`;
      return svg(`${L(40, 24, 40, 210, 'vpole')}${P('M4 14 H40 M4 20 H40 M4 26 H40', 'vlive')}${T(4, 10, '11 kV', 'vts')}<rect x="24" y="40" width="32" height="44" rx="7" class="vbox"/>${T(40, 66, 'DT', 'vts', 'middle')}
        ${P('M56 116 H352', 'vlive flow', `stroke:${R}`)}${P('M56 126 H352', 'vlive flow', `stroke:${Y}`)}${P('M56 136 H352', 'vlive flow', `stroke:${B}`)}${P('M56 156 H352', 'vneu')}${P('M48 84 V156', 'vwire2')}
        ${T(60, 110, '433 V: R Y B + N', 'vts')}${house(130, R, s.a, 116)}${house(210, Y, s.b, 126)}${house(290, B, s.c, 136)}
        <circle cx="${cx}" cy="${cy}" r="38" class="vgrid"/>${vec(I[0], 90, R)}${vec(I[1], -30, Y)}${vec(I[2], 210, B)}<line x1="${cx}" y1="${cy}" x2="${(cx + nx * sc).toFixed(1)}" y2="${(cy - ny * sc).toFixed(1)}" class="vneuv"/>${T(cx, 104, 'dashed: neutral', 'vts', 'middle')}`, 'Pole-mounted distribution transformer feeding three homes on R, Y and B phases, with the current phasors');
    },
    pts: ['Steps 11 kV down to 433 V at no load: three phases and a neutral, about 415 V between phases and 240 V from a phase to neutral at your home.',
      'Usually delta on the 11 kV side and star with an earthed neutral on the LT side (Dyn11). Each home is fed from one phase and the neutral.',
      'Homes are spread over R, Y and B. Balanced loads leave the neutral almost idle; unbalanced loads send the difference back along the neutral.',
      'It is energised all day but often lightly loaded, so it is designed for a high all-day efficiency: low core (iron) loss.'],
    fx: 'I<sub>N</sub> = I<sub>R</sub> + I<sub>Y</sub> + I<sub>B</sub> (phasors); all-day efficiency = kWh out / kWh in over 24 h', tip: 'Distribution transformers peak in efficiency at a lighter load than power transformers, because their energy loss over a whole day — not their full-load efficiency — is what counts.' });

  /* ======================= maths shortcuts ======================= */
  card({ id: 'nested-radicals', grp: 'm', n: 'Endless square roots', sub: '√(a + √(a + √(a + …))) in one line — and why it works.', t: ['316'],
    ctl: [['a', 'a', '', 6, 2, 90, 1], ['k', 'Kind', '', 'plus', [['plus', '√(a + √(a + …))'], ['minus', '√(a − √(a − …))'], ['times', '√(a √(a √(a …)))']]]],
    calc: s => { const x = s.k === 'plus' ? (1 + sq(1 + 4 * s.a)) / 2 : s.k === 'minus' ? (-1 + sq(1 + 4 * s.a)) / 2 : s.a; const it = []; let v = sq(s.a); for (let j = 0; j < 6; j++) { it.push(v); v = s.k === 'plus' ? sq(s.a + v) : s.k === 'minus' ? sq(Math.max(0, s.a - v)) : sq(s.a * v); }
      const r = sq(1 + 4 * s.a), perfect = Math.abs(r - Math.round(r)) < 1e-9;
      return [[s.k === 'plus' ? 'x = (1 + √(1 + 4a)) / 2' : s.k === 'minus' ? 'x = (−1 + √(1 + 4a)) / 2' : 'x = a', nf(x, 6)], ['Working it out step by step: √a, then one more root each time', it.map(v => nf(v, 4)).join(' → ')], ['Shortcut', s.k === 'times' ? 'always a' : perfect ? `1 + 4a = ${nf(1 + 4 * s.a)} = ${Math.round(r)}²: a whole-number answer` : `1 + 4a = ${nf(1 + 4 * s.a)} is not a perfect square`]]; },
    svg: (s, u) => {
      const x = s.k === 'plus' ? (1 + sq(1 + 4 * s.a)) / 2 : s.k === 'minus' ? (-1 + sq(1 + 4 * s.a)) / 2 : s.a, pts = []; let v = sq(s.a); for (let j = 0; j < 8; j++) { pts.push(v); v = s.k === 'plus' ? sq(s.a + v) : s.k === 'minus' ? sq(Math.max(0, s.a - v)) : sq(s.a * v); }
      const lo = Math.min(x, ...pts) * 0.92, hi = Math.max(x, ...pts) * 1.04 + 1e-9, X = j => 40 + j * 40, Yv = y => 196 - 110 * (y - lo) / (hi - lo);
      const sym = s.k === 'plus' ? '+' : s.k === 'minus' ? '−' : '·';
      return svg(`${T(180, 34, `x = √(${s.a} ${sym} √(${s.a} ${sym} √(${s.a} ${sym} …)))`, 'vbig', 'middle')}${T(180, 60, s.k === 'times' ? 'square both sides: x² = a·x → x = a' : `square both sides: x² = a ${sym} x → x² ${s.k === 'plus' ? '−' : '+'} x − a = 0`, 'vt', 'middle')}
        ${L(40, Yv(x), 336, Yv(x), 'vlim')}${T(340, Yv(x) - 6, `x = ${nf(x, 4)}`, 'vtb', 'end')}
        ${pts.map((y, j) => `${j ? L(X(j - 1), Yv(pts[j - 1]), X(j), Yv(y), 'vstep') : ''}<circle cx="${X(j)}" cy="${Yv(y).toFixed(1)}" r="5" class="vpt dot" style="animation-delay:${j * 0.25}s"/>`).join('')}
        ${T(40, 214, '√a', 'vts', 'middle')}${T(320, 214, '7 more roots', 'vts', 'middle')}`, 'An endless square root and the values that close in on its answer');
    },
    pts: ['Call the whole thing x. The part under the first root, after a, is x again — so x = √(a + x).',
      'Square: x² = a + x → x² − x − a = 0 → x = (1 + √(1 + 4a)) / 2 (the positive root).',
      'For √(a − √(a − …)): x² = a − x → x = (−1 + √(1 + 4a)) / 2. For √(a √(a √(a …))): x² = a x → x = a.',
      'When a = n(n − 1) — 2, 6, 12, 20, 30, 42, 56 … — the plus kind is exactly n and the minus kind is n − 1.'],
    fx: '√(a + √(a + …)) = (1 + √(1 + 4a)) / 2', tip: '√(12 + √(12 + …)) = 4 and √(12 − √(12 − …)) = 3, because 12 = 4 × 3. A finite chain √(a√(a√a)) with n roots is a<sup>1 − 1/2ⁿ</sup>.' });

  card({ id: 'astc', grp: 'm', n: 'Signs of sin, cos, tan: the ASTC wheel', sub: 'Which ratio is positive in which quadrant — and the reference angle.', t: [],
    ctl: [['th', 'Angle θ', '°', 150, 0, 360, 1]], play: { k: 'th', step: 1, ms: 40, wrap: [0, 360] },
    calc: s => { const t = s.th % 360, q = t === 0 || t === 90 || t === 180 || t === 270 ? 0 : Math.floor(t / 90) + 1, ref = q === 1 ? t : q === 2 ? 180 - t : q === 3 ? t - 180 : q === 4 ? 360 - t : NaN, r = t * PI / 180, z = x => Math.abs(x) < 1e-12 ? 0 : x;
      const sn = z(Math.sin(r)), cs = z(Math.cos(r)), tn = Math.abs(cs) < 1e-12 ? NaN : z(Math.tan(r));
      return [['Quadrant', q ? ['I', 'II', 'III', 'IV'][q - 1] + ` — ${['All', 'Sin', 'Tan', 'Cos'][q - 1]} positive` : 'on an axis'], ['Reference angle', q ? `${ref}° (${['θ', '180° − θ', 'θ − 180°', '360° − θ'][q - 1]})` : '–'], ['sin θ · cos θ · tan θ', `${nf(sn, 4)} · ${nf(cs, 4)} · ${Number.isFinite(tn) ? nf(tn, 4) : 'undefined'}`]]; },
    svg: (s, u) => {
      const t = s.th % 360, r = t * PI / 180, cx = 110, cy = 112, R0 = 82, x = cx + R0 * Math.cos(r), y = cy - R0 * Math.sin(r), q = Math.floor(t / 90) % 4;
      const quad = (k, lab, sub, col) => { const a0 = k * 90, a1 = a0 + 90, p = (a) => `${(cx + 96 * Math.cos(a * PI / 180)).toFixed(1)} ${(cy - 96 * Math.sin(a * PI / 180)).toFixed(1)}`, mid = (a0 + 45) * PI / 180;
        return `<path d="M${cx} ${cy} L${p(a0)} A96 96 0 0 0 ${p(a1)} Z" fill="${col}" opacity="${q === k ? 0.32 : 0.12}"/>${T((cx + 56 * Math.cos(mid)).toFixed(1), (cy - 56 * Math.sin(mid) + 8).toFixed(1), lab, 'vquad', 'middle')}${T((cx + 56 * Math.cos(mid)).toFixed(1), (cy - 56 * Math.sin(mid) + 22).toFixed(1), sub, 'vts', 'middle')}`; };
      const sgn = (v) => Math.abs(v) < 1e-12 ? '0' : v > 0 ? '+' : '−', cl = v => Math.abs(v) < 1e-12 ? 'vt' : v > 0 ? 'vpos' : 'vneg';
      const sn = Math.sin(r), cs = Math.cos(r), tn = sn / cs;
      return svg(`${quad(0, 'A', 'all +', G)}${quad(1, 'S', 'sin +', B)}${quad(2, 'T', 'tan +', Y)}${quad(3, 'C', 'cos +', R)}
        ${L(cx - 100, cy, cx + 100, cy, 'vaxis')}${L(cx, cy - 100, cx, cy + 100, 'vaxis')}<circle cx="${cx}" cy="${cy}" r="${R0}" class="vunit"/>
        ${L(x, y, x, cy, 'vproj')}${L(x, y, cx, y, 'vproj2')}<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="vrad"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" class="vpt"/>
        ${T(cx + 6, cy - 6, `${t}°`, 'vtb')}${T(232, 180, 'Add Sugar To Coffee:', 'vts')}${T(232, 194, 'A, S, T, C from I to IV', 'vts')}
        <g transform="translate(232 54)">${T(0, 0, 'at θ', 'vts')}${[['sin', sn], ['cos', cs], ['tan', Math.abs(cs) < 1e-12 ? NaN : tn]].map(([n, v], k) => `${T(0, 30 + k * 34, n, 'vtb')}${T(48, 30 + k * 34, Number.isFinite(v) ? sgn(v) : '∞', Number.isFinite(v) ? cl(v) : 'vt')}${T(70, 30 + k * 34, Number.isFinite(v) ? nf(v, 3) : 'undefined', 'vt')}`).join('')}</g>`, 'Unit circle with the four quadrants marked A, S, T, C and the radius at the chosen angle');
    },
    pts: ['Quadrant I: all three ratios positive. II: only sin (and cosec). III: only tan (and cot). IV: only cos (and sec).',
      'Mnemonic: Add Sugar To Coffee — A, S, T, C going anticlockwise from quadrant I.',
      'Any angle reduces to its reference angle: 180° − θ in II, θ − 180° in III, 360° − θ in IV. Then attach the sign from the wheel.',
      'At 90° and 270°, cos θ = 0, so tan θ is undefined.'],
    fx: 'sin(180° − θ) = sin θ, cos(180° − θ) = −cos θ, tan(180° + θ) = tan θ', tip: 'sin 150° = +sin 30° = 0.5 (II: sin +). cos 240° = −cos 60° = −0.5 (III: cos −). tan 300° = −tan 60° = −√3 (IV: tan −).' });

  const FN = { x2: ['x²', x => x * x, x => 2 * x, '((x + h)² − x²) / h = (2xh + h²) / h = 2x + h → 2x'], x3: ['x³', x => x ** 3, x => 3 * x * x, '((x + h)³ − x³) / h = 3x² + 3xh + h² → 3x²'],
    sin: ['sin x', Math.sin, Math.cos, '(sin(x + h) − sin x) / h = cos x · (sin h / h) − sin x · (1 − cos h) / h → cos x'], exp: ['eˣ', Math.exp, Math.exp, '(eˣ⁺ʰ − eˣ) / h = eˣ (eʰ − 1) / h → eˣ'] };
  card({ id: 'derivative', grp: 'm', n: 'The derivative from first principles', sub: 'Shrink h, and the secant through two points turns into the tangent.', t: ['123'],
    ctl: [['f', 'Function', '', 'x2', [['x2', 'x²'], ['x3', 'x³'], ['sin', 'sin x'], ['exp', 'eˣ']]], ['x0', 'Point x', '', 1, -2, 2, 0.1], ['h', 'Step h', '', 1, 0.01, 2, 0.01]],
    play: { k: 'h', mul: 0.95, ms: 60, from: 2, to: 0.01 },
    calc: s => { const [n, f, df, der] = FN[s.f], m = (f(s.x0 + s.h) - f(s.x0)) / s.h, e = df(s.x0); return [[`Slope of the secant: (f(x + h) − f(x)) / h`, nf(m, 5)], [`Exact f′(x) = ${s.f === 'x2' ? '2x' : s.f === 'x3' ? '3x²' : s.f === 'sin' ? 'cos x' : 'eˣ'} at x = ${nf(s.x0, 2)}`, nf(e, 5)], ['Gap (shrinks with h)', nf(m - e, 5)], [`For ${n}`, der]]; },
    svg: (s, u) => {
      const [n, f, df] = FN[s.f], xs = [], X0 = 30, X1 = 340, xa = -3, xb = 3; for (let j = 0; j <= 120; j++) xs.push(xa + (xb - xa) * j / 120);
      const ys = xs.map(f), lo = Math.max(-12, Math.min(...ys)), hi = Math.min(16, Math.max(...ys)), X = x => X0 + (X1 - X0) * (x - xa) / (xb - xa), Yv = y => 196 - 170 * (y - lo) / (hi - lo);
      const cl = y => Math.max(8, Math.min(206, Yv(y)));
      const curve = xs.map((x, j) => `${j ? 'L' : 'M'}${X(x).toFixed(1)} ${Yv(f(x)).toFixed(1)}`).join('');
      const x1 = s.x0, y1 = f(x1), x2 = s.x0 + s.h, y2 = f(x2), m = (y2 - y1) / s.h, e = df(x1), line = (sl, cls) => `<line x1="${X(xa)}" y1="${Yv(y1 + sl * (xa - x1)).toFixed(1)}" x2="${X(xb)}" y2="${Yv(y1 + sl * (xb - x1)).toFixed(1)}" class="${cls}"/>`;
      return svg(`<defs><clipPath id="${u}p"><rect x="${X0}" y="8" width="${X1 - X0}" height="198"/></clipPath></defs>
        ${lo < 0 && hi > 0 ? L(X0, Yv(0), X1, Yv(0), 'vaxis') : ''}${L(X(0), 8, X(0), 206, 'vaxis')}
        <g clip-path="url(#${u}p)">${P(curve, 'vcurve')}${line(e, 'vtan')}${line(m, 'vsec')}</g>
        ${L(X(x1), cl(y1), X(x2), cl(y1), 'vproj')}${L(X(x2), cl(y1), X(x2), cl(y2), 'vproj')}${T((X(x1) + X(x2)) / 2, cl(y1) + 14, 'h', 'vtb', 'middle')}
        <circle cx="${X(x1).toFixed(1)}" cy="${cl(y1).toFixed(1)}" r="5" class="vpt"/><circle cx="${X(x2).toFixed(1)}" cy="${cl(y2).toFixed(1)}" r="5" class="vpt2"/>
        ${T(X0 + 4, 22, `f(x) = ${n}`, 'vtb')}${T(X1, 22, `secant slope ${nf(m, 3)}`, 'vsect', 'end')}${T(X1, 38, `tangent slope ${nf(e, 3)}`, 'vtant', 'end')}`, 'A curve with a secant through two points and the tangent it approaches as h shrinks');
    },
    pts: ['Pick a point x and a second point a step h further on. The secant through them has slope (f(x + h) − f(x)) / h.',
      'Let h shrink toward 0: the second point slides down the curve and the secant swings onto the tangent.',
      'The limit of that slope is the derivative: f′(x) = lim<sub>h→0</sub> (f(x + h) − f(x)) / h.',
      'Press ▶ Shrink h to watch it happen; the gap between the two slopes goes to zero with h.'],
    fx: 'f′(x) = lim<sub>h → 0</sub> [f(x + h) − f(x)] / h', tip: 'For x²: (2xh + h²)/h = 2x + h → 2x. The leftover term (here h) is exactly the gap you see between the secant and the tangent.' });

  /* ======================= the card view ======================= */
  const defaults = c => Object.fromEntries((c.ctl || []).map(x => [x[0], x[3]]));
  const isCh = x => Array.isArray(x[4]);
  let seq = 0;
  W.VC = {
    list: CARDS,
    thumb: c => c.svg(defaults(c), 'vt' + c.id),
    mount(box, id, A = {}) {
      const c = CARDS.find(x => x.id === id); if (!c) { box.innerHTML = '<p class="empty">This card could not be found.</p>'; return; }
      const s = defaults(c), uid = 'vc' + (++seq); let timer = null;
      const out = rows => rows.map(([k, v]) => `<div><span>${k}</span><b${String(v).replace(/<[^>]+>/g, '').length <= 18 ? ' class="nw"' : ''}>${v}</b></div>`).join('');
      const un = u => !u ? '' : u === '°' ? u : ' ' + u;
      const ctl = (c.ctl || []).map(x => isCh(x) ? `<div class="vcch" role="group" aria-label="${esc(x[1])}"><span>${esc(x[1])}</span><div>${x[4].map(([v, t]) => `<button type="button" data-ch="${x[0]}" data-v="${esc(v)}" aria-pressed="${String(v) === String(s[x[0]])}">${t}</button>`).join('')}</div></div>`
        : `<label class="vcr"><span>${esc(x[1])} <b data-o="${x[0]}">${nf(s[x[0]])}${un(x[2])}</b></span><input type="range" min="${x[4]}" max="${x[5]}" step="${x[6]}" value="${s[x[0]]}" data-k="${x[0]}" aria-label="${esc(x[1])}"></label>`).join('');
      box.innerHTML = `<article class="vc">
        <header class="vch"><span class="vck">${c.grp === 'ps' ? `Power system · ${CARDS.filter(x => x.grp === 'ps').indexOf(c) + 1} of ${CARDS.filter(x => x.grp === 'ps').length}` : 'Maths shortcut'}</span><h1>${esc(c.n)}</h1><p>${c.sub}</p></header>
        <div class="vcfig"></div>
        ${c.ctl ? `<div class="vcctl">${ctl}${c.play ? `<button type="button" class="btn vcplay" data-play aria-pressed="false">▶ ${c.play.k === 'h' ? 'Shrink h' : 'Rotate'}</button>` : ''}</div>` : ''}
        <div class="vcout" aria-live="polite"></div>
        <div class="vcgrid"><section class="vcpts"><h2>How it works</h2><ul>${c.pts.map(p => `<li>${p}</li>`).join('')}</ul></section>
          <section class="vcfx"><h2>Key formula</h2><p>${c.fx}</p></section><section class="vctip"><h2>Exam tip</h2><p>${c.tip}</p></section></div>
        ${c.t.length && A.topicLink ? `<p class="vclinks">In your book: ${c.t.map(A.topicLink).join(' ')}</p>` : ''}</article>`;
      const fig = box.querySelector('.vcfig'), o = box.querySelector('.vcout');
      const paint = () => { fig.innerHTML = c.svg(s, uid); o.innerHTML = out(c.calc(s)); (c.ctl || []).forEach(x => { if (isCh(x)) return; const b = box.querySelector(`[data-o="${x[0]}"]`), r = box.querySelector(`[data-k="${x[0]}"]`); if (b) b.innerHTML = `${nf(s[x[0]])}${un(x[2])}`; if (r && +r.value !== s[x[0]]) r.value = s[x[0]]; }); };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } const b = box.querySelector('[data-play]'); if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = `▶ ${c.play.k === 'h' ? 'Shrink h' : 'Rotate'}`; } };
      box.oninput = e => { const k = e.target.dataset.k; if (!k) return; stop(); s[k] = +e.target.value; paint(); };
      box.onclick = e => {
        const b = e.target.closest('[data-ch]'); if (b) { s[b.dataset.ch] = b.dataset.v; box.querySelectorAll(`[data-ch="${b.dataset.ch}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); return; }
        if (e.target.closest('[data-play]')) {
          if (timer) { stop(); return; }
          const p = c.play, btn = e.target.closest('[data-play]'); btn.setAttribute('aria-pressed', 'true'); btn.textContent = '❚❚ Pause';
          if (p.mul) s[p.k] = p.from;
          timer = setInterval(() => {
            if (!box.isConnected) { clearInterval(timer); return; }
            if (p.mul) { s[p.k] = Math.max(p.to, +(s[p.k] * p.mul).toFixed(4)); if (s[p.k] <= p.to) stop(); }
            else s[p.k] = (s[p.k] + p.step) % p.wrap[1];
            paint();
          }, p.ms);
        }
      };
      paint();
    }
  };
})();

/* Power electronics atlas (#pe): every converter as a live circuit — its diagram, its input and output waveforms
   (simulated step by step from ideal switches), and its formulas, each shown beside the same quantity measured from
   the drawn waveform, so formula and waveform check each other. Also: a waveform ↔ formula lab, the converter
   comparison, the controller formula table and the regenerative-mode words. window.PE; app.js draws the pages. */
(() => {
  'use strict';
  const W = window, PI = Math.PI, sq = Math.sqrt, R2 = Math.SQRT2, R3 = sq(3), D2R = PI / 180;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = (x, d) => { if (typeof x === 'string') return esc(x); if (!Number.isFinite(x)) return '–'; if (d != null) return x.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const a = Math.abs(x); if (a < 1e-9) return '0'; if (a >= 1e6 || a < 1e-3) return x.toExponential(2); return (+x.toPrecision(4)).toLocaleString('en-IN', { maximumFractionDigits: 6 }); };
  const K = { vs: '#64748b', vo: '#7c3aed', io: '#ea580c', is: '#0e7490', g: '#16a34a', r: '#dc2626', y: '#d97706', b: '#2563eb' };
  const N = 720;                                     // samples per cycle (0.5°)
  const mod = (x, m) => ((x % m) + m) % m;
  const lastN = (a, n = N) => a.slice(a.length - n);
  const betaOf = (a, phi) => { const f = b => Math.sin(b - phi) - Math.sin(a - phi) * Math.exp(-(b - a) / Math.tan(phi)); let lo = Math.max(PI, a + 1e-6), hi = lo;
    for (let k = 0; k < 800 && f(hi + 0.002) * f(lo) > 0; k++) hi += 0.002; hi += 0.002; if (f(lo) * f(hi) > 0) return NaN;
    for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; };
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const rmsOf = a => sq(a.reduce((s, x) => s + x * x, 0) / a.length);
  const fund = a => { let p = 0, q = 0; const n = a.length; for (let k = 0; k < n; k++) { const t = 2 * PI * k / n; p += a[k] * Math.sin(t); q += a[k] * Math.cos(t); } return Math.hypot(p, q) * 2 / n; };
  const near = (a, b, t = 0) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Math.max(Math.abs(b) * 0.02, 0.02 * Math.max(Math.abs(a), Math.abs(b), 1e-9) + 1e-6, 0.015, t);

  /* ---------------- drawing: waveforms ---------------- */
  // panels: [{ n: name, s: [{ys, col, n, dash}], avg, rms, unit }], x in degrees 0 … span (or periods when T)
  const BC = ['#7c3aed', '#0e7490', '#ea580c', '#16a34a', '#db2777', '#2563eb', '#b45309', '#475569'];
  const devOf = l => String(l).split('|')[0];
  function plot(xs, panels, o = {}) {
    const Wd = 400, Lm = 34, Rm = 8, gap = 18, PW = Wd - Lm - Rm, span = xs[xs.length - 1] - xs[0] || 1;
    const X = x => Lm + PW * (x - xs[0]) / span;
    let g = '', y0 = 4;
    const ticks = (yt, yb, last) => (o.ticks || []).forEach(([x, t]) => { g += `<line x1="${X(x).toFixed(1)}" y1="${yt}" x2="${X(x).toFixed(1)}" y2="${yb}" class="pegrid"/>` + (last ? `<text x="${X(x).toFixed(1)}" y="${yb + 13}" class="pet" text-anchor="middle">${t}</text>` : ''); });
    panels.forEach((P, k) => {
      const last = k === panels.length - 1;
      if (P.band) {
        const bh = 22, n = P.band.length, names = [...new Set(P.band.map(devOf))]; let s0 = 0;
        g += `<text x="${Lm + 2}" y="${y0 + 10}" class="pen" fill="#475569">${P.n || 'Conducting'}</text>`; const yb = y0 + 14;
        for (let i = 1; i <= n; i++) if (i === n || devOf(P.band[i]) !== devOf(P.band[s0])) {
          const d = devOf(P.band[s0]), xa = Lm + PW * s0 / n, w = PW * (i - s0) / n, col = d === 'none' ? '#cbd5e1' : BC[names.indexOf(d) % BC.length], mx = Math.floor(w / 5.4);
          g += `<rect x="${xa.toFixed(1)}" y="${yb}" width="${Math.max(0.6, w - 0.6).toFixed(1)}" height="${bh}" fill="${col}"/>`;
          if (mx >= 2) g += `<text x="${(xa + w / 2).toFixed(1)}" y="${yb + 15}" class="peb" text-anchor="middle"${d === 'none' ? ' fill="#334155"' : ''}>${esc(d.length > mx ? d.slice(0, mx - 1) + '…' : d)}</text>`;
          s0 = i;
        }
        if (last) (o.ticks || []).forEach(([x, t]) => { g += `<text x="${X(x).toFixed(1)}" y="${yb + bh + 13}" class="pet" text-anchor="middle">${t}</text>`; });
        y0 = yb + bh + gap; return;
      }
      const ph = P.h || o.h || 84, all = P.s.flatMap(s => s.ys).filter(Number.isFinite);
      if (P.n) { g += `<text x="${Lm + 2}" y="${y0 + 10}" class="pen" fill="${P.s[0].col}">${P.n}</text>`; y0 += 14; }
      let lo = Math.min(0, ...all), hi = Math.max(0, ...all); if (hi - lo < 1e-9) { hi += 1; lo -= 1; } const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      const Y = y => y0 + ph - ph * (y - lo) / (hi - lo);
      g += `<rect x="${Lm}" y="${y0}" width="${PW}" height="${ph}" rx="6" class="pebox"/>`;
      ticks(y0, y0 + ph, last);
      g += `<line x1="${Lm}" y1="${Y(0).toFixed(1)}" x2="${Wd - Rm}" y2="${Y(0).toFixed(1)}" class="pezero"/>`;
      if (P.shade) { let d = `M${X(xs[0]).toFixed(1)},${Y(0).toFixed(1)}`; P.shade.forEach((y, i) => { d += `L${X(xs[i]).toFixed(1)},${Y(Number.isFinite(y) ? y : 0).toFixed(1)}`; }); d += `L${X(xs[xs.length - 1]).toFixed(1)},${Y(0).toFixed(1)}Z`; g += `<path d="${d}" fill="${P.s[0].col}" fill-opacity=".14"/>`; }
      P.s.forEach(s => { let d = ''; s.ys.forEach((y, i) => { if (Number.isFinite(y)) d += `${d && Number.isFinite(s.ys[i - 1]) ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(y).toFixed(1)}`; }); g += `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="${s.w || 2}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''} stroke-linejoin="round"/>`; });
      if (Number.isFinite(P.avg)) g += `<line x1="${Lm}" y1="${Y(P.avg).toFixed(1)}" x2="${Wd - Rm}" y2="${Y(P.avg).toFixed(1)}" stroke="${K.g}" stroke-width="1.6" stroke-dasharray="6 4"/><text x="${Wd - Rm - 2}" y="${(Y(P.avg) - 3).toFixed(1)}" class="pet" text-anchor="end" fill="${K.g}">avg ${nf(P.avg)}</text>`;
      if (Number.isFinite(P.rms)) g += `<line x1="${Lm}" y1="${Y(P.rms).toFixed(1)}" x2="${Wd - Rm}" y2="${Y(P.rms).toFixed(1)}" stroke="${K.y}" stroke-width="1.4" stroke-dasharray="2 3"/><text x="${Lm + 3}" y="${(Y(P.rms) - 3).toFixed(1)}" class="pet" fill="${K.y}">rms ${nf(P.rms)}</text>`;
      [hi - pad, lo + pad].forEach(v => { g += `<text x="${Lm - 3}" y="${(Y(v) + 3).toFixed(1)}" class="pet" text-anchor="end">${nf(+v.toPrecision(3))}</text>`; });
      y0 += ph + gap;
    });
    return `<svg viewBox="0 0 ${Wd} ${y0}" class="pesvg" role="img" aria-label="${esc(o.lab || 'waveforms')}">${g}</svg>`;
  }
  const degTicks = span => Array.from({ length: Math.round(span / 90) + 1 }, (_, k) => [k * 90, ['0', 'π/2', 'π', '3π/2', '2π', '5π/2', '3π', '7π/2', '4π'][k] || '']);

  /* ---------------- drawing: circuits (400 × 190) ---------------- */
  const SW = 'class="pew"';
  const ln = (pts) => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" ${SW}/>`;
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3" class="pedot"/>`;
  const lab = (x, y, t, a = 'middle', c = 'pel') => `<text x="${x}" y="${y}" class="${c}" text-anchor="${a}">${t}</text>`;
  // a diode or thyristor pointing in direction dir ('u','d','r','l') centred at x,y; scr adds a gate
  function dio(x, y, dir, scr, name) {
    const rot = { r: 0, d: 90, l: 180, u: 270 }[dir];
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><line x1="-16" y1="0" x2="-8" y2="0" ${SW}/><path d="M-8,-8 L8,0 L-8,8 Z" class="pedev${scr ? ' scr' : ''}"/><line x1="8" y1="-9" x2="8" y2="9" class="pewt"/><line x1="8" y1="0" x2="16" y2="0" ${SW}/>${scr ? '<line x1="4" y1="3" x2="11" y2="12" class="pegate"/>' : ''}</g>${name ? lab(x + (dir === 'u' || dir === 'd' ? 18 : 0), y + (dir === 'u' || dir === 'd' ? 4 : -12), name, dir === 'u' || dir === 'd' ? 'start' : 'middle', 'pes') : ''}`;
  }
  // a switch (transistor) with an anti-parallel diode, vertical, at x between y1 (top) and y2
  function swd(x, y1, y2, name, noDiode) {
    const m = (y1 + y2) / 2;
    return `${ln([[x, y1], [x, m - 12]])}<rect x="${x - 7}" y="${m - 12}" width="14" height="24" rx="3" class="pesw"/>${ln([[x, m + 12], [x, y2]])}<line x1="${x - 13}" y1="${m}" x2="${x - 7}" y2="${m}" class="pegate"/>${lab(x - 16, m + 4, name, 'end', 'pes')}`
      + (noDiode ? '' : `${ln([[x, m - 18], [x + 16, m - 18]])}${ln([[x, m + 18], [x + 16, m + 18]])}${dio(x + 16, m, 'u', false)}`);
  }
  const res = (x, y1, y2, name) => { const n = 6, h = (y2 - y1) / (n + 2); let d = `M${x},${y1} v${h}`; for (let i = 0; i < n; i++) d += ` l${i % 2 ? -7 : 7},${h / 2} l${i % 2 ? 7 : -7},${h / 2}`; return `<path d="${d} v${h}" fill="none" class="peld"/>${name ? lab(x + 12, (y1 + y2) / 2 + 4, name, 'start', 'pes') : ''}`; };
  const hop = (y, x1, x2, hs) => { let d = `M${x1},${y}`; hs.forEach(h => { d += ` L${h - 5},${y} A5,5 0 0 1 ${h + 5},${y}`; }); return `<path d="${d} L${x2},${y}" fill="none" class="pew"/>`; };
  const ind = (x, y1, y2, name) => { const k = 4, h = (y2 - y1) / k; let d = `M${x},${y1}`; for (let i = 0; i < k; i++) d += ` a${h / 2},${h / 2} 0 0 1 0,${h}`; return `<path d="${d}" fill="none" class="peld"/>${name ? lab(x + 14, (y1 + y2) / 2 + 4, name, 'start', 'pes') : ''}`; };
  const bat = (x, y1, y2, name) => { const m = (y1 + y2) / 2; return `${ln([[x, y1], [x, m - 4]])}<line x1="${x - 11}" y1="${m - 4}" x2="${x + 11}" y2="${m - 4}" class="pewt"/><line x1="${x - 6}" y1="${m + 3}" x2="${x + 6}" y2="${m + 3}" class="pewt" style="stroke-width:4"/>${ln([[x, m + 3], [x, y2]])}${name ? lab(x + 14, m + 4, name, 'start', 'pes') : ''}`; };
  const capv = (x, y1, y2, name) => { const m = (y1 + y2) / 2; return `${ln([[x, y1], [x, m - 4]])}<line x1="${x - 11}" y1="${m - 4}" x2="${x + 11}" y2="${m - 4}" class="pewt"/><line x1="${x - 11}" y1="${m + 4}" x2="${x + 11}" y2="${m + 4}" class="pewt"/>${ln([[x, m + 4], [x, y2]])}${name ? lab(x + 14, m + 4, name, 'start', 'pes') : ''}`; };
  const acs = (x, y, name) => `<circle cx="${x}" cy="${y}" r="15" class="pesrc"/><path d="M${x - 9},${y} q4.5,-10 9,0 t9,0" fill="none" class="pewt" style="stroke-width:1.6"/>${name ? lab(x - 20, y + 4, name, 'end', 'pes') : ''}`;
  const dcs = (x, y1, y2, name) => bat(x, y1, y2, name);
  // the load between (x, y1) and (x, y2) for load type ld
  function load(x, y1, y2, ld) {
    const parts = ld === 'R' ? ['R'] : ld === 'RL' ? ['R', 'L'] : ld === 'RLE' ? ['R', 'L', 'E'] : ld === 'RE' ? ['R', 'E'] : ['L'], h = (y2 - y1) / parts.length;
    return parts.map((t, k) => { const a = y1 + k * h, b = a + h; return t === 'R' ? res(x, a, b, 'R') : t === 'L' ? ind(x, a, b, ld === 'Id' ? 'large L' : 'L') : bat(x, a, b, 'E'); }).join('');
  }
  const svgc = (body, lab0) => `<svg viewBox="0 0 400 190" class="pesvg pec" role="img" aria-label="${esc(lab0)}">${body}</svg>`;

  /* ---------------- the converters ---------------- */
  const CV = [];
  const cv = o => { CV.push(o); return o; };
  const LD = (...a) => ['ld', 'Load', '', a[0], a.map(k => [k, { R: 'R', RL: 'R–L', RLE: 'R–L–E', RE: 'R–E (battery)', Id: 'Highly inductive (I<sub>d</sub> constant)', L: 'Pure L' }[k]])];
  const pVs = ['Vs', 'Supply voltage (rms)', 'V', 230, 50, 440, 5], pa = ['a', 'Firing angle α', '°', 45, 0, 180, 1], pR = ['R', 'Resistance R', 'Ω', 10, 1, 100, 1], pL = ['L', 'Inductance L', 'mH', 50, 1, 500, 1], pE = ['E', 'Back EMF / battery E', 'V', 60, -300, 300, 5], pId = ['Id', 'Load current I<sub>d</sub>', 'A', 10, 1, 50, 1];
  const shows = (p, k) => k === 'L' ? /L|Id/.test(p.ld) && p.ld !== 'Id' : k === 'E' ? /E/.test(p.ld) : k === 'R' ? p.ld !== 'Id' && p.ld !== 'L' : k === 'Id' ? p.ld === 'Id' : k === 'fwd' ? p.ld !== 'Id' && p.ld !== 'L' : true;
  const runODE = (p) => ({ Vm: R2 * p.Vs, w: 2 * PI * (p.f || 50), L: ['RL', 'RLE', 'L'].includes(p.ld) ? p.L / 1000 : 0, E: /E/.test(p.ld) ? p.E : 0, R: p.ld === 'L' ? 0 : p.R });
  // keep the last two cycles (display) and the last one (measures)
  const pack = (S, cyc, n = N) => { const out = { x: [] }; const st = (cyc - 2) * n; for (const k in S) out[k] = S[k].slice(st); for (let i = 0; i < 2 * n; i++) out.x.push(i * 360 / n); return out; };
  const m1 = (S, k) => lastN(S[k], N);

  // ---------- 1-φ half-wave ----------
  function simHW(p, ctl) {
    const { Vm, w, L, E, R } = runODE(p), dt = 2 * PI / N / w, cyc = L && R ? 60 : 3, a = ctl ? p.a : 0, S = { vs: [], vo: [], io: [], is: [], dv: [] }, fwOn = p.fwd === 'yes' && p.ld !== 'L', dn = ctl ? 'T' : 'D';
    let on = false, fw = false, i = 0, beta = NaN;
    for (let k = 0; k < N * cyc; k++) {
      const th = ((k % N) + 0.5) * 360 / N, v = Vm * Math.sin(th * D2R); let vo;
      if (p.ld === 'Id') { on = th >= a && th < 180; vo = on ? v : 0; i = p.Id; S.vs.push(v); S.vo.push(vo); S.io.push(i); S.is.push(on ? i : 0); S.dv.push(on ? dn + '|v<sub>s</sub>' : 'FD|0'); continue; }
      if (!on && (ctl ? th >= a && th < 180 : true) && v > (fw ? 0 : E)) { on = true; fw = false; }
      if (on) {
        vo = v;
        if (fwOn && v < 0 && L) { on = false; fw = i > 0; vo = 0; }
        else if (L) { const i0 = i; i += (v - R * i - E) / L * dt; if (i <= 0) { const f = i0 / (i0 - i), t = th + (f - 0.5) * 360 / N; vo = f * v + (1 - f) * E; i = 0; on = false; if (k >= N * (cyc - 1)) beta = t < a ? t + 360 : t; } }
        else { i = (v - E) / p.R; if (i <= 0) { vo = E; i = 0; on = false; if (k >= N * (cyc - 1)) beta = th < a ? th + 360 : th; } }
      }
      if (!on) { if (fw) { vo = 0; const i0 = i; i += (-R * i - E) / L * dt; if (i <= 0) { vo = (1 - i0 / (i0 - i)) * E; i = 0; fw = false; } } else if (vo === undefined || !Number.isFinite(vo)) { vo = E; i = 0; } }
      S.vs.push(v); S.vo.push(vo); S.io.push(i); S.is.push(on ? i : 0); S.dv.push(on ? dn + '|v<sub>s</sub>' : fw ? 'FD|0' : 'none|' + (E ? 'E' : '0'));
    }
    const P = pack(S, cyc); P.beta = beta; return P;
  }
  const HWP = [pVs, pa, LD('R', 'RL', 'RLE', 'RE', 'Id', 'L'), pR, pL, pE, pId, ['fwd', 'Freewheeling diode', '', 'no', [['no', 'No'], ['yes', 'Yes']]]];
  const rowsHW = (p, S, ctl) => {
    const Vm = R2 * p.Vs, a = (ctl ? p.a : 0) * D2R, vo = m1(S, 'vo'), io = m1(S, 'io'), r = [];
    const fwOK = p.fwd === 'yes' || p.ld === 'Id';
    if (p.ld === 'L') {
      const XL = 2 * PI * 50 * p.L / 1000, a0 = ctl ? p.a : 0, cnt = io.filter(x => x > 1e-9 * Math.max(...io)).length;
      return [['Current while the device conducts', 'L di/dt = V<sub>m</sub> sin ωt ⇒ i(ωt) = (V<sub>m</sub>/ωL)(cos α − cos ωt)', NaN, null, ''],
        ['Peak current (at ωt = π)', 'I<sub>peak</sub> = (V<sub>m</sub>/ωL)(1 + cos α); for α = 0: 2V<sub>m</sub>/ωL', Vm / XL * (1 + Math.cos(a)), Math.max(...io), 'A'],
        ['Current stops at (area A = area B)', 'β = 2π − α', 360 - a0, a0 + cnt * 360 / N, '°'],
        ['Conduction angle', 'γ = β − α = 2(π − α)', 2 * (180 - a0), cnt * 360 / N, '°'],
        ['Average output voltage', 'V<sub>o</sub> = 0: v<sub>o</sub> is symmetric about π, and an inductor has no average voltage', 0, mean(vo), 'V', Vm * 0.004],
        ['Average current', 'I<sub>o</sub> = (V<sub>m</sub>/πωL)[(π − α) cos α + sin α]', Vm / (PI * XL) * ((PI - a) * Math.cos(a) + Math.sin(a)), mean(io), 'A']];
    }
    if (p.ld === 'R') {
      r.push(['Average output voltage', ctl ? 'V<sub>o</sub> = (V<sub>m</sub>/2π)(1 + cos α)' : 'V<sub>o</sub> = V<sub>m</sub>/π = 0.45 V<sub>s</sub>', Vm / (2 * PI) * (1 + Math.cos(a)), mean(vo), 'V'],
        ['RMS output voltage', ctl ? 'V<sub>rms</sub> = (V<sub>m</sub>/2)√[(π − α + ½ sin 2α)/π]' : 'V<sub>rms</sub> = V<sub>m</sub>/2', Vm / 2 * sq((PI - a + Math.sin(2 * a) / 2) / PI), rmsOf(vo), 'V'],
        ['Average load current', 'I<sub>o</sub> = V<sub>o</sub>/R', Vm / (2 * PI) * (1 + Math.cos(a)) / p.R, mean(io), 'A'],
        ['RMS load (= supply) current', 'I<sub>rms</sub> = V<sub>rms</sub>/R', Vm / 2 * sq((PI - a + Math.sin(2 * a) / 2) / PI) / p.R, rmsOf(io), 'A'],
        ['Peak inverse voltage', 'PIV = V<sub>m</sub>', Vm, null, 'V']);
      if (!ctl) r.push(['Form factor', 'FF = V<sub>rms</sub>/V<sub>o</sub> = π/2 = 1.57', PI / 2, rmsOf(vo) / mean(vo), ''], ['Ripple factor', 'RF = √(FF² − 1) = 1.21', sq(PI * PI / 4 - 1), sq((rmsOf(vo) / mean(vo)) ** 2 - 1), '']);
    } else if (p.ld === 'Id' || (fwOK && p.ld === 'RL')) {
      r.push(['Average output voltage (with freewheeling diode)', 'V<sub>o</sub> = (V<sub>m</sub>/2π)(1 + cos α)', Vm / (2 * PI) * (1 + Math.cos(a)), mean(vo), 'V']);
      if (p.ld === 'Id') r.push(['SCR average current', 'I<sub>T</sub> = I<sub>d</sub>(π − α)/2π', p.Id * (PI - a) / (2 * PI), mean(m1(S, 'is')), 'A'], ['Freewheeling diode average current', 'I<sub>FD</sub> = I<sub>d</sub>(π + α)/2π', p.Id * (PI + a) / (2 * PI), p.Id - mean(m1(S, 'is')), 'A']);
      else r.push(['Average load current', 'I<sub>o</sub> = V<sub>o</sub>/R (the inductor has no average voltage)', Vm / (2 * PI) * (1 + Math.cos(a)) / p.R, mean(io), 'A']);
    } else if (p.ld === 'RL') {
      const b = S.beta * D2R;
      const phi = Math.atan(2 * PI * 50 * p.L / 1000 / p.R);
      r.push(['Load angle', 'φ = tan<sup>−1</sup>(ωL/R)', phi / D2R, null, '°'], ['No transient (exponential) term when', 'α = φ: then i = (V<sub>m</sub>/Z) sin(ωt − φ) and β = π + φ', phi / D2R, null, '°'], ['Extinction angle β (current falls to zero)', 'i(β) = 0: sin(β − φ) = sin(α − φ) e<sup>−(β−α)/tan φ</sup>', betaOf(a, phi) / D2R, S.beta, '°'],
        ['Average output voltage (no FWD)', 'V<sub>o</sub> = (V<sub>m</sub>/2π)(cos α − cos β)', Vm / (2 * PI) * (Math.cos(a) - Math.cos(b)), mean(vo), 'V'],
        ['Average load current', 'I<sub>o</sub> = V<sub>o</sub>/R', Vm / (2 * PI) * (Math.cos(a) - Math.cos(b)) / p.R, mean(io), 'A'],
        ['Conduction angle', 'γ = β − α', S.beta - (ctl ? p.a : 0), null, '°']);
    } else {
      const E = p.E, t1 = Math.asin(Math.max(-1, Math.min(1, E / Vm))), th1 = Math.max(a, t1), th2 = PI - t1;
      if (p.ld === 'RE') r.push(['Diode/SCR starts conducting', 'θ<sub>1</sub> = max(α, sin<sup>−1</sup>(E/V<sub>m</sub>))', th1 / D2R, null, '°'], ['Stops conducting', 'θ<sub>2</sub> = π − sin<sup>−1</sup>(E/V<sub>m</sub>)', th2 / D2R, null, '°'],
        ['Average charging current', 'I<sub>o</sub> = [V<sub>m</sub>(cos θ<sub>1</sub> − cos θ<sub>2</sub>) − E(θ<sub>2</sub> − θ<sub>1</sub>)]/(2πR)', (Vm * (Math.cos(th1) - Math.cos(th2)) - E * (th2 - th1)) / (2 * PI * p.R), mean(io), 'A'],
        ['Power into the battery', 'P<sub>E</sub> = E · I<sub>o</sub>', E * (Vm * (Math.cos(th1) - Math.cos(th2)) - E * (th2 - th1)) / (2 * PI * p.R), E * mean(io), 'W']);
      else r.push(['Average output voltage', 'V<sub>o</sub> = average of v<sub>o</sub> (E while the SCR is off)', NaN, mean(vo), 'V'], ['Average load current', 'I<sub>o</sub> = (V<sub>o</sub> − E)/R', (mean(vo) - E) / p.R, mean(io), 'A']);
    }
    if (/L/.test(p.ld) && p.ld !== 'Id' && p.ld !== 'L' && !(fwOK && p.ld === 'RL')) { const E0 = /E/.test(p.ld) ? p.E : 0; r.push(['Average inductor voltage (area A = area B)', '(1/2π)∫v<sub>L</sub> dθ = 0 in steady state, v<sub>L</sub> = v<sub>o</sub> − Ri − E', 0, mean(vo.map((x, k) => x - p.R * io[k] - E0)), 'V', Vm * 0.004]); }
    return r;
  };
  const ckHW = (p, ctl) => svgc(`${acs(40, 95, 'v<tspan dy="3" font-size="8">s</tspan>')}${ln([[40, 80], [40, 30], [140, 30]])}${dio(156, 30, 'r', ctl, ctl ? 'T' : 'D')}${ln([[172, 30], [300, 30], [300, 45]])}${load(300, 45, 150, p.ld)}${ln([[300, 150], [300, 165], [40, 165], [40, 110]])}
    ${p.fwd === 'yes' || p.ld === 'Id' ? `${ln([[230, 30], [230, 82]])}${dio(230, 98, 'u', false, 'FD')}${ln([[230, 114], [230, 165]])}${dot(230, 30)}${dot(230, 165)}` : ''}${lab(330, 100, 'v<tspan dy="3" font-size="8">o</tspan>', 'start', 'pel')}`, 'Single-phase half-wave rectifier');
  cv({ id: 'hw-diode', g: 'Single-phase rectifiers', n: 'Half-wave diode rectifier', sub: 'One diode: the output is the positive half of the supply.', P: HWP.filter(x => x[0] !== 'a'), def: { ld: 'R', fwd: 'no' }, sim: p => simHW(p, false), rows: (p, S) => rowsHW(p, S, false), ckt: p => ckHW(p, false), q: /half[- ]?wave(?! controlled)|single diode/i });
  cv({ id: 'hw-scr', g: 'Single-phase rectifiers', n: 'Half-wave controlled (one SCR)', sub: 'The SCR waits for its gate pulse at α, then follows the supply.', P: HWP, def: { ld: 'R', fwd: 'no' }, sim: p => simHW(p, true), rows: (p, S) => rowsHW(p, S, true), ckt: p => ckHW(p, true), q: /half[- ]?wave controlled|single scr|one thyristor|half-wave.*(thyristor|scr)/i });

  // ---------- 1-φ full wave: diode bridge, full converter, semi-converter ----------
  function simFW(p, kind) {
    const { Vm, w, L, E } = runODE(p), dt = 2 * PI / N / w, cyc = L ? 60 : 3, a = kind === 'diode' ? 0 : p.a, S = { vs: [], vo: [], io: [], is: [], dv: [] };
    const LB = { diode: ['D1, D2', 'D3, D4'], full: ['T1, T2', 'T3, T4'], semi: ['T1, D2', 'T3, D4'] }[kind] || ['T1, T3', 'T2, D1'], pos = LB[0] + '|v<sub>s</sub>', neg = LB[1] + '|−v<sub>s</sub>';
    let pr = 0, last = 1, fw = false, i = 0;
    for (let k = 0; k < N * cyc; k++) {
      const th = ((k % N) + 0.5) * 360 / N, v = Vm * Math.sin(th * D2R); let vo, is, dv;
      if (p.ld === 'Id') {
        if (kind === 'full') { const P1 = mod(th - a, 360) < 180; vo = P1 ? v : -v; is = P1 ? p.Id : -p.Id; dv = P1 ? pos : neg; }
        else if (kind === 'asym') { if (th >= a && th < 180) { vo = v; is = p.Id; dv = pos; } else if (th >= 180 && th < 180 + a) { vo = 0; is = 0; dv = 'D1, T3 (freewheel)|0'; } else { vo = -v; is = -p.Id; dv = neg; } }
        else { const h = mod(th, 180), c = kind === 'diode' || h >= a; vo = c ? Math.abs(v) : 0; is = c ? (th < 180 ? p.Id : -p.Id) : 0; dv = c ? (th < 180 ? pos : neg) : th < 180 ? 'T3, D2 (freewheel)|0' : 'T1, D4 (freewheel)|0'; }
        S.vs.push(v); S.vo.push(vo); S.io.push(p.Id); S.is.push(is); S.dv.push(dv); continue;
      }
      const gP = th >= a && th < 180, gN = th >= 180 + a && th < 360, voff = fw ? 0 : E;
      if (gP && pr !== 1 && v > (pr === -1 ? -v : voff)) { pr = 1; fw = false; }
      if (gN && pr !== -1 && -v > (pr === 1 ? v : voff)) { pr = -1; fw = false; }
      if (pr) {
        last = pr; vo = pr * v;
        if (kind === 'semi' && vo < 0 && L) { pr = 0; fw = i > 0; vo = 0; }
        else if (L) { const i0 = i; i += (vo - p.R * i - E) / L * dt; if (i <= 0) { const f = i0 / (i0 - i); vo = f * vo + (1 - f) * E; i = 0; pr = 0; } }
        else { i = (vo - E) / p.R; if (i <= 0) { vo = E; i = 0; pr = 0; } }
      }
      is = pr * i;
      if (!pr) { if (fw) { vo = 0; const i0 = i; i += (-p.R * i - E) / L * dt; if (i <= 0) { vo = (1 - i0 / (i0 - i)) * E; i = 0; fw = false; } } else if (vo === undefined) { vo = E; i = 0; } }
      dv = pr === 1 ? pos : pr === -1 ? neg : fw ? (last === 1 ? 'T1, D4 (freewheel)|0' : 'T3, D2 (freewheel)|0') : 'none|' + (E ? 'E' : '0');
      S.vs.push(v); S.vo.push(vo); S.io.push(i); S.is.push(is); S.dv.push(dv);
    }
    return pack(S, cyc);
  }
  const FWP = [pVs, pa, LD('R', 'RL', 'RLE', 'Id'), pR, pL, pE, pId];
  // 1-φ bridge: legs at x 150 and 230, P rail on top, N rail below; the second supply wire hops over the N rail
  const ckBridge = (p, kind, ls) => { const t = kind !== 'diode', bt = kind === 'full', DV = kind === 'asym' ? [['T1', 1], ['T2', 1], ['D1', 0], ['T3', 1]] : [[t ? 'T1' : 'D1', t], [bt ? 'T4' : 'D4', bt], [t ? 'T3' : 'D3', t], [bt ? 'T2' : 'D2', bt]];
    const xL = 150, xR = 230, yP = 30, yN = 160, yM = 95;
    const top = ls ? `${ln([[55, yM - 15], [55, 62], [70, 62]])}<path d="M70,62 q5,-9 10,0 q5,-9 10,0 q5,-9 10,0" fill="none" class="peld"/>${lab(85, 48, 'L<tspan dy="3" font-size="8">s</tspan>', 'middle', 'pes')}${ln([[100, 62], [120, 62], [120, yM], [xL, yM]])}` : ln([[55, yM - 15], [55, 62], [120, 62], [120, yM], [xL, yM]]);
    return svgc(`${acs(55, yM, 'v<tspan dy="3" font-size="8">s</tspan>')}${top}
      ${ln([[55, yM + 15], [55, 180], [272, 180], [272, yN + 6]])}<path d="M272,${yN + 6} A6,6 0 0 1 272,${yN - 6}" fill="none" class="pew"/>${ln([[272, yN - 6], [272, yM], [xR, yM]])}
      ${ln([[xL, yP], [340, yP], [340, 40]])}${ln([[xL, yN], [340, yN], [340, 150]])}
      ${[[xL, 0, 1], [xR, 2, 3]].map(([x, u, d]) => `${ln([[x, yP], [x, 46]])}${dio(x, 62, 'u', DV[u][1], DV[u][0])}${ln([[x, 78], [x, 112]])}${dio(x, 128, 'u', DV[d][1], DV[d][0])}${ln([[x, 144], [x, yN]])}${dot(x, yM)}`).join('')}
      ${dot(xR, yP)}${dot(xR, yN)}${load(340, 40, 150, p.ld)}${lab(326, 99, 'v<tspan dy="3" font-size="8">o</tspan>', 'end')}${lab(330, 50, '+', 'end', 'pes')}${lab(330, 146, '−', 'end', 'pes')}`, 'Single-phase bridge'); };
  const rowsFW = (p, S, kind) => {
    const Vm = R2 * p.Vs, a = (kind === 'diode' ? 0 : p.a) * D2R, vo = m1(S, 'vo'), io = m1(S, 'io'), is = m1(S, 'is'), r = [], cont = p.ld === 'Id' || p.ld !== 'R' && Math.min(...io) > 1e-6;
    const P_in = mean(lastN(S.vs).map((v, k) => v * is[k])), Isr = rmsOf(is);
    if (kind === 'diode') {
      r.push(['Average output voltage', 'V<sub>o</sub> = 2V<sub>m</sub>/π = 0.9 V<sub>s</sub>', 2 * Vm / PI, mean(vo), 'V'], ['RMS output voltage', 'V<sub>rms</sub> = V<sub>m</sub>/√2 = V<sub>s</sub>', Vm / R2, rmsOf(vo), 'V']);
      if (p.ld === 'R') r.push(['Form factor', 'FF = π/(2√2) = 1.11', PI / (2 * R2), rmsOf(vo) / mean(vo), ''], ['Ripple factor', 'RF = √(FF² − 1) = 0.482', sq(PI * PI / 8 - 1), sq((rmsOf(vo) / mean(vo)) ** 2 - 1), '']);
      r.push(['Peak inverse voltage', 'bridge: PIV = V<sub>m</sub>; centre-tap: PIV = 2V<sub>m</sub>', Vm, null, 'V'], ['Ripple frequency', 'f<sub>r</sub> = 2f', 2 * (p.f || 50), null, 'Hz']);
    } else if (kind === 'full') {
      if (p.ld === 'R') r.push(['Average output voltage (R load)', 'V<sub>o</sub> = (V<sub>m</sub>/π)(1 + cos α)', Vm / PI * (1 + Math.cos(a)), mean(vo), 'V'], ['RMS output voltage', 'V<sub>rms</sub> = V<sub>s</sub>√[(π − α + ½ sin 2α)/π]', p.Vs * sq((PI - a + Math.sin(2 * a) / 2) / PI), rmsOf(vo), 'V']);
      else if (cont) r.push(['Average output voltage (continuous current)', 'V<sub>o</sub> = (2V<sub>m</sub>/π) cos α = 0.9 V<sub>s</sub> cos α', 2 * Vm / PI * Math.cos(a), mean(vo), 'V'], ['RMS output voltage', 'V<sub>rms</sub> = V<sub>s</sub>', p.Vs, rmsOf(vo), 'V']);
      else r.push(['Average output voltage (current not continuous)', 'V<sub>o</sub> = average of v<sub>o</sub> — the cos α formula needs continuous current', NaN, mean(vo), 'V']);
      if (p.ld === 'Id') r.push(['Supply current (rms) — a square wave of ±I<sub>d</sub>', 'I<sub>s</sub> = I<sub>d</sub>', p.Id, Isr, 'A'], ['Fundamental of the supply current (peak)', 'I<sub>s1,peak</sub> = 4I<sub>d</sub>/π', 4 * p.Id / PI, fund(is), 'A'],
        ['Current distortion factor', 'I<sub>s1</sub>/I<sub>s</sub> = 2√2/π = 0.9', 2 * R2 / PI, fund(is) / R2 / Isr, ''], ['Displacement factor', 'cos φ<sub>1</sub> = cos α (the fundamental lags v<sub>s</sub> by α)', Math.cos(a), null, ''],
        ['Active power', 'P = V<sub>o</sub>I<sub>d</sub> = (2V<sub>m</sub>/π) I<sub>d</sub> cos α', 2 * Vm / PI * p.Id * Math.cos(a), P_in, 'W'], ['Reactive power drawn', 'Q = (2V<sub>m</sub>/π) I<sub>d</sub> sin α', 2 * Vm / PI * p.Id * Math.sin(a), null, 'var'], ['Fundamental of the supply current (rms)', 'I<sub>s1</sub> = (2√2/π) I<sub>d</sub> = 0.9 I<sub>d</sub>', 0.9003 * p.Id, fund(is) / R2, 'A'],
        ['Input power factor', 'pf = 0.9 cos α (displacement factor cos α)', 2 * R2 / PI * Math.cos(a), P_in / (p.Vs * Isr), ''], ['Supply-current THD', 'THD = √(I<sub>s</sub>² − I<sub>s1</sub>²)/I<sub>s1</sub> = 48.3 %', 48.34, sq(Isr ** 2 - (fund(is) / R2) ** 2) / (fund(is) / R2) * 100, '%'],
        ['Thyristor average / rms current', 'I<sub>T,avg</sub> = I<sub>d</sub>/2, I<sub>T,rms</sub> = I<sub>d</sub>/√2', p.Id / 2, null, 'A'], ['Inverter (regenerating) when', 'α > 90° ⇒ V<sub>o</sub> < 0: power flows from the dc side back to the ac supply', NaN, null, '']);
      else r.push(['Average load current', 'I<sub>o</sub> = (V<sub>o</sub> − E)/R', (mean(vo) - (/E/.test(p.ld) ? p.E : 0)) / p.R, mean(io), 'A'], ['Input power factor', 'pf = P / (V<sub>s</sub> I<sub>s</sub>)', NaN, P_in / (p.Vs * Isr), '']);
    } else if (kind === 'asym') {
      r.push(['Average output voltage', 'V<sub>o</sub> = (V<sub>m</sub>/2π)(1 + 3 cos α)', Vm / (2 * PI) * (1 + 3 * Math.cos(a)), mean(vo), 'V'],
        ['Where the formula comes from (read the waveform)', 'V<sub>o</sub> = (1/2π)[∫<sub>α</sub><sup>π</sup> V<sub>m</sub> sin θ dθ + ∫<sub>π+α</sub><sup>2π+α</sup> (−V<sub>m</sub> sin θ) dθ] = (V<sub>m</sub>/2π)[(1 + cos α) + 2 cos α]', NaN, null, ''],
        ['Supply current (rms)', 'I<sub>s</sub> = I<sub>d</sub>√[(2π − α)/2π] (zero only while D1, T3 freewheel)', p.Id * sq((2 * PI - a) / (2 * PI)), Isr, 'A'],
        ['Output is negative for', 'α of every 2π: from 2π to 2π + α, T2 and D1 still conduct', p.a, null, '°']);
    } else if (p.ld === 'RLE' && !cont) {
      r.push(['Average output voltage (current not continuous)', 'V<sub>o</sub> = average of v<sub>o</sub>: it sits at E while no device conducts, so (V<sub>m</sub>/π)(1 + cos α) no longer holds', NaN, mean(vo), 'V'], ['Average load current', 'I<sub>o</sub> = (V<sub>o</sub> − E)/R', (mean(vo) - p.E) / p.R, mean(io), 'A']);
    } else {
      r.push(['Average output voltage', 'V<sub>o</sub> = (V<sub>m</sub>/π)(1 + cos α)', Vm / PI * (1 + Math.cos(a)), mean(vo), 'V'], ['RMS output voltage', 'V<sub>rms</sub> = V<sub>s</sub>√[(π − α + ½ sin 2α)/π]', p.Vs * sq((PI - a + Math.sin(2 * a) / 2) / PI), rmsOf(vo), 'V']);
      if (/E/.test(p.ld)) r.push(['Average load current', 'I<sub>o</sub> = (V<sub>o</sub> − E)/R', (Vm / PI * (1 + Math.cos(a)) - p.E) / p.R, mean(io), 'A']);
      if (p.ld === 'Id') r.push(['Supply current (rms): blocks of width π − α', 'I<sub>s</sub> = I<sub>d</sub>√[(π − α)/π]', p.Id * sq((PI - a) / PI), Isr, 'A'], ['Fundamental of the supply current (peak amplitude)', 'I<sub>s1,peak</sub> = (4I<sub>d</sub>/π) cos(α/2)', 4 * p.Id / PI * Math.cos(a / 2), fund(is), 'A'],
        ['Current distortion factor', 'I<sub>s1</sub>/I<sub>s</sub> = (2√2/π) cos(α/2) / √[(π − α)/π]', 2 * R2 / PI * Math.cos(a / 2) / sq((PI - a) / PI), fund(is) / R2 / Isr, ''], ['Fundamental of the supply current (rms)', 'I<sub>s1</sub> = (2√2/π) I<sub>d</sub> cos(α/2)', 2 * R2 / PI * p.Id * Math.cos(a / 2), fund(is) / R2, 'A'],
        ['Displacement factor', 'DF = cos(α/2)', Math.cos(a / 2), null, ''], ['Input power factor', 'pf = (I<sub>s1</sub>/I<sub>s</sub>) cos(α/2) = 2√2 cos²(α/2)/√[π(π − α)]', 2 * R2 * Math.cos(a / 2) ** 2 / sq(PI * (PI - a)), P_in / (p.Vs * Isr), ''], ['Freewheeling (output shorted) for', 'α out of every π', p.a, null, '°']);
    }
    return r;
  };
  cv({ id: 'bridge-diode', g: 'Single-phase rectifiers', n: 'Full-wave diode bridge', sub: 'Four diodes: both halves of the supply turned positive.', P: FWP.filter(x => x[0] !== 'a'), def: { ld: 'R' }, sim: p => simFW(p, 'diode'), rows: (p, S) => rowsFW(p, S, 'diode'), ckt: p => ckBridge(p, 'diode'), q: /full[- ]?wave (diode|bridge rect|rectifier)|diode bridge|centre[- ]?tap|center[- ]?tap/i });
  cv({ id: 'full-converter', g: 'Single-phase rectifiers', n: 'Full converter (fully controlled bridge)', sub: 'Four SCRs: two quadrants — with α > 90° it inverts.', P: FWP, def: { ld: 'Id', a: 45 }, sim: p => simFW(p, 'full'), rows: (p, S) => rowsFW(p, S, 'full'), ckt: p => ckBridge(p, 'full'), q: /(single|1)[- ]?(phase|φ).{0,30}(full[- ]?(converter|bridge|controlled)|fully[- ]?controlled)|full converter/i });
  cv({ id: 'asym', g: 'Single-phase rectifiers', n: 'Bridge of 3 SCRs + 1 diode (asymmetric)', sub: 'T1, T3 fired at α, T2 at π + α, D1 uncontrolled: V<sub>o</sub> = (V<sub>m</sub>/2π)(1 + 3 cos α).', P: [pVs, pa, ['ld', 'Load', '', 'Id', [['Id', 'Constant current I<sub>d</sub>']]], pId], def: { ld: 'Id', a: 60, Vs: 70 }, sim: p => simFW(p, 'asym'), rows: (p, S) => rowsFW(p, S, 'asym'), ckt: p => ckBridge(p, 'asym'), q: /three thyristors|T ?1 ?, ?T ?2 ?,? (and )?T ?3 and a diode/i });
  cv({ id: 'semi-converter', g: 'Single-phase rectifiers', n: 'Semi-converter (half-controlled bridge)', sub: 'Two SCRs + two diodes: one quadrant, freewheels for α.', P: FWP, def: { ld: 'Id', a: 60 }, sim: p => simFW(p, 'semi'), rows: (p, S) => rowsFW(p, S, 'semi'), ckt: p => ckBridge(p, 'semi'), q: /semi[- ]?converter|half[- ]?controlled/i });

  // ---------- 3-φ: half-wave (3-pulse), full converter (6-pulse), semi-converter ----------
  const p3 = ['VL', 'Line voltage (rms)', 'V', 415, 100, 700, 5];
  function sim3(p, kind) {
    const Vmp = R2 * p.VL / R3, a = kind === 'diode6' ? 0 : p.a, S = { vs: [], vo: [], io: [], is: [], vb: [], vc: [], dv: [] };
    for (let k = 0; k < N * 3; k++) {
      const th = ((k % N) + 0.5) * 360 / N, v = [0, 1, 2].map(j => Vmp * Math.sin((th - 120 * j) * D2R));
      let vo, is, dv;
      const up = [0, 1, 2].find(j => mod(th - 30 - a - 120 * j, 360) < 120);
      if (kind === 'hw') { vo = v[up]; let off = false; if (p.ld === 'R' && vo < 0) { vo = 0; off = true; } const io = p.ld === 'R' ? vo / p.R : p.Id; is = up === 0 && (p.ld !== 'R' || vo > 0) ? io : 0; S.io.push(io); dv = off ? 'none|0' : `T${up + 1}|v<sub>${'abc'[up]}</sub>`; }
      else {
        const lo = [0, 1, 2].find(j => mod(th - 210 - (kind === 'semi' ? 0 : a) - 120 * j, 360) < 120);
        vo = v[up] - v[lo]; let fw = false;
        if ((kind === 'semi' || p.ld === 'R') && vo < 0) { vo = 0; fw = true; }
        const io = p.ld === 'R' ? vo / p.R : p.Id; is = fw ? 0 : (up === 0 ? io : 0) - (lo === 0 ? io : 0); S.io.push(io);
        dv = fw ? (kind === 'semi' ? `T${[1, 3, 5][up]}, D${[4, 6, 2][up]} (freewheel)|0` : 'none|0') : `T${[1, 3, 5][up]}, ${kind === 'semi' ? 'D' : 'T'}${[4, 6, 2][lo]}|v<sub>${'abc'[up]}${'abc'[lo]}</sub>`;
      }
      S.vs.push(v[0]); S.vb.push(v[1]); S.vc.push(v[2]); S.vo.push(vo); S.is.push(is); S.dv.push(dv);
    }
    return pack(S, 3);
  }
  const rows3 = (p, S, kind) => {
    const VL = p.VL, Vml = R2 * VL, Vmp = Vml / R3, a = p.a * D2R, vo = m1(S, 'vo'), is = m1(S, 'is'), Isr = rmsOf(is), r = [];
    if (kind === 'hw') {
      if (p.ld === 'Id' || p.a <= 30) r.push(['Average output voltage (continuous)', 'V<sub>o</sub> = (3√3 V<sub>mp</sub>/2π) cos α = 1.17 V<sub>ph</sub> cos α', 3 * R3 * Vmp / (2 * PI) * Math.cos(a), mean(vo), 'V']);
      else if (p.a < 150) r.push(['Average output voltage (R load, 30° ≤ α ≤ 150°)', 'V<sub>o</sub> = (3V<sub>mp</sub>/2π)[1 + cos(α + 30°)]', 3 * Vmp / (2 * PI) * (1 + Math.cos(a + PI / 6)), mean(vo), 'V']);
      else r.push(['Average output voltage (R load, α ≥ 150°)', 'V<sub>o</sub> = 0: the phase is already negative when fired', 0, mean(vo), 'V']);
      r.push(['Ripple frequency', 'f<sub>r</sub> = 3f (3-pulse)', 150, null, 'Hz'], ['Each SCR conducts', '120° (continuous): I<sub>T,avg</sub> = I<sub>d</sub>/3, I<sub>T,rms</sub> = I<sub>d</sub>/√3', p.ld === 'Id' ? p.Id / R3 : NaN, p.ld === 'Id' ? rmsOf(is) : null, 'A'], ['Peak inverse voltage', 'PIV = √3 V<sub>mp</sub> = V<sub>ml</sub>', Vml, null, 'V']);
    } else if (kind === 'full') {
      if (p.ld === 'Id' || p.a <= 60) r.push(['Average output voltage (continuous)', 'V<sub>o</sub> = (3V<sub>ml</sub>/π) cos α = 1.35 V<sub>L</sub> cos α', 3 * Vml / PI * Math.cos(a), mean(vo), 'V'], ['RMS output voltage', 'V<sub>rms</sub> = V<sub>ml</sub>√[½ + (3√3/4π) cos 2α]', Vml * sq(0.5 + 3 * R3 / (4 * PI) * Math.cos(2 * a)), rmsOf(vo), 'V']);
      else if (p.a < 120) r.push(['Average output voltage (R load, 60° ≤ α ≤ 120°)', 'V<sub>o</sub> = (3V<sub>ml</sub>/π)[1 + cos(α + 60°)]', 3 * Vml / PI * (1 + Math.cos(a + PI / 3)), mean(vo), 'V']);
      else r.push(['Average output voltage (R load, α ≥ 120°)', 'V<sub>o</sub> = 0: the line voltage is already negative when the pair is fired', 0, mean(vo), 'V']);
      if (p.ld === 'Id') r.push(['Supply current (rms): 120° blocks of ±I<sub>d</sub>', 'I<sub>s</sub> = √(2/3) I<sub>d</sub> = 0.816 I<sub>d</sub>', sq(2 / 3) * p.Id, Isr, 'A'], ['Fundamental of the supply current (rms)', 'I<sub>s1</sub> = (√6/π) I<sub>d</sub> = 0.78 I<sub>d</sub>', R2 * R3 / PI * p.Id, fund(is) / R2, 'A'],
        ['Input power factor', 'pf = (3/π) cos α = 0.955 cos α', 3 / PI * Math.cos(a), mean(lastN(S.vs).map((x, k) => x * is[k])) * 3 / (3 * VL / R3 * Isr), ''], ['Supply-current THD', 'THD = 31.1 % (harmonics 6k ± 1: 5, 7, 11, 13 …)', 31.08, sq(Isr ** 2 - (fund(is) / R2) ** 2) / (fund(is) / R2) * 100, '%'],
        ['Thyristor average / rms current', 'I<sub>T,avg</sub> = I<sub>d</sub>/3, I<sub>T,rms</sub> = I<sub>d</sub>/√3', p.Id / 3, null, 'A'], ['Current distortion factor', 'I<sub>s1</sub>/I<sub>s</sub> = 3/π = 0.955', 3 / PI, fund(is) / R2 / Isr, '']);
      r.push(['Ripple frequency', 'f<sub>r</sub> = 6f (6-pulse)', 300, null, 'Hz'], ['Peak inverse voltage', 'PIV = V<sub>ml</sub> = √2 V<sub>L</sub>', Vml, null, 'V'], ['Inverting (regenerating) when', 'α > 90° ⇒ V<sub>o</sub> < 0 (continuous current)', NaN, null, '']);
    } else {
      r.push(['Average output voltage', 'V<sub>o</sub> = (3V<sub>ml</sub>/2π)(1 + cos α)', 3 * Vml / (2 * PI) * (1 + Math.cos(a)), mean(vo), 'V'], ['Ripple frequency', 'f<sub>r</sub> = 6f for α < 60°, 3f beyond', p.a < 60 ? 300 : 150, null, 'Hz'], ['Quadrants', 'one: V<sub>o</sub> ≥ 0, I<sub>o</sub> ≥ 0 — cannot regenerate', NaN, null, '']);
    }
    return r;
  };
  // 3-φ: half-wave keeps three sources and a neutral; the bridge takes lines a, b, c from a supply box, hopping over the legs
  const ck3 = (p, kind) => {
    if (kind === 'hw') return svgc(`${[0, 1, 2].map(j => `${acs(40, 40 + 52 * j, ['v<tspan dy="3" font-size="8">a</tspan>', 'v<tspan dy="3" font-size="8">b</tspan>', 'v<tspan dy="3" font-size="8">c</tspan>'][j])}${ln([[55, 40 + 52 * j], [140, 40 + 52 * j]])}${dio(156, 40 + 52 * j, 'r', true, 'T' + (j + 1))}${ln([[172, 40 + 52 * j], [210, 40 + 52 * j]])}`).join('')}
      ${ln([[210, 40], [210, 144]])}${ln([[210, 92], [300, 92], [300, 100]])}${load(300, 100, 160, p.ld)}${ln([[300, 160], [300, 178], [20, 178], [20, 40], [25, 40]])}${ln([[20, 92], [25, 92]])}${ln([[20, 144], [25, 144]])}${dot(210, 92)}${lab(14, 190, 'neutral', 'start', 'pes')}`, 'Three-phase half-wave converter');
    const lx = [150, 210, 270], yP = 24, yN = 166, t = kind !== 'diode6', bt = kind === 'full';
    return svgc(`<rect x="12" y="68" width="44" height="58" rx="8" class="pesrc"/>${lab(34, 94, '3-φ', 'middle', 'pes')}${lab(34, 108, 'ac', 'middle', 'pes')}
      ${hop(90, 56, 150, [])}${hop(100, 56, 190, [150])}${ln([[190, 100], [190, 90], [210, 90]])}${hop(110, 56, 250, [150, 210])}${ln([[250, 110], [250, 90], [270, 90]])}${['a', 'b', 'c'].map((n, j) => lab(66, 88 + 10 * j, n, 'start', 'pes')).join('')}
      ${lx.map((x, j) => `${ln([[x, yP], [x, 40]])}${dio(x, 56, 'u', t, 'T' + [1, 3, 5][j])}${ln([[x, 72], [x, 118]])}${dio(x, 134, 'u', bt, (bt ? 'T' : 'D') + [4, 6, 2][j])}${ln([[x, 150], [x, yN]])}${dot(x, 90)}`).join('')}
      ${ln([[150, yP], [340, yP], [340, 40]])}${ln([[150, yN], [340, yN], [340, 150]])}${dot(210, yP)}${dot(270, yP)}${dot(210, yN)}${dot(270, yN)}${load(340, 40, 150, p.ld)}${lab(326, 99, 'v<tspan dy="3" font-size="8">o</tspan>', 'end')}`, 'Three-phase bridge');
  };
  const LD3 = ['ld', 'Load', '', 'Id', [['Id', 'Highly inductive (I<sub>d</sub> constant)'], ['R', 'R']]];
  cv({ id: '3hw', g: 'Three-phase rectifiers', n: '3-φ half-wave (3-pulse) converter', sub: 'Three SCRs to a common load; the most positive gated phase conducts.', P: [p3, pa, LD3, pR, pId], def: { ld: 'Id', a: 30 }, sim: p => sim3(p, 'hw'), rows: (p, S) => rows3(p, S, 'hw'), ckt: p => ck3(p, 'hw'), q: /3[- ]?(phase|φ) half[- ]?wave|three[- ]?pulse|3[- ]?pulse/i });
  cv({ id: '3full', g: 'Three-phase rectifiers', n: '3-φ full converter (6-pulse bridge)', sub: 'Six SCRs; each pair 60°, each SCR 120°. α > 90° inverts.', P: [p3, pa, LD3, pR, pId], def: { ld: 'Id', a: 30 }, sim: p => sim3(p, 'full'), rows: (p, S) => rows3(p, S, 'full'), ckt: p => ck3(p, 'full'), q: /(3|three)[- ]?(phase|φ).{0,40}(full[- ]?(converter|bridge|controlled)|fully|6[- ]?pulse|six[- ]?pulse|bridge)|6[- ]?pulse/i });
  cv({ id: '3semi', g: 'Three-phase rectifiers', n: '3-φ semi-converter', sub: 'Three SCRs (top) + three diodes (bottom); one quadrant.', P: [p3, pa, ['ld', 'Load', '', 'Id', [['Id', 'Highly inductive (I<sub>d</sub> constant)']]], pId], def: { ld: 'Id', a: 60 }, sim: p => sim3(p, 'semi'), rows: (p, S) => rows3(p, S, 'semi'), ckt: p => ck3(p, 'semi'), q: /(3|three)[- ]?(phase|φ).{0,20}semi/i });

  // ---------- AC voltage controllers ----------
  function simAC1(p, kind) {
    const Vm = R2 * p.Vs, w = 2 * PI * 50, dt = 2 * PI / N / w, L = p.ld === 'RL' ? p.L / 1000 : 0, cyc = L ? 40 : 3, S = { vs: [], vo: [], io: [], is: [], dv: [] };
    let s = 0, i = 0, beta = NaN;
    for (let k = 0; k < N * cyc; k++) {
      const th = ((k % N) + 0.5) * 360 / N, v = Vm * Math.sin(th * D2R); let vo = 0, dv;
      if (kind === 'half') { const on = th >= p.a && th < 180; vo = on || th >= 180 ? v : 0; i = vo / p.R; dv = on ? 'T|v<sub>s</sub>' : th >= 180 ? 'D|v<sub>s</sub>' : 'none|0'; }
      else if (!L) { vo = mod(th, 180) >= p.a ? v : 0; i = vo / p.R; dv = vo ? (th < 180 ? 'T1' : 'T2') + '|v<sub>s</sub>' : 'none|0'; }
      else {
        if (!s && th >= p.a && th < 180) s = 1; if (!s && th >= 180 + p.a) s = -1;
        dv = s ? (s > 0 ? 'T1' : 'T2') + '|v<sub>s</sub>' : 'none|0';
        if (s) { vo = v; i += (v - p.R * i) / L * dt; if (s * i <= 0) { i = 0; s = 0; if (k >= N * (cyc - 1) && th < 360 && Number.isNaN(beta) && th > p.a) beta = th; } }
      }
      S.vs.push(v); S.vo.push(vo); S.io.push(i); S.is.push(i); S.dv.push(dv);
    }
    const P = pack(S, cyc); P.beta = beta; return P;
  }
  const rowsAC1 = (p, S, kind) => {
    const a = p.a * D2R, vo = m1(S, 'vo'), io = m1(S, 'io'), r = [];
    if (kind === 'half') return [['RMS output voltage (SCR + diode, R)', 'V<sub>o</sub> = V<sub>s</sub>√[(2π − α + ½ sin 2α)/2π]', p.Vs * sq((2 * PI - a + Math.sin(2 * a) / 2) / (2 * PI)), rmsOf(vo), 'V'], ['Average output voltage', 'V<sub>dc</sub> = (√2 V<sub>s</sub>/2π)(cos α − 1)', R2 * p.Vs / (2 * PI) * (Math.cos(a) - 1), mean(vo), 'V'], ['Control range', '0 ≤ α ≤ π: V<sub>o</sub> from V<sub>s</sub> down to V<sub>s</sub>/√2', NaN, null, '']];
    if (p.ld === 'R') {
      const Vo = p.Vs * sq((PI - a + Math.sin(2 * a) / 2) / PI);
      r.push(['RMS output voltage (R load)', 'V<sub>o</sub> = V<sub>s</sub>√[(π − α + ½ sin 2α)/π]', Vo, rmsOf(vo), 'V'], ['RMS load current', 'I<sub>o</sub> = V<sub>o</sub>/R', Vo / p.R, rmsOf(io), 'A'], ['Output power', 'P = V<sub>o</sub>²/R', Vo * Vo / p.R, mean(vo.map(x => x * x)) / p.R, 'W'], ['Input power factor', 'pf = V<sub>o</sub>/V<sub>s</sub>', Vo / p.Vs, Vo / p.Vs, ''], ['SCR average current', 'I<sub>T,avg</sub> = (√2 V<sub>s</sub>/2πR)(1 + cos α)', R2 * p.Vs / (2 * PI * p.R) * (1 + Math.cos(a)), mean(io.map(x => Math.max(0, x))), 'A'], ['SCR rms current', 'I<sub>T,rms</sub> = I<sub>o</sub>/√2', Vo / p.R / R2, rmsOf(io.map(x => Math.max(0, x))), 'A']);
    } else {
      const phi = Math.atan(2 * PI * 50 * p.L / 1000 / p.R), b = S.beta * D2R;
      r.push(['Load angle', 'φ = tan<sup>−1</sup>(ωL/R)', phi / D2R, null, '°'], ['Control range', 'φ ≤ α ≤ π (α < φ gives the full sine)', NaN, null, '']);
      if (p.a > phi / D2R + 0.5) r.push(['Extinction angle β', 'sin(β − φ) = sin(α − φ) e<sup>−(β−α)/tan φ</sup>', betaOf(a, phi) / D2R, S.beta, '°'], ['RMS output voltage', 'V<sub>o</sub> = V<sub>s</sub>√[(β − α + ½(sin 2α − sin 2β))/π]', p.Vs * sq((b - a + (Math.sin(2 * a) - Math.sin(2 * b)) / 2) / PI), rmsOf(vo), 'V']);
      else r.push(['RMS output voltage (α ≤ φ)', 'V<sub>o</sub> = V<sub>s</sub> (full sine)', p.Vs, rmsOf(vo), 'V']);
      r.push(['RMS load current', 'from the current waveform', NaN, rmsOf(io), 'A']);
    }
    return r;
  };
  const ckAC1 = (p, kind) => svgc(`${acs(40, 95, 'v<tspan dy="3" font-size="8">s</tspan>')}${ln([[40, 80], [40, 40], [120, 40], [120, 30], [140, 30]])}${ln([[120, 40], [120, 64], [140, 64]])}${dio(156, 30, 'r', true, 'T1')}${dio(156, 64, 'l', kind !== 'half', kind === 'half' ? 'D' : 'T2')}${ln([[172, 30], [192, 30], [192, 64], [172, 64]])}${ln([[192, 47], [300, 47], [300, 55]])}${load(300, 55, 150, p.ld)}${ln([[300, 150], [300, 165], [40, 165], [40, 110]])}${dot(120, 40)}${dot(192, 47)}${lab(330, 100, 'v<tspan dy="3" font-size="8">o</tspan>', 'start')}`, 'Single-phase AC voltage controller');
  const pRL = ['ld', 'Load', '', 'R', [['R', 'R'], ['RL', 'R–L']]];
  cv({ id: 'ac1', g: 'AC voltage controllers', n: '1-φ AC voltage controller (two SCRs / triac)', sub: 'Anti-parallel SCRs chop each half of the sine at α.', P: [pVs, pa, pRL, pR, pL], def: { ld: 'R', a: 60 }, sim: p => simAC1(p, 'full'), rows: (p, S) => rowsAC1(p, S, 'full'), ckt: p => ckAC1(p, 'full'), q: /ac (voltage )?(controller|regulator)|triac|anti[- ]?parallel/i });
  cv({ id: 'ac1half', g: 'AC voltage controllers', n: '1-φ half-wave AC controller (SCR + diode)', sub: 'Only the positive half is controlled; it adds a dc component.', P: [pVs, pa, ['ld', 'Load', '', 'R', [['R', 'R']]], pR], def: { ld: 'R', a: 60 }, sim: p => simAC1(p, 'half'), rows: (p, S) => rowsAC1(p, S, 'half'), ckt: p => ckAC1(p, 'half'), q: /half[- ]?wave ac|unidirectional ac controller/i });
  // integral-cycle (on–off) control
  cv({ id: 'icc', g: 'AC voltage controllers', n: 'Integral-cycle (on–off) control', sub: 'Whole cycles on, whole cycles off: no waveform distortion, low-frequency flicker.', P: [pVs, ['n', 'Cycles ON', '', 3, 1, 20, 1], ['m', 'Cycles OFF', '', 2, 0, 20, 1], pR], def: {},
    sim: p => { const c = p.n + p.m, Vm = R2 * p.Vs, S = { vs: [], vo: [], io: [], is: [], x: [], dv: [] }; for (let k = 0; k < c * N; k++) { const v = Vm * Math.sin((((k % N) + 0.5) * 360 / N) * D2R), on = Math.floor(k / N) < p.n; S.vs.push(v); S.vo.push(on ? v : 0); S.io.push(on ? v / p.R : 0); S.is.push(on ? v / p.R : 0); S.x.push(k * 360 / N); S.dv.push(on ? 'T1, T2 (whole cycles)|v<sub>s</sub>' : 'none|0'); } S.span = c; return S; },
    rows: (p, S) => { const kk = p.n / (p.n + p.m); return [['Duty (fraction of cycles on)', 'k = n/(n + m)', kk, null, ''], ['RMS output voltage', 'V<sub>o</sub> = V<sub>s</sub>√k', p.Vs * sq(kk), rmsOf(S.vo), 'V'], ['Output power', 'P = k V<sub>s</sub>²/R', kk * p.Vs ** 2 / p.R, mean(S.vo.map(x => x * x)) / p.R, 'W'], ['Input power factor', 'pf = √k', sq(kk), null, '']]; },
    ckt: p => ckAC1({ ld: 'R' }, 'full'), q: /integral[- ]?cycle|on[- ]?off control|burst/i });
  // 3-phase AC controller, star R load without neutral (fully controlled, wide gate pulses)
  function simAC3(p) {
    const Vm = R2 * p.Vs, S = { vs: [], vo: [], io: [], is: [], dv: [] }, on = [[0, 0], [0, 0], [0, 0]];
    for (let k = 0; k < N * 3; k++) {
      const th = ((k % N) + 0.5) * 360 / N, v = [0, 1, 2].map(j => Vm * Math.sin((th - 120 * j) * D2R));
      const gate = [0, 1, 2].map(j => { const t = mod(th - 120 * j, 360), g = st => { const u = mod(t - st, 360); return u < Math.max(180 - p.a, 1) || (u >= 60 && u < 62); }; return [g(p.a), g(180 + p.a)]; });
      let set = [0, 1, 2].filter(j => on[j][0] || on[j][1] || gate[j][0] || gate[j][1]), cur = [0, 0, 0];
      for (let it = 0; it < 4; it++) {
        cur = [0, 0, 0];
        if (set.length === 3) set.forEach(j => { cur[j] = v[j] / p.R; });
        else if (set.length === 2) { const [x, y] = set; cur[x] = (v[x] - v[y]) / (2 * p.R); cur[y] = -cur[x]; }
        const ok = set.filter(j => (cur[j] > 1e-9 && (on[j][0] || gate[j][0])) || (cur[j] < -1e-9 && (on[j][1] || gate[j][1])));
        if (ok.length === set.length) break; set = ok.length >= 2 ? ok : [];
      }
      if (set.length < 2) set = [];
      for (let j = 0; j < 3; j++) { on[j][0] = set.includes(j) && cur[j] > 0; on[j][1] = set.includes(j) && cur[j] < 0; }
      const van = set.length === 3 ? v[0] : set.length === 2 && set.includes(0) ? (v[0] - v[set.find(j => j !== 0)]) / 2 : 0;
      const dn = set.map(j => cur[j] > 0 ? [1, 3, 5][j] : [4, 6, 2][j]).sort((x, y) => x - y).map(x => 'T' + x).join(', ') || 'none';
      S.vs.push(v[0]); S.vo.push(van); S.io.push(van / p.R); S.is.push(van / p.R); S.dv.push(dn + '|' + (set.length === 3 ? 'v<sub>an</sub>' : set.includes(0) ? `v<sub>a${'abc'[set.find(j => j !== 0)]}</sub>/2` : '0'));
    }
    return pack(S, 3);
  }
  const ac3F = (Vs, a) => { const f = a < PI / 3 ? PI / 6 - a / 4 + Math.sin(2 * a) / 8 : a < PI / 2 ? PI / 12 + 3 * Math.sin(2 * a) / 16 + R3 * Math.cos(2 * a) / 16 : a < 5 * PI / 6 ? 5 * PI / 24 - a / 4 + Math.sin(2 * a) / 16 + R3 * Math.cos(2 * a) / 16 : 0; return R2 * R3 * Vs * sq(Math.max(0, f) / PI); };
  cv({ id: 'ac3', g: 'AC voltage controllers', n: '3-φ AC voltage controller (star R load)', sub: 'Three pairs of anti-parallel SCRs; 2 or 3 lines conduct at a time.', P: [['Vs', 'Supply phase voltage (rms)', 'V', 240, 50, 400, 5], ['a', 'Firing angle α', '°', 45, 0, 150, 1], pR], def: { ld: 'R', a: 45 }, sim: simAC3,
    rows: (p, S) => { const a = p.a * D2R, Vo = ac3F(p.Vs, a); return [['RMS phase output voltage', p.a < 60 ? 'V<sub>o</sub> = √6 V<sub>s</sub>√{(1/π)[π/6 − α/4 + sin 2α/8]} (0 ≤ α ≤ 60°)' : p.a < 90 ? 'V<sub>o</sub> = √6 V<sub>s</sub>√{(1/π)[π/12 + 3 sin 2α/16 + √3 cos 2α/16]} (60° ≤ α ≤ 90°)' : 'V<sub>o</sub> = √6 V<sub>s</sub>√{(1/π)[5π/24 − α/4 + sin 2α/16 + √3 cos 2α/16]} (90° ≤ α ≤ 150°)', Vo, rmsOf(m1(S, 'vo')), 'V'], ['Output power (3 phases)', 'P = 3 V<sub>o</sub>²/R', 3 * Vo * Vo / p.R, 3 * mean(m1(S, 'vo').map(x => x * x)) / p.R, 'W'], ['Control range', '0 ≤ α ≤ 150° (V<sub>o</sub> = 0 at 150°)', NaN, null, '']]; },
    ckt: () => svgc(`<rect x="12" y="35" width="40" height="120" rx="8" class="pesrc"/>${lab(32, 92, '3-φ', 'middle', 'pes')}${lab(32, 104, 'ac', 'middle', 'pes')}${[45, 95, 145].map((y, j) => `${ln([[52, y], [110, y], [110, y - 11], [126, y - 11]])}${ln([[110, y], [110, y + 11], [126, y + 11]])}${dio(142, y - 11, 'r', true)}${dio(142, y + 11, 'l', true)}${ln([[158, y - 11], [174, y - 11], [174, y + 11], [158, y + 11]])}${ln([[174, y], [210, y]])}<path d="M210,${y} l5,-7 l10,14 l10,-14 l10,14 l10,-14 l5,7" fill="none" class="peld"/>${ln([[260, y], [300, y]])}${dot(110, y)}${dot(174, y)}${lab(72, y - 4, 'abc'[j], 'middle', 'pes')}${lab(142, y - 23, 'T' + [1, 3, 5][j] + ', T' + [4, 6, 2][j], 'middle', 'pes')}`).join('')}${ln([[300, 45], [300, 145]])}${dot(300, 95)}${lab(306, 92, 'star', 'start', 'pes')}${lab(306, 105, '(no neutral)', 'start', 'pes')}${lab(235, 30, 'R', 'middle', 'pes')}`, 'Three-phase AC voltage controller'), q: /(3|three)[- ]?(phase|φ).{0,20}ac (voltage )?(controller|regulator)/i });

  // ---------- DC–DC choppers ----------
  const pVd = ['Vs', 'DC supply V<sub>s</sub>', 'V', 200, 10, 600, 5], pD = ['D', 'Duty ratio D', '', 0.5, 0.05, 0.95, 0.01], pfs = ['fs', 'Switching frequency', 'kHz', 2, 0.2, 20, 0.1];
  function simBuck(p) {
    const T = 1 / (p.fs * 1000), n = 400, dt = T / n, L = p.L / 1000, E = p.ld === 'RLE' ? p.E : 0, cyc = 300, S = { vo: [], io: [], is: [], vs: [], dv: [] }; let i = 0;
    for (let k = 0; k < n * cyc; k++) { const on = (k % n) + 0.5 < p.D * n; let vo, dv; if (on) { vo = p.Vs; i += (p.Vs - p.R * i - E) / L * dt; dv = 'S|V<sub>s</sub> drives the load'; } else if (i > 0) { vo = 0; i += (-p.R * i - E) / L * dt; if (i < 0) i = 0; dv = 'FD|L keeps the current going'; } else { vo = E; i = 0; dv = 'none|v<sub>o</sub> = E'; } S.vo.push(vo); S.io.push(i); S.is.push(on ? i : 0); S.vs.push(p.Vs); S.dv.push(dv); }
    const P = { x: [] }; for (const k in S) P[k] = S[k].slice((cyc - 2) * n); for (let j = 0; j < 2 * n; j++) P.x.push(j / n); P.T = true; P.n = n; return P;
  }
  function simBoost(p, kind) {
    const T = 1 / (p.fs * 1000), n = 400, dt = T / n, L = p.L / 1000, C = p.C / 1e6, cyc = 400, S = { vo: [], io: [], is: [], vs: [], dv: [] };
    let v = kind === 'boost' ? p.Vs / (1 - p.D) : kind === 'buck' ? p.D * p.Vs : p.Vs * p.D / (1 - p.D), iL = kind === 'buck' ? v / p.R : v / p.R / (1 - p.D);
    for (let k = 0; k < n * cyc; k++) {
      const on = (k % n) + 0.5 < p.D * n; let vsw, dv;
      if (kind === 'buck') {
        if (on) { iL += (p.Vs - v) / L * dt; vsw = p.Vs; dv = 'S|V<sub>s</sub> feeds L and the load'; }
        else if (iL > 0) { iL += -v / L * dt; if (iL < 0) iL = 0; vsw = 0; dv = 'D|L feeds the load (freewheel)'; }
        else { vsw = v; dv = 'none|C alone feeds the load'; }
        v += (iL - v / p.R) / C * dt;
      } else if (on) { iL += p.Vs / L * dt; v += (-v / p.R) / C * dt; vsw = 0; dv = 'S|L stores energy from V<sub>s</sub>; C feeds the load'; }
      else if (iL > 0) { iL += (kind === 'boost' ? p.Vs - v : -v) / L * dt; v += (iL - v / p.R) / C * dt; if (iL < 0) iL = 0; vsw = kind === 'boost' ? v : p.Vs + v; dv = kind === 'boost' ? 'D|V<sub>s</sub> and L together feed the load' : 'D|L alone feeds the load (reversed)'; }
      else { v += (-v / p.R) / C * dt; vsw = p.Vs; dv = 'none|C alone feeds the load'; }
      S.vo.push(kind === 'bb' ? -v : v); S.io.push(iL); S.is.push(vsw); S.vs.push(p.Vs); S.dv.push(dv);
    }
    const P = { x: [] }; for (const k in S) P[k] = S[k].slice((cyc - 2) * n); for (let j = 0; j < 2 * n; j++) P.x.push(j / n); P.T = true; P.n = n; return P;
  }
  const lastP = (S, k) => S[k].slice(S[k].length - S.n);
  const bigRipple = (vo, iL) => { const r = (Math.max(...vo) - Math.min(...vo)) / Math.abs(mean(vo)), dcm = Math.min(...iL) <= 1e-6;
    return r > 0.1 || dcm ? [[dcm ? 'The inductor current reaches zero (discontinuous)' : 'The output ripple is large (' + Math.round(r * 100) + ' %)', 'the formulas below assume continuous i<sub>L</sub> and a large C (small ripple): raise L, C or f to see them hold', NaN, null, '']] : []; };
  const offMean = (S, p) => mean(lastP(S, 'is').filter((_, j) => j + 0.5 >= p.D * S.n));
  cv({ id: 'buck', g: 'DC–DC converters (choppers)', n: 'Step-down (buck) chopper — class A', sub: 'Switch on for DT: the load sees V<sub>s</sub>, then freewheels.', P: [pVd, pD, pfs, ['ld', 'Load', '', 'RLE', [['RL', 'R–L'], ['RLE', 'R–L–E (dc motor)']]], ['R', 'Resistance R', 'Ω', 2, 0.5, 50, 0.5], ['L', 'Inductance L', 'mH', 10, 0.5, 100, 0.5], ['E', 'Back EMF E', 'V', 50, 0, 400, 5]], def: { ld: 'RLE' }, sim: simBuck,
    rows: (p, S) => { const vo = lastP(S, 'vo'), io = lastP(S, 'io'), E = p.ld === 'RLE' ? p.E : 0, T = 1 / (p.fs * 1000), tau = p.L / 1000 / p.R, cont = Math.min(...io) > 1e-6;
      const Imax = p.Vs / p.R * (1 - Math.exp(-p.D * T / tau)) / (1 - Math.exp(-T / tau)) - E / p.R, Imin = p.Vs / p.R * (Math.exp(p.D * T / tau) - 1) / (Math.exp(T / tau) - 1) - E / p.R;
      if (!cont) return [['Average output voltage (current not continuous)', p.D * p.Vs <= E ? 'D V<sub>s</sub> ≤ E: the supply cannot push current into the back EMF; v<sub>o</sub> = E' : 'V<sub>o</sub> = average of v<sub>o</sub> (= E while i = 0), larger than D V<sub>s</sub>', NaN, mean(vo), 'V'], ['Average load current', 'I<sub>o</sub> = (V<sub>o</sub> − E)/R', (mean(vo) - E) / p.R, mean(io), 'A'], ['Continuous current needs', 'I<sub>min</sub> > 0: raise D, L or f, or lower E', NaN, null, '']];
      return [['Average output voltage', 'V<sub>o</sub> = D V<sub>s</sub> (continuous current)', p.D * p.Vs, mean(vo), 'V'], ['RMS output voltage', 'V<sub>rms</sub> = √D V<sub>s</sub>', sq(p.D) * p.Vs, rmsOf(vo), 'V'], ['Average load current', 'I<sub>o</sub> = (D V<sub>s</sub> − E)/R', (p.D * p.Vs - E) / p.R, mean(io), 'A'],
        ['Maximum load current', 'I<sub>max</sub> = (V<sub>s</sub>/R)(1 − e<sup>−DT/τ</sup>)/(1 − e<sup>−T/τ</sup>) − E/R', cont ? Imax : NaN, Math.max(...io), 'A'], ['Minimum load current', 'I<sub>min</sub> = (V<sub>s</sub>/R)(e<sup>DT/τ</sup> − 1)/(e<sup>T/τ</sup> − 1) − E/R', cont ? Imin : NaN, Math.min(...io), 'A'],
        ['Peak-to-peak ripple (largest at D = 0.5)', 'Δi<sub>max</sub> ≈ V<sub>s</sub>/(4 f L) when R ≪ fL', p.Vs / (4 * p.fs * 1000 * p.L / 1000), null, 'A'], ['Average supply current', 'I<sub>s</sub> = D · I<sub>o</sub>', p.D * (p.D * p.Vs - E) / p.R, mean(lastP(S, 'is')), 'A']]; },
    ckt: p => svgc(`${dcs(30, 50, 150, 'V<tspan dy="3" font-size="8">s</tspan>')}${ln([[30, 50], [30, 30], [90, 30]])}<rect x="96" y="20" width="28" height="20" rx="3" class="pesw"/>${lab(110, 15, 'S (on for DT)', 'middle', 'pes')}${ln([[124, 30], [300, 30], [300, 45]])}${ln([[200, 30], [200, 82]])}${dio(200, 98, 'u', false, 'FD')}${ln([[200, 114], [200, 165]])}${load(300, 45, 150, p.ld)}${ln([[300, 150], [300, 165], [30, 165], [30, 150]])}${dot(200, 30)}${dot(200, 165)}${lab(330, 100, 'v<tspan dy="3" font-size="8">o</tspan>', 'start')}`, 'Step-down chopper'), q: /step[- ]?down chopper|buck|chopper(?!.*(boost|step[- ]?up))/i, T: 'chopper' });
  const BP = [pVd, pD, pfs, ['R', 'Load R', 'Ω', 20, 2, 200, 1], ['L', 'Inductance L', 'mH', 2, 0.1, 50, 0.1], ['C', 'Capacitance C', 'µF', 470, 10, 4700, 10]];
  cv({ id: 'buck-lc', g: 'DC–DC converters (choppers)', n: 'Buck converter with L–C filter (SMPS)', sub: 'Switch, diode, L and C: a smooth dc output at D·V<sub>s</sub>.', P: [pVd, pD, ['fs', 'Switching frequency', 'kHz', 20, 1, 100, 1], ['R', 'Load R', 'Ω', 10, 1, 100, 1], ['L', 'Inductance L', 'mH', 1, 0.05, 20, 0.05], ['C', 'Capacitance C', 'µF', 100, 10, 2000, 10]], def: {}, sim: p => simBoost(p, 'buck'),
    pan: (S, lp) => [{ n: 'Inductor current i<tspan dy="3" font-size="8">L</tspan>', s: [{ ys: S.io, col: K.io }], avg: mean(lp('io')) }, { n: 'Switch-node (diode) voltage', s: [{ ys: S.is, col: K.is }], avg: mean(lp('is')) }, { n: 'Output voltage v<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.vo, col: K.vo }], avg: mean(lp('vo')) }],
    rows: (p, S) => { const vo = lastP(S, 'vo'), iL = lastP(S, 'io'), f = p.fs * 1000, L = p.L / 1000, Vo = p.D * p.Vs, dI = Vo * (1 - p.D) / (f * L);
      if (Math.min(...iL) <= 1e-6) return [['Inductor current falls to zero (discontinuous)', 'the CCM formulas below need L > L<sub>min</sub> = (1 − D)R/(2f)', (1 - p.D) * p.R / (2 * f) * 1000, null, 'mH'], ['Output voltage (discontinuous)', 'V<sub>o</sub> > D V<sub>s</sub> — read it from the waveform', NaN, mean(vo), 'V']];
      return [['Output voltage', 'V<sub>o</sub> = D V<sub>s</sub>', Vo, mean(vo), 'V'], ['Average inductor current', 'I<sub>L</sub> = I<sub>o</sub> = V<sub>o</sub>/R', Vo / p.R, mean(iL), 'A'],
        ['Inductor ripple (peak to peak)', 'ΔI<sub>L</sub> = V<sub>o</sub>(1 − D)/(f L) = (V<sub>s</sub> − V<sub>o</sub>)D/(f L)', dI, Math.max(...iL) - Math.min(...iL), 'A'], ['Peak switch current', 'I<sub>peak</sub> = I<sub>o</sub> + ΔI<sub>L</sub>/2', Vo / p.R + dI / 2, Math.max(...iL), 'A'],
        ['Output ripple (peak to peak)', 'ΔV<sub>o</sub> = ΔI<sub>L</sub>/(8 f C)', dI / (8 * f * p.C / 1e6), Math.max(...vo) - Math.min(...vo), 'V'], ['Boundary of continuous conduction', 'L<sub>min</sub> = (1 − D)R/(2f)', (1 - p.D) * p.R / (2 * f) * 1000, null, 'mH']]; },
    ckt: () => svgc(`${dcs(30, 50, 150, 'V<tspan dy="3" font-size="8">s</tspan>')}${ln([[30, 50], [30, 30], [70, 30]])}<rect x="70" y="20" width="28" height="20" rx="3" class="pesw"/>${lab(84, 14, 'S', 'middle', 'pes')}${ln([[98, 30], [140, 30]])}${dot(140, 30)}${ln([[140, 30], [140, 82]])}${dio(140, 98, 'u', false, 'D')}${ln([[140, 114], [140, 165]])}<path d="M140,30 h20 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0 h20" fill="none" class="peld"/>${lab(192, 14, 'L', 'middle', 'pes')}${ln([[244, 30], [300, 30]])}${dot(250, 30)}${capv(250, 30, 165, 'C')}${res(300, 30, 165, 'R')}${ln([[30, 150], [30, 165], [300, 165]])}${dot(140, 165)}${dot(250, 165)}${lab(330, 100, 'v<tspan dy="3" font-size="8">o</tspan>', 'start')}`, 'Buck converter'), q: /buck converter|smps|switched[- ]mode/i, T: 'chopper' });
  cv({ id: 'boost', g: 'DC–DC converters (choppers)', n: 'Step-up (boost) converter', sub: 'Switch stores energy in L; when it opens, L adds to V<sub>s</sub>.', P: BP, def: {}, sim: p => simBoost(p, 'boost'),
    rows: (p, S) => { const vo = lastP(S, 'vo'), iL = lastP(S, 'io'); return [...bigRipple(vo, iL), ['Output voltage', 'V<sub>o</sub> = V<sub>s</sub>/(1 − D)', p.Vs / (1 - p.D), mean(vo), 'V'], ['Average inductor (= supply) current', 'I<sub>L</sub> = I<sub>o</sub>/(1 − D)', p.Vs / (1 - p.D) / p.R / (1 - p.D), mean(iL), 'A'], ['Inductor ripple (peak to peak)', 'ΔI<sub>L</sub> = V<sub>s</sub> D/(f L)', p.Vs * p.D / (p.fs * 1000 * p.L / 1000), Math.max(...iL) - Math.min(...iL), 'A'], ['Output ripple', 'ΔV<sub>o</sub> = I<sub>o</sub> D/(f C)', p.Vs / (1 - p.D) / p.R * p.D / (p.fs * 1000 * p.C / 1e6), Math.max(...vo) - Math.min(...vo), 'V'], ['Switch voltage when off', 'V<sub>sw</sub> = V<sub>o</sub>', p.Vs / (1 - p.D), offMean(S, p), 'V'], ['Boundary of continuous conduction', 'L<sub>min</sub> = D(1 − D)² R/(2f)', p.D * (1 - p.D) ** 2 * p.R / (2 * p.fs * 1000) * 1000, null, 'mH'], ['Input resistance seen by the source', 'R<sub>in</sub> = V<sub>s</sub>/I<sub>L</sub> = R(1 − D)²', p.R * (1 - p.D) ** 2, p.Vs / mean(iL), 'Ω']]; },
    ckt: p => svgc(`${dcs(30, 50, 150, 'V<tspan dy="3" font-size="8">s</tspan>')}${ln([[30, 50], [30, 30], [60, 30]])}<path d="M60,30 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0" fill="none" class="peld"/>${lab(92, 14, 'L', 'middle', 'pes')}${ln([[124, 30], [180, 30]])}${dot(150, 30)}${swd(150, 30, 165, 'S', true)}${dio(196, 30, 'r', false, 'D')}${ln([[212, 30], [300, 30]])}${dot(250, 30)}${capv(250, 30, 165, 'C')}${res(300, 30, 165, 'R')}${ln([[30, 150], [30, 165], [300, 165]])}${lab(330, 100, 'v<tspan dy="3" font-size="8">o</tspan>', 'start')}`, 'Boost converter'), q: /boost|step[- ]?up (chopper|converter)/i, T: 'chopper' });
  cv({ id: 'buckboost', g: 'DC–DC converters (choppers)', n: 'Buck–boost converter', sub: 'Output inverted; |V<sub>o</sub>| below or above V<sub>s</sub>.', P: BP, def: {}, sim: p => simBoost(p, 'bb'),
    rows: (p, S) => { const vo = lastP(S, 'vo'), iL = lastP(S, 'io'), Vo = p.Vs * p.D / (1 - p.D); return [...bigRipple(vo, iL), ['Output voltage (reversed polarity)', 'V<sub>o</sub> = −D V<sub>s</sub>/(1 − D)', -Vo, mean(vo), 'V'], ['Average inductor current', 'I<sub>L</sub> = I<sub>o</sub>/(1 − D)', Vo / p.R / (1 - p.D), mean(iL), 'A'], ['Inductor ripple', 'ΔI<sub>L</sub> = V<sub>s</sub> D/(f L)', p.Vs * p.D / (p.fs * 1000 * p.L / 1000), Math.max(...iL) - Math.min(...iL), 'A'], ['Switch voltage when off', 'V<sub>sw</sub> = V<sub>s</sub> + |V<sub>o</sub>|', p.Vs + Vo, offMean(S, p), 'V'], ['Average input (switch) current', 'I<sub>s</sub> = D I<sub>L</sub>, so R<sub>in</sub> = R(1 − D)²/D²', p.D * Vo / p.R / (1 - p.D), mean(iL.map((x, j) => j + 0.5 < p.D * S.n ? x : 0)), 'A'], ['Boundary of continuous conduction', 'L<sub>min</sub> = (1 − D)² R/(2f)', (1 - p.D) ** 2 * p.R / (2 * p.fs * 1000) * 1000, null, 'mH'], ['Ćuk converter (same ratio)', 'V<sub>o</sub> = −D V<sub>s</sub>/(1 − D)', -Vo, null, 'V']]; },
    ckt: p => svgc(`${dcs(30, 50, 150, 'V<tspan dy="3" font-size="8">s</tspan>')}${ln([[30, 50], [30, 30], [70, 30]])}<rect x="70" y="20" width="28" height="20" rx="3" class="pesw"/>${lab(84, 14, 'S', 'middle', 'pes')}${ln([[98, 30], [150, 30]])}${dot(150, 30)}${ind(150, 40, 150, 'L')}${ln([[150, 30], [150, 40]])}${ln([[150, 150], [150, 165]])}${dio(196, 30, 'l', false, 'D')}${ln([[150, 30], [180, 30]])}${ln([[212, 30], [300, 30]])}${dot(250, 30)}${capv(250, 30, 165, 'C')}${res(300, 30, 165, 'R')}${ln([[30, 150], [30, 165], [300, 165]])}${lab(330, 100, '−v<tspan dy="3" font-size="8">o</tspan>', 'start')}`, 'Buck-boost converter'), q: /buck[- ]?boost|cuk|ćuk/i, T: 'chopper' });

  // ---------- inverters ----------
  const pVdc = ['Vs', 'DC link V<sub>dc</sub>', 'V', 220, 20, 800, 5];
  function simInv(p, kind) {
    const w = 2 * PI * 50, dt = 2 * PI / N / w, L = p.ld === 'RL' || p.ld === 'L' ? p.L / 1000 : 0, R0 = p.ld === 'L' ? 0 : p.R, cyc = L && R0 ? 30 : 3, three = kind === '180' || kind === '120';
    const go = i => { const S = { vs: [], vo: [], io: [], is: [], dv: [] };
      for (let k = 0; k < N * cyc; k++) {
        const th = ((k % N) + 0.5) * 360 / N; let vo, vph = 0, sw = '';
        const pole = j => { const t = mod(th - 120 * j, 360); return kind === '180' ? (t < 180 ? 1 : -1) : (t < 120 ? 1 : t >= 180 && t < 300 ? -1 : 0); };
        if (kind === 'half') vo = th < 180 ? p.Vs / 2 : -p.Vs / 2;
        else if (kind === 'full') vo = th < 180 ? p.Vs : -p.Vs;
        else if (kind === 'quasi') vo = Math.abs(th - 90) <= p.d ? p.Vs : Math.abs(th - 270) <= p.d ? -p.Vs : 0;
        else if (kind === 'spwm') { let up = 0; for (let q = 0; q < 16; q++) { const t = th + (q - 7.5) / 16 * 360 / N, tri = 1 - 2 * Math.abs(2 * mod(t * p.mf / 360, 1) - 1); if (p.m * Math.sin(t * D2R) >= tri) up++; } vo = p.Vs * (up / 8 - 1); }
        else { const P3 = [0, 1, 2].map(pole), [a0, b0, c0] = P3.map(x => x * p.Vs / 2); vph = kind === '180' ? (2 * a0 - b0 - c0) / 3 : a0; vo = a0 - b0;
          sw = P3.map((x, j) => x > 0 ? [1, 3, 5][j] : x < 0 ? [4, 6, 2][j] : 0).filter(Boolean).sort((x, y) => x - y).map(x => 'S' + x).join(', '); }
        const ve = three ? vph : vo;
        if (L) i += (ve - R0 * i) / L * dt; else i = ve / p.R;
        let dv = '';
        if (kind === 'half') dv = vo > 0 ? (i >= 0 ? 'S1' : 'D1') + '|+V<sub>dc</sub>/2' : (i <= 0 ? 'S2' : 'D2') + '|−V<sub>dc</sub>/2';
        else if (kind === 'full' || kind === 'quasi') dv = vo > 0 ? (i >= 0 ? 'S1, S2' : 'D1, D2') + '|+V<sub>dc</sub>' : vo < 0 ? (i <= 0 ? 'S3, S4' : 'D3, D4') + '|−V<sub>dc</sub>' : 'zero (load shorted)|0';
        else if (three) dv = sw + '|v<sub>ab</sub> = ' + (vo > 0 ? '+V<sub>dc</sub>' : vo < 0 ? '−V<sub>dc</sub>' : '0');
        S.vs.push(three ? vph : (kind === 'spwm' ? p.m * p.Vs * Math.sin(th * D2R) : NaN)); S.vo.push(vo); S.io.push(i); S.is.push(i); S.dv.push(dv);
      }
      return S; };
    let S = go(0);
    if (L && !R0) S = go(-mean(S.io.slice(-N)));   // a pure inductor keeps any dc offset: start where the steady current has zero average
    return pack(S, cyc);
  }
  const invV = (p, S, kind) => {
    const vo = m1(S, 'vo'), V1 = fund(vo) / R2, Vr = rmsOf(vo), thd = sq(Math.max(0, Vr * Vr - V1 * V1)) / V1 * 100, Vs = p.Vs, d = (p.d || 0) * D2R;
    if (kind === 'half') return [['RMS output voltage', 'V<sub>o</sub> = V<sub>dc</sub>/2', Vs / 2, Vr, 'V'], ['Fundamental (rms)', 'V<sub>1</sub> = 2V<sub>dc</sub>/(π√2) = 0.45 V<sub>dc</sub>', 2 * Vs / (PI * R2), V1, 'V'], ['nth harmonic (rms), n odd', 'V<sub>n</sub> = V<sub>1</sub>/n', NaN, null, ''], ['THD', '48.3 % (square wave)', 48.34, thd, '%']];
    if (kind === 'full') return [['RMS output voltage', 'V<sub>o</sub> = V<sub>dc</sub>', Vs, Vr, 'V'], ['Fundamental (rms)', 'V<sub>1</sub> = 4V<sub>dc</sub>/(π√2) = 0.9 V<sub>dc</sub>', 4 * Vs / (PI * R2), V1, 'V'], ['Fourier series', 'v<sub>o</sub> = Σ (4V<sub>dc</sub>/nπ) sin nωt, n = 1, 3, 5 …', NaN, null, ''], ['THD', '48.3 %', 48.34, thd, '%']];
    if (kind === 'quasi') return [['RMS output voltage (pulse width 2d)', 'V<sub>o</sub> = V<sub>dc</sub>√(2d/π)', Vs * sq(2 * d / PI), Vr, 'V'], ['Fundamental (rms)', 'V<sub>1</sub> = (4V<sub>dc</sub>/π√2) sin d', 4 * Vs / (PI * R2) * Math.sin(d), V1, 'V'], ['Harmonic n vanishes when', 'sin nd = 0 ⇒ 2d = 360°/n (e.g. 2d = 120° removes the 3rd)', NaN, null, ''], ['THD', 'from the waveform', NaN, thd, '%']];
    if (kind === 'spwm') return [['Fundamental (peak), full bridge', 'V<sub>1,peak</sub> = m V<sub>dc</sub> (m ≤ 1)', p.m * Vs, V1 * R2, 'V'], ['Fundamental (rms)', 'V<sub>1</sub> = m V<sub>dc</sub>/√2', p.m * Vs / R2, V1, 'V'], ['Pulses per half cycle', 'p = m<sub>f</sub>/2 = f<sub>c</sub>/(2f)', p.mf / 2, null, ''], ['Half bridge / 3-φ (phase)', 'V<sub>1,peak</sub> = m V<sub>dc</sub>/2; 3-φ line V<sub>L1</sub> = 0.612 m V<sub>dc</sub> (rms)', p.m * Vs / 2, null, 'V']];
    const vph = m1(S, 'vs'), P1 = fund(vph) / R2;
    if (kind === '180') return [['Line voltage (rms)', 'V<sub>L</sub> = √(2/3) V<sub>dc</sub> = 0.816 V<sub>dc</sub>', sq(2 / 3) * Vs, Vr, 'V'], ['Phase voltage (rms)', 'V<sub>ph</sub> = (√2/3) V<sub>dc</sub> = 0.471 V<sub>dc</sub>', R2 / 3 * Vs, rmsOf(vph), 'V'], ['Line fundamental (rms)', 'V<sub>L1</sub> = (√6/π) V<sub>dc</sub> = 0.78 V<sub>dc</sub>', R2 * R3 / PI * Vs, V1, 'V'], ['Phase fundamental (rms)', 'V<sub>ph1</sub> = (√2/π) V<sub>dc</sub> = 0.45 V<sub>dc</sub>', R2 / PI * Vs, P1, 'V'], ['Each switch conducts', '180°; three switches on at a time; phase voltage is a six-step wave (V<sub>dc</sub>/3, 2V<sub>dc</sub>/3)', NaN, null, '']];
    return [['Line voltage (rms)', 'V<sub>L</sub> = V<sub>dc</sub>/√2 = 0.707 V<sub>dc</sub>', Vs / R2, Vr, 'V'], ['Phase voltage (rms)', 'V<sub>ph</sub> = V<sub>dc</sub>/√6 = 0.408 V<sub>dc</sub>', Vs / sq(6), rmsOf(vph), 'V'], ['Each switch conducts', '120°; two switches on at a time', NaN, null, '']];
  };
  const invRows = (p, S, kind) => { const r = invV(p, S, kind), io = m1(S, 'io'), T = 1 / 50, L = p.L / 1000;
    if (p.ld === 'L' && (kind === 'half' || kind === 'full')) r.push(['Load current with a pure L', 'triangular: di/dt = v<sub>o</sub>/L, a straight rise for T/2 and a straight fall for T/2', NaN, null, ''],
      ['Peak load current', kind === 'half' ? 'I<sub>p</sub> = (V<sub>dc</sub>/2)(T/2)/(2L) = V<sub>dc</sub>T/(8L)' : 'I<sub>p</sub> = V<sub>dc</sub>(T/2)/(2L) = V<sub>dc</sub>T/(4L)', p.Vs * T / (kind === 'half' ? 8 : 4) / L, Math.max(...io), 'A'],
      ['Peak-to-peak current', 'Δi = 2I<sub>p</sub>', 2 * p.Vs * T / (kind === 'half' ? 8 : 4) / L, Math.max(...io) - Math.min(...io), 'A']);
    if (p.ld === 'R' && (kind === 'half' || kind === 'full')) r.push(['Load current (rms)', kind === 'half' ? 'I<sub>o</sub> = V<sub>dc</sub>/(2R)' : 'I<sub>o</sub> = V<sub>dc</sub>/R', p.Vs / (kind === 'half' ? 2 : 1) / p.R, rmsOf(io), 'A']);
    return r; };
  const ckInv = (p, kind) => {
    if (kind === 'half') return svgc(`${dcs(30, 40, 160, 'V<tspan dy="3" font-size="8">dc</tspan>')}${ln([[30, 40], [30, 25], [200, 25]])}${ln([[30, 160], [30, 175], [200, 175]])}${capv(110, 25, 100, 'C1')}${capv(110, 100, 175, 'C2')}${swd(200, 25, 100, 'S1')}${swd(200, 100, 175, 'S2')}${dot(110, 100)}${dot(200, 100)}${ln([[110, 100], [110, 100]])}${ln([[200, 100], [300, 100], [300, 70]])}${ln([[110, 100], [150, 100], [150, 140], [300, 140], [300, 120]])}${res(300, 70, 120)}${lab(314, 90, 'load', 'start', 'pes')}${lab(314, 110, 'v<tspan dy="3" font-size="8">o</tspan>', 'start')}`, 'Half-bridge inverter');
    if (kind === 'full' || kind === 'quasi' || kind === 'spwm') return svgc(`${dcs(30, 40, 160, 'V<tspan dy="3" font-size="8">dc</tspan>')}${ln([[30, 40], [30, 25], [300, 25]])}${ln([[30, 160], [30, 175], [300, 175]])}${swd(140, 25, 100, 'S1')}${swd(140, 100, 175, 'S4')}${swd(300, 25, 100, 'S3')}${swd(300, 100, 175, 'S2')}${dot(140, 100)}${dot(300, 100)}${ln([[140, 100], [190, 100]])}<path d="M190,100 h10 l5,-6 l10,12 l10,-12 l10,12 l5,-6 h10" fill="none" class="peld"/>${ln([[250, 100], [300, 100]])}${lab(220, 88, 'load', 'middle', 'pes')}`, 'Full-bridge inverter');
    return svgc(`${dcs(25, 40, 160, 'V<tspan dy="3" font-size="8">dc</tspan>')}${ln([[25, 40], [25, 22], [320, 22]])}${ln([[25, 160], [25, 178], [320, 178]])}${[0, 1, 2].map(j => `${swd(110 + 90 * j, 22, 100, 'S' + [1, 3, 5][j])}${swd(110 + 90 * j, 100, 178, 'S' + [4, 6, 2][j])}${dot(110 + 90 * j, 100)}${lab(118 + 90 * j, 114, 'abc'[j], 'start', 'pel')}`).join('')}${lab(380, 104, 'to a 3-φ load', 'end', 'pes')}`, 'Three-phase bridge inverter');
  };
  const pLoad = ['ld', 'Load', '', 'R', [['R', 'R'], ['RL', 'R–L'], ['L', 'Pure L']]], pRi = ['R', 'Resistance R', 'Ω', 10, 1, 100, 1], pLi = ['L', 'Inductance L', 'mH', 30, 1, 300, 1];
  cv({ id: 'inv-half', g: 'Inverters (DC → AC)', n: '1-φ half-bridge inverter (square wave)', sub: 'Two switches, two capacitors: ±V<sub>dc</sub>/2.', P: [pVdc, pLoad, pRi, pLi], def: { ld: 'RL' }, sim: p => simInv(p, 'half'), rows: (p, S) => invRows(p, S, 'half'), ckt: p => ckInv(p, 'half'), q: /half[- ]?bridge inverter|half[- ]?bridge/i, inv: true });
  cv({ id: 'inv-full', g: 'Inverters (DC → AC)', n: '1-φ full-bridge inverter (square wave)', sub: 'Four switches: ±V<sub>dc</sub>; fundamental 0.9 V<sub>dc</sub>.', P: [pVdc, pLoad, pRi, pLi], def: { ld: 'RL' }, sim: p => simInv(p, 'full'), rows: (p, S) => invRows(p, S, 'full'), ckt: p => ckInv(p, 'full'), q: /full[- ]?bridge inverter|square[- ]?wave inverter|single[- ]?phase (bridge )?inverter/i, inv: true });
  cv({ id: 'inv-quasi', g: 'Inverters (DC → AC)', n: 'Quasi-square wave (single-pulse) inverter', sub: 'Pulse of width 2d each half cycle: voltage control and harmonic removal.', P: [pVdc, ['d', 'Half pulse width d', '°', 60, 5, 90, 1], pLoad, pRi, pLi], def: { ld: 'R' }, sim: p => simInv(p, 'quasi'), rows: (p, S) => invRows(p, S, 'quasi'), ckt: p => ckInv(p, 'quasi'), q: /quasi[- ]?square|single[- ]?pulse|pulse width.*inverter/i, inv: true });
  cv({ id: 'inv-spwm', g: 'Inverters (DC → AC)', n: 'Sinusoidal PWM inverter (full bridge, bipolar)', sub: 'Sine compared with a triangle carrier: fundamental m·V<sub>dc</sub>.', P: [pVdc, ['m', 'Modulation index m', '', 0.8, 0.1, 1, 0.05], ['mf', 'Carrier ratio m<sub>f</sub> = f<sub>c</sub>/f', '', 15, 3, 41, 2], pLoad, pRi, pLi], def: { ld: 'RL' }, sim: p => simInv(p, 'spwm'), rows: (p, S) => invRows(p, S, 'spwm'), ckt: p => ckInv(p, 'spwm'), q: /spwm|sinusoidal pwm|modulation index|sine[- ]?pwm|pwm inverter/i, inv: true });
  cv({ id: 'inv-180', g: 'Inverters (DC → AC)', n: '3-φ inverter, 180° conduction', sub: 'Each switch 180°; six-step phase voltage.', P: [pVdc, pLoad, pRi, pLi], def: { ld: 'R' }, sim: p => simInv(p, '180'), rows: (p, S) => invRows(p, S, '180'), ckt: p => ckInv(p, '180'), q: /180°? (mode|conduction)|six[- ]?step/i, inv: true, w3: true });
  cv({ id: 'inv-120', g: 'Inverters (DC → AC)', n: '3-φ inverter, 120° conduction', sub: 'Each switch 120°; one leg floats at a time.', P: [pVdc, ['ld', 'Load', '', 'R', [['R', 'R (star)']]], pRi], def: { ld: 'R' }, sim: p => simInv(p, '120'), rows: (p, S) => invRows(p, S, '120'), ckt: p => ckInv(p, '120'), q: /120°? (mode|conduction)/i, inv: true, w3: true });


  // ---------- source inductance: commutation overlap ----------
  // 1-φ full converter, R + very large L: during overlap all four SCRs conduct, v_o = 0 and L_s di_s/dt = v_s.
  // I_d is found by iterating V_o(I_d)/R = I_d on the simulated waveform (the formula is not used).
  function simOv1(p) {
    const Vm = R2 * p.Vs, Xs = 2 * PI * 50 * p.Ls / 1000, a = p.a * D2R, M = 20, h = 2 * PI / N / M;
    const run = Id => { const S = { vs: [], vb: [], vo: [], io: [], is: [], dv: [] }, mus = []; let st = -1, dir = 0, is = -Id, t0 = 0;
      for (let k = 0; k < 3 * N; k++) { let sb = 0, so = 0, si = 0, lab = '';
        for (let q = 0; q < M; q++) { const th = (k * M + q + 0.5) * h, ph = mod(th, 2 * PI), v = Vm * Math.sin(th), tgt = mod(ph - a, 2 * PI) < PI ? 1 : -1;
          if (st !== 0 && st !== tgt) { st = 0; dir = tgt; t0 = th; }
          let vo, vb;
          if (st === 0) { is += v / Xs * h; vo = 0; vb = 0; if (dir * is >= Id) { is = dir * Id; st = dir; if (k >= N) mus.push((th - t0) / D2R); } }
          else { vo = st * v; vb = v; is = st * Id; }
          sb += vb; so += vo; si += is; if (q === M >> 1) lab = st === 0 ? 'T1–T4 all (overlap)|0' : st > 0 ? 'T1, T2|v<sub>s</sub>' : 'T3, T4|−v<sub>s</sub>'; }
        S.vs.push(Vm * Math.sin(((k % N) + 0.5) * 2 * PI / N)); S.vb.push(sb / M); S.vo.push(so / M); S.io.push(Id); S.is.push(si / M); S.dv.push(lab); }
      const P = pack(S, 3); P.mu = mus.length ? mean(mus) : 0; P.Id = Id; return P; };
    let Id = Math.max(0.01, 2 * Vm / PI * Math.cos(a) / p.R), S = run(Id);
    for (let it = 0; it < 40; it++) { const n = Math.max(1e-6, mean(m1(S, 'vo')) / p.R); if (Math.abs(n - Id) < 1e-9 * Math.max(1, n)) break; Id = n; S = run(Id); }
    return S;
  }
  cv({ id: 'overlap1', g: 'Single-phase rectifiers', n: 'Full converter with source inductance (overlap μ)', sub: 'L<sub>s</sub> makes the current change over μ: the output is shorted and V<sub>o</sub> drops by 4fL<sub>s</sub>I<sub>o</sub>.',
    P: [pVs, ['a', 'Firing angle α', '°', 45, 0, 85, 1], ['R', 'Load R (with a very large L)', 'Ω', 10, 1, 100, 1], ['Ls', 'Source inductance L<sub>s</sub>', 'mH', 2.28, 0.1, 20, 0.02]], def: { ld: 'Id' }, sim: simOv1,
    pan: (S, lv) => [{ n: 'Supply v<tspan dy="3" font-size="8">s</tspan><tspan dy="-3"> (dashed) and the bridge voltage (notched)</tspan>', s: [{ ys: S.vb, col: K.b }, { ys: S.vs, col: K.vs, w: 1.2, dash: '4 3' }] }, { n: 'Output voltage v<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.vo, col: K.vo }], avg: mean(lv('vo')), shade: S.vo }, { n: 'Supply current i<tspan dy="3" font-size="8">s</tspan><tspan dy="-3"> (trapezoid: slopes are the overlap)</tspan>', s: [{ ys: S.is, col: K.is }], rms: rmsOf(lv('is')) }],
    rows: (p, S) => { const Vm = R2 * p.Vs, a = p.a * D2R, Xs = 2 * PI * 50 * p.Ls / 1000, Id = 2 * Vm / PI * Math.cos(a) / (p.R + 2 * Xs / PI), mu = Math.acos(Math.max(-1, Math.cos(a) - 2 * Xs * Id / Vm)) - a, vo = m1(S, 'vo');
      return [['Load current', 'V<sub>o</sub> = I<sub>o</sub>R and V<sub>o</sub> = (2V<sub>m</sub>/π) cos α − (2ωL<sub>s</sub>/π) I<sub>o</sub> ⇒ I<sub>o</sub> = (2V<sub>m</sub>/π) cos α / (R + 2ωL<sub>s</sub>/π)', Id, S.Id, 'A'],
        ['Average output voltage', 'V<sub>o</sub> = (2V<sub>m</sub>/π) cos α − (2ωL<sub>s</sub>/π) I<sub>o</sub>', 2 * Vm / PI * Math.cos(a) - 2 * Xs / PI * Id, mean(vo), 'V'],
        ['Overlap angle μ', 'cos(α + μ) = cos α − 2ωL<sub>s</sub>I<sub>o</sub>/V<sub>m</sub>', mu / D2R, S.mu, '°'],
        ['Voltage lost to overlap', 'ΔV = (2ωL<sub>s</sub>/π) I<sub>o</sub> = 4fL<sub>s</sub>I<sub>o</sub>', 2 * Xs / PI * Id, 2 * Vm / PI * Math.cos(a) - mean(vo), 'V', Vm * 5e-4],
        ['The same average, written with μ', 'V<sub>o</sub> = (V<sub>m</sub>/π)[cos α + cos(α + μ)]', Vm / PI * (Math.cos(a) + Math.cos(a + mu)), mean(vo), 'V'],
        ['During the overlap', 'all four SCRs conduct: v<sub>o</sub> = 0, and the bridge input is notched to zero', NaN, null, '']]; },
    ckt: p => ckBridge({ ld: 'Id' }, 'full', true), q: /overlap|source inductance|commutation overlap|inductance of [\d.]+ ?mh.*(rectifier|converter)/i });
  // 3-φ full converter with L_s per phase and constant I_d: each commutation is integrated (2L_s di/dt = line voltage)
  function simOv3(p) {
    const Vml = R2 * p.VL, Vmp = Vml / R3, Xs = 2 * PI * 50 * p.Ls / 1000, a = p.a, M = 20, h = 360 / N / M, Id = p.Id;
    const S = { vs: [], vb: [], vc: [], vo: [], io: [], is: [], dv: [] }, mus = [];
    const G = [{ off: 30, sg: 1 }, { off: 210, sg: -1 }].map(g => ({ ...g, cur: [0, 1, 2].find(j => mod(0.001 - g.off - a - 120 * j, 360) < 120), inc: null, iy: 0, t0: 0 }));
    for (let k = 0; k < 3 * N; k++) { let so = 0, si = 0, lab = '';
      for (let q = 0; q < M; q++) { const th = (k * M + q + 0.5) * h, v = [0, 1, 2].map(j => Vmp * Math.sin((th - 120 * j) * D2R)), rail = [];
        G.forEach((g, gi) => { const want = [0, 1, 2].find(j => mod(th - g.off - a - 120 * j, 360) < 120);
          if (g.inc === null && want !== g.cur) { g.inc = want; g.iy = 0; g.t0 = th; }
          if (g.inc !== null) { g.iy += g.sg * (v[g.inc] - v[g.cur]) / (2 * Xs) * h * D2R; if (g.iy >= Id) { g.cur = g.inc; g.inc = null; if (k >= N) mus.push(th - g.t0); } }
          rail[gi] = g.inc === null ? v[g.cur] : (v[g.cur] + v[g.inc]) / 2; });
        const ia = G.reduce((t, g) => t + g.sg * (g.inc === null ? (g.cur === 0 ? Id : 0) : (g.cur === 0 ? Id - g.iy : 0) + (g.inc === 0 ? g.iy : 0)), 0);
        so += rail[0] - rail[1]; si += ia;
        if (q === M >> 1) { const [t, b] = G, nm = (g, L) => 'T' + L[g.cur] + (g.inc !== null ? '+T' + L[g.inc] : ''); lab = `${nm(t, [1, 3, 5])}, ${nm(b, [4, 6, 2])}|${t.inc !== null || b.inc !== null ? 'overlap: the two phases average' : 'line voltage'}`; } }
      const th = ((k % N) + 0.5) * 360 / N; S.vs.push(Vmp * Math.sin(th * D2R)); S.vb.push(Vmp * Math.sin((th - 120) * D2R)); S.vc.push(Vmp * Math.sin((th - 240) * D2R)); S.vo.push(so / M); S.io.push(Id); S.is.push(si / M); S.dv.push(lab); }
    const P = pack(S, 3); P.mu = mus.length ? mean(mus) : 0; return P;
  }
  cv({ id: 'overlap3', g: 'Three-phase rectifiers', n: '3-φ full converter with source inductance (overlap μ)', sub: 'Each commutation takes μ; the output follows the average of the two phases and loses 6fL<sub>s</sub>I<sub>d</sub>.',
    P: [p3, ['a', 'Firing angle α', '°', 30, 0, 150, 1], ['Id', 'Load current I<sub>d</sub>', 'A', 100, 5, 300, 5], ['Ls', 'Source inductance per phase L<sub>s</sub>', 'mH', 1, 0.1, 10, 0.05]], def: { ld: 'Id' }, sim: simOv3,
    rows: (p, S) => { const Vml = R2 * p.VL, a = p.a * D2R, Xs = 2 * PI * 50 * p.Ls / 1000, c = Math.cos(a) - 2 * Xs * p.Id / Vml, mu = Math.acos(Math.max(-1, Math.min(1, c))) - a, vo = m1(S, 'vo');
      return [['Average output voltage', 'V<sub>o</sub> = (3V<sub>ml</sub>/π) cos α − (3ωL<sub>s</sub>/π) I<sub>d</sub>', 3 * Vml / PI * Math.cos(a) - 3 * Xs / PI * p.Id, mean(vo), 'V', Vml * 5e-4],
        ['Overlap angle μ', 'cos α − cos(α + μ) = 2ωL<sub>s</sub>I<sub>d</sub>/V<sub>ml</sub>', mu / D2R, S.mu, '°'],
        ['Voltage lost to overlap', 'ΔV = (3ωL<sub>s</sub>/π) I<sub>d</sub> = 6fL<sub>s</sub>I<sub>d</sub>', 3 * Xs / PI * p.Id, 3 * Vml / PI * Math.cos(a) - mean(vo), 'V', Vml * 5e-4],
        ['The same average, written with μ', 'V<sub>o</sub> = (3V<sub>ml</sub>/2π)[cos α + cos(α + μ)]', 3 * Vml / (2 * PI) * (Math.cos(a) + Math.cos(a + mu)), mean(vo), 'V', Vml * 5e-4],
        ['Inverter limit', 'α<sub>max</sub> = 180° − μ − γ (γ = ωt<sub>q</sub>, the margin angle)', NaN, null, '']]; },
    ckt: p => ck3({ ld: 'Id' }, 'full').replace('</svg>', `${lab(12, 60, 'L<tspan dy="3" font-size="8">s</tspan><tspan dy="-3"> in each line</tspan>', 'start', 'pes')}</svg>`), q: /(3|three)[- ]?(phase|φ).{0,80}(overlap|source inductance|commutation)/i });

  // ---------- forced (voltage) commutation of a thyristor chopper ----------
  cv({ id: 'commut', g: 'DC–DC converters (choppers)', n: 'Forced commutation: turn-off time t<sub>c</sub>', sub: 'Firing the auxiliary SCR puts the charged capacitor across the main SCR and reverse-biases it for t<sub>c</sub> = CV<sub>s</sub>/I<sub>L</sub>.',
    P: [['Vs', 'Supply V<sub>s</sub> (C charged to V<sub>s</sub>)', 'V', 50, 10, 600, 5], ['C', 'Commutating capacitor C', 'µF', 10, 1, 100, 1], ['IL', 'Load current I<sub>L</sub> (constant)', 'A', 10, 1, 100, 1], ['tq', 'Main SCR turn-off time t<sub>q</sub>', 'µs', 30, 5, 200, 1]], def: {},
    sim: p => { const T2 = 2 * p.C * p.Vs / p.IL, t0 = -0.25 * T2, t1 = 1.4 * T2, n = 600, tc = T2 / 2, S = { x: [], vc: [], vt: [], vo: [], dv: [] };
      for (let j = 0; j < n; j++) { const t = t0 + (t1 - t0) * (j + 0.5) / n, vc = t < 0 ? -p.Vs : Math.min(p.Vs, -p.Vs + p.IL / p.C * t);
        S.x.push(t); S.vc.push(vc); S.vt.push(t < 0 ? 0 : vc); S.vo.push(t < 0 ? p.Vs : t < T2 ? p.Vs - vc : 0);
        S.dv.push(t < 0 ? 'ThM|V<sub>s</sub>' : t < tc ? 'ThA + C (ThM reverse-biased)|V<sub>s</sub> − v<sub>C</sub>' : t < T2 ? 'ThA + C (ThM blocking)|V<sub>s</sub> − v<sub>C</sub>' : 'FD|0'); }
      S.T2 = T2; S.t0 = t0; S.t1 = t1; S.us = true; return S; },
    waves: (p, S) => plot(S.x, [{ n: 'Main SCR voltage v<tspan dy="3" font-size="8">ThM</tspan><tspan dy="-3"> (below zero: reverse-biased)</tspan>', s: [{ ys: S.vt, col: K.r }], shade: S.vt.map(v => Math.min(0, v)) }, { n: 'Capacitor voltage v<tspan dy="3" font-size="8">C</tspan><tspan dy="-3">: slope I</tspan><tspan dy="3" font-size="8">L</tspan><tspan dy="-3">/C</tspan>', s: [{ ys: S.vc, col: K.b }] }, { n: 'Load voltage v<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.vo, col: K.vo }] }, { band: S.dv, n: 'Conducting' }],
      { ticks: [[0, 'Th<tspan dy="3" font-size="8">A</tspan><tspan dy="-3"> fired</tspan>'], [S.T2 / 2, 't<tspan dy="3" font-size="8">c</tspan>'], [S.T2, '2t<tspan dy="3" font-size="8">c</tspan>']], lab: 'Commutation waveforms' }),
    rows: (p, S) => { const tc = p.C * p.Vs / p.IL, zc = S.x.find((t, j) => t > 0 && S.vt[j] >= 0), end = S.x.find((t, j) => t > 0 && S.vo[j] <= 1e-9);
      return [['Turn-off time available to Th<sub>M</sub>', 't<sub>c</sub> = C V<sub>s</sub>/I<sub>L</sub> (v<sub>C</sub> rises from −V<sub>s</sub> to 0 at the rate I<sub>L</sub>/C)', tc, zc, 'µs'],
        ['Commutation interval (until FD takes the current)', 't = 2C V<sub>s</sub>/I<sub>L</sub>', 2 * tc, end, 'µs'],
        ['Load voltage the instant Th<sub>A</sub> fires', 'v<sub>o</sub> = V<sub>s</sub> + V<sub>C</sub> = 2V<sub>s</sub>', 2 * p.Vs, Math.max(...S.vo), 'V'],
        ['Does commutation succeed?', tc > p.tq ? `yes: t<sub>c</sub> = ${nf(tc)} µs > t<sub>q</sub> = ${p.tq} µs` : `no: t<sub>c</sub> = ${nf(tc)} µs < t<sub>q</sub> = ${p.tq} µs — the main SCR turns on again`, NaN, null, ''],
        ['Smallest C for this t<sub>q</sub>', 'C ≥ t<sub>q</sub> I<sub>L</sub>/V<sub>s</sub>', p.tq * p.IL / p.Vs, null, 'µF']]; },
    ckt: () => svgc(`${dcs(30, 50, 150, 'V<tspan dy="3" font-size="8">s</tspan>')}${ln([[30, 50], [30, 30], [100, 30], [110, 30]])}${dio(126, 30, 'r', true, 'Th<tspan dy="3" font-size="8">M</tspan>')}${ln([[142, 30], [300, 30], [300, 45]])}${dot(100, 30)}${dot(170, 30)}${ln([[100, 30], [100, 80], [112, 80]])}${dio(128, 80, 'r', true)}${lab(128, 102, 'Th<tspan dy="3" font-size="8">A</tspan>', 'middle', 'pes')}${ln([[144, 80], [152, 80]])}<line x1="152" y1="70" x2="152" y2="90" class="pewt"/><line x1="160" y1="70" x2="160" y2="90" class="pewt"/>${lab(156, 64, 'C', 'middle', 'pes')}${lab(166, 72, '+', 'start', 'pes')}${ln([[160, 80], [170, 80], [170, 30]])}${ln([[230, 30], [230, 82]])}${dio(230, 98, 'u', false, 'FD')}${ln([[230, 114], [230, 165]])}${res(300, 45, 150, 'load')}${ln([[300, 150], [300, 165], [30, 165], [30, 150]])}${dot(230, 30)}${dot(230, 165)}${lab(14, 186, 'simplified: the L–D loop that re-charges C is not drawn', 'start', 'pes')}`, 'Voltage-commutated chopper'),
    q: /commutat|turn-off time available|auxiliary thyristor|th ?a\b/i, T: 'chopper' });

  /* ---------------- the page for one converter ---------------- */
  const isCh = x => Array.isArray(x[4]);
  const defaults = c => Object.assign(Object.fromEntries(c.P.map(x => [x[0], x[3]])), { f: 50 }, c.def || {});
  const vT1Of = (c, S) => c.id === 'hw-scr' || c.id === 'hw-diode' ? S.vs.map((v, k) => v - S.vo[k])
    : c.id === 'full-converter' || c.id === 'semi-converter' ? S.dv.map((d, k) => /T1/.test(devOf(d)) ? 0 : /T3/.test(devOf(d)) ? S.vs[k] : (S.vs[k] - S.vo[k]) / 2) : null;
  function wavesOf(c, p, S) {
    if (c.waves) return c.waves(p, S);
    const band = S.dv && S.dv.some(Boolean) ? [{ band: S.dv, n: 'Conducting devices' }] : [];
    if (S.T) {
      const xs = S.x, tk = [[0, '0'], [0.5, 'T/2'], [1, 'T'], [1.5, '3T/2'], [2, '2T']], lp = k => lastP(S, k);
      const pan = c.pan ? c.pan(S, lp) : c.id === 'buck' ? [{ n: 'Output voltage v<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.vo, col: K.vo }], avg: mean(lp('vo')), rms: rmsOf(lp('vo')), shade: S.vo }, { n: 'Load current i<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.io, col: K.io }], avg: mean(lp('io')) }, { n: 'Supply (switch) current', s: [{ ys: S.is, col: K.is }], avg: mean(lp('is')) }]
        : [{ n: 'Inductor current i<tspan dy="3" font-size="8">L</tspan>', s: [{ ys: S.io, col: K.io }], avg: mean(lp('io')) }, { n: 'Switch voltage', s: [{ ys: S.is, col: K.is }] }, { n: 'Output voltage v<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.vo, col: K.vo }], avg: mean(lp('vo')) }];
      return plot(xs, [...pan, ...band], { ticks: tk, lab: 'Chopper waveforms' });
    }
    const xs = S.x, tk = S.span ? Array.from({ length: S.span + 1 }, (_, k) => [k * 360, k + ' cyc']) : degTicks(720), lv = k => (S.span ? S[k] : m1(S, k));
    if (c.pan) return plot(xs, [...c.pan(S, lv), ...band], { ticks: tk, lab: 'Converter waveforms' });
    const pan = [];
    if (c.inv) {
      if (c.w3) pan.push({ n: 'Phase voltage v<tspan dy="3" font-size="8">an</tspan>', s: [{ ys: S.vs, col: K.b }], rms: rmsOf(lv('vs')) });
      else if (c.id === 'inv-spwm') pan.push({ n: 'Reference m·V<tspan dy="3" font-size="8">dc</tspan><tspan dy="-3"> sin ωt (the fundamental it makes)</tspan>', s: [{ ys: S.vs, col: K.b }] });
      pan.push({ n: c.w3 ? 'Line voltage v<tspan dy="3" font-size="8">ab</tspan>' : 'Output voltage v<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.vo, col: K.vo }], rms: rmsOf(lv('vo')) }, { n: 'Load current i<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.io, col: K.io }], rms: rmsOf(lv('io')) });
      return plot(xs, [...pan, ...(c.id === 'inv-spwm' ? [] : band)], { ticks: tk, lab: 'Inverter waveforms' });
    }
    const three = c.g.startsWith('Three'), ac = c.g.startsWith('AC');
    pan.push({ n: three ? 'Supply phase voltages v<tspan dy="3" font-size="8">a</tspan>, v<tspan dy="3" font-size="8">b</tspan>, v<tspan dy="3" font-size="8">c</tspan>' : 'Input (supply) voltage v<tspan dy="3" font-size="8">s</tspan>', s: three ? [{ ys: S.vs, col: K.r }, { ys: S.vb, col: K.y }, { ys: S.vc, col: K.b }] : [{ ys: S.vs, col: K.vs }] });
    pan.push({ n: 'Output voltage v<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.vo, col: K.vo }], avg: ac ? undefined : mean(lv('vo')), rms: rmsOf(lv('vo')), shade: S.vo });
    if (c.id.startsWith('hw') && ['RL', 'RLE', 'L'].includes(p.ld)) { const R0 = p.ld === 'L' ? 0 : p.R, E0 = /E/.test(p.ld) ? p.E : 0, vL = S.vo.map((x, k) => x - R0 * S.io[k] - E0);
      pan.push({ n: 'Inductor voltage v<tspan dy="3" font-size="8">L</tspan><tspan dy="-3">: area A (above) = area B (below)</tspan>', s: [{ ys: vL, col: K.b }], shade: vL }); }
    pan.push({ n: 'Load current i<tspan dy="3" font-size="8">o</tspan>', s: [{ ys: S.io, col: K.io }], avg: ac ? undefined : mean(lv('io')) });
    pan.push({ n: three ? 'Supply current i<tspan dy="3" font-size="8">a</tspan>' : 'Input (supply) current i<tspan dy="3" font-size="8">s</tspan>', s: [{ ys: S.is, col: K.is }], rms: rmsOf(lv('is')) });
    const vT = vT1Of(c, S); if (vT) pan.push({ n: c.id === 'hw-diode' ? 'Diode voltage v<tspan dy="3" font-size="8">D</tspan><tspan dy="-3"> = v</tspan><tspan dy="3" font-size="8">s</tspan><tspan dy="-3"> − v</tspan><tspan dy="3" font-size="8">o</tspan>' : 'Thyristor T1 voltage v<tspan dy="3" font-size="8">T1</tspan>', s: [{ ys: vT, col: K.r }] });
    return plot(xs, [...pan, ...band], { ticks: tk, lab: 'Converter waveforms' });
  }
  function rowsHtml(rows) {
    return `<div class="pert"><div class="perh"><span>If the question asks…</span><span>use…</span></div>${rows.map(([n, f, fx, ms, u, tol]) => { const both = Number.isFinite(fx) && Number.isFinite(ms), ok = both && near(ms, fx, tol);
      return `<div class="perw"><div class="pern">${n}</div><div class="perf">${f}</div><div class="perv">${Number.isFinite(fx) ? `<span><small>by formula</small><b>${nf(fx)} ${u}</b></span>` : ''}${Number.isFinite(ms) ? `<span><small>from the waveform</small><b>${nf(ms)} ${u}</b></span>` : ''}${both ? `<em class="${ok ? 'ok' : 'no'}">${ok ? '✓ match' : '≠'}</em>` : ''}</div></div>`; }).join('')}</div>`;
  }
  // the conduction sequence: runs of the same devices over the last cycle (from the simulation's own labels)
  function seqRuns(S) {
    if (!S.dv || !S.dv.some(Boolean)) return null;
    const n = S.T ? S.n : S.us || S.span ? S.dv.length : N, L = S.dv.slice(S.dv.length - n), runs = []; let s0 = 0;
    for (let i = 1; i <= n; i++) if (i === n || L[i] !== L[s0]) { runs.push([s0, i, L[s0]]); s0 = i; }
    if (!S.T && !S.us && !S.span && runs.length > 1 && runs[0][2] === runs[runs.length - 1][2]) { const f = runs.shift(); runs[runs.length - 1][1] = n + f[1]; }
    return { runs, n };
  }
  function seqHtml(c, S) {
    const R = seqRuns(S); if (!R) return '';
    if (R.runs.length > 16) return '<p class="pg">The devices switch many times a cycle (PWM), so the band under the waveforms shows them instead of a table.</p>';
    const at = i => S.T ? `${nf(i / R.n, 2)} T` : S.us ? `${nf(S.t0 + (S.t1 - S.t0) * i / R.n)} µs` : S.span ? `cycle ${Math.floor(i / N) + 1}` : `${+(i * 360 / R.n).toFixed(1)}°`;
    const ch = S.T || S.us ? 'What happens' : 'v<sub>o</sub> =';
    return `<table class="pesq"><thead><tr><th>From → to</th><th>Conducting</th><th>${ch}</th></tr></thead><tbody>${R.runs.map(([a, b, l]) => { const [d, v] = String(l).split('|');
      return `<tr><td>${at(a)} → ${at(b)}</td><td><b>${esc(d)}</b></td><td>${v || ''}</td></tr>`; }).join('')}</tbody></table>`;
  }

  /* ================= the atlas pages: #pe (circuits) and #pe-<tab> ================= */
  const TABS = [['atlas', 'Circuits'], ['compare', 'Inputs vs outputs'], ['table', 'All formulas'], ['lab', 'Waveform ↔ formula'], ['regen', 'Regenerative words'], ['asked', 'How PYQs ask'], ['check', 'PYQ formula check']];
  const GRP = ['Single-phase rectifiers', 'Three-phase rectifiers', 'AC voltage controllers', 'DC–DC converters (choppers)', 'Inverters (DC → AC)'];
  const tabHref = k => k === 'atlas' ? '#pe' : '#pe-' + k;
  const sb = (a, b, rest = '') => `${a}<tspan dy="3" font-size="8">${b}</tspan>${rest ? `<tspan dy="-3">${rest}</tspan>` : ''}`;
  const plain = s => String(s ?? '').replace(/<[^>]+>/g, '');
  const clean = s => String(s || '').replace(/[-​-‍﻿]/g, ' ').replace(/\s+/g, ' ').trim();
  const stemOf = q => { const t = clean(q.x), m = t.search(/\s\(A\)\s/); return m > 40 ? t.slice(0, m) : t; };
  const is3 = t => /three[- ]phase|3[- ]?(phase|φ)|six[- ]pulse|6[- ]pulse/i.test(t);
  const ONE = new Set(['hw-diode', 'hw-scr', 'bridge-diode', 'full-converter', 'asym', 'semi-converter', 'overlap1', 'ac1', 'ac1half', 'inv-half', 'inv-full']);
  // which circuit pages a question's words point to
  const QRX = {
    'hw-diode': /half[- ]?wave (diode )?rectifier|diode (is )?connected to a pure induct|diode circuit feeds an ideal inductor|diode connects the ac source to a pure inductance/i,
    'hw-scr': /half[- ]?wave controlled|half[- ]wave.{0,30}(thyristor|scr)|through an (ideal )?(scr|thyristor)|one thyristor|single thyristor/i,
    'bridge-diode': /diode bridge|bridge rectifier|full[- ]wave (diode|rectifier|uncontrolled)|centre[- ]?tap|center[- ]?tap/i,
    'full-converter': /(fully|full)[- ]controlled (thyristor )?(bridge|converter|rectifier)|full[- ]?converter|full[- ]bridge,? fully[- ]controlled|single[- ]phase,? full[- ]bridge/i,
    'asym': /three thyristors/i,
    'semi-converter': /semi[- ]?converter|half[- ]controlled|two thyristors and two diodes/i,
    'overlap1': /overlap|source inductance|cables? which have/i,
    '3hw': /(three|3)[- ]?(phase|φ) half[- ]?wave|three[- ]?pulse|3[- ]?pulse/i,
    '3full': /(three|3)[- ]?(phase|φ).{0,60}(full|fully|bridge|6[- ]pulse|six[- ]pulse)/i,
    '3semi': /(three|3)[- ]?(phase|φ).{0,30}(semi|half[- ]controlled)/i,
    'overlap3': /(three|3)[- ]?(phase|φ).{0,160}(overlap|source inductance)/i,
    'ac1': /ac (voltage )?(controller|regulator)|triac|anti[- ]?parallel|inverse[- ]?parallel/i,
    'ac1half': /half[- ]wave ac/i,
    'icc': /integral[- ]cycle|on[- ]off control|burst firing/i,
    'ac3': /(three|3)[- ]?(phase|φ).{0,40}ac (voltage )?(controller|regulator)/i,
    'buck': /step[- ]down chopper|\bchopper\b|class[- ]?a chopper/i,
    'buck-lc': /buck (converter|regulator)|smps|switched[- ]mode|output capacitor/i,
    'boost': /boost|step[- ]up (chopper|converter)/i,
    'buckboost': /buck[- ]?boost|ćuk|\bcuk\b/i,
    'inv-half': /half[- ]bridge (voltage[- ]source )?inverter/i,
    'inv-full': /full[- ]bridge (voltage[- ]source )?inverter|single[- ]phase (bridge |voltage[- ]source )?inverter|square[- ]wave inverter/i,
    'inv-quasi': /quasi[- ]square|single[- ]pulse|pulse width of|pulse of width/i,
    'inv-spwm': /\bpwm\b|modulation index|carrier|sinusoidal pulse/i,
    'inv-180': /180 ?°? ?(mode|conduction)|six[- ]step|(three|3)[- ]?(phase|φ) (voltage[- ]source |bridge )?inverter/i,
    'inv-120': /120 ?°? ?(mode|conduction)/i,
    'commut': /commutat(ion|ed)|turn[- ]off time available|auxiliary thyristor/i,
  };
  // the Question Book's own sub-topics → where they live here (a circuit page, or a tab)
  const SUBMAP = [['Effect of source inductance', ['overlap1', 'overlap3']], ['Commutation of thyristors', ['commut']], ['Minimum gate pulse width', ['@book']], ['Composite switches', ['@theory']],
    ['Square-wave inverter with pure L', ['inv-full', 'inv-half']], ['SCR basics', ['@book']], ['1-φ half-wave controlled', ['hw-scr']], ['1-φ full converter', ['full-converter']], ['1-φ semi-converter', ['semi-converter']],
    ['3-φ full converter', ['3full']], ['Harmonic measures', ['@lab']], ['Choppers (DC–DC)', ['buck', 'boost', 'buckboost']], ['Single-phase inverter', ['inv-full', 'inv-half']], ['3-φ inverter (180° mode)', ['inv-180']],
    ['AC voltage controller', ['ac1']], ['Other converters', ['@theory']], ['Drives', ['@regen']], ['Motor braking', ['@regen']], ['IGCT', ['@theory']], ['Converter input-current harmonics', ['semi-converter', 'full-converter']],
    ['Inverter output formulas', ['inv-quasi', 'inv-spwm']], ['Device comparison', ['@theory']], ['Diode conduction loss', ['@book']], ['PWM rectifier', ['@book']], ['Switching losses', ['@book']], ['Triggering circuits', ['@book']],
    ['Converter input current (ripple-free', ['full-converter', '3full']], ['Buck converter ripple', ['buck-lc']], ['Buck ripple', ['buck-lc']], ['Rectifier rms & RL-load', ['hw-scr', 'ac1']], ['Boost & buck-boost', ['boost', 'buckboost']],
    ['RMS & average (sine)', ['@lab']], ['AC power with peak values', ['@lab']], ['Diode reverse recovery', ['@book']], ['Half-wave rectifier', ['hw-diode']]];
  const TGT = { '@lab': ['Waveform ↔ formula', '#pe-lab'], '@regen': ['Regenerative words', '#pe-regen'], '@book': ['All formulas → book sub-topics', '#pe-table'], '@theory': ['theory (no formula needed)', ''] };
  const subOf = (U, q) => ((U && U.subs && U.subs[+q.sub]) || [''])[0];
  function pagesFor(q, U) {
    const t = stemOf(q), out = new Set();
    CV.forEach(c => { const rx = QRX[c.id]; if (!rx || !rx.test(t)) return; if (ONE.has(c.id) && is3(t)) return; if (c.id === 'buck' && /boost/i.test(t)) return; if (c.id === 'boost' && /buck[- ]?boost/i.test(t)) return; if (c.id === 'full-converter' && /three thyristors/i.test(t)) return; out.add(c.id); });
    if (/regenerat|braking|plugging|four[- ]quadrant|dual converter/i.test(t)) out.add('@regen');
    const sn = subOf(U, q); SUBMAP.forEach(([pre, ids]) => { if (sn.startsWith(pre)) ids.forEach(x => out.add(x)); });
    return [...out];
  }
  const pageChip = id => { const c = CV.find(x => x.id === id); if (c) return `<a class="pechip" href="#pe-${c.id}">${c.n}</a>`; const t = TGT[id]; return t ? (t[1] ? `<a class="pechip alt" href="${t[1]}">${t[0]}</a>` : `<span class="pechip th">${t[0]}</span>`) : ''; };
  // what a question gives (inputs) and what it asks (output)
  const GIV = [['Supply voltage', /\d\s?k?V\b|volt/i], ['Frequency', /\d\s?Hz/i], ['Firing angle α', /α|firing|delay angle|trigger/i], ['R', /Ω|ohm|resist/i], ['L', /\d\s?(mH|µH|uH|H)\b|inductan|inductor/i], ['C', /µF|uF|nF|capacit/i],
    ['E (battery / motor)', /back emf|battery|\bemf\b|motor/i], ['Current', /\d\s?A\b|ampere/i], ['Duty ratio', /duty/i], ['Switching frequency', /kHz|switching frequency|chopping frequency/i], ['Speed', /rpm|speed/i], ['A figure / waveform', /figure|waveform|shown/i]];
  const ASK = [['wave', 'Which waveform (pick the picture)', /(\w+ )?waveform|will look like|characteristics? (is|are)/i], ['stmt', 'Which statement or device (theory)', /which (one )?of (the following|the above|them)|is\/are (correct|true)|statements? (is|are)|_{4,}|fastest|feature of|are only suitable/i],
    ['ratio', 'A ratio', /\bratio\b/i], ['beta', 'An angle: extinction, conduction, overlap, phase shift', /extinction angle|conduction angle|conducts for|overlap angle|commutation overlap|phase shift|phase angle/i],
    ['time', 'A time: turn-off, commutation, pulse width, part of a cycle', /turn[- ]?off time|turned off between|commutation time|pulse width|conduction time|time (interval|period)|fraction of the cycle|\bperiod\b/i], ['freq', 'A frequency or number of pulses', /frequenc|number of pulses|pulses per/i],
    ['duty', 'Duty ratio or modulation index', /duty (ratio|cycle)|modulation index|on[- ]time|off[- ]time/i], ['thd', 'Harmonics, THD, fundamental', /\bthd\b|harmonic|fundamental/i], ['pf', 'Power factor (displacement, distortion)', /power factor|displacement factor|distortion factor/i],
    ['ipk', 'Peak current', /peak (value of )?(the )?[\w ]{0,40}current|maximum (value of )?(the )?[\w ]{0,20}current|peak current/i], ['irms', 'RMS current', /rms (value of )?(the )?[\w ]{0,30}current/i], ['iavg', 'Average current', /(average|mean|dc) (value of )?(the )?[\w ]{0,30}current/i],
    ['vrms', 'RMS voltage', /rms (value of )?(the )?[\w ]{0,30}voltage/i], ['vavg', 'Average (dc) voltage', /(average|mean|dc) (value of )?(the )?[\w ]{0,30}voltage|output voltage|load voltage|\boutput at\b/i],
    ['alpha', 'Firing angle α', /firing angle|delay angle|triggering angle|trigger(ing)? angle|angle of firing|α in\b|value of α|α should/i], ['ripple', 'Ripple', /ripple/i], ['pow', 'Power or VA rating', /\bpower\b(?! factor| electronic| semiconductor| diode| mosfet| transistor| device)|kva|\bva rating/i],
    ['lc', 'A value of R, L or C', /inductance|capacitance|value of (the )?[\w ]{0,20}(capacitor|inductor|resistance|resistor)|value of r\b|resistance|\(in (µ|m)?h\)|in µf/i], ['eff', 'Energy, efficiency or loss', /efficiency|\bloss|energy (dissipated|lost|stored)/i],
    ['speed', 'Speed, torque or braking', /speed|rpm|torque|braking|run at/i], ['cur', 'A current (value or shape)', /current/i], ['dev', 'Device behaviour (theory)', /latching|holding|gate|mosfet|igbt|gto|bjt|thyristor|scr|diac|triac|ujt|snubber|di\/dt|dv\/dt|device|switch/i]];
  function askOf(q) {
    const t = stemOf(q).replace(/\((give|round|rounded|up to|answer|correct|assume)[^)]*\)\.?/gi, ' ').trim(), parts = t.split(/[.?]\s+(?=[A-Z(])/); let a = parts[parts.length - 1]; if (a.length < 30 && parts.length > 1) a = parts.slice(-2).join('. ');
    const a2 = a.replace(/^(if|when|for|assuming|given|with)\b[^,]*,\s*/i, ''); let best = null, at = 1e9;
    ASK.forEach(([k, n, rx]) => { const m = rx.exec(a2); if (m && m.index < at) { at = m.index; best = k; } });
    const given = (parts.length > 1 ? parts.slice(0, -1).join('. ') : t);
    return { ask: best || 'other', given: GIV.filter(([, rx]) => rx.test(given)).map(([n]) => n) };
  }
  const qLink = q => `<a class="peq" href="#t-961-prac" data-gou="${esc(q.id)}"><span class="ex ex-${esc(q.ex)}">${esc(q.src)}</span><span>${esc(stemOf(q).slice(0, 190))}${stemOf(q).length > 190 ? '…' : ''}</span></a>`;
  function askedFor(c, U) {
    if (!U || !U.q) return '<p class="pg">Past questions could not be loaded (offline?).</p>';
    const L = U.q.filter(q => pagesFor(q, U).includes(c.id));
    if (!L.length) return '<p class="pg">No past question in your book points to this exact circuit — it is here so the family is complete.</p>';
    return `<p class="pg">${L.length} past question${L.length > 1 ? 's' : ''} in your Question Book use this circuit (matched by their words). Tap one to open it with its answer.</p><div class="peql">${L.map(q => { const A = askOf(q);
      return `<div class="peqi">${qLink(q)}<p class="pegv"><b>Gives:</b> ${A.given.map(g => `<span>${g}</span>`).join('') || '—'} <b>Asks:</b> <span class="ak">${(ASK.find(x => x[0] === A.ask) || [0, 'other'])[1]}</span></p></div>`; }).join('')}</div>`;
  }

  // ---------- tab: circuits ----------
  function tabAtlas(B) {
    B.innerHTML = `<section class="pehow"><h2>How each circuit page works</h2><ol><li><b>Circuit</b> — drawn for the load you pick.</li><li><b>Sliders</b> — change α, the load, the supply.</li><li><b>Waveforms</b> — input and output, simulated step by step; green dashes = average, amber dots = rms.</li><li><b>Who conducts when</b> — the device sequence, read from the simulation.</li><li><b>Formulas</b> — each one next to the same value measured from the drawn waveform. ✓ means they agree.</li><li><b>Past questions</b> — the ones in your book that use this circuit.</li></ol></section>
      ${GRP.map(g => `<h2 class="vgh">${g}</h2><div class="pegrid">${CV.filter(c => c.g === g).map(c => `<a class="petile" href="#pe-${c.id}"><div class="pethumb" data-th="${c.id}"></div><b>${c.n}</b><small>${c.sub}</small></a>`).join('')}</div>`).join('')}`;
    const L = [...B.querySelectorAll('[data-th]')]; let k = 0;
    const next = () => { if (k >= L.length || !L[k].isConnected) return; const el = L[k++], c = CV.find(x => x.id === el.dataset.th), p = defaults(c), S = c.sim(p);
      el.innerHTML = c.waves ? c.waves(p, S).replace('class="pesvg"', 'class="pesvg sm"') : plot(S.x, [{ n: '', s: [{ ys: c.inv && c.w3 ? S.vo : S.vo, col: K.vo }], shade: S.vo, h: 54 }], {}).replace('class="pesvg"', 'class="pesvg sm"'); setTimeout(next, 0); };
    next();
  }

  // ---------- tab: inputs vs outputs ----------
  const CMP = { 'hw-diode': ['AC → DC', 'half-sine pulses (a dc part flows in the supply)', 'V<sub>m</sub>/π', 'f'], 'hw-scr': ['AC → DC', 'pulses from α', '(V<sub>m</sub>/2π)(1 + cos α)', 'f'],
    'bridge-diode': ['AC → DC', 'sine (R) or square ±I<sub>d</sub> (large L)', '2V<sub>m</sub>/π', '2f'], 'full-converter': ['AC ⇄ DC', 'square ±I<sub>d</sub>, shifted by α', '(2V<sub>m</sub>/π) cos α', '2f'],
    'asym': ['AC → DC', 'blocks, zero for α after π', '(V<sub>m</sub>/2π)(1 + 3 cos α)', 'f'], 'semi-converter': ['AC → DC', 'quasi-square, width π − α', '(V<sub>m</sub>/π)(1 + cos α)', '2f'],
    'overlap1': ['AC → DC', 'trapezoid (slopes last μ)', '(2V<sub>m</sub>/π) cos α − 4fL<sub>s</sub>I<sub>d</sub>', '2f'], '3hw': ['3-φ AC → DC', '120° blocks of I<sub>d</sub> (dc in each line)', '1.17V<sub>ph</sub> cos α', '3f'],
    '3full': ['3-φ AC ⇄ DC', '120° blocks ±I<sub>d</sub>; 5th, 7th, 11th …', '1.35V<sub>L</sub> cos α', '6f'], '3semi': ['3-φ AC → DC', 'blocks; freewheels beyond 60°', '(3V<sub>ml</sub>/2π)(1 + cos α)', '6f / 3f'],
    'overlap3': ['3-φ AC → DC', 'trapezoidal 120° blocks', '(3V<sub>ml</sub>/π) cos α − 6fL<sub>s</sub>I<sub>d</sub>', '6f'], 'ac1': ['AC → AC', 'the same chopped sine as the output', 'V<sub>s</sub>√[(π − α + ½ sin 2α)/π] rms', 'odd harmonics'],
    'ac1half': ['AC → AC', 'chopped positive half (has dc)', 'V<sub>s</sub>√[(2π − α + ½ sin 2α)/2π] rms', 'dc + harmonics'], 'icc': ['AC → AC', 'whole cycles on and off', 'V<sub>s</sub>√k rms', 'sub-harmonics'],
    'ac3': ['3-φ AC → AC', 'chopped sines', 'piecewise in α (rms)', '6k ± 1'], 'buck': ['DC → DC (lower)', 'pulses of i<sub>o</sub> during DT', 'DV<sub>s</sub>', 'f<sub>s</sub>'], 'buck-lc': ['DC → DC (lower)', 'pulses', 'DV<sub>s</sub>', 'f<sub>s</sub>'],
    'boost': ['DC → DC (higher)', 'smooth i<sub>L</sub> with a triangle ripple', 'V<sub>s</sub>/(1 − D)', 'f<sub>s</sub>'], 'buckboost': ['DC → DC (reversed)', 'pulses', '−DV<sub>s</sub>/(1 − D)', 'f<sub>s</sub>'],
    'inv-half': ['DC → AC', 'from the split dc link', '±V<sub>dc</sub>/2 square', 'n odd, V<sub>1</sub>/n'], 'inv-full': ['DC → AC', 'dc link current reverses with the load current', '±V<sub>dc</sub> square, V<sub>1</sub> = 0.9V<sub>dc</sub>', 'n odd'],
    'inv-quasi': ['DC → AC', 'dc link', 'V<sub>1</sub> = 0.9V<sub>dc</sub> sin d', 'removes 360°/2d'], 'inv-spwm': ['DC → AC', 'dc link', 'V<sub>1,peak</sub> = mV<sub>dc</sub>', 'near m<sub>f</sub>'],
    'inv-180': ['DC → 3-φ AC', 'dc link', 'V<sub>L</sub> = 0.816V<sub>dc</sub>', '6k ± 1'], 'inv-120': ['DC → 3-φ AC', 'dc link', 'V<sub>L</sub> = 0.707V<sub>dc</sub>', '6k ± 1'] };
  const mp = (xs, a, b) => plot(xs, [{ n: a[0], s: [{ ys: a[1], col: a[2] }], h: 46 }, ...(b ? [{ n: b[0], s: [{ ys: b[1], col: b[2] }], h: 46 }] : [])], {}).replace('class="pesvg"', 'class="pesvg sm"');
  function ioOf(c, p, S) {
    if (S.T) { const on = j => (j % S.n) + 0.5 < p.D * S.n, iin = c.id === 'boost' ? S.io : c.id === 'buck' ? S.is : S.io.map((x, j) => on(j) ? x : 0), iout = c.id === 'buck' ? S.io : S.vo.map(v => v / p.R);
      return [mp(S.x, [sb('v', 'in', ' (dc)'), S.vs, K.vs], [sb('i', 'in'), iin, K.is]), mp(S.x, [sb('v', 'o'), S.vo, K.vo], [sb('i', 'o'), iout, K.io])]; }
    if (c.inv) return [mp(S.x, [sb('V', 'dc'), S.vo.map(() => p.Vs), K.vs], c.w3 ? null : [sb('i', 'dc', ' = v·i/V'), S.vo.map((v, k) => v * S.io[k] / p.Vs), K.is]), mp(S.x, [c.w3 ? sb('v', 'ab') : sb('v', 'o'), S.vo, K.vo], [sb('i', 'o'), S.io, K.io])];
    return [mp(S.x, [sb('v', 's'), c.id === 'overlap1' ? S.vb : S.vs, K.vs], [sb('i', c.g.startsWith('Three') ? 'a' : 's'), S.is, K.is]), mp(S.x, [sb('v', 'o'), S.vo, K.vo], [sb('i', 'o'), S.io, K.io])];
  }
  function tabCompare(B) {
    const L = CV.filter(c => CMP[c.id]);
    B.innerHTML = `<section class="pehow"><h2>What goes in, what comes out</h2><p>Every circuit at its default settings: the <b>input</b> (supply voltage and the current the supply gives) beside the <b>output</b> (load voltage and load current). Tap a name to change the settings.</p></section>
      <div class="pescroll"><table class="petab pecards"><thead><tr><th>Circuit</th><th>Changes</th><th>Output (average or fundamental)</th><th>Supply current looks like</th><th>Ripple / harmonics</th></tr></thead><tbody>${L.map(c => { const m = CMP[c.id];
        return `<tr><td><a href="#pe-${c.id}">${c.n}</a></td><td data-h="Changes">${m[0]}</td><td data-h="Output">${m[2]}</td><td data-h="Supply current">${m[1]}</td><td data-h="Ripple / harmonics">${m[3]}</td></tr>`; }).join('')}</tbody></table></div>
      <h2 class="vgh">One circuit, four loads</h2><p class="pg">The same full converter at α = 60° (and the half-wave SCR at α = 45°): the load changes the output waveform, and so the formula.</p><div class="pe4" id="pe4"></div>
      <h2 class="vgh">Input and output of every circuit</h2>${GRP.map(g => `<h3 class="peg">${g}</h3><div class="pecmpg">${L.filter(c => c.g === g).map(c => `<div class="pecmp" data-cm="${c.id}"><div class="pecmh"><a href="#pe-${c.id}"><b>${c.n}</b></a><span class="pechip th">${CMP[c.id][0]}</span></div><div class="pecm2"><figure><figcaption>Input</figcaption><div class="pei"></div></figure><figure><figcaption>Output</figcaption><div class="peo"></div></figure></div></div>`).join('')}</div>`).join('')}`;
    const four = [['full-converter', { a: 60, ld: 'R' }, 'R'], ['full-converter', { a: 60, ld: 'RL', L: 50 }, 'R–L (L = 50 mH)'], ['full-converter', { a: 60, ld: 'RLE', L: 50, E: 60 }, 'R–L–E (E = 60 V)'], ['full-converter', { a: 60, ld: 'Id' }, 'Large L (I<sub>d</sub>)'],
      ['hw-scr', { a: 45, ld: 'R' }, 'R'], ['hw-scr', { a: 45, ld: 'RL', L: 50 }, 'R–L, no FWD'], ['hw-scr', { a: 45, ld: 'RL', L: 50, fwd: 'yes' }, 'R–L with FWD'], ['hw-scr', { a: 45, ld: 'L', L: 100 }, 'Pure L']];
    $q('#pe4', B).innerHTML = four.map(([id, o, n]) => { const c = CV.find(x => x.id === id), p = Object.assign(defaults(c), o), S = c.sim(p), vo = m1(S, 'vo');
      return `<div class="pecmp"><div class="pecmh"><b>${id === 'hw-scr' ? 'Half-wave SCR' : 'Full converter'} · ${n}</b><span class="pechip th">V<sub>o</sub> = ${nf(mean(vo))} V</span></div>${mp(S.x, [sb('v', 'o'), S.vo, K.vo], [sb('i', 'o'), S.io, K.io])}</div>`; }).join('');
    const els = [...B.querySelectorAll('[data-cm]')]; let k = 0;
    const next = () => { if (k >= els.length || !els[k].isConnected) return; const el = els[k++], c = CV.find(x => x.id === el.dataset.cm), p = defaults(c), S = c.sim(p), [i, o] = ioOf(c, p, S);
      $q('.pei', el).innerHTML = i; $q('.peo', el).innerHTML = o; setTimeout(next, 0); };
    next();
  }
  const $q = (s, r) => r.querySelector(s);

  // ---------- tab: every formula, as one tree ----------
  const FT = [
    ['1-φ half-wave (one SCR or diode)', ['hw-scr', 'hw-diode'], [['Average output, R load', 'V<sub>o</sub> = (V<sub>m</sub>/2π)(1 + cos α); diode: V<sub>m</sub>/π = 0.45V<sub>s</sub>', 'also any load with a freewheeling diode'], ['RMS output, R load', 'V<sub>rms</sub> = (V<sub>m</sub>/2)√[(π − α + ½ sin 2α)/π]; diode: V<sub>m</sub>/2', ''],
      ['Average output, R–L (no FWD)', 'V<sub>o</sub> = (V<sub>m</sub>/2π)(cos α − cos β)', 'β: sin(β − φ) = sin(α − φ)e<sup>−(β−α)/tan φ</sup>'], ['Current, R–L', 'i = (V<sub>m</sub>/Z)[sin(ωt − φ) − sin(α − φ)e<sup>−(ωt−α)/tan φ</sup>]', 'Z = √(R² + ω²L²), φ = tan<sup>−1</sup>(ωL/R); no transient when α = φ'],
      ['Pure L', 'i = (V<sub>m</sub>/ωL)(cos α − cos ωt); I<sub>peak</sub> = (V<sub>m</sub>/ωL)(1 + cos α) at ωt = π; β = 2π − α', 'area A = area B'], ['Battery charging (R–E)', 'I<sub>o</sub> = [V<sub>m</sub>(cos θ<sub>1</sub> − cos θ<sub>2</sub>) − E(θ<sub>2</sub> − θ<sub>1</sub>)]/(2πR)', 'θ<sub>1</sub> = sin<sup>−1</sup>(E/V<sub>m</sub>) or α if later; θ<sub>2</sub> = π − sin<sup>−1</sup>(E/V<sub>m</sub>)'],
      ['With FWD, I<sub>d</sub> constant', 'I<sub>T,avg</sub> = I<sub>d</sub>(π − α)/2π; I<sub>FD,avg</sub> = I<sub>d</sub>(π + α)/2π', ''], ['Diode, R load', 'FF = 1.57; RF = 1.21; η = 40.6 %; TUF = 0.287; PIV = V<sub>m</sub>', '']]],
    ['1-φ full converter (4 SCRs)', ['full-converter', 'overlap1'], [['Average output, continuous current', 'V<sub>o</sub> = (2V<sub>m</sub>/π) cos α = 0.9V<sub>s</sub> cos α', 'large L, or R–L–E with continuous current'], ['Average output, R load', 'V<sub>o</sub> = (V<sub>m</sub>/π)(1 + cos α)', ''],
      ['RMS output', 'continuous: V<sub>rms</sub> = V<sub>s</sub>; R: V<sub>s</sub>√[(π − α + ½ sin 2α)/π]', ''], ['Supply current', 'I<sub>s</sub> = I<sub>d</sub>; I<sub>s1</sub> = (2√2/π)I<sub>d</sub> = 0.9I<sub>d</sub>; I<sub>s1,peak</sub> = 4I<sub>d</sub>/π; I<sub>n</sub> = I<sub>s1</sub>/n (n odd)', 'ripple-free I<sub>d</sub>'],
      ['Power factor', 'pf = 0.9 cos α; DF = cos α; CDF = 0.9; THD = 48.3 %', ''], ['Powers', 'P = (2V<sub>m</sub>/π)I<sub>d</sub> cos α; Q = (2V<sub>m</sub>/π)I<sub>d</sub> sin α', ''], ['Thyristors', 'I<sub>T,avg</sub> = I<sub>d</sub>/2; I<sub>T,rms</sub> = I<sub>d</sub>/√2; PIV = V<sub>m</sub>', ''],
      ['R–L–E load', 'I<sub>o</sub> = (V<sub>o</sub> − E)/R', 'inverting: α > 90° with E reversed'], ['Source inductance L<sub>s</sub>', 'V<sub>o</sub> = (2V<sub>m</sub>/π) cos α − (2ωL<sub>s</sub>/π)I<sub>d</sub>; cos α − cos(α + μ) = 2ωL<sub>s</sub>I<sub>d</sub>/V<sub>m</sub>', 'overlap μ'], ['Inverter limit', 'α ≤ 180° − μ − γ (γ = ωt<sub>q</sub>)', '']]],
    ['1-φ semi-converter and the 3-SCR + 1-diode bridge', ['semi-converter', 'asym'], [['Average output', 'V<sub>o</sub> = (V<sub>m</sub>/π)(1 + cos α)', 'any load: the output never goes negative'], ['RMS output', 'V<sub>rms</sub> = V<sub>s</sub>√[(π − α + ½ sin 2α)/π]', ''],
      ['Supply current', 'I<sub>s</sub> = I<sub>d</sub>√[(π − α)/π]; I<sub>s1</sub> = (2√2/π)I<sub>d</sub> cos(α/2); I<sub>s1,peak</sub> = (4I<sub>d</sub>/π) cos(α/2)', 'quasi-square of width π − α'], ['Power factor', 'DF = cos(α/2); pf = 2√2 cos²(α/2)/√[π(π − α)]', ''],
      ['Freewheeling', 'α of each half cycle: v<sub>o</sub> = 0 and i<sub>s</sub> = 0', 'one quadrant: cannot regenerate'], ['3 SCRs + 1 diode', 'V<sub>o</sub> = (V<sub>m</sub>/2π)(1 + 3 cos α)', 'T1, T3 at α; T2 at π + α']]],
    ['1-φ diode rectifiers (full wave)', ['bridge-diode'], [['Average and rms', 'V<sub>o</sub> = 2V<sub>m</sub>/π = 0.9V<sub>s</sub>; V<sub>rms</sub> = V<sub>m</sub>/√2', ''], ['Factors, R load', 'FF = 1.11; RF = 0.482; η = 81.2 %', ''], ['PIV and TUF', 'bridge: PIV = V<sub>m</sub>, TUF = 0.812; centre-tap: PIV = 2V<sub>m</sub>, TUF = 0.672', ''], ['Ripple frequency', '2f', '']]],
    ['3-φ half-wave (3-pulse)', ['3hw'], [['Average output, continuous', 'V<sub>o</sub> = (3√3V<sub>mp</sub>/2π) cos α = 1.17V<sub>ph</sub> cos α', 'R load: also for α ≤ 30°'], ['Average output, R, α > 30°', 'V<sub>o</sub> = (3V<sub>mp</sub>/2π)[1 + cos(α + 30°)]', '30° ≤ α ≤ 150°'],
      ['Thyristors', 'I<sub>T,avg</sub> = I<sub>d</sub>/3; I<sub>T,rms</sub> = I<sub>d</sub>/√3; PIV = √3V<sub>mp</sub>', ''], ['Ripple frequency', '3f', '']]],
    ['3-φ full converter (6-pulse)', ['3full', 'overlap3'], [['Average output, continuous', 'V<sub>o</sub> = (3V<sub>ml</sub>/π) cos α = 1.35V<sub>L</sub> cos α', 'R load: also for α ≤ 60°'], ['Average output, R, α > 60°', 'V<sub>o</sub> = (3V<sub>ml</sub>/π)[1 + cos(α + 60°)]', '60° ≤ α ≤ 120°'],
      ['RMS output', 'V<sub>rms</sub> = V<sub>ml</sub>√[½ + (3√3/4π) cos 2α]', 'continuous'], ['Supply current', 'I<sub>s</sub> = √(2/3)I<sub>d</sub> = 0.816I<sub>d</sub>; I<sub>s1</sub> = (√6/π)I<sub>d</sub> = 0.78I<sub>d</sub>; harmonics 6k ± 1', ''],
      ['Power factor', 'pf = (3/π) cos α = 0.955 cos α; CDF = 3/π; THD = 31.1 %', ''], ['Thyristors', 'each conducts 120°; I<sub>T,avg</sub> = I<sub>d</sub>/3; I<sub>T,rms</sub> = I<sub>d</sub>/√3; PIV = V<sub>ml</sub>', ''],
      ['Source inductance', 'V<sub>o</sub> = (3V<sub>ml</sub>/π) cos α − (3ωL<sub>s</sub>/π)I<sub>d</sub>; cos α − cos(α + μ) = 2ωL<sub>s</sub>I<sub>d</sub>/V<sub>ml</sub>', ''], ['Ripple frequency', '6f', '']]],
    ['3-φ semi-converter', ['3semi'], [['Average output', 'V<sub>o</sub> = (3V<sub>ml</sub>/2π)(1 + cos α)', ''], ['Ripple', '6f for α < 60°, 3f above', 'freewheels for α > 60°']]],
    ['Dual converter', [], [['Firing angles', 'α<sub>1</sub> + α<sub>2</sub> = 180°', 'both converters then give the same average voltage'], ['Output', 'V<sub>o</sub> = (2V<sub>m</sub>/π) cos α<sub>1</sub> = −(2V<sub>m</sub>/π) cos α<sub>2</sub>', '3-φ: 1.35V<sub>L</sub> cos α<sub>1</sub>'], ['Circulating current', 'limited by a reactor between the converters (their instantaneous voltages differ)', 'circulating-current mode']]],
    ['1-φ AC voltage controllers', ['ac1', 'ac1half', 'icc'], [['RMS output, R', 'V<sub>o</sub> = V<sub>s</sub>√[(π − α + ½ sin 2α)/π]', 'two SCRs or a triac'], ['Power and pf, R', 'P = V<sub>o</sub>²/R; pf = V<sub>o</sub>/V<sub>s</sub>', ''],
      ['SCR currents, R', 'I<sub>T,avg</sub> = (√2V<sub>s</sub>/2πR)(1 + cos α); I<sub>T,rms</sub> = I<sub>o</sub>/√2', ''], ['R–L load', 'control range φ ≤ α ≤ π; V<sub>o</sub> = V<sub>s</sub>√[(β − α + ½(sin 2α − sin 2β))/π]', 'α < φ: full sine, no control'],
      ['SCR + diode', 'V<sub>o</sub> = V<sub>s</sub>√[(2π − α + ½ sin 2α)/2π]; V<sub>dc</sub> = (√2V<sub>s</sub>/2π)(cos α − 1)', ''], ['Integral-cycle control', 'V<sub>o</sub> = V<sub>s</sub>√k; P = kV<sub>s</sub>²/R; pf = √k', 'k = n/(n + m)']]],
    ['3-φ AC voltage controller (star R, no neutral)', ['ac3'], [['0 ≤ α ≤ 60°', 'V<sub>o</sub> = √6V<sub>s</sub>√{(1/π)[π/6 − α/4 + sin 2α/8]}', 'two or three SCRs conduct'], ['60° ≤ α ≤ 90°', 'V<sub>o</sub> = √6V<sub>s</sub>√{(1/π)[π/12 + 3 sin 2α/16 + √3 cos 2α/16]}', 'two SCRs conduct'],
      ['90° ≤ α ≤ 150°', 'V<sub>o</sub> = √6V<sub>s</sub>√{(1/π)[5π/24 − α/4 + sin 2α/16 + √3 cos 2α/16]}', 'needs double gate pulses'], ['Power', 'P = 3V<sub>o</sub>²/R', 'V<sub>s</sub> = phase voltage']]],
    ['Choppers and DC–DC converters', ['buck', 'buck-lc', 'boost', 'buckboost'], [['Step-down (buck)', 'V<sub>o</sub> = DV<sub>s</sub>; V<sub>rms</sub> = √D V<sub>s</sub>; I<sub>o</sub> = (DV<sub>s</sub> − E)/R; I<sub>s</sub> = DI<sub>o</sub>', 'D = T<sub>on</sub>/T = T<sub>on</sub>f'],
      ['Buck current limits', 'I<sub>max</sub> = (V<sub>s</sub>/R)(1 − e<sup>−DT/τ</sup>)/(1 − e<sup>−T/τ</sup>) − E/R; I<sub>min</sub> = (V<sub>s</sub>/R)(e<sup>DT/τ</sup> − 1)/(e<sup>T/τ</sup> − 1) − E/R', 'τ = L/R'], ['Buck ripple', 'Δi = V<sub>s</sub>D(1 − D)/(fL), largest V<sub>s</sub>/(4fL) at D = ½', 'R ≪ fL'],
      ['Buck with L–C', 'ΔI<sub>L</sub> = V<sub>o</sub>(1 − D)/(fL); I<sub>peak</sub> = I<sub>o</sub> + ΔI<sub>L</sub>/2; ΔV<sub>o</sub> = ΔI<sub>L</sub>/(8fC); L<sub>min</sub> = (1 − D)R/(2f)', ''], ['Step-up (boost)', 'V<sub>o</sub> = V<sub>s</sub>/(1 − D); I<sub>L</sub> = I<sub>o</sub>/(1 − D); ΔI<sub>L</sub> = V<sub>s</sub>D/(fL); ΔV<sub>o</sub> = I<sub>o</sub>D/(fC); R<sub>in</sub> = R(1 − D)²', ''],
      ['Buck–boost and Ćuk', 'V<sub>o</sub> = −DV<sub>s</sub>/(1 − D); the switch blocks V<sub>s</sub> + |V<sub>o</sub>|', ''], ['Quadrant classes', 'A: +V +I (motoring); B: +V −I (regenerating, V<sub>o</sub> = (1 − D)V<sub>s</sub>); C: A + B; D: ±V +I, V<sub>o</sub> = (2D − 1)V<sub>s</sub>; E: all four', '']]],
    ['Inverters', ['inv-half', 'inv-full', 'inv-quasi', 'inv-spwm', 'inv-180', 'inv-120'], [['Half bridge, square', 'V<sub>o</sub> = V<sub>dc</sub>/2; V<sub>1</sub> = 2V<sub>dc</sub>/(π√2) = 0.45V<sub>dc</sub>; V<sub>n</sub> = V<sub>1</sub>/n', 'rms values'],
      ['Full bridge, square', 'V<sub>o</sub> = V<sub>dc</sub>; V<sub>1</sub> = 4V<sub>dc</sub>/(π√2) = 0.9V<sub>dc</sub>; v<sub>o</sub> = Σ (4V<sub>dc</sub>/nπ) sin nωt', 'THD 48.3 %'], ['Pure L load (square wave)', 'triangular current: full bridge I<sub>p</sub> = V<sub>dc</sub>T/(4L); half bridge V<sub>dc</sub>T/(8L)', ''],
      ['Single pulse, width 2d', 'V<sub>o</sub> = V<sub>dc</sub>√(2d/π); V<sub>n</sub> = (4V<sub>dc</sub>/nπ√2) sin nd', 'the n-th harmonic is zero when 2d = 360°/n'], ['Sinusoidal PWM', 'V<sub>1,peak</sub> = mV<sub>dc</sub> (full bridge), mV<sub>dc</sub>/2 (half bridge, 3-φ phase); m = V<sub>r</sub>/V<sub>c</sub> ≤ 1', 'm<sub>f</sub> = f<sub>c</sub>/f'],
      ['3-φ, 180°', 'V<sub>L</sub> = 0.816V<sub>dc</sub>; V<sub>ph</sub> = 0.471V<sub>dc</sub>; V<sub>L1</sub> = 0.78V<sub>dc</sub>; V<sub>ph1</sub> = 0.45V<sub>dc</sub>', 'three switches on; no triplen harmonics'], ['3-φ, 120°', 'V<sub>L</sub> = V<sub>dc</sub>/√2 = 0.707V<sub>dc</sub>; V<sub>ph</sub> = V<sub>dc</sub>/√6 = 0.408V<sub>dc</sub>; V<sub>L1</sub> = (3/π√2)V<sub>dc</sub> = 0.675V<sub>dc</sub>', 'two switches on'],
      ['Series resonant', 'ω<sub>r</sub> = √(1/LC − R²/4L²)', 'needs R² < 4L/C']]],
    ['Thyristor commutation', ['commut'], [['Voltage (impulse) commutation', 't<sub>c</sub> = CV<sub>s</sub>/I<sub>L</sub>; v<sub>o</sub> jumps to 2V<sub>s</sub>; interval 2CV<sub>s</sub>/I<sub>L</sub>', 'needs t<sub>c</sub> > t<sub>q</sub>'], ['Resonant (L–C) commutation', 'i = V<sub>s</sub>√(C/L) sin ω<sub>0</sub>t; ω<sub>0</sub> = 1/√(LC); half period π√(LC)', '']]]];
  function tabTable(B, A) {
    const U = A.U, seen = new Set(), book = U && U.subs ? U.subs.filter(s => s && s[1] && !seen.has(s[0]) && seen.add(s[0])) : [];
    B.innerHTML = `<section class="pehow"><h2>Every converter formula, as one tree</h2><p>Grouped converter by converter, load by load. These are the standard results (added for this atlas); where a live circuit exists, the same formula is checked against its simulated waveform on that page. Your Question Book's own sub-topic formulas follow at the end, exactly as written there.</p>
      <div class="acts"><button class="btn" data-ft="open">Expand all</button><button class="btn" data-ft="close">Collapse all</button></div></section>
      ${FT.map(([t, ids, rows], k) => `<details class="pesec"${k < 2 ? ' open' : ''}><summary>${t}<span>${rows.length}</span></summary>${ids.length ? `<p class="pelive">Live: ${ids.map(pageChip).join('')}</p>` : ''}<div class="pescroll"><table class="petab pecards"><thead><tr><th>Quantity</th><th>Formula</th><th>When</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td class="pefx" data-h="Formula">${r[1]}</td><td data-h="When">${r[2]}</td></tr>`).join('')}</tbody></table></div></details>`).join('')}
      <details class="pesec" id="pebook"><summary>From your Question Book's sub-topics (power electronics)<span>${book.length}</span></summary><p class="pg">As written in the book's sub-topic notes — device, triggering, loss and other formulas that have no circuit page here.</p><div class="pescroll"><table class="petab"><tbody>${book.map(s => `<tr><td>${esc(s[0])}</td><td class="pefx">${esc(s[1])}</td></tr>`).join('')}</tbody></table></div></details>`;
    B.onclick = e => { const b = e.target.closest('[data-ft]'); if (b) B.querySelectorAll('details').forEach(d => { d.open = b.dataset.ft === 'open'; }); };
  }

  // ---------- tab: waveform ↔ formula ----------
  // a small expression reader (the page may not use eval): numbers, t, pi, e, + − × ÷ ^, and the functions below
  const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, sqrt: Math.sqrt, exp: Math.exp, ln: Math.log, log: Math.log10, sgn: Math.sign, sign: Math.sign, step: x => x >= 0 ? 1 : 0, pos: x => Math.max(0, x),
    min: Math.min, max: Math.max, mod: (a, b) => ((a % b) + b) % b, floor: Math.floor, asin: Math.asin, acos: Math.acos, atan: Math.atan };
  function parseExpr(src) {
    const s = String(src).toLowerCase().replace(/ωt|wt|θ|theta/g, 't').replace(/π/g, 'pi').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/\s+/g, '');
    let i = 0; const eat = c => s[i] === c && ++i;
    const prim = () => {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i)); if (m) { i += m[0].length; const v = +m[0]; return () => v; }
      if (eat('(')) { const e = expr(); if (!eat(')')) throw Error('a “)” is missing'); return e; }
      const w = /^[a-z]+/.exec(s.slice(i)); if (!w) throw Error(`unexpected “${s[i] || 'end'}”`); i += w[0].length; const id = w[0];
      if (id === 't' || id === 'x') return t => t; if (id === 'pi') return () => PI; if (id === 'e') return () => Math.E;
      const f = FN[id]; if (!f) throw Error(`unknown name “${id}”`); if (!eat('(')) throw Error(`${id} needs brackets: ${id}( … )`);
      const args = [expr()]; while (eat(',')) args.push(expr()); if (!eat(')')) throw Error('a “)” is missing'); return t => f(...args.map(g => g(t)));
    };
    const pow = () => { const b = prim(); if (eat('^')) { const x = unary(); return t => Math.pow(b(t), x(t)); } return b; };
    const unary = () => { if (eat('-')) { const u = unary(); return t => -u(t); } if (eat('+')) return unary(); return pow(); };
    const term = () => { let a = unary(); for (;;) { if (eat('*')) { const l = a, r = unary(); a = t => l(t) * r(t); } else if (eat('/')) { const l = a, r = unary(); a = t => l(t) / r(t); } else if (i < s.length && /[\d.a-z(]/.test(s[i])) { const l = a, r = unary(); a = t => l(t) * r(t); } else return a; } };
    const expr = () => { let a = term(); for (;;) { if (eat('+')) { const l = a, r = term(); a = t => l(t) + r(t); } else if (eat('-')) { const l = a, r = term(); a = t => l(t) - r(t); } else return a; } };
    const e = expr(); if (i < s.length) throw Error(`unexpected “${s[i]}”`); return e;
  }
  const piStr = d => { const r = d / 180; for (let q = 1; q <= 12; q++) { const n = Math.round(r * q); if (Math.abs(r * q - n) < 1e-9) return n === 0 ? '0' : `${n === 1 ? '' : n}π${q === 1 ? '' : '/' + q}`; } return d + '°'; };
  // one period split into pieces: ['sin' | 'msin' | 'k', from°, to°, K]
  const PRESET = [['Half-wave, R (α)', a => ({ T: 360, pcs: [['sin', a, 180]] })], ['Semi-converter / full converter on R (α)', a => ({ T: 180, pcs: [['sin', a, 180]] })],
    ['Full converter, continuous current (α)', a => ({ T: 360, pcs: [['sin', a, 180 + a], ['msin', 180 + a, 360 + a]] })], ['3 SCRs + 1 diode bridge (α)', a => ({ T: 360, pcs: [['sin', a, 180], ['msin', 180 + a, 360 + a]] })],
    ['Diode bridge (full-wave)', () => ({ T: 180, pcs: [['sin', 0, 180]] })], ['AC controller output (α)', a => ({ T: 360, pcs: [['sin', a, 180], ['sin', 180 + a, 360]] })],
    ['Semi-converter supply current (α, I = V<sub>m</sub>)', a => ({ T: 360, pcs: [['k', a, 180, 1], ['k', 180 + a, 360, -1]] })], ['Full converter supply current (α)', a => ({ T: 360, pcs: [['k', a, 180 + a, 1], ['k', 180 + a, 360 + a, -1]] })],
    ['Square wave ±V', () => ({ T: 360, pcs: [['k', 0, 180, 1], ['k', 180, 360, -1]] })], ['Quasi-square, pulse 2d (d = 90° − α)', a => ({ T: 360, pcs: [['k', a, 180 - a, 1], ['k', 180 + a, 360 - a, -1]] })]];
  function pwCalc(st) {
    const V = st.Vm, T = st.T * D2R, I = { sin: (a, b) => Math.cos(a) - Math.cos(b), sin2: (a, b) => (b - a) / 2 - (Math.sin(2 * b) - Math.sin(2 * a)) / 4, sincos: (a, b) => (Math.sin(b) ** 2 - Math.sin(a) ** 2) / 2 };
    let A = 0, Q = 0, a1 = 0, b1 = 0;
    st.pcs.forEach(([sh, d1, d2, k]) => { const a = d1 * D2R, b = d2 * D2R, g = sh === 'k' ? k * V : sh === 'msin' ? -V : V;
      if (sh === 'k') { A += g * (b - a); Q += g * g * (b - a); a1 += g * (Math.sin(b) - Math.sin(a)); b1 += g * (Math.cos(a) - Math.cos(b)); }
      else { A += g * I.sin(a, b); Q += g * g * I.sin2(a, b); a1 += g * I.sincos(a, b); b1 += g * I.sin2(a, b); } });
    const avg = A / T, rms = sq(Q / T); a1 /= PI; b1 /= PI;
    const f = th => st.pcs.reduce((v, [sh, d1, d2, k]) => { for (const x of [th, th + st.T, th + 2 * st.T]) if (x >= d1 && x < d2) return v + (sh === 'k' ? k * V : (sh === 'msin' ? -V : V) * Math.sin(x * D2R)); return v; }, 0);
    return { avg, rms, a1, b1, c1: Math.hypot(a1, b1), f };
  }
  function pwHtml(st) {
    const R = pwCalc(st), V = st.Vm, Tn = st.T === 360 ? '2π' : 'π', n = 720, ys = [], xs = [];
    for (let k = 0; k < n; k++) { const th = (k + 0.5) * 720 / n; xs.push(th); ys.push(R.f(th % st.T)); }
    const one = [], N1 = 1440; for (let k = 0; k < N1; k++) one.push(R.f((k + 0.5) * st.T / N1));
    const mAvg = mean(one), mRms = rmsOf(one), pk = Math.max(...one.map(Math.abs));
    const shp = sh => sh === 'k' ? '' : sh === 'msin' ? '(−V<sub>m</sub> sin θ)' : 'V<sub>m</sub> sin θ', shk = (sh, k) => sh === 'k' ? `(${nf(k * V)})` : shp(sh);
    const term = ([sh, a, b, k], sqd) => `∫<sub>${piStr(a)}</sub><sup>${piStr(b)}</sup> ${sqd ? (sh === 'k' ? `(${nf(k * V)})²` : 'V<sub>m</sub>² sin²θ') : shk(sh, k)} dθ`;
    const val = ([sh, a, b, k]) => sh === 'k' ? `${nf(k * V)} × (${piStr(b)} − ${piStr(a)})` : `${sh === 'msin' ? '−' : ''}${nf(V)}(cos ${a}° − cos ${b}°)`;
    const pieceVal = ([sh, a, b, k]) => { const A = a * D2R, B = b * D2R; return sh === 'k' ? k * V * (B - A) : (sh === 'msin' ? -V : V) * (Math.cos(A) - Math.cos(B)); };
    const FF = R.avg ? R.rms / Math.abs(R.avg) : NaN, c1r = R.c1 / R2, thd = R.c1 ? sq(Math.max(0, R.rms ** 2 - R.avg ** 2 - c1r ** 2)) / c1r * 100 : NaN;
    return `${plot(xs, [{ n: 'the waveform you built (two periods of ' + Tn + ')', s: [{ ys, col: K.vo }], shade: ys, avg: R.avg, rms: R.rms, h: 120 }], { ticks: degTicks(720) })}
      <ol class="pesteps"><li><b>Pieces of one period (T = ${Tn}):</b> ${st.pcs.map(([sh, a, b, k]) => `${sh === 'k' ? nf(k * V) : sh === 'msin' ? '−V<sub>m</sub> sin θ' : 'V<sub>m</sub> sin θ'} from ${piStr(a)} to ${piStr(b)}`).join('; ')}; zero elsewhere.</li>
      <li><b>Average = area ÷ period:</b> V<sub>avg</sub> = (1/${Tn}) [ ${st.pcs.map(p => term(p)).join(' + ')} ]<br>= (1/${Tn}) [ ${st.pcs.map(val).join(' + ')} ]<br>= (1/${Tn}) × ${nf(st.pcs.reduce((s, p) => s + pieceVal(p), 0))} = <b>${nf(R.avg)}</b></li>
      <li><b>RMS = √(area of v² ÷ period):</b> V<sub>rms</sub> = √{ (1/${Tn}) [ ${st.pcs.map(p => term(p, true)).join(' + ')} ] } = <b>${nf(R.rms)}</b><br><small>use sin²θ = (1 − cos 2θ)/2 ⇒ ∫ sin²θ dθ = θ/2 − (sin 2θ)/4</small></li>
      ${st.T === 360 ? `<li><b>Fundamental (Fourier):</b> a<sub>1</sub> = (1/π)∫ v cos θ dθ = ${nf(R.a1)}, b<sub>1</sub> = (1/π)∫ v sin θ dθ = ${nf(R.b1)}<br>peak c<sub>1</sub> = √(a<sub>1</sub>² + b<sub>1</sub>²) = <b>${nf(R.c1)}</b>, rms = c<sub>1</sub>/√2 = <b>${nf(c1r)}</b>, phase φ<sub>1</sub> = tan<sup>−1</sup>(a<sub>1</sub>/b<sub>1</sub>) = ${nf(Math.atan2(R.a1, R.b1) / D2R)}°</li>` : '<li><b>Fundamental:</b> this wave repeats every π, so its lowest frequency is 2f (a dc output with ripple).</li>'}
      <li><b>Factors:</b> peak = ${nf(pk)}; form factor V<sub>rms</sub>/V<sub>avg</sub> = ${nf(FF)}${Number.isFinite(FF) && FF >= 1 ? `; ripple factor √(FF² − 1) = ${nf(sq(FF * FF - 1))}` : ''}; crest factor peak/rms = ${nf(pk / R.rms)}${st.T === 360 && Number.isFinite(thd) ? `; THD = ${nf(thd)} %; distortion factor I<sub>1</sub>/I<sub>rms</sub> = ${nf(c1r / R.rms)}` : ''}</li></ol>
      <p class="pechk ${near(mAvg, R.avg, V * 1e-3) && near(mRms, R.rms, V * 1e-3) ? 'ok' : 'no'}">Check against the drawing (${N1} points): average ${nf(mAvg)}, rms ${nf(mRms)} ${near(mAvg, R.avg, V * 1e-3) && near(mRms, R.rms, V * 1e-3) ? '✓ the integrals agree with the picture' : '≠'}</p>`;
  }
  const SHAPES = [['Sine', '100*sin(t)', '0 over a cycle; 2V<sub>m</sub>/π over a half cycle', 'V<sub>m</sub>/√2', 0, 100 / R2], ['Half-wave rectified sine', '100*sin(t)*step(sin(t))', 'V<sub>m</sub>/π', 'V<sub>m</sub>/2', 100 / PI, 50],
    ['Full-wave rectified sine', '100*abs(sin(t))', '2V<sub>m</sub>/π', 'V<sub>m</sub>/√2', 200 / PI, 100 / R2], ['Square ±V', '100*sgn(sin(t))', '0', 'V', 0, 100], ['Pulse 0/V, duty D = 0.3', '100*step(0.3-mod(t,2*pi)/(2*pi))', 'DV', '√D V', 30, 100 * sq(0.3)],
    ['Triangle 0 → V → 0', '100*(1-abs(mod(t,2*pi)/pi-1))', 'V/2', 'V/√3', 50, 100 / R3], ['Sawtooth 0 → V', '100*mod(t,2*pi)/(2*pi)', 'V/2', 'V/√3', 50, 100 / R3], ['Triangle ±V', '100*(1-2*abs(mod(t,2*pi)/pi-1))', '0', 'V/√3', 0, 100 / R3],
    ['Sine chopped at α = 60° in each half', '100*sin(t)*step(mod(t,pi)-pi/3)', '0', '(V<sub>m</sub>/√2)√[(π − α + ½ sin 2α)/π]', 0, 100 / R2 * sq((PI - PI / 3 + Math.sin(2 * PI / 3) / 2) / PI)], ['DC + ripple', '50+20*sin(t)', 'V<sub>0</sub>', '√(V<sub>0</sub>² + V<sub>r</sub>²/2)', 50, sq(2500 + 200)],
    ['SCR + pure L current, α = 0', '20.7/2*(1-cos(t))', '(V<sub>m</sub>/ωL) = I<sub>p</sub>/2', '√(3/2)·I<sub>p</sub>/2', 20.7 / 2, 20.7 / 2 * sq(1.5)]];
  const READ = [['V<sub>m</sub> sin ωt', 'starts at 0, peak V<sub>m</sub> at 90°, back to 0 at 180°, negative half to 360°'], ['V<sub>m</sub> cos ωt', 'the same wave starting at its peak (90° earlier)'], ['V<sub>m</sub> sin(ωt − φ)', 'moved right by φ: it lags; + φ moves it left (leads)'],
    ['−V<sub>m</sub> sin ωt', 'turned upside down'], ['|V<sub>m</sub> sin ωt|', 'negative halves folded up: full-wave rectified'], ['V<sub>m</sub> sin ωt for α ≤ ωt ≤ π, else 0', 'a sine that starts late at α: a controlled rectifier'],
    ['V<sub>0</sub> + V<sub>r</sub> sin ωt', 'a sine riding on a dc level V<sub>0</sub>'], ['V<sub>1</sub> sin ωt + V<sub>3</sub> sin 3ωt', 'a 3rd harmonic added: flatter (or peakier) top'], ['(V<sub>m</sub>/ωL)(cos α − cos ωt)', 'an upside-down cosine lifted up: 0 at α, peak at π (SCR + L current)'], ['e<sup>−t/τ</sup>', 'decays: 37 % after τ, nearly 0 after 5τ']];
  function measureExpr(fx) {
    const one = [], n = 1440; for (let k = 0; k < n; k++) one.push(fx((k + 0.5) * 2 * PI / n));
    if (one.some(v => !Number.isFinite(v))) throw Error('the formula is not finite everywhere (division by zero?)');
    const avg = mean(one), rms = rmsOf(one), V1 = fund(one) / R2; return { avg, rms, V1, pk: Math.max(...one.map(Math.abs)), pp: Math.max(...one) - Math.min(...one), thd: V1 > 1e-9 ? sq(Math.max(0, rms * rms - avg * avg - V1 * V1)) / V1 * 100 : NaN };
  }
  function tabLab(B) {
    const st = { Vm: 100, a: 60, pre: 3, ...PRESET[3][1](60) };
    B.innerHTML = `<section class="pehow"><h2>Waveform → formula, and formula → waveform</h2><p>Any average, rms or Fourier value is just an area. Build a waveform from pieces and watch every integral being written out with its own limits — then type any formula and see its waveform with avg, rms, peak and harmonics. This is the maths every converter formula comes from.</p></section>
      <section class="pefm"><h2 class="peh">1 · Read a waveform: write its integrals</h2><div class="vcctl"><div class="vcch"><span>Start from</span><div class="peps">${PRESET.map(([n], k) => `<button type="button" data-pre="${k}" aria-pressed="${k === st.pre}">${n}</button>`).join('')}</div></div>
        <label class="vcr"><span>α (or 90° − d) <b data-o="a">60°</b></span><input type="range" min="0" max="180" step="5" value="60" data-pa="a" aria-label="alpha"></label><label class="vcr"><span>Height V<sub>m</sub> <b data-o="Vm">100</b></span><input type="range" min="10" max="400" step="5" value="100" data-pa="Vm" aria-label="Vm"></label>
        <details class="pepcs"><summary>Edit the pieces yourself</summary><div class="pepl"></div><button class="btn" data-add>+ add a piece</button></details></div><div class="pewv"></div></section>
      <section class="pefm"><h2 class="peh">2 · Read a formula: draw it</h2><div class="vcctl"><label class="vcr"><span>v(t) = <small>use t for ωt (radians); sin cos abs sqrt exp sgn step(x) mod(a,b) min max, pi; e.g. 325*sin(t-pi/6)</small></span><input class="pein" type="text" value="325*sin(t)*step(sin(t))" spellcheck="false" autocomplete="off" aria-label="formula"></label>
        <div class="peps">${['325*sin(t)', '325*abs(sin(t))', '325*sin(t-pi/6)', '200*sgn(sin(t))', '150+50*sin(t)', '100*sin(t)+30*sin(3*t)', '20.7/2*(1-cos(t))'].map(x => `<button type="button" data-ex="${x}">${x}</button>`).join('')}</div></div><div class="pefv"></div>
        <details class="pesec"><summary>How to read a formula as a picture<span>${READ.length}</span></summary><div class="pescroll"><table class="petab"><tbody>${READ.map(r => `<tr><td class="pefx">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div></details></section>
      <section class="pefm"><h2 class="peh">3 · The shapes every formula is built from <small>average and rms you should know by heart</small></h2><div class="pescroll"><table class="petab"><thead><tr><th>Shape</th><th>Average</th><th>RMS</th><th>Check (V = 100)</th><th></th></tr></thead><tbody>${SHAPES.map((r, k) => { let m; try { m = measureExpr(parseExpr(r[1])); } catch (e) { m = { avg: NaN, rms: NaN }; }
        const ok = near(m.avg, r[4], 0.2) && near(m.rms, r[5], 0.2);
        return `<tr><td>${r[0]}</td><td class="pefx">${r[2]}</td><td class="pefx">${r[3]}</td><td>${nf(m.avg)} / ${nf(m.rms)} ${ok ? '<em class="ok">✓</em>' : '<em class="no">≠</em>'}</td><td><button class="btn sm" data-ex="${r[1]}">Draw</button></td></tr>`; }).join('')}</tbody></table></div>
        <p class="pg">Form factor = rms ÷ average; ripple factor = √(FF² − 1); crest factor = peak ÷ rms. A converter's V<sub>o</sub> is the average row of its output shape; its V<sub>rms</sub> the rms row.</p></section>`;
    const pl = $q('.pepl', B), wv = $q('.pewv', B), fv = $q('.pefv', B), inp = $q('.pein', B);
    const pieces = () => { pl.innerHTML = st.pcs.map(([sh, a, b, k], j) => `<div class="pepc" data-j="${j}"><select data-f="0" aria-label="shape">${[['sin', 'V<sub>m</sub> sin θ'], ['msin', '−V<sub>m</sub> sin θ'], ['k', 'constant k·V<sub>m</sub>']].map(([v, t]) => `<option value="${v}"${v === sh ? ' selected' : ''}>${plain(t)}</option>`).join('')}</select>
      <label>from <input type="number" step="5" value="${a}" data-f="1" aria-label="from (degrees)">°</label><label>to <input type="number" step="5" value="${b}" data-f="2" aria-label="to (degrees)">°</label>${sh === 'k' ? `<label>k <input type="number" step="0.1" value="${k}" data-f="3" aria-label="k"></label>` : ''}<button class="btn sm" data-del="${j}" aria-label="remove">×</button></div>`).join('')
      + `<label class="pept">period <select data-per aria-label="period"><option value="360"${st.T === 360 ? ' selected' : ''}>2π</option><option value="180"${st.T === 180 ? ' selected' : ''}>π</option></select></label>`; };
    const draw = () => { try { wv.innerHTML = pwHtml(st); } catch (e) { wv.innerHTML = `<p class="empty">${esc(e.message)}</p>`; } };
    const drawF = () => { try { const fx = parseExpr(inp.value), m = measureExpr(fx), xs = [], ys = []; for (let k = 0; k < 720; k++) { const th = (k + 0.5) * 720 / 720; xs.push(th); ys.push(fx(th * D2R)); }
        fv.innerHTML = `${plot(xs, [{ n: 'v(t) = ' + esc(inp.value), s: [{ ys, col: K.b }], avg: m.avg, rms: m.rms, shade: ys, h: 120 }], { ticks: degTicks(720) })}<div class="vcout"><div><span>Average (dc)</span><b>${nf(m.avg)}</b></div><div><span>RMS</span><b>${nf(m.rms)}</b></div><div><span>Peak · peak-to-peak</span><b>${nf(m.pk)} · ${nf(m.pp)}</b></div>
          <div><span>Form factor · crest factor</span><b>${Math.abs(m.avg) > 1e-9 ? nf(m.rms / Math.abs(m.avg)) : '— (average 0)'} · ${nf(m.pk / m.rms)}</b></div><div><span>Fundamental (rms) · THD</span><b>${nf(m.V1)} · ${Number.isFinite(m.thd) ? nf(m.thd) + ' %' : '—'}</b></div></div>`; }
      catch (e) { fv.innerHTML = `<p class="empty">${esc(e.message)}</p>`; } };
    const setPre = k => { st.pre = k; Object.assign(st, PRESET[k][1](st.a)); B.querySelectorAll('[data-pre]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.pre === k))); pieces(); draw(); };
    B.oninput = e => { const t = e.target;
      if (t.dataset.pa) { st[t.dataset.pa] = +t.value; $q(`[data-o="${t.dataset.pa}"]`, B).textContent = t.dataset.pa === 'a' ? t.value + '°' : t.value; if (t.dataset.pa === 'a' && st.pre >= 0) setPre(st.pre); else draw(); }
      else if (t.closest('.pepc') && t.dataset.f) { const j = +t.closest('.pepc').dataset.j, f = +t.dataset.f; st.pcs[j][f] = f ? +t.value : t.value; if (f === 0 && t.value === 'k' && st.pcs[j][3] == null) st.pcs[j][3] = 1; st.pre = -1; if (f === 0) pieces(); draw(); }
      else if (t.matches('[data-per]')) { st.T = +t.value; st.pre = -1; draw(); }
      else if (t === inp) drawF(); };
    B.onclick = e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.pre) setPre(+b.dataset.pre);
      else if (b.dataset.ex) { inp.value = b.dataset.ex; drawF(); if (b.closest('table')) inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      else if (b.dataset.del) { st.pcs.splice(+b.dataset.del, 1); st.pre = -1; pieces(); draw(); }
      else if ('add' in b.dataset) { if (st.pcs.length < 5) st.pcs.push(['sin', 0, 90]); st.pre = -1; pieces(); draw(); } };
    pieces(); draw(); drawF();
  }

  // ---------- tab: regenerative words ----------
  const WORDS = [['regenerative braking of a converter-fed dc motor', 'the motor runs as a generator; its energy goes back to the ac supply', 'motoring V<sub>o</sub> = E<sub>b</sub> + I<sub>a</sub>R<sub>a</sub> (α < 90°) → braking V<sub>o</sub> = −E<sub>b</sub> + I<sub>a</sub>R<sub>a</sub> with the armature (or field) reversed; (2V<sub>m</sub>/π) cos α < 0 ⇒ α > 90°', 'V<sub>o</sub> negative, I<sub>a</sub> still positive (an SCR converter cannot reverse current); P = V<sub>o</sub>I<sub>a</sub> < 0'],
    ['inversion · inverter mode · line-commutated inverter · power fed back to the ac mains', 'a full converter fired beyond 90° with a dc source of reversed polarity', 'V<sub>o</sub> = (2V<sub>m</sub>/π) cos α turns negative; current flows only if the dc source is larger: I<sub>o</sub> = (|E| − |V<sub>o</sub>|)/R', 'α can go up to 180° − μ − γ (margin for turn-off)'],
    ['semi-converter · freewheeling diode', 'the output can never go negative', 'V<sub>o</sub> = (V<sub>m</sub>/π)(1 + cos α) ≥ 0: no regeneration', 'one quadrant only'],
    ['regenerative braking by chopper · class B · step-up chopper for braking', 'the switch shorts the motor (current builds up), then the motor pushes current into the supply through the diode', 'motoring (class A) V<sub>o</sub> = DV<sub>s</sub>, E = DV<sub>s</sub> − I<sub>a</sub>R<sub>a</sub> → braking (class B) V<sub>o</sub> = (1 − D)V<sub>s</sub>, E = (1 − D)V<sub>s</sub> + I<sub>a</sub>R<sub>a</sub>', 'power returned P = (1 − D)V<sub>s</sub>I<sub>a</sub>; works for I<sub>a</sub>R<sub>a</sub> ≤ E ≤ V<sub>s</sub> + I<sub>a</sub>R<sub>a</sub>'],
    ['dynamic (rheostatic) braking', 'the energy is burnt in a resistor, not returned', 'I<sub>a</sub> = E/(R<sub>a</sub> + R<sub>B</sub>); with a chopper across R<sub>B</sub>: R<sub>eff</sub> = (1 − D)R<sub>B</sub>', 'nothing goes back to the supply'],
    ['plugging · reverse-current braking', 'the supply is reversed while the motor runs: supply and back emf add', 'I<sub>a</sub> = (V + E<sub>b</sub>)/(R<sub>a</sub> + R<sub>ext</sub>)', 'needs extra resistance; the quickest stop'],
    ['overhauling load · lowering a load · going downhill · speed above no-load speed', 'the load drives the machine: E<sub>b</sub> > V', 'motoring I<sub>a</sub> = (V − E<sub>b</sub>)/R<sub>a</sub> → generating I<sub>a</sub> = (E<sub>b</sub> − V)/R<sub>a</sub>', 'the current reverses by itself on a dc supply'],
    ['four-quadrant · dual converter · reverse motoring', 'both directions of voltage and current', 'two full converters back to back: α<sub>1</sub> + α<sub>2</sub> = 180°', 'Q1 forward motoring, Q2 forward braking, Q3 reverse motoring, Q4 reverse braking'],
    ['battery charging (not regeneration)', 'the converter drives current into a battery', 'I<sub>o</sub> = (V<sub>o</sub> − E)/R with E opposing the current', 'power into the battery P = EI<sub>o</sub>'],
    ['induction machine: supersynchronous · negative slip', 'the rotor turns faster than the field (s < 0)', 'motor P<sub>ag</sub> > 0 → generator s < 0, P<sub>ag</sub> < 0 (power returned)', 'regenerative braking of an induction motor']];
  function tabRegen(B, A) {
    const q95 = A.U && A.U.q ? A.U.q.find(q => /regenerative braking of a separately excited/i.test(clean(q.x)) && /full[- ]controlled/i.test(clean(q.x))) : null;
    B.innerHTML = `<section class="pehow"><h2>Words that flip a sign</h2><p>When a question says one of these words, one sign in the formula changes. Find the word, then use the right-hand formula.</p></section>
      <div class="pescroll"><table class="petab pecards"><thead><tr><th>Words in the question</th><th>What is happening</th><th>The formula changes</th><th>Signs</th></tr></thead><tbody>${WORDS.map(w => `<tr><td><b>${w[0]}</b></td><td data-h="What is happening">${w[1]}</td><td class="pefx" data-h="The formula changes">${w[2]}</td><td data-h="Signs">${w[3]}</td></tr>`).join('')}</tbody></table></div>
      <section class="pefm"><h2 class="peh">Quadrants of a converter (output voltage V, output current I)</h2><div class="pequad"><div><b>Q2</b>+V, −I<small>chopper class B: braking</small></div><div><b>Q1</b>+V, +I<small>rectifier, class A: motoring</small></div><div><b>Q3</b>−V, −I<small>reverse motoring (dual converter)</small></div><div><b>Q4</b>−V, +I<small>full converter α > 90°: inverting, regenerating</small></div></div><p class="pg">Semi-converter and diode bridge: Q1 only. Full converter: Q1 and Q4. Class C chopper: Q1 and Q2. Class D: Q1 and Q4. Dual converter, class E: all four.</p></section>
      <section class="pefm"><h2 class="peh">Calculator: dc motor on a full converter — motoring or regenerating</h2><div class="vcctl perc" data-calc="m">${[['Vs', 'Supply voltage (rms, line for 3-φ)', 240], ['Va', 'Rated armature voltage', 210], ['Ia', 'Rated armature current', 10], ['N', 'Rated speed (rpm)', 1200], ['Ra', 'Armature resistance (Ω)', 1], ['N2', 'Speed now (rpm)', 600], ['I2', 'Armature current now (A)', 10]].map(([k, n, v]) => `<label>${n}<input type="number" step="any" value="${v}" data-k="${k}"></label>`).join('')}
        <div class="vcch"><span>Converter</span><div><button type="button" data-cv="1" aria-pressed="true">1-φ full (0.9V<sub>s</sub> cos α)</button><button type="button" data-cv="3" aria-pressed="false">3-φ full (1.35V<sub>L</sub> cos α)</button></div></div>
        <div class="vcch"><span>Mode</span><div><button type="button" data-md="r" aria-pressed="true">Regenerative braking</button><button type="button" data-md="m" aria-pressed="false">Motoring</button></div></div></div><div class="pecalc" id="pecm"></div>
        ${q95 ? `<p class="pg">The defaults are the numbers of this past question: ${qLink(q95)}</p>` : ''}</section>
      <section class="pefm"><h2 class="peh">Calculator: regenerative braking with a chopper (class B)</h2><div class="vcctl perc" data-calc="c">${[['Vs', 'Supply V<sub>s</sub> (V)', 220], ['E', 'Motor emf E (V)', 120], ['Ia', 'Braking current I<sub>a</sub> (A)', 20], ['Ra', 'R<sub>a</sub> (Ω)', 0.5]].map(([k, n, v]) => `<label>${n}<input type="number" step="any" value="${v}" data-k="${k}"></label>`).join('')}</div><div class="pecalc" id="pecc"></div></section>
      <section class="pefm"><h2 class="peh">See it: the same converter motoring and regenerating</h2><div class="pe4" id="pemr"></div></section>`;
    const st = { cv: '1', md: 'r' };
    const calc = () => { const g = (box, k) => +$q(`[data-k="${k}"]`, box).value, m = $q('[data-calc="m"]', B), c = $q('[data-calc="c"]', B);
      const Vs = g(m, 'Vs'), Va = g(m, 'Va'), Ia = g(m, 'Ia'), N0 = g(m, 'N'), Ra = g(m, 'Ra'), N2 = g(m, 'N2'), I2 = g(m, 'I2'), Eb = Va - Ia * Ra, E2 = Eb * N2 / N0, Vo = st.md === 'r' ? -E2 + I2 * Ra : E2 + I2 * Ra, Vdo = st.cv === '1' ? 2 * R2 * Vs / PI : 3 * R2 * Vs / PI, cs = Vo / Vdo;
      $q('#pecm', B).innerHTML = `<ol class="pesteps"><li>Back emf at rated speed: E<sub>b</sub> = V<sub>a</sub> − I<sub>a</sub>R<sub>a</sub> = ${nf(Va)} − ${nf(Ia)} × ${nf(Ra)} = <b>${nf(Eb)} V</b> at ${nf(N0)} rpm</li><li>Field constant ⇒ E ∝ N: at ${nf(N2)} rpm, E = ${nf(Eb)} × ${nf(N2)}/${nf(N0)} = <b>${nf(E2)} V</b></li>
        <li>${st.md === 'r' ? 'Regenerating, armature reversed: V<sub>o</sub> = −E + I<sub>a</sub>R<sub>a</sub>' : 'Motoring: V<sub>o</sub> = E + I<sub>a</sub>R<sub>a</sub>'} = ${st.md === 'r' ? '−' : ''}${nf(E2)} + ${nf(I2)} × ${nf(Ra)} = <b>${nf(Vo)} V</b></li>
        <li>${st.cv === '1' ? '(2V<sub>m</sub>/π) cos α = 0.9V<sub>s</sub> cos α' : '(3V<sub>ml</sub>/π) cos α = 1.35V<sub>L</sub> cos α'} = V<sub>o</sub> ⇒ cos α = ${nf(Vo)}/${nf(Vdo)} = ${nf(cs)}${Math.abs(cs) <= 1 ? ` ⇒ <b>α = ${nf(Math.acos(cs) / D2R)}°</b>${cs < 0 ? ' (beyond 90°: inverting)' : ''}` : ' — impossible: the converter cannot give this much voltage'}</li>
        <li>Power: the converter's dc side P = V<sub>o</sub>I<sub>a</sub> = ${nf(Vo * I2)} W ${Vo * I2 < 0 ? `(negative: ${nf(-Vo * I2)} W goes back to the ac supply; the machine makes E·I = ${nf(E2 * I2)} W, ${nf(I2 * I2 * Ra)} W is lost in R<sub>a</sub>)` : '(taken from the supply)'}</li></ol>`;
      const cVs = g(c, 'Vs'), cE = g(c, 'E'), cI = g(c, 'Ia'), cR = g(c, 'Ra'), Vav = cE - cI * cR, D = 1 - Vav / cVs;
      $q('#pecc', B).innerHTML = `<ol class="pesteps"><li>Average voltage across the motor terminals: V<sub>o</sub> = E − I<sub>a</sub>R<sub>a</sub> = ${nf(cE)} − ${nf(cI)} × ${nf(cR)} = <b>${nf(Vav)} V</b></li><li>Class B: V<sub>o</sub> = (1 − D)V<sub>s</sub> ⇒ D = 1 − V<sub>o</sub>/V<sub>s</sub> = <b>${nf(D)}</b>${D < 0 || D > 1 ? ' — outside 0…1: braking is not possible at this emf' : ''}</li>
        <li>Power returned to the supply: P = V<sub>s</sub>I<sub>s</sub> = (1 − D)V<sub>s</sub>I<sub>a</sub> = <b>${nf((1 - D) * cVs * cI)} W</b></li><li>Braking works for I<sub>a</sub>R<sub>a</sub> ≤ E ≤ V<sub>s</sub> + I<sub>a</sub>R<sub>a</sub>: ${nf(cI * cR)} V … ${nf(cVs + cI * cR)} V</li></ol>`; };
    B.oninput = calc;
    B.onclick = e => { const b = e.target.closest('[data-cv],[data-md]'); if (!b) return; const k = b.dataset.cv ? 'cv' : 'md'; st[k] = b.dataset[k]; b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); calc(); };
    calc();
    const c = CV.find(x => x.id === 'full-converter');
    $q('#pemr', B).innerHTML = [[{ a: 45, ld: 'RLE', E: 120, L: 200, R: 2 }, 'Motoring: α = 45°, E = +120 V'], [{ a: 135, ld: 'RLE', E: -170, L: 200, R: 2 }, 'Regenerating: α = 135°, E = −170 V (reversed)']].map(([o, n]) => { const p = Object.assign(defaults(c), o), S = c.sim(p), vo = m1(S, 'vo'), io = m1(S, 'io'), P = mean(vo.map((v, k) => v * io[k]));
      return `<div class="pecmp"><div class="pecmh"><b>${n}</b><span class="pechip ${P < 0 ? 'neg' : 'th'}">V<sub>o</sub> = ${nf(mean(vo))} V · I<sub>o</sub> = ${nf(mean(io))} A · P = ${nf(P)} W</span></div>${mp(S.x, [sb('v', 'o'), S.vo, K.vo], [sb('i', 'o'), S.io, K.io])}</div>`; }).join('');
  }

  // ---------- tab: how past questions ask (inputs → output) ----------
  function tabAsked(B, A) {
    const U = A.U; if (!U || !U.q) { B.innerHTML = '<p class="empty">Past questions could not be loaded (offline?).</p>'; return; }
    const R = U.q.map(q => ({ q, ...askOf(q), pg: pagesFor(q, U) })), by = {}; R.forEach(r => { (by[r.ask] ||= []).push(r); });
    const order = [...ASK.map(x => x[0]), 'other'].filter(k => by[k]), nm = k => (ASK.find(x => x[0] === k) || [0, 'Other / statements'])[1];
    const pat = {}; R.forEach(r => { const k = (r.given.filter(g => g !== 'A figure / waveform').join(' + ') || 'words only') + ' → ' + nm(r.ask); pat[k] = (pat[k] || 0) + 1; });
    B.innerHTML = `<section class="pehow"><h2>What they give you, what they ask</h2><p>All ${R.length} power electronics questions in your book, each split into its <b>inputs</b> (what the question gives) and its <b>output</b> (what it asks for), sorted by the words of the question. Tap a question to open it with its answer.</p>
      <div class="pechips">${order.map(k => `<a href="#pea-${k}" class="pechip">${nm(k)} <b>${by[k].length}</b></a>`).join('')}</div></section>
      <details class="pesec"><summary>The most common patterns (inputs → output)<span>${Object.keys(pat).length}</span></summary><div class="pescroll"><table class="petab"><tbody>${Object.entries(pat).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, n]) => `<tr><td>${esc(k)}</td><td><b>${n}</b></td></tr>`).join('')}</tbody></table></div></details>
      ${order.map(k => `<details class="pesec" id="pea-${k}"><summary>${nm(k)}<span>${by[k].length}</span></summary><div class="peql">${by[k].map(r => `<div class="peqi">${qLink(r.q)}<p class="pegv"><b>Gives:</b> ${r.given.map(g => `<span>${g}</span>`).join('') || '—'}${r.pg.length ? ` <b>Circuit:</b> ${r.pg.map(pageChip).join('')}` : ''}</p></div>`).join('')}</div></details>`).join('')}`;
    B.onclick = e => { const a = e.target.closest('a[href^="#pea-"]'); if (!a) return; e.preventDefault(); const d = document.getElementById(a.getAttribute('href').slice(1)); if (d) { d.open = true; d.scrollIntoView({ block: 'start', behavior: 'smooth' }); } };
  }

  // ---------- tab: did every past question get its formula? ----------
  function tabCheck(B, A) {
    const U = A.U; if (!U || !U.q) { B.innerHTML = '<p class="empty">Past questions could not be loaded (offline?).</p>'; return; }
    const hasEq = q => Array.isArray(q.cf) && /[=≈∝]/.test([].concat(q.cf[1] || []).join(' '));
    const R = U.q.map(q => { const pg = pagesFor(q, U), live = pg.filter(x => CV.some(c => c.id === x)), tabs = pg.filter(x => x[0] === '@' && x !== '@theory');
      return { q, pg, st: live.length ? 'live' : tabs.length ? 'sheet' : pg.includes('@theory') || /latching|holding|which (one|of)|true|false|statement|device|characteristic/i.test(stemOf(q)) ? 'theory' : 'none', eq: hasEq(q) }; });
    const cnt = k => R.filter(r => r.st === k).length, noEq = R.filter(r => !r.eq);
    const grp = {}; R.forEach(r => { (grp[subOf(U, r.q) || '—'] ||= []).push(r); });
    const lab = { live: ['has a live circuit page', 'ok'], sheet: ['formula on a tab (lab, regenerative, book list)', 'ok'], theory: ['theory / device — no formula needed', 'th'], none: ['not matched to a page', 'no'] };
    B.innerHTML = `<section class="pehow"><h2>Did every past question get its formula?</h2><p>Each of the ${R.length} power electronics questions in your book, matched (by its sub-topic and its words) to the page here that has its formula.</p>
      <div class="pekpi">${['live', 'sheet', 'theory', 'none'].map(k => `<div class="${lab[k][1]}"><b>${cnt(k)}</b><span>${lab[k][0]}</span></div>`).join('')}</div>
      <p class="pg">${noEq.length} of these questions had a note with no equation in it (the gaps you saw). Each is listed below with the page that now holds its formula.</p></section>
      ${cnt('none') ? `<details class="pesec" open><summary>Not matched yet<span>${cnt('none')}</span></summary><div class="peql">${R.filter(r => r.st === 'none').map(r => `<div class="peqi">${qLink(r.q)}</div>`).join('')}</div></details>` : ''}
      <details class="pesec"><summary>Questions whose note had no equation<span>${noEq.length}</span></summary><div class="peql">${noEq.map(r => `<div class="peqi">${qLink(r.q)}<p class="pegv"><b>Formula now in:</b> ${r.pg.map(pageChip).join('') || '<span class="pechip th">theory</span>'}</p></div>`).join('')}</div></details>
      <h2 class="vgh">By sub-topic</h2>${Object.entries(grp).sort((a, b) => b[1].length - a[1].length).map(([s, L]) => `<details class="pesec"><summary>${esc(s)}<span>${L.length}</span></summary><p class="pelive">${[...new Set(L.flatMap(r => r.pg))].map(pageChip).join('') || '<span class="pechip th">theory</span>'}</p><div class="peql">${L.map(r => `<div class="peqi">${qLink(r.q)}<p class="pegv"><span class="pest ${lab[r.st][1]}">${lab[r.st][0]}</span>${r.pg.map(pageChip).join('')}</p></div>`).join('')}</div></details>`).join('')}`;
  }

  function page(box, tab, A = {}) {
    tab = TABS.some(t => t[0] === tab) ? tab : 'atlas';
    const j = TABS.findIndex(t => t[0] === tab), pv = TABS[j - 1], nx = TABS[j + 1];
    box.innerHTML = `<nav class="petabs" aria-label="Atlas sections">${TABS.map(([k, n]) => `<a href="${tabHref(k)}"${k === tab ? ' aria-current="page"' : ''}>${n}</a>`).join('')}</nav><div class="pebody"></div>
      <div class="vcnav">${pv ? `<a class="btn" href="${tabHref(pv[0])}" data-sw="prev" data-n="${pv[1]}">← ${pv[1]}</a>` : '<span></span>'}${nx ? `<a class="btn go" href="${tabHref(nx[0])}" data-sw="next" data-n="${nx[1]}">${nx[1]} →</a>` : '<span></span>'}</div>`;
    const cur = box.querySelector('[aria-current]'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    ({ atlas: tabAtlas, compare: tabCompare, table: tabTable, lab: tabLab, regen: tabRegen, asked: tabAsked, check: tabCheck })[tab](box.querySelector('.pebody'), A);
  }
  W.PE = {
    list: CV, plot, degTicks, mean, rmsOf, fund, nf, page, askedFor, tabs: TABS, parseExpr, pagesFor, askOf,
    run(c, p) { const S = c.sim(p); return { S, rows: c.rows(p, S) }; },
    thumb(c, p) { p = Object.assign(defaults(c), p || {}); const S = c.sim(p); return { S, svg: wavesOf(c, p, S) }; },
    mount(box, id, A = {}) {
      const c = CV.find(x => x.id === id); if (!c) { box.innerHTML = '<p class="empty">Not found.</p>'; return; }
      const p = defaults(c);
      const ctl = () => c.P.map(x => { const vis = shows(p, x[0]) ? '' : ' hidden';
        return isCh(x) ? `<div class="vcch"${vis} data-row="${x[0]}"><span>${x[1]}</span><div>${x[4].map(([v, t]) => `<button type="button" data-ch="${x[0]}" data-v="${esc(v)}" aria-pressed="${String(v) === String(p[x[0]])}">${t}</button>`).join('')}</div></div>`
          : `<label class="vcr"${vis} data-row="${x[0]}"><span>${x[1]} <b data-o="${x[0]}">${nf(p[x[0]])} ${x[2]}</b></span><input type="range" min="${x[4]}" max="${x[5]}" step="${x[6]}" value="${p[x[0]]}" data-k="${x[0]}" aria-label="${esc(x[1].replace(/<[^>]+>/g, ''))}"></label>`; }).join('');
      box.innerHTML = `<article class="pe1"><header class="vch"><span class="vck">${esc(c.g)}</span><h1>${c.n}</h1><p>${c.sub}</p></header>
        <div class="vcfig"><h2 class="peh">Circuit</h2><div class="pecx"></div></div><div class="vcctl">${ctl()}</div>
        <div class="vcfig"><h2 class="peh">Waveforms <small>two cycles · dashed: average (green), rms (amber)</small></h2><div class="pewx"></div></div>
        <section class="pefm"><h2 class="peh">Who conducts when <small>one cycle, from the simulation</small></h2><div class="pesx"></div></section>
        <section class="pefm"><h2 class="peh">Formulas — checked against the waveform above</h2><div class="perx"></div></section>
        ${A.asked ? `<section class="pefm"><h2 class="peh">How past papers ask about it</h2>${A.asked(c)}</section>` : ''}</article>`;
      const paint = () => { let S, rows; try { S = c.sim(p); rows = c.rows(p, S); } catch (e) { box.querySelector('.pewx').innerHTML = `<p class="empty">${esc(e.message)}</p>`; return; }
        box.querySelector('.pecx').innerHTML = c.ckt(p); box.querySelector('.pewx').innerHTML = wavesOf(c, p, S); box.querySelector('.perx').innerHTML = rowsHtml(rows); box.querySelector('.pesx').innerHTML = seqHtml(c, S) || '<p class="pg">—</p>';
        c.P.forEach(x => { const r = box.querySelector(`[data-row="${x[0]}"]`); if (r) r.hidden = !shows(p, x[0]); const b = box.querySelector(`[data-o="${x[0]}"]`); if (b) b.textContent = `${nf(p[x[0]])} ${x[2].replace(/<[^>]+>/g, '')}`; }); };
      let tm = null;
      box.oninput = e => { const k = e.target.dataset.k; if (!k) return; p[k] = +e.target.value; const b = box.querySelector(`[data-o="${k}"]`); if (b) b.textContent = nf(p[k]); clearTimeout(tm); tm = setTimeout(paint, 60); };
      box.onclick = e => { const b = e.target.closest('[data-ch]'); if (!b) return; p[b.dataset.ch] = b.dataset.v; box.querySelectorAll(`[data-ch="${b.dataset.ch}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b))); paint(); };
      paint();
    }
  };
})();
