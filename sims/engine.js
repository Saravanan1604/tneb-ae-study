/* Formula & concept labs for every topic. A lab is plain data:
     lab(topicId, { n: name, rf: words of the book formula's name, c: one-line concept,
       i: [[key, label, unit, value, min, max, step, 'log'?] | [key, label, '', value, [choices]] | [key, label, '', value, 'text']],
       o: [[key, label, unit, v => value, digits?]],              // outputs, in order; later ones may use earlier ones
       plot: { x: [key, label, unit, min, max, 'log'?], y: [[label, (x, v) => y], …], yl: 'axis label', mark: v => x },
       ck: [[{inputs}, {output: expected}, 'where the book prints it', tolerance?]],    // the book's own numbers
       fig: (v, F) => svg })                                      // optional live diagram, redrawn on every change (F = window.FIG)
   The page shows sliders, live outputs with ↑/↓/→ against your starting point, a "what happens if" table
   (+10 % on each input), a graph of any output against any input (or the lab's own curve), and the book checks. */
(() => {
  const LABS = window.LABS = window.LABS || [];
  window.lab = (t, d) => [].concat(t).forEach(x => LABS.push({ t: String(x), home: String([].concat(t)[0]), id: 'L' + LABS.length, ...d }));   // t may list several topics; home = the first

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function fmt(x, d) {
    if (typeof x === 'string') return esc(x);
    if (typeof x === 'boolean') return x ? 'yes' : 'no';
    if (!Number.isFinite(x)) return '–';
    if (d != null) return x.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e7 || a < 1e-3)) { const e = Math.floor(Math.log10(a)), m = x / 10 ** e; return `${+m.toFixed(3)} × 10<sup>${e}</sup>`; }
    return (+x.toPrecision(4)).toLocaleString('en-IN', { maximumFractionDigits: 6 });
  }
  // evaluate a lab: defaults, then given inputs, then outputs in order
  function run(L, given = {}) {
    const v = {};
    L.i.forEach(s => { v[s[0]] = s[0] in given ? given[s[0]] : s[3]; });
    L.o.forEach(s => { try { v[s[0]] = s[3](v); } catch (e) { v[s[0]] = NaN; } });
    return v;
  }
  const close = (a, b, tol = 0.012) => typeof b === 'string' ? String(a) === b : Math.abs(a - b) <= Math.max(Math.abs(b) * tol, 1e-12);
  function checks(L) {
    return (L.ck || []).map(([inp, out, src, tol]) => { const v = run(L, inp); return { inp, out, src, got: v, ok: Object.keys(out).every(k => close(v[k], out[k], tol)) }; });
  }
  window.SIMS = { run, checks, fmt };

  /* ---------- live diagrams: small drawing helpers for lab figures (all numbers, no user text) ---------- */
  const t = x => typeof x === 'string' ? esc(x) : !Number.isFinite(x) ? '–' : Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(2).replace('e+', 'e') : String(+x.toPrecision(4));
  const F = window.FIG = {
    t,
    svg: (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" class="fig" role="img" aria-label="${esc(label)}">${body}</svg>`,
    txt: (x, y, s, o = {}) => `<text x="${x}" y="${y}" class="${o.c || 'ft'}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.col ? ` fill="${o.col}"` : ''}${o.s ? ` font-size="${o.s}"` : ''}>${s}</text>`,
    line: (x1, y1, x2, y2, col = 'currentColor', w = 2, dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`,
    // a wire with current flowing along it: speed 0 = no current
    wire: (d, col, speed = 0) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linejoin="round"/>${speed > 0 ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="2.6" stroke-dasharray="3 13" class="flow" style="animation-duration:${(1.6 / Math.min(4, Math.max(0.15, speed))).toFixed(2)}s"/>` : ''}`,
    arrow: (x1, y1, x2, y2, col, w = 2.4) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 8; return `<path d="M${x1},${y1} L${x2},${y2} M${x2 - h * Math.cos(a - 0.45)},${y2 - h * Math.sin(a - 0.45)} L${x2},${y2} L${x2 - h * Math.cos(a + 0.45)},${y2 - h * Math.sin(a + 0.45)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; },
    // a coil of n loops down a vertical line at x from y1 to y2, bulging to the side s (+1 right, −1 left)
    coil: (x, y1, y2, n, col, s = 1) => { const k = Math.max(2, Math.min(14, Math.round(n))), h = (y2 - y1) / k; let d = `M${x},${y1}`; for (let i = 0; i < k; i++) d += ` a${h / 2},${h / 2} 0 0 ${s > 0 ? 1 : 0} 0,${h}`; return `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.6"/>`; },
    // a resistor zig-zag between two points on a vertical (or horizontal) line
    resV: (x, y1, y2, col) => { const n = 6, h = (y2 - y1) / (n + 2); let d = `M${x},${y1} v${h}`; for (let i = 0; i < n; i++) d += ` l${i % 2 ? -8 : 8},${h / 2} l${i % 2 ? 8 : -8},${h / 2}`; return `<path d="${d} v${h}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>`; },
    resH: (x1, x2, y, col) => { const n = 6, w = (x2 - x1) / (n + 2); let d = `M${x1},${y} h${w}`; for (let i = 0; i < n; i++) d += ` l${w / 2},${i % 2 ? 8 : -8} l${w / 2},${i % 2 ? -8 : 8}`; return `<path d="${d} h${w}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>`; },
    // an AC source: a circle with a sine inside
    src: (cx, cy, r, col) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--paper)" stroke="${col}" stroke-width="2.4"/><path d="M${cx - r * 0.6},${cy} q${r * 0.3},${-r * 0.7} ${r * 0.6},0 t${r * 0.6},0" fill="none" stroke="${col}" stroke-width="2"/>`,
    // sine waves on one shared scale: [{a: amplitude, col, l: label, ph: phase in rad}]
    waves: (x, y, w, h, S, cyc = 2) => { const m = Math.max(...S.map(s => Math.abs(s.a)), 1e-12); let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="fbox"/>` + F.line(x + 8, y + h / 2, x + w - 8, y + h / 2, 'var(--line)', 1);
      S.forEach(s => { let d = ''; for (let i = 0; i <= 120; i++) { const xx = x + 8 + (w - 16) * i / 120, yy = y + h / 2 - (h / 2 - 10) * s.a / m * Math.sin(2 * Math.PI * cyc * i / 120 - (s.ph || 0)); d += `${i ? 'L' : 'M'}${xx.toFixed(1)},${yy.toFixed(1)}`; } g += `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="2.2"/>`; });
      return g + S.map((s, k) => `<rect x="${x + 12 + k * 118}" y="${y + 8}" width="14" height="3" fill="${s.col}"/>` + F.txt(x + 30 + k * 118, y + 14, s.l, { c: 'fs' })).join(''); },
    // a fill bar (0–1) for levels: tank, pH, etc.
    bar: (x, y, w, h, f, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="fbox"/><rect x="${x}" y="${y + h * (1 - Math.max(0, Math.min(1, f)))}" width="${w}" height="${h * Math.max(0, Math.min(1, f))}" rx="6" fill="${col}"/>`,
  };
  const figOf = (L, v) => { try { return L.fig ? L.fig(v, F) : ''; } catch (e) { return ''; } };

  /* ---------- page rendering ---------- */
  const isNum = s => !Array.isArray(s[4]) && s[4] !== 'text';
  const toPos = (s, x) => s[7] === 'log' ? Math.round(1000 * Math.log(x / s[4]) / Math.log(s[5] / s[4])) : Math.round(1000 * (x - s[4]) / (s[5] - s[4]));
  const fromPos = (s, p) => { const x = s[7] === 'log' ? s[4] * (s[5] / s[4]) ** (p / 1000) : s[4] + (s[5] - s[4]) * p / 1000; const st = s[6] || 0; return st ? Math.round(x / st) * st : +x.toPrecision(4); };
  function inputHtml(L, s, val) {
    if (s[4] === 'text') return `<label class="lb-in"><span>${s[1]}</span><input type="text" value="${esc(val)}" data-k="${s[0]}" spellcheck="false" autocomplete="off"></label>`;
    if (!isNum(s)) return `<label class="lb-in"><span>${s[1]}</span><select data-k="${s[0]}">${s[4].map(o => `<option${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    return `<label class="lb-in"><span>${s[1]}${s[2] ? ` <small>(${s[2]})</small>` : ''}</span><span class="lb-row"><input type="range" min="0" max="1000" value="${toPos(s, val)}" data-k="${s[0]}" aria-label="${esc(s[1])}"><input type="number" step="any" value="${val}" data-k="${s[0]}" aria-label="${esc(s[1])} value"></span></label>`;
  }
  function card(L, ref) {
    const v = run(L), cks = checks(L);
    return `<article class="box lab${L.fig ? ' hasfig' : ''}" data-lab="${L.id}">
      <header><h3>${esc(L.n)}</h3>${ref ? `<div class="lb-ref">${ref}</div>` : ''}${L.c ? `<p class="lb-c">${L.c}</p>` : ''}</header>
      ${L.fig ? `<div class="lb-fig">${figOf(L, v)}</div>` : ''}
      <div class="lb-grid"><div class="lb-ins">${L.i.map(s => inputHtml(L, s, v[s[0]])).join('')}<button class="btn lb-reset" data-lb="reset">Reset</button></div>
        <div class="lb-outs">${L.o.map(s => `<div class="lb-o" data-o="${s[0]}"><span>${s[1]}</span><b>${fmt(v[s[0]], s[4])}${s[2] ? ` <small>${s[2]}</small>` : ''}</b><i></i></div>`).join('')}</div></div>
      <div class="lb-plot"></div>
      <div class="acts"><button class="btn" data-lb="graph">📈 Graph</button><button class="btn" data-lb="whatif">↕ What happens if…</button><button class="btn" data-lb="predict">🔮 Predict</button>${cks.length ? `<button class="btn" data-lb="book">✓ Book checks (${cks.filter(c => c.ok).length}/${cks.length})</button>` : ''}</div>
      <div class="lb-more" hidden></div></article>`;
  }
  // a small SVG line chart
  function chart(xs, series, o) {
    const W = 560, H = 230, X0 = 54, X1 = W - 12, Y0 = 12, Y1 = H - 36;
    const ys = series.flatMap(s => s.y).filter(Number.isFinite);
    if (!ys.length) return '<p class="pg">Nothing to plot for these values.</p>';
    let lo = Math.min(...ys), hi = Math.max(...ys); if (hi - lo < 1e-12) { lo -= 1; hi += 1; } const pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
    const lx = o.log, xa = lx ? Math.log(xs[0]) : xs[0], xb = lx ? Math.log(xs[xs.length - 1]) : xs[xs.length - 1];
    const sx = x => X0 + ((lx ? Math.log(x) : x) - xa) / (xb - xa) * (X1 - X0), sy = y => Y1 - (y - lo) / (hi - lo) * (Y1 - Y0);
    const tk = (a, b) => { const st = 10 ** Math.floor(Math.log10((b - a) / 4)); const m = [1, 2, 5, 10].find(m => (b - a) / (st * m) <= 6) * st; const t = []; for (let v = Math.ceil(a / m) * m; v <= b + 1e-9; v += m) t.push(+v.toPrecision(6)); return t; };
    const C = ['#c62828', '#1d5fc4', '#2e8b57', '#7b4fd6', '#e09a00'];
    let g = '';
    tk(lo, hi).forEach(t => { g += `<line x1="${X0}" x2="${X1}" y1="${sy(t)}" y2="${sy(t)}" class="gl"/><text x="${X0 - 6}" y="${sy(t) + 4}" text-anchor="end">${fmt(t)}</text>`; });
    const xt = lx ? xs.filter((x, i) => i % Math.ceil(xs.length / 5) === 0) : tk(xs[0], xs[xs.length - 1]);
    xt.forEach(t => { g += `<text x="${sx(t)}" y="${Y1 + 16}" text-anchor="middle">${fmt(t)}</text>`; });
    g += `<line x1="${X0}" x2="${X1}" y1="${Y1}" y2="${Y1}" class="ax"/><text x="${X1}" y="${H - 4}" text-anchor="end">${esc(o.xl)}</text><text x="${X0}" y="${Y0 - 2}" text-anchor="start">${esc(o.yl || '')}</text>`;
    series.forEach((s, k) => {
      let d = '', pen = false;
      xs.forEach((x, i) => { const y = s.y[i]; if (!Number.isFinite(y)) { pen = false; return; } d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(Math.max(lo, Math.min(hi, y))).toFixed(1)}`; pen = true; });
      g += `<path d="${d}" fill="none" stroke="${C[k % C.length]}" stroke-width="2.4"/>`;
    });
    if (o.mark != null && Number.isFinite(o.mark) && o.mark >= Math.min(xs[0], xs[xs.length - 1]) && o.mark <= Math.max(xs[0], xs[xs.length - 1])) g += `<line x1="${sx(o.mark)}" x2="${sx(o.mark)}" y1="${Y0}" y2="${Y1}" class="mk"/>`;
    (o.dots || []).forEach(([x, y]) => { if (Number.isFinite(y)) g += `<circle cx="${sx(x)}" cy="${sy(y)}" r="5" class="dot"/>`; });
    const leg = series.length > 1 ? `<div class="lb-leg">${series.map((s, k) => `<span><i style="background:${C[k % C.length]}"></i>${esc(s.l)}</span>`).join('')}</div>` : '';
    return `<svg viewBox="0 0 ${W} ${H}" class="lb-svg" role="img" aria-label="${esc(o.yl || '')} against ${esc(o.xl)}">${g}</svg>${leg}`;
  }
  const range = (a, b, n, lg) => Array.from({ length: n }, (_, i) => lg ? a * (b / a) ** (i / (n - 1)) : a + (b - a) * i / (n - 1));
  function plotHtml(L, v, sel) {
    if (L.plot && !sel) {
      const [k, xl, xu, a, b, lg] = L.plot.x, xs = range(a, b, 160, lg === 'log');
      const series = L.plot.y.map(([l, f]) => ({ l, y: xs.map(x => { try { return f(x, v); } catch (e) { return NaN; } }) }));
      const mx = L.plot.mark ? L.plot.mark(v) : (k in v ? v[k] : null);
      return chart(xs, series, { xl: `${xl}${xu ? ` (${xu})` : ''}`, yl: L.plot.yl, log: lg === 'log', mark: mx });
    }
    const nums = L.i.filter(isNum), outs = L.o.filter(s => typeof v[s[0]] === 'number');
    if (!nums.length || !outs.length) return '';
    const xk = sel && sel.x || nums[0][0], yk = sel && sel.y || outs[0][0], xs0 = L.i.find(s => s[0] === xk), ys0 = L.o.find(s => s[0] === yk);
    const xs = range(xs0[4], xs0[5], 80, xs0[7] === 'log');
    const ys = xs.map(x => run(L, { ...v, [xk]: x })[yk]);
    return `<div class="lb-sel"><label>Show <select data-g="y">${outs.map(s => `<option value="${s[0]}"${s[0] === yk ? ' selected' : ''}>${esc(s[1])}</option>`).join('')}</select></label>
      <label>against <select data-g="x">${nums.map(s => `<option value="${s[0]}"${s[0] === xk ? ' selected' : ''}>${esc(s[1])}</option>`).join('')}</select></label></div>` +
      chart(xs, [{ l: ys0[1], y: ys }], { xl: `${xs0[1]}${xs0[2] ? ` (${xs0[2]})` : ''}`, yl: `${ys0[1]}${ys0[2] ? ` (${ys0[2]})` : ''}`, log: xs0[7] === 'log', dots: [[v[xk], v[yk]]] });
  }
  /* the relationship engine: how an output follows one input with every other input held where it is.
     A power law y ∝ xᵏ gives the same exponent for +10 % and −10 %; only then is "∝" shown. */
  function relation(L, v, xk, yk) {
    const y0 = v[yk], up = run(L, { ...v, [xk]: v[xk] * 1.1 })[yk], dn = run(L, { ...v, [xk]: v[xk] * 0.9 })[yk];
    if (![y0, up, dn].every(Number.isFinite)) return null;
    const p = y0 ? (up - y0) / Math.abs(y0) * 100 : (up - y0 ? Infinity : 0), dir = Math.abs(up - y0) <= Math.abs(y0) * 5e-4 + 1e-15 ? 0 : up > y0 ? 1 : -1;
    let law = '';
    if (!dir) law = 'does not depend on it';
    else if (y0 && up / y0 > 0 && dn / y0 > 0) {
      const e1 = Math.log(up / y0) / Math.log(1.1), e2 = Math.log(dn / y0) / Math.log(0.9);
      const y2 = run(L, { ...v, [xk]: v[xk] * 2 })[yk], e3 = y2 / y0 > 0 ? Math.log(y2 / y0) / Math.log(2) : NaN;
      const L2 = Math.abs(e1 - e2) < 0.02 && Math.abs(e1 - e3) < 0.02 && [[1, '∝ x (direct)'], [-1, '∝ 1/x (inverse)'], [2, '∝ x² (square)'], [-2, '∝ 1/x² (inverse square)'], [0.5, '∝ √x'], [-0.5, '∝ 1/√x'], [3, '∝ x³'], [-3, '∝ 1/x³'], [4, '∝ x⁴'], [1.5, '∝ x^1.5']].find(([k]) => Math.abs(e1 - k) < 0.02);
      law = L2 ? L2[1] : dir > 0 ? 'rises, but not in proportion' : 'falls, but not in proportion';
    } else law = dir > 0 ? 'rises' : 'falls';
    return { y0, y1: up, p, dir, law };
  }
  window.SIMS.relation = relation;
  function whatIf(L, v) {
    const nums = L.i.filter(isNum), outs = L.o.filter(s => typeof v[s[0]] === 'number');
    if (!nums.length) return '<p class="pg">No numeric inputs.</p>';
    const cell = r => !r ? '<td>–</td>' : !r.dir ? '<td class="eq">→ same<small>does not depend on it</small></td>'
      : `<td class="${r.dir > 0 ? 'up' : 'dn'}">${r.dir > 0 ? '↑' : '↓'} ${Number.isFinite(r.p) ? (r.p > 0 ? '+' : '') + (+r.p.toPrecision(3)) + ' %' : ''}<small>${esc(r.law)}</small></td>`;
    return `<p class="pg">Each row raises ONE input by 10 % and holds every other input at its present value. ↑ rises, ↓ falls, → no change; the small line names the relationship (x = that input).</p><div class="ctab"><table class="lb-wi"><thead><tr><th>If this rises 10 %</th>${outs.map(s => `<th>${esc(s[1])}</th>`).join('')}</tr></thead><tbody>${nums.map(s => `<tr><td>${esc(s[1])}<small>others held: ${nums.filter(o => o !== s).map(o => `${esc(o[1])} = ${fmt(v[o[0]])}`).join(' · ') || '—'}</small></td>${outs.map(o => cell(relation(L, v, s[0], o[0]))).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  // prediction mode: guess the direction first, then see the number, the relationship and what was held constant
  function predictHtml(L, v, xk, yk) {
    const nums = L.i.filter(isNum), outs = L.o.filter(s => typeof v[s[0]] === 'number' && Number.isFinite(v[s[0]]));
    if (!nums.length || !outs.length) return '<p class="pg">Nothing to predict in this lab.</p>';
    xk = xk || nums[Math.floor(Math.random() * nums.length)][0]; yk = yk || outs[Math.floor(Math.random() * outs.length)][0];
    return `<div class="lb-pred" data-x="${xk}" data-y="${yk}"><p><b>🔮 Predict first.</b> If <select data-ps="x">${nums.map(s => `<option value="${s[0]}"${s[0] === xk ? ' selected' : ''}>${esc(s[1])}</option>`).join('')}</select> rises by 10 %, with every other input held as it is now, what happens to <select data-ps="y">${outs.map(s => `<option value="${s[0]}"${s[0] === yk ? ' selected' : ''}>${esc(s[1])}</option>`).join('')}</select>?</p>
      <div class="acts"><button class="btn" data-pv="1">↑ It rises</button><button class="btn" data-pv="-1">↓ It falls</button><button class="btn" data-pv="0">→ No change</button></div><div class="lb-pans" aria-live="polite"></div></div>`;
  }
  function predictAnswer(L, v, xk, yk, guess) {
    const r = relation(L, v, xk, yk), xs = L.i.find(s => s[0] === xk), ys = L.o.find(s => s[0] === yk); if (!r) return '<p class="pg">This output cannot be worked out for these values.</p>';
    const ok = r.dir === guess, held = L.i.filter(s => s[0] !== xk).map(s => `${esc(s[1])} = ${fmt(v[s[0]])}${s[2] ? ' ' + esc(s[2]) : ''}`).join(' · ');
    return `<p class="${ok ? 'up' : 'dn'}"><b>${ok ? '✓ Right.' : '✗ Not quite.'}</b> ${esc(ys[1])} ${r.dir ? (r.dir > 0 ? 'rises' : 'falls') : 'stays the same'}: ${fmt(r.y0, ys[4])} → <b>${fmt(r.y1, ys[4])}</b>${ys[2] ? ' ' + esc(ys[2]) : ''}${r.dir && Number.isFinite(r.p) ? ` (${r.p > 0 ? '+' : ''}${+r.p.toPrecision(3)} %)` : ''}.</p>
      <p>Relationship with ${esc(xs[1])}: <b>${esc(r.law)}</b>. ${r.law.startsWith('∝') ? `So doubling ${esc(xs[1])} would multiply it by ${fmt(run(L, { ...v, [xk]: v[xk] * 2 })[yk] / r.y0)}.` : ''}</p>
      <p class="pg">Held constant: ${held || '—'}. Change what is held and the answer can change — always state the constants.</p><button class="btn" data-lb="predict">Another prediction</button>`;
  }
  function bookHtml(L) {
    const lbl = k => { const s = L.i.find(x => x[0] === k) || L.o.find(x => x[0] === k); return s ? s[1].replace(/\s*\(.*\)$/, '') : k; };
    const unit = k => { const s = L.i.find(x => x[0] === k) || L.o.find(x => x[0] === k); return s && s[2] ? ' ' + s[2] : ''; };
    return `<p class="pg">These are the book's own worked numbers. The lab recomputes each one.</p>` + checks(L).map(c => `<div class="lb-ck ${c.ok ? 'ok' : 'bad'}"><b>${c.ok ? '✓' : '⚠'}</b> ${Object.entries(c.inp).map(([k, x]) => `${esc(lbl(k))} = ${fmt(x)}${esc(unit(k))}`).join(', ')}
      → ${Object.entries(c.out).map(([k, x]) => `${esc(lbl(k))} = <b>${fmt(c.got[k])}${esc(unit(k))}</b>${c.ok ? '' : ` (book: ${fmt(x)})`}`).join(', ')} <span class="pg">· ${esc(c.src)}</span>
      <button class="btn lnk" data-lb="load" data-i='${esc(JSON.stringify(c.inp))}'>Load these numbers</button></div>`).join('');
  }
  // mount a list of labs into a container; ref(L) returns the book-formula line for a lab (or '')
  function mount(box, labs, ref) {
    const state = {};
    box.innerHTML = labs.map(L => card(L, ref(L))).join('');
    const get = el => { const c = el.closest('.lab'); return [c, labs.find(L => L.id === c.dataset.lab)]; };
    const cur = (c, L) => { const g = {}; L.i.forEach(s => { const el = c.querySelector(`[data-k="${s[0]}"]${isNum(s) ? '[type="number"]' : ''}`); g[s[0]] = isNum(s) ? +el.value : el.value; }); return g; };
    function refresh(c, L) {
      const v = run(L, cur(c, L)), base = state[L.id] || (state[L.id] = run(L));
      L.o.forEach(s => {
        const el = c.querySelector(`[data-o="${s[0]}"]`); el.querySelector('b').innerHTML = `${fmt(v[s[0]], s[4])}${s[2] ? ` <small>${s[2]}</small>` : ''}`;
        const a = base[s[0]], b = v[s[0]], i = el.querySelector('i');
        if (typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b)) { i.textContent = ''; i.className = ''; return; }
        const p = a ? (b - a) / Math.abs(a) : b - a; i.className = Math.abs(p) < 5e-4 ? 'eq' : p > 0 ? 'up' : 'dn'; i.textContent = Math.abs(p) < 5e-4 ? '→' : p > 0 ? '↑' : '↓';
      });
      if (L.fig) c.querySelector('.lb-fig').innerHTML = figOf(L, v);
      const pl = c.querySelector('.lb-plot'); if (pl.dataset.on) pl.innerHTML = plotHtml(L, v, pl.dataset.sel ? JSON.parse(pl.dataset.sel) : null);
      const mo = c.querySelector('.lb-more'); if (!mo.hidden && mo.dataset.k === 'whatif') mo.innerHTML = whatIf(L, v);
    }
    box.oninput = e => {
      const el = e.target, k = el.dataset.k; if (!k) return; const [c, L] = get(el), s = L.i.find(x => x[0] === k);
      if (el.type === 'range') c.querySelector(`[data-k="${k}"][type="number"]`).value = fromPos(s, +el.value);
      else if (el.type === 'number' && isNum(s)) c.querySelector(`[data-k="${k}"][type="range"]`).value = toPos(s, Math.min(s[5], Math.max(s[4], +el.value)));
      refresh(c, L);
    };
    box.onchange = e => { const g = e.target.dataset.g; if (!g) return; const [c, L] = get(e.target), pl = c.querySelector('.lb-plot'); const sel = pl.dataset.sel ? JSON.parse(pl.dataset.sel) : {}; sel[g] = e.target.value; pl.dataset.sel = JSON.stringify(sel); refresh(c, L); };
    box.onclick = e => {
      const pv = e.target.closest('[data-pv]');
      if (pv) { const [c, L] = get(pv), pr = pv.closest('.lb-pred'), xk = pr.querySelector('[data-ps="x"]').value, yk = pr.querySelector('[data-ps="y"]').value;
        pr.querySelectorAll('[data-pv]').forEach(x => { x.disabled = true; x.classList.toggle('on', x === pv); });
        pr.querySelector('.lb-pans').innerHTML = predictAnswer(L, run(L, cur(c, L)), xk, yk, +pv.dataset.pv); return; }
      const b = e.target.closest('[data-lb]'); if (!b) return; const [c, L] = get(b), k = b.dataset.lb, mo = c.querySelector('.lb-more');
      if (k === 'reset' || k === 'load') {
        const g = k === 'load' ? JSON.parse(b.dataset.i) : {}, v = run(L, g);
        L.i.forEach(s => { c.querySelectorAll(`[data-k="${s[0]}"]`).forEach(el => { if (el.type === 'range') el.value = toPos(s, v[s[0]]); else el.value = v[s[0]]; }); });
        state[L.id] = run(L, g); refresh(c, L); if (k === 'load') c.scrollIntoView({ block: 'start', behavior: 'smooth' }); return;
      }
      if (k === 'graph') { const pl = c.querySelector('.lb-plot'); if (pl.dataset.on) { delete pl.dataset.on; pl.innerHTML = ''; b.classList.remove('on'); } else { pl.dataset.on = 1; b.classList.add('on'); refresh(c, L); } return; }
      const again = k === 'predict' && b.closest('.lb-pred');
      const same = !again && !mo.hidden && mo.dataset.k === k; c.querySelectorAll('[data-lb="whatif"],[data-lb="book"],[data-lb="predict"]').forEach(x => x.classList.remove('on'));
      if (same) { mo.hidden = true; return; }
      mo.dataset.k = k; mo.hidden = false; c.querySelector(`.acts [data-lb="${k}"]`).classList.add('on');
      mo.innerHTML = k === 'whatif' ? whatIf(L, run(L, cur(c, L))) : k === 'predict' ? predictHtml(L, run(L, cur(c, L))) : bookHtml(L);
    };
    // curve labs open with their curve showing
    labs.forEach(L => { if (L.plot) { const c = box.querySelector(`[data-lab="${L.id}"]`); const pl = c.querySelector('.lb-plot'); pl.dataset.on = 1; c.querySelector('[data-lb="graph"]').classList.add('on'); refresh(c, L); } });
  }
  window.SIMS.mount = mount;
})();
