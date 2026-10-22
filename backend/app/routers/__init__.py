from fastapi import HTTPException, status


def not_built(task_id: str) -> HTTPException:
    """Placeholder for a route whose task is not finished yet. Remove when you build the route."""
    return HTTPException(status.HTTP_501_NOT_IMPLEMENTED, f"Not built yet (task {task_id}).")
