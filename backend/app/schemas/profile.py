from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _clean_list(values: list[str], limit: int) -> list[str]:
    seen, out = set(), []
    for v in values:
        v = v.strip()[:60]
        if v and v.lower() not in seen:
            seen.add(v.lower())
            out.append(v)
    return out[:limit]


class ProfileIn(BaseModel):
    """Manual create/edit of the profile (FR-22, FR-26)."""

    field_of_study: str | None = Field(None, max_length=200)
    year_of_study: int | None = Field(None, ge=1, le=5)
    skills: list[str] = Field(default_factory=list, max_length=30)
    interests: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("skills")
    @classmethod
    def _skills(cls, v: list[str]) -> list[str]:
        return _clean_list(v, 20)

    @field_validator("interests")
    @classmethod
    def _interests(cls, v: list[str]) -> list[str]:
        return _clean_list(v, 15)

    @field_validator("field_of_study")
    @classmethod
    def _field(cls, v: str | None) -> str | None:
        return (v or "").strip() or None


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    field_of_study: str | None
    year_of_study: int | None
    skills: list[str]
    interests: list[str]
    summary: str
    source: str
    cv_filename: str | None
    updated_at: datetime
