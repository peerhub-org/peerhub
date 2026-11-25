// Follows python-dotenv: in unquoted values "#" only starts a comment after whitespace.
// Node's own parser cuts at any "#", which would silently truncate secrets.
const LINE =
  /^[ \t]*(?:export[ \t]+)?([^\s=#]+)[ \t]*=[ \t]*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|([^\r\n]*))/gm

const ESCAPES: Record<string, string> = { n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\' }

export function parseDotenv(text: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [, key, single, double, plain] of text.matchAll(LINE)) {
    if (single !== undefined) values[key!] = single.replace(/\\(['\\])/g, '$1')
    else if (double !== undefined)
      values[key!] = double.replace(/\\(.)/gs, (all, c: string) => ESCAPES[c] ?? all)
    else values[key!] = plain!.replace(/\s+#.*$/, '').trim()
  }
  return values
}
