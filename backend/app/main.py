import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from posthog import Posthog
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import Response

from app.infrastructure.shared.config.config import settings
from app.infrastructure.shared.database.connection import init_database
from app.infrastructure.shared.observability.logging import setup_loggers
from app.infrastructure.shared.observability.telemetry import setup_telemetry
from app.presentation.api.exception_handlers import register_exception_handlers
from app.presentation.api.routes import api_router

setup_loggers()

if settings.ENVIRONMENT != "test":
    setup_telemetry()

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.posthog = None
    if settings.ENVIRONMENT != "test" and settings.POSTHOG_API_KEY:
        try:
            app.state.posthog = Posthog(
                project_api_key=settings.POSTHOG_API_KEY,
                host=settings.POSTHOG_HOST,
                enable_exception_autocapture=True,
                capture_exception_code_variables=True,
                project_root=str(Path(__file__).resolve().parent.parent),
                in_app_modules=["app"],
            )
            logger.info("PostHog exception autocapture initialized")
        except Exception:
            logger.exception("PostHog initialization failed")

    # Setup MongoDB
    app.state.client = AsyncIOMotorClient(settings.MONGO_URI)
    await init_database(app.state.client)
    logger.info("Database connection established")

    yield

    # Graceful shutdown
    app.state.client.close()
    if app.state.posthog is not None:
        try:
            app.state.posthog.shutdown()
            logger.info("PostHog client shutdown completed")
        except Exception:
            logger.exception("PostHog shutdown failed")
    logger.info("Database connection closed")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


@app.middleware("http")
async def capture_unhandled_exceptions(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    try:
        return await call_next(request)
    except Exception as exc:
        posthog_client: Posthog | None = getattr(request.app.state, "posthog", None)
        if posthog_client is not None:
            posthog_client.capture_exception(
                exc,
                properties={
                    "path": request.url.path,
                    "method": request.method,
                },
            )
        raise


# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# Register domain exception handlers
register_exception_handlers(app)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            # See https://github.com/pydantic/pydantic/issues/7186
            # for reason of using rstrip
            str(origin).rstrip("/")
            for origin in settings.BACKEND_CORS_ORIGINS
        ],
        allow_credentials=True,
        allow_methods=[
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allow_headers=["Authorization", "Content-Type"],
    )


app.include_router(api_router, prefix=settings.API_V1_STR)
