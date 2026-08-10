import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { root } from './helpers.mjs'

const claude = spawnSync('claude', ['--version'], { encoding: 'utf8' })
const available = claude.status === 0

test('claude plugin validate accepts this checkout', { skip: available ? false : 'claude CLI not installed' }, () => {
  const result = spawnSync('claude', ['plugin', 'validate', '.'], { cwd: root, encoding: 'utf8' })
  const output = `${result.stdout}${result.stderr}`
  assert.equal(result.status, 0, output)
  assert.doesNotMatch(output, /\berror\b/i, output)
})
