import test from 'node:test'
import assert from 'node:assert/strict'
import { skills, agents } from './helpers.mjs'

const all = skills()

test('the plugin ships at least one skill', () => {
  assert.ok(all.length > 0)
})

for (const skill of all) {
  const { fields, body, path } = skill
  const directory = path.split('/')[1]

  test(`${path}: name matches its directory`, () => {
    // Without a matching front matter name the skill is invoked under the
    // install directory name, which for a marketplace install is a version
    // string that changes on every update.
    assert.equal(fields.name, directory)
    assert.ok(fields.description?.length > 60, 'the description is the trigger')
  })

  test(`${path}: links are https`, () => {
    for (const url of body.match(/https?:\/\/[^\s)`>]+/g) ?? []) {
      assert.match(url, /^https:/, `${url} must be https`)
    }
  })
}

const docs = all.find((s) => s.fields.name === 'docs')

test('the docs skill only sends readers to pmndrs docs and repos', () => {
  // Specific to this skill, not a house rule: its whole job is to replace a
  // remembered API with the published one, so an off-site link is a lookup
  // that went somewhere it cannot vouch for.
  for (const url of docs.body.match(/https:\/\/[^\s)`>]+/g) ?? []) {
    assert.match(url, /^https:\/\/(docs\.pmnd\.rs|github\.com\/pmndrs)/, `${url} points outside pmndrs`)
  }
})

test('the docs skill states which libraries are served, and when that was checked', () => {
  assert.ok(docs, 'skills/docs/SKILL.md is where this plugin started')

  const rows = [...docs.body.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|\s*(\d+)\s*\|/gm)]
  assert.ok(rows.length >= 3, 'the coverage table should list the served libraries with page counts')
  for (const [, lib, pages] of rows) {
    assert.ok(Number(pages) > 0, `${lib} is listed as served but has no pages`)
  }

  // The empty-library list is a claim about the outside world; it needs a date
  // so a reader can tell how much to trust it.
  const checked = /checked\s+(\d{4})-(\d{2})-(\d{2})/.exec(docs.body)
  assert.ok(checked, 'the uncovered-libraries claim must carry a checked-on date')
  const [, y, m, d] = checked
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  assert.equal(date.getUTCDate(), Number(d), 'checked-on date is a real date')
  assert.ok(date.getTime() <= Date.now(), 'checked-on date is not in the future')
})

test('the docs skill tells Claude when to delegate, and to an agent that exists', () => {
  const names = agents().map((a) => a.fields.name)
  const referenced = names.filter((name) => docs.body.includes(name))
  assert.ok(referenced.length > 0, `SKILL.md should route wide lookups to one of: ${names.join(', ')}`)
})
