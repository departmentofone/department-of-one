// Sky Window: sky colours come from the sun's elevation (computed here from the date and the
// city's coordinates) blended toward grey by Open-Meteo's live cloud cover. The weather is fetched
// at most every 15 minutes per city and cached, so the page stays light on the free API.
;(function () {
  const $ = (id) => document.getElementById(id)
  const canvas = $('canvas'), g = canvas.getContext('2d')
  const rad = Math.PI / 180
  let place = null, weather = null, clean = false

  // ---------- sun position (good to a fraction of a degree, plenty for colours) ----------
  function sun(date, lat, lon) {
    const d = date.getTime() / 86400000 - 10957.5
    const gM = (357.529 + 0.98560028 * d) * rad
    const q = 280.459 + 0.98564736 * d
    const L = (q + 1.915 * Math.sin(gM) + 0.02 * Math.sin(2 * gM)) * rad
    const e = (23.439 - 0.00000036 * d) * rad
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))
    const dec = Math.asin(Math.sin(e) * Math.sin(L))
    const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24
    const H = (gmst * 15 + lon) * rad - ra
    const la = lat * rad
    const el = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H))
    const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H))
    return { el: el / rad, az: ((az / rad) + 360) % 360 }
  }

  // ---------- colour ----------
  // Sun elevation (degrees) -> [zenith, horizon] colours.
  const KEYS = [
    [-18, '#04060d', '#0a0f22'], [-10, '#0a1130', '#252656'], [-6, '#182152', '#5c4579'], [-3, '#29387a', '#c8716d'],
    [0, '#3a579b', '#f09a5a'], [4, '#4b7cc0', '#f6c48b'], [10, '#5893d4', '#cfe2f0'], [25, '#3d84d6', '#b8dbf4'], [60, '#2c74d0', '#a6d1f4'],
  ]
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
  const css = (c, a = 1) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'
  function skyColors(el, cloud) {
    let i = KEYS.findIndex((k) => k[0] > el)
    if (i < 0) i = KEYS.length - 1
    if (i === 0) i = 1
    const [e0, z0, h0] = KEYS[i - 1], [e1, z1, h1] = KEYS[i]
    const t = Math.min(1, Math.max(0, (el - e0) / (e1 - e0)))
    let z = mix(hex2rgb(z0), hex2rgb(z1), t), h = mix(hex2rgb(h0), hex2rgb(h1), t)
    // Clouds wash the colour toward grey; darker grey at night.
    const c = Math.min(1, (cloud || 0) / 100) * 0.75
    const light = Math.max(0, Math.min(1, (el + 8) / 20))
    const grey = mix([22, 26, 36], [150, 158, 170], light), greyH = mix([34, 38, 50], [190, 196, 204], light)
    return { z: mix(z, grey, c), h: mix(h, greyH, c * 0.85) }
  }

  // Stars are fixed per city so they don't jump around between frames.
  let stars = []
  function makeStars() {
    let s = Math.floor((place ? place.lat * 1000 + place.lon : 1) * 7) >>> 0 || 1
    const r = () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) >>> 0) / 4294967296)
    stars = Array.from({ length: 220 }, () => ({ x: r(), y: r() * 0.8, s: 0.4 + r() * 1.2, a: 0.3 + r() * 0.7 }))
  }

  function paint(target, W, H, now) {
    const lat = place ? place.lat : 44.8, lon = place ? place.lon : 20.46
    const p = sun(now, lat, lon)
    const cloud = weather ? weather.cloud : 30
    const { z, h } = skyColors(p.el, cloud)
    const grd = target.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, css(z)); grd.addColorStop(0.62, css(mix(z, h, 0.55))); grd.addColorStop(1, css(h))
    target.fillStyle = grd
    target.fillRect(0, 0, W, H)
    // Glow where the sun is (or just below the horizon at dusk). East on the left, west on the right.
    const sx = W * (0.15 + 0.7 * (((p.az - 60) % 360 + 360) % 360) / 240)
    const sy = H * (0.95 - Math.max(-0.2, Math.min(0.85, p.el / 70)))
    if (p.el > -10) {
      const strength = Math.max(0, Math.min(1, (p.el + 10) / 14)) * (1 - (cloud / 100) * 0.7)
      const glow = target.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.55)
      const warm = p.el < 8 ? [255, 190, 120] : [255, 245, 220]
      glow.addColorStop(0, css(warm, 0.55 * strength)); glow.addColorStop(0.25, css(warm, 0.2 * strength)); glow.addColorStop(1, css(warm, 0))
      target.fillStyle = glow
      target.fillRect(0, 0, W, H)
      if (p.el > 0 && cloud < 85) { target.fillStyle = css([255, 250, 235], 0.9 * (1 - cloud / 100)); target.beginPath(); target.arc(sx, sy, Math.max(W, H) * 0.018, 0, Math.PI * 2); target.fill() }
    }
    if (p.el < -4) {
      const dark = Math.min(1, (-4 - p.el) / 10) * (1 - (cloud / 100) * 0.9)
      stars.forEach((st) => { target.fillStyle = 'rgba(255,255,255,' + st.a * dark + ')'; target.fillRect(st.x * W, st.y * H, st.s * (W / 1200 + 0.5), st.s * (W / 1200 + 0.5)) })
    }
    return p
  }

  function draw() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = Math.round(canvas.clientWidth * dpr), H = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
    paint(g, W, H, new Date())
    if (place) {
      const t = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', timeZone: place.tz }).format(new Date())
      $('clock').textContent = t
      $('city').textContent = place.name + (place.country ? ', ' + place.country : '')
      $('weather').textContent = weather ? describe(weather) : ''
    }
  }
  function describe(w) {
    const CODES = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail' }
    return (CODES[w.code] || 'Weather') + ' · ' + Math.round(w.temp) + '°C · ' + w.cloud + '% cloud'
  }

  // ---------- data ----------
  async function getWeather() {
    if (!place) return
    const key = 'sky-wx:' + place.lat.toFixed(2) + ',' + place.lon.toFixed(2)
    const cached = Kit.store.get(key, null)
    if (cached && Date.now() - cached.at < 15 * 60000) { weather = cached.w; draw(); return }
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.lat + '&longitude=' + place.lon + '&current=cloud_cover,weather_code,temperature_2m&timezone=auto'
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.status)
      const j = await res.json()
      weather = { cloud: j.current.cloud_cover, code: j.current.weather_code, temp: j.current.temperature_2m }
      Kit.store.set(key, { at: Date.now(), w: weather })
    } catch (e) {
      // No weather? The sky still follows the sun, just without clouds.
      weather = cached ? cached.w : null
    }
    draw()
  }
  async function geocode(q) {
    const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=' + encodeURIComponent(q))
    if (!res.ok) throw new Error(res.status)
    const j = await res.json()
    return (j.results || []).map((r) => ({ name: r.name, country: r.country || '', region: r.admin1 || '', lat: r.latitude, lon: r.longitude, tz: r.timezone || 'UTC' }))
  }
  function setPlace(p) {
    place = p
    Kit.store.set('sky-place', p)
    const url = new URL(location.href)
    url.searchParams.set('city', p.name)
    history.replaceState(null, '', url)
    weather = null
    makeStars()
    draw()
    getWeather()
  }

  // ---------- UI ----------
  let searchTimer = 0
  $('search').addEventListener('input', () => {
    clearTimeout(searchTimer)
    const q = $('search').value.trim()
    if (q.length < 2) { $('results').innerHTML = ''; return }
    searchTimer = setTimeout(async () => {
      try {
        const list = await geocode(q)
        const box = $('results')
        box.innerHTML = list.length ? '' : '<p class="small muted">No city by that name.</p>'
        list.forEach((p) => {
          const b = document.createElement('button')
          b.type = 'button'
          b.innerHTML = '<span></span><small></small>'
          b.firstChild.textContent = p.name
          b.lastChild.textContent = [p.region, p.country].filter(Boolean).join(', ')
          b.addEventListener('click', () => { setPlace(p); box.innerHTML = ''; $('search').value = '' })
          box.appendChild(b)
        })
      } catch (e) { $('results').innerHTML = '<p class="small muted">Search isn\'t answering. Try again in a moment.</p>' }
    }, 300)
  })
  $('fullBtn').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else $('sky').requestFullscreen && $('sky').requestFullscreen() })
  $('cleanBtn').addEventListener('click', () => { clean = !clean; $('sky').classList.toggle('is-clean', clean) })
  $('saveBtn').addEventListener('click', () => {
    const c = document.createElement('canvas')
    const dpr = window.devicePixelRatio || 1
    c.width = Math.round(screen.width * dpr); c.height = Math.round(screen.height * dpr)
    paint(c.getContext('2d'), c.width, c.height, new Date())
    c.toBlob((b) => Kit.download(b, 'sky-' + (place ? place.name.toLowerCase().replace(/\W+/g, '-') : 'window') + '.png'), 'image/png')
  })
  $('linkBtn').addEventListener('click', () => Kit.copy(location.href, 'Link copied'))
  window.addEventListener('resize', draw)
  document.addEventListener('fullscreenchange', () => setTimeout(draw, 50))

  // Start with ?city=, then the last city, then a guess from the time zone (no location prompt).
  ;(async () => {
    const q = new URLSearchParams(location.search).get('city')
    const saved = Kit.store.get('sky-place', null)
    if (!q && saved) return setPlace(saved)
    const guess = q || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London').split('/').pop().replace(/_/g, ' ')
    try {
      const list = await geocode(guess)
      setPlace(list[0] || { name: 'London', country: 'United Kingdom', lat: 51.51, lon: -0.13, tz: 'Europe/London' })
    } catch (e) {
      setPlace(saved || { name: 'London', country: 'United Kingdom', lat: 51.51, lon: -0.13, tz: 'Europe/London' })
    }
  })()
  setInterval(draw, 10000)
  setInterval(getWeather, 15 * 60000)
})()
