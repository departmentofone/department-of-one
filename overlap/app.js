// Overlap: everything is computed with Intl, the browser's own time zone database, so daylight
// saving and odd offsets (India, Nepal, Chatham...) are always right. State lives in the URL
// hash, so a shared link opens the same people for whoever clicks it.
;(function () {
  const $ = (id) => document.getElementById(id)
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [here, 'UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo'])
  $('zones').innerHTML = zones.map((z) => '<option value="' + z + '"></option>').join('')

  // ---------- state ----------
  let people = null
  function fromHash() {
    try {
      const raw = location.hash.slice(1)
      if (!raw) return null
      const json = decodeURIComponent(escape(atob(raw.replace(/-/g, '+').replace(/_/g, '/'))))
      const data = JSON.parse(json)
      if (!Array.isArray(data.p)) return null
      return data.p.slice(0, 12).map((x) => ({ n: String(x.n || '').slice(0, 30), z: zones.includes(x.z) ? x.z : 'UTC', a: clampH(x.a, 8), b: clampH(x.b, 23) }))
    } catch (e) { return null }
  }
  function toHash() {
    const raw = btoa(unescape(encodeURIComponent(JSON.stringify({ p: people }))))
    return raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  function clampH(v, d) { v = Number(v); return Number.isFinite(v) ? Math.min(24, Math.max(0, Math.round(v * 2) / 2)) : d }
  people = fromHash() || Kit.store.get('overlap', null) || [
    { n: 'Me', z: here, a: 8, b: 23 },
    { n: 'Friend in Tokyo', z: 'Asia/Tokyo', a: 8, b: 23.5 },
    { n: 'Friend in New York', z: 'America/New_York', a: 7, b: 23 },
  ]
  const today = new Date()
  $('day').value = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')

  // ---------- time helpers ----------
  const fmtCache = {}
  function partsIn(zone, t) {
    const f = fmtCache[zone] || (fmtCache[zone] = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }))
    const o = {}
    f.formatToParts(new Date(t)).forEach((p) => { o[p.type] = p.value })
    return { h: +o.hour, m: +o.minute, wd: o.weekday }
  }
  function awakeAt(p, t) {
    const { h, m } = partsIn(p.z, t)
    const x = h + m / 60
    return p.a <= p.b ? x >= p.a && x < p.b : x >= p.a || x < p.b // overnight wrap, e.g. 10:00 until 02:00
  }
  const hourLabel = (x) => String(Math.floor(x) % 24).padStart(2, '0') + ':' + (x % 1 ? '30' : '00')
  function localLabel(zone, t) { const { h, m, wd } = partsIn(zone, t); return wd + ' ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') }
  function shortZone(z) { return z.split('/').pop().replace(/_/g, ' ') }

  // ---------- editor ----------
  const HOURS = Array.from({ length: 49 }, (_, i) => i / 2)
  function hourOptions(sel) { return HOURS.map((h) => '<option value="' + h + '"' + (h === sel ? ' selected' : '') + '>' + (h === 24 ? '24:00' : hourLabel(h)) + '</option>').join('') }
  function renderPeople() {
    const box = $('people')
    box.innerHTML = ''
    people.forEach((p, i) => {
      const row = document.createElement('div')
      row.className = 'person'
      row.innerHTML = '<input class="k-input" aria-label="Name" maxlength="30" />' +
        '<input class="k-input tz" aria-label="Time zone" list="zones" spellcheck="false" />' +
        '<select class="k-select" aria-label="Awake from">' + hourOptions(p.a) + '</select>' +
        '<select class="k-select" aria-label="Awake until">' + hourOptions(p.b) + '</select>' +
        '<button class="icon-btn" type="button" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'
      const [name, tz, a, b, del] = row.children
      name.value = p.n; tz.value = p.z
      name.addEventListener('input', () => { p.n = name.value; update(false) })
      tz.addEventListener('change', () => {
        const match = zones.find((z) => z.toLowerCase() === tz.value.trim().toLowerCase()) || zones.find((z) => z.toLowerCase().includes(tz.value.trim().toLowerCase().replace(/ /g, '_')))
        if (match) { p.z = match; tz.value = match; update(false) } else { Kit.toast('Pick a time zone from the list'); tz.value = p.z }
      })
      a.addEventListener('change', () => { p.a = +a.value; update(false) })
      b.addEventListener('change', () => { p.b = +b.value; update(false) })
      del.addEventListener('click', () => { if (people.length > 1) { people.splice(i, 1); update(true) } })
      box.appendChild(row)
    })
  }

  // ---------- timeline ----------
  function slots() {
    const [y, mo, d] = $('day').value.split('-').map(Number)
    const start = new Date(y, mo - 1, d, 0, 0, 0, 0).getTime()
    return Array.from({ length: 48 }, (_, i) => start + i * 30 * 60000)
  }
  function renderTimeline() {
    const ts = slots(), now = Date.now()
    const box = $('timeline')
    box.innerHTML = '<div class="tl-row"><span class="tl-spacer"></span><div class="hours">' + Array.from({ length: 24 }, (_, h) => '<span>' + (h % 3 ? '' : String(h).padStart(2, '0')) + '</span>').join('') + '</div></div>'
    const all = ts.map((t) => people.every((p) => awakeAt(p, t)))
    people.concat([{ n: 'Everyone', z: null }]).forEach((p) => {
      const row = document.createElement('div')
      row.className = 'tl-row'
      const cells = ts.map((t, i) => {
        const on = p.z ? awakeAt(p, t) : all[i]
        const isNow = now >= t && now < t + 30 * 60000
        return '<i class="' + (on ? 'awake' : '') + (isNow ? ' now' : '') + '" title="' + (p.z ? localLabel(p.z, t) + ' for ' + (p.n || 'them') : '') + '"></i>'
      }).join('')
      row.innerHTML = '<div class="tl-name"></div><div class="cells' + (p.z ? '' : ' all') + '">' + cells + '</div>'
      row.firstChild.textContent = p.n || 'Someone'
      if (p.z) row.firstChild.insertAdjacentHTML('beforeend', '<small></small>'), (row.firstChild.lastChild.textContent = shortZone(p.z))
      box.appendChild(row)
    })
    $('viewTitle').textContent = 'Your day, ' + new Date(ts[0]).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + ' (' + shortZone(here) + ' time)'
    renderWindows(ts, all)
  }
  function renderWindows(ts, all) {
    const ranges = []
    let s = -1
    all.concat([false]).forEach((on, i) => { if (on && s < 0) s = i; if (!on && s >= 0) { ranges.push([s, i]); s = -1 } })
    ranges.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))
    const box = $('windows')
    if (!ranges.length) { box.innerHTML = '<p class="muted">No time when everyone is awake. Someone will have to stay up late, or try widening the hours.</p>'; return }
    box.innerHTML = ''
    ranges.slice(0, 4).forEach(([a, b]) => {
      const t0 = ts[a], t1 = ts[a] + (b - a) * 30 * 60000
      const el = document.createElement('div')
      el.className = 'window'
      const hrs = (b - a) / 2
      el.innerHTML = '<b></b><p></p>'
      el.firstChild.textContent = localLabel(here, t0).slice(4) + ' to ' + localLabel(here, t1).slice(4) + ' your time · ' + (hrs === 1 ? '1 hour' : hrs + ' hours')
      el.lastChild.textContent = people.filter((p) => p.z !== here).map((p) => (p.n || 'Someone') + ': ' + localLabel(p.z, t0) + ' to ' + localLabel(p.z, t1).slice(4)).join(' · ') || 'Everyone is in your time zone.'
      box.appendChild(el)
    })
  }

  function update(rebuildEditor) {
    Kit.store.set('overlap', people)
    history.replaceState(null, '', '#' + toHash())
    if (rebuildEditor) renderPeople()
    renderTimeline()
  }

  $('addBtn').addEventListener('click', () => {
    if (people.length >= 12) return Kit.toast('Twelve people is the limit')
    people.push({ n: 'Someone', z: 'Europe/London', a: 8, b: 23 })
    update(true)
    const inputs = $('people').querySelectorAll('.person input:first-child')
    inputs[inputs.length - 1].select()
  })
  $('day').addEventListener('change', renderTimeline)
  $('shareBtn').addEventListener('click', () => Kit.copy(location.origin + location.pathname + '#' + toHash(), 'Link copied. It opens these people for anyone.'))
  window.addEventListener('hashchange', () => { const p = fromHash(); if (p) { people = p; renderPeople(); renderTimeline() } })
  setInterval(renderTimeline, 60000) // keep the "now" marker honest

  update(true)
})()
