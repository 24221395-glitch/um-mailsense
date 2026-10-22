"""Recommendation engine (W3-AI-02, due 9 Nov). Owner: Iqbal."""

from __future__ import annotations

from mailsense_ai.contracts import CVProfile, Recommendation, RecommendItem


def recommend(profile: CVProfile, items: list[RecommendItem]) -> list[Recommendation]:
    """Score each item 0–1 against the profile and label it FOR_YOU or NOT_FOR_YOU."""
    raise NotImplementedError("W3-AI-02: implement recommend")
