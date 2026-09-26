// POST /api/contact - the contact form's only endpoint. Stores the message in Supabase
// (contact_messages, migration_v27 in the FitLog repo; read from the admin page's inbox) and
// emails a copy to the owner through Gmail, with Reply-To set to the sender so replying from
// Gmail just works.
//
// Environment variables (Vercel -> this project -> Settings -> Environment Variables):
//   GMAIL_USER          departmentofone.app@gmail.com
//   GMAIL_APP_PASSWORD  a Gmail "app password" (16 characters), NOT the account password
//   CONTACT_TO          optional; where to send copies, defaults to GMAIL_USER
// Without the Gmail ones, messages are still stored - only the email copy is skipped.
//
// The FitLog app posts here too (its Send feedback form), from another origin - hence the CORS
// allow-list below. It sends `source: "fitlog"` plus a short `context` line (app build, platform,
// signed-in account) so its messages are labelled in the inbox and the email.
const nodemailer = require('nodemailer')

const SUPABASE_URL = 'https://uxmdzudoojexfcoircoo.supabase.co'
// Publishable key: safe to ship, RLS only lets it insert into contact_messages.
const SUPABASE_ANON_KEY = 'sb_publishable_JmN9P2H6oPKxcNh-jRPeEQ_aPc0NgLS'
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// Origins allowed to call this from a browser besides this site itself: FitLog in production, its
// preview deployments, and local development.
const FITLOG_ORIGINS = new Set(['https://fitlog-two-gamma.vercel.app', 'http://localhost:5173'])
const FITLOG_PREVIEW_RE = /^https:\/\/fitlog-[a-z0-9-]+-fit-log\.vercel\.app$/
const SOURCES = { fitlog: 'FitLog' }

function allowCors(req, res) {
  const origin = req.headers.origin
  if (!origin || !(FITLOG_ORIGINS.has(origin) || FITLOG_PREVIEW_RE.test(origin))) return
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

// Single line, trimmed, capped - it ends up in the stored message and the email body.
function cleanContext(value) {
  return typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').trim().slice(0, 300) : ''
}

function validate(body) {
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message : ''
  if (!subject || subject.length > 200) return { error: 'Add a subject (up to 200 characters).' }
  if (email.length > 320 || !EMAIL_RE.test(email)) return { error: "That email address doesn't look right." }
  if (!message.trim() || message.length > 5000) return { error: 'Write a message (up to 5,000 characters).' }
  const label = SOURCES[body.source] || null
  return { subject, email, message, label, context: label ? cleanContext(body.context) : '' }
}

// What goes into contact_messages: app messages get their label on the subject (the admin inbox
// shows subjects) and the context under the message. Kept within the table's check limits.
function toRow(msg) {
  const subject = (msg.label ? `[${msg.label}] ${msg.subject}` : msg.subject).slice(0, 200)
  const message = (msg.context ? `${msg.message}\n\n--\n${msg.context}` : msg.message).slice(0, 5000)
  return { subject, email: msg.email, message }
}

async function store(msg) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(toRow(msg)),
  })
  if (!res.ok) throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`)
}

async function forward(msg) {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return false
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
  await transport.sendMail({
    from: `"${msg.label || 'Department of One site'}" <${user}>`,
    to: process.env.CONTACT_TO || user,
    replyTo: msg.email,
    // Line breaks in a subject could smuggle in extra mail headers.
    subject: `[${msg.label || 'Contact'}] ${msg.subject.replace(/[\r\n]+/g, ' ')}`,
    // Plain text, so the sender's line breaks arrive exactly as typed.
    text: msg.label
      ? `From: ${msg.email}\n\n${msg.message}\n\n-- \n${msg.context || msg.label}\nSent from the ${msg.label} app's feedback form. Reply to this email to answer them.`
      : `From: ${msg.email}\n\n${msg.message}\n\n-- \nSent from the contact form on department-of-one.vercel.app. Reply to this email to answer them.`,
  })
  return true
}

module.exports = async function handler(req, res) {
  allowCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'Invalid request.' })
    }
  }
  body = body || {}

  // Honeypot: a hidden field people never see but bots fill in. Look successful, do nothing.
  if (body.website) return res.status(200).json({ ok: true })

  const msg = validate(body)
  if (msg.error) return res.status(400).json({ error: msg.error })

  // Either copy is enough: stored-but-not-emailed still shows in the admin inbox, and
  // emailed-but-not-stored still reached the owner. Only both failing is an error.
  const [stored, emailed] = await Promise.allSettled([store(msg), forward(msg)])
  if (stored.status === 'rejected') console.error(stored.reason)
  if (emailed.status === 'rejected') console.error(emailed.reason)
  const emailedOk = emailed.status === 'fulfilled' && emailed.value === true

  if (stored.status === 'rejected' && !emailedOk) {
    return res.status(502).json({ error: "Couldn't send right now - please try again in a minute." })
  }
  return res.status(200).json({ ok: true })
}
