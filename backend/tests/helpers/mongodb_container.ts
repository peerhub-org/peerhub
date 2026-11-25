import { MongoDBContainer } from '@testcontainers/mongodb'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const container = await new MongoDBContainer('mongo:7.0').start()
  project.provide('mongoUri', `${container.getConnectionString()}/?directConnection=true`)
  return async () => {
    await container.stop()
  }
}
