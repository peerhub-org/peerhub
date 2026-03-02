import { z } from 'zod'
import { Role } from '@shared/application/interfaces/Role'

export const roleSchema = z.enum([Role.USER, Role.MODERATOR])
