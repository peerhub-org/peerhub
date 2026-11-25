import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { readVersion } from '../../../../../src/infrastructure/shared/config/version.ts'

test('is the one of the repository', () => {
  const file = resolve(import.meta.dirname, '../../../../../../VERSION')
  expect(readVersion()).toBe(readFileSync(file, 'utf8').trim())
  expect(readVersion()).toMatch(/^\d+\.\d+\.\d+$/)
})

test('may be unknown', () => {
  expect(readVersion(pathToFileURL('/missing/VERSION'))).toBe('unknown')
})
