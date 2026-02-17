import re
import unicodedata

_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_ZERO_WIDTH_RE = re.compile(r"[\u200B-\u200D\u2060\uFEFF]")
_BIDI_CONTROL_RE = re.compile(r"[\u202A-\u202E\u2066-\u2069]")


def sanitize_comment(comment: str | None) -> str | None:
    """Sanitize review comments by removing control chars and trimming."""
    if comment is None:
        return None

    cleaned = unicodedata.normalize("NFKC", comment)
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = _CONTROL_CHARS_RE.sub("", cleaned)
    cleaned = _ZERO_WIDTH_RE.sub("", cleaned)
    cleaned = _BIDI_CONTROL_RE.sub("", cleaned)
    cleaned = cleaned.strip()
    return cleaned or None
