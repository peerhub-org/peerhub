## Summary

- 

## Type of change

- [ ] New feature
- [ ] Bug fix
- [ ] Minor change

## Validation

- [ ] Backend lockfile check: `cd backend && uv lock --check`
- [ ] Backend lint: `cd backend && uv run ruff check app tests`
- [ ] Backend type check: `cd backend && uv run mypy`
- [ ] Backend tests: `cd backend && uv run pytest`
- [ ] Frontend lint: `cd frontend && npm run lint`
- [ ] Frontend tests: `cd frontend && npm run test:run`
- [ ] Frontend build: `cd frontend && npm run build`

## Checklist
- [ ] I did not include secrets or private data.
- [ ] I added/updated tests for behavior changes.
- [ ] I updated version in `VERSION`, `CHANGELOG.md`, and `README.md`.
- [ ] I updated docs where needed.
