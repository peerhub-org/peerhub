import type { CollationOptions } from 'mongodb'

/** Case-insensitive collation for username queries */
export const CASE_INSENSITIVE: CollationOptions = { locale: 'en', strength: 2 }
