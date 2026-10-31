# TNEB AE (EEE) Study Site

A study website built from the TNEB AE (EEE) Complete Book and Question Book: every topic's chapter notes and
formulas, all 2,620 past questions with full solutions, GATE sums, the Transformer simulator, a timed mock test and
a progress console that shows which topics and sub-topics to improve.

Open it at **https://saravanan1604.github.io/tneb-ae-study/** — on a phone, use the browser menu → *Add to Home
screen* to install it as an app. It works offline (pages you open are kept; the home page has a "save everything"
button) and has a dark-mode button.

- Static files only, no build step: `index.html`, `app.js`, `sw.js` (offline), `data/` (topic data), `img/` (book pictures),
  `sim/transformers/` (the Transformers page with the simulator).
- Private by design: no accounts, no tracking, no requests to other servers except Google Fonts. Progress stays in
  the browser on your device. A strict Content-Security-Policy allows only the site's own scripts. Search engines are
  asked not to index it (`robots.txt`, `noindex`).
