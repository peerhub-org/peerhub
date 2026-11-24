"""Record the Python backend's behavior as the reference for the Node.js port.

Runs the real FastAPI app against a disposable MongoDB container and a local GitHub
stub, and writes everything under reference/. Removed together with the Python backend.

Usage (from backend-node/contract, Docker running):
    ENVIRONMENT=test PYTHONPATH=../../backend ../../backend/.venv/bin/python generate.py
Use --check to compare against the committed files instead of writing them.
"""

import asyncio
import json
import os
import re
import sys
import threading
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlsplit
from uuid import UUID

HERE = Path(__file__).resolve().parent
OUT = HERE / "reference"
DB_NAME = "peerhub_contract"
SECRET_KEY = "contract-secret-key-that-is-long-enough-for-hs512-signatures-000000000"
FAR_FUTURE = datetime(2099, 1, 1, tzinfo=timezone.utc)
MISSING = object()

if os.environ.get("ENVIRONMENT") != "test":
    sys.exit("Run with ENVIRONMENT=test")

import app.infrastructure.shared.config.config as config  # noqa: E402

# Replace the settings before anything else imports them, so that nothing from
# .env.development (real database, real keys) is ever used here.
config.settings = config.Settings(
    _env_file=None,
    ENVIRONMENT="test",
    API_V1_STR="/api/v1",
    PROJECT_NAME="peerhub",
    SECRET_KEY=SECRET_KEY,
    ACCESS_TOKEN_EXPIRE_MINUTES=10080,
    BACKEND_CORS_ORIGINS=["http://localhost:5173"],
    MONGO_URI="mongodb://invalid.test:1",
    MONGO_DB=DB_NAME,
    GITHUB_CLIENT_ID="client-id",
    GITHUB_CLIENT_SECRET="client-secret",
    SSO_CALLBACK_HOSTNAME="http://localhost:5173",
    MODERATOR_USERNAMES={"moddy", "modtwo"},
    POSTHOG_API_KEY=None,
    RESEND_API_KEY="contract",
    SENDER_EMAIL="sender@example.test",
    ABUSE_CONTROL_EMAIL="abuse@example.test",
)
settings = config.settings

import httpx  # noqa: E402
import jwt  # noqa: E402
import resend  # noqa: E402
from bson import json_util  # noqa: E402
from pymongo import AsyncMongoClient  # noqa: E402
from testcontainers.mongodb import MongoDbContainer  # noqa: E402

from app.domain.accounts.entities.account import Account  # noqa: E402
from app.domain.reviews.entities.review import Review, ReviewStatus  # noqa: E402
from app.domain.users.entities.user import User  # noqa: E402
from app.domain.watchlist.entities.watch import Watch  # noqa: E402
from app.infrastructure.accounts.database.repositories.mongodb_account_repository import (  # noqa: E402,E501
    MongoDBAccountRepository,
)
from app.infrastructure.github.external.github_client import GitHubClient  # noqa: E402
from app.infrastructure.reviews.database.repositories.mongodb_review_repository import (  # noqa: E402,E501
    MongoDBReviewRepository,
)
from app.infrastructure.users.database.repositories.mongodb_user_repository import (  # noqa: E402,E501
    MongoDBUserRepository,
)
from app.infrastructure.watchlist.database.repositories.mongodb_watchlist_repository import (  # noqa: E402,E501
    MongoDBWatchlistRepository,
)
from app.main import app, limiter as main_limiter  # noqa: E402
from app.presentation.api.dependencies.feature_flags import (  # noqa: E402
    FeatureFlags,
    get_feature_flags,
)
from app.presentation.api.v1.review.review import limiter as review_limiter  # noqa: E402
from app.presentation.api.v1.users.users import limiter as users_limiter  # noqa: E402

COLLECTIONS = ["accounts", "reviews", "users", "watchlist"]
HEADERS = {
    "content-type", "www-authenticate", "allow", "location", "vary", "retry-after",
}


def oid(kind: int, n: int) -> str:
    return f"65{kind:02d}{n:020x}"


def uid(n: int) -> UUID:
    return UUID(f"a0000000-0000-4000-8000-{n:012d}")


def at(day: int, ms: int = 123) -> datetime:
    return datetime(2024, 1, 1, 3, 4, 5, ms * 1000, tzinfo=timezone.utc) + timedelta(
        days=day
    )


ACCOUNTS = {
    "alice": uid(1), "bob": uid(2), "carol": uid(3), "moddy": uid(4),
    "modtwo": uid(5), "ghost": uid(6), "notoken": uid(7), "legacy": uid(8),
}
REVIEW_IDS = {
    "bob_on_alice": oid(2, 1), "carol_on_alice_anon": oid(2, 2),
    "moddy_on_alice": oid(2, 3), "modtwo_on_ALICE": oid(2, 4),
    "ghost_on_alice": oid(2, 5), "legacy_on_alice": oid(2, 6),
    "alice_on_dave": oid(2, 7), "carol_on_dave": oid(2, 8),
    "bob_on_carol": oid(2, 9), "moddy_on_carol": oid(2, 10),
    "bob_on_popularmixed": oid(2, 11),
    "bob_on_ghost": oid(2, 12),
}


# --- GitHub stub -----------------------------------------------------------


class Stub(BaseHTTPRequestHandler):
    routes = json.loads((HERE / "github-stub.json").read_text())
    unmatched: list[str] = []

    def _reply(self) -> None:
        url = urlsplit(self.path)
        query = {k: v[0] for k, v in parse_qs(url.query, keep_blank_values=True).items()}
        raw = self.rfile.read(int(self.headers.get("content-length") or 0)).decode()
        form = {k: v[0] for k, v in parse_qs(raw).items()}
        token = (self.headers.get("authorization") or "").removeprefix("Bearer ")
        for r in self.routes:
            if r["method"] != self.command or r["path"] != url.path:
                continue
            if "token" in r and r["token"] != token:
                continue
            if any(form.get(k) != v for k, v in r.get("form", {}).items()):
                continue
            if "query" in r and r["query"] != query:
                continue
            status, body = r["status"], r["body"]
            break
        else:
            self.unmatched.append(f"{self.command} {self.path}")
            status, body = 599, {}
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    do_GET = do_POST = _reply

    def log_message(self, *args: Any) -> None:
        pass


# --- Fixtures --------------------------------------------------------------


async def write_fixtures(db: Any) -> None:
    """Write documents through the Python repositories, plus legacy raw documents."""
    accounts, reviews = MongoDBAccountRepository(), MongoDBReviewRepository()
    users, watches = MongoDBUserRepository(), MongoDBWatchlistRepository()

    async def account(
        n: int, name: str, token: str, email: str | None, deleted: Any = None
    ) -> None:
        await accounts.create(Account(
            id=oid(1, n), uuid=uid(n), username=name, access_token=token,
            email=email, created_at=at(n), deleted_at=deleted,
        ))

    await account(1, "alice", "gho_alice", "alice@example.test")
    await account(2, "bob", "gho_bob", None)
    await account(3, "CarolX", "gho_carol", "carol@example.test")
    await account(4, "moddy", "gho_moddy", None)
    await account(5, "modtwo", "gho_modtwo", None)
    await account(6, "ghost", "", "ghost@example.test", at(40))
    await account(7, "notoken", "", None)
    for i in range(18):
        await account(100 + i, f"fan{i:02d}", "gho_fan", None)

    async def user(
        n: int, name: str, type_: str | None, updated: datetime = FAR_FUTURE
    ) -> None:
        await users.create(User(
            id=oid(3, n), username=name, name=f"{name} name", bio=f"{name} bio",
            avatar_url=f"https://avatars.test/{name.lower()}.png", type=type_,
            updated_at=updated,
        ))

    for n, name in enumerate(["alice", "bob", "CarolX", "moddy", "ghost", "dave"], 1):
        await user(n, name, "User")
    await user(7, "acme", "Organization")
    await user(8, "botty", "Bot")
    await user(9, "typeless", None)
    await user(10, "stale", "User", datetime(2020, 1, 1, tzinfo=timezone.utc))
    await users.create(User(id=oid(3, 11), username="fan00", updated_at=FAR_FUTURE,
                            type="User"))

    async def review(
        key: str, by: UUID, of: str, status: str, comment: str | None, day: int,
        anonymous: bool = False, hidden_by: str | None = None, id_: str | None = None,
    ) -> None:
        await reviews.create(Review(
            id=id_ or REVIEW_IDS[key], reviewer_uuid=by, reviewed_username=of,
            status=ReviewStatus(status), comment=comment, anonymous=anonymous,
            created_at=at(day), updated_at=at(day, 456),
            comment_hidden=hidden_by is not None, comment_hidden_by=hidden_by,
        ))

    await review("bob_on_alice", uid(2), "alice", "approve", "Great <b>work</b>", 10)
    await review("carol_on_alice_anon", uid(3), "alice", "request_change", "secret", 11,
                 anonymous=True)
    await review("moddy_on_alice", uid(4), "alice", "comment", "hidden by owner", 12,
                 hidden_by="alice")
    await review("modtwo_on_ALICE", uid(5), "ALICE", "comment", "hidden by mod", 13,
                 hidden_by="moddy")
    await review("ghost_on_alice", uid(6), "alice", "approve", "from a deleted one", 14)
    await review("alice_on_dave", uid(1), "dave", "approve", None, 15)
    await review("carol_on_dave", uid(3), "Dave", "request_change", "anon draft", 16,
                 anonymous=True)
    await review("bob_on_carol", uid(2), "CarolX", "comment", "owner hid this", 17,
                 hidden_by="CarolX")
    await review("moddy_on_carol", uid(4), "carolx", "comment", "owner, other case", 18,
                 hidden_by="CarolX")
    await review("bob_on_popularmixed", uid(2), "PopularMixed", "approve", None, 19)
    await review("bob_on_ghost", uid(2), "ghost", "approve", "on a deleted one", 39)
    for i in range(18):
        await review("", uid(100 + i), "popular",
                     ["approve", "request_change", "comment"][i % 3],
                     f"comment {i}", 20 + i, id_=oid(2, 100 + i))

    async def watch(n: int, by: UUID, of: str, day: int) -> None:
        await watches.create(Watch(
            id=oid(4, n), watcher_uuid=by, watched_username=of, created_at=at(day),
        ))

    await watch(1, uid(1), "bob", 30)
    await watch(2, uid(1), "dave", 31)
    await watch(3, uid(1), "neverseenprofile", 32)
    await watch(4, uid(2), "dave", 33)
    await watch(5, uid(2), "popular", 34)
    await watch(6, uid(3), "ghost", 35)

    # Documents written by older versions, before some fields existed.
    from bson import Binary, ObjectId

    await db.accounts.insert_one({
        "_id": ObjectId(oid(1, 8)), "uuid": Binary.from_uuid(uid(8)),
        "username": "legacy", "access_token": "gho_legacy", "created_at": at(8),
    })
    await db.users.insert_one({"_id": ObjectId(oid(3, 12)), "username": "legacyuser"})
    await db.reviews.insert_one({
        "_id": ObjectId(REVIEW_IDS["legacy_on_alice"]),
        "reviewer_uuid": Binary.from_uuid(uid(8)), "reviewed_username": "alice",
        "status": "approve", "created_at": at(9), "updated_at": at(9),
    })


def make_tokens() -> dict[str, str]:
    def enc(payload: dict, key: str | None = SECRET_KEY, alg: str = "HS256") -> str:
        return jwt.encode(payload, key, algorithm=alg)

    tokens = {n: enc({"exp": FAR_FUTURE, "sub": str(u)}) for n, u in ACCOUNTS.items()}
    alice = {"exp": FAR_FUTURE, "sub": str(uid(1))}
    tokens.update({
        "unknown": enc({**alice, "sub": str(uid(999))}),
        "expired": enc({**alice, "exp": datetime(2020, 1, 1, tzinfo=timezone.utc)}),
        "wrong_key": enc(alice, "another-" + SECRET_KEY),
        "alg_none": enc(alice, None, "none"),
        "alg_hs512": enc(alice, alg="HS512"),
        "no_sub": enc({"exp": FAR_FUTURE}),
        "sub_not_uuid": enc({**alice, "sub": "nope"}),
        "future_nbf": enc({**alice, "nbf": FAR_FUTURE}),
        "no_exp": enc({"sub": str(uid(1))}),
        "sub_uppercase": enc({**alice, "sub": str(uid(1)).upper()}),
        "sub_no_dashes": enc({**alice, "sub": uid(1).hex}),
    })
    return tokens


# --- Normalization ---------------------------------------------------------

JWT_RE = re.compile(r"^eyJ[\w-]+\.eyJ[\w-]+\.[\w-]*$")
OID_RE = re.compile(r"^[0-9a-f]{24}$")
UUID_RE = re.compile(r"^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$")
DATE_RE = re.compile(r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|\+00:00)$")


class Normalizer:
    """Replace values created during the run by placeholders; keep fixture values."""

    def __init__(self, fixtures: Any) -> None:
        self.known: set[str] = {"ffffffffffffffffffffffff"}
        self.known |= {str(u) for u in ACCOUNTS.values()} | {str(uid(999))}
        self._collect(fixtures)

    def _collect(self, value: Any) -> None:
        if isinstance(value, dict):
            if set(value) == {"$date"}:
                self.known.add(value["$date"])
            for v in value.values():
                self._collect(v)
        elif isinstance(value, list):
            for v in value:
                self._collect(v)
        elif isinstance(value, str):
            self.known.add(value)

    def __call__(self, value: Any) -> Any:
        if isinstance(value, dict):
            return {k: self(v) for k, v in value.items()}
        if isinstance(value, list):
            return [self(v) for v in value]
        if isinstance(value, str) and value not in self.known:
            if JWT_RE.match(value):
                return "<jwt>"
            if OID_RE.match(value):
                return "<oid>"
            if UUID_RE.match(value):
                return "<uuid>"
            if DATE_RE.match(value):
                return "<date>"
        return value


async def dump(db: Any) -> dict[str, list]:
    """Dump collections as EJSON with UUIDs as {$uuid} (subtype 4 only)."""
    out: dict[str, list] = {}
    for name in COLLECTIONS:
        docs = await db[name].find({}).sort([("_id", 1)]).to_list()
        text = json_util.dumps(docs, json_options=json_util.JSONOptions(
            json_mode=json_util.JSONMode.RELAXED, tz_aware=True,
            datetime_representation=json_util.DatetimeRepresentation.ISO8601,
        ))
        out[name] = json.loads(text)
    return out


def uuid_text(value: Any) -> Any:
    """Show Binary subtype 04 as {$uuid: text}; other subtypes stay visible as binary."""
    if isinstance(value, dict):
        if set(value) == {"$binary"} and value["$binary"]["subType"] == "04":
            import base64

            return {"$uuid": str(UUID(bytes=base64.b64decode(value["$binary"]["base64"])))}
        return {k: uuid_text(v) for k, v in value.items()}
    if isinstance(value, list):
        return [uuid_text(v) for v in value]
    return value


def diff(before: dict[str, list], after: dict[str, list]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for name in COLLECTIONS:
        b = {json.dumps(d["_id"]): d for d in before[name]}
        a = {json.dumps(d["_id"]): d for d in after[name]}
        change = {
            "added": [d for k, d in a.items() if k not in b],
            "removed": [d["_id"] for k, d in b.items() if k not in a],
            "changed": [d for k, d in a.items() if k in b and b[k] != d],
        }
        change = {k: v for k, v in change.items() if v}
        if change:
            out[name] = change
    return out


# --- Runner ----------------------------------------------------------------

emails: list[dict] = []
email_fails = False


def fake_send(params: dict) -> dict:
    if email_fails:
        raise RuntimeError("email provider down")
    emails.append(params)
    return {"id": "email"}


async def run_step(
    client: httpx.AsyncClient, step: dict, tokens: dict[str, str]
) -> httpx.Response:
    headers = dict(step.get("headers", {}))
    if "as" in step:
        headers["Authorization"] = f"{step.get('scheme', 'Bearer')} {tokens[step['as']]}"
    path = step["path"]
    for key, value in REVIEW_IDS.items():
        path = path.replace("{" + key + "}", value)
    kwargs: dict[str, Any] = {}
    if "raw" in step:
        kwargs["content"] = step["raw"].encode()
    elif "body" in step:
        body = step["body"]
        if "comment_repeat" in step:
            text, times = step["comment_repeat"]
            body = {**body, "comment": text * times}
        kwargs["json"] = body
    return await client.request(step["method"], path, headers=headers, **kwargs)


def record(response: httpx.Response, normalize: Normalizer) -> dict:
    out: dict[str, Any] = {"status": response.status_code}
    headers = {
        k: v for k, v in sorted(response.headers.items())
        if k in HEADERS or k.startswith(("access-control-", "x-ratelimit"))
    }
    if headers:
        out["headers"] = headers
    if response.headers.get("content-type", "").startswith("application/json"):
        out["json"] = normalize(response.json()) if response.content else None
    elif response.content:
        out["text"] = response.text
    return out


async def main() -> int:
    global email_fails

    resend.Emails.send = staticmethod(fake_send)  # type: ignore[method-assign]
    stub = ThreadingHTTPServer(("127.0.0.1", 0), Stub)
    threading.Thread(target=stub.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{stub.server_address[1]}"
    GitHubClient.GITHUB_API_URL = base
    GitHubClient.GITHUB_OAUTH_URL = f"{base}/login/oauth/access_token"

    files: dict[str, Any] = {"openapi.json": app.openapi()}
    tokens = make_tokens()
    files["tokens.json"] = {"secret_key": SECRET_KEY, "tokens": tokens}

    with MongoDbContainer("mongo:7.0") as container:
        settings.MONGO_URI = container.get_connection_url()
        mongo = AsyncMongoClient(settings.MONGO_URI)
        db = mongo[DB_NAME]

        async with app.router.lifespan_context(app):
            indexes: dict[str, Any] = {}
            for name in COLLECTIONS:
                cursor = await db[name].list_indexes()
                indexes[name] = [
                    {"name": i["name"], "key": dict(i["key"]),
                     "unique": i.get("unique", False)}
                    for i in await cursor.to_list()
                ]
            files["indexes.json"] = indexes

            await write_fixtures(db)
            raw = {n: await db[n].find({}).to_list() for n in COLLECTIONS}
            before = uuid_text(await dump(db))
            # Same text format the API uses, so fixture dates are recognized there too.
            normalize = Normalizer([before, [
                d.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
                for docs in raw.values() for doc in docs
                for d in doc.values() if isinstance(d, datetime)
            ]])
            files["fixtures.json"] = {"review_ids": REVIEW_IDS, "collections": before}

            results: list[dict] = []
            transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
            async with httpx.AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                for case in json.loads((HERE / "cases.json").read_text()):
                    for name in COLLECTIONS:
                        await db[name].delete_many({})
                        await db[name].insert_many(raw[name])
                    for limiter in (main_limiter, users_limiter, review_limiter):
                        limiter.reset()
                    emails.clear()
                    email_fails = case.get("email_fails", False)
                    app.dependency_overrides.clear()
                    if "flags" in case:
                        flags = FeatureFlags(**case["flags"])
                        app.dependency_overrides[get_feature_flags] = lambda f=flags: f
                    uri = settings.MONGO_URI
                    if case.get("mongo_down"):
                        settings.MONGO_URI = "mongodb://127.0.0.1:1"

                    responses: list[dict] = []
                    for step in case["steps"]:
                        times = step.get("repeat", 1)
                        for i in range(times):
                            response = await run_step(client, step, tokens)
                            if not step.get("last_only") or i == times - 1:
                                responses.append(record(response, normalize))
                    settings.MONGO_URI = uri

                    result: dict[str, Any] = {"name": case["name"],
                                              "responses": responses}
                    if case.get("db"):
                        result["db"] = normalize(
                            diff(before, uuid_text(await dump(db)))
                        )
                    if emails:
                        result["emails"] = [dict(e) for e in emails]
                    results.append(result)
            files["responses.json"] = results
        await mongo.close()
    stub.shutdown()

    if Stub.unmatched:
        print("Unmatched GitHub calls:", *sorted(set(Stub.unmatched)), sep="\n  ")
        return 1

    failed = 0
    for name, content in files.items():
        text = json.dumps(content, indent=1, ensure_ascii=True, sort_keys=False) + "\n"
        path = OUT / name
        if "--check" in sys.argv:
            same = path.exists() and path.read_text() == text
            print(("ok   " if same else "DIFF ") + name)
            failed += not same
        else:
            OUT.mkdir(exist_ok=True)
            path.write_text(text)
            print("wrote", name, len(text))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
