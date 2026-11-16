"""parse_cv(pdf_bytes) -> CVProfile   (W3-AI-01, FR-20/21)

Accepts a PDF or a Word .docx file (FR-20). The file is only read in memory; nothing is saved.
"""

import io
import re
import zipfile
from xml.etree import ElementTree

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from mailsense_ai.contracts import CVProfile
from mailsense_ai.llm_client import LLMClient, get_client
from mailsense_ai.prompts import load

PROMPT_VERSION = "cv_parse_v1"
MAX_CV_CHARS = 8000
MAX_PAGES = 10
_W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


class CVParseError(Exception):
    """The file could not be read (wrong type, encrypted, scanned image with no text...)."""


def _pdf_text(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise CVParseError("This PDF is password-protected. Please upload an unlocked copy.")
        pages = reader.pages[:MAX_PAGES]
        return "\n".join((page.extract_text() or "") for page in pages)
    except (PdfReadError, ValueError, KeyError) as exc:
        raise CVParseError("This PDF could not be read.") from exc


def _docx_text(data: bytes) -> str:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            info = z.getinfo("word/document.xml")
            if info.file_size > 20_000_000:  # zip-bomb guard
                raise CVParseError("This Word file is too large.")
            root = ElementTree.fromstring(z.read(info))
    except (zipfile.BadZipFile, KeyError, ElementTree.ParseError) as exc:
        raise CVParseError("This Word file could not be read.") from exc
    paragraphs = []
    for p in root.iter(f"{_W}p"):
        text = "".join(t.text or "" for t in p.iter(f"{_W}t"))
        if text.strip():
            paragraphs.append(text)
    return "\n".join(paragraphs)


def extract_text(data: bytes) -> str:
    if data[:5] == b"%PDF-":
        text = _pdf_text(data)
    elif data[:2] == b"PK":
        text = _docx_text(data)
    else:
        raise CVParseError("Please upload your CV as a PDF or Word (.docx) file.")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text).strip()
    if len(text) < 50:
        raise CVParseError(
            "No text found in this file. If it is a scanned image, please upload a text PDF."
        )
    return text[:MAX_CV_CHARS]


def _str_list(value: object, limit: int) -> list[str]:
    if not isinstance(value, list):
        return []
    seen, out = set(), []
    for item in value:
        text = str(item).strip()[:60]
        if text and text.lower() not in seen:
            seen.add(text.lower())
            out.append(text)
    return out[:limit]


def _year(value: object) -> int | None:
    try:
        year = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return year if 1 <= year <= 5 else None


def parse_cv(pdf_bytes: bytes, client: LLMClient | None = None) -> CVProfile:
    """Read a CV (PDF or DOCX bytes) and return the student's profile."""
    text = extract_text(pdf_bytes)
    client = client or get_client()
    data = client.chat_json(load(PROMPT_VERSION), f"<cv>\n{text}\n</cv>", max_tokens=500)
    field = str(data.get("field_of_study") or "").strip()[:200] or None
    return CVProfile(
        field_of_study=None if field and field.lower() in {"null", "none"} else field,
        year_of_study=_year(data.get("year_of_study")),
        skills=_str_list(data.get("skills"), 15),
        interests=_str_list(data.get("interests"), 10),
        summary=str(data.get("summary") or "").strip()[:300],
    )
