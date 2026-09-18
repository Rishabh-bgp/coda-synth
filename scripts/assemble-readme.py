#!/usr/bin/env python3
"""Assemble README.md from docs/01–03 so the GitHub home page has the full chapter."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

HEADER = """# CoDA-Synth

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Rishabh--bgp%2Fcoda--synth-181717?logo=github)](https://github.com/Rishabh-bgp/coda-synth)

"""

CLONE = """
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
"""

CONTRIBUTING = """
## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please keep the ethics lock.

1. Fork and branch from `main`.
2. Prefer the in-browser sparse TF–IDF / LinearSVC pipeline. If you add a Python path, update the Colab notebook too.
3. Run `npm run typecheck` and `npm test`.
4. In the pull request, say which research question or lab page the change helps.

By contributing you agree the work is released under the [MIT License](LICENSE).

"""


def strip_part_banner(text: str) -> str:
    lines = text.splitlines(True)
    if lines and lines[0].startswith("> Part "):
        i = 1
        if i < len(lines) and lines[i].strip() == "":
            i += 1
        text = "".join(lines[i:])
    return text


def fix_links(text: str) -> str:
    return (
        text.replace("](../public/", "](public/")
        .replace("](../CITATION.cff)", "](CITATION.cff)")
        .replace("](../CONTRIBUTING.md)", "](CONTRIBUTING.md)")
        .replace("](../LICENSE)", "](LICENSE)")
        .replace("](../attachments/", "](attachments/")
        .replace("](../src/", "](src/")
        .replace("](02-method.md)", "](#the-recipe-from-start-to-finish)")
        .replace("](03-colab-and-report.md)", "](#google-colab-setup)")
        .replace("](01-overview.md)", "](#read-this-first-if-you-are-new)")
        .replace("](GUIDE.md)", "](docs/GUIDE.md)")
    )


def main() -> None:
    p1 = fix_links(strip_part_banner((DOCS / "01-overview.md").read_text()))
    p2 = fix_links(strip_part_banner((DOCS / "02-method.md").read_text()))
    p3 = fix_links(strip_part_banner((DOCS / "03-colab-and-report.md").read_text()))
    body = p1.rstrip() + "\n\n" + p2.rstrip() + "\n\n" + p3.lstrip()
    while "\n---\n\n---\n" in body:
        body = body.replace("\n---\n\n---\n", "\n---\n")
    while "\n\n\n\n" in body:
        body = body.replace("\n\n\n\n", "\n\n\n")
    if body.startswith("# CoDA-Synth"):
        rest = body.split("\n", 1)[1].lstrip("\n")
        body = HEADER + rest
    elif not body.startswith("# "):
        body = HEADER + body
    if "git clone https://github.com/Rishabh-bgp/coda-synth.git" not in body:
        needle = "### Pages in the lab"
        if needle in body:
            body = body.replace(needle, CLONE.strip() + "\n\n" + needle, 1)
        else:
            body = body.replace(
                "## What you should hand in",
                CLONE.strip() + "\n\n## What you should hand in",
                1,
            )
    if "## Contributing" not in body:
        body = body.replace("\n## License\n", CONTRIBUTING + "## License\n", 1)
    dest = ROOT / "README.md"
    dest.write_text(body)
    print(f"wrote {dest} ({len(body)} bytes, {body.count(chr(10)) + 1} lines)")


if __name__ == "__main__":
    main()
