import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.domain.shared.exceptions import DomainException

logger = logging.getLogger(__name__)


async def domain_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Generic handler for all DomainException subclasses."""
    if not isinstance(exc, DomainException):
        logger.error("Unexpected exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc)},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register the generic domain exception handler."""
    app.add_exception_handler(DomainException, domain_exception_handler)
