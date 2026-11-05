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

  /* ---------- line icons: each emoji the pages use is drawn as a matching line icon (24-unit grid, stroke = text colour).
     Swapped in as content is added to the page, so every view, the drawer, quizzes and the lab get the same set. ---------- */
  const ICP = {
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    cal2: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17.3h.01M12 17.3h.01"/>',
    chart: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M8.5 16v-4M12 16V8M15.5 16v-6"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5M18.5 6.5l1.2-1.2"/>',
    clock: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M3.8 5.5l3-2.5M20.2 5.5l-3-2.5"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    book: '<path d="M5 19.5v-15A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5a1.5 1.5 0 0 0 1.5 1.5H19v-3M9 7.5h6"/>',
    open: '<path d="M12 6.5C10 5 7.5 4.5 3.5 4.5v14c4 0 6.5.5 8.5 2 2-1.5 4.5-2 8.5-2v-14c-4 0-6.5.5-8.5 2zM12 6.5v14"/>',
    note: '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 3.5V8h4.5M9 12.5h6M9 16h4"/>',
    page: '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 3.5V8h4.5"/>',
    shelf: '<rect x="3.5" y="4" width="4" height="16" rx="1"/><rect x="8.5" y="6" width="4" height="14" rx="1"/><path d="m14 7.4 3.9-1 3.4 13.1-3.9 1z"/>',
    table: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M3.5 14.5h17M9.5 9v11"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    home: '<path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2v.5h5V16c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    fx: '<path d="M9.5 20.5c1.6 0 2.2-1 2.6-3l2-11c.4-2 1-3 2.6-3M7.5 9.5h7M15 13l5 6M20 13l-5 6"/>',
    alert: '<path d="M10.3 4.2 2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0zM12 9.5V14M12 17.2v.1"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    pen: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3M13 20.5h7"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h3.5"/>',
    type: '<path d="M3.5 18 8 6l4.5 12M5.2 13.5h5.6M15 10.5c.8-.7 1.6-1 2.6-1 1.6 0 2.4.9 2.4 2.5V18M20 14.2c-3.5-.3-5.3.5-5.3 2 0 1.1.8 1.8 2 1.8 1.4 0 2.6-.8 3.3-2"/>',
    cards: '<rect x="3.5" y="6.5" width="12" height="14" rx="2"/><path d="M8.5 6.5V5A1.5 1.5 0 0 1 10 3.5h9A1.5 1.5 0 0 1 20.5 5v11a1.5 1.5 0 0 1-1.5 1.5h-3.5"/>',
    sliders: '<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="9.5" r="1.6"/><path d="m4 17 4.5-4.5 3.5 3.5 3-3 5 5"/>',
    cap: '<path d="M2.5 9.5 12 5l9.5 4.5L12 14zM6.5 11.5V16c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2v-4.5M21.5 9.5v5"/>',
    bank: '<path d="M3 9.5 12 4l9 5.5zM5.5 10v7.5M10 10v7.5M14 10v7.5M18.5 10v7.5M3 20.5h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    up: '<path d="M3.5 17 9.5 11l4 4 7-7.5M15 7.5h5.5V13"/>',
    down: '<path d="M3.5 7 9.5 13l4-4 7 7.5M15 16.5h5.5V11"/>',
    map: '<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5zM9 4.5v13M15 6.5v13"/>',
    save: '<path d="M5.5 3.5H16l3.5 3.5v11.5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2zM8 3.5v5h7v-5M7.5 20.5v-6h9v6"/>',
    dl: '<path d="M12 4v11M6.5 9.5 12 15l5.5-5.5M5 20h14"/>',
    ul: '<path d="M12 15V4M6.5 9.5 12 4l5.5 5.5M5 20h14"/>',
    mark: '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>',
    offline: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 8M12 11v9M9 17l3 3 3-3"/>',
    check: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="m8 12.5 3 3 5-6"/>',
    repeat: '<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20M16.5 2.5 20 6l-3.5 3.5M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4M7.5 21.5 4 18l3.5-3.5"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.2 3.6-7.6.6 1.6 1.5 2.6 2.6 3.1-.3-3 .9-5.7 3-7.3.4 3.2 4.8 6 4.8 11.4 0 3.8-3.1 6.6-7.5 6.6z"/>',
    ring: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3.5v5M20.3 14l-4.9-1"/>',
    leaf: '<path d="M12 20.5V12c0-4 2.8-7 8-7 0 5-3 8-8 7M12 15c0-3-2.2-5.5-7-5.5 0 4 2.6 6 7 5.5"/>',
    flag: '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.7 6 3.5h4l2 5 2-5h4l-2.5 7.2M10.8 13.6l1.2-.9v4.6"/>',
    trophy: '<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0zM7.5 6h-3v1.5a3 3 0 0 0 3.1 3M16.5 6h3v1.5a3 3 0 0 1-3.1 3M12 13.5v7M8.5 20.5h7"/>',
    crown: '<path d="m3.5 8 4.5 4 4-6.5 4 6.5 4.5-4-1.8 10H5.3zM5.5 20.5h13"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16.5 6.5 19 9M14 9l2 2"/>',
    spark: '<path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5zM18.5 15.5c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3z"/>',
    twin: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
    brain: '<path d="M9 4.5A2.5 2.5 0 0 0 6.5 7a2.5 2.5 0 0 0-2 4 2.8 2.8 0 0 0 1 4.5A2.8 2.8 0 0 0 9 19.5a2 2 0 0 0 3-1V6a2 2 0 0 0-3-1.5zM15 4.5A2.5 2.5 0 0 1 17.5 7a2.5 2.5 0 0 1 2 4 2.8 2.8 0 0 1-1 4.5 2.8 2.8 0 0 1-3.5 4 2 2 0 0 1-3-1"/>',
    ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4"/>',
    abacus: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 8.5h16M4 15.5h16"/><circle cx="8.5" cy="8.5" r="1.4"/><circle cx="12.5" cy="8.5" r="1.4"/><circle cx="10.5" cy="15.5" r="1.4"/><circle cx="15.5" cy="15.5" r="1.4"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.9 1.5-2-.4-1.4.4-2.5 1.9-2.5h2a3.1 3.1 0 0 0 3.1-3.1C20.5 7.3 16.7 3.5 12 3.5zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01"/>',
    tree: '<path d="M12 21v-6c-3.6 0-6-2-6-4.8 0-1.6.8-2.9 2-3.6C8.6 4.5 10.1 3 12 3s3.4 1.5 4 3.6c1.2.7 2 2 2 3.6C18 13 15.6 15 12 15M9.5 21h5"/>',
    drop: '<path d="M12 3.5s-6 6.6-6 10.9a6 6 0 0 0 12 0c0-4.3-6-10.9-6-10.9z"/>',
    scale: '<path d="M12 4v16.5M7.5 20.5h9M5 7.5h14M5 7.5 2.5 13a2.5 2.5 0 0 0 5 0zM19 7.5 16.5 13a2.5 2.5 0 0 0 5 0z"/>',
    plug: '<path d="M9 3.5V8M15 3.5V8M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5v4"/>',
    ask: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.5M12 16.8v.1"/>',
    ball: '<circle cx="12" cy="10.5" r="6.5"/><path d="M7 18.5h10l1 2H6zM9.5 8.5A3 3 0 0 1 12 7"/>',
    pin: '<path d="M8.5 3.5h7M10 3.5v6l-3.5 4.5h11L14 9.5v-6M12 14v7"/>'
  };
  const EMI = { '📅': 'cal', '🗓': 'cal2', '📊': 'chart', '⏱': 'timer', '⏰': 'clock', '⚡': 'bolt', '📘': 'book', '📗': 'book', '📖': 'open', '📝': 'note', '📄': 'page',
    '📚': 'shelf', '📒': 'table', '⭐': 'star', '🏠': 'home', '💡': 'bulb', '📐': 'fx', '⚠': 'alert', '🎯': 'target', '✍': 'pen', '🔢': 'calc', '🔤': 'type', '🃏': 'cards',
    '⚙': 'sliders', '🧭': 'compass', '🖼': 'image', '🎓': 'cap', '🏛': 'bank', '🔎': 'search', '📈': 'up', '📉': 'down', '🗺': 'map', '💾': 'save', '⬇': 'dl', '⬆': 'ul',
    '🔖': 'mark', '📶': 'offline', '✅': 'check', '🔁': 'repeat', '🔥': 'flame', '🍩': 'ring', '🌱': 'leaf', '💯': 'flag', '🏅': 'medal', '🏆': 'trophy', '🥇': 'crown',
    '💜': 'heart', '☀': 'sun', '👁': 'eye', '🌙': 'moon', '🗝': 'key', '🔑': 'key', '✨': 'spark', '👯': 'twin', '🧠': 'brain', '📏': 'ruler', '🧮': 'abacus',
    '🎨': 'palette', '🌳': 'tree', '💧': 'drop', '⚖': 'scale', '🔌': 'plug', '❓': 'ask', '🔮': 'ball', '📌': 'pin' };
  const icon = n => `<svg class="ic ic-${n}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICP[n]}</svg>`;
  const EMRX = new RegExp(`(${Object.keys(EMI).join('|')})\\uFE0F?`, 'gu'), EMHAS = new RegExp(`(?:${Object.keys(EMI).join('|')})`, 'u');
  const NOICON = 'svg, option, select, textarea, script, style, title, [data-noicon]';
  const iconText = n => {
    const p = n.parentElement; if (!p || p.closest(NOICON)) return;
    const t = document.createElement('template');
    t.innerHTML = n.data.split(EMRX).map((x, i) => i % 2 ? icon(EMI[x]) : esc(x)).join('');
    p.replaceChild(t.content, n);
  };
  const iconize = r => {
    if (r.nodeType === 3) { if (EMHAS.test(r.data)) iconText(r); return; }
    if (r.nodeType !== 1 || r.closest(NOICON) || !EMHAS.test(r.textContent)) return;
    const w = document.createTreeWalker(r, NodeFilter.SHOW_TEXT), hit = [];
    for (let n; (n = w.nextNode());) if (EMHAS.test(n.data)) hit.push(n);
    hit.forEach(iconText);
  };
  new MutationObserver(rs => rs.forEach(m => m.addedNodes.forEach(iconize))).observe(document.body, { childList: true, subtree: true });
  iconize(document.body);
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
  const LABN = {"106":2,"123":2,"140":2,"154":1,"166":1,"179":1,"190":1,"201":1,"212":1,"222":2,"235":2,"252":5,"265":4,"275":5,"283":6,"296":6,"308":6,"316":8,"339":16,"365":8,"380":15,"409":2,"417":3,"429":5,"440":13,"468":3,"475":12,"497":11,"526":9,"550":11,"572":7,"580":9,"601":4,"607":4,"614":3,"621":5,"627":15,"657":3,"663":10,"678":7,"696":7,"714":4,"723":10,"759":3,"767":13,"800":2,"807":15,"838":4,"849":6,"867":9,"888":8,"906":7,"913":4,"935":3,"941":4,"953":3,"961":10,"998":7,"1008":4,"1027":6,"1042":3,"1048":3,"1055":6};
  const SIMF = ['engine', 'c', 'x', 'p', 'k', 'e', 'm', 'b', 'figs'];
  let simsP = null;
  /* ---------- ⚡ Electrical Simulation Laboratory: catalogue (the engines load only when an experiment opens) ---------- */
  const loadJs = f => new Promise((ok, no) => { const el = document.createElement('script'); el.src = `sims/${f}.js?v=${SWV}`; el.onload = ok; el.onerror = () => no(new Error('Could not load the lab')); document.head.appendChild(el); });
  const labP = {}; const loadLabCore = () => labP.core ||= loadJs('lab').catch(e => { delete labP.core; throw e; });
  const loadLab = n => labP[n] ||= loadLabCore().then(() => loadJs('lx' + n)).catch(e => { delete labP[n]; throw e; });
  const IC = { // line illustrations for the eight laboratories (24×24 strokes)
    ckt: '<path d="M2 12h3l1.5-4 3 8 3-8 3 8 1.5-4H22"/><circle cx="2" cy="12" r="1"/><circle cx="22" cy="12" r="1"/>',
    tx: '<rect x="7" y="3" width="10" height="18" rx="1.5"/><path d="M4 7c2 0 2 2 0 2s-2 2 0 2 2 2 0 2-2 2 0 2M20 7c-2 0-2 2 0 2s2 2 0 2-2 2 0 2 2 2 0 2"/>',
    dc: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
    im: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3.5a8.5 8.5 0 0 1 7.4 4.3M19.4 7.8l-.2-3M19.4 7.8l-3 .3"/>',
    sm: '<circle cx="12" cy="12" r="8.5"/><path d="M6 12c1.5-4 3-4 4.5 0s3 4 4.5 0 2-2 3-1"/>',
    ps: '<circle cx="5" cy="12" r="3"/><path d="M8 12h3M11 6v12M11 9h6M11 15h6M17 6v12M17 12h4M21 10l1 2-1 2"/>',
    td: '<path d="M12 2 7 22M12 2l5 20M8.5 15h7M9.6 10h4.8M5 7h14M3 7l2 3M21 7l-2 3"/>',
    pe: '<path d="M2 12h6M16 12h6M8 6v12l8-6zM16 6v12"/>',
  };
  const LXCAT = [['ckt', 'Electrical Circuits', '#315EED', ['339', '380']], ['tx', 'Transformers', '#8057E8', ['497']], ['dc', 'DC Machines', '#E08A0B', ['475']], ['im', 'Induction Motors', '#18A878', ['526']], ['sm', 'Synchronous Machines', '#D9467A', ['550']], ['ps', 'Power Systems', '#0E93A8', ['678', '696', '723']], ['td', 'Transmission & Distribution', '#5B5BD6', ['627']], ['pe', 'Power Electronics', '#C8551F', ['961', '849']]];
  // [id, laboratory, name, difficulty 1–3, topics, search words]
  const LXC = [
    ['ohm', 'ckt', "Ohm's Law Simulator", 1, ['339'], 'V = IR resistor current voltage power ammeter voltmeter'], ['series', 'ckt', 'Series Resistance', 1, ['339'], 'series resistors voltage divider KVL'], ['parallel', 'ckt', 'Parallel Resistance', 1, ['339'], 'parallel resistors current divider conductance'],
    ['rlc', 'ckt', 'Series and Parallel RLC Circuits', 2, ['380'], 'impedance reactance phasor power factor AC inductor capacitor'], ['kcl', 'ckt', "Kirchhoff's Current Law", 1, ['339'], 'KCL node nodal analysis Millman'], ['kvl', 'ckt', "Kirchhoff's Voltage Law", 1, ['339'], 'KVL loop mesh'],
    ['thevenin', 'ckt', "Thevenin's Theorem", 2, ['339'], 'Vth Rth equivalent network theorem'], ['norton', 'ckt', "Norton's Theorem", 2, ['339'], 'Norton current source equivalent theorem'], ['superpos', 'ckt', 'Superposition Theorem', 2, ['339'], 'superposition linear sources theorem'],
    ['maxpower', 'ckt', 'Maximum Power Transfer', 2, ['339'], 'maximum power transfer matching RL Rth theorem'], ['stardelta', 'ckt', 'Star-Delta Transformation', 2, ['339'], 'star delta wye Y transformation'], ['resonance', 'ckt', 'Series and Parallel Resonance', 3, ['380'], 'resonance Q factor bandwidth tank'],
    ['tx-work', 'tx', 'Transformer Working Principle', 1, ['497'], 'mutual induction Faraday flux DC'], ['tx-emf', 'tx', 'EMF Equation', 1, ['497'], 'E = 4.44 f N Φm emf equation'], ['tx-ratio', 'tx', 'Turns Ratio', 2, ['497'], 'turns ratio V1/V2 = N1/N2 = I2/I1 flux density ideal practical'],
    ['tx-updown', 'tx', 'Step-Up and Step-Down Transformer', 1, ['497'], 'step up step down turns'], ['tx-taps', 'tx', 'Voltage Transformation', 2, ['497'], 'tap changer volts per turn voltage transformation'], ['tx-current', 'tx', 'Current Transformation', 1, ['497'], 'ampere turns current ratio CT'],
    ['tx-flux', 'tx', 'Magnetic Flux Variation', 2, ['497'], 'V/f flux density saturation B-H magnetising current'], ['tx-loss', 'tx', 'Core Loss and Copper Loss', 2, ['497'], 'hysteresis eddy current Steinmetz iron copper losses'], ['tx-oc', 'tx', 'Open Circuit Test', 2, ['497'], 'open circuit test no load core loss R0 X0'],
    ['tx-sc', 'tx', 'Short Circuit Test', 2, ['497'], 'short circuit test copper loss equivalent impedance'], ['tx-eff', 'tx', 'Transformer Efficiency', 2, ['497'], 'efficiency maximum efficiency load'], ['tx-reg', 'tx', 'Voltage Regulation', 3, ['497'], 'voltage regulation power factor leading lagging'],
    ['dc-emf', 'dc', 'DC Generator EMF Equation', 1, ['475'], 'E = PΦZN/60A lap wave generator emf'], ['dc-backemf', 'dc', 'DC Motor Back EMF', 1, ['475'], 'back emf Eb = V − IaRa speed'], ['dc-torque', 'dc', 'DC Motor Torque', 2, ['475'], 'torque 0.159 PΦZIa/A'],
    ['dc-shunt', 'dc', 'DC Shunt Motor', 2, ['475'], 'shunt motor constant speed'], ['dc-series', 'dc', 'DC Series Motor', 2, ['475'], 'series motor traction torque I squared'], ['dc-compound', 'dc', 'DC Compound Motor', 3, ['475'], 'compound cumulative differential'],
    ['dc-speed', 'dc', 'Speed Control', 2, ['475'], 'speed control armature resistance field weakening Ward Leonard'], ['dc-char', 'dc', 'Motor Characteristics', 2, ['475'], 'speed torque characteristics shunt series compound'],
    ['im-rmf', 'im', 'Rotating Magnetic Field', 1, ['526'], 'rotating magnetic field 1.5 Fm three phase'], ['im-ns', 'im', 'Synchronous Speed', 1, ['526'], 'Ns = 120f/P synchronous speed poles'], ['im-slip', 'im', 'Slip Calculation', 1, ['526'], 'slip s = (Ns − Nr)/Ns'],
    ['im-nr', 'im', 'Rotor Speed', 1, ['526'], 'rotor speed Nr = Ns(1 − s)'], ['im-fr', 'im', 'Rotor Frequency', 1, ['526'], 'rotor frequency fr = sf rotor emf'], ['im-ts', 'im', 'Torque-Slip Characteristics', 3, ['526'], 'torque slip curve maximum torque induction motor'],
    ['im-start', 'im', 'Starting Torque', 2, ['526'], 'starting torque DOL star delta autotransformer rotor resistance'], ['im-tmax', 'im', 'Maximum Torque', 2, ['526'], 'maximum torque sm = R2/X2 pull-out Kloss'], ['im-eqc', 'im', 'Equivalent Circuit', 3, ['526'], 'equivalent circuit R2/s magnetising'],
    ['im-eff', 'im', 'Efficiency and Losses', 2, ['526'], 'power flow air gap rotor copper loss efficiency'],
    ['sm-emf', 'sm', 'Alternator EMF Equation', 1, ['550'], 'alternator emf 4.44 f Φ T kp kd frequency PN/120'], ['sm-pitch', 'sm', 'Pitch Factor', 2, ['550'], 'pitch factor short pitch coil span harmonics'], ['sm-dist', 'sm', 'Distribution Factor', 2, ['550'], 'distribution factor breadth slots'],
    ['sm-reg', 'sm', 'Voltage Regulation', 2, ['550'], 'alternator regulation EMF method phasor'], ['sm-zs', 'sm', 'Synchronous Impedance Method', 2, ['550'], 'synchronous impedance OC SC test'], ['sm-pangle', 'sm', 'Power Angle Characteristics', 2, ['550'], 'power angle load angle P = EV sin δ / X stability'],
    ['sm-sync', 'sm', 'Synchronization', 1, ['550'], 'synchronising synchroscope dark lamp paralleling'], ['sm-vcurve', 'sm', 'V-Curves of Synchronous Motor', 3, ['550'], 'V curves excitation over excited under excited power factor'],
    ['ps-lf', 'ps', 'Load Flow Basics', 3, ['696'], 'load flow Gauss Seidel bus voltage'], ['ps-pu', 'ps', 'Per Unit System', 1, ['678'], 'per unit base change'], ['ps-fault', 'ps', 'Fault Analysis', 3, ['678'], 'fault LG LL LLG three phase sequence networks'],
    ['ps-scc', 'ps', 'Short Circuit Calculation', 2, ['678'], 'short circuit fault MVA fault level'], ['ps-sym', 'ps', 'Symmetrical Components', 2, ['678'], 'symmetrical components positive negative zero sequence'], ['ps-cb', 'ps', 'Circuit Breaker Ratings', 2, ['723'], 'circuit breaker making breaking capacity asymmetrical'],
    ['td-short', 'td', 'Short Transmission Line', 1, ['627'], 'short line regulation efficiency'], ['td-medium', 'td', 'Medium Transmission Line', 2, ['627'], 'medium line nominal pi T'], ['td-long', 'td', 'Long Transmission Line', 3, ['627'], 'long line surge impedance SIL propagation constant'],
    ['td-abcd', 'td', 'ABCD Parameters', 2, ['627'], 'ABCD constants two port'], ['td-reg', 'td', 'Voltage Regulation', 2, ['627'], 'line regulation power factor'], ['td-eff', 'td', 'Transmission Efficiency', 1, ['627'], 'transmission efficiency loss high voltage'],
    ['td-corona', 'td', 'Corona Loss', 2, ['627'], 'corona Peek disruptive critical voltage'], ['td-ferranti', 'td', 'Ferranti Effect', 2, ['627'], 'Ferranti effect open line voltage rise charging'],
    ['pe-hwr', 'pe', 'Single Phase Half-Wave Rectifier', 1, ['961', '849'], 'half wave rectifier diode SCR firing angle'], ['pe-fwr', 'pe', 'Single Phase Full-Wave Rectifier', 1, ['961', '849'], 'full wave centre tap rectifier'], ['pe-bridge', 'pe', 'Bridge Rectifier', 1, ['849', '961'], 'bridge rectifier capacitor filter ripple'],
    ['pe-3ph', 'pe', 'Three Phase Rectifier', 2, ['961'], 'three phase rectifier 1.35 VL 6 pulse'], ['pe-buck', 'pe', 'Buck Converter', 2, ['961'], 'buck chopper step down duty ratio'], ['pe-boost', 'pe', 'Boost Converter', 2, ['961'], 'boost step up duty ratio'],
    ['pe-inv', 'pe', 'Single Phase Inverter', 2, ['961'], 'inverter square wave harmonics THD'], ['pe-pwm', 'pe', 'PWM Control', 3, ['961'], 'PWM sinusoidal modulation index'],
  ];
  const FILE2 = new Set(['sm', 'ps', 'td', 'pe']);
  const LXI = {}; LXC.forEach(([id, cat, n, d, t, kw], i) => { LXI[id] = { id, cat, n, d, t, kw, i, f: FILE2.has(cat) ? 2 : 1 }; });
  const catOf = k => LXCAT.find(c => c[0] === k);
  const lxIcon = (k, sz = 24) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
  // exam relevance from the book's own data: the topic's TNEB priority, and the number of GATE sums the book files under it
  const lxEx = m => { const ts = m.t.map(T).filter(Boolean); return { tneb: ts.some(t => t.pr === 'HIGH'), pr: ts.map(t => t.pr).filter(Boolean)[0] || '', gate: ts.reduce((a, t) => a + (t.n.gate || 0), 0) }; };
  const labRec = id => P.lab.x[id] || null;
  const LGO = 5, goals = r => !r ? 0 : [((r.pk || []).length >= 3 || (r.p || 0) >= 3), (r.k || {}).c, (r.k || {}).g, (r.k || {}).u, (r.q || [0, 0])[1] >= 2].filter(Boolean).length;
  const labStatus = id => { const r = labRec(id); return !r || !r.s ? ['ns', 'Not started'] : r.done ? ['dn', 'Completed'] : ['ip', `In progress · ${goals(r)}/5`]; };
  const fmtT = s => { s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; };
  const ring = (p, c, sz = 46) => `<svg viewBox="0 0 36 36" width="${sz}" height="${sz}" class="lxring" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--lx-line)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(p * 94.25).toFixed(1)} 94.25" transform="rotate(-90 18 18)"/><text x="18" y="21.5" text-anchor="middle" font-size="9" font-weight="800" fill="var(--lx-ink)">${Math.round(p * 100)}%</text></svg>`;
  function labTotals() {
    const xs = Object.entries(P.lab.x).filter(([id]) => LXI[id]), started = xs.filter(([, r]) => r.s).length, done = xs.filter(([, r]) => r.done).length, secs = xs.reduce((a, [, r]) => a + (r.t || 0), 0), q = xs.reduce((a, [, r]) => [a[0] + ((r.q || [])[0] || 0), a[1] + ((r.q || [])[1] || 0)], [0, 0]);
    const prog = LXC.reduce((a, [id]) => a + goals(labRec(id)), 0) / (LXC.length * LGO);
    return { started, done, secs, q, prog };
  }
  function labRecommend(n = 3) {
    const S = stats(), out = [], seen = new Set();
    // weakest practised topics first (accuracy below 70 % on 3+ answers), then the next beginner experiments not started
    const weak = LXCAT.flatMap(c => c[3]).map(t => [t, S.by[t]]).filter(([, s]) => s && s.a >= 3 && s.r / s.a < 0.7).sort((a, b) => a[1].r / a[1].a - b[1].r / b[1].a);
    weak.forEach(([t, s]) => LXC.filter(e => e[4].includes(t) && !(labRec(e[0]) || {}).done).sort((a, b) => a[3] - b[3]).slice(0, 2).forEach(e => { if (out.length < n && !seen.has(e[0])) { seen.add(e[0]); out.push([e[0], `Your accuracy in ${short(T(t))} is ${pct(s.r, s.a)} % — see it working`]); } }));
    [1, 2, 3].forEach(d => LXC.filter(e => e[3] === d && !(labRec(e[0]) || {}).s).forEach(e => { if (out.length < n && !seen.has(e[0])) { seen.add(e[0]); out.push([e[0], d === 1 ? 'Not started yet — a beginner experiment' : 'Not started yet']); } }));
    LXC.filter(e => !(labRec(e[0]) || {}).done).forEach(e => { if (out.length < n && !seen.has(e[0])) { seen.add(e[0]); out.push([e[0], `In progress — ${goals(labRec(e[0]))} of 5 steps done`]); } });
    return out;
  }
  const todaysLab = () => { const k = todayKey(); let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0; return LXC[h % LXC.length][0]; };
  let lxQ = '', lxF = 'all', lxS = 'rec';
  function labRows(cat) {
    const q = lxQ.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
    let L = LXC.filter(e => !cat || e[1] === cat).map(e => LXI[e[0]]);
    if (words.length) L = L.filter(m => { const h = `${m.n} ${catOf(m.cat)[1]} ${m.kw} ${m.t.map(t => T(t) ? T(t).t : '').join(' ')} ${['', 'beginner', 'intermediate', 'advanced'][m.d]}`.toLowerCase(); return words.every(w => h.includes(w)); });
    const st = id => labStatus(id)[0];
    L = L.filter(m => lxF === 'all' || (lxF === 'ns' && st(m.id) === 'ns') || (lxF === 'ip' && st(m.id) === 'ip') || (lxF === 'dn' && st(m.id) === 'dn') || (lxF === 'd1' && m.d === 1) || (lxF === 'd2' && m.d === 2) || (lxF === 'd3' && m.d === 3) || (lxF === 'tneb' && lxEx(m).tneb) || (lxF === 'gate' && lxEx(m).gate >= 25) || (lxF === 'fav' && P.lab.f[m.id]));
    const rec = new Map(labRecommend(72).map(([id], i) => [id, i]));
    L.sort(lxS === 'rec' ? (a, b) => (rec.get(a.id) ?? 999) - (rec.get(b.id) ?? 999) || a.i - b.i : lxS === 'recent' ? (a, b) => ((labRec(b.id) || {}).l || 0) - ((labRec(a.id) || {}).l || 0) || a.i - b.i : lxS === 'used' ? (a, b) => ((labRec(b.id) || {}).t || 0) - ((labRec(a.id) || {}).t || 0) || a.i - b.i : (a, b) => a.d - b.d || a.i - b.i);
    return L;
  }
  const DN = ['', 'Beginner', 'Intermediate', 'Advanced'];
  function labRowHtml(m) { const c = catOf(m.cat), [sk, sl] = labStatus(m.id), ex = lxEx(m), r = labRec(m.id);
    return `<div class="lxrow" style="--cc:${c[2]}"><a class="lxrl" href="#lab-${m.id}"><span class="lxri">${lxIcon(m.cat, 22)}</span><span class="lxrt"><b>${esc(m.n)}</b><small>${esc(c[1])}${r && r.t ? ` · ${fmtT(r.t)}` : ''}</small></span><span class="lxrc"><span class="lxchip d${m.d}">${DN[m.d]}</span>${ex.tneb ? '<span class="lxchip t">TNEB AE</span>' : ''}${ex.gate >= 25 ? '<span class="lxchip g">GATE</span>' : ''}<span class="lxst ${sk}">${sl}</span></span></a><button class="lxstar" data-fav="${m.id}" aria-pressed="${!!P.lab.f[m.id]}" aria-label="Favourite: ${esc(m.n)}">${P.lab.f[m.id] ? '★' : '☆'}</button></div>`; }
  function paintLabList(cat) { const box = $('#lxlist'); if (!box) return; const L = labRows(cat);
    box.innerHTML = L.length ? L.map(labRowHtml).join('') : `<div class="lxempty">No experiment matches${lxQ ? ` “${esc(lxQ)}”` : ''}${lxF !== 'all' ? ' with this filter' : ''}. Try another word — a formula such as “Ns = 120f/P” or a part such as “capacitor” also works.</div>`;
    const n = $('#lxcount'); if (n) n.textContent = `${L.length} experiment${L.length === 1 ? '' : 's'}`; }
  async function viewLab(tok, cat) {
    setShell('sims'); document.title = 'Electrical Simulation Laboratory · TNEB AE Study Site';
    main.onclick = null; main.oninput = null;
    const tt = labTotals(), cnt = {}; LXC.forEach(e => cnt[e[1]] = (cnt[e[1]] || 0) + 1);
    const last = Object.entries(P.lab.x).filter(([id, r]) => LXI[id] && r.l).sort((a, b) => b[1].l - a[1].l)[0], rec = labRecommend(3), tdy = todaysLab(), tdr = labRec(tdy) || {}, favs = Object.keys(P.lab.f).filter(id => LXI[id]);
    // lab minutes, last 14 days: one series of bars from the baseline
    const D = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); const k = dayOf(d); D.push([k, (P.lab.d[k] || 0) / 60]); }
    const mx = Math.max(10, ...D.map(d => d[1]));
    const spark = `<svg viewBox="0 0 280 70" class="lxspark" role="img" aria-label="Lab minutes, last 14 days">${D.map(([k, m], i) => `<rect x="${i * 20 + 3}" y="${(62 - 54 * m / mx).toFixed(1)}" width="14" height="${Math.max(m ? 3 : 1.5, 54 * m / mx).toFixed(1)}" rx="4" fill="${m ? '#fff' : 'rgba(255,255,255,.25)'}"><title>${k}: ${Math.round(m)} min</title></rect>`).join('')}</svg>`;
    const q = (id, why) => { const m = LXI[id], c = catOf(m.cat); return `<a class="lxmini" href="#lab-${id}" style="--cc:${c[2]}"><span class="lxri">${lxIcon(m.cat, 18)}</span><span><b>${esc(m.n)}</b>${why ? `<small>${esc(why)}</small>` : ''}</span></a>`; };
    main.innerHTML = `<div class="lx lxd">
      <div class="crumbs"><a href="#home">All topics</a> › ${cat ? `<a href="#sims">Simulation Lab</a> › ${esc(catOf(cat)[1])}` : 'Simulation Lab'}</div>
      <header class="lxtop"><div class="lxlogo"><span>⚡</span><div><h1>Electrical Simulation Laboratory</h1><p>Understand Electrical Engineering by Experimenting.</p></div></div>
        <div class="lxtools"><label class="lxsearch"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="lxq" type="search" placeholder="Search experiments, formulas, parts…" value="${esc(lxQ)}" aria-label="Search simulations"></label>
          <button class="lxtool" data-lx="filter" aria-label="Filters">${'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>'}<span>Filter</span></button>
          <button class="lxtool" data-lx="theme" aria-label="Switch light or dark theme"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg></button>
          <span class="lxprog" title="Overall lab progress">${ring(tt.prog, '#8057E8', 40)}</span></div></header>
      ${cat ? '' : `<section class="lxhero"><div class="lxhl"><h2>Explore. Experiment. Understand.</h2><p>Master electrical engineering through interactive simulations, real-time calculations and visual experiments.</p>
        <div class="lxhs"><div><b>${LXC.length}</b><span>experiments</span></div><div><b>${tt.done}</b><span>completed</span></div><div><b>${fmtT(tt.secs)}</b><span>learning time</span></div><div><b>${Math.round(tt.prog * 100)} %</b><span>lab progress</span></div></div></div>
        <div class="lxhr${tt.secs ? '' : ' lxnodata'}"><span class="lxhk">Your lab minutes · last 14 days</span>${tt.secs ? spark : ''}<span class="lxhk">${tt.secs ? `${tt.started} started · ${tt.q[0]} lab questions answered` : 'Nothing yet — open any experiment to begin. Only your own use is counted, on this device.'}</span></div></section>
      <section class="lxquick">
        <div class="lxqc"><h3>Continue learning</h3>${last ? q(last[0], `${goals(last[1])} of 5 steps · ${fmtT(last[1].t)}`) : q('ohm', 'Start here — the simplest circuit')}</div>
        <div class="lxqc"><h3>Recommended experiments</h3>${rec.map(([id, why]) => q(id, why)).join('')}</div>
        <div class="lxqc"><h3>Today’s lab challenge</h3>${q(tdy, tdr.qd === todayKey() ? '✓ You practised it today' : 'Answer 3 questions in its Exam practice tab')}<a class="lxbtn go sm" href="#lab-${tdy}-x">Take the challenge</a></div>
        <div class="lxqc"><h3>My favourite simulations</h3>${favs.length ? favs.slice(0, 4).map(id => q(id, labStatus(id)[1])).join('') : '<p class="lxmuted">Tap ☆ on any experiment to keep it here.</p>'}</div></section>`}
      <section class="lxcats" aria-label="Laboratories">${LXCAT.filter(c => !cat || c[0] === cat).map(([k, n, col, ts]) => { const ids = LXC.filter(e => e[1] === k).map(e => e[0]), p = ids.reduce((a, id) => a + goals(labRec(id)), 0) / (ids.length * LGO), ds = [...new Set(LXC.filter(e => e[1] === k).map(e => e[3]))].sort(), nx = ids.find(id => !(labRec(id) || {}).done) || ids[0];
        return `<div class="lxcat" role="link" tabindex="0" data-href="#sims-${k}" style="--cc:${col}"><div class="lxcatt"><span class="lxill">${lxIcon(k, 34)}</span>${ring(p, col, 44)}</div><h3>${esc(n)}</h3><p>${ids.length} experiments · ${DN[ds[0]]}${ds.length > 1 ? ` → ${DN[ds[ds.length - 1]]}` : ''}</p><a class="lxbtn go sm" href="#lab-${nx}">Start experiment</a></div>`; }).join('')}</section>
      <section class="lxlib" id="lxlib"><div class="lxlibh"><h2>${cat ? esc(catOf(cat)[1]) + ' experiments' : 'Simulation library'}</h2><span id="lxcount" class="lxmuted"></span>
        <label class="lxsort">Sort <select id="lxsort"><option value="rec"${lxS === 'rec' ? ' selected' : ''}>Recommended</option><option value="recent"${lxS === 'recent' ? ' selected' : ''}>Recently used</option><option value="used"${lxS === 'used' ? ' selected' : ''}>Most used (by you)</option><option value="diff"${lxS === 'diff' ? ' selected' : ''}>Difficulty</option></select></label></div>
        <div class="lxfil" role="group" aria-label="Filter experiments">${[['all', 'All experiments'], ['ns', 'Not started'], ['ip', 'In progress'], ['dn', 'Completed'], ['d1', 'Beginner'], ['d2', 'Intermediate'], ['d3', 'Advanced'], ['tneb', 'TNEB AE important'], ['gate', 'GATE important'], ['fav', 'Favourites']].map(([k, n]) => `<button class="lxpill" data-f="${k}" aria-pressed="${lxF === k}">${n}</button>`).join('')}</div>
        <p class="lxmuted lxnote">“TNEB AE important” = the topic is marked HIGH priority in your book; “GATE important” = the book files 25 or more GATE sums under the topic. Status and time are yours only, kept on this device (and your account if you are signed in).</p>
        <div id="lxlist" class="lxlist"></div></section>
      <section class="lxmore"><a class="lxmini" href="#sims-topics"><span class="lxri">⚙</span><span><b>Formula labs by topic</b><small>${Object.values(LABN).reduce((a, b) => a + b, 0)} quick labs built on your book’s formulas, checked against its worked examples</small></span></a><a class="lxmini" href="${SIM_URL}"${SIM_TGT}><span class="lxri">${lxIcon('tx', 18)}</span><span><b>Full transformer simulator</b><small>phasors, 3-phase, parallel operation, inrush</small></span></a></section>
    </div>`;
    paintLabList(cat);
    if (cat) { const el = $('#lxlib'); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 0); } else toTop();
    main.oninput = e => { if (e.target.id === 'lxq') { lxQ = e.target.value; paintLabList(cat); } };
    main.onchange = e => { if (e.target.id === 'lxsort') { lxS = e.target.value; paintLabList(cat); } };
    main.onclick = e => {
      const st = e.target.closest('[data-fav]'); if (st) { e.preventDefault(); const on = labFav(st.dataset.fav); st.setAttribute('aria-pressed', on); st.textContent = on ? '★' : '☆'; toast(on ? '★ Added to My favourite simulations' : 'Removed from favourites'); return; }
      const f = e.target.closest('[data-f]'); if (f) { lxF = f.dataset.f; $$('.lxfil [data-f]').forEach(b => b.setAttribute('aria-pressed', b === f)); paintLabList(cat); return; }
      const t = e.target.closest('[data-lx]'); if (t) { if (t.dataset.lx === 'theme') themeBtn.click(); else { $('#lxlib').scrollIntoView({ block: 'start', behavior: 'smooth' }); } return; }
      const c = e.target.closest('.lxcat'); if (c && !e.target.closest('a')) location.hash = c.dataset.href;
    };
    main.onkeydown = e => { const c = e.target.closest('.lxcat'); if (c && (e.key === 'Enter' || e.key === ' ') && e.target === c) { e.preventDefault(); location.hash = c.dataset.href; } };
  }
  const labFav = id => { if (P.lab.f[id]) delete P.lab.f[id]; else P.lab.f[id] = now(); changed(); return !!P.lab.f[id]; };
  async function labPast(meta, lv) {
    const U = await loadU(), ok = lv === 'gate' ? x => x.ex === 'GATE' : x => x.ex === 'TANGEDCO' || x.ex === 'TNPSC';
    const kw = `${meta.kw} ${meta.n}`.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !/^(the|and|for|with)$/.test(w));
    const pool = U.filter(x => meta.t.includes(x.t) && ok(x));
    const sc = x => { const h = `${x.sb || ''} ${x.qh || ''} ${x.cf ? JSON.stringify(x.cf) : ''}`.toLowerCase(); return kw.reduce((a, w) => a + (h.includes(w) ? 1 : 0), 0); };
    const items = pool.map(x => [sc(x), Math.random(), x]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(r => uItem(r[2])).filter(Boolean);
    return { n: items.length, items };
  }
  async function viewLabX(id, tab, tok) {
    const meta = LXI[id]; if (!meta) { location.hash = '#sims'; return; }
    setShell('sims'); document.title = `${meta.n} · Simulation Lab · TNEB AE Study Site`;
    main.onclick = null; main.oninput = null; main.onchange = null; main.onkeydown = null;
    main.innerHTML = '<p class="loading">Loading the experiment…</p>';
    await loadLab(meta.f); if (tok !== RT) return;
    const c = catOf(meta.cat), ex = lxEx(meta);
    main.innerHTML = '<div id="lxbox"></div>';
    window.LX.mount($('#lxbox'), id, { meta: { ...meta, ex: (ex.tneb ? 't' : '') + (ex.gate >= 25 ? 'g' : '') }, tab, catName: c[1], catCol: c[2], catIcon: lxIcon(meta.cat, 30),
      rec: k => P.lab.x[k] ||= {}, changed, toast, quiz, today: todayKey, labDay: ok => { logDay(ok); }, labTime: s => { const k = todayKey(); P.lab.d[k] = (P.lab.d[k] || 0) + s; },
      past: labPast, isFav: k => !!P.lab.f[k], toggleFav: labFav, topicLink: t => T(t) ? `<a class="lxchip tp" href="#t-${t}">${esc(short(T(t)))}${T(t).pr ? ` · ${T(t).pr}` : ''}</a>` : '', topicName: t => T(t) ? short(T(t)) : t });
    toTop();
  }
  /* ---------- a topic's Formula & Concept Simulator: every simulator of the topic as a full experiment ----------
     The Simulation Lab's own experiments for the topic come first, then each formula lab of the topic (sims/*.js),
     opened in the same workspace: experiment, calculations, graphs, concept and exam practice (sims/lab.js LX.fromLab). */
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  function topicMods(tid) {
    const seen = new Set(), mods = LXC.filter(e => e[4].includes(tid)).map(e => ({ id: e[0], n: e[2], lx: LXI[e[0]] }));
    LABS.filter(L => L.t === tid && !L.i.some(s => s[4] === 'text')).forEach(L => { let id = `f${tid}-${slug(L.n)}`; while (seen.has(id)) id += '-2'; seen.add(id); mods.push({ id, n: L.n, L }); });
    return mods;
  }
  async function viewTopicSim(tid, k, tab, tok) {
    const t = T(tid); setShell('topic', tid); document.title = `${short(t)} · Formula & Concept Simulator · TNEB AE Study Site`;
    main.oninput = null; main.onchange = null;
    main.innerHTML = '<p class="loading">Loading the simulator…</p>';
    await Promise.all([loadSims(), loadF(), loadLabCore()]); if (tok !== RT) return;
    const mods = topicMods(tid); if (!mods.length) { location.hash = `#t-${tid}`; return; }
    await Promise.all([...new Set(mods.filter(m => m.lx).map(m => m.lx.f))].map(loadLab)); if (tok !== RT) return;
    k = Math.min(Math.max(0, k), mods.length - 1); const m = mods[k], X = window.LX;
    if (m.L && !X.X[m.id]) X.X[m.id] = X.fromLab(m.L, { ref: labRef(m.L) });
    const st = id => { const r = P.lab.x[id]; return r ? X.goalsDone(r) : 0; };
    const done = mods.filter(x => st(x.id) === 5).length, col = SC[t.s];
    main.innerHTML = `<section class="tsh" style="--c:${col}"><span class="tshi">${icon('sliders')}</span><div><span class="hk">Formula &amp; concept simulator · ${mods.length}</span><h1>${esc(short(t))}</h1>
        <p>${mods.length} simulator${mods.length > 1 ? 's' : ''}, each with <b>Experiment</b>, <b>Calculations</b>, <b>Graphs</b>, <b>Concept</b> and <b>Exam practice</b>. Every number is worked out from your book's formulas${done ? ` · <b>${done} completed</b>` : ''}.</p></div></section>
      <nav class="tsm" aria-label="Simulators in ${esc(short(t))}">${mods.map((x, j) => { const n = st(x.id); return `<a href="#sim-${tid}-${j}"${j === k ? ' aria-current="page"' : ''} title="${esc(x.n)}"><i class="${n === 5 ? 'dn' : n ? 'ip' : ''}">${n === 5 ? '✓' : j + 1}</i><span>${esc(x.n)}</span></a>`; }).join('')}</nav>
      <div id="lxbox"></div>
      <div class="acts tsnext">${k > 0 ? `<a class="btn" href="#sim-${tid}-${k - 1}">← ${esc(mods[k - 1].n)}</a>` : `<a class="btn" href="#t-${tid}">← Back to ${esc(short(t))}</a>`}${k + 1 < mods.length ? `<a class="btn go" href="#sim-${tid}-${k + 1}">Next: ${esc(mods[k + 1].n)} →</a>` : ''}</div>`;
    const cur = $('.tsm [aria-current]', main); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    const L0 = m.lx, ex = L0 ? lxEx(L0) : null;
    X.mount($('#lxbox'), m.id, { meta: L0 ? { ...L0, ex: (ex.tneb ? 't' : '') + (ex.gate >= 25 ? 'g' : '') } : { id: m.id, n: m.n, t: [tid], cat: 'topic', d: 0, kw: m.L.rf || '', ex: '' }, tab,
      crumbs: `<a href="#home">All topics</a> › <a href="#t-${tid}">${esc(short(t))}</a> › <a href="#sim-${tid}">Simulator</a> › ${esc(m.n)}`,
      catName: L0 ? catOf(L0.cat)[1] : short(t), catCol: L0 ? catOf(L0.cat)[2] : col, catIcon: L0 ? lxIcon(L0.cat, 30) : icon('sliders'),
      rec: id => P.lab.x[id] ||= {}, changed, toast, quiz, today: todayKey, labDay: ok => { logDay(ok); }, labTime: s => { const d = todayKey(); P.lab.d[d] = (P.lab.d[d] || 0) + s; },
      past: labPast, ...(L0 ? { isFav: id => !!P.lab.f[id], toggleFav: labFav } : {}),
      topicLink: x => T(x) ? `<a class="lxchip tp" href="#t-${x}">${esc(short(T(x)))}${T(x).pr ? ` · ${T(x).pr}` : ''}</a>` : '', topicName: x => T(x) ? short(T(x)) : x });
    markStep(tid, 'labs'); toTop();
  }
  /* ---------- visual cards (#cards): original illustrated cards, drawn by sims/cards.js ---------- */
  // [card, title, topics] — the topic pages link to their cards without loading the drawings
  const VCT = [['generator', 'Synchronous generator', ['550', '580']], ['step-up', 'Generator (step-up) transformer', ['497']], ['line', 'Transmission line', ['627']], ['busbar', 'Busbars & substations', ['723', '759']],
    ['breaker', 'Circuit breakers & isolators', ['723']], ['ct-vt', 'Current & voltage transformers', ['807', '723']], ['relay', 'Protective relays', ['723']], ['arrester', 'Surge arresters', ['723', '759']],
    ['capacitor', 'Capacitor banks & reactors', ['380', '714', '1055']], ['distribution', 'Distribution transformer & your home', ['497', '663']], ['nested-radicals', 'Endless square roots', ['316']], ['astc', 'The ASTC wheel', []], ['derivative', 'Derivative from first principles', ['123']]];
  let vcP = null; const loadCards = () => vcP ||= loadJs('cards').catch(e => { vcP = null; throw e; });
  const vcTopic = x => T(x) ? `<a class="lxchip tp" href="#t-${x}">${esc(short(T(x)))}</a>` : '';
  async function viewCards(tok) {
    setShell('cards'); document.title = 'Visual cards · TNEB AE Study Site'; main.innerHTML = '<p class="loading">Loading the cards…</p>';
    await loadCards(); if (tok !== RT) return;
    const L = window.VC.list, tile = c => `<a class="vtile" href="#cards-${c.id}">${window.VC.thumb(c)}<em>${c.grp === 'ps' ? `${L.filter(x => x.grp === 'ps').indexOf(c) + 1} of ${L.filter(x => x.grp === 'ps').length}` : 'Maths shortcut'}</em><b>${esc(c.n)}</b><small>${c.sub}</small></a>`;
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Visual cards</div>
      <section class="hero"><h1>🖼 Visual cards</h1><p>Illustrated cards drawn for this site: each has a live drawing, the key formula with your own numbers, how it works, and an exam tip. Swipe left or right on a card for the next one.</p></section>
      <div class="vgal"><h2 class="vgh">⚡ From the power station to your home</h2>
      <nav class="vchain" aria-label="The power system in order">${L.filter(c => c.grp === 'ps').map((c, j) => `<a href="#cards-${c.id}"><i>${j + 1}</i>${esc(c.n.replace(/ \(.*\)$/, ''))}</a>`).join('')}</nav>
      <div class="vgrid0">${L.filter(c => c.grp === 'ps').map(tile).join('')}</div>
      <h2 class="vgh">🔢 Maths shortcuts</h2><div class="vgrid0">${L.filter(c => c.grp === 'm').map(tile).join('')}</div></div>`;
    toTop();
  }
  async function viewCard(id, tok) {
    setShell('cards'); main.innerHTML = '<p class="loading">Loading the card…</p>';
    await loadCards(); if (tok !== RT) return;
    const L = window.VC.list, j = L.findIndex(c => c.id === id); if (j < 0) { location.hash = '#cards'; return; }
    const c = L[j], pv = L[j - 1], nx = L[j + 1]; document.title = `${c.n} · Visual cards · TNEB AE Study Site`;
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#cards">Visual cards</a> › ${esc(c.n)}</div><div id="vcbox"></div>
      <div class="vcnav">${pv ? `<a class="btn" href="#cards-${pv.id}" data-sw="prev" data-n="${esc(pv.n)}">← ${esc(pv.n)}</a>` : '<a class="btn" href="#cards">← All cards</a>'}${nx ? `<a class="btn go" href="#cards-${nx.id}" data-sw="next" data-n="${esc(nx.n)}">${esc(nx.n)} →</a>` : '<a class="btn go" href="#cards">All cards</a>'}</div>`;
    window.VC.mount($('#vcbox'), id, { topicLink: vcTopic }); toTop();
  }
  /* ---------- power electronics atlas (#pe, #pe-<tab>, #pe-<circuit>): drawn by sims/cards.js (window.PE) ---------- */
  let PEU = null;
  async function viewPE(rest, tok) {
    setShell('cards'); main.innerHTML = '<p class="loading">Loading the power electronics atlas…</p>';
    const [, U] = await Promise.all([loadCards(), PEU ? PEU : get('data/u/961.json').then(u => PEU = u).catch(() => null)]); if (tok !== RT) return;
    const PE = window.PE, L = PE.list, c = L.find(x => x.id === rest), tn = T('961') ? esc(short(T('961'))) : 'Power Electronics';
    const top = `<a href="#home">All topics</a> › <a href="#t-961">${tn}</a> › `;
    if (c) {
      const j = L.indexOf(c), pv = L[j - 1], nx = L[j + 1], nm = x => esc(plain(x.n)); document.title = `${plain(c.n)} · Power electronics atlas`;
      main.innerHTML = `<div class="crumbs">${top}<a href="#pe">Atlas</a> › ${nm(c)}</div><div id="pebox"></div>
        <div class="vcnav">${pv ? `<a class="btn" href="#pe-${pv.id}" data-sw="prev" data-n="${nm(pv)}">← ${nm(pv)}</a>` : '<a class="btn" href="#pe">← All circuits</a>'}${nx ? `<a class="btn go" href="#pe-${nx.id}" data-sw="next" data-n="${nm(nx)}">${nm(nx)} →</a>` : '<a class="btn go" href="#pe-compare">Inputs vs outputs →</a>'}</div>`;
      PE.mount($('#pebox'), c.id, { asked: x => PE.askedFor(x, U) }); toTop(); return;
    }
    document.title = 'Power electronics atlas · TNEB AE Study Site';
    main.innerHTML = `<div class="crumbs">${top}Power electronics atlas</div>
      <section class="hero"><h1>⚡ Power electronics atlas</h1><p>${L.length} converters as live circuits — diagram, input and output waveforms, who conducts when, and every formula checked against its own waveform. Then: all formulas in one tree, waveform ↔ formula, the words that flip a sign, and how the past questions ask.</p></section><div id="pebox"></div>`;
    PE.page($('#pebox'), rest || 'atlas', { U }); toTop();
  }
  /* ---------- theory to read (#read, #read-<topic>): every concept question with its answer and reasoning laid open ----------
     The Question Book's own Part A (its concept questions) plus the chapter questions that carry no numbers. Read at your
     own pace: tick what you have read; "Continue" takes you back to the next unread one. */
  const RD_EX = [['all', 'All'], ['tneb', 'TNEB AE'], ['tnpsc', 'TNPSC'], ['gate', 'GATE'], ['book', 'Book chapters'], ['other', 'Other exams']];
  const rdExOf = r => r.ex === 'TANGEDCO' || r.ex === 'TNEB' ? 'tneb' : r.ex === 'TNPSC' ? 'tnpsc' : r.ex === 'GATE' ? 'gate' : r.ex === 'BOOK' ? 'book' : 'other';
  let RDI = null;
  function theoryItems() {
    if (RDI) return RDI;
    const u = UA.filter(x => x.lab && x.lab[0] === 'A' && T(x.t)).map(x => ({ k: 'u', id: x.id, t: x.t, ex: x.ex, x, s: norm(plain((x.qh || x.x || '') + ' ' + (x.sb || '') + ' ' + (x.c || ''))) }));
    const b = QA.filter(x => T(x.t) && !/\d/.test(x.q) && !/calculate|find the value|determine the value/i.test(x.q)).map(x => ({ k: 'q', id: x.id, t: x.t, ex: (/^(GATE|TANGEDCO|TNPSC|ESE|APGENCO|TNEB)/.exec(x.src || '') || [])[1] || 'BOOK', x, s: norm(plain(x.q + ' ' + (x.why || ''))) }));
    const order = Object.fromEntries(IX.T.map((t, i) => [t.id, i]));
    return RDI = [...u, ...b].sort((p, q) => (order[p.t] - order[q.t]) || (p.k === q.k ? 0 : p.k === 'u' ? -1 : 1));
  }
  function readCard(r) {
    const d = P.rd[r.id], x = r.x;
    let body;
    if (r.k === 'u') {
      const ok = Array.isArray(x.ok) ? x.ok : [];
      const q = x.qh != null ? `<div class="rq">${x.qh}</div>${x.oh && x.oh.length ? `<ol class="ropts">${x.oh.map(([l, h]) => `<li${ok.includes(l) ? ' class="ok"' : ''}><b>(${l})</b> ${h}${ok.includes(l) ? ' <i aria-label="correct">✓</i>' : ''}</li>`).join('')}</ol>` : ''}`
        : x.rf ? qPic(x, x.src) : `<div class="im${x.wide ? ' wide' : ''}">${spu(x.qs, x.src)}</div>`;
      body = `${q}<div class="ra">${x.sh ? solHtml(x) : `<div class="im">${spu(x.ss, 'Answer and worked solution')}</div>`}</div>`;
    } else {
      body = `<div class="rq">${esc(x.q)}</div><ol class="ropts">${(x.o || []).map((o, i) => `<li${i === x.r ? ' class="ok"' : ''}>${esc(o)}${i === x.r ? ' <i aria-label="correct">✓</i>' : ''}</li>`).join('')}</ol>
        <div class="ra">${x.why ? `<p><b>Why:</b> ${esc(x.why)}</p>` : ''}${x.wrong && x.wrong.length ? `<details class="rw"><summary>Why not the others</summary><ul>${x.wrong.map(w => `<li>${esc(w)}</li>`).join('')}</ul></details>` : ''}</div>`;
    }
    return `<article class="rd${d ? ' done' : ''}" id="rd-${esc(r.id)}" data-rd="${esc(r.id)}"><header><span class="ex ex-${esc(r.ex)}">${esc(r.k === 'u' ? x.src : x.src || 'Book chapter')}</span>${r.k === 'u' && x.sb ? `<small>${esc(x.sb)}</small>` : ''}</header>${body}
      <div class="racts">${starBtn(r.id)}<button class="btn rdb${d ? ' on' : ''}" data-rdb="${esc(r.id)}" aria-pressed="${!!d}">${d ? '✓ Read' : 'Mark as read'}</button></div></article>`;
  }
  async function viewRead(tid, tok) {
    setShell('more'); document.title = 'Theory to read · TNEB AE Study Site'; main.innerHTML = '<p class="loading">Loading the theory questions…</p>';
    await Promise.all([loadU(), loadQ()]); if (tok !== RT) return;
    const ALL = theoryItems(); let st = { ex: 'all', un: false }; try { st = { ...st, ...JSON.parse(localStorage.getItem('ae-rd') || '{}') }; } catch (e) {}
    const keep = () => { try { localStorage.setItem('ae-rd', JSON.stringify(st)); } catch (e) {} };
    const vis = r => (st.ex === 'all' || rdExOf(r) === st.ex) && (!st.un || !P.rd[r.id]);
    const subj = IX.S.filter(([k]) => ALL.some(r => T(r.t).s === k));
    const nRead = L => L.filter(r => P.rd[r.id]).length;
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Theory to read</div>
      <section class="hero rdh"><h1>📖 Theory to read</h1><p>Every concept question — no numericals — with the right answer marked and the reasoning written out. Read when you have time; tick each one, and Continue brings you back to the next unread question.</p>
        <div class="rdsum"></div><div class="acts"><button class="btn go" data-rdgo="cont">▶ Continue reading</button><span class="tsz" role="group" aria-label="Text size"><button class="btn" data-tsz="-1" aria-label="Smaller text">A−</button><button class="btn" data-tsz="1" aria-label="Larger text">A+</button></span></div></section>
      <div class="rdbar"><div class="seg rdex" role="group" aria-label="Exam">${RD_EX.map(([k, n]) => `<button data-rdex="${k}" aria-pressed="${st.ex === k}">${n}</button>`).join('')}</div>
        <label class="rdun"><input type="checkbox" data-rdun${st.un ? ' checked' : ''}> Unread only</label>${filterBox('Search the theory questions: e.g. latching, Ferranti, Buchholz')}</div>
      <div id="rdres" hidden></div><div id="rdtree">${subj.map(([k, n]) => `<section class="rds" style="--c:${SC[k]}"><h2><i></i>${esc(n)} <small data-rdsn="${k}"></small></h2>
        ${IX.T.filter(t => t.s === k && ALL.some(r => r.t === t.id)).map(t => `<details class="rdt" data-t="${t.id}" id="rdt-${t.id}"><summary><b>${esc(short(t))}</b><span class="rdn" data-rdn="${t.id}"></span><span class="rdp"><i data-rdp="${t.id}"></i></span></summary><div class="rdl"></div></details>`).join('')}</section>`).join('')}</div>`;
    const paintCounts = () => {
      const L = ALL.filter(r => st.ex === 'all' || rdExOf(r) === st.ex), n = nRead(L);
      $('.rdsum', main).innerHTML = `<div class="lxk"><div><b>${L.length}</b><span>theory questions${st.ex === 'all' ? '' : ' (' + RD_EX.find(e => e[0] === st.ex)[1] + ')'}</span></div><div><b>${n}</b><span>read</span></div><div><b>${L.length ? Math.round(n / L.length * 100) : 0} %</b><span>done</span></div></div>`;
      $$('.rdt', main).forEach(d => { const T0 = L.filter(r => r.t === d.dataset.t), m = nRead(T0); d.hidden = !T0.length; $(`[data-rdn="${d.dataset.t}"]`, main).textContent = `${m}/${T0.length}`; $(`[data-rdp="${d.dataset.t}"]`, main).style.width = (T0.length ? m / T0.length * 100 : 0) + '%'; });
      subj.forEach(([k]) => { const S0 = L.filter(r => T(r.t).s === k); $(`[data-rdsn="${k}"]`, main).textContent = `${nRead(S0)}/${S0.length} read`; });
    };
    const fill = d => { const L = ALL.filter(r => r.t === d.dataset.t && vis(r)); $('.rdl', d).innerHTML = L.length ? L.map(readCard).join('') : '<p class="empty">All read here — untick “Unread only” to see them again.</p>'; lazy(d); };
    const refill = () => { $$('.rdt[open]', main).forEach(fill); paintCounts(); };
    $$('.rdt', main).forEach(d => d.addEventListener('toggle', () => { if (d.open && !$('.rd, .empty', d)) fill(d); }));
    main.onclick = e => {
      const x = e.target.closest('[data-rdex]'); if (x) { st.ex = x.dataset.rdex; keep(); $$('[data-rdex]', main).forEach(b => b.setAttribute('aria-pressed', String(b === x))); refill(); return; }
      const b = e.target.closest('[data-rdb]'); if (b) { const id = b.dataset.rdb, on = !P.rd[id]; if (on) P.rd[id] = Math.round(Date.now() / 60000); else delete P.rd[id]; P.rdl = id; changed();
        $$(`[data-rdb="${CSS.escape(id)}"]`, main).forEach(y => { y.classList.toggle('on', on); y.setAttribute('aria-pressed', String(on)); y.textContent = on ? '✓ Read' : 'Mark as read'; y.closest('.rd').classList.toggle('done', on); });
        paintCounts(); if (on) toast('Marked as read'); return; }
      if (e.target.closest('[data-rdgo="cont"]')) { const L = ALL.filter(vis), j = Math.max(0, ALL.findIndex(r => r.id === P.rdl)), nx = ALL.slice(j).find(r => vis(r) && !P.rd[r.id]) || L.find(r => !P.rd[r.id]);
        if (!nx) { toast('Everything here is read — well done.'); return; } openAt(nx.t, nx.id); }
    };
    main.onchange = e => { if (e.target.matches('[data-rdun]')) { st.un = e.target.checked; keep(); refill(); } };
    const openAt = (t, id) => { const d = $(`#rdt-${t}`, main); if (!d) return; d.open = true; if (!$('.rd', d)) fill(d); const el = id ? document.getElementById('rd-' + id) : d;
      requestAnimationFrame(() => (el || d).scrollIntoView({ block: 'start' })); setTimeout(() => { if ((el || d).isConnected) (el || d).scrollIntoView({ block: 'start' }); }, 500); };
    const inp = $('.fbox input', main), res = $('#rdres', main), tree = $('#rdtree', main);
    inp.oninput = () => { const W = words(inp.value); if (!W.length) { res.hidden = true; tree.hidden = false; return; }
      const L = ALL.filter(r => vis(r) && hitAll(r.s, W)); res.hidden = false; tree.hidden = true;
      res.innerHTML = `<p class="pg">${L.length} match${L.length === 1 ? '' : 'es'}${L.length > 60 ? ' — the first 60 shown; add a word to narrow' : ''}.</p>${L.slice(0, 60).map(r => `<p class="rdtn">${esc(short(T(r.t)))}</p>${readCard(r)}`).join('')}`; lazy(res); };
    paintCounts();
    if (tid && T(tid)) openAt(tid); else toTop();
  }
  /* ---------- formula memory cards (#mem, #mem-<deck>): the name on the front, the formula as printed on the back ----------
     Decks: pin (your pinned cards), all, s<subject>, t<topic>. Swipe (or ←/→) for the next card, tap to turn it over, 📌 to pin. */
  const memDeckName = d => d === 'pin' ? 'Pinned' : d === 'all' ? 'All formulas' : d[0] === 's' ? ((IX.S.find(x => x[0] === d.slice(1)) || [0, 'Subject'])[1]) : T(d.slice(1)) ? short(T(d.slice(1))) : 'Formulas';
  function memList(deck) {
    const order = Object.fromEntries(IX.T.map((t, i) => [t.id, i])), kind = id => ({ k: 0, f: 1, s: 2 })[id[0]] ?? 3, num = id => parseFloat(id.split('.')[1]) || 0;
    let L = FA.filter(f => T(f.t));
    if (deck === 'pin') L = L.filter(f => P.pin[f.id]); else if (deck[0] === 's') L = L.filter(f => T(f.t).s === deck.slice(1)); else if (deck[0] === 't') L = L.filter(f => f.t === deck.slice(1));
    return L.sort((a, b) => (order[a.t] - order[b.t]) || (kind(a.id) - kind(b.id)) || (num(a.id) - num(b.id)));
  }
  const memName = f => /—/.test(f.nm) ? f.nm.replace(/^Key formula explained — /, '') : f.nm.replace(/^Key formula explained$/, 'Key formula');
  async function memBack(f) {
    const kd = f.id[0], n = f.id.split('.')[1];
    if (kd === 'f' || kd === 'k') try {
      const D = await topic(f.t), e = kd === 'f' ? D.ch.formulas.find(x => String(x.n) === n) : D.ch.keys.find(x => String(x.n) === n);
      const img = e && (kd === 'f' ? e.sp && fpic(e.sp, D, e.fl, f.nm) : e.img && fpic(e.img.sp, D, e.img.fl, f.nm));
      const notes = !e ? '' : kd === 'f' ? (e.notes || []).map(t => `<p>${t}</p>`).join('') : (e.fields || []).slice(0, 2).map(([l, t]) => `<p><b>${esc(l.replace(/[,:;]\s*$/, ''))}:</b> ${t}</p>`).join('');
      if (img) return `<div class="mpic">${img}</div>${notes ? `<div class="mnote">${notes}</div>` : ''}`;
    } catch (er) {}
    return `<div class="fx mfx">${f.h.join('<br>')}</div>${f.hint ? `<div class="mnote"><p>${f.hint}</p></div>` : ''}`;
  }
  async function viewMem(deck0, tok) {
    setShell('more'); document.title = 'Formula memory cards · TNEB AE Study Site'; main.innerHTML = '<p class="loading">Loading the formula cards…</p>';
    await loadF(); if (tok !== RT) return;
    let st = { deck: 'all', pos: {}, sh: false, seed: 7 }; try { st = { ...st, ...JSON.parse(localStorage.getItem('ae-mem') || '{}') }; } catch (e) {}
    if (deck0 && (deck0 === 'pin' || deck0 === 'all' || /^s[a-z]$/.test(deck0) || /^t\d+$/.test(deck0))) st.deck = deck0;
    if (typeof st.pos !== 'object' || !st.pos) st.pos = {};
    const keep = () => { try { localStorage.setItem('ae-mem', JSON.stringify(st)); } catch (e) {} };
    const tops = IX.T.filter(t => FA.some(f => f.t === t.id));
    let L = [], i = 0, tk = 0;
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Formula memory cards</div>
      <section class="hero mhero"><h1>🃏 Formula memory cards</h1><p>Front: the name — say the formula. Tap to turn: the formula as printed in your book. Swipe for the next; 📌 pin the hard ones.</p></section>
      <div class="mdeck" role="group" aria-label="Deck"><button data-mdk="pin"></button><button data-mdk="all">All formulas</button>${IX.S.map(([k, n]) => `<button data-mdk="s${k}">${esc(n)}</button>`).join('')}</div>
      <div class="mtools"><label class="mtsel"><span>Topic</span><select data-mt aria-label="One topic"><option value="">Any topic</option>${tops.map(t => `<option value="${t.id}">${esc(short(t))}</option>`).join('')}</select></label>
        <label class="rdun"><input type="checkbox" data-msh> Shuffle</label><span class="tsz" role="group" aria-label="Text size"><button class="btn" data-tsz="-1" aria-label="Smaller text">A−</button><button class="btn" data-tsz="1" aria-label="Larger text">A+</button></span></div>
      <div id="mbox"><div class="mcount"><b class="mdn"></b><span class="mpos"></span></div><div class="mprog"><i></i></div>
        <div class="mstage"><article class="mcard" tabindex="0" aria-label="Formula card: tap to turn over"><div class="mface mf"></div><div class="mface mb"></div></article></div>
        <div class="mnav"><button class="btn" data-swb="prev" data-n="Previous card" aria-label="Previous card">←</button><button class="btn go" data-mflip>Show the formula</button><button class="btn" data-swb="next" data-n="Next card" aria-label="Next card">→</button></div>
        <div class="macts"><button class="btn mpin" data-mpin aria-pressed="false">📌 Pin</button><a class="btn mtop" href="#home">Open the topic</a></div></div>
      <p class="pg mempty" hidden></p>`;
    const box = $('#mbox', main), card = $('.mcard', main), empty = $('.mempty', main);
    const build = () => {
      L = memList(st.deck);
      if (st.sh) { const h = id => { let x = st.seed >>> 0; for (const c of id) x = Math.imul(x ^ c.charCodeAt(0), 2654435761) >>> 0; return x; }; L.sort((a, b) => h(a.id) - h(b.id)); }
      i = Math.min(Math.max(0, st.pos[st.deck] | 0), Math.max(0, L.length - 1));
      $$('[data-mdk]', main).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mdk === st.deck)));
      $('[data-mdk="pin"]', main).textContent = `📌 Pinned (${Object.keys(P.pin).filter(k => FBY[k]).length})`;
      $('[data-mt]', main).value = st.deck[0] === 't' ? st.deck.slice(1) : ''; $('[data-msh]', main).checked = !!st.sh;
    };
    const paint = () => {
      box.hidden = !L.length; empty.hidden = !!L.length;
      if (!L.length) { empty.textContent = st.deck === 'pin' ? 'No pinned formulas yet — open any deck and tap 📌 Pin on a card you want to keep; it will wait for you here.' : 'No formulas in this deck.'; return; }
      const f = L[i], t = T(f.t), my = ++tk;
      card.classList.remove('flip'); card.style.setProperty('--c', SC[t.s]);
      $('.mf', card).innerHTML = `<span class="mk">${esc(short(t))}</span><h2>${esc(memName(f))}</h2><p class="msrc">${esc(f.src)}</p><p class="mtip">Say it to yourself — then tap to check</p>`;
      $('.mb', card).innerHTML = `<span class="mk">${esc(memName(f))}</span><p class="loading">…</p>`;
      if (f.id[0] === 'k' && !/—/.test(f.nm)) topic(f.t).then(D => { if (my !== tk) return; const e = D.ch.keys.find(x => String(x.n) === f.id.split('.')[1]), w = e && (e.fields || []).find(x => /what it means/i.test(x[0]));
        $('.mf h2', card).textContent = 'Key formula · ' + short(t); if (w) $('.mf .msrc', card).insertAdjacentHTML('beforebegin', `<p class="mwhat">${w[1]}</p>`); }).catch(() => {});
      memBack(f).then(h => { if (my !== tk) return; $('.mb', card).innerHTML = `<span class="mk">${esc(memName(f))}</span>${h}`; lazy(card); });
      $('.mdn', box).textContent = memDeckName(st.deck); $('.mpos', box).textContent = `${i + 1} / ${L.length}`;
      $('.mprog i', box).style.width = ((i + 1) / L.length * 100) + '%';
      $('[data-swb="prev"]', box).disabled = i === 0; $('[data-swb="next"]', box).disabled = i >= L.length - 1;
      $('[data-mflip]', box).textContent = 'Show the formula';
      const on = !!P.pin[f.id], pb = $('[data-mpin]', box); pb.classList.toggle('on', on); pb.setAttribute('aria-pressed', String(on)); pb.textContent = on ? '📌 Pinned' : '📌 Pin';
      $('.mtop', box).href = `#t-${f.t}`; st.pos[st.deck] = i; keep();
    };
    const turn = () => { const on = card.classList.toggle('flip'); $('[data-mflip]', box).textContent = on ? 'Show the name' : 'Show the formula'; };
    main.onclick = e => {
      const d = e.target.closest('[data-mdk]'); if (d) { st.deck = d.dataset.mdk; keep(); build(); paint(); return; }
      if (e.target.closest('[data-swb="next"]')) { if (i < L.length - 1) { i++; paint(); } return; }
      if (e.target.closest('[data-swb="prev"]')) { if (i > 0) { i--; paint(); } return; }
      if (e.target.closest('[data-mflip]') || (e.target.closest('.mcard') && !e.target.closest('a, button, .fpl, .sp'))) { turn(); return; }
      if (e.target.closest('[data-mpin]')) { const f = L[i], on = !P.pin[f.id]; if (on) P.pin[f.id] = Math.round(Date.now() / 60000); else delete P.pin[f.id]; changed();
        toast(on ? 'Pinned — find it in 📌 Pinned' : 'Unpinned'); if (st.deck === 'pin' && !on) { build(); paint(); } else { paint(); $('[data-mdk="pin"]', main).textContent = `📌 Pinned (${Object.keys(P.pin).filter(k => FBY[k]).length})`; } }
    };
    main.onchange = e => {
      if (e.target.matches('[data-mt]')) { st.deck = e.target.value ? 't' + e.target.value : 'all'; keep(); build(); paint(); }
      if (e.target.matches('[data-msh]')) { st.sh = e.target.checked; if (st.sh) st.seed = (Math.random() * 1e9) | 0; st.pos[st.deck] = 0; keep(); build(); paint(); }
    };
    card.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); turn(); } };
    build(); paint(); toTop();
  }
  addEventListener('keydown', e => { if (!$('#mbox', main) || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const b = e.key === 'ArrowRight' ? $('[data-swb="next"]', main) : e.key === 'ArrowLeft' ? $('[data-swb="prev"]', main) : null; if (b && !b.disabled) { e.preventDefault(); b.click(); } });
  /* ---------- maths base & prerequisites (added for this site, not from the book) ----------
     MATHB: maths ideas → [name, maths topic id or '', [formula lines], what it is used for]
     TMAP: topic → { m: maths ideas, b: [[topic, idea taken from it]], mb: [[short, idea that needs both]], own: [new in this topic] } */
  const MATHB = {
    units: ['Units & prefixes', '', ['k = 10³, M = 10⁶, m = 10⁻³, µ = 10⁻⁶, n = 10⁻⁹', '1 kWh = 3.6 MJ; 1 hp = 746 W', 'ω (rad/s) = 2πN/60 for N in rpm'], 'every numerical answer'],
    prop: ['Ratio & proportion', '316', ['y ∝ x ⇒ y = kx;  y ∝ 1/x ⇒ y = k/x', 'y₂/y₁ = (x₂/x₁)ⁿ when y ∝ xⁿ', '% change = (new − old)/old × 100'], 'scaling a result when one quantity changes'],
    line: ['Straight lines & graphs', '', ['y = mx + c: slope m, intercept c', 'slope = Δy/Δx', 'through (x₁, y₁): y − y₁ = m(x − x₁)'], 'characteristics, load lines, V–I graphs'],
    quad: ['Quadratic equations', '', ['ax² + bx + c = 0 ⇒ x = [−b ± √(b² − 4ac)]/2a', 'real roots when b² ≥ 4ac', 'x + 1/x is least at x = 1'], 'maximum power, characteristic roots'],
    lin: ['Simultaneous equations', '106', ['a₁x + b₁y = c₁, a₂x + b₂y = c₂', 'x = (c₁b₂ − c₂b₁)/(a₁b₂ − a₂b₁)', 'Cramer: x = Δₓ/Δ'], 'solving mesh and node equations'],
    mat: ['Matrices & determinants', '106', ['|A| = ad − bc for [[a, b], [c, d]]', 'A⁻¹ = adj A/|A|', 'eigenvalues: |A − λI| = 0'], 'networks, state space, bus matrices'],
    trig: ['Trigonometry', '', ['sin²θ + cos²θ = 1', 'sin(A ± B) = sin A cos B ± cos A sin B', 'cos θ = adjacent/hypotenuse, tan θ = opposite/adjacent'], 'power triangle, phase angles, resolving vectors'],
    sine: ['Sine wave', '', ['v = V<sub>m</sub> sin(ωt + φ)', 'ω = 2πf, T = 1/f', 'V<sub>rms</sub> = V<sub>m</sub>/√2; average over a half cycle = 2V<sub>m</sub>/π'], 'every ac voltage and current'],
    cplx: ['Complex numbers & phasors', '179', ['z = a + jb = r∠θ, r = √(a² + b²), θ = tan⁻¹(b/a)', 'r₁∠θ₁ × r₂∠θ₂ = r₁r₂∠(θ₁ + θ₂); dividing subtracts the angles', 'e<sup>jθ</sup> = cos θ + j sin θ, j² = −1'], 'impedance Z = R + jX and phasor sums'],
    exp: ['Exponentials & logarithms', '', ['e<sup>−t/τ</sup>: 36.8 % left after τ, about 0 after 5τ', 'ln(ab) = ln a + ln b; log₁₀ x = ln x / 2.303', 'gain in dB = 20 log₁₀(V₂/V₁) = 10 log₁₀(P₂/P₁)'], 'transients, decay, decibels'],
    diff: ['Differentiation', '123', ['d/dt(sin ωt) = ω cos ωt; d/dt(e<sup>at</sup>) = a e<sup>at</sup>', 'v = L di/dt, i = C dv/dt', 'maximum or minimum where dy/dx = 0'], 'rates of change, induced emf, maxima'],
    int: ['Integration (area)', '140', ['∫ sin θ dθ = −cos θ; ∫ e<sup>at</sup> dt = e<sup>at</sup>/a', 'average = (1/T)∫ v dt', 'rms = √[(1/T)∫ v² dt]'], 'average and rms values, energy'],
    ode: ['Differential equations', '166', ['τ dy/dt + y = K ⇒ y = K + (y₀ − K)e<sup>−t/τ</sup>', 's² + 2ζω<sub>n</sub>s + ω<sub>n</sub>² = 0', 'ζ < 1 underdamped, ζ = 1 critical, ζ > 1 overdamped'], 'transients and dynamics'],
    lap: ['Laplace transform', '190', ['L{u(t)} = 1/s, L{e<sup>−at</sup>} = 1/(s + a), L{sin ωt} = ω/(s² + ω²)', 'L{df/dt} = sF(s) − f(0)', 'final value = lim<sub>s→0</sub> sF(s)'], 'transfer functions and transients'],
    four: ['Fourier series', '201', ['f(t) = a₀ + Σ (a<sub>n</sub> cos nωt + b<sub>n</sub> sin nωt)', 'b<sub>n</sub> = (2/T)∫ f(t) sin nωt dt', 'odd function: sine terms only; half-wave symmetry: odd n only'], 'harmonics and spectra'],
    zt: ['Z-transform', '212', ['Z{aⁿu[n]} = z/(z − a)', 'Z{x[n − 1]} = z⁻¹X(z)', 'stable when all poles are inside |z| = 1'], 'discrete-time systems'],
    vec: ['Vectors', '154', ['A·B = AB cos θ; |A × B| = AB sin θ', 'F = q(E + v × B); F = BIl sin θ', 'resolve: A<sub>x</sub> = A cos θ, A<sub>y</sub> = A sin θ'], 'forces and fields with direction'],
    vcal: ['Vector calculus', '154', ['∮ D·dA = Q (Gauss); ∮ H·dl = I (Ampère)', '∇·D = ρ<sub>v</sub>, ∇ × E = −∂B/∂t', 'E = −∇V'], 'Maxwell’s equations and fields'],
    geo: ['Geometry & mensuration', '316', ['circle: A = πr², circumference 2πr', 'sphere: A = 4πr², V = (4/3)πr³', 'coaxial cylinders give ln(b/a) in C and L'], 'areas of conductors, fields around wires'],
    hyp: ['Hyperbolic functions', '', ['cosh x = (eˣ + e⁻ˣ)/2, sinh x = (eˣ − e⁻ˣ)/2', 'cosh²x − sinh²x = 1', 'cosh x ≈ 1 + x²/2 for small x'], 'long-line ABCD constants'],
    series: ['Series & approximations', '', ['eˣ ≈ 1 + x, (1 + x)ⁿ ≈ 1 + nx for small x', 'sin θ ≈ θ, cos θ ≈ 1 − θ²/2 (θ in radians)', 'AP: Sₙ = (n/2)[2a + (n − 1)d]; GP: Sₙ = a(rⁿ − 1)/(r − 1)'], 'small-signal and small-angle shortcuts'],
    prob: ['Probability & statistics', '235', ['mean x̄ = Σx/n; σ = √[Σ(x − x̄)²/n]', 'P(A or B) = P(A) + P(B) − P(A and B)', 'normal curve: 68 % within ±1σ'], 'errors, reliability, noise'],
    num: ['Numerical methods', '222', ['Newton–Raphson: x<sub>n+1</sub> = x<sub>n</sub> − f(x<sub>n</sub>)/f′(x<sub>n</sub>)', 'Gauss–Seidel: use each new value at once', 'trapezoidal rule: ∫ ≈ (h/2)[y₀ + 2(y₁ + … + y<sub>n−1</sub>) + y<sub>n</sub>]'], 'load flow and iterative answers'],
    bool: ['Binary & Boolean algebra', '', ['A + AB = A; A + A′B = A + B', 'De Morgan: (A + B)′ = A′B′, (AB)′ = A′ + B′', 'binary → decimal: Σ bᵢ2ⁱ; 2’s complement = invert + 1'], 'logic gates and number systems'] };
  const TMAP = {
    252: { m: ['vec', 'trig', 'diff', 'int', 'quad'], b: [[283, 'Newton’s laws, units']], mb: [['Resolving forces', 'components of a force: vectors + trigonometry']], own: ['Equilibrium: ΣF = 0, ΣM = 0', 'Friction F = μN', 'Moment = force × distance'] },
    265: { m: ['exp', 'int', 'prop'], b: [[283, 'heat, temperature, gas laws']], mb: [['Work = ∫p dV', 'integration + the gas law']], own: ['First law Q = ΔU + W', 'Carnot η = 1 − T₂/T₁', 'Conduction Q = kAΔT/x'] },
    275: { m: ['prop', 'quad', 'geo'], b: [[252, 'force, pressure, energy'], [283, 'density, gravity']], mb: [['Q = A v', 'flow = area × velocity']], own: ['Bernoulli: p/ρg + v²/2g + z = constant', 'Hydraulic power P = ρgQH', 'Pump and turbine efficiency'] },
    283: { m: ['vec', 'diff', 'int', 'sine', 'trig'], b: [], mb: [['Waves', 'y = A sin(ωt − kx): sine wave + motion']], own: ['Newton’s laws, work and energy', 'Waves, optics, sound', 'Modern physics'] },
    296: { m: ['exp', 'prop'], b: [[283, 'atoms, electrons, energy bands']], mb: [['Nernst', 'cell emf with a logarithm']], own: ['Conductors, semiconductors, insulators', 'Dielectric and magnetic materials', 'Environment and pollution'] },
    308: { m: ['bool'], b: [[913, 'number systems, logic']], mb: [['Binary arithmetic', 'Boolean algebra + digital logic']], own: ['C data types, loops, arrays, pointers', 'Algorithms and flowcharts'] },
    316: { m: ['prop', 'series', 'prob', 'geo', 'quad'], b: [], mb: [], own: ['Time & work, speed, percentages', 'Logical reasoning', 'Data interpretation'] },
    339: { m: ['lin', 'mat', 'prop', 'quad', 'diff'], b: [[283, 'charge, current, resistance R = ρl/A']], mb: [['Mesh & node', 'simultaneous equations from KVL/KCL'], ['Max power', 'R<sub>L</sub> = R<sub>th</sub>: calculus + Thevenin']], own: ['Ohm’s law, KVL, KCL', 'Thevenin, Norton, superposition', 'Star–delta: R<sub>Y</sub> = R₁R₂/ΣR'] },
    365: { m: ['exp', 'diff', 'ode', 'int', 'lap'], b: [[339, 'KVL, KCL, Thevenin'], [440, 'C = εA/d, L = Nφ/I']], mb: [['First-order response', 'x(t) = x(∞) + [x(0) − x(∞)]e<sup>−t/τ</sup>']], own: ['τ = RC, τ = L/R', 'Stored energy ½CV², ½LI²', 'v<sub>C</sub> and i<sub>L</sub> cannot jump'] },
    380: { m: ['sine', 'cplx', 'trig', 'int'], b: [[339, 'KVL, KCL, theorems'], [365, 'L, C, reactance']], mb: [['Phasors', 'Z = R + j(X<sub>L</sub> − X<sub>C</sub>): complex numbers + circuits'], ['Power triangle', 'P = VI cos φ: trigonometry + power']], own: ['Resonance f₀ = 1/(2π√LC), Q factor', 'Power factor and its correction', 'Series and parallel RLC'] },
    409: { m: ['lap', 'ode', 'exp', 'cplx'], b: [[365, 'transients'], [380, 'phasors']], mb: [['s-domain', 'step and sine responses by Laplace']], own: ['Response numericals'] },
    417: { m: ['cplx', 'trig', 'sine'], b: [[380, 'phasors, power factor']], mb: [['a = 1∠120°', 'three phasors 120° apart']], own: ['Star: V<sub>L</sub> = √3V<sub>ph</sub>; delta: I<sub>L</sub> = √3I<sub>ph</sub>', 'P = √3 V<sub>L</sub>I<sub>L</sub> cos φ', 'Two-wattmeter method'] },
    429: { m: ['mat', 'lin', 'cplx'], b: [[339, 'network theorems'], [380, 'impedances']], mb: [['Parameter matrices', 'Z, Y, h, ABCD as 2 × 2 matrices']], own: ['Reciprocal: AD − BC = 1', 'Series, parallel, cascade connection', 'Converting between parameters'] },
    440: { m: ['vec', 'vcal', 'int', 'geo', 'diff'], b: [[283, 'charge, Coulomb force']], mb: [['Gauss & Ampère', 'vector calculus + physics']], own: ['E = Q/4πε₀r²', 'C = εA/d, L = μN²A/l', 'Faraday e = −N dφ/dt; Maxwell’s equations'] },
    468: { m: ['vcal', 'geo', 'int'], b: [[440, 'Gauss, Ampère, Faraday']], mb: [['Standard fields', 'line, sheet and sphere of charge']], own: ['Coupled coils M = k√(L₁L₂)'] },
    475: { m: ['prop', 'line', 'units', 'quad'], b: [[440, 'Faraday’s law, force on a conductor'], [339, 'KVL in the armature circuit']], mb: [['E ∝ φN', 'E = PφZN/(60A): proportion + Faraday']], own: ['Motor V = E + I<sub>a</sub>R<sub>a</sub>', 'T = 0.159 PφZI<sub>a</sub>/A', 'Speed control, losses, efficiency'] },
    497: { m: ['sine', 'cplx', 'prop', 'quad'], b: [[440, 'Faraday’s law, magnetic circuits'], [380, 'phasors, power factor']], mb: [['EMF equation', 'E = 4.44 f N φ<sub>m</sub>: sine wave + Faraday'], ['Phasor diagram', 'regulation: complex numbers + ac']], own: ['V₁/V₂ = N₁/N₂ = I₂/I₁', 'Max efficiency when copper loss = iron loss', 'Open-circuit and short-circuit tests'] },
    526: { m: ['prop', 'cplx', 'quad', 'units'], b: [[497, 'equivalent circuit'], [417, 'rotating field from three phases']], mb: [['Slip', 's = (N<sub>s</sub> − N)/N<sub>s</sub>, N<sub>s</sub> = 120f/P']], own: ['Torque–slip curve; s<sub>max</sub> = R₂/X₂', 'Rotor copper loss = s × air-gap power', 'Starting methods'] },
    550: { m: ['cplx', 'trig', 'sine', 'prop'], b: [[497, 'EMF equation'], [417, 'three-phase'], [380, 'phasor diagrams']], mb: [['Power angle', 'P = (EV/X<sub>s</sub>) sin δ: trigonometry + phasors']], own: ['Regulation: EMF, MMF, ZPF methods', 'V-curves and excitation', 'Parallel operation, synchronising'] },
    572: { m: ['cplx', 'prop'], b: [[526, 'induction motor'], [475, 'dc machine']], mb: [['Two fields', 'double-revolving field theory']], own: ['Capacitor-start, shaded-pole motors', 'Stepper, BLDC, universal motors'] },
    580: { m: ['prop', 'units', 'int'], b: [[265, 'thermal cycles'], [275, 'hydraulics P = ρgQH']], mb: [['Load factor', 'average ÷ maximum: area under the load curve']], own: ['Plant, diversity and capacity factors', 'Tariffs and depreciation', 'Thermal, hydro, nuclear plants'] },
    601: { m: ['prop', 'units'], b: [[580, 'generation basics']], mb: [], own: ['Further generation formulas'] },
    607: { m: ['units', 'prop', 'exp'], b: [[849, 'pn junction'], [283, 'radiation']], mb: [['Solar I–V', 'I = I<sub>L</sub> − I₀(e<sup>V/V<sub>T</sub></sup> − 1)']], own: ['Fill factor and efficiency', 'Maximum power point tracking'] },
    614: { m: ['prop', 'geo', 'units'], b: [[275, 'fluid power'], [580, 'generation']], mb: [['Wind power', 'P = ½ρAv³ with A = πr²']], own: ['Betz limit 59.3 %', 'Smart grid, EV charging'] },
    621: { m: ['units', 'exp', 'prop'], b: [[365, 'capacitor energy ½CV²'], [296, 'battery chemistry']], mb: [['Wh = V × Ah', 'units + battery ratings']], own: ['C-rate, depth of discharge', 'Batteries, supercapacitors, pumped hydro'] },
    627: { m: ['cplx', 'hyp', 'exp', 'geo', 'mat'], b: [[440, 'L and C of conductors'], [380, 'phasors'], [429, 'ABCD parameters']], mb: [['L = 2×10⁻⁷ ln(D/r′)', 'logarithm + fields of a wire'], ['Long line', 'A = cosh γl: hyperbolic + ABCD']], own: ['Regulation and efficiency', 'Ferranti effect', 'Corona and sag'] },
    657: { m: ['trig', 'prop'], b: [[961, 'controlled rectifiers'], [627, 'ac transmission']], mb: [['V<sub>d</sub> = 1.35V<sub>L</sub> cos α', 'the 6-pulse converter formula']], own: ['Monopolar, bipolar, homopolar links', 'Break-even distance'] },
    663: { m: ['exp', 'geo'], b: [[440, 'capacitance, dielectric'], [339, 'circuits']], mb: [['ln(R/r)', 'insulation R = (ρ/2πl) ln(R/r); g<sub>max</sub> = V/(r ln(R/r))']], own: ['Grading of cables', 'Distributors fed at one or both ends', 'Ring mains'] },
    678: { m: ['cplx', 'mat', 'prop'], b: [[417, 'three-phase'], [497, 'transformers']], mb: [['Symmetrical components', 'a = 1∠120°: complex + three-phase']], own: ['Z<sub>pu,new</sub> = Z<sub>pu,old</sub>(MVA<sub>new</sub>/MVA<sub>old</sub>)(kV<sub>old</sub>/kV<sub>new</sub>)²', 'Fault MVA = base MVA/Z<sub>pu</sub>', 'LG, LL, LLG fault currents'] },
    696: { m: ['num', 'mat', 'trig', 'ode'], b: [[550, 'P = (EV/X) sin δ'], [678, 'per unit']], mb: [['Swing equation', 'M d²δ/dt² = P<sub>m</sub> − P<sub>e</sub>: ODE + machines'], ['Newton–Raphson', 'iterative load flow']], own: ['Equal-area criterion', 'Bus types: slack, PV, PQ', 'Y-bus'] },
    714: { m: ['mat', 'cplx'], b: [[627, 'line performance'], [696, 'load flow']], mb: [['Z-bus', 'building it is matrix work']], own: ['Series and shunt compensation', 'SVC, STATCOM, TCSC'] },
    723: { m: ['cplx', 'exp', 'prop', 'sine'], b: [[678, 'fault currents'], [807, 'CTs and PTs']], mb: [['Restriking voltage', 'f = 1/(2π√LC): sine + LC circuit']], own: ['Relay PSM, TMS, IDMT', 'Distance and differential relays', 'Circuit breakers, arc interruption'] },
    759: { m: ['prop', 'geo'], b: [[723, 'protection basics']], mb: [], own: ['Earthing resistance; step and touch potential'] },
    767: { m: ['lap', 'ode', 'cplx', 'exp'], b: [[365, 'transients'], [380, 'frequency response']], mb: [['Transfer function', 'G(s): Laplace of the system ODE'], ['ζ and ω<sub>n</sub>', 's² + 2ζω<sub>n</sub>s + ω<sub>n</sub>²']], own: ['Block diagrams, Mason’s gain', 'Routh, root locus, Bode, Nyquist', 'Steady-state error, K<sub>p</sub>, K<sub>v</sub>, K<sub>a</sub>'] },
    800: { m: ['mat', 'lap'], b: [[767, 'transfer functions']], mb: [['State space', 'ẋ = Ax + Bu: matrices + ODE']], own: ['PID controllers', 'Controllability, observability'] },
    807: { m: ['prob', 'prop', 'units', 'cplx'], b: [[339, 'bridges are circuits'], [380, 'ac bridges'], [440, 'deflecting torque']], mb: [['Bridge balance', 'Z₁Z₄ = Z₂Z₃ with complex numbers']], own: ['Shunt R<sub>sh</sub> = R<sub>m</sub>/(m − 1), multiplier', 'Wattmeters, energy meters', 'Errors, CRO'] },
    838: { m: ['prob', 'units', 'bool'], b: [[807, 'meters'], [913, 'ADC/DAC']], mb: [], own: ['Transducers, DMM, DSO'] },
    849: { m: ['exp', 'sine', 'int'], b: [[283, 'semiconductor physics'], [339, 'circuits']], mb: [['Rectifier averages', 'V<sub>dc</sub> = V<sub>m</sub>/π, 2V<sub>m</sub>/π: integration']], own: ['Diode equation I = I₀(e<sup>V/ηV<sub>T</sub></sup> − 1)', 'Zener regulator', 'Ripple factor, PIV'] },
    867: { m: ['exp', 'line', 'prop', 'lin'], b: [[849, 'pn junction'], [339, 'Thevenin']], mb: [['Load line', 'straight line + KVL']], own: ['β = I<sub>C</sub>/I<sub>B</sub>, α = β/(1 + β)', 'Biasing and stability', 'h-parameters, gain'] },
    888: { m: ['exp', 'cplx'], b: [[867, 'amplifiers'], [365, 'RC charging']], mb: [['555 timing', '0.693RC (ln 2) astable, 1.1RC (ln 3) monostable'], ['Barkhausen', 'Aβ = 1∠0°']], own: ['Inverting gain −R<sub>f</sub>/R₁', 'Non-inverting gain 1 + R<sub>f</sub>/R₁', 'Integrator, differentiator'] },
    906: { m: ['exp'], b: [[867, 'amplifiers'], [888, 'op-amps']], mb: [], own: ['Further analog circuits'] },
    913: { m: ['bool', 'series'], b: [[867, 'transistor as a switch']], mb: [['K-maps', 'Boolean algebra made visual']], own: ['Flip-flops, counters, registers', 'Combinational circuits', 'ADC/DAC resolution = V<sub>FS</sub>/2ⁿ'] },
    935: { m: ['bool'], b: [[913, 'digital basics']], mb: [], own: ['Further digital circuits'] },
    941: { m: ['bool'], b: [[913, 'registers, counters']], mb: [['Hex & flags', 'binary arithmetic in registers']], own: ['Instruction set, addressing modes', 'Timing diagrams, interrupts'] },
    953: { m: ['bool'], b: [[941, '8085']], mb: [], own: ['Physical address = 16 × segment + offset', 'Interfacing 8255, 8253'] },
    961: { m: ['sine', 'int', 'four', 'trig', 'exp'], b: [[849, 'diodes, rectifiers'], [380, 'rms, power factor'], [475, 'dc motor E = kφω']], mb: [['Chopped-sine averages', 'integration + rectifiers'], ['Harmonics, THD', 'Fourier + ac power']], own: ['Controlled rectifiers V<sub>o</sub> = (2V<sub>m</sub>/π) cos α', 'Choppers V<sub>o</sub> = DV<sub>s</sub>; inverters', 'Thyristor turn-on, turn-off, commutation'] },
    998: { m: ['sine', 'int', 'prop'], b: [[961, 'converters'], [475, 'dc motors'], [526, 'induction motors']], mb: [['Converter-fed motor', 'V = E + IR with V = 0.9V<sub>s</sub> cos α']], own: ['Drives: speed control, braking'] },
    1008: { m: ['four', 'lap', 'zt', 'int', 'cplx'], b: [[767, 'transfer functions']], mb: [['Convolution', 'y = x * h ↔ Y = XH']], own: ['Sampling f<sub>s</sub> ≥ 2f<sub>max</sub>', 'DFT and FFT', 'FIR and IIR filters'] },
    1027: { m: ['four', 'trig', 'exp', 'prob'], b: [[1008, 'signals and spectra']], mb: [['AM sidebands', 'cos A cos B = ½[cos(A − B) + cos(A + B)]']], own: ['AM power P<sub>t</sub> = P<sub>c</sub>(1 + m²/2)', 'FM: Carson BW = 2(Δf + f<sub>m</sub>)', 'Shannon C = B log₂(1 + S/N)'] },
    1042: { m: ['four', 'zt'], b: [[1008, 'DSP'], [1027, 'communication']], mb: [], own: ['Further DSP and communication'] },
    1048: { m: ['units', 'prob', 'bool'], b: [[1027, 'communication']], mb: [], own: ['OSI and TCP/IP layers', 'Throughput and delay', 'Error detection: parity, CRC'] },
    1055: { m: ['geo', 'prop', 'units'], b: [[283, 'light, heat'], [475, 'dc motors'], [526, 'induction motors']], mb: [['Illumination', 'E = I cos θ/d²: inverse square + trigonometry']], own: ['Electric heating, welding', 'Traction: speed–time curves', 'Lamps and lighting design'] } };

  // three circles: Maths (top left), Other topics (top right), This topic (below); labels sit in the regions inside this topic
  function vennSvg(t, E) {
    const cut = (x, n) => { x = plain(x).replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; };
    const lines = (L, n, max) => { const o = L.slice(0, max).map(x => cut(x, n)); if (L.length > max) o.push(`+ ${L.length - max} more`); return o; };
    const txt = (x, y, L, cls, dy) => L.map((v, i) => `<text x="${x}" y="${(y - (L.length - 1) * dy / 2 + i * dy).toFixed(1)}" text-anchor="middle" class="${cls}">${esc(v)}</text>`).join('');
    const col = SC[t.s], M = E.m.map(k => MATHB[k][0]), B = E.b.map(([x]) => T(String(x)) ? short(T(String(x))) : String(x));
    return `<svg viewBox="0 0 400 346" class="venn" role="img" aria-label="Venn diagram: the maths and the other topics that ${esc(short(t))} is built on">
      <circle cx="140" cy="120" r="100" fill="#2563eb" fill-opacity=".12" stroke="#2563eb" stroke-width="2"/><circle cx="260" cy="120" r="100" fill="#d97706" fill-opacity=".12" stroke="#d97706" stroke-width="2"/>
      <circle cx="200" cy="215" r="100" fill="${col}" fill-opacity=".14" stroke="${col}" stroke-width="2.5"/>
      <text x="92" y="78" text-anchor="middle" class="vt" fill="#1d4ed8">Maths</text><text x="92" y="93" text-anchor="middle" class="vs">${M.length} idea${M.length === 1 ? '' : 's'}</text>
      <text x="308" y="78" text-anchor="middle" class="vt" fill="#b45309">Other topics</text><text x="308" y="93" text-anchor="middle" class="vs">${B.length ? B.length + ' topic' + (B.length === 1 ? '' : 's') : 'none needed'}</text>
      ${txt(143, 193, lines(M, 12, 2), 'vr', 13)}${txt(257, 193, lines(B, 12, 2), 'vr', 13)}${E.mb.length ? txt(200, 151, lines(E.mb.map(x => x[0]), 11, 2), 'vc', 12) : ''}
      ${txt(200, 268, lines(E.own, 28, 3), 'vo', 13)}<text x="200" y="338" text-anchor="middle" class="vn" fill="${col}">${esc(cut(short(t), 34))}</text></svg>`;
  }
  function baseHtml(id) {
    const E = TMAP[id], t = T(id); if (!E || !t) return '';
    const mcard = k => { const [n, mt, F, use] = MATHB[k]; return `<div class="bm"><h4>${esc(n)}</h4><div class="fx">${F.join('<br>')}</div><p>Used for ${esc(use)}${mt && T(mt) ? ` · <a href="#t-${mt}">${esc(short(T(mt)))} →</a>` : ''}</p></div>`; };
    return `<p class="lead">What this topic stands on: the maths (each with its formula), the ideas it borrows from other topics, where the two meet, and what is new here. <small class="badd">Added for this site — not from the book.</small></p>
      <div class="venw">${vennSvg(t, E)}</div>
      <h3 class="bh">🧮 Maths you need first</h3><div class="bms">${E.m.map(mcard).join('')}</div>
      ${E.b.length ? `<h3 class="bh">📚 Basics from other topics</h3><div class="bbs">${E.b.map(([x, w]) => T(String(x)) ? `<a class="bb" href="#t-${x}" style="--c:${SC[T(String(x)).s]}"><b>${esc(short(T(String(x))))}</b><span>${w}</span></a>` : '').join('')}</div>` : ''}
      ${E.mb.length ? `<h3 class="bh">🎯 Where the maths and the basics meet here</h3><ul class="bl">${E.mb.map(([a, b]) => `<li><b>${a}</b> — ${b}</li>`).join('')}</ul>` : ''}
      ${E.own.length ? `<h3 class="bh">✨ New in this topic</h3><ul class="bl">${E.own.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      <p class="pg"><a href="#base">All the maths behind EEE, and which topics use each →</a></p>`;
  }
  // #base: every maths idea with its formulas, most-used first, and the EEE topics that need it
  function viewBase(tok) {
    setShell('more'); document.title = 'Maths base for EEE · TNEB AE Study Site';
    const use = {}; Object.entries(TMAP).forEach(([id, E]) => E.m.forEach(k => { (use[k] ||= []).push(id); }));
    const ks = Object.keys(MATHB).sort((a, b) => (use[b] || []).length - (use[a] || []).length);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Maths base for EEE</div>
      <section class="hero"><h1>🧮 Maths base for EEE</h1><p>The maths every electrical topic stands on, each with the formulas you need — the most used first. Learn the top ones before starting the EEE topics; each topic page also shows its own maths and a Venn diagram of what it borrows. <small class="badd">Added for this site — not from the book.</small></p></section>
      ${filterBox('Find a maths idea or a topic: e.g. phasor, Laplace, transformers')}
      <div class="bms bmx">${ks.map((k, i) => { const [n, mt, F, u] = MATHB[k], L = (use[k] || []).filter(x => T(x)).sort((a, b) => IX.T.findIndex(t => t.id === a) - IX.T.findIndex(t => t.id === b));
        return `<div class="bm" data-s="${esc(n + ' ' + plain(F.join(' ')) + ' ' + u + ' ' + L.map(x => T(x).t).join(' '))}"><h4><i>${i + 1}</i>${esc(n)}<small>${L.length} topic${L.length === 1 ? '' : 's'}</small></h4><div class="fx">${F.join('<br>')}</div><p>Used for ${esc(u)}${mt && T(mt) ? ` · learn it: <a href="#t-${mt}">${esc(short(T(mt)))} →</a>` : ''}</p>
          <div class="bbs sm">${L.map(x => `<a class="bb" href="#t-${x}" style="--c:${SC[T(x).s]}"><b>${esc(short(T(x)))}</b></a>`).join('')}</div></div>`; }).join('')}</div>`;
    wireFilter('.bmx .bm'); toTop();
  }
  // the progress console tile
  function labTile() {
    const tt = labTotals(); if (!tt.started) return `<div class="dt lab"><span class="dl">⚡ Simulation lab</span><p class="pg">No experiments yet. <a href="#sims">Open the lab</a> — your experiments, time and lab questions will show here.</p></div>`;
    const W = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); const k = dayOf(d); W.push([k, (P.lab.d[k] || 0) / 60]); }
    const mx = Math.max(5, ...W.map(w => w[1]));
    const weak = Object.entries(P.lab.x).filter(([id, r]) => LXI[id] && r.q && r.q[0] >= 3 && r.q[1] / r.q[0] < 0.6).map(([id, r]) => [id, `${pct(r.q[1], r.q[0])} % on ${r.q[0]} questions`]);
    const rep = Object.entries(P.lab.x).filter(([id]) => LXI[id]).flatMap(([id, r]) => Object.entries(r.m || {}).filter(([, m]) => Array.isArray(m) && m[0] >= 2).map(([, m]) => [id, `${m[0]} misses: ${m[1]}`])).slice(0, 4);
    const nx = labRecommend(1)[0];
    return `<div class="dt lab"><span class="dl">⚡ Simulation lab <small>${tt.done} of ${LXC.length} completed</small></span>
      <div class="lxk"><div><b>${tt.started}</b><span>started</span></div><div><b>${tt.done}</b><span>completed</span></div><div><b>${fmtT(tt.secs)}</b><span>time</span></div><div><b>${tt.q[0] ? pct(tt.q[1], tt.q[0]) + ' %' : '–'}</b><span>lab question accuracy (${tt.q[0]})</span></div></div>
      <div class="lxbars2">${LXCAT.map(([k, n, col]) => { const ids = LXC.filter(e => e[1] === k).map(e => e[0]), p = ids.reduce((a, id) => a + goals(labRec(id)), 0) / (ids.length * LGO); return `<div><span>${esc(n)}</span><i><b style="width:${Math.round(p * 100)}%;background:${col}"></b></i><em>${Math.round(p * 100)} %</em></div>`; }).join('')}</div>
      <div class="lxweek" aria-label="Lab minutes this week">${W.map(([k, m]) => `<div title="${k}: ${Math.round(m)} min"><i style="height:${Math.max(2, 46 * m / mx).toFixed(0)}px"></i><span>${new Date(k + 'T12:00').toLocaleDateString('en-IN', { weekday: 'narrow' })}</span></div>`).join('')}<small>minutes per day</small></div>
      ${weak.length || rep.length ? `<p class="pg"><b>Revise:</b> ${[...weak, ...rep].slice(0, 4).map(([id, w]) => `<a href="#lab-${id}-x">${esc(LXI[id].n)}</a> (${esc(w)})`).join(' · ')}</p>` : ''}
      ${nx ? `<p class="pg">Next: <a href="#lab-${nx[0]}">${esc(LXI[nx[0]].n)}</a> — ${esc(nx[1])}</p>` : ''}</div>`;
  }
  const loadSims = () => simsP ||= SIMF.reduce((p, f) => p.then(() => new Promise((ok, no) => { const el = document.createElement('script'); el.src = `sims/${f}.js?v=${SWV}`; el.onload = ok; el.onerror = () => no(new Error('Could not load the simulator')); document.head.appendChild(el); })), Promise.resolve()).catch(e => { simsP = null; throw e; });
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
  const EMPTY = () => ({ v: 1, t: 0, q: {}, f: {}, seen: {}, mocks: [], star: {}, day: null, days: null, sr: {}, lp: {}, mt: {}, lab: { x: {}, d: {}, f: {} }, rd: {}, rdl: null, pin: {} });
  let P = EMPTY(), where = 'browser', ref = null, saving = false, again = false, timer = 0, SV = 0, STC = null;
  try { const s = localStorage.getItem(KEY); if (s) P = { ...EMPTY(), ...JSON.parse(s) }; } catch (e) {}
  const keepLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
  // dates for the day log (local date) — defined before fixP, which runs as soon as the saved progress is read
  const dayOf = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dayStart = () => Math.round(new Date().setHours(0, 0, 0, 0) / 60000);
  // before the day log existed only each question's last answer was kept: seed the log from those, once.
  // Never let an odd saved record stop the app: anything unreadable is simply started afresh.
  const fixP = () => { try { fixP0(); } catch (e) { for (const k of ['star', 'sr', 'lp', 'mt', 'days', 'rd', 'pin']) if (!P[k] || typeof P[k] !== 'object') P[k] = {}; if (!P.lab || typeof P.lab !== 'object' || !P.lab.x || !P.lab.d || !P.lab.f) P.lab = { x: {}, d: {}, f: {} }; } };
  const fixP0 = () => {
    P.star = P.star && typeof P.star === 'object' ? P.star : {};
    P.sr = P.sr && typeof P.sr === 'object' ? P.sr : {};
    P.lp = P.lp && typeof P.lp === 'object' ? P.lp : {}; P.mt = P.mt && typeof P.mt === 'object' ? P.mt : {};
    P.rd = P.rd && typeof P.rd === 'object' && !Array.isArray(P.rd) ? P.rd : {}; if (typeof P.rdl !== 'string') P.rdl = null;
    P.pin = P.pin && typeof P.pin === 'object' && !Array.isArray(P.pin) ? P.pin : {};
    const LB = P.lab && typeof P.lab === 'object' ? P.lab : {}, ob = o => o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    P.lab = { x: ob(LB.x), d: ob(LB.d), f: ob(LB.f) }; for (const k in P.lab.x) if (!P.lab.x[k] || typeof P.lab.x[k] !== 'object') delete P.lab.x[k];
    if (!P.days || typeof P.days !== 'object') { P.days = {}; for (const m of [P.q, P.f]) for (const id in m) { const e = m[id]; if (!e[3]) continue; const k = dayOf(e[3] * 60000), d = P.days[k] || (P.days[k] = [0, 0]); d[0]++; if (e[2]) d[1]++; } }
  };
  fixP();
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
      if (remote && (remote.t || 0) >= (P.t || 0)) { P = { ...EMPTY(), ...remote }; fixP(); keepLocal(); SV++; STC = null; }
      else if (P.t) save();
      paintDots();
      if (/^(#(home|progress)?)?$/.test(location.hash) && !M) route(true);
    } catch (e) { /* keep progress in this browser */ }
  })();
  const now = () => Math.round(Date.now() / 60000);
  const topicOf = id => (String(id).match(/^[a-z](\d+|gen)\./) || [])[1];
  const isF = id => /^[fksx]/.test(id);
  // answers per day (local date): { 'YYYY-MM-DD': [answers, right] } — the streak, the daily chart and the calendar
  const logDay = ok => { const k = dayOf(Date.now()), d = P.days[k] || (P.days[k] = [0, 0]); d[0]++; if (ok) d[1]++; };
  /* spaced revision: each answer moves a question up one level (a wrong answer sends it back to 0). Days to the next
     revision by level: 0 (wrong) → 1; then 1, 2, 4, 8, 15 → revisions on day 1, 3, 7, 15 and 30; then every 30 days. */
  const SRI = [1, 1, 2, 4, 8, 15, 30], SRN = ['Wrong — again tomorrow', 'Day 1', 'Day 3', 'Day 7', 'Day 15', 'Day 30', 'Mastered'];
  const srLevel = (id, e) => P.sr[id] ?? (e && e[2] ? 1 : 0);
  const srDue = (id, e) => e[3] + SRI[Math.min(srLevel(id, e), 6)] * 1440;
  const srStep = (id, e, ok) => { P.sr[id] = ok ? Math.min(6, srLevel(id, e) + 1) : 0; };
  // questions and formulas whose revision falls due by the time t (minutes), wrong ones first, then the most overdue
  const SRK = /^([bpqud]\d|z(gate|tneb)\.|[fks]\d)/;
  const dueList = (t = dayStart() + 1440) => { const L = []; for (const m of [P.q, P.f]) for (const id in m) { if (!SRK.test(id)) continue; const e = m[id], d = srDue(id, e); if (d <= t) L.push([id, d, srLevel(id, e)]); } return L.sort((a, b) => (a[2] > 0) - (b[2] > 0) || a[1] - b[1]); };
  function record(id, ok) {
    const m = isF(id) ? P.f : P.q; srStep(id, m[id], ok); const e = m[id] || (m[id] = [0, 0, 0, 0]);
    e[0]++; if (ok) e[1]++; e[2] = ok ? 1 : 0; e[3] = now();
    const t = topicOf(id); if (t) P.seen[t] = now();
    logDay(ok); changed();
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
  /* ---------- stars: questions, formulas, look-up pages and topics you want to find again (kept with your progress) ---------- */
  const STARKEY = /^([a-z]\d+\.[A-Za-z0-9.]+|z(gate|tneb)\.\d+|ref\/[a-z]+\/\d+|t\/\d+)$/;
  const starBtn = (k, what = 'question') => k && STARKEY.test(k) ? `<button class="star${P.star[k] ? ' on' : ''}" data-star="${esc(k)}" aria-pressed="${!!P.star[k]}" title="${P.star[k] ? 'Starred — tap to remove' : `Star this ${what}`}" aria-label="Star this ${what}">${P.star[k] ? '★' : '☆'}</button>` : '';
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-star]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    const k = b.dataset.star; if (!STARKEY.test(k)) return;
    const on = !P.star[k]; if (on) P.star[k] = now(); else delete P.star[k];
    $$(`[data-star="${CSS.escape(k)}"]`).forEach(x => { x.classList.toggle('on', on); x.textContent = on ? '★' : '☆'; x.setAttribute('aria-pressed', String(on)); x.title = on ? 'Starred — tap to remove' : 'Star this'; });
    changed(); toast(on ? '★ Starred — find it under ⭐ My starred' : 'Star removed');
  }, true);
  const accOf = id => { const s = stats().by[id]; return s && s.a ? pct(s.r, s.a) : null; };
  const weakFormulas = () => Object.entries(P.f).filter(([id, e]) => /^[fks]/.test(id) && (e[2] === 0 || (e[0] >= 2 && e[1] / e[0] < 0.7)))
    .sort((x, y) => x[1][2] - y[1][2] || x[1][1] / x[1][0] - y[1][1] / y[1][0] || y[1][3] - x[1][3]);
  const mistakes = () => Object.entries(P.q).filter(([id, e]) => e[2] === 0 && /^[bpqudz]/.test(id)).sort((x, y) => y[1][3] - x[1][3]).map(([id]) => id);

  /* ---------- shell: sidebar, drawer, search ---------- */
  const side = $('#side'), scrim = $('#scrim'), menu = $('#menu');
  const drawer = o => { side.classList.toggle('open', o); scrim.hidden = !o; menu.setAttribute('aria-expanded', String(o)); };
  menu.onclick = () => drawer(!side.classList.contains('open')); scrim.onclick = () => drawer(false);
  $('#bmenu').onclick = e => { e.preventDefault(); drawer(true); };
  side.addEventListener('click', e => { if (e.target.closest('a')) drawer(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { drawer(false); if (!$('#lb').hidden) lbClose(); } });
  function sideHtml() {
    const g = {}; IX.T.forEach(t => (g[t.s] ||= []).push(t));
    const TP = topicProgress();
    side.innerHTML = `<div class="sidetop"><b>AE Study</b><button class="sidex" id="sidex" aria-label="Close the menu">✕</button></div><div class="sideh"><a href="#home">🏠 All topics</a><a href="#progress">📊 My progress console</a><a href="#mock">⏱ Mock test</a><a href="#sims">⚡ Simulation Lab</a><a href="#ref">📚 Look-up shelf</a><a href="#cards">🖼 Visual cards</a><a href="#pe">⚡ Power electronics atlas</a><a href="#qbook">📘 Question Book (2,620)</a><a href="#read">📖 Theory to read</a><a href="#mem">🃏 Formula memory cards</a><a href="#base">🧮 Maths base for EEE</a><a href="#practice">📝 Practice papers & drills</a><a href="#starred">⭐ My starred</a><a href="#today">📅 Today's 20</a></div>` +
      IX.S.map(([k, n]) => { const ts = (g[k] || []).map(t => TP[t.id]), cov = Math.round(ts.reduce((a, x) => a + x.cov, 0) / Math.max(1, ts.length) * 100), ac = ts.filter(x => x.acc != null), acc = ac.length ? Math.round(ac.reduce((a, x) => a + x.acc * x.a, 0) / ac.reduce((a, x) => a + x.a, 0) * 100) : null;
        return `<details class="sg" data-s="${k}"><summary style="--c:${SC[k]}"><h4><i></i>${esc(n)}</h4><span class="sgp"><span class="bar" style="--col:${SC[k]}"><i style="width:${cov}%"></i></span><small>${cov} % covered${acc != null ? ` · ${acc} % right` : ''}</small></span></summary>` + (g[k] || []).map(t => `<a href="#t-${t.id}" data-tid="${t.id}"><em></em><span>${esc(short(t))}</span></a>`).join('') + '</details>'; }).join('');
    $('#sidex').onclick = () => drawer(false);
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
    $$('#side [data-tid]').forEach(a => { if (a.dataset.tid === tid) { a.setAttribute('aria-current', 'page'); const d = a.closest('details'); if (d) d.open = true; } else a.removeAttribute('aria-current'); });
    const h0 = location.hash || '#home';
    $$('#side .sideh a').forEach(a => { const r = a.getAttribute('href'); (h0 === r || h0.startsWith(r + '-')) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
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
  // a printed formula box shown line by line (data fl: [x, y, w, h] in sheet pixels, from formula_lines.py): each line at
  // full size instead of the whole, mostly empty, box shrunk to the screen; tap any line for the whole printed box
  function fpic(sp, D, fl, alt) {
    if (!sp || !fl || !fl.length) return spr(sp, D, alt);
    const [f, W, H] = D.sheets[sp[0]];
    return `<div class="im fp">${spr(sp, D, alt)}<div class="fpl" role="img" aria-label="${esc(alt)} (printed formula, line by line)">${fl.map(([x, y, w, h]) => `<div class="fpw"><span class="sp seg" data-src="${f}" data-w="${w}" style="--w:${w};aspect-ratio:${w}/${h};background-size:${(W / w * 100).toFixed(4)}% auto;background-position:${W > w ? (x / (W - w) * 100).toFixed(4) : 0}% ${H > h ? (y / (H - h) * 100).toFixed(5) : 0}%"></span></div>`).join('')}</div></div>`;
  }
  function spu(r, alt) {
    if (!r) return '';
    const [f, W, H, y, w, h] = r, pos = H > h ? (y / (H - h) * 100).toFixed(5) : '0';
    return `<div class="sp" role="img" aria-label="${esc(alt)}" data-src="${f}" data-w="${w}" style="aspect-ratio:${w}/${h};max-width:${w}px;background-size:${(W / w * 100).toFixed(4)}% auto;background-position:0 ${pos}%"></div>`;
  }
  /* a printed question cut into line pieces (data rf: [x, y, w, h, newline|2 = figure]): on a phone the pieces flow like
     text at a readable size; on a wide screen the whole printed picture is shown as before */
  function rfHtml(r, rf, alt) {
    if (!r || !rf) return '';
    const [f, W, H] = r;
    return `<div class="rfl" role="img" aria-label="${esc(alt)} (printed question, in lines)">${rf.map(([x, y, w, h, nl]) => `${nl ? '<i class="rfbr"></i>' : ''}<span class="sp seg${nl === 2 ? ' fig' : ''}" data-src="${f}" data-w="${w}" style="--w:${w};aspect-ratio:${w}/${h};background-size:${(W / w * 100).toFixed(4)}% auto;background-position:${W > w ? (x / (W - w) * 100).toFixed(4) : 0}% ${H > h ? (y / (H - h) * 100).toFixed(5) : 0}%"></span>`).join('')}</div>`;
  }
  const qPic = (x, alt) => x.rf ? `<div class="im rf">${spu(x.qs, alt)}${rfHtml(x.qs, x.rf, alt)}<span class="zoomhint">Tap any line to see the whole printed question</span></div>`
    : x.wide ? `<div class="im wide">${spu(x.qs, alt)}<span class="zoomhint">Swipe sideways to read the whole line · tap to zoom</span></div>` : spu(x.qs, alt) + '<span class="zoomhint">Tap the picture to zoom</span>';
  const spIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; el.style.backgroundImage = `url("${el.dataset.src}")`; el.dataset.on = 1; spIO.unobserve(el); }), { rootMargin: '900px 0px' });
  const lazy = (root = main) => $$('.sp[data-src]:not([data-on])', root).forEach(el => spIO.observe(el));
  const lb = $('#lb');
  document.addEventListener('click', e => {
    let m = e.target.closest('main .sp, .qz .sp'); if (!m || m.classList.contains('big')) return;
    if (m.classList.contains('seg')) m = m.closest('.im').querySelector(':scope > .sp') || m;
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
    return `<div class="box mcq${noans ? ' noans' : ''}" data-id="${x.id}" data-s="${esc(plain(x.q + ' ' + x.o.join(' ')))}"><span class="src">${starBtn(x.id)}${esc(x.src)}</span><div class="q">${x.q}</div>
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
    return { id: x.id, t: x.t, src: x.qsrc || `Question Book · ${x.lab} · ${x.src}`, q: oh || (x.qh != null && x.ty === 'nat') ? `<div class="uq">${x.qh}</div>`
      : qPic(x, x.src),
      opts: x.L.map(l => ({ l, h: oh && oh[l] || '' })), r: x.L.indexOf(x.ok[0]), rs: x.ok.map(l => x.L.indexOf(l)), ex: solHtml(x) };
  };
  // any Question Book or predicted-paper question as a quiz item: one answer, several answers (MSQ) or a typed number (NAT)
  const uItem = x => x.ty === 'mcq' ? uQ(x) : x.ty === 'msq' ? { ...uQ(x), ty: 'msq' } : x.ty === 'nat' ? { ...uQ(x), ty: 'nat', opts: [], r: -1, rs: null, ok: x.ok, ans: x.ans } : null;
  // a numerical answer is right within the book's range, or within 1 % of its value
  const natOk = (ok, v) => { const [val, lo, hi] = ok; return lo != null ? v >= Math.min(lo, hi) - 1e-9 && v <= Math.max(lo, hi) + 1e-9 : Math.abs(v - val) <= Math.max(Math.abs(val) * 0.01, 0.01); };
  const numIn = s => parseFloat(String(s).replace(/−/g, '-').replace(/,/g, ''));
  const isRight = (q, j) => q.rs ? q.rs.includes(j) : j === q.r;
  const optsHtml = (q, attr, sel) => `<div class="opts${q.opts.some(o => o.h) ? '' : ' lt'}">${q.opts.map((o, j) => `<button class="opt${(Array.isArray(sel) ? sel.includes(j) : sel === j) ? ' sel' : ''}" ${attr}="${j}"><i>${esc(o.l || 'ABCD'[j])}</i>${o.h ? `<span>${o.h}</span>` : ''}</button>`).join('')}</div>`;
  /* quiz items: {id, t, src, q, opts, r, rs?, ex} — one tap answers; ty 'msq': select every correct option, then Check;
     ty 'nat': type a number; ty 'self': show the method and answer, then mark yourself (the numericals drill) */
  function quiz(items, title, opt = {}) {
    if (!items.length) { toast('Nothing to practise here yet.'); return; }
    let i = 0, right = 0, done = false; const miss = [];
    const show = () => {
      const q = items[i]; done = false;
      const ui = q.ty === 'nat' ? '<div class="acts natin"><input class="unum" type="text" inputmode="decimal" placeholder="Your answer" aria-label="Your numerical answer"><button class="btn go" data-z="chk">Check</button></div>'
        : q.ty === 'self' ? '<div class="acts"><button class="btn go" data-z="show">Show method & answer</button></div>'
        : optsHtml(q, 'data-zi') + (q.ty === 'msq' ? '<div class="acts"><button class="btn go" data-z="chk">Check</button><span class="pg">select every correct option</span></div>' : '');
      qz.innerHTML = `<div class="wrap gut"><div class="top"><b>${esc(title)}</b><span>Question ${i + 1} of ${items.length}</span><span class="score">Score ${right}</span><button class="btn" data-z="close">✕ Close</button></div>
        <div class="box qcard"><div class="qs">${starBtn(q.id)}${esc(q.src || '')}${q.t && T(q.t) ? ' · ' + esc(T(q.t).t) : ''}</div><div class="qq">${q.q}</div>
        ${ui}
        <div class="expl" hidden></div><div class="acts zself" hidden><span class="pg">Did you get it?</span><button class="btn ok" data-z="s1">✓ Got it</button><button class="btn no" data-z="s0">✗ Missed</button></div>
        <div class="acts"><button class="btn go" data-z="next" hidden>${i + 1 < items.length ? 'Next question →' : 'See my score'}</button></div></div></div>`;
      qz.scrollTop = 0;
    };
    const end = () => {
      if (opt.onEnd) opt.onEnd(right, items.length);
      qz.innerHTML = `<div class="wrap gut"><div class="top"><b>${esc(title)}</b><button class="btn" data-z="close">✕ Close</button></div>
        <div class="box qcard" style="text-align:center;justify-items:center"><span>You got</span><b style="font-size:34px;color:var(--pur)">${right} / ${items.length}</b>${opt.endNote ? `<b class="mtnote">${opt.endNote(right, items.length)}</b>` : ''}
        <span>${miss.length ? `${miss.length} to look at again — they are now in your progress console.` : 'All correct!'}</span>
        <div class="acts">${miss.length ? '<button class="btn" data-z="miss">Retry the ones I missed</button>' : ''}<a class="btn" href="#progress" data-z="close">Open my progress console</a></div></div></div>`;
    };
    // mark the answer, show the solution and the Next button
    const finish = ok => {
      const q = items[i]; done = true; if (ok) right++; else miss.push(q);
      const ex = $('.expl', qz);
      if (q.ty !== 'self') { ex.innerHTML = `<p><b class="${ok ? 'up' : 'dn'}">${ok ? 'Correct.' : 'Not quite.'}</b>${!ok && q.ty === 'nat' ? ` The answer is <b>${esc(q.ans)}</b>.` : ''}</p>` + q.ex; ex.hidden = false; lazy(qz); }
      else $('.zself', qz).innerHTML = `<b class="${ok ? 'up' : 'dn'}">${ok ? '✓ Marked as got it' : '✗ Marked as missed'}</b>`;
      $('[data-z="next"]', qz).hidden = false; $('.score', qz).textContent = `Score ${right}`;
      record(q.id, ok);
    };
    qz.onclick = e => {
      const z = e.target.closest('[data-z]'), o = e.target.closest('[data-zi]'), q = items[i];
      if (o && !done) {
        const j = +o.dataset.zi;
        if (q.ty === 'msq') { o.classList.toggle('sel'); return; }
        const ok = isRight(q, j);
        $$('[data-zi]', qz).forEach((b, k) => { if (isRight(q, k)) b.classList.add('right'); else if (k === j) b.classList.add('wrong'); });
        if (q.ml) $$('.blank', qz).forEach(bl => { bl.textContent = plain(q.opts[q.r].h); bl.classList.add(ok ? 'ok' : 'no'); });
        finish(ok); return;
      }
      if (!z) return;
      const k = z.dataset.z;
      if (k === 'chk' && !done) {
        if (q.ty === 'msq') {
          const sel = $$('[data-zi].sel', qz).map(b => +b.dataset.zi); if (!sel.length) { toast('Select at least one option.'); return; }
          const ok = sel.length === q.rs.length && sel.every(j => q.rs.includes(j));
          $$('[data-zi]', qz).forEach((b, j) => { if (q.rs.includes(j)) b.classList.add('right'); else if (b.classList.contains('sel')) b.classList.add('wrong'); });
          finish(ok);
        } else if (q.ty === 'nat') {
          const v = numIn($('.unum', qz).value); if (!Number.isFinite(v)) { toast('Type a number first.'); return; }
          finish(natOk(q.ok, v));
        }
        return;
      }
      if (k === 'show') { const ex = $('.expl', qz); ex.innerHTML = q.ex; ex.hidden = false; z.hidden = true; $('.zself', qz).hidden = false; lazy(qz); return; }
      if ((k === 's1' || k === 's0') && !done) { finish(k === 's1'); return; }
      if (k === 'close') { closeQuiz(); return; }
      if (k === 'next') { if (++i < items.length) { show(); lazy(qz); } else end(); }
      if (k === 'miss') { const m = miss.slice().map(q => { const f = q.ml && FBY && FBY[q.id], it = f && mlItems([f])[0]; return it ? mlQuestion(it) : q; }); quiz(m, title + ' — retry'); }
    };
    qz.onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('unum')) { e.preventDefault(); $('[data-z="chk"]', qz).click(); } };
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
  const SWV = 'ae-20261105151252';
  if (STANDALONE && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  // the file list (data/files.json, written at every deploy): [path, bytes, hash, 'd' notes & questions | 'i' picture]
  const MB = n => n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} KB` : `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} MB`;
  const fileList = () => fetch('data/files.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(new Error('file list ' + r.status)));
  function offlineCard() {
    if (!STANDALONE || !('caches' in window)) return '';
    return `<div class="tc" style="--c:#0f766e" id="offl"><h3>📶 Use it offline</h3><div class="meta"><span>Pages you open are kept on this phone. To study with no network, save everything once: every note, question, look-up page, drill, predicted paper and picture. After an update only the changed files are fetched again.</span></div>
      <div class="acts"><button class="btn" data-off="data">Save notes & questions</button><button class="btn go" data-off="all">Save everything</button></div><div class="pg" id="offst">Checking what is saved…</div></div>`;
  }
  // how much of each set is already in the cache (run after the home page is drawn)
  async function offlineStatus() {
    const st = $('#offst'); if (!st) return;
    try {
      const [L, cache] = await Promise.all([fileList(), caches.open(SWV)]);
      const keys = new Set((await cache.keys()).map(r => new URL(r.url).pathname));
      const base = new URL('./', location.href).pathname, have = x => keys.has(base + x[0]);
      const D = L.f.filter(x => x[3] === 'd'), A = L.f, dm = D.filter(x => !have(x)), am = A.filter(x => !have(x));
      const sz = l => l.reduce((a, x) => a + x[1], 0);
      $('[data-off="data"]').textContent = dm.length ? `Save notes & questions (${MB(sz(dm))})` : '✓ Notes & questions saved';
      $('[data-off="all"]').textContent = am.length ? `Save everything (${MB(sz(am))}${am.length < A.length ? ' left' : ''})` : '✓ Everything saved';
      st.textContent = !am.length ? `Everything is on this phone (${A.length.toLocaleString('en-IN')} files, ${MB(sz(A))}). It works with no network.`
        : !dm.length ? `Notes & questions are on this phone. Pictures: ${(A.length - D.length - am.length).toLocaleString('en-IN')} of ${(A.length - D.length).toLocaleString('en-IN')} saved.`
        : `${(A.length - am.length).toLocaleString('en-IN')} of ${A.length.toLocaleString('en-IN')} files saved (${MB(sz(A) - sz(am))} of ${MB(sz(A))}).`;
    } catch (e) { st.textContent = ''; }
  }
  async function saveOffline(all) {
    const st = $('#offst'), cache = await caches.open(SWV);
    st.textContent = 'Getting the file list…';
    const L = await fileList(), urls = ['./', 'data/files.json', ...L.f.filter(x => all || x[3] === 'd').map(x => x[0])];
    let n = 0, bad = 0, got = 0;
    for (let i = 0; i < urls.length; i += 8) {
      await Promise.all(urls.slice(i, i + 8).map(async u => { try { if (u === 'data/files.json' || !(await cache.match(u))) { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw 0; await cache.put(u, r); got++; } } catch (e) { bad++; } n++; }));
      st.textContent = `Saving ${n.toLocaleString('en-IN')} of ${urls.length.toLocaleString('en-IN')} files…`;
    }
    const when = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + (all ? ' (everything)' : ' (notes & questions)');
    try { localStorage.setItem('ae-offline', when); } catch (e) {}
    await offlineStatus();
    if (bad) st.textContent = `Saved ${n - bad} files; ${bad} could not be saved — try again with a better connection.`;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-off]'); if (!b) return; $$('[data-off]').forEach(x => x.disabled = true); saveOffline(b.dataset.off === 'all').catch(err => { $('#offst').textContent = `Could not save (${err.message}). Check the connection and try again.`; }).finally(() => $$('[data-off]').forEach(x => x.disabled = false)); });

  /* ---------- theme button: Light (default) → Eye comfort → Dark ---------- */
  const themeBtn = $('#theme');
  const THEMES = [['lavender', '💜', 'Lavender'], ['light', '☀️', 'Classic light'], ['comfort', '👁️', 'Eye comfort'], ['dark', '🌙', 'Dark']];
  // theme.js sets the theme before paint on the website; elsewhere (no theme.js) apply the saved one, else Lavender
  if (!document.documentElement.dataset.theme) { let t0 = 'lavender'; try { const sv = localStorage.getItem('ae-theme'); if (!localStorage.getItem('ae-theme-v2')) { t0 = !sv || sv === 'light' ? 'lavender' : sv; localStorage.setItem('ae-theme', t0); localStorage.setItem('ae-theme-v2', '1'); } else if (sv) t0 = sv; } catch (e) {} document.documentElement.dataset.theme = t0; }
  const curTheme = () => Math.max(0, THEMES.findIndex(t => t[0] === document.documentElement.dataset.theme));
  const paintTheme = () => { const [, ic, nm] = THEMES[curTheme()], nx = THEMES[(curTheme() + 1) % THEMES.length][2]; themeBtn.textContent = ic; themeBtn.setAttribute('aria-label', `Theme: ${nm}. Tap for ${nx}`); themeBtn.title = themeBtn.getAttribute('aria-label'); };
  themeBtn.onclick = () => { const [k, , nm] = THEMES[(curTheme() + 1) % THEMES.length]; document.documentElement.dataset.theme = k; try { localStorage.setItem('ae-theme', k); } catch (e) {} paintTheme(); toast(`${nm} mode${k === 'comfort' ? ' — warm, softer page for daytime reading' : ''}`); };
  paintTheme();

  /* ---------- router ---------- */
  let RT = 0, M = null, PENDQ = null, GOSEC = null, GOU = null;
  addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[data-gou]'); if (a) GOU = a.dataset.gou; }, true);
  addEventListener('hashchange', () => { if (!lb.hidden) lbClose(); route(); });

  /* ---------- swipe left / right on touch screens: next or previous question, tab or page ----------
     Starts only on plain content: not on inputs and sliders, charts, tab bars, sideways-scrolling pictures or tables,
     or within 24 px of the screen edge (the phone's own back gesture). A mostly-vertical move stays a scroll. */
  const swp = document.createElement('div'); swp.className = 'swp'; swp.hidden = true; swp.setAttribute('aria-hidden', 'true'); document.body.append(swp);
  const SWPAGES = [['home', 'Topics'], ['progress', 'My progress'], ['mock', 'Mock test']];
  const shownEl = el => !!el && !el.hidden && !el.disabled && el.getClientRects().length > 0;
  const swNeed = () => Math.max(60, Math.min(120, innerWidth * 0.2));
  const swAnim = (el, dir) => { if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return; el.classList.remove('swin-n', 'swin-p'); void el.offsetWidth; el.classList.add(dir > 0 ? 'swin-n' : 'swin-p'); setTimeout(() => el.classList.remove('swin-n', 'swin-p'), 400); };
  // what a swipe does here; dir 1 = next (finger moves to the left), -1 = previous; null = nothing
  function swipeAct(dir, tg) {
    if (!qz.hidden) {
      if (dir < 0) return null;
      const b = $('[data-z="next"]', qz);
      if (shownEl(b)) return { n: b.textContent.trim().replace(/\s*→$/, ''), go: () => { b.click(); swAnim($('.wrap', qz), dir); } };
      return $('[data-zi], [data-z="chk"], [data-z="show"]', qz) ? { n: 'Answer this one first', no: 1 } : null;
    }
    const mb = M && $(`[data-m="${dir > 0 ? 'next' : 'prev'}"]`, main);
    if (mb) return mb.disabled ? null : { n: dir > 0 ? (M.i + 1 < M.qs.length ? 'Next question' : 'Save answer') : 'Previous question', go: () => { mb.click(); swAnim(main, dir); } };
    const sbb = $(`[data-swb="${dir > 0 ? 'next' : 'prev'}"]`, main);
    if (sbb) return sbb.disabled ? null : { n: sbb.dataset.n, go: () => { sbb.click(); swAnim($('.mstage', main) || main, dir); } };
    const sl = $(`[data-sw="${dir > 0 ? 'next' : 'prev'}"]`, main);
    if (sl) return { n: sl.dataset.n || sl.textContent.trim(), go: () => { location.hash = sl.getAttribute('href'); } };
    const ml = dir > 0 && $('[data-ml="next"]', main);
    if (shownEl(ml)) return { n: 'Next question', go: () => { ml.click(); swAnim(main, dir); } };
    const lx = (tg && tg.closest('.lxw')) || (!$('.pbar', main) && $('.lxw', main));
    if (lx) { const nq = dir > 0 && $('.lxp:not([hidden]) [data-a="nextq"]', lx); if (shownEl(nq)) return { n: 'Next question', go: () => nq.click() }; }
    const bar = lx ? $('.lxtabs', lx) : $('.pbar', main);
    if (bar) {
      const bs = $$('[role=tab]', bar), i = bs.findIndex(b => b.getAttribute('aria-selected') === 'true'), b = i >= 0 && bs[i + dir];
      // past the last (or first) tab of a topic simulator: the next (or previous) simulator of the topic
      const tm = !b && lx && $('.tsm [aria-current]', main), nb = tm && (dir > 0 ? tm.nextElementSibling : tm.previousElementSibling);
      if (nb) return { n: (dir > 0 ? 'Next: ' : '') + $('span', nb).textContent, go: () => { location.hash = nb.getAttribute('href'); } };
      return b ? { n: ($('b', b) || b).textContent.trim(), go: () => {
        b.click(); b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const pnl = lx ? $('.lxp:not([hidden])', lx) : $('.pane:not([hidden])', main);
        if (pnl && lx) { const y = pnl.getBoundingClientRect().top - bar.getBoundingClientRect().bottom - 8; if (y < 0) scrollBy(0, y); }
        swAnim(pnl, dir);
      } } : null;
    }
    const h = location.hash.slice(1) || 'home', k = SWPAGES.findIndex(x => x[0] === h), pg = k >= 0 && SWPAGES[k + dir];
    return pg ? { n: pg[1], go: () => { const mo = new MutationObserver(() => { mo.disconnect(); swAnim(main, dir); }); mo.observe(main, { childList: true }); setTimeout(() => mo.disconnect(), 4000); location.hash = '#' + pg[0]; } } : null;
  }
  const noSwipe = t => t.closest('input, textarea, select, [contenteditable], canvas, .lxch, .lxtabs, .mk-tabs, .lb, .botnav, header.site, [data-noswipe]');
  const sideScroll = t => { for (let e = t; e && e !== document.body && e !== qz; e = e.parentElement) if (e.scrollWidth > e.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(e).overflowX)) return true; return false; };
  let sw = null;
  const swHide = () => { swp.hidden = true; };
  addEventListener('touchstart', e => {
    sw = null; if (e.touches.length !== 1 || !lb.hidden || side.classList.contains('open')) return;
    const t = e.touches[0], tg = e.target instanceof Element ? e.target : e.target.parentElement;
    if (!tg || t.clientX < 24 || t.clientX > innerWidth - 24 || noSwipe(tg) || sideScroll(tg)) return;
    sw = { x: t.clientX, y: t.clientY, t: Date.now(), tg, on: false, dir: 0, a: null };
  }, { passive: true });
  addEventListener('touchmove', e => {
    if (!sw) return; if (e.touches.length !== 1) { sw = null; swHide(); return; }
    const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (!sw.on) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; } if (Math.abs(dx) < 22) return; sw.on = true; }
    const dir = dx < 0 ? 1 : -1;
    if (dir !== sw.dir) { sw.dir = dir; sw.a = swipeAct(dir, sw.tg); if (sw.a) swp.innerHTML = dir > 0 ? `<span>${esc(sw.a.n)}</span><svg viewBox="0 0 24 24"><path d="M9 5.5 15.5 12 9 18.5"/></svg>` : `<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12l6.5 6.5"/></svg><span>${esc(sw.a.n)}</span>`; }
    if (!sw.a) { swHide(); return; }
    const f = Math.min(1, Math.abs(dx) / swNeed());
    swp.className = `swp ${dir > 0 ? 'r' : 'l'}${sw.a.no ? ' no' : f >= 1 ? ' go' : ''}`; swp.style.setProperty('--f', f.toFixed(3)); swp.hidden = false;
  }, { passive: true });
  addEventListener('touchend', e => {
    const s = sw; sw = null; swHide(); if (!s || !s.on || !s.a) return;
    const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
    if ((dx < 0 ? 1 : -1) !== s.dir || Math.abs(dx) < swNeed() || Math.abs(dy) > Math.abs(dx) * 0.6 || Date.now() - s.t > 900) return;
    if (String(getSelection() || '').trim()) return;
    if (s.a.no) { toast(`${s.a.n}, then swipe for the next question.`); return; }
    s.a.go();
  }, { passive: true });
  addEventListener('touchcancel', () => { sw = null; swHide(); }, { passive: true });
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
      if (a === 'sims') return await viewLab(tok);
      const smm = h.match(/^sims-([a-z]+)$/); if (smm) return smm[1] === 'topics' ? await viewSims(tok) : await viewLab(tok, catOf(smm[1]) ? smm[1] : undefined);
      if (a === 'cards') return await viewCards(tok);
      const vcm = h.match(/^cards-([a-z0-9-]+)$/); if (vcm) return await viewCard(vcm[1], tok);
      const pem = h.match(/^pe(?:-([a-z0-9-]+))?$/); if (pem) return await viewPE(pem[1] || '', tok);
      const tsm = h.match(/^sim-(\d+)(?:-(\d+))?(?:-([ecgux]))?$/); if (tsm && T(tsm[1])) return await viewTopicSim(tsm[1], +(tsm[2] || 0), tsm[3], tok);
      const lmm = h.match(/^lab-([a-z0-9-]+?)(?:-([ecgux]))?$/); if (lmm) { let id = lmm[1], tb = lmm[2]; if (!LXI[id] && LXI[h.slice(4)]) { id = h.slice(4); tb = undefined; } return await viewLabX(id, tb, tok); }
      if (a === 'base') return viewBase(tok);
      const mem = h.match(/^mem(?:-([a-z0-9]+))?$/); if (mem) return await viewMem(mem[1] || '', tok);
      const rdm = h.match(/^read(?:-(\d+))?$/); if (rdm) return await viewRead(rdm[1] || '', tok);
      if (a === 'practice') return await viewPractice(tok);
      if (a === 'qbook') return await viewQbook(tok);
      if (a === 'starred') return await viewStarred(tok);
      if (a === 'today') { history.replaceState(null, '', '#home'); viewHome(tok); startToday(); return; }
      const dm = h.match(/^drill(?:-(\d+)(?:-(\d+))?)?$/); if (dm) return await viewDrill(dm[1], tok, dm[2]);
      const pm = h.match(/^pred-(gate|tneb)(?:-(\d+))?$/); if (pm) return await viewPred(pm[1], tok, pm[2]);
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
      <div class="meta">${t.t.startsWith('Code 400') ? '<span class="chip c4">CODE 400</span>' : ''}${t.pr ? `<span class="chip ${t.pr}">${t.pr}</span>` : ''}${t.v === 1 ? '<span class="chip v1">VOL 1 · NOTES NOT LOADED</span>' : ''}${P.mt[t.id] && P.mt[t.id].pass ? '<span class="chip mtc">🎯 MASTERED</span>' : ''}
      ${t.asked != null ? `<span>${t.asked} asked</span>` : ''}${t.n.f ? `<span>${t.n.f} formulas</span>` : `<span>${t.n.st} formulas</span>`}${t.n.sum ? `<span>${t.n.sum} sums</span>` : ''}${t.n.u ? `<span>${t.n.u} past Qs</span>` : ''}<span>${nq} MCQs</span>${t.n.gate ? `<span>${t.n.gate} GATE</span>` : ''}</div>
      <div class="bar" style="--col:${bar}"><i style="width:${p == null ? 0 : Math.max(3, p)}%"></i></div>
      <div class="acc">${p == null ? '<span>Not practised yet</span>' : `<span><b>${p} %</b> correct</span><span>${s.a} answers</span>`}</div></a>`;
  }
  /* ---------- home dashboard: preparation overview, recommendations, subject progress ----------
     Coverage = questions tried (up to 20 per topic) — practice, not pages opened. Mastery = coverage × accuracy. */
  let UEX = null; const loadUex = () => UEX ? Promise.resolve(UEX) : get('data/uex.json').then(r => UEX = r);
  function topicProgress() {
    const S = stats(), tried = {}; for (const id in P.q) { const t = topicOf(id); if (t && /^[bpqud]/.test(id)) tried[t] = (tried[t] || 0) + 1; }
    const T0 = {}; IX.T.forEach(t => { const tot = t.n.u + t.n.book + t.n.pyq + t.n.qb, tg = Math.max(1, Math.min(20, tot)), cov = Math.min(1, (tried[t.id] || 0) / tg), s = S.by[t.id], acc = s && s.a ? s.r / s.a : 0;
      T0[t.id] = { cov, acc: s && s.a ? acc : null, m: cov * acc, a: s ? s.a : 0, weak: !!(s && s.a >= 3 && acc < 0.7) }; });
    return T0;
  }
  function overviewHtml() {
    const S = stats(), TP = topicProgress(), ts = Object.values(TP), cov = ts.reduce((a, x) => a + x.cov, 0) / ts.length, mas = ts.reduce((a, x) => a + x.m, 0) / ts.length;
    const nq = Object.keys(P.q).length, nf = Object.keys(P.f).length, ring = (p, col) => `<svg viewBox="0 0 36 36" class="ring" aria-hidden="true"><circle cx="18" cy="18" r="15.5" class="rt"/><circle cx="18" cy="18" r="15.5" class="rv" stroke="${col}" stroke-dasharray="${(p * 97.4).toFixed(1)} 97.4"/></svg>`;
    const ex = k => { if (!UEX || !UEX[k]) return null; const L = UEX[k], d = L.filter(id => P.q[id]), r = d.filter(id => P.q[id][2]).length; return { n: L.length, d: d.length, r }; };
    const exTile = (k, nm) => { const x = ex(k); return `<div class="ov"><span>${nm}</span>${x ? `${ring(x.d / x.n, '#06b6d4')}<b>${pct(x.d, x.n)} %</b><small>${x.d} of ${x.n.toLocaleString('en-IN')} past questions${x.d ? ` · ${pct(x.r, x.d)} % right last time` : ''}</small>` : '<b>…</b>'}</div>`; };
    const due = dueList().length;
    return `<section class="ovw" id="ovw"><div class="ov"><span>Syllabus coverage</span>${ring(cov, '#2563eb')}<b>${Math.round(cov * 100)} %</b><small>${cov ? 'questions tried, up to 20 a topic' : 'starts with your first answer — try Today’s 20'}</small></div>
      <div class="ov"><span>Topic mastery</span>${ring(mas, '#8b5cf6')}<b>${Math.round(mas * 100)} %</b><small>coverage × accuracy, all ${IX.T.length} topics</small></div>
      ${exTile('GATE', 'GATE EE')}${exTile('TANGEDCO', 'TANGEDCO AE')}${exTile('TNPSC', 'TNPSC Code 400')}
      <div class="ov"><span>Practice so far</span><b class="big">${nq.toLocaleString('en-IN')}</b><small>questions · ${nf} formulas tested · ${S.a ? pct(S.r, S.a) + ' % correct' : 'no answers yet'}${due ? ` · ${due} revisions due` : ''}</small></div></section>`;
  }
  function recoHtml() {
    const rec = studyNext().slice(0, 5), wf = weakFormulas().length, stale = IX.T.filter(t => P.seen[t.id] && (now() - P.seen[t.id]) / 1440 > 10).sort((a, b) => P.seen[a.id] - P.seen[b.id]).slice(0, 3);
    return `<section class="subj reco"><h2>🎯 Recommended for you <small>from your answers and your revision history</small></h2><div class="recs">
      ${rec.map((r, i) => `<div class="rc"><i>${i + 1}</i><span><b>${esc(short(r.t))}</b>${r.t.pr ? `<span class="prc ${r.t.pr}">${r.t.pr}</span>` : ''}<small>${esc(r.why)}</small></span><span class="acts"><a class="btn" href="#t-${r.t.id}">Study</a><a class="btn go" href="#t-${r.t.id}-prac">Practise</a></span></div>`).join('')}</div>
      <div class="acts">${stale.length ? `<span class="pg">Not revised for 10+ days: ${stale.map(t => `<a href="#t-${t.id}-prac">${esc(short(t))}</a>`).join(', ')}</span>` : ''}</div>
      <div class="acts"><button class="btn go" data-h="today">📅 Today's 20</button>${wf ? `<a class="btn" href="#progress">✍ ${wf} formulas to revise</a>` : ''}<button class="btn" data-h="weakmock">⏱ Next mock: 25 questions on your weakest topics</button><a class="btn" href="#drill">🔢 Numericals drill</a></div></section>`;
  }
  // the topics you opened last, with how much of each topic's questions you have tried
  function contHtml() {
    const L = Object.entries(P.seen).filter(([id]) => T(id)).sort((a, b) => b[1] - a[1]).slice(0, 3); if (!L.length) return '';
    const tried = {}; for (const id in P.q) { const t = topicOf(id); if (t && /^[bpqud]/.test(id)) tried[t] = (tried[t] || 0) + 1; }
    return `<section class="subj cont"><h2>▶ Continue learning <small>the topics you practised last</small></h2><div class="tcards">${L.map(([id, ts]) => { const t = T(id), tot = t.n.u + t.n.book + t.n.pyq + t.n.qb, n = Math.min(tried[id] || 0, tot), p = accOf(id);
      return `<a class="tc ccard" href="#t-${id}" style="--c:${SC[t.s]}"><h3>${esc(t.t.replace(/^Code 400 · /, ''))}</h3><div class="meta"><span>${n} of ${tot} questions tried</span><span>${p == null ? 'not scored yet' : p + ' % correct'}</span><span>${ago(ts)}</span></div>
        <div class="cbar"><i style="width:${tot ? Math.max(4, n / tot * 100) : 0}%"></i></div></a>`; }).join('')}</div></section>`;
  }
  function viewHome(tok, keep) {
    setShell('home'); document.title = 'TNEB AE Study Site';
    const S = stats(), tried = IX.T.filter(t => S.by[t.id]), weak = tried.filter(t => S.by[t.id].a >= 3 && accOf(t.id) < 70).sort((x, y) => accOf(x.id) - accOf(y.id));
    const g = {}; IX.T.forEach(t => (g[t.s] ||= []).push(t));
    const tot = IX.totals, TP = topicProgress(), SN = studyNext();
    const hr = new Date().getHours(), hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening', nx0 = SN[0], last = Object.entries(P.seen).filter(([i]) => T(i)).sort((x, y) => y[1] - x[1])[0], tl = todayLeft();
    const QK = [['#today', '📅', "Today's 20"], ['#progress', '📊', 'Progress'], ['#mock', '⏱', 'Mock test'], ['#sims', '⚡', 'Simulation Lab'], ['#qbook', '📘', 'Question Book'], ['#practice', '📝', 'Papers & drills'], ['#ref', '📚', 'Look-up'], ['#starred', '⭐', 'Starred']];
    main.innerHTML = `<section class="hero dashh"><span class="hk">AE STUDY · your learning journey</span><h1>${hello}!</h1>
      <p class="nxt">${nx0 ? `Your next step: <a href="#t-${nx0.t.id}"><b>${esc(short(nx0.t))}</b></a> — ${esc(nx0.why)}${nx0.t.pr ? ` <span class="prc ${nx0.t.pr}">${nx0.t.pr}</span>` : ''}` : ''}</p>
      <div class="acts"><button class="btn gold" data-h="today">📅 ${tl == null ? "Start Today's 20" : tl ? `Today's 20 · ${tl} left` : "Today's 20 ✓ done"}</button>${last ? `<a class="btn go" href="#t-${last[0]}-prac">▶ Continue: ${esc(short(T(last[0])))}</a>` : nx0 ? `<a class="btn go" href="#t-${nx0.t.id}">▶ Start: ${esc(short(nx0.t))}</a>` : ''}${mistakes().length ? `<button class="btn" data-h="rev">↻ ${mistakes().length} mistakes</button>` : ''}</div>
      <nav class="qk" aria-label="Sections">${QK.map(([h, ic, n]) => `<a href="${h}"><i>${ic}</i><span>${n}</span></a>`).join('')}</nav>
      <p class="pg">${IX.T.length} topics · ${tot.u ? tot.u.toLocaleString('en-IN') + ' past questions · ' : ''}${Object.values(LABN).reduce((a, b) => a + b, 0)} simulator labs · ${tot.gate} GATE sums — all from your book${S.a ? ` · so far ${S.a} answers, ${pct(S.r, S.a)} % correct` : ''}</p></section>
      ${overviewHtml()}${contHtml()}${recoHtml()}
      ${IX.S.map(([k, n]) => { const ts = g[k].map(t => TP[t.id]), cov = Math.round(ts.reduce((a, x) => a + x.cov, 0) / ts.length * 100), ac = ts.filter(x => x.acc != null), acc = ac.length ? Math.round(ac.reduce((a, x) => a + x.acc * x.a, 0) / ac.reduce((a, x) => a + x.a, 0) * 100) : null, wk = ts.filter(x => x.weak).length, nx = SN.find(r => r.t.s === k);
        return `<details class="subj subjd" style="--c:${SC[k]}"><summary><h2><i></i>${esc(n)} <small>${g[k].length} topics</small></h2>
        <div class="sstat"><span><b>${cov} %</b> covered</span><div class="bar" style="--col:${SC[k]}"><i style="width:${Math.max(cov ? 3 : 0, cov)}%"></i></div><span>${acc == null ? 'not practised yet' : `<b>${acc} %</b> correct`}</span>${wk ? `<span class="wk">⚠ ${wk} weak topic${wk > 1 ? 's' : ''}</span>` : ''}${nx ? `<a class="btn go" href="#t-${nx.t.id}-prac">Continue: ${esc(short(nx.t))} →</a>` : ''}<span class="tog">Show topics</span></div></summary>
        <div class="tcards">${g[k].map(topicCard).join('')}</div></details>`; }).join('')}
      <section class="subj"><h2>More</h2><div class="tcards"><a class="tc" href="#more" style="--c:#56637a"><h3>Past questions not tied to a chapter page</h3><div class="meta"><span>${IX.unmapped.length} rows from Appendix A–C whose Study Notes page is not given in the book</span></div></a>
      <a class="tc" href="#ref" style="--c:#a86a00"><h3>📚 Look-up shelf</h3><div class="meta"><span>The book's look-up pages: visual tricks, geometry, mensuration, magic numbers, exam values, mental maths, unit conversions, ready-reckoner, look-alike numbers & trap factors, symbols A–Z, the A–Z formula table, comparisons, analogies and every GATE multi-concept sum</span></div></a>
      <a class="tc" href="#sims" style="--c:#6d4ae0"><h3>⚡ Electrical Simulation Laboratory</h3><div class="meta"><span>72 experiments in 8 laboratories — live diagrams, calculations, graphs, compare mode and exam practice</span><span>+ ${Object.values(LABN).reduce((a, b) => a + b, 0)} formula labs on ${Object.keys(LABN).length} topics</span></div></a>
      <a class="tc" href="${SIM_URL}"${SIM_TGT} style="--c:#2e8b57"><h3>⚙ Transformer simulator</h3><div class="meta"><span>Change voltage, frequency, load or turns and watch flux, currents, losses, efficiency and regulation respond; phasors, 3-phase, parallel operation, saturation and inrush</span></div></a>
      ${offlineCard()}</div></section>
      <footer class="foot">From your TNEB AE (EEE) Question Book (all exams: Parts 2–3, all 2,620 past questions) and Complete Book: Study Notes (Vols 2–4), previous-year questions, question bank and mock test (Vol 5), Formula Self-Test and A–Z table (Vol 6), GATE multi-concept sums (Vols 7–9), past-question rows (Appendix A–C, Vol 4). Volume 1 (Maths and Basic Engineering notes, p 106–295) is not loaded yet, so those ${IX.T.filter(t => t.v === 1).length} topics have formulas, past questions and GATE sums but no chapter notes.</footer>`;
    main.onclick = e => { if (e.target.closest('[data-h="rev"]')) reviseMistakes(); if (e.target.closest('[data-h="today"]')) startToday();
      if (e.target.closest('[data-h="weakmock"]')) loadAll().then(() => { const ids = studyNext().slice(0, 8).map(r => r.t.id); mockStart(ids, 25, 60, true, 0.2); }); };
    offlineStatus();
    if (!UEX) loadUex().then(() => { if (tok === RT && $('#ovw')) $('#ovw').outerHTML = overviewHtml(); }).catch(() => {});
    if (!keep) toTop();
  }
  /* ---------- any question by its id, as a quiz item ---------- */
  let DBY = null, ZBY = null;
  const loadEvery = () => Promise.all([loadAll(), loadDrill(), loadPred()]).then(() => {
    DBY ||= Object.fromEntries(DRILL.T.flatMap(t => t.q.map(x => [drillId(t, x), [t, x]])));
    ZBY ||= Object.fromEntries(['gate', 'tneb'].flatMap(p => PRED[p].q.map(x => [x.id, [p, x]])));
  });
  const drillQ = (t, x) => ({ id: drillId(t, x), t: t.t, ty: 'self', src: `Numericals drill · ${t.k}.${x.n} · ${t.n}`, q: `<div class="dq">${x.q}</div>`, opts: [], ex: `${x.m ? spu(x.m, 'Method') : ''}<p class="dans">Answer: <b>${x.a}</b></p>` });
  function itemFor(id) {
    if (QBY[id]) return QBY[id].r != null ? mcqQ(QBY[id]) : null;
    if (UBY[id]) return uItem(UBY[id]);
    if (DBY[id]) return drillQ(...DBY[id]);
    if (ZBY[id]) { const [p, x] = ZBY[id]; return uItem({ ...x, qsrc: `${PRED[p].t} · ${x.lab} (practice paper)` }); }
    if (FBY[id]) { const it = mlItems([FBY[id]])[0]; return it ? mlQuestion(it) : null; }
    return null;
  }
  // every question you got wrong last time: book MCQs, Question Book (MCQ, MSQ, numerical), numericals drill, predicted papers
  function reviseMistakes(tid) {
    loadEvery().then(() => {
      const L = mistakes().filter(id => !tid || topicOf(id) === tid).map(itemFor).filter(Boolean).slice(0, 30);
      quiz(shuffle(L), tid ? `Revise my mistakes · ${T(tid).t}` : 'Revise my mistakes');
    });
  }
  /* ---------- Today's 20: one set a day — your mistakes, drill sums due again, weak formulas, then your weakest topics ---------- */
  const doneToday = id => { const e = (isF(id) ? P.f : P.q)[id]; return !!e && e[3] >= dayStart(); };
  const todayKey = () => dayOf(Date.now());
  const todayLeft = () => P.day && P.day.d === todayKey() ? P.day.ids.filter(id => !doneToday(id)).length : null;
  // what to study next: weakness × exam priority, plus topics never started and topics not revised for a while
  function studyNext() {
    const by = stats().by;
    return IX.T.map(t => {
      const s = by[t.id], w = 1 + (PRW[t.pr] || (t.v === 1 ? 1.5 : 0.8)), p = s && s.a ? pct(s.r, s.a) : null, d = P.seen[t.id] ? (now() - P.seen[t.id]) / 1440 : null;
      let sc, why;
      if (!s || !s.a) { sc = 0.45 * w; why = 'not started yet'; }
      else if (s.a < 3) { sc = 0.5 * w; why = `only ${s.a} answer${s.a > 1 ? 's' : ''} so far`; }
      else if (p < 70) { sc = (1 - p / 100) * w + 0.2; why = `${p} % correct in ${s.a} answers`; }
      else if (d != null && d > 10) { sc = 0.3 * w; why = `${p} % correct, but last practised ${Math.floor(d)} days ago`; }
      else { sc = (1 - p / 100) * w * 0.6; why = `${p} % correct in ${s.a} answers`; }
      return { t, sc, why, p };
    }).sort((x, y) => y.sc - x.sc);
  }
  function buildToday() {
    const pick = [], has = new Set(), n = now();
    const add = id => { if (pick.length < 20 && !has.has(id) && !doneToday(id) && itemFor(id)) { has.add(id); pick.push(id); } };
    for (const [id] of dueList()) { if (pick.length >= 14) break; add(id); }              // 1. revisions due (wrong ones first)
    mistakes().slice(0, 4).forEach(add);                                                   // 2. recent mistakes not yet due
    weakFormulas().slice(0, 3).forEach(([id]) => add(id));                                  // 3. weak formulas
    // 4. new questions from the weakest topics, round-robin
    const pools = studyNext().slice(0, 5).map(r => shuffle([...UA.filter(x => x.t === r.t.id && /^(mcq|msq|nat)$/.test(x.ty)).map(x => x.id), ...QA.filter(x => x.t === r.t.id && x.r != null).map(x => x.id),
      ...Object.keys(DBY).filter(id => topicOf(id) === r.t.id)].filter(id => !P.q[id])));
    for (let k = 0; pick.length < 20 && pools.some(L => L.length); k++) { const L = pools[k % pools.length]; if (L.length) add(L.pop()); }
    P.day = { d: todayKey(), ids: pick }; changed();
    return pick;
  }
  function startToday(fresh) {
    loadEvery().then(() => {
      const ids = !fresh && P.day && P.day.d === todayKey() ? P.day.ids : buildToday(), left = ids.filter(id => !doneToday(id));
      if (!left.length) { toast("Today's 20 is done ✓ — tap “Another 20” for more, or come back tomorrow."); if (location.hash === '#home' || !location.hash) route(true); return; }
      quiz(left.map(itemFor).filter(Boolean), `📅 Today's ${ids.length} · ${left.length} left`);
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

    /* Learn: concept in 60 seconds, then the chapter in the book's own order */
    if (TMAP[id]) sec('learn', 'base', '🧮', 'Before you start: maths & basics', 't-blue', baseHtml(id), '', 'Maths & basics');
    const peA = `<a class="simlink tsl" href="#pe"><i>⚡</i><span><b>Open the power electronics atlas →</b><small>every converter as a live circuit: waveforms, who conducts when, all formulas checked against the waveform, waveform ↔ formula, regenerative words, and how each past question asks</small></span></a>`;
    if (id === '961') sec('learn', 'peatlas', '⚡', 'Power electronics atlas', 't-pur', peA, '', 'Atlas');
    const nTh = UA ? UA.filter(x => x.t === id && x.lab && x.lab[0] === 'A').length : 0;
    if (nTh) sec('learn', 'readth', '📖', 'Theory to read', 't-teal', `<a class="simlink tsl" href="#read-${id}"><i>📖</i><span><b>Read the ${nTh} theory questions of this topic →</b><small>past concept questions with the answer marked and the reasoning open — tick each as you read; Continue picks up where you stopped</small></span></a>`, '', 'Theory');
    sec('learn', 'c60', '⏱', 'Concept in 60 seconds', 't-yel', c60Html(D, ch, id, vn), '', 'Concept in 60 s');
    if (id === '961') sec('sim', 'peatlas2', '⚡', 'Power electronics atlas', 't-pur', peA, '', 'Atlas');
    if (ch) {
      for (const s of ch.sections) {
        const cls = KINDCLS[s.kind] || 't-navy', sid = 's' + s.n, title = esc(s.title || KSHORT[s.kind] || '');
        if (s.kind === 'see') sec('learn', sid, s.n, title, cls, `<div class="diags">${ch.diagrams.map(d => `<div class="box diag ${d.wh[0] > 700 ? 'wide' : ''}" data-s="${esc(d.title + ' ' + plain(d.cap) + ' ' + d.qq)}"><h3>${esc(d.title)}</h3>${spr(d.sp, D, d.title)}${d.cap ? `<p class="cap">${d.cap}</p>` : ''}${d.qq ? `<div class="qc"><b>Quick check:</b><span>${esc(d.qq)}</span>${d.qa ? `<button class="btn rv" data-a="${esc(d.qa)}">Show answer</button>` : ''}</div>` : ''}<span class="pg">${vn} · p ${d.pg}</span></div>`).join('')}</div>`, `${ch.diagrams.length} pictures`, 'See it');
        else if (s.kind === 'key') {
          const k = ch.keys.find(x => x.n === s.n); if (!k) continue;
          sec('learn', sid, s.n, title, cls, `<div class="kgrid">${k.img ? `<div class="kb f">${fpic(k.img.sp, D, k.img.fl, 'Key formula')}</div>` : k.f ? `<div class="kb f"><div class="fx">${k.f}</div></div>` : ''}
            ${k.fields.map(([h, x, c]) => `<div class="kb" style="background:${c}"><h4>${h}</h4>${/^One-minute/.test(plain(h)) ? oneMin(x) : x}</div>`).join('')}</div>
            ${k.tables.map(tb => table(tb, 'qv')).join('')}${k.notes.map(n => /^⚠/.test(plain(n)) ? `<p class="trap">${n.replace(/^\s*⚠\s*(Trap:)?/, '<b>⚠ Trap:</b>')}</p>` : `<p class="knote">${n}</p>`).join('')}<span class="pg">${vn} · p ${k.pg}</span>`, '', 'Key formula ' + s.n);
        }
        else if (s.kind === 'learn') sec('learn', sid, s.n, title, cls, `<p class="lead">All ${ch.formulas.length} formulas of this chapter, exactly as printed, each with its letters, a tip and the past papers that asked it.</p><p><a class="btn" href="#mem-t${id}">🃏 Learn these as swipe cards</a></p>` +
          ch.formulas.map(f => `<div class="lf" data-s="${esc(f.name + ' ' + plain(f.f.join(' ')) + ' ' + plain(f.notes.join(' ')))}"><div class="box l"><h3>${starBtn(`f${id}.${f.n}`, 'formula')}${f.n}. <b>${esc(f.name)}</b></h3>${fpic(f.sp, D, f.fl, f.name)}</div><div class="r" style="background:${f.nfill}">${f.notes.map(n => `<p>${lab(n)}</p>`).join('')}<p class="pg">${vn} · p ${f.pg}</p></div></div>`).join(''), `${ch.formulas.length} formulas`, 'Formulas');
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
    sec('learn', 'rel', '↕', 'Increasing & decreasing — what changes what', 't-teal', `<p class="lead">Every relationship in this topic's simulator labs: raise one quantity, keep the others constant, and see which way each result moves — direct (∝ x), inverse (∝ 1/x), square (∝ x²), root (∝ √x). Worked out from the formulas, never guessed.</p><div id="relbox"><p class="loading">Loading the relationships…</p></div>`, '', 'Relationships');
    sec('learn', 'traps', '⚠', 'Exam traps — the mistakes the book warns about', 't-red', trapsHtml(ch, id), '', 'Exam traps');
    sec('learn', 'every', '∑', 'Every formula — Formula Self-Test & A–Z table', 't-navy', `<p class="lead">The book's two formula lists for this topic, line by line (Vol 6): the Formula Self-Test (with the page of its answer) and the A–Z Formula Table.</p>
      <div class="seg" id="ev"><button data-v="st" aria-pressed="true">Formula Self-Test · ${D.st.length}</button><button data-v="az" aria-pressed="false">A–Z table · ${D.az.length}</button></div><div class="box" id="evl"></div>`, '', 'Every formula');

    /* Practice */
    sec('prac', 'mine', '★', 'My progress in this topic', 't-yel', '<div id="minebox" style="display:grid;gap:10px"></div>', '', 'My progress');
    sec('prac', 'mastery', '🎯', 'Topic mastery test — 15 questions, pass at 70 %', 't-pur', '<div id="mtbox"></div>', '', 'Mastery test');
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
    if (LABN[id]) sec('sim', 'labs', '⚙', 'Formula & concept simulator', 't-teal', `<a class="simlink tsl" href="#sim-${id}"><i>⚙</i><span><b>Open the full ${esc(short(t))} simulator →</b><small>each lab below with experiment, calculations, graphs, concept and exam practice — one page per simulator</small></span></a><p class="lead">${LABN[id]} live labs built on this topic's formulas. Move a slider or type a value: every output updates, ↑ ↓ → show which way it moved from where you started. <b>📈 Graph</b> plots any output against any input (or the lab's own curve), <b>↕ What happens if…</b> raises each input by 10 %, and <b>✓ Book checks</b> recompute the book's own worked numbers.</p><div class="labs" id="labbox"><p class="loading">Loading the simulator…</p></div>`, `${LABN[id]} labs`, 'Simulator');
    if (ch && ch.tamil.length) sec('book', 'tamil', 'த', 'Tamil stories & concept tour', 't-grn', `<p class="lead">The book's Tamil story pages and concept tour for this topic, exactly as printed.</p>` +
      ch.tamil.filter(p => !p.empty).map(p => `<details class="ta"><summary>${esc(p.heads.join(' · ') || 'Book page')} <span class="pg">· ${vn} p ${p.pg}</span></summary>${p.rh
        ? `<div class="tpbar"><span class="pg">The printed page, set as text</span><span class="tpsz"><button class="btn lnk" data-tsz="-1" aria-label="Smaller text">A−</button><button class="btn lnk" data-tsz="1" aria-label="Larger text">A+</button><button class="btn lnk" data-tp aria-pressed="false">🖼 As printed</button></span></div><div class="tpr" lang="ta">${p.rh}</div><div class="pages" hidden>${spr(p.sp, D, 'Book page ' + p.pg, 't')}</div>`
        : `<div class="pages">${spr(p.sp, D, 'Book page ' + p.pg, 't')}</div>`}</details>`).join(''), `${ch.tamil.filter(p => !p.empty).length} pages`, 'Tamil pages');

    const panes = [['learn', '📖', 'Learn', ch ? 'chapter & formulas' : 'formulas'], ['prac', '✍', 'Practice', U ? `${U.q.length} past questions, tests, GATE` : 'tests, MCQs, GATE, question bank'], ...(LABN[id] ? [['sim', '⚙', 'Simulate', `${LABN[id]} live labs`]] : []), ...(PANES.book.length ? [['book', 'த', 'Tamil pages', 'stories & concept tour']] : [])];
    const i = IX.T.indexOf(t), prev = IX.T[i - 1], nxt = IX.T[i + 1];
    const subj = IX.S.find(s => s[0] === t.s)[1];
    main.dataset.tid = id;
    main.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#home">All topics</a> › ${esc(subj)} › ${esc(t.t)} ${starBtn(`t/${id}`, 'topic')}</nav>
      <div class="ptitle"><div class="trow">${bulb}<div class="tband"><h1>${esc(t.t)}</h1></div><div class="tbadge" title="Topic number in the book">${esc(ch && ch.badge || '–')}</div></div>
        ${ch && ch.sub ? `<div class="tsub">${esc(ch.sub)}</div>` : `<div class="tsub">${D.st.length} formulas · ${myQ.length} MCQs · ${D.rows.length} past questions · ${D.gate.length} GATE sums</div>`}
        ${ch && ch.stats.length ? `<div class="stats">${ch.stats.map(([n, l, c]) => `<div class="stat"><b style="color:${c}">${n}</b><span>${esc(l)}</span></div>`).join('')}${ch.priority[0] ? `<div class="stat pr ${ch.priority[0].split(' ')[0]}"><b>${esc(ch.priority[0])}</b><span>${esc(ch.priority[1])}</span></div>` : ''}</div>` : ''}
        ${ch && ch.note ? `<p class="tnote">${esc(ch.note)}</p>` : ''}
        ${VCT.filter(v => v[2].includes(id)).map(([k, n]) => `<a class="simlink vcl" href="#cards-${k}"><i>🖼</i><span><b>Visual card: ${esc(n)} →</b><small>a live drawing, the key formula with your numbers, and an exam tip</small></span></a>`).join('')}
        ${LABN[id] ? `<a class="simlink tsl" href="#sim-${id}"><i>⚙</i><span><b>Open the ${esc(short(t))} Formula & Concept Simulator →</b><small>${LABN[id] + LXC.filter(e => e[4].includes(id)).length} simulators — experiment, calculations, graphs, concept and exam practice for each</small></span></a>` : ''}
        ${t.t === 'Transformers' ? `<a class="simlink" href="${SIM_URL}"${SIM_TGT}><i>⚙</i><span><b>Open the Transformer Formula & Concept Simulator${STANDALONE ? ' →' : ' ↗'}</b><small>Phasors, losses, efficiency, regulation, 3-phase, parallel operation, saturation and inrush — on the full Transformers page</small></span></a>` : ''}
        <div class="mine" id="mine"></div></div>
      <nav class="lpath" id="lpath" aria-label="Learning path"></nav>
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
      if (!e.isIntersecting || e.target.id === cur) return; cur = e.target.id; markStep(id, cur);
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
        lazy(); if (p === 'sim') { mountLabs(); markStep(id, 'labs'); }
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
      const ps = e.target.closest('[data-path]');
      if (ps) { e.preventDefault(); if (ps.dataset.path === 'mt-go') startMastery(id); else { const sid = ps.dataset.path === 'sim' ? 'labs' : ps.dataset.path; goSec(sid); markStep(id, sid); } return; }
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
      const rows = ev === 'st' ? D.st.filter(f => hit(f[1] + ' ' + f[3])).map(f => `<div class="ef"><div class="nm">${starBtn(`s${id}.${f[0]}`, 'formula')}${f[0]}. ${f[1]}${f[2] ? `<small>${f[2]}</small>` : ''}<small>Vol 6 · question p ${f[4]} · answer p ${f[5]}</small></div><div class="fx">${f[3]}</div></div>`)
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
    let gm = 0, gshown = Infinity, nG = 0;
    const rGate = () => {
      const rows = D.gate.filter(g => (!gm || g.m === gm) && hit(g.src + ' q' + g.q + ' ' + g.a + ' ' + plain(g.l.join(' ')))).sort((a, b) => +(b.src.match(/\d{4}/) || [0])[0] - +(a.src.match(/\d{4}/) || [0])[0]);
      nG = rows.length;
      $('#glist').innerHTML = rows.slice(0, gshown).map(g => { const e = P.q[`g${id}.${g.i}`];
        return `<article class="box gs" data-g="${g.i}"><header>${starBtn(`g${id}.${g.i}`, 'GATE sum')}<b>${esc(g.src)} · Q.${esc(g.q)}</b><span class="mk ${g.m === 2 ? 'two' : ''}">${g.m} mark${g.m > 1 ? 's' : ''}</span><span class="pg">p ${g.pg}</span></header>
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
      $('#gm').onclick = e => { const b = e.target.closest('button'); if (!b) return; gm = +b.dataset.m; gshown = Infinity; $$('#gm button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rGate(); };
      $('#glist').onclick = e => {
        const s = e.target.closest('[data-gs]');
        if (s) { const g = s.closest('.gs'); record(`g${id}.${g.dataset.g}`, s.dataset.gs === '1'); $('.self', g).innerHTML = `Saved: <b>${s.dataset.gs === '1' ? '✓ got it' : '✗ missed'}</b>`; return; }
        const b = e.target.closest('.gt'); if (!b) return; const box = $('.' + b.dataset.k, b.closest('.gs')); box.hidden = !box.hidden; b.classList.toggle('on', !box.hidden); lazy(box);
      };
    }

    // past-question rows
    let qg = '', qshown = Infinity, nB = 0;
    const rBank = () => {
      const rows = D.rows.filter(r => (!qg || r.g === qg) && hit(r.p + ' q' + r.q + ' ' + r.c + ' ' + r.f.join(' ') + ' ' + r.a)); nB = rows.length;
      $('#qlist').innerHTML = rows.slice(0, qshown).map(rowCard).join('') || '<div class="empty">No question matches this search.</div>';
      const m = $('#qmore'); m.hidden = rows.length <= qshown; m.textContent = `Show ${Math.min(12, rows.length - qshown)} more (${rows.length - qshown} left)`;
    };
    if ($('#qlist')) {
      $('#qmore').onclick = () => { qshown += 12; rBank(); };
      $('#qg').onclick = e => { const b = e.target.closest('button'); if (!b) return; qg = b.dataset.g; qshown = Infinity; $$('#qg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rBank(); };
    }

    // Question Book
    let uf = { p: '', m: '', e: '', s: '' }, ushown = Infinity, nU = 0;
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
      const segf = (sel, key) => { $(sel).onclick = e => { const b = e.target.closest('button'); if (!b) return; uf[key] = b.dataset.v; ushown = Infinity; $$(sel + ' button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); rU(); }; };
      segf('#ubp', 'p'); segf('#ubm', 'm'); segf('#ube', 'e');
      $('#ubs').onchange = e => { uf.s = e.target.value; ushown = Infinity; rU(); };
      $('#ulist').onclick = e => uAnswer(e, U);
      $('#ulist').onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('unum')) { e.preventDefault(); uAnswer({ target: e.target.closest('.ub').querySelector('[data-uact="chk"]') }, U); } };
    }

    // search within the topic
    let q = '';
    function hit(s) { return !q || q.split(' ').every(w => plain(String(s)).toLowerCase().includes(w)); }
    const applySearch = () => {
      $$('[data-s]', main).forEach(el => el.classList.toggle('hidden-by-search', !hit(el.dataset.s)));
      const ne = rEvery(); if ($('#glist')) { gshown = Infinity; rGate(); } if ($('#qlist')) { qshown = Infinity; rBank(); } if ($('#ulist')) { ushown = Infinity; rU(); }
      $$('.pbar [data-pane]', main).forEach(b => {
        const k = b.dataset.pane, el = $('.pcount', b); if (!q) { el.hidden = true; return; }
        el.textContent = $$(`.pane[data-pane="${k}"] [data-s]:not(.hidden-by-search)`, main).length + (k === 'prac' ? nB + nG + nU : k === 'learn' ? ne : 0); el.hidden = false;
      });
    };
    $('#q').oninput = e => { clearTimeout(window.__st); window.__st = setTimeout(() => { q = e.target.value.trim().toLowerCase().replace(/\s+/g, ' '); applySearch(); }, 160); };

    rEvery(); if ($('#glist')) rGate(); if ($('#qlist')) rBank(); if ($('#ulist')) rU();
    // the learning path: the book's order of study, each step a section of this page
    const sumSec = SECS.find(x => /^s\d/.test(x[0]) && /sum/i.test(x[2])), fSec = SECS.find(x => x[2] === 'Formulas');
    LP = { id, steps: [['c60', '⏱', 'Concept in 60 s', 'c60'], ['f', '📐', 'Formulas', fSec ? fSec[0] : 'every'], ['rel', '↕', 'Relationships', 'rel'], ['sums', '✍', 'Solved sums', sumSec ? sumSec[0] : (D.gate.length ? 'gate' : 'drill')],
      ['sim', '⚙', 'Simulator', 'labs'], ['pq', '📘', 'Past questions', U ? 'qbook' : otherQ.length ? 'pyq' : 'bank'], ['traps', '⚠', 'Exam traps', 'traps'], ['mt', '🎯', 'Mastery test', 'mastery']].filter(x => document.getElementById(x[3])) };
    const rb = $('#relbox'), rio = new IntersectionObserver(es => { if (!es.some(e => e.isIntersecting)) return; rio.disconnect();
      loadSims().then(() => { if (rb.isConnected) rb.innerHTML = relHtml(id); }).catch(err => { rb.innerHTML = `<div class="empty">${esc(err.message)}. Check your connection.</div>`; }); }, { rootMargin: '600px 0px' });
    if (rb) rio.observe(rb);
    paintMine(D);
    showPane(pane || 'learn'); toTop(); lazy();
    if (GOSEC) { const el = document.getElementById(GOSEC); GOSEC = null; if (el) { requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
      // the sections above can still grow (pictures, progress box): settle once more unless the reader has scrolled
      let y0; setTimeout(() => { if (el.isConnected) { el.scrollIntoView({ block: 'start' }); y0 = scrollY; } }, 400); setTimeout(() => { if (el.isConnected && scrollY === y0) el.scrollIntoView({ block: 'start' }); }, 1300); } }
    if (GOU) { const el = main.querySelector(`[data-u="${GOU.replace(/[^\w.-]/g, '')}"]`); GOU = null;
      if (el) { goCard(el); let y0; setTimeout(() => { if (el.isConnected) { el.scrollIntoView({ block: 'center' }); y0 = scrollY; } }, 450); setTimeout(() => { if (el.isConnected && scrollY === y0) el.scrollIntoView({ block: 'center' }); }, 1400); } }
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
    return `<article class="box gs ub" data-u="${x.id}"><header>${starBtn(x.id)}<b>${x.lab}</b><span class="ex ex-${x.ex}">${esc(x.src)}</span>${uState(x)}${x.pg ? `<span class="pg">p ${x.pg}</span>` : ''}</header>
      ${sub[0] ? `<div class="usub"><b>${esc(sub[0])}</b>${sub[1] ? ` · ${esc(sub[1])}` : ''}</div>` : ''}
      ${x.qh != null ? `<div class="uq">${x.qh}${x.oh && x.oh.length ? `<ol class="uopts">${x.oh.map(([l, h]) => `<li><b>(${l})</b> ${h}</li>`).join('')}</ol>` : ''}</div>
        <div class="im print${x.wide ? ' wide' : ''}" hidden>${spu(x.qs, x.src)}</div>` : (x.rf ? qPic(x, x.src) : `<div class="im${x.wide ? ' wide' : ''}">${spu(x.qs, x.src)}<span class="zoomhint">${x.wide ? 'Swipe sideways to read the whole line · tap to zoom' : 'Tap the picture to zoom'}</span></div>`)}
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
      const v = numIn($('.unum', card).value); if (!Number.isFinite(v)) { toast('Type a number first.'); return; }
      ok = natOk(x.ok, v);
    } else return;
    card.dataset.done = 1; record(x.id, ok);
    fb.innerHTML = ok ? '<b class="up">Correct!</b>' : `<b class="dn">Not quite.</b> The answer is <b>${esc(x.ans)}</b>.`; fb.hidden = false;
    showSol();
  }
  const rowCard = r => `<article class="box qr"><header><span class="ex ex-${r.g}">${esc(r.p)}</span><b>Q${esc(r.q)}</b><span class="pg">Study Notes p ${r.pg ?? '–'} · Appendix p ${r.at}</span></header>
    <div class="cn">${r.c}</div><div class="fx fl">${r.f.join('<br>')}</div><div class="acts"><button class="btn rv" data-a="Answer: ${esc(r.a)}">Show answer</button></div></article>`;
  // the "you" strip under the title and the My progress section of a topic
  /* ---------- learning path, concept in 60 s, relationships, traps, mastery test ---------- */
  let LP = null;
  function markStep(id, sid) {
    if (!LP || LP.id !== id) return; const st = LP.steps.find(x => x[3] === sid && x[0] !== 'mt'); if (!st) return;
    const m = P.lp[id] || (P.lp[id] = {}); if (m[st[0]]) return; m[st[0]] = now(); changed(); paintPath();
  }
  function paintPath() {
    const el = $('#lpath'); if (!el || !LP) return; const m = P.lp[LP.id] || {}, mt = P.mt[LP.id], done = k => k === 'mt' ? !!(mt && mt.pass) : !!m[k];
    const n = LP.steps.filter(x => done(x[0])).length;
    el.innerHTML = `<b>Learning path <small>${n} of ${LP.steps.length} steps</small></b><div class="lps">${LP.steps.map(([k, ic, nm, sid], i) => `<a href="#" class="lp${done(k) ? ' on' : ''}" data-path="${sid === 'labs' ? 'sim' : sid}" title="${esc(nm)}"><i>${done(k) ? '✓' : ic}</i><span>${i + 1}. ${esc(nm)}</span></a>`).join('')}</div>`;
  }
  // the book's own words only: takeaway, key formula, cause → effect, key words, the common mistake
  function c60Html(D, ch, id, vn) {
    const P_ = [];
    if (ch) {
      if (ch.takeaway) P_.push(`<div class="c6 take"><b>💡 In one line</b><span>${ch.takeaway}</span></div>`);
      const k = ch.keys[0]; if (k && (k.img || k.f)) P_.push(`<div class="c6 kf"><b>📐 Key formula</b>${k.img ? fpic(k.img.sp, D, k.img.fl, 'Key formula') : `<div class="fx">${k.f}</div>`}<span class="pg">${vn} · p ${k.pg}</span></div>`);
      if (ch.why.length) P_.push(`<div class="c6"><b>⚡ Cause → effect</b>${ch.why.slice(0, 2).map(w => `<p>${w.cause} → ${w.effect}</p>`).join('')}</div>`);
      if (ch.terms.length) P_.push(`<div class="c6"><b>🔤 Key words</b>${ch.terms.slice(0, 4).map(w => `<p><b>${w.term}</b> — ${w.mean}</p>`).join('')}</div>`);
      if (ch.mistakes.length) P_.push(`<div class="c6 trap"><b>⚠ Common mistake</b><p>✗ ${ch.mistakes[0].m}</p><p>✓ ${ch.mistakes[0].c}</p></div>`);
    } else if (D.st.length) P_.push(`<div class="c6 kf"><b>📐 The main formulas</b>${D.st.slice(0, 4).map(f => `<p><b>${f[1]}</b><br><span class="fx">${f[3]}</span></p>`).join('')}<span class="pg">Formula Self-Test · Vol 6</span></div>`);
    const tw = (UA || []).filter(x => x.t === id && x.sh).flatMap(x => x.sh.filter(e => e[0] === 'mis').map(e => e[1]))[0];
    if (tw && !(ch && ch.mistakes.length)) P_.push(`<div class="c6 trap"><b>⚠ Common mistake</b><p>${tw.replace(/^\s*⚠\s*Common mistake:\s*/, '')}</p><span class="pg">Question Book</span></div>`);
    return P_.length ? `<div class="c60">${P_.join('')}</div><p class="pg">All from your book, word for word. Then work down the learning path above.</p>` : '<p class="pg">This topic has no chapter notes yet (Volume 1); start with its formulas below.</p>';
  }
  // the relationship engine run over this topic's labs: only named laws (direct, inverse, square, root …)
  function relHtml(id) {
    const labs = LABS.filter(L => L.t === id); if (!labs.length) return '<p class="pg">No simulator lab for this topic yet.</p>';
    const symOf = lb => { const w = lb.trim().split(/\s+/).pop(); return w.length <= 4 && /[A-Zα-ωΑ-Ωϕφθμ₀-₉_]/.test(w) && !/^[a-z]+$/.test(w) ? w : 'x'; };
    const isN = s => !Array.isArray(s[4]) && s[4] !== 'text';
    let first = true;
    const out = labs.map(L => {
      const v = SIMS.run(L), nums = L.i.filter(isN), outs = L.o.filter(o => typeof v[o[0]] === 'number' && Number.isFinite(v[o[0]])), rows = [];
      nums.forEach(s => outs.forEach(o => { const r = SIMS.relation(L, v, s[0], o[0]); if (r && r.dir && r.law.startsWith('∝')) rows.push([s, o, r]); }));
      if (!rows.length) return '';
      const op = first; first = false;
      return `<details class="rel"${op ? ' open' : ''}><summary><b>${esc(L.n)}</b> <small>${rows.length} relationship${rows.length > 1 ? 's' : ''}</small></summary><table class="relt"><tbody>${rows.map(([s, o, r]) => `<tr><td>${esc(s[1])} <b>↑</b></td><td class="${r.dir > 0 ? 'up' : 'dn'}">${esc(o[1])} <b>${r.dir > 0 ? '↑' : '↓'}</b></td><td><b>${esc(r.law.replace(/ \(.*\)$/, '').replace(/x/g, symOf(s[1])))}</b></td></tr>`).join('')}</tbody></table>
        <p class="pg">Every other input of this lab held constant at: ${nums.map(s => `${esc(s[1])} = ${SIMS.fmt(v[s[0]])}${s[2] ? ' ' + esc(s[2]) : ''}`).join(' · ')}.</p></details>`;
    }).join('');
    return (out || '<p class="pg">The labs of this topic have no simple power-law relationships (their results rise or fall, but not in proportion) — try them in the simulator.</p>') + `<div class="acts"><button class="btn go" data-path="sim">⚙ Try them in the simulator →</button></div>`;
  }
  // the chapter's own warnings, the key-formula ⚠ notes, the sums' traps, and the Question Book's common mistakes
  function trapsHtml(ch, id) {
    const L = [], seen = new Set(), add = (h, c, src) => { const k = plain(h).toLowerCase().slice(0, 80); if (!k || seen.has(k)) return; seen.add(k); L.push([h, c, src]); };
    if (ch) {
      ch.mistakes.forEach(m => add(m.m, m.c, 'Chapter · common mistake'));
      ch.keys.forEach(k => k.notes.filter(n => /^⚠/.test(plain(n))).forEach(n => add(n.replace(/^\s*⚠\s*(Trap:)?\s*/, ''), '', `Key formula · p ${k.pg}`)));
      [...ch.sums, ...ch.ratio].forEach(x => { if (x.trap) add(x.trap, '', `${(plain(x.title).match(/^(Sum \d+|R\d+)/) || ['Sum'])[0]} · p ${x.pg}`); });
    }
    (UA || []).filter(x => x.t === id && x.sh).forEach(x => x.sh.forEach(([k, h]) => { if (k === 'mis') add(h.replace(/^\s*⚠\s*Common mistake:\s*/, ''), '', `Question Book ${x.lab} · ${x.src}`); }));
    if (!L.length) return '<p class="pg">No traps printed for this topic.</p>';
    const row = ([h, c, src], i) => `<li${i >= 10 ? ' hidden' : ''}><span>✗ ${h}${c ? `<br><b class="up">✓</b> ${c}` : ''}</span><small>${esc(src)}</small></li>`;
    return `<ol class="trapl">${L.map(row).join('')}</ol>${L.length > 10 ? `<button class="more" data-traps>Show all ${L.length} traps</button>` : ''}`;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-traps]'); if (!b) return; $$('li[hidden]', b.previousElementSibling).forEach(li => li.hidden = false); b.remove(); });
  // the mastery test: 15 questions from the topic (past questions, book MCQs, a few formula letters); 70 % passes
  function startMastery(id) {
    const t = T(id), pool = shuffle([...UA.filter(x => x.t === id && /^(mcq|msq|nat)$/.test(x.ty)).map(uItem), ...QA.filter(x => x.t === id && x.r != null).map(mcqQ)]);
    const seen = new Set(), fl = shuffle(mlItems(FA.filter(f => f.t === id))).filter(it => !seen.has(it.id) && seen.add(it.id));
    const nf = Math.min(fl.length, Math.max(3, 15 - pool.length));
    const items = shuffle([...pool.slice(0, 15 - Math.min(nf, 15)), ...fl.slice(0, nf).map(mlQuestion)]).slice(0, 15);
    if (!items.length) { toast('No questions in this topic yet.'); return; }
    quiz(items, `🎯 Mastery test · ${t.t}`, { onEnd: (r, n) => { const pc = pct(r, n), m = P.mt[id] || {}; P.mt[id] = { last: pc, best: Math.max(pc, m.best || 0), n, ts: now(), pass: !!m.pass || pc >= 70 }; changed(); },
      endNote: (r, n) => pct(r, n) >= 70 ? '🎯 Passed — this topic is mastered!' : `Pass mark: 70 % (${Math.ceil(n * 0.7)} of ${n}). Look at the exam traps, then try again.` });
  }
  function paintMine(D) {
    const id = D.id, s = stats().by[id], p = s && s.a ? pct(s.r, s.a) : null, mis = mistakes().filter(x => topicOf(x) === id).length;
    const wf = weakFormulas().filter(([fid]) => topicOf(fid) === id);
    const m = $('#mine');
    if (m) m.innerHTML = s ? `<span>You: <b>${s.a}</b> answers · <b style="color:${tone(p)[1]}">${p} %</b> correct · last practised ${ago(P.seen[id])}${mis ? ` · <b>${mis}</b> mistakes to revise` : ''}</span><button class="btn go" data-act="quiz">Practise 10 →</button>`
      : `<span>Not practised yet. A quick 10-question set mixes this topic's MCQs with its formulas.</span><button class="btn go" data-act="quiz">Practise 10 →</button>`;
    const mb = $('#mtbox'), mt = P.mt[id];
    if (mb) mb.innerHTML = `<p class="lead">15 questions mixed from this topic — past questions, book MCQs and formula letters, different every time. 70 % (11 of 15) passes and marks the topic 🎯 mastered.</p>
      <div class="acts"><button class="btn go" data-path="mt-go">${mt ? 'Take the test again' : 'Start the mastery test'}</button>${mt ? `<span class="pg">${mt.pass ? '<b class="up">🎯 Mastered</b> · ' : ''}last ${mt.last} % · best ${mt.best} % · ${ago(mt.ts)}</span>` : ''}</div>`;
    paintPath();
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
    const rec = studyNext().slice(0, 6);
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
        ${dashHtml(S)}
        <div class="kpis">${kpi(S.a, 'answers')}${kpi(S.a ? pct(S.r, S.a) + ' %' : '–', 'correct overall')}${kpi(`${tried.length}/${IX.T.length}`, 'topics practised')}${kpi(nF, 'formulas tested')}${kpi(mis.length, 'mistakes to revise')}${kpi(P.mocks.length ? Math.max(...P.mocks.map(m => m.pc)) + ' %' : '–', `best mock · ${P.mocks.length} taken`)}</div>
        <div class="acts"><a class="btn go" href="#mock">⏱ Start a mock test</a>${mis.length ? `<button class="btn" data-c="rev">↻ Revise my ${mis.length} mistakes</button>` : ''}${wf.length ? `<button class="btn" data-c="wf">✍ Practise my ${wf.length} weak formulas</button>` : ''}${rec.length ? `<button class="btn" data-c="weakmix">🎯 20 questions from my weakest topics</button>` : ''}</div>
        ${!S.a ? '<p>Nothing answered yet. Every MCQ, missing-letter question, flashcard, GATE self-check and mock test you do on any topic page lands here, so this console can show where you are weak.</p>' : ''}</section>

      ${weekHtml()}
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
          return `<tr><td data-l="Date">${new Date(m.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td class="num" data-l="Score"><b>${m.score} / ${m.tot || m.n}</b> (${m.pc} %)</td><td class="num" data-l="Right / wrong / blank">${m.r} · ${m.w} · ${m.n - m.r - m.w}</td>
          <td data-l="Weakest"><div class="srcs">${w.map(([tid, v]) => T(tid) ? `<span class="${v[1] / v[0] < 0.7 ? 'bad' : ''}">${esc(short(T(tid)))} ${v[1]}/${v[0]}</span>` : '').join('') || '<span>—</span>'}</div></td></tr>`; }).join('')}</tbody></table>` : '<p>No mock test yet.</p>'}
        <div class="acts"><a class="btn go" href="#mock">Start a mock test</a></div></section>
      <section class="panel" id="backup"><h2>💾 Back up my progress <small>a file on this phone — nothing is sent anywhere</small></h2>
        <p>Save your answers, mock results, stars and study calendar as a small file. Restore it on a new phone or after clearing the browser: it is combined with what is already here, keeping the fuller record of each question.</p>
        <div class="acts"><button class="btn go" data-c="exp">⬇ Save a backup file</button><label class="btn" for="impf">⬆ Restore from a backup file</label><input type="file" id="impf" accept=".json,application/json" hidden></div><p class="pg" id="bkst"></p></section>
      <button class="btn" data-c="reset" style="justify-self:start;font-size:12px;color:var(--ink-2)">Reset all my progress</button>
    </div>`;
    main.onclick = e => {
      const dd = e.target.closest('[data-day]'); if (dd) { dayRead(dd); dayDetail(dd); return; }
      const rv = e.target.closest('[data-revday]'); if (rv) { const ids = rv.dataset.revday.split(','); loadEvery().then(() => quiz(ids.map(itemFor).filter(Boolean), `Revise · ${fmtDay(rv.dataset.k)}`)); return; }
      const c = e.target.closest('[data-c]'); if (!c) return;
      const k = c.dataset.c;
      if (k === 'rev') reviseMistakes();
      if (k === 'subq') { const [t, sb] = [c.dataset.k.slice(0, c.dataset.k.indexOf('|')), c.dataset.k.slice(c.dataset.k.indexOf('|') + 1)]; quiz(shuffle(UA.filter(x => x.t === t && x.sb === sb && x.ty === 'mcq').map(uQ)), `Practise · ${sb}`); }
      if (k === 'prac') quiz(topicMix(c.dataset.t, 10), `Practise · ${T(c.dataset.t).t}`);
      if (k === 'wf') quiz(shuffle(wf.slice(0, 25).map(([fid]) => FBY[fid] && mlItems([FBY[fid]])[0]).filter(Boolean).map(mlQuestion)), 'My weak formulas');
      if (k === 'weakmix') { const ts = rec.slice(0, 4).map(r => r.t.id); quiz(shuffle(ts.flatMap(tid => topicMix(tid, 5))).slice(0, 20), 'My weakest topics'); }
      if (k === 'reset') { c.outerHTML = '<span class="confirm">Clear all your saved progress and mock results? <button class="btn no" data-c="reset2">Yes, clear it</button> <button class="btn" data-c="keep">No</button></span>'; }
      if (k === 'reset2') { P = EMPTY(); fixP(); changed(); viewConsole(RT, true); }
      if (k === 'exp') exportProgress();
      if (k === 'today') startToday(c.dataset.fresh === '1');
      if (k === 'keep') viewConsole(RT, true);
    };
    $('#impf').onchange = e => { const f = e.target.files[0]; if (f) importProgress(f); e.target.value = ''; };
    main.onpointerover = e => { const d = e.target.closest('[data-day]'); if (d) dayRead(d); };
    if (keep) scrollTo(0, y); else toTop();
  }
  /* the dashboard at the top of the console: streak, today, daily answers (30 days), study calendar, badges */
  const fmtDay = k => new Date(k + 'T12:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  function streaks() {
    const has = k => P.days[k] && P.days[k][0] > 0, d = new Date(); d.setHours(12, 0, 0, 0);
    if (!has(dayOf(d))) d.setDate(d.getDate() - 1);          // today not started yet: the streak still counts up to yesterday
    let cur = 0; while (has(dayOf(d))) { cur++; d.setDate(d.getDate() - 1); }
    const ks = Object.keys(P.days).filter(has).sort(); let best = 0, run = 0, prev = null;
    for (const k of ks) { const t = new Date(k + 'T12:00'); run = prev && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
    return { cur, best, days: ks.length };
  }
  function badges(S, st) {
    const nd = Object.keys(P.q).filter(id => id[0] === 'd').length, nz = Object.keys(P.q).filter(id => id[0] === 'z').length, nu = Object.keys(P.q).filter(id => id[0] === 'u').length;
    const topics = Object.keys(S.by).length, bestMock = P.mocks.length ? Math.max(...P.mocks.map(m => m.pc)) : 0;
    return [['🌱', 'First answer', S.a, 1], ['💯', '100 answers', S.a, 100], ['🏅', '1,000 answers', S.a, 1000], ['🔥', '3-day streak', st.best, 3], ['⚡', '7-day streak', st.best, 7], ['🏆', '30-day streak', st.best, 30],
      ['📘', '100 Question Book', nu, 100], ['🔢', '50 drill numericals', nd, 50], ['🎯', 'Predicted paper: 50 Qs', nz, 50], ['⏱', 'First mock test', P.mocks.length, 1], ['🥇', 'Mock score 70 %+', bestMock, 70], ['🗺', 'All 46 topics tried', topics, IX.T.length]];
  }
  // XP: 10 for a right answer, 2 for trying, 50 per mock; a level every 500 XP
  const xpOf = S => S.r * 10 + (S.a - S.r) * 2 + P.mocks.length * 50;
  const weekRow = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); const tk = todayKey();
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => { const k = dayOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, 12)), on = P.days[k] && P.days[k][0] > 0;
      return `<span class="wd${on ? ' on' : ''}${k === tk ? ' now' : ''}${k > tk ? ' fut' : ''}" title="${fmtDay(k)}${on ? ` · ${P.days[k][0]} answers` : ''}"><b>${l}</b><i>${on ? '✓' : ''}</i></span>`; }).join(''); };
  // answers by weekday over the last 4 weeks, as columns of dots (one dot = a step of answers)
  function dotMatrix() {
    const W = [0, 0, 0, 0, 0, 0, 0], d = new Date(); d.setHours(12, 0, 0, 0);
    for (let i = 0; i < 28; i++) { const k = dayOf(d); W[(d.getDay() + 6) % 7] += (P.days[k] || [0])[0]; d.setDate(d.getDate() - 1); }
    const mx = Math.max(...W), step = mx <= 12 ? 1 : Math.ceil(mx / 12), rows = 12;
    return `<div class="dots" role="img" aria-label="Answers by weekday, last 4 weeks: ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((n, i) => `${n} ${W[i]}`).join(', ')}">${W.map((v, i) => { const n = Math.ceil(v / step);
      return `<div class="dcol${v && v === mx ? ' top' : ''}" title="${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}: ${v} answers">${Array.from({ length: rows }, (_, r) => `<i class="${rows - r <= n ? (rows - r === n ? 'hd' : 'on') : ''}"></i>`).join('')}<b>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</b><small>${v}</small></div>`; }).join('')}</div><p class="pg">one dot = ${step} answer${step > 1 ? 's' : ''}</p>`;
  }
  /* practice by subject as a ring: angle = share of your answers, thickness = accuracy, centre = total.
     Colours: the validated categorical palette in fixed subject order (the legend writes every value out). */
  function ringHtml(S) {
    const sub = IX.S.map(([k, n], i) => { let a = 0, r = 0; IX.T.forEach(t => { if (t.s === k && S.by[t.id]) { a += S.by[t.id].a; r += S.by[t.id].r; } }); return { k, n, a, r, i }; });
    const tot = sub.reduce((x, s) => x + s.a, 0), cx = 110, cy = 110, R0 = 52;
    const P = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
    const arc = (a0, a1, r0, r1) => { a1 = Math.min(a1, a0 + 2 * Math.PI - 0.0005); const L = a1 - a0 > Math.PI ? 1 : 0; return `M${P(r1, a0)} A${r1},${r1} 0 ${L} 1 ${P(r1, a1)} L${P(r0, a1)} A${r0},${r0} 0 ${L} 0 ${P(r0, a0)} Z`; };
    let a = -Math.PI / 2, segs = '';
    sub.forEach(s => { if (!s.a) return; const a1 = a + 2 * Math.PI * s.a / tot, acc = s.r / s.a; segs += `<path d="${arc(a, a1, R0, R0 + 12 + 40 * acc)}" fill="var(--ring${s.i + 1})" stroke="var(--paper)" stroke-width="2"><title>${esc(s.n)}: ${s.a} answers (${pct(s.a, tot)} %), ${pct(s.r, s.a)} % correct</title></path>`; a = a1; });
    return `<div class="dt ring"><span class="dl">🍩 Practice by subject <small>ring size = share of your answers · thickness = % correct</small></span>
      <div class="rgw"><svg viewBox="0 0 220 220" class="rgs" role="img" aria-label="Answers by subject">${tot ? segs : `<circle cx="${cx}" cy="${cy}" r="${R0 + 20}" fill="none" stroke="var(--s-track)" stroke-width="40"/>`}
        <circle cx="${cx}" cy="${cy}" r="${R0 - 6}" fill="none" stroke="var(--line)" stroke-dasharray="2 5"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" class="rgn">${tot.toLocaleString('en-IN')}</text><text x="${cx}" y="${cy + 22}" text-anchor="middle" class="rgl">${tot ? `answers · ${pct(S.r, S.a)} %` : 'no answers yet'}</text></svg>
        <ul class="rgk">${sub.map(s => `<li><i style="background:var(--ring${s.i + 1})"></i><b>${esc(s.n)}</b><span>${s.a ? `${s.a} · ${pct(s.a, tot)} % of answers · ${pct(s.r, s.a)} % correct` : 'not practised'}</span></li>`).join('')}</ul></div></div>`;
  }
  function dashHtml(S) {
    const st = streaks(), tk = todayKey(), td = P.days[tk] || [0, 0], left = todayLeft(), tot = P.day && P.day.d === tk ? P.day.ids.length : 20;
    // daily answers, last 30 days: one series, bars from the baseline
    const D = []; for (let i = 29; i >= 0; i--) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); const k = dayOf(d); D.push([k, ...(P.days[k] || [0, 0])]); }
    const mx = Math.max(10, ...D.map(d => d[1])), nice = mx <= 10 ? 10 : mx <= 20 ? 20 : mx <= 50 ? 50 : Math.ceil(mx / 50) * 50;
    const W = 600, H = 170, X0 = 34, Y0 = 10, Y1 = H - 24, bw = (W - X0 - 4) / 30;
    const yy = v => Y1 - (Y1 - Y0) * v / nice;
    const bars = D.map(([k, a, r], i) => { const x = X0 + i * bw, h = Y1 - yy(a);
      return `<g data-day="${k}" data-a="${a}" data-r="${r}"><rect class="hit" x="${x}" y="${Y0}" width="${bw}" height="${Y1 - Y0}"/>${a ? `<path class="bar${k === tk ? ' today' : ''}" d="M${x + 2},${Y1} v${-(h - 4)} q0,-4 4,-4 h${bw - 12} q4,0 4,4 v${h - 4} z"/>` : ''}</g>`; }).join('');
    const grid = [0, nice / 2, nice].map(v => `<line class="gl" x1="${X0}" x2="${W - 4}" y1="${yy(v)}" y2="${yy(v)}"/><text class="ax" x="${X0 - 6}" y="${yy(v) + 4}" text-anchor="end">${v}</text>`).join('');
    const xl = [0, 10, 20, 29].map(i => `<text class="ax" x="${X0 + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${i === 29 ? 'today' : new Date(D[i][0] + 'T12:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</text>`).join('');
    const sum30 = D.reduce((a, d) => a + d[1], 0), r30 = D.reduce((a, d) => a + d[2], 0), act30 = D.filter(d => d[1]).length;
    // this month's calendar: shade = answers that day; ahead: drill sums coming due (3 days after you got them)
    const now0 = new Date(), y = now0.getFullYear(), m = now0.getMonth(), first = new Date(y, m, 1), nDays = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
    // revisions coming due, by day (spaced revision: day 1, 3, 7, 15, 30)
    const due = {}, lev = [0, 0, 0, 0, 0, 0, 0]; let dueNow = 0, dueWrong = 0, week = 0; const end = dayStart() + 1440;
    for (const m of [P.q, P.f]) for (const id in m) { if (!SRK.test(id)) continue; const e = m[id], d = srDue(id, e), l = Math.min(srLevel(id, e), 6); lev[l]++;
      if (d <= end) { dueNow++; if (!l) dueWrong++; } else { const k = dayOf(d * 60000); due[k] = (due[k] || 0) + 1; if (d <= end + 6 * 1440) week++; } }
    const lvl = a => !a ? 0 : a < 10 ? 1 : a < 25 ? 2 : a < 50 ? 3 : 4;
    const cells = [...Array(lead).fill('<span></span>'), ...Array.from({ length: nDays }, (_, i) => { const k = dayOf(new Date(y, m, i + 1, 12)), a = (P.days[k] || [0])[0], fut = k > tk;
      return `<button class="cd l${fut ? 0 : lvl(a)}${k === tk ? ' today' : ''}" data-day="${k}" data-a="${a}" data-r="${(P.days[k] || [0, 0])[1]}" data-due="${due[k] || 0}" aria-label="${fmtDay(k)}: ${a} answers${fut && due[k] ? `, ${due[k]} revisions due` : ''}">${i + 1}${fut && due[k] ? `<i>${due[k]}</i>` : ''}</button>`; })].join('');
    const B = badges(S, st), got = B.filter(b => b[2] >= b[3]).length;
    return `<div class="dash">
      <div class="dt today"><span class="dl">📅 Today</span><b>${td[0]} answer${td[0] === 1 ? '' : 's'}</b><small>${td[0] ? pct(td[1], td[0]) + ' % correct' : 'nothing yet today'} · ${dueNow} revision${dueNow === 1 ? '' : 's'} due</small>
        <div class="acts">${left == null ? `<button class="btn gold" data-c="today">Start Today's 20</button>` : left ? `<button class="btn gold" data-c="today">Today's ${tot} · ${left} left</button>` : `<span class="up">✓ Today's ${tot} done</span><button class="btn" data-c="today" data-fresh="1">Another 20</button>`}</div></div>
      <div class="dt streak"><span class="dl">🔥 Study streak</span><b>${st.cur} day${st.cur === 1 ? '' : 's'}</b><small>best ${st.best} · ${st.days} study days in all</small><div class="week">${weekRow()}</div></div>
      <div class="dt level"><span class="dl">⭐ Level ${Math.floor(xpOf(S) / 500) + 1}</span><b>${xpOf(S).toLocaleString('en-IN')} XP</b><small>${500 - xpOf(S) % 500} XP to level ${Math.floor(xpOf(S) / 500) + 2} · 10 XP a right answer, 2 a try, 50 a mock</small><div class="bar" style="--col:var(--pur)"><i style="width:${xpOf(S) % 500 / 5}%"></i></div></div>
      <div class="dt wide"><span class="dl">📈 Daily progress <small>answers per day, last 30 days · ${sum30} answers on ${act30} days${sum30 ? ` · ${pct(r30, sum30)} % correct` : ''}</small></span>
        <svg class="dchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Answers per day for the last 30 days">${grid}${bars}${xl}</svg>
        <p class="dread" aria-live="polite">Tap a bar to see that day — and the questions you answered.</p><div class="dday" hidden></div></div>
      <div class="dt rev"><span class="dl">🔁 Revision schedule <small>day 1 · 3 · 7 · 15 · 30 — a wrong answer starts again</small></span>
        <b>${dueNow} due today</b><small>${dueWrong ? `${dueWrong} of them were wrong last time (first in Today's 20) · ` : ''}${week} more in the next 7 days</small>
        <div class="lv">${SRN.map((n, i) => `<span class="lv${i}" title="${esc(n)}"><b>${lev[i]}</b>${esc(n.replace(' — again tomorrow', ''))}</span>`).join('')}</div></div>
      <div class="dt wk"><span class="dl">⏰ Most active days <small>answers by weekday, last 4 weeks</small></span>${dotMatrix()}</div>
      <div class="dt cal"><span class="dl">🗓 ${now0.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} <small>shade = answers · <i class="duei">n</i> revisions due that day</small></span>
        <div class="calg">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => `<b>${d}</b>`).join('')}${cells}</div>
        <div class="calk"><span>fewer</span>${[0, 1, 2, 3, 4].map(l => `<i class="cd l${l}"></i>`).join('')}<span>more answers</span></div></div>
      ${ringHtml(S)}
      ${labTile()}
      <div class="dt badges"><span class="dl">🏅 Achievement badges <small>${got} of ${B.length}</small></span>
        <div class="bgs">${B.map(([ic, n, v, goal]) => `<div class="bg${v >= goal ? ' on' : ''}" title="${esc(n)}"><i>${ic}</i><span>${esc(n)}</span>${v >= goal ? '' : `<small>${Math.min(v, goal).toLocaleString('en-IN')} / ${goal.toLocaleString('en-IN')}</small>`}</div>`).join('')}</div></div>
    </div>`;
  }
  /* this week (Monday to today) against last week: answers, accuracy, study days, mocks; the weakest topics of the week
     (from the last answer to each question practised this week) and the revisions coming up */
  function weekHtml() {
    const d0 = new Date(); d0.setHours(12, 0, 0, 0); const mon = new Date(d0); mon.setDate(d0.getDate() - (d0.getDay() + 6) % 7);
    const sumDays = (from, n) => { let a = 0, r = 0, days = 0; for (let i = 0; i < n; i++) { const d = new Date(from); d.setDate(from.getDate() + i); const v = P.days[dayOf(d)]; if (v && v[0]) { a += v[0]; r += v[1]; days++; } } return { a, r, days }; };
    const nThis = (d0 - mon) / 864e5 + 1, lastMon = new Date(mon); lastMon.setDate(mon.getDate() - 7);
    const W = sumDays(mon, nThis), L = sumDays(lastMon, 7), t0 = Math.round(mon.setHours(0, 0, 0, 0) / 60000);
    const mk = P.mocks.filter(m => m.ts / 60000 >= t0), byT = {};
    for (const m of [P.q, P.f]) for (const id in m) { const e = m[id], t = topicOf(id); if (!t || e[3] < t0) continue; const b = byT[t] || (byT[t] = [0, 0]); b[0]++; if (e[2]) b[1]++; }
    const weak = Object.entries(byT).filter(([, b]) => b[0] >= 3).sort((x, y) => x[1][1] / x[1][0] - y[1][1] / y[1][0]).slice(0, 3);
    const nextWeek = dueList(dayStart() + 8 * 1440).length - dueList().length;
    const cmp = (a, b, unit = '') => b ? `<small class="${a >= b ? 'up' : 'dn'}">${a >= b ? '▲' : '▼'} ${Math.abs(a - b)}${unit} vs last week</small>` : '<small>last week: none</small>';
    return `<section class="panel"><h2>🗓 This week <small>Monday to today, against last week</small></h2>
      <div class="kpis"><div class="kpi"><b>${W.a}</b><span>answers</span>${cmp(W.a, L.a)}</div><div class="kpi"><b>${W.a ? pct(W.r, W.a) + ' %' : '–'}</b><span>correct</span>${W.a && L.a ? cmp(pct(W.r, W.a), pct(L.r, L.a), ' pts') : ''}</div>
        <div class="kpi"><b>${W.days} / ${nThis}</b><span>days studied</span>${cmp(W.days, L.days)}</div><div class="kpi"><b>${mk.length}</b><span>mock tests${mk.length ? ` · best ${Math.max(...mk.map(m => m.pc))} %` : ''}</span></div>
        <div class="kpi"><b>${nextWeek}</b><span>revisions due in the next 7 days</span></div></div>
      ${weak.length ? `<p>Weakest this week: ${weak.map(([t, b]) => T(t) ? `<a href="#t-${t}-prac">${esc(short(T(t)))}</a> (${b[1]}/${b[0]} right last time)` : '').join(' · ')}</p>` : '<p class="pg">Answer 3 or more questions in a topic this week and the weakest show here.</p>'}</section>`;
  }
  // the questions whose last answer fell on that day, by topic, with the wrong ones ready to revise
  function dayDetail(el) {
    const k = el.dataset.day, box = el.closest('.dt').querySelector('.dday'); if (!box) return;
    const by = {}, wrong = [];
    for (const m of [P.q, P.f]) for (const id in m) { const e = m[id]; if (dayOf(e[3] * 60000) !== k) continue; const t = topicOf(id) || (id[0] === 'z' ? 'pred' : '—'); const b = by[t] || (by[t] = [0, 0]); b[0]++; if (e[2]) b[1]++; else if (SRK.test(id)) wrong.push(id); }
    const L = Object.entries(by).sort((x, y) => (x[1][1] / x[1][0]) - (y[1][1] / y[1][0]));
    box.hidden = !L.length;
    box.innerHTML = L.length ? `<b>${fmtDay(k)} — questions answered (last answers)</b><div class="srcs">${L.map(([t, [a, r]]) => `<span class="${r / a < 0.7 ? 'bad' : r / a >= 0.85 ? 'good' : ''}">${t === 'pred' ? 'Predicted papers' : T(t) ? esc(short(T(t))) : 'Other'} ${r}/${a}</span>`).join('')}</div>${wrong.length ? `<div class="acts"><button class="btn go" data-revday="${wrong.slice(0, 40).join(',')}" data-k="${k}">↻ Revise the ${Math.min(40, wrong.length)} you got wrong</button></div>` : ''}` : '';
  }
  function dayRead(el) {
    const k = el.dataset.day, a = +el.dataset.a, r = +el.dataset.r, du = +(el.dataset.due || 0);
    const out = el.closest('.dt').querySelector('.dread') || $('.dread', main); if (!out) return;
    out.textContent = `${fmtDay(k)}: ${a ? `${a} answer${a === 1 ? '' : 's'} · ${pct(r, a)} % correct` : k > todayKey() ? (du ? `${du} revision${du === 1 ? '' : 's'} due` : 'nothing due yet') : 'no answers'}`;
  }
  /* ---------- progress backup: a JSON file kept by the reader; restoring combines it with what is here ---------- */
  function exportProgress() {
    const data = JSON.stringify({ app: 'tneb-ae-study', v: 1, saved: new Date().toISOString(), progress: P });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = `tneb-ae-progress-${todayKey()}.json`; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    $('#bkst').textContent = `✓ Saved ${a.download} (${Math.ceil(data.length / 1024)} KB) to your downloads.`;
  }
  const ID = /^([a-z]\d+\.[A-Za-z0-9.]+|z(gate|tneb)\.\d+)$/;
  const num = x => typeof x === 'number' && Number.isFinite(x) ? x : 0;
  const rec4 = e => Array.isArray(e) && e.length === 4 && e.every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0) ? [Math.round(e[0]), Math.round(e[1]), e[2] ? 1 : 0, Math.round(e[3])] : null;
  async function importProgress(file) {
    const st = $('#bkst');
    try {
      if (file.size > 5e6) throw new Error('this file is too large to be a progress backup');
      const o = JSON.parse(await file.text()), B = o && o.app === 'tneb-ae-study' && o.progress;
      if (!B || typeof B !== 'object') throw new Error('this is not a TNEB AE study-site backup');
      let nq = 0;
      for (const k of ['q', 'f']) for (const [id, e] of Object.entries(B[k] || {})) {
        const r = rec4(e); if (!r || !ID.test(id) || isF(id) !== (k === 'f')) continue;
        const m = P[k], cur = m[id]; if (!cur || r[0] > cur[0] || (r[0] === cur[0] && r[3] > cur[3])) { m[id] = r; nq++; const lv = (B.sr || {})[id]; if (Number.isInteger(lv) && lv >= 0 && lv <= 6) P.sr[id] = lv; else delete P.sr[id]; }
      }
      for (const [t, v] of Object.entries(B.seen || {})) if (/^(\d+|gen)$/.test(t) && Number.isFinite(v)) P.seen[t] = Math.max(P.seen[t] || 0, v);
      for (const [k, v] of Object.entries(B.star || {})) if (STARKEY.test(k) && Number.isFinite(v)) P.star[k] = P.star[k] || v;
      for (const [k, v] of Object.entries(B.days || {})) if (/^\d{4}-\d\d-\d\d$/.test(k) && Array.isArray(v)) { const a = Math.round(num(v[0])), r = Math.round(num(v[1])), c = P.days[k] || [0, 0]; if (a > c[0]) P.days[k] = [a, Math.min(r, a)]; }
      const BL = B.lab && typeof B.lab === 'object' ? B.lab : {}, LID = /^[a-z0-9-]{2,24}$/;
      for (const [id, r] of Object.entries(BL.x || {})) if (LID.test(id) && r && typeof r === 'object') { const c = P.lab.x[id]; if (!c || num(r.t) > num(c.t)) P.lab.x[id] = { s: num(r.s), l: num(r.l), t: num(r.t), p: num(r.p), done: num(r.done), cu: r.cu ? 1 : 0, ...(typeof r.qd === 'string' && /^\d{4}-\d\d-\d\d$/.test(r.qd) ? { qd: r.qd } : {}), q: Array.isArray(r.q) ? [num(r.q[0]), num(r.q[1])] : [0, 0], k: Object.fromEntries(['c', 'g', 'u', 'x'].filter(k => r.k && r.k[k]).map(k => [k, 1])), pk: Array.isArray(r.pk) ? r.pk.filter(k => typeof k === 'string' && k.length < 20).slice(0, 40) : [], m: Object.fromEntries(Object.entries(r.m && typeof r.m === 'object' ? r.m : {}).filter(([k, m]) => k.length < 40 && Array.isArray(m)).slice(0, 50).map(([k, m]) => [k, [num(m[0]), String(m[1] || '').slice(0, 120)]])) }; }
      for (const [k, sec] of Object.entries(BL.d || {})) if (/^\d{4}-\d\d-\d\d$/.test(k)) P.lab.d[k] = Math.max(P.lab.d[k] || 0, num(sec));
      for (const [k, v] of Object.entries(BL.f || {})) if (LID.test(k)) P.lab.f[k] = P.lab.f[k] || num(v) || 1;
      const seenTs = new Set(P.mocks.map(m => m.ts));
      for (const m of Array.isArray(B.mocks) ? B.mocks : []) {
        if (!m || !Number.isFinite(m.ts) || seenTs.has(m.ts)) continue;
        const by = {}; for (const [t, v] of Object.entries(m.by || {})) if (/^\d+$/.test(t) && Array.isArray(v)) by[t] = [Math.round(num(v[0])), Math.round(num(v[1]))];
        P.mocks.push({ ts: m.ts, n: num(m.n), r: num(m.r), w: num(m.w), score: num(m.score), pc: num(m.pc), secs: num(m.secs), neg: !!m.neg, by });
      }
      P.mocks.sort((a, b) => b.ts - a.ts); P.mocks.length = Math.min(P.mocks.length, 30);
      changed(); toast(`✓ Restored — ${nq} question records taken from the file.`);
      viewConsole(RT, true);
    } catch (err) { st.textContent = `Could not restore: ${err.message}.`; }
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
      <p>Questions come from your Question Book (${nU} single-answer past questions from GATE, TNPSC, ESE, APGENCO and TANGEDCO, plus GATE's multiple-select and numerical-answer questions if you choose them — all exactly as printed, with full solutions in the result) and the Complete Book's own MCQs (${QA.filter(x => x.r != null).length}), plus, if you like, missing-letter questions on the book's formulas. Every answer goes into your progress console, and the result shows your weak topics.</p>
      <div class="mkpre"><b>Exam style</b><div class="seg" id="mkpre"><button type="button" data-pre="gate" aria-pressed="false">🎓 GATE EE</button><button type="button" data-pre="tneb" aria-pressed="false">⚡ TANGEDCO AE</button><button type="button" data-pre="tnpsc" aria-pressed="false">🏛 TNPSC</button><button type="button" data-pre="" aria-pressed="true">⚙ Custom</button></div>
        <p class="pg" id="mkprei">A style only fills in the settings below — change any of them before you start. GATE questions carry their printed marks (1 or 2), every other question 1 mark. With negative marking, a wrong MCQ loses ⅓ of its marks (−⅓ or −⅔); MSQ and NAT never lose marks — as in GATE.</p></div>
      <form class="mkset" id="mkf">
        <fieldset><legend>Which topics</legend>
          <label class="r"><input type="radio" name="sc" value="all" checked> All topics</label>
          <label class="r"><input type="radio" name="sc" value="weak"><span class="lt">My weak and untried topics (from the console's Study next)</span></label>
          <label class="r"><input type="radio" name="sc" value="subj"> One subject <select id="mks">${IX.S.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select></label>
          <label class="r"><input type="radio" name="sc" value="pick"> Choose topics</label>
          <div class="picks" id="mkp" hidden>${IX.S.map(([k, n]) => `<b>${esc(n)}</b>` + g[k].map(t => `<label><input type="checkbox" value="${t.id}">${esc(short(t))} <span class="pg">${avail(t.id)} MCQs</span></label>`).join('')).join('')}</div></fieldset>
        <fieldset><legend>Paper</legend><div class="mkrow">
          <label>Questions <select id="mkn"><option>10</option><option selected>25</option><option>50</option><option>65</option><option>100</option></select></label>
          <label>Time per question <select id="mkt"><option value="36">36 s</option><option value="60" selected>1 min</option><option value="72">1.2 min</option><option value="90">1.5 min</option><option value="166">2.8 min (3 h for 65)</option></select></label>
          <label>Marking <select id="mkm"><option value="1">Negative: a wrong MCQ loses ⅓ of its marks (GATE, TNEB, ESE)</option><option value="0" selected>No negative marking (TNPSC)</option></select></label>
          <label>Formula questions <select id="mkl"><option value="0.2" selected>About 1 in 5 missing-letter</option><option value="0">None — MCQs only</option><option value="0.5">About half</option></select></label></div>
          <div class="mkrow"><label>Questions from <select id="mksrc"><option value="all" selected>Question Book + book MCQs</option><option value="u">Question Book only (real past papers)</option><option value="b">Complete Book MCQs only</option></select></label>
          <label>Question types <select id="mkty"><option value="mcq" selected>Single-answer MCQs</option><option value="all">MCQ + multiple-select (MSQ) + numerical (NAT)</option></select></label>
          <label>Exam <select id="mkex"><option value="">Every exam</option><option value="GATE">GATE EE</option><option value="TNPSC">TNPSC Code 400</option><option value="ESE">UPSC ESE</option><option value="APGENCO">APGENCO AE</option><option value="TANGEDCO">TANGEDCO AE</option></select></label></div></fieldset>
        <div class="acts"><button class="btn go" type="submit">Start the timer</button><span class="pg" id="mkinfo"></span></div></form></section></div>`;
    const f = $('#mkf'), picks = $('#mkp');
    f.onchange = () => { picks.hidden = f.sc.value !== 'pick'; };
    // exam styles: they only fill in the form
    const PRE = { gate: ['all', 65, 166, '1', '0', 'u', 'GATE', 'all', 'GATE EE style: 65 real GATE EE past questions — MCQ, MSQ and NAT, each with its printed 1 or 2 marks — 3 hours. A wrong MCQ loses ⅓ of its marks (−⅓ on 1-mark, −⅔ on 2-mark); MSQ and NAT have no negative marks.'],
      tneb: ['all', 100, 72, '1', '0.2', 'all', '', 'mcq', 'TANGEDCO AE style: 100 single-answer questions from every topic, 1 mark each, 2 hours, −⅓ per wrong answer (as the book’s TNEB / TANGEDCO 2027 predicted paper is set).'],
      tnpsc: ['all', 100, 72, '0', '0', 'u', 'TNPSC', 'mcq', 'TNPSC style: 100 of your real TNPSC past questions, 1 mark each, 1.2 min each, no negative marking.'] };
    $('#mkpre').onclick = e => { const b = e.target.closest('[data-pre]'); if (!b) return; $$('#mkpre [data-pre]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const p = PRE[b.dataset.pre]; if (!p) { $('#mkprei').textContent = 'Custom: choose the topics, length, time and marking yourself.'; return; }
      f.sc.value = p[0]; $('#mkn').value = String(p[1]); $('#mkt').value = String(p[2]); $('#mkm').value = p[3]; $('#mkl').value = p[4]; $('#mksrc').value = p[5]; $('#mkex').value = p[6]; $('#mkty').value = p[7]; picks.hidden = true; $('#mkprei').textContent = p[8]; };
    f.onsubmit = e => {
      e.preventDefault();
      const sc = f.sc.value; let ids;
      if (sc === 'all') ids = IX.T.map(t => t.id);
      else if (sc === 'subj') ids = IX.T.filter(t => t.s === $('#mks').value).map(t => t.id);
      else if (sc === 'pick') ids = $$('input:checked', picks).map(x => x.value);
      else { const by = stats().by; ids = IX.T.filter(t => !by[t.id] || by[t.id].a < 3 || pct(by[t.id].r, by[t.id].a) < 70).sort((x, y) => (PRW[y.pr] || 1) - (PRW[x.pr] || 1)).slice(0, 12).map(t => t.id); }
      if (!ids.length) { $('#mkinfo').textContent = 'Choose at least one topic.'; return; }
      mockStart(ids, +$('#mkn').value, +$('#mkt').value, $('#mkm').value === '1', +$('#mkl').value, $('#mksrc').value, $('#mkex').value, $('#mkty').value);
    };
    toTop();
  }
  /* marks and marking, as in GATE: every GATE question carries its printed marks (1 or 2), any other question 1 mark.
     With negative marking a wrong MCQ loses a third of its marks; MSQ and NAT never lose marks; no partial marks for MSQ. */
  const marksOf = x => +(String(x.src || '').match(/(\d) marks?\b/) || [0, 1])[1];
  const blankOf = q => q.ty === 'msq' ? [] : q.ty === 'nat' ? '' : -1;
  const isAns = (q, a) => q.ty === 'msq' ? a.length > 0 : q.ty === 'nat' ? String(a).trim() !== '' : a >= 0;
  const judge = (q, a) => !isAns(q, a) ? false : q.ty === 'msq' ? a.length === q.rs.length && a.every(j => q.rs.includes(j)) : q.ty === 'nat' ? Number.isFinite(numIn(a)) && natOk(q.ok, numIn(a)) : isRight(q, a);
  const penalty = (q, a, neg) => neg && q.ty === 'mcq' && isAns(q, a) && !judge(q, a) ? q.mk / 3 : 0;
  function mockStart(ids, n, per, neg, mlShare, from = 'all', exam = '', types = 'mcq') {
    const set = new Set(ids), okTy = types === 'all' ? /^(mcq|msq|nat)$/ : /^mcq$/;
    // round-robin over the chosen topics so the paper is spread across them
    const byT = {};
    if (from !== 'b') UA.filter(x => set.has(x.t) && okTy.test(x.ty) && (!exam || x.ex === exam)).forEach(x => (byT[x.t] ||= []).push({ ...uItem(x), ty: x.ty, mk: marksOf(x) }));
    if (from !== 'u' && !exam) QA.filter(x => set.has(x.t) && x.r != null).forEach(x => (byT[x.t] ||= []).push({ ...mcqQ(x), ty: 'mcq', mk: 1 }));
    Object.values(byT).forEach(shuffle);
    const nML = exam || from === 'u' ? 0 : Math.round(n * mlShare), mcqs = [], order = shuffle(Object.keys(byT));
    for (let k = 0; mcqs.length < n - nML && order.length; k++) { const t = order[k % order.length], L = byT[t]; if (L.length) mcqs.push(L.pop()); if (!order.some(o => byT[o].length)) break; }
    const fl = shuffle(mlItems(FA.filter(f => set.has(f.t)))), seen = new Set(), mls = [];
    for (const it of fl) { if (mcqs.length + mls.length >= n) break; if (!seen.has(it.id)) { seen.add(it.id); mls.push({ ...mlQuestion(it), ty: 'mcq', mk: 1 }); } }
    // the paper in subject order, so the palette's subject tabs read as sections
    const SO = IX.S.map(x => x[0]), subjOf = q => (T(q.t) || {}).s;
    const qs = shuffle([...mcqs, ...mls]).sort((a, b) => SO.indexOf(subjOf(a)) - SO.indexOf(subjOf(b)));
    if (!qs.length) { toast('No questions for these topics yet.'); return; }
    qs.forEach(q => { const k = subjOf(q); q.sec = k ? IX.S.find(x => x[0] === k)[1] : 'Other'; });
    M = { qs, ans: qs.map(blankOf), flag: qs.map(() => false), vis: qs.map(() => false), tq: qs.map(() => 0), tab: '', i: 0, end: Date.now() + qs.length * per * 1000, total: qs.length * per, neg, t0: Date.now() };
    showMock(); startTick();
  }
  const startTick = () => { clearInterval(tick); tick = setInterval(() => { if (!M) return clearInterval(tick); const left = Math.round((M.end - Date.now()) / 1000); paintClock(left); if (left <= 0) mockSubmit(); }, 1000); };
  const hms = s => { s = Math.max(0, s); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60]; };
  const paintClock = left => { const el = $('.mk-clock'); if (!el) return; hms(left).forEach((v, k) => { el.children[k].firstChild.textContent = String(v).padStart(2, '0'); }); el.classList.toggle('low', left <= 60); };
  // a question's state in the palette (the exam-hall colours)
  const mkState = i => isAns(M.qs[i], M.ans[i]) ? (M.flag[i] ? 'am' : 'an') : M.flag[i] ? 'mr' : M.vis[i] ? 'na' : 'nv';
  const MKS = [['an', 'Answered'], ['na', 'Not answered'], ['nv', 'Not visited'], ['mr', 'Marked for review'], ['am', 'Answered & marked']];
  function showMock() {
    if (location.hash !== '#mock') { try { history.replaceState(null, '', '#mock'); } catch (e) {} setShell('mock'); }
    M.vis[M.i] = true;
    const tn = Date.now(); if (M.on != null) M.tq[M.on] += tn - M.ts; M.on = M.i; M.ts = tn;     // time spent on each question
    const q = M.qs[M.i], left = Math.round((M.end - Date.now()) / 1000), secs = [...new Set(M.qs.map(x => x.sec || ''))].filter(Boolean);
    const cnt = Object.fromEntries(MKS.map(([k]) => [k, 0])); M.qs.forEach((_, i) => cnt[mkState(i)]++);
    const [h, m, sx] = hms(left), last = M.i + 1 >= M.qs.length;
    main.innerHTML = `<div class="mk-top"><b>${esc(M.title || 'Mock test')}</b><div class="mk-clock${left <= 60 ? ' low' : ''}" role="timer" aria-label="Time remaining"><span><b>${String(h).padStart(2, '0')}</b><small>Hours</small></span><span><b>${String(m).padStart(2, '0')}</b><small>Minutes</small></span><span><b>${String(sx).padStart(2, '0')}</b><small>Seconds</small></span></div><button class="btn go" data-m="submit">Submit</button></div>
      <div class="mk-wrap"><div class="mk-q"><div class="box qcard"><div class="mk-qh"><b>Question ${M.i + 1}</b><span class="qs">${esc(q.sec ? q.sec + ' · ' : '')}${esc(q.src || '')}</span><button class="btn mk-mark${M.flag[M.i] ? ' on' : ''}" data-m="flag" aria-pressed="${M.flag[M.i]}">${M.flag[M.i] ? '🔖 Marked for review' : '🔖 Mark for review'}</button></div>
        <div class="mk-mt"><span class="mkchip">${q.mk} mark${q.mk > 1 ? 's' : ''} · ${q.ty === 'msq' ? 'MSQ' : q.ty === 'nat' ? 'NAT' : 'MCQ'}</span>${q.ty === 'msq' ? '<span class="mknote">Select every correct option — no negative marks, no part marks</span>' : q.ty === 'nat' ? '<span class="mknote">Type the number — no negative marks</span>' : M.neg ? `<span class="mknote">Wrong answer: −${q.mk === 2 ? '⅔' : '⅓'} mark</span>` : ''}</div>
        <div class="qq">${q.q}</div>
        ${q.ty === 'nat' ? `<div class="mk-nat"><input class="unum" data-mn type="text" inputmode="decimal" autocomplete="off" placeholder="Your answer" aria-label="Your numerical answer" value="${esc(M.ans[M.i])}"></div>` : optsHtml(q, 'data-mi', M.ans[M.i])}
        <div class="acts mk-nav"><button class="btn" data-m="prev" ${M.i ? '' : 'disabled'}>← Previous</button>${isAns(q, M.ans[M.i]) ? '<button class="btn" data-m="clear">Clear answer</button>' : ''}<button class="btn" data-m="markn">Mark & next</button><button class="btn go" data-m="next">${last ? 'Save' : 'Save & next →'}</button></div></div></div>
      <aside class="mk-side" aria-label="Question palette"><h3>Question palette <small>${M.qs.filter((x, i) => isAns(x, M.ans[i])).length} of ${M.qs.length} answered · ${M.qs.reduce((a, x) => a + x.mk, 0)} marks</small></h3>
        ${secs.length > 1 ? `<div class="seg mk-tabs"><button data-tab="" aria-pressed="${!M.tab}">All</button>${secs.map(x => `<button data-tab="${esc(x)}" aria-pressed="${M.tab === x}">${esc(x)}</button>`).join('')}</div>` : ''}
        <div class="mk-pal">${M.qs.map((x, i) => !M.tab || x.sec === M.tab ? `<button data-go="${i}" class="s-${mkState(i)}${i === M.i ? ' cur' : ''}" aria-label="Question ${i + 1}: ${MKS.find(k => k[0] === mkState(i))[1]}">${i + 1}</button>` : '').join('')}</div>
        <div class="mk-leg">${MKS.map(([k, n]) => `<span><i class="s-${k}">${cnt[k]}</i>${n}</span>`).join('')}</div></aside></div>`;
    lazy();
    main.onclick = e => {
      if (!M) return;
      const t = e.target, m = t.closest('[data-m]') && t.closest('[data-m]').dataset.m;
      const mo = t.closest('[data-mi]'); if (mo) { const i = +mo.dataset.mi, a = M.ans[M.i]; M.ans[M.i] = q.ty === 'msq' ? (a.includes(i) ? a.filter(j => j !== i) : [...a, i].sort()) : a === i ? -1 : i; showMock(); return; }
      const go = t.closest('[data-go]'); if (go) { M.i = +go.dataset.go; showMock(); return; }
      const tb = t.closest('[data-tab]'); if (tb) { M.tab = tb.dataset.tab; const j = M.qs.findIndex(x => x.sec === M.tab); if (M.tab && j >= 0 && M.qs[M.i].sec !== M.tab) M.i = j; showMock(); return; }
      if (m === 'prev' && M.i) { M.i--; showMock(); }
      else if (m === 'next') { if (M.i + 1 < M.qs.length) M.i++; else toast('That was the last question — check the palette, then Submit.'); showMock(); }
      else if (m === 'markn') { M.flag[M.i] = true; if (M.i + 1 < M.qs.length) M.i++; showMock(); }
      else if (m === 'flag') { M.flag[M.i] = !M.flag[M.i]; showMock(); }
      else if (m === 'clear') { M.ans[M.i] = blankOf(q); showMock(); }
      else if (m === 'submit') { const blank = M.qs.filter((x, i) => !isAns(x, M.ans[i])).length, mk = M.flag.filter(Boolean).length; if (!blank && !mk) mockSubmit(); else t.closest('[data-m]').outerHTML = `<span class="confirm">${blank ? `${blank} not answered` : ''}${blank && mk ? ', ' : ''}${mk ? `${mk} marked for review` : ''}. <button class="btn go" data-m="submit2">Submit anyway</button> <button class="btn" data-m="back">Keep going</button></span>`; }
      else if (m === 'submit2') mockSubmit();
      else if (m === 'back') showMock();
    };
    // a numerical answer is kept as it is typed (the palette follows without redrawing the page)
    main.oninput = e => { if (!M || !e.target.matches('[data-mn]')) return; M.ans[M.i] = e.target.value; const b = $(`.mk-pal [data-go="${M.i}"]`); if (b) b.className = `s-${mkState(M.i)} cur`; };
    main.onkeydown = e => { if (M && e.key === 'Enter' && e.target.matches('[data-mn]')) { e.preventDefault(); $('[data-m="next"]', main).click(); } };
  }
  function mockSubmit() {
    if (!M) return; clearInterval(tick);
    const X = M; M = null; if (X.on != null) X.tq[X.on] += Date.now() - X.ts;
    if (location.hash !== '#mock') { try { history.replaceState(null, '', '#mock'); } catch (e) {} setShell('mock'); toast('Time is up — your mock test was submitted.'); }
    X.qs.forEach(q => { q.ty ||= 'mcq'; q.mk ||= 1; });
    const ok = X.qs.map((q, i) => judge(q, X.ans[i])), att = X.qs.map((q, i) => isAns(q, X.ans[i])), r = ok.filter(Boolean).length, w = att.filter((a, i) => a && !ok[i]).length, n = X.qs.length;
    const tot = X.qs.reduce((a, q) => a + q.mk, 0), got = X.qs.reduce((a, q, i) => a + (ok[i] ? q.mk : 0), 0), lost = X.qs.reduce((a, q, i) => a + penalty(q, X.ans[i], X.neg), 0);
    const r2 = x => Math.round(x * 100) / 100, score = r2(got - lost), secs = Math.min(X.total, Math.round((Date.now() - X.t0) / 1000));
    const split = key => { const g = {}; X.qs.forEach((q, i) => { const k = key(q), b = g[k] || (g[k] = [0, 0]); b[0]++; if (ok[i]) b[1]++; }); return Object.entries(g); };
    const ansTxt = (q, a) => !isAns(q, a) ? 'none' : q.ty === 'nat' ? esc(a) : q.ty === 'msq' ? a.map(j => esc(q.opts[j].l || 'ABCD'[j])).join(', ') : esc(q.opts[a].l || 'ABCD'[a]) + (q.opts[a].h ? ' — ' + q.opts[a].h : '');
    const rightTxt = q => q.ty === 'nat' ? esc(q.ans) : q.ty === 'msq' ? q.rs.map(j => esc(q.opts[j].l || 'ABCD'[j])).join(', ') : esc(q.opts[q.r].l || 'ABCD'[q.r]) + (q.opts[q.r].h ? ' — ' + q.opts[q.r].h : '');
    const by = {};
    X.qs.forEach((q, i) => { const b = by[q.t] || (by[q.t] = [0, 0]); b[0]++; if (ok[i]) b[1]++; });
    // every question is recorded (a blank counts as not known)
    X.qs.forEach((q, i) => { const m = isF(q.id) ? P.f : P.q; srStep(q.id, m[q.id], ok[i]); const e = m[q.id] || (m[q.id] = [0, 0, 0, 0]); e[0]++; if (ok[i]) e[1]++; e[2] = ok[i] ? 1 : 0; e[3] = now(); if (q.t) P.seen[q.t] = now(); logDay(ok[i]); });
    P.mocks.unshift({ ts: Date.now(), n, r, w, score, tot, pc: Math.round(Math.max(0, score) / tot * 100), secs, neg: X.neg, by }); P.mocks.length = Math.min(P.mocks.length, 30); changed();
    const rowsT = Object.entries(by).map(([tid, [a, rr]]) => ({ t: T(tid), a, r: rr })).filter(x => x.t).sort((x, y) => x.r / x.a - y.r / y.a);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Mock test result</div><div class="con">
      <section class="panel"><h2>Mock test result</h2><div class="kpis">${[[`${score} / ${tot}`, 'marks' + (X.neg ? ' (after negative marks)' : '')], [Math.round(Math.max(0, score) / tot * 100) + ' %', 'percent'], [r, 'right'], [w, 'wrong'], [n - r - w, 'not attempted'], [lost ? `−${r2(lost)}` : '0', 'negative marks'], [r + w ? pct(r, r + w) + ' %' : '–', 'accuracy (of attempted)'], [`${Math.floor(secs / 60)} min ${secs % 60} s`, 'time used'], [`${Math.round(X.tq.reduce((a, b) => a + b, 0) / 1000 / Math.max(1, X.tq.filter(Boolean).length))} s`, 'average per question seen']].map(([b, s]) => `<div class="kpi"><b>${b}</b><span>${s}</span></div>`).join('')}</div>
        ${X.tq.some(Boolean) ? `<p class="pg">Slowest: ${X.tq.map((t, i) => [t, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(([t, i]) => `Q${i + 1} (${Math.round(t / 1000)} s, ${ok[i] ? 'right' : !att[i] ? 'not answered' : 'wrong'})`).join(' · ')}</p>` : ''}
        <div class="srcs">${split(q => q.ty.toUpperCase()).map(([k, [a, b]]) => `<span>${k}: ${b}/${a} right</span>`).join('')}${split(q => q.mk + '-mark').length > 1 ? split(q => q.mk + '-mark').map(([k, [a, b]]) => `<span>${k}: ${b}/${a}</span>`).join('') : ''}</div>
        <div class="acts"><a class="btn go" href="#progress">📊 See it in my progress console</a><button class="btn" data-r="again">Another mock test</button></div></section>
      <section class="panel"><h2>By topic <small>weakest first — this is where to improve</small></h2><table class="ttab"><thead><tr><th>Topic</th><th>Right</th><th></th></tr></thead><tbody>${rowsT.map(x => `<tr><td data-l="Topic"><a href="#t-${x.t.id}">${esc(x.t.t)}</a></td><td class="num" data-l="Right"><span class="bar" style="--col:${tone(pct(x.r, x.a))[2]}"><i style="width:${Math.max(3, pct(x.r, x.a))}%"></i></span>${x.r}/${x.a}</td><td><span class="acts"><a class="btn" href="#t-${x.t.id}">Study</a><button class="btn go" data-r="prac" data-t="${x.t.id}">Practise</button></span></td></tr>`).join('')}</tbody></table></section>
      <section class="panel"><h2>Every question, with the answer</h2>${X.qs.map((q, i) => `<details class="rv"><summary><b class="${ok[i] ? 'up' : 'dn'}">${ok[i] ? '✓' : !att[i] ? '–' : '✗'} Q${i + 1}</b><span>${esc(q.ml ? 'Missing letter — ' + q.nm : plain(q.q).slice(0, 120))}</span></summary><div><div class="qs pg">${esc(q.src)}</div><div class="qq">${q.q}</div>
        <p>Your answer: <b>${ansTxt(q, X.ans[i])}</b> · Right answer: <b>${rightTxt(q)}</b> <span class="pg">· ${q.mk} mark${q.mk > 1 ? 's' : ''}${ok[i] ? ` · +${q.mk}` : penalty(q, X.ans[i], X.neg) ? ` · −${r2(penalty(q, X.ans[i], X.neg))}` : ''}</span></p><div class="expl">${q.ex}</div></div></details>`).join('')}</section></div>`;
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
  const readPage = (g, e, rh) => `<figure class="box refpg" id="rp${e[0]}"><figcaption>${starBtn(`ref/${g.id}/${e[0]}`, 'page')}<span class="pgt">${volOf(g)} · p ${e[0]}</span><button class="btn lnk" data-pp aria-pressed="false">🖼 As printed</button></figcaption>
    ${rh ? `<div class="rp">${rh[0].replace(/<i data-k="(\d+)"><\/i>/g, (_, k) => partImg(rh[1][k], `${g.n}, p ${e[0]}, picture ${+k + 1}`))}</div><div class="pp" hidden>${pgImg(e, `${g.n}, book page ${e[0]}`)}</div>` : pgImg(e, `${g.n}, book page ${e[0]}`)}</figure>`;
  // a Tamil page: the text version or the printed page; text size remembered on this device
  const TSZ = [0.85, 0.92, 1, 1.1, 1.2, 1.32, 1.45]; let tsz = 2; try { const r = localStorage.getItem('ae-tsz'), x = r == null ? NaN : +r; if (Number.isInteger(x) && x >= 0 && x < TSZ.length) tsz = x; } catch (e) {}
  const paintTsz = () => document.documentElement.style.setProperty('--tsz', TSZ[tsz]); paintTsz();
  document.addEventListener('click', e => { const b = e.target.closest('[data-tsz]'); if (!b) return; tsz = Math.max(0, Math.min(TSZ.length - 1, tsz + +b.dataset.tsz)); paintTsz(); try { localStorage.setItem('ae-tsz', tsz); } catch (er) {} toast(`Text size ${Math.round(TSZ[tsz] * 100)} %`); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-tp]'); if (!b) return; const d = b.closest('details'), tx = $('.tpr', d), pp = $('.pages', d); if (!tx || !pp) return;
    const on = pp.hidden; pp.hidden = !on; tx.hidden = on; b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '📖 Readable' : '🖼 As printed'; if (on) lazy(d); });
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
      <div class="acts"><a class="btn go" href="#ref-which">🧭 Which look-up do I open?</a><a class="btn" href="#cards">🖼 Visual cards</a><a class="btn" href="#pe">⚡ Power electronics atlas</a><a class="btn" href="#ref-sym">🔤 Symbols A–Z</a><a class="btn" href="#ref-az">📒 A–Z formula table</a></div></section>
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
      ${RH && RH.tree ? `<div class="pages refpages" style="--c:${shc(g.id)}">${g.p.filter(e => e[0] < 7).map(e => readPage(g, e, RH[e[0]])).join('')}</div>${solveTree(RH.tree)}
        <details class="stprint"><summary>The printed tree pages (p 7–22), as set for reading</summary><div class="pages refpages" style="--c:${shc(g.id)}">${g.p.filter(e => e[0] >= 7 && e[0] <= 22).map(e => readPage(g, e, RH[e[0]])).join('')}</div></details>
        <div class="pages refpages" style="--c:${shc(g.id)}">${g.p.filter(e => e[0] > 22).map(e => readPage(g, e, RH[e[0]])).join('')}</div>`
        : `<div class="pages refpages" style="--c:${shc(g.id)}">${g.p.map(e => readPage(g, e, RH && RH[e[0]])).join('')}</div>`}
      <div class="pn">${prev ? `<a href="#ref-${prev.id}"><small>← Previous shelf</small><b>${esc(prev.n)}</b></a>` : '<a href="#ref"><small>←</small><b>Look-up shelf</b></a>'}${nxt ? `<a href="#ref-${nxt.id}"><small>Next shelf →</small><b>${esc(nxt.n)}</b></a>` : ''}</div>`;
    lazy(); if (RH && RH.tree) wireTree();
    const el = page && document.getElementById('rp' + page);
    if (el) { requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
      // text above the page can still reflow while web fonts load: settle once more unless the reader has scrolled
      let y0; setTimeout(() => { if (el.isConnected) { el.scrollIntoView({ block: 'start' }); y0 = scrollY; } }, 350);
      setTimeout(() => { if (el.isConnected && scrollY === y0) el.scrollIntoView({ block: 'start' }); }, 1200); } else toTop();
  }
  /* ---------- "How to solve any sum": the four trees as one outline (data: refh/flow.json "tree", from flow_tree.py) ----------
     tree → branch → sub-topic; each sub-topic opens into a step flow: the book's clauses one under another, and inside a
     clause every "→" drawn as an arrow between boxes. Words exactly as printed. */
  const TREEC = ['#4f46e5', '#0e7490', '#c2410c', '#15803d', '#be185d', '#7c3aed', '#b45309', '#1d4ed8', '#0f766e', '#a21caf', '#9a3412', '#4d7c0f', '#b91c1c', '#0369a1'];
  const TREET = { D: '#4f46e5', E: '#0e7490', F: '#b45309', G: '#be185d' };
  function stepHtml(c) {
    const lab = c.match(/^([^:=→<]{1,34}):\s+([\s\S]*)$/);   // "Lagrange: f′(c) = …" → a label, then the step
    const body = lab ? lab[2] : c, parts = body.split(/\s*→\s*/).filter(x => x.trim() !== '');
    return `<li class="stp">${lab ? `<span class="stl">${lab[1]}</span>` : ''}${parts.length > 1 ? `<span class="stch">${parts.map((x, k) => `<span class="stn${k === parts.length - 1 ? ' end' : ''}">${x}</span>`).join('<i class="sta" aria-label="leads to">→</i>')}</span>` : `<span class="stn solo">${body}</span>`}</li>`;
  }
  function solveTree(T) {
    let bi = 0;
    const leaf = (l, col) => `<details class="stl0" data-s="${esc(l.n + ' ' + plain(l.c.join(' ')) + ' ' + l.sb.join(' '))}"><summary><span class="stt">${l.nh}</span>${l.r ? '<span class="strc">recall</span>' : ''}${l.x ? `<span class="stx" title="past questions on this">×${l.x}</span>` : ''}</summary>
        <div class="stfl" style="--b:${col}"><ol class="sts">${l.c.map(stepHtml).join('')}</ol>${l.sb.length ? `<p class="stsb"><b>Study Book:</b> ${l.sb.map(x => `<span>${esc(x)}</span>`).join('')}</p>` : ''}<p class="pg">Question Book p ${l.pg}${l.x ? ` · ${l.x} past question${l.x > 1 ? 's' : ''}` : ''}</p></div></details>`;
    const branch = b => { const col = TREEC[bi++ % TREEC.length]; let g0 = null, inner = '';
      b.l.forEach(l => { if (l.g && l.g !== g0) { g0 = l.g; inner += `<h4 class="stg">${esc(l.g)}</h4>`; } inner += leaf(l, col); });
      return `<details class="stb" style="--b:${col}"><summary><span class="stbn">${esc(b.n)}</span>${b.q ? `<span class="stq">${esc(b.q)}</span>` : ''}<span class="stc">${b.l.length} sub-topics</span></summary>
        ${b.sig ? `<p class="stsig">${b.sig.replace(/^signal:\s*/, '<b>Words in the question:</b> ')}</p>` : ''}<div class="stls">${inner}</div></details>`; };
    return `<section class="stree" aria-label="The four trees"><div class="sttop"><h2>The four trees — find your branch</h2>
      <p>Pick the tree, then the branch that matches the question, then the sub-topic: it opens into its steps, in order. Words exactly as printed in your Question Book (p 7–22).</p>
      <div class="acts"><button class="btn" data-st="open">Expand all</button><button class="btn" data-st="close">Collapse all</button></div>${filterBox('Find a sub-topic: e.g. resonance, Laplace, rms')}</div>
      ${T.map(t => { const k = t.t[0], col = TREET[k] || '#4f46e5';
        return `<details class="stt0" open style="--t:${col}"><summary><span class="stk">${k}</span><span class="sttn">${esc(t.t.replace(/^[A-Z] · /, ''))}</span><span class="stc">${t.b.length} branches · ${t.b.reduce((a, b) => a + b.l.length, 0)} sub-topics</span></summary>
          ${t.ask ? `<p class="stask">${t.ask}</p>` : ''}${t.b.map(branch).join('')}${t.note ? `<p class="stnote">${t.note}</p>` : ''}</details>`; }).join('')}</section>`;
  }
  function wireTree() {
    const box = $('.stree', main); if (!box) return;
    box.addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (!b) return; const op = b.dataset.st === 'open';
      $$('details', box).forEach(d => { d.open = op || d.classList.contains('stt0'); }); });
    const inp = $('.fbox input', box); if (!inp) return;
    inp.oninput = () => { const W = words(inp.value);
      $$('.stl0', box).forEach(el => { const h = !W.length || hitAll(norm(el.dataset.s), W); el.hidden = !h; el.open = W.length > 0 && h; });
      $$('.stb', box).forEach(b => { const any = $$('.stl0', b).some(el => !el.hidden); b.hidden = !any; b.open = W.length > 0 && any;
        $$('.stg', b).forEach(g => { let n = g.nextElementSibling, v = false; while (n && !n.classList.contains('stg')) { if (!n.hidden) v = true; n = n.nextElementSibling; } g.hidden = !v; }); }); };
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
    setShell('sims'); document.title = 'Formula labs by topic · TNEB AE Study Site'; main.onclick = null; main.oninput = null;
    main.innerHTML = '<p class="loading">Loading the simulators…</p>';
    await Promise.all([loadSims(), loadF()]); if (tok !== RT) return;
    const by = {}; LABS.forEach(L => { if (L.home === L.t) (by[L.t] ||= []).push(L); });
    const g = {}; IX.T.forEach(t => { if (LABN[t.id]) (g[t.s] ||= []).push(t); });
    const tot = Object.values(LABN).reduce((a, b) => a + b, 0);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#sims">Simulation Lab</a> › Formula labs by topic</div>
      <section class="hero"><h1>⚙ Formula labs by topic</h1><p>${tot} live labs on ${Object.keys(LABN).length} topics. Each lab is built on a formula of your book: change the numbers and watch every result move, plot any output against any input, see what a 10 % change does, and recompute the book's own worked examples (${LABS.reduce((a, L) => a + (L.ck || []).length, 0)} checks, all matching the book).</p>
      <div class="acts"><a class="btn go" href="${SIM_URL}"${SIM_TGT}>⚙ Full Transformer simulator (phasors, 3-phase, parallel, inrush)</a></div></section>
      ${IX.S.filter(([k]) => g[k]).map(([k, n]) => `<section class="subj" style="--c:${SC[k]}"><h2><i></i>${esc(n)} <small>${g[k].reduce((a, t) => a + LABN[t.id], 0)} labs</small></h2><div class="tcards">${g[k].map(t => `<a class="tc" href="#sim-${t.id}" style="--c:${SC[t.s]}" data-s="${esc(t.t)}"><h3>${esc(t.t.replace(/^Code 400 · /, ''))}</h3><div class="meta">${t.t.startsWith('Code 400') ? '<span class="chip c4">CODE 400</span>' : ''}<span>${LABN[t.id]} labs</span></div><p class="lnames">${(by[t.id] || LABS.filter(L => L.t === t.id)).map(L => esc(L.n)).join(' · ')}</p></a>`).join('')}</div></section>`).join('')}
      <footer class="foot">Every lab uses the formula as printed in your Complete Book; the book link on each lab shows which formula and page. The ✓ Book checks are the book's solved sums, ratio sums, key-formula examples, one-minute sums, quick checks and value tables.</footer>`;
    toTop();
  }
  /* ---------- practice papers & drills (Question Book Parts 4, 6 and 7) ---------- */
  const drillId = (T_, x) => `d${T_.t}.${x.n}`;
  const drillCard = (T_, x) => { const id = drillId(T_, x), e = P.q[id];
    return `<article class="box dr" data-d="${id}"><header>${starBtn(id)}<b>${T_.k}.${x.n}</b><span>${esc(T_.n)}</span>${e ? `<span class="pg ${e[2] ? 'up' : 'dn'}">${e[2] ? '✓ got it last time' : '✗ missed last time'}</span>` : ''}</header>
      <div class="dq">${x.q}</div><div class="acts"><button class="btn" data-dr="show">Show method & answer</button></div>
      <div class="da" hidden>${x.m ? spu(x.m, 'Method') : ''}<p class="dans">Answer: <b>${x.a}</b></p><div class="acts"><span class="pg">Did you get it?</span><button class="btn" data-dr="ok">✓ Got it</button><button class="btn" data-dr="no">✗ Missed</button></div></div></article>`; };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-dr]'); if (!b) return; const card = b.closest('.dr');
    if (b.dataset.dr === 'show') { const a = $('.da', card); a.hidden = !a.hidden; b.textContent = a.hidden ? 'Show method & answer' : 'Hide method & answer'; lazy(card); return; }
    if (card.dataset.done) return; card.dataset.done = 1; record(card.dataset.d, b.dataset.dr === 'ok');
    $('.da .acts', card).innerHTML = b.dataset.dr === 'ok' ? '<b class="up">✓ Marked as got it</b>' : '<b class="dn">✗ Marked as missed — it counts in your progress console</b>';
  });
  // the Question Book's 2,620 past questions live on their topics' Practice tabs: one page to find them all
  async function viewQbook(tok) {
    setShell('home'); document.title = 'Question Book — all past questions · TNEB AE Study Site';
    const U = await loadU(); if (tok !== RT) return;
    const EXN = { GATE: 'GATE EE', TNPSC: 'TNPSC', ESE: 'UPSC ESE', TANGEDCO: 'TANGEDCO AE', APGENCO: 'APGENCO AE' };
    const by = {}; U.forEach(x => { const b = by[x.t] || (by[x.t] = { n: 0, A: 0, B: 0, ex: {}, done: 0, right: 0 }); b.n++; b[x.lab[0] === 'A' ? 'A' : 'B']++; b.ex[x.ex] = (b.ex[x.ex] || 0) + 1; const e = P.q[x.id]; if (e) { b.done++; if (e[2]) b.right++; } });
    const exT = {}; U.forEach(x => exT[x.ex] = (exT[x.ex] || 0) + 1);
    const nA = U.filter(x => x.lab[0] === 'A').length, done = U.filter(x => P.q[x.id]).length;
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Question Book</div>
      <section class="hero shelfh" style="--c:#1565c0"><h1><span class="shi">📘</span> Question Book — all ${U.length.toLocaleString('en-IN')} past questions</h1>
      <p>Every past question of your Question Book (all exams), each with its full solution, filed under its topic: ${nA.toLocaleString('en-IN')} theory / concept and ${(U.length - nA).toLocaleString('en-IN')} numerical. Tap a topic to open its questions (Practice tab → Question Book), where you can filter by exam, concept or numerical, sub-topic, and the ones you got wrong.</p>
      <div class="meta qbx">${Object.keys(EXN).filter(k => exT[k]).map(k => `<span class="ex ex-${k}">${EXN[k]} · ${exT[k]}</span>`).join('')}</div>
      <p class="pg">You: ${done.toLocaleString('en-IN')} of ${U.length.toLocaleString('en-IN')} answered</p>
      <div class="acts"><a class="btn go" href="#mock">⏱ Mock test from these questions</a><a class="btn" href="#practice">📝 Practice papers & drills</a></div></section>
      ${IX.S.map(([k, n]) => { const ts = IX.T.filter(t => t.s === k && by[t.id]); if (!ts.length) return '';
        return `<section class="subj" style="--c:${SC[k]}"><h2><i></i>${esc(n)} <small>${ts.reduce((a, t) => a + by[t.id].n, 0)} questions</small></h2><div class="tcards">${ts.map(t => { const b = by[t.id];
          return `<a class="tc" href="#t-${t.id}-prac" style="--c:${SC[t.s]}"><h3>${esc(t.t.replace(/^Code 400 · /, ''))}</h3><div class="meta"><span><b>${b.n}</b> questions</span><span>${b.A} concept · ${b.B} numerical</span>${b.done ? `<span>${b.done} done · ${b.right} right</span>` : ''}</div>
            <div class="meta">${Object.keys(EXN).filter(e => b.ex[e]).map(e => `<span class="ex ex-${e}">${EXN[e]} ${b.ex[e]}</span>`).join('')}</div></a>`; }).join('')}</div></section>`; }).join('')}`;
    main.onclick = e => { if (e.target.closest('.tc[href^="#t-"]')) GOSEC = 'qbook'; };   // land on the topic's Question Book section
    toTop();
  }
  async function viewPractice(tok) {
    setShell('home'); document.title = 'Practice papers & drills · TNEB AE Study Site';
    const [DR, PR] = await Promise.all([loadDrill(), loadPred()]); if (tok !== RT) return;
    const card = (h, ic, n, m, d, c) => `<a class="tc shelf" href="${h}" style="--c:${c}"><h3><span class="shi">${ic}</span> ${n}</h3><div class="meta"><span>${m}</span></div><p class="lnames">${d}</p></a>`;
    const done = ids => ids.filter(i => P.q[i]).length;
    const nd = DR.T.reduce((a, t) => a + t.q.length, 0);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Practice papers & drills</div>
      <section class="hero shelfh" style="--c:#7c3aed"><h1><span class="shi">📝</span> Practice papers & drills</h1><p>The practice parts of your Question Book: the 300-numericals drill and the two predicted papers with their keys and worked solutions, plus the mock test built from every past question.</p></section>
      <section class="subj shelfsec" style="--c:#7c3aed"><h2><i></i>Practise</h2><div class="tcards">
      ${card('#qbook', '📘', 'Question Book — all past questions', '2,620 questions · 46 topics', 'Every past question (GATE, TNPSC, ESE, TANGEDCO, APGENCO) with its full solution, topic by topic.', '#1565c0')}
      ${card('#drill', '🔢', 'Numericals drill', `${nd} numericals · 25 topics · ${done(DR.T.flatMap(t => t.q.map(x => drillId(t, x))))} done`, 'One minute each: solve on paper, then show the method and the answer and mark yourself. Question Book Part 4, p 1203–1229.', '#2563eb')}
      ${card('#pred-gate', '🎓', esc(PR.gate.t), `${PR.gate.q.length} questions · ${done(PR.gate.q.map(x => x.id))} done`, 'MCQ, MSQ and numerical-answer questions with the key, worked solutions and why each was predicted. Question Book Part 6.', '#dc2626')}
      ${card('#pred-tneb', '⚡', esc(PR.tneb.t), `${PR.tneb.q.length} questions · ${done(PR.tneb.q.map(x => x.id))} done`, 'All four-option MCQs: answer one by one, or sit it as a timed 2-hour paper with −⅓ per wrong answer. Question Book Part 7.', '#1f4e79')}
      ${card('#mock', '⏱', 'Mock test', 'any topics · any length', 'A timed paper from the 2,620 real past questions and the book MCQs, with a topic-by-topic result.', '#0f766e')}
      ${card('#ref-flow', '🧭', 'How to solve any sum', 'one flow · four trees', 'The 9-step flow and the Maths, EEE, Basic Engineering and Aptitude trees from Question Book Part 1.', '#be123c')}
      ${card('#ref-acdc', '⚡', 'Ten practice sums & machine sums', 'DC · 1-φ · 3-φ · machines', 'Fully worked sums with computed answers, from the Complete Book comparison sheets.', '#ea580c')}</div></section>
      <p class="tnote" style="margin-top:16px">The two predicted papers are practice questions the book wrote from past-paper trends — they are not real past papers.</p>`;
    toTop();
  }
  // scroll to one card and flash it
  const goCard = el => { if (!el) return false; requestAnimationFrame(() => el.scrollIntoView({ block: 'center' })); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2400); return true; };
  async function viewDrill(k, tok, qn) {
    setShell('home'); document.title = 'Numericals drill · TNEB AE Study Site';
    const DR = await loadDrill(); if (tok !== RT) return;
    const n = DR.T.reduce((a, t) => a + t.q.length, 0);
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › <a href="#practice">Practice papers & drills</a> › Numericals drill</div>
      <section class="hero shelfh" style="--c:#2563eb"><h1><span class="shi">🔢</span> Numericals drill</h1><p>${n} quick numericals in 25 EEE topics (Question Book Part 4, p 1203–1229). Aim for one minute each: solve on paper, then show the method and the answer, and mark yourself — it counts in your progress console. Every answer was computed by the book from the formula shown.</p>
      <nav class="pgchips" aria-label="Topics">${DR.T.map(t => `<a href="#drill-${t.k}">${t.k}. ${esc(t.n)}</a>`).join('')}</nav></section>
      ${DR.T.map(t => `<section class="panel drs" id="dk${t.k}"><h2>${t.k}. ${esc(t.n)} <small>${t.q.length} numericals · p ${t.p}${t.t ? ` · <a href="#t-${t.t}">open the topic</a>` : ''}</small></h2><div class="drl">${t.q.map(x => drillCard(t, x)).join('')}</div></section>`).join('')}`;
    const el = k && document.getElementById('dk' + k), T_ = k && DR.T.find(t => String(t.k) === k);
    if (qn && T_ && goCard(main.querySelector(`[data-d="${drillId(T_, { n: +qn })}"]`))) return;
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' })); else toTop();
  }
  async function viewPred(pid, tok, n) {
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
    if (!(n && goCard(main.querySelector(`[data-u="z${pid}.${+n}"]`)))) toTop();
  }
  /* ---------- My starred: everything you starred, in one place ---------- */
  async function viewStarred(tok) {
    setShell('home'); document.title = 'My starred · TNEB AE Study Site'; main.innerHTML = '<p class="loading">Loading your starred list…</p>';
    await Promise.all([loadEvery(), loadRef()]); if (tok !== RT) return;
    const K = Object.entries(P.star).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    // Question Book questions: their topic files carry the sub-topic and page
    const uts = [...new Set(K.filter(k => k[0] === 'u' && UBY[k]).map(k => UBY[k].t))], UT = {};
    await Promise.all(uts.map(t => get(`data/u/${t}.json`).then(d => { UT[t] = d; }).catch(() => {}))); if (tok !== RT) return;
    const gts = [...new Set(K.filter(k => /^g\d+\./.test(k)).map(topicOf))], GT = {};
    await Promise.all(gts.map(t => topic(t).then(d => { GT[t] = d; }).catch(() => {}))); if (tok !== RT) return;
    const gOf = k => { const d = GT[topicOf(k)], i = +k.split('.')[1]; return d && d.gate.find(g => g.i === i); };
    const uFull = k => { const x = UBY[k], d = UT[x.t], y = d && d.q.find(q => q.id === k); return { ...(y || {}), ...x, sub: y ? y.sub : -1 }; };
    const G = Object.fromEntries(REF.g.map(g => [g.id, g]));
    const tops = K.filter(k => k.startsWith('t/') && T(k.slice(2))), pages = K.filter(k => k.startsWith('ref/')).map(k => k.split('/')).filter(([, g]) => G[g]);
    const forms = K.filter(k => /^[fks]/.test(k) && FBY[k]), qb = K.filter(k => k[0] === 'u' && UBY[k]), pr = K.filter(k => ZBY[k]), mc = K.filter(k => QBY[k]), dr = K.filter(k => DBY[k]), gs = K.filter(k => /^g\d+\./.test(k));
    const UQ = { subs: [], q: [...qb.map(uFull), ...pr.map(k => ZBY[k][1])] };
    const sec = (t, n, body) => n ? `<section class="panel"><h2>${t} <small>${n}</small></h2>${body}</section>` : '';
    main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › My starred</div>
      <section class="hero shelfh" style="--c:#d97706"><h1><span class="shi">⭐</span> My starred</h1><p>${K.length ? `${K.length} things you starred. Tap ☆ on any question, formula, look-up page or topic to add it here; tap ★ to remove it.` : 'Nothing starred yet. Tap ☆ on any question, formula, look-up page or topic and it shows here — your own revision list, saved with your progress.'}</p></section>
      <div class="con">
      ${sec('📚 Topics', tops.length, `<div class="tcards">${tops.map(k => topicCard(T(k.slice(2)))).join('')}</div>`)}
      ${sec('📄 Look-up pages', pages.length, `<div class="gsl">${pages.map(([, g, p]) => `<a class="gsr" href="#ref-${g}-${p}"><b>${G[g].ic} ${esc(G[g].n)} · p ${p}</b><small>${volOf(G[g])} · book page ${p}</small></a>`).join('')}</div>`)}
      ${sec('📐 Formulas', forms.length, `<div class="wf">${forms.map(k => { const f = FBY[k], t = T(f.t); return `<div class="wfi"><span>${starBtn(k, 'formula')}<b>${esc(f.nm)}</b><small>${esc(t ? t.t : '')} · ${esc(f.src)}</small></span><a class="btn" href="#t-${f.t}">Open topic</a><div class="fx">${f.h.join('<br>')}</div></div>`; }).join('')}</div>`)}
      ${sec('📘 Question Book & predicted papers', UQ.q.length, `<div id="squ" style="display:grid;gap:12px">${UQ.q.map(x => uCard(x.id[0] === 'z' ? { ...x, src: `${PRED[ZBY[x.id][0]].t} · ${x.lab}` } : x, x.id[0] === 'u' && UT[x.t] ? UT[x.t] : UQ)).join('')}</div>`)}
      ${sec('✅ Book MCQs', mc.length, mc.map(k => mcqCard(QBY[k])).join(''))}
      ${sec('🔢 Numericals drill', dr.length, `<div class="drl">${dr.map(k => drillCard(...DBY[k])).join('')}</div>`)}
      ${sec('🎓 GATE sums', gs.length, `<div class="gsl">${gs.map(k => { const t = T(topicOf(k)); return t ? `<a class="gsr" href="#t-${t.id}-prac" data-gt><b>${starBtn(k, 'GATE sum')}${gOf(k) ? `${esc(gOf(k).src)} · Q.${esc(gOf(k).q)}` : 'GATE sum'}</b><small>${esc(t.t)} · Practice tab → GATE sums${gOf(k) ? ` · Answer behind the button there` : ''}</small></a>` : ''; }).join('')}</div>`)}
      </div>`;
    main.onclick = e => { if (e.target.closest('[data-gt]')) GOSEC = 'gate'; uAnswer(e, UQ); };
    main.onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('unum')) { e.preventDefault(); uAnswer({ target: e.target.closest('.ub').querySelector('[data-uact="chk"]') }, UQ); } };
    lazy(); toTop();
  }
  function predTimed(X) {
    const qs = X.q.filter(x => x.ty === 'mcq').map(x => { const oh = x.qh != null ? Object.fromEntries(x.oh) : null;
      return { id: x.id, t: '', ty: 'mcq', mk: 1, sec: x.sec.replace(/^Part [IVX]+ — /, ''), src: x.topic || x.lab, q: oh ? `<div class="uq">${x.qh}</div>` : `<div class="im wide">${spu(x.qs, x.lab)}<span class="zoomhint">Swipe sideways to read the whole line · tap to zoom</span></div>`,
        opts: x.L.map(l => ({ l, h: oh && oh[l] || '' })), r: x.L.indexOf(x.ok[0]), ex: x.sh ? solHtml(x) : spu(x.ss, 'Answer and working') }; });
    M = { qs, ans: qs.map(() => -1), flag: qs.map(() => false), vis: qs.map(() => false), tq: qs.map(() => 0), tab: '', i: 0, end: Date.now() + 120 * 60 * 1000, total: 7200, neg: true, t0: Date.now(), title: X.t };
    showMock(); startTick();
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
    await Promise.all([loadEvery(), loadRef(), loadSym(), loadAzt()]);
    GSI = {
      r: REF.g.flatMap(g => g.p.map(e => [{ g, p: e[0], x: e[7] }, norm(g.n + ' ' + e[7])])),
      s: SYM.e.map(e => [e, norm(plain([e[1], e[2], e[3], e[4], e[5], e[6].join(' ')].join(' ')))]),
      a: AZT.flatMap(([, t, rows]) => rows.map(r => [{ r, t }, norm(plain(r[0] + ' ' + r[1].join(' ') + ' ' + r[2]))])),
      f: FA.map(f => [f, norm(f.nm + ' ' + plain(f.h.join(' ')) + ' ' + (T(f.t) || {}).t)]),
      u: UA.map(x => [x, norm([x.lab, x.src, x.c, x.sb, x.ans, plain(x.qh || ''), (x.oh || []).map(o => plain(o[1])).join(' '), x.x || '', (T(x.t) || {}).t].join(' '))]),
      q: QA.map(x => [x, norm(plain(x.q + ' ' + x.o.join(' ')) + ' ' + x.src + ' ' + (T(x.t) || {}).t)]),
      d: DRILL.T.flatMap(t => t.q.map(x => [{ t, x }, norm(plain(x.q + ' ' + x.a) + ' ' + t.n + ' drill numerical')])),
      z: ['gate', 'tneb'].flatMap(p => PRED[p].q.map(x => [{ p, x }, norm([PRED[p].t, 'predicted', x.lab, x.sec, x.topic, x.ans, plain(x.qh || ''), (x.oh || []).map(o => plain(o[1])).join(' '), (x.sh || []).map(e => plain(e[1])).join(' ')].join(' '))])),
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
    const ds = I.d.filter(([, s]) => hitAll(s, W)).map(([x]) => x), zs = I.z.filter(([, s]) => hitAll(s, W)).map(([x]) => x);
    const n = tp.length + fs.length + us.length + qs.length + rs.length + ss.length + as.length + ds.length + zs.length;
    const grp = (id, title, L, row, k = 8) => L.length ? `<section class="panel"><h2>${title} <small>${L.length}</small></h2><div class="gsl">${L.slice(0, k).map(row).join('')}</div>${L.length > k ? `<button class="more" data-gs="${id}">Show all ${L.length}</button>` : ''}</section>` : '';
    const tn = id => esc((T(id) || {}).t || '');
    const go = (id, pane) => `data-go="${id}" data-pane="${pane || ''}"`;
    const rows = {
      t: t => `<a class="gsr" href="#t-${t.id}"><b>${esc(t.t)}</b><small>${esc(IX.S.find(s => s[0] === t.s)[1])}</small></a>`,
      f: f => `<a class="gsr" href="#t-${f.t}" ${go(f.t, '')}><b>${esc(f.nm)}</b><span class="fx">${f.h[0]}</span><small>${tn(f.t)} · ${esc(f.src)}</small></a>`,
      u: x => `<a class="gsr" href="#t-${x.t}-prac" ${go(x.t, 'prac')}><b><span class="ex ex-${x.ex}">${esc(x.src)}</span></b><span>${esc((plain(x.qh || '') || x.x || x.sb || '').slice(0, 160))}…</span><small>${tn(x.t)} · ${esc(x.sb || '')} · Answer: ${esc(x.ans)}</small></a>`,
      r: x => { const i = x.x.toLowerCase().indexOf(W[0]), sn = x.x.slice(Math.max(0, i - 60), i + 120); return `<a class="gsr" href="#ref-${x.g.id}-${x.p}"><b>${x.g.ic} ${esc(x.g.n)} · p ${x.p}</b><span>${i > 60 ? '…' : ''}${esc(sn)}…</span><small>Look-up shelf · ${volOf(x.g)} · book page ${x.p}</small></a>`; },
      d: ({ t, x }) => `<a class="gsr" href="#drill-${t.k}-${x.n}"><b>🔢 ${t.k}.${x.n} · ${esc(t.n)}</b><span>${esc(plain(x.q).slice(0, 170))}</span><small>Numericals drill · Question Book p ${t.p}</small></a>`,
      z: ({ p, x }) => `<a class="gsr" href="#pred-${p}-${x.n}"><b>${p === 'gate' ? '🎓' : '⚡'} ${esc(PRED[p].t)} · ${esc(x.lab)}</b><span>${esc((plain(x.qh || '') || x.topic || '').slice(0, 170))}</span><small>Predicted practice paper · ${esc(x.sec.replace(/^Part [IV]+ — /, ''))}${x.topic ? ' · ' + esc(x.topic) : ''}</small></a>`,
      s: e => `<a class="gsr" href="#ref-sym"><b><span class="fx">${e[1]}</span> — ${e[2]}</b><span>${e[3]}${e[5] ? ' · ' + e[5] : ''}</span><small>Symbols A–Z · Vol 6 p ${e[7]}</small></a>`,
      a: x => `<a class="gsr" href="#ref-az"><b>${x.r[0]}</b><span class="fx">${x.r[1][0] || ''}</span><small>A–Z formula table · ${esc(x.t)} · ${esc(x.r[2])} · Vol 6 p ${x.r[3]}</small></a>`,
      q: x => `<a class="gsr" href="#t-${x.t}${x.k === 'book' ? '' : '-prac'}" ${go(x.t, x.k === 'book' ? '' : 'prac')}><b>${esc(plain(x.q).slice(0, 140))}</b><small>${tn(x.t)} · ${esc(x.src)}</small></a>`,
    };
    const L = { t: tp, f: fs, u: us, q: qs, r: rs, s: ss, a: as, d: ds, z: zs };
    const render = (all = '') => {
      main.innerHTML = `<div class="crumbs"><a href="#home">All topics</a> › Search</div><div class="con">
        <section class="panel"><h2>🔎 “${esc(q)}” <small>${n ? `${n} results` : 'nothing found — try fewer or different words'}</small></h2><p>Every word must appear. Tap a result to open its topic with these words already searched there.</p></section>
        ${grp('t', 'Topics', tp, rows.t, all === 't' ? 1e9 : 8)}${grp('f', 'Formulas', fs, rows.f, all === 'f' ? 1e9 : 8)}${grp('u', 'Question Book — past questions', us, rows.u, all === 'u' ? 1e9 : 8)}${grp('q', 'Book MCQs', qs, rows.q, all === 'q' ? 1e9 : 8)}${grp('d', '🔢 Numericals drill', ds, rows.d, all === 'd' ? 1e9 : 6)}${grp('z', '🎯 Predicted papers (practice)', zs, rows.z, all === 'z' ? 1e9 : 6)}${grp('r', '📚 Look-up shelf pages', rs, rows.r, all === 'r' ? 1e9 : 6)}${grp('s', '🔤 Symbols A–Z', ss, rows.s, all === 's' ? 1e9 : 6)}${grp('a', '📒 A–Z formula table', as, rows.a, all === 'a' ? 1e9 : 6)}</div>`;
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
