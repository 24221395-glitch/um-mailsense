"""Detail extractor (W2-AI-02, due 4 Nov). Owner: Iqbal."""

from __future__ import annotations

from mailsense_ai.contracts import EmailDetails, EmailInput


def extract_details(email: EmailInput) -> EmailDetails:
    """Pull deadline, venue, organiser and link out of an email. Prompt: prompts/extract_v1.txt."""
    raise NotImplementedError("W2-AI-02: implement extract_details")
