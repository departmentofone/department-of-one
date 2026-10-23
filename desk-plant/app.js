// Desk Plant: a focus timer. Timing uses timestamps (the countdown is right even if the tab sleeps),
// and visibilitychange notices when you leave the tab. Each time away costs the plant a leaf.
;(function () {
  const $ = (id) => document.getElementById(id)
  const LEAVES = 8
  const FLOWERS = ['#ff5a36', '#ec4899', '#f5b400', '#8b5cf6', '#3b82f6', '#fb8a3c']

  let minutes = Kit.store.get('plant-length', 25)
  let running = false, endAt = 0, startAt = 0, lost = 0, timer = 0, flower = FLOWERS[0], awaySince = 0
  let garden = Kit.store.get('plant-garden', [])

  // ---------- Plant drawing ----------
  // progress 0..1 grows the stem, unfolds leaves in order and opens the flower at the end.
  function plantSVG(progress, fallenCount, color, droopy) {
    const stemH = 30 + 150 * Math.min(1, progress * 1.15)
    const top = 250 - stemH
    const leafCount = Math.floor(Math.min(1, progress * 1.25) * LEAVES)
    let leaves = ''
    for (let i = 0; i < LEAVES; i++) {
      const y = 240 - (i + 1) * (stemH / (LEAVES + 1.5))
      const side = i % 2 ? 1 : -1
      const shown = i < leafCount && i >= fallenCount
      const fallen = i < fallenCount
      leaves += '<path class="leaf" d="M150 ' + y.toFixed(1) + ' q' + side * 34 + ' -26 ' + side * 58 + ' -6 q' + -side * 30 + ' 18 ' + -side * 58 + ' 6z" fill="' + (fallen ? '#c9b98a' : '#3f9d4a') + '" style="opacity:' + (shown ? 1 : fallen ? 0 : 0) + ';transform:' + (shown ? 'none' : fallen ? 'translateY(40px) rotate(' + side * 40 + 'deg)' : 'scale(0.2)') + '"/>'
    }
    const bloomOn = progress >= 1
    const bud = progress > 0.75 && !bloomOn
    let bloom = ''
    if (bloomOn) {
      for (let p = 0; p < 6; p++) bloom += '<ellipse cx="150" cy="' + (top - 16) + '" rx="12" ry="24" fill="' + color + '" transform="rotate(' + p * 60 + ' 150 ' + top + ')"/>'
      bloom += '<circle cx="150" cy="' + top + '" r="10" fill="#ffd84d"/>'
    } else if (bud) {
      bloom = '<ellipse cx="150" cy="' + (top - 8) + '" rx="9" ry="13" fill="#3f9d4a"/><ellipse cx="150" cy="' + (top - 14) + '" rx="5" ry="7" fill="' + color + '"/>'
    }
    return '<svg class="plant' + (droopy ? ' is-droopy' : '') + '" viewBox="0 0 300 330" role="img" aria-label="A plant, ' + Math.round(progress * 100) + '% grown">' +
      '<ellipse cx="150" cy="318" rx="92" ry="9" fill="rgba(0,0,0,0.08)"/>' +
      '<g class="top"><path class="stem" d="M150 250 C150 ' + (250 - stemH * 0.4) + ' 146 ' + (250 - stemH * 0.7) + ' 150 ' + top + '" stroke="#2f7d3a" stroke-width="6" fill="none" stroke-linecap="round"/>' + leaves + '<g class="bloom">' + bloom + '</g></g>' +
      '<path d="M96 246h108l-12 70h-84z" fill="#c8693f"/><rect x="88" y="236" width="124" height="20" rx="6" fill="#d97a4d"/>' +
      '<path d="M104 262h92" stroke="rgba(255,255,255,0.18)" stroke-width="4"/></svg>'
  }

  function render(progress) {
    $("plantBox").innerHTML = plantSVG(progress, lost, flower, document.hidden && running)
  }

  // ---------- Timer ----------
  function fmt(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') }
  function tick() {
    const now = Date.now()
    const left = endAt - now
    $('time').textContent = fmt(left)
    document.title = fmt(left) + ' · Desk Plant'
    render(Math.min(1, (now - startAt) / (endAt - startAt)))
    if (left <= 0) finish(true)
  }
  function start() {
    running = true; lost = 0
    flower = FLOWERS[Kit.randInt(FLOWERS.length)]
    startAt = Date.now(); endAt = startAt + minutes * 60000
    $('startBtn').hidden = true; $('lengths').hidden = true; $('giveUp').hidden = false
    $('status').textContent = 'Growing. Stay on this tab to keep every leaf.'
    tick()
    timer = setInterval(tick, 250)
  }
  function finish(completed) {
    clearInterval(timer)
    running = false
    document.title = 'Desk Plant'
    $('startBtn').hidden = false; $('lengths').hidden = false; $('giveUp').hidden = true
    const focused = Math.round(Math.min(minutes, (Date.now() - startAt) / 60000))
    if (completed) {
      const health = LEAVES - lost
      garden.push({ d: new Date().toISOString().slice(0, 10), m: minutes, h: health, c: flower })
      garden = garden.slice(-200)
      Kit.store.set('plant-garden', garden)
      Kit.chime([523, 659, 784])
      $('status').textContent = health === LEAVES ? 'Full bloom! Not a single leaf lost. Take a break.' : health > 0 ? 'It bloomed, with ' + health + ' of ' + LEAVES + ' leaves. Take a break.' : 'It made it, barely. Fewer tab switches next time?'
      render(1)
    } else {
      $('status').textContent = 'You gave up after ' + focused + ' min. The plant is back in its seed packet.'
      render(0)
      $('time').textContent = fmt(minutes * 60000)
    }
    renderGarden()
  }
  document.addEventListener('visibilitychange', () => {
    if (!running) return
    if (document.hidden) { awaySince = Date.now() }
    else if (awaySince) {
      // Quick glances (under 3 s) are forgiven.
      if (Date.now() - awaySince > 3000) {
        lost = Math.min(LEAVES, lost + 1)
        $('status').textContent = lost >= LEAVES ? 'Every leaf is gone. It can still bloom if you stay.' : 'You were away, so a leaf fell. ' + (LEAVES - lost) + ' left.'
      }
      awaySince = 0
      tick()
    }
  })

  // ---------- Garden and stats ----------
  function renderGarden() {
    const box = $('garden')
    box.innerHTML = garden.length ? '' : '<p class="small muted" style="grid-column:1/-1">Nothing planted yet.</p>'
    garden.slice().reverse().slice(0, 60).forEach((p) => {
      const fig = document.createElement('figure')
      fig.innerHTML = plantSVG(1, LEAVES - p.h, p.c, false).replace('<svg class="plant"', '<svg class="plant mini"').replace(/<title>.*?<\/title>/, '') + '<figcaption></figcaption>'
      fig.querySelector('figcaption').textContent = p.m + 'm · ' + p.h + '/' + LEAVES
      fig.title = p.d
      box.appendChild(fig)
    })
    const today = new Date().toISOString().slice(0, 10)
    $('sToday').textContent = garden.filter((p) => p.d === today).reduce((s, p) => s + p.m, 0)
    $('sPlants').textContent = garden.length
    // Streak: consecutive days, ending today or yesterday, with at least one plant.
    const days = new Set(garden.map((p) => p.d))
    let streak = 0
    const d = new Date()
    if (!days.has(today)) d.setDate(d.getDate() - 1)
    while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1) }
    $('sStreak').textContent = streak
  }

  // ---------- Controls ----------
  function setLength(m) {
    minutes = m
    Kit.store.set('plant-length', m)
    document.querySelectorAll('#lengths button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.min === m)))
    if (!running) $('time').textContent = fmt(m * 60000)
  }
  document.querySelectorAll('#lengths button').forEach((b) => b.addEventListener('click', () => setLength(+b.dataset.min)))
  $('startBtn').addEventListener('click', () => { Kit.audio(); start() })
  $('giveUp').addEventListener('click', () => { if (confirm('Give up on this plant?')) finish(false) })
  $('clearGarden').addEventListener('click', () => { if (garden.length && confirm('Clear your whole garden?')) { garden = []; Kit.store.set('plant-garden', garden); renderGarden() } })
  window.addEventListener('beforeunload', (e) => { if (running) { e.preventDefault(); e.returnValue = '' } })

  setLength(minutes)
  render(0)
  renderGarden()
})()
