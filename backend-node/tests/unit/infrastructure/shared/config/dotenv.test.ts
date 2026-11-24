import { expect, test } from 'vitest'
import { parseDotenv } from '../../../../../src/infrastructure/shared/config/dotenv.ts'

// Expected values checked against python-dotenv
test.each([
  ['A=1', { A: '1' }],
  ['A = spaced value ', { A: 'spaced value' }],
  ['export A=1', { A: '1' }],
  ['A=', { A: '' }],
  ['A=\nB=2', { A: '', B: '2' }],
  ['A=1\r\nB=2\r\n', { A: '1', B: '2' }],
  ['# comment\n\n  # A=0\nA=1', { A: '1' }],
  ['A=se#cret', { A: 'se#cret' }],
  ['A=value # comment', { A: 'value' }],
  ['A=#value', { A: '#value' }],
  ['A="se # cret" # comment', { A: 'se # cret' }],
  ["A='se # cret'", { A: 'se # cret' }],
  ['A="line\\nbreak"', { A: 'line\nbreak' }],
  ["A='line\\nbreak'", { A: 'line\\nbreak' }],
  ['A="two\nlines"\nB=2', { A: 'two\nlines', B: '2' }],
  ['A=["http://localhost:5173"]', { A: '["http://localhost:5173"]' }],
  ['A=mongodb://u:p@h/?a=b&c=d', { A: 'mongodb://u:p@h/?a=b&c=d' }],
  ['A=1\nA=2', { A: '2' }],
])('%j', (text, expected) => {
  expect(parseDotenv(text)).toEqual(expected)
})
