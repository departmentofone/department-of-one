// Static: a noise mixer. Each sound is a few seconds of procedurally generated audio (noise shaped
// with simple filters and envelopes), looped, then shaped further with Web Audio filters and slow
// LFOs so the loop point isn't noticeable. Nothing is downloaded.
;(function () {
  const $ = (id) => document.getElementById(id)
  const ICON = {
    rain: '<path d="M7 15a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5"/>',
    waves: '<path d="M2.5 9c2.4 0 2.4-2 4.75-2S9.6 9 12 9s2.4-2 4.75-2S19.1 9 21.5 9M2.5 15c2.4 0 2.4-2 4.75-2S9.6 15 12 15s2.4-2 4.75-2 2.35 2 4.75 2"/>',
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7"/>',
    fire: '<path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.3 3.6-8.3.9 1.6 1.8 2.4 2.9 2.8C12.6 6.5 13.7 4.4 15.6 3c-.3 3 2.9 5.2 2.9 10 0 4.8-2.6 8-6.5 8z"/>',
    fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c-1-4 1-7 4-6.5 2 .4 1.8 3.8-2 6.5M14 12c4-1 7 1 6.5 4-.4 2-3.8 1.8-6.5-2M12 14c1 4-1 7-4 6.5-2-.4-1.8-3.8 2-6.5M10 12c-4 1-7-1-6.5-4 .4-2 3.8-1.8 6.5 2"/>',
    train: '<rect x="5" y="3.5" width="14" height="13" rx="3"/><path d="M5 10.5h14M8.5 20l-2 1.5M15.5 20l2 1.5"/><circle cx="9" cy="13.5" r=".9" fill="currentColor"/><circle cx="15" cy="13.5" r=".9" fill="currentColor"/>',
    brown: '<path d="M2.5 12c1.6 0 1.6-4 3.2-4s1.6 8 3.2 8 1.6-6 3.2-6 1.6 4 3.2 4 1.6-2 3.2-2 1.6 1 2.8 1"/>',
  }
  const SOUNDS = [
    { id: 'rain', name: 'Rain', tile: 't-sky' },
    { id: 'waves', name: 'Waves', tile: 't-teal' },
    { id: 'wind', name: 'Wind', tile: 't-slate' },
    { id: 'fire', name: 'Fire', tile: 't-orange' },
    { id: 'fan', name: 'Fan', tile: 't-indigo' },
    { id: 'train', name: 'Train', tile: 't-ink' },
    { id: 'brown', name: 'Brown noise', tile: 't-sun' },
  ]
  const PRESETS = [
    { name: 'Focus', mix: { brown: 45, rain: 25 } },
    { name: 'Sleep', mix: { waves: 50, fan: 30 } },
    { name: 'Cosy', mix: { fire: 55, rain: 35, wind: 15 } },
    { name: 'Night train', mix: { train: 60, rain: 20 } },
    { name: 'Storm', mix: { rain: 70, wind: 45 } },
  ]

  let ctx = null, master = null, playing = false, sleepTimer = 0
  const channels = {} // id -> { gain, started }
  let levels = readMix() || Kit.store.get('static-mix', null) || { rain: 40, brown: 20 }

  function readMix() {
    const m = location.hash.match(/mix=([a-z0-9:,]+)/)
    if (!m) return null
    const out = {}
    m[1].split(',').forEach((pair) => { const [k, v] = pair.split(':'); if (SOUNDS.some((s) => s.id === k)) out[k] = Math.min(100, Math.max(0, +v || 0)) })
    return out
  }
  const mixString = () => Object.entries(levels).filter(([, v]) => v > 0).map(([k, v]) => k + ':' + v).join(',')

  // ---------- sound generation ----------
  function noiseBuffer(seconds, fill) {
    const rate = ctx.sampleRate, n = Math.floor(seconds * rate)
    const buf = ctx.createBuffer(2, n, rate)
    for (let c = 0; c < 2; c++) fill(buf.getChannelData(c), rate, c)
    // Crossfade the end into the start so the loop is seamless.
    const fade = Math.floor(rate * 0.25)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < fade; i++) { const t = i / fade; d[i] = d[i] * t + d[n - fade + i] * (1 - t) }
    }
    return buf
  }
  const white = () => Math.random() * 2 - 1
  function brownFill(d) { let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.02 * white()) / 1.02; d[i] = last * 3.5 } }
  function pinkFill(d) {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < d.length; i++) {
      const w = white()
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926
    }
  }
  // Short decaying clicks scattered through a buffer (rain drops, fire crackles).
  function sprinkle(d, rate, perSecond, len, amp, tone) {
    const count = Math.floor((d.length / rate) * perSecond)
    for (let k = 0; k < count; k++) {
      const at = Math.floor(Math.random() * d.length), l = Math.floor(rate * len * (0.4 + Math.random())), a = amp * (0.3 + Math.random() * 0.7)
      let lp = 0
      for (let i = 0; i < l && at + i < d.length; i++) { lp += tone * (white() - lp); d[at + i] += lp * a * Math.exp(-6 * i / l) }
    }
  }

  function build(id) {
    const g = ctx.createGain()
    g.gain.value = 0
    g.connect(master)
    let src, chain
    const loop = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s }
    const filter = (type, f, q) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x }
    const lfo = (rate, depth, param, base) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = rate; og.gain.value = depth; o.connect(og).connect(param); param.value = base; o.start(); return o }

    if (id === 'rain') {
      src = loop(noiseBuffer(9, (d, rate) => { pinkFill(d); for (let i = 0; i < d.length; i++) d[i] *= 0.6; sprinkle(d, rate, 220, 0.012, 0.9, 0.6) }))
      chain = [filter('highpass', 500), filter('lowpass', 9000)]
    } else if (id === 'waves') {
      src = loop(noiseBuffer(10, (d) => pinkFill(d)))
      const lp = filter('lowpass', 900), amp = ctx.createGain()
      lfo(0.09, 0.45, amp.gain, 0.55); lfo(0.07, 500, lp.frequency, 900)
      chain = [lp, amp]
    } else if (id === 'wind') {
      src = loop(noiseBuffer(10, (d) => brownFill(d)))
      const bp = filter('bandpass', 500, 0.8), amp = ctx.createGain()
      lfo(0.05, 300, bp.frequency, 520); lfo(0.11, 0.35, amp.gain, 0.65)
      chain = [bp, amp]
    } else if (id === 'fire') {
      src = loop(noiseBuffer(8, (d, rate) => { brownFill(d); for (let i = 0; i < d.length; i++) d[i] *= 0.5; sprinkle(d, rate, 14, 0.02, 1.4, 0.9); sprinkle(d, rate, 4, 0.06, 0.8, 0.3) }))
      chain = [filter('lowpass', 5000)]
    } else if (id === 'fan') {
      src = loop(noiseBuffer(8, (d) => brownFill(d)))
      const lp = filter('lowpass', 650), amp = ctx.createGain()
      lfo(6.5, 0.06, amp.gain, 0.94)
      chain = [lp, amp]
    } else if (id === 'train') {
      src = loop(noiseBuffer(8, (d, rate) => {
        brownFill(d)
        for (let i = 0; i < d.length; i++) d[i] *= 0.7
        // Clack-clack of wheels over rail joints, twice per carriage length.
        for (let t = 0.3; t < 8; t += 1.1) [0, 0.16].forEach((off) => {
          const at = Math.floor((t + off) * rate), l = Math.floor(rate * 0.09)
          for (let i = 0; i < l && at + i < d.length; i++) d[at + i] += Math.sin(i / rate * 2 * Math.PI * 70) * Math.exp(-8 * i / l) * 0.9 + white() * 0.25 * Math.exp(-10 * i / l)
        })
      }))
      chain = [filter('lowpass', 1400)]
    } else {
      src = loop(noiseBuffer(8, (d) => brownFill(d)))
      chain = [filter('lowpass', 2500)]
    }
    let node = src
    chain.forEach((c) => { node.connect(c); node = c })
    node.connect(g)
    src.start()
    return { gain: g }
  }

  function setLevel(id, v) {
    levels[id] = v
    Kit.store.set('static-mix', levels)
    const card = document.querySelector('.sound[data-id="' + id + '"]')
    card.classList.toggle('is-on', v > 0)
    card.querySelector('.vol').textContent = v ? v + '%' : 'off'
    card.querySelector('input').value = v
    if (!ctx) return
    if (v > 0 && !channels[id]) channels[id] = build(id)
    // Squared curve: sliders feel even to the ear.
    if (channels[id]) channels[id].gain.gain.setTargetAtTime(Math.pow(v / 100, 2) * 0.9, ctx.currentTime, 0.15)
  }

  function ensureAudio() {
    if (ctx) return
    ctx = Kit.audio()
    master = ctx.createGain()
    master.gain.value = 0
    const comp = ctx.createDynamicsCompressor() // keeps a loud mix from clipping
    master.connect(comp).connect(ctx.destination)
    SOUNDS.forEach((s) => setLevel(s.id, levels[s.id] || 0))
  }
  function setPlaying(on) {
    ensureAudio()
    playing = on
    $('play').setAttribute('aria-pressed', String(on))
    $('play').setAttribute('aria-label', on ? 'Pause' : 'Play')
    const target = on ? Math.pow($('master').value / 100, 1.5) : 0
    master.gain.setTargetAtTime(target, ctx.currentTime, on ? 0.3 : 0.1)
    if (on) ctx.resume(); else setTimeout(() => { if (!playing) ctx.suspend() }, 600)
    $('state').textContent = on ? 'Playing.' : 'Paused.'
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Static', artist: 'Department of One' })
      navigator.mediaSession.playbackState = on ? 'playing' : 'paused'
    }
    armSleep()
  }
  function armSleep() {
    clearTimeout(sleepTimer)
    const mins = +$('sleep').value
    if (!playing || !mins) return
    $('state').textContent = 'Playing. Fading out in ' + mins + ' min.'
    sleepTimer = setTimeout(() => {
      master.gain.setTargetAtTime(0, ctx.currentTime, 10) // about a 30 s fade
      setTimeout(() => { setPlaying(false); $('sleep').value = '0'; $('state').textContent = 'Sleep timer finished. Good night.' }, 32000)
    }, mins * 60000)
  }

  // ---------- UI ----------
  const box = $('sounds')
  SOUNDS.forEach((s) => {
    const card = document.createElement('div')
    card.className = 'sound'
    card.dataset.id = s.id
    card.innerHTML = '<div class="top"><span class="tile ' + s.tile + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICON[s.id] + '</svg></span><b></b><span class="vol"></span></div><input class="k-range" type="range" min="0" max="100" />'
    card.querySelector('b').textContent = s.name
    const range = card.querySelector('input')
    range.setAttribute('aria-label', s.name + ' volume')
    range.addEventListener('input', () => {
      if (!playing && +range.value > 0) setPlaying(true)
      setLevel(s.id, +range.value)
    })
    box.appendChild(card)
  })
  SOUNDS.forEach((s) => setLevel(s.id, levels[s.id] || 0))
  PRESETS.forEach((p) => {
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'chip'; b.textContent = p.name
    b.addEventListener('click', () => { SOUNDS.forEach((s) => setLevel(s.id, p.mix[s.id] || 0)); if (!playing) setPlaying(true) })
    $('presets').appendChild(b)
  })
  $('play').addEventListener('click', () => setPlaying(!playing))
  $('master').addEventListener('input', () => { if (ctx && playing) master.gain.setTargetAtTime(Math.pow($('master').value / 100, 1.5), ctx.currentTime, 0.1) })
  $('sleep').addEventListener('change', armSleep)
  $('shareBtn').addEventListener('click', () => Kit.copy(location.origin + location.pathname + '#mix=' + mixString(), 'Link to this mix copied'))
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => setPlaying(true))
    navigator.mediaSession.setActionHandler('pause', () => setPlaying(false))
  }
  document.addEventListener('keydown', (e) => { if (e.code === 'Space' && !e.target.closest('input, select, textarea, button')) { e.preventDefault(); setPlaying(!playing) } })
})()
