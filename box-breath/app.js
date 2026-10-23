// Box Breath: a pacer that steps through in / hold / out / hold. Phase timing comes from
// timestamps, and the shape's scale is driven per frame so a long phase is one smooth motion.
;(function () {
  const $ = (id) => document.getElementById(id)
  const PATTERNS = [
    { id: 'box', name: 'Box', note: 'In 4, hold 4, out 4, hold 4', steps: [4, 4, 4, 4] },
    { id: '478', name: '4-7-8', note: 'In 4, hold 7, out 8. Good before sleep.', steps: [4, 7, 8, 0] },
    { id: 'calm', name: 'Calm', note: 'In 4, out 6. Simple and slow.', steps: [4, 0, 6, 0] },
    { id: 'custom', name: 'Custom', note: 'Set your own counts.', steps: null },
  ]
  const LABELS = ['Breathe in', 'Hold', 'Breathe out', 'Hold']
  let current = Kit.store.get('breath-pattern', 'box')
  let running = false, raf = 0, phase = 0, phaseStart = 0, sessionStart = 0, cycles = 0

  const list = $('patterns')
  PATTERNS.forEach((p) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'pattern'
    b.dataset.id = p.id
    b.innerHTML = '<b></b><span></span>'
    b.firstChild.textContent = p.name
    b.lastChild.textContent = p.note
    b.addEventListener('click', () => select(p.id))
    list.appendChild(b)
  })
  const customInputs = Array.from(document.querySelectorAll('#customBox input'))
  const savedCustom = Kit.store.get('breath-custom', [4, 4, 4, 4])
  customInputs.forEach((inp, i) => { inp.value = savedCustom[i]; inp.addEventListener('input', () => Kit.store.set('breath-custom', steps())) })

  function steps() {
    const p = PATTERNS.find((x) => x.id === current)
    if (p.steps) return p.steps
    return customInputs.map((inp, i) => Math.max(i % 2 ? 0 : 1, Math.min(20, Math.round(+inp.value || 0))))
  }
  function select(id) {
    current = id
    Kit.store.set('breath-pattern', id)
    list.querySelectorAll('.pattern').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)))
    $('customBox').hidden = id !== 'custom'
  }
  select(current)

  function tone(up) {
    if (!$('sound').checked) return
    const ctx = Kit.audio()
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime
    o.type = 'sine'
    o.frequency.value = up ? 392 : 294
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.08, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
    o.connect(g).connect(ctx.destination)
    o.start(t); o.stop(t + 1.5)
  }

  const shape = $('shape')
  const MIN = 0.55, MAX = 1.0
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

  function nextPhase(now) {
    const s = steps()
    do { phase = (phase + 1) % 4; if (phase === 0) cycles++ } while (s[phase] === 0)
    phaseStart = now
    tone(phase === 0)
  }
  // Timing, labels and sound run on a plain timer so they keep going in a background tab (where
  // animation frames pause); only the shape's scale is drawn per animation frame.
  let timer = 0
  function advance(now) {
    const s = steps()
    let dur = s[phase] * 1000
    while (now - phaseStart >= dur) { nextPhase(phaseStart + dur); dur = s[phase] * 1000 }
    return { s, dur }
  }
  function tick() {
    const now = performance.now()
    const { s } = advance(now)
    $('phase').textContent = LABELS[phase]
    $('count').textContent = Math.ceil(s[phase] - (now - phaseStart) / 1000)
    const mins = Math.floor((now - sessionStart) / 60000), secs = Math.floor((now - sessionStart) / 1000) % 60
    $('meta').textContent = mins + ':' + String(secs).padStart(2, '0') + ' · ' + cycles + (cycles === 1 ? ' breath' : ' breaths')
  }
  function frame(now) {
    const { dur } = advance(now)
    const t = (now - phaseStart) / dur
    let scale = MIN
    if (phase === 0) scale = MIN + (MAX - MIN) * ease(t)
    else if (phase === 1) scale = MAX
    else if (phase === 2) scale = MAX - (MAX - MIN) * ease(t)
    if (!Kit.reduceMotion) shape.style.transform = 'scale(' + scale.toFixed(4) + ')'
    raf = requestAnimationFrame(frame)
  }

  $('startBtn').addEventListener('click', () => {
    if (running) {
      running = false
      cancelAnimationFrame(raf)
      clearInterval(timer)
      $('startBtn').textContent = 'Start'
      $('phase').textContent = 'Nicely done'
      $('count').textContent = ''
      shape.style.transform = 'scale(' + MIN + ')'
      return
    }
    running = true
    $('startBtn').textContent = 'Stop'
    phase = 0; cycles = 0
    phaseStart = sessionStart = performance.now()
    tone(true)
    tick()
    timer = setInterval(tick, 100)
    raf = requestAnimationFrame(frame)
  })
  $('fullBtn').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else if ($('stage').requestFullscreen) $('stage').requestFullscreen()
  })
})()
