"""The contract between the AI package and the backend (W1-AI-01).

The backend only ever calls these four functions (through backend/app/services/ai_bridge.py):

    classify_email(email)          -> Classification
    extract_details(email)         -> EmailDetails
    parse_cv(pdf_bytes)            -> CVProfile
    recommend(profile, items)      -> list[Recommendation]

Change this file only with care: the backend and the database depend on these shapes.
"""

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field


class Segment(StrEnum):
    UM_NOTICE = "UM_NOTICE"  # official UM: fees, exams, registration, timetable, IT, policies
    HACKATHON = "HACKATHON"  # hackathons, coding/case/business competitions
    RESEARCH = "RESEARCH"  # research assistant posts, lab openings, research grants, papers
    EVENT = "EVENT"  # talks, workshops, seminars, programmes, festivals
    SCHOLARSHIP_CAREER = "SCHOLARSHIP_CAREER"  # scholarships, internships, jobs, career fairs
    CLUB = "CLUB"  # student clubs / societies: recruitment, meetings, activities
    NOT_FOR_ME = "NOT_FOR_ME"  # newsletters, spam, surveys, ads, irrelevant mail


SEGMENT_LABELS: dict[Segment, str] = {
    Segment.UM_NOTICE: "UM Official Notice",
    Segment.HACKATHON: "Hackathon & Competition",
    Segment.RESEARCH: "Research Opportunity",
    Segment.EVENT: "Events & Programmes",
    Segment.SCHOLARSHIP_CAREER: "Scholarships & Careers",
    Segment.CLUB: "Club & Community",
    Segment.NOT_FOR_ME: "Not for me",
}


# --- Inputs -------------------------------------------------------------------------------


class EmailInput(BaseModel):
    subject: str
    sender_name: str = ""
    sender_email: str = ""
    body_text: str = ""
    received_at: datetime | None = None  # used to resolve "this Friday", "tomorrow", ...


class RecommendItem(BaseModel):
    """Something that can be recommended: a synced email or an ad-board post."""

    id: str  # e.g. "email:42" or "ad:7"
    kind: Literal["email", "ad"]
    title: str
    text: str = ""
    segment: Segment | None = None
    target_fields: list[str] = Field(default_factory=list)  # set by organisations (FR-32)


# --- Outputs ------------------------------------------------------------------------------


class Classification(BaseModel):
    segment: Segment
    confidence: float = Field(ge=0, le=1)
    reason: str = ""


class EmailDetails(BaseModel):
    deadline: datetime | None = None  # last day to register / apply / submit
    event_date: datetime | None = None  # when the event itself happens
    venue: str | None = None
    organiser: str | None = None
    registration_link: str | None = None


class CVProfile(BaseModel):
    field_of_study: str | None = None
    year_of_study: int | None = None
    skills: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    summary: str = ""


class Recommendation(BaseModel):
    item_id: str
    score: float = Field(ge=0, le=1)
    label: Literal["for_you", "not_for_you"]
    reason: str = ""  # e.g. "Matches your skill: Python" (FR-25)
