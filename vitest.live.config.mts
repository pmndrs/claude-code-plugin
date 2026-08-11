import { defineConfig } from 'vitest/config'

// The live contract check against the real docs.pmnd.rs. Split into its own config
// so it can never be picked up by `npm test`: a third party being down must not
// redden a pull request. CI runs it weekly instead, where the same failure is signal
// rather than noise.
export default defineConfig({
  test: {
    include: ['test/**/*.live.mts'],
    // One page fetch can be slow, and a retry storm against someone else's docs site
    // is rude
    testTimeout: 30_000,
    retry: 0,
  },
})
