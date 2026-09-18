# CoDA-Synth

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Rishabh--bgp%2Fcoda--synth-181717?logo=github)](https://github.com/Rishabh-bgp/coda-synth)

**A research lab that asks a simple question:**  
*If someone takes a dark-web document and asks an AI to rewrite it, can a classic (non-ChatGPT) computer model still tell the original human writing from the AI rewrite — just by looking at word patterns and writing style?*

**Short name:** CoDA-Synth  
**Full title:** Stylometric Detection of LLM-Rewritten Dark-Web Documents with Sparse Features

**Research use only. Public / fake (synthetic) text only. Do not scrape live dark-web sites.**

| What | Where |
| --- | --- |
| Full methods chapter (plain English + every Colab cell) | [docs/GUIDE.md](docs/GUIDE.md) |
| Ready-to-run Colab notebook | [public/coda_synth_colab.ipynb](public/coda_synth_colab.ipynb) |
| Original methods PDF | [attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf](attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf) |
| Source zip | [public/coda-synth-github.zip](public/coda-synth-github.zip) · [always-current GitHub archive](https://github.com/Rishabh-bgp/coda-synth/archive/refs/heads/main.zip) |
| How to cite | [CITATION.cff](CITATION.cff) |
| License | [MIT](LICENSE) · © 2026 Er. Rishabh Aryan |

---

## Read this first if you are new

You do **not** need to already know machine learning.

Imagine two copies of the same homework:

1. The student’s own messy draft (slang, short sentences, typos).
2. The same facts, rewritten by ChatGPT so it sounds smoother.

The *facts* are the same. The *voice* is different. CoDA-Synth builds a detector that looks at **voice**, not meaning.

It uses old-school tools (word counts, character patterns, a linear classifier) — not a giant neural net. Think “fingerprint of how someone writes,” not “a robot that understands the page.”

There are **two jobs** at once:

| Job | Everyday meaning | Fancy name |
| --- | --- | --- |
| **A. Source** | Was this written by a human, or rewritten by an AI? | human vs LLM |
| **B. Topic** | What is the page about? (drugs, crypto, hacking, …) | 10-way topic classification |

We **never** download live dark-web pages. We only use text that researchers already published, or a fake practice copy of that text in this website.

The long version — glossary, all four research questions, cleaning rules, rewrite prompt, feature tables, Colab cells, week plan, and the report outline — is in **[docs/GUIDE.md](docs/GUIDE.md)**. It is written so a high-school student can follow it.

---

## Hard rules (ethics lock)

- This is **research**, not a police tool. Do not use it to hunt real people.
- Use text that was **already published for research**. Cite the authors.
- **Do not scrape** live `.onion` / dark-web sites.
- **Do not try to unmask** vendors, wallets, or victims.
- **Do not write new crime how-tos.** Rewrites must keep the same facts.
- If a page looks like CSAM or trafficking: **drop that row and stop looking**.
- Do **not** republish the raw CoDA dump.
- This project is a **proxy benchmark**: a practice exam, not the real street.

---

## The four research questions

| ID | In plain English |
| --- | --- |
| **RQ1** | If we look at words, letter patterns, and writing style, can we tell original vs rewritten? |
| **RQ2** | Do the 11 style numbers actually help, or are word counts enough? |
| **RQ3** | If we train on a mix of human + AI text, does topic-guessing get worse? |
| **RQ4** | If we train on one AI’s rewrites, do we still catch a *different* AI’s rewrites? |

---

## This website (the browser lab)

This GitHub repo is a **clickable version** of the Colab guide. It does **not** include the real CoDA files (those are gated). It builds a **proxy corpus**: fake listings that use CoDA’s ten topic names and the same kind of masked IDs.

Then, in your browser, it:

1. Rewrites half of the document IDs with two different “AI voices” (`polish-A`, `rhythm-B`).
2. Splits by original ID so pairs never leak (70 / 15 / 15).
3. Fits word TF–IDF + character n-grams + 11 style features.
4. Trains LinearSVC and logistic regression in a Web Worker (so the page does not freeze).
5. Answers RQ1–RQ4 and lets you export a methods report.

### Run it on your computer

```bash
git clone https://github.com/Rishabh-bgp/coda-synth.git
cd coda-synth
npm install
npm run dev
```

Then open http://localhost:8080

```bash
npm run typecheck
npm test
npm run build
```

### Pages in the lab

| Address | What you will see |
| --- | --- |
| `/` | Home: the four RQ answers and a small ablation chart after training |
| `/corpus` | The proxy table, human/AI pair view, CSV download |
| `/method` | Each pipeline step, why we split on IDs, the rewrite prompt |
| `/features` | Average style numbers, which n-grams the model trusts |
| `/results` | Ablation bars, confusion matrices, ROC, RQ3 and RQ4 |
| `/detect` | Paste a paragraph and probe it (optional Grok rewrite) |
| `/report` | A filled methods chapter you can copy or download as markdown |

### Stack

React 19, TanStack Start, Vite, Tailwind CSS, in-browser sparse TF–IDF + LinearSVC (hinge) / logistic SGD, Zustand, Recharts. Optional user-clicked Grok paraphrase (never automatic).

Python twin of the same recipe: [`src/lib/coda/`](src/lib/coda/) maps onto sklearn `TfidfVectorizer`, `StandardScaler`, `LinearSVC`, and an id-safe split. Details in [docs/GUIDE.md](docs/GUIDE.md).

**Important:** the default rewriter in this website is a **rule-based style tweaker** (plus an optional Grok call if you click it). Scores here are for learning the pipeline, not for accusing real posts.

---

## Data (public only)

Preferred corpus: **CoDA** (Jin et al., NAACL 2022), 10,000 docs, 10 topics, Hugging Face `s2w-ai/CoDA` (research request). Backup: DUTA / DUTA-10K. This repo does **not** ship CoDA.

Topics used here: Arms, Crypto, Drugs, Electronics, Financial, Gambling, Hacking, Pornography, Violence, Others.

---

## What you should hand in

- A cleaned table: `id`, `text`, `topic`, `source` (`human` or `llm`), `split`, `generator`
- Two trained classic models (source + topic) and a TF–IDF-only ablation
- Source F1 / AUC, topic weighted F1, confusion matrices, top coefficients
- A short report — [docs/GUIDE.md](docs/GUIDE.md) is the methods chapter; `/report` fills it from a live run
- Optional: cross-generator stress test (RQ4)

---

## Papers to cite

- Jin, Y., Jang, E., Lee, Y., Shin, S., & Chung, J.-W. (2022). Shedding New Light on the Language of the Dark Web. NAACL.
- Al-Nabki, M. W., Fidalgo, E., Alegre, E., & Fernández-Robles, L. (2017/2019). DUTA / DUTA-10K.
- Jin et al. (2023). DarkBERT. ACL. Related work — you are **not** required to run DarkBERT.

Software citation: [CITATION.cff](CITATION.cff).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please keep the ethics lock.

1. Fork and branch from `main`.
2. Prefer the in-browser sparse TF–IDF / LinearSVC pipeline. If you add a Python path, update the Colab notebook too.
3. Run `npm run typecheck` and `npm test`.
4. In the pull request, say which research question or lab page the change helps.

---

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Er. Rishabh Aryan.

**CoDA itself is not MIT-licensed.** Request it from Hugging Face under its research terms. Do not commit the raw dump.

---

*Scope is frozen: public data, traditional ML, two tasks, Colab + this browser lab. Full walkthrough: [docs/GUIDE.md](docs/GUIDE.md).*
