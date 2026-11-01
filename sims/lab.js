/* ⚡ Electrical Simulation Laboratory: the engine and the experiment workspace. This file is loaded only when an
   experiment opens. The dashboard is in app.js. The experiments are plain data, registered by sims/lx1.js and sims/lx2.js:
     LX.x(id, {
       m: 'Ideal model' | 'Approximate model' | …   what kind of model it is, printed on the page
       as: ['assumption', …]
       i: [[key, label, unit, default, min, max, step, {k, log, w}]]   a number: k = factor to SI (mH → 1e-3), w = v => shown?
          [key, label, '', default, [[value, text], …], {w}]          a choice
       o: [[key, label, unit, v => value in SI, digits, k]]           outputs in order (later ones may use earlier ones)
       me: [keys]                       the big measurement cards (default: the first four outputs)
       st: v => [['ok'|'warn'|'bad', text], …]                        operating status
       steps: (v, f) => [[what, formula, substitution, value, unit]]   f(x) formats a number
       der: ['derivation line', …]   int: v => 'what the numbers mean'
       g: [{x: inputKey, y: [outputKeys], n}] | [{n, xl, yl, f: v => ({xs, ser: [{n, ys}], mark})}] | [{n, yl, bar: v => [[label, value]]}]
       fig: (v, t, G) => svg            live: true when the drawing moves with time t; slow: how much it is slowed
       cn: {w, y, s: [], v, a, mk: [], sc: [], ta}
       rel: [[inputKey, outputKey, 'why']]                             "if X rises, what happens to Y?" (answered by the model)
       num: [{a: outputKey, g: [inputKeys], mk: [['the slip', v => wrong SI value]], n: {key: [values]}, d: {fixed}, lv}]
       cmp: [{n, a: {…}, b: {…}}]   pre: [{n, d: {…}}]               compare and control-panel presets (display units)
       ck: [[{inputs}, {output: expected SI value}, 'source', tolerance]]   known worked examples: the unit tests
     })
   Every number on the page comes from the model: graphs sweep the model, questions are answered by the model. */
(() => {
  'use strict';
  const W = typeof window !== 'undefined' ? window : globalThis;
  const LX = W.LX = W.LX || {};
  LX.X = LX.X || {};
  LX.x = (id, s) => { LX.X[id] = s; };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isCh = s => Array.isArray(s[4]);
  const opt = s => (isCh(s) ? s[5] : s[7]) || {};
  const kOf = s => opt(s).k || 1;
  // 4 significant figures, Indian grouping, × 10ⁿ outside 0.001 … 10⁷
  function fx(x, dg) {
    if (typeof x === 'string') return esc(x);
    if (typeof x === 'boolean') return x ? 'yes' : 'no';
    if (x == null || !Number.isFinite(x)) return '–';
    if (dg != null) return x.toLocaleString('en-IN', { minimumFractionDigits: dg, maximumFractionDigits: dg });
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e7 || a < 1e-3)) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${+m.toFixed(3)} × 10<sup>${e}</sup>`; }
    return (+x.toPrecision(4)).toLocaleString('en-IN', { maximumFractionDigits: 6 });
  }
  const fp = x => !Number.isFinite(x) ? '–' : Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(2).replace('e+', 'e') : String(+x.toPrecision(4));
  LX.fx = fx; LX.fp = fp;

  /* ---------- the model: SI values in, outputs computed in order ---------- */
  const defaults = S => Object.fromEntries(S.i.map(s => [s[0], s[3]]));
  function run(S, d) {
    const v = {};
    S.i.forEach(s => { const x = d && s[0] in d ? d[s[0]] : s[3]; v[s[0]] = isCh(s) ? x : x * kOf(s); });
    S.o.forEach(s => { let y; try { y = s[3](v); } catch (e) { y = NaN; } v[s[0]] = y; });
    return v;
  }
  const clamp = (s, x) => { x = typeof x === 'string' ? parseFloat(x.replace(/,/g, '').replace(/−/g, '-')) : +x; return !Number.isFinite(x) ? s[3] : Math.min(s[5], Math.max(s[4], x)); };
  const shown = (S, s, v) => !opt(s).w || opt(s).w(v);
  const outOf = (S, k) => S.o.find(s => s[0] === k);
  const inOf = (S, k) => S.i.find(s => s[0] === k);
  // a value in display units: an output divided by its k, an input as typed
  const disp = (S, k, v) => { const o = outOf(S, k); if (o) { const y = v[k]; return typeof y === 'number' ? y / (o[5] || 1) : y; } const s = inOf(S, k); return s ? (isCh(s) ? v[k] : v[k] / kOf(s)) : NaN; };
  const unitOf = (S, k) => (outOf(S, k) || inOf(S, k) || [])[2] || '';
  const labelOf = (S, k) => (outOf(S, k) || inOf(S, k) || [])[1] || k;
  const chText = (s, x) => (s[4].find(c => c[0] === x) || [x, x])[1];
  LX.run = run; LX.defaults = defaults; LX.disp = disp;

  /* ---------- complex numbers (phasors, impedances, ABCD constants) and a linear solver (nodal / mesh equations) ---------- */
  const C = LX.C = {
    c: (re, im = 0) => ({ re, im }),
    pol: (m, deg) => ({ re: m * Math.cos(deg * Math.PI / 180), im: m * Math.sin(deg * Math.PI / 180) }),
    add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
    sub: (a, b) => ({ re: a.re - b.re, im: a.im - b.im }),
    mul: (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }),
    div: (a, b) => { const d = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; },
    sc: (a, k) => ({ re: a.re * k, im: a.im * k }),
    abs: a => Math.hypot(a.re, a.im),
    arg: a => Math.atan2(a.im, a.re) * 180 / Math.PI,
    sqrt: a => { const m = Math.sqrt(Math.hypot(a.re, a.im)), t = Math.atan2(a.im, a.re) / 2; return { re: m * Math.cos(t), im: m * Math.sin(t) }; },
    exp: a => { const e = Math.exp(a.re); return { re: e * Math.cos(a.im), im: e * Math.sin(a.im) }; },
  };
  C.inv = a => C.div(C.c(1), a);
  C.par = (a, b) => C.div(C.mul(a, b), C.add(a, b));
  C.cosh = a => C.sc(C.add(C.exp(a), C.exp(C.sc(a, -1))), 0.5);
  C.sinh = a => C.sc(C.sub(C.exp(a), C.exp(C.sc(a, -1))), 0.5);
  LX.solve = (A, b) => {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-15) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  };
  const rng = (a, b, n, lg) => Array.from({ length: n }, (_, j) => lg ? a * (b / a) ** (j / (n - 1)) : a + (b - a) * j / (n - 1));
  LX.range = rng;

  /* ---------- graphs: sweep one input of the model, everything else held ---------- */
  function sweep(S, d, xk, yks, n = 61) {
    const s = inOf(S, xk), lg = !!opt(s).log && s[4] > 0;
    const xs = rng(s[4], s[5], n, lg);
    const ser = yks.map(k => ({ n: labelOf(S, k), ys: xs.map(x => { const y = disp(S, k, run(S, { ...d, [xk]: x })); return typeof y === 'number' ? y : NaN; }) }));
    const v = run(S, d);
    return { xs, ser, xl: `${s[1]}${s[2] ? ` (${s[2]})` : ''}`, yl: yks.length === 1 ? `${labelOf(S, yks[0])}${unitOf(S, yks[0]) ? ` (${unitOf(S, yks[0])})` : ''}` : (unitOf(S, yks[0]) || ''), logx: lg, mark: [d[xk], yks.map(k => disp(S, k, v))] };
  }
  function graphData(S, g, d) {
    if (g.f) { const r = g.f(run(S, d), d); return { xl: g.xl, yl: g.yl, ...r }; }
    const r = sweep(S, d, g.x, g.y); if (g.vl) { try { r.vl = g.vl(run(S, d)); } catch (e) {} } return r;
  }
  LX.sweep = sweep; LX.graphData = graphData;

  /* ---------- exam questions, all answered by the model ---------- */
  const OPT4 = ['Increases', 'Decreases', 'Remains the same', 'Becomes zero'];
  const roundStep = (s, x) => { const st = s[6] || 0; return st ? Math.round(x / st) * st : +x.toPrecision(3); };
  function relQ(S, d, r) {
    const [xk, yk] = r, s = inOf(S, xk), v0 = run(S, d);
    const x0 = d[xk];
    let x1 = x0 > 0 ? roundStep(s, x0 * 1.25) : roundStep(s, (s[4] + s[5]) / 2), up = true;
    if (x1 > s[5] || x1 === x0) { x1 = roundStep(s, x0 * 0.75); up = false; }
    if (x1 < s[4]) x1 = s[4];
    const v1 = run(S, { ...d, [xk]: x1 }), y0 = disp(S, yk, v0), y1 = disp(S, yk, v1), u = unitOf(S, yk), xu = s[2] ? ' ' + s[2] : '';
    const ch = Math.abs(y0) > 1e-12 ? (y1 - y0) / Math.abs(y0) : y1 - y0;
    let why = r[2]; if (typeof why === 'function') { try { why = why(v0, v1); } catch (e) { why = ''; } }
    const ans = Math.abs(y1) < 1e-9 && Math.abs(y0) > 1e-9 ? 3 : ch > 0.005 ? 0 : ch < -0.005 ? 1 : 2;
    const yl = labelOf(S, yk), xl = s[1];
    const nums = `${yl}: ${fx(y0)} → ${fx(y1)}${u ? ' ' + esc(u) : ''}${ans < 2 ? ` (${ch > 0 ? '+' : ''}${fx(ch * 100, 1)} %)` : ''}`;
    const whyNot = [
      `It does not increase: with these numbers ${nums}.`,
      `It does not decrease: with these numbers ${nums}.`,
      `It does not stay the same: with these numbers ${nums}.`,
      `It does not become zero: ${esc(yl)} is ${fx(y1)}${u ? ' ' + esc(u) : ''} after the change.`,
    ];
    return {
      kind: 'rel', key: `r:${xk}>${yk}`, lv: 1, lab: `${xl} → ${yl}`,
      q: `${esc(xl)} is ${up ? 'increased' : 'reduced'} from ${fx(x0)}${esc(xu)} to ${fx(x1)}${esc(xu)}, with everything else unchanged. What happens to <b>${esc(yl)}</b>?`,
      opts: OPT4.map((h, j) => ({ h, ok: j === ans, why: j === ans ? `✓ ${why}` : whyNot[j] })),
      exp: `<p>${why}</p><p class="lxnum">${nums}</p>`, yk, xk,
    };
  }
  // a nice exam value: from the experiment's list, or a round number inside the slider's range
  const niceIn = (s, rnd) => { const lg = opt(s).log && s[4] > 0, x = lg ? s[4] * (s[5] / s[4]) ** rnd() : s[4] + (s[5] - s[4]) * rnd(); const p = 10 ** (Math.floor(Math.log10(Math.abs(x) || 1)) - 1); return Math.min(s[5], Math.max(s[4], roundStep(s, Math.round(x / p) * p))); };
  function numQ(S, nq, rnd = Math.random, base) {
    const d = { ...defaults(S), ...(base || {}), ...(nq.d || {}) };
    for (let tries = 0; tries < 12; tries++) {
      nq.g.forEach(k => { const s = inOf(S, k); if (!s || isCh(s)) return; const L = nq.n && nq.n[k]; d[k] = L ? L[Math.floor(rnd() * L.length)] : niceIn(s, rnd); });
      const v = run(S, d), y = disp(S, nq.a, v);
      if (!Number.isFinite(y) || Math.abs(y) < 1e-12) continue;
      const o = outOf(S, nq.a), u = o[2], k = o[5] || 1;
      const cand = [{ y, ok: true, why: '✓ This follows from the formula with the given numbers.' }];
      const far = z => Number.isFinite(z) && cand.every(c => Math.abs(z - c.y) > Math.max(Math.abs(c.y), Math.abs(z)) * 0.03);
      (nq.mk || []).forEach(([lab, fn]) => { let z; try { z = fn(v) / k; } catch (e) { z = NaN; } if (cand.length < 4 && far(z)) cand.push({ y: z, why: `✗ This is what you get if you ${lab}.` }); });
      for (const [f, t] of [[2, 'twice the right value: a factor of 2 has slipped in'], [0.5, 'half the right value: a factor of 2 is missing'], [Math.SQRT2, '√2 times too large: an rms / peak slip'], [1 / Math.sqrt(3), '1/√3 of the right value: a line / phase slip'], [10, 'ten times too large: check the units and the powers of ten']])
        if (cand.length < 4 && far(y * f)) cand.push({ y: y * f, why: `✗ This is ${t}.` });
      if (cand.length < 4) continue;
      const order = cand.map((c, j) => [rnd(), j]).sort((a, b) => a[0] - b[0]).map(x => cand[x[1]]);
      const given = nq.g.map(k => { const s = inOf(S, k); return `${esc(s[1])} = ${isCh(s) ? esc(chText(s, d[k])) : fx(d[k]) + (s[2] ? ' ' + esc(s[2]) : '')}`; }).join(', ');
      const fixed = Object.keys(nq.d || {}).filter(k => !nq.g.includes(k)).map(k => { const s = inOf(S, k); return s ? `${esc(s[1])}: ${isCh(s) ? esc(chText(s, d[k])) : fx(d[k]) + ' ' + esc(s[2])}` : ''; }).filter(Boolean).join(', ');
      return {
        kind: 'num', key: `n:${nq.a}`, lv: nq.lv || 2, d: { ...d }, yk: nq.a, lab: `numerical: ${o[1]}`,
        q: `${nq.q ? nq.q + ' ' : ''}${fixed ? `(${fixed}.) ` : ''}Given ${given}. Find <b>${esc(o[1])}</b>${u ? ` in ${esc(u)}` : ''}.`,
        opts: order.map(c => ({ h: `${fx(c.y)}${u ? ' ' + esc(u) : ''}`, ok: !!c.ok, why: c.why })),
        exp: stepsHtml(S, v),
      };
    }
    return null;
  }
  // advanced: two conditions from the compare presets; the ratio of an output between them
  function cmpQ(S, c, yk) {
    const vA = run(S, { ...defaults(S), ...c.a }), vB = run(S, { ...defaults(S), ...c.b }), a = disp(S, yk, vA), b = disp(S, yk, vB);
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) < 1e-12) return null;
    const r = b / a, cand = [{ y: r, ok: true, why: '✓ Work out the output for both conditions, then divide B by A.' }];
    const far = z => Number.isFinite(z) && cand.every(q => Math.abs(z - q.y) > Math.max(Math.abs(q.y), Math.abs(z)) * 0.03);
    for (const [z, t] of [[1 / r, '✗ This is A ÷ B: the ratio upside down.'], [1, '✗ The output does change between the two conditions.'], [r * r, '✗ This squares the ratio: the output is not proportional to the square here.'], [Math.sqrt(Math.abs(r)), '✗ This is the square root of the ratio.'], [r * 2, '✗ Twice the ratio: a factor of 2 has slipped in.']])
      if (cand.length < 4 && far(z)) cand.push({ y: z, why: t });
    if (cand.length < 4) return null;
    const diff = S.i.filter(s => c.a[s[0]] !== undefined && c.b[s[0]] !== undefined && c.a[s[0]] !== c.b[s[0]]);
    const same = S.i.filter(s => c.a[s[0]] !== undefined && c.a[s[0]] === c.b[s[0]]);
    const show = (s, x) => isCh(s) ? esc(chText(s, x)) : `${fx(x)}${s[2] ? ' ' + esc(s[2]) : ''}`;
    return {
      kind: 'cmp', key: `c:${yk}`, lv: 3, yk, lab: `comparing two conditions: ${labelOf(S, yk)}`,
      q: `${esc(c.n)}. Condition A: ${diff.map(s => `${esc(s[1])} = ${show(s, c.a[s[0]])}`).join(', ')}. Condition B: ${diff.map(s => `${esc(s[1])} = ${show(s, c.b[s[0]])}`).join(', ')}.${same.length ? ` Unchanged: ${same.map(s => `${esc(s[1])} = ${show(s, c.a[s[0]])}`).join(', ')}.` : ''} What is the ratio <b>${esc(labelOf(S, yk))}: B ÷ A</b>?`,
      opts: cand.sort(() => 0).map(q => q).sort((x, y) => x.y - y.y).map(q => ({ h: fx(q.y), ok: !!q.ok, why: q.why })),
      exp: `<p class="lxnum">A: ${fx(a)} ${esc(unitOf(S, yk))} · B: ${fx(b)} ${esc(unitOf(S, yk))} · B ÷ A = ${fx(r)}</p>${whyHtml(S, vA, vB)}`,
    };
  }
  LX.relQ = relQ; LX.numQ = numQ; LX.cmpQ = cmpQ;

  /* ---------- calculations ---------- */
  function stepsOf(S, v) { try { return S.steps ? S.steps(v, fx) : []; } catch (e) { return []; } }
  function stepsHtml(S, v) {
    const st = stepsOf(S, v);
    return st.length ? `<ol class="lxsteps">${st.map(([w, f, sub, val, u]) => `<li><b>${w}</b><span class="lxf">${f}</span>${sub ? `<span class="lxs">= ${sub}</span>` : ''}<span class="lxr">= <b>${typeof val === 'number' ? fx(val) : val}</b>${u ? ' ' + esc(u) : ''}</span></li>`).join('')}</ol>` : '';
  }
  // why an output changed: the same step worked for A and for B
  function whyHtml(S, vA, vB) {
    const a = stepsOf(S, vA), b = stepsOf(S, vB), rows = [];
    a.forEach((s, j) => { const t = b[j]; if (!t || typeof s[3] !== 'number' || typeof t[3] !== 'number') return; const ch = Math.abs(s[3]) > 1e-12 ? (t[3] - s[3]) / Math.abs(s[3]) : t[3] - s[3]; if (Math.abs(ch) < 0.002) return;
      rows.push(`<li><b>${s[0]}</b> <span class="lxf">${s[1]}</span><span class="lxs">A: ${s[2] || ''} = <b>${fx(s[3])}</b> ${esc(s[4] || '')}</span><span class="lxs">B: ${t[2] || ''} = <b>${fx(t[3])}</b> ${esc(t[4] || '')}</span></li>`); });
    return rows.length ? `<ol class="lxsteps lxwhy">${rows.join('')}</ol>` : '<p class="lxmuted">No step of the calculation changes between A and B.</p>';
  }

  /* ---------- charts: thin lines, one y axis, a legend for two or more series, hover read-out, a table view ---------- */
  const PAL = ['var(--ring1)', 'var(--ring2)', 'var(--ring3)', 'var(--ring4)'];
  const CH = new Map(); let chN = 0;
  function ticks(a, b, n = 5) {
    if (!(b > a)) { b = a + 1; }
    const raw = (b - a) / n, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p, st = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
    const out = []; for (let x = Math.ceil(a / st) * st; x <= b + st * 1e-9; x += st) out.push(+x.toPrecision(12)); return out;
  }
  function chart(o) {
    const id = 'lxc' + (++chN); CH.set(id, o); if (CH.size > 30) CH.delete(CH.keys().next().value);
    const Wd = 640, Ht = 300, L = 62, R = 18, Tp = 16, B = 46;
    const all = o.ser.flatMap(s => s.ys).filter(Number.isFinite);
    if (!all.length) return `<div class="lxempty">No values to plot here: the model has no valid result over this range.</div>`;
    let y0 = Math.min(0, ...all), y1 = Math.max(...all); if (o.y0 != null) y0 = o.y0; if (o.y1 != null) y1 = o.y1;
    if (y1 - y0 < 1e-12) { y1 = y0 + (Math.abs(y0) || 1); }
    const yt = ticks(y0, y1); y0 = Math.min(y0, yt[0]); y1 = Math.max(y1, yt[yt.length - 1]);
    const lg = o.logx && o.xs[0] > 0, xa = lg ? Math.log10(o.xs[0]) : o.xs[0], xb = lg ? Math.log10(o.xs[o.xs.length - 1]) : o.xs[o.xs.length - 1];
    const X = x => L + (Wd - L - R) * ((lg ? Math.log10(x) : x) - xa) / ((xb - xa) || 1), Y = y => Tp + (Ht - Tp - B) * (1 - (y - y0) / (y1 - y0));
    o._m = { X, Y, L, R, Tp, B, Wd, Ht };
    const xt = lg ? rng(o.xs[0], o.xs[o.xs.length - 1], 5, true) : ticks(o.xs[0], o.xs[o.xs.length - 1], 6);
    let g = yt.map(t => `<line x1="${L}" x2="${Wd - R}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="lxgr"/><text x="${L - 8}" y="${(Y(t) + 4).toFixed(1)}" text-anchor="end" class="lxax">${fp(t)}</text>`).join('');
    g += xt.map(t => `<text x="${X(t).toFixed(1)}" y="${Ht - B + 18}" text-anchor="middle" class="lxax">${fp(t)}</text>`).join('');
    if (y0 < 0 && y1 > 0) g += `<line x1="${L}" x2="${Wd - R}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}" class="lxzero"/>`;
    g += `<text x="${(L + Wd - R) / 2}" y="${Ht - 8}" text-anchor="middle" class="lxal">${esc(o.xl || '')}</text><text transform="translate(14 ${(Tp + Ht - B) / 2}) rotate(-90)" text-anchor="middle" class="lxal">${esc(o.yl || '')}</text>`;
    o.ser.forEach((s, j) => { let d = '', pen = false; s.ys.forEach((y, i) => { if (!Number.isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { pen = false; return; } d += `${pen ? 'L' : 'M'}${X(o.xs[i]).toFixed(1)},${Y(Math.min(y1, Math.max(y0, y))).toFixed(1)}`; pen = true; });
      g += `<path d="${d}" fill="none" stroke="${s.c || PAL[j % 4]}" stroke-width="2"${s.dash ? ' stroke-dasharray="6 5"' : ''} stroke-linejoin="round"/>`; });
    if (o.mark && Number.isFinite(o.mark[0])) [].concat(o.mark[1]).forEach((y, j) => { if (Number.isFinite(y) && y >= y0 && y <= y1) g += `<circle cx="${X(o.mark[0]).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="5" fill="${o.ser[j] ? o.ser[j].c || PAL[j % 4] : PAL[0]}" stroke="var(--lx-card)" stroke-width="2"/>`; });
    (o.vl || []).forEach(([x, t]) => { if (Number.isFinite(x)) g += `<line x1="${X(x).toFixed(1)}" x2="${X(x).toFixed(1)}" y1="${Tp}" y2="${Ht - B}" class="lxvl"/><text x="${(X(x) + 4).toFixed(1)}" y="${Tp + 12}" class="lxax">${esc(t)}</text>`; });
    const leg = o.ser.length > 1 ? `<div class="lxleg">${o.ser.map((s, j) => `<span><i style="background:${s.c || PAL[j % 4]}"${s.dash ? ' class="dash"' : ''}></i>${esc(s.n)}</span>`).join('')}</div>` : '';
    const step = Math.max(1, Math.round(o.xs.length / 12));
    const tbl = `<details class="lxtbl"><summary>Table of values</summary><div class="lxtw"><table><thead><tr><th>${esc(o.xl || 'x')}</th>${o.ser.map(s => `<th>${esc(s.n)}</th>`).join('')}</tr></thead><tbody>${o.xs.map((x, i) => i % step && i !== o.xs.length - 1 ? '' : `<tr><td>${fp(x)}</td>${o.ser.map(s => `<td>${fp(s.ys[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
    return `<div class="lxch" data-ch="${id}" tabindex="0" aria-label="${esc((o.ser.map(s => s.n).join(', ')) + ' against ' + (o.xl || 'x'))}. Use the arrow keys to read values.">${leg}<div class="lxchw"><svg viewBox="0 0 ${Wd} ${Ht}" class="lxchs" aria-hidden="true">${g}<g class="lxhov"></g><rect x="${L}" y="${Tp}" width="${Wd - L - R}" height="${Ht - Tp - B}" fill="transparent" class="lxhit"/></svg><div class="lxtip" hidden></div></div>${tbl}</div>`;
  }
  function chartHover(el, i) {
    const o = CH.get(el.dataset.ch); if (!o || !o._m) return;
    i = Math.max(0, Math.min(o.xs.length - 1, i)); el._i = i;
    const { X, Y, Tp, Ht, B, Wd } = o._m, x = o.xs[i];
    let g = `<line x1="${X(x).toFixed(1)}" x2="${X(x).toFixed(1)}" y1="${Tp}" y2="${Ht - B}" class="lxcross"/>`;
    o.ser.forEach((s, j) => { const y = s.ys[i]; if (Number.isFinite(y)) g += `<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="4.5" fill="${s.c || PAL[j % 4]}" stroke="var(--lx-card)" stroke-width="2"/>`; });
    el.querySelector('.lxhov').innerHTML = g;
    const tip = el.querySelector('.lxtip'); tip.hidden = false;
    tip.innerHTML = `<b>${esc(o.xl ? o.xl.replace(/ \(.*\)$/, '') : 'x')} = ${fp(x)}</b>${o.ser.map((s, j) => `<span><i style="background:${s.c || PAL[j % 4]}"></i>${esc(s.n)}: <b>${fp(s.ys[i])}</b></span>`).join('')}`;
    const px = X(x) / Wd * 100; tip.style.left = px > 55 ? '' : `calc(${px}% + 12px)`; tip.style.right = px > 55 ? `calc(${100 - px}% + 12px)` : '';
  }
  function chartAt(el, e) {
    const o = CH.get(el.dataset.ch); if (!o || !o._m) return;
    const svg = el.querySelector('svg'), r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * o._m.Wd;
    let best = 0, bd = Infinity; o.xs.forEach((x, i) => { const dd = Math.abs(o._m.X(x) - sx); if (dd < bd) { bd = dd; best = i; } });
    chartHover(el, best);
  }
  const bars = (items, yl) => { const m = Math.max(...items.map(x => Math.abs(x[1])).filter(Number.isFinite), 1e-12);
    return `<div class="lxbars" role="img" aria-label="${esc(yl || '')}">${items.map(([l, y], j) => `<div class="lxbr"><span>${esc(l)}</span><div><i style="width:${Number.isFinite(y) ? Math.max(1, Math.abs(y) / m * 100) : 0}%;background:${PAL[0]}"></i></div><b>${fp(y)}</b></div>`).join('')}${yl ? `<p class="lxmuted">${esc(yl)}</p>` : ''}</div>`; };
  LX.chart = chart;

  /* ---------- drawing helpers for the live diagrams (numbers and fixed labels only) ---------- */
  const n1 = x => (+x).toFixed(1);
  const G = LX.G = {
    svg: (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" class="lxsvg" role="img" aria-label="${esc(label || 'Experiment diagram')}">${body}</svg>`,
    t: (x, y, s, o = {}) => `<text x="${n1(x)}" y="${n1(y)}" class="${o.c || 'gt'}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.f ? ` fill="${o.f}"` : ''}${o.s ? ` font-size="${o.s}"` : ''}${o.w ? ` font-weight="${o.w}"` : ''}>${s}</text>`,
    ln: (x1, y1, x2, y2, c = 'var(--gw)', w = 2, dash) => `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`,
    p: (d, c = 'var(--gw)', w = 2, fill = 'none', extra = '') => `<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`,
    // a wire; current I (any unit) flows along it as moving dashes, faster for more current (ref = a typical current)
    wire: (d, I = 0, ref = 1, c = 'var(--gw)') => { const s = Math.abs(I) / (ref || 1); return `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>` + (s > 0.01 && Number.isFinite(s) ? `<path d="${d}" fill="none" class="flow${I < 0 ? ' rev' : ''}" stroke-width="2.6" style="animation-duration:${(1.5 / Math.min(4, Math.max(0.2, s))).toFixed(2)}s"/>` : ''); },
    res: (x1, y1, x2, y2, c = 'var(--gc)') => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux, a = L * 0.22, z = (L - 2 * a) / 12; let d = `M${n1(x1)},${n1(y1)} L${n1(x1 + ux * a)},${n1(y1 + uy * a)}`;
      for (let k = 1; k <= 12; k++) { const s = k % 2 ? (k % 4 === 1 ? 7 : -7) : 0, px = x1 + ux * (a + z * k) + nx * (k === 12 ? 0 : s), py = y1 + uy * (a + z * k) + ny * (k === 12 ? 0 : s); d += ` L${n1(px)},${n1(py)}`; }
      return G.p(d + ` L${n1(x2)},${n1(y2)}`, c, 2.4); },
    ind: (x1, y1, x2, y2, n = 4, c = 'var(--gc)') => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, a = L * 0.18, h = (L - 2 * a) / n; let d = `M${n1(x1)},${n1(y1)} L${n1(x1 + ux * a)},${n1(y1 + uy * a)}`;
      for (let k = 0; k < n; k++) d += ` a${n1(h / 2)},${n1(h / 2)} 0 0 1 ${n1(ux * h)},${n1(uy * h)}`; return G.p(d + ` L${n1(x2)},${n1(y2)}`, c, 2.4); },
    cap: (x1, y1, x2, y2, c = 'var(--gc)') => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * 13, ny = ux * 13, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, g = 5;
      const a = [mx - ux * g, my - uy * g], b = [mx + ux * g, my + uy * g];
      return G.ln(x1, y1, a[0], a[1], c, 2.4) + G.ln(b[0], b[1], x2, y2, c, 2.4) + G.ln(a[0] - nx, a[1] - ny, a[0] + nx, a[1] + ny, c, 3) + G.ln(b[0] - nx, b[1] - ny, b[0] + nx, b[1] + ny, c, 3); },
    bat: (x, y, c = 'var(--gc)', lbl = '') => G.ln(x - 14, y - 6, x + 14, y - 6, c, 3) + G.ln(x - 8, y + 4, x + 8, y + 4, c, 5) + G.t(x + 18, y - 8, '+', { s: 12, w: 700 }) + G.t(x + 14, y + 14, '−', { s: 12, w: 700 }) + (lbl ? G.t(x - 20, y + 2, lbl, { a: 'end', w: 700 }) : ''),
    ac: (cx, cy, r, c = 'var(--gc)') => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${r}" fill="var(--lx-card)" stroke="${c}" stroke-width="2.4"/>` + G.p(`M${n1(cx - r * 0.6)},${n1(cy)} q${n1(r * 0.3)},${n1(-r * 0.7)} ${n1(r * 0.6)},0 t${n1(r * 0.6)},0`, c, 2),
    lamp: (cx, cy, r, b, c = 'var(--gc)') => `<circle cx="${cx}" cy="${cy}" r="${r * 2.1}" fill="#ffd54a" opacity="${Math.max(0, Math.min(0.85, b)).toFixed(2)}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--lx-card)" stroke="${c}" stroke-width="2.2"/>` + G.p(`M${cx - r * 0.7},${cy - r * 0.7} L${cx + r * 0.7},${cy + r * 0.7} M${cx + r * 0.7},${cy - r * 0.7} L${cx - r * 0.7},${cy + r * 0.7}`, c, 1.8),
    meter: (cx, cy, r, L, val, col = 'var(--lxb)') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--lx-card)" stroke="${col}" stroke-width="2.4"/>` + G.t(cx, cy + 5, L, { a: 'middle', w: 800, f: col, s: 14 }) + (val != null ? G.t(cx, cy + r + 14, val, { a: 'middle', c: 'gv' }) : ''),
    dot: (x, y, c = 'var(--gw)') => `<circle cx="${n1(x)}" cy="${n1(y)}" r="3.6" fill="${c}"/>`,
    arrow: (x1, y1, x2, y2, c = 'var(--lxb)', w = 2.4) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 8; return G.p(`M${n1(x1)},${n1(y1)} L${n1(x2)},${n1(y2)} M${n1(x2 - h * Math.cos(a - 0.45))},${n1(y2 - h * Math.sin(a - 0.45))} L${n1(x2)},${n1(y2)} L${n1(x2 - h * Math.cos(a + 0.45))},${n1(y2 - h * Math.sin(a + 0.45))}`, c, w); },
    // a phasor from (cx, cy), length len, angle deg (anticlockwise, maths convention)
    ph: (cx, cy, len, deg, c, lbl, w = 2.6) => { const a = deg * Math.PI / 180, x = cx + len * Math.cos(a), y = cy - len * Math.sin(a); return (len > 1 ? G.arrow(cx, cy, x, y, c, w) : '') + (lbl ? G.t(x + 8 * Math.cos(a) - 4, y - 8 * Math.sin(a) + 4, lbl, { f: c, w: 800, a: Math.cos(a) < -0.3 ? 'end' : Math.cos(a) > 0.3 ? 'start' : 'middle' }) : ''); },
    // a curve y = f(θ), θ over cyc cycles from ph, drawn in the box (x, y, w, h) with amplitude scale amp (1 = half the box)
    wave: (x, y, w, h, f, c, o = {}) => { const n = o.n || 120, cyc = o.cyc || 2, ph = o.ph || 0, amp = o.amp ?? 1; let d = ''; for (let i = 0; i <= n; i++) { const th = ph + 2 * Math.PI * cyc * i / n, v = f(th); if (!Number.isFinite(v)) continue; d += `${d ? 'L' : 'M'}${n1(x + w * i / n)},${n1(y + h / 2 - v * amp * h / 2)}`; } return G.p(d, c, o.w || 2.2, 'none', o.dash ? ` stroke-dasharray="${o.dash}"` : ''); },
    box: (x, y, w, h, o = {}) => `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${o.r ?? 10}" fill="${o.f || 'var(--gbox)'}" stroke="${o.s || 'var(--gline)'}" stroke-width="${o.w || 1.2}"/>`,
    gnd: (x, y, c = 'var(--gw)') => G.ln(x, y, x, y + 8, c) + G.ln(x - 10, y + 8, x + 10, y + 8, c) + G.ln(x - 6, y + 12, x + 6, y + 12, c) + G.ln(x - 2, y + 16, x + 2, y + 16, c),
    sw: (x1, y, x2, on, c = 'var(--gc)') => G.dot(x1, y, c) + G.dot(x2, y, c) + G.ln(x1, y, on ? x2 : x2 - 4, on ? y : y - 16, c, 2.6),
    diode: (x1, y1, x2, y2, on, c = 'var(--gc)') => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * 10, ny = ux * 10, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = [mx - ux * 8, my - uy * 8], b = [mx + ux * 8, my + uy * 8], col = on ? 'var(--lxg)' : c;
      return G.ln(x1, y1, a[0], a[1], c, 2.4) + G.ln(b[0], b[1], x2, y2, c, 2.4) + `<path d="M${n1(a[0] - nx)},${n1(a[1] - ny)} L${n1(a[0] + nx)},${n1(a[1] + ny)} L${n1(b[0])},${n1(b[1])} Z" fill="${on ? 'var(--lxg)' : 'var(--lx-card)'}" stroke="${col}" stroke-width="2"/>` + G.ln(b[0] - nx, b[1] - ny, b[0] + nx, b[1] + ny, col, 2.6); },
    // a moving charge or field marker: a soft dot
    blob: (x, y, r, c, o = 1) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" fill="${c}" opacity="${o}"/>`,
  };

  /* ---------- the workspace ---------- */
  const TABS = [['e', 'Experiment'], ['c', 'Calculations'], ['g', 'Graphs'], ['u', 'Understand the concept'], ['x', 'Exam practice']];
  const LV = [[1, 'Beginner', 'how one quantity moves another'], [2, 'Intermediate', 'one formula, real numbers'], [3, 'Advanced', 'two conditions, multi-step'], ['gate', 'GATE level', 'real GATE EE past questions'], ['tneb', 'TNEB AE level', 'real TANGEDCO & TNPSC past questions']];
  const GOALS = [['p', 'Explore: change 3 values'], ['c', 'Read the calculations'], ['g', 'Study a graph'], ['u', 'Understand the concept'], ['q', 'Exam: 2 right answers']];
  const goalsDone = r => GOALS.filter(([k]) => k === 'p' ? (r.pk || []).length >= 3 || (r.p || 0) >= 3 : k === 'q' ? ((r.q || [0, 0])[1] >= 2) : (r.k || {})[k]).length;
  LX.goalsDone = goalsDone; LX.GOALS = GOALS;

  /* ---------- the book's worked examples: the model run on the book's numbers, beside the printed answer ---------- */
  function ckHtml(S) {
    const L = (S.ck || []).map(([inp, out, src, tol]) => {
      const v = run(S, { ...defaults(S), ...inp });
      return Object.keys(out).filter(k => outOf(S, k)).map(k => { const want = out[k], got = v[k], o = outOf(S, k);
        const ok = typeof want === 'string' ? String(got) === want : Number.isFinite(got) && Math.abs(got - want) <= Math.max(Math.abs(want) * (tol || 0.012), 1e-12);
        const give = Object.keys(inp).map(j => { const s = inOf(S, j); return s ? `${esc(s[1])} = ${isCh(s) ? esc(chText(s, inp[j])) : fx(inp[j]) + (s[2] ? ' ' + esc(s[2]) : '')}` : ''; }).filter(Boolean).join(', ');
        return `<li class="${ok ? 'ok' : 'no'}"><span>${ok ? '✓' : '✗'} <b>${esc(o[1])}</b> = ${typeof want === 'string' ? esc(want) : fx(want / (o[5] || 1))}${o[2] ? ' ' + esc(o[2]) : ''}</span><small>${esc(src || '')}${give ? ` · ${give}` : ''}</small></li>`; }).join('');
    }).join('');
    return L ? `<details class="lxcard lxck"><summary><h3>Checked against your book</h3></summary><p class="lxmuted">The simulator, given the numbers of a worked example or table in your book, gets the printed answer:</p><ul>${L}</ul></details>` : '';
  }

  /* ---------- a topic formula lab (sims/engine.js format) as a full experiment ----------
     The lab's own inputs, outputs, curve, drawing and book checks; the rest is worked out from its formulas:
     which input moves which output (for "what happens if" questions), numericals, a comparison, and the formula
     as written in the lab (shown only when it is plain arithmetic of the inputs). */
  const MF = { sqrt: '√', cbrt: '∛', abs: 'abs', log10: 'log₁₀', log: 'ln', exp: 'exp', sin: 'sin', cos: 'cos', tan: 'tan', asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', min: 'min', max: 'max', hypot: 'hypot', round: 'round', floor: 'floor', ceil: 'ceil' };
  const GR = { tau: 'τ', rho: 'ρ', eta: 'η', phi: 'φ', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', lambda: 'λ', mu: 'µ', sigma: 'σ', omega: 'ω', epsilon: 'ε', eps: 'ε', psi: 'ψ', zeta: 'ζ' };
  // a variable name as a symbol: Greek names as letters, trailing digits as a subscript (N1 → N₁)
  const sym = k => { const m = String(k).match(/^([A-Za-z]+?)(\d+)$/), b = m ? m[1] : k; return `<i>${esc(GR[b] || b)}</i>${m ? `<sub>${m[2]}</sub>` : ''}`; };
  // minus signs, and 1e-9 as 1 × 10⁻⁹
  const tidy = t => t.replace(/(^|[^\w.])(\d*\.?\d+)e([+-]?)(\d+)/gi, (x, p, a, sg, n) => `${p}${a === '1' ? '' : a + ' × '}10<sup>${sg === '-' ? '−' : ''}${n}</sup>`).replace(/(^|[(,\s\u0003])-(?=[\w(.<\u0001])/g, '$1−').replace(/-(?=\d)/g, '−');
  function exprOf(fn) {
    const m = String(fn).trim().match(/^\(?\s*v\s*\)?\s*=>\s*([\s\S]+)$/); if (!m) return null;
    const e = m[1].trim(); if (e[0] === '{' || e.length > 160) return null;
    const rest = e.replace(/v\.[A-Za-z_]\w*/g, '0').replace(/Math\.(PI|E|SQRT2)\b/g, '0').replace(/\bPI\b/g, '0').replace(/Math\.(\w+)\(/g, (x, f) => MF[f] ? '(' : '#(')
      .replace(/\d*\.?\d+(e[+-]?\d+)?/gi, '0');
    if (/[^0-9+\-*/(). ,]/.test(rest)) return null;
    // operators first (on the source, variables held as placeholders), then the variables: markup is never re-processed
    const keys = [], e1 = e.replace(/v\.([A-Za-z_]\w*)/g, (x, k) => { keys.push(k); return `\u0001${keys.length - 1}\u0002`; });
    const body = tidy(e1.replace(/Math\.PI\b|\bPI\b/g, 'π').replace(/Math\.SQRT2\b/g, '√2').replace(/Math\.E\b/g, 'e').replace(/Math\.(\w+)\(/g, (x, f) => MF[f] + '(')
      .replace(/\s*\*\*\s*/g, '\u0003').replace(/\*/g, ' × ').replace(/\s*\/\s*/g, ' / ')
      .replace(/([^\s\u0003])\s*([+\-])\s*(?=\S)/g, (x, a, op) => /[(,e×/]$/.test(a) && !/[)\d]$/.test(a) ? x.replace(/\s+/g, ' ') : `${a} ${op === '-' ? '−' : '+'} `).replace(/\s+/g, ' ').trim())
      .replace(/\u0003(\d+(?:\.\d+)?|\u0001\d+\u0002)/g, '<sup>$1</sup>').replace(/\u0003/g, '^');
    const tx = sub => body.replace(/\u0001(\d+)\u0002/g, (x, j) => sub(keys[+j]));
    return { f: tx(sym), sub: v => { let bad = false; const r = tx(k => { const x = v[k]; if (typeof x !== 'number' || !Number.isFinite(x)) { bad = true; return '?'; } const t = fp(x); return x < 0 ? `(${t})` : t; }); return bad ? '' : r; } };
  }
  // a drawing for labs that have none: what you set → the book formula → what it gives, with the live values
  function flowFig(S, v, nm) {
    // top to bottom, two boxes a row, so it stays readable on a phone: inputs → the book formula → results
    const ins = S.i.slice(0, 6), outs = S.o.slice(0, 6), W0 = 400, BW = 188, BH = 46, RH = 54;
    const cut = (t, k) => { t = String(t); return t.length > k ? t.slice(0, k - 1) + '…' : t; };
    const val = (k, u) => { const y = disp(S, k, v); return `${typeof y === 'number' ? fp(y) : esc(cut(fx(y).replace(/<[^>]+>/g, ''), 18))}${u ? ' ' + esc(u) : ''}`; };
    const box = (x, y, lab, vv, cls) => `<g class="${cls}"><rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="11"/><text x="${x + 11}" y="${y + 18}" class="t1">${esc(cut(lab, 27))}</text><text x="${x + 11}" y="${y + 37}" class="t2">${vv}</text></g>`;
    const place = (n, y0) => Array.from({ length: n }, (_, j) => { const row = Math.floor(j / 2), last = n % 2 && j === n - 1; return [last ? (W0 - BW) / 2 : 8 + (j % 2) * (BW + 8), y0 + row * RH]; });
    const rin = Math.ceil(ins.length / 2), fy = 8 + rin * RH + 18, FH = 72, oy = fy + FH + 26, rout = Math.ceil(outs.length / 2), H = oy + rout * RH + 4;
    let g = '', bx = '';
    place(ins.length, 8).forEach(([x, y], j) => { const s = ins[j]; g += `<path class="lxfl" d="M${x + BW / 2} ${y + BH} C ${x + BW / 2} ${fy - 6}, ${W0 / 2} ${y + BH + 10}, ${W0 / 2} ${fy}"/>`; bx += box(x, y, s[1], isCh(s) ? esc(cut(chText(s, v[s[0]]), 18)) : val(s[0], s[2]), 'in'); });
    place(outs.length, oy).forEach(([x, y], j) => { const o = outs[j]; g += `<path class="lxfl" d="M${W0 / 2} ${fy + FH} C ${W0 / 2} ${y - 10}, ${x + BW / 2} ${fy + FH + 6}, ${x + BW / 2} ${y}"/>`; bx += box(x, y, o[1], val(o[0], o[2]), 'out'); });
    g += bx;
    const words = String(nm || 'Book formula').split(/\s+/), lines = []; words.forEach(w => { const l = lines[lines.length - 1]; if (l && (l + ' ' + w).length <= 26) lines[lines.length - 1] = l + ' ' + w; else lines.push(w); });
    const L2 = lines.slice(0, 2); if (lines.length > 2) L2[1] = cut(L2[1] + ' …', 26);
    g += `<g class="fm"><rect x="${W0 / 2 - 120}" y="${fy}" width="240" height="${FH}" rx="16"/><text x="${W0 / 2}" y="${fy + 20}" class="t3" text-anchor="middle">BOOK FORMULA</text>${L2.map((t, j) => `<text x="${W0 / 2}" y="${fy + 41 + j * 17}" class="t4" text-anchor="middle">${esc(t)}</text>`).join('')}</g>`;
    return `<svg viewBox="0 0 ${W0} ${H}" class="lxsvg lxflow" role="img" aria-label="What you set, the book formula, and what it gives, with your values">${g}</svg>`;
  }
  LX.fromLab = (L, o = {}) => {
    const i = L.i.map(s => Array.isArray(s[4]) ? [s[0], s[1], '', s[3], s[4].map(c => Array.isArray(c) ? c : [c, String(c)])] : [s[0], s[1], s[2] || '', s[3], s[4], s[5], s[6], s[7] === 'log' ? { log: true } : {}]);
    const out = L.o.map(x => [x[0], x[1], x[2] || '', x[3], x[4]]);
    const S = { m: 'Book formula', as: ['Every output is worked out from the formula printed in your book, with the values you set.', 'Nothing beyond that formula is modelled: losses, limits or tolerances count only when the formula includes them.'], i, o: out, ck: L.ck || [] };
    const v0 = run(S, defaults(S)), nums = i.filter(s => !isCh(s)), outs = out.filter(x => typeof v0[x[0]] === 'number' && Number.isFinite(v0[x[0]]));
    const EX = {}; out.forEach(x => { const e = exprOf(x[3]); if (e) EX[x[0]] = e; });
    // which input moves which output, by the formula itself (+25 % on the input)
    const rel = [], moves = {};
    outs.slice(0, 5).forEach(x => nums.forEach(s => { const x0 = s[3], x1 = x0 > 0 ? x0 * 1.25 : (s[4] + s[5]) / 2; if (x1 > s[5] && x0 * 0.75 < s[4]) return;
      const y0 = v0[x[0]], y1 = run(S, { ...defaults(S), [s[0]]: x1 > s[5] ? x0 * 0.75 : x1 })[x[0]];
      if (Number.isFinite(y1) && Math.abs(y1 - y0) > Math.max(Math.abs(y0) * 0.005, 1e-12)) { (moves[x[0]] = moves[x[0]] || []).push(s[0]); rel.push([s[0], x[0], () => EX[x[0]] ? `From the formula ${sym(x[0])} = ${EX[x[0]].f}, worked out for both values.` : 'Worked out from the book formula for both values.']); } }));
    S.rel = rel.slice(0, 12);
    S.num = outs.slice(0, 3).filter(x => moves[x[0]]).flatMap(x => [{ a: x[0], g: moves[x[0]].slice(0, 3), lv: 2 }, ...(moves[x[0]].length > 1 ? [{ a: x[0], g: moves[x[0]], lv: 3 }] : [])]);
    const r0 = rel[0] && i.find(s => s[0] === rel[0][0]);
    if (r0) { const b = r0[3] > 0 && r0[3] * 2 <= r0[5] ? r0[3] * 2 : r0[3] > 0 ? r0[3] / 2 : (r0[4] + r0[5]) / 2; S.cmp = [{ n: `${r0[1]}: ${fp(r0[3])} → ${fp(b)}`, a: {}, b: { [r0[0]]: b } }]; }
    S.me = (outs.length ? outs : out).slice(0, 4).map(x => x[0]);
    S.g = [];
    if (L.plot) { const P = L.plot, [xk, xl, xu, a, b, lg] = P.x;
      S.g.push({ n: P.yl || 'The book curve', xl: `${xl}${xu ? ` (${xu})` : ''}`, yl: P.yl || '', f: v => { const xs = []; for (let j = 0; j < 121; j++) xs.push(lg ? a * (b / a) ** (j / 120) : a + (b - a) * j / 120);
        const ser = P.y.map(([n, fn]) => ({ n, ys: xs.map(x => { try { const y = fn(x, v); return Number.isFinite(y) ? y : NaN; } catch (e) { return NaN; } }) }));
        let mark; try { const mx = P.mark ? P.mark(v) : undefined; if (Number.isFinite(mx)) mark = [mx, P.y.map(([, fn]) => { try { return fn(mx, v); } catch (e) { return NaN; } })]; } catch (e) {}
        return { xs, ser, logx: !!lg, mark }; } });
    }
    const seen = new Set(); rel.forEach(([xk, yk]) => { if (S.g.length < 3 && !seen.has(xk)) { seen.add(xk); S.g.push({ x: xk, y: [yk], n: `${labelOf(S, yk)} vs ${labelOf(S, xk)}` }); } });
    S.steps = (v, f) => out.map(x => { const e = EX[x[0]], y = v[x[0]], sb = e ? e.sub(v) : ''; return [esc(x[1]), e ? `${sym(x[0])} = ${e.f}` : '<span class="lxmuted">from the book formula</span>', sb && typeof y === 'number' && sb.replace(/[()]/g, '') === tidy(fp(y)) ? '' : sb, typeof y === 'number' ? y : fx(y), x[2]]; });
    S.der = [o.ref && o.ref.replace('</b><span', '</b><br><span'), ...out.filter(x => EX[x[0]]).map(x => `${esc(x[1])}: ${sym(x[0])} = ${EX[x[0]].f}`)].filter(Boolean);
    S.cn = { w: L.c || '', v: L.fig ? 'The drawing follows your values: change an input and it is redrawn from the formula.' : 'Each box shows a value you set or a result, live: change an input and every result is worked out again from the book formula.' };
    S.fig = L.fig ? v => { try { return L.fig(v, W.FIG); } catch (e) { return ''; } } : v => flowFig(S, v, L.rf || L.n);
    return S;
  };
  LX.exprOf = exprOf;

  LX.mount = function mount(box, id, A) {
    const S = LX.X[id]; if (!S) { box.innerHTML = '<div class="lxempty">This experiment could not be found.</div>'; return; }
    const meta = A.meta, R = A.rec(id);
    const reduced = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let d = { ...defaults(S) }, tab = TABS.some(t => t[0] === A.tab) ? A.tab : 'e', T = 0, playing = !reduced, speed = 1, gi = 0, cmpOn = false, cA = null, cB = null, lv = 1, Q = null, seq = 0;
    let custom = { x: (S.i.find(s => !isCh(s)) || [])[0], y: S.o[0][0] };
    const now = () => Math.round(Date.now() / 60000);
    R.s = R.s || now(); R.l = now(); A.changed();
    const chipEx = (meta.ex.includes('t') ? '<span class="lxchip t" title="HIGH priority topic in your book">TNEB AE important</span>' : '') + (meta.ex.includes('g') ? '<span class="lxchip g" title="25 or more GATE sums in your book on this topic">GATE important</span>' : '');
    const DN = ['', 'Beginner', 'Intermediate', 'Advanced'];
    box.innerHTML = `<div class="lx lxw${playing ? '' : ' paused'}">
      <div class="crumbs">${A.crumbs || `<a href="#sims">Simulation Lab</a> › <a href="#sims-${meta.cat}">${esc(A.catName)}</a> › ${esc(meta.n)}`}</div>
      <header class="lxh"><div class="lxhic" style="--cc:${A.catCol}">${A.catIcon}</div><div class="lxht"><h1>${esc(meta.n)}</h1>
        <p><span class="lxchip m" title="${esc((S.as || []).join(' · '))}">${esc(S.m || 'Model')}</span>${meta.d ? `<span class="lxchip d${meta.d}">${DN[meta.d]}</span>` : ''}${chipEx}${meta.t.map(t => A.topicLink(t)).join('')}</p></div>
        ${A.isFav ? `<button class="lxfav" aria-pressed="${A.isFav(id)}" aria-label="Keep in my favourite simulations">${A.isFav(id) ? '★' : '☆'}</button>` : ''}</header>
      <div class="lxgoals" aria-label="Your progress on this experiment"></div>
      <div class="lxtabs" role="tablist" aria-label="Experiment sections">${TABS.map(([k, n]) => `<button role="tab" id="lxt-${k}" aria-controls="lxp-${k}" data-tab="${k}" aria-selected="${k === tab}" tabindex="${k === tab ? 0 : -1}">${n}</button>`).join('')}</div>
      ${TABS.map(([k]) => `<section class="lxp" id="lxp-${k}" role="tabpanel" aria-labelledby="lxt-${k}"${k === tab ? '' : ' hidden'}></section>`).join('')}
    </div>`;
    const $ = s => box.querySelector(s), P_ = k => $('#lxp-' + k);
    const root = $('.lx');

    /* goals: the checklist that decides "completed" (never the page being opened) */
    function paintGoals() {
      const r = R, n = goalsDone(r);
      $('.lxgoals').innerHTML = `<div class="lxgbar"><i style="width:${n * 20}%"></i></div><span class="lxgn">${n === 5 ? '✓ Completed' : `${n} of 5 done`}</span>` +
        GOALS.map(([k, t]) => { const ok = k === 'p' ? (r.pk || []).length >= 3 || (r.p || 0) >= 3 : k === 'q' ? (r.q || [0, 0])[1] >= 2 : !!(r.k || {})[k]; return `<span class="lxg${ok ? ' on' : ''}">${ok ? '✓' : '○'} ${t}</span>`; }).join('');
      if (n === 5 && !r.done) { r.done = now(); A.changed(); A.toast(`✓ ${meta.n}: experiment completed.`); }
    }
    const visit = k => { if (k === 'e') return; R.k = R.k || {}; if (!R.k[k]) { R.k[k] = 1; A.changed(); paintGoals(); } };
    let lastKey = '', lastAt = 0;
    const explored = k => { const t = Date.now(); R.pk = R.pk || []; if (!R.pk.includes(k)) R.pk.push(k); if (k !== lastKey || t - lastAt > 1500) { R.p = (R.p || 0) + 1; lastKey = k; lastAt = t; A.changed(); paintGoals(); } };

    /* ---- the experiment tab ---- */
    const inputHtml = (s, val, pre) => {
      if (isCh(s)) return `<div class="lxin ch" data-k="${s[0]}"${pre ? ` data-c="${pre}"` : ''}><label>${esc(s[1])}</label><div class="lxseg" role="radiogroup" aria-label="${esc(s[1])}">${s[4].map(([x, t]) => `<button role="radio" aria-checked="${x === val}" data-v="${esc(x)}">${esc(t)}</button>`).join('')}</div></div>`;
      const lg = opt(s).log && s[4] > 0, pos = lg ? Math.round(1000 * Math.log(val / s[4]) / Math.log(s[5] / s[4])) : Math.round(1000 * (val - s[4]) / ((s[5] - s[4]) || 1));
      return `<div class="lxin" data-k="${s[0]}"${pre ? ` data-c="${pre}"` : ''}><label for="lxi-${pre || ''}${s[0]}">${esc(s[1])}</label><span class="lxnum"><input id="lxi-${pre || ''}${s[0]}" type="text" inputmode="decimal" value="${fp(val)}" aria-label="${esc(s[1])}${s[2] ? ' in ' + esc(s[2]) : ''}"><em>${esc(s[2])}</em></span>
        <input type="range" min="0" max="1000" value="${pos}" aria-label="${esc(s[1])} slider" aria-valuetext="${fp(val)} ${esc(s[2])}"><span class="lxrg"><small>${fp(s[4])}</small><small>${fp(s[5])}</small></span></div>`;
    };
    const fromPos = (s, p) => { const lg = opt(s).log && s[4] > 0, x = lg ? s[4] * (s[5] / s[4]) ** (p / 1000) : s[4] + (s[5] - s[4]) * p / 1000; return clamp(s, roundStep(s, x)); };
    P_('e').innerHTML = `<div class="lxe">
      <div class="lxstage"><div class="lxmeters" aria-live="polite"></div><div class="lxfig"></div>
        <div class="lxtr"><button class="lxbtn" data-a="play">${playing ? '❚❚ Pause' : '▶ Start'}</button><button class="lxbtn" data-a="reset">↺ Reset</button>
          <label class="lxspd">Animation speed <select data-a="speed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
          ${S.slow ? `<span class="lxmuted">${esc(S.slow)}</span>` : ''}</div>
        <div class="lxst"></div></div>
      <aside class="lxctl"><h3>Control panel</h3>
        ${S.pre && S.pre.length ? `<label class="lxpre">Preset <select data-a="pre"><option value="">Choose a preset…</option>${S.pre.map((p, j) => `<option value="${j}">${esc(p.n)}</option>`).join('')}</select></label>` : ''}
        <div class="lxins"></div><button class="lxbtn ghost" data-a="def">Reset to default values</button></aside></div>
      <div class="lxres"></div>
      <div class="lxcmpw"><button class="lxbtn cmp" data-a="cmp" aria-expanded="false">⇄ Compare two conditions</button><div class="lxcmp" hidden></div></div>`;
    const paintInputs = () => { const v = run(S, d); $('.lxins').innerHTML = S.i.filter(s => shown(S, s, v)).map(s => inputHtml(s, d[s[0]])).join(''); };
    function paintFig() { const v = run(S, d); let h = ''; try { h = S.fig ? S.fig(v, T, G) : ''; } catch (e) { h = ''; } $('.lxfig').innerHTML = h; }
    function paintE() {
      const v = run(S, d), me = S.me || S.o.slice(0, 4).map(o => o[0]);
      $('.lxmeters').innerHTML = me.map(k => { const y = disp(S, k, v); return `<div class="lxm"><span>${esc(labelOf(S, k))}</span><b>${typeof y === 'string' ? esc(y) : fx(y)}</b><em>${esc(unitOf(S, k))}</em></div>`; }).join('');
      let st = []; try { st = S.st ? S.st(v) : []; } catch (e) { st = []; }
      const bad = S.o.filter(o => typeof v[o[0]] === 'number' && !Number.isFinite(v[o[0]]));
      if (bad.length) st = [...st, ['warn', `Outside the model's range for ${bad.map(o => o[1].toLowerCase()).join(', ')} (shown as –).`]];
      $('.lxst').innerHTML = (st.length ? st : [['ok', 'Normal operation within the model.']]).map(([l, t]) => `<p class="lxs-${l}">${l === 'ok' ? '●' : l === 'warn' ? '▲' : '■'} ${t}</p>`).join('');
      $('.lxres').innerHTML = `<details open><summary>All results</summary><div class="lxresg">${S.o.map(o => { const y = disp(S, o[0], v); return `<div><span>${esc(o[1])}</span><b>${typeof y === 'string' ? esc(y) : fx(y, o[4])}</b> <em>${esc(o[2])}</em></div>`; }).join('')}</div></details>`;
      paintFig();
      if (cmpOn) paintCmp();
    }

    /* ---- compare two conditions ---- */
    function paintCmpInputs() {
      const vA = run(S, cA), vB = run(S, cB), col = (c, v, p) => S.i.filter(s => shown(S, s, v)).map(s => inputHtml(s, c[s[0]], p)).join('');
      $('.lxcmp').innerHTML = `${S.cmp && S.cmp.length ? `<label class="lxpre">Ready-made comparison <select data-a="cpre"><option value="">Choose…</option>${S.cmp.map((c, j) => `<option value="${j}">${esc(c.n)}</option>`).join('')}</select></label>` : ''}
        <div class="lxcg"><div class="lxcc a"><h4>Condition A</h4><div class="lxcfig" data-f="a"></div><details class="lxcin"><summary>Values of A</summary>${col(cA, vA, 'a')}</details></div>
        <div class="lxcc b"><h4>Condition B</h4><div class="lxcfig" data-f="b"></div><details class="lxcin" open><summary>Values of B</summary>${col(cB, vB, 'b')}</details></div></div><div class="lxcout"></div>`;
      paintCmp();
    }
    function paintCmp() {
      if (!cA) return;
      const vA = run(S, cA), vB = run(S, cB);
      let fa = '', fb = ''; try { fa = S.fig ? S.fig(vA, 0, G) : ''; fb = S.fig ? S.fig(vB, 0, G) : ''; } catch (e) {}
      const fA = box.querySelector('.lxcfig[data-f="a"]'), fB = box.querySelector('.lxcfig[data-f="b"]'); if (!fA) return; fA.innerHTML = fa; fB.innerHTML = fb;
      const chg = S.i.filter(s => cA[s[0]] !== cB[s[0]] && shown(S, s, vA)).map(s => isCh(s) ? `${esc(s[1])}: ${esc(chText(s, cA[s[0]]))} → ${esc(chText(s, cB[s[0]]))}` : `${esc(s[1])}: ${fx(cA[s[0]])} → ${fx(cB[s[0]])} ${esc(s[2])}${cA[s[0]] ? ` (×${fx(cB[s[0]] / cA[s[0]])})` : ''}`);
      const rows = S.o.map(o => { const a = disp(S, o[0], vA), b = disp(S, o[0], vB); let c = '';
        if (typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b)) { const r = Math.abs(a) > 1e-12 ? (b - a) / Math.abs(a) : (b - a); c = Math.abs(r) < 0.002 ? '<span class="lxsame">→ same</span>' : r > 0 ? `<span class="lxup">↑ ${Math.abs(a) > 1e-12 ? '+' + fx(r * 100, 1) + ' %' : ''}</span>` : `<span class="lxdn">↓ ${Math.abs(a) > 1e-12 ? fx(r * 100, 1) + ' %' : ''}</span>`; }
        else if (a !== b) c = '<span class="lxup">changed</span>'; else c = '<span class="lxsame">→ same</span>';
        return `<tr><th>${esc(o[1])}${o[2] ? ` <small>${esc(o[2])}</small>` : ''}</th><td>${typeof a === 'string' ? esc(a) : fx(a)}</td><td>${typeof b === 'string' ? esc(b) : fx(b)}</td><td>${c}</td></tr>`; }).join('');
      const g0 = (S.g || []).find(g => g.x && !g.f && !g.bar);
      let gh = '';
      if (g0) { const a = sweep(S, cA, g0.x, [g0.y[0]]), b = sweep(S, cB, g0.x, [g0.y[0]]); gh = `<h4>Graph comparison: ${esc(g0.n || '')}</h4>` + chart({ xs: a.xs, xl: a.xl, yl: a.yl, logx: a.logx, ser: [{ n: `A: ${a.ser[0].n}`, ys: a.ser[0].ys }, { n: `B: ${b.ser[0].n}`, ys: b.ser[0].ys, c: 'var(--ring2)', dash: 1 }] }); }
      box.querySelector('.lxcout').innerHTML = `<h4>What changed?</h4>${chg.length ? `<ul class="lxchg">${chg.map(c => `<li>${c}</li>`).join('')}</ul>` : '<p class="lxmuted">A and B are the same — change a value of B.</p>'}
        <h4>Results side by side</h4><div class="lxtw"><table class="lxct"><thead><tr><th></th><th>A</th><th>B</th><th>Change</th></tr></thead><tbody>${rows}</tbody></table></div>
        <h4>Why did it change?</h4>${whyHtml(S, vA, vB)}${gh}`;
    }

    /* ---- calculations ---- */
    function paintC() {
      const v = run(S, d);
      let it = ''; try { it = S.int ? S.int(v) : ''; } catch (e) {}
      P_('c').innerHTML = `<div class="lxcard"><h3>Given values</h3><ul class="lxgiven">${S.i.filter(s => shown(S, s, v)).map(s => `<li><span>${esc(s[1])}</span><b>${isCh(s) ? esc(chText(s, d[s[0]])) : `${fx(d[s[0]])} ${esc(s[2])}`}</b>${!isCh(s) && kOf(s) !== 1 ? `<em>= ${fx(v[s[0]])} ${esc(siUnit(s[2]))}</em>` : ''}</li>`).join('')}</ul></div>
        ${S.der && S.der.length ? `<details class="lxcard" open><summary><h3>Formulas and where they come from</h3></summary><ul class="lxder">${S.der.map(x => `<li>${x}</li>`).join('')}</ul></details>` : ''}
        <div class="lxcard"><h3>Step-by-step, with your numbers</h3>${stepsHtml(S, v) || '<p class="lxmuted">No steps for this experiment.</p>'}</div>
        ${ckHtml(S)}
        ${it ? `<div class="lxcard lxint"><h3>What the numbers mean</h3><p>${it}</p></div>` : ''}
        <details class="lxcard"><summary><h3>Assumptions — ${esc(S.m || 'model')}</h3></summary><ul>${(S.as || []).map(x => `<li>${x}</li>`).join('')}</ul></details>`;
    }
    const siUnit = u => ({ mH: 'H', 'µH': 'H', 'µF': 'F', nF: 'F', kV: 'V', kW: 'W', MW: 'W', kVA: 'VA', MVA: 'VA', 'cm²': 'm²', mm: 'm', cm: 'm', km: 'm', mWb: 'Wb', kHz: 'Hz', 'mΩ': 'Ω', 'kΩ': 'Ω', ms: 's', 'µs': 's', 'Ω/km': 'Ω/m', 'mH/km': 'H/m', 'µF/km': 'F/m', 'µS/km': 'S/m', '%': '(fraction)' }[u] || u);

    /* ---- graphs ---- */
    function paintG() {
      const gs = S.g || [], g = gs[gi], v = run(S, d);
      let body = '';
      if (g === 'custom' || gi >= gs.length) {
        const ins = S.i.filter(s => !isCh(s)), outs = S.o.filter(o => typeof v[o[0]] === 'number');
        const gd = custom.x && custom.y ? sweep(S, d, custom.x, [custom.y]) : null;
        body = `<div class="lxcus"><label>Plot <select data-a="cy">${outs.map(o => `<option value="${o[0]}"${o[0] === custom.y ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label><label>against <select data-a="cx">${ins.map(s => `<option value="${s[0]}"${s[0] === custom.x ? ' selected' : ''}>${esc(s[1])}</option>`).join('')}</select></label></div>` + (gd ? chart(gd) : '');
      } else if (g.bar) { let b = []; try { b = g.bar(v, d); } catch (e) {} body = bars(b, g.yl); }
      else { let gd = null; try { gd = graphData(S, g, d); } catch (e) {} body = gd ? chart(gd) : '<div class="lxempty">This graph has no valid values at these settings.</div>'; }
      P_('g').innerHTML = `<div class="lxgsel" role="group" aria-label="Choose a graph">${gs.map((x, j) => `<button class="lxpill" data-gi="${j}" aria-pressed="${j === gi}">${esc(x.n)}</button>`).join('')}<button class="lxpill" data-gi="${gs.length}" aria-pressed="${gi >= gs.length}">Any output vs any input</button></div>
        <div class="lxcard">${body}<p class="lxmuted">Every point is calculated by the model, with all other values held at your current settings${g && g.x ? '' : ''}. The dot marks where you are now.</p></div>`;
    }

    /* ---- concept ---- */
    function paintU() {
      const c = S.cn || {}, v = run(S, d);
      let fig = ''; try { fig = S.fig ? S.fig(v, 0, G) : ''; } catch (e) {}
      const L = (h, x) => x && x.length ? `<div class="lxcard"><h3>${h}</h3><ul>${x.map(y => `<li>${y}</li>`).join('')}</ul></div>` : '';
      P_('u').innerHTML = `${c.w ? `<div class="lxcard"><h3>What is happening physically?</h3><p>${c.w}</p></div>` : ''}${c.y ? `<div class="lxcard"><h3>Why does it happen?</h3><p>${c.y}</p></div>` : ''}
        ${c.s && c.s.length ? `<div class="lxcard"><h3>Step by step</h3><ol>${c.s.map(x => `<li>${x}</li>`).join('')}</ol></div>` : ''}
        <div class="lxcard"><h3>Visual explanation</h3><div class="lxufig">${fig}</div>${c.v ? `<p>${c.v}</p>` : ''}</div>
        ${c.a ? `<div class="lxcard"><h3>Where it is used</h3><p>${c.a}</p></div>` : ''}${L('Common mistakes', c.mk)}${L('Exam shortcuts', c.sc)}
        ${c.ta ? `<details class="lxcard lxta"><summary><h3>தமிழில் (in Tamil)</h3></summary><p lang="ta">${c.ta}</p></details>` : ''}`;
    }

    /* ---- exam practice ---- */
    const rnd = Math.random;
    function newQ() {
      seq++;
      if (lv === 1) { const rs = S.rel || []; if (!rs.length) return null; return relQ(S, d, rs[(seq + Math.floor(rnd() * rs.length)) % rs.length]); }
      if (lv === 2) { const ns = (S.num || []).filter(n => (n.lv || 2) === 2); const pool = ns.length ? ns : S.num || []; for (let k = 0; k < 4 && pool.length; k++) { const q = numQ(S, pool[Math.floor(rnd() * pool.length)], rnd); if (q) return q; } return null; }
      if (lv === 3) { const ns = (S.num || []).filter(n => n.lv === 3), cs = S.cmp || [];
        for (let k = 0; k < 6; k++) { if (cs.length && (k % 2 || !ns.length)) { const c = cs[Math.floor(rnd() * cs.length)], ys = [...new Set([...(S.me || []), ...(S.rel || []).map(r => r[1])])].filter(y => outOf(S, y)); const q = cmpQ(S, c, ys[Math.floor(rnd() * ys.length)] || S.o[0][0]); if (q) return q; }
          else if (ns.length) { const q = numQ(S, ns[Math.floor(rnd() * ns.length)], rnd); if (q) return q; } } return null; }
      return null;
    }
    function paintX() {
      P_('x').innerHTML = `<div class="lxlv" role="group" aria-label="Difficulty">${LV.map(([k, n, t]) => `<button class="lxpill" data-lv="${k}" aria-pressed="${k === lv}"><b>${n}</b><small>${t}</small></button>`).join('')}</div><div class="lxq"></div>
        <p class="lxmuted lxxn">Beginner, Intermediate and Advanced questions are <b>practice questions generated from this simulator</b> — the model works out every answer. GATE and TNEB AE levels open <b>real past exam questions</b> from your Question Book, with the exam named as printed. No question here is given a year it does not have.</p>`;
      paintQ();
    }
    async function paintQ() {
      const el = box.querySelector('.lxq'); if (!el) return;
      if (lv === 'gate' || lv === 'tneb') {
        el.innerHTML = '<p class="loading">Finding past questions…</p>';
        const r = await A.past(meta, lv); if (!el.isConnected) return;
        const what = lv === 'gate' ? 'GATE EE' : 'TANGEDCO / TNPSC (TNEB AE level)';
        el.innerHTML = r.n ? `<div class="lxcard"><h3>${r.n} real ${what} past questions on ${esc(meta.t.map(A.topicName).join(' & '))}</h3><p>Ranked by how closely they match this experiment. Each comes from your Question Book with its full solution; your answers count in your progress console as usual.</p><button class="lxbtn go" data-a="past">Practise ${Math.min(10, r.n)} past questions</button></div>`
          : `<div class="lxcard"><p>Your Question Book has no ${what} questions filed under this topic.</p></div>`;
        el._past = r; return;
      }
      Q = newQ();
      if (!Q) { el.innerHTML = '<div class="lxcard"><p class="lxmuted">No questions of this level for this experiment yet.</p></div>'; return; }
      el.innerHTML = `<div class="lxcard lxqc"><span class="lxchip gen">Generated practice question · ${LV.find(l => l[0] === Q.lv)[1]}</span><p class="lxqq">${Q.q}</p>
        <div class="lxopts">${Q.opts.map((o, j) => `<button class="lxopt" data-o="${j}"><i>${'ABCD'[j]}</i><span>${o.h}</span></button>`).join('')}</div><div class="lxexp" hidden></div></div>`;
    }
    function answer(j) {
      if (!Q || Q.done) return; Q.done = 1;
      const ok = Q.opts[j].ok; R.q = R.q || [0, 0]; R.q[0]++; if (ok) R.q[1]++; R.qd = A.today();
      R.m = R.m || {}; if (!ok) { const m0 = R.m[Q.key]; R.m[Q.key] = [(Array.isArray(m0) ? m0[0] : 0) + 1, (S.lab0 || '') + (Q.lab || '')]; }
      A.labDay(ok); A.changed(); paintGoals();
      box.querySelectorAll('.lxopt').forEach((b, k) => { b.disabled = true; b.classList.add(Q.opts[k].ok ? 'ok' : k === j ? 'no' : 'dim'); });
      const sc = (S.cn && S.cn.sc || [])[0];
      const ex = box.querySelector('.lxexp'); ex.hidden = false;
      ex.innerHTML = `<p class="${ok ? 'lxup' : 'lxdn'}"><b>${ok ? '✓ Correct' : '✗ Not quite'}</b>${ok ? '' : ` — the answer is ${'ABCD'[Q.opts.findIndex(o => o.ok)]}`}</p>${Q.exp}
        <h4>Why each option is right or wrong</h4><ul class="lxwhy2">${Q.opts.map((o, k) => `<li><b>${'ABCD'[k]}.</b> ${o.h} — ${o.why}</li>`).join('')}</ul>
        ${sc ? `<p class="lxsc"><b>Shortcut:</b> ${sc}</p>` : ''}
        <div class="lxacts">${Q.kind === 'rel' && (S.num || []).length ? '<button class="lxbtn" data-a="relnum">Try a related numerical</button>' : ''}<button class="lxbtn go" data-a="nextq">Next question →</button></div>`;
    }

    /* ---- painting and events ---- */
    function paintTab() {
      box.querySelectorAll('[role=tab]').forEach(b => { const on = b.dataset.tab === tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      TABS.forEach(([k]) => { P_(k).hidden = k !== tab; });
      if (tab === 'e') paintE(); else if (tab === 'c') paintC(); else if (tab === 'g') paintG(); else if (tab === 'u') paintU(); else if (tab === 'x') paintX();
      visit(tab);
    }
    const repaint = () => { if (tab === 'e') paintE(); else if (tab === 'c') paintC(); else if (tab === 'g') paintG(); else if (tab === 'u') paintU(); };
    function setVal(c, k, x, pre) {
      const s = inOf(S, k); if (!s) return;
      const nv = isCh(s) ? x : clamp(s, x); const before = c[k]; c[k] = nv;
      if (!pre) explored(k);
      const vis = S.i.filter(q => opt(q).w).length && before !== nv && isCh(s);
      return vis;
    }
    function syncInput(el, s, val) {
      const num = el.querySelector('input[type=text]'), rg = el.querySelector('input[type=range]');
      if (num && document.activeElement !== num) num.value = fp(val);
      if (rg) { const lg = opt(s).log && s[4] > 0; rg.value = lg ? Math.round(1000 * Math.log(val / s[4]) / Math.log(s[5] / s[4])) : Math.round(1000 * (val - s[4]) / ((s[5] - s[4]) || 1)); rg.setAttribute('aria-valuetext', `${fp(val)} ${s[2]}`); }
    }
    function onInput(e) {
      const el = e.target.closest('.lxin'); if (!el) return;
      const k = el.dataset.k, s = inOf(S, k), pre = el.dataset.c, c = pre === 'a' ? cA : pre === 'b' ? cB : d;
      if (e.target.type === 'range') { const x = fromPos(s, +e.target.value); setVal(c, k, x, pre); syncInput(el, s, c[k]); }
      else if (e.target.type === 'text' && e.type === 'change') { const raw = e.target.value, x = clamp(s, raw); if (Number.isFinite(parseFloat(String(raw).replace(/,/g, ''))) && x !== parseFloat(String(raw).replace(/,/g, ''))) A.toast(`${s[1]} must be between ${fp(s[4])} and ${fp(s[5])} ${s[2]} — set to ${fp(x)}.`); setVal(c, k, x, pre); syncInput(el, s, c[k]); }
      else return;
      if (pre) paintCmp(); else repaint();
    }
    box.addEventListener('input', onInput);
    box.addEventListener('change', e => {
      if (e.target.matches('.lxin input[type=text]')) return onInput(e);
      const a = e.target.dataset.a;
      if (a === 'speed') speed = +e.target.value;
      else if (a === 'pre') { const p = S.pre[+e.target.value]; if (p) { d = { ...defaults(S), ...p.d }; Object.keys(p.d).forEach(k => explored(k)); paintInputs(); paintE(); } }
      else if (a === 'cpre') { const c = S.cmp[+e.target.value]; if (c) { cA = { ...defaults(S), ...c.a }; cB = { ...defaults(S), ...c.b }; paintCmpInputs(); } }
      else if (a === 'cx' || a === 'cy') { custom[a[1]] = e.target.value; paintG(); }
    });
    box.addEventListener('click', e => {
      const t = e.target.closest('button, [data-ch]'); if (!t) return;
      if (t.dataset.tab) { tab = t.dataset.tab; paintTab(); return; }
      const seg = t.closest('.lxseg'); if (seg) { const el = t.closest('.lxin'), pre = el.dataset.c, c = pre === 'a' ? cA : pre === 'b' ? cB : d; const ch = setVal(c, el.dataset.k, t.dataset.v, pre);
        seg.querySelectorAll('[role=radio]').forEach(b => b.setAttribute('aria-checked', b === t)); if (pre) { if (ch) paintCmpInputs(); else paintCmp(); } else { if (ch) paintInputs(); repaint(); } return; }
      if (t.dataset.gi != null) { gi = +t.dataset.gi; paintG(); return; }
      if (t.dataset.lv != null) { lv = /^\d$/.test(t.dataset.lv) ? +t.dataset.lv : t.dataset.lv; paintX(); return; }
      if (t.dataset.o != null) { answer(+t.dataset.o); return; }
      if (t.classList.contains('lxfav') && A.toggleFav) { const on = A.toggleFav(id); t.setAttribute('aria-pressed', on); t.textContent = on ? '★' : '☆'; A.toast(on ? '★ Added to My favourite simulations' : 'Removed from favourites'); return; }
      const a = t.dataset.a;
      if (a === 'play') { playing = !playing; root.classList.toggle('paused', !playing); t.textContent = playing ? '❚❚ Pause' : '▶ Start'; if (playing) loop(); }
      else if (a === 'reset') { T = 0; d = { ...defaults(S) }; paintInputs(); paintE(); }
      else if (a === 'def') { d = { ...defaults(S) }; paintInputs(); paintE(); A.toast('Back to the default values.'); }
      else if (a === 'cmp') { cmpOn = !cmpOn; t.setAttribute('aria-expanded', cmpOn); $('.lxcmp').hidden = !cmpOn; if (cmpOn) { R.cu = 1; A.changed(); const c0 = (S.cmp || [])[0]; cA = c0 ? { ...defaults(S), ...c0.a } : { ...d }; cB = c0 ? { ...defaults(S), ...c0.b } : { ...d }; paintCmpInputs(); } }
      else if (a === 'nextq') paintQ();
      else if (a === 'relnum') { const ns = S.num || [], nq = ns.find(n => n.a === Q.yk) || ns[0]; const q = numQ(S, nq, rnd); if (q) { lv = q.lv; paintX(); Q = q; const el = box.querySelector('.lxq'); el.innerHTML = `<div class="lxcard lxqc"><span class="lxchip gen">Generated practice question · related numerical</span><p class="lxqq">${Q.q}</p><div class="lxopts">${Q.opts.map((o, j) => `<button class="lxopt" data-o="${j}"><i>${'ABCD'[j]}</i><span>${o.h}</span></button>`).join('')}</div><div class="lxexp" hidden></div></div>`; } }
      else if (a === 'past') { const r = box.querySelector('.lxq')._past; if (r && r.items.length) A.quiz(r.items.slice(0, 10), `${meta.n} — ${lv === 'gate' ? 'GATE EE' : 'TNEB AE level'} past questions`); }
    });
    box.addEventListener('keydown', e => {
      const tb = e.target.closest('[role=tab]');
      if (tb && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const j = TABS.findIndex(t => t[0] === tb.dataset.tab), n = TABS[(j + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0]; tab = n; paintTab(); box.querySelector('#lxt-' + n).focus(); e.preventDefault(); }
      const ch = e.target.closest('.lxch'); if (ch && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { chartHover(ch, (ch._i ?? 0) + (e.key === 'ArrowRight' ? 1 : -1)); e.preventDefault(); }
      if (e.target.matches('.lxin input[type=text]') && e.key === 'Enter') { e.target.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    box.addEventListener('pointermove', e => { const ch = e.target.closest('.lxch'); if (ch && e.target.closest('svg')) chartAt(ch, e); });
    box.addEventListener('pointerleave', e => { box.querySelectorAll('.lxtip').forEach(t => t.hidden = true); box.querySelectorAll('.lxhov').forEach(g => g.innerHTML = ''); }, true);
    box.addEventListener('focusin', e => { const ch = e.target.closest('.lxch'); if (ch && e.target === ch) chartHover(ch, ch._i ?? 0); });

    /* ---- animation: only experiments whose drawing moves with time; stops when the page or tab is left ---- */
    let raf = 0, last = 0, drawn = 0;
    function loop() {
      if (raf || !S.live) return;
      raf = requestAnimationFrame(function f(ts) {
        raf = 0;
        if (!box.isConnected) return;
        if (!playing) { last = 0; return; }
        if (tab === 'e' && !document.hidden) { const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; T += dt * speed; if (ts - drawn > 33) { drawn = ts; paintFig(); } }
        last = ts; raf = requestAnimationFrame(f);
      });
    }
    /* ---- time on the experiment: counted only while the page is visible ---- */
    let acc = 0;
    const tm = setInterval(() => {
      if (!box.isConnected) { clearInterval(tm); if (acc) { A.changed(); } return; }
      if (document.hidden) return;
      R.t = (R.t || 0) + 5; A.labTime(5); acc += 5;
      if (acc >= 30) { acc = 0; A.changed(); }
    }, 5000);

    paintInputs(); paintGoals(); paintTab(); loop();
  };
})();
if (typeof module !== 'undefined') module.exports = (typeof window !== 'undefined' ? window : globalThis).LX;
