// apply the saved theme (light, comfort or dark) before the page paints
try { const t = localStorage.getItem('ae-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
