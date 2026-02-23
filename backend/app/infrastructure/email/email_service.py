import logging

import resend

from app.infrastructure.shared.config.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications via Resend."""

    def __init__(self) -> None:
        self._configured = bool(
            settings.RESEND_API_KEY
            and settings.SENDER_EMAIL
            and settings.ABUSE_CONTROL_EMAIL
        )
        if self._configured:
            resend.api_key = settings.RESEND_API_KEY
        else:
            logger.warning(
                "Email service not configured: "
                "missing variables"
            )

    def send_new_review_notification(
        self,
        reviewer_username: str,
        reviewed_username: str,
        status: str,
        comment: str | None,
        anonymous: bool = False,
    ) -> None:
        """Send a notification email when a new review is created."""
        if not self._configured:
            return

        comment_text = comment or "(no comment)"
        if anonymous:
            reviewer_display = f"{reviewer_username} (as anonymous)"
        else:
            reviewer_display = reviewer_username
        params: resend.Emails.SendParams = {
            "from": f"PeerHub <{settings.SENDER_EMAIL}>",
            "to": [settings.ABUSE_CONTROL_EMAIL],  # type: ignore[list-item]
            "subject": f"New review: {reviewer_display} → {reviewed_username}",
            "html": (
                "<p><strong>Reviewer:</strong> "
                f"<a href='https://peerhub.dev/{reviewer_username}'>"
                f"{reviewer_display}</a></p>"
                "<p><strong>Reviewed:</strong> "
                f"<a href='https://peerhub.dev/{reviewed_username}'>"
                f"{reviewed_username}</a></p>"
                f"<p><strong>Status:</strong> {status}</p>"
                f"<p><strong>Comment:</strong> {comment_text}</p>"
            ),
        }
        resend.Emails.send(params)

    def send_new_account_notification(
        self,
        username: str,
    ) -> None:
        """Send a notification email when a new account is created."""
        if not self._configured:
            return

        params: resend.Emails.SendParams = {
            "from": f"PeerHub <{settings.SENDER_EMAIL}>",
            "to": [settings.ABUSE_CONTROL_EMAIL],  # type: ignore[list-item]
            "subject": f"New account: {username}",
            "html": (
                "<p><strong>Username:</strong> "
                f"<a href='https://peerhub.dev/{username}'>"
                f"{username}</a></p>"
            ),
        }
        resend.Emails.send(params)
