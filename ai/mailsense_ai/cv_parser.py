"""CV parser (W3-AI-01, due 7 Nov). Owner: Iqbal."""

from __future__ import annotations

from mailsense_ai.contracts import CVProfile


def parse_cv(pdf_bytes: bytes) -> CVProfile:
    """Read a PDF CV and extract field of study, year, skills and interests.

    Plan: pypdf for text, then prompts/cv_parse_v1.txt through the LLM client.
    """
    raise NotImplementedError("W3-AI-01: implement parse_cv")
