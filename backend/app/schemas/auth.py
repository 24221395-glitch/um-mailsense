from pydantic import BaseModel, ConfigDict


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider: str
    email: str
    needs_reconnect: bool


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    accounts: list[AccountOut]


class ProvidersOut(BaseModel):
    microsoft: bool
    google: bool
    demo: bool = False
