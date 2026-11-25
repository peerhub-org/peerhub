import { readFileSync } from 'node:fs'

// Next to the backend folder, in the repository and in the image alike
const VERSION_FILE = new URL('../../../../../VERSION', import.meta.url)

/** Version of the application, or "unknown" when the file is not there. */
export function readVersion(file: URL = VERSION_FILE): string {
  try {
    return readFileSync(file, 'utf8').trim()
  } catch {
    return 'unknown'
  }
}
