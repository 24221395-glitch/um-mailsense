"""Versioned prompt files. Never overwrite an old version; add classify_v2.txt etc. instead."""

from functools import cache
from importlib.resources import files


@cache
def load(name: str) -> str:
    return files(__package__).joinpath(f"{name}.txt").read_text(encoding="utf-8")
