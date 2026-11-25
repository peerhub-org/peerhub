import { expect, test } from 'vitest'
import { sanitizeComment } from '../../../../../src/domain/reviews/services/comment_sanitizer.ts'

// Expected values produced by the Python backend
test.each([
  [null, null],
  ['Hello world', 'Hello world'],
  ['  hello  ', 'hello'],
  ['he\x00ll\x07o', 'hello'],
  ['he\u200Bllo', 'hello'],
  ['he\u202Allo', 'hello'],
  ['\uFF21\uFF22\uFF23', 'ABC'],
  ['a\r\nb\rc', 'a\nb\nc'],
  ['a\r\r\nb', 'a\n\nb'],
  ['   ', null],
  ['\u200B', null],
  ['', null],
  ['\x85text\x85', 'text'],
  ['a\x85b', 'a\x85b'],
  ['\u3000text\u00A0', 'text'],
  ['a\tb\nc', 'a\tb\nc'],
])('%j becomes %j', (comment, expected) => {
  expect(sanitizeComment(comment)).toBe(expected)
})
