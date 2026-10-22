"""SHARED CONTRACT between ai/ (Iqbal) and backend/ (Raihan).

Freeze: 28 Oct 2026 (task W1-AI-01). After the freeze, change this file only on a
`contract/` branch approved by both owners.

The backend never imports anything from mailsense_ai except the names in this file and the
four functions listed in FUNCTIONS below, and only from backend/app/services/ai_bridge.py.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum


class Segment(StrEnum):
    """The 7 email segments. Same codes in the database, API and frontend."""

    UM_NOTICE = "UM_NOTICE"
    HACKATHON = "HACKATHON"
    RESEARCH = "RESEARCH"
    EVENT = "EVENT"
    SCHOLARSHIP_CAREER = "SCHOLARSHIP_CAREER"
    CLUB = "CLUB"
    NOT_FOR_ME = "NOT_FOR_ME"


SEGMENT_LABELS: dict[Segment, str] = {
    Segment.UM_NOTICE: "UM Official Notice",
    Segment.HACKATHON: "Hackathon & Competition",
    Segment.RESEARCH: "Research Opportunity",
    Segment.EVENT: "Events & Programmes",
    Segment.SCHOLARSHIP_CAREER: "Scholarships & Careers",
    Segment.CLUB: "Club & Community",
    Segment.NOT_FOR_ME: "Not for me",
}


class RecLabel(StrEnum):
    FOR_YOU = "FOR_YOU"
    NOT_FOR_YOU = "NOT_FOR_YOU"


@dataclass(frozen=True)
class EmailInput:
    """One email as the backend passes it in."""

    id: str
    subject: str
    sender_name: str
    sender_address: str
    received_at: datetime
    body_text: str


@dataclass(frozen=True)
class Classification:
    segment: Segment
    confidence: float  # 0.0 – 1.0


@dataclass(frozen=True)
class EmailDetails:
    deadline: datetime | None = None
    venue: str | None = None
    organiser: str | None = None
    link: str | None = None


@dataclass(frozen=True)
class CVProfile:
    field_of_study: str | None = None
    year_of_study: int | None = None
    skills: list[str] = field(default_factory=list)
    interests: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class RecommendItem:
    """An email or ad to score against a profile."""

    item_type: str  # "email" or "ad"
    item_id: str
    title: str
    text: str
    category: Segment


@dataclass(frozen=True)
class Recommendation:
    item_type: str
    item_id: str
    score: float  # 0.0 – 1.0
    label: RecLabel
    reason: str | None = None


# The four public functions. Signatures are part of the contract.
#   classify_email(email: EmailInput) -> Classification            (classifier.py)
#   extract_details(email: EmailInput) -> EmailDetails             (extractor.py)
#   parse_cv(pdf_bytes: bytes) -> CVProfile                        (cv_parser.py)
#   recommend(profile: CVProfile, items: list[RecommendItem]) -> list[Recommendation]
#                                                                  (recommender.py)
FUNCTIONS = ("classify_email", "extract_details", "parse_cv", "recommend")
