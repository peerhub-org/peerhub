import { afterAll, beforeAll, expect, test } from 'vitest'
import { pingDatabase } from '../../../../src/infrastructure/shared/database/connection.ts'
import { createTestApp } from '../../../helpers/app.ts'
import {
  cases,
  databaseChanges,
  normalize,
  recorded,
  runSteps,
  type RecordedResponse,
} from '../../../helpers/contract.ts'
import { useDatabase } from '../../../helpers/database.ts'
import { startGitHubStub, type GitHubStub } from '../../../helpers/github_stub.ts'

const db = useDatabase({ withFixtures: true })

let github: GitHubStub
beforeAll(async () => void (github = await startGitHubStub()))
afterAll(() => {
  github.close()
  expect(github.unmatched).toEqual([])
})

/** JSON parsers word their errors differently. */
function ignoreJsonErrorText(response: RecordedResponse): RecordedResponse {
  const detail = (response.json as { detail?: unknown } | null)?.detail
  if (!Array.isArray(detail) || detail[0]?.type !== 'json_invalid') return response
  return { ...response, json: { detail: [{ ...detail[0], ctx: '<ignored>' }] } }
}

test.each(cases)('$name', async (contractCase) => {
  const { app, emails } = createTestApp(db(), {
    githubUrls: github.urls,
    ...(contractCase.flags && {
      featureFlags: {
        getFeatureFlags: async () => ({
          openDraftProfiles: contractCase.flags!.open_draft_profiles,
        }),
      },
    }),
    ...(contractCase.email_fails && {
      sendEmail: () => Promise.reject(new Error('email provider down')),
    }),
    ...(contractCase.mongo_down && {
      pingDatabase: () => pingDatabase({ MONGO_URI: 'mongodb://127.0.0.1:1' }),
    }),
  })
  const wanted = recorded(contractCase.name)

  const responses = await runSteps(app, contractCase.steps)

  expect(responses.map((r) => ignoreJsonErrorText(normalizeBody(r)))).toEqual(
    wanted.responses.map(ignoreJsonErrorText),
  )
  if (contractCase.db) expect(normalize(await databaseChanges(db()))).toEqual(wanted.db)
  expect(emails).toEqual(wanted.emails ?? [])
})

function normalizeBody(response: RecordedResponse): RecordedResponse {
  return 'json' in response ? { ...response, json: normalize(response.json) } : response
}
