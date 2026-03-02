from dataclasses import dataclass

from fastapi import Request
from posthog import Posthog

FEATURE_FLAG_DEFAULTS: dict[str, bool] = {
    "open-draft-profiles": True,
}


@dataclass(frozen=True)
class FeatureFlags:
    open_draft_profiles: bool


def get_feature_flags(request: Request) -> FeatureFlags:
    """Resolve feature flags from PostHog, falling back to defaults."""
    posthog_client: Posthog | None = getattr(request.app.state, "posthog", None)
    if posthog_client is not None:
        posthog_feature_flags = posthog_client.get_all_flags(
            "server",
        )
    else:
        posthog_feature_flags = None

    flags = posthog_feature_flags or {}

    return FeatureFlags(
        open_draft_profiles=bool(
            flags.get(
                "open-draft-profiles",
                FEATURE_FLAG_DEFAULTS["open-draft-profiles"],
            )
        ),
    )
