# CoDA-Synth

Stylometric detection of LLM-rewritten dark-web documents using sparse TF–IDF features. Browser research lab: generate a synthetic corpus, fit a sparse linear detector, inspect n-grams, and export a methods report. Public/synthetic corpora only — no live dark-web crawl.

## Stack

- React 19 + TanStack Start + Vite
- Tailwind CSS
- In-browser pipeline (no GPU): hashed TF–IDF, L1/elastic-net SGD, bootstrap AUROC

## Run locally

```bash
npm install
npm run dev
```

App: [http://localhost:8080](http://localhost:8080)

```bash
npm run typecheck
npm test
npm run build
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Lab home, pipeline status |
| `/corpus` | Seed, mix, rewrite, train/test split |
| `/detect` | Fit sparse detector, metrics |
| `/features` | Ranked n-grams, document overlay |
| `/results` | ROC, reliability, error slices |
| `/method` | Threat model, leakage, limitations |
| `/report` | Copyable methods + JSON export |

## Share cards

- `public/og.jpg` — 1200×630 link preview
- `public/x-banner.jpg` — 1200×264 X feed card
- `public/favicon.svg`

## Note

This is a **demo lab**. The rewrite engine is a rule-based stylometric perturbation, not a hosted LLM. Scores are for exploring sparse stylometry, not operational attribution.
