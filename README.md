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
| Code on GitHub | [github.com/Rishabh-bgp/coda-synth](https://github.com/Rishabh-bgp/coda-synth) |
| Ready-to-run Colab notebook | [`public/coda_synth_colab.ipynb`](public/coda_synth_colab.ipynb) |
| Original methods PDF | [`attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf`](attachments/CoDA-Synth_Traditional_ML_Colab_Guide.pdf) |
| Source zip | [`public/coda-synth-github.zip`](public/coda-synth-github.zip) |
| How to cite this software | [`CITATION.cff`](CITATION.cff) |
| License | [MIT](LICENSE) · © 2026 Er. Rishabh Aryan |

---

## Read this first if you are new

You do **not** need to already know machine learning. This README is written so a high-school student can follow the idea, then copy the real code later.

Imagine two copies of the same homework:

1. The student’s own messy draft (slang, short sentences, typos).
2. The same facts, rewritten by ChatGPT so it sounds smoother.

The *facts* are the same. The *voice* is different. CoDA-Synth builds a detector that looks at **voice**, not meaning.

It does this with old-school tools (word counts, character patterns, a linear classifier) — not a giant neural net. Think “fingerprint of how someone writes,” not “a robot that understands the page.”

There are **two jobs** at once:

| Job | Everyday meaning | Fancy name |
| --- | --- | --- |
| **A. Source** | Was this written by a human, or rewritten by an AI? | human vs LLM |
| **B. Topic** | What is the page about? (drugs, crypto, hacking, …) | 10-way topic classification |

We also **never** download live dark-web pages. We only use text that researchers already published (or a fake “practice” copy of that text in this website).

---

## Words you will see a lot

| Word | Plain meaning |
| --- | --- |
| **Corpus** | A big pile of texts used for research. |
| **Document / doc** | One page or listing in that pile. |
| **CoDA** | A real research dataset of 10,000 already-cleaned dark-web documents (Jin et al., 2022). You must request it. We do **not** ship it here. |
| **DUTA** | An older backup dataset if CoDA access is slow. |
| **Proxy corpus** | A *fake but realistic* practice dataset this website generates so you can run the lab without CoDA. |
| **LLM** | A large language model — ChatGPT-style AI. |
| **Rewrite / paraphrase** | Same facts, different wording. |
| **Stylometry** | Measuring *how* someone writes (sentence length, punctuation, rare words), not *what* they say. |
| **TF–IDF** | A score for “this word/phrase is important in this document, and not everywhere.” |
| **n-gram** | A chunk of *n* things in a row. Word 1–2 grams = single words and two-word phrases. Char 3–5 grams = 3 to 5 letters, including spaces. |
| **Sparse features** | Most numbers are zeros (a document uses only a tiny slice of all possible n-grams). Cheap and fast. |
| **LinearSVC** | A classic “draw a straight line between two classes” model. Our main detector. |
| **Logistic regression** | Similar, but it also gives a *probability* (useful for AUC). |
| **F1** | A score from 0 to 1 that balances “did we catch the AI rewrites?” and “did we wrongly accuse human text?” Higher is better. |
| **AUC** | Another 0–1 score: if you pick one human text and one AI text at random, how often does the model rank the AI one as “more AI”? 0.5 = coin flip, 1.0 = perfect. |
| **Id-safe split** | We put a document *and* its rewrite in the same bucket (train or test), so the model cannot cheat by memorising the facts. |
| **Ablation** | Turn pieces of the recipe off, one at a time, to see which piece actually helps. |
| **RQ** | Research question. We have four: RQ1–RQ4. |
| **Colab** | Google Colab — free Python notebooks in the browser. The PDF was written for Colab. This repo also runs the same idea as a website. |

---

## Table of contents

1. [Hard rules (ethics lock)](#hard-rules-ethics-lock)
2. [What you are building](#what-you-are-building)
3. [The four research questions](#the-four-research-questions)
4. [This website (the browser lab)](#this-website-the-browser-lab)
5. [What you should hand in (deliverables)](#what-you-should-hand-in-deliverables)
6. [Where the text comes from](#where-the-text-comes-from)
7. [Ethics and the law, in full](#ethics-and-the-law-in-full)
8. [The recipe, from start to finish](#the-recipe-from-start-to-finish)
9. [Cleaning the text](#cleaning-the-text)
10. [How we make the “AI-written” class](#how-we-make-the-ai-written-class)
11. [How we split train / val / test (no cheating)](#how-we-split-train--val--test-no-cheating)
12. [What the computer actually looks at](#what-the-computer-actually-looks-at)
13. [The classifiers](#the-classifiers)
14. [How we score the models](#how-we-score-the-models)
15. [Google Colab setup](#google-colab-setup)
16. [Colab: rewrite half the documents](#colab-rewrite-half-the-documents)
17. [Colab: id-safe split](#colab-id-safe-split)
18. [Colab: features and training](#colab-features-and-training)
19. [Colab: plots](#colab-plots)
20. [A six-day plan](#a-six-day-plan)
21. [What to write in the report](#what-to-write-in-the-report)
22. [Honest limits](#honest-limits)
23. [Papers to cite](#papers-to-cite)
24. [Colab checklist before you submit](#colab-checklist-before-you-submit)
25. [One-paragraph pitch](#one-paragraph-pitch)
26. [Contributing](#contributing)
27. [License](#license)
