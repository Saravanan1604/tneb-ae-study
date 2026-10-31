/* My progress, mock test and revision — fills #pgroot on the Transformers page.
   Progress is one private document per viewer (db: data/users/<id>/transformers) when the page runs on
   claude.ai; anywhere else it stays in this browser. Questions come from window.TFQ (sim.js) and
   window.TFML (missing-letter test); answers anywhere on the page arrive through window.TFP.record(). */
(() => {
  const root = document.getElementById('pgroot');
  if (!root) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (r, a) => a ? Math.round(r / a * 100) : 0;
  const KEY = 'tf-progress-v1', MAXW = 80;
  const EMPTY = () => ({ v: 1, tags: {}, ml: {}, wrong: [], mocks: [], t: 0 });

  /* ---------- storage ---------- */
  let P = EMPTY(), where = 'browser', ref = null, saving = false, again = false, timer = 0, mode = 'hub';
  try { const s = localStorage.getItem(KEY); if (s) P = { ...EMPTY(), ...JSON.parse(s) }; } catch (e) {}
  const keepLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
  async function save() {
    if (!ref) return;
    if (saving) { again = true; return; }
    saving = true;
    try { await ref.set(JSON.parse(JSON.stringify(P))); }
    catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) { ref = null; where = 'browser'; if (mode === 'hub') render(); } }
    saving = false;
    if (again) { again = false; save(); }
  }
  function changed() {
    P.t = Date.now(); keepLocal();
    clearTimeout(timer); timer = setTimeout(save, 1500);
    document.dispatchEvent(new Event('tf:progress'));
    if (mode === 'hub') render();
  }
  (async () => {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const id = user ? await user.id() : null;
      if (!db || !id) return;
      const r = db.doc('data/users/' + id + '/transformers');
      const snap = await Promise.race([r.get(), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 10000))]);
      ref = r; where = 'account';
      const remote = snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null;
      if (remote && (remote.t || 0) >= (P.t || 0)) { P = { ...EMPTY(), ...remote }; keepLocal(); }
      else if (P.t) save();
      document.dispatchEvent(new Event('tf:progress'));
      if (mode === 'hub') render();
    } catch (e) { /* keep progress in this browser */ }
  })();

  /* ---------- what the rest of the page calls ---------- */
  const slim = q => q && ({ q: q.q, opts: q.opts, a: q.a, src: q.src, tag: q.tag, id: q.id });
  function record({ id, tag = 'other', ok, q, kind, key }) {
    const t = P.tags[tag] || (P.tags[tag] = { a: 0, r: 0 }); t.a++; if (ok) t.r++;
    if (kind === 'ml') { const m = P.ml[key] || (P.ml[key] = { a: 0, r: 0, w: 0 }); m.a++; if (ok) m.r++; m.w = ok ? 0 : 1; }
    else if (id) {
      const i = P.wrong.findIndex(w => w.id === id);
      if (ok && i >= 0) P.wrong.splice(i, 1);
      if (!ok && i < 0) { P.wrong.unshift({ id, tag, q: id.startsWith('book:') ? null : slim(q), t: Date.now() }); if (P.wrong.length > MAXW) P.wrong.length = MAXW; }
    }
    changed();
  }
  window.TFP = { record, missedML: () => Object.keys(P.ml).filter(k => P.ml[k].w) };

  /* ---------- hub ---------- */
  const TAGS = () => (window.TFQ && window.TFQ.TAGS) || {};
  const resolve = w => w.q || (window.TFQ && window.TFQ.byId(w.id));
  function render() {
    mode = 'hub';
    const T = TAGS(), tot = Object.values(P.tags).reduce((n, t) => ({ a: n.a + t.a, r: n.r + t.r }), { a: 0, r: 0 });
    const rows = Object.keys(T).filter(k => k !== 'other' || P.tags.other).map(k => ({ k, ...(P.tags[k] || { a: 0, r: 0 }) }));
    const weak = rows.filter(r => r.a >= 3 && pct(r.r, r.a) < 70).sort((x, y) => pct(x.r, x.a) - pct(y.r, y.a));
    rows.sort((x, y) => (y.a > 0) - (x.a > 0) || pct(x.r, x.a) - pct(y.r, y.a));
    const missed = window.TFP.missedML().length, best = P.mocks.reduce((b, m) => Math.max(b, m.pc), 0);
    const can = k => window.TFQ && window.TFQ.byTag(k).length;
    root.innerHTML = `<p class="pg-st">${where === 'account' ? '✓ Saved to your account — private to you and kept on every device you open this page on.' : '✓ Saved in this browser. Open the page on claude.ai while signed in to keep it in your account.'}</p>
      <div class="pg-sum"><div><b>${tot.a}</b><span>questions answered</span></div><div><b>${pct(tot.r, tot.a)} %</b><span>correct overall</span></div><div><b>${P.wrong.length}</b><span>mistakes to revise</span></div><div><b>${P.mocks.length}</b><span>mock tests${P.mocks.length ? ` · best ${best} %` : ''}</span></div></div>
      <div class="pg-acts"><button class="btn pg-go" data-act="mock">⏱ Start a mock test</button><button class="btn" data-act="revise" ${P.wrong.length ? '' : 'disabled'}>↻ Revise my mistakes (${P.wrong.length})</button>${missed ? `<button class="btn" data-act="ml">✍ Missing-letter: retry ${missed} formula${missed > 1 ? 's' : ''} I missed</button>` : ''}</div>
      ${weak.length ? `<h4 class="sm-h">My weak topics</h4><div class="pg-tags">${weak.map(r => tagRow(r, T, can)).join('')}</div>` : ''}
      <h4 class="sm-h">By topic</h4><div class="pg-tags">${rows.map(r => tagRow(r, T, can)).join('')}</div>
      <p class="sm-note">Every answer counts: the MCQs, the missing-letter test, the simulator's exam practice and mock tests. A topic is "weak" after 3 answers below 70 %. A mistake leaves the revise list once you answer it right.</p>
      ${P.mocks.length ? `<h4 class="sm-h">Mock test history</h4><div class="ctab"><table class="sm-wt"><thead><tr><th>Date</th><th>Score</th><th>Correct</th><th>Time used</th><th>Marking</th></tr></thead><tbody>${P.mocks.map(m => `<tr><td>${new Date(m.t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>${m.score} / ${m.n} (${m.pc} %)</td><td>${m.r} right · ${m.w} wrong · ${m.n - m.r - m.w} blank</td><td>${Math.floor(m.secs / 60)} min ${m.secs % 60} s</td><td>${m.neg ? '−⅓ per wrong' : 'no negative'}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <button class="btn pg-reset" data-act="reset">Reset my progress</button>`;
    labelTables();
  }
  const tagRow = (r, T, can) => { const p = pct(r.r, r.a), col = !r.a ? '#c9d3e0' : p >= 80 ? '#2e8b57' : p >= 60 ? '#e09a00' : '#d93636';
    return `<div class="pg-tag${r.a >= 3 && p < 70 ? ' weak' : ''}"><span>${esc(T[r.k] || r.k)}</span><div class="pg-bar"><i style="width:${r.a ? Math.max(4, p) : 0}%;background:${col}"></i></div><small>${r.a ? `${r.r}/${r.a} · ${p} %` : 'not tried'}</small>${can(r.k) ? `<button class="btn" data-act="tag" data-tag="${r.k}">Practise</button>` : '<span></span>'}</div>`; };
  function labelTables() { root.querySelectorAll('table.sm-wt').forEach(t => { const hs = [...t.querySelectorAll('thead th')].map(h => h.textContent); t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if (i && hs[i]) td.dataset.l = hs[i]; })); }); }

  /* ---------- practice by topic / revise mistakes (one question at a time) ---------- */
  let Q = null;
  function quiz(list, title) {
    if (!list.length) return render();
    mode = 'quiz'; Q = { list, i: 0, r: 0, title, done: false }; showQ();
  }
  function showQ() {
    const q = Q.list[Q.i];
    root.innerHTML = `<div class="pg-top"><b>${esc(Q.title)}</b><span>Question ${Q.i + 1} of ${Q.list.length}</span><span class="score">Score ${Q.r}</span><button class="btn" data-act="hub">← My progress</button></div>
      <div class="sm-q"><div class="sm-qs">${esc(q.src || '')}</div><div class="sm-qq">${q.q}</div><div class="opts">${q.opts.map((o, i) => `<button class="opt" data-qi="${i}"><i>${'ABCD'[i]}</i><span>${o[0]}</span></button>`).join('')}</div><div class="sm-qe" hidden></div>
      <button class="btn" data-act="qnext" hidden>${Q.i + 1 < Q.list.length ? 'Next question →' : 'Finish'}</button></div>`;
    Q.done = false;
  }
  function explain(q, pick) {
    const ok = pick === q.a;
    return `<p><b class="${ok ? 'up' : 'dn'}">${ok ? 'Correct.' : pick < 0 ? 'Not answered.' : 'Not quite.'}</b> <b>${'ABCD'[q.a]}</b> — ${q.opts[q.a][1] || ''}</p>${q.opts.map((o, j) => j === q.a ? '' : `<p class="w">✘ <b>${'ABCD'[j]}</b> ${o[0]} — ${o[1] || 'the book gives no separate note for this option — see the working for the right answer.'}</p>`).join('')}`;
  }
  function fromTag(tag, n = 10) {
    const gens = window.TFQ.byTag(tag), out = [], seen = new Set();
    for (let k = 0; out.length < n && k < n * 6; k++) { const q = gens[k % gens.length](); if (!seen.has(q.id)) { seen.add(q.id); out.push(q); } }
    return shuffle(out);
  }

  /* ---------- mock test ---------- */
  let M = null, tick = 0;
  function mockSetup() {
    mode = 'setup';
    root.innerHTML = `<div class="pg-top"><b>Mock test</b><button class="btn" data-act="hub">← My progress</button></div>
      <div class="mk-set"><label>Questions <select id="mk-n"><option>10</option><option selected>20</option><option>30</option></select></label>
      <label>Time per question <select id="mk-t"><option value="45">45 s</option><option value="60" selected>1 min</option><option value="90">1.5 min</option><option value="120">2 min</option></select></label>
      <label>Marking <select id="mk-m"><option value="1" selected>+1, −⅓ per wrong (TNEB, ESE, GATE MCQ)</option><option value="0">+1, no negative (TNPSC)</option></select></label></div>
      <p class="sm-note">The marking rule follows your book: “With −⅓ negative marking (TNEB, ESE, GATE MCQ) … With no negative marking (TNPSC) every guess can only gain.” Questions mix the book's own MCQs, numericals generated for this page (answers computed by code), concept questions and the missing-letter test.</p>
      <button class="btn pg-go" data-act="mkstart">Start the timer</button>`;
  }
  function mockStart(n, per, neg) {
    const lv = window.TFQ.levels, pick = (arr, k) => Array.from({ length: k }, () => arr[Math.floor(Math.random() * arr.length)]);
    const plan = [...pick(lv[1], Math.round(n * 0.3)), ...pick(lv[2], Math.round(n * 0.3)), ...pick(lv[3], Math.round(n * 0.25))];
    const qs = [], seen = new Set();
    const add = q => { if (q && !seen.has(q.id) && qs.length < n) { seen.add(q.id); qs.push(q); } };
    plan.forEach(f => add(f()));
    for (let k = 0; qs.length < n && k < n * 8; k++) add(window.TFML && Math.random() < 0.5 ? window.TFML.makeMCQ() : pick(window.TFQ.all(), 1)[0]());
    M = { qs: shuffle(qs), ans: qs.map(() => -1), flag: qs.map(() => false), i: 0, end: Date.now() + n * per * 1000, total: n * per, neg, t0: Date.now() };
    mode = 'mock'; showMock();
    clearInterval(tick); tick = setInterval(() => { const left = Math.round((M.end - Date.now()) / 1000); const el = root.querySelector('.mk-time'); if (el) { el.textContent = clock(left); el.classList.toggle('low', left <= 60); } if (left <= 0) mockSubmit(); }, 1000);
  }
  const clock = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
  function showMock() {
    const q = M.qs[M.i], left = Math.round((M.end - Date.now()) / 1000);
    root.innerHTML = `<div class="pg-top mk-top"><b>Mock test</b><span class="mk-time${left <= 60 ? ' low' : ''}">${clock(left)}</span><span>${M.ans.filter(a => a >= 0).length} of ${M.qs.length} answered</span><button class="btn pg-go" data-act="mksubmit">Submit</button></div>
      <div class="mk-pal">${M.qs.map((_, i) => `<button data-go="${i}" class="${M.ans[i] >= 0 ? 'ans' : ''}${M.flag[i] ? ' flag' : ''}${i === M.i ? ' cur' : ''}">${i + 1}</button>`).join('')}</div>
      <div class="sm-q"><div class="sm-qs">Question ${M.i + 1} · ${esc(q.src || '')}</div><div class="sm-qq">${q.q}</div><div class="opts">${q.opts.map((o, i) => `<button class="opt${M.ans[M.i] === i ? ' sel' : ''}" data-mi="${i}"><i>${'ABCD'[i]}</i><span>${o[0]}</span></button>`).join('')}</div>
      <div class="pg-acts"><button class="btn" data-act="mkprev" ${M.i ? '' : 'disabled'}>← Previous</button><button class="btn" data-act="mkflag">${M.flag[M.i] ? '★ Flagged' : '☆ Flag for review'}</button>${M.ans[M.i] >= 0 ? '<button class="btn" data-act="mkclear">Clear answer</button>' : ''}<button class="btn" data-act="mknext" ${M.i + 1 < M.qs.length ? '' : 'disabled'}>Next →</button></div></div>`;
  }
  function mockSubmit() {
    if (!M) return;
    clearInterval(tick);
    const r = M.qs.filter((q, i) => M.ans[i] === q.a).length, w = M.qs.filter((q, i) => M.ans[i] >= 0 && M.ans[i] !== q.a).length, n = M.qs.length;
    const score = Math.round((r - (M.neg ? w / 3 : 0)) * 100) / 100, secs = Math.min(M.total, Math.round((Date.now() - M.t0) / 1000));
    const byTag = {};
    M.qs.forEach((q, i) => { const t = byTag[q.tag || 'other'] || (byTag[q.tag || 'other'] = { a: 0, r: 0 }); t.a++; if (M.ans[i] === q.a) t.r++; });
    // record everything (blank counts as wrong for revision, not for the score)
    M.qs.forEach((q, i) => { const ok = M.ans[i] === q.a; if (q.id && q.id.startsWith('ml:')) record({ kind: 'ml', key: q.id.slice(3), tag: q.tag, ok }); else record({ id: q.id, tag: q.tag || 'other', ok, q }); });
    P.mocks.unshift({ t: Date.now(), n, r, w, score, pc: Math.round(Math.max(0, score) / n * 100), secs, neg: M.neg }); P.mocks.length = Math.min(P.mocks.length, 20); changed();
    mode = 'result';
    const T = TAGS();
    root.innerHTML = `<div class="pg-top"><b>Mock test result</b><button class="btn" data-act="hub">← My progress</button></div>
      <div class="pg-sum"><div><b>${score} / ${n}</b><span>score${M.neg ? ' (−⅓ per wrong)' : ''}</span></div><div><b>${r}</b><span>right</span></div><div><b>${w}</b><span>wrong</span></div><div><b>${n - r - w}</b><span>blank · ${Math.floor(secs / 60)} min ${secs % 60} s used</span></div></div>
      <div class="pg-tags">${Object.entries(byTag).map(([k, t]) => tagRow({ k, ...t }, T, () => false)).join('')}</div>
      <h4 class="sm-h">Every question, with the explanation</h4>
      ${M.qs.map((q, i) => `<details class="sm-fc"><summary><b class="${M.ans[i] === q.a ? 'up' : 'dn'}">${M.ans[i] === q.a ? '✓' : M.ans[i] < 0 ? '–' : '✗'} Q${i + 1}</b><span>${q.q.replace(/<[^>]+>/g, ' ').slice(0, 110)}…</span></summary><div class="sm-fcb"><div class="sm-qq">${q.q}</div><p>Your answer: <b>${M.ans[i] < 0 ? 'none' : 'ABCD'[M.ans[i]] + ' — ' + q.opts[M.ans[i]][0]}</b></p><div class="sm-qe">${explain(q, M.ans[i])}</div></div></details>`).join('')}
      <div class="pg-acts"><button class="btn pg-go" data-act="mock">Another mock test</button>${P.wrong.length ? `<button class="btn" data-act="revise">↻ Revise my mistakes (${P.wrong.length})</button>` : ''}</div>`;
    M = null;
  }

  /* ---------- events ---------- */
  root.addEventListener('click', e => {
    const t = e.target, act = t.closest('[data-act]') && t.closest('[data-act]').dataset.act;
    if (act === 'hub') { clearInterval(tick); M = null; render(); return; }
    if (act === 'mock') { mockSetup(); return; }
    if (act === 'mkstart') { mockStart(+root.querySelector('#mk-n').value, +root.querySelector('#mk-t').value, root.querySelector('#mk-m').value === '1'); return; }
    if (act === 'revise') { quiz(P.wrong.map(resolve).filter(Boolean).slice(0, 20), 'Revise my mistakes'); return; }
    if (act === 'tag') { const k = t.closest('[data-tag]').dataset.tag; quiz(fromTag(k), 'Practise: ' + (TAGS()[k] || k)); return; }
    if (act === 'ml') { window.TFML && window.TFML.startMissed(); return; }
    if (act === 'reset') { const b = t.closest('[data-act]'); b.outerHTML = '<span class="pg-confirm">Clear all your saved progress for Transformers? <button class="btn" data-act="reset2">Yes, clear it</button> <button class="btn" data-act="hub">No</button></span>'; return; }
    if (act === 'reset2') { P = EMPTY(); changed(); return; }
    if (act === 'qnext') { if (Q.i + 1 < Q.list.length) { Q.i++; showQ(); } else render(); return; }
    const qo = t.closest('[data-qi]');
    if (qo && mode === 'quiz' && !Q.done) {
      Q.done = true; const q = Q.list[Q.i], i = +qo.dataset.qi, ok = i === q.a; if (ok) Q.r++;
      root.querySelectorAll('[data-qi]').forEach((b, j) => { if (j === q.a) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
      const E = root.querySelector('.sm-qe'); E.hidden = false; E.innerHTML = explain(q, i);
      root.querySelector('[data-act="qnext"]').hidden = false; root.querySelector('.pg-top .score').textContent = `Score ${Q.r}`;
      if (q.id && q.id.startsWith('ml:')) record({ kind: 'ml', key: q.id.slice(3), tag: q.tag, ok }); else record({ id: q.id, tag: q.tag || 'other', ok, q });
      return;
    }
    if (mode !== 'mock' || !M) return;
    const mo = t.closest('[data-mi]'); if (mo) { const i = +mo.dataset.mi; M.ans[M.i] = M.ans[M.i] === i ? -1 : i; showMock(); return; }
    const go = t.closest('[data-go]'); if (go) { M.i = +go.dataset.go; showMock(); return; }
    if (act === 'mkprev' && M.i) { M.i--; showMock(); return; }
    if (act === 'mknext' && M.i + 1 < M.qs.length) { M.i++; showMock(); return; }
    if (act === 'mkflag') { M.flag[M.i] = !M.flag[M.i]; showMock(); return; }
    if (act === 'mkclear') { M.ans[M.i] = -1; showMock(); return; }
    if (act === 'mksubmit') {
      const blank = M.ans.filter(a => a < 0).length;
      if (!blank) { mockSubmit(); return; }
      const b = t.closest('[data-act]'); b.outerHTML = `<span class="pg-confirm">${blank} not answered. <button class="btn pg-go" data-act="mksubmit2">Submit anyway</button> <button class="btn" data-act="mkback">Keep going</button></span>`; return;
    }
    if (act === 'mksubmit2') { mockSubmit(); return; }
    if (act === 'mkback') { showMock(); return; }
  });
  render();
})();
