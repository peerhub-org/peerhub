import logging

from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.http._log_exporter import (
    OTLPLogExporter,
)
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor

from app.infrastructure.shared.config.config import settings

_telemetry_logger = logging.getLogger(__name__)
_is_initialized = False


def _is_otel_handler(handler: logging.Handler) -> bool:
    return isinstance(handler, LoggingHandler)


def setup_telemetry() -> None:
    global _is_initialized

    if _is_initialized:
        return

    otlp_exporter = OTLPLogExporter(
        endpoint=f"{settings.POSTHOG_HOST}/i/v1/logs",
        headers={"Authorization": f"Bearer {settings.POSTHOG_API_KEY}"},
    )
    logger_provider = LoggerProvider()
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(otlp_exporter))
    set_logger_provider(logger_provider)

    root_logger = logging.getLogger()
    if not any(_is_otel_handler(handler) for handler in root_logger.handlers):
        otel_handler = LoggingHandler(level=logging.INFO, logger_provider=logger_provider)
        root_logger.addHandler(otel_handler)

    _is_initialized = True
    _telemetry_logger.info("PostHog OpenTelemetry logging initialized")
