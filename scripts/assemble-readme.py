#!/usr/bin/env python3
"""Assemble README.md from docs/01–03 so the GitHub home page has the full chapter."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


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
    )


def main() -> None:
    p1 = fix_links(strip_part_banner((DOCS / "01-overview.md").read_text()))
    p2 = fix_links(strip_part_banner((DOCS / "02-method.md").read_text()))
    p3 = fix_links(strip_part_banner((DOCS / "03-colab-and-report.md").read_text()))
    out = p1.rstrip() + "\n\n" + p2.rstrip() + "\n\n" + p3.lstrip()
    while "\n---\n\n---\n" in out:
        out = out.replace("\n---\n\n---\n", "\n---\n")
    while "\n\n\n\n" in out:
        out = out.replace("\n\n\n\n", "\n\n\n")
    dest = ROOT / "README.md"
    dest.write_text(out)
    print(f"wrote {dest} ({len(out)} bytes, {out.count(chr(10)) + 1} lines)")


if __name__ == "__main__":
    main()
