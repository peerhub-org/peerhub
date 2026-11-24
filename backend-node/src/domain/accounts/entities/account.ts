import type { Uuid } from '../../shared/uuid.ts'

export interface AccountProps {
  id: string | null
  uuid: Uuid
  username: string
  accessToken: string
  email?: string | null
  createdAt?: Date | null
  deletedAt?: Date | null
}

export class Account {
  id: string | null
  uuid: Uuid
  username: string
  accessToken: string
  email: string | null
  createdAt: Date | null
  deletedAt: Date | null

  constructor(props: AccountProps) {
    this.id = props.id
    this.uuid = props.uuid
    this.username = props.username
    this.accessToken = props.accessToken
    this.email = props.email ?? null
    this.createdAt = props.createdAt ?? null
    this.deletedAt = props.deletedAt ?? null
  }

  /** Delete this account and clear its access token. */
  delete(): void {
    this.deletedAt = new Date()
    this.accessToken = ''
  }

  activate(): void {
    this.deletedAt = null
  }
}
