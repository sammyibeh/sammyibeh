// Writes assets/whoami-{dark,light}.svg, the typing header on the profile README.
// Colours and font match sammyibeh.dev (src/styles/site.css). The font is JetBrains Mono (OFL), subset to the
// characters below and inlined, because GitHub serves README images with no access to outside fonts:
//   pyftsubset jetbrains-mono-latin.woff2 --text="$(node assets/make.mjs --chars)" --flavor=woff2 --output-file=jbm.woff2
//   node assets/make.mjs jbm.woff2
import { readFileSync, writeFileSync } from 'node:fs'

const PROMPT = 'sammy@ibeh:~$ '
const CMD = 'whoami'
const NAME = 'Sammy Ibeh'
const TAG = 'I turn ideas into beautiful products'
const PILLS = ['Senior Developer @ GDS', 'London', 'building Rownd']
const TITLE = 'sammy@ibeh: ~'

if (process.argv[2] === '--chars') {
  process.stdout.write([...new Set(PROMPT + CMD + NAME + TAG + '.' + PILLS.join('') + TITLE)].join(''))
  process.exit()
}

const THEMES = {
  dark: { bg: '#0c1220', bg2: '#141c2d', bg3: '#080d17', line: '#242e42', tx: '#e8e1d4', hi: '#fff4e0', mu: '#a9a196', ac: '#ffb547', ac2: '#ff8a5b' },
  light: { bg: '#fbf7f0', bg2: '#ffffff', bg3: '#f4ede2', line: '#e9dfcf', tx: '#2d251d', hi: '#18120c', mu: '#6a5b4b', ac: '#a3500b', ac2: '#b4441b' },
}

const font = readFileSync(process.argv[2]).toString('base64')
const CW = 0.6 // JetBrains Mono advance width, in em
const W = 860, X = 32

// One typed line: the text, a cover that steps right off it one character at a time, and a cursor riding its edge.
// start/dur in seconds. `last` keeps the cursor blinking after typing ends and ends the line with the site's amber dot.
function typed(id, x, y, size, text, start, dur, attrs, last = false) {
  const cw = size * CW, n = text.length + (last ? 1 : 0), w = +(n * cw).toFixed(1)
  const h = size * 1.3, top = y - size * 1.0
  return `
  <style>
    @keyframes ${id}-type { to { transform: translateX(${w}px) } }
    .${id}-c { animation: ${id}-type ${dur}s steps(${n}, end) ${start}s forwards }
    ${last ? `@media (prefers-reduced-motion: reduce) { .${id}-k { transform: translateX(${w}px) } }\n    ` : ''}.${id}-k { opacity: 0; animation: ${id}-type ${dur}s steps(${n}, end) ${start}s forwards, ${last ? `blink 1.1s step-end ${start}s infinite` : `on ${dur + 0.25}s step-end ${start}s`} }
  </style>
  <text x="${x}" y="${y}" font-size="${size}" ${attrs}>${text}${last ? '<tspan fill="var(--ac)">.</tspan>' : ''}</text>
  <rect class="cover ${id}-c" x="${x}" y="${top}" width="${w + cw + 2}" height="${h}" fill="var(--bg2)"/>
  <rect class="cursor ${id}-k${last ? ' final' : ''}" x="${x}" y="${top + size * 0.08}" width="${cw}" height="${size * 1.12}" fill="var(--ac)"/>`
}

function svg(t) {
  const pillY = 224
  let px = X
  const pills = PILLS.map((p, i) => {
    const dot = i === 0
    const w = p.length * 13 * CW + 28 + (dot ? 16 : 0)
    const g = `
  <g class="pill" style="animation-delay:${4.1 + i * 0.15}s">
    <rect x="${px}" y="${pillY - 19}" width="${w}" height="28" rx="14" fill="var(--bg3)" stroke="var(--line)"/>
    ${dot ? `<circle class="pulse" cx="${px + 18}" cy="${pillY - 5}" r="4" fill="var(--ac)"/><circle cx="${px + 18}" cy="${pillY - 5}" r="4" fill="var(--ac)"/>` : ''}
    <text x="${px + 14 + (dot ? 16 : 0)}" y="${pillY}" font-size="13" fill="var(--tx)">${p}</text>
  </g>`
    px += w + 10
    return g
  }).join('')

  const pw = PROMPT.length * 16 * CW
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="252" viewBox="0 0 ${W} 252" role="img" aria-labelledby="t">
  <title id="t">Terminal: whoami. Sammy Ibeh. I turn ideas into beautiful products.</title>
  <style>
    @font-face { font-family: "JetBrains Mono"; font-weight: 400 800; src: url(data:font/woff2;base64,${font}) format("woff2") }
    svg { --bg2: ${t.bg2}; --bg3: ${t.bg3}; --line: ${t.line}; --tx: ${t.tx}; --hi: ${t.hi}; --mu: ${t.mu}; --ac: ${t.ac}; --ac2: ${t.ac2} }
    text { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; white-space: pre }
    @keyframes on { 0% { opacity: 1 } 100% { opacity: 0 } }
    @keyframes blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
    @keyframes rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
    @keyframes pulse { from { opacity: .6; transform: scale(1) } to { opacity: 0; transform: scale(3) } }
    .pill { opacity: 0; animation: rise .5s ease-out forwards }
    .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2s ease-out 4.6s infinite }
    /* Calm is a feature: show the finished frame. */
    @media (prefers-reduced-motion: reduce) {
      .cover, .cursor:not(.final) { display: none }
      .cursor.final { opacity: 1; animation: none }
      .pill { opacity: 1; animation: none; transform: none }
      .pulse { animation: none; opacity: 0 }
    }
  </style>
  <rect x=".5" y=".5" width="${W - 1}" height="251" rx="12" fill="var(--bg2)" stroke="var(--line)"/>
  <path d="M.5 12.5a12 12 0 0 1 12-12h${W - 25}a12 12 0 0 1 12 12v21.5h-${W - 1}z" fill="var(--bg3)"/>
  <path d="M.5 34.5h${W - 1}" stroke="var(--line)"/>
  <circle cx="22" cy="17.5" r="5.5" fill="#ff5f57"/><circle cx="40" cy="17.5" r="5.5" fill="#febc2e"/><circle cx="58" cy="17.5" r="5.5" fill="#28c840"/>
  <text x="${W / 2}" y="22" font-size="12" fill="var(--mu)" text-anchor="middle">${TITLE}</text>
  <text x="${X}" y="76" font-size="16" fill="var(--mu)">sammy@ibeh:~$</text>
  ${typed('cmd', X + pw, 76, 16, CMD, 0.4, 0.6, 'fill="var(--hi)" font-weight="700"')}
  ${typed('name', X, 136, 44, NAME, 1.3, 0.9, 'fill="var(--hi)" font-weight="800"')}
  ${typed('tag', X, 176, 18, TAG, 2.4, 1.6, 'fill="var(--tx)"', true)}
  ${pills}
</svg>
`
}

for (const [name, t] of Object.entries(THEMES)) writeFileSync(new URL(`whoami-${name}.svg`, import.meta.url), svg(t))
