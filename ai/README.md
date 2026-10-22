# ai/ (owner: Iqbal)

Python package `mailsense_ai`. The backend calls it **only** through `backend/app/services/ai_bridge.py`.

| File | Task | Due |
|---|---|---|
| `mailsense_ai/contracts.py` (SHARED with Raihan) | W1-AI-01 | 28 Oct (freeze) |
| `eval/labelled_emails.jsonl` | W1-AI-02 | 28 Oct |
| `mailsense_ai/llm_client.py`, `classifier.py` | W2-AI-01 | 3 Nov |
| `mailsense_ai/extractor.py` | W2-AI-02 | 4 Nov |
| `mailsense_ai/cv_parser.py` | W3-AI-01 | 7 Nov |
| `mailsense_ai/recommender.py` | W3-AI-02 | 9 Nov |
| cost control in `llm_client.py` | W3-AI-04 | 11 Nov |
| `prompts/classify_v2.txt` | W4-AI-01 | 15 Nov |

```bash
pip install -e ".[dev]"
pytest -q
python eval/run_eval.py        # accuracy on the labelled set (after W2-AI-01)
```

Prompt files are versioned: never edit `classify_v1.txt` after it is merged; add `classify_v2.txt`.
