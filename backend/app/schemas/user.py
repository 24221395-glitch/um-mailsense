import uuid
from typing import Literal

from pydantic import BaseModel


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str | None
    role: Literal["student", "org_admin", "admin"]
