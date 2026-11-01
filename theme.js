// apply the saved theme before the page paints. Lavender is the default; readers who were on the old default (light)
// are moved to lavender once — choosing Classic light again afterwards is remembered.
try {
  let t = localStorage.getItem('ae-theme');
  if (!localStorage.getItem('ae-theme-v2')) { if (!t || t === 'light') t = 'lavender'; localStorage.setItem('ae-theme', t); localStorage.setItem('ae-theme-v2', '1'); }
  document.documentElement.dataset.theme = t || 'lavender';
} catch (e) { document.documentElement.dataset.theme = 'lavender'; }
