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
