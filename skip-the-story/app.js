// Skip the Story: asks /api/recipe for the recipe on a page and lays it out. Quantities scale with
// the servings, ingredients and steps can be ticked off, and cook mode keeps the screen awake.
;(function () {
  const $ = (id) => document.getElementById(id)
  let recipe = null, base = 1, serves = 1, wakeLock = null

  // ---------- quantities ----------
  const UNI = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875, '⅕': 0.2 }
  const NUM = '(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[.,]\\d+)?\\s*[½⅓⅔¼¾⅛⅜⅝⅞⅕]|\\d+(?:[.,]\\d+)?|[½⅓⅔¼¾⅛⅜⅝⅞⅕])'
  const QTY = new RegExp('^\\s*(' + NUM + ')(\\s*(?:-|–|to)\\s*(' + NUM + '))?')
  function val(s) {
    s = s.trim()
    let m
    if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return +m[1] + m[2] / m[3]
    if ((m = s.match(/^(\d+)\/(\d+)$/))) return m[1] / m[2]
    if ((m = s.match(/^(\d+(?:[.,]\d+)?)\s*([½⅓⅔¼¾⅛⅜⅝⅞⅕])$/))) return parseFloat(m[1].replace(',', '.')) + UNI[m[2]]
    if (UNI[s] != null) return UNI[s]
    return parseFloat(s.replace(',', '.'))
  }
  function nice(x) {
    if (x >= 10) return String(Math.round(x))
    const whole = Math.floor(x), frac = x - whole
    const opts = [[0, ''], [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']]
    let best = opts[0], bd = 1
    opts.forEach((o) => { const d = Math.abs(frac - o[0]); if (d < bd) { bd = d; best = o } })
    if (bd > 0.06) return (Math.round(x * 10) / 10).toString()
    const w = whole + (best[0] === 1 ? 1 : 0)
    return (w ? w : '') + (best[1] ? (w ? ' ' : '') + best[1] : '') || '0'
  }
  function scaled(line, f) {
    if (f === 1) return { q: '', rest: line, raw: line }
    const m = line.match(QTY)
    if (!m) return { q: '', rest: line, raw: line }
    const a = val(m[1]), b = m[3] ? val(m[3]) : null
    if (!Number.isFinite(a)) return { q: '', rest: line, raw: line }
    const q = nice(a * f) + (b != null && Number.isFinite(b) ? '–' + nice(b * f) : '')
    return { q, rest: line.slice(m[0].length) }
  }

  // ---------- rendering ----------
  const fmtMin = (m) => (m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min')
  function render() {
    const r = recipe, out = $('out')
    out.innerHTML = ''
    const card = document.createElement('div')
    card.className = 'ss-card'
    card.innerHTML =
      '<div class="ss-hero"><div class="ss-img"></div><h2 class="ss-title"></h2><p class="ss-desc muted"></p><div class="ss-meta"></div>' +
      '<p class="ss-src">From <a target="_blank" rel="noopener"></a></p>' +
      '<div class="row no-print"><button class="btn btn-primary" type="button" data-cook>Cook mode</button><button class="btn btn-ghost" type="button" data-copy>Copy</button><button class="btn btn-ghost" type="button" data-print>Print</button></div></div>' +
      '<div class="stack"><div class="panel-k stack"><div class="row" style="justify-content:space-between"><h3 style="font-size:1.25rem">Ingredients</h3>' +
      '<div class="serves no-print"><button class="icon-btn" type="button" data-s="-1" aria-label="Fewer servings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 12h12"/></svg></button><b aria-live="polite"></b><button class="icon-btn" type="button" data-s="1" aria-label="More servings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg></button><span class="small muted" data-unit></span></div></div>' +
      '<div class="ings"></div></div><div class="panel-k"><h3 style="font-size:1.25rem;margin-bottom:8px">Steps</h3><ol class="steps-l"></ol></div></div>'
    if (r.image) { const img = document.createElement('img'); img.src = r.image; img.alt = r.title; img.referrerPolicy = 'no-referrer'; img.onerror = () => img.remove(); card.querySelector('.ss-img').appendChild(img) }
    card.querySelector('.ss-title').textContent = r.title
    card.querySelector('.ss-desc').textContent = r.description
    const meta = card.querySelector('.ss-meta')
    ;[r.prepMinutes && 'Prep ' + fmtMin(r.prepMinutes), r.cookMinutes && 'Cook ' + fmtMin(r.cookMinutes), r.totalMinutes && 'Total ' + fmtMin(r.totalMinutes), r.yield && (/^[a-z]/i.test(r.yield) ? r.yield : 'Makes ' + r.yield)]
      .filter(Boolean).forEach((t) => { const s = document.createElement('span'); s.textContent = t; meta.appendChild(s) })
    const a = card.querySelector('.ss-src a')
    a.href = r.url; a.textContent = r.site + (r.author ? ', by ' + r.author : '')
    out.appendChild(card)
    renderIngredients()
    const ol = card.querySelector('.steps-l')
    r.sections.forEach((sec) => {
      if (sec.name) { const h = document.createElement('h3'); h.textContent = sec.name; ol.appendChild(h) }
      sec.steps.forEach((s) => { const li = document.createElement('li'); li.textContent = s; li.addEventListener('click', () => li.classList.toggle('is-done')); ol.appendChild(li) })
    })
    card.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { serves = Math.max(1, Math.min(99, serves + +b.dataset.s)); renderIngredients() }))
    card.querySelector('[data-cook]').addEventListener('click', cookMode)
    card.querySelector('[data-print]').addEventListener('click', () => window.print())
    card.querySelector('[data-copy]').addEventListener('click', () => Kit.copy(asText(), 'Recipe copied'))
  }
  function renderIngredients() {
    const f = serves / base
    const box = $('out').querySelector('.ings')
    const checked = new Set(Array.from(box.querySelectorAll('input:checked')).map((i) => i.dataset.i))
    box.innerHTML = ''
    recipe.ingredients.forEach((line, i) => {
      const s = scaled(line, f)
      const lab = document.createElement('label')
      lab.innerHTML = '<input type="checkbox" /><span><span class="q"></span></span>'
      lab.querySelector('input').dataset.i = i
      if (checked.has(String(i))) lab.querySelector('input').checked = true
      lab.querySelector('.q').textContent = s.q
      lab.lastChild.appendChild(document.createTextNode(s.q ? s.rest : line))
      box.appendChild(lab)
    })
    $('out').querySelector('.serves b').textContent = serves
    // Use the recipe's own word ("12 pancakes", "4 servings"); a bare number counts as portions.
    const noun = (recipe.yield.match(/\d+\s*([a-z][a-z-]+)/i) || [])[1]
    $('out').querySelector('[data-unit]').textContent = base === 1 && !recipe.yield ? '× batch' : /serv|people|person|portion/i.test(recipe.yield) ? 'servings' : noun || 'portions'
  }
  function asText() {
    const f = serves / base
    return recipe.title + '\n' + recipe.url + '\n\nIngredients\n' + recipe.ingredients.map((l) => { const s = scaled(l, f); return '- ' + (s.q ? s.q + s.rest : l) }).join('\n') +
      '\n\nSteps\n' + recipe.sections.map((s) => (s.name ? s.name + '\n' : '') + s.steps.map((x, i) => i + 1 + '. ' + x).join('\n')).join('\n\n')
  }

  // ---------- cook mode ----------
  async function cookMode() {
    const all = recipe.sections.flatMap((s) => s.steps.map((x) => ({ sec: s.name, text: x })))
    if (!all.length) return
    let i = 0
    const el = document.createElement('div')
    el.className = 'cook'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    el.innerHTML = '<div class="cook-bar"><b></b><button class="btn btn-ghost btn-sm" type="button" data-x>Done cooking</button></div><div class="cook-step" aria-live="polite"><small></small><p></p></div><div class="cook-bar"><button class="btn btn-ghost" type="button" data-p>Back</button><button class="btn btn-primary" type="button" data-n>Next step</button></div>'
    el.querySelector('b').textContent = recipe.title
    const show = () => {
      el.querySelector('small').textContent = 'Step ' + (i + 1) + ' of ' + all.length + (all[i].sec ? ' · ' + all[i].sec : '')
      el.querySelector('p').textContent = all[i].text
      el.querySelector('[data-p]').disabled = i === 0
      el.querySelector('[data-n]').textContent = i === all.length - 1 ? 'Finish' : 'Next step'
    }
    const close = () => { el.remove(); document.removeEventListener('keydown', keys); if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null } }
    const keys = (e) => { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); el.querySelector('[data-n]').click() } if (e.key === 'ArrowLeft') el.querySelector('[data-p]').click(); if (e.key === 'Escape') close() }
    el.querySelector('[data-n]').addEventListener('click', () => { if (i < all.length - 1) { i++; show() } else close() })
    el.querySelector('[data-p]').addEventListener('click', () => { if (i > 0) { i--; show() } })
    el.querySelector('[data-x]').addEventListener('click', close)
    document.addEventListener('keydown', keys)
    document.body.appendChild(el)
    show()
    el.querySelector('[data-n]').focus()
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen') } catch (e) { /* not allowed here: the screen may dim */ }
  }
  document.addEventListener('visibilitychange', async () => {
    // The browser drops the wake lock when the tab is hidden; take it again in cook mode.
    if (!document.hidden && document.querySelector('.cook') && 'wakeLock' in navigator) { try { wakeLock = await navigator.wakeLock.request('screen') } catch (e) {} }
  })

  // ---------- loading ----------
  function showError(msg) { $('error').textContent = msg; $('error').hidden = !msg }
  async function load(url) {
    showError('')
    $('go').disabled = true
    $('go').textContent = 'Reading…'
    try {
      const res = await fetch('/api/recipe?url=' + encodeURIComponent(url))
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.recipe) throw new Error(j.error || 'Couldn\'t read that recipe.')
      recipe = j.recipe
      const n = parseInt((recipe.yield.match(/\d+/) || [])[0], 10)
      base = serves = n > 0 && n < 100 ? n : 1
      render()
      remember(recipe)
      const u = new URL(location.href)
      u.searchParams.set('url', url)
      history.replaceState(null, '', u)
      $('out').scrollIntoView({ behavior: Kit.reduceMotion ? 'auto' : 'smooth', block: 'start' })
    } catch (e) {
      showError(e.message)
    } finally {
      $('go').disabled = false
      $('go').textContent = 'Get the recipe'
    }
  }
  function remember(r) {
    const list = Kit.store.get('recipes', []).filter((x) => x.url !== r.url)
    list.unshift({ url: r.url, title: r.title })
    Kit.store.set('recipes', list.slice(0, 8))
    renderRecent()
  }
  function renderRecent() {
    const box = $('recent')
    box.innerHTML = ''
    Kit.store.get('recipes', []).forEach((x) => {
      const b = document.createElement('button')
      b.type = 'button'; b.className = 'chip'; b.textContent = x.title.length > 34 ? x.title.slice(0, 33) + '…' : x.title
      b.addEventListener('click', () => { $('url').value = x.url; load(x.url) })
      box.appendChild(b)
    })
  }

  $('form').addEventListener('submit', (e) => {
    e.preventDefault()
    let v = $('url').value.trim()
    if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v
    if (v) load(v)
  })
  // The bookmarklet sends whatever page you're on to this tool.
  $('bookmarklet').href = "javascript:location.href='" + location.origin + "/skip-the-story?url='+encodeURIComponent(location.href)"
  $('bookmarklet').addEventListener('click', (e) => { e.preventDefault(); Kit.toast('Drag it to your bookmarks bar instead') })
  renderRecent()
  const fromQuery = new URLSearchParams(location.search).get('url')
  if (fromQuery) { $('url').value = fromQuery; load(fromQuery) }
})()
