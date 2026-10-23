// GET /api/recipe?url=<recipe page> - fetches a recipe page and returns just the recipe as JSON,
// read from the schema.org Recipe data most recipe sites include (JSON-LD, or microdata as a fallback).
//
// This endpoint fetches URLs that visitors paste, so it is hardened against being used to reach
// anything it shouldn't (SSRF):
//   - only http(s) on the default ports, no credentials in the URL
//   - every DNS answer is checked at connect time (so DNS rebinding can't slip past) and private,
//     loopback, link-local, cloud-metadata and other reserved ranges are refused
//   - redirects are followed by hand, at most 4, and each hop goes through the same checks
//   - 8 s overall timeout, 4 MB response cap, HTML only
//   - a small per-instance rate limit, plus CDN caching of good answers for a day
const http = require('http')
const https = require('https')
const dns = require('dns')
const net = require('net')
const zlib = require('zlib')

const MAX_BYTES = 4 * 1024 * 1024
const TIMEOUT_MS = 8000
const UA = 'Mozilla/5.0 (compatible; SkipTheStory/1.0; +https://www.departmentofone.net/skip-the-story)'

// ---------- address checks ----------
function ipv4Blocked(ip) {
  const p = ip.split('.').map(Number)
  const [a, b] = p
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 192 && b === 0 && p[2] === 0) || (a === 192 && b === 0 && p[2] === 2) ||
    (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && p[2] === 100) || (a === 203 && b === 0 && p[2] === 113)
}
function ipBlocked(ip) {
  if (net.isIPv4(ip)) return ipv4Blocked(ip)
  const x = ip.toLowerCase()
  if (x === '::' || x === '::1') return true
  const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return ipv4Blocked(mapped[1])
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(x) || x.startsWith('64:ff9b:') || x.startsWith('2001:db8')
}
// Used as the socket's DNS lookup, so the address actually connected to is the one checked.
function safeLookup(hostname, options, cb) {
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err)
    const ok = addrs.filter((a) => !ipBlocked(a.address))
    if (!ok.length || ok.length !== addrs.length) return cb(Object.assign(new Error('blocked address'), { code: 'EBLOCKED' }))
    if (options && options.all) return cb(null, ok)
    cb(null, ok[0].address, ok[0].family)
  })
}

function checkUrl(raw) {
  let u
  try { u = new URL(raw) } catch (e) { return null }
  if (!/^https?:$/.test(u.protocol)) return null
  if (u.username || u.password) return null
  if (u.port && !((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80'))) return null
  const host = u.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host) && ipBlocked(host)) return null
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) return null
  u.hash = ''
  return u
}

// ---------- fetching ----------
function getOnce(u, deadline) {
  return new Promise((resolve, reject) => {
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.get(u, {
      lookup: safeLookup,
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Encoding': 'gzip, deflate, br', 'Accept-Language': 'en' },
      timeout: Math.max(1000, deadline - Date.now()),
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        return resolve({ redirect: new URL(res.headers.location, u).toString() })
      }
      if (res.statusCode !== 200) { res.resume(); return reject(Object.assign(new Error('status ' + res.statusCode), { status: res.statusCode })) }
      const type = String(res.headers['content-type'] || '')
      if (type && !/html|xml/i.test(type)) { res.resume(); return reject(Object.assign(new Error('not html'), { code: 'NOTHTML' })) }
      let stream = res
      const enc = String(res.headers['content-encoding'] || '').toLowerCase()
      if (enc === 'gzip') stream = res.pipe(zlib.createGunzip())
      else if (enc === 'deflate') stream = res.pipe(zlib.createInflate())
      else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress())
      const chunks = []
      let size = 0
      stream.on('data', (c) => {
        size += c.length
        if (size > MAX_BYTES) { req.destroy(); reject(Object.assign(new Error('too big'), { code: 'TOOBIG' })) } else chunks.push(c)
      })
      stream.on('end', () => resolve({ body: Buffer.concat(chunks).toString('utf8'), url: u.toString() }))
      stream.on('error', reject)
    })
    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'TIMEOUT' })))
    req.on('error', reject)
  })
}
async function fetchPage(start) {
  const deadline = Date.now() + TIMEOUT_MS
  let u = start
  for (let hop = 0; hop < 5; hop++) {
    const r = await getOnce(u, deadline)
    if (!r.redirect) return r
    const next = checkUrl(r.redirect)
    if (!next) throw Object.assign(new Error('bad redirect'), { code: 'EBLOCKED' })
    u = next
    if (Date.now() > deadline) throw Object.assign(new Error('timeout'), { code: 'TIMEOUT' })
  }
  throw Object.assign(new Error('too many redirects'), { code: 'REDIRECTS' })
}

// ---------- parsing ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', deg: '°', frac12: '½', frac14: '¼', frac34: '¾', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', eacute: 'é', egrave: 'è', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä' }
function decode(s) {
  return String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+\d*);/gi, (m, e) => {
      if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '' }
      return ENT[e.toLowerCase()] != null ? ENT[e.toLowerCase()] : m
    })
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?)])/g, '$1') // removed tags leave a space before punctuation
    .trim()
}
const isRecipe = (o) => o && typeof o === 'object' && [].concat(o['@type'] || []).some((t) => /recipe$/i.test(String(t)))
function findRecipe(node, depth = 0) {
  if (!node || depth > 8) return null
  if (Array.isArray(node)) { for (const n of node) { const r = findRecipe(n, depth + 1); if (r) return r } return null }
  if (typeof node !== 'object') return null
  if (isRecipe(node)) return node
  for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement']) { const r = findRecipe(node[k], depth + 1); if (r) return r }
  return null
}
function minutes(iso) {
  if (!iso || typeof iso !== 'string') return null
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?/i)
  if (!m) return null
  const total = (+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + Math.round(+m[3] || 0)
  return total || null
}
function text(v) {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return decode(v)
  if (Array.isArray(v)) return text(v[0])
  if (typeof v === 'object') return decode(v.text || v.name || v['@value'] || '')
  return ''
}
function image(v) {
  if (!v) return null
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return image(v[v.length - 1]) // usually the largest last
  return v.url || v.contentUrl || null
}
function steps(v) {
  // recipeInstructions can be a string, a list of strings, HowToStep objects, or HowToSection groups.
  const sections = []
  let loose = []
  const push = (s) => { const t = text(s); if (t) loose.push(t) }
  ;[].concat(v || []).forEach((item) => {
    if (typeof item === 'string') {
      const parts = decode(item).split(/(?:\r?\n)+|(?<=\.)\s+(?=\d+\.\s)/).map((x) => x.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)
      loose.push(...parts)
    } else if (item && /HowToSection/i.test([].concat(item['@type']).join(' '))) {
      if (loose.length) { sections.push({ name: '', steps: loose }); loose = [] }
      const list = []
      ;[].concat(item.itemListElement || []).forEach((s) => { const t = text(s); if (t) list.push(t) })
      if (list.length) sections.push({ name: decode(item.name || ''), steps: list })
    } else push(item)
  })
  if (loose.length) sections.push({ name: '', steps: loose })
  return sections.map((s) => ({ name: s.name.slice(0, 120), steps: s.steps.slice(0, 80).map((x) => x.slice(0, 2000)) })).slice(0, 12)
}
function fromJsonLd(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) {
    const raw = m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, '')
    let data
    try { data = JSON.parse(raw) } catch (e) { try { data = JSON.parse(raw.replace(/[\u0000-\u001f]+/g, ' ')) } catch (e2) { continue } }
    const r = findRecipe(data)
    if (r) return r
  }
  return null
}
function fromMicrodata(html) {
  if (!/itemtype=["']https?:\/\/schema\.org\/Recipe["']/i.test(html)) return null
  const prop = (name) => { const out = []; const re = new RegExp('itemprop=["\']' + name + '["\'][^>]*>([\\s\\S]*?)<\\/', 'gi'); let m; while ((m = re.exec(html))) out.push(m[1]); return out }
  const name = prop('name')[0]
  const ing = prop('recipeIngredient').concat(prop('ingredients'))
  if (!ing.length) return null
  return { name, recipeIngredient: ing, recipeInstructions: prop('recipeInstructions'), recipeYield: prop('recipeYield')[0] }
}
function siteName(html, u) {
  const m = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i)
  return m ? decode(m[1]) : u.hostname.replace(/^www\./, '')
}
function normalise(r, html, u) {
  const ingredients = [].concat(r.recipeIngredient || r.ingredients || []).map(text).filter(Boolean).slice(0, 120).map((x) => x.slice(0, 300))
  const img = image(r.image)
  return {
    title: text(r.name).slice(0, 200) || 'Recipe',
    description: text(r.description).slice(0, 600),
    image: img && /^https:\/\//.test(img) ? img : null,
    yield: text(r.recipeYield).slice(0, 80),
    prepMinutes: minutes(r.prepTime), cookMinutes: minutes(r.cookTime), totalMinutes: minutes(r.totalTime),
    ingredients,
    sections: steps(r.recipeInstructions),
    author: text(r.author).slice(0, 120),
    site: siteName(html, u),
    url: u.toString(),
  }
}

// ---------- rate limit (per warm instance; the CDN cache absorbs repeats) ----------
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000)
  h.push(now)
  hits.set(ip, h)
  if (hits.size > 5000) hits.clear()
  return h.length > 20
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }) }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) { res.setHeader('Retry-After', '60'); return res.status(429).json({ error: 'Slow down a little, then try again in a minute.' }) }

  const raw = String((req.query && req.query.url) || '').trim().slice(0, 2048)
  const u = checkUrl(raw)
  if (!u) return res.status(400).json({ error: 'That doesn\'t look like a web address. Paste the full link, starting with https://' })

  try {
    const page = await fetchPage(u)
    const finalUrl = new URL(page.url)
    const r = fromJsonLd(page.body) || fromMicrodata(page.body)
    if (!r) return res.status(422).json({ error: 'Couldn\'t find a recipe on that page. Some sites don\'t mark their recipes up, sorry.' })
    const recipe = normalise(r, page.body, finalUrl)
    if (!recipe.ingredients.length && !recipe.sections.length) return res.status(422).json({ error: 'That page has a recipe, but its ingredients and steps are empty.' })
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    return res.status(200).json({ recipe })
  } catch (err) {
    const code = err.code || ''
    if (code === 'EBLOCKED') return res.status(400).json({ error: 'That address can\'t be opened from here.' })
    if (code === 'TIMEOUT') return res.status(504).json({ error: 'That site took too long to answer.' })
    if (code === 'TOOBIG') return res.status(422).json({ error: 'That page is too big to read.' })
    if (code === 'NOTHTML') return res.status(422).json({ error: 'That link isn\'t a web page.' })
    if (code === 'ENOTFOUND') return res.status(400).json({ error: 'That website doesn\'t seem to exist.' })
    if (err.status === 403 || err.status === 429 || err.status === 503) return res.status(502).json({ error: 'That site turned us away (it blocks automated visitors). Try opening it yourself.' })
    if (err.status === 404) return res.status(404).json({ error: 'That page doesn\'t exist anymore.' })
    console.error('recipe fetch failed', raw, err && err.message)
    return res.status(502).json({ error: 'Couldn\'t load that page. Try again, or try another recipe.' })
  }
}

module.exports._test = { checkUrl, ipBlocked, fromJsonLd, normalise, steps, minutes, decode }
