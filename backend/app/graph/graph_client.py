"""Reads the inbox of a Microsoft account (Siswamail/Outlook) through Microsoft Graph."""

from datetime import datetime

import httpx

from app.graph.base import FetchedEmail, MailAuthError, clip, html_to_text

GRAPH = "https://graph.microsoft.com/v1.0"
_FIELDS = "id,subject,from,receivedDateTime,bodyPreview,body,isRead,webLink"


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse(msg: dict) -> FetchedEmail:
    sender = (msg.get("from") or {}).get("emailAddress") or {}
    body = msg.get("body") or {}
    content = body.get("content") or ""
    if body.get("contentType") == "html":
        content = html_to_text(content)
    return FetchedEmail(
        provider_message_id=msg["id"],
        sender_name=sender.get("name") or sender.get("address") or "",
        sender_email=(sender.get("address") or "").lower(),
        subject=msg.get("subject") or "(no subject)",
        snippet=(msg.get("bodyPreview") or "")[:300],
        body_text=clip(content),
        received_at=datetime.fromisoformat(msg["receivedDateTime"].replace("Z", "+00:00")),
        is_read=bool(msg.get("isRead")),
        web_link=msg.get("webLink"),
    )


def fetch_inbox(access_token: str, since: datetime | None, limit: int) -> list[FetchedEmail]:
    params = {"$top": str(min(limit, 50)), "$select": _FIELDS, "$orderby": "receivedDateTime desc"}
    if since:
        params["$filter"] = f"receivedDateTime ge {_iso(since)}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Prefer": 'outlook.body-content-type="text"',
    }
    url: str | None = f"{GRAPH}/me/mailFolders/inbox/messages"
    out: list[FetchedEmail] = []
    with httpx.Client(timeout=30) as client:
        while url and len(out) < limit:
            resp = client.get(url, params=params, headers=headers)
            if resp.status_code in (401, 403):
                raise MailAuthError(resp.text[:300])
            resp.raise_for_status()
            data = resp.json()
            out.extend(_parse(m) for m in data.get("value", []))
            url, params = data.get("@odata.nextLink"), None  # nextLink already has the query
    return out[:limit]
