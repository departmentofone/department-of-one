// Contact form: posts to /api/contact (api/contact.js), which stores the message for the admin
// inbox and emails a copy to the owner. The limits checked here mirror the server's and the
// database's, so the form can explain a problem before sending anything.
;(function () {
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

  var form = document.getElementById('contactForm')
  var subject = document.getElementById('subject')
  var email = document.getElementById('email')
  var message = document.getElementById('message')
  var honeypot = document.getElementById('website')
  var sendBtn = document.getElementById('sendBtn')
  var statusEl = document.getElementById('formStatus')
  var charCount = document.getElementById('charCount')

  // The message box is a plain <textarea> with no key handling at all: Enter makes a new line,
  // and the text is sent exactly as typed. Only the one-line fields get Enter handling - it moves
  // to the next field instead of sending a half-written message.
  function enterGoesTo(field, next) {
    field.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault()
        next.focus()
      }
    })
  }
  enterGoesTo(subject, email)
  enterGoesTo(email, message)

  message.addEventListener('input', function () {
    charCount.textContent = message.value.length
  })

  function fail(field, text) {
    statusEl.textContent = text
    statusEl.className = 'form-status err'
    if (field) {
      field.setAttribute('aria-invalid', 'true')
      field.focus()
    }
  }

  ;[subject, email, message].forEach(function (f) {
    f.addEventListener('input', function () {
      f.removeAttribute('aria-invalid')
      if (statusEl.classList.contains('err')) statusEl.textContent = ''
    })
  })

  function showSent(address) {
    form.hidden = true
    document.getElementById('sentEmail').textContent = address
    document.getElementById('sentView').hidden = false
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    var s = subject.value.trim()
    var em = email.value.trim()
    var m = message.value

    if (!s) return fail(subject, 'Add a subject.')
    if (!EMAIL_RE.test(em)) return fail(email, "That email address doesn't look right.")
    if (!m.trim()) return fail(message, 'Write a message.')
    if (m.length > 5000) return fail(message, 'Keep the message under 5,000 characters.')

    // Bots fill in every field, including this invisible one. Pretend it worked.
    if (honeypot.value) return showSent(em)

    sendBtn.disabled = true
    sendBtn.textContent = 'Sending…'
    statusEl.textContent = ''
    statusEl.className = 'form-status'

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: s, email: em, message: m, website: honeypot.value }),
    })
      .then(function (res) {
        if (res.ok) return showSent(em)
        return res.json().then(
          function (data) { throw new Error(data && data.error) },
          function () { throw new Error('') },
        )
      })
      .catch(function (err) {
        // Everything typed stays in the form, so nothing is lost by retrying.
        sendBtn.disabled = false
        sendBtn.textContent = 'Send message'
        fail(null, (err && err.message) || "Couldn't send - check your connection and try again. Your message is still here.")
      })
  })
})()
