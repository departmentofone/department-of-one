// Decider: coin, dice and a wheel. All randomness comes from crypto.getRandomValues (Kit.randInt).
;(function () {
  const $ = (id) => document.getElementById(id)

  // ---------- Tabs ----------
  const tabs = Array.from(document.querySelectorAll('[data-tab]'))
  function showTab(name) {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)))
    ;['coin', 'dice', 'wheel'].forEach((n) => { $('tab-' + n).hidden = n !== name })
    if (name === 'wheel') drawWheel()
    Kit.store.set('decider-tab', name)
  }
  tabs.forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)))

  // ---------- Coin ----------
  const coin = $('coin')
  let turns = 0, busy = false
  function flipOnce() {
    return new Promise((resolve) => {
      const heads = Kit.randInt(2) === 0
      // Several full turns, landing on the right face. Always forward, so it never spins back.
      turns += 5 + (heads ? (turns % 2 ? 0 : 1) : (turns % 2 ? 1 : 0))
      coin.style.transform = 'rotateY(' + turns * 180 + 'deg)'
      setTimeout(() => resolve(heads), Kit.reduceMotion ? 50 : 1100)
    })
  }
  $('flipBtn').addEventListener('click', async () => {
    if (busy) return
    busy = true
    $('coinSub').textContent = ''
    const heads = await flipOnce()
    $('coinResult').textContent = heads ? 'Heads.' : 'Tails.'
    busy = false
  })
  $('bestBtn').addEventListener('click', async () => {
    if (busy) return
    busy = true
    let h = 0, t = 0
    const seq = []
    while (h < 2 && t < 2) {
      const heads = await flipOnce()
      heads ? h++ : t++
      seq.push(heads ? 'H' : 'T')
      $('coinResult').textContent = 'Heads ' + h + ', tails ' + t
      $('coinSub').textContent = seq.join(' · ')
    }
    $('coinResult').textContent = (h > t ? 'Heads' : 'Tails') + ' wins, ' + Math.max(h, t) + ' to ' + Math.min(h, t) + '.'
    busy = false
  })

  // ---------- Dice ----------
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }
  let diceN = Kit.store.get('decider-dice', 2)
  function renderDice(values) {
    const box = $('dice')
    box.innerHTML = ''
    values.forEach((v) => {
      const d = document.createElement('div')
      d.className = 'die'
      d.setAttribute('role', 'img')
      d.setAttribute('aria-label', 'Die showing ' + v)
      for (let i = 0; i < 9; i++) {
        const pip = document.createElement('i')
        if (PIPS[v].includes(i)) pip.style.visibility = 'visible'
        d.appendChild(pip)
      }
      box.appendChild(d)
    })
  }
  function setCount(n) {
    diceN = n
    Kit.store.set('decider-dice', n)
    document.querySelectorAll('#diceCount button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === n)))
    renderDice(Array.from({ length: n }, () => 6))
  }
  document.querySelectorAll('#diceCount button').forEach((b) => b.addEventListener('click', () => setCount(+b.dataset.n)))
  $('rollBtn').addEventListener('click', () => {
    const values = Array.from({ length: diceN }, () => 1 + Kit.randInt(6))
    renderDice(values)
    $('dice').querySelectorAll('.die').forEach((d) => d.classList.add('is-rolling'))
    const total = values.reduce((a, b) => a + b, 0)
    $('diceResult').textContent = diceN === 1 ? 'You rolled ' + total + '.' : values.join(' + ') + ' = ' + total
  })
  setCount(diceN)

  // ---------- Wheel ----------
  const canvas = $('wheel'), ctx = canvas.getContext('2d'), optionsEl = $('options')
  const COLORS = ['#ff5a36', '#3b82f6', '#1fa463', '#8b5cf6', '#f5b400', '#ec4899', '#0ea5a4', '#fb8a3c', '#5b5ff0', '#84cc16']
  optionsEl.value = Kit.store.get('decider-wheel', 'Pizza\nTacos\nSushi\nCurry\nBurgers\nSalad (ha)')
  let angle = 0, spinning = false
  const options = () => optionsEl.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 40)

  function drawWheel() {
    const opts = options()
    const size = canvas.width, r = size / 2 - 8
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.rotate(angle)
    if (!opts.length) {
      ctx.fillStyle = '#ede8dd'
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
    }
    const slice = (Math.PI * 2) / Math.max(opts.length, 1)
    opts.forEach((label, i) => {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, r, i * slice, (i + 1) * slice)
      ctx.closePath()
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.save()
      ctx.rotate(i * slice + slice / 2)
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.font = '600 ' + Math.max(16, Math.min(34, 260 / Math.max(opts.length, 4))) + 'px Geist, system-ui, sans-serif'
      const text = label.length > 22 ? label.slice(0, 21) + '…' : label
      ctx.fillText(text, r - 24, 0)
      ctx.restore()
    })
    ctx.restore()
    // Hub
    ctx.beginPath(); ctx.arc(size / 2, size / 2, 34, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
    ctx.lineWidth = 6; ctx.strokeStyle = '#17171a'; ctx.stroke()
  }

  function spin() {
    const opts = options()
    if (spinning || opts.length < 2) {
      if (opts.length < 2) $('wheelResult').textContent = 'Add at least two options.'
      return
    }
    spinning = true
    const slice = (Math.PI * 2) / opts.length
    const winner = Kit.randInt(opts.length)
    // The pointer sits at the top (-90deg). Land the middle of the winning slice there, plus a random
    // offset inside the slice so it doesn't always stop dead centre.
    const jitter = (Kit.randInt(1000) / 1000 - 0.5) * slice * 0.7
    const target = -Math.PI / 2 - (winner * slice + slice / 2) - jitter
    const current = angle % (Math.PI * 2)
    let delta = target - current
    while (delta < 0) delta += Math.PI * 2
    const total = delta + Math.PI * 2 * (5 + Kit.randInt(3))
    const start = angle, dur = Kit.reduceMotion ? 1 : 4200, t0 = performance.now()
    const ease = (t) => 1 - Math.pow(1 - t, 4)
    $('wheelResult').textContent = 'Spinning…'
    ;(function frame(now) {
      const t = Math.min(1, (now - t0) / dur)
      angle = start + total * ease(t)
      drawWheel()
      if (t < 1) return requestAnimationFrame(frame)
      spinning = false
      $('wheelResult').textContent = opts[winner] + '!'
      if ($('removeWinner').checked) {
        const lines = optionsEl.value.split('\n')
        const idx = lines.findIndex((l) => l.trim() === opts[winner])
        if (idx >= 0) { lines.splice(idx, 1); optionsEl.value = lines.join('\n'); Kit.store.set('decider-wheel', optionsEl.value); drawWheel() }
      }
    })(performance.now())
  }
  $('spinBtn').addEventListener('click', spin)
  optionsEl.addEventListener('input', () => { Kit.store.set('decider-wheel', optionsEl.value); drawWheel() })
  if (document.fonts) document.fonts.ready.then(drawWheel)

  showTab(Kit.store.get('decider-tab', 'coin'))
})()
