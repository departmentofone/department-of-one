// The admin page script (moved out of admin.html so the Content-Security-Policy can forbid inline
// scripts on the one page that can write site content).
var SUPABASE_URL = 'https://uxmdzudoojexfcoircoo.supabase.co'
var SUPABASE_ANON_KEY = 'sb_publishable_JmN9P2H6oPKxcNh-jRPeEQ_aPc0NgLS'
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

var LABELS = {
  hero_eyebrow: 'Unused (old hero pill text)',
  hero_title_pre: 'Hero heading - before the italic word',
  hero_title_em: 'Hero heading - the italic word',
  hero_title_post: 'Hero heading - after the italic word',
  hero_lede: 'Hero - intro paragraph',
  work_title: 'Work - heading',
  fitlog_desc: 'FitLog card - description',
  fitlog_extras: 'FitLog card - "Also in it" row',
  fitlog_offline: 'FitLog card - "Offline" row',
  fitlog_install: 'FitLog card - "Install" row',
  fitlog_data: 'FitLog card - "Your data" row',
  more_soon_text: 'Next app line (under FitLog)',
  deal_title: 'How I work - heading',
  principle_1_title: 'How I work, point 1 - title',
  principle_1_desc: 'How I work, point 1 - text',
  principle_2_title: 'How I work, point 2 - title',
  principle_2_desc: 'How I work, point 2 - text',
  principle_3_title: 'How I work, point 3 - title',
  principle_3_desc: 'How I work, point 3 - text',
  principle_4_title: 'How I work, point 4 - title',
  principle_4_desc: 'How I work, point 4 - text',
  about_title: 'About - heading',
  about_body_1: 'About - first paragraph (large)',
  about_body_2: 'About - second paragraph',
  about_support: 'About - coffee paragraph (above the Buy me a coffee link)',
  request_title: 'Ideas band - heading',
  request_body: 'Ideas band - text',
  footer_tagline: 'Footer tagline',
  contact_title_pre: 'Contact page heading - before the italic word',
  contact_title_em: 'Contact page heading - the italic word',
  contact_intro: 'Contact page - intro line',
  contact_reason_1: 'Contact page - reason 1',
  contact_reason_2: 'Contact page - reason 2',
  contact_reason_3: 'Contact page - reason 3',
  contact_reason_4: 'Contact page - reason 4',
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
  var { data, error } = await sb.auth.signInWithPassword({ email: email, password: password })
  if (error) {
    errorEl.textContent = error.message
    return
  }
  showEditor(data.user)
}

sb.auth.getSession().then(function (res) {
  var session = res.data.session
  if (session) showEditor(session.user)
  else showLogin()
})
