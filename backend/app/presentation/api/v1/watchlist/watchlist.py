from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.application.watchlist.use_cases.check_watch import (
    CheckWatchUseCase,
)
from app.application.watchlist.use_cases.get_watchlist import (
    GetWatchlistUseCase,
)
from app.application.watchlist.use_cases.unwatch import UnwatchUseCase
from app.application.watchlist.use_cases.watch import WatchUseCase
from app.presentation.api.dependencies.auth import get_current_account_uuid
from app.presentation.api.dependencies.watchlist import (
    get_all_by_watcher_use_case,
    get_check_watch_use_case,
    get_unwatch_use_case,
    get_watch_use_case,
)
from app.presentation.api.v1.watchlist.schemas.request import WatchRequest
from app.presentation.api.v1.watchlist.schemas.response import (
    WatchResponse,
    WatchStatusResponse,
)

router = APIRouter()


@router.post("", status_code=201)
async def watch(
    request: WatchRequest,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: WatchUseCase = Depends(get_watch_use_case),
) -> dict[str, str]:
    """Watch a user."""
    await use_case.execute(account_uuid, request.username)
    return {"message": "Watched successfully"}


@router.delete("/{username}", status_code=204)
async def unwatch(
    username: str,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: UnwatchUseCase = Depends(get_unwatch_use_case),
) -> None:
    """Unwatch a user."""
    await use_case.execute(account_uuid, username)


@router.get("", response_model=list[WatchResponse])
async def get_watchlist(
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: GetWatchlistUseCase = Depends(get_all_by_watcher_use_case),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[WatchResponse]:
    """Get all watched users for current user."""
    watches = await use_case.execute(account_uuid, limit, offset)
    return [WatchResponse.from_watch_with_user(w) for w in watches]


@router.get("/check/{username}", response_model=WatchStatusResponse)
async def check_watch(
    username: str,
    account_uuid: UUID = Depends(get_current_account_uuid),
    use_case: CheckWatchUseCase = Depends(get_check_watch_use_case),
) -> WatchStatusResponse:
    """Check if current user is watching a username."""
    is_watching = await use_case.execute(account_uuid, username)
    return WatchStatusResponse(is_watching=is_watching)
