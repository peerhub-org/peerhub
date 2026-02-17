"""Domain-specific exceptions."""


class DomainException(Exception):
    """Base exception for domain layer."""

    status_code: int = 500

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class AccountNotFoundException(DomainException):
    """Raised when an account is not found."""

    status_code = 404

    def __init__(self, identifier: str):
        self.identifier = identifier
        super().__init__(f"Account not found: {identifier}")


class GitHubAuthException(DomainException):
    """Raised when GitHub authentication fails."""

    status_code = 400

    def __init__(self, message: str):
        super().__init__(f"GitHub authentication error: {message}")


class UserNotFoundException(DomainException):
    """Raised when a GitHub user is not found."""

    status_code = 404

    def __init__(self, username: str):
        self.username = username
        super().__init__(f"User not found: {username}")


class ReviewValidationException(DomainException):
    """Raised when review validation fails."""

    status_code = 400

    def __init__(self, message: str):
        super().__init__(f"Review validation error: {message}")


class SelfReviewException(DomainException):
    """Raised when a user tries to review themselves."""

    status_code = 400

    def __init__(self, username: str):
        self.username = username
        super().__init__(f"Cannot review yourself: {username}")


class AnonymousFieldImmutableException(DomainException):
    """Raised when attempting to change the anonymous field on an existing review."""

    status_code = 400

    def __init__(self) -> None:
        super().__init__("Cannot change anonymous status after review creation")


class ReviewNotFoundException(DomainException):
    """Raised when a review is not found."""

    status_code = 404

    def __init__(self, review_id: str):
        self.review_id = review_id
        super().__init__(f"Review not found: {review_id}")


class UnauthorizedActionException(DomainException):
    """Raised when a user is not authorized to perform an action."""

    status_code = 403

    def __init__(self, message: str):
        super().__init__(f"Unauthorized: {message}")


class SelfWatchException(DomainException):
    """Raised when a user tries to watch themselves."""

    status_code = 400

    def __init__(self, username: str):
        self.username = username
        super().__init__(f"Cannot watch yourself: {username}")


class GitHubAPIException(DomainException):
    """Raised when a GitHub API call fails."""

    status_code = 502

    def __init__(self, message: str):
        super().__init__(f"GitHub API error: {message}")


class AccessTokenMissingException(DomainException):
    """Raised when a required access token is missing."""

    status_code = 401

    def __init__(self) -> None:
        super().__init__("GitHub access token is missing")


class NotUserTypeException(DomainException):
    """Raised when an action targets a non-User type (e.g., Organization or Bot)."""

    status_code = 400

    def __init__(self, username: str):
        self.username = username
        super().__init__(f"Action not allowed: {username} is not a regular user")


class AccessRestrictedException(DomainException):
    """Raised when a user is not authorized to access the application."""

    status_code = 403

    def __init__(self) -> None:
        super().__init__("Access restricted. Your account is not authorized.")
