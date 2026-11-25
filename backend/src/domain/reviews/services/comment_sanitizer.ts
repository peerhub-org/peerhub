// Same characters as the Python backend, including what its str.strip() removes.
const CONTROL_CHARS = /[\0-\x08\x0b\x0c\x0e-\x1f\x7f]/g // eslint-disable-line no-control-regex
const ZERO_WIDTH = /\u200B|\u200C|\u200D|\u2060|\uFEFF/g
const BIDI_CONTROL = /[\u202A-\u202E\u2066-\u2069]/g
const SURROUNDING_SPACE = /^[\s\x85]+|[\s\x85]+$/g

/** Remove invisible characters and surrounding space; nothing left means no comment. */
export function sanitizeComment(comment: string | null): string | null {
  if (comment === null) return null

  const cleaned = comment
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(ZERO_WIDTH, '')
    .replace(BIDI_CONTROL, '')
    .replace(SURROUNDING_SPACE, '')
  return cleaned || null
}
