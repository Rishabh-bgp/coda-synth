> Part 2 of 3 — [methods index](GUIDE.md) · [part 1](01-overview.md) · [part 3](03-colab-and-report.md)

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
| --- | --- | --- |
| Load + clean | `raw.csv` | pandas, regex | proxy generator + HTML/whitespace strip |
| Synthesize rewrites | `coda_synth.csv` | transformers or an allowed API | two rewriters: `polish-A`, `rhythm-B` |
| Id-safe split | train / val / test | sklearn `train_test_split` on ids | same 70 / 15 / 15 on `doc_id` |
| Features | sparse matrix + style numbers | `TfidfVectorizer`, `hstack` | word + char_wb + scaled stylo |
| Classify | two models | LinearSVC, LogisticRegression, XGB | LinearSVC hinge + logistic SGD |
| Evaluate | reports + plots | sklearn.metrics, matplotlib | ablation, confusion, ROC, RQ3/RQ4 |

**Train / val / test in one sentence:** train is the textbook, val is the practice quiz you use to pick settings, test is the real exam you only take once.

---

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
