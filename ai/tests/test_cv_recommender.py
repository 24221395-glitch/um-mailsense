import io
import json
import zipfile

import httpx
import pytest

from mailsense_ai import (
    BudgetExceeded,
    CVParseError,
    CVProfile,
    LLMClient,
    RecommendItem,
    Segment,
    parse_cv,
    recommend,
)
from mailsense_ai.cv_parser import extract_text

CV_LINES = [
    "Ahmad Student - ahmad@siswa.um.edu.my - 012-3456789",
    "Bachelor of Computer Science (Artificial Intelligence), Universiti Malaya, Year 2",
    "Skills: Python, SQL, TensorFlow, public speaking",
    "Projects: Malay sentiment analysis with machine learning",
]


def make_pdf(lines: list[str]) -> bytes:
    """Build a tiny valid one-page PDF containing the given text lines."""
    text_ops = (
        "BT /F1 11 Tf 50 750 Td 14 TL "
        + " ".join(
            "(" + ln.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") + ") Tj T*"
            for ln in lines
        )
        + " ET"
    )
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(text_ops)} >>\nstream\n{text_ops}\nendstream",
    ]
    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects, 1):
        offsets.append(out.tell())
        out.write(f"{i} 0 obj\n{obj}\nendobj\n".encode("latin-1"))
    xref = out.tell()
    out.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for off in offsets:
        out.write(f"{off:010d} 00000 n \n".encode())
    out.write(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode())
    out.write(f"startxref\n{xref}\n%%EOF\n".encode())
    return out.getvalue()


def make_docx(lines: list[str]) -> bytes:
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    body = "".join(f"<w:p><w:r><w:t>{ln}</w:t></w:r></w:p>" for ln in lines)
    xml = f'<?xml version="1.0"?><w:document xmlns:w="{ns}"><w:body>{body}</w:body></w:document>'
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("word/document.xml", xml)
    return buf.getvalue()


def llm(answer: dict, calls: list | None = None, status: int = 200) -> LLMClient:
    def handler(request):
        if calls is not None:
            calls.append(json.loads(request.content))
        if status != 200:
            return httpx.Response(status, text="err")
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(answer)}}]})

    return LLMClient("k", transport=httpx.MockTransport(handler), max_retries=0)


# --- CV text extraction ---------------------------------------------------------------------


def test_pdf_and_docx_text_extraction():
    pdf_text = extract_text(make_pdf(CV_LINES))
    assert "TensorFlow" in pdf_text and "Artificial Intelligence" in pdf_text
    docx_text = extract_text(make_docx(CV_LINES))
    assert "TensorFlow" in docx_text


@pytest.mark.parametrize(
    "data, message",
    [
        (b"GIF89a....", "PDF or Word"),
        (make_pdf(["hi"]), "No text found"),
        (b"%PDF-1.4 garbage", "could not be read"),
        (b"PK\x03\x04garbage", "could not be read"),
    ],
)
def test_bad_files_give_friendly_errors(data, message):
    with pytest.raises(CVParseError, match=message):
        extract_text(data)


# --- parse_cv ----------------------------------------------------------------------------


def test_parse_cv_builds_clean_profile():
    calls = []
    answer = {
        "field_of_study": "Computer Science (Artificial Intelligence)",
        "year_of_study": "2",
        "skills": ["Python", "SQL", "python", "TensorFlow", ""],
        "interests": ["Machine learning", "NLP"],
        "summary": "Second-year AI student interested in NLP.",
    }
    profile = parse_cv(make_pdf(CV_LINES), llm(answer, calls))
    assert profile.field_of_study == "Computer Science (Artificial Intelligence)"
    assert profile.year_of_study == 2
    assert profile.skills == ["Python", "SQL", "TensorFlow"]  # deduplicated, blanks dropped
    assert "<cv>" in calls[0]["messages"][1]["content"]


def test_parse_cv_ignores_bad_values():
    answer = {"field_of_study": None, "year_of_study": 9, "skills": "Python", "interests": None}
    profile = parse_cv(make_docx(CV_LINES), llm(answer))
    assert profile.field_of_study is None and profile.year_of_study is None
    assert profile.skills == [] and profile.interests == []


# --- recommend ---------------------------------------------------------------------------

PROFILE = CVProfile(
    field_of_study="Computer Science",
    year_of_study=2,
    skills=["Python", "SQL"],
    interests=["Machine learning"],
)


def item(i, segment, title="Something", text=""):
    return RecommendItem(id=f"email:{i}", kind="email", title=title, text=text, segment=segment)


def test_security_messages_are_for_you_without_the_llm():
    calls = []
    recs = recommend(PROFILE, [item(1, Segment.SECURITY)], llm({"results": []}, calls))
    assert recs[0].label == "for_you" and recs[0].reason == "About your account security"
    assert calls == []


def test_notices_and_not_for_me_skip_the_llm():
    calls = []
    items = [item(1, Segment.UM_NOTICE), item(2, Segment.NOT_FOR_ME)]
    recs = recommend(PROFILE, items, llm({"results": []}, calls))
    assert [r.label for r in recs] == ["for_you", "not_for_you"]
    assert recs[0].reason == "Official UM notice"
    assert calls == []


def test_llm_scores_in_batches_and_keeps_order():
    calls = []
    items = [item(i, Segment.EVENT) for i in range(20)]
    answer = {
        "results": [
            {"id": f"email:{i}", "score": 0.9 if i % 2 else 0.2, "reason": "Matches your interest"}
            for i in range(20)
        ]
    }
    recs = recommend(PROFILE, items, llm(answer, calls))
    assert len(calls) == 2  # 15 + 5
    assert [r.item_id for r in recs] == [f"email:{i}" for i in range(20)]
    assert recs[1].label == "for_you" and recs[0].label == "not_for_you"
    assert "Python" in calls[0]["messages"][1]["content"]


def test_missing_or_bad_llm_rows_fall_back_to_keywords():
    items = [
        item(1, Segment.RESEARCH, "RA needed", "Python and machine learning project"),
        item(2, Segment.EVENT, "Batik painting workshop"),
    ]
    answer = {"results": [{"id": "email:2", "score": "high"}, {"id": "email:99", "score": 1}]}
    recs = recommend(PROFILE, items, llm(answer))
    assert recs[0].label == "for_you" and recs[0].reason == "Matches your skill: Python"
    assert recs[1].label == "not_for_you"


def test_llm_down_uses_keywords_but_budget_stops():
    items = [item(1, Segment.HACKATHON, "SQL challenge")]
    recs = recommend(PROFILE, items, llm({}, status=500))
    assert recs[0].reason == "Matches your skill: SQL"

    client = llm({"results": []})
    client.daily_token_limit = 1
    client.usage.prompt_tokens = 5
    with pytest.raises(BudgetExceeded):
        recommend(PROFILE, items, client)


def test_keyword_match_needs_whole_words():
    items = [item(1, Segment.EVENT, "Pythonic snakes exhibition")]
    recs = recommend(PROFILE, items, llm({}, status=500))
    assert recs[0].label == "not_for_you"
