"""Talks to Llama 4 Scout through any OpenAI-compatible chat API (OpenRouter, Together, Groq).

Cost control (W3-AI-04):
- callers send each email once and trim long bodies (see classifier/extractor)
- a daily token cap stops spending if something goes wrong (raises BudgetExceeded)
- token usage is counted so the admin dashboard can show LLM cost (FR-41)
"""

import json
import logging
import re
import threading
import time
from dataclasses import dataclass, field
from datetime import date

import httpx

log = logging.getLogger(__name__)

PROVIDERS = {
    # Llama 4 Scout (the default). Groq stopped serving Llama 4 in 2026.
    "openrouter": ("https://openrouter.ai/api/v1", "meta-llama/llama-4-scout"),
    "together": ("https://api.together.xyz/v1", "meta-llama/Llama-4-Scout-17B-16E-Instruct"),
    # Free fallback for local testing only (not Llama).
    "groq": ("https://api.groq.com/openai/v1", "openai/gpt-oss-20b"),
}


class LLMError(Exception):
    """The LLM could not give a usable answer (network, auth, bad JSON...)."""


class BudgetExceeded(LLMError):
    """Daily token limit reached. Pending emails are classified tomorrow."""


@dataclass
class Usage:
    day: date = field(default_factory=date.today)
    prompt_tokens: int = 0
    completion_tokens: int = 0
    requests: int = 0

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens


class LLMClient:
    def __init__(
        self,
        api_key: str,
        provider: str = "openrouter",
        model: str | None = None,
        base_url: str | None = None,
        daily_token_limit: int = 0,  # 0 = no limit
        timeout: float = 45,
        max_retries: int = 4,
        transport: httpx.BaseTransport | None = None,  # for tests
    ):
        if provider not in PROVIDERS and not base_url:
            raise ValueError(f"Unknown LLM provider {provider!r}; set base_url")
        default_url, default_model = PROVIDERS.get(provider, ("", ""))
        self.base_url = (base_url or default_url).rstrip("/")
        self.model = model or default_model
        self.daily_token_limit = daily_token_limit
        self.max_retries = max_retries
        self.usage = Usage()
        self._lock = threading.Lock()
        self._http = httpx.Client(
            timeout=timeout,
            transport=transport,
            headers={
                "Authorization": f"Bearer {api_key}",
                "X-Title": "UM MailSense",  # shown on the OpenRouter usage page
            },
        )

    # --- budget --------------------------------------------------------------------------

    def _check_budget(self) -> None:
        with self._lock:
            if self.usage.day != date.today():
                self.usage = Usage()
            if self.daily_token_limit and self.usage.total_tokens >= self.daily_token_limit:
                raise BudgetExceeded(f"Daily limit of {self.daily_token_limit} tokens reached")

    def _record(self, usage: dict) -> None:
        with self._lock:
            self.usage.prompt_tokens += int(usage.get("prompt_tokens", 0))
            self.usage.completion_tokens += int(usage.get("completion_tokens", 0))
            self.usage.requests += 1

    # --- calls ---------------------------------------------------------------------------

    def _post(self, payload: dict) -> dict:
        delay = 2.0
        for attempt in range(self.max_retries + 1):
            try:
                resp = self._http.post(f"{self.base_url}/chat/completions", json=payload)
            except httpx.HTTPError as exc:
                if attempt == self.max_retries:
                    raise LLMError(f"LLM unreachable: {exc}") from exc
            else:
                if resp.status_code == 200:
                    return resp.json()
                if resp.status_code in (401, 403):
                    raise LLMError(f"LLM rejected the API key ({resp.status_code})")
                retryable = resp.status_code == 429 or resp.status_code >= 500
                if not retryable or attempt == self.max_retries:
                    raise LLMError(f"LLM error {resp.status_code}: {resp.text[:300]}")
                retry_after = resp.headers.get("retry-after")
                if retry_after and retry_after.replace(".", "", 1).isdigit():
                    delay = max(delay, float(retry_after))
            log.info("LLM busy, retrying in %.1fs", delay)
            time.sleep(min(delay, 60))
            delay *= 2
        raise LLMError("unreachable")  # pragma: no cover

    def chat_json(self, system: str, user: str, max_tokens: int = 300) -> dict:
        """Send one chat request and return the model's answer parsed as a JSON object."""
        self._check_budget()
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "temperature": 0,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
        data = self._post(payload)
        self._record(data.get("usage") or {})
        try:
            content = data["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError) as exc:
            raise LLMError(f"Unexpected LLM response: {str(data)[:300]}") from exc
        return parse_json_object(content)


def parse_json_object(text: str) -> dict:
    """Parse a JSON object, tolerating ```json fences or text around it."""
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise LLMError(f"LLM did not return JSON: {text[:200]}") from None
        try:
            value = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise LLMError(f"LLM returned invalid JSON: {text[:200]}") from exc
    if not isinstance(value, dict):
        raise LLMError("LLM returned JSON that is not an object")
    return value


# --- shared client used by the package-level functions ------------------------------------

_client: LLMClient | None = None


def configure(client: LLMClient) -> None:
    """Called once by the backend at start-up with its settings."""
    global _client
    _client = client


def get_client() -> LLMClient:
    if _client is None:
        raise LLMError("LLM not configured: set LLM_API_KEY in backend/.env")
    return _client
