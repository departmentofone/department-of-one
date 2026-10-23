// Beam: device-to-device transfer over a WebRTC data channel (encrypted with DTLS by the browser).
// Supabase Realtime is used only to introduce the two devices (a broadcast channel named after a
// random room code carries the offer, answer and ICE candidates); file and text data never touch it.
;(function () {
  const $ = (id) => document.getElementById(id)
  const SUPABASE_URL = 'https://uxmdzudoojexfcoircoo.supabase.co'
  const SUPABASE_ANON_KEY = 'sb_publishable_JmN9P2H6oPKxcNh-jRPeEQ_aPc0NgLS'
  const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o, 1/l/i
  const CHUNK = 16 * 1024 // safe for every browser's data channel
  const HIGH = 1024 * 1024, LOW = 256 * 1024
  const MAX_FILE = 2 * 1024 * 1024 * 1024 // kept in memory on the receiving side, so cap it

  const me = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('')
  let sb = null, channel = null, pc = null, dc = null, room = '', host = false, iceServers = null, relay = false, peer = ''
  let waitTimer = 0, sending = Promise.resolve(), incoming = null, sigQueue = Promise.resolve(), pendingIce = []
  async function flushCandidates() {
    const list = pendingIce
    pendingIce = []
    for (const c of list) { try { await pc.addIceCandidate(c) } catch (e) {} }
  }

  // ---------- UI helpers ----------
  function status(text, kind) {
    const s = $('status')
    s.className = 'status' + (kind ? ' ' + kind : '')
    s.lastChild.textContent = text
  }
  const connected = () => dc && dc.readyState === 'open'
  function setReady(on) {
    $('dropHint').textContent = on ? 'Or click to choose. Any type, up to 2 GB each.' : 'Connect another device first.'
    $('drop').style.opacity = on ? '' : '0.6'
  }
  function newRoom() {
    let s = ''
    for (let i = 0; i < 8; i++) s += ALPHABET[Kit.randInt(ALPHABET.length)]
    return s
  }
  const pretty = (r) => r.slice(0, 4) + '-' + r.slice(4)

  // ---------- ICE servers ----------
  async function loadIce() {
    if (iceServers) return iceServers
    try {
      const r = await fetch('/api/turn')
      const j = await r.json()
      iceServers = j.iceServers; relay = !!j.relay
    } catch (e) {
      iceServers = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }]; relay = false
    }
    return iceServers
  }

  // ---------- signalling ----------
  function signal(msg) { if (channel) channel.send({ type: 'broadcast', event: 'signal', payload: { ...msg, from: me } }) }
  async function openRoom(code, asHost) {
    room = code; host = asHost
    if (!window.supabase) { status('Couldn\'t load. Check your connection and reload.', ''); return }
    sb = sb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    if (channel) await sb.removeChannel(channel)
    channel = sb.channel('beam-' + code, { config: { broadcast: { self: false, ack: false } } })
    // Handle signals strictly one at a time, in arrival order: offer/answer handling is async, and an
    // ICE candidate processed in the middle of it would otherwise be lost.
    channel.on('broadcast', { event: 'signal' }, ({ payload }) => { sigQueue = sigQueue.then(() => onSignal(payload)).catch((e) => console.warn('beam signal', e)) })
    status('Connecting to the meeting point…', 'wait')
    channel.subscribe((s) => {
      if (s === 'SUBSCRIBED') {
        if (host) { status('Waiting for your other device…', 'wait'); $('hint').textContent = '' }
        else { status('Looking for the other device…', 'wait'); signal({ type: 'hello' }); waitHint() }
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
        status('Couldn\'t reach the meeting point. Retrying…', 'wait')
      }
    })
    history.replaceState(null, '', '#' + code)
    $('leaveBtn').hidden = false
    loadIce()
  }
  function waitHint() {
    clearTimeout(waitTimer)
    waitTimer = setTimeout(() => { if (!connected()) $('hint').textContent = 'Still waiting. Make sure Beam is open on the other device with the same code.' }, 10000)
  }
  async function onSignal(m) {
    if (!m || m.from === me) return
    if (m.type === 'hello' && host) {
      peer = m.from
      await makePeer()
      dc = pc.createDataChannel('beam', { ordered: true })
      wireChannel()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      signal({ type: 'offer', sdp: pc.localDescription, to: peer })
    } else if (m.type === 'offer' && !host && m.to === me) {
      peer = m.from
      await makePeer()
      await pc.setRemoteDescription(m.sdp)
      await flushCandidates()
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      signal({ type: 'answer', sdp: pc.localDescription, to: peer })
    } else if (m.type === 'answer' && host && m.to === me && pc) {
      await pc.setRemoteDescription(m.sdp)
      await flushCandidates()
    } else if (m.type === 'ice' && pc && m.to === me && m.candidate) {
      // Candidates can arrive before the other side's description; hold them until it's set.
      if (!pc.remoteDescription) pendingIce.push(m.candidate)
      else { try { await pc.addIceCandidate(m.candidate) } catch (e) {} }
    } else if (m.type === 'bye' && m.from === peer) {
      closePeer(); status('The other device left.', '')
    }
  }
  async function makePeer() {
    closePeer()
    pc = new RTCPeerConnection({ iceServers: await loadIce() })
    pc.onicecandidate = (e) => { if (e.candidate) signal({ type: 'ice', candidate: e.candidate.toJSON(), to: peer }) }
    pc.ondatachannel = (e) => { dc = e.channel; wireChannel() }
    pc.onconnectionstatechange = () => {
      const st = pc && pc.connectionState
      if (st === 'connecting') status('Connecting…', 'wait')
      if (st === 'failed') {
        status('Couldn\'t connect the two devices.', '')
        $('hint').textContent = relay ? 'Try again, or put both devices on the same Wi-Fi.' : 'Some networks (mobile data, offices, schools) block direct connections. Put both devices on the same Wi-Fi and try again.'
        setReady(false)
      }
      if (st === 'disconnected') status('Connection dropped. Reconnecting…', 'wait')
    }
  }
  function closePeer() {
    try { dc && dc.close() } catch (e) {}
    try { pc && pc.close() } catch (e) {}
    dc = null; pc = null; incoming = null; pendingIce = []
    setReady(false)
  }

  // ---------- data channel ----------
  function wireChannel() {
    dc.binaryType = 'arraybuffer'
    dc.bufferedAmountLowThreshold = LOW
    dc.onopen = () => { clearTimeout(waitTimer); status('Connected', 'ok'); $('hint').textContent = 'Drop files or send text in either direction.'; setReady(true) }
    dc.onclose = () => { if (pc) { status('Disconnected', ''); setReady(false) } }
    dc.onmessage = (e) => {
      if (typeof e.data === 'string') {
        let m
        try { m = JSON.parse(e.data) } catch (err) { return }
        if (m.t === 'text') addText(String(m.text || '').slice(0, 100000), false)
        if (m.t === 'file') {
          if (!(m.size >= 0 && m.size <= MAX_FILE)) return
          incoming = { meta: m, parts: [], got: 0, row: addFileRow(m.name, m.size, m.mime, false) }
          if (m.size === 0) finishIncoming()
        }
        if (m.t === 'end' && incoming) finishIncoming()
      } else if (incoming) {
        incoming.parts.push(e.data)
        incoming.got += e.data.byteLength
        progress(incoming.row, incoming.got / incoming.meta.size)
        if (incoming.got > incoming.meta.size) { incoming = null } // misbehaving sender, drop it
      }
    }
  }
  function finishIncoming() {
    const { meta, parts, row } = incoming
    incoming = null
    const blob = new Blob(parts, { type: meta.mime || 'application/octet-stream' })
    doneRow(row, blob, meta.name)
  }
  function waitDrain() {
    return new Promise((resolve) => {
      if (dc.bufferedAmount < HIGH) return resolve()
      const on = () => { dc.removeEventListener('bufferedamountlow', on); resolve() }
      dc.addEventListener('bufferedamountlow', on)
    })
  }
  function sendFile(file) {
    if (!connected()) return Kit.toast('Connect another device first')
    if (file.size > MAX_FILE) return Kit.toast(file.name + ' is over 2 GB')
    const row = addFileRow(file.name, file.size, file.type, true)
    sending = sending.then(async () => {
      if (!connected()) return failRow(row)
      dc.send(JSON.stringify({ t: 'file', name: file.name.slice(0, 255), size: file.size, mime: file.type.slice(0, 100) }))
      for (let off = 0; off < file.size; off += CHUNK) {
        if (!connected()) return failRow(row)
        await waitDrain()
        dc.send(await file.slice(off, off + CHUNK).arrayBuffer())
        progress(row, Math.min(1, (off + CHUNK) / file.size))
      }
      dc.send(JSON.stringify({ t: 'end' }))
      doneRow(row, null, file.name)
    })
  }

  // ---------- feed ----------
  const ICON_FILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>'
  const ICON_TEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 6h14M5 11h14M5 16h9"/></svg>'
  function addFileRow(name, size, mime, mine) {
    const el = document.createElement('div')
    el.className = 'item' + (mine ? ' mine' : '')
    el.innerHTML = '<div class="ico-box">' + ICON_FILE + '</div><div style="min-width:0"><div class="nm"></div><div class="sub"></div><div class="bar"><i></i></div></div><div class="act"></div>'
    el.querySelector('.nm').textContent = name
    el.querySelector('.sub').textContent = (mine ? 'Sending · ' : 'Receiving · ') + Kit.fmtBytes(size)
    el.dataset.mime = mime || ''
    $('feed').prepend(el)
    return el
  }
  function progress(row, f) { const i = row.querySelector('.bar i'); if (i) i.style.width = Math.round(f * 100) + '%' }
  function failRow(row) { row.querySelector('.sub').textContent = 'Stopped: the connection closed'; const b = row.querySelector('.bar'); if (b) b.remove() }
  function doneRow(row, blob, name) {
    const bar = row.querySelector('.bar'); if (bar) bar.remove()
    const sub = row.querySelector('.sub')
    if (!blob) { sub.textContent = 'Sent · ' + sub.textContent.split(' · ')[1]; return }
    sub.textContent = 'Received · ' + Kit.fmtBytes(blob.size)
    if (/^image\//.test(blob.type) && blob.size < 30 * 1024 * 1024) { const img = document.createElement('img'); img.src = URL.createObjectURL(blob); img.alt = ''; row.querySelector('.ico-box').replaceChildren(img) }
    const b = document.createElement('button')
    b.className = 'btn btn-primary btn-sm'; b.type = 'button'; b.textContent = 'Save'
    b.addEventListener('click', () => Kit.download(blob, name))
    row.querySelector('.act').appendChild(b)
  }
  function addText(text, mine) {
    const el = document.createElement('div')
    el.className = 'item' + (mine ? ' mine' : '')
    el.innerHTML = '<div class="ico-box">' + ICON_TEXT + '</div><div style="min-width:0"><div class="txt"></div><div class="sub"></div></div><div class="act"></div>'
    el.querySelector('.txt').textContent = text
    el.querySelector('.sub').textContent = mine ? 'Sent' : 'Received'
    const copy = document.createElement('button')
    copy.className = 'btn btn-ghost btn-sm'; copy.type = 'button'; copy.textContent = 'Copy'
    copy.addEventListener('click', () => Kit.copy(text))
    el.querySelector('.act').appendChild(copy)
    if (!mine && /^https?:\/\/\S+$/.test(text.trim())) {
      const open = document.createElement('a')
      open.className = 'btn btn-primary btn-sm'; open.textContent = 'Open'; open.href = text.trim(); open.target = '_blank'; open.rel = 'noopener noreferrer'
      el.querySelector('.act').appendChild(open)
    }
    $('feed').prepend(el)
  }

  // ---------- room UI ----------
  function showRoom(code, asHost) {
    $('startView').hidden = true
    $('roomView').hidden = !asHost
    if (asHost) {
      const link = location.origin + '/beam#' + code
      $('code').textContent = pretty(code)
      $('shortLink').textContent = location.host + '/beam'
      if (window.qrcode) {
        const qr = window.qrcode(0, 'M')
        qr.addData(link)
        qr.make()
        $('qr').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true })
      } else $('qr').textContent = link
    }
  }
  function leave() {
    signal({ type: 'bye' })
    closePeer()
    if (channel && sb) sb.removeChannel(channel)
    channel = null; room = ''
    history.replaceState(null, '', location.pathname)
    $('startView').hidden = false; $('roomView').hidden = true; $('leaveBtn').hidden = true
    $('hint').textContent = ''
    status('Not connected', '')
  }

  $('startBtn').addEventListener('click', () => { const code = newRoom(); showRoom(code, true); openRoom(code, true) })
  $('joinForm').addEventListener('submit', (e) => {
    e.preventDefault()
    const code = $('joinCode').value.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (code.length !== 8 || [...code].some((c) => !ALPHABET.includes(c))) return Kit.toast('Codes are 8 letters and numbers, like abcd-efgh')
    showRoom(code, false); openRoom(code, false)
  })
  $('leaveBtn').addEventListener('click', leave)
  const drop = $('drop')
  $('file').addEventListener('change', (e) => { Array.from(e.target.files).forEach(sendFile); e.target.value = '' })
  ;['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over') }))
  ;['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')))
  drop.addEventListener('drop', (e) => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(sendFile) })
  drop.addEventListener('click', (e) => { if (!connected()) { e.preventDefault(); Kit.toast('Connect another device first') } })
  $('textForm').addEventListener('submit', (e) => {
    e.preventDefault()
    const t = $('text').value
    if (!t.trim()) return
    if (!connected()) return Kit.toast('Connect another device first')
    dc.send(JSON.stringify({ t: 'text', text: t.slice(0, 100000) }))
    addText(t, true)
    $('text').value = ''
  })
  $('text').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('textForm').requestSubmit() } })
  window.addEventListener('paste', (e) => { if (connected() && !e.target.closest('textarea, input')) Array.from(e.clipboardData.files || []).forEach(sendFile) })
  window.addEventListener('beforeunload', () => signal({ type: 'bye' }))
  if (!window.RTCPeerConnection) { status('This browser can\'t do direct transfers.', ''); $('startBtn').disabled = true }

  setReady(false)
  // Opened from a QR code or link: join that room straight away.
  const fromHash = location.hash.slice(1).toLowerCase().replace(/[^a-z0-9]/g, '')
  if (fromHash.length === 8) { showRoom(fromHash, false); openRoom(fromHash, false) }
})()
