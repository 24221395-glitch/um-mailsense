"""SHARED BOUNDARY between backend/ (Raihan) and ai/ (Iqbal).

This is the ONLY backend file allowed to import mailsense_ai. Everything else in the backend
imports AI types and functions from here. Freeze: 4 Nov 2026. Wiring into mail sync and the
profile routes is task W3-AI-03 (Iqbal + Raihan, due 10 Nov).
"""

from mailsense_ai.classifier import classify_email
from mailsense_ai.contracts import (
    SEGMENT_LABELS,
    Classification,
    CVProfile,
    EmailDetails,
    EmailInput,
    RecLabel,
    Recommendation,
    RecommendItem,
    Segment,
)
from mailsense_ai.cv_parser import parse_cv
from mailsense_ai.extractor import extract_details
from mailsense_ai.recommender import recommend

__all__ = [
    "SEGMENT_LABELS",
    "Classification",
    "CVProfile",
    "EmailDetails",
    "EmailInput",
    "RecLabel",
    "Recommendation",
    "RecommendItem",
    "Segment",
    "analyse_email",
    "build_profile",
    "score_items",
]


def analyse_email(email: EmailInput) -> tuple[Classification, EmailDetails]:
    """Classify one new email and extract its details. Called once per email by mail sync."""
    return classify_email(email), extract_details(email)


def build_profile(pdf_bytes: bytes) -> CVProfile:
    """Turn an uploaded CV into a profile."""
    return parse_cv(pdf_bytes)


def score_items(profile: CVProfile, items: list[RecommendItem]) -> list[Recommendation]:
    """Label emails and ads FOR_YOU / NOT_FOR_YOU for one student."""
    return recommend(profile, items)
