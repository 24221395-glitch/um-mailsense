import base64

from app.graph import gmail_client, graph_client


def _b64(s: str) -> str:
    return base64.urlsafe_b64encode(s.encode()).decode().rstrip("=")


def test_gmail_multipart_prefers_plain_text():
    msg = {
        "id": "abc",
        "internalDate": "1762000000000",
        "labelIds": ["INBOX", "UNREAD"],
        "snippet": "Join us &amp; win",
        "payload": {
            "mimeType": "multipart/alternative",
            "headers": [
                {"name": "From", "value": "UM Robotics Club <robotics@um.edu.my>"},
                {"name": "Subject", "value": "Robot Wars"},
            ],
            "parts": [
                {"mimeType": "text/plain", "body": {"data": _b64("Plain body")}},
                {"mimeType": "text/html", "body": {"data": _b64("<p>HTML body</p>")}},
            ],
        },
    }
    e = gmail_client._parse(msg)
    assert e.sender_name == "UM Robotics Club"
    assert e.sender_email == "robotics@um.edu.my"
    assert e.subject == "Robot Wars"
    assert e.snippet == "Join us & win"
    assert e.body_text == "Plain body"
    assert e.is_read is False
    assert e.received_at.year == 2025


def test_gmail_html_only_is_converted_to_text():
    msg = {
        "id": "x",
        "internalDate": "0",
        "labelIds": [],
        "payload": {
            "mimeType": "text/html",
            "headers": [],
            "body": {"data": _b64("<style>p{}</style><p>Hello</p><p>World</p>")},
        },
    }
    e = gmail_client._parse(msg)
    assert e.body_text == "Hello\nWorld"
    assert e.is_read is True
    assert e.subject == "(no subject)"


def test_graph_message_parsing():
    msg = {
        "id": "AAMk1",
        "subject": "Exam timetable",
        "from": {"emailAddress": {"name": "Registrar", "address": "Registrar@UM.edu.my"}},
        "receivedDateTime": "2026-11-08T00:00:00Z",
        "bodyPreview": "The final exam timetable...",
        "body": {"contentType": "html", "content": "<div>Timetable <b>released</b></div>"},
        "isRead": True,
        "webLink": "https://outlook.office365.com/owa/?ItemID=AAMk1",
    }
    e = graph_client._parse(msg)
    assert e.sender_email == "registrar@um.edu.my"
    assert e.body_text == "Timetable\nreleased"
    assert e.received_at.tzinfo is not None
    assert e.web_link.startswith("https://outlook")
