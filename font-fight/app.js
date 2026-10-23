// Font Fight: a single-elimination bracket of free Google Fonts. Fonts are loaded on demand, one
// match ahead, so the page stays light.
;(function () {
  const $ = (id) => document.getElementById(id)
  const FONTS = [
    ['Inter', 'sans'], ['Roboto', 'sans'], ['Poppins', 'sans'], ['Montserrat', 'sans'], ['Lato', 'sans'], ['Open Sans', 'sans'], ['Raleway', 'sans'],
    ['Nunito', 'sans'], ['Work Sans', 'sans'], ['DM Sans', 'sans'], ['Manrope', 'sans'], ['Space Grotesk', 'sans'], ['Sora', 'sans'], ['Outfit', 'sans'],
    ['Plus Jakarta Sans', 'sans'], ['Rubik', 'sans'], ['Karla', 'sans'], ['IBM Plex Sans', 'sans'], ['Figtree', 'sans'], ['Lexend', 'sans'],
    ['Fraunces', 'serif'], ['Playfair Display', 'serif'], ['Lora', 'serif'], ['Merriweather', 'serif'], ['Libre Baskerville', 'serif'], ['Cormorant Garamond', 'serif'],
    ['EB Garamond', 'serif'], ['Crimson Pro', 'serif'], ['DM Serif Display', 'serif'], ['Bitter', 'serif'], ['Roboto Slab', 'serif'], ['Zilla Slab', 'serif'],
    ['Young Serif', 'serif'], ['Instrument Serif', 'serif'], ['Source Serif 4', 'serif'], ['Newsreader', 'serif'],
    ['Space Mono', 'mono'], ['JetBrains Mono', 'mono'], ['IBM Plex Mono', 'mono'], ['Fira Code', 'mono'], ['DM Mono', 'mono'], ['Courier Prime', 'mono'], ['Inconsolata', 'mono'], ['Victor Mono', 'mono'],
    ['Caveat', 'display'], ['Pacifico', 'display'], ['Dancing Script', 'display'], ['Permanent Marker', 'display'], ['Lobster', 'display'], ['Abril Fatface', 'display'],
    ['Bebas Neue', 'display'], ['Anton', 'display'], ['Righteous', 'display'], ['Bungee', 'display'], ['Press Start 2P', 'display'], ['Comfortaa', 'display'],
    ['Baloo 2', 'display'], ['Archivo Black', 'display'], ['Syne', 'display'], ['Unbounded', 'display'], ['Bricolage Grotesque', 'display'], ['Fredoka', 'display'],
  ]
  const loaded = new Set()
  function load(name) {
    if (loaded.has(name)) return
    loaded.add(name)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + '&display=swap'
    document.head.appendChild(link)
  }

  let round = [], next = [], match = 0, total = 0, played = 0, history = []
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Kit.randInt(i + 1); [a[i], a[j]] = [a[j], a[i]] } return a }

  function newTournament() {
    const pool = $('pool').value
    const list = shuffle(FONTS.filter((f) => pool === 'all' || f[1] === pool).map((f) => f[0]))
    const size = list.length >= 16 ? 16 : 8
    round = list.slice(0, size)
    next = []; match = 0; played = 0; history = []
    total = size - 1
    $('arena').hidden = false
    $('champ').hidden = true
    showMatch()
  }
  function showMatch() {
    if (match * 2 >= round.length) {
      if (next.length === 1) return crown(next[0])
      round = next; next = []; match = 0
    }
    const a = round[match * 2], b = round[match * 2 + 1]
    ;[a, b].forEach(load)
    // Warm up the following match's fonts so the switch is instant.
    ;[round[match * 2 + 2], round[match * 2 + 3]].forEach((f) => f && load(f))
    setFighter('a', a); setFighter('b', b)
    const names = { 16: 'Round of 16', 8: 'Quarter-finals', 4: 'Semi-finals', 2: 'The final' }
    $('round').textContent = names[round.length] || 'Round'
    $('left').textContent = (total - played) + ' to go'
    $('progress').style.width = (played / total) * 100 + '%'
  }
  function setFighter(id, font) {
    const el = $(id)
    el.classList.remove('is-out')
    el.dataset.font = font
    const s = el.querySelector('.sample')
    s.style.fontFamily = '"' + font + '", system-ui'
    s.textContent = $('sample').value || 'The quick brown fox jumps over the lazy dog'
    el.querySelector('b').textContent = font
  }
  let busy = false
  function pick(id) {
    if (busy || $('arena').hidden) return
    busy = true
    const winner = $(id).dataset.font, loser = $(id === 'a' ? 'b' : 'a')
    loser.classList.add('is-out')
    history.push(winner)
    next.push(winner)
    played++
    setTimeout(() => { match++; busy = false; showMatch() }, Kit.reduceMotion ? 0 : 260)
  }
  function crown(font) {
    $('arena').hidden = true
    const box = $('champ')
    box.hidden = false
    const url = 'https://fonts.google.com/specimen/' + font.replace(/ /g, '+')
    const css = '<link href="https://fonts.googleapis.com/css2?family=' + font.replace(/ /g, '+') + '&display=swap" rel="stylesheet">\nfont-family: "' + font + '";'
    box.innerHTML = '<div class="crown" aria-hidden="true">👑</div><p class="muted">Your champion is</p><h2></h2><p class="sample"></p>' +
      '<div class="row" style="justify-content:center"><a class="btn btn-primary" target="_blank" rel="noopener">Get it on Google Fonts</a><button class="btn btn-ghost" type="button" data-copy>Copy CSS</button><button class="btn btn-ghost" type="button" data-share>Share</button><button class="btn btn-ghost" type="button" data-again>Fight again</button></div>' +
      '<pre></pre><p class="small faint">Also did well</p><div class="ladder"></div>'
    box.querySelector('h2').textContent = font
    box.querySelector('h2').style.fontFamily = '"' + font + '", system-ui'
    box.querySelector('h2').style.fontSize = 'clamp(1.6rem, 4vw, 2.6rem)'
    const s = box.querySelector('.sample')
    s.textContent = $('sample').value || 'The quick brown fox jumps over the lazy dog'
    s.style.fontFamily = '"' + font + '", system-ui'
    box.querySelector('a').href = url
    box.querySelector('pre').textContent = css
    // Fonts that won matches on the way, latest first.
    box.querySelector('.ladder').innerHTML = ''
    Array.from(new Set(history.slice().reverse())).filter((f) => f !== font).slice(0, 6).forEach((f) => {
      const span = document.createElement('span'); span.textContent = f; span.style.fontFamily = '"' + f + '", system-ui'; box.querySelector('.ladder').appendChild(span)
    })
    box.querySelector('[data-copy]').addEventListener('click', () => Kit.copy(css, 'CSS copied'))
    box.querySelector('[data-again]').addEventListener('click', newTournament)
    box.querySelector('[data-share]').addEventListener('click', () => {
      const text = 'My favourite font is ' + font + '. Find yours at ' + location.origin + location.pathname
      if (navigator.share) navigator.share({ text }).catch(() => {}); else Kit.copy(text, 'Copied, paste it anywhere')
    })
    $('progress').style.width = '100%'
  }

  $('a').addEventListener('click', () => pick('a'))
  $('b').addEventListener('click', () => pick('b'))
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return
    if (e.key === '1' || e.key === 'ArrowLeft') pick('a')
    if (e.key === '2' || e.key === 'ArrowRight') pick('b')
  })
  $('sample').addEventListener('input', () => document.querySelectorAll('.fighter .sample, #champ .sample').forEach((s) => { s.textContent = $('sample').value || 'The quick brown fox jumps over the lazy dog' }))
  $('restart').addEventListener('click', newTournament)
  $('pool').addEventListener('change', newTournament)
  newTournament()
})()
