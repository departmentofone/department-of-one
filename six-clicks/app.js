// Six Clicks: articles come from Wikipedia's public API (CORS with origin=*). The HTML is rebuilt
// through an allow-list: only text, a few layout tags, images from Wikimedia and links to other
// articles survive. Every other link becomes plain text, so the game can't be left by accident.
;(function () {
  const $ = (id) => document.getElementById(id)
  const API = 'https://en.wikipedia.org/w/api.php'
  const STARTS = ['Toaster', 'Banana', 'Bicycle', 'Penguin', 'Coffee', 'Lighthouse', 'Chess', 'Volcano', 'Umbrella', 'Pizza', 'Origami', 'Basketball', 'Honey', 'Tea', 'Rubber duck', 'Cactus', 'Sushi', 'Accordion', 'Kangaroo', 'Glacier', 'Saxophone', 'Lego', 'Avocado', 'Hedgehog', 'Croissant', 'Typewriter', 'Skateboarding', 'Octopus', 'Popcorn', 'Bagpipes', 'Snail', 'Sauna', 'Kite', 'Pumpkin', 'Yo-yo']
  const TARGETS = ['Napoleon', 'Albert Einstein', 'Ancient Rome', 'Mount Everest', 'Apollo 11', 'Leonardo da Vinci', 'William Shakespeare', 'Egyptian pyramids', 'Black hole', 'The Beatles', 'Great Wall of China', 'Wolfgang Amadeus Mozart', 'Charles Darwin', 'Titanic', 'Olympic Games', 'Jazz', 'Dinosaur', 'Internet', 'Vikings', 'Antarctica', 'Isaac Newton', 'Genghis Khan', 'Eiffel Tower', 'Marie Curie']
  const EPOCH = Date.UTC(2026, 9, 23) // puzzle #1

  let mode = 'daily', start = '', target = '', current = '', clicks = 0, path = [], t0 = 0, timerId = 0, done = false, loading = false

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
  const todayKey = () => new Date().toISOString().slice(0, 10)
  const puzzleNo = () => Math.floor((Date.now() - EPOCH) / 86400000) + 1
  function dailyPair() {
    const h = hash('six-clicks:' + todayKey())
    return [STARTS[h % STARTS.length], TARGETS[(h >>> 8) % TARGETS.length]]
  }
  const norm = (t) => (t || '').replace(/_/g, ' ').trim().toLowerCase()

  // ---------- fetching and cleaning ----------
  const cache = new Map()
  async function fetchArticle(title) {
    if (cache.has(norm(title))) return cache.get(norm(title))
    const url = API + '?action=parse&format=json&formatversion=2&origin=*&redirects=1&prop=text&disableeditsection=1&disabletoc=1&page=' + encodeURIComponent(title)
    const res = await fetch(url)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const j = await res.json()
    if (j.error) throw new Error(j.error.info || 'Not found')
    const out = { title: j.parse.title, html: j.parse.text }
    cache.set(norm(title), out)
    cache.set(norm(out.title), out)
    return out
  }

  const KEEP = new Set(['P', 'B', 'I', 'EM', 'STRONG', 'UL', 'OL', 'LI', 'H2', 'H3', 'H4', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH', 'CAPTION', 'BLOCKQUOTE', 'DL', 'DT', 'DD', 'SUB', 'SUP', 'BR', 'SPAN', 'DIV', 'FIGURE', 'FIGCAPTION', 'IMG', 'A', 'SMALL', 'ABBR', 'CITE'])
  const DROP = 'script, style, link, meta, noscript, .mw-editsection, .reference, .reflist, .mw-references-wrap, .navbox, .vertical-navbox, .metadata, .ambox, .sistersitebox, .noprint, .mw-empty-elt, .shortdescription, .hatnote + .hatnote, #coordinates, .mw-kartographer-maplink, sup.noprint, .portalbox, .side-box'
  const NAMESPACE = /^(File|Category|Help|Special|Wikipedia|Template|Template talk|Portal|Talk|User|Draft|Module|MediaWiki|Book|TimedText|Image):/i

  function clean(html) {
    const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html')
    doc.querySelectorAll(DROP).forEach((n) => n.remove())
    // Cut everything from "References" / "See also" onward: just footnotes and lists of links.
    doc.querySelectorAll('h2').forEach((h) => {
      if (/^(References|Notes|See also|Further reading|External links|Bibliography|Sources|Citations|Footnotes)$/i.test(h.textContent.trim())) {
        const block = h.closest('.mw-heading') || h
        let n = block
        while (n) { const nx = n.nextSibling; n.remove(); n = nx }
      }
    })
    const frag = document.createDocumentFragment()
    function walk(node, parent) {
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) { parent.appendChild(document.createTextNode(child.textContent)); return }
        if (child.nodeType !== 1) return
        const tag = child.tagName
        if (!KEEP.has(tag)) { walk(child, parent); return } // unwrap unknown tags, keep their text
        if (tag === 'A') {
          const href = child.getAttribute('href') || ''
          const m = href.match(/^\/wiki\/([^#?]+)/)
          if (m) {
            const title = decodeURIComponent(m[1]).replace(/_/g, ' ')
            if (!NAMESPACE.test(title)) {
              const a = document.createElement('a')
              a.className = 'go' + (norm(title) === norm(target) ? ' is-target' : '')
              a.dataset.go = title
              a.href = '#'
              walk(child, a)
              parent.appendChild(a)
              return
            }
          }
          walk(child, parent) // anything else becomes plain text
          return
        }
        if (tag === 'IMG') {
          let src = child.getAttribute('src') || ''
          if (src.startsWith('//')) src = 'https:' + src
          if (!/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(src)) return
          const img = document.createElement('img')
          img.src = src
          img.alt = child.getAttribute('alt') || ''
          img.loading = 'lazy'
          const w = +child.getAttribute('width'), h = +child.getAttribute('height')
          if (w && h) { img.width = w; img.height = h }
          parent.appendChild(img)
          return
        }
        const el = document.createElement(tag)
        if ((tag === 'TABLE' || tag === 'DIV') && /\binfobox\b/.test(child.className)) el.className = 'infobox'
        if (tag === 'TD' || tag === 'TH') { ['colspan', 'rowspan'].forEach((a) => { const v = child.getAttribute(a); if (v && /^\d+$/.test(v)) el.setAttribute(a, v) }) }
        walk(child, el)
        parent.appendChild(el)
      })
    }
    walk(doc.body.firstChild, frag)
    return frag
  }

  // ---------- game ----------
  async function go(title, countIt) {
    if (loading || done) return
    loading = true
    const art = $('article')
    art.setAttribute('aria-busy', 'true')
    art.style.opacity = '0.5'
    try {
      const page = await fetchArticle(title)
      current = page.title
      if (countIt) { clicks++; path.push(page.title) }
      if (!t0) { t0 = Date.now(); timerId = setInterval(tickTimer, 500) }
      art.innerHTML = ''
      const h = document.createElement('h1')
      h.className = 'art-title'
      h.textContent = page.title
      art.appendChild(h)
      art.appendChild(clean(page.html))
      window.scrollTo({ top: $('path').getBoundingClientRect().top + window.scrollY - 90, behavior: 'auto' })
      render()
      if (norm(page.title) === norm(target)) win()
    } catch (e) {
      Kit.toast(/not found|missing/i.test(e.message) ? 'That page doesn\'t exist' : 'Wikipedia didn\'t answer. Try again.')
      if (!current) art.innerHTML = '<p class="loading">Couldn\'t load the start page. Check your connection and press Restart.</p>'
    } finally {
      loading = false
      art.style.opacity = ''
      art.removeAttribute('aria-busy')
    }
  }
  function tickTimer() { const s = Math.floor((Date.now() - t0) / 1000); $('timer').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') }
  function render() {
    $('clicks').textContent = clicks + (clicks === 1 ? ' click' : ' clicks')
    $('path').innerHTML = ''
    ;[start].concat(path).forEach((p) => { const s = document.createElement('span'); s.textContent = p; $('path').appendChild(s) })
    $('backBtn').disabled = !path.length || done
  }
  function win() {
    done = true
    clearInterval(timerId)
    tickTimer()
    const time = $('timer').textContent
    const box = $('winBox')
    box.hidden = false
    const label = mode === 'daily' ? 'Six Clicks #' + puzzleNo() : 'Six Clicks practice'
    const share = label + ': ' + start + ' → ' + target + ' in ' + clicks + (clicks === 1 ? ' click' : ' clicks') + ' (' + time + ')\n' + '🟩'.repeat(Math.min(clicks, 12)) + '\n' + location.origin + location.pathname
    let best = null
    if (mode === 'daily') {
      best = Kit.store.get('six-clicks-best', {})
      if (!best[todayKey()] || clicks < best[todayKey()]) { best[todayKey()] = clicks; Kit.store.set('six-clicks-best', best) }
    }
    box.innerHTML = '<div class="win"><h2>You made it!</h2><p></p><div class="row" style="justify-content:center"><button class="btn btn-primary" type="button" data-share>Share result</button><button class="btn btn-ghost" type="button" data-again></button></div></div>'
    box.querySelector('p').textContent = start + ' to ' + target + ' in ' + clicks + (clicks === 1 ? ' click' : ' clicks') + ', ' + time + '.' + (clicks <= 6 ? ' Within six. Nice.' : ' Can you do it in six?')
    box.querySelector('[data-again]').textContent = mode === 'daily' ? 'Try a practice round' : 'Another one'
    box.querySelector('[data-share]').addEventListener('click', () => { if (navigator.share) navigator.share({ text: share }).catch(() => {}); else Kit.copy(share, 'Result copied') })
    box.querySelector('[data-again]').addEventListener('click', () => setMode('practice', true))
    render()
    box.scrollIntoView({ behavior: Kit.reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }
  function reset(s, t) {
    start = s; target = t; current = ''; clicks = 0; path = []; t0 = 0; done = false
    clearInterval(timerId)
    $('timer').textContent = '0:00'
    $('startName').textContent = s
    $('targetName').textContent = t
    $('winBox').hidden = true
    render()
    go(s, false)
  }
  function practicePair() {
    let s, t
    do { s = STARTS[Kit.randInt(STARTS.length)]; t = TARGETS[Kit.randInt(TARGETS.length)] } while (norm(s) === norm(t))
    return [s, t]
  }
  function setMode(m, fresh) {
    mode = m
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)))
    $('newPractice').hidden = m !== 'practice'
    const [s, t] = m === 'daily' ? dailyPair() : practicePair()
    reset(s, t)
  }

  $('article').addEventListener('click', (e) => {
    const a = e.target.closest('a.go')
    if (!a) return
    e.preventDefault()
    go(a.dataset.go, true)
  })
  $('backBtn').addEventListener('click', () => {
    if (!path.length || done) return
    path.pop()
    const prev = path.length ? path[path.length - 1] : start
    clicks++ // going back still counts
    render()
    go(prev, false)
  })
  $('restartBtn').addEventListener('click', () => reset(start, target))
  $('newPractice').addEventListener('click', () => setMode('practice', true))
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode, true)))
  setMode('daily', true)
})()
