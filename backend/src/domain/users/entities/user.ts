export interface UserProps {
  username: string
  id?: string | null
  name?: string | null
  bio?: string | null
  avatarUrl?: string | null
  type?: string | null
  updatedAt?: Date | null
  createdAt?: Date | null
  deletedAt?: Date | null
}

/** A GitHub user. createdAt and deletedAt come from the matching account, if any. */
export class User {
  username: string
  id: string | null
  name: string | null
  bio: string | null
  avatarUrl: string | null
  type: string | null
  updatedAt: Date | null
  createdAt: Date | null
  deletedAt: Date | null

  constructor(props: UserProps) {
    this.username = props.username
    this.id = props.id ?? null
    this.name = props.name ?? null
    this.bio = props.bio ?? null
    this.avatarUrl = props.avatarUrl ?? null
    this.type = props.type ?? null
    this.updatedAt = props.updatedAt ?? null
    this.createdAt = props.createdAt ?? null
    this.deletedAt = props.deletedAt ?? null
  }

  /** Whether this is a regular user (not an Organization or Bot). */
  get isUserType(): boolean {
    return this.type === 'User'
  }
}
