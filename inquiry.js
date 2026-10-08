// Inquiry form: posts to /api/contact (api/contact.js), which stores the message for the admin
// inbox and emails a copy to the owner. The limits checked here mirror the server's and the
// database's, so the form can explain a problem before sending anything.
//
// The reason menu decides which fields show: a project or a service question asks "which service",
// and a project also asks about timing. Buttons across the page (data-inquire) jump here with the
// right reason and service already chosen.
;(function () {
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
  var SITEKEY = '0x4AAAAAAFJNfo4pofObKvVn'

  var form = document.getElementById('inquiryForm')
  if (!form) return
  var reason = document.getElementById('reason')
  var service = document.getElementById('service')
  var timeline = document.getElementById('timeline')
  var nameEl = document.getElementById('name')
  var email = document.getElementById('email')
  var message = document.getElementById('message')
  var honeypot = document.getElementById('website')
  var sendBtn = document.getElementById('sendBtn')
  var sendLabel = sendBtn.querySelector('span')
  var statusEl = document.getElementById('formStatus')
  var charCount = document.getElementById('charCount')
  var serviceWrap = document.getElementById('serviceWrap')
  var timelineWrap = document.getElementById('timelineWrap')
  var sentView = document.getElementById('sentView')

  // What the message box says for each reason, so the blank page already asks the right question.
  var PLACEHOLDERS = {
    project: 'What should it do, who is it for, and what should visitors or users be able to do? Links to things you like help.',
    question: 'What would you like to know? Scope, timing, how something works: ask anything.',
    fitlog: 'What happened, or what would you like FitLog to do? Your phone and what you were doing help.',
    idea: 'Tell me what it would do and how you would use it.',
    other: 'Say whatever you like. Hello is a fine reason to write.',
  }
  var DEFAULT_PLACEHOLDER = 'Tell me what you have in mind. Line breaks are kept.'
  var SERVICE_BY_BUTTON = { website: 'website', landing: 'landing', app: 'app', bot: 'bot' }

  function setOpen(wrap, open) {
    wrap.setAttribute('data-open', String(open))
    if (open) wrap.removeAttribute('inert')
    else wrap.setAttribute('inert', '')
  }

  function syncReason() {
    var r = reason.value
    var wantsService = r === 'project' || r === 'question'
    setOpen(serviceWrap, wantsService)
    setOpen(timelineWrap, r === 'project')
    if (!wantsService) {
      service.value = ''
      service.removeAttribute('aria-invalid')
    }
    if (r !== 'project') timeline.value = ''
    message.placeholder = PLACEHOLDERS[r] || DEFAULT_PLACEHOLDER
  }
  reason.addEventListener('change', function () {
    reason.removeAttribute('aria-invalid')
    syncReason()
  })

  // Used by the buttons around the page and by ?service= links.
  function fill(opts) {
    if (opts.reason) reason.value = opts.reason
    syncReason()
    if (opts.service && serviceWrap.getAttribute('data-open') === 'true') service.value = opts.service
    reason.removeAttribute('aria-invalid')
    service.removeAttribute('aria-invalid')
    statusEl.textContent = ''
    statusEl.className = 'form-status'
  }
  window.fillInquiry = fill

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-inquire]')
    if (!btn) return
    var what = btn.getAttribute('data-inquire')
    // The link itself scrolls to #inquiry; this only fills the form in.
    if (what === 'idea') fill({ reason: 'idea' })
    else if (SERVICE_BY_BUTTON[what]) fill({ reason: 'project', service: SERVICE_BY_BUTTON[what] })
  })

  // /?service=bot#inquiry and /?reason=idea#inquiry
  try {
    var q = new URLSearchParams(window.location.search)
    var qr = q.get('reason')
    var qs = q.get('service')
    if (qs && SERVICE_BY_BUTTON[qs]) fill({ reason: qr === 'question' ? 'question' : 'project', service: qs })
    else if (qr && PLACEHOLDERS[qr]) fill({ reason: qr })
  } catch (err) {
    // No URLSearchParams: the form simply starts empty.
  }

  message.addEventListener('input', function () {
    charCount.textContent = message.value.length
  })

  // One-line fields: Enter moves on instead of sending a half-written message.
  function enterGoesTo(field, next) {
    field.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault()
        next.focus()
      }
    })
  }
  enterGoesTo(nameEl, email)
  enterGoesTo(email, message)

  function fail(field, text) {
    statusEl.textContent = text
    statusEl.className = 'form-status err'
    if (field) {
      field.setAttribute('aria-invalid', 'true')
      field.focus()
    }
  }
  ;[reason, service, nameEl, email, message].forEach(function (f) {
    f.addEventListener('input', function () {
      f.removeAttribute('aria-invalid')
      if (statusEl.classList.contains('err')) statusEl.textContent = ''
    })
  })

  // ---------- Cloudflare Turnstile ----------
  // Loaded the first time the form is touched, not on page load, so a visit to the site alone never
  // contacts Cloudflare. api/contact.js verifies the token it produces.
  var tsState = 'idle'
  var widgetId = null
  var needsTick = false

  window.dooTurnstileReady = function () {
    tsState = 'ready'
    widgetId = window.turnstile.render('#turnstileBox', {
      sitekey: SITEKEY,
      action: 'contact',
      theme: 'dark',
      size: 'flexible',
      appearance: 'interaction-only',
      callback: function () { needsTick = false },
      'before-interactive-callback': function () { needsTick = true },
      // Cloudflare could not run the check (offline, blocked, wrong domain): stop waiting for it.
      'error-callback': function () { tsState = 'failed'; return true },
    })
  }
  function loadTurnstile() {
    if (tsState !== 'idle') return
    tsState = 'loading'
    var s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=dooTurnstileReady'
    s.async = true
    s.defer = true
    s.onerror = function () { tsState = 'failed' }
    document.head.appendChild(s)
  }
  ;['focusin', 'pointerdown'].forEach(function (ev) { form.addEventListener(ev, loadTurnstile, { once: true }) })

  function turnstileToken() {
    if (widgetId === null || !window.turnstile) return ''
    return window.turnstile.getResponse(widgetId) || ''
  }
  // In Managed mode Cloudflare may want a tick on "Verify you are human" before it gives a token.
  // Autofill can submit before the check has finished: wait for it (up to 10 seconds).
  function waitForToken(done) {
    loadTurnstile()
    var start = Date.now()
    ;(function poll() {
      if (turnstileToken() || needsTick || tsState === 'failed' || Date.now() - start > 10000) return done(turnstileToken())
      setTimeout(poll, 150)
    })()
  }
  function resetTurnstile() {
    if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId)
  }

  function setSending(on) {
    sendBtn.disabled = on
    sendLabel.textContent = on ? 'Sending…' : 'Send inquiry'
  }

  function showSent(address) {
    form.hidden = true
    document.getElementById('sentEmail').textContent = address
    sentView.hidden = false
  }
  document.getElementById('againBtn').addEventListener('click', function () {
    form.reset()
    charCount.textContent = '0'
    syncReason()
    setSending(false)
    statusEl.textContent = ''
    sentView.hidden = true
    form.hidden = false
    reason.focus()
  })

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    var r = reason.value
    var wantsService = r === 'project' || r === 'question'
    var em = email.value.trim()
    var m = message.value

    if (!r) return fail(reason, 'Choose what this is about.')
    if (wantsService && !service.value) return fail(service, 'Choose a service, or "Not sure yet".')
    if (!EMAIL_RE.test(em)) return fail(email, "That email address doesn't look right.")
    if (!m.trim()) return fail(message, 'Write a message.')
    if (m.length > 4500) return fail(message, 'Keep the message under 4,500 characters.')

    // Bots fill in every field, including this invisible one. Pretend it worked.
    if (honeypot.value) return showSent(em)

    setSending(true)
    statusEl.textContent = ''
    statusEl.className = 'form-status'

    waitForToken(function (token) {
      if (!token && needsTick) {
        setSending(false)
        return fail(null, 'Tick "Verify you are human" above, then send again.')
      }
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: r,
          service: wantsService ? service.value : '',
          timeline: r === 'project' ? timeline.value : '',
          name: nameEl.value.trim(),
          email: em,
          message: m,
          website: honeypot.value,
          turnstileToken: token,
        }),
      })
        .then(function (res) {
          resetTurnstile()
          if (res.ok) return showSent(em)
          return res.json().then(
            function (data) { throw new Error(data && data.error) },
            function () { throw new Error('') },
          )
        })
        .catch(function (err) {
          // Everything typed stays in the form, so nothing is lost by retrying.
          setSending(false)
          fail(null, (err && err.message) || "Couldn't send. Check your connection and try again. Your message is still here.")
        })
    })
  })
})()
