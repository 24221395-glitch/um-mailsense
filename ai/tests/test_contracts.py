"""Guards the shared contract so a change on either side is noticed in CI."""

from mailsense_ai import contracts
from mailsense_ai.contracts import SEGMENT_LABELS, Segment


def test_segment_codes_are_frozen():
    assert [s.value for s in Segment] == [
        "UM_NOTICE",
        "HACKATHON",
        "RESEARCH",
        "EVENT",
        "SCHOLARSHIP_CAREER",
        "CLUB",
        "NOT_FOR_ME",
    ]


def test_every_segment_has_a_label():
    assert set(SEGMENT_LABELS) == set(Segment)


def test_public_functions_exist():
    from mailsense_ai import classifier, cv_parser, extractor, recommender

    modules = [classifier, extractor, cv_parser, recommender]
    for name, module in zip(contracts.FUNCTIONS, modules, strict=True):
        assert callable(getattr(module, name))


def test_prompts_load():
    from mailsense_ai.llm_client import load_prompt

    for name in ("classify_v1", "extract_v1", "cv_parse_v1"):
        assert "JSON" in load_prompt(name)


def test_fill_prompt_keeps_json_braces():
    from mailsense_ai.llm_client import fill_prompt, load_prompt

    text = fill_prompt(
        load_prompt("classify_v1"),
        subject="Hi",
        sender_name="A",
        sender_address="a@b.c",
        body_text="Body",
    )
    assert "Subject: Hi" in text and '{"segment"' in text and "{subject}" not in text
