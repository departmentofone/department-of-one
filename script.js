// Site behaviour: theme toggle, smooth scrolling, scroll reveals, the FitLog slideshow, the hero
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
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12)
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
  const hero = document.querySelector('.hero')
  if (hero && finePointer && !reduceMotion) {
    let tx = 70, ty = 40, x = tx, y = ty, running = false
    const step = () => {
      x += (tx - x) * 0.06
      y += (ty - y) * 0.06
      hero.style.setProperty('--mx', x.toFixed(2) + '%')
      hero.style.setProperty('--my', y.toFixed(2) + '%')
      if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05) requestAnimationFrame(step)
      else running = false
    }
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width) * 100
      ty = ((e.clientY - r.top) / r.height) * 100
      if (!running) { running = true; requestAnimationFrame(step) }
    })
  }

  // ---------- FitLog slideshow ----------
  ;(function slideshow() {
    const show = document.getElementById('showcase')
    if (!show) return
    const slides = Array.from(show.querySelectorAll('.slide'))
    const ticks = Array.from(show.querySelectorAll('.tick'))
    const titleEl = document.getElementById('slideTitle')
    const noEl = document.getElementById('slideNo')
    const pauseBtn = document.getElementById('pauseBtn')
    const titles = [
      "Yesterday's session, 20,500 kg in 45 minutes",
      'The week so far, in training and food',
      "Today's meals, macros and water",
      'A calorie goal with micronutrients below it',
      'Diets and meal plans other people shared',
      'Fasting windows from 16:8 to one meal a day',
    ]
    const DURATION = 5200
    let index = 0
    let elapsed = 0
    let last = null
    let userPaused = false
    let hovered = false
    let visible = true

    function paused() {
      return userPaused || hovered || !visible || document.hidden
    }

    function go(next) {
      next = (next + slides.length) % slides.length
      if (next === index) return
      const prev = index
      index = next
      elapsed = 0
      slides[prev].classList.remove('is-active')
      slides[next].loading = 'eager'
      slides[next].classList.add('is-active')
      const after = slides[(next + 1) % slides.length]
      if (after) after.loading = 'eager'
      ticks.forEach((t, i) => {
        t.classList.toggle('is-active', i === next)
        t.classList.toggle('is-done', i < next)
        if (i === next) t.setAttribute('aria-current', 'true')
        else t.removeAttribute('aria-current')
        t.querySelector('i').style.setProperty('--p', i < next ? 1 : 0)
      })
      titleEl.classList.add('is-changing')
      setTimeout(() => {
        titleEl.textContent = titles[next]
        noEl.textContent = String(next + 1)
        titleEl.classList.remove('is-changing')
      }, 380)
    }

    function frame(now) {
      if (last === null) last = now
      const dt = now - last
      last = now
      if (!paused()) {
        elapsed += dt
        const p = Math.min(elapsed / DURATION, 1)
        ticks[index].querySelector('i').style.setProperty('--p', p.toFixed(4))
        if (elapsed >= DURATION) go(index + 1)
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

    ticks.forEach((t, i) => t.addEventListener('click', () => go(i)))
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused
      pauseBtn.setAttribute('aria-pressed', String(userPaused))
      pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow')
    })
    pauseBtn.setAttribute('aria-pressed', 'false')

    const device = show.querySelector('.device')
    device.addEventListener('pointerenter', () => { hovered = true })
    device.addEventListener('pointerleave', () => { hovered = false })
    show.addEventListener('focusin', () => { hovered = true })
    show.addEventListener('focusout', () => { hovered = false })

    // Swipe on touch screens.
    let startX = null
    device.addEventListener('pointerdown', (e) => { startX = e.clientX })
    device.addEventListener('pointerup', (e) => {
      if (startX === null) return
      const dx = e.clientX - startX
      startX = null
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
    })

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting }).observe(show)
    }
  })()
})()
