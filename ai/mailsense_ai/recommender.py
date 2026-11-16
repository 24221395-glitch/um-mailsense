"""recommend(profile, items) -> list[Recommendation]   (W3-AI-02) — built in milestone 3."""

from mailsense_ai.contracts import CVProfile, Recommendation, RecommendItem


def recommend(profile: CVProfile, items: list[RecommendItem]) -> list[Recommendation]:
    raise NotImplementedError("Recommendations arrive in milestone 3")
