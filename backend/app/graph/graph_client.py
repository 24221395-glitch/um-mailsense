"""Thin Microsoft Graph client (W2-BE-03). Owner: Raihan."""

import httpx

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


class GraphClient:
    def __init__(self, access_token: str) -> None:
        self._client = httpx.Client(
            base_url=GRAPH_BASE,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=20,
        )

    def list_messages(self, since_iso: str | None = None, top: int = 50) -> list[dict]:
        """GET /me/mailFolders/inbox/messages, newest first. TODO W2-BE-03."""
        raise NotImplementedError("W2-BE-03")
