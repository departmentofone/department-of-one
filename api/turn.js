// GET /api/turn - ICE servers for Beam's WebRTC connection.
//
// Most connections work with STUN alone. Phones on mobile data and some office or school networks
// need a TURN relay. When the Cloudflare TURN environment variables are set (Vercel -> Settings ->
// Environment Variables), this mints short-lived relay credentials; without them it returns public
// STUN servers only, and Beam still works on most networks.
//   CLOUDFLARE_TURN_KEY_ID         the TURN key's id (Cloudflare dashboard -> Realtime -> TURN)
//   CLOUDFLARE_TURN_KEY_API_TOKEN  that key's API token
// The secret never reaches the browser; only the temporary username/credential does.
const STUN_ONLY = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }]
const ALLOWED = /^https:\/\/(www\.)?departmentofone\.net$|^https:\/\/department-of-one[a-z0-9-]*\.vercel\.app$|^http:\/\/localhost(:\d+)?$/

const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000)
  h.push(now)
  hits.set(ip, h)
  if (hits.size > 5000) hits.clear()
  return h.length > 12
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }) }
  // Only hand relay credentials to our own pages (a soft check, but it stops casual reuse).
  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '')
  const id = process.env.CLOUDFLARE_TURN_KEY_ID, token = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (!id || !token || !ALLOWED.test(origin) || limited(ip)) return res.status(200).json({ iceServers: STUN_ONLY, relay: false })

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + encodeURIComponent(id) + '/credentials/generate-ice-servers', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: 4 * 3600 }),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!r.ok) throw new Error('Cloudflare TURN ' + r.status)
    const j = await r.json()
    // Port 53 entries tend to time out in browsers; drop them.
    const servers = [].concat(j.iceServers || []).map((s) => ({ ...s, urls: [].concat(s.urls).filter((u) => !/:53(\?|$)/.test(u)) })).filter((s) => s.urls.length)
    return res.status(200).json({ iceServers: servers.length ? servers : STUN_ONLY, relay: servers.some((s) => s.username) })
  } catch (err) {
    console.error('turn credentials failed', err && err.message)
    return res.status(200).json({ iceServers: STUN_ONLY, relay: false })
  }
}
