> Part 3 of 3 — [methods index](GUIDE.md) · [part 1](01-overview.md) · [part 2](02-method.md)

## Google Colab setup

Google Colab is a free Python notebook in your browser. GPU is **optional** and only needed for the rewrite step. CPU is enough for TF–IDF and LinearSVC on 10–20k short documents.

A ready notebook is in this repo: [`../public/coda_synth_colab.ipynb`](../public/coda_synth_colab.ipynb).

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

If you use this software, cite [`../CITATION.cff`](../CITATION.cff) as well.

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

## License

Released under the [MIT License](../LICENSE). Copyright © 2026 Er. Rishabh Aryan.

**CoDA itself is not MIT-licensed.** Request it from Hugging Face under its research terms. Do not commit the raw dump.

---

*End of guide. Scope is frozen: public data, traditional ML, two tasks, Colab + this browser lab. If CoDA access lags, start on a 2,000-row DUTA pilot or this lab’s proxy corpus and swap files later — the code does not change.*
