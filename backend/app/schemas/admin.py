from pydantic import BaseModel


class StatsOut(BaseModel):
    users: int
    emails_classified: int
    organisations: int
    ads: int
