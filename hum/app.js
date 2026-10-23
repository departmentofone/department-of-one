// Hum: pitch detection with the YIN algorithm on microphone input, turned into notes by grouping
// steady stretches of the same semitone. Audio is analysed in the page and never uploaded.
;(function () {
  const $ = (id) => document.getElementById(id)
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const noteName = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1)

  let stream = null, ctx = null, analyser = null, timer = 0, recording = false
  let notes = [] // { midi, start, dur } in seconds
  let current = null, t0 = 0, lastPitchAt = 0
  const buf = new Float32Array(2048)

  // ---------- YIN ----------
  function yin(data, rate) {
    const size = 1024, maxTau = Math.min(size - 1, Math.floor(rate / 70)), minTau = Math.floor(rate / 1100)
    let rms = 0
    for (let i = 0; i < size; i++) rms += data[i] * data[i]
    rms = Math.sqrt(rms / size)
    if (rms < 0.012) return null // too quiet
    const d = new Float32Array(maxTau + 1)
    for (let tau = 1; tau <= maxTau; tau++) {
      let s = 0
      for (let i = 0; i < size; i++) { const x = data[i] - data[i + tau]; s += x * x }
      d[tau] = s
    }
    // cumulative mean normalised difference
    let running = 0
    d[0] = 1
    for (let tau = 1; tau <= maxTau; tau++) { running += d[tau]; d[tau] = d[tau] * tau / (running || 1) }
    let tau = -1
    for (let t = minTau; t <= maxTau; t++) {
      if (d[t] < 0.12) { while (t + 1 <= maxTau && d[t + 1] < d[t]) t++; tau = t; break }
    }
    if (tau < 0) return null
    // parabolic interpolation for sub-sample accuracy
    const a = d[tau - 1] || d[tau], b = d[tau], c = d[tau + 1] || d[tau]
    const shift = (a - c) / (2 * (a - 2 * b + c) || 1)
    return { freq: rate / (tau + (Number.isFinite(shift) ? shift : 0)), clarity: 1 - b }
  }

  // ---------- recording ----------
  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
    } catch (e) {
      $('msg').textContent = e.name === 'NotAllowedError' ? 'Microphone access was blocked. Allow it in your browser\'s address bar and try again.' : 'No microphone found.'
      return
    }
    ctx = Kit.audio()
    const src = ctx.createMediaStreamSource(stream)
    analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    src.connect(analyser)
    notes = []; current = null
    recording = true
    t0 = ctx.currentTime
    $('rec').setAttribute('aria-pressed', 'true'); $('rec').setAttribute('aria-label', 'Stop recording')
    $('msg').textContent = 'Listening… press again to stop.'
    timer = setInterval(listen, 25)
  }
  function stop() {
    recording = false
    clearInterval(timer)
    closeNote(ctx.currentTime - t0)
    stream.getTracks().forEach((t) => t.stop())
    $('rec').setAttribute('aria-pressed', 'false'); $('rec').setAttribute('aria-label', 'Start recording')
    $('note').textContent = '--'
    notes = notes.filter((n) => n.dur >= 0.08)
    $('msg').textContent = notes.length ? 'Got ' + notes.length + ' notes. Play them back or save them.' : 'Didn\'t catch any notes. Try a longer, steadier hum.'
    $('playBtn').disabled = $('midiBtn').disabled = !notes.length
    draw()
  }
  function closeNote(at) {
    if (current) { current.dur = at - current.start; if (current.dur >= 0.08) notes.push(current); current = null }
  }
  function listen() {
    analyser.getFloatTimeDomainData(buf)
    const now = ctx.currentTime - t0
    const p = yin(buf, ctx.sampleRate)
    if (p && p.clarity > 0.85 && p.freq > 70 && p.freq < 1100) {
      const exact = 69 + 12 * Math.log2(p.freq / 440)
      const midi = Math.round(exact)
      $('note').innerHTML = NAMES[((midi % 12) + 12) % 12] + '<small>' + (Math.floor(midi / 12) - 1) + '</small>'
      $('needle').style.transform = 'translateX(' + Math.max(-150, Math.min(150, (exact - midi) * 300)) + 'px)'
      lastPitchAt = now
      // Hysteresis: only change notes when clearly past the halfway point to the next semitone.
      if (!current) current = { midi, start: now, sum: exact, n: 1 }
      else if (Math.abs(exact - current.midi) > 0.65) { closeNote(now); current = { midi, start: now, sum: exact, n: 1 } }
      else { current.sum += exact; current.n++ }
    } else if (current && now - lastPitchAt > 0.09) {
      closeNote(lastPitchAt)
    }
    if (now > 120) stop() // two minutes is plenty
    draw()
  }

  // ---------- drawing ----------
  const canvas = $('roll'), g = canvas.getContext('2d')
  function shown() {
    const tr = +$('transpose').value
    let list = notes.map((n) => ({ ...n, midi: n.midi + tr }))
    if ($('snap').checked && list.length > 1) {
      // Snap starts and lengths to a 1/8 grid of the median note length.
      const med = list.map((n) => n.dur).sort((a, b) => a - b)[Math.floor(list.length / 2)]
      const grid = Math.max(0.1, med / 2)
      list = list.map((n) => ({ ...n, start: Math.round(n.start / grid) * grid, dur: Math.max(grid, Math.round(n.dur / grid) * grid) }))
    }
    return list
  }
  function draw() {
    const W = canvas.width, H = canvas.height
    g.clearRect(0, 0, W, H)
    const list = recording ? notes.concat(current ? [{ midi: current.midi, start: current.start, dur: ctx.currentTime - t0 - current.start }] : []) : shown()
    if (!list.length) {
      g.fillStyle = '#8f8b82'; g.font = '28px Geist, sans-serif'; g.textAlign = 'center'
      g.fillText(recording ? 'Listening…' : 'Your melody will appear here', W / 2, H / 2)
      $('notesTxt').textContent = ''
      return
    }
    const lo = Math.min(...list.map((n) => n.midi)) - 2, hi = Math.max(...list.map((n) => n.midi)) + 2
    const end = Math.max(4, ...list.map((n) => n.start + n.dur))
    const rowH = H / (hi - lo + 1)
    for (let m = lo; m <= hi; m++) {
      const y = H - (m - lo + 1) * rowH
      g.fillStyle = [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12) ? '#f3efe6' : '#fbfaf7'
      g.fillRect(0, y, W, rowH)
      if (m % 12 === 0) { g.fillStyle = '#8f8b82'; g.font = '20px Geist Mono, monospace'; g.textAlign = 'left'; g.fillText(noteName(m), 8, y + rowH - 6) }
    }
    list.forEach((n) => {
      const x = (n.start / end) * (W - 70) + 60, w = Math.max(6, (n.dur / end) * (W - 70)), y = H - (n.midi - lo + 1) * rowH
      g.fillStyle = '#8b5cf6'
      g.beginPath(); g.roundRect ? g.roundRect(x, y + 2, w, rowH - 4, 6) : g.rect(x, y + 2, w, rowH - 4); g.fill()
    })
    if (!recording) $('notesTxt').textContent = list.map((n) => noteName(n.midi)).join(' ')
  }

  // ---------- playback ----------
  let playing = []
  function play() {
    const list = shown()
    if (!list.length) return
    const a = Kit.audio()
    playing.forEach((o) => { try { o.stop() } catch (e) {} })
    playing = []
    const base = a.currentTime + 0.1, first = list[0].start, voice = $('voice').value
    list.forEach((n) => {
      const f = 440 * Math.pow(2, (n.midi - 69) / 12), t = base + n.start - first, d = Math.max(0.12, n.dur)
      const o = a.createOscillator(), gn = a.createGain()
      o.type = voice === 'piano' ? 'triangle' : voice === 'saw' ? 'sawtooth' : voice
      o.frequency.value = f
      const peak = voice === 'square' || voice === 'saw' ? 0.08 : 0.22
      gn.gain.setValueAtTime(0, t)
      gn.gain.linearRampToValueAtTime(peak, t + 0.015)
      gn.gain.exponentialRampToValueAtTime(voice === 'piano' ? peak * 0.25 : peak * 0.8, t + d * 0.9)
      gn.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.15)
      o.connect(gn).connect(a.destination)
      o.start(t); o.stop(t + d + 0.2)
      playing.push(o)
    })
  }

  // ---------- MIDI export (format 0, 480 ticks per beat, 120 bpm) ----------
  function midiFile() {
    const list = shown(), TPB = 480, secToTick = (s) => Math.round(s * 2 * TPB)
    const events = []
    const first = list[0].start
    list.forEach((n) => {
      events.push({ t: secToTick(n.start - first), on: true, m: Math.min(127, Math.max(0, n.midi)) })
      events.push({ t: secToTick(n.start - first + n.dur), on: false, m: Math.min(127, Math.max(0, n.midi)) })
    })
    events.sort((a, b) => a.t - b.t || (a.on ? 1 : -1))
    const track = [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20] // tempo 500000 us/beat
    const vlq = (n) => { const out = [n & 0x7f]; while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80); return out }
    let last = 0
    events.forEach((e) => { track.push(...vlq(e.t - last), e.on ? 0x90 : 0x80, e.m, e.on ? 96 : 0); last = e.t })
    track.push(0x00, 0xff, 0x2f, 0x00)
    const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    const bytes = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (TPB >> 8) & 255, TPB & 255, 0x4d, 0x54, 0x72, 0x6b, ...u32(track.length), ...track]
    return new Blob([new Uint8Array(bytes)], { type: 'audio/midi' })
  }

  $('rec').addEventListener('click', () => (recording ? stop() : start()))
  $('playBtn').addEventListener('click', play)
  $('midiBtn').addEventListener('click', () => Kit.download(midiFile(), 'hum-' + new Date().toISOString().slice(0, 10) + '.mid'))
  $('transpose').addEventListener('input', () => { $('tv').textContent = (+$('transpose').value > 0 ? '+' : '') + $('transpose').value; draw() })
  $('snap').addEventListener('change', draw)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('msg').textContent = 'This browser can\'t use a microphone here.'; $('rec').disabled = true }
  draw()
})()
