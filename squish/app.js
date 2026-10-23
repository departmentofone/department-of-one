// Squish: re-encodes images with the browser's own encoders (canvas.toBlob), one at a time so a
// big batch never runs the tab out of memory. "Download all" builds a ZIP here, no library needed.
;(function () {
  const $ = (id) => document.getElementById(id)
  const fmt = $('format'), quality = $('quality'), maxSide = $('maxSide'), list = $('files')
  const EXT = { 'image/webp': 'webp', 'image/avif': 'avif', 'image/jpeg': 'jpg', 'image/png': 'png' }
  const MAX_CANVAS = 16384 // browsers refuse larger canvases
  let items = [] // { file, out, el }
  let queue = Promise.resolve()

  const saved = Kit.store.get('squish', null)
  if (saved) { fmt.value = saved.fmt; quality.value = saved.q; maxSide.value = saved.max }
  $('qv').textContent = quality.value
  function save() { Kit.store.set('squish', { fmt: fmt.value, q: quality.value, max: maxSide.value }) }

  // Some browsers can't encode AVIF (or WebP); toBlob then quietly returns a PNG. Detect it once.
  const support = {}
  async function canEncode(type) {
    if (type in support) return support[type]
    const c = document.createElement('canvas'); c.width = c.height = 2
    const blob = await new Promise((r) => c.toBlob(r, type, 0.8))
    return (support[type] = !!blob && blob.type === type)
  }
  ;(async () => {
    const missing = []
    for (const t of ['image/avif', 'image/webp']) if (!(await canEncode(t))) missing.push(EXT[t].toUpperCase())
    if (missing.length) $('support').textContent = 'This browser can\'t make ' + missing.join(' or ') + ' files; Squish will use WebP or JPEG instead.'
    document.querySelectorAll('#format option').forEach((o) => { if (missing.includes(EXT[o.value].toUpperCase())) o.textContent += ' (not in this browser)' })
  })()

  async function squish(file) {
    let type = fmt.value
    if (!(await canEncode(type))) type = (await canEncode('image/webp')) ? 'image/webp' : 'image/jpeg'
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    let w = bmp.width, h = bmp.height
    const limit = Math.min(+maxSide.value || Infinity, MAX_CANVAS)
    if (Math.max(w, h) > limit) { const s = limit / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s) }
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const ctx = c.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    // JPEG has no transparency; paint white underneath instead of letting it turn black.
    if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h) }
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close && bmp.close()
    const blob = await new Promise((r) => c.toBlob(r, type, +quality.value / 100))
    c.width = c.height = 0 // free the canvas memory right away
    if (!blob) throw new Error('encode failed')
    return { blob, type, w, h, name: file.name.replace(/\.[^.]+$/, '') + '.' + EXT[type] }
  }

  function row(item) {
    const el = document.createElement('div')
    el.className = 'sq-item'
    el.innerHTML = '<img alt="" /><div style="min-width:0"><div class="name"></div><div class="meta">Waiting…</div><div class="bar"><i></i></div></div><div class="acts"></div>'
    el.querySelector('.name').textContent = item.file.name
    el.querySelector('img').src = URL.createObjectURL(item.file)
    return el
  }
  function paint(item) {
    const el = item.el, meta = el.querySelector('.meta'), acts = el.querySelector('.acts')
    if (item.error) { meta.innerHTML = '<span class="worse">Couldn\'t read this one. Is it an image?</span>'; el.querySelector('.bar').remove(); return }
    const before = item.file.size, after = item.out.blob.size, diff = 1 - after / before
    meta.innerHTML = Kit.fmtBytes(before) + ' → ' + Kit.fmtBytes(after) + ' · ' + item.out.w + '×' + item.out.h + ' · ' +
      (diff > 0 ? '<span class="saved">' + Math.round(diff * 100) + '% smaller</span>' : '<span class="worse">' + Math.round(-diff * 100) + '% bigger, try another format</span>')
    const bar = el.querySelector('.bar'); if (bar) bar.remove()
    acts.innerHTML = '<button class="icon-btn" type="button" title="Compare" aria-label="Compare before and after"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18M7 8l-4 4 4 4M17 8l4 4-4 4"/></svg></button><button class="btn btn-primary btn-sm" type="button">Save</button>'
    acts.children[0].addEventListener('click', () => compare(item))
    acts.children[1].addEventListener('click', () => Kit.download(item.out.blob, item.out.name))
  }
  function totals() {
    const done = items.filter((i) => i.out)
    $('total').hidden = !items.length
    if (!done.length) { $('totalText').textContent = 'Squishing…'; return }
    const before = done.reduce((s, i) => s + i.file.size, 0), after = done.reduce((s, i) => s + i.out.blob.size, 0)
    $('totalText').textContent = done.length + ' of ' + items.length + ' done · ' + Kit.fmtBytes(before) + ' → ' + Kit.fmtBytes(after) + ' (' + Math.max(0, Math.round((1 - after / before) * 100)) + '% smaller)'
  }
  function process(item) {
    queue = queue.then(async () => {
      item.el.querySelector('.bar i').style.width = '60%'
      try { item.out = await squish(item.file) } catch (e) { item.error = true }
      paint(item); totals()
    })
  }

  function add(files) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif|avif|webp|jpe?g|png|gif|bmp)$/i.test(f.name))
    if (!imgs.length) return Kit.toast('No images in there')
    imgs.forEach((file) => {
      const item = { file }
      item.el = row(item)
      list.appendChild(item.el)
      items.push(item)
      process(item)
    })
    totals()
  }

  // ---------- compare slider (clip-path, no extra copies) ----------
  const dlg = $('cmpDialog'), cmp = $('cmp')
  function compare(item) {
    $('cmpBefore').src = item.el.querySelector('img').src
    if (item.afterUrl) URL.revokeObjectURL(item.afterUrl)
    item.afterUrl = URL.createObjectURL(item.out.blob)
    $('cmpAfter').src = item.afterUrl
    cmp.style.setProperty('--x', '50%')
    dlg.showModal()
  }
  let dragging = false
  function moveTo(e) { const r = cmp.getBoundingClientRect(); cmp.style.setProperty('--x', Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)) + '%') }
  cmp.addEventListener('pointerdown', (e) => { dragging = true; cmp.setPointerCapture(e.pointerId); moveTo(e) })
  cmp.addEventListener('pointermove', (e) => { if (dragging) moveTo(e) })
  cmp.addEventListener('pointerup', () => { dragging = false })
  $('cmpClose').addEventListener('click', () => dlg.close())
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close() })

  // ---------- ZIP (stored, no compression: the images are already compressed) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
  function crc32(bytes) { let c = 0xffffffff; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  async function zip(files) {
    const enc = new TextEncoder(), parts = [], central = []
    let offset = 0
    const used = {}
    for (const f of files) {
      let name = f.name
      if (used[name]) { used[name]++; name = name.replace(/(\.[^.]+)$/, '-' + used[name] + '$1') } else used[name] = 1
      const data = new Uint8Array(await f.blob.arrayBuffer())
      const nameBytes = enc.encode(name), crc = crc32(data)
      const local = new DataView(new ArrayBuffer(30))
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true)
      local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, nameBytes.length, true)
      parts.push(local.buffer, nameBytes, data)
      const cen = new DataView(new ArrayBuffer(46))
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true)
      cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true); cen.setUint16(28, nameBytes.length, true); cen.setUint32(42, offset, true)
      central.push(cen.buffer, nameBytes)
      offset += 30 + nameBytes.length + data.length
    }
    const cenSize = central.reduce((s, b) => s + b.byteLength, 0)
    const end = new DataView(new ArrayBuffer(22))
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cenSize, true); end.setUint32(16, offset, true)
    return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' })
  }

  // ---------- events ----------
  const drop = $('drop')
  $('file').addEventListener('change', (e) => { add(e.target.files); e.target.value = '' })
  ;['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over') }))
  ;['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')))
  drop.addEventListener('drop', (e) => { e.preventDefault(); add(e.dataTransfer.files) })
  window.addEventListener('paste', (e) => { const f = Array.from(e.clipboardData.files || []); if (f.length) add(f) })
  quality.addEventListener('input', () => { $('qv').textContent = quality.value; save() })
  ;[fmt, maxSide].forEach((el) => el.addEventListener('change', save))
  $('redo').addEventListener('click', () => items.forEach((item) => {
    item.out = null; item.error = false
    item.el.querySelector('.meta').textContent = 'Waiting…'
    if (!item.el.querySelector('.bar')) item.el.children[1].insertAdjacentHTML('beforeend', '<div class="bar"><i></i></div>')
    item.el.querySelector('.acts').innerHTML = ''
    process(item)
  }))
  $('zipBtn').addEventListener('click', async () => {
    const done = items.filter((i) => i.out)
    if (!done.length) return Kit.toast('Nothing squished yet')
    Kit.download(await zip(done.map((i) => ({ name: i.out.name, blob: i.out.blob }))), 'squished.zip')
  })
  $('clear').addEventListener('click', () => {
    items.forEach((i) => { URL.revokeObjectURL(i.el.querySelector('img').src); if (i.afterUrl) URL.revokeObjectURL(i.afterUrl) })
    items = []; list.innerHTML = ''; totals()
  })
})()
