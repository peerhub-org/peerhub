import logging.config

from app.infrastructure.shared.config.config import settings

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": ("%(asctime)s [%(levelname)s] %(name)s: %(message)s"),
        },
        "json": {
            "format": (
                '{"timestamp":"%(asctime)s",'
                '"level":"%(levelname)s",'
                '"logger":"%(name)s",'
                '"message":"%(message)s"}'
            ),
        },
    },
    "handlers": {
        "default": {
            "level": "INFO",
            "formatter": ("json" if settings.ENVIRONMENT == "production" else "standard"),
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": True,
        },
        "httpx": {
            "handlers": ["default"],
            "level": "WARNING",
            "propagate": False,
        },
        "motor": {
            "handlers": ["default"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}


def setup_loggers() -> None:
    logging.config.dictConfig(LOGGING_CONFIG)
