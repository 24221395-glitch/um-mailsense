"""Shared shape for mail coming from any provider (Microsoft Graph or Gmail)."""

from dataclasses import dataclass
from datetime import datetime

from bs4 import BeautifulSoup

MAX_BODY_CHARS = 20_000


@dataclass
class FetchedEmail:
    provider_message_id: str
    sender_name: str
    sender_email: str
    subject: str
    snippet: str
    body_text: str
    received_at: datetime
    is_read: bool
    web_link: str | None


class MailAuthError(Exception):
    """The provider rejected our access token (e.g. consent revoked)."""


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "head"]):
        tag.decompose()
    text = soup.get_text("\n")
    lines = (line.strip() for line in text.splitlines())
    return "\n".join(line for line in lines if line)


def clip(text: str, limit: int = MAX_BODY_CHARS) -> str:
    return text if len(text) <= limit else text[:limit]
