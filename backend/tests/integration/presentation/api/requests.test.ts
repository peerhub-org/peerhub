import { afterAll, beforeAll, expect, test } from 'vitest'
import { createTestApp } from '../../../helpers/app.ts'
import {
  cases,
  databaseChanges,
  normalize,
  runSteps,
  type RecordedResponse,
} from '../../../helpers/requests.ts'
import { useDatabase } from '../../../helpers/database.ts'
import { startGitHubStub, type GitHubStub } from '../../../helpers/github_stub.ts'

const db = useDatabase({ withFixtures: true })

let github: GitHubStub
beforeAll(async () => void (github = await startGitHubStub()))
afterAll(() => {
  github.close()
  expect(github.unmatched).toEqual([])
})

// "%s" because "$name" shortens names, which are part of the snapshot keys.
test.each(cases.map((c) => [c.name, c] as const))('%s', async (_, requestCase) => {
  const { app, emails } = createTestApp(db(), {
    githubUrls: github.urls,
    ...(requestCase.flags && {
      featureFlags: {
        getFeatureFlags: async () => ({
          openDraftProfiles: requestCase.flags!.open_draft_profiles,
        }),
      },
    }),
    ...(requestCase.email_fails && {
      sendEmail: () => Promise.reject(new Error('email provider down')),
    }),
    ...(requestCase.mongo_down && {
      pingDatabase: () => Promise.reject(new Error('database down')),
    }),
  })
  const responses = await runSteps(app, requestCase.steps)

  expect(responses.map(normalizeBody)).toMatchSnapshot('responses')
  if (requestCase.db)
    expect(normalize(await databaseChanges(db()))).toMatchSnapshot('database changes')
  expect(emails).toMatchSnapshot('emails')
})

function normalizeBody(response: RecordedResponse): RecordedResponse {
  return 'json' in response ? { ...response, json: normalize(response.json) } : response
}
