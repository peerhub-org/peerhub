# PeerHub

[![CI](https://github.com/peerhub-org/peerhub/actions/workflows/ci.yml/badge.svg)](https://github.com/peerhub-org/peerhub/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.4.0-green.svg)](VERSION)

PeerHub is an open-source platform for developer-to-developer feedback. Users sign in with GitHub, leave structured peer reviews, watch other developers, and track review activity in a personalized feed.

## Features

- **GitHub OAuth authentication** - sign in with your GitHub account
- **Structured peer reviews** - comment, approve, or request changes
- **Anonymous reviews** - optionally leave feedback anonymously
- **Reviewer profiles** - summaries and profile-based timelines
- **Watchlist & activity feed** - follow developers and track review activity

## Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Material UI 7, Vite, Vitest                |
| Backend  | Python 3.13, FastAPI, Beanie/Motor (MongoDB), Pydantic           |
| Auth     | GitHub OAuth via fastapi-sso, JWT tokens                          |
| CI       | GitHub Actions (lint + type check + tests for both frontend/backend) |

## Quick Start

### Prerequisites

- Python 3.13+
- uv
- Node.js 22+
- npm 10+
- Docker (only for container-based backend and integration tests)

### 1. Clone and configure

```bash
git clone https://github.com/peerhub-org/peerhub.git
cd peerhub
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development
```

Edit `backend/.env.development` and fill in the required values (`SECRET_KEY`, `MONGO_URI`, `MONGO_DB`, GitHub OAuth credentials).

### 2. Start the backend

```bash
cd backend
uv sync --dev
uv run fastapi dev app/main.py
```

Or with Docker:

```bash
cd backend
docker compose up --build
```

### 3. Start the frontend

```bash
cd frontend
npm ci
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API calls to `/api/v1/`. Set `VITE_BACKEND_API_URL` in `frontend/.env.development` to override.

## Running Tests

**Backend:**

```bash
cd backend
uv run ruff check app tests
uv run mypy
uv run pytest
```

**Frontend:**

```bash
cd frontend
npm run lint
npm run test:run
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before getting started.

For security vulnerabilities, do **not** open a public issue. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## Releases

This project follows [Semantic Versioning](https://semver.org/). The current version is defined in [`VERSION`](VERSION). See [`CHANGELOG.md`](CHANGELOG.md) for release history.

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE).
