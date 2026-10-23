// Meeting Meter: cost = people x hourly rate x elapsed time. Time comes from timestamps, not from
// counting frames, so a background tab or a sleeping laptop never loses money.
;(function () {
  const $ = (id) => document.getElementById(id)
  const people = $('people'), rate = $('rate'), currency = $('currency')
  const costEl = $('cost'), timeEl = $('time'), msEl = $('milestone'), logEl = $('log'), startBtn = $('startBtn')

  // Thresholds in US dollars; scaled loosely for other currencies below.
  const MILESTONES = [
    [5, 'That was a coffee.'], [12, 'That was a sandwich.'], [25, 'That was a pizza.'], [60, 'That was a nice dinner for two.'],
    [150, 'That was a pair of good headphones.'], [400, 'That was a weekend away.'], [1000, 'That was a new phone.'],
    [2500, 'That was a used car, nearly.'], [10000, 'That was someone\'s salary for a while.'],
  ]
  const SCALE = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.5, CHF: 0.88, JPY: 150, INR: 83, RSD: 108 }

  const saved = Kit.store.get('meeting-meter', null)
  if (saved) { people.value = saved.people; rate.value = saved.rate; currency.value = saved.currency }

  // Time and money are banked separately, so a rate change only prices the time after it.
  let running = false, startedAt = 0, banked = 0, bankedCost = 0, raf = 0, reached = new Set()

  const perSecond = () => (Math.max(1, +people.value || 1) * Math.max(0, +rate.value || 0)) / 3600
  const segment = () => (running ? (performance.now() - startedAt) / 1000 : 0)
  const elapsed = () => banked + segment()
  const totalCost = () => bankedCost + segment() * perSecond()
  function bank() { bankedCost = totalCost(); banked = elapsed(); startedAt = performance.now() }

  function money(v) {
    const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.value })
    const parts = fmt.formatToParts(v)
    const frac = parts.findIndex((p) => p.type === 'decimal')
    if (frac < 0) return fmt.format(v)
    const main = parts.slice(0, frac).map((p) => p.value).join('')
    const rest = parts.slice(frac).map((p) => p.value).join('')
    return main + '<span class="cents">' + rest + '</span>'
  }
  function clock(s) {
    s = Math.floor(s)
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':')
  }

  function render() {
    const t = elapsed()
    const cost = totalCost()
    costEl.innerHTML = money(cost)
    timeEl.textContent = clock(t)
    const usd = cost / (SCALE[currency.value] || 1)
    MILESTONES.forEach(([at, text]) => {
      if (usd >= at && !reached.has(at)) {
        reached.add(at)
        msEl.classList.add('is-new')
        msEl.textContent = text
        requestAnimationFrame(() => msEl.classList.remove('is-new'))
        if (logEl.firstElementChild && logEl.firstElementChild.textContent === 'None yet.') logEl.innerHTML = ''
        const li = document.createElement('li')
        li.innerHTML = '<span></span><b></b>'
        li.firstChild.textContent = text.replace('That was ', '').replace(/\.$/, '')
        li.lastChild.textContent = clock(t)
        logEl.prepend(li)
      }
    })
    document.title = running ? money(cost).replace(/<[^>]+>/g, '') + ' - Meeting Meter' : 'Meeting Meter'
  }
  function loop() { render(); raf = requestAnimationFrame(loop) }

  function save() { Kit.store.set('meeting-meter', { people: people.value, rate: rate.value, currency: currency.value }) }
  function updateRateNote() {
    const per = perSecond() * 60
    $('perMinute').textContent = 'About ' + new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.value }).format(per) + ' a minute.'
  }

  startBtn.addEventListener('click', () => {
    if (running) {
      bank(); running = false; cancelAnimationFrame(raf); startBtn.textContent = 'Resume'; render()
    } else {
      running = true; startedAt = performance.now(); startBtn.textContent = 'Pause'
      if (msEl.textContent.startsWith('Press start')) msEl.textContent = 'Clock is running.'
      loop()
    }
  })
  $('resetBtn').addEventListener('click', () => {
    running = false; cancelAnimationFrame(raf); banked = 0; bankedCost = 0; reached = new Set()
    startBtn.textContent = 'Start'; msEl.textContent = 'Press start when the meeting does.'; logEl.innerHTML = '<li>None yet.</li>'
    render()
  })
  $('fullBtn').addEventListener('click', () => {
    const stage = $('stage')
    if (document.fullscreenElement) document.exitFullscreen()
    else if (stage.requestFullscreen) stage.requestFullscreen()
  })
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    people.value = Math.min(999, Math.max(1, (+people.value || 1) + +b.dataset.step))
    people.dispatchEvent(new Event('input'))
  }))
  ;[people, rate, currency].forEach((el) => el.addEventListener('input', () => {
    // Changing the rate mid-meeting re-prices only what comes next.
    if (running) bank()
    save(); updateRateNote(); render()
  }))
  updateRateNote()
  render()
})()
