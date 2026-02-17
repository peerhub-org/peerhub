from typing import Annotated

from fastapi import Depends

from app.domain.accounts.repositories.account_repository import IAccountRepository
from app.domain.reviews.repositories.review_repository import IReviewRepository
from app.domain.users.repositories.user_repository import IUserRepository
from app.domain.watchlist.repositories.watchlist_repository import (
    IWatchlistRepository,
)
from app.infrastructure.accounts.database.repositories.mongodb_account_repository import (
    MongoDBAccountRepository,
)
from app.infrastructure.reviews.database.repositories.mongodb_review_repository import (
    MongoDBReviewRepository,
)
from app.infrastructure.users.database.repositories.mongodb_user_repository import (
    MongoDBUserRepository,
)
from app.infrastructure.watchlist.database.repositories import (
    mongodb_watchlist_repository,
)


def get_account_repository() -> IAccountRepository:
    """Get account repository instance."""
    return MongoDBAccountRepository()


def get_review_repository() -> IReviewRepository:
    """Get review repository instance."""
    return MongoDBReviewRepository()


def get_user_repository() -> IUserRepository:
    """Get user repository instance."""
    return MongoDBUserRepository()


def get_watchlist_repository() -> IWatchlistRepository:
    """Get watch repository instance."""
    return mongodb_watchlist_repository.MongoDBWatchlistRepository()


AccountRepositoryDep = Annotated[IAccountRepository, Depends(get_account_repository)]
ReviewRepositoryDep = Annotated[IReviewRepository, Depends(get_review_repository)]
UserRepositoryDep = Annotated[IUserRepository, Depends(get_user_repository)]
WatchlistRepositoryDep = Annotated[
    IWatchlistRepository, Depends(get_watchlist_repository)
]
