from app.domain.reviews.services.comment_sanitizer import sanitize_comment


def test_sanitize_none():
    """None input returns None."""
    assert sanitize_comment(None) is None


def test_sanitize_normal_text():
    """Normal text passes through unchanged."""
    assert sanitize_comment("Hello world") == "Hello world"


def test_sanitize_strips_whitespace():
    """Leading/trailing whitespace is stripped."""
    assert sanitize_comment("  hello  ") == "hello"


def test_sanitize_removes_control_chars():
    """ASCII control characters are removed."""
    assert sanitize_comment("he\x00ll\x07o") == "hello"


def test_sanitize_removes_zero_width_chars():
    """Zero-width characters are removed."""
    assert sanitize_comment("he\u200bllo") == "hello"


def test_sanitize_removes_bidi_control():
    """Bidirectional control characters are removed."""
    assert sanitize_comment("he\u202allo") == "hello"


def test_sanitize_normalizes_unicode():
    """Unicode is NFKC-normalized (e.g. fullwidth chars become ASCII)."""
    # Fullwidth 'A' (U+FF21) normalizes to 'A'
    assert sanitize_comment("\uff21\uff22\uff23") == "ABC"


def test_sanitize_normalizes_line_endings():
    """\\r\\n and \\r are converted to \\n."""
    assert sanitize_comment("a\r\nb\rc") == "a\nb\nc"


def test_sanitize_empty_after_strip():
    """String that becomes empty after stripping returns None."""
    assert sanitize_comment("   ") is None
    assert sanitize_comment("\u200b") is None
