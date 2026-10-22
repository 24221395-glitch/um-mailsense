# Evaluation set (W1-AI-02)

`labelled_emails.jsonl`: one JSON object per line with `id`, `subject`, `sender`, `body`, `segment`.
The 3 lines marked `[EXAMPLE]` show the format; replace them with 150 real-looking UM emails.
Remove names, matric numbers, phone numbers and personal addresses before committing.

Run: `python eval/run_eval.py`
