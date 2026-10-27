// Rewrites the <!-- recent:start --> ... <!-- recent:end --> block in README.md with my most recently pushed
// public repos and their latest release. sammyibeh.dev has no feed, so this reads the GitHub API.
// Usage: GITHUB_TOKEN=... node scripts/recent.mjs  (the token is optional locally, but avoids the 60/hour limit)
import { readFileSync, writeFileSync } from 'node:fs'

const USER = 'sammyibeh'
const SKIP = new Set([USER]) // this repo
const COUNT = 5
const README = new URL('../README.md', import.meta.url)

const headers = { accept: 'application/vnd.github+json', 'user-agent': USER }
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`)
  return res.json()
}

const since = new Date()
since.setFullYear(since.getFullYear() - 1) // only repos pushed in the last 12 months
const repos = (await api(`/users/${USER}/repos?type=owner&sort=pushed&per_page=30`))
  .filter((r) => !r.fork && !r.private && !r.archived && !SKIP.has(r.name) && new Date(r.pushed_at) >= since)
  .slice(0, COUNT)

const lines = await Promise.all(
  repos.map(async (r) => {
    const rel = await api(`/repos/${USER}/${r.name}/releases/latest`)
    return [
      `- **[${r.name}](${r.html_url})**`,
      r.description,
      `pushed ${r.pushed_at.slice(0, 10)}`,
      rel && `latest release [${rel.tag_name}](${rel.html_url}) (${rel.published_at.slice(0, 10)})`,
    ]
      .filter(Boolean)
      .join(' · ')
  }),
)

const md = readFileSync(README, 'utf8')
const re = /(<!-- recent:start -->\n)[\s\S]*?(<!-- recent:end -->)/
if (!re.test(md)) throw new Error('README.md has no recent:start/recent:end block')
writeFileSync(README, md.replace(re, `$1${lines.join('\n')}\n$2`))
