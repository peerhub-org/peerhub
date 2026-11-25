/** GitHub usernames are case-insensitive. */
export function sameUsername(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}
