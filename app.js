/* TNEB AE (EEE) study site — every topic of the Complete Book, a progress console and a mock test.
   Data: data/index.json (topics), data/q.json (every scorable MCQ), data/f.json (every formula), data/t/<id>.json
   (one topic). Pictures are sprite sheets, cropped with background-position and loaded when they scroll near.
   Progress: one private document per viewer (db: data/users/<id>/progress) on claude.ai, else this browser. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plain = h => { const t = document.createElement('template'); t.innerHTML = h || ''; return t.content.textContent.replace(/\s+/g, ' ').trim(); };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (r, a) => a ? Math.round(r / a * 100) : 0;
  const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2800); };
  const main = $('#main');
  try { const th = localStorage.getItem('ae-theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) {}
  const SC = { m: '#3949ab', b: '#00796b', c: '#d84315', x: '#c62828', p: '#1565c0', k: '#7b1fa2', e: '#2e7d32' };
  const PRW = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const KIND = { u: 'Question Book', b: 'Chapter MCQs', p: 'Previous-year MCQs', q: 'Question bank', g: 'GATE sums', f: 'Formula letters', k: 'Key formulas', s: 'Formula Self-Test', x: 'Past-question formulas', d: 'Numericals drill' };
  // the GitHub Pages copy (and a local preview) has the simulator inside the site and works offline
  const STANDALONE = /\.github\.io$/.test(location.hostname) || location.hostname === 'localhost';
  const SIM_URL = STANDALONE ? 'sim/transformers/#try' : 'https://claude.ai/artifact/CjRrpNTnMdHvmPpzSYDKLP#try';
  const SIM_TGT = STANDALONE ? '' : ' target="_blank" rel="noopener"';
  /* formula & concept simulators: sims/*.js, loaded the first time a Simulate tab or the Simulators page opens */
  const LABN = {"106":2,"123":2,"140":2,"154":1,"166":1,"179":1,"190":1,"201":1,"212":1,"222":2,"235":2,"339":16,"365":8,"380":15,"409":2,"417":3,"429":5,"440":13,"468":3,"475":12,"497":11,"526":9,"550":11,"572":7,"580":9,"601":4,"607":4,"614":3,"621":5,"627":15,"657":3,"663":10,"678":7,"696":7,"714":4,"723":10,"759":3,"767":13,"800":2,"807":15,"838":4,"849":6,"867":9,"888":8,"906":7,"913":4,"935":3,"941":4,"953":3,"961":10,"998":7,"1008":4,"1027":6,"1042":3,"1048":3,"1055":6};
  const SIMF = ['engine', 'c', 'x', 'p', 'k', 'e', 'm'];
  let simsP = null;
  const loadSims = () => simsP ||= SIMF.reduce((p, f) => p.then(() => new Promise((ok, no) => { const el = document.createElement('script'); el.src = `sims/${f}.js`; el.onload = ok; el.onerror = () => no(new Error('Could not load the simulator')); document.head.appendChild(el); })), Promise.resolve()).catch(e => { simsP = null; throw e; });
  // the book formula a lab is built on: its own topic first, then its home topic, then anywhere (tests/labref.js)
  function labRef(L) {
    const w = (L.rf || '').toLowerCase(); if (!w || !FA) return '';
    const rank = id => ({ f: 0, k: 1, s: 2, x: 3 })[id[0]] ?? 4;
    for (const t of [L.t, L.home, null]) {
      const hit = FA.filter(x => (t == null || x.t === t) && plain(x.nm).toLowerCase().includes(w)).sort((a, b) => (plain(b.nm).toLowerCase() === w) - (plain(a.nm).toLowerCase() === w) || rank(a.id) - rank(b.id))[0];
      if (hit) return `<b>📗 Book formula: ${esc(plain(hit.nm))}</b><span class="pg">${esc(hit.src)}${hit.t !== L.t ? ` · ${esc(short(T(hit.t)))}` : ''}</span><div class="fx">${hit.h.slice(0, 3).join('<br>')}</div>`;
    }
    return '';
  }
  // accuracy colour scale: [upper bound, tile background, tile text, bar]
  const SCALE = [[50, '#fde3e3', '#a61b1b', '#d93636'], [65, '#ffe6cf', '#94420a', '#ef7d22'], [80, '#fff3c4', '#6e5300', '#e3b100'], [90, '#e8f4d9', '#3d6b12', '#7cb342'], [101, '#d4eedd', '#145c31', '#2e8b57']];
  const tone = p => p == null ? ['#eef2f7', '#56637a', '#c9d3e0'] : SCALE.find(s => p < s[0]).slice(1);
  const ago = ts => { if (!ts) return 'never'; const d = (Date.now() / 60000 - ts) / 1440; return d < 1 ? 'today' : d < 2 ? 'yesterday' : `${Math.floor(d)} days ago`; };

  /* ---------- data ---------- */
  let IX = null, QA = null, FA = null, QBY = null, FBY = null;
  const TC = {};
  const topic = id => TC[id] || (TC[id] = get(`data/t/${id}.json`));
  const loadQ = () => QA ? Promise.resolve(QA) : get('data/q.json').then(q => { QA = q; QBY = Object.fromEntries(q.map(x => [x.id, x])); return q; });
  // the Question Book (all exams): every past question with its printed solution, as pictures
  let UA = null, UBY = null;
  const loadU = () => UA ? Promise.resolve(UA) : get('data/u.json').then(u => { UA = u; UBY = Object.fromEntries(u.map(x => [x.id, x])); return u; });
  const loadAll = () => Promise.all([loadQ(), loadF(), loadU()]);
  let REF = null, SYM = null, AZT = null;
  const loadRef = () => REF ? Promise.resolve(REF) : get('data/ref.json').then(r => REF = r);
  let DRILL = null, PRED = null;
  const loadDrill = () => DRILL ? Promise.resolve(DRILL) : get('data/drill.json').then(r => DRILL = r);
  const loadPred = () => PRED ? Promise.resolve(PRED) : get('data/pred.json').then(r => PRED = r);
  const REFH = {}, loadRefh = id => REFH[id] ? Promise.resolve(REFH[id]) : get(`data/refh/${id}.json`).then(r => REFH[id] = r);
  const loadSym = () => SYM ? Promise.resolve(SYM) : get('data/sym.json').then(r => SYM = r);
  const loadAzt = () => AZT ? Promise.resolve(AZT) : get('data/az.json').then(r => AZT = r);
  const loadF = () => FA ? Promise.resolve(FA) : get('data/f.json').then(f => { FA = f; FBY = Object.fromEntries(f.map(x => [x.id, x])); return f; });
  const T = id => IX.T.find(t => t.id === id);
  const short = t => t.t.replace(/^Code 400 · /, 'C400 · ');

  /* ---------- progress store ---------- */
  const KEY = 'tneb-ae-progress-v1';
  const EMPTY = () => ({ v: 1, t: 0, q: {}, f: {}, seen: {}, mocks: [] });
  let P = EMPTY(), where = 'browser', ref = null, saving = false, again = false, timer = 0, SV = 0, STC = null;
  try { const s = localStorage.getItem(KEY); if (s) P = { ...EMPTY(), ...JSON.parse(s) }; } catch (e) {}
  const keepLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
  async function save() {
    if (!ref) return;
    if (saving) { again = true; return; }
    saving = true;
    try { await ref.set(JSON.parse(JSON.stringify(P))); }
    catch (e) { if (e && /invalid_argument|revoked|not_granted|quota_exceeded/.test(e.code || '')) { ref = null; where = 'browser'; toast('Could not save to your account — progress is kept in this browser.'); } }
    saving = false;
    if (again) { again = false; save(); }
  }
  function changed() {
    P.t = Date.now(); SV++; STC = null; keepLocal();
    clearTimeout(timer); timer = setTimeout(save, 1500);
    paintDots();
  }
  (async () => {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const id = user ? await user.id() : null;
      if (!db || !id) return;
      const r = db.doc('data/users/' + id + '/progress');
      const snap = await Promise.race([r.get(), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 10000))]);
      ref = r; where = 'account';
      const remote = snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null;
      if (remote && (remote.t || 0) >= (P.t || 0)) { P = { ...EMPTY(), ...remote }; keepLocal(); SV++; STC = null; }
      else if (P.t) save();
      paintDots();
      if (/^(#(home|progress)?)?$/.test(location.hash) && !M) route(true);
    } catch (e) { /* keep progress in this browser */ }
  })();
  const now = () => Math.round(Date.now() / 60000);
  const topicOf = id => (String(id).match(/^[a-z](\d+|gen)\./) || [])[1];
  const isF = id => /^[fksx]/.test(id);
  function record(id, ok) {
    const m = isF(id) ? P.f : P.q, e = m[id] || (m[id] = [0, 0, 0, 0]);
    e[0]++; if (ok) e[1]++; e[2] = ok ? 1 : 0; e[3] = now();
    const t = topicOf(id); if (t) P.seen[t] = now();
    changed();
  }
  // per-topic totals, by source
  function stats() {
    if (STC) return STC;
    const by = {};
    const add = (id, e) => { const t = topicOf(id); if (!t) return; const s = by[t] || (by[t] = { a: 0, r: 0, k: {} }); s.a += e[0]; s.r += e[1]; const k = s.k[id[0]] || (s.k[id[0]] = [0, 0]); k[0] += e[0]; k[1] += e[1]; };
    for (const id in P.q) add(id, P.q[id]);
    for (const id in P.f) add(id, P.f[id]);
    let a = 0, r = 0; for (const t in by) { a += by[t].a; r += by[t].r; }
    return (STC = { by, a, r });
  }
  const accOf = id => { const s = stats().by[id]; return s && s.a ? pct(s.r, s.a) : null; };
  const weakFormulas = () => Object.entries(P.f).filter(([id, e]) => /^[fks]/.test(id) && (e[2] === 0 || (e[0] >= 2 && e[1] / e[0] < 0.7)))
    .sort((x, y) => x[1][2] - y[1][2] || x[1][1] / x[1][0] - y[1][1] / y[1][0] || y[1][3] - x[1][3]);
  const mistakes = () => Object.entries(P.q).filter(([id, e]) => e[2] === 0 && /^[bpqu]/.test(id)).sort((x, y) => y[1][3] - x[1][3]).map(([id]) => id);

  /* ---------- shell: sidebar, drawer, search ---------- */
  const side = $('#side'), scrim = $('#scrim'), menu = $('#menu');
  const drawer = o => { side.classList.toggle('open', o); scrim.hidden = !o; menu.setAttribute('aria-expanded', String(o)); };
  menu.onclick = () => drawer(!side.classList.contains('open')); scrim.onclick = () => drawer(false);
  $('#bmenu').onclick = e => { e.preventDefault(); drawer(true); };
  side.addEventListener('click', e => { if (e.target.closest('a')) drawer(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { drawer(false); if (!$('#lb').hidden) lbClose(); } });
  function sideHtml() {
    const g = {}; IX.T.forEach(t => (g[t.s] ||= []).push(t));
    side.innerHTML = `<div class="sideh"><a href="#home">🏠 All topics</a><a href="#progress">📊 My progress console</a><a href="#mock">⏱ Mock test</a><a href="#sims">⚙ Simulators</a><a href="#ref">📚 Look-up shelf</a><a href="#practice">📝 Practice papers & drills</a></div>` +
      IX.S.map(([k, n]) => `<h4 style="--c:${SC[k]}"><i></i>${esc(n)}</h4>` + (g[k] || []).map(t => `<a href="#t-${t.id}" data-tid="${t.id}"><em></em><span>${esc(short(t))}</span></a>`).join('')).join('');
    paintDots();
  }
  function paintDots() {
    if (!IX) return;
    $$('#side [data-tid]').forEach(a => { const p = accOf(a.dataset.tid); a.querySelector('em').style.setProperty('--dot', tone(p)[2]); a.title = p == null ? 'Not practised yet' : `${p} % correct`; });
  }
  function setShell(view, tid) {
    $('#shell').classList.toggle('notoc', view !== 'topic');
    $$('[data-nav]').forEach(a => a.dataset.nav === view ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    if (view !== 'topic') delete main.dataset.tid;
    main.onclick = null; main.onkeydown = null; $('#q').oninput = null;
    $$('#side [data-tid]').forEach(a => a.dataset.tid === tid ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    const q = $('#q'); q.value = ''; q.placeholder = view === 'topic' ? 'Search this topic' : 'Search all topics, formulas, questions'; q.setAttribute('aria-label', q.placeholder);
    if (!PENDQ) $('#hsearch').classList.remove('open');
    $('#toc').innerHTML = '';
  }

  /* ---------- pictures ---------- */
  const SCL = { c: 2, t: 1.25, g: 1.6 };
  function spr(sp, D, alt, kind = 'c') {
    if (!sp) return '';
    const [k, y, w, h] = sp, [f, W, H] = D.sheets[k];
    const pos = H > h ? (y / (H - h) * 100).toFixed(5) : '0';
    return `<div class="sp" role="img" aria-label="${esc(alt)}" data-src="${f}" data-w="${w}" style="aspect-ratio:${w}/${h};max-width:${w}px;background-size:${(W / w * 100).toFixed(4)}% auto;background-position:0 ${pos}%"></div>`;
  }
  function spu(r, alt) {
    if (!r) return '';
    const [f, W, H, y, w, h] = r, pos = H > h ? (y / (H - h) * 100).toFixed(5) : '0';
    return `<div class="sp" role="img" aria-label="${esc(alt)}" data-src="${f}" data-w="${w}" style="aspect-ratio:${w}/${h};max-width:${w}px;background-size:${(W / w * 100).toFixed(4)}% auto;background-position:0 ${pos}%"></div>`;
  }
  const spIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; el.style.backgroundImage = `url("${el.dataset.src}")`; el.dataset.on = 1; spIO.unobserve(el); }), { rootMargin: '900px 0px' });
  const lazy = (root = main) => $$('.sp[data-src]:not([data-on])', root).forEach(el => spIO.observe(el));
  const lb = $('#lb');
  document.addEventListener('click', e => {
    const m = e.target.closest('main .sp, .qz .sp'); if (!m || m.classList.contains('big')) return;
    const c = m.cloneNode(); c.classList.add('big'); c.style.backgroundImage = `url("${m.dataset.src}")`; c.style.setProperty('--w', Math.min(+m.dataset.w * 1.25, 1400) + 'px');
    lb.querySelector('.lbi').replaceChildren(c); lb.hidden = false; document.body.style.overflow = 'hidden';
  });
  const lbClose = () => { lb.hidden = true; if ($('#qz').hidden) document.body.style.overflow = ''; };
  $('#lbx').onclick = lbClose; lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });

  /* ---------- MCQ helpers ---------- */
  const optOf = o => { const m = plain(o).match(/^\(([A-Da-d1-4])\)/); return { l: m ? m[1] : '', h: o.replace(/^\s*\([A-Da-d1-4]\)\s*/, '') }; };
  // concept & formula of a book MCQ: previous-year MCQs from the past-question appendix (same paper + question);
  // chapter and question-bank MCQs: the chapter formula the question uses (mcq_cf.py, every pairing checked by hand)
  const mcqCf = x => x.cf ? `<div class="ucf">${x.cf.c ? `<p><b>💡 Concept:</b> ${x.cf.c}</p>` : ''}${x.cf.f && x.cf.f.length ? `<div><b>📐 ${x.cf.n ? `Formula: ${x.cf.n}` : 'Formula used:'}</b><div class="fx">${x.cf.f.join('<br>')}</div></div>` : ''}<span class="pg">${esc(x.cf.src)}</span></div>` : '';
  const explHtml = x => (x.k === 'book' ? `<p><b>Answer: ${x.ans}</b></p>` : `<p><b>Answer ${x.ans}.</b> ${x.why || ''}</p>`) + (x.wrong || []).map(w => `<p class="w">✘ ${w}</p>`).join('') + mcqCf(x);
  const mcqCard = x => {
    const os = x.o.map(optOf), noans = x.r == null;
    return `<div class="box mcq${noans ? ' noans' : ''}" data-id="${x.id}" data-s="${esc(plain(x.q + ' ' + x.o.join(' ')))}"><span class="src">${esc(x.src)}</span><div class="q">${x.q}</div>
      <div class="opts">${os.map((o, i) => `<button class="opt" data-i="${i}" ${noans ? 'disabled' : ''}><i>${esc(o.l || 'ABCD'[i])}</i><span>${o.h}</span></button>`).join('')}</div>
      ${x.cf && !noans ? `<button class="btn lnk mcf" data-mcf>💡 Concept & formula</button><div class="mcfh" hidden>${mcqCf(x)}</div>` : ''}
      ${noans ? `<div class="expl"><p><b>⚠ No option is correct as printed — the book says so, so this one is not scored.</b> ${x.why}</p>${(x.wrong || []).map(w => `<p class="w">${w}</p>`).join('')}</div>` : `<div class="expl" hidden>${explHtml(x)}</div>`}</div>`;
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-mcf]'); if (!b) return; const h = b.nextElementSibling; h.hidden = !h.hidden; b.classList.toggle('on', !h.hidden); });
  // inline MCQ cards anywhere on a page
  document.addEventListener('click', e => {
    const o = e.target.closest('.mcq .opt'); if (!o || o.closest('.qz')) return;
    const c = o.closest('.mcq'); if (c.dataset.done) return;
    const x = QBY[c.dataset.id]; if (!x || x.r == null) return;
    c.dataset.done = 1; const i = +o.dataset.i, ok = i === x.r;
    $$('.opt', c).forEach((b, j) => { if (j === x.r) b.classList.add('right'); else if (b === o) b.classList.add('wrong'); });
    $('.expl', c).hidden = false; record(x.id, ok);
    const sec = c.closest('.sec'), sc = sec && $('.score', sec);
    if (sc) { const done = $$('.mcq[data-done]', sec), r = done.filter(d => $('.opt.right.wrong', d) == null && $('.opt.wrong', d) == null).length; sc.textContent = `Score ${r}/${done.length}`; }
  });

  /* ---------- missing-letter test (one letter hidden in every copy) ----------
     A letter is a variable only when it stands alone: not inside a word (cos, load, kVA), not a unit (220 V, 24 h,
     kV/s), not the article "a", not a phase label (3-φ), never inside a subscript or superscript. */
  const LET = /[A-Za-zα-ωΑ-Ωϕφμ]/, GREEK = /[α-ωΑ-Ωϕφμ]/, UNIT = /^[VAWshΩ]$/;
  function cands(h) {
    const t = document.createElement('template'); t.innerHTML = h; const out = [];
    const walk = n => {
      if (n.nodeType === 3) {
        const s = n.nodeValue;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i]; if (!LET.test(ch)) continue;
          const pv = s[i - 1] || '', nx = s[i + 1] || '', pv2 = s.slice(Math.max(0, i - 7), i);
          if (/[A-Za-z]/.test(ch) && (/[A-Za-z]/.test(pv) || /[A-Za-z]/.test(nx))) continue;
          if (/[A-Za-z]/.test(ch) && /[A-Za-z]{3,} $/.test(pv2) && /^ ?[a-z]{2,}/.test(s.slice(i + 1))) continue;
          if (UNIT.test(ch) && /\d\s?$/.test(pv2) && !/[A-Za-z0-9]/.test(nx)) continue;
          if (UNIT.test(ch) && pv === '/' && /[A-Za-z]/.test(s[i - 2] || '')) continue;
          if (ch === 'a' && /[A-Za-z]{2,}\s$/.test(pv2) && !/^\s*[=:]/.test(s.slice(i + 1))) continue;
          if (/[φϕ]/.test(ch) && pv === '-') continue;
          if (/^[A-Z]$/.test(ch) && /(Group|Class) $/.test(pv2)) continue;
          if ((pv === '.' && /[A-Za-z]/.test(s[i - 2] || '')) || (nx === '.' && /[A-Za-z]/.test(s[i + 2] || ''))) continue;
          out.push([n, i, ch]);
        }
      } else if (n.nodeType === 1 && !/^(SUB|SUP)$/.test(n.nodeName)) n.childNodes.forEach(walk);
      else if (n.nodeType === 11) n.childNodes.forEach(walk);
    };
    walk(t.content); return { t, out };
  }
  // pool items: {id, t, nm, src, h} with one printed line in h
  const mlItems = list => list.flatMap(f => f.h.map((h, k) => ({ id: f.id, t: f.t, nm: f.nm, src: f.src + (f.h.length > 1 ? ` · line ${k + 1}` : ''), h }))).filter(p => cands(p.h).out.length);
  let LETTERS = null;
  function blankOut(it) {
    if (!LETTERS) LETTERS = [...new Set(mlItems(FA).slice(0, 600).flatMap(p => cands(p.h).out.map(c => c[2])))];
    const { t, out } = cands(it.h);
    const letters = [...new Set(out.map(c => c[2]))], ch = letters[Math.floor(Math.random() * letters.length)];
    out.filter(c => c[2] === ch).reverse().forEach(([node, i]) => {
      const tail = node.splitText(i); tail.nodeValue = tail.nodeValue.slice(1);
      const span = document.createElement('span'); span.className = 'blank'; span.textContent = '?';
      node.parentNode.insertBefore(span, tail);
    });
    const box = document.createElement('div'); box.appendChild(t.content.cloneNode(true));
    const pool = [...new Set([...LETTERS, ...letters])];
    const isG = GREEK.test(ch), up = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
    let same = pool.filter(x => x !== ch && GREEK.test(x) === isG && (isG || (x === x.toUpperCase()) === up));
    if (same.length < 3) same = pool.filter(x => x !== ch);
    if (/[φϕ]/.test(ch)) same = same.filter(x => !/[φϕ]/.test(x));
    return { html: box.innerHTML, ch, opts: shuffle([ch, ...shuffle(same).slice(0, 3)]) };
  }
  // the same letter question as a quiz/mock item
  function mlQuestion(it) {
    const { html, ch, opts } = blankOut(it);
    return { id: it.id, t: it.t, ml: true, nm: it.nm, src: `Missing-letter · ${it.src}`, q: `Which letter is hidden in every blank? <span class="ml-src">${esc(it.nm)}</span><div class="ml-q">${html}</div>`,
      opts: opts.map(o => ({ l: '', h: esc(o) })), r: opts.indexOf(ch), ex: `<p>The formula uses <b>${esc(ch)}</b> in every blank.</p>` };
  }
  // an inline missing-letter test inside a box
  function mlTest(box, list, title) {
    let order = shuffle(list.slice()), idx = 0, right = 0, wrong = [], answered = false, cur = null;
    const next = () => {
      answered = false;
      if (!order.length) { box.innerHTML = '<div class="empty">Nothing in this set yet.</div>'; return; }
      if (idx >= order.length) {
        box.innerHTML = `<div class="done"><span>You got</span><b>${right} / ${order.length}</b><span>${wrong.length ? wrong.length + ' to practise again' : 'Every letter right!'}</span>
          <div class="acts">${wrong.length ? '<button class="btn" data-ml="wrong">Retry the ones I missed</button>' : ''}<button class="btn" data-ml="again">Start a new round</button></div></div>`; return;
      }
      const it = order[idx], q = blankOut(it); cur = { ...q, it };
      box.innerHTML = `<div class="top"><b>Question ${idx + 1} of ${order.length}</b><div class="prog"><i style="width:${idx / order.length * 100}%"></i></div><span class="score">Score ${right}</span></div>
        <div><div class="nm">${esc(it.nm)}</div><div class="src2">${esc(it.src)}</div></div><div class="q">${q.html}</div>
        <div class="ch">${q.opts.map(o => `<button data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="fb" aria-live="polite"></div>
        <div class="acts"><button class="btn" data-ml="next" hidden>Next →</button><button class="btn" data-ml="skip">Skip</button></div>`;
    };
    box.onclick = e => {
      const b = e.target.closest('[data-o]');
      if (b && !answered) {
        answered = true; const ok = b.dataset.o === cur.ch; if (ok) right++; else wrong.push(cur.it);
        $$('[data-o]', box).forEach(x => { if (x.dataset.o === cur.ch) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
        $$('.blank', box).forEach(bl => { bl.textContent = cur.ch; bl.classList.add(ok ? 'ok' : 'no'); });
        $('.fb', box).innerHTML = ok ? '<b style="color:var(--grn)">Correct!</b>' : `<b style="color:var(--red)">Not quite.</b> The missing letter is <b>${esc(cur.ch)}</b>.`;
        $('.score', box).textContent = `Score ${right}`; $('[data-ml="next"]', box).hidden = false; $('[data-ml="skip"]', box).hidden = true;
        record(cur.it.id, ok); return;
      }
      const a = e.target.closest('[data-ml]'); if (!a) return;
      if (a.dataset.ml === 'next' || a.dataset.ml === 'skip') { if (!answered) { wrong.push(cur.it); record(cur.it.id, false); } idx++; next(); }
      if (a.dataset.ml === 'wrong') { order = shuffle(wrong); idx = 0; right = 0; wrong = []; next(); }
      if (a.dataset.ml === 'again') { order = shuffle(list.slice()); idx = 0; right = 0; wrong = []; next(); }
    };
    next();
  }

  /* ---------- quiz overlay: one question at a time ---------- */
  const qz = $('#qz');
  const mcqQ = x => ({ id: x.id, t: x.t, src: x.src, q: x.q, opts: x.o.map(optOf), r: x.r, ex: explHtml(x) });
  // a Question Book question for a quiz or mock: the printed question as a picture, the options as its letters
  // a solution as a flow of boxes: [[badge, html, class?], …]
  const flowHtml = items => `<ol class="flow">${items.map(([b, h, c]) => `<li${c ? ` class="${c}"` : ''}><i>${b}</i><div>${h}</div></li>`).join('')}</ol>`;
  // concept and formula line of a Question Book question, from the book's past-question appendix (paired by paper + question)
  const cfHtml = x => x.cf ? `<div class="ucf"><p><b>💡 Concept:</b> ${x.cf[0]}</p>${x.cf[1].length ? `<div><b>📐 Formula used:</b><div class="fx">${x.cf[1].join('<br>')}</div></div>` : ''}<span class="pg">From the book's past-question appendix p ${x.cf[2]}${x.cf[3] ? ` · Study Notes p ${x.cf[3]}` : ''}</span></div>` : '';
  const solHtml = x => {
    if (!x.sh) return cfHtml(x) + spu(x.ss, 'Answer and worked solution');
    const by = k => x.sh.filter(e => e[0] === k).map(e => e[1]);
    const con = by('con').map(h => h.replace(/^\s*Concept:\s*/, '')), steps = by('st').map(h => h.replace(/^\s*\d+[.)]\s*/, ''));
    const flow = [...(x.cf ? [['💡', x.cf[0], 'fc']] : con.map(h => ['💡', h, 'fc'])), ...(x.cf && x.cf[1].length ? [['📐', `<span class="fx">${x.cf[1].join('<br>')}</span>`, 'ff']] : []), ...steps.map((h, k) => [k + 1, h]), ...by('ans').map(h => ['✓', h.replace(/^\s*Answer:\s*/, ''), 'end'])];
    return `<div class="usol">${by('ans').map(h => `<p class="u-ans">${h}</p>`).join('')}<b class="flowh">Solution flow</b>${flowHtml(flow)}${x.cf ? `<span class="pg">💡 concept and 📐 formula line from the book's past-question appendix p ${x.cf[2]}${x.cf[3] ? ` · Study Notes p ${x.cf[3]}` : ''}</span>` : ''}${['why', 'mis', 'tw'].flatMap(k => by(k).map(h => `<p class="u-${k}">${h}</p>`)).join('')}</div>`;
  };
  const uQ = x => {
    const oh = x.qh != null && x.oh ? Object.fromEntries(x.oh) : null;
    return { id: x.id, t: x.t, src: `Question Book · ${x.lab} · ${x.src}`, q: oh ? `<div class="uq">${x.qh}</div>` : spu(x.qs, x.src) + '<span class="zoomhint">Tap the picture to zoom</span>',
      opts: x.L.map(l => ({ l, h: oh && oh[l] || '' })), r: x.L.indexOf(x.ok[0]), rs: x.ok.map(l => x.L.indexOf(l)), ex: solHtml(x) };
  };
  const isRight = (q, j) => q.rs ? q.rs.includes(j) : j === q.r;
  const optsHtml = (q, attr, sel) => `<div class="opts${q.opts.some(o => o.h) ? '' : ' lt'}">${q.opts.map((o, j) => `<button class="opt${sel === j ? ' sel' : ''}" ${attr}="${j}"><i>${esc(o.l || 'ABCD'[j])}</i>${o.h ? `<span>${o.h}</span>` : ''}</button>`).join('')}</div>`;
  function quiz(items, title) {
    if (!items.length) { toast('Nothing to practise here yet.'); return; }
    let i = 0, right = 0, done = false; const miss = [];
    const show = () => {
      const q = items[i]; done = false;
      qz.innerHTML = `<div class="wrap gut"><div class="top"><b>${esc(title)}</b><span>Question ${i + 1} of ${items.length}</span><span class="score">Score ${right}</span><button class="btn" data-z="close">✕ Close</button></div>
        <div class="box qcard"><div class="qs">${esc(q.src || '')}${q.t && T(q.t) ? ' · ' + esc(T(q.t).t) : ''}</div><div class="qq">${q.q}</div>
        ${optsHtml(q, 'data-zi')}
        <div class="expl" hidden></div><div class="acts"><button class="btn go" data-z="next" hidden>${i + 1 < items.length ? 'Next question →' : 'See my score'}</button></div></div></div>`;
      qz.scrollTop = 0;
    };
    const end = () => {
      qz.innerHTML = `<div class="wrap gut"><div class="top"><b>${esc(title)}</b><button class="btn" data-z="close">✕ Close</button></div>
        <div class="box qcard" style="text-align:center;justify-items:center"><span>You got</span><b style="font-size:34px;color:var(--pur)">${right} / ${items.length}</b>
        <span>${miss.length ? `${miss.length} to look at again — they are now in your progress console.` : 'All correct!'}</span>
        <div class="acts">${miss.length ? '<button class="btn" data-z="miss">Retry the ones I missed</button>' : ''}<a class="btn" href="#progress" data-z="close">Open my progress console</a></div></div></div>`;
    };
    qz.onclick = e => {
      const z = e.target.closest('[data-z]'), o = e.target.closest('[data-zi]');
      if (o && !done) {
        done = true; const q = items[i], j = +o.dataset.zi, ok = isRight(q, j); if (ok) right++; else miss.push(q);
        $$('[data-zi]', qz).forEach((b, k) => { if (isRight(q, k)) b.classList.add('right'); else if (k === j) b.classList.add('wrong'); });
        if (q.ml) $$('.blank', qz).forEach(bl => { bl.textContent = plain(q.opts[q.r].h); bl.classList.add(ok ? 'ok' : 'no'); });
        const ex = $('.expl', qz); ex.innerHTML = `<p><b class="${ok ? 'up' : 'dn'}">${ok ? 'Correct.' : 'Not quite.'}</b></p>` + q.ex; ex.hidden = false; lazy(qz);
        $('[data-z="next"]', qz).hidden = false; $('.score', qz).textContent = `Score ${right}`;
        record(q.id, ok); return;
      }
      if (!z) return;
      if (z.dataset.z === 'close') { closeQuiz(); return; }
      if (z.dataset.z === 'next') { if (++i < items.length) { show(); lazy(qz); } else end(); }
      if (z.dataset.z === 'miss') { const m = miss.slice().map(q => { const f = q.ml && FBY && FBY[q.id], it = f && mlItems([f])[0]; return it ? mlQuestion(it) : q; }); quiz(m, title + ' — retry'); }
    };
    qz.hidden = false; document.body.style.overflow = 'hidden'; show(); lazy(qz);
  }
  const closeQuiz = () => { qz.hidden = true; qz.innerHTML = ''; document.body.style.overflow = ''; if (/^(#(home|progress|t-.*)?)?$/.test(location.hash) && !M) route(true); };
  // a mixed practice set for one topic: its MCQs plus missing-letter questions on its formulas
  function topicMix(tid, n = 10) {
    const uq = shuffle((UA || []).filter(x => x.t === tid && x.ty === 'mcq')).map(uQ);
    const mc0 = shuffle(QA.filter(x => x.t === tid && x.r != null)).map(mcqQ);
    const nu = Math.min(uq.length, Math.ceil(n * (mc0.length ? 0.5 : 0.75)));
    const mc = [...mc0, ...uq.slice(nu)];
    const fl = shuffle(mlItems(FA.filter(f => f.t === tid)));
    const out = [...uq.slice(0, nu)], nm = Math.min(mc0.length, Math.ceil(n * 0.3));
    out.push(...mc.slice(0, nm));
    const seen = new Set(); for (const it of fl) { if (out.length >= n) break; if (!seen.has(it.id)) { seen.add(it.id); out.push(mlQuestion(it)); } }
    for (const q of mc.slice(nm)) { if (out.length >= n) break; out.push(q); }
    return shuffle(out);
  }

  /* ---------- offline: a service worker keeps every page you open; this saves everything at once ---------- */
  const SWV = 'ae-20261031154540';
  if (STANDALONE && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  function offlineCard() {
    if (!STANDALONE || !('caches' in window)) return '';
    let done = ''; try { done = localStorage.getItem('ae-offline') || ''; } catch (e) {}
    return `<div class="tc" style="--c:#0f766e" id="offl"><h3>📶 Use it offline</h3><div class="meta"><span>Pages you open are kept on this phone. To study with no network, save everything once (about 100 MB).${done ? ` Saved ${esc(done)}.` : ''}</span></div>
      <div class="acts"><button class="btn" data-off="data">Save notes & questions (8 MB)</button><button class="btn go" data-off="all">Save everything</button></div><div class="pg" id="offst"></div></div>`;
  }
  async function saveOffline(all) {
    const st = $('#offst'), cache = await caches.open(SWV), urls = ['./', 'index.html', 'app.js', 'theme.js', 'manifest.json', 'data/index.json', 'data/q.json', 'data/f.json', 'data/u.json', ...SIMF.map(f => `sims/${f}.js`)];
    IX.T.forEach(t => { urls.push(`data/t/${t.id}.json`); if (t.n.u) urls.push(`data/u/${t.id}.json`); });
    if (all) {
      st.textContent = 'Finding every picture…';
      for (const t of IX.T) { const D = await topic(t.id); D.sheets.forEach(([f]) => urls.push(f)); }
      (await loadU()).forEach(x => { urls.push(x.qs[0]); urls.push(x.ss[0]); });
      ['sim/transformers/', 'sim/transformers/sim.js', 'sim/transformers/progress.js'].forEach(u => urls.push(u));
    }
    const L = [...new Set(urls)]; let n = 0, bad = 0;
    for (let i = 0; i < L.length; i += 6) {
      await Promise.all(L.slice(i, i + 6).map(async u => { try { if (!(await cache.match(u))) await cache.add(u); } catch (e) { bad++; } n++; }));
      st.textContent = `Saving ${n} of ${L.length} files…`;
    }
    const when = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + (all ? ' (everything)' : ' (notes & questions)');
    try { localStorage.setItem('ae-offline', when); } catch (e) {}
    st.textContent = bad ? `Saved ${n - bad} files; ${bad} could not be saved — try again with a better connection.` : `✓ Saved ${n} files. This site now works with no network.`;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-off]'); if (!b) return; $$('[data-off]').forEach(x => x.disabled = true); saveOffline(b.dataset.off === 'all').finally(() => $$('[data-off]').forEach(x => x.disabled = false)); });

  /* ---------- theme button: Light (default) → Eye comfort → Dark ---------- */
  const themeBtn = $('#theme');
  const THEMES = [['light', '☀️', 'Light'], ['comfort', '👁️', 'Eye comfort'], ['dark', '🌙', 'Dark']];
  const curTheme = () => Math.max(0, THEMES.findIndex(t => t[0] === document.documentElement.dataset.theme));
  const paintTheme = () => { const [, ic, nm] = THEMES[curTheme()], nx = THEMES[(curTheme() + 1) % THEMES.length][2]; themeBtn.textContent = ic; themeBtn.setAttribute('aria-label', `Theme: ${nm}. Tap for ${nx}`); themeBtn.title = themeBtn.getAttribute('aria-label'); };
  themeBtn.onclick = () => { const [k, , nm] = THEMES[(curTheme() + 1) % THEMES.length]; document.documentElement.dataset.theme = k; try { localStorage.setItem('ae-theme', k); } catch (e) {} paintTheme(); toast(`${nm} mode${k === 'comfort' ? ' — warm, softer page for daytime reading' : ''}`); };
  paintTheme();

  /* ---------- router ---------- */
  let RT = 0, M = null, PENDQ = null, GOSEC = null;
  addEventListener('hashchange', () => route());
  async function route(keep) {
    if (!keep && !PENDQ) gsView = null;
    // views are plain hash names: #home, #progress, #mock, #more, #t-497, #t-497-prac
    const tok = ++RT, h = location.hash.slice(1), tm = h.match(/^t-(\d+)(?:-(learn|prac|sim|book))?$/);
    const [a, b, c] = tm ? ['t', tm[1], tm[2]] : [h];
    if (!qz.hidden && !keep) { qz.hidden = true; qz.innerHTML = ''; document.body.style.overflow = ''; }
    drawer(false);
    try {
      if (!IX) { IX = await get('data/index.json'); sideHtml(); }
      if (a === 't' && b && T(b)) return await viewTopic(b, c, tok, keep);
      if (M && a !== 'mock') toast('Your mock test is still running — open Mock test to go back to it.');
      if (a === 'progress') return await viewConsole(tok, keep);
      if (a === 'mock') return await viewMock(tok);
      if (a === 'more') return await viewMore(tok);
      if (a === 'sims') return await viewSims(tok);
      if (a === 'practice') return await viewPractice(tok);
      const dm = h.match(/^drill(?:-(\d+))?$/); if (dm) return await viewDrill(dm[1], tok);
      const pm = h.match(/^pred-(gate|tneb)$/); if (pm) return await viewPred(pm[1], tok);
      const rm = h.match(/^ref(?:-([a-z]+))?(?:-(\d+))?$/);
      if (rm) return await (rm[1] === 'sym' ? viewSym(tok) : rm[1] === 'az' ? viewAz(tok) : rm[1] === 'gate' ? viewGateIdx(tok) : rm[1] ? viewShelf(rm[1], rm[2], tok) : viewRef(tok));
      return viewHome(tok, keep);
    } catch (e) { if (tok === RT) main.innerHTML = `<div class="empty" style="margin-top:20px">Could not load this page (${esc(e.message)}). Check your connection and reload.</div>`; }
  }
  const toTop = () => scrollTo(0, 0);

  /* ---------- home: subjects and topics ---------- */
  function topicCard(t) {
    const s = stats().by[t.id], p = s && s.a ? pct(s.r, s.a) : null, [, , bar] = tone(p);
    const nq = t.n.book + t.n.pyq + t.n.qb;
    return `<a class="tc" href="#t-${t.id}" style="--c:${SC[t.s]}" data-s="${esc(t.t)}"><h3>${esc(t.t.replace(/^Code 400 · /, ''))}</h3>
      <div class="meta">${t.t.startsWith('Code 400') ? '<span class="chip c4">CODE 400</span>' : ''}${t.pr ? `<span class="chip ${t.pr}">${t.pr}</span>` : ''}${t.v === 1 ? '<span class="chip v1">VOL 1 · NOTES NOT LOADED</span>' : ''}
      ${t.asked != null ? `<span>${t.asked} asked</span>` : ''}${t.n.f ? `<span>${t.n.f} formulas</span>` : `<span>${t.n.st} formulas</span>`}${t.n.sum ? `<span>${t.n.sum} sums</span>` : ''}${t.n.u ? `<span>${t.n.u} past Qs</span>` : ''}<span>${nq} MCQs</span>${t.n.gate ? `<span>${t.n.gate} GATE</span>` : ''}</div>
      <div class="bar" style="--col:${bar}"><i style="width:${p == null ? 0 : Math.max(3, p)}%"></i></div>
      <div class="acc">${p == null ? '<span>Not practised yet</span>' : `<span><b>${p} %</b> correct</span><span>${s.a} answers</span>`}</div></a>`;
  }
  function viewHome(tok, keep) {
    setShell('home'); document.title = 'TNEB AE Study Site';
    const S = stats(), tried = IX.T.filter(t => S.by[t.id]), weak = tried.filter(t => S.by[t.id].a >= 3 && accOf(t.id) < 70).sort((x, y) => accOf(x.id) - accOf(y.id));
    const g = {}; IX.T.forEach(t => (g[t.s] ||= []).push(t));
    const tot = IX.totals;
    main.innerHTML = `<section class="hero"><h1>Every topic of your Complete Book</h1>
      <p>${IX.T.length} topics in ${IX.S.length} subjects: chapter notes with the book's own pictures, every formula, ${tot.u ? `your Question Book's ${tot.u.toLocaleString('en-IN')} past questions with full solutions, ` : ''}${tot.q} more MCQs with answers, ${tot.rows.toLocaleString('en-IN')} past-question rows, ${tot.gate} GATE sums with full solutions and a missing-letter test on ${tot.st} formulas. Answer anything and your progress console shows where to improve.</p>
      <div class="acts"><a class="btn go" href="#progress">📊 My progress console</a><a class="btn" href="#mock">⏱ Start a mock test</a><a class="btn" href="#sims">⚙ Simulators (${Object.values(LABN).reduce((a, b) => a + b, 0)} labs)</a><a class="btn" href="#ref">📚 Look-up shelf</a><a class="btn" href="#practice">📝 Practice papers & drills</a>${mistakes().length ? `<button class="btn" data-h="rev">↻ Revise my mistakes (${mistakes().length})</button>` : ''}</div>
      ${S.a ? `<p><b style="color:var(--navy)">So far:</b> ${S.a} answers, ${pct(S.r, S.a)} % correct, ${tried.length} of ${IX.T.length} topics practised.${weak.length ? ` Weakest: ${weak.slice(0, 3).map(t => `<a href="#t-${t.id}-prac">${esc(short(t))} (${accOf(t.id)} %)</a>`).join(', ')}.` : ''}</p>` : ''}</section>
      ${IX.S.map(([k, n]) => `<section class="subj" style="--c:${SC[k]}"><h2><i></i>${esc(n)} <small>${g[k].length} topics</small></h2><div class="tcards">${g[k].map(topicCard).join('')}</div></section>`).join('')}
      <section class="subj"><h2>More</h2><div class="tcards"><a class="tc" href="#more" style="--c:#56637a"><h3>Past questions not tied to a chapter page</h3><div class="meta"><span>${IX.unmapped.length} rows from Appendix A–C whose Study Notes page is not given in the book</span></div></a>
      <a class="tc" href="#ref" style="--c:#a86a00"><h3>📚 Look-up shelf</h3><div class="meta"><span>The book's look-up pages: visual tricks, geometry, mensuration, magic numbers, exam values, mental maths, unit conversions, ready-reckoner, look-alike numbers & trap factors, symbols A–Z, the A–Z formula table, comparisons, analogies and every GATE multi-concept sum</span></div></a>
      <a class="tc" href="#sims" style="--c:#0f766e"><h3>⚙ Formula & concept simulators</h3><div class="meta"><span>${Object.values(LABN).reduce((a, b) => a + b, 0)} live labs on ${Object.keys(LABN).length} topics — every EE subject and Maths; graphs, what-if tables and the book's worked numbers as checks</span></div></a>
      <a class="tc" href="${SIM_URL}"${SIM_TGT} style="--c:#2e8b57"><h3>⚙ Transformer simulator</h3><div class="meta"><span>Change voltage, frequency, load or turns and watch flux, currents, losses, efficiency and regulation respond; phasors, 3-phase, parallel operation, saturation and inrush</span></div></a>
      ${offlineCard()}</div></section>
      <footer class="foot">From your TNEB AE (EEE) Question Book (all exams: Parts 2–3, all 2,620 past questions) and Complete Book: Study Notes (Vols 2–4), previous-year questions, question bank and mock test (Vol 5), Formula Self-Test and A–Z table (Vol 6), GATE multi-concept sums (Vols 7–9), past-question rows (Appendix A–C, Vol 4). Volume 1 (Maths and Basic Engineering notes, p 106–295) is not loaded yet, so those ${IX.T.filter(t => t.v === 1).length} topics have formulas, past questions and GATE sums but no chapter notes.</footer>`;
    main.onclick = e => { if (e.target.closest('[data-h="rev"]')) reviseMistakes(); };
    if (!keep) toTop();
  }
  function reviseMistakes(tid) {
    loadAll().then(() => {
      const ids = mistakes().filter(id => !tid || topicOf(id) === tid);
      const L = ids.map(id => QBY[id] ? mcqQ(QBY[id]) : UBY[id] && UBY[id].ty === 'mcq' ? uQ(UBY[id]) : null).filter(Boolean).slice(0, 30);
      quiz(shuffle(L), tid ? `Revise my mistakes · ${T(tid).t}` : 'Revise my mistakes');
    });
  }

  /* ---------- topic page ---------- */
  const KINDCLS = { see: 't-blue', key: 't-pur', learn: 't-grn', also: 't-teal', words: 't-pur', why: 't-teal', compare: 't-yel', sums: 't-red', ratio: 't-teal', mcq: 't-pur', take: 't-yel' };
  const KSHORT = { see: 'See it', key: 'Key formula', learn: 'Formulas', also: 'Also used', words: 'Key words', why: 'Why?', compare: 'Compare', sums: 'Solved sums', ratio: 'Ratio sums', mcq: 'Practice MCQs', take: 'Takeaway' };
  const bulb = `<svg class="bulb" viewBox="0 0 48 48" aria-hidden="true"><g stroke="#1b2a4a" stroke-width="2.4" stroke-linecap="round"><path d="M24 4v5M8 12l4 3M40 12l-4 3M4 26h5M44 26h-5"/></g><circle cx="24" cy="25" r="10" fill="#ffd54a" stroke="#1b2a4a" stroke-width="2"/><rect x="19" y="34" width="10" height="7" rx="2" fill="#9aa8bf" stroke="#1b2a4a" stroke-width="2"/></svg>`;
  const lab = p => p.replace(/^(<[^>]+>)*\s*(Where|Tip|GATE PYQ|TNPSC[^:]*|Example|Asked|Note|Remember)\s*:/, (m, a, k) => `<span class="k k-${/GATE/.test(k) ? 'gate' : /TNPSC/.test(k) ? 'tnpsc' : /Tip/.test(k) ? 'tip' : /Example/.test(k) ? 'ex' : /Asked/.test(k) ? 'asked' : 'where'}">${k}:</span>`);
  const table = (t, cls) => `<div class="${cls}"><table>${t.title ? `<caption>${esc(t.title)}</caption>` : ''}<thead><tr>${t.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  // "Q. 200 kVA, 433 V, 3-φ? → 267 A Q. …" → one question per line, answer behind a button
  const oneMin = x => x.split(/(?=Q\.\s)/).filter(q => q.trim()).map(q => { const m = q.match(/^Q\.\s*(.*?)\s*→\s*(.*)$/); return m ? `<div class="mq"><span>Q. ${m[1]}</span><button class="btn rv" data-a="${esc(m[2].trim())}">Show answer</button></div>` : `<div class="mq">${q}</div>`; }).join('');
  const ansOf = s => { const a = s.steps.find(x => x[0] === 'Answer'); return a ? a[1].join(' ') : ''; };
  async function viewTopic(id, pane, tok, keep) {
    const t = T(id);
    if (!keep) { setShell('topic', id); main.innerHTML = '<p class="loading">Loading ' + esc(t.t) + '…</p>'; }
    const [D, U, DR] = await Promise.all([topic(id), t.n.u ? get(`data/u/${id}.json`).catch(() => null) : null, loadDrill().catch(() => null), loadAll()]);
    if (tok !== RT) return;
    if (keep && main.dataset.tid === id) { paintMine(D); if (U) rU && rU(); return; }
    document.title = t.t + ' · TNEB AE Study Site';
    const ch = D.ch, vn = `Vol ${D.v}`, SECS = [], PANES = { learn: [], prac: [], sim: [], book: [] };
    const sec = (pane, sid, n, title, cls, body, small = '', shortName = title) => { SECS.push([sid, n, shortName, pane]); PANES[pane].push(`<section class="sec ${cls}" id="${sid}"><h2><span class="n">${n}</span><span>${title}</span>${small ? `<small>${small}</small>` : ''}</h2><div class="in">${body}</div></section>`); };
    const myQ = QA.filter(x => x.t === id), bookQ = myQ.filter(x => x.k === 'book'), otherQ = myQ.filter(x => x.k !== 'book');
    const myF = FA.filter(f => f.t === id);

    /* Learn: the chapter in the book's own order */
    if (ch) {
      for (const s of ch.sections) {
        const cls = KINDCLS[s.kind] || 't-navy', sid = 's' + s.n, title = esc(s.title || KSHORT[s.kind] || '');
        if (s.kind === 'see') sec('learn', sid, s.n, title, cls, `<div class="diags">${ch.diagrams.map(d => `<div class="box diag ${d.wh[0] > 700 ? 'wide' : ''}" data-s="${esc(d.title + ' ' + plain(d.cap) + ' ' + d.qq)}"><h3>${esc(d.title)}</h3>${spr(d.sp, D, d.title)}${d.cap ? `<p class="cap">${d.cap}</p>` : ''}${d.qq ? `<div class="qc"><b>Quick check:</b><span>${esc(d.qq)}</span>${d.qa ? `<button class="btn rv" data-a="${esc(d.qa)}">Show answer</button>` : ''}</div>` : ''}<span class="pg">${vn} · p ${d.pg}</span></div>`).join('')}</div>`, `${ch.diagrams.length} pictures`, 'See it');
        else if (s.kind === 'key') {
          const k = ch.keys.find(x => x.n === s.n); if (!k) continue;
          sec('learn', sid, s.n, title, cls, `<div class="kgrid">${k.img ? `<div class="kb f">${spr(k.img.sp, D, 'Key formula')}</div>` : k.f ? `<div class="kb f"><div class="fx">${k.f}</div></div>` : ''}
            ${k.fields.map(([h, x, c]) => `<div class="kb" style="background:${c}"><h4>${h}</h4>${/^One-minute/.test(plain(h)) ? oneMin(x) : x}</div>`).join('')}</div>
            ${k.tables.map(tb => table(tb, 'qv')).join('')}${k.notes.map(n => /^⚠/.test(plain(n)) ? `<p class="trap">${n.replace(/^\s*⚠\s*(Trap:)?/, '<b>⚠ Trap:</b>')}</p>` : `<p class="knote">${n}</p>`).join('')}<span class="pg">${vn} · p ${k.pg}</span>`, '', 'Key formula ' + s.n);
        }
        else if (s.kind === 'learn') sec('learn', sid, s.n, title, cls, `<p class="lead">All ${ch.formulas.length} formulas of this chapter, exactly as printed, each with its letters, a tip and the past papers that asked it.</p>` +
          ch.formulas.map(f => `<div class="lf" data-s="${esc(f.name + ' ' + plain(f.f.join(' ')) + ' ' + plain(f.notes.join(' ')))}"><div class="box l"><h3>${f.n}. <b>${esc(f.name)}</b></h3>${spr(f.sp, D, f.name)}</div><div class="r" style="background:${f.nfill}">${f.notes.map(n => `<p>${lab(n)}</p>`).join('')}<p class="pg">${vn} · p ${f.pg}</p></div></div>`).join(''), `${ch.formulas.length} formulas`, 'Formulas');
        else if (s.kind === 'also') sec('learn', sid, s.n, title, cls, ch.also.map(r => `<div class="au" data-s="${esc(plain(r.t + ' ' + r.m))}"><div class="box t">${r.t}</div><span class="m">${r.m}</span></div>`).join(''), '', 'Also used');
        else if (s.kind === 'words') sec('learn', sid, s.n, title, cls, `<div class="kw">${ch.terms.map(w => `<div class="box" data-s="${esc(plain(w.term + ' ' + w.mean))}"><b>${w.term}</b><span>${w.mean}</span></div>`).join('')}</div>`, `${ch.terms.length} terms`, 'Key words');
        else if (s.kind === 'why') sec('learn', sid, s.n, title, cls, `<div class="why">${ch.why.map(w => `<div class="c">${w.cause}</div><div class="e">${w.effect}</div>`).join('')}${ch.mistakes.map(m => `<div class="m"><b>✗ Common mistake</b>${m.m}</div><div class="k"><b>✓ Correct idea</b>${m.c}</div>`).join('')}</div>`, '', 'Why?');
        else if (s.kind === 'compare') sec('learn', sid, s.n, title, cls, ch.tables.map(tb => table(tb, 'ctab')).join('') + (ch.notes9 ? `<p class="lead">${ch.notes9}</p>` : ''), `${ch.tables.length} table${ch.tables.length === 1 ? '' : 's'}`, 'Compare');
        else if (s.kind === 'sums' || s.kind === 'ratio') {
          const L = s.kind === 'sums' ? ch.sums : ch.ratio, rs = s.kind === 'ratio';
          sec('learn', sid, s.n, title, cls, (rs ? '' : '<p class="lead">Read the sum, work it out on paper, then open the steps.</p>') + L.map(x => `<div class="box ss${rs ? ' rs' : ''}" data-s="${esc(plain(x.title) + ' ' + plain(ansOf(x)))}"><h3>${x.title.replace(/^(Sum \d+\.|R\d+\.)/, '<b>$1</b>')}</h3>
            <div class="acts"><button class="btn tg" data-t="st">${rs ? 'Show rule' : 'Show steps'}</button><button class="btn tg" data-t="an">Show answer</button></div>
            <div class="st" hidden>${flowHtml(x.steps.filter(st => st[0] !== 'Answer').map(st => [esc(st[0].replace(/^Step\s*/, '')), `<span class="fx">${st[1].join('<br>')}</span>`]).concat([['✓', 'Answer — tap “Show answer”', 'end']]))}${x.sp ? `<details class="prt"><summary>View the sum as printed</summary>${spr(x.sp, D, 'Sum as printed')}</details>` : ''}</div>
            <div class="an" hidden><div class="ans">Answer: ${ansOf(x)}</div>${x.trap ? `<p class="tp">✗ ${x.trap}</p>` : ''}</div></div>`).join(''), `${L.length} sums`, KSHORT[s.kind]);
        }
        else if (s.kind === 'mcq') sec('learn', sid, s.n, title, cls, bookQ.map(mcqCard).join(''), '<span class="score"></span>', 'Practice MCQs');
        else if (s.kind === 'take') sec('learn', sid, s.n, title, cls, `<div class="takeaway"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="22" r="11" fill="#ffd54a" stroke="#1b2a4a" stroke-width="2"/><rect x="19" y="32" width="10" height="8" rx="2" fill="#9aa8bf" stroke="#1b2a4a" stroke-width="2"/></svg><span>${ch.takeaway}</span></div>`, '', 'Takeaway');
      }
    } else {
      PANES.learn.push(`<div class="tnote" style="margin-top:22px">The chapter notes for this topic are in <b>Volume 1</b> (Study Notes p ${D.a}–${D.z}), which has not been loaded into this site yet. Its formulas, previous-year questions, past-question rows and GATE sums from the other volumes are all here.</div>`);
    }
    sec('learn', 'every', '∑', 'Every formula — Formula Self-Test & A–Z table', 't-navy', `<p class="lead">The book's two formula lists for this topic, line by line (Vol 6): the Formula Self-Test (with the page of its answer) and the A–Z Formula Table.</p>
      <div class="seg" id="ev"><button data-v="st" aria-pressed="true">Formula Self-Test · ${D.st.length}</button><button data-v="az" aria-pressed="false">A–Z table · ${D.az.length}</button></div><div class="box" id="evl"></div>`, '', 'Every formula');

    /* Practice */
    sec('prac', 'mine', '★', 'My progress in this topic', 't-yel', '<div id="minebox" style="display:grid;gap:10px"></div>', '', 'My progress');
    const myDrill = DR && DR.T.find(x => x.t === id);
    if (myDrill) sec('prac', 'drill', '🔢', 'Numericals drill — one minute each', 't-teal', `<p class="lead">${myDrill.q.length} quick numericals from the Question Book's Numericals Drill (p ${myDrill.p}): solve on paper, then show the method and the answer and mark yourself. Every answer was computed by the book from the formula shown.</p>
      <div class="drl">${myDrill.q.map(x => drillCard(myDrill, x)).join('')}</div>`, `${myDrill.q.length} numericals`, 'Numericals drill');
    const UEX = { GATE: 'GATE EE', TNPSC: 'TNPSC', ESE: 'UPSC ESE', APGENCO: 'APGENCO', TANGEDCO: 'TANGEDCO AE' };
    if (U && U.q.length) {
      const nA = U.q.filter(x => x.lab[0] === 'A').length, exs = Object.keys(UEX).filter(k => U.q.some(x => x.ex === k));
      sec('prac', 'qbook', '📘', 'Question Book — every past question with its full solution', 't-blue', `<p class="lead">All ${U.q.length} past questions on this topic from your Question Book (all exams), exactly as printed, grouped by sub-topic. Answer first, then open the solution: the answer, concept, steps, why not the others, the common mistake and the exam twist.</p>
        <div class="qbar"><div class="seg" id="ubp"><button data-v="" aria-pressed="true">All · ${U.q.length}</button><button data-v="A" aria-pressed="false">Concept · ${nA}</button><button data-v="B" aria-pressed="false">Numerical · ${U.q.length - nA}</button></div>
          <div class="seg" id="ubm"><button data-v="" aria-pressed="true">All</button><button data-v="new" aria-pressed="false">Not tried</button><button data-v="wrong" aria-pressed="false">Got wrong</button></div></div>
        <div class="qbar"><div class="seg" id="ube"><button data-v="" aria-pressed="true">Every exam</button>${exs.map(k => `<button data-v="${k}" aria-pressed="false">${UEX[k]} · ${U.q.filter(x => x.ex === k).length}</button>`).join('')}</div>
          <label class="chk">Sub-topic <select id="ubs"><option value="">All ${U.subs.length} sub-topics</option>${U.subs.map((b, k) => `<option value="${k}">${esc(b[0])} · ${U.q.filter(x => x.sub === k).length}</option>`).join('')}</select></label></div>
        <div id="ulist" style="display:grid;gap:12px"></div><button class="more" id="umore" hidden></button>`, `${U.q.length} questions`, 'Question Book');
    }
    const sets = [['ch', 'Chapter formulas', myF.filter(f => /^[fk]/.test(f.id))], ['st', 'Formula Self-Test', myF.filter(f => f.id[0] === 's')],
      ['pq', 'Past-question formulas', D.rows.map((r, k) => ({ id: `x${id}.${k}`, t: id, nm: plain(r.c), src: `${r.p} · Q${r.q} · formula used, with the numbers`, h: [r.f.join('<br>')] }))]];
    const mlSets = sets.map(([k, n, L]) => [k, n, mlItems(L)]).filter(s => s[2].length);
    sec('prac', 'test', '✍', 'Missing-letter test — find the hidden letter', 't-pur', `<p class="lead">One letter is hidden in each printed formula line (every copy of it). Tap the right one. Each answer counts for that formula in your progress console.</p>
      <div class="seg" id="mlm">${mlSets.map(([k, n, L], i) => `<button data-m="${k}" aria-pressed="${i === 0}">${n} · ${L.length}</button>`).join('')}<button data-m="miss" aria-pressed="false">My missed</button></div><div class="box ml" id="ml"></div>`, '', 'Missing letter');
    if (D.st.length) sec('prac', 'flash', '🃏', 'Formula flashcards — say it, then check', 't-teal', `<p class="lead">The Formula Self-Test as cards: read the name, say or write the formula, then reveal it and mark yourself honestly.</p><div class="box ml" id="fc"></div>`, `${D.st.length} cards`, 'Flashcards');
    if (otherQ.length) sec('prac', 'pyq', 'Q', 'Previous-year & question-bank MCQs', 't-navy', `<p class="lead">Every MCQ of this topic printed in full with explanations: the topic-wise previous-year questions (Vol 5) and the question bank. Tap an option to check it.</p>` + otherQ.map(mcqCard).join(''), `<span class="score"></span>`, 'PYQ MCQs');
    if (D.gate.length) sec('prac', 'gate', 'G', 'GATE sums — EE 2007–2026', 't-red', `<p class="lead">All ${D.gate.length} sums of this topic from the book's GATE Multi-Concept Sums, with the concept chain and the full solution. Solve on paper, check, and mark yourself.</p>
      <div class="seg" id="gm"><button data-m="0" aria-pressed="true">All</button><button data-m="1" aria-pressed="false">1 mark</button><button data-m="2" aria-pressed="false">2 marks</button></div><div id="glist" style="display:grid;gap:12px"></div><button class="more" id="gmore" hidden></button>`, `${D.gate.length} sums`, 'GATE sums');
    const GN = { GATE: 'GATE EE', TNPSC: 'TNPSC Code 400', ESE: 'UPSC ESE', APGENCO: 'APGENCO', TANGEDCO: 'TANGEDCO AE' };
    if (D.rows.length) sec('prac', 'bank', 'B', 'Question bank — every past question on this topic', 't-red', `<p class="lead">All ${D.rows.length} past questions the book links to this topic's pages (Appendix A–C, Vol 4): the concept, the formula line used with that question's numbers, and the answer.</p>
      <div class="qbar"><div class="seg" id="qg"><button data-g="" aria-pressed="true">All · ${D.rows.length}</button>${Object.keys(GN).filter(g => D.rows.some(r => r.g === g)).map(g => `<button data-g="${g}" aria-pressed="false">${GN[g]} · ${D.rows.filter(r => r.g === g).length}</button>`).join('')}</div></div>
      <div id="qlist" style="display:grid;gap:10px"></div><button class="more" id="qmore" hidden></button>`, `${D.rows.length} questions`, 'Question bank');

    /* Book pages */
    if (LABN[id]) sec('sim', 'labs', '⚙', 'Formula & concept simulator', 't-teal', `<p class="lead">${LABN[id]} live labs built on this topic's formulas. Move a slider or type a value: every output updates, ↑ ↓ → show which way it moved from where you started. <b>📈 Graph</b> plots any output against any input (or the lab's own curve), <b>↕ What happens if…</b> raises each input by 10 %, and <b>✓ Book checks</b> recompute the book's own worked numbers.</p><div class="labs" id="labbox"><p class="loading">Loading the simulator…</p></div>`, `${LABN[id]} labs`, 'Simulator');
    if (ch && ch.tamil.length) sec('book', 'tamil', 'த', 'Tamil stories & concept tour', 't-grn', `<p class="lead">The book's Tamil story pages and concept tour for this topic, exactly as printed.</p>` +
      ch.tamil.map(p => `<details class="ta"><summary>${esc(p.heads.join(' · ') || 'Book page')} <span class="pg">· ${vn} p ${p.pg}</span></summary><div class="pages">${spr(p.sp, D, 'Book page ' + p.pg, 't')}</div></details>`).join(''), `${ch.tamil.length} pages`, 'Tamil pages');

    const panes = [['learn', '📖', 'Learn', ch ? 'chapter & formulas' : 'formulas'], ['prac', '✍', 'Practice', U ? `${U.q.length} past questions, tests, GATE` : 'tests, MCQs, GATE, question bank'], ...(LABN[id] ? [['sim', '⚙', 'Simulate', `${LABN[id]} live labs`]] : []), ...(PANES.book.length ? [['book', 'த', 'Tamil pages', 'stories & concept tour']] : [])];
    const i = IX.T.indexOf(t), prev = IX.T[i - 1], nxt = IX.T[i + 1];
    const subj = IX.S.find(s => s[0] === t.s)[1];
    main.dataset.tid = id;
    main.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#home">All topics</a> › ${esc(subj)} › ${esc(t.t)}</nav>
      <div class="ptitle"><div class="trow">${bulb}<div class="tband"><h1>${esc(t.t)}</h1></div><div class="tbadge" title="Topic number in the book">${esc(ch && ch.badge || '–')}</div></div>
        ${ch && ch.sub ? `<div class="tsub">${esc(ch.sub)}</div>` : `<div class="tsub">${D.st.length} formulas · ${myQ.length} MCQs · ${D.rows.length} past questions · ${D.gate.length} GATE sums</div>`}
        ${ch && ch.stats.length ? `<div class="stats">${ch.stats.map(([n, l, c]) => `<div class="stat"><b style="color:${c}">${n}</b><span>${esc(l)}</span></div>`).join('')}${ch.priority[0] ? `<div class="stat pr ${ch.priority[0].split(' ')[0]}"><b>${esc(ch.priority[0])}</b><span>${esc(ch.priority[1])}</span></div>` : ''}</div>` : ''}
        ${ch && ch.note ? `<p class="tnote">${esc(ch.note)}</p>` : ''}
        ${t.t === 'Transformers' ? `<a class="simlink" href="${SIM_URL}"${SIM_TGT}><i>⚙</i><span><b>Open the Transformer Formula & Concept Simulator${STANDALONE ? ' →' : ' ↗'}</b><small>Phasors, losses, efficiency, regulation, 3-phase, parallel operation, saturation and inrush — on the full Transformers page</small></span></a>` : ''}
        <div class="mine" id="mine"></div></div>
      <div class="pbar" role="tablist" aria-label="Parts of this topic" style="--n:${panes.length}">${panes.map(([k, ic, n, sub]) => `<button role="tab" data-pane="${k}" aria-selected="false"><i>${ic}</i><span><b>${n}</b><small>${sub}</small></span><em class="pcount" hidden></em></button>`).join('')}</div>
      <nav class="chips" id="chips" aria-label="On this page"></nav>
      ${panes.map(([k]) => `<div class="pane" data-pane="${k}" hidden>${PANES[k].join('')}</div>`).join('')}
      <div class="pn">${prev ? `<a href="#t-${prev.id}"><small>← Previous topic</small><b>${esc(prev.t)}</b></a>` : '<span></span>'}${nxt ? `<a href="#t-${nxt.id}"><small>Next topic →</small><b>${esc(nxt.t)}</b></a>` : ''}</div>
      <footer class="foot">From your TNEB AE (EEE) ${U ? 'Question Book (past questions and solutions) and ' : ''}Complete Book: ${ch ? `Study Notes chapter “${esc(t.t)}” (${vn} · p ${D.a}–${D.z}), ` : ''}Formula Self-Test and A–Z table (Vol 6), previous-year questions and question bank (Vol 5), past-question rows (Appendix A–C, Vol 4)${D.gate.length ? ', GATE multi-concept sums (Vols 7–9)' : ''}. Formulas are shown exactly as printed.</footer>`;

    // section nav for the current pane
    $('#toc').innerHTML = '<b>On this page</b>' + SECS.map(([sid, n, nm, p]) => `<a href="#" data-sec="${sid}" data-p="${p}"><i>${esc(n)}</i>${esc(nm)}</a>`).join('');
    $('#chips').innerHTML = SECS.map(([sid, n, nm, p]) => `<a href="#" data-sec="${sid}" data-p="${p}">${esc(nm)}</a>`).join('');
    const goSec = sid => { const el = document.getElementById(sid); if (!el) return; showPane(el.closest('.pane').dataset.pane); requestAnimationFrame(() => el.scrollIntoView({ block: 'start' })); };
    let cur = '';
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || e.target.id === cur) return; cur = e.target.id;
      $$('[data-sec]').forEach(a => a.classList.toggle('on', a.dataset.sec === cur));
      const c = $(`#chips [data-sec="${cur}"]`), chips = $('#chips');
      if (c && getComputedStyle(chips).display !== 'none') chips.scrollLeft = c.offsetLeft - chips.clientWidth / 2 + c.offsetWidth / 2;
    }), { rootMargin: '-30% 0px -65% 0px' });
    SECS.forEach(([sid]) => io.observe(document.getElementById(sid)));
    let pn = '';
    function showPane(p, scroll) {
      if (!panes.some(x => x[0] === p)) p = 'learn';
      if (p !== pn) {
        pn = p;
        $$('.pane', main).forEach(el => { el.hidden = el.dataset.pane !== p; });
        $$('.pbar [data-pane]', main).forEach(b => b.setAttribute('aria-selected', String(b.dataset.pane === p)));
        $$('[data-sec]').forEach(a => { a.hidden = a.dataset.p !== p; });
        try { history.replaceState(null, '', `#t-${id}${p === 'learn' ? '' : '-' + p}`); } catch (e) {}
        lazy(); if (p === 'sim') mountLabs();
      }
      if (scroll) { const top = $('.pbar', main).getBoundingClientRect().top + scrollY - 70; if (scrollY > top) scrollTo(0, top); }
    }
    let labsOn = false;
    function mountLabs() {
      if (labsOn) return; labsOn = true; const box = $('#labbox');
      Promise.all([loadSims(), loadF()]).then(() => { if (box.isConnected) SIMS.mount(box, LABS.filter(L => L.t === id), labRef); })
        .catch(e => { labsOn = false; box.innerHTML = `<div class="empty">${esc(e.message)}. Check your connection and open this tab again.</div>`; });
    }
    $('.pbar', main).onclick = e => { const b = e.target.closest('[data-pane]'); if (b) showPane(b.dataset.pane, true); };
    $('#toc').onclick = $('#chips').onclick = e => { const a = e.target.closest('[data-sec]'); if (!a) return; e.preventDefault(); goSec(a.dataset.sec); };

    // reveal buttons and sums
    main.onclick = e => {
      const rv = e.target.closest('.rv');
      if (rv) { const on = !rv.classList.contains('on'); rv.classList.toggle('on', on); rv.innerHTML = on ? rv.dataset.a : 'Show answer'; return; }
      const tg = e.target.closest('.tg');
      if (tg) { const box = $('.' + tg.dataset.t, tg.closest('.ss')); box.hidden = !box.hidden; tg.classList.toggle('on', !box.hidden); lazy(box);
        tg.textContent = tg.dataset.t === 'an' ? (box.hidden ? 'Show answer' : 'Hide answer') : tg.textContent.replace(box.hidden ? 'Hide' : 'Show', box.hidden ? 'Show' : 'Hide'); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'quiz') quiz(topicMix(id, +a.dataset.n || 10), `Practise · ${t.t}`);
      if (a.dataset.act === 'allmcq') quiz(shuffle(myQ.filter(x => x.r != null).map(mcqQ)), `All MCQs · ${t.t}`);
      if (a.dataset.act === 'rev') reviseMistakes(id);
      if (a.dataset.act === 'weakf') quiz(shuffle(weakFormulas().filter(([fid]) => topicOf(fid) === id).map(([fid]) => mlItems([FBY[fid]])[0]).filter(Boolean).map(mlQuestion)), `My weak formulas · ${t.t}`);
      if (a.dataset.act === 'go') goSec(a.dataset.sec);
    };
    $$('details.ta', main).forEach(d => d.addEventListener('toggle', () => lazy(d)));

    // every formula
    let ev = 'st';
    const rEvery = () => {
      const rows = ev === 'st' ? D.st.filter(f => hit(f[1] + ' ' + f[3])).map(f => `<div class="ef"><div class="nm">${f[0]}. ${f[1]}${f[2] ? `<small>${f[2]}</small>` : ''}<small>Vol 6 · question p ${f[4]} · answer p ${f[5]}</small></div><div class="fx">${f[3]}</div></div>`)
        : D.az.filter(a => hit(a[0] + ' ' + a[1])).map(a => `<div class="ef"><div class="nm">${a[0]}<small>Vol 6 · p ${a[2]}</small></div><div class="fx">${a[1]}</div></div>`);
      $('#evl').innerHTML = rows.join('') || '<div class="empty">No formula matches this search.</div>';
      return rows.length;
    };
    $('#ev').onclick = e => { const b = e.target.closest('button'); if (!b) return; ev = b.dataset.v; $$('#ev button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rEvery(); };

    // missing-letter test
    const mlBox = $('#ml');
    const startML = k => {
      const L = k === 'miss' ? mlSets.flatMap(s => s[2]).filter(p => (isF(p.id) ? P.f : P.q)[p.id]?.[2] === 0) : (mlSets.find(s => s[0] === k) || mlSets[0] || [, , []])[2];
      mlTest(mlBox, L, k);
    };
    $('#mlm').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#mlm button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); startML(b.dataset.m); };
    startML(mlSets[0] ? mlSets[0][0] : 'ch');

    // flashcards
    const fcBox = $('#fc');
    if (fcBox) {
      let deck = shuffle(myF.filter(f => f.id[0] === 's')), k = 0, knew = 0;
      const show = () => {
        if (k >= deck.length) { fcBox.innerHTML = `<div class="done"><span>You knew</span><b>${knew} / ${deck.length}</b><div class="acts"><button class="btn" data-fc="again">Shuffle and start again</button></div></div>`; return; }
        const f = deck[k];
        fcBox.innerHTML = `<div class="top"><b>Card ${k + 1} of ${deck.length}</b><div class="prog"><i style="width:${k / deck.length * 100}%"></i></div><span class="score">Knew ${knew}</span></div>
          <div><div class="nm">${esc(f.nm)}</div>${f.hint ? `<div class="hint">${f.hint}</div>` : ''}<div class="src2">${esc(f.src)}</div></div>
          <div class="q hide">${f.h[0]}</div><div class="acts"><button class="btn go" data-fc="show">Show the formula</button><button class="btn ok" data-fc="yes" hidden>✓ I knew it</button><button class="btn no" data-fc="no" hidden>✗ I didn't</button></div>`;
      };
      fcBox.onclick = e => {
        const b = e.target.closest('[data-fc]'); if (!b) return;
        if (b.dataset.fc === 'show') { $('.q', fcBox).classList.remove('hide'); b.hidden = true; $('[data-fc="yes"]', fcBox).hidden = $('[data-fc="no"]', fcBox).hidden = false; return; }
        if (b.dataset.fc === 'yes' || b.dataset.fc === 'no') { const ok = b.dataset.fc === 'yes'; if (ok) knew++; record(deck[k].id, ok); k++; show(); return; }
        if (b.dataset.fc === 'again') { deck = shuffle(deck); k = 0; knew = 0; show(); }
      };
      show();
    }

    // GATE sums
    let gm = 0, gshown = 5, nG = 0;
    const rGate = () => {
      const rows = D.gate.filter(g => (!gm || g.m === gm) && hit(g.src + ' q' + g.q + ' ' + g.a + ' ' + plain(g.l.join(' ')))).sort((a, b) => +(b.src.match(/\d{4}/) || [0])[0] - +(a.src.match(/\d{4}/) || [0])[0]);
      nG = rows.length;
      $('#glist').innerHTML = rows.slice(0, gshown).map(g => { const e = P.q[`g${id}.${g.i}`];
        return `<article class="box gs" data-g="${g.i}"><header><b>${esc(g.src)} · Q.${esc(g.q)}</b><span class="mk ${g.m === 2 ? 'two' : ''}">${g.m} mark${g.m > 1 ? 's' : ''}</span><span class="pg">p ${g.pg}</span></header>
        <div class="im">${spr(g.qs, D, `${g.src} Q.${g.q}`, 'g')}</div>
        <div class="chain" hidden>${flowHtml(g.l.map((c, k) => [k + 1, g.lr ? c + (g.lr[k] ? `<span class="fr">${g.lr[k]}</span>` : '') : esc(c)]).concat([['✓', 'Answer: tap “Answer”', 'end']]))}</div>
        <div class="acts"><button class="btn gt" data-k="chain">🧭 Solution flow</button><button class="btn gt" data-k="ans">Answer</button><button class="btn gt" data-k="sol">Full solution</button>
          <span class="self">${e ? `Last time: <b>${e[2] ? '✓ got it' : '✗ missed'}</b>` : 'Did you get it?'}</span><button class="btn ok" data-gs="1">✓ Got it</button><button class="btn no" data-gs="0">✗ Missed</button></div>
        <div class="ans" hidden>Answer: ${esc(g.a)}</div><div class="sol im" hidden>${spr(g.ss, D, 'Worked solution', 'g')}</div></article>`; }).join('') || '<div class="empty">No GATE sum matches this search.</div>';
      const m = $('#gmore'); m.hidden = rows.length <= gshown; m.textContent = `Show ${Math.min(5, rows.length - gshown)} more (${rows.length - gshown} left)`;
      lazy($('#glist'));
    };
    if ($('#glist')) {
      $('#gmore').onclick = () => { gshown += 5; rGate(); };
      $('#gm').onclick = e => { const b = e.target.closest('button'); if (!b) return; gm = +b.dataset.m; gshown = 5; $$('#gm button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rGate(); };
      $('#glist').onclick = e => {
        const s = e.target.closest('[data-gs]');
        if (s) { const g = s.closest('.gs'); record(`g${id}.${g.dataset.g}`, s.dataset.gs === '1'); $('.self', g).innerHTML = `Saved: <b>${s.dataset.gs === '1' ? '✓ got it' : '✗ missed'}</b>`; return; }
        const b = e.target.closest('.gt'); if (!b) return; const box = $('.' + b.dataset.k, b.closest('.gs')); box.hidden = !box.hidden; b.classList.toggle('on', !box.hidden); lazy(box);
      };
    }

    // past-question rows
    let qg = '', qshown = 12, nB = 0;
    const rBank = () => {
      const rows = D.rows.filter(r => (!qg || r.g === qg) && hit(r.p + ' q' + r.q + ' ' + r.c + ' ' + r.f.join(' ') + ' ' + r.a)); nB = rows.length;
      $('#qlist').innerHTML = rows.slice(0, qshown).map(rowCard).join('') || '<div class="empty">No question matches this search.</div>';
      const m = $('#qmore'); m.hidden = rows.length <= qshown; m.textContent = `Show ${Math.min(12, rows.length - qshown)} more (${rows.length - qshown} left)`;
    };
    if ($('#qlist')) {
      $('#qmore').onclick = () => { qshown += 12; rBank(); };
      $('#qg').onclick = e => { const b = e.target.closest('button'); if (!b) return; qg = b.dataset.g; qshown = 12; $$('#qg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rBank(); };
    }

    // Question Book
    let uf = { p: '', m: '', e: '', s: '' }, ushown = 6, nU = 0;
    rU = () => {
      if (!$('#ulist')) return;
      const L = U.q.filter(x => (!uf.p || x.lab[0] === uf.p) && (!uf.e || x.ex === uf.e) && (uf.s === '' || x.sub === +uf.s)
        && (!uf.m || (uf.m === 'new' ? !P.q[x.id] : P.q[x.id] && P.q[x.id][2] === 0)) && hit(x.lab + ' ' + x.src + ' ' + x.c + ' ' + x.x + ' ' + (U.subs[x.sub] || [''])[0]));
      nU = L.length;
      $('#ulist').innerHTML = L.slice(0, ushown).map(x => uCard({ ...x, ...(UBY[x.id] || {}) }, U)).join('') || '<div class="empty">No question matches these filters.</div>';
      const m = $('#umore'); m.hidden = L.length <= ushown; m.textContent = `Show ${Math.min(6, L.length - ushown)} more (${L.length - ushown} left)`;
      lazy($('#ulist'));
    };
    if ($('#ulist')) {
      $('#umore').onclick = () => { ushown += 6; rU(); };
      const segf = (sel, key) => { $(sel).onclick = e => { const b = e.target.closest('button'); if (!b) return; uf[key] = b.dataset.v; ushown = 6; $$(sel + ' button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rU(); }; };
      segf('#ubp', 'p'); segf('#ubm', 'm'); segf('#ube', 'e');
      $('#ubs').onchange = e => { uf.s = e.target.value; ushown = 6; rU(); };
      $('#ulist').onclick = e => uAnswer(e, U);
      $('#ulist').onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('unum')) { e.preventDefault(); uAnswer({ target: e.target.closest('.ub').querySelector('[data-uact="chk"]') }, U); } };
    }

    // search within the topic
    let q = '';
    function hit(s) { return !q || q.split(' ').every(w => plain(String(s)).toLowerCase().includes(w)); }
    const applySearch = () => {
      $$('[data-s]', main).forEach(el => el.classList.toggle('hidden-by-search', !hit(el.dataset.s)));
      const ne = rEvery(); if ($('#glist')) { gshown = 5; rGate(); } if ($('#qlist')) { qshown = 12; rBank(); } if ($('#ulist')) { ushown = 6; rU(); }
      $$('.pbar [data-pane]', main).forEach(b => {
        const k = b.dataset.pane, el = $('.pcount', b); if (!q) { el.hidden = true; return; }
        el.textContent = $$(`.pane[data-pane="${k}"] [data-s]:not(.hidden-by-search)`, main).length + (k === 'prac' ? nB + nG + nU : k === 'learn' ? ne : 0); el.hidden = false;
      });
    };
    $('#q').oninput = e => { clearTimeout(window.__st); window.__st = setTimeout(() => { q = e.target.value.trim().toLowerCase().replace(/\s+/g, ' '); applySearch(); }, 160); };

    rEvery(); if ($('#glist')) rGate(); if ($('#qlist')) rBank(); if ($('#ulist')) rU();
    paintMine(D);
    showPane(pane || 'learn'); toTop(); lazy();
    if (GOSEC) { const el = document.getElementById(GOSEC); GOSEC = null; if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' })); }
    if (PENDQ) { const w = PENDQ; PENDQ = null; gsView = null; $('#q').value = w; $('#hsearch').classList.add('open'); q = w.toLowerCase().replace(/\s+/g, ' '); applySearch();
      const first = pane === 'prac' ? ($('#qbook') && nU ? $('#qbook') : $('.pane[data-pane="prac"] .sec:not(#mine)')) : null;
      if (first) requestAnimationFrame(() => first.scrollIntoView({ block: 'start' })); }
  }
  let rU = null;
  const uState = x => { const e = P.q[x.id]; return e ? `<span class="pg ${e[2] ? 'up' : 'dn'}">${e[2] ? '✓ right last time' : '✗ wrong last time'} · ${e[1]}/${e[0]}</span>` : ''; };
  function uCard(x, U) {
    const sub = U.subs[x.sub] || ['', ''];
    const ui = x.ty === 'mcq' || x.ty === 'msq' ? x.L.map(l => `<button class="btn uo" data-l="${l}">${l}</button>`).join('') + (x.ty === 'msq' ? '<button class="btn go" data-uact="chk">Check</button><span class="pg">select every correct option</span>' : '')
      : x.ty === 'nat' ? '<input class="unum" type="text" inputmode="decimal" placeholder="Your answer" aria-label="Your numerical answer"><button class="btn go" data-uact="chk">Check</button>'
      : `<span class="pg">${/^MTA/.test(x.ans) ? 'Marks to all — the official key gave every candidate the marks.' : 'No option is correct as printed.'} Not scored.</span>`;
    return `<article class="box gs ub" data-u="${x.id}"><header><b>${x.lab}</b><span class="ex ex-${x.ex}">${esc(x.src)}</span>${uState(x)}<span class="pg">p ${x.pg}</span></header>
      ${sub[0] ? `<div class="usub"><b>${esc(sub[0])}</b>${sub[1] ? ` · ${esc(sub[1])}` : ''}</div>` : ''}
      ${x.qh != null ? `<div class="uq">${x.qh}${x.oh && x.oh.length ? `<ol class="uopts">${x.oh.map(([l, h]) => `<li><b>(${l})</b> ${h}</li>`).join('')}</ol>` : ''}</div>
        <div class="im print${x.wide ? ' wide' : ''}" hidden>${spu(x.qs, x.src)}</div>` : `<div class="im${x.wide ? ' wide' : ''}">${spu(x.qs, x.src)}<span class="zoomhint">${x.wide ? 'Swipe sideways to read the whole line · tap to zoom' : 'Tap the picture to zoom'}</span></div>`}
      <div class="acts">${ui}${x.cf ? '<button class="btn" data-uact="cf">💡 Concept & formula</button>' : ''}<button class="btn" data-uact="sol">Show solution</button>${x.qh != null ? '<button class="btn" data-uact="print">View as printed</button>' : ''}</div><div class="ucfh" hidden>${cfHtml(x)}</div><div class="ufb" hidden></div>
      <div class="sol" hidden>${x.sh ? solHtml(x) + `<button class="btn lnk" data-uact="sprint">View the solution as printed</button><div class="im sprint" hidden>${spu(x.ss, 'Answer and worked solution')}</div>` : `<div class="im">${spu(x.ss, 'Answer and worked solution')}</div>`}</div></article>`;
  }
  function uAnswer(e, U) {
    const card = e.target.closest('.ub'); if (!card) return;
    const x0 = U.q.find(q => q.id === card.dataset.u), x = { ...x0, ...((UBY && UBY[x0.id]) || {}) }, b = e.target.closest('.uo, [data-uact]'); if (!b) return;
    const sol = $('.sol', card), fb = $('.ufb', card), showSol = () => { sol.hidden = false; lazy(card); $('[data-uact="sol"]', card).textContent = 'Hide solution'; };
    if (b.dataset.uact === 'cf') { const h = $('.ucfh', card); h.hidden = !h.hidden; b.classList.toggle('on', !h.hidden); return; }
    if (b.dataset.uact === 'sol') { sol.hidden = !sol.hidden; b.textContent = sol.hidden ? 'Show solution' : 'Hide solution'; lazy(card); return; }
    if (b.dataset.uact === 'print' || b.dataset.uact === 'sprint') { const im = $(b.dataset.uact === 'print' ? '.print' : '.sprint', card); im.hidden = !im.hidden; b.textContent = (im.hidden ? 'View ' : 'Hide ') + (b.dataset.uact === 'print' ? 'as printed' : 'the solution as printed'); lazy(card); return; }
    if (card.dataset.done) return;
    let ok;
    if (b.classList.contains('uo')) {
      if (x.ty === 'msq') { b.classList.toggle('sel'); return; }
      ok = x.ok.includes(b.dataset.l);
      $$('.uo', card).forEach(o => { if (x.ok.includes(o.dataset.l)) o.classList.add('right'); else if (o === b) o.classList.add('wrong'); });
    } else if (b.dataset.uact === 'chk' && x.ty === 'msq') {
      const sel = $$('.uo.sel', card).map(o => o.dataset.l); if (!sel.length) { toast('Select at least one option.'); return; }
      ok = sel.length === x.ok.length && sel.every(l => x.ok.includes(l));
      $$('.uo', card).forEach(o => { if (x.ok.includes(o.dataset.l)) o.classList.add('right'); else if (o.classList.contains('sel')) o.classList.add('wrong'); });
    } else if (b.dataset.uact === 'chk' && x.ty === 'nat') {
      const v = parseFloat($('.unum', card).value.replace('−', '-').replace(/,/g, '')); if (!Number.isFinite(v)) { toast('Type a number first.'); return; }
      const [val, lo, hi] = x.ok;
      ok = lo != null ? v >= Math.min(lo, hi) - 1e-9 && v <= Math.max(lo, hi) + 1e-9 : Math.abs(v - val) <= Math.max(Math.abs(val) * 0.01, 0.01);
    } else return;
    card.dataset.done = 1; record(x.id, ok);
    fb.innerHTML = ok ? '<b class="up">Correct!</b>' : `<b class="dn">Not quite.</b> The answer is <b>${esc(x.ans)}</b>.`; fb.hidden = false;
    showSol();
  }
  const rowCard = r => `<article class="box qr"><header><span class="ex ex-${r.g}">${esc(r.p)}</span><b>Q${esc(r.q)}</b><span class="pg">Study Notes p ${r.pg ?? '–'} · Appendix p ${r.at}</span></header>
    <div class="cn">${r.c}</div><div class="fx fl">${r.f.join('<br>')}</div><div class="acts"><button class="btn rv" data-a="Answer: ${esc(r.a)}">Show answer</button></div></article>`;
  // the "you" strip under the title and the My progress section of a topic
  function paintMine(D) {
    const id = D.id, s = stats().by[id], p = s && s.a ? pct(s.r, s.a) : null, mis = mistakes().filter(x => topicOf(x) === id).length;
    const wf = weakFormulas().filter(([fid]) => topicOf(fid) === id);
    const m = $('#mine');
    if (m) m.innerHTML = s ? `<span>You: <b>${s.a}</b> answers · <b style="color:${tone(p)[1]}">${p} %</b> correct · last practised ${ago(P.seen[id])}${mis ? ` · <b>${mis}</b> mistakes to revise` : ''}</span><button class="btn go" data-act="quiz">Practise 10 →</button>`
      : `<span>Not practised yet. A quick 10-question set mixes this topic's MCQs with its formulas.</span><button class="btn go" data-act="quiz">Practise 10 →</button>`;
    const box = $('#minebox'); if (!box) return;
    const ks = s ? Object.entries(s.k) : [];
    box.innerHTML = `<div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))"><div class="kpi"><b>${s ? s.a : 0}</b><span>answers</span></div><div class="kpi"><b>${p == null ? '–' : p + ' %'}</b><span>correct</span></div><div class="kpi"><b>${mis}</b><span>mistakes to revise</span></div><div class="kpi"><b>${wf.length}</b><span>weak formulas</span></div></div>
      ${ks.length ? `<div class="srcs">${ks.map(([k, [a, r]]) => `<span class="${a >= 3 && pct(r, a) < 70 ? 'bad' : a >= 3 && pct(r, a) >= 85 ? 'good' : ''}">${KIND[k]}: ${r}/${a} · ${pct(r, a)} %</span>`).join('')}</div>` : ''}
      <div class="acts"><button class="btn go" data-act="quiz" data-n="10">Practise 10 mixed</button><button class="btn" data-act="quiz" data-n="25">Practise 25 mixed</button><button class="btn" data-act="allmcq">All ${QA.filter(x => x.t === id && x.r != null).length} MCQs</button>
      ${mis ? `<button class="btn" data-act="rev">↻ Revise my ${mis} mistakes</button>` : ''}${wf.length ? `<button class="btn" data-act="weakf">✍ My ${wf.length} weak formulas</button>` : ''}<a class="btn" href="#progress">📊 Full console</a></div>
      ${wf.length ? `<div class="wf">${wf.slice(0, 6).map(([fid, e]) => { const f = FBY[fid]; return f ? `<div class="wfi"><span><b>${esc(f.nm)}</b><small>${esc(f.src)} · ${e[1]}/${e[0]} right · last ${e[2] ? 'right' : 'wrong'}</small></span><span></span><div class="fx">${f.h[0]}</div></div>` : ''; }).join('')}</div>` : ''}`;
  }

  /* ---------- progress console ---------- */
  async function viewConsole(tok, keep) {
    const y = scrollY;
    setShell('progress'); if (!keep) main.innerHTML = '<p class="loading">Loading your progress…</p>';
    await loadAll(); if (tok !== RT) return;
    document.title = 'My progress · TNEB AE Study Site';
    const S = stats(), by = S.by, tried = IX.T.filter(t => by[t.id] && by[t.id].a), wf = weakFormulas(), mis = mistakes();
    const g = {}; IX.T.forEach(t => (g[t.s] ||= []).push(t));
    const nF = Object.keys(P.f).filter(k => /^[fks]/.test(k)).length;
    // what to study next: weakness × exam priority, plus topics never started and topics not revised for a while
    const rec = IX.T.map(t => {
      const s = by[t.id], w = 1 + (PRW[t.pr] || (t.v === 1 ? 1.5 : 0.8)), p = s && s.a ? pct(s.r, s.a) : null, d = P.seen[t.id] ? (now() - P.seen[t.id]) / 1440 : null;
      let sc, why;
      if (!s || !s.a) { sc = 0.45 * w; why = 'not started yet'; }
      else if (s.a < 3) { sc = 0.5 * w; why = `only ${s.a} answer${s.a > 1 ? 's' : ''} so far`; }
      else if (p < 70) { sc = (1 - p / 100) * w + 0.2; why = `${p} % correct in ${s.a} answers`; }
      else if (d != null && d > 10) { sc = 0.3 * w; why = `${p} % correct, but last practised ${Math.floor(d)} days ago`; }
      else { sc = (1 - p / 100) * w * 0.6; why = `${p} % correct in ${s.a} answers`; }
      return { t, sc, why, p };
    }).sort((x, y) => y.sc - x.sc).slice(0, 6);
    const kpi = (b, s) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`;
    const subj = IX.S.map(([k, n]) => { let a = 0, r = 0, c = 0; g[k].forEach(t => { if (by[t.id]) { a += by[t.id].a; r += by[t.id].r; c++; } }); return { k, n, a, r, c, tot: g[k].length }; });
    const rowsT = tried.map(t => ({ t, s: by[t.id], p: pct(by[t.id].r, by[t.id].a) })).sort((x, y) => x.p - y.p || y.s.a - x.s.a);
    // Question Book answers by exam, and by the book's own sub-topics (the finest "where to improve")
    const exA = {}, subA = {};
    for (const id in P.q) {
      const x = id[0] === 'u' && UBY[id]; if (!x) continue; const e = P.q[id];
      const a = exA[x.ex] || (exA[x.ex] = [0, 0]); a[0] += e[0]; a[1] += e[1];
      if (x.sb) { const k = x.t + '|' + x.sb, b = subA[k] || (subA[k] = { k, t: x.t, sb: x.sb, a: 0, r: 0 }); b.a += e[0]; b.r += e[1]; }
    }
    const weakSubs = Object.values(subA).filter(b => b.a >= 2 && b.r / b.a < 0.7).sort((x, y) => x.r / x.a - y.r / y.a || y.a - x.a).slice(0, 12);
    const EXN = { GATE: 'GATE EE', TNPSC: 'TNPSC Code 400', ESE: 'UPSC ESE', APGENCO: 'APGENCO AE', TANGEDCO: 'TANGEDCO AE' };
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › My progress</div>
    <div class="con">
      <section class="panel"><h2>📊 My progress console <small>where and which topics to improve</small></h2>
        <p class="status">${where === 'account' ? '✓ Saved to your account — private to you and kept on every device you open this site on.' : '✓ Saved in this browser. Open the site on claude.ai while signed in to keep it in your account.'}</p>
        <div class="kpis">${kpi(S.a, 'answers')}${kpi(S.a ? pct(S.r, S.a) + ' %' : '–', 'correct overall')}${kpi(`${tried.length}/${IX.T.length}`, 'topics practised')}${kpi(nF, 'formulas tested')}${kpi(mis.length, 'mistakes to revise')}${kpi(P.mocks.length ? Math.max(...P.mocks.map(m => m.pc)) + ' %' : '–', `best mock · ${P.mocks.length} taken`)}</div>
        <div class="acts"><a class="btn go" href="#mock">⏱ Start a mock test</a>${mis.length ? `<button class="btn" data-c="rev">↻ Revise my ${mis.length} mistakes</button>` : ''}${wf.length ? `<button class="btn" data-c="wf">✍ Practise my ${wf.length} weak formulas</button>` : ''}${rec.length ? `<button class="btn" data-c="weakmix">🎯 20 questions from my weakest topics</button>` : ''}</div>
        ${!S.a ? '<p>Nothing answered yet. Every MCQ, missing-letter question, flashcard, GATE self-check and mock test you do on any topic page lands here, so this console can show where you are weak.</p>' : ''}</section>

      <section class="panel"><h2>🎯 Study next <small>weakness × exam priority (HIGH / MEDIUM / LOW from the book)</small></h2>
        <div class="next">${rec.map((r, i) => `<div class="nx" style="--col:${r.p == null ? '#13265a' : tone(r.p)[2]}"><i>${i + 1}</i><span><b>${esc(r.t.t)}</b><small>${r.t.pr ? r.t.pr + ' priority' + (r.t.rank ? ' · ' + esc(r.t.rank) : '') + ' · ' : ''}${esc(r.why)}</small></span>
          <span class="acts"><a class="btn" href="#t-${r.t.id}">Study</a><button class="btn go" data-c="prac" data-t="${r.t.id}">Practise</button></span></div>`).join('')}</div></section>

      <section class="panel"><h2>🗺 Every topic at a glance <small>colour = % correct · red border = HIGH priority</small></h2>
        <div class="legend"><span><i style="background:#eef2f7"></i>not tried</span><span><i style="background:${SCALE[0][1]}"></i>below 50 %</span><span><i style="background:${SCALE[1][1]}"></i>50–64 %</span><span><i style="background:${SCALE[2][1]}"></i>65–79 %</span><span><i style="background:${SCALE[3][1]}"></i>80–89 %</span><span><i style="background:${SCALE[4][1]}"></i>90 % +</span><span><i class="hi"></i>HIGH priority</span></div>
        <div class="heat">${IX.S.map(([k, n]) => `<div class="hrow" style="--c:${SC[k]}"><b><i></i>${esc(n)}</b><div class="tiles">${g[k].map(t => { const s = by[t.id], p = s && s.a ? pct(s.r, s.a) : null, [bg, fg] = tone(p);
          return `<a class="tile ${t.pr}" href="#t-${t.id}-prac" style="--tb:${bg};--tf:${fg}" title="${esc(t.t)}${p == null ? ' — not tried' : ` — ${p} % of ${s.a}`}"><span>${esc(short(t))}</span><b>${p == null ? '–' : p + ' %'}</b><small>${s ? s.a + ' ans' : t.pr || ''}</small></a>`; }).join('')}</div></div>`).join('')}</div></section>

      <section class="panel"><h2>📚 By subject</h2><div class="sbars">${subj.map(s => `<div class="sb"><b style="color:${SC[s.k]}">${esc(s.n)}</b><div class="bar" style="--col:${tone(s.a ? pct(s.r, s.a) : null)[2]}"><i style="width:${s.a ? Math.max(3, pct(s.r, s.a)) : 0}%"></i></div><small>${s.a ? `${pct(s.r, s.a)} % · ${s.a} ans · ${s.c}/${s.tot} topics` : `not started · ${s.tot} topics`}</small></div>`).join('')}</div></section>

      <section class="panel"><h2>🏛 By exam <small>your Question Book answers</small></h2>${Object.keys(exA).length ? `<div class="sbars">${Object.keys(EXN).filter(k => exA[k]).map(k => { const [a, r] = exA[k], p = pct(r, a);
          return `<div class="sb"><b>${EXN[k]}</b><div class="bar" style="--col:${tone(p)[2]}"><i style="width:${Math.max(3, p)}%"></i></div><small>${p} % · ${a} answers</small></div>`; }).join('')}</div>` : '<p>Answer Question Book questions on any topic page (Practice tab) and your accuracy for each exam shows here.</p>'}</section>

      <section class="panel"><h2>🔎 Weak sub-topics <small>the Question Book's own sub-topics, below 70 % with 2+ answers</small></h2>${weakSubs.length ? `<div class="wf">${weakSubs.map(b => `<div class="wfi"><span><b>${esc(b.sb)}</b><small>${esc(T(b.t) ? T(b.t).t : '')} · ${b.r}/${b.a} right</small></span><span class="acts"><a class="btn" href="#t-${b.t}-prac">Open topic</a><button class="btn go" data-c="subq" data-k="${esc(b.k)}">Practise</button></span></div>`).join('')}</div>` : '<p>None yet. Each Question Book question belongs to a sub-topic of its chapter (for example “EMF equation” in Transformers); once you have missed some, the weakest show here.</p>'}</section>

      <section class="panel"><h2>📉 Topics, weakest first <small>${tried.length ? `${rowsT.filter(r => r.s.a >= 3 && r.p < 70).length} weak (3+ answers, below 70 %)` : ''}</small></h2>
        ${tried.length ? `<table class="ttab"><thead><tr><th>Topic</th><th>Correct</th><th>Answers</th><th>By source</th><th>Last</th><th></th></tr></thead><tbody>${rowsT.map(({ t, s, p }) => `<tr><td data-l="Topic"><a href="#t-${t.id}">${esc(t.t)}</a>${t.pr ? ` <span class="chip ${t.pr}">${t.pr}</span>` : ''}</td>
          <td class="num" data-l="Correct"><span class="bar" style="--col:${tone(p)[2]}"><i style="width:${Math.max(3, p)}%"></i></span>${p} %</td><td class="num" data-l="Answers">${s.a}</td>
          <td data-l="By source"><div class="srcs">${Object.entries(s.k).map(([k, [a, r]]) => `<span class="${a >= 3 && pct(r, a) < 70 ? 'bad' : a >= 3 && pct(r, a) >= 85 ? 'good' : ''}">${KIND[k]} ${pct(r, a)} %</span>`).join('')}</div></td>
          <td class="num" data-l="Last">${ago(P.seen[t.id])}</td><td><span class="acts"><a class="btn" href="#t-${t.id}">Study</a><button class="btn go" data-c="prac" data-t="${t.id}">Practise</button></span></td></tr>`).join('')}</tbody></table>` : '<p>Practise any topic and it appears here, weakest first.</p>'}</section>

      <section class="panel"><h2>✍ Weak formulas <small>missed last time, or below 70 % — from the missing-letter test and flashcards</small></h2>
        ${wf.length ? `<div class="wf">${wf.slice(0, 15).map(([fid, e]) => { const f = FBY[fid]; if (!f) return ''; const t = T(f.t);
          return `<div class="wfi"><span><b>${esc(f.nm)}</b><small>${esc(t ? t.t : '')} · ${esc(f.src)} · ${e[1]}/${e[0]} right · last ${e[2] ? 'right' : 'wrong'} ${ago(e[3])}</small></span><a class="btn" href="#t-${f.t}">Open topic</a><div class="fx">${f.h[0]}</div></div>`; }).join('')}</div>
          ${wf.length > 15 ? `<p>…and ${wf.length - 15} more.</p>` : ''}<div class="acts"><button class="btn go" data-c="wf">Practise these formulas</button></div>` : '<p>No weak formulas yet. Use the missing-letter test and flashcards on any topic page.</p>'}</section>

      <section class="panel"><h2>⏱ Mock tests <small>last ${Math.min(P.mocks.length, 30)}</small></h2>
        ${P.mocks.length ? `<table class="ttab"><thead><tr><th>Date</th><th>Score</th><th>Right / wrong / blank</th><th>Weakest topics in this mock</th></tr></thead><tbody>${P.mocks.map(m => { const w = Object.entries(m.by || {}).filter(([, v]) => v[1] < v[0]).sort((x, y) => (y[1][0] - y[1][1]) - (x[1][0] - x[1][1]) || x[1][1] / x[1][0] - y[1][1] / y[1][0]).slice(0, 3);
          return `<tr><td data-l="Date">${new Date(m.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td class="num" data-l="Score"><b>${m.score} / ${m.n}</b> (${m.pc} %)</td><td class="num" data-l="Right / wrong / blank">${m.r} · ${m.w} · ${m.n - m.r - m.w}</td>
          <td data-l="Weakest"><div class="srcs">${w.map(([tid, v]) => T(tid) ? `<span class="${v[1] / v[0] < 0.7 ? 'bad' : ''}">${esc(short(T(tid)))} ${v[1]}/${v[0]}</span>` : '').join('') || '<span>—</span>'}</div></td></tr>`; }).join('')}</tbody></table>` : '<p>No mock test yet.</p>'}
        <div class="acts"><a class="btn go" href="#mock">Start a mock test</a></div></section>
      <button class="btn" data-c="reset" style="justify-self:start;font-size:12px;color:var(--ink-2)">Reset all my progress</button>
    </div>`;
    main.onclick = e => {
      const c = e.target.closest('[data-c]'); if (!c) return;
      const k = c.dataset.c;
      if (k === 'rev') reviseMistakes();
      if (k === 'subq') { const [t, sb] = [c.dataset.k.slice(0, c.dataset.k.indexOf('|')), c.dataset.k.slice(c.dataset.k.indexOf('|') + 1)]; quiz(shuffle(UA.filter(x => x.t === t && x.sb === sb && x.ty === 'mcq').map(uQ)), `Practise · ${sb}`); }
      if (k === 'prac') quiz(topicMix(c.dataset.t, 10), `Practise · ${T(c.dataset.t).t}`);
      if (k === 'wf') quiz(shuffle(wf.slice(0, 25).map(([fid]) => FBY[fid] && mlItems([FBY[fid]])[0]).filter(Boolean).map(mlQuestion)), 'My weak formulas');
      if (k === 'weakmix') { const ts = rec.slice(0, 4).map(r => r.t.id); quiz(shuffle(ts.flatMap(tid => topicMix(tid, 5))).slice(0, 20), 'My weakest topics'); }
      if (k === 'reset') { c.outerHTML = '<span class="confirm">Clear all your saved progress and mock results? <button class="btn no" data-c="reset2">Yes, clear it</button> <button class="btn" data-c="keep">No</button></span>'; }
      if (k === 'reset2') { P = EMPTY(); changed(); viewConsole(RT, true); }
      if (k === 'keep') viewConsole(RT, true);
    };
    if (keep) scrollTo(0, y); else toTop();
  }

  /* ---------- mock test ---------- */
  let tick = 0;
  async function viewMock(tok) {
    setShell('mock'); document.title = 'Mock test · TNEB AE Study Site';
    await loadAll(); if (tok !== RT) return;
    if (M) return showMock();
    const g = {}; IX.T.forEach(t => (g[t.s] ||= []).push(t));
    const avail = id => QA.filter(x => x.t === id && x.r != null).length + UA.filter(x => x.t === id && x.ty === 'mcq').length;
    const nU = UA.filter(x => x.ty === 'mcq').length;
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Mock test</div><div class="con"><section class="panel"><h2>⏱ Mock test</h2>
      <p>Questions come from your Question Book (${nU} single-answer past questions from GATE, TNPSC, ESE, APGENCO and TANGEDCO, shown exactly as printed, with full solutions in the result) and the Complete Book's own MCQs (${QA.filter(x => x.r != null).length}), plus, if you like, missing-letter questions on the book's formulas. Every answer goes into your progress console, and the result shows your weak topics.</p>
      <form class="mkset" id="mkf">
        <fieldset><legend>Which topics</legend>
          <label class="r"><input type="radio" name="sc" value="all" checked> All topics</label>
          <label class="r"><input type="radio" name="sc" value="weak"> My weak and untried topics (from the console's Study next)</label>
          <label class="r"><input type="radio" name="sc" value="subj"> One subject <select id="mks">${IX.S.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></label>
          <label class="r"><input type="radio" name="sc" value="pick"> Choose topics</label>
          <div class="picks" id="mkp" hidden>${IX.S.map(([k, n]) => `<b>${esc(n)}</b>` + g[k].map(t => `<label><input type="checkbox" value="${t.id}">${esc(short(t))} <span class="pg">${avail(t.id)} MCQs</span></label>`).join('')).join('')}</div></fieldset>
        <fieldset><legend>Paper</legend><div class="mkrow">
          <label>Questions <select id="mkn"><option>10</option><option selected>25</option><option>50</option><option>100</option></select></label>
          <label>Time per question <select id="mkt"><option value="36">36 s</option><option value="60" selected>1 min</option><option value="72">1.2 min</option><option value="90">1.5 min</option></select></label>
          <label>Marking <select id="mkm"><option value="1">+1, −⅓ per wrong (TNEB, ESE, GATE MCQ)</option><option value="0" selected>+1, no negative (TNPSC)</option></select></label>
          <label>Formula questions <select id="mkl"><option value="0.2" selected>About 1 in 5 missing-letter</option><option value="0">None — MCQs only</option><option value="0.5">About half</option></select></label></div>
          <div class="mkrow"><label>Questions from <select id="mksrc"><option value="all" selected>Question Book + book MCQs</option><option value="u">Question Book only (real past papers)</option><option value="b">Complete Book MCQs only</option></select></label>
          <label>Exam <select id="mkex"><option value="">Every exam</option><option value="GATE">GATE EE</option><option value="TNPSC">TNPSC Code 400</option><option value="ESE">UPSC ESE</option><option value="APGENCO">APGENCO AE</option><option value="TANGEDCO">TANGEDCO AE</option></select></label></div></fieldset>
        <div class="acts"><button class="btn go" type="submit">Start the timer</button><span class="pg" id="mkinfo"></span></div></form></section></div>`;
    const f = $('#mkf'), picks = $('#mkp');
    f.onchange = () => { picks.hidden = f.sc.value !== 'pick'; };
    f.onsubmit = e => {
      e.preventDefault();
      const sc = f.sc.value; let ids;
      if (sc === 'all') ids = IX.T.map(t => t.id);
      else if (sc === 'subj') ids = IX.T.filter(t => t.s === $('#mks').value).map(t => t.id);
      else if (sc === 'pick') ids = $$('input:checked', picks).map(x => x.value);
      else { const by = stats().by; ids = IX.T.filter(t => !by[t.id] || by[t.id].a < 3 || pct(by[t.id].r, by[t.id].a) < 70).sort((x, y) => (PRW[y.pr] || 1) - (PRW[x.pr] || 1)).slice(0, 12).map(t => t.id); }
      if (!ids.length) { $('#mkinfo').textContent = 'Choose at least one topic.'; return; }
      mockStart(ids, +$('#mkn').value, +$('#mkt').value, $('#mkm').value === '1', +$('#mkl').value, $('#mksrc').value, $('#mkex').value);
    };
    toTop();
  }
  function mockStart(ids, n, per, neg, mlShare, from = 'all', exam = '') {
    const set = new Set(ids);
    // round-robin over the chosen topics so the paper is spread across them
    const byT = {};
    if (from !== 'b') UA.filter(x => set.has(x.t) && x.ty === 'mcq' && (!exam || x.ex === exam)).forEach(x => (byT[x.t] ||= []).push(uQ(x)));
    if (from !== 'u' && !exam) QA.filter(x => set.has(x.t) && x.r != null).forEach(x => (byT[x.t] ||= []).push(mcqQ(x)));
    Object.values(byT).forEach(shuffle);
    const nML = exam || from === 'u' ? 0 : Math.round(n * mlShare), mcqs = [], order = shuffle(Object.keys(byT));
    for (let k = 0; mcqs.length < n - nML && order.length; k++) { const t = order[k % order.length], L = byT[t]; if (L.length) mcqs.push(L.pop()); if (!order.some(o => byT[o].length)) break; }
    const fl = shuffle(mlItems(FA.filter(f => set.has(f.t)))), seen = new Set(), mls = [];
    for (const it of fl) { if (mcqs.length + mls.length >= n) break; if (!seen.has(it.id)) { seen.add(it.id); mls.push(mlQuestion(it)); } }
    const qs = shuffle([...mcqs, ...mls]);
    if (!qs.length) { toast('No questions for these topics yet.'); return; }
    M = { qs, ans: qs.map(() => -1), flag: qs.map(() => false), i: 0, end: Date.now() + qs.length * per * 1000, total: qs.length * per, neg, t0: Date.now() };
    showMock();
    clearInterval(tick); tick = setInterval(() => { if (!M) return clearInterval(tick); const left = Math.round((M.end - Date.now()) / 1000), el = $('.mk-time'); if (el) { el.textContent = clock(left); el.classList.toggle('low', left <= 60); } if (left <= 0) mockSubmit(); }, 1000);
  }
  const clock = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
  function showMock() {
    if (location.hash !== '#mock') { try { history.replaceState(null, '', '#mock'); } catch (e) {} setShell('mock'); }
    const q = M.qs[M.i], left = Math.round((M.end - Date.now()) / 1000);
    main.innerHTML = `<div class="mk-top"><b>Mock test</b><span class="mk-time${left <= 60 ? ' low' : ''}">${clock(left)}</span><span>${M.ans.filter(a => a >= 0).length} of ${M.qs.length} answered</span><button class="btn go" data-m="submit">Submit</button></div>
      <div class="mk-pal">${M.qs.map((_, i) => `<button data-go="${i}" class="${M.ans[i] >= 0 ? 'ans' : ''}${M.flag[i] ? ' flag' : ''}${i === M.i ? ' cur' : ''}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="box qcard" style="margin-top:10px"><div class="qs">Question ${M.i + 1} · ${esc(q.src || '')}</div><div class="qq">${q.q}</div>
      ${optsHtml(q, 'data-mi', M.ans[M.i])}
      <div class="acts"><button class="btn" data-m="prev" ${M.i ? '' : 'disabled'}>← Previous</button><button class="btn" data-m="flag">${M.flag[M.i] ? '★ Flagged' : '☆ Flag for review'}</button>${M.ans[M.i] >= 0 ? '<button class="btn" data-m="clear">Clear answer</button>' : ''}<button class="btn" data-m="next" ${M.i + 1 < M.qs.length ? '' : 'disabled'}>Next →</button></div></div>`;
    lazy();
    main.onclick = e => {
      if (!M) return;
      const t = e.target, m = t.closest('[data-m]') && t.closest('[data-m]').dataset.m;
      const mo = t.closest('[data-mi]'); if (mo) { const i = +mo.dataset.mi; M.ans[M.i] = M.ans[M.i] === i ? -1 : i; showMock(); return; }
      const go = t.closest('[data-go]'); if (go) { M.i = +go.dataset.go; showMock(); return; }
      if (m === 'prev' && M.i) { M.i--; showMock(); }
      else if (m === 'next' && M.i + 1 < M.qs.length) { M.i++; showMock(); }
      else if (m === 'flag') { M.flag[M.i] = !M.flag[M.i]; showMock(); }
      else if (m === 'clear') { M.ans[M.i] = -1; showMock(); }
      else if (m === 'submit') { const blank = M.ans.filter(a => a < 0).length; if (!blank) mockSubmit(); else t.closest('[data-m]').outerHTML = `<span class="confirm">${blank} not answered. <button class="btn go" data-m="submit2">Submit anyway</button> <button class="btn" data-m="back">Keep going</button></span>`; }
      else if (m === 'submit2') mockSubmit();
      else if (m === 'back') showMock();
    };
  }
  function mockSubmit() {
    if (!M) return; clearInterval(tick);
    const X = M; M = null;
    if (location.hash !== '#mock') { try { history.replaceState(null, '', '#mock'); } catch (e) {} setShell('mock'); toast('Time is up — your mock test was submitted.'); }
    const ok = X.qs.map((q, i) => X.ans[i] >= 0 && isRight(q, X.ans[i])), r = ok.filter(Boolean).length, w = X.qs.filter((q, i) => X.ans[i] >= 0 && !ok[i]).length, n = X.qs.length;
    const score = Math.round((r - (X.neg ? w / 3 : 0)) * 100) / 100, secs = Math.min(X.total, Math.round((Date.now() - X.t0) / 1000));
    const by = {};
    X.qs.forEach((q, i) => { const b = by[q.t] || (by[q.t] = [0, 0]); b[0]++; if (ok[i]) b[1]++; });
    // every question is recorded (a blank counts as not known)
    X.qs.forEach((q, i) => { const m = isF(q.id) ? P.f : P.q, e = m[q.id] || (m[q.id] = [0, 0, 0, 0]); e[0]++; if (ok[i]) e[1]++; e[2] = ok[i] ? 1 : 0; e[3] = now(); P.seen[q.t] = now(); });
    P.mocks.unshift({ ts: Date.now(), n, r, w, score, pc: Math.round(Math.max(0, score) / n * 100), secs, neg: X.neg, by }); P.mocks.length = Math.min(P.mocks.length, 30); changed();
    const rowsT = Object.entries(by).map(([tid, [a, rr]]) => ({ t: T(tid), a, r: rr })).filter(x => x.t).sort((x, y) => x.r / x.a - y.r / y.a);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Mock test result</div><div class="con">
      <section class="panel"><h2>Mock test result</h2><div class="kpis">${[[`${score} / ${n}`, 'score' + (X.neg ? ' (−⅓ per wrong)' : '')], [Math.round(Math.max(0, score) / n * 100) + ' %', 'percent'], [r, 'right'], [w, 'wrong'], [n - r - w, 'blank'], [`${Math.floor(secs / 60)} min ${secs % 60} s`, 'time used']].map(([b, s]) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`).join('')}</div>
        <div class="acts"><a class="btn go" href="#progress">📊 See it in my progress console</a><button class="btn" data-r="again">Another mock test</button></div></section>
      <section class="panel"><h2>By topic <small>weakest first — this is where to improve</small></h2><table class="ttab"><thead><tr><th>Topic</th><th>Right</th><th></th></tr></thead><tbody>${rowsT.map(x => `<tr><td data-l="Topic"><a href="#t-${x.t.id}">${esc(x.t.t)}</a></td><td class="num" data-l="Right"><span class="bar" style="--col:${tone(pct(x.r, x.a))[2]}"><i style="width:${Math.max(3, pct(x.r, x.a))}%"></i></span>${x.r}/${x.a}</td><td><span class="acts"><a class="btn" href="#t-${x.t.id}">Study</a><button class="btn go" data-r="prac" data-t="${x.t.id}">Practise</button></span></td></tr>`).join('')}</tbody></table></section>
      <section class="panel"><h2>Every question, with the answer</h2>${X.qs.map((q, i) => `<details class="rv"><summary><b class="${ok[i] ? 'up' : 'dn'}">${ok[i] ? '✓' : X.ans[i] < 0 ? '–' : '✗'} Q${i + 1}</b><span>${esc(q.ml ? 'Missing letter — ' + q.nm : plain(q.q).slice(0, 120))}</span></summary><div><div class="qs pg">${esc(q.src)}</div><div class="qq">${q.q}</div>
        <p>Your answer: <b>${X.ans[i] < 0 ? 'none' : esc(q.opts[X.ans[i]].l || 'ABCD'[X.ans[i]]) + (q.opts[X.ans[i]].h ? ' — ' + q.opts[X.ans[i]].h : '')}</b> · Right answer: <b>${esc(q.opts[q.r].l || 'ABCD'[q.r])}${q.opts[q.r].h ? ' — ' + q.opts[q.r].h : ''}</b></p><div class="expl">${q.ex}</div></div></details>`).join('')}</section></div>`;
    lazy();
    main.onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; if (b.dataset.r === 'again') viewMock(RT); if (b.dataset.r === 'prac') quiz(topicMix(b.dataset.t, 10), `Practise · ${T(b.dataset.t).t}`); };
    toTop();
  }

  /* ---------- past questions without a chapter page ---------- */
  /* ---------- look-up shelf: the book's look-up pages as printed, plus Symbols A–Z and the A–Z formula table ---------- */
  // a book page packed in a shelf sheet: [page, file, W, H, y, w, h]
  const pgImg = ([, f, W, H, y, w, h], alt) => `<div class="sp pgimg" role="img" aria-label="${esc(alt)}" data-src="${f}" data-w="${w}" style="aspect-ratio:${w}/${h};max-width:${w}px;background-size:${(W / w * 100).toFixed(4)}% auto;background-position:0 ${H > h ? (y / (H - h) * 100).toFixed(4) : 0}%"></div>`;
  // one cut-out part of a page (a card or a picture): [file, W, H, y, w, h, largest sensible width in px]
  const partImg = ([f, W, H, y, w, h, mw], alt) => `<div class="sp rpi" role="img" aria-label="${esc(alt)}" data-src="${f}" data-w="${w}" style="aspect-ratio:${w}/${h};max-width:${mw}px;background-size:${(W / w * 100).toFixed(4)}% auto;background-position:0 ${H > h ? (y / (H - h) * 100).toFixed(4) : 0}%"></div>`;
  // a book page re-set for reading: its text as text (tables become one card per row on a phone), its picture cards
  // and drawings cut out one per row; the printed page stays one tap away
  const readPage = (g, e, rh) => `<figure class="box refpg" id="rp${e[0]}"><figcaption><span class="pgt">${volOf(g)} · p ${e[0]}</span><button class="btn lnk" data-pp aria-pressed="false">🖼 As printed</button></figcaption>
    ${rh ? `<div class="rp">${rh[0].replace(/<i data-k="(\d+)"><\/i>/g, (_, k) => partImg(rh[1][k], `${g.n}, p ${e[0]}, picture ${+k + 1}`))}</div><div class="pp" hidden>${pgImg(e, `${g.n}, book page ${e[0]}`)}</div>` : pgImg(e, `${g.n}, book page ${e[0]}`)}</figure>`;
  document.addEventListener('click', e => { const b = e.target.closest('[data-pp]'); if (!b) return; const f = b.closest('figure'), pp = $('.pp', f), rp = $('.rp', f); if (!pp) return;
    const on = pp.hidden; pp.hidden = !on; rp.hidden = on; b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '📖 Readable' : '🖼 As printed'; });
  const SPECIAL = [['sym', '🔤', 'Symbols A–Z — what every letter means', 'Every symbol of the book with its meaning, unit, where it is used and a formula it appears in (456 entries, Vol 6 p 1540–1565).'],
    ['az', '📒', 'A–Z formula table', 'Every formula by name, A to Z: Engineering Mathematics, Electrical & Electronics, Basic Engineering & Sciences (Vol 6 p 1566–1674).'],
    ['gate', '🎓', 'GATE multi-concept sums', 'All GATE EE sums of Vols 7–9 with their concept chain and full solution, topic by topic.']];
  // every shelf has its own colour: its index card, its page frames, and the row cards of its tables
  const SHC = { which: '#2563eb', sym: '#7c3aed', az: '#0e7490', cards: '#dc2626', keyvals: '#ea580c', magic: '#db2777', eeemagic: '#c026d3', mathmagic: '#7e22ce',
    values: '#b45309', reck: '#0f766e', lookalike: '#e11d48', mental: '#15803d', units: '#0369a1', visual: '#4f46e5', geometry: '#059669', mensuration: '#a16207',
    aptitude: '#9333ea', curves: '#1d4ed8', colour: '#b91c1c', trees: '#166534', compare: '#0891b2', cross: '#6d28d9', concept: '#be185d', analogy: '#0284c7',
    proportion: '#c2410c', scoc: '#b91c1c', whatif: '#a21caf', rlctamil: '#047857', gate: '#dc2626', words: '#0d9488', acdc: '#ea580c', chain: '#be123c', drill: '#2563eb', pred: '#7c3aed', flow: '#be123c', pgate: '#dc2626', ptneb: '#1f4e79' };
  const shc = id => SHC[id] || '#a86a00';
  const volOf = g => /^QB/.test(String(g.v)) ? 'Question Book' : `Vol ${g.v}`;
  function shelfCard(g) { return `<a class="tc shelf" href="#ref-${g.id}" style="--c:${shc(g.id)}"><h3><span class="shi">${g.ic}</span> ${esc(g.n)}</h3><div class="meta"><span>${volOf(g)} · p ${g.p[0][0]}${g.p.length > 1 ? '–' + g.p[g.p.length - 1][0] : ''}</span><span>${g.p.length} page${g.p.length > 1 ? 's' : ''}</span></div><p class="lnames">${esc(g.d)}</p></a>`; }
  async function viewRef(tok) {
    setShell('ref'); document.title = 'Look-up shelf · TNEB AE Study Site';
    main.innerHTML = '<p class="loading">Loading the look-up shelf…</p>';
    const R = await loadRef(); if (tok !== RT) return;
    const G = Object.fromEntries(R.g.map(g => [g.id, g])), sec = (t, ids, c) => `<section class="subj shelfsec" style="--c:${c}"><h2><i></i>${t}</h2><div class="tcards">${ids.map(id => G[id] ? shelfCard(G[id]) : (s => s ? `<a class="tc shelf" href="#ref-${s[0]}" style="--c:${shc(s[0])}"><h3><span class="shi">${s[1]}</span> ${esc(s[2])}</h3><p class="lnames">${esc(s[3])}</p></a>` : '')(SPECIAL.find(x => x[0] === id))).join('')}</div></section>`;
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Look-up shelf</div>
      <section class="hero"><h1>📚 Look-up shelf</h1><p>The look-up pages of your Complete Book (${R.g.reduce((a, g) => a + g.p.length, 0)} pages), set for easy reading on a phone — one card per row, every word as printed; the printed page is one tap away. The search box at the top also searches the text of every page here, every symbol and every A–Z formula.</p>
      <div class="acts"><a class="btn go" href="#ref-which">🧭 Which look-up do I open?</a><a class="btn" href="#ref-sym">🔤 Symbols A–Z</a><a class="btn" href="#ref-az">📒 A–Z formula table</a></div></section>
      ${sec('🔤 Letters & formulas', ['which', 'sym', 'az', 'words', 'cards', 'keyvals'], '#2563eb')}
      ${sec('🔢 Numbers', ['magic', 'eeemagic', 'mathmagic', 'values', 'reck', 'lookalike', 'mental', 'units'], '#db2777')}
      ${sec('🖼 Pictures & shapes', ['visual', 'geometry', 'mensuration', 'aptitude', 'curves', 'colour', 'trees'], '#059669')}
      ${sec('💡 Ideas & comparisons', ['compare', 'cross', 'concept', 'analogy', 'proportion', 'scoc', 'whatif', 'rlctamil'], '#7c3aed')}
      ${sec('🎓 Sums & solving', ['flow', 'chain', 'gate', 'acdc'], '#dc2626')}
      <footer class="foot">From your Complete Book: Visual Tricks & Formula Sheets and Electrical Formula Read Cards (Vol 5), the Look-up shelf — Symbols A–Z, A–Z Formula Table, Calculation Ready-Reckoner, Magic Numbers, Look-alike Numbers & Trap Factors, Key Formula & Direct-Answer Values (Vol 6) — and One Concept Many Places, Quick Comparisons, the Cross-Comparison Book, the Analogy Book and RC · RL · RLC in Tamil (Vol 7).</footer>`;
    toTop();
  }
  async function viewShelf(id, page, tok) {
    setShell('ref'); main.innerHTML = '<p class="loading">Loading…</p>';
    const [R, RH] = await Promise.all([loadRef(), loadRefh(id).catch(() => null)]); if (tok !== RT) return;
    const i = R.g.findIndex(g => g.id === id), g = R.g[i]; if (!g) { location.hash = '#ref'; return; }
    document.title = g.n + ' · Look-up shelf';
    const prev = R.g[i - 1], nxt = R.g[i + 1];
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#ref">Look-up shelf</a> › ${esc(g.n)}</div>
      <section class="hero shelfh" style="--c:${shc(g.id)}"><h1><span class="shi">${g.ic}</span> ${esc(g.n)}</h1><p>${esc(g.d)}</p><p class="pg">${volOf(g)} · p ${g.p[0][0]}${g.p.length > 1 ? '–' + g.p[g.p.length - 1][0] : ''} · ${RH ? 'the book’s words, set for easy reading: one card per row, tables as cards on a phone, pictures cut out large (tap to zoom). “🖼 As printed” shows the page itself.' : 'exactly as printed — tap a page to zoom.'}</p>
      ${g.p.length > 3 ? `<nav class="pgchips" aria-label="Pages">${g.p.map(([p]) => `<a href="#ref-${g.id}-${p}">p ${p}</a>`).join('')}</nav>` : ''}</section>
      <div class="pages refpages" style="--c:${shc(g.id)}">${g.p.map(e => readPage(g, e, RH && RH[e[0]])).join('')}</div>
      <div class="pn">${prev ? `<a href="#ref-${prev.id}"><small>← Previous shelf</small><b>${esc(prev.n)}</b></a>` : '<a href="#ref"><small>←</small><b>Look-up shelf</b></a>'}${nxt ? `<a href="#ref-${nxt.id}"><small>Next shelf →</small><b>${esc(nxt.n)}</b></a>` : ''}</div>`;
    lazy();
    const el = page && document.getElementById('rp' + page);
    if (el) { requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
      // text above the page can still reflow while web fonts load: settle once more unless the reader has scrolled
      let y0; setTimeout(() => { if (el.isConnected) { el.scrollIntoView({ block: 'start' }); y0 = scrollY; } }, 350);
      setTimeout(() => { if (el.isConnected && scrollY === y0) el.scrollIntoView({ block: 'start' }); }, 1200); } else toTop();
  }
  function filterBox(ph) { return `<label class="fbox"><span>🔎</span><input type="search" placeholder="${esc(ph)}" aria-label="${esc(ph)}"></label>`; }
  function wireFilter(sel) {
    const inp = $('.fbox input', main); if (!inp) return;
    inp.oninput = () => { const W = words(inp.value); $$(sel, main).forEach(el => { el.hidden = W.length > 0 && !hitAll(norm(el.dataset.s || el.textContent), W); });
      $$('[data-grp]', main).forEach(gr => { gr.hidden = !$$(sel, gr).some(el => !el.hidden); }); };
  }
  async function viewSym(tok) {
    setShell('ref'); document.title = 'Symbols A–Z · Look-up shelf'; main.innerHTML = '<p class="loading">Loading…</p>';
    const S = await loadSym(); if (tok !== RT) return;
    const by = {}; S.e.forEach(e => (by[e[0]] ||= []).push(e));
    const notes = Object.fromEntries(S.bands.map(b => [b[0], b]));
    const L = Object.keys(by);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#ref">Look-up shelf</a> › Symbols A–Z</div>
      <section class="hero"><h1>🔤 Symbols A–Z — what every letter means</h1><p>${S.e.length} symbols from your book (Vol 6 p 1540–1565): meaning, unit, where it is used and a formula it appears in. Type to filter.</p>
      ${filterBox('Filter symbols — e.g. flux, ohm, Xd')}<nav class="pgchips" aria-label="Letters">${L.map((l, i) => `<a href="#" data-jump="sg${i}">${esc(l)}</a>`).join('')}</nav></section>
      ${L.map((l, i) => `<section class="panel symg" id="sg${i}" data-grp><h2>${esc(l)}</h2>${notes[l] ? `<p class="pg">${plain(notes[l][1]).replace(l, '').trim()} · p ${notes[l][2]}</p>` : ''}
        <div class="ctab"><table class="symt"><thead><tr><th>Symbol</th><th>Meaning</th><th>Unit</th><th>Used in</th><th>Formula</th></tr></thead><tbody>${by[l].map(e => `<tr class="symr" data-s="${esc(plain([e[1], e[2], e[3], e[4], e[5], e[6].join(' ')].join(' ')))}"><td class="sym">${e[1]}</td><td>${e[2]}</td><td>${e[3]}${e[4] ? ` <small>${e[4]}</small>` : ''}</td><td>${e[5]}</td><td class="fx">${e[6].join('<br>')}<span class="pg"> · p ${e[7]}</span></td></tr>`).join('')}</tbody></table></div></section>`).join('')}`;
    wireFilter('.symr');
    main.onclick = e => { const a = e.target.closest('[data-jump]'); if (a) { e.preventDefault(); document.getElementById(a.dataset.jump).scrollIntoView({ block: 'start' }); } };
    toTop();
  }
  async function viewAz(tok) {
    setShell('ref'); document.title = 'A–Z formula table · Look-up shelf'; main.innerHTML = '<p class="loading">Loading…</p>';
    const A = await loadAzt(); if (tok !== RT) return;
    const first = n => { const c = plain(n).trim()[0] || '#'; return /[0-9]/.test(c) ? '0–9' : /[a-z]/i.test(c) ? c.toUpperCase() : c; };
    let cur = 1;
    const paint = () => {
      const [, title, rows] = A[cur], by = {}; rows.forEach(r => (by[first(r[0])] ||= []).push(r)); const L = Object.keys(by);
      $('#azbody').innerHTML = `<nav class="pgchips" aria-label="Letters">${L.map((l, i) => `<a href="#" data-jump="az${i}">${esc(l)}</a>`).join('')}</nav>` +
        L.map((l, i) => `<section class="panel" id="az${i}" data-grp><h2>${esc(l)} <small>${by[l].length}</small></h2><div class="azl">${by[l].map(r => `<div class="box azr" data-s="${esc(plain(r[0] + ' ' + r[1].join(' ') + ' ' + r[2]))}"><b>${r[0]}</b><div class="fx">${r[1].join('<br>')}</div><span class="pg">${esc(r[2])} · Vol 6 p ${r[3]}</span></div>`).join('')}</div></section>`).join('');
      $$('[data-az]', main).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.az === cur)));
      const inp = $('.fbox input', main); if (inp && inp.value) inp.oninput();
    };
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#ref">Look-up shelf</a> › A–Z formula table</div>
      <section class="hero"><h1>📒 A–Z formula table</h1><p>Every formula of the book by name, as printed (Vol 6 p 1566–1674): ${A.map(a => `${esc(a[1])} ${a[2].length}`).join(', ')}. Type to filter.</p>
      <div class="seg" role="group" aria-label="Table">${A.map((a, i) => `<button data-az="${i}" aria-pressed="false">${esc(a[1])}</button>`).join('')}</div>${filterBox('Filter formulas — e.g. resonance, slip, Laplace')}</section><div id="azbody"></div>`;
    wireFilter('.azr');
    main.onclick = e => { const b = e.target.closest('[data-az]'); if (b) { cur = +b.dataset.az; paint(); return; } const a = e.target.closest('[data-jump]'); if (a) { e.preventDefault(); document.getElementById(a.dataset.jump).scrollIntoView({ block: 'start' }); } };
    paint(); toTop();
  }
  function viewGateIdx(tok) {
    setShell('ref'); document.title = 'GATE multi-concept sums · Look-up shelf';
    const g = {}; IX.T.forEach(t => { if (t.n.gate) (g[t.s] ||= []).push(t); });
    const tot = IX.T.reduce((a, t) => a + (t.n.gate || 0), 0);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#ref">Look-up shelf</a> › GATE multi-concept sums</div>
      <section class="hero"><h1>🎓 GATE multi-concept sums</h1><p>All ${tot} GATE EE sums of the book's GATE Multi-Concept Sums (Vols 7–9), filed under their topics. Each opens on the topic's Practice tab with the concept chain, the question and the full solution as printed.</p></section>
      ${IX.S.filter(([k]) => g[k]).map(([k, n]) => `<section class="subj" style="--c:${SC[k]}"><h2><i></i>${esc(n)} <small>${g[k].reduce((a, t) => a + t.n.gate, 0)} sums</small></h2><div class="tcards">${g[k].map(t => `<a class="tc" href="#t-${t.id}-prac" data-gt="${t.id}" style="--c:${SC[t.s]}"><h3>${esc(t.t.replace(/^Code 400 · /, ''))}</h3><div class="meta"><span>${t.n.gate} GATE sums</span></div></a>`).join('')}</div></section>`).join('')}`;
    main.onclick = e => { const a = e.target.closest('[data-gt]'); if (a) GOSEC = 'gate'; };
    toTop();
  }
  async function viewSims(tok) {
    setShell('sims'); document.title = 'Simulators · TNEB AE Study Site';
    main.innerHTML = '<p class="loading">Loading the simulators…</p>';
    await Promise.all([loadSims(), loadF()]); if (tok !== RT) return;
    const by = {}; LABS.forEach(L => { if (L.home === L.t) (by[L.t] ||= []).push(L); });
    const g = {}; IX.T.forEach(t => { if (LABN[t.id]) (g[t.s] ||= []).push(t); });
    const tot = Object.values(LABN).reduce((a, b) => a + b, 0);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Simulators</div>
      <section class="hero"><h1>⚙ Formula & concept simulators</h1><p>${tot} live labs on ${Object.keys(LABN).length} topics. Each lab is built on a formula of your book: change the numbers and watch every result move, plot any output against any input, see what a 10 % change does, and recompute the book's own worked examples (${LABS.reduce((a, L) => a + (L.ck || []).length, 0)} checks, all matching the book).</p>
      <div class="acts"><a class="btn go" href="${SIM_URL}"${SIM_TGT}>⚙ Full Transformer simulator (phasors, 3-phase, parallel, inrush)</a></div></section>
      ${IX.S.filter(([k]) => g[k]).map(([k, n]) => `<section class="subj" style="--c:${SC[k]}"><h2><i></i>${esc(n)} <small>${g[k].reduce((a, t) => a + LABN[t.id], 0)} labs</small></h2><div class="tcards">${g[k].map(t => `<a class="tc" href="#t-${t.id}-sim" style="--c:${SC[t.s]}" data-s="${esc(t.t)}"><h3>${esc(t.t.replace(/^Code 400 · /, ''))}</h3><div class="meta">${t.t.startsWith('Code 400') ? '<span class="chip c4">CODE 400</span>' : ''}<span>${LABN[t.id]} labs</span></div><p class="lnames">${(by[t.id] || LABS.filter(L => L.t === t.id)).map(L => esc(L.n)).join(' · ')}</p></a>`).join('')}</div></section>`).join('')}
      <footer class="foot">Every lab uses the formula as printed in your Complete Book; the book link on each lab shows which formula and page. The ✓ Book checks are the book's solved sums, ratio sums, key-formula examples, one-minute sums, quick checks and value tables.</footer>`;
    toTop();
  }
  /* ---------- practice papers & drills (Question Book Parts 4, 6 and 7) ---------- */
  const drillId = (T_, x) => `d${T_.t}.${x.n}`;
  const drillCard = (T_, x) => { const id = drillId(T_, x), e = P.q[id];
    return `<article class="box dr" data-d="${id}"><header><b>${T_.k}.${x.n}</b><span>${esc(T_.n)}</span>${e ? `<span class="pg ${e[2] ? 'up' : 'dn'}">${e[2] ? '✓ got it last time' : '✗ missed last time'}</span>` : ''}</header>
      <div class="dq">${x.q}</div><div class="acts"><button class="btn" data-dr="show">Show method & answer</button></div>
      <div class="da" hidden>${x.m ? spu(x.m, 'Method') : ''}<p class="dans">Answer: <b>${x.a}</b></p><div class="acts"><span class="pg">Did you get it?</span><button class="btn" data-dr="ok">✓ Got it</button><button class="btn" data-dr="no">✗ Missed</button></div></div></article>`; };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-dr]'); if (!b) return; const card = b.closest('.dr');
    if (b.dataset.dr === 'show') { const a = $('.da', card); a.hidden = !a.hidden; b.textContent = a.hidden ? 'Show method & answer' : 'Hide method & answer'; lazy(card); return; }
    if (card.dataset.done) return; card.dataset.done = 1; record(card.dataset.d, b.dataset.dr === 'ok');
    $('.da .acts', card).innerHTML = b.dataset.dr === 'ok' ? '<b class="up">✓ Marked as got it</b>' : '<b class="dn">✗ Marked as missed — it counts in your progress console</b>';
  });
  async function viewPractice(tok) {
    setShell('home'); document.title = 'Practice papers & drills · TNEB AE Study Site';
    const [DR, PR] = await Promise.all([loadDrill(), loadPred()]); if (tok !== RT) return;
    const card = (h, ic, n, m, d, c) => `<a class="tc shelf" href="${h}" style="--c:${c}"><h3><span class="shi">${ic}</span> ${n}</h3><div class="meta"><span>${m}</span></div><p class="lnames">${d}</p></a>`;
    const done = ids => ids.filter(i => P.q[i]).length;
    const nd = DR.T.reduce((a, t) => a + t.q.length, 0);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Practice papers & drills</div>
      <section class="hero shelfh" style="--c:#7c3aed"><h1><span class="shi">📝</span> Practice papers & drills</h1><p>The practice parts of your Question Book: the 300-numericals drill and the two predicted papers with their keys and worked solutions, plus the mock test built from every past question.</p></section>
      <section class="subj shelfsec" style="--c:#7c3aed"><h2><i></i>Practise</h2><div class="tcards">
      ${card('#drill', '🔢', 'Numericals drill', `${nd} numericals · 25 topics · ${done(DR.T.flatMap(t => t.q.map(x => drillId(t, x))))} done`, 'One minute each: solve on paper, then show the method and the answer and mark yourself. Question Book Part 4, p 1203–1229.', '#2563eb')}
      ${card('#pred-gate', '🎓', esc(PR.gate.t), `${PR.gate.q.length} questions · ${done(PR.gate.q.map(x => x.id))} done`, 'MCQ, MSQ and numerical-answer questions with the key, worked solutions and why each was predicted. Question Book Part 6.', '#dc2626')}
      ${card('#pred-tneb', '⚡', esc(PR.tneb.t), `${PR.tneb.q.length} questions · ${done(PR.tneb.q.map(x => x.id))} done`, 'All four-option MCQs: answer one by one, or sit it as a timed 2-hour paper with −⅓ per wrong answer. Question Book Part 7.', '#1f4e79')}
      ${card('#mock', '⏱', 'Mock test', 'any topics · any length', 'A timed paper from the 2,620 real past questions and the book MCQs, with a topic-by-topic result.', '#0f766e')}
      ${card('#ref-flow', '🧭', 'How to solve any sum', 'one flow · four trees', 'The 9-step flow and the Maths, EEE, Basic Engineering and Aptitude trees from Question Book Part 1.', '#be123c')}
      ${card('#ref-acdc', '⚡', 'Ten practice sums & machine sums', 'DC · 1-φ · 3-φ · machines', 'Fully worked sums with computed answers, from the Complete Book comparison sheets.', '#ea580c')}</div></section>
      <p class="tnote" style="margin-top:16px">The two predicted papers are practice questions the book wrote from past-paper trends — they are not real past papers.</p>`;
    toTop();
  }
  async function viewDrill(k, tok) {
    setShell('home'); document.title = 'Numericals drill · TNEB AE Study Site';
    const DR = await loadDrill(); if (tok !== RT) return;
    const n = DR.T.reduce((a, t) => a + t.q.length, 0);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#practice">Practice papers & drills</a> › Numericals drill</div>
      <section class="hero shelfh" style="--c:#2563eb"><h1><span class="shi">🔢</span> Numericals drill</h1><p>${n} quick numericals in 25 EEE topics (Question Book Part 4, p 1203–1229). Aim for one minute each: solve on paper, then show the method and the answer, and mark yourself — it counts in your progress console. Every answer was computed by the book from the formula shown.</p>
      <nav class="pgchips" aria-label="Topics">${DR.T.map(t => `<a href="#drill-${t.k}">${t.k}. ${esc(t.n)}</a>`).join('')}</nav></section>
      ${DR.T.map(t => `<section class="panel drs" id="dk${t.k}"><h2>${t.k}. ${esc(t.n)} <small>${t.q.length} numericals · p ${t.p}${t.t ? ` · <a href="#t-${t.t}">open the topic</a>` : ''}</small></h2><div class="drl">${t.q.map(x => drillCard(t, x)).join('')}</div></section>`).join('')}`;
    const el = k && document.getElementById('dk' + k);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' })); else toTop();
  }
  async function viewPred(pid, tok) {
    setShell('home');
    const PR = await loadPred(); if (tok !== RT) return;
    const X = PR[pid], U = { subs: [], q: X.q }; document.title = X.t + ' · TNEB AE Study Site';
    const right = X.q.filter(x => P.q[x.id] && P.q[x.id][2]).length, tried = X.q.filter(x => P.q[x.id]).length;
    let sel = '';
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#practice">Practice papers & drills</a> › ${esc(X.t)}</div>
      <section class="hero shelfh" style="--c:${pid === 'gate' ? '#dc2626' : '#1f4e79'}"><h1><span class="shi">${pid === 'gate' ? '🎓' : '⚡'}</span> ${esc(X.t)}</h1>
      <p><b>Practice questions, not a real past paper:</b> the book wrote this paper from the trends of the past papers (Question Book Part ${pid === 'gate' ? '6, p 1285–1315' : '7, p 1316–1359'}). ${X.q.length} questions, each with the book's key, the worked solution and why it was predicted.</p>
      <p class="pg">You: ${tried} answered · ${right} right last time</p>
      <div class="acts">${pid === 'tneb' ? '<button class="btn go" data-pt="timed">⏱ Sit it as a timed paper (2 hours, −⅓ per wrong)</button>' : ''}<a class="btn" href="#ref-${pid === 'gate' ? 'pgate' : 'ptneb'}">🎯 How it was predicted</a></div>
      <div class="seg" id="psec"><button data-v="" aria-pressed="true">All · ${X.q.length}</button>${X.secs.map(s => `<button data-v="${esc(s)}" aria-pressed="false">${esc(s.replace(/^Part [IV]+ — /, ''))} · ${X.q.filter(x => x.sec === s).length}</button>`).join('')}</div></section>
      <div id="plist" style="display:grid;gap:12px;margin-top:14px"></div>`;
    const paint = () => { $('#plist').innerHTML = X.q.filter(x => !sel || x.sec === sel).map(x => uCard({ ...x, src: [x.sec.replace(/^Part [IV]+ — /, ''), x.topic].filter(Boolean).join(' · ') || x.src }, U)).join(''); lazy(); };
    paint();
    main.onclick = e => {
      const sb = e.target.closest('#psec [data-v]'); if (sb) { sel = sb.dataset.v; $$('#psec [data-v]').forEach(b => b.setAttribute('aria-pressed', String(b === sb))); paint(); return; }
      if (e.target.closest('[data-pt="timed"]')) { predTimed(X); return; }
      uAnswer(e, U);
    };
    main.onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('unum')) { e.preventDefault(); uAnswer({ target: e.target.closest('.ub').querySelector('[data-uact="chk"]') }, U); } };
    toTop();
  }
  function predTimed(X) {
    const qs = X.q.filter(x => x.ty === 'mcq').map(x => { const oh = x.qh != null ? Object.fromEntries(x.oh) : null;
      return { id: x.id, t: '', src: `${X.t} · ${x.lab}`, q: oh ? `<div class="uq">${x.qh}</div>` : `<div class="im wide">${spu(x.qs, x.lab)}<span class="zoomhint">Swipe sideways to read the whole line · tap to zoom</span></div>`,
        opts: x.L.map(l => ({ l, h: oh && oh[l] || '' })), r: x.L.indexOf(x.ok[0]), ex: x.sh ? solHtml(x) : spu(x.ss, 'Answer and working') }; });
    M = { qs, ans: qs.map(() => -1), flag: qs.map(() => false), i: 0, end: Date.now() + 120 * 60 * 1000, total: 7200, neg: true, t0: Date.now() };
    showMock();
    clearInterval(tick); tick = setInterval(() => { if (!M) return clearInterval(tick); const left = Math.round((M.end - Date.now()) / 1000), el = $('.mk-time'); if (el) { el.textContent = clock(left); el.classList.toggle('low', left <= 60); } if (left <= 0) mockSubmit(); }, 1000);
  }
  function viewMore() {
    setShell('home'); document.title = 'Other past questions · TNEB AE Study Site';
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Other past questions</div><div class="con"><section class="panel"><h2>Past questions not tied to a chapter page <small>${IX.unmapped.length} rows</small></h2>
      <p>Rows of Appendix A–C for which the book gives no Study Notes page, so they are not filed under a topic here. Concept, formula line and answer as printed.</p><div style="display:grid;gap:10px">${IX.unmapped.map(rowCard).join('')}</div></section></div>`;
    main.onclick = e => { const rv = e.target.closest('.rv'); if (rv) { const on = !rv.classList.contains('on'); rv.classList.toggle('on', on); rv.innerHTML = on ? rv.dataset.a : 'Show answer'; } };
    toTop();
  }

  /* ---------- search everywhere (on a topic page the topic filters itself) ----------
     Topics, every formula, every Question Book question and every book MCQ; a result opens its topic with the
     same words already searched there. */
  let GSI = null, gsTimer = 0, gsView = null;
  const norm = t => t.toLowerCase().replace(/\s+/g, ' ');
  async function gsIndex() {
    if (GSI) return GSI;
    await Promise.all([loadAll(), loadRef(), loadSym(), loadAzt()]);
    GSI = {
      r: REF.g.flatMap(g => g.p.map(e => [{ g, p: e[0], x: e[7] }, norm(g.n + ' ' + e[7])])),
      s: SYM.e.map(e => [e, norm(plain([e[1], e[2], e[3], e[4], e[5], e[6].join(' ')].join(' ')))]),
      a: AZT.flatMap(([, t, rows]) => rows.map(r => [{ r, t }, norm(plain(r[0] + ' ' + r[1].join(' ') + ' ' + r[2]))])),
      f: FA.map(f => [f, norm(f.nm + ' ' + plain(f.h.join(' ')) + ' ' + (T(f.t) || {}).t)]),
      u: UA.map(x => [x, norm([x.lab, x.src, x.c, x.sb, x.ans, plain(x.qh || ''), (x.oh || []).map(o => plain(o[1])).join(' '), x.x || '', (T(x.t) || {}).t].join(' '))]),
      q: QA.map(x => [x, norm(plain(x.q + ' ' + x.o.join(' ')) + ' ' + x.src + ' ' + (T(x.t) || {}).t)]),
    };
    return GSI;
  }
  const words = q => norm(q).trim().split(' ').filter(Boolean);
  const hitAll = (txt, W) => W.every(w => txt.includes(w));
  async function globalSearch(q) {
    const W = words(q); if (!W.length) return;
    if (!gsView) gsView = location.hash || '#home';
    const I = await gsIndex();
    if ($('#q').value.trim() !== q) return;            // a newer search is on its way
    const tp = IX.T.filter(t => hitAll(norm(t.t + ' ' + IX.S.find(s => s[0] === t.s)[1]), W));
    const fs = I.f.filter(([, s]) => hitAll(s, W)).map(([f]) => f);
    const us = I.u.filter(([, s]) => hitAll(s, W)).map(([x]) => x);
    const qs = I.q.filter(([, s]) => hitAll(s, W)).map(([x]) => x);
    const rs = I.r.filter(([, s]) => hitAll(s, W)).map(([x]) => x), ss = I.s.filter(([, s]) => hitAll(s, W)).map(([x]) => x), as = I.a.filter(([, s]) => hitAll(s, W)).map(([x]) => x);
    const n = tp.length + fs.length + us.length + qs.length + rs.length + ss.length + as.length;
    const grp = (id, title, L, row, k = 8) => L.length ? `<section class="panel"><h2>${title} <small>${L.length}</small></h2><div class="gsl">${L.slice(0, k).map(row).join('')}</div>${L.length > k ? `<button class="more" data-gs="${id}">Show all ${L.length}</button>` : ''}</section>` : '';
    const tn = id => esc((T(id) || {}).t || '');
    const go = (id, pane) => `data-go="${id}" data-pane="${pane || ''}"`;
    const rows = {
      t: t => `<a class="gsr" href="#t-${t.id}"><b>${esc(t.t)}</b><small>${esc(IX.S.find(s => s[0] === t.s)[1])}</small></a>`,
      f: f => `<a class="gsr" href="#t-${f.t}" ${go(f.t, '')}><b>${esc(f.nm)}</b><span class="fx">${f.h[0]}</span><small>${tn(f.t)} · ${esc(f.src)}</small></a>`,
      u: x => `<a class="gsr" href="#t-${x.t}-prac" ${go(x.t, 'prac')}><b><span class="ex ex-${x.ex}">${esc(x.src)}</span></b><span>${esc((plain(x.qh || '') || x.x || x.sb || '').slice(0, 160))}…</span><small>${tn(x.t)} · ${esc(x.sb || '')} · Answer: ${esc(x.ans)}</small></a>`,
      r: x => { const i = x.x.toLowerCase().indexOf(W[0]), sn = x.x.slice(Math.max(0, i - 60), i + 120); return `<a class="gsr" href="#ref-${x.g.id}-${x.p}"><b>${x.g.ic} ${esc(x.g.n)} · p ${x.p}</b><span>${i > 60 ? '…' : ''}${esc(sn)}…</span><small>Look-up shelf · Vol ${x.g.v} · book page ${x.p}</small></a>`; },
      s: e => `<a class="gsr" href="#ref-sym"><b><span class="fx">${e[1]}</span> — ${e[2]}</b><span>${e[3]}${e[5] ? ' · ' + e[5] : ''}</span><small>Symbols A–Z · Vol 6 p ${e[7]}</small></a>`,
      a: x => `<a class="gsr" href="#ref-az"><b>${x.r[0]}</b><span class="fx">${x.r[1][0] || ''}</span><small>A–Z formula table · ${esc(x.t)} · ${esc(x.r[2])} · Vol 6 p ${x.r[3]}</small></a>`,
      q: x => `<a class="gsr" href="#t-${x.t}${x.k === 'book' ? '' : '-prac'}" ${go(x.t, x.k === 'book' ? '' : 'prac')}><b>${esc(plain(x.q).slice(0, 140))}</b><small>${tn(x.t)} · ${esc(x.src)}</small></a>`,
    };
    const L = { t: tp, f: fs, u: us, q: qs, r: rs, s: ss, a: as };
    const render = (all = '') => {
      main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Search</div><div class="con">
        <section class="panel"><h2>🔎 “${esc(q)}” <small>${n ? `${n} results` : 'nothing found — try fewer or different words'}</small></h2><p>Every word must appear. Tap a result to open its topic with these words already searched there.</p></section>
        ${grp('t', 'Topics', tp, rows.t, all === 't' ? 1e9 : 8)}${grp('f', 'Formulas', fs, rows.f, all === 'f' ? 1e9 : 8)}${grp('u', 'Question Book — past questions', us, rows.u, all === 'u' ? 1e9 : 8)}${grp('q', 'Book MCQs', qs, rows.q, all === 'q' ? 1e9 : 8)}${grp('r', '📚 Look-up shelf pages', rs, rows.r, all === 'r' ? 1e9 : 6)}${grp('s', '🔤 Symbols A–Z', ss, rows.s, all === 's' ? 1e9 : 6)}${grp('a', '📒 A–Z formula table', as, rows.a, all === 'a' ? 1e9 : 6)}</div>`;
    };
    render();
    main.onclick = e => {
      const m = e.target.closest('[data-gs]'); if (m) { render(m.dataset.gs); return; }
      const a = e.target.closest('[data-go]'); if (a) PENDQ = q;      // the topic page picks the words up
    };
  }
  $('#q').addEventListener('input', e => {
    if (main.querySelector('.pbar')) return;     // the topic page handles its own search
    const q = e.target.value.trim();
    clearTimeout(gsTimer);
    if (!q) { if (gsView) { const v = gsView; gsView = null; if (location.hash === v || (!location.hash && v === '#home')) route(true); else location.hash = v; } return; }
    gsTimer = setTimeout(() => globalSearch(q), 220);
  });
  // tapping the search icon on a phone opens the box; leaving it empty closes it again
  $('#q').addEventListener('blur', () => setTimeout(() => { if (!$('#q').value.trim()) $('#hsearch').classList.remove('open'); }, 150));
  $('#q').addEventListener('keydown', e => { if (e.key === 'Escape') { $('#q').value = ''; $('#q').dispatchEvent(new Event('input')); $('#q').blur(); } });
  $('#sbtn').onclick = () => { const h = $('#hsearch'); h.classList.toggle('open'); if (h.classList.contains('open')) $('#q').focus(); };

  route();
})();
