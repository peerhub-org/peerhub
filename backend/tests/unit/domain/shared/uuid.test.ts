import { expect, test } from 'vitest'
import { parseUuid } from '../../../../src/domain/shared/uuid.ts'

const UUID = 'a0000000-0000-4000-8000-00000000000f'

// Same outcomes as Python's UUID()
test.each([UUID, UUID.toUpperCase(), UUID.replaceAll('-', ''), `{${UUID}}`, `urn:uuid:${UUID}`])(
  '%s is accepted',
  (text) => {
    expect(parseUuid(text)).toBe(UUID)
  },
)

test.each(['', 'nope', UUID.slice(1), `${UUID}0`, UUID.replace('a', 'g')])(
  '%j is refused',
  (text) => {
    expect(parseUuid(text)).toBeNull()
  },
)
