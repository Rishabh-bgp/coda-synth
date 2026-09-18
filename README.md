# CoDA-Synth

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Rishabh--bgp%2Fcoda--synth-181717?logo=github)](https://github.com/Rishabh-bgp/coda-synth)

Stylometric detection of LLM-rewritten dark-web documents using sparse TF–IDF features.

Browser research lab: generate a synthetic proxy corpus, fit a sparse linear detector, inspect n-grams, and export a methods report. **Public / synthetic corpora only — no live dark-web crawl.**

Repository: [github.com/Rishabh-bgp/coda-synth](https://github.com/Rishabh-bgp/coda-synth)

Colab notebook: [`public/coda_synth_colab.ipynb`](public/coda_synth_colab.ipynb)

## Ethics lock

- Use corpora released for research. Cite Jin et al. (2022) / Al-Nabki et al. when you use their text.
- Do not scrape live hidden services. Do not unmask vendors, wallets, or victims.
- Synthesis paraphrases existing public proxy text — no new criminal how-to.
- This is a **proxy benchmark**, not an operational detector.

## What it implements

The traditional-ML pipeline from the CoDA-Synth project guide:

1. Load a public-style proxy with CoDA’s ten topic names and masked identifiers
2. Paraphrase half of document ids (two generators: polish-A, rhythm-B)
3. **Id-safe split** (70 / 15 / 15) so a document and its rewrite never leak
4. Word TF–IDF (1–2) + character n-grams (3–5, `char_wb`) + 11 stylometric features
5. LinearSVC (hinge) + logistic regression
6. Ablations and research questions RQ1–RQ4

## Stack

- React 19 + TanStack Start + Vite + Tailwind CSS
- In-browser pipeline (Web Worker): sparse TF–IDF, LinearSVC / logistic SGD
- Optional user-initiated paraphrase via the xAI API (`XAI_API_KEY`)

## Run locally

```bash
git clone https://github.com/Rishabh-bgp/coda-synth.git
cd coda-synth
npm install
npm run dev
```

Then open [http://localhost:8080](http://localhost:8080).

```bash
npm run typecheck
npm test
npm run build
```

Optional Colab path: open [`public/coda_synth_colab.ipynb`](public/coda_synth_colab.ipynb). The methods PDF lives at [`attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf`](attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf).

## Routes

| Path | Page |
| --- | --- |
| `/` | Lab home, RQ answers, ablation |
| `/corpus` | Proxy table, pair view, CSV |
| `/method` | Pipeline stages, leakage, rewrite prompt |
| `/features` | Stylo means, top coefficients |
| `/results` | Ablation, confusion, ROC, RQ3/RQ4 |
| `/detect` | Live probe + optional Grok paraphrase |
| `/report` | Filled methods chapter, markdown export |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please keep the ethics lock.

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Er. Rishabh Aryan.

## Citations

- Jin, Y., Jang, E., Lee, Y., Shin, S., & Chung, J.-W. (2022). Shedding New Light on the Language of the Dark Web. NAACL.
- Al-Nabki, M. W., Fidalgo, E., Alegre, E., & Fernández-Robles, L. (2017/2019). DUTA / DUTA-10K.
- Jin et al. (2023). DarkBERT. ACL. Related work — this lab does not run DarkBERT.

Software citation: see [`CITATION.cff`](CITATION.cff).

## Note

The in-lab rewrite engine is a rule-based stylometric perturbation (plus an optional user-initiated Grok paraphrase). Scores are for exploring sparse stylometry, not operational attribution.
