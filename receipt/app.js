// Receipt: draws a thermal-paper receipt on a canvas, 576 px wide (an 80 mm printer at 203 dpi),
// so the saved PNG prints at true size on real receipt printers too.
;(function () {
  const $ = (id) => document.getElementById(id)
  const canvas = $('receipt'), ctx = canvas.getContext('2d')
  const fields = ['shop', 'period', 'items', 'cashier']
  const DEFAULT = 'Woke up on time\nCoffee | 10m\nAnswered all the emails | 45m\nFixed the bug from Tuesday | 1h 30m\nWent for a walk | 30m\nDid not doomscroll (mostly)'
  const saved = Kit.store.get('receipt', null)
  if (saved) fields.forEach((f) => { if (saved[f] != null) $(f).value = saved[f] })
  else $('items').value = DEFAULT

  const W = 576, PAD = 36, FONT = '"Geist Mono", ui-monospace, Consolas, monospace'
  const COLS = 40 // characters per line at the body size

  function parseTime(s) {
    if (!s) return 0
    let m = 0
    const h = s.match(/(\d+(?:[.,]\d+)?)\s*h/i), mm = s.match(/(\d+)\s*m/i)
    if (h) m += parseFloat(h[1].replace(',', '.')) * 60
    if (mm) m += parseInt(mm[1], 10)
    if (!h && !mm && /^\d+$/.test(s.trim())) m = parseInt(s, 10)
    return Math.round(m)
  }
  const fmtTime = (m) => (m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '') : m + 'm')
  function wrap(text, width) {
    const words = text.split(/\s+/), lines = []
    let line = ''
    words.forEach((w) => {
      if ((line + ' ' + w).trim().length > width) { if (line) lines.push(line); line = w.length > width ? w.slice(0, width) : w }
      else line = (line + ' ' + w).trim()
    })
    if (line) lines.push(line)
    return lines.length ? lines : ['']
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

  function draw() {
    const items = $('items').value.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 60).map((l) => {
      const [name, time] = l.split('|')
      return { name: name.trim() || '...', mins: parseTime(time || '') }
    })
    const now = new Date()
    const periodText = { today: 'TODAY', week: 'THIS WEEK', month: 'THIS MONTH', year: 'THIS YEAR' }[$('period').value]
    // Lay out lines first so the canvas can be exactly as tall as the receipt.
    const lines = []
    const L = (text, opts = {}) => lines.push({ text, ...opts })
    wrap($('shop').value.toUpperCase() || 'THE SHOP', 22).forEach((t) => L(t, { size: 34, bold: true, center: true }))
    L('Receipt for ' + periodText.toLowerCase(), { center: true, gap: 6 })
    L(now.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) + '  ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }), { center: true })
    L('-'.repeat(COLS), { gap: 10 })
    let total = 0
    items.forEach((it, i) => {
      total += it.mins
      const price = it.mins ? fmtTime(it.mins) : 'DONE'
      const w = wrap((i + 1 + '. ').padEnd(4) + it.name, COLS - price.length - 2)
      w.forEach((t, j) => L(j === w.length - 1 ? t + ' '.repeat(COLS - t.length - price.length) + price : t))
    })
    if (!items.length) L('Nothing yet. Go do something!', { center: true })
    L('-'.repeat(COLS))
    L('ITEMS' + String(items.length).padStart(COLS - 5), { bold: true })
    if (total) L('TIME' + fmtTime(total).padStart(COLS - 4), { bold: true })
    L('TOTAL' + 'PRICELESS'.padStart(COLS - 5), { bold: true, gap: 6 })
    L('-'.repeat(COLS), { gap: 6 })
    L('Cashier: ' + ($('cashier').value || 'You'), {})
    L('No refunds on time well spent.', { gap: 4 })
    L('', { barcode: true, gap: 16 })
    L('THANK YOU, COME AGAIN TOMORROW', { center: true, bold: true, gap: 10 })

    const lineH = (l) => (l.size || 22) * 1.35 + (l.gap || 0)
    const BAR_H = 90
    const H = Math.round(PAD * 2 + 30 + lines.reduce((s, l) => s + (l.barcode ? BAR_H + (l.gap || 0) : lineH(l)), 0))
    canvas.width = W
    canvas.height = H

    // Paper with a torn zigzag top and bottom.
    ctx.clearRect(0, 0, W, H)
    ctx.beginPath()
    const tooth = 12
    ctx.moveTo(0, tooth)
    for (let x = 0; x <= W; x += tooth) ctx.lineTo(x, x / tooth % 2 ? 0 : tooth)
    ctx.lineTo(W, H - tooth)
    for (let x = W; x >= 0; x -= tooth) ctx.lineTo(x, x / tooth % 2 ? H : H - tooth)
    ctx.closePath()
    ctx.fillStyle = '#fbfaf6'
    ctx.fill()
    // Faint thermal grain.
    const seed = hash($('items').value + $('shop').value)
    let r = seed
    const rnd = () => ((r = Math.imul(r ^ (r >>> 15), 2246822519) >>> 0) / 4294967296)
    ctx.save(); ctx.clip()
    ctx.fillStyle = 'rgba(0,0,0,0.035)'
    for (let i = 0; i < 1400; i++) ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4)
    ctx.restore()

    ctx.fillStyle = '#1d1d1f'
    ctx.textBaseline = 'top'
    let y = PAD + 14
    const charW = (W - PAD * 2) / COLS
    lines.forEach((l) => {
      y += l.gap || 0
      if (l.barcode) {
        // Pseudo barcode from the receipt's content: thin and thick bars.
        let x = PAD + 40, b = seed
        while (x < W - PAD - 40) {
          b = Math.imul(b ^ (b >>> 13), 1274126177) >>> 0
          const w = 2 + (b % 4) * 1.6
          if ((b >> 5) & 1) ctx.fillRect(x, y, w, BAR_H - 26)
          x += w + 2
        }
        ctx.font = '400 15px ' + FONT
        ctx.textAlign = 'center'
        ctx.fillText(String(seed).padStart(10, '0').replace(/(\d{4})(?=\d)/g, '$1 '), W / 2, y + BAR_H - 20)
        ctx.textAlign = 'left'
        y += BAR_H
        return
      }
      const size = l.size || 22
      ctx.font = (l.bold ? '600 ' : '400 ') + size + 'px ' + FONT
      if (l.center) { ctx.textAlign = 'center'; ctx.fillText(l.text, W / 2, y); ctx.textAlign = 'left' }
      else if (size === 22) { for (let i = 0; i < l.text.length; i++) ctx.fillText(l.text[i], PAD + i * charW, y) } // fixed columns
      else ctx.fillText(l.text, PAD, y)
      y += size * 1.35
    })
  }

  let pending = 0
  function update() {
    Kit.store.set('receipt', Object.fromEntries(fields.map((f) => [f, $(f).value])))
    cancelAnimationFrame(pending)
    pending = requestAnimationFrame(draw)
  }
  fields.forEach((f) => $(f).addEventListener('input', update))

  const toBlob = () => new Promise((res) => canvas.toBlob(res, 'image/png'))
  const fileName = () => 'receipt-' + new Date().toISOString().slice(0, 10) + '.png'
  $('saveBtn').addEventListener('click', async () => Kit.download(await toBlob(), fileName()))
  if (navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })) {
    $('shareBtn').hidden = false
    $('shareBtn').addEventListener('click', async () => {
      try { await navigator.share({ files: [new File([await toBlob()], fileName(), { type: 'image/png' })], title: 'My receipt' }) } catch (e) {}
    })
  }
  $('printBtn').addEventListener('click', () => window.print())

  // Draw once now, and again when the mono font has loaded so the columns line up.
  draw()
  if (document.fonts) document.fonts.load('22px "Geist Mono"').then(draw).catch(() => {})
})()
