# PeerHub

[![CI](https://github.com/peerhub-org/peerhub/actions/workflows/ci.yml/badge.svg)](https://github.com/peerhub-org/peerhub/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.4.4-green.svg)](VERSION)

PeerHub is an open-source developer reputation network. Think Glassdoor meets GitHub: sign in with GitHub, see how peers rate your work, leave PR-style reviews, and stay anonymous when it matters.

## Core Features

- GitHub OAuth authentication
- Structured peer reviews (`comment`, `approve`, `request_change`)
- Optional anonymous reviews
- Reviewer summaries and profile timelines
- Watchlist and personalized activity feed
- Account settings, including account deletion
- Abuse-control email integration for reporting

## Repository Layout

- `backend/`: FastAPI application (domain/application/infrastructure/presentation layers)
- `frontend/`: React + Vite web application
- `.github/workflows/ci.yml`: backend/frontend CI pipeline

## Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Material UI 7, Vite, Vitest                |
| Backend  | Python 3.13, FastAPI, Beanie/Motor (MongoDB), Pydantic           |
| Auth     | GitHub OAuth, JWT tokens                                          |
| Observability | PostHog, OpenTelemetry                                       |
| CI       | GitHub Actions (lint, type check, tests, build)                  |

## Quick Start

### Prerequisites

- Python 3.13
- uv
- Node.js 22
- npm 10
- Docker (required for backend integration tests; optional for running backend container)

### 1. Clone and configure

```bash
git clone https://github.com/peerhub-org/peerhub.git
cd peerhub
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development
```

Update env files as needed:

- Backend (`backend/.env.development`)
  - Required for authenticated flows: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SSO_CALLBACK_HOSTNAME`
  - Required in production: `SECRET_KEY`, `MONGO_URI`, `MONGO_DB`
  - Optional: `POSTHOG_*`, `RESEND_API_KEY`, `SENDER_EMAIL`, `ABUSE_CONTROL_EMAIL`
- Frontend (`frontend/.env.development`)
  - `VITE_BACKEND_API_URL` (default in example: `http://localhost:8000/api/v1/`)
  - Optional PostHog vars: `VITE_PUBLIC_POSTHOG_HOST`, `VITE_PUBLIC_POSTHOG_KEY`

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

The frontend runs at `http://localhost:5173`.

Important: Vite is not configured with a dev proxy in this repo. For local development across ports, set `VITE_BACKEND_API_URL=http://localhost:8000/api/v1/` in `frontend/.env.development`.

## API and Runtime Notes

- API base path: `/api/v1`
- OpenAPI spec: `http://localhost:8000/api/v1/openapi.json`
- Swagger UI: `http://localhost:8000/docs`
- Main endpoint groups:
  - `/api/v1/health`
  - `/api/v1/users` (auth URL, token exchange, search, profile refresh)
  - `/api/v1/account` (current account, feed, my reviews, deletion)
  - `/api/v1/reviews` (CRUD, suggestions, reviewers, comment visibility)
  - `/api/v1/watchlist` (watch/unwatch/list/check)

## Quality Checks

Run the same checks used by CI before opening a PR.

Backend:

```bash
cd backend
uv lock --check
uv run ruff check app tests
uv run mypy
uv run pytest
```

Frontend:

```bash
cd frontend
npm run lint
npm run test:run
npm run build
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before getting started.

For security vulnerabilities, do **not** open a public issue. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## Releases

This project follows [Semantic Versioning](https://semver.org/). The current version is defined in [`VERSION`](VERSION). See [`CHANGELOG.md`](CHANGELOG.md) for release history.

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE).
