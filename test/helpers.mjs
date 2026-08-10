import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export const readJson = (...p) => JSON.parse(readFileSync(join(root, ...p), 'utf8'))

/**
 * Minimal YAML front matter reader — enough for the subset Claude Code agent and
 * skill files use: `key: value`, block lists, and inline `[a, b]` lists. Values
 * are returned as strings or arrays of strings, never coerced.
 */
export function frontMatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) throw new Error('no front matter block')

  const fields = {}
  let key = null

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue

    const item = /^\s*-\s+(.*)$/.exec(line)
    if (item) {
      if (!key) throw new Error(`list item outside a key: ${line}`)
      fields[key] = [...(Array.isArray(fields[key]) ? fields[key] : []), unquote(item[1])]
      continue
    }

    const pair = /^([A-Za-z][\w-]*):\s?(.*)$/.exec(line)
    if (!pair) continue // a wrapped value; the fields we assert on are single-line
    key = pair[1]
    const value = pair[2].trim()
    fields[key] = value === '' ? [] : parseScalar(value)
  }

  return { fields, body: source.slice(match[0].length) }
}

const unquote = (v) => v.replace(/^['"]|['"]$/g, '').trim()

function parseScalar(value) {
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim()
    return inner ? inner.split(',').map(unquote) : []
  }
  return unquote(value)
}

/** Front matter list fields accept either `a, b` on one line or a block list. */
export const asList = (value) =>
  value === undefined ? [] : Array.isArray(value) ? value : value.split(',').map((v) => v.trim()).filter(Boolean)

export function loadMarkdown(dir, file) {
  const path = join(root, dir, file)
  return { path: `${dir}/${file}`, ...frontMatter(readFileSync(path, 'utf8')) }
}

export const agents = () =>
  existsSync(join(root, 'agents'))
    ? readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md')).map((f) => loadMarkdown('agents', f))
    : []

export const skills = () =>
  existsSync(join(root, 'skills'))
    ? readdirSync(join(root, 'skills'), { withFileTypes: true })
        .filter((e) => e.isDirectory() && existsSync(join(root, 'skills', e.name, 'SKILL.md')))
        .map((e) => loadMarkdown(`skills/${e.name}`, 'SKILL.md'))
    : []
