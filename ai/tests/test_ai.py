import json
from datetime import datetime

import httpx
import pytest

from mailsense_ai import (
    BudgetExceeded,
    EmailInput,
    LLMClient,
    LLMError,
    Segment,
    classify_email,
    extract_details,
)
from mailsense_ai.llm_client import parse_json_object


def fake_llm(*answers, status=200, usage=None, calls=None):
    """An LLMClient whose server replies with the given answers in order."""
    queue = list(answers)

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        if calls is not None:
            calls.append(body)
        if status != 200:
            return httpx.Response(status, text="nope")
        answer = queue.pop(0) if len(queue) > 1 else queue[0]
        content = answer if isinstance(answer, str) else json.dumps(answer)
        return httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": content}}],
                "usage": usage or {"prompt_tokens": 100, "completion_tokens": 20},
            },
        )

    return LLMClient("key", transport=httpx.MockTransport(handler), max_retries=0)


EMAIL = EmailInput(
    subject="UM Hackathon 2026 — register now",
    sender_name="FSKTM",
    sender_email="fsktm@um.edu.my",
    body_text="Join UM Hackathon on 5 Dec at DK1. Register by 28 Nov: https://forms.gle/abc123 .",
    received_at=datetime(2026, 11, 17, 9, 0),
)


# --- client ------------------------------------------------------------------------------


def test_request_uses_llama4_scout_and_temperature_0():
    calls = []
    client = fake_llm({"segment": "HACKATHON", "confidence": 0.9}, calls=calls)
    classify_email(EMAIL, client)
    sent = calls[0]
    assert sent["model"] == "meta-llama/llama-4-scout"
    assert sent["temperature"] == 0
    # OpenRouter has no Llama 4 Scout endpoint with JSON mode, so it is not requested
    assert "response_format" not in sent
    assert "<email_body>" in sent["messages"][1]["content"]


def test_json_mode_follows_the_provider():
    assert LLMClient("k", provider="groq").json_mode is True
    assert LLMClient("k", provider="openrouter").json_mode is False
    assert LLMClient("k", provider="openrouter", json_mode=True).json_mode is True


def test_providers_switch_by_name():
    c = LLMClient("k", provider="together")
    assert c.base_url == "https://api.together.xyz/v1" and "Llama-4-Scout" in c.model
    with pytest.raises(ValueError):
        LLMClient("k", provider="nope")


@pytest.mark.parametrize(
    "text",
    ['{"a": 1}', '```json\n{"a": 1}\n```', 'Sure! {"a": 1} hope that helps'],
)
def test_parse_json_tolerates_wrapping(text):
    assert parse_json_object(text) == {"a": 1}


def test_parse_json_rejects_garbage():
    with pytest.raises(LLMError):
        parse_json_object("no json here")


def test_bad_api_key_is_an_llm_error():
    with pytest.raises(LLMError, match="API key"):
        classify_email(EMAIL, fake_llm({}, status=401))


def test_rate_limit_is_retried(monkeypatch):
    monkeypatch.setattr("mailsense_ai.llm_client.time.sleep", lambda s: None)
    attempts = {"n": 0}

    def handler(request):
        attempts["n"] += 1
        if attempts["n"] < 3:
            return httpx.Response(429, headers={"retry-after": "1"})
        return httpx.Response(
            200, json={"choices": [{"message": {"content": '{"segment": "EVENT"}'}}]}
        )

    client = LLMClient("k", transport=httpx.MockTransport(handler), max_retries=3)
    assert classify_email(EMAIL, client).segment is Segment.EVENT
    assert attempts["n"] == 3


def test_daily_budget_stops_spending():
    client = fake_llm({"segment": "EVENT"}, usage={"prompt_tokens": 600, "completion_tokens": 0})
    client.daily_token_limit = 1000
    classify_email(EMAIL, client)
    classify_email(EMAIL, client)
    assert client.usage.total_tokens == 1200 and client.usage.requests == 2
    with pytest.raises(BudgetExceeded):
        classify_email(EMAIL, client)


# --- classifier ----------------------------------------------------------------------------


def test_classify_happy_path():
    result = classify_email(
        EMAIL, fake_llm({"segment": "HACKATHON", "confidence": 0.93, "reason": "Hackathon"})
    )
    assert result.segment is Segment.HACKATHON
    assert result.confidence == 0.93


def test_classify_normalises_sloppy_codes_and_confidence():
    result = classify_email(EMAIL, fake_llm({"segment": "scholarship career", "confidence": "9"}))
    assert result.segment is Segment.SCHOLARSHIP_CAREER
    assert result.confidence == 1.0


def test_classify_unknown_segment_is_error():
    with pytest.raises(LLMError):
        classify_email(EMAIL, fake_llm({"segment": "SPORTS"}))


def test_unsure_not_for_me_from_um_staff_becomes_notice():
    result = classify_email(EMAIL, fake_llm({"segment": "NOT_FOR_ME", "confidence": 0.55}))
    assert result.segment is Segment.UM_NOTICE


def test_confident_not_for_me_and_student_senders_are_left_alone():
    sure = classify_email(EMAIL, fake_llm({"segment": "NOT_FOR_ME", "confidence": 0.95}))
    assert sure.segment is Segment.NOT_FOR_ME
    student = EMAIL.model_copy(update={"sender_email": "24221395@siswa.um.edu.my"})
    unsure = classify_email(student, fake_llm({"segment": "NOT_FOR_ME", "confidence": 0.5}))
    assert unsure.segment is Segment.NOT_FOR_ME


def test_long_bodies_are_trimmed():
    calls = []
    long_email = EMAIL.model_copy(update={"body_text": "x" * 10_000})
    classify_email(long_email, fake_llm({"segment": "EVENT"}, calls=calls))
    assert len(calls[0]["messages"][1]["content"]) < 3000


# --- extractor -----------------------------------------------------------------------------


def test_extract_details():
    details = extract_details(
        EMAIL,
        fake_llm(
            {
                "deadline": "2026-11-28T23:59",
                "event_date": "2026-12-05",
                "venue": "DK1",
                "organiser": "FSKTM",
                "registration_link": "https://forms.gle/abc123",
            }
        ),
    )
    assert details.deadline.isoformat() == "2026-11-28T23:59:00+08:00"
    assert details.event_date.date().isoformat() == "2026-12-05"
    assert details.venue == "DK1" and details.organiser == "FSKTM"
    assert details.registration_link == "https://forms.gle/abc123"


def test_extract_rejects_invented_links_and_bad_values():
    details = extract_details(
        EMAIL,
        fake_llm(
            {
                "deadline": "next week",
                "event_date": None,
                "venue": "N/A",
                "organiser": "",
                "registration_link": "https://evil.example.com/login",
            }
        ),
    )
    assert details.model_dump() == {
        "deadline": None,
        "event_date": None,
        "venue": None,
        "organiser": None,
        "registration_link": None,
    }
