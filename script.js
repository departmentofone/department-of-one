// Site behaviour: theme toggle, smooth scrolling, scroll reveals, the FitLog carousel, the hero
// lamp. Everything degrades to a complete static page: no element depends
// on this file to become visible.
;(function () {
  const root = document.documentElement
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  // ---------- Theme: system → light → dark → system, persisted per browser ----------
  // Mirrors the token structure in style.css: no attribute = system, data-theme="light"/"dark" = forced.
  ;(function theme() {
    const toggle = document.getElementById('themeToggle')
    const sun = document.getElementById('iconSun')
    const moon = document.getElementById('iconMoon')
    if (!toggle) return
    const KEY = 'theme'

    function showIcon() {
      const forced = root.getAttribute('data-theme')
      const isDark = forced === 'dark' || (forced !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      sun.style.display = isDark ? 'none' : 'block'
      moon.style.display = isDark ? 'block' : 'none'
    }

    function apply(mode) {
      if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode)
      else root.removeAttribute('data-theme')
      showIcon()
    }

    let stored = null
    try {
      stored = localStorage.getItem(KEY)
    } catch {
      // Private browsing / blocked storage: falls back to system each load, still works fine.
    }
    // With no saved choice, leave the root alone: a host page (or the OS) may already have set it.
    if (stored) apply(stored)
    else showIcon()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', showIcon)

    toggle.addEventListener('click', () => {
      const current = stored ?? 'system'
      const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system'
      stored = next === 'system' ? null : next
      try {
        if (stored) localStorage.setItem(KEY, stored)
        else localStorage.removeItem(KEY)
      } catch {
        // Nothing to persist to: the toggle still works for the rest of this visit.
      }
      apply(stored)
    })
  })()

  // ---------- Smooth, weighted scrolling (Lenis), skipped under reduced motion ----------
  if (!reduceMotion && window.Lenis) {
    const lenis = new window.Lenis({
      duration: 1.35,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      anchors: { offset: -88 },
    })
    const raf = (time) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }

  // ---------- Header gains its frosted band once the page moves ----------
  const header = document.querySelector('header.site')
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12)
      // the window light belongs to the hero; let it fade as the hero leaves
      root.style.setProperty('--sun-fade', Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9)).toFixed(3))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  // ---------- Scroll reveals ----------
  // Only elements that start below the fold are held back, so the first screen is always complete.
  ;(function reveals() {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (!('IntersectionObserver' in window)) return

    const groups = new Map()
    els.forEach((el) => {
      const parent = el.parentElement
      const i = groups.get(parent) || 0
      groups.set(parent, i + 1)
      el.style.setProperty('--d', Math.min(i, 5) * 0.09 + 's')
    })

    const fold = window.innerHeight * 0.92
    const pending = els.filter((el) => el.getBoundingClientRect().top > fold)
    pending.forEach((el) => el.classList.add('is-pending'))

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.remove('is-pending')
          io.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    pending.forEach((el) => io.observe(el))
    // Anything still held back after a jump (anchor link, restored scroll) shows up anyway.
    window.addEventListener('load', () => setTimeout(() => pending.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.bottom < 0) el.classList.remove('is-pending')
    }), 300))
  })()

  // ---------- Hero lamp follows the pointer, with some weight ----------
  // --mx/--my are percentages of the hero box. The lamp rests on the centre of the carousel and,
  // with a fine pointer and motion allowed, drifts after the pointer and back again on leave.
  const hero = document.querySelector('.hero')
  const stack = document.getElementById('stack')
  if (hero && stack) {
    let rx = 70, ry = 40, tx = rx, ty = ry, x = rx, y = ry, running = false
    const put = () => {
      hero.style.setProperty('--mx', x.toFixed(2) + '%')
      hero.style.setProperty('--my', y.toFixed(2) + '%')
    }
    const rest = () => {
      const h = hero.getBoundingClientRect(), c = stack.getBoundingClientRect()
      if (!h.width || !h.height) return
      rx = ((c.left + c.width / 2 - h.left) / h.width) * 100
      ry = ((c.top + c.height / 2 - h.top) / h.height) * 100
    }
    const step = () => {
      x += (tx - x) * 0.06
      y += (ty - y) * 0.06
      put()
      if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) requestAnimationFrame(step)
      else running = false
    }
    const glide = () => { if (!running) { running = true; requestAnimationFrame(step) } }
    const settle = () => { rest(); tx = x = rx; ty = y = ry; put() }
    settle()
    window.addEventListener('resize', settle)
    window.addEventListener('load', settle)
    // The carousel rises into place on load; measure again once it has landed.
    document.getElementById('showcase')?.addEventListener('animationend', settle)
    if (finePointer && !reduceMotion) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect()
        tx = ((e.clientX - r.left) / r.width) * 100
        ty = ((e.clientY - r.top) / r.height) * 100
        glide()
      })
      hero.addEventListener('pointerleave', () => { rest(); tx = rx; ty = ry; glide() })
    }
  }

  // ---------- Mobile menu ----------
  ;(function menu() {
    const btn = document.getElementById('menuToggle')
    const panel = document.getElementById('menuPanel')
    if (!btn || !panel) return
    const set = (open) => {
      panel.hidden = !open
      btn.setAttribute('aria-expanded', String(open))
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu')
    }
    btn.addEventListener('click', () => set(panel.hidden))
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false) })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus() } })
    document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) set(false) })
  })()

  // ---------- FitLog carousel ----------
  // One screen at the front, its neighbours set back on either side. It follows a finger or the
  // mouse while dragged, steps on the mouse wheel, arrow keys, the dots, the arrow buttons or a
  // click on a neighbour. It only turns by itself when motion is allowed, and stops for good
  // once the visitor takes over.
  ;(function carousel() {
    const show = document.getElementById('showcase')
    const stack = document.getElementById('stack')
    if (!show || !stack) return
    const cards = Array.from(stack.querySelectorAll('.card'))
    const dots = Array.from(show.querySelectorAll('.dot'))
    const noEl = document.getElementById('slideNo')
    const titleSpans = Array.from(show.querySelectorAll('#slideTitle .t'))
    const pauseBtn = document.getElementById('pauseBtn')
    const hint = document.getElementById('stackHint')
    const titles = [
      "Yesterday's session, 20,500 kg in 45 minutes",
      'The week so far, in training and food',
      "Today's meals, macros and water",
      'A calorie goal with micronutrients below it',
      'Diets and meal plans other people shared',
      'Fasting windows from 16:8 to one meal a day',
    ]
    const n = cards.length
    const SPREAD = 0.62 // a neighbour sits this many card widths from the centre
    let index = 0

    const wrap = (p) => ((((p + n / 2) % n) + n) % n) - n / 2

    // Place every card for a (possibly fractional) front position.
    function layout(pos) {
      cards.forEach((card, i) => {
        const p = wrap(i - pos)
        const a = Math.abs(p)
        const sign = Math.sign(p)
        let x, scale, dim, opacity
        if (a <= 1) {
          x = p * SPREAD * 100
          scale = 1 - 0.18 * a
          dim = 0.42 * a
          opacity = 1
        } else {
          const t = Math.min(a - 1, 1)
          x = sign * (SPREAD + 0.3 * t) * 100
          scale = 0.82 - 0.1 * t
          dim = 0.42 + 0.4 * t
          opacity = 1 - t
        }
        card.style.transform = `translate3d(${x.toFixed(2)}%, 0, 0) scale(${scale.toFixed(4)})`
        card.style.opacity = opacity.toFixed(3)
        card.style.setProperty('--dim', dim.toFixed(3))
        card.style.zIndex = String(10 - Math.round(a * 3))
        card.setAttribute('aria-hidden', a < 0.5 ? 'false' : 'true')
      })
    }

    let titleOn = 0
    function go(next) {
      index = ((next % n) + n) % n
      layout(index)
      dots.forEach((d, i) => {
        if (i === index) d.setAttribute('aria-current', 'true')
        else d.removeAttribute('aria-current')
      })
      noEl.textContent = String(index + 1)
      const incoming = titleSpans[1 - titleOn]
      if (incoming.textContent !== titles[index] || !incoming.classList.contains('on')) {
        incoming.textContent = titles[index]
        titleSpans[titleOn].classList.remove('on')
        titleSpans[titleOn].setAttribute('aria-hidden', 'true')
        incoming.classList.add('on')
        incoming.removeAttribute('aria-hidden')
        titleOn = 1 - titleOn
      }
      // warm the next screens so a drag never lands on an empty card
      ;[1, -1, 2].forEach((k) => cards[(index + k + n) % n].querySelectorAll('img').forEach((img) => { img.loading = 'eager' }))
    }

    // ---- autoplay: only when motion is allowed, never after the visitor takes over
    let autoplay = true
    let lastTouch = 0
    let hovered = false
    let onscreen = true
    let timer = null
    function tick() {
      // turns every 5 s; waits 8 s after the visitor last handled it
      if (autoplay && !hovered && onscreen && !document.hidden && performance.now() - lastTouch > 8000) go(index + 1)
    }
    function setAutoplay(on) {
      autoplay = on
      pauseBtn.setAttribute('aria-pressed', String(!on))
      pauseBtn.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow')
    }
    pauseBtn.hidden = false
    setAutoplay(true)
    timer = setInterval(tick, 5000)
    pauseBtn.addEventListener('click', () => setAutoplay(!autoplay))
    function takeOver() {
      lastTouch = performance.now()
      hint.classList.add('is-gone')
    }
    show.addEventListener('pointerenter', () => { hovered = true })
    show.addEventListener('pointerleave', () => { hovered = false })
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { onscreen = entries[0].isIntersecting }).observe(show)
    }

    // ---- drag (mouse and touch share pointer events)
    let startX = 0, startT = 0, dx = 0, dragging = false, pointerId = null, lastX = 0, lastT = 0, vel = 0
    const cardWidth = () => cards[0].offsetWidth || 260
    stack.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      pointerId = e.pointerId
      startX = lastX = e.clientX
      startT = lastT = performance.now()
      dx = 0; vel = 0; dragging = false
    })
    stack.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId) return
      dx = e.clientX - startX
      if (!dragging && Math.abs(dx) > 5) {
        dragging = true
        stack.classList.add('is-dragging')
        stack.setPointerCapture(pointerId)
        takeOver()
      }
      if (!dragging) return
      const now = performance.now()
      vel = (e.clientX - lastX) / Math.max(now - lastT, 1)
      lastX = e.clientX; lastT = now
      const pos = index - dx / (cardWidth() * SPREAD)
      layout(pos)
    })
    function endDrag(e) {
      if (e.pointerId !== pointerId) return
      pointerId = null
      if (!dragging) {
        // a plain click: bring a neighbour to the front
        const card = e.target.closest && e.target.closest('.card')
        if (card) {
          const p = wrap(cards.indexOf(card) - index)
          if (p !== 0) { takeOver(); go(index + p) }
        }
        return
      }
      dragging = false
      stack.classList.remove('is-dragging')
      let steps = Math.round(-dx / (cardWidth() * SPREAD))
      if (steps === 0 && Math.abs(vel) > 0.35) steps = vel < 0 ? 1 : -1
      go(index + steps)
    }
    stack.addEventListener('pointerup', endDrag)
    stack.addEventListener('pointercancel', endDrag)

    // ---- mouse wheel / trackpad while the pointer is over the carousel
    let wheelAcc = 0, wheelLock = false, wheelIdle = null
    stack.addEventListener('wheel', (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      e.preventDefault()
      wheelAcc += d
      clearTimeout(wheelIdle)
      wheelIdle = setTimeout(() => { wheelAcc = 0 }, 180)
      if (wheelLock || Math.abs(wheelAcc) < 40) return
      takeOver()
      go(index + (wheelAcc > 0 ? 1 : -1))
      wheelAcc = 0
      wheelLock = true
      setTimeout(() => { wheelLock = false }, 420)
    }, { passive: false })

    // ---- keys, dots, arrows
    stack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); takeOver(); go(index + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); takeOver(); go(index - 1) }
    })
    dots.forEach((d, i) => d.addEventListener('click', () => { takeOver(); go(i) }))
    document.getElementById('prevBtn').addEventListener('click', () => { takeOver(); go(index - 1) })
    document.getElementById('nextBtn').addEventListener('click', () => { takeOver(); go(index + 1) })

    go(0)
  })()
})()
