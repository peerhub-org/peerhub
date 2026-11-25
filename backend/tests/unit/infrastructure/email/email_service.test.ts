import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { EmailService, type Email } from '../../../../src/infrastructure/email/email_service.ts'
import { memoryLogger } from '../../../helpers/logger.ts'

const settings = {
  RESEND_API_KEY: 're_key',
  SENDER_EMAIL: 'sender@example.test',
  ABUSE_CONTROL_EMAIL: 'abuse@example.test',
}
const { logger, lines } = memoryLogger()

let sent: Email[] = []
const service = new EmailService(settings, logger, async (email) => void sent.push(email))
beforeEach(() => void (sent = []))

const review = {
  reviewerUsername: 'bob',
  reviewedUsername: 'dave',
  status: 'approve',
  comment: null,
  anonymous: false,
}

describe('emails', () => {
  test('new account', async () => {
    await service.sendNewAccountNotification('newbie')
    expect(sent).toEqual([
      {
        from: 'PeerHub <sender@example.test>',
        to: ['abuse@example.test'],
        subject: 'New account: newbie',
        html: "<p><strong>Username:</strong> <a href='https://peerhub.dev/newbie'>newbie</a></p>",
      },
    ])
  })

  test('new review without comment', async () => {
    await service.sendNewReviewNotification(review)
    expect(sent).toEqual([
      {
        from: 'PeerHub <sender@example.test>',
        to: ['abuse@example.test'],
        subject: 'New review: bob → dave',
        html:
          "<p><strong>Reviewer:</strong> <a href='https://peerhub.dev/bob'>bob</a></p>" +
          "<p><strong>Reviewed:</strong> <a href='https://peerhub.dev/dave'>dave</a></p>" +
          '<p><strong>Status:</strong> approve</p>' +
          '<p><strong>Comment:</strong> (no comment)</p>',
      },
    ])
  })

  test('new anonymous review', async () => {
    await service.sendNewReviewNotification({
      ...review,
      reviewedUsername: 'moddy',
      status: 'request_change',
      comment: 'hmm',
      anonymous: true,
    })
    expect(sent).toEqual([
      {
        from: 'PeerHub <sender@example.test>',
        to: ['abuse@example.test'],
        subject: 'New review: bob (as anonymous) → moddy',
        html:
          "<p><strong>Reviewer:</strong> <a href='https://peerhub.dev/bob'>bob (as anonymous)</a></p>" +
          "<p><strong>Reviewed:</strong> <a href='https://peerhub.dev/moddy'>moddy</a></p>" +
          '<p><strong>Status:</strong> request_change</p>' +
          '<p><strong>Comment:</strong> hmm</p>',
      },
    ])
  })
})

test('user content cannot inject HTML', async () => {
  await service.sendNewReviewNotification({
    ...review,
    reviewedUsername: `x' onclick='alert(1)"><b>`,
    comment: `<img src=x onerror="alert('1')"> & more`,
  })
  const { html } = sent[0]!
  expect(html).toContain('&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt; &amp; more')
  expect(html).not.toMatch(/<img|<b>| onclick='/)
  // Only the tags and quotes of the template remain.
  expect(html.match(/<\/?\w+/g)!.filter((tag) => !/^<\/?(p|strong|a)$/.test(tag))).toEqual([])
  expect(html.match(/'/g)).toHaveLength(4)
})

test.each(['RESEND_API_KEY', 'SENDER_EMAIL', 'ABUSE_CONTROL_EMAIL'])(
  'sends nothing without %s',
  async (name) => {
    lines.length = 0
    const unconfigured = new EmailService({ ...settings, [name]: null }, logger, async (email) => {
      sent.push(email)
    })
    await unconfigured.sendNewAccountNotification('newbie')
    await unconfigured.sendNewReviewNotification(review)
    expect(sent).toEqual([])
    expect(lines.map((line) => line.message)).toEqual([
      'Email service not configured: missing variables',
    ])
  },
)

describe('Resend', () => {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterAll(() => server.close())

  test('receives the email', async () => {
    let body: unknown
    let authorization: string | null = null
    server.use(
      http.post('https://api.resend.com/emails', async ({ request }) => {
        body = await request.json()
        authorization = request.headers.get('authorization')
        return HttpResponse.json({ id: '1' })
      }),
    )
    await new EmailService(settings, logger).sendNewAccountNotification('newbie')
    expect(authorization).toBe('Bearer re_key')
    expect(body).toMatchObject({
      from: 'PeerHub <sender@example.test>',
      to: ['abuse@example.test'],
      subject: 'New account: newbie',
    })
  })

  test('failures are raised', async () => {
    server.use(
      http.post('https://api.resend.com/emails', () =>
        HttpResponse.json(
          { name: 'validation_error', message: 'bad sender', statusCode: 422 },
          { status: 422 },
        ),
      ),
    )
    await expect(
      new EmailService(settings, logger).sendNewAccountNotification('newbie'),
    ).rejects.toThrow('bad sender')
  })
})
