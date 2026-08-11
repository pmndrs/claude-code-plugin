import { defineConfig } from 'vitest/config'

// Offline checks only. *.live.mts is deliberately not matched -- see
// vitest.live.config.mts for why it runs on a different trigger.
export default defineConfig({
  test: {
    include: ['*.test.mts'],
  },
})
