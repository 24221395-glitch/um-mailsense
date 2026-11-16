from logging.config import fileConfig

from alembic import context

import app.models  # noqa: F401  (registers every table)
from app.core.config import get_settings
from app.core.database import Base, UTCDateTime, make_engine
from app.core.security import EncryptedText

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
DB_URL = get_settings().database_url


def render_item(type_, obj, autogen_context):
    # Encrypted columns are plain TEXT in the database.
    if type_ == "type" and isinstance(obj, EncryptedText):
        return "sa.Text()"
    if type_ == "type" and isinstance(obj, UTCDateTime):
        return "sa.DateTime(timezone=True)"
    return False


def _configure(**kwargs):
    context.configure(
        target_metadata=target_metadata,
        render_item=render_item,
        render_as_batch=DB_URL.startswith("sqlite"),  # SQLite needs batch mode for ALTER
        **kwargs,
    )


def run_migrations_offline() -> None:
    _configure(url=DB_URL, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = make_engine(DB_URL)
    with engine.connect() as connection:
        _configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
