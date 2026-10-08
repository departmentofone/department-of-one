// The private quote page: /pay/<token>. Asks Supabase's get_quote(token) for the one quote that
// matches the secret token (supabase/quotes.sql) and renders it. Everything that came from the
// database goes in through textContent or a checked https link, never as HTML.
;(function () {
  var SUPABASE_URL = 'https://uxmdzudoojexfcoircoo.supabase.co'
  var SUPABASE_ANON_KEY = 'sb_publishable_JmN9P2H6oPKxcNh-jRPeEQ_aPc0NgLS'
  var ARROW = '<svg class="arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

  var $ = function (id) { return document.getElementById(id) }

  // /pay/<token>, or /pay?q=<token> as a fallback.
  var token = (window.location.pathname.match(/^\/pay\/([A-Za-z0-9_-]{20,64})\/?$/) || [])[1] ||
    new URLSearchParams(window.location.search).get('q') || ''

  function show(id) {
    ;['quoteLoading', 'quoteMissing', 'quoteBody'].forEach(function (s) { $(s).hidden = s !== id })
  }

  function money(amount, currency) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount)
    } catch (e) {
      return amount.toFixed(2) + ' ' + currency
    }
  }
  function day(value) {
    // Dates come as YYYY-MM-DD (valid_until) or full timestamps; show them as written dates.
    var d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T12:00:00') : new Date(value)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function render(q) {
    document.title = q.title + ' - Department of One'
    $('qNo').textContent = 'Q-' + String(q.quote_no).padStart(4, '0')
    $('qTitle').textContent = q.title
    $('qClient').textContent = q.client_name
    $('qIssued').textContent = day(q.created_at)
    if (q.valid_until) $('qValid').textContent = day(q.valid_until)
    else $('qValidRow').hidden = true
    if (q.scope) $('qScope').textContent = q.scope
    else $('qScopeWrap').hidden = true

    var items = Array.isArray(q.items) ? q.items : []
    var total = 0
    var body = $('qItems')
    items.forEach(function (it) {
      var amount = Number(it && it.amount) || 0
      total += amount
      var tr = document.createElement('tr')
      var th = document.createElement('th')
      th.scope = 'row'
      th.textContent = (it && it.label) || 'Item'
      var td = document.createElement('td')
      td.textContent = money(amount, q.currency)
      tr.appendChild(th)
      tr.appendChild(td)
      body.appendChild(tr)
    })
    $('qTotal').textContent = money(total, q.currency)

    var today = new Date()
    today.setHours(0, 0, 0, 0)
    var expired = q.status === 'open' && q.valid_until && new Date(q.valid_until + 'T23:59:59') < today
    var status = $('qStatus')
    var pay = $('qPay')

    if (q.status === 'paid') {
      status.textContent = 'Paid'
      status.className = 'quote-status is-paid'
      pay.innerHTML = '<div class="quote-done"><span class="sent-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><p></p></div>'
      pay.querySelector('p').textContent = q.paid_at ? 'Paid on ' + day(q.paid_at) + '. Thank you.' : 'Paid. Thank you.'
    } else if (expired) {
      status.textContent = 'Expired'
      status.className = 'quote-status is-off'
      pay.innerHTML = '<p class="quote-note"></p>'
      pay.firstChild.textContent = 'This quote ran out on ' + day(q.valid_until) + '. Write to me and I will send an updated one.'
    } else if (q.pay_url && /^https:\/\//.test(q.pay_url)) {
      var a = document.createElement('a')
      a.className = 'btn btn-primary btn-pay'
      a.href = q.pay_url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.innerHTML = '<span></span>' + ARROW
      a.firstChild.textContent = 'Pay ' + money(total, q.currency)
      pay.appendChild(a)
      var note = document.createElement('p')
      note.className = 'quote-note'
      note.textContent = q.pay_note || 'Opens the secure payment page in a new tab.'
      pay.appendChild(note)
    } else {
      pay.innerHTML = '<p class="quote-note">The payment option for this quote is being set up. I will email you as soon as it is ready.</p>'
    }
    show('quoteBody')
  }

  if (!token) return show('quoteMissing')

  fetch(SUPABASE_URL + '/rest/v1/rpc/get_quote', {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_token: token }),
  })
    .then(function (res) {
      if (!res.ok) throw new Error('get_quote failed: ' + res.status)
      return res.json()
    })
    .then(function (rows) {
      if (!rows || !rows.length) return show('quoteMissing')
      render(rows[0])
    })
    .catch(function (err) {
      console.warn(err)
      show('quoteMissing')
      $('quoteMissing').querySelector('h1').textContent = "Your quote didn't load."
      $('quoteMissing').querySelector('.quote-note').textContent = 'Check your connection and reload the page. If it keeps happening, write to me and I will send it by email.'
    })
})()
