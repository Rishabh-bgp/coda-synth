> Part 1 of 3 — [methods index](GUIDE.md) · [part 2](02-method.md) · [part 3](03-colab-and-report.md)

# CoDA-Synth

**A research lab that asks a simple question:**  
*If someone takes a dark-web document and asks an AI to rewrite it, can a classic (non-ChatGPT) computer model still tell the original human writing from the AI rewrite — just by looking at word patterns and writing style?*

**Research use only. Public / fake (synthetic) text only. Do not scrape live dark-web sites.**

## Read this first if you are new

You do **not** need to already know machine learning. This guide is written so a high-school student can follow the idea, then copy the real code later.

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

Continue with [part 2](02-method.md) (recipe and features) and [part 3](03-colab-and-report.md) (Colab cells).

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

## Hard rules (ethics lock)

Read these even if you skip everything else.

- This is **research**, not a police tool. Do not use it to hunt real people.
- Use text that was **already published for research**. Cite the authors.
- **Do not scrape** live `.onion` / dark-web sites. Do not collect new hidden-service pages.
- **Do not try to unmask** vendors, wallets, or victims. If CoDA already hid a name behind a mask token, leave the mask alone.
- **Do not write new crime how-tos.** Rewrites must keep the same facts, not invent products, prices, or instructions.
- If a page looks like CSAM or trafficking: **drop that row and stop looking**. CoDA’s authors already filtered media.
- Do **not** republish the raw CoDA dump. Keep it on your private Drive.
- This project is a **proxy benchmark**: a practice exam, not the real street.

---

## What you are building

People who post on underground markets have started using language models to polish listings and forum posts. Most published papers only ask “what is this page *about*?” (drugs, money, hacking…).

This project asks a second question you can answer with **public** data:

> Can cheap writing-style features tell a human-authored dark-web document from an AI paraphrase of the **same** document — without training a giant transformer?

**Frozen scope**

- Public dark-web text only (CoDA or DUTA). No live Tor crawling.
- Two tasks: (A) human vs AI rewrite, (B) original 10-topic classification.
- Sparse features: word TF–IDF, character n-grams, stylometry.
- Classic models: LinearSVC, logistic regression, and (in Colab, if you have time) Random Forest / XGBoost.
- You can run it in **Google Colab** (Python) or in **this website** (JavaScript in your browser).

Suggested paper / slide title:

> Stylometric Detection of LLM-Rewritten Dark-Web Documents with Sparse Features

---

## The four research questions

| ID | In researcher-speak | In plain English |
| --- | --- | --- |
| **RQ1** | Can TF–IDF + character n-grams + cheap stylometry separate human CoDA/DUTA text from LLM rewrites of the same documents? | If we look at words, letter patterns, and writing style, can we tell original vs rewritten? |
| **RQ2** | Does adding stylometry improve source detection over TF–IDF alone? | Do the 11 style numbers actually help, or are word counts enough? |
| **RQ3** | Does source-aware training hurt or help the original 10-way topic task? | If we train on a mix of human + AI text, does topic-guessing get worse? |
| **RQ4** | Does a detector trained on Model-A rewrites transfer to Model-B rewrites? | If we train on one AI’s rewrites, do we still catch a *different* AI’s rewrites? |

If source-F1 later hits **0.99**, the rewrites are probably too neat (the AI “cleaned” the text too much). Mix two generators. That also gives you RQ4 for free. This lab does that with `polish-A` and `rhythm-B`.

---

## This website (the browser lab)

This GitHub repo is a **clickable version** of the Colab guide. It does **not** include the real CoDA files (those are gated). Instead it builds a **proxy corpus**: fake listings that use CoDA’s ten topic names and the same kind of masked IDs.

Then, in your browser, it:

1. Rewrites half of the document IDs with two different “AI voices.”
2. Splits by original ID so pairs never leak.
3. Fits word TF–IDF + character n-grams + 11 style features.
4. Trains LinearSVC and logistic regression in a **Web Worker** (so the page does not freeze).
5. Answers RQ1–RQ4 and lets you export a methods report.

### What it is built with

- React 19, TanStack Start, Vite, Tailwind CSS
- In-browser sparse TF–IDF + LinearSVC (hinge) / logistic SGD
- Zustand for lab state; charts for ablation, confusion, ROC
- Optional user-clicked Grok paraphrase (only if an API key exists; never automatic)

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

### Colab Python → this lab’s TypeScript

| Guide (Python / sklearn) | File in this repo |
| --- | --- |
| Word and character `TfidfVectorizer` | [`src/lib/coda/tfidf.ts`](../src/lib/coda/tfidf.ts) |
| 11 style numbers + `StandardScaler` | [`src/lib/coda/stylo.ts`](../src/lib/coda/stylo.ts), [`src/lib/coda/sparse.ts`](../src/lib/coda/sparse.ts) |
| Stacking the three feature blocks | [`src/lib/coda/sparse.ts`](../src/lib/coda/sparse.ts) |
| Split on `doc_id` 70 / 15 / 15 | [`src/lib/coda/split.ts`](../src/lib/coda/split.ts) |
| LinearSVC + logistic regression | [`src/lib/coda/linear.ts`](../src/lib/coda/linear.ts) |
| Ablations and RQ1–RQ4 | [`src/lib/coda/pipeline.ts`](../src/lib/coda/pipeline.ts) |
| Proxy texts + two rewriters | [`src/lib/coda/corpus.ts`](../src/lib/coda/corpus.ts), [`src/lib/coda/rewrite.ts`](../src/lib/coda/rewrite.ts) |

**Important:** the default rewriter in this website is a **rule-based style tweaker** (plus an optional Grok call if you click it). Scores here are for learning the pipeline, not for accusing real posts.

---

## What you should hand in (deliverables)

- A cleaned table: `id`, `text`, `topic`, `source` (`human` or `llm`), `split`, `generator`
- Two trained classic models (source + topic) **and** a TF–IDF-only ablation
- Source F1 and AUC; topic weighted F1; confusion matrices; top coefficients
- A short report. The lab’s `/report` page fills it from the live run.
- Optional: the cross-generator stress test (RQ4)

---

## Where the text comes from

**Preferred:** CoDA — Comprehensive Darkweb Annotations. About 10,000 documents, 10 topics. Jin et al., NAACL 2022. On Hugging Face as [`s2w-ai/CoDA`](https://huggingface.co/datasets/s2w-ai/CoDA). You request access with an institutional email, a purpose statement, and ACM ethics. Sensitive strings are already masked.

**Backup:** DUTA / DUTA-10K (Al-Nabki et al.) — older Tor hidden-service pages, coarser labels. Use it if CoDA access is delayed. **Do not mix CoDA labels and DUTA labels in one classifier** unless you write a mapping table.

### Table 1. Allowed data sources. Prefer CoDA.

| Source | Size (about) | Labels | How you get it |
| --- | --- | --- | --- |
| CoDA (Jin et al. 2022) | 10,000 docs | 10 topics | Hugging Face request: `s2w-ai/CoDA` |
| DUTA-10K | ~10k domains | several activity classes | authors / older papers |
| Closed-market CSVs on GitHub | varies | title, category | extra *text* only, optional |

**CoDA’s ten topics (typical):** Arms, Crypto, Drugs, Electronics, Financial, Gambling, Hacking, Pornography, Violence, Others.

After you load the real files, **check the exact strings**. Do not invent extra classes. This website uses those ten names on the proxy corpus.

This repo **does not ship CoDA**. The website generates a synthetic proxy so anyone can click through the pipeline without the gated dump.

---

## Ethics and the law, in full

- Use corpora released for research. Cite Jin et al. (2022) / Al-Nabki et al. when you use their text.
- Do not try to unmask vendors, wallets, or victims. Keep CoDA masks intact.
- Do not scrape live `.onion` markets or forums for this project.
- The rewrite prompt must paraphrase **existing public text only** — no new criminal how-to, no new product invention.
- Store CoDA on your **private** Google Drive. Do not put the raw dump on GitHub.
- If a document looks like CSAM or trafficking, drop the row and do not inspect further. CoDA authors already filtered media.

Next: [part 2 — recipe, features, classifiers](02-method.md).
