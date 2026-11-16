"""Measure classifier accuracy on a labelled set (NFR-17: >= 85%, NFR-18: UM_NOTICE recall >= 95%).

Usage (from the ai/ folder, with the backend virtualenv):
    ../backend/.venv/Scripts/python eval/run_eval.py                       # labelled_emails.jsonl
    ../backend/.venv/Scripts/python eval/run_eval.py eval/sample_emails.jsonl
    ../backend/.venv/Scripts/python eval/run_eval.py --prompt classify_v2 --limit 50

Reads LLM_API_KEY / LLM_PROVIDER / LLM_MODEL from the environment or from ../backend/.env.
Each line of the .jsonl file: {"id", "label", "subject", "sender_name", "sender_email",
"body_text", "received_at", "deadline" (optional, "YYYY-MM-DD" or null)}.
Writes a Markdown report to eval/results/.
"""

import argparse
import json
import os
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import mailsense_ai.classifier as classifier_module  # noqa: E402
from mailsense_ai import EmailInput, LLMClient, LLMError, Segment, extract_details  # noqa: E402


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", nargs="?", default=str(HERE / "labelled_emails.jsonl"))
    parser.add_argument("--prompt", default="classify_v1")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--no-extract", action="store_true", help="skip deadline check (cheaper)")
    args = parser.parse_args()

    load_env_file(HERE.parent.parent / "backend" / ".env")
    if not os.environ.get("LLM_API_KEY"):
        print("Set LLM_API_KEY (in backend/.env or the environment) first.")
        return 1
    client = LLMClient(
        api_key=os.environ["LLM_API_KEY"],
        provider=os.environ.get("LLM_PROVIDER", "groq"),
        model=os.environ.get("LLM_MODEL") or None,
        base_url=os.environ.get("LLM_BASE_URL") or None,
    )
    classifier_module.PROMPT_VERSION = args.prompt

    rows = [json.loads(line) for line in Path(args.dataset).read_text("utf-8").splitlines() if line]
    if args.limit:
        rows = rows[: args.limit]
    print(f"Evaluating {len(rows)} emails with {client.model} / {args.prompt}\n")

    confusion: dict[str, Counter] = defaultdict(Counter)
    mistakes, failures = [], 0
    deadline_total = deadline_ok = 0
    started = time.time()

    for i, row in enumerate(rows, 1):
        email = EmailInput(
            **{
                k: row.get(k) or "" for k in ("subject", "sender_name", "sender_email", "body_text")
            },
            received_at=row.get("received_at"),
        )
        try:
            got = classifier_module.classify_email(email, client).segment.value
        except LLMError as exc:
            failures += 1
            got = "ERROR"
            print(f"  [{row['id']}] error: {exc}")
        confusion[row["label"]][got] += 1
        if got != row["label"]:
            mistakes.append((row["id"], row["label"], got, row["subject"]))

        if not args.no_extract and "deadline" in row and got != Segment.NOT_FOR_ME:
            deadline_total += 1
            try:
                found = extract_details(email, client).deadline
                found_day = found.date().isoformat() if found else None
            except LLMError:
                found_day = "ERROR"
            if found_day == row["deadline"]:
                deadline_ok += 1
        print(f"\r  {i}/{len(rows)}", end="", flush=True)

    total = len(rows)
    correct = sum(confusion[s][s] for s in confusion)
    accuracy = correct / total if total else 0
    notice_total = sum(confusion["UM_NOTICE"].values())
    notice_recall = confusion["UM_NOTICE"]["UM_NOTICE"] / notice_total if notice_total else None

    labels = [s.value for s in Segment]
    lines = [
        f"# Classifier evaluation — {datetime.now():%Y-%m-%d %H:%M}",
        "",
        f"- Dataset: `{Path(args.dataset).name}` ({total} emails)",
        f"- Model: `{client.model}` · prompt `{args.prompt}`",
        f"- **Accuracy: {accuracy:.1%}** (target ≥ 85%) {'✅' if accuracy >= 0.85 else '❌'}",
    ]
    if notice_recall is not None:
        ok = "✅" if notice_recall >= 0.95 else "❌"
        lines.append(f"- **UM_NOTICE recall: {notice_recall:.1%}** (target ≥ 95%) {ok}")
    if deadline_total:
        rate = deadline_ok / deadline_total
        ok = "✅" if rate >= 0.9 else "❌"
        lines.append(
            f"- Deadline correct: {deadline_ok}/{deadline_total} = {rate:.1%} (target ≥ 90%) {ok}"
        )
    lines += [
        f"- Errors (no usable answer): {failures}",
        f"- Tokens: {client.usage.total_tokens:,} in {client.usage.requests} requests, "
        f"{time.time() - started:.0f}s",
        "",
        "## Per segment",
        "",
        "| Segment | Emails | Recall | Precision |",
        "|---|---|---|---|",
    ]
    for s in labels:
        n = sum(confusion[s].values())
        predicted = sum(confusion[t][s] for t in confusion)
        recall = f"{confusion[s][s] / n:.0%}" if n else "—"
        precision = f"{confusion[s][s] / predicted:.0%}" if predicted else "—"
        lines.append(f"| {s} | {n} | {recall} | {precision} |")
    lines += ["", "## Mistakes", "", "| id | expected | got | subject |", "|---|---|---|---|"]
    lines += [f"| {i} | {e} | {g} | {subj[:70]} |" for i, e, g, subj in mistakes] or ["| — |"]

    report = "\n".join(lines) + "\n"
    out_dir = HERE / "results"
    out_dir.mkdir(exist_ok=True)
    out = out_dir / f"{datetime.now():%Y%m%d-%H%M}-{args.prompt}.md"
    out.write_text(report, encoding="utf-8")
    print("\n\n" + report + f"\nSaved to {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
