// Site behaviour: smooth scrolling, scroll reveals, the hero console, pointer effects, the process
// line, the FitLog carousel and the mobile menu. Everything degrades to a complete static page: no
// element depends on this file to become visible.
;(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

  // ---------- Links from the one-page era (/#inquiry, /#work ...) land on the right page ----------
  ;(function oldAnchors() {
    const moved = { inquiry: '/contact', work: '/work', fitlog: '/work#fitlog', process: '/process', about: '/about' }
    const id = window.location.hash.slice(1)
    if (id && moved[id] && !document.getElementById(id)) window.location.replace(moved[id] + window.location.search)
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
    // Everything else is already on screen: drop the stagger so hover effects never wait on it.
    els.filter((el) => !pending.includes(el)).forEach((el) => el.style.setProperty('--d', '0s'))
    pending.forEach((el) => el.classList.add('is-pending'))

    const show = (el) => {
      el.classList.remove('is-pending')
      setTimeout(() => el.style.setProperty('--d', '0s'), 1400)
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          show(entry.target)
          io.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    pending.forEach((el) => io.observe(el))
    // Anything still held back after a jump (anchor link, restored scroll) shows up anyway.
    window.addEventListener('load', () => setTimeout(() => pending.forEach((el) => {
      if (el.getBoundingClientRect().bottom < 0) show(el)
    }), 300))
  })()

  // ---------- Panels: a spotlight follows the pointer ----------
  if (finePointer) {
    document.querySelectorAll('[data-spot]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', e.clientX - r.left + 'px')
        el.style.setProperty('--my', e.clientY - r.top + 'px')
      })
    })
  }

  // ---------- Device stages: layers drift a little with the pointer, by depth ----------
  document.querySelectorAll('[data-depth]').forEach((el) => el.style.setProperty('--d', el.dataset.depth))
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-stage], #scenes').forEach((stage) => {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect()
        stage.style.setProperty('--px', (((e.clientX - r.left) / r.width - 0.5) * -2).toFixed(3))
        stage.style.setProperty('--py', (((e.clientY - r.top) / r.height - 0.5) * -2).toFixed(3))
      })
      stage.addEventListener('pointerleave', () => {
        stage.style.setProperty('--px', '0')
        stage.style.setProperty('--py', '0')
      })
    })
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

  // ---------- Process: the line fills as the steps scroll past ----------
  ;(function process() {
    const steps = document.getElementById('steps')
    if (!steps) return
    let queued = false
    const update = () => {
      queued = false
      const r = steps.getBoundingClientRect()
      steps.style.setProperty('--p', clamp((window.innerHeight * 0.62 - r.top) / r.height, 0, 1).toFixed(3))
    }
    update()
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update) } }, { passive: true })
    window.addEventListener('resize', update)
  })()

  // ---------- Hero console: a command is typed, the thing it makes appears ----------
  ;(function consoleDemo() {
    const box = document.getElementById('console')
    if (!box) return
    const typed = document.getElementById('typed')
    const result = document.getElementById('result')
    const scenes = Array.from(box.querySelectorAll('.scene'))
    const tabs = Array.from(box.querySelectorAll('[role="tab"]'))
    const data = [
      { cmd: 'new website --for "a sauna club"', res: '7 pages, online booking, Lighthouse 99' },
      { cmd: 'new app --for "a hair salon"', res: 'iPhone and Android from one codebase' },
      { cmd: 'new bot --for "a community"', res: 'Discord and Telegram, from the same code' },
    ]
    let cur = 0
    let auto = !reduceMotion
    let timer = null
    let onscreen = true
    // The rotation would talk over a screen reader, so it only announces once the visitor picks a tab.
    result.setAttribute('aria-live', 'off')

    const resultHtml = (d) => '<span class="ok">&#10003;</span> ' + d.res
    const clear = () => { clearTimeout(timer); timer = null }

    function select(i) {
      cur = i
      scenes.forEach((s, k) => s.classList.toggle('is-on', k === i))
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === i))
        t.tabIndex = k === i ? 0 : -1
      })
    }

    function typeIn(i, animate) {
      clear()
      select(i)
      const d = data[i]
      if (!animate || reduceMotion) {
        typed.textContent = d.cmd
        result.innerHTML = resultHtml(d)
        result.classList.remove('is-off')
        return
      }
      result.classList.add('is-off')
      typed.textContent = ''
      let n = 0
      const step = () => {
        n++
        typed.textContent = d.cmd.slice(0, n)
        if (n < d.cmd.length) {
          timer = setTimeout(step, 26 + Math.random() * 34)
        } else {
          result.innerHTML = resultHtml(d)
          result.classList.remove('is-off')
          queueNext()
        }
      }
      timer = setTimeout(step, 220)
    }

    function queueNext() {
      if (!auto) return
      timer = setTimeout(function next() {
        if (!onscreen || document.hidden) { timer = setTimeout(next, 800); return }
        typeIn((cur + 1) % data.length, true)
      }, 4600)
    }

    function pick(i, focus) {
      auto = false
      result.setAttribute('aria-live', 'polite')
      typeIn(i, true)
      if (focus) tabs[i].focus()
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pick(i, false))
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); pick((i + 1) % tabs.length, true) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); pick((i + tabs.length - 1) % tabs.length, true) }
        if (e.key === 'Home') { e.preventDefault(); pick(0, true) }
        if (e.key === 'End') { e.preventDefault(); pick(tabs.length - 1, true) }
      })
    })
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { onscreen = entries[0].isIntersecting }).observe(box)
    }
    queueNext()
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
      ;[0, 1, -1, 2].forEach((k) => cards[(index + k + n) % n].querySelectorAll('img').forEach((img) => { img.loading = 'eager' }))
    }

    // ---- autoplay: only when motion is allowed, never after the visitor takes over
    let autoplay = !reduceMotion
    let lastTouch = 0
    let hovered = false
    let onscreen = false
    function tick() {
      // turns every 5 s; waits 8 s after the visitor last handled it
      if (autoplay && !hovered && onscreen && !document.hidden && performance.now() - lastTouch > 8000) go(index + 1)
    }
    function setAutoplay(on) {
      autoplay = on
      pauseBtn.setAttribute('aria-pressed', String(!on))
      pauseBtn.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow')
    }
    pauseBtn.hidden = reduceMotion
    setAutoplay(autoplay)
    setInterval(tick, 5000)
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
    let startX = 0, dx = 0, dragging = false, pointerId = null, lastX = 0, lastT = 0, vel = 0
    const cardWidth = () => cards[0].offsetWidth || 260
    stack.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      pointerId = e.pointerId
      startX = lastX = e.clientX
      lastT = performance.now()
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
      layout(index - dx / (cardWidth() * SPREAD))
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
