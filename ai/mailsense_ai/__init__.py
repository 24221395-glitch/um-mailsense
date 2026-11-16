"""UM MailSense AI package. Import the four contract functions from here."""

from mailsense_ai.classifier import classify_email
from mailsense_ai.contracts import (
    SEGMENT_LABELS,
    Classification,
    CVProfile,
    EmailDetails,
    EmailInput,
    Recommendation,
    RecommendItem,
    Segment,
)
from mailsense_ai.cv_parser import parse_cv
from mailsense_ai.extractor import extract_details
from mailsense_ai.llm_client import BudgetExceeded, LLMClient, LLMError, configure, get_client
from mailsense_ai.recommender import recommend

__all__ = [
    "SEGMENT_LABELS",
    "BudgetExceeded",
    "CVProfile",
    "Classification",
    "EmailDetails",
    "EmailInput",
    "LLMClient",
    "LLMError",
    "RecommendItem",
    "Recommendation",
    "Segment",
    "classify_email",
    "configure",
    "extract_details",
    "get_client",
    "parse_cv",
    "recommend",
]
