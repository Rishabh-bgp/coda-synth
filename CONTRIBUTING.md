# Contributing to CoDA-Synth

Thanks for helping improve this open-source research lab.

## Ethics first

This project is a **proxy benchmark** for stylometric detection of LLM-rewritten text. Do not:

- scrape live hidden services
- add unmasking, deanonymization, or operational detector code
- include real dark-web dumps, vendor names, wallets, or victim identifiers
- ship new criminal how-to content

Use public / synthetic corpora only. Cite Jin et al. (2022) / Al-Nabki et al. when you use their text.

## Setup

```bash
git clone https://github.com/Rishabh-bgp/coda-synth.git
cd coda-synth
npm install
npm run dev
```

Open http://localhost:8080.

```bash
npm run typecheck
npm test
```

## Pull requests

1. Fork the repo and branch from `main`.
2. Keep changes focused. Prefer the in-browser sparse TF–IDF / LinearSVC pipeline over adding a Python-only path unless you also update the Colab notebook.
3. Run `npm run typecheck` and `npm test`.
4. Describe the research question or lab UX the change serves.

## License

By contributing you agree that your work is released under the [MIT License](LICENSE).
