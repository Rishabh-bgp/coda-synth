# CoDA-Synth

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Rishabh--bgp%2Fcoda--synth-181717?logo=github)](https://github.com/Rishabh-bgp/coda-synth)

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

Continue with [part 2](#the-recipe-from-start-to-finish) (recipe and features) and [part 3](#google-colab-setup) (Colab cells).

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

### Colab Python → this lab’s TypeScript

| Guide (Python / sklearn) | File in this repo |
| --- | --- |
| Word and character `TfidfVectorizer` | [`src/lib/coda/tfidf.ts`](src/lib/coda/tfidf.ts) |
| 11 style numbers + `StandardScaler` | [`src/lib/coda/stylo.ts`](src/lib/coda/stylo.ts), [`src/lib/coda/sparse.ts`](src/lib/coda/sparse.ts) |
| Stacking the three feature blocks | [`src/lib/coda/sparse.ts`](src/lib/coda/sparse.ts) |
| Split on `doc_id` 70 / 15 / 15 | [`src/lib/coda/split.ts`](src/lib/coda/split.ts) |
| LinearSVC + logistic regression | [`src/lib/coda/linear.ts`](src/lib/coda/linear.ts) |
| Ablations and RQ1–RQ4 | [`src/lib/coda/pipeline.ts`](src/lib/coda/pipeline.ts) |
| Proxy texts + two rewriters | [`src/lib/coda/corpus.ts`](src/lib/coda/corpus.ts), [`src/lib/coda/rewrite.ts`](src/lib/coda/rewrite.ts) |

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

Next: [part 2 — recipe, features, classifiers](#the-recipe-from-start-to-finish).

## The recipe, from start to finish

Think of it as a kitchen line:

1. **Load** public documents.
2. **Clean** HTML and empty junk.
3. **Rewrite** a random half of IDs (same facts, new voice).
4. **Split** by original ID (70% train, 15% val, 15% test).
5. **Extract features** using *only* the train set to learn the vocabulary.
6. **Train** two classifiers (source + topic).
7. **Ablate** (try weaker feature sets).
8. **Write** results.

### Table 2. Pipeline stages

| Stage | What you get | Tool in Colab | This website |
| :--- | :--- | :--- | :--- |
| **Load + clean** | `raw.csv` | pandas, regex | proxy generator + HTML/whitespace strip |
| **Synthesize rewrites** | `coda_synth.csv` | transformers or an allowed API | two rewriters: `polish-A`, `rhythm-B` |
| **Id-safe split** | train / val / test | sklearn `train_test_split` on ids | same 70 / 15 / 15 on `doc_id` |
| **Features** | sparse matrix + style numbers | `TfidfVectorizer`, `hstack` | word + char_wb + scaled stylo |
| **Classify** | two models | LinearSVC, LogisticRegression, XGB | LinearSVC hinge + logistic SGD |
| **Evaluate** | reports + plots | sklearn.metrics, matplotlib | ablation, confusion, ROC, RQ3/RQ4 |

**Train / val / test in one sentence:** Train is the textbook, val is the practice quiz you use to pick settings, and test is the real exam you only take once.

## Cleaning the text

- Strip leftover HTML tags and squash extra spaces.
- **Do not lowercase everything** if you want “how much SHOUTING” as a feature. Keep a raw copy and an analysis copy.
- Keep slang, typos, and vendor voice. Those are clues for both jobs.
- Drop documents with fewer than about **40 words**.
- Leave CoDA mask tokens (fake name placeholders) as they are.
- Columns to keep: `doc_id`, `text`, `topic`. Add `source` after rewriting.

---

## How we make the “AI-written” class

We do **not** have a labelled pile of “jailbroken market ads written by underground AIs.” That is fine.

We build a **controlled contrast**: same facts, different writer.

1. List every unique `doc_id`.
2. Randomly mark **half** of those IDs for rewriting (seed 42, so it is repeatable).
3. Keep the original row as `source=human`, `generator=original`.
4. For marked IDs, add a second row: same topic, new text, `source=llm`, `generator=<model name>`.

### The rewrite prompt (use this wording)

```
Rewrite the following document in a different wording and sentence rhythm.
Keep the same facts, names that are already masked, and the same topic.
Do not add products, prices, instructions, or new claims.
Do not mention that you are an AI.

DOCUMENT:
{text}
```

Why this prompt is strict: we want a **style** change, not a new crime manual.

**Colab reality check:** a 7-billion-parameter model on a free T4 GPU is slow but okay for a few thousand short docs. If the GPU is gone, use a small instruct model, or rewrite only 1,500 docs for a pilot and **say the sample size honestly**.

**This website:** default rewrite is a rule-based style perturbation with two generators (`polish-A`, `rhythm-B`). The `/detect` page can optionally call Grok if you click it.

After rewriting, print two side-by-side examples. If the model refuses or returns an empty page, retry once; if it still fails, drop that pair.

---

## How we split train / val / test (no cheating)

A document and its rewrite share **content**. If one sits in train and the other in test, the model can “cheat” by remembering topic words (“this page said *bitcoin wallet*”) instead of learning writing style.

**Fix:** split on the original `doc_id` first (70 / 15 / 15), **stratify by topic** (so every topic appears in every bucket), then attach **both** the human row and the AI row to the same bucket.

Analogy: if you are testing whether you can spot a rewritten essay, you must not have seen the original essay in class.

---

## What the computer actually looks at

No deep learning here. Three stacked blocks of numbers.

### 9.1 Word TF–IDF

sklearn settings:

`lowercase=True`, `ngram_range=(1, 2)`, `min_df=3`, `max_df=0.9`, `max_features=50_000`, `sublinear_tf=True`.

**Fit on train texts only.** Then *transform* val and test with the same vocabulary. If you fit on the test set, you have cheated.

Plain meaning:

- `(1, 2)` = single words and two-word phrases (`wallet`, `escrow`, `good vendor`).
- `min_df=3` = ignore words that appear in fewer than 3 documents (too rare, probably noise).
- `max_df=0.9` = ignore words that appear in more than 90% of documents (too common, like “the”).
- `sublinear_tf=True` = log the raw counts so one document that repeats “buy buy buy” does not dominate.

The website uses the **same n-gram ranges** with a smaller `max_features` so your laptop tab stays snappy.

### 9.2 Character TF–IDF

Second vectorizer: `analyzer='char_wb'`, `ngram_range=(3, 5)`, `min_df=3`, `max_features=30_000`.

`char_wb` means “characters inside words, with a little padding.” These 3–5 letter chunks pick up:

- AI smoothness (`ing `, `tion`)
- punctuation habits
- tokenisation artefacts (weird spaces, repeated dots)

Humans and AIs often differ more in *letter patterns* than in topic words.

### 9.3 Eleven style numbers (then scaled)

Compute these per document with regex + split. No extra APIs.

### Table 3. Cheap stylometry

| Feature | Why it might help | Tiny example |
| --- | --- | --- |
| Token count | Rewrites often get longer or flatter | 80 words vs 140 words |
| Mean / std word length | AI diction vs slang stubs | “obtain” vs “get” |
| Mean sentence length | Human fragments vs polished clauses | “ok. good. ship now.” vs one long sentence |
| Type–token ratio | Lexical diversity (unique words / all words) | repeating the same noun lowers this |
| Hapax ratio | One-off jargon (words that appear once) | street nicknames |
| Stopword ratio | Function-word fingerprint (`the`, `and`, `of`) | AIs often use tidy grammar words |
| Punctuation rate | Over-neat commas vs raw listings | `,,,` vs `;` |
| Digit ratio | Prices and versions | `$40`, `v2.1` |
| Uppercase ratio | SHOUTING titles | `FAST SHIP` |
| Exclaim / question rate | Marketing tone | `!!!` / `??` |

**Stack** (glue the three blocks side by side):

```text
scipy.sparse.hstack([X_word, X_char, StandardScaler().fit_transform(X_stylo)])
```

Scale the 11 style numbers using **train only**, then apply the same scale to val/test. Otherwise “token count = 200” would drown out a TF–IDF value of 0.02.

---

## The classifiers

Train **two models on the same feature matrix**. Do not build a neural dual head.

- Model 1: **source** (human vs llm).
- Model 2: **topic** (10 classes).

### Table 4. Models. Start with LinearSVC. Add XGBoost only if time remains.

| Model | Job | Notes |
| --- | --- | --- |
| LinearSVC | Main source + topic baseline | `class_weight='balanced'`; `dual=True` or `False` depending on sample size |
| LogisticRegression | Probabilities + AUC + readable coefficients | `solver='saga'`, `max_iter=2000` |
| RandomForestClassifier | Non-linear check | `n_estimators=300`, `n_jobs=-1` |
| XGBClassifier | Strongest classic option | `eval_metric='logloss'` or `'mlogloss'` |

**Hyperparameters:** small `GridSearchCV` on validation F1 only. Try `C` in `{0.5, 1, 2, 4}` for linear models; `max_depth` in `{3, 5, 8}` for trees. Fix `random_state=42`. Report three seeds if you have time.

This website implements LinearSVC (hinge loss) and logistic regression with SGD so training can finish in the page. Random Forest / XGBoost stay Colab-only.

---

## How we score the models

### Source task (human vs llm)

- Precision, recall, F1. **Positive class = llm** (we care about catching rewrites).
- ROC-AUC from logistic / XGB probabilities.
- For LinearSVC: use `decision_function` AUC, or wrap with `CalibratedClassifierCV`.

Quick decoder:

- **Precision** — of the pages we flagged as AI, how many really were?
- **Recall** — of all the real AI pages, how many did we catch?
- **F1** — harmonic mean of those two. One number to report.

### Topic task (10 classes)

- Accuracy, weighted F1, macro F1, confusion matrix (a grid of “true topic vs guessed topic”).

### Ablations (the centre of the results section)

| Ablation | What is turned on |
| --- | --- |
| **A** | word TF–IDF only |
| **B** | word + character n-grams |
| **C** | word + char + stylo (full model) |

If C is barely better than A, stylometry is not doing much — say so honestly.

### Extra checks

- **RQ3:** topic F1 of a topic-only model vs the same model trained on the mixed human+llm set.
- **RQ4:** train the source detector on generator A, test on generator B.

## Google Colab setup

Google Colab is a free Python notebook in your browser. GPU is **optional** and only needed for the rewrite step. CPU is enough for TF–IDF and LinearSVC on 10–20k short documents.

A ready notebook is in this repo: [`../public/coda_synth_colab.ipynb`](public/coda_synth_colab.ipynb).

### 12.1 Folder layout on Google Drive

```
MyDrive/coda_synth/
  data/          raw.csv, coda_synth.csv, splits.parquet
  models/        source_svc.joblib, topic_svc.joblib, vectorizers.joblib
  outputs/       reports, png plots
  notebooks/     coda_synth_colab.ipynb
```

### 12.2 First cell — install and mount

```python
!pip -q install scikit-learn==1.5.2 pandas numpy scipy xgboost joblib matplotlib seaborn
# optional for local rewrite on GPU:
# !pip -q install transformers accelerate bitsandbytes

from google.colab import drive
drive.mount('/content/drive')
ROOT = '/content/drive/MyDrive/coda_synth'
import os
for d in ['data', 'models', 'outputs']:
    os.makedirs(f'{ROOT}/{d}', exist_ok=True)
```

### 12.3 Load CoDA after Hugging Face accepts you

Create a **read-only** Hugging Face token and paste it into Colab secrets as `HF_TOKEN`. **Never hard-code tokens** in a notebook you submit or push to GitHub.

```python
from huggingface_hub import login
from google.colab import userdata
login(token=userdata.get('HF_TOKEN'))

from datasets import load_dataset
ds = load_dataset('s2w-ai/CoDA')  # inspect splits / columns immediately
print(ds)
print(ds['train'].column_names)  # names vary; map them to doc_id, text, topic
```

If the dataset is a pile of files rather than one table, loop over examples and write a CSV. Keep an acknowledgement cell that states CoDA’s research-only terms.

### 12.4 Clean

```python
import re, pandas as pd

TAG = re.compile(r'<[^>]+>')
WS = re.compile(r'\s+')

def clean_text(s):
    s = TAG.sub(' ', str(s))
    s = WS.sub(' ', s).strip()
    return s

df['text'] = df['text'].map(clean_text)
df['n_tok'] = df['text'].str.split().str.len()
df = df[df['n_tok'] >= 40].copy()
df.to_csv(f'{ROOT}/data/raw.csv', index=False)
```

---

## Colab: rewrite half the documents

**Pilot (recommended first):** paraphrase 1,000–2,000 docs.  
**Full path:** half of remaining IDs.

Use a small instruct model via `transformers` if a GPU is attached; otherwise call an institution-approved API with the **same** prompt.

```python
import numpy as np
rng = np.random.default_rng(42)
ids = df['doc_id'].unique()
rewrite_ids = set(rng.choice(ids, size=int(0.5 * len(ids)), replace=False))

PROMPT = '''Rewrite the following document in a different wording and sentence rhythm.
Keep the same facts and the same topic. Do not add new claims.

DOCUMENT:
'''

# attach your generate(prompt) function here
rows = []
for _, r in df.iterrows():
    rows.append({**r.to_dict(), 'source': 'human', 'generator': 'original'})
    if r['doc_id'] in rewrite_ids:
        new_text = generate(PROMPT + r['text'][:3000])  # truncate long pages
        rec = r.to_dict()
        rec.update({'text': new_text, 'source': 'llm', 'generator': 'MODEL_NAME'})
        rows.append(rec)
syn = pd.DataFrame(rows)
syn.to_csv(f'{ROOT}/data/coda_synth.csv', index=False)
```

Sanity check: print two side-by-side examples. If the model refuses or empties the page, retry once; otherwise drop that pair.

---

## Colab: id-safe split

```python
from sklearn.model_selection import train_test_split

meta = syn.drop_duplicates('doc_id')[['doc_id', 'topic']]
id_train, id_tmp = train_test_split(
    meta['doc_id'], test_size=0.30, random_state=42,
    stratify=meta['topic'])
id_val, id_test = train_test_split(
    id_tmp, test_size=0.50, random_state=42,
    stratify=meta.set_index('doc_id').loc[id_tmp, 'topic'])

def tag(frame, ids, name):
    out = frame[frame.doc_id.isin(ids)].copy()
    out['split'] = name
    return out

full = pd.concat([
    tag(syn, id_train, 'train'),
    tag(syn, id_val, 'val'),
    tag(syn, id_test, 'test'),
], ignore_index=True)
full.to_parquet(f'{ROOT}/data/splits.parquet')
```

`test_size=0.30` then `0.50` of the remainder is how you get **70 / 15 / 15**.

---

## Colab: features and training

```python
import re, numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score, f1_score
from scipy.sparse import hstack, csr_matrix
import joblib

STOP = set(ENGLISH_STOP_WORDS)

def stylo(text):
    t = text or ''
    toks = re.findall(r"\b\w+\b", t.lower())
    n = max(len(toks), 1)
    sents = re.split(r'[.!?]+', t)
    sents = [s for s in sents if s.strip()]
    ns = max(len(sents), 1)
    uniq = len(set(toks))
    hap = sum(1 for w in set(toks) if toks.count(w) == 1)
    return np.array([
        n,
        np.mean([len(w) for w in toks]) if toks else 0,
        np.mean([len(s.split()) for s in sents]) if sents else 0,
        uniq / n,
        hap / n,
        sum(w in STOP for w in toks) / n,
        sum(ch in '.,;:!?-()' for ch in t) / max(len(t), 1),
        sum(ch.isdigit() for ch in t) / max(len(t), 1),
        sum(ch.isupper() for ch in t) / max(len(t), 1),
        t.count('!') / ns,
        t.count('?') / ns,
    ], dtype=float)

tr = full[full.split=='train']; va = full[full.split=='val']; te = full[full.split=='test']

word = TfidfVectorizer(ngram_range=(1,2), min_df=3, max_df=0.9,
                       max_features=50000, sublinear_tf=True)
char = TfidfVectorizer(analyzer='char_wb', ngram_range=(3,5),
                       min_df=3, max_features=30000)
Xw_tr, Xw_va, Xw_te = word.fit_transform(tr.text), word.transform(va.text), word.transform(te.text)
Xc_tr, Xc_va, Xc_te = char.fit_transform(tr.text), char.transform(va.text), char.transform(te.text)

S_tr = np.vstack(tr.text.map(stylo))
S_va = np.vstack(va.text.map(stylo))
S_te = np.vstack(te.text.map(stylo))
scaler = StandardScaler()
S_tr, S_va, S_te = scaler.fit_transform(S_tr), scaler.transform(S_va), scaler.transform(S_te)

def pack(w, c, s):
    return hstack([w, c, csr_matrix(s)]).tocsr()
X_tr, X_va, X_te = pack(Xw_tr,Xc_tr,S_tr), pack(Xw_va,Xc_va,S_va), pack(Xw_te,Xc_te,S_te)

y_src_tr = (tr.source=='llm').astype(int)
y_src_va = (va.source=='llm').astype(int)
y_src_te = (te.source=='llm').astype(int)
le = LabelEncoder()
y_top_tr = le.fit_transform(tr.topic)
y_top_va = le.transform(va.topic)
y_top_te = le.transform(te.topic)

src = LinearSVC(class_weight='balanced', random_state=42)
src.fit(X_tr, y_src_tr)
print('SOURCE val\n', classification_report(y_src_va, src.predict(X_va), digits=3))

top = LinearSVC(class_weight='balanced', random_state=42)
top.fit(X_tr, y_top_tr)
print('TOPIC val\n', classification_report(y_top_va, top.predict(X_va), digits=3, target_names=le.classes_))

joblib.dump({'word':word,'char':char,'scaler':scaler,'le':le,'src':src,'top':top},
            f'{ROOT}/models/bundle.joblib')
```

What this cell is doing, in order:

1. Count 11 style numbers for every document.
2. Learn the word vocabulary and the character vocabulary from **train only**.
3. Scale the 11 style numbers from **train only**.
4. Glue word + char + style into one sparse matrix.
5. Train one LinearSVC for source and one for topic.
6. Print validation reports (the practice quiz).
7. Save everything in one `bundle.joblib` so you do not retrain after a Colab disconnect.

---

## Colab: plots

```python
from sklearn.metrics import ConfusionMatrixDisplay, RocCurveDisplay
import matplotlib.pyplot as plt

pred_s = src.predict(X_te)
pred_t = top.predict(X_te)
print(classification_report(y_src_te, pred_s, target_names=['human','llm'], digits=3))
print('topic weighted F1', f1_score(y_top_te, pred_t, average='weighted'))

fig, ax = plt.subplots(1, 2, figsize=(10, 4))
ConfusionMatrixDisplay.from_predictions(y_src_te, pred_s, display_labels=['human','llm'], ax=ax[0], colorbar=False)
ConfusionMatrixDisplay.from_predictions(y_top_te, pred_t, display_labels=le.classes_, ax=ax[1], colorbar=False, xticks_rotation=45)
ax[0].set_title('Source'); ax[1].set_title('Topic')
fig.tight_layout()
fig.savefig(f'{ROOT}/outputs/confusion.png', dpi=160)
```

A **confusion matrix** is a grid. Rows = the truth, columns = the guess. A perfect source detector would only have numbers on the diagonal (`human` predicted `human`, `llm` predicted `llm`).

**Ablation (do this next):** rebuild `X` with word only, then word+char, train LinearSVC again, store three F1 numbers in a small table. That table is the centre of your results section.

---

## A six-day plan

### Table 5. A realistic Colab week

| Day | What to do |
| --- | --- |
| Mon | Get Hugging Face access, make Drive folders, load + clean → `raw.csv` |
| Tue | Pilot rewrite of 500–1000 docs; read a few pairs side by side |
| Wed | Full (or accepted) synth + id-safe split |
| Thu | Features + LinearSVC + logistic; write down val metrics |
| Fri | Ablations, XGBoost if needed, plots |
| Sat | Write results, limits, citations |

If CoDA access is slow, start with a 2,000-row DUTA pilot (or this website’s proxy corpus) and swap files later. **The code does not change.**

---

## What to write in the report

Use these headings. The lab’s `/report` page fills them from a live run and lets you copy markdown.

- **Problem.** Topic classifiers ignore the shift toward AI-polished underground copy. We ask whether cheap style features can still tell original from rewrite.
- **Constraint.** No live collection. Public CoDA/DUTA + a controlled paraphrase. Research use only.
- **Method.** Sparse word TF–IDF, character n-grams, and 11 stylo features. LinearSVC / logistic / (optional) trees.
- **Leakage control.** Split by original `doc_id`, so a page and its rewrite never sit on opposite sides of the exam.
- **Results.** Source F1, topic weighted F1, ablation deltas (A vs B vs C), optional cross-generator drop (RQ4).
- **Limits.** A paraphrase is not a specialised underground model. CoDA is English-heavy. Masks change surface form.
- **Ethics.** Research terms, no redistribution of the raw dump, no operational targeting.

---

## Honest limits

Say these out loud. They make the work stronger, not weaker.

- A detector that only sees *your* paraphrases may fail on a specialised uncensored model sold on forums. CoDA-Synth is a **proxy benchmark** (a practice exam).
- Character n-grams can overfit one generator’s punctuation. Mix two generators; report RQ4.
- Topic labels on rewritten text assume the model obeyed “keep the topic.” Spot-check a sample.
- Free Colab sessions disconnect. Always write parquet to Drive after each stage.
- **This website extra limits:** the default rewrite is a rule-based style tweaker, not a 7B instruct model. Feature caps are smaller than Colab’s 50,000 / 30,000 so the tab stays smooth. Random Forest / XGBoost are in the guide but not run in the browser.

---

## Papers to cite

- Jin, Y., Jang, E., Lee, Y., Shin, S., & Chung, J.-W. (2022). Shedding New Light on the Language of the Dark Web. NAACL.
- Al-Nabki, M. W., Fidalgo, E., Alegre, E., & Fernández-Robles, L. (2017/2019). DUTA / DUTA-10K darknet usage text addresses.
- Jin et al. (2023). DarkBERT: A Language Model for the Dark Side of the Internet. ACL. Related work — you are **not** required to run DarkBERT.
- Plus any LLM you used for paraphrases (model card + version date).

If you use this software, cite [`../CITATION.cff`](CITATION.cff) as well.

---

## Colab checklist before you submit

Tick every box.

- [ ] The notebook runs top-to-bottom on a **fresh** runtime after Drive mount.
- [ ] Hugging Face token lives in Colab secrets. **No keys in git.**
- [ ] `splits.parquet` exists. Train / val / test counts are printed.
- [ ] Ablation table is saved as CSV in `outputs/`.
- [ ] Confusion matrices are readable (topic labels rotated).
- [ ] A README cell lists CoDA licence / research terms.
- [ ] You can explain every feature in Table 3 without looking at notes.

---

## One-paragraph pitch

Copy this for a supervisor, a teacher, or the first slide:

> This project studies whether classical sparse features can detect LLM paraphrases of public dark-web documents while still classifying the original CoDA topic. Using only research corpora and a controlled rewrite protocol, we train LinearSVC and logistic models on word TF–IDF, character n-grams, and stylometry, with document-id splits to block pair leakage. The work is fully implementable in Google Colab on CPU after an optional GPU paraphrase pass, and it treats generated underground text as a measurement problem rather than an operational collection problem.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please keep the ethics lock.

1. Fork and branch from `main`.
2. Prefer the in-browser sparse TF–IDF / LinearSVC pipeline. If you add a Python path, update the Colab notebook too.
3. Run `npm run typecheck` and `npm test`.
4. In the pull request, say which research question or lab page the change helps.

By contributing you agree the work is released under the [MIT License](LICENSE).

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Er. Rishabh Aryan.

**CoDA itself is not MIT-licensed.** Request it from Hugging Face under its research terms. Do not commit the raw dump.

---

*End of guide. Scope is frozen: public data, traditional ML, two tasks, Colab + this browser lab. If CoDA access lags, start on a 2,000-row DUTA pilot or this lab’s proxy corpus and swap files later — the code does not change.*
