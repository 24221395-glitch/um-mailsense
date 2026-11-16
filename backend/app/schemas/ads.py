from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_serializer, field_validator

from app.graph.mail_sync import as_utc
from app.models import AD_CATEGORIES

MYT = timezone(timedelta(hours=8))


def _url(v: HttpUrl | str | None) -> str | None:
    return str(v) if v else None


def _myt(v: datetime | None) -> datetime | None:
    """Times typed without a zone are Malaysia time."""
    return v.replace(tzinfo=MYT) if v and v.tzinfo is None else v


def _iso(dt: datetime | None) -> str | None:
    return as_utc(dt).isoformat() if dt else None


# --- organisations -------------------------------------------------------------------------


class OrganisationIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str = Field("", max_length=2000)
    contact_email: str = Field(max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    website: HttpUrl | None = None
    faculty: str | None = Field(None, max_length=200)

    @field_validator("name", "description")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class OrganisationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    contact_email: str
    website: str | None
    faculty: str | None
    status: str
    review_note: str | None
    applied_at: datetime

    @field_serializer("applied_at")
    def _ser(self, dt):
        return _iso(dt)


# --- ads -----------------------------------------------------------------------------------


class AdIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field("", max_length=5000)
    category: str
    event_date: datetime | None = None
    deadline: datetime | None = None
    venue: str | None = Field(None, max_length=300)
    link: HttpUrl | None = None
    image_url: HttpUrl | None = None
    faculty: str | None = Field(None, max_length=200)
    target_fields: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("category")
    @classmethod
    def _category(cls, v: str) -> str:
        if v not in AD_CATEGORIES:
            raise ValueError(f"category must be one of {', '.join(AD_CATEGORIES)}")
        return v

    @field_validator("event_date", "deadline")
    @classmethod
    def _tz(cls, v):
        return _myt(v)

    @field_validator("target_fields")
    @classmethod
    def _fields(cls, v: list[str]) -> list[str]:
        return [f.strip()[:60] for f in v if f.strip()]

    def to_columns(self) -> dict:
        data = self.model_dump()
        data["link"] = _url(self.link)
        data["image_url"] = _url(self.image_url)
        data["title"] = self.title.strip()
        return data


class AdOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    event_date: datetime | None
    deadline: datetime | None
    venue: str | None
    link: str | None
    image_url: str | None
    faculty: str | None
    target_fields: list[str]
    organisation_id: int
    organisation_name: str
    created_at: datetime
    is_saved: bool = False
    recommendation: str | None = None
    recommendation_reason: str | None = None

    @field_serializer("event_date", "deadline", "created_at")
    def _ser(self, dt):
        return _iso(dt)


class AdPage(BaseModel):
    items: list[AdOut]
    total: int
    page: int
    page_size: int


class MyAdOut(AdOut):
    """An organisation's own post, with simple statistics (FR-33)."""

    status: str
    views: int
    saves: int
    open_reports: int


class ReportIn(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


# --- admin ---------------------------------------------------------------------------------


class ReviewIn(BaseModel):
    note: str | None = Field(None, max_length=500)


class AdModerationIn(BaseModel):
    status: str = Field(pattern="^(approved|hidden|removed)$")


class AdminOrganisationOut(OrganisationOut):
    owner_email: str


class AdminAdOut(MyAdOut):
    report_reasons: list[str] = Field(default_factory=list)


class StatsOut(BaseModel):
    users: int
    active_users_7d: int
    emails: int
    emails_classified: int
    organisations_pending: int
    organisations_approved: int
    ads_live: int
    reports_open: int
    llm: dict
