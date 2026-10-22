# ai/ · owner: Iqbal

Create these files (Python package `mailsense_ai`):

```
ai/
├── pyproject.toml
├── mailsense_ai/
│   ├── __init__.py
│   ├── contracts.py        SHARED with Raihan · W1-AI-01 · freeze 28 Oct
│   ├── llm_client.py       W2-AI-01, W3-AI-04
│   ├── classifier.py       W2-AI-01
│   ├── extractor.py        W2-AI-02
│   ├── cv_parser.py        W3-AI-01
│   ├── recommender.py      W3-AI-02
│   └── prompts/
│       ├── classify_v1.txt
│       ├── extract_v1.txt
│       └── cv_parse_v1.txt
├── eval/
│   ├── labelled_emails.jsonl   W1-AI-02
│   └── run_eval.py
└── tests/
```

Segment codes (same everywhere): `UM_NOTICE`, `HACKATHON`, `RESEARCH`, `EVENT`, `SCHOLARSHIP_CAREER`, `CLUB`, `NOT_FOR_ME`.
