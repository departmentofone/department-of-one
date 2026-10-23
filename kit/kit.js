// Small helpers shared by the tools. Exposed as window.Kit.
;(function () {
  let toastEl = null
  let toastTimer = null

  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div')
      toastEl.className = 'k-toast'
      toastEl.setAttribute('role', 'status')
      toastEl.setAttribute('aria-live', 'polite')
      document.body.appendChild(toastEl)
    }
    toastEl.textContent = text
    // Force a frame so the enter transition runs even when a toast is already showing.
    requestAnimationFrame(() => toastEl.classList.add('is-on'))
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 1800)
  }

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text)
      toast(label || 'Copied')
    } catch (e) {
      window.prompt('Copy this:', text)
    }
  }

  // localStorage that never throws (private mode, blocked storage).
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('doo:' + key)
        return v === null ? fallback : JSON.parse(v)
      } catch (e) {
        return fallback
      }
    },
    set(key, value) {
      try { localStorage.setItem('doo:' + key, JSON.stringify(value)) } catch (e) {}
    },
  }

  // Uniform random integer in [0, n) from the browser's crypto source.
  function randInt(n) {
    const max = Math.floor(0x100000000 / n) * n
    const buf = new Uint32Array(1)
    do { crypto.getRandomValues(buf) } while (buf[0] >= max)
    return buf[0] % n
  }

  function download(blob, name) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  function fmtBytes(n) {
    if (n < 1024) return n + ' B'
    if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB'
    return (n / 1024 / 1024).toFixed(2) + ' MB'
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Shared Web Audio context, created on first use (browsers require a user gesture).
  let audioCtx = null
  function audio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
  }
  // A soft two-note chime.
  function chime(freqs) {
    const ctx = audio()
    ;(freqs || [660, 880]).forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const t = ctx.currentTime + i * 0.18
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.18, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 1.3)
    })
  }

  window.Kit = { toast, copy, store, randInt, download, fmtBytes, reduceMotion, audio, chime }
})()
