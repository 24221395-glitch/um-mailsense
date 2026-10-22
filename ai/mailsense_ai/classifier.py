"""Email classifier (W2-AI-01, due 3 Nov). Owner: Iqbal. Target: 80%+ accuracy, 85%+ by launch."""

from __future__ import annotations

from mailsense_ai.contracts import Classification, EmailInput


def classify_email(email: EmailInput) -> Classification:
    """Return the segment for one email. Prompt: prompts/classify_v1.txt."""
    raise NotImplementedError("W2-AI-01: implement classify_email")
