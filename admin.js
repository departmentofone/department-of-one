// The admin page script (moved out of admin.html so the Content-Security-Policy can forbid inline
// scripts on the one page that can write site content).
var SUPABASE_URL = 'https://uxmdzudoojexfcoircoo.supabase.co'
var SUPABASE_ANON_KEY = 'sb_publishable_JmN9P2H6oPKxcNh-jRPeEQ_aPc0NgLS'
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

var LABELS = {
  s_hero_lede: 'Hero - intro paragraph',
  s_fitlog_desc: 'FitLog section - description',
  s_about_1: 'About - first paragraph (large)',
  s_about_2: 'About - second paragraph',
  s_about_support: 'About - coffee paragraph (above the Buy me a coffee link)',
  s_ideas_title: 'Ideas band - heading',
  s_ideas_body: 'Ideas band - text',
  s_inquiry_intro: 'Inquiry section - intro paragraph',
  s_footer_tagline: 'Footer tagline',
}
// Falls back to the raw key for anything added later that isn't in LABELS yet, so a new
// field is still editable here immediately - just without a friendly name until this map
// is updated.
function labelFor(key) {
  return LABELS[key] || key
}

var loginView = document.getElementById('loginView')
var editorView = document.getElementById('editorView')
var fieldsEl = document.getElementById('fields')
var whoami = document.getElementById('whoami')

function showLogin() {
  loginView.style.display = 'block'
  editorView.style.display = 'none'
  loadTurnstile()
}

// ---------- Cloudflare Turnstile for sign-in ----------
// Supabase Auth has CAPTCHA protection on (it also guards FitLog's sign-in), so every sign-in must
// carry a Turnstile token. Same widget and site key as FitLog and the inquiry form; Supabase checks
// the token with the secret set in its Auth settings.
var TURNSTILE_SITE_KEY = '0x4AAAAAAFJNfo4pofObKvVn'
var tsWidget = null
var tsNeedsTick = false
var tsLoading = false

window.adminTurnstileReady = function () {
  tsWidget = window.turnstile.render('#turnstileBox', {
    sitekey: TURNSTILE_SITE_KEY,
    action: 'admin',
    theme: 'dark',
    size: 'flexible',
    appearance: 'interaction-only',
    callback: function () { tsNeedsTick = false },
    'before-interactive-callback': function () { tsNeedsTick = true },
  })
}

function loadTurnstile() {
  if (tsLoading) return
  tsLoading = true
  var s = document.createElement('script')
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=adminTurnstileReady'
  s.async = true
  document.head.appendChild(s)
}

function turnstileToken() {
  return tsWidget !== null && window.turnstile ? window.turnstile.getResponse(tsWidget) || '' : ''
}

// The check usually finishes in a second or two; wait for it (up to 10 seconds) before signing in.
function waitForToken() {
  return new Promise(function (resolve) {
    var start = Date.now()
    ;(function poll() {
      var t = turnstileToken()
      if (t || tsNeedsTick || Date.now() - start > 10000) return resolve(t)
      setTimeout(poll, 150)
    })()
  })
}

// Only the site owner gets past sign-in. Any other FitLog account is signed out immediately.
// scope 'local' is important: a normal signOut() is global and would also log that person
// out of FitLog on every device.
async function isOwner() {
  var { data, error } = await sb.rpc('is_site_owner')
  return !error && data === true
}

async function rejectAccount() {
  await sb.auth.signOut({ scope: 'local' })
  showLogin()
  document.getElementById('loginError').textContent = "This account can't sign in here."
}


function escapeHtml(text) {
  var div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Remembers whether the inbox was left open or closed. Starts closed, so the editor is
// always right there; the "new" badge stays visible on the collapsed header either way.
var inboxEl = document.getElementById('inbox')
try {
  if (localStorage.getItem('inboxOpen') === '1') inboxEl.open = true
} catch (e) {}
inboxEl.addEventListener('toggle', function () {
  try {
    localStorage.setItem('inboxOpen', inboxEl.open ? '1' : '0')
  } catch (e) {}
})

async function loadInbox() {
  var box = document.getElementById('messages')
  var badge = document.getElementById('unreadBadge')
  var { data: msgs, error } = await sb.from('contact_messages').select('*').order('created_at', { ascending: false })
  if (error) {
    box.innerHTML = '<p class="sub">Could not load messages: ' + escapeHtml(error.message) + '</p>'
    return
  }
  var unread = msgs.filter(function (m) { return !m.is_read }).length
  badge.hidden = unread === 0
  badge.textContent = unread + ' new'
  if (msgs.length === 0) {
    box.innerHTML = '<p class="sub">No messages yet.</p>'
    return
  }
  box.innerHTML = ''
  msgs.forEach(function (m) {
    var el = document.createElement('div')
    el.className = 'msg' + (m.is_read ? '' : ' unread')
    var replyHref = 'mailto:' + encodeURIComponent(m.email) + '?subject=' + encodeURIComponent('Re: ' + m.subject)
    // Everything the sender typed goes in via escapeHtml/textContent - never as raw HTML.
    el.innerHTML =
      '<div class="msg-head"><span class="msg-subject">' + escapeHtml(m.subject) + '</span>' +
      '<span class="msg-date">' + new Date(m.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) + '</span></div>' +
      '<div class="msg-from">' + escapeHtml(m.email) + '</div>' +
      '<div class="msg-body"></div>' +
      '<div class="msg-actions"><a href="' + replyHref + '">Reply</a>' +
      '<button type="button" data-act="read">' + (m.is_read ? 'Mark unread' : 'Mark read') + '</button>' +
      '<button type="button" class="danger" data-act="delete">Delete</button></div>'
    el.querySelector('.msg-body').textContent = m.message
    el.querySelector('[data-act="read"]').onclick = async function () {
      await sb.from('contact_messages').update({ is_read: !m.is_read }).eq('id', m.id)
      loadInbox()
    }
    el.querySelector('[data-act="delete"]').onclick = async function () {
      if (!confirm('Delete this message for good?')) return
      await sb.from('contact_messages').delete().eq('id', m.id)
      loadInbox()
    }
    box.appendChild(el)
  })
}

async function showEditor(user) {
  if (!(await isOwner())) return rejectAccount()
  loginView.style.display = 'none'
  editorView.style.display = 'block'
  whoami.innerHTML = '<span class="who"></span><span class="who">·</span><a href="#" id="signOutLink">sign out</a>'
  whoami.querySelector('.who').textContent = user.email
  document.getElementById('signOutLink').onclick = async function (e) {
    e.preventDefault()
    await sb.auth.signOut({ scope: 'local' })
    location.reload()
  }

  loadInbox()
  loadQuotes()

  var { data: rows, error } = await sb.from('site_content').select('key,value').order('key')
  if (error) {
    // RLS denies writes to anyone but the site owner, but read is public - if THIS still
    // errors, something else is wrong (network, expired session), so say so plainly.
    fieldsEl.innerHTML = '<p style="color:#ef4444">Couldn\'t load content: ' + escapeHtml(error.message) + '</p>'
    return
  }

  fieldsEl.innerHTML = ''
  rows.forEach(function (row) {
    var card = document.createElement('div')
    card.className = 'field-card'
    card.innerHTML =
      '<span class="field-label">' + labelFor(row.key) + '</span>' +
      '<textarea></textarea>' +
      '<div class="field-row"><button class="btn btn-primary" style="padding:8px 16px; font-size:0.85rem">Save</button>' +
      '<span class="save-state"></span></div>'
    var textarea = card.querySelector('textarea')
    var button = card.querySelector('button')
    var stateEl = card.querySelector('.save-state')
    textarea.value = row.value

    button.onclick = async function () {
      button.disabled = true
      stateEl.textContent = 'Saving…'
      stateEl.className = 'save-state'
      var { error } = await sb.from('site_content').update({ value: textarea.value, updated_at: new Date().toISOString() }).eq('key', row.key)
      button.disabled = false
      if (error) {
        // Show the database's own message: the old "not the owner" guess was wrong once
        // already (it was a broken policy, not the wrong account).
        stateEl.textContent = 'Save failed: ' + error.message
        stateEl.className = 'save-state err'
      } else {
        stateEl.textContent = 'Saved ✓'
        stateEl.className = 'save-state ok'
        setTimeout(function () { stateEl.textContent = '' }, 2500)
      }
    }
    fieldsEl.appendChild(card)
  })
}

document.getElementById('signInBtn').onclick = async function () {
  var email = document.getElementById('email').value.trim()
  var password = document.getElementById('password').value
  var errorEl = document.getElementById('loginError')
  errorEl.textContent = ''
  var button = this
  button.disabled = true
  var captchaToken = await waitForToken()
  if (!captchaToken) {
    button.disabled = false
    errorEl.textContent = tsNeedsTick
      ? 'Tick "Verify you are human" above, then sign in again.'
      : "The bot check didn't load. Check your connection and reload the page."
    return
  }
  var { data, error } = await sb.auth.signInWithPassword({ email: email, password: password, options: { captchaToken: captchaToken } })
  // Each token works once, so get a fresh check ready for the next attempt.
  if (window.turnstile && tsWidget !== null) window.turnstile.reset(tsWidget)
  button.disabled = false
  if (error) {
    errorEl.textContent = error.message
    return
  }
  showEditor(data.user)
}

// ---------- Quotes (supabase/quotes.sql) ----------
// Each quote is a private page at /pay/<token>. Visitors can only reach one through its token, via
// the get_quote() function; this list reads the table directly, which only the owner may do.
var SITE = 'https://www.departmentofone.net'

function quoteLink(q) {
  return SITE + '/pay/' + q.token
}

function quoteTotal(q) {
  var total = (q.items || []).reduce(function (sum, it) { return sum + (Number(it.amount) || 0) }, 0)
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: q.currency }).format(total)
  } catch (e) {
    return total.toFixed(2) + ' ' + q.currency
  }
}

// "Design and build | 900" -> { label: 'Design and build', amount: 900 }. Returns null on a bad line.
function parseItems(text) {
  var items = []
  var lines = text.split('\n').map(function (l) { return l.trim() }).filter(Boolean)
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].split('|')
    var amount = Number(String(parts[parts.length - 1]).replace(/[^0-9.\-]/g, ''))
    var label = parts.slice(0, -1).join('|').trim()
    if (parts.length < 2 || !label || !isFinite(amount)) return null
    items.push({ label: label.slice(0, 200), amount: Math.round(amount * 100) / 100 })
  }
  return items.length ? items : null
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text)
    var old = button.textContent
    button.textContent = 'Copied'
    setTimeout(function () { button.textContent = old }, 1500)
  } catch (e) {
    window.prompt('Copy the link:', text)
  }
}

async function loadQuotes() {
  var box = document.getElementById('quoteList')
  var { data: quotes, error } = await sb.from('quotes').select('*').order('created_at', { ascending: false })
  if (error) {
    box.innerHTML = '<p class="sub">Could not load quotes: ' + escapeHtml(error.message) + '. Has supabase/quotes.sql been run?</p>'
    return
  }
  if (!quotes.length) {
    box.innerHTML = '<p class="sub">No quotes yet.</p>'
    return
  }
  box.innerHTML = ''
  quotes.forEach(function (q) {
    var el = document.createElement('div')
    el.className = 'q-item'
    el.innerHTML =
      '<div class="q-head"><span class="q-title"></span><span class="q-status ' + q.status + '">' + q.status + '</span></div>' +
      '<div class="q-meta"></div>' +
      '<div class="msg-actions" style="margin-top:10px">' +
      '<button type="button" data-act="copy">Copy link</button>' +
      '<a target="_blank" rel="noopener">Open</a>' +
      '<button type="button" data-act="payurl">' + (q.pay_url ? 'Change payment link' : 'Add payment link') + '</button>' +
      (q.status === 'open' ? '<button type="button" data-act="paid">Mark paid</button><button type="button" class="danger" data-act="void">Withdraw</button>' : '<button type="button" data-act="reopen">Reopen</button>') +
      '</div>'
    el.querySelector('.q-title').textContent = 'Q-' + String(q.quote_no).padStart(4, '0') + ' · ' + q.title
    el.querySelector('.q-meta').textContent = q.client_name + ' · ' + quoteTotal(q) + (q.valid_until ? ' · valid until ' + q.valid_until : '') + (q.pay_url ? '' : ' · no payment link yet')
    el.querySelector('a').href = quoteLink(q)
    el.querySelector('[data-act="copy"]').onclick = function () { copyText(quoteLink(q), this) }
    el.querySelector('[data-act="payurl"]').onclick = async function () {
      var url = window.prompt('Payment link for this quote (https://...). Leave empty to remove it.', q.pay_url || '')
      if (url === null) return
      url = url.trim()
      if (url && !/^https:\/\//.test(url)) return alert('The link has to start with https://')
      var { error } = await sb.from('quotes').update({ pay_url: url || null, updated_at: new Date().toISOString() }).eq('id', q.id)
      if (error) alert(error.message)
      loadQuotes()
    }
    function setStatus(status) {
      return async function () {
        if (status === 'void' && !confirm('Withdraw this quote? Its link will stop working.')) return
        var patch = { status: status, updated_at: new Date().toISOString(), paid_at: status === 'paid' ? new Date().toISOString() : null }
        var { error } = await sb.from('quotes').update(patch).eq('id', q.id)
        if (error) alert(error.message)
        loadQuotes()
      }
    }
    var paid = el.querySelector('[data-act="paid"]')
    if (paid) paid.onclick = setStatus('paid')
    var voidBtn = el.querySelector('[data-act="void"]')
    if (voidBtn) voidBtn.onclick = setStatus('void')
    var reopen = el.querySelector('[data-act="reopen"]')
    if (reopen) reopen.onclick = setStatus('open')
    box.appendChild(el)
  })
}

document.getElementById('quoteForm').addEventListener('submit', async function (e) {
  e.preventDefault()
  var state = document.getElementById('qfState')
  var made = document.getElementById('qfMade')
  var val = function (id) { return document.getElementById(id).value.trim() }
  state.className = 'save-state err'
  made.hidden = true
  var items = parseItems(document.getElementById('qfItems').value)
  var currency = val('qfCurrency').toUpperCase()
  var payUrl = val('qfPayUrl')
  if (!val('qfClient')) return (state.textContent = 'Add the client name.')
  if (!val('qfTitle')) return (state.textContent = 'Add a project title.')
  if (!items) return (state.textContent = 'Line items need "label | amount" on each line.')
  if (!/^[A-Z]{3}$/.test(currency)) return (state.textContent = 'Currency is a 3-letter code, like USD or EUR.')
  if (payUrl && !/^https:\/\//.test(payUrl)) return (state.textContent = 'The payment link has to start with https://')

  state.className = 'save-state'
  state.textContent = 'Creating…'
  var { data, error } = await sb.from('quotes').insert({
    client_name: val('qfClient'),
    client_email: val('qfEmail') || null,
    title: val('qfTitle'),
    scope: val('qfScope') || null,
    items: items,
    currency: currency,
    valid_until: val('qfValid') || null,
    pay_url: payUrl || null,
    pay_note: val('qfPayNote') || null,
  }).select().single()
  if (error) {
    state.className = 'save-state err'
    state.textContent = 'Could not create it: ' + error.message
    return
  }
  state.className = 'save-state ok'
  state.textContent = 'Created ✓'
  made.hidden = false
  made.textContent = 'Link: ' + quoteLink(data)
  this.reset()
  document.getElementById('qfCurrency').value = currency
  loadQuotes()
})

sb.auth.getSession().then(function (res) {
  var session = res.data.session
  if (session) showEditor(session.user)
  else showLogin()
})
