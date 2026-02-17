import { z } from 'zod'

export const reviewStatusSchema = z.enum(['approve', 'request_change', 'comment'])
