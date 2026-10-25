# ai/ · owner: Iqbal (Project Manager + AI / LLM Lead)

Create these files (Python package `mailsense_ai`). Task IDs are from the Project Hub.

```
ai/
├── pyproject.toml
├── mailsense_ai/
│   ├── __init__.py
│   ├── contracts.py        SHARED with Raihan · W1-AI-01 · freeze 28 Oct
│   ├── llm_client.py       W2-AI-01 · cost control W3-AI-04
│   ├── classifier.py       W2-AI-01 (80%+ accuracy)
│   ├── extractor.py        W2-AI-02
│   ├── cv_parser.py        W3-AI-01
│   ├── recommender.py      W3-AI-02
│   └── prompts/
│       ├── classify_v1.txt     W2-AI-01
│       ├── classify_v2.txt     W4-AI-01 (85%+ accuracy) · never overwrite v1
│       ├── extract_v1.txt      W2-AI-02
│       └── cv_parse_v1.txt     W3-AI-01
├── eval/
│   ├── labelled_emails.jsonl   W1-AI-02 (150 emails, personal data removed)
│   └── run_eval.py
└── tests/
```

`contracts.py` (W1-AI-01) is the agreement with Raihan on what the AI functions take in and give back,
so he can connect them before they are finished. It must define the 4 functions and the 7 segment codes:
- `classify_email(email) -> Classification`
- `extract_details(email) -> EmailDetails`
- `parse_cv(pdf_bytes) -> CVProfile`
- `recommend(profile, items) -> list[Recommendation]`
- Segments: `UM_NOTICE`, `HACKATHON`, `RESEARCH`, `EVENT`, `SCHOLARSHIP_CAREER`, `CLUB`, `NOT_FOR_ME`

Joint task with Raihan: connect this package to the backend through
`backend/app/services/ai_bridge.py` (W3-AI-03, due 10 Nov).

## Your PM tasks (not files in this folder)
W1-PM-01 kick-off · W1-PM-02 repo + branch protection · W1-PM-03 README, PR template, CODEOWNERS ·
W2-PM-02 release v0.2 ·
W3-PM-01 feature freeze + v0.3 · W4-PM-01 go/no-go + v1.0 · W4-PM-02 launch and demo
