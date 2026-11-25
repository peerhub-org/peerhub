import { Resend } from 'resend'
import type { Settings } from '../shared/config/config.ts'
import type { Logger } from '../shared/observability/logging.ts'

const SITE_URL = 'https://peerhub.dev'

export interface Email {
  from: string
  to: string[]
  subject: string
  html: string
}

/** Sends an email, throwing when the provider refuses it. */
export type SendEmail = (email: Email) => Promise<void>

export interface NewReviewNotification {
  reviewerUsername: string
  reviewedUsername: string
  status: string
  comment: string | null
  anonymous: boolean
}

type EmailSettings = Pick<Settings, 'RESEND_API_KEY' | 'SENDER_EMAIL' | 'ABUSE_CONTROL_EMAIL'>

/** Notifies abuse control by email, via Resend. Does nothing unless configured. */
export class EmailService {
  readonly #send: SendEmail
  readonly #addresses: { from: string; to: string } | null

  constructor(settings: EmailSettings, logger: Logger, send?: SendEmail) {
    const { RESEND_API_KEY: apiKey, SENDER_EMAIL: from, ABUSE_CONTROL_EMAIL: to } = settings
    if (apiKey && from && to) {
      this.#addresses = { from, to }
      this.#send = send ?? resendSender(apiKey)
    } else {
      logger.warn('Email service not configured: missing variables')
      this.#addresses = null
      this.#send = async () => {}
    }
  }

  async sendNewReviewNotification(review: NewReviewNotification): Promise<void> {
    const { reviewerUsername, reviewedUsername, status, comment, anonymous } = review
    const reviewer = anonymous ? `${reviewerUsername} (as anonymous)` : reviewerUsername
    await this.#notify(
      `New review: ${reviewer} → ${reviewedUsername}`,
      `<p><strong>Reviewer:</strong> ${profileLink(reviewerUsername, reviewer)}</p>` +
        `<p><strong>Reviewed:</strong> ${profileLink(reviewedUsername)}</p>` +
        `<p><strong>Status:</strong> ${escapeHtml(status)}</p>` +
        `<p><strong>Comment:</strong> ${escapeHtml(comment || '(no comment)')}</p>`,
    )
  }

  async sendNewAccountNotification(username: string): Promise<void> {
    await this.#notify(
      `New account: ${username}`,
      `<p><strong>Username:</strong> ${profileLink(username)}</p>`,
    )
  }

  async #notify(subject: string, html: string): Promise<void> {
    if (this.#addresses === null) return
    const { from, to } = this.#addresses
    await this.#send({ from: `PeerHub <${from}>`, to: [to], subject, html })
  }
}

function resendSender(apiKey: string): SendEmail {
  const resend = new Resend(apiKey)
  return async (email) => {
    const { error } = await resend.emails.send(email)
    if (error) throw new Error(`Resend refused the email: ${error.message}`)
  }
}

function profileLink(username: string, text = username): string {
  return `<a href='${SITE_URL}/${escapeHtml(encodeURIComponent(username))}'>${escapeHtml(text)}</a>`
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]!)
}
