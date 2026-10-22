"""Inbox sync (W2-BE-03): fetch new messages, store them, classify via ai_bridge. Owner: Raihan."""

from sqlalchemy.orm import Session


class MailSyncService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def sync_inbox(self, user_id: str) -> int:
        """Fetch new messages for one user and return how many were added. TODO W2-BE-03."""
        raise NotImplementedError("W2-BE-03")
