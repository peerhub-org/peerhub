import axios from 'axios'
import posthog from 'posthog-js'
import { Account } from '@domains/account/application/interfaces/Account'
import { API_BASE_URL } from '@shared/application/config/env'
import { z } from 'zod'

const accountSchema = z.object({
  uuid: z.string().uuid(),
  username: z.string(),
})

class AccountService {
  private pendingRequest: Promise<Account> | null = null

  async getAccount(): Promise<Account> {
    // Deduplicate concurrent requests - return existing promise if one is in flight
    if (this.pendingRequest) {
      return this.pendingRequest
    }

    this.pendingRequest = axios
      .get(API_BASE_URL + 'account')
      .then((response) => accountSchema.parse(response.data))
      .finally(() => {
        this.pendingRequest = null
      })

    return this.pendingRequest
  }

  async deleteAccount(): Promise<void> {
    const response = await axios.delete(API_BASE_URL + 'account')
    posthog.capture('account_deleted')
    posthog.reset()
    return response.data
  }
}

export default new AccountService()
