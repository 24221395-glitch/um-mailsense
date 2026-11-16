"""Reads the inbox of a Google account through the Gmail API."""

import base64
import html as htmllib
from datetime import UTC, datetime
from email.utils import parseaddr

import httpx

from app.graph.base import FetchedEmail, MailAuthError, clip, html_to_text

GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me"


def _decode(data: str) -> str:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)).decode("utf-8", "replace")


def _find_body(payload: dict) -> tuple[str, str]:
    """Walk the MIME tree; return (plain_text, html) of the first parts found."""
    plain, html = "", ""
    stack = [payload]
    while stack:
        part = stack.pop()
        mime = part.get("mimeType", "")
        data = (part.get("body") or {}).get("data")
        if data and mime == "text/plain" and not plain:
            plain = _decode(data)
        elif data and mime == "text/html" and not html:
            html = _decode(data)
        stack.extend(reversed(part.get("parts") or []))
    return plain, html


def _parse(msg: dict) -> FetchedEmail:
    payload = msg.get("payload") or {}
    headers = {h["name"].lower(): h["value"] for h in payload.get("headers", [])}
    name, address = parseaddr(headers.get("from", ""))
    plain, html = _find_body(payload)
    body = plain or (html_to_text(html) if html else "")
    received = datetime.fromtimestamp(int(msg.get("internalDate", "0")) / 1000, tz=UTC)
    return FetchedEmail(
        provider_message_id=msg["id"],
        sender_name=name or address,
        sender_email=address.lower(),
        subject=headers.get("subject") or "(no subject)",
        snippet=htmllib.unescape(msg.get("snippet", ""))[:300],
        body_text=clip(body),
        received_at=received,
        is_read="UNREAD" not in msg.get("labelIds", []),
        web_link=f"https://mail.google.com/mail/u/0/#inbox/{msg['id']}",
    )


def fetch_inbox(access_token: str, since: datetime | None, limit: int) -> list[FetchedEmail]:
    query = "in:inbox"
    if since:
        query += f" after:{int(since.timestamp())}"
    headers = {"Authorization": f"Bearer {access_token}"}
    with httpx.Client(timeout=30, headers=headers) as client:
        ids: list[str] = []
        page_token = None
        while len(ids) < limit:
            params = {"q": query, "maxResults": str(min(limit - len(ids), 100))}
            if page_token:
                params["pageToken"] = page_token
            resp = client.get(f"{GMAIL}/messages", params=params)
            if resp.status_code in (401, 403):
                raise MailAuthError(resp.text[:300])
            resp.raise_for_status()
            data = resp.json()
            ids.extend(m["id"] for m in data.get("messages", []))
            page_token = data.get("nextPageToken")
            if not page_token:
                break

        out = []
        for msg_id in ids[:limit]:
            resp = client.get(f"{GMAIL}/messages/{msg_id}", params={"format": "full"})
            if resp.status_code == 404:  # deleted between list and get
                continue
            resp.raise_for_status()
            out.append(_parse(resp.json()))
    return out
