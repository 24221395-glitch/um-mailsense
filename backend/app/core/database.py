from collections.abc import Iterator
from datetime import UTC, datetime

from sqlalchemy import DateTime, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.types import TypeDecorator

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


class UTCDateTime(TypeDecorator):
    """Always store UTC and always read back an aware UTC datetime.

    SQLite has no time zones and would silently drop "+08:00"; PostgreSQL keeps them.
    This makes both behave the same.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect):
        if value is None:
            return None
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _enable_sqlite_foreign_keys(dbapi_conn, _record):
    # SQLite ignores ON DELETE CASCADE unless this is on (needed for "delete my data").
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def make_engine(url: str, **kwargs):
    if url.startswith("sqlite"):
        kwargs.setdefault("connect_args", {"check_same_thread": False})
    else:
        # Serverless functions come and go: check connections before use, keep the pool small
        kwargs.setdefault("pool_pre_ping", True)
        kwargs.setdefault("pool_size", 3)
        kwargs.setdefault("max_overflow", 2)
        kwargs.setdefault("pool_recycle", 300)
    eng = create_engine(url, **kwargs)
    if url.startswith("sqlite"):
        event.listen(eng, "connect", _enable_sqlite_foreign_keys)
    return eng


engine = make_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
