// Site behaviour: header state, shelf search and filters, and the detail sheet. Everything works
// without this file except filtering and the sheet; the cards and links are plain HTML.
;(function () {
  // ---------- Header picks up a frosted band once the page scrolls ----------
  const header = document.querySelector('header.site')
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  // ---------- Shelf: search box and filter chips ----------
  const grid = document.getElementById('grid')
  if (grid) {
    const cards = Array.from(grid.querySelectorAll('.card'))
    const chips = Array.from(document.querySelectorAll('.chip'))
    const q = document.getElementById('q')
    const empty = document.getElementById('empty')
    let filter = 'all'

    // The entrance stagger is for first paint only; drop it so filtering doesn't replay it.
    setTimeout(() => grid.classList.remove('stagger'), 1200)

    function apply() {
      const term = q.value.trim().toLowerCase()
      let shown = 0
      cards.forEach((c) => {
        const okFilter = filter === 'all' || (filter === 'live' ? c.dataset.status === 'live' : c.dataset.kind === filter)
        const ok = okFilter && (!term || c.dataset.search.includes(term))
        c.hidden = !ok
        if (ok) shown++
      })
      empty.hidden = shown > 0
    }
    chips.forEach((chip) => chip.addEventListener('click', () => {
      filter = chip.dataset.filter
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)))
      apply()
    }))
    q.addEventListener('input', apply)
    // "/" jumps to search, like most app stores and docs sites.
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== q && !e.target.closest('input, textarea, [contenteditable]')) {
        e.preventDefault()
        q.focus()
      }
    })
  }

  // ---------- Detail sheet ----------
  const sheet = document.getElementById('sheet')
  if (sheet && typeof sheet.showModal === 'function') {
    const $ = (id) => document.getElementById(id)
    function open(slug, opener) {
      const tpl = document.getElementById('d-' + slug)
      if (!tpl) return
      const frag = tpl.content
      $('sheetTile').replaceChildren(...frag.querySelector('[data-part="tile"]').cloneNode(true).childNodes)
      $('sheetTitle').textContent = tpl.dataset.name
      $('sheetKind').textContent = tpl.dataset.kind + ' · Free'
      $('sheetAbout').textContent = frag.querySelector('[data-part="about"]').textContent
      $('sheetPoints').replaceChildren(...frag.querySelector('[data-part="points"]').cloneNode(true).childNodes)
      $('sheetActions').replaceChildren(...frag.querySelector('[data-part="actions"]').cloneNode(true).childNodes)
      sheet.returnTo = opener
      sheet.showModal()
      history.replaceState(null, '', '#' + slug)
    }
    function close() {
      sheet.close()
    }
    sheet.addEventListener('close', () => {
      history.replaceState(null, '', window.location.pathname + window.location.search)
      if (sheet.returnTo) sheet.returnTo.focus()
    })
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open]')
      if (btn) open(btn.dataset.open, btn)
    })
    $('sheetClose').addEventListener('click', close)
    // A click on the dimmed backdrop (the dialog element itself, outside its content) closes it.
    sheet.addEventListener('click', (e) => { if (e.target === sheet) close() })
    // Links like /#shan-shui open that item's sheet straight away.
    const slug = window.location.hash.slice(1)
    if (slug && document.getElementById('d-' + slug)) open(slug, document.querySelector('[data-open="' + slug + '"]'))
  }
})()
