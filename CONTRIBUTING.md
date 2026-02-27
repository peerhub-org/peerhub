# Contributing to PeerHub

Thanks for contributing.

## Before you start

- Read `CODE_OF_CONDUCT.md`.
- Search existing issues before opening a new one.
- For security issues, do not open a public issue. Use `SECURITY.md`.

## Development setup

Prerequisites:
- Python 3.13
- uv
- Node.js 22
- npm 10
- Docker (required for integration tests that use Testcontainers)

1. Prepare env files:

```bash
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development
```

2. Configure required values:

- Backend OAuth flow: set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SSO_CALLBACK_HOSTNAME`
- Frontend local API: set `VITE_BACKEND_API_URL=http://localhost:8000/api/v1/`

3. Backend setup:

```bash
cd backend
uv sync --dev
uv run fastapi dev app/main.py
```

4. Frontend setup:

```bash
cd frontend
npm ci
npm run dev
```

## Quality checks

Run these before opening a pull request.

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

## Pull requests

- Keep changes scoped and reviewable.
- Include tests for behavior changes.
- Update version across `VERSION`, `CHANGELOG.md` and `README.md`.
- Update docs when behavior or setup changes.
- Use the pull request template.

## Branch protection recommendation

In GitHub branch protection for your default branch, require status checks:
- `backend`
- `frontend`

These are provided by `.github/workflows/ci.yml`.
