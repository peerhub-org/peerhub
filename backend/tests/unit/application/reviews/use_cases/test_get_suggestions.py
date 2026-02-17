from app.application.reviews.use_cases.get_suggestions import (
    GetSuggestionsUseCase,
)


class TestBuildCandidates:
    def test_filters_out_organizations(self):
        following = [
            {"login": "alice", "avatar_url": "a.png", "type": "User"},
            {"login": "some-org", "avatar_url": "o.png", "type": "Organization"},
            {"login": "bob", "avatar_url": "b.png", "type": "User"},
        ]

        candidates = GetSuggestionsUseCase._build_candidates(following, [], [], "me")

        assert "alice" in candidates
        assert "bob" in candidates
        assert "some-org" not in candidates

    def test_filters_out_bots(self):
        following = [
            {"login": "alice", "avatar_url": "a.png", "type": "User"},
            {"login": "dependabot", "avatar_url": "d.png", "type": "Bot"},
        ]

        candidates = GetSuggestionsUseCase._build_candidates(following, [], [], "me")

        assert "alice" in candidates
        assert "dependabot" not in candidates

    def test_filters_out_missing_type(self):
        following = [
            {"login": "alice", "avatar_url": "a.png", "type": "User"},
            {"login": "unknown", "avatar_url": "u.png"},
        ]

        candidates = GetSuggestionsUseCase._build_candidates(following, [], [], "me")

        assert "alice" in candidates
        assert "unknown" not in candidates

    def test_keeps_only_users(self):
        following = [
            {"login": "alice", "avatar_url": "a.png", "type": "User"},
            {"login": "org1", "avatar_url": "o1.png", "type": "Organization"},
            {"login": "bot1", "avatar_url": "b1.png", "type": "Bot"},
            {"login": "bob", "avatar_url": "b.png", "type": "User"},
        ]

        candidates = GetSuggestionsUseCase._build_candidates(following, [], [], "me")

        assert len(candidates) == 2
        assert set(candidates.keys()) == {"alice", "bob"}
