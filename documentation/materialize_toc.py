"""Extrait les numéros de page des titres depuis les PDF rendus."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pdfplumber

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_docs import OUTPUTS, SOURCE_DIR, TOC_DIR, heading_inventory, parse_source  # noqa: E402


def norm(value: str) -> str:
    value = value.replace("’", "'").replace("–", "-").replace(chr(0x2014), "-")
    return re.sub(r"\s+", " ", value).strip().casefold()


def extract_heading_text(page) -> str:
    """Return only text rendered with the document heading typography.

    Searching the whole page makes short headings such as ``Sentry`` resolve to
    an earlier body or table occurrence.  Generated heading levels 1 to 3 use
    Calibri Bold at 11.5 pt or more, while body and TOC entries are at most
    10.5 pt.  Filtering on both properties therefore keeps page mapping stable
    without depending on Word field updates.
    """
    words = page.extract_words(extra_attrs=["fontname", "size"])
    heading_words = [
        word
        for word in words
        if float(word.get("size", 0)) >= 11
        and "bold" in str(word.get("fontname", "")).casefold()
    ]
    heading_words.sort(key=lambda word: (round(float(word["top"]), 1), float(word["x0"])))
    return norm(" ".join(str(word["text"]) for word in heading_words))


def extract(pdf_path: Path, source_path: Path) -> dict[str, int]:
    source = parse_source(source_path)
    headings = heading_inventory(source.lines)
    with pdfplumber.open(pdf_path) as pdf:
        pages = [extract_heading_text(page) for page in pdf.pages]
    result: dict[str, int] = {}
    for _level, title, _anchor in headings:
        needle = norm(title)
        compact = needle[:72]
        for page_index, page_text in enumerate(pages[2:], start=3):
            if needle in page_text or compact in page_text:
                result[title] = page_index
                break
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_dir", type=Path)
    parser.add_argument("--source", help="Nom d'une source Markdown, sinon toutes.")
    args = parser.parse_args()
    selected = [args.source] if args.source else list(OUTPUTS)
    TOC_DIR.mkdir(exist_ok=True)
    for source_name in selected:
        if source_name not in OUTPUTS:
            raise SystemExit(f"Source inconnue : {source_name}")
        docx_name = OUTPUTS[source_name]
        pdf_path = args.pdf_dir / f"{Path(docx_name).stem}.pdf"
        if not pdf_path.exists():
            raise SystemExit(f"PDF manquant : {pdf_path}")
        result = extract(pdf_path, SOURCE_DIR / source_name)
        expected = len([h for h in heading_inventory(parse_source(SOURCE_DIR / source_name).lines) if h[0] <= 3])
        if len(result) < expected:
            missing = expected - len(result)
            print(f"Avertissement : {missing} titre(s) non localisé(s) dans {pdf_path.name}")
        output = TOC_DIR / f"{Path(source_name).stem}.json"
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Sommaire : {output.name} ({len(result)} titres)")


if __name__ == "__main__":
    main()
