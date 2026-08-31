from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import uuid
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "sources" / "raw" / "考官Simon雅思大作文范文(28篇).pdf"
OUTPUT_PATH = ROOT / "data" / "source_essays.json"
IMPORTED_AT = "2026-08-16T07:45:00Z"
SOURCE_NAME = "考官Simon雅思大作文范文(28篇)"
AUTHOR = "Simon (attributed by the compilation; primary-source verification pending)"
RIGHTS_NOTE = (
    "User-provided study PDF. The compilation attributes the essay to Simon; "
    "where present, its Band 9 label is not examiner-verified. Retain locally for "
    "personal study with visible attribution and do not present the collection as "
    "official IELTS material."
)


ESSAYS = {
    1: {
        "title": "Foreign films and support for local cinema",
        "question_type": "two_part_multi_part",
        "topics": ["culture_art_language_media", "government_public_policy_spending"],
    },
    2: {
        "title": "Higher admission fees for foreign visitors",
        "question_type": "opinion",
        "topics": ["globalization_tourism_migration", "culture_art_language_media"],
    },
    3: {
        "title": "Are people becoming more independent?",
        "question_type": "discussion",
        "topics": ["society_family_population_equality"],
    },
    4: {
        "title": "Is salary the most important factor in choosing a job?",
        "question_type": "opinion",
        "topics": ["work_economy_business_consumption"],
    },
    5: {
        "title": "The case for and against animal experiments",
        "question_type": "discussion",
        "topics": ["science_space_ethics", "environment_energy_animals"],
    },
    6: {
        "title": "Should governments fund artists?",
        "question_type": "discussion",
        "topics": ["culture_art_language_media", "government_public_policy_spending"],
    },
    7: {
        "title": "Unpaid community work for teenagers",
        "question_type": "opinion",
        "topics": ["education_children", "society_family_population_equality"],
    },
    8: {
        "title": "Traditional music and international music",
        "question_type": "two_part_multi_part",
        "topics": ["culture_art_language_media"],
    },
    9: {
        "title": "Video games: benefits and drawbacks",
        "question_type": "advantages_disadvantages",
        "topics": [
            "technology_ai_digital_media",
            "education_children",
            "health_diet_lifestyle",
        ],
    },
    10: {
        "title": "Problems and solutions of an ageing population",
        "question_type": "causes_solutions",
        "topics": ["society_family_population_equality", "government_public_policy_spending"],
    },
    11: {
        "title": "Should countries only help their own citizens?",
        "question_type": "opinion",
        "topics": ["globalization_tourism_migration", "government_public_policy_spending"],
    },
    12: {
        "title": "How technology changes relationships",
        "question_type": "two_part_multi_part",
        "topics": ["technology_ai_digital_media", "society_family_population_equality"],
    },
    13: {
        "title": "Why difficult hobbies can be more enjoyable",
        "question_type": "opinion",
        "topics": ["society_family_population_equality"],
    },
    14: {
        "title": "Equality and personal achievement",
        "question_type": "opinion",
        "topics": ["society_family_population_equality", "work_economy_business_consumption"],
    },
    15: {
        "title": "Equal numbers of men and women on university courses",
        "question_type": "opinion",
        "topics": ["education_children", "society_family_population_equality"],
    },
    16: {
        "title": "Should museums entertain or educate?",
        "question_type": "discussion",
        "topics": ["culture_art_language_media", "education_children"],
    },
    17: {
        "title": "University or work after school",
        "question_type": "discussion",
        "topics": ["education_children", "work_economy_business_consumption"],
    },
    18: {
        "title": "Is it worth saving minority languages?",
        "question_type": "discussion",
        "topics": ["culture_art_language_media", "government_public_policy_spending"],
    },
    19: {
        "title": "Who should solve environmental problems?",
        "question_type": "two_part_multi_part",
        "topics": ["environment_energy_animals", "government_public_policy_spending"],
    },
    20: {
        "title": "What makes people happy?",
        "question_type": "two_part_multi_part",
        "topics": ["society_family_population_equality", "health_diet_lifestyle"],
    },
    21: {
        "title": "Protecting wild animals",
        "question_type": "opinion",
        "topics": ["environment_energy_animals", "government_public_policy_spending"],
    },
    22: {
        "title": "Can stricter punishments improve road safety?",
        "question_type": "discussion",
        "topics": ["cities_housing_transport", "crime_law_punishment"],
    },
    23: {
        "title": "Businesses’ social responsibilities",
        "question_type": "opinion",
        "topics": ["work_economy_business_consumption", "society_family_population_equality"],
    },
    24: {
        "title": "City problems and government solutions",
        "question_type": "causes_solutions",
        "topics": ["cities_housing_transport", "government_public_policy_spending"],
    },
    25: {
        "title": "The rise in one-person households",
        "question_type": "positive_negative_development",
        "topics": ["society_family_population_equality", "cities_housing_transport"],
    },
    26: {
        "title": "Freedom to choose university subjects",
        "question_type": "discussion",
        "topics": [
            "education_children",
            "technology_ai_digital_media",
            "work_economy_business_consumption",
        ],
    },
    27: {
        "title": "Ex-prisoners teaching teenagers about crime",
        "question_type": "opinion",
        "topics": ["crime_law_punishment", "education_children"],
    },
    28: {
        "title": "Traditional ideas and young people",
        "question_type": "opinion",
        "topics": ["society_family_population_equality", "work_economy_business_consumption"],
    },
}


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def stable_id(essay_number: int) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"mimicloop:simon-task2:{essay_number}"))


def has_english(text: str) -> bool:
    return bool(re.search(r"[A-Za-z]", text))


def is_prompt_line(text: str) -> bool:
    return len(re.findall(r"[A-Za-z]+", text)) >= 4


def join_lines(lines: list[str]) -> str:
    result = ""
    for raw_line in lines:
        line = re.sub(r"\s+", " ", raw_line).strip()
        if not line:
            continue
        if not result:
            result = line
        elif result.endswith("-"):
            result += line
        else:
            result += " " + line

    result = re.sub(r"\s+([,.;:!?])", r"\1", result)
    result = re.sub(r"([([{])\s+", r"\1", result)
    result = re.sub(r"\s+([)\]}])", r"\1", result)
    return result.strip()


def extract_page(page, essay_number: int) -> tuple[str, list[str], bool]:
    lines = page.extract_text_lines(layout=False, strip=True, return_chars=False)
    start = next(
        (index for index, line in enumerate(lines) if is_prompt_line(line["text"])),
        None,
    )
    if start is None:
        raise ValueError(f"Essay {essay_number}: could not find the English prompt")

    english_lines = [line for line in lines[start:] if has_english(line["text"])]
    groups: list[list[str]] = []
    current: list[str] = []
    previous_bottom: float | None = None

    for line in english_lines:
        gap = None if previous_bottom is None else float(line["top"]) - previous_bottom
        if current and gap is not None and gap > 10:
            groups.append(current)
            current = []
        current.append(line["text"])
        previous_bottom = float(line["bottom"])
    if current:
        groups.append(current)

    blocks = [join_lines(group) for group in groups]
    prompt = blocks[0]
    body_blocks = blocks[1:]
    has_band_nine = False

    marker_pattern = r"\((?:\d+\s+words(?:,\s*)?)?band\s*9\)|\(\d+\s+words\)"
    if body_blocks:
        marker = re.search(rf"\s*({marker_pattern})$", body_blocks[-1], re.I)
        if marker:
            has_band_nine = "band 9" in marker.group(1).lower()
            remaining = body_blocks[-1][: marker.start()].rstrip()
            if remaining:
                body_blocks[-1] = remaining
            else:
                body_blocks.pop()

    if len(body_blocks) < 3:
        raise ValueError(
            f"Essay {essay_number}: expected at least 3 body paragraphs, found {len(body_blocks)}"
        )
    if any(len(paragraph) < 40 for paragraph in body_blocks):
        raise ValueError(f"Essay {essay_number}: found an unexpectedly short body paragraph")

    return prompt, body_blocks, has_band_nine


def essay_number_from_record(record: dict) -> int:
    match = re.match(r"Essay\s+(\d+),", record.get("publication_ref") or "")
    if not match:
        raise ValueError(f"Cannot determine essay number from {record.get('publication_ref')!r}")
    return int(match.group(1))


def make_record(
    essay_number: int,
    prompt: str,
    paragraphs: list[str],
    has_band_nine: bool,
) -> dict:
    config = ESSAYS[essay_number]
    full_text = "\n\n".join(paragraphs)
    return {
        "schema_version": "1.0.0",
        "id": stable_id(essay_number),
        "title": config["title"],
        "ielts_prompt": prompt,
        "full_text": full_text,
        "paragraphs": [
            {
                "paragraph_index": index,
                "text": paragraph,
                "content_hash": sha256(paragraph),
            }
            for index, paragraph in enumerate(paragraphs)
        ],
        "source_name": SOURCE_NAME,
        "source_type": "user_provided_pdf",
        "answer_origin": "teacher_model",
        "source_url": None,
        "publication_ref": f"Essay {essay_number}, PDF page {essay_number + 1}",
        "author": AUTHOR,
        "question_type": config["question_type"],
        "topics": config["topics"],
        "claimed_band": (
            "Band 9 (collection claim; not examiner-verified)" if has_band_nine else None
        ),
        "examiner_comments": None,
        "accessed_at": IMPORTED_AT,
        "local_raw_file": "sources/raw/考官Simon雅思大作文范文(28篇).pdf",
        "content_hash": sha256(full_text),
        "rights_note": RIGHTS_NOTE,
        "created_at": IMPORTED_AT,
        "updated_at": IMPORTED_AT,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract and merge the 28 Simon Task 2 essays from the archived PDF."
    )
    parser.add_argument(
        "--write",
        action="store_true",
        help="Write the merged result to data/source_essays.json. Without this flag, run checks only.",
    )
    args = parser.parse_args()

    existing = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    existing_by_number = {essay_number_from_record(record): record for record in existing}
    extracted: dict[int, dict] = {}

    with pdfplumber.open(PDF_PATH) as pdf:
        if len(pdf.pages) != 29:
            raise ValueError(f"Expected 29 PDF pages, found {len(pdf.pages)}")
        for essay_number in range(1, 29):
            prompt, paragraphs, has_band_nine = extract_page(
                pdf.pages[essay_number], essay_number
            )
            extracted[essay_number] = make_record(
                essay_number, prompt, paragraphs, has_band_nine
            )

    legacy_seed_numbers = {9, 21, 26}
    merged = []
    mismatches = []
    for essay_number in range(1, 29):
        generated = extracted[essay_number]
        current = existing_by_number.get(essay_number)
        if current and essay_number in legacy_seed_numbers:
            if current["ielts_prompt"] != generated["ielts_prompt"]:
                mismatches.append(f"Essay {essay_number}: prompt differs from existing record")
            if current["full_text"] != generated["full_text"]:
                diff = "\n".join(
                    difflib.unified_diff(
                        current["full_text"].splitlines(),
                        generated["full_text"].splitlines(),
                        fromfile="existing",
                        tofile="extracted",
                        lineterm="",
                    )
                )
                mismatches.append(
                    f"Essay {essay_number}: body differs from existing record\n{diff}"
                )
            merged.append(current)
        else:
            merged.append(generated)

    if mismatches:
        raise ValueError("\n".join(mismatches))

    if args.write:
        OUTPUT_PATH.write_text(
            json.dumps(merged, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    band_count = sum(1 for record in extracted.values() if record["claimed_band"])
    print(
        f"Checked 28 essays: {len(existing_by_number)} existing, "
        f"{28 - len(existing_by_number)} new, {band_count} labelled Band 9."
    )
    for essay_number, record in extracted.items():
        print(
            f"{essay_number:02d} | page {essay_number + 1:02d} | "
            f"{len(record['paragraphs'])} paragraphs | "
            f"{len(record['full_text'].split())} words | {record['title']}"
        )
    if args.write:
        print(f"Wrote {len(merged)} source essays to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
