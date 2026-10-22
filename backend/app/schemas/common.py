from typing import Generic, Literal, TypeVar

from pydantic import BaseModel

T = TypeVar("T")

ItemType = Literal["email", "ad"]


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class Message(BaseModel):
    detail: str
