"""LLM client (W2-AI-01, cost control in W3-AI-04). Owner: Iqbal.

Reads LLM_API_KEY, LLM_MODEL and LLM_MAX_TOKENS from the environment.
Cost rules (NFR-07): each email is sent at most once, results are cached, calls are batched.
"""

from __future__ import annotations

import os
from importlib import resources


def load_prompt(name: str) -> str:
    """Load a versioned prompt file, e.g. load_prompt("classify_v1")."""
    return resources.files("mailsense_ai.prompts").joinpath(f"{name}.txt").read_text("utf-8")


def fill_prompt(template: str, **values: str) -> str:
    """Insert values into {placeholders} with plain replace, so JSON braces stay intact."""
    for key, value in values.items():
        template = template.replace("{" + key + "}", value)
    return template


class LLMClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or os.getenv("LLM_API_KEY", "")
        self.model = model or os.getenv("LLM_MODEL", "")
        self.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "1024"))

    def complete_json(self, system: str, user: str) -> dict:
        """Send one request and return the parsed JSON answer. TODO W2-AI-01."""
        raise NotImplementedError("W2-AI-01: implement the LLM call")
