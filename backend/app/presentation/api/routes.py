from fastapi import APIRouter

from app.presentation.api.v1 import account, health, review, users, watchlist

api_router = APIRouter()

# Health check
api_router.include_router(health.router, prefix="/health", tags=["health"])

# Account endpoints
api_router.include_router(account.router, prefix="/account", tags=["account"])

# GitHub endpoints
api_router.include_router(users.router, prefix="/users", tags=["github"])

# Review endpoints
api_router.include_router(review.router, prefix="/reviews", tags=["reviews"])

# Watch endpoints
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["watchlist"])
