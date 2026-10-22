"""Measure classifier accuracy on labelled_emails.jsonl. Owner: Iqbal."""

from __future__ import annotations

import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

from mailsense_ai.classifier import classify_email
from mailsense_ai.contracts import EmailInput

DATA = Path(__file__).with_name("labelled_emails.jsonl")


def main() -> None:
    rows = [json.loads(line) for line in DATA.read_text("utf-8").splitlines() if line.strip()]
    correct = 0
    wrong: Counter[tuple[str, str]] = Counter()
    for row in rows:
        email = EmailInput(
            id=row["id"],
            subject=row["subject"],
            sender_name=row["sender"],
            sender_address="",
            received_at=datetime.now(UTC),
            body_text=row["body"],
        )
        got = classify_email(email).segment.value
        if got == row["segment"]:
            correct += 1
        else:
            wrong[(row["segment"], got)] += 1
    print(f"Accuracy: {correct}/{len(rows)} = {correct / len(rows):.1%}")
    for (expected, got), n in wrong.most_common():
        print(f"  {expected} -> {got}: {n}")


if __name__ == "__main__":
    main()
