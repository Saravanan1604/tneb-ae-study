/* Engineering Mathematics labs. Checks are the book's own lookup tables (Vol 6, Key Formula & Values). */
(() => {
  const PI = Math.PI, sq = Math.sqrt, deg = x => x * 180 / PI, rad = x => x * PI / 180;
  const n3 = x => (Math.abs(x) < 5e-10 ? 0 : +x.toFixed(4)).toString().replace(/-/g, '−');
  const SUP = n => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d] || d).join('');
  const mat = t => String(t).split(';').map(r => r.trim().split(/[\s,]+/).filter(Boolean).map(Number));
  // roots of a real polynomial (highest power first) by Durand–Kerner
  function roots(c) {
    const n = c.length - 1, a = c.map(x => x / c[0]); let r = Array.from({ length: n }, (_, k) => [0.4 * Math.cos(2.1 * k + 0.3), 0.9 * Math.sin(2.1 * k + 0.3)]);
    const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]], div = (p, q) => { const d = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
    for (let it = 0; it < 800; it++) r = r.map((x, i) => { let f = [1, 0]; for (let k = 1; k <= n; k++) { const m = mul(f, x); f = [m[0] + a[k], m[1]]; } let d = [1, 0]; r.forEach((y, j) => { if (j !== i) d = mul(d, [x[0] - y[0], x[1] - y[1]]); }); const q = div(f, d); return [x[0] - q[0], x[1] - q[1]]; });
    return r.sort((p, q) => q[0] - p[0] || q[1] - p[1]);
  }
  const rstr = r => r.map(([x, y]) => Math.abs(y) < 1e-6 ? n3(x) : `${Math.abs(x) < 1e-6 ? '' : n3(x) + ' '}${y < 0 ? '−' : '+'} ${n3(Math.abs(y))}i`).join(', ');
  const erf = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
  const fact = n => { let f = 1; for (let k = 2; k <= n; k++) f *= k; return f; };
  const C = (n, k) => fact(n) / (fact(k) * fact(n - k));
  function gamma(x) { if (x < 0.5) return PI / (Math.sin(PI * x) * gamma(1 - x)); const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i); return sq(2 * PI) * t ** (x + 0.5) * Math.exp(-t) * a; }

  /* ---------- Matrices ---------- */
  lab(106, { n: '2 × 2 matrix — eigenvalues and inverse', rf: 'Characteristic equation', c: 'λ² − (trace)λ + det = 0. Sum of eigenvalues = trace, product = det. A⁻¹ = (1/det)[d −b; −c a]: swap the diagonal, change the signs of the off-diagonal. det = 0 → singular (an eigenvalue is 0).',
    i: [['a', 'a (row 1)', '', 4, -20, 20, 0.5], ['b', 'b (row 1)', '', 1, -20, 20, 0.5], ['c', 'c (row 2)', '', 2, -20, 20, 0.5], ['d', 'd (row 2)', '', 3, -20, 20, 0.5]],
    o: [['tr', 'Trace', '', v => v.a + v.d], ['det', 'Determinant', '', v => v.a * v.d - v.b * v.c], ['D', 'Discriminant tr² − 4det', '', v => v.tr * v.tr - 4 * v.det],
      ['l1', 'λ₁ (real part)', '', v => v.D >= 0 ? (v.tr + sq(v.D)) / 2 : v.tr / 2], ['l2', 'λ₂ (real part)', '', v => v.D >= 0 ? (v.tr - sq(v.D)) / 2 : v.tr / 2], ['li', 'Imaginary part ±', '', v => v.D < 0 ? sq(-v.D) / 2 : 0],
      ['sq', 'Eigenvalues of A²', '', v => v.D >= 0 ? `${n3(v.l1 ** 2)}, ${n3(v.l2 ** 2)}` : 'complex'], ['i11', 'A⁻¹ row 1, col 1', '', v => v.d / v.det], ['i12', 'A⁻¹ row 1, col 2', '', v => -v.b / v.det], ['i21', 'A⁻¹ row 2, col 1', '', v => -v.c / v.det], ['i22', 'A⁻¹ row 2, col 2', '', v => v.a / v.det], ['inv', 'Invertible?', '', v => Math.abs(v.det) > 1e-12 ? 'yes' : 'no']],
    ck: [[{ a: 4, b: 1, c: 2, d: 3 }, { tr: 7, det: 10, l1: 5, l2: 2 }, 'Vol 6 p 1713 · table'], [{ a: 1, b: 2, c: 2, d: 1 }, { l1: 3, l2: -1 }, 'Vol 6 p 1713 · table'], [{ a: 5, b: 4, c: 1, d: 2 }, { tr: 7, det: 6, l1: 6, l2: 1 }, 'Vol 6 p 1713 · table'], [{ a: 3, b: 1, c: 0, d: 5 }, { l1: 5, l2: 3 }, 'Vol 6 p 1713 · table'], [{ a: 0, b: 1, c: -1, d: 0 }, { tr: 0, det: 1, li: 1 }, 'Vol 6 p 1713 · table'],
      [{ a: 4, b: 7, c: 2, d: 6 }, { det: 10, i11: 0.6, i12: -0.7, i21: -0.2, i22: 0.4 }, 'Vol 6 p 1724 · table'], [{ a: 1, b: 2, c: 3, d: 4 }, { det: -2, i11: -2, i12: 1, i21: 1.5, i22: -0.5 }, 'Vol 6 p 1724 · table'], [{ a: 3, b: 2, c: 1, d: 1 }, { i11: 1, i12: -2, i21: -1, i22: 3 }, 'Vol 6 p 1724 · table'], [{ a: 6, b: 3, c: 4, d: 2 }, { det: 0, inv: 'no' }, 'Vol 6 p 1724 · table']] });
  lab(106, { n: '3 × 3 matrix — determinant, trace and eigenvalues', rf: 'Characteristic equation', c: 'Type the rows separated by semicolons. The eigenvalues solve |A − λI| = 0; their sum is the trace and their product the determinant. An all-ones n × n matrix has eigenvalues n, 0, 0 …',
    i: [['A', 'Matrix rows (a b c; d e f; g h i)', '', '1 1 1; 1 1 1; 1 1 1', 'text']],
    o: [['ok', 'Read as', '', v => { const m = mat(v.A); return m.length === 3 && m.every(r => r.length === 3 && r.every(Number.isFinite)) ? '3 × 3' : 'type 3 rows of 3 numbers'; }],
      ['tr', 'Trace', '', v => { const m = mat(v.A); return m[0][0] + m[1][1] + m[2][2]; }],
      ['det', 'Determinant', '', v => { const m = mat(v.A); return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]); }],
      ['ev', 'Eigenvalues', '', v => { const m = mat(v.A), c2 = m[0][0] * m[1][1] - m[0][1] * m[1][0] + m[0][0] * m[2][2] - m[0][2] * m[2][0] + m[1][1] * m[2][2] - m[1][2] * m[2][1]; return rstr(roots([1, -v.tr, c2, -v.det])); }]],
    ck: [[{ A: '1 1 1; 1 1 1; 1 1 1' }, { tr: 3, det: 0, ev: '3, 0, 0' }, 'Vol 6 p 1713 · table']] });

  /* ---------- Calculus ---------- */
  lab(123, { n: 'Standard limits — watch them converge', rf: 'Limits', c: 'Substitute first; for 0/0 use a standard result: sin x/x → 1 (radians only), (1 − cos x)/x² → ½, (eˣ − 1)/x → 1, (1 + k/n)ⁿ → eᵏ.',
    i: [['f', 'Limit', '', 'sin(ax)/(bx)', ['sin(ax)/(bx)', '(1 − cos x)/x²', '(eˣ − 1)/x', '(aˣ − 1)/x', 'ln(1 + x)/x', '(1 + k/n)ⁿ']], ['a', 'a', '', 5, 0.1, 10, 0.1], ['b', 'b', '', 1, 0.1, 10, 0.1], ['k', 'k', '', 2, 0.1, 5, 0.1], ['x', 'x (or 1/n)', '', 0.01, 0.0001, 1, 0.0001, 'log']],
    o: [['val', 'Value at this x', '', v => { const x = v.x; return { 'sin(ax)/(bx)': Math.sin(v.a * x) / (v.b * x), '(1 − cos x)/x²': (1 - Math.cos(x)) / (x * x), '(eˣ − 1)/x': (Math.exp(x) - 1) / x, '(aˣ − 1)/x': (v.a ** x - 1) / x, 'ln(1 + x)/x': Math.log(1 + x) / x, '(1 + k/n)ⁿ': (1 + v.k * x) ** (1 / x) }[v.f]; }],
      ['lim', 'Limit', '', v => ({ 'sin(ax)/(bx)': v.a / v.b, '(1 − cos x)/x²': 0.5, '(eˣ − 1)/x': 1, '(aˣ − 1)/x': Math.log(v.a), 'ln(1 + x)/x': 1, '(1 + k/n)ⁿ': Math.exp(v.k) })[v.f]]],
    plot: { x: ['x', 'x (or 1/n)', '', 0.001, 1, 'log'], y: [['value', (x, v) => ({ 'sin(ax)/(bx)': Math.sin(v.a * x) / (v.b * x), '(1 − cos x)/x²': (1 - Math.cos(x)) / (x * x), '(eˣ − 1)/x': (Math.exp(x) - 1) / x, '(aˣ − 1)/x': (v.a ** x - 1) / x, 'ln(1 + x)/x': Math.log(1 + x) / x, '(1 + k/n)ⁿ': (1 + v.k * x) ** (1 / x) })[v.f]], ['limit', (x, v) => ({ 'sin(ax)/(bx)': v.a / v.b, '(1 − cos x)/x²': 0.5, '(eˣ − 1)/x': 1, '(aˣ − 1)/x': Math.log(v.a), 'ln(1 + x)/x': 1, '(1 + k/n)ⁿ': Math.exp(v.k) })[v.f]]], yl: 'value', mark: v => v.x },
    ck: [[{ f: 'sin(ax)/(bx)', a: 5, b: 1 }, { lim: 5 }, 'Vol 6 p 1714 · table'], [{ f: 'sin(ax)/(bx)', a: 3, b: 2 }, { lim: 1.5 }, 'Vol 6 p 1714 · table'], [{ f: '(1 − cos x)/x²' }, { lim: 0.5 }, 'Vol 6 p 1714 · table'], [{ f: '(1 + k/n)ⁿ', k: 1 }, { lim: 2.718 }, 'Vol 6 p 1714 · table']] });
  lab(123, { n: 'Maxima and minima of a cubic', rf: 'Derivatives table', c: 'Stationary points where f′(x) = 3ax² + 2bx + c = 0; f″ = 6ax + 2b < 0 → maximum, > 0 → minimum. The point of inflection is at x = −b/3a.',
    i: [['a', 'a (x³)', '', 1, -5, 5, 0.1], ['b', 'b (x²)', '', -3, -10, 10, 0.1], ['c', 'c (x)', '', 0, -20, 20, 0.1], ['d', 'd', '', 4, -20, 20, 0.1]],
    o: [['x1', 'Stationary point x₁', '', v => { const D = 4 * v.b * v.b - 12 * v.a * v.c; return D < 0 ? NaN : (-2 * v.b - sq(D)) / (6 * v.a); }], ['x2', 'Stationary point x₂', '', v => { const D = 4 * v.b * v.b - 12 * v.a * v.c; return D < 0 ? NaN : (-2 * v.b + sq(D)) / (6 * v.a); }],
      ['k1', 'At x₁', '', v => !Number.isFinite(v.x1) ? 'no turning points' : 6 * v.a * v.x1 + 2 * v.b < 0 ? 'maximum' : 6 * v.a * v.x1 + 2 * v.b > 0 ? 'minimum' : 'inflection'], ['k2', 'At x₂', '', v => !Number.isFinite(v.x2) ? '—' : 6 * v.a * v.x2 + 2 * v.b < 0 ? 'maximum' : 6 * v.a * v.x2 + 2 * v.b > 0 ? 'minimum' : 'inflection'], ['xi', 'Inflection x', '', v => -v.b / (3 * v.a)]],
    plot: { x: ['x', 'x', '', -3, 5, ''], y: [['f(x)', (x, v) => v.a * x ** 3 + v.b * x * x + v.c * x + v.d], ['f′(x)', (x, v) => 3 * v.a * x * x + 2 * v.b * x + v.c]], yl: 'f and f′' }, ck: [] });
  lab(140, { n: 'Wallis integrals and the gamma function', rf: 'Wallis', c: '∫₀^(π/2) sinⁿx dx = (n−1)/n × (n−3)/(n−2) × … (× π/2 if n is even). Γ(n + 1) = n!, Γ(½) = √π.',
    i: [['n', 'Power n', '', 4, 0, 12, 1], ['x', 'Gamma argument x', '', 5, 0.1, 10, 0.05]],
    o: [['w', '∫₀^(π/2) sinⁿx dx', '', v => { let r = 1; for (let k = v.n; k >= 2; k -= 2) r *= (k - 1) / k; return v.n % 2 ? r : r * PI / 2; }], ['num', 'Numerical check', '', v => { let s = 0; const N = 2000; for (let k = 0; k < N; k++) s += Math.sin((k + 0.5) * PI / 2 / N) ** v.n; return s * PI / 2 / N; }], ['g', 'Γ(x)', '', v => gamma(v.x)]],
    plot: { x: ['t', 'x', 'rad', 0, PI / 2, ''], y: [['sinⁿx', (t, v) => Math.sin(t) ** v.n]], yl: 'sinⁿx (area = the integral)' },
    ck: [[{ n: 2 }, { w: 0.785 }, 'Vol 6 p 1715 · table'], [{ n: 3 }, { w: 0.6667 }, 'Vol 6 p 1715 · table'], [{ n: 4 }, { w: 3 * PI / 16 }, 'Vol 6 p 1715 · table'], [{ n: 1 }, { w: 1 }, 'Vol 6 p 1715 · table'], [{ x: 5 }, { g: 24 }, 'Vol 6 p 1715 · table'], [{ x: 0.5 }, { g: 1.772 }, 'Vol 6 p 1715 · table']] });
  lab(140, { n: 'Area under a curve — exact against numerical', rf: 'Definite integral', c: 'A definite integral is the signed area. Trapezoidal error falls as h², Simpson’s as h⁴.',
    i: [['f', 'f(x)', '', 'eˣ', ['x²', 'eˣ', 'sin x', '1/(1 + x²)', 'x(1 − x)']], ['a', 'From a', '', 0, -5, 5, 0.1], ['b', 'To b', '', 1, -5, 10, 0.1], ['n', 'Strips n', '', 4, 1, 100, 1]],
    o: [['ex', 'Exact', '', v => { const F = { 'x²': x => x ** 3 / 3, 'eˣ': x => Math.exp(x), 'sin x': x => -Math.cos(x), '1/(1 + x²)': x => Math.atan(x), 'x(1 − x)': x => x * x / 2 - x ** 3 / 3 }[v.f]; return F(v.b) - F(v.a); }],
      ['tr', 'Trapezoidal', '', v => { const f = { 'x²': x => x * x, 'eˣ': Math.exp, 'sin x': Math.sin, '1/(1 + x²)': x => 1 / (1 + x * x), 'x(1 − x)': x => x * (1 - x) }[v.f], h = (v.b - v.a) / v.n; let s = (f(v.a) + f(v.b)) / 2; for (let k = 1; k < v.n; k++) s += f(v.a + k * h); return s * h; }],
      ['si', 'Simpson ⅓ (n even)', '', v => { if (v.n % 2) return 'needs even n'; const f = { 'x²': x => x * x, 'eˣ': Math.exp, 'sin x': Math.sin, '1/(1 + x²)': x => 1 / (1 + x * x), 'x(1 − x)': x => x * (1 - x) }[v.f], h = (v.b - v.a) / v.n; let s = f(v.a) + f(v.b); for (let k = 1; k < v.n; k++) s += (k % 2 ? 4 : 2) * f(v.a + k * h); return s * h / 3; }],
      ['et', 'Trapezoidal error', '', v => v.tr - v.ex]],
    plot: { x: ['x', 'x', '', -2, 3, ''], y: [['f(x)', (x, v) => ({ 'x²': x * x, 'eˣ': Math.exp(x), 'sin x': Math.sin(x), '1/(1 + x²)': 1 / (1 + x * x), 'x(1 − x)': x * (1 - x) })[v.f]]], yl: 'f(x)' },
    ck: [[{ f: 'x(1 − x)', a: 0, b: 1 }, { ex: 1 / 6 }, 'Vol 6 p 1715 · table']] });

  /* ---------- Vector calculus ---------- */
  lab(154, { n: 'Divergence and curl of a linear field', rf: 'Divergence', c: 'For F = (a₁x + b₁y + c₁z, a₂x + b₂y + c₂z, a₃x + b₃y + c₃z): div F = a₁ + b₂ + c₃, curl F = (b₃ − c₂, c₁ − a₃, a₂ − b₁). The position vector r has div 3, curl 0.',
    i: [['a1', 'Fx: coefficient of x', '', 1, -5, 5, 0.5], ['b1', 'Fx: of y', '', 0, -5, 5, 0.5], ['c1', 'Fx: of z', '', 0, -5, 5, 0.5], ['a2', 'Fy: of x', '', 0, -5, 5, 0.5], ['b2', 'Fy: of y', '', 1, -5, 5, 0.5], ['c2', 'Fy: of z', '', 0, -5, 5, 0.5], ['a3', 'Fz: of x', '', 0, -5, 5, 0.5], ['b3', 'Fz: of y', '', 0, -5, 5, 0.5], ['c3', 'Fz: of z', '', 1, -5, 5, 0.5]],
    o: [['div', 'div F', '', v => v.a1 + v.b2 + v.c3], ['cx', 'curl F — x', '', v => v.b3 - v.c2], ['cy', 'curl F — y', '', v => v.c1 - v.a3], ['cz', 'curl F — z', '', v => v.a2 - v.b1], ['ty', 'Field type', '', v => (v.cx || v.cy || v.cz ? 'rotational' : 'irrotational') + (v.div ? '' : ', solenoidal')]],
    ck: [[{}, { div: 3, cx: 0, cy: 0, cz: 0 }, 'Vol 6 p 1716 · table'], [{ a1: 2, b2: 2, c3: 2 }, { div: 6 }, 'Vol 6 p 1716 · table']] });

  /* ---------- Differential equations ---------- */
  lab(166, { n: 'Second-order ODE — roots and solution', rf: 'auxiliary', c: 'y″ + ay′ + by = 0 → m² + am + b = 0. Real distinct roots → c₁e^(m₁x) + c₂e^(m₂x); equal → (c₁ + c₂x)e^(mx); complex α ± iβ → e^(αx)(c₁ cos βx + c₂ sin βx).',
    i: [['a', 'a (coefficient of y′)', '', -5, -10, 10, 0.5], ['b', 'b (coefficient of y)', '', 6, -20, 30, 0.5]],
    o: [['D', 'Discriminant a² − 4b', '', v => v.a * v.a - 4 * v.b], ['m1', 'Root m₁ (real part)', '', v => v.D >= 0 ? (-v.a + sq(v.D)) / 2 : -v.a / 2], ['m2', 'Root m₂ (real part)', '', v => v.D >= 0 ? (-v.a - sq(v.D)) / 2 : -v.a / 2], ['w', 'Imaginary part ±', '', v => v.D < 0 ? sq(-v.D) / 2 : 0],
      ['y', 'Complementary function', '', v => { const f = x => n3(x); if (v.D > 0) return `c₁e^(${f(v.m1)}x) + c₂e^(${f(v.m2)}x)`; if (v.D === 0) return `(c₁ + c₂x)e^(${f(v.m1)}x)`; return `${v.m1 ? `e^(${f(v.m1)}x)` : ''}(c₁ cos ${f(v.w)}x + c₂ sin ${f(v.w)}x)`; }]],
    plot: { x: ['x', 'x', '', 0, 4, ''], y: [['y with y(0) = 1, y′(0) = 0', (x, v) => { if (v.D > 1e-9) { const p = v.m1, q = v.m2; return (q * Math.exp(p * x) - p * Math.exp(q * x)) / (q - p); } if (v.D < -1e-9) { const al = v.m1, w = v.w; return Math.exp(al * x) * (Math.cos(w * x) - al / w * Math.sin(w * x)); } return (1 - v.m1 * x) * Math.exp(v.m1 * x); }]], yl: 'y(x)' },
    ck: [[{ a: -5, b: 6 }, { m1: 3, m2: 2 }, 'Vol 6 p 1717 · table'], [{ a: -4, b: 4 }, { m1: 2, m2: 2, D: 0 }, 'Vol 6 p 1717 · table'], [{ a: 0, b: 4 }, { m1: 0, w: 2 }, 'Vol 6 p 1717 · table'], [{ a: 2, b: 5 }, { m1: -1, w: 2 }, 'Vol 6 p 1717 · table'], [{ a: 0, b: -1 }, { m1: 1, m2: -1 }, 'Vol 6 p 1717 · table'], [{ a: 0, b: 9 }, { w: 3 }, 'Vol 6 p 1717 · table'], [{ a: -6, b: 9 }, { m1: 3, m2: 3 }, 'Vol 6 p 1717 · table']] });

  /* ---------- Complex variables ---------- */
  lab(179, { n: 'Complex number — modulus, argument and powers', rf: 'Complex number forms', c: 'z = x + iy = re^(iθ), r = √(x² + y²), θ in the right quadrant. De Moivre: zⁿ = rⁿe^(inθ) — moduli multiply, angles add. iⁿ repeats every 4.',
    i: [['x', 'Real part x', '', 1, -20, 20, 0.5], ['y', 'Imaginary part y', '', 1, -20, 20, 0.5], ['n', 'Power n', '', 8, -10, 20, 1]],
    o: [['r', 'Modulus r', '', v => Math.hypot(v.x, v.y)], ['th', 'Argument (principal)', '°', v => deg(Math.atan2(v.y, v.x))], ['th3', 'Argument (0 to 360°)', '°', v => (deg(Math.atan2(v.y, v.x)) + 360) % 360],
      ['re', 'zⁿ — real part', '', v => v.r ** v.n * Math.cos(v.n * Math.atan2(v.y, v.x))], ['im', 'zⁿ — imaginary part', '', v => v.r ** v.n * Math.sin(v.n * Math.atan2(v.y, v.x))], ['rt', 'n-th roots (on a circle of radius r^(1/n))', '', v => v.n > 0 && v.n <= 8 ? Array.from({ length: v.n }, (_, k) => { const R = v.r ** (1 / v.n), a = (Math.atan2(v.y, v.x) + 2 * PI * k) / v.n; return rstr([[R * Math.cos(a), R * Math.sin(a)]]); }).join('; ') : '—']],
    ck: [[{ x: 3, y: 4 }, { r: 5 }, 'Vol 6 p 1718 · table'], [{ x: 5, y: 12 }, { r: 13 }, 'Vol 6 p 1718 · table'], [{ x: 1, y: 1 }, { th: 45 }, 'Vol 6 p 1718 · table'], [{ x: 1, y: 1, n: 8 }, { re: 16, im: 0 }, 'Vol 6 p 1718 · table'], [{ x: 1, y: 1, n: 2 }, { re: 0, im: 2 }, 'Vol 6 p 1718 · table'], [{ x: 6, y: 8 }, { r: 10 }, 'Vol 6 p 1718 · table'], [{ x: 0, y: 1, n: 10 }, { re: -1 }, 'Vol 6 p 1718 · table'], [{ x: -1, y: -1 }, { th3: 225 }, 'Vol 6 p 1718 · table']] });

  /* ---------- Laplace & Z ---------- */
  const LP = { 'e^(−at)': (a, w, n) => [`1/(s + ${n3(a)})`, s => 1 / (s + a), t => Math.exp(-a * t)], 't·e^(−at)': (a, w, n) => [`1/(s + ${n3(a)})²`, s => 1 / (s + a) ** 2, t => t * Math.exp(-a * t)], 'sin ωt': (a, w, n) => [`${n3(w)}/(s² + ${n3(w * w)})`, s => w / (s * s + w * w), t => Math.sin(w * t)],
    'cos ωt': (a, w, n) => [`s/(s² + ${n3(w * w)})`, s => s / (s * s + w * w), t => Math.cos(w * t)], 'e^(−at)·sin ωt': (a, w, n) => [`${n3(w)}/[(s + ${n3(a)})² + ${n3(w * w)}]`, s => w / ((s + a) ** 2 + w * w), t => Math.exp(-a * t) * Math.sin(w * t)], 'tⁿ': (a, w, n) => [`${fact(n)}/s${SUP(n + 1)}`, s => fact(n) / s ** (n + 1), t => t ** n], 'u(t) = 1': () => ['1/s', s => 1 / s, t => 1] };
  lab(190, { n: 'Laplace pairs — formula against the integral', rf: 'Standard pairs', c: 'F(s) = ∫₀^∞ f(t)e^(−st) dt. The lab computes the integral numerically at your s and compares it with the table pair. Note: sin has ω on top, cos has s.',
    i: [['f', 'f(t)', '', 'e^(−at)', Object.keys(LP)], ['a', 'a', '', 3, 0, 10, 0.1], ['w', 'ω', '', 3, 0.1, 10, 0.1], ['n', 'n (for tⁿ)', '', 2, 0, 6, 1], ['s', 'Evaluate at s', '', 2, 0.1, 10, 0.1]],
    o: [['F', 'F(s)', '', v => LP[v.f](v.a, v.w, v.n)[0]], ['Fs', 'F(s) from the formula', '', v => LP[v.f](v.a, v.w, v.n)[1](v.s)], ['Fi', '∫ f(t)e^(−st) dt (numerical)', '', v => { const g = LP[v.f](v.a, v.w, v.n)[2], T = 60 / v.s, N = 20000; let S = 0; for (let k = 0; k < N; k++) { const t = (k + 0.5) * T / N; S += g(t) * Math.exp(-v.s * t); } return S * T / N; }]],
    plot: { x: ['t', 'Time t', '', 0, 5, ''], y: [['f(t)', (t, v) => LP[v.f](v.a, v.w, v.n)[2](t)]], yl: 'f(t)' },
    ck: [[{ f: 'e^(−at)', a: 3 }, { F: '1/(s + 3)' }, 'Vol 6 p 1719 · table'], [{ f: 'tⁿ', n: 2 }, { F: '2/s³' }, 'Vol 6 p 1719 · table'], [{ f: 'sin ωt', w: 3 }, { F: '3/(s² + 9)' }, 'Vol 6 p 1719 · table'], [{ f: 'e^(−at)', a: 2 }, { F: '1/(s + 2)' }, 'Vol 6 p 1719 · table']] });
  lab(212, { n: 'Z-transform pairs and stability', rf: 'Standard pairs', c: 'Z{aⁿu(n)} = z/(z − a) for |z| > |a|; the pole at z = a must lie inside the unit circle for a stable, decaying sequence. Z{δ(n − k)} = z⁻ᵏ.',
    i: [['ty', 'x(n)', '', 'aⁿu(n)', ['aⁿu(n)', 'n·aⁿu(n)', 'u(n)', 'δ(n − k)']], ['a', 'a', '', 0.5, -2, 2, 0.01], ['k', 'k', '', 2, 0, 10, 1]],
    o: [['X', 'X(z)', '', v => ({ 'aⁿu(n)': `z/(z − ${n3(v.a)})`, 'n·aⁿu(n)': `${n3(v.a)}z/(z − ${n3(v.a)})²`, 'u(n)': 'z/(z − 1)', 'δ(n − k)': `z⁻${SUP(v.k)}`.replace('z⁻⁰', '1') })[v.ty]], ['roc', 'Region of convergence', '', v => v.ty === 'δ(n − k)' ? 'all z (except 0 for k > 0)' : `|z| > ${n3(Math.abs(v.ty === 'u(n)' ? 1 : v.a))}`],
      ['st', 'Sequence', '', v => v.ty === 'δ(n − k)' ? 'finite' : v.ty === 'u(n)' ? 'bounded (pole on |z| = 1)' : Math.abs(v.a) < 1 ? 'decays — stable' : 'grows — unstable']],
    plot: { x: ['n', 'n', '', 0, 15, ''], y: [['x(n) envelope', (n, v) => ({ 'aⁿu(n)': Math.sign(v.a) ** Math.round(n) * Math.abs(v.a) ** n, 'n·aⁿu(n)': n * Math.abs(v.a) ** n, 'u(n)': 1, 'δ(n − k)': Math.abs(n - v.k) < 0.05 ? 1 : 0 })[v.ty]]], yl: 'x(n)' },
    ck: [[{ ty: 'aⁿu(n)', a: 0.5 }, { X: 'z/(z − 0.5)' }, 'Vol 6 p 1721 · table'], [{ ty: 'δ(n − k)', k: 2 }, { X: 'z⁻²' }, 'Vol 6 p 1721 · table']] });

  /* ---------- Fourier ---------- */
  const FS = { 'square ±1': (x, N) => { let s = 0; for (let n = 1; n <= N; n += 2) s += 4 / PI * Math.sin(n * x) / n; return s; }, triangle: (x, N) => { let s = 0; for (let n = 1, k = 0; n <= N; n += 2, k++) s += 8 / (PI * PI) * (k % 2 ? -1 : 1) * Math.cos(n * x) / (n * n); return s; },
    sawtooth: (x, N) => { let s = 0; for (let n = 1; n <= N; n++) s += 2 / PI * (n % 2 ? 1 : -1) * Math.sin(n * x) / n; return s; }, 'half-wave rectified': (x, N) => { let s = 1 / PI + 0.5 * Math.sin(x); for (let k = 1; 2 * k <= N; k++) s -= 2 / PI * Math.cos(2 * k * x) / (4 * k * k - 1); return s; },
    'full-wave rectified': (x, N) => { let s = 2 / PI; for (let k = 1; 2 * k <= N; k++) s -= 4 / PI * Math.cos(2 * k * x) / (4 * k * k - 1); return s; } };
  const IDEAL = { 'square ±1': x => Math.sign(Math.sin(x)), triangle: x => 1 - 2 * Math.abs(((x / PI) % 2 + 2) % 2 - 1), sawtooth: x => ((x / PI + 1) % 2 + 2) % 2 - 1, 'half-wave rectified': x => Math.max(0, Math.sin(x)), 'full-wave rectified': x => Math.abs(Math.sin(x)) };
  lab(201, { n: 'Fourier series — build a waveform from harmonics', rf: 'Fourier series', c: 'Add harmonics one by one and watch the sum approach the wave. Odd symmetry → sines only; half-wave symmetry → odd harmonics only; rectified sines carry a DC term (1/π or 2/π).',
    i: [['w', 'Waveform', '', 'square ±1', Object.keys(FS)], ['N', 'Highest harmonic used', '', 7, 1, 51, 1], ['h', 'Look at harmonic n', '', 2, 1, 20, 1]],
    o: [['dc', 'DC term', '', v => ({ 'square ±1': 0, triangle: 0, sawtooth: 0, 'half-wave rectified': 1 / PI, 'full-wave rectified': 2 / PI })[v.w]],
      ['b1', 'Fundamental amplitude', '', v => ({ 'square ±1': 4 / PI, triangle: 8 / (PI * PI), sawtooth: 2 / PI, 'half-wave rectified': 0.5, 'full-wave rectified': 0 })[v.w]],
      ['hn', 'Amplitude of harmonic n', '', v => { const n = v.h; return { 'square ±1': n % 2 ? 4 / (PI * n) : 0, triangle: n % 2 ? 8 / (PI * PI * n * n) : 0, sawtooth: 2 / (PI * n), 'half-wave rectified': n === 1 ? 0.5 : n % 2 ? 0 : 2 / (PI * (n * n - 1)), 'full-wave rectified': n % 2 ? 0 : 4 / (PI * (n * n - 1)) }[v.w]; }],
      ['has', 'Is harmonic n present?', '', v => v.hn > 1e-12 ? 'yes' : 'no'], ['set', 'Harmonics present', '', v => ({ 'square ±1': 'odd only', triangle: 'odd only', sawtooth: 'all', 'half-wave rectified': 'DC + fundamental + even', 'full-wave rectified': 'DC + even' })[v.w]]],
    plot: { x: ['x', 'Angle x', 'rad', -PI, 3 * PI, ''], y: [['partial sum', (x, v) => FS[v.w](x, v.N)], ['ideal wave', (x, v) => IDEAL[v.w](x)]], yl: 'f(x)' },
    ck: [[{ w: 'square ±1', h: 2 }, { has: 'no', set: 'odd only' }, 'Vol 6 p 1720 · table'], [{ w: 'full-wave rectified' }, { dc: 2 / PI }, 'Vol 6 p 1720 · table'], [{ w: 'square ±1' }, { b1: 4 / PI }, 'Vol 6 p 1720 · table']] });

  /* ---------- Numerical methods ---------- */
  lab(222, { n: 'Newton–Raphson for √c', rf: 'Newton', c: 'xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ); for f = x² − c this is xₙ₊₁ = (xₙ + c/xₙ)/2. The number of correct digits roughly doubles each step.',
    i: [['c', 'c (find √c)', '', 2, 0.01, 1000, 0.01], ['x0', 'Starting guess x₀', '', 1, 0.01, 100, 0.01]],
    o: [['x1', 'x₁', '', v => (v.x0 + v.c / v.x0) / 2], ['x2', 'x₂', '', v => (v.x1 + v.c / v.x1) / 2], ['x3', 'x₃', '', v => (v.x2 + v.c / v.x2) / 2], ['e3', 'Error after 3 steps', '', v => v.x3 - sq(v.c)]],
    plot: { x: ['x', 'x', '', 0, 3, ''], y: [['f(x) = x² − c', (x, v) => x * x - v.c], ['tangent at x₀', (x, v) => v.x0 * v.x0 - v.c + 2 * v.x0 * (x - v.x0)]], yl: 'f(x)', mark: v => v.x1 },
    ck: [[{ c: 2, x0: 1 }, { x1: 1.5, x2: 1.4167, x3: 1.4142 }, 'Vol 6 p 1722 · table'], [{ c: 3, x0: 2 }, { x1: 1.75 }, 'Vol 6 p 1722 · table']] });
  lab(222, { n: 'Which integration rule applies', rf: 'Simpson', c: 'Trapezoidal works for any number of strips n (error O(h²)); Simpson ⅓ needs n even, Simpson ⅜ needs n a multiple of 3 (both O(h⁴)).',
    i: [['n', 'Number of strips (intervals) n', '', 6, 1, 60, 1]],
    o: [['r', 'Simpson rules that apply', '', v => v.n % 2 === 0 && v.n % 3 === 0 ? 'Simpson 1/3 and 3/8' : v.n % 2 === 0 ? 'Simpson 1/3' : v.n % 3 === 0 ? 'Simpson 3/8' : 'neither (use trapezoidal)'], ['pts', 'Ordinates needed', '', v => v.n + 1]],
    ck: [[{ n: 6 }, { r: 'Simpson 1/3 and 3/8' }, 'Vol 6 p 1722 · table']] });

  /* ---------- Probability & statistics ---------- */
  lab(235, { n: 'Normal distribution — areas', rf: 'Normal distribution', c: 'z = (x − μ)/σ. Within ±1σ: 68.27 %, ±1.96σ: 95 %, ±2σ: 95.45 %, ±2.576σ: 99 %, ±3σ: 99.73 %.',
    i: [['mu', 'Mean μ', '', 50, -100, 1000, 0.1], ['s', 'Standard deviation σ', '', 10, 0.01, 100, 0.01], ['x1', 'Lower limit x₁', '', 40, -1000, 1000, 0.01], ['x2', 'Upper limit x₂', '', 60, -1000, 1000, 0.01]],
    o: [['z1', 'z₁', '', v => (v.x1 - v.mu) / v.s], ['z2', 'z₂', '', v => (v.x2 - v.mu) / v.s], ['P', 'P(x₁ < x < x₂)', '%', v => (Phi(v.z2) - Phi(v.z1)) * 100], ['up', 'P(x > x₂)', '%', v => (1 - Phi(v.z2)) * 100]],
    plot: { x: ['x', 'x (in σ from the mean)', '', -4, 4, ''], y: [['density', (z, v) => Math.exp(-z * z / 2) / sq(2 * PI)]], yl: 'Standard normal density', mark: v => (v.x2 - v.mu) / v.s },
    ck: [[{ mu: 50, s: 10, x1: 40, x2: 60 }, { P: 68.3 }, 'Vol 6 p 1723 · table'], [{ mu: 0, s: 1, x1: -1.96, x2: 1.96 }, { P: 95 }, 'Vol 6 p 1723 · table'], [{ mu: 0, s: 1, x1: -3, x2: 3 }, { P: 99.73 }, 'Vol 6 p 1723 · table'], [{ mu: 0, s: 1, x1: -2.576, x2: 2.576 }, { P: 99 }, 'Vol 6 p 1723 · table'], [{ mu: 60, s: 5, x1: 55, x2: 65 }, { P: 68.3 }, 'Vol 6 p 1723 · table'], [{ mu: 0, s: 1, x2: 1.96 }, { up: 2.5 }, 'Vol 6 p 1723 · table']] });
  lab(235, { n: 'Binomial and Poisson probabilities', rf: 'Binomial', c: 'Binomial P(x) = ⁿCₓpˣqⁿ⁻ˣ (mean np, variance npq). Poisson P(x) = e^(−λ)λˣ/x! (mean = variance = λ), the limit for large n, small p.',
    i: [['n', 'Trials n', '', 4, 1, 60, 1], ['p', 'Success probability p', '', 0.5, 0, 1, 0.01], ['x', 'Successes x', '', 2, 0, 60, 1], ['lam', 'Poisson mean λ', '', 2, 0.01, 30, 0.01]],
    o: [['Pb', 'Binomial P(x)', '', v => v.x > v.n ? 0 : C(v.n, v.x) * v.p ** v.x * (1 - v.p) ** (v.n - v.x)], ['mb', 'Binomial mean np', '', v => v.n * v.p], ['vb', 'Binomial variance npq', '', v => v.n * v.p * (1 - v.p)],
      ['P0', 'Poisson P(0)', '', v => Math.exp(-v.lam)], ['P1', 'Poisson P(1)', '', v => Math.exp(-v.lam) * v.lam], ['P2', 'Poisson P(2)', '', v => Math.exp(-v.lam) * v.lam ** 2 / 2], ['Px', 'Poisson P(x)', '', v => Math.exp(-v.lam) * v.lam ** v.x / fact(v.x)], ['Pg', 'Poisson P(x ≥ 1)', '', v => 1 - v.P0]],
    ck: [[{ n: 4, p: 0.5, x: 2 }, { Pb: 0.375 }, 'Vol 6 p 1725 · table'], [{ lam: 0.5 }, { P0: 0.6065, P1: 0.3033, P2: 0.0758, Pg: 0.3935 }, 'Vol 6 p 1725 · table'], [{ lam: 1 }, { P0: 0.3679, P1: 0.3679, P2: 0.1839, Pg: 0.6321 }, 'Vol 6 p 1725 · table'], [{ lam: 2 }, { P0: 0.1353, P1: 0.2707, P2: 0.2707, Pg: 0.8647 }, 'Vol 6 p 1725 · table'], [{ lam: 3 }, { P0: 0.0498, P1: 0.1494, P2: 0.224, Pg: 0.9502 }, 'Vol 6 p 1725 · table']] });
})();
