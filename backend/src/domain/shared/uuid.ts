/** UUID in canonical form (lowercase, with dashes), safe to compare and to use as a key. */
export type Uuid = string

/** Parse the spellings accepted by Python's UUID(): any case, with or without dashes. */
export function parseUuid(text: string): Uuid | null {
  const hex = text
    .replaceAll('urn:', '')
    .replaceAll('uuid:', '')
    .replace(/^[{}]+|[{}]+$/g, '')
    .replaceAll('-', '')
    .toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(hex)) return null
  return hex.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
}
