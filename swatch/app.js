// Swatch: k-means in CIELAB on a downscaled copy of the photo (so it's fast even for huge images),
// seeded with k-means++ and run a few times to keep results stable. Everything stays on the device.
;(function () {
  const $ = (id) => document.getElementById(id)
  let pixels = null, palette = [], k = 6, format = 'hex', baseName = 'palette'

  // A small set of colour names; the nearest one (in Lab) names each swatch.
  const NAMES = {
    Black: '000000', Charcoal: '36454f', Graphite: '4b4f54', Slate: '708090', Grey: '8e8e8e', Silver: 'c0c0c0', 'Bone white': 'e9e4d4', White: 'ffffff',
    Cream: 'fff5d6', Sand: 'd8c3a5', Tan: 'c8a77e', Camel: 'b0844e', Brown: '7a4b2a', Chocolate: '4a2c1d', Coffee: '6f4e37', Rust: 'b7472a',
    Terracotta: 'cf6a4c', Brick: 'a23b2a', Red: 'd62828', Crimson: 'b0102f', Wine: '6e1f2e', Coral: 'ff7f61', Salmon: 'f49c84', Peach: 'ffc9a3',
    Orange: 'f57c1f', Tangerine: 'ff9f1c', Amber: 'ffbf00', Mustard: 'd4a72c', Gold: 'e2b33a', Lemon: 'fbe35a', Butter: 'f7e6a1', Olive: '7a7a35',
    Moss: '6b7d3f', Lime: 'a7d129', Sage: '9caf88', Mint: 'a8e6cf', Green: '2e9d4b', Forest: '1f5135', Emerald: '1f9d72', Teal: '128c8c',
    Turquoise: '30c5c0', Aqua: '7fdbe0', Sky: '87c4f0', 'Baby blue': 'bcdcf5', Blue: '2f6fdc', Cobalt: '1e4fbf', Navy: '15254f', Denim: '3d5a80',
    Indigo: '3f3d9e', Periwinkle: '9ea6f0', Lavender: 'c7b8ea', Lilac: 'b998d8', Purple: '7a3fb0', Plum: '5e2750', Magenta: 'c2348f', Pink: 'f28dbd',
    Rose: 'e05c7a', Blush: 'f4c2c8', Mauve: 'a27b8e', Taupe: '8b7d6b', Khaki: 'b9ae7e', Ochre: 'c48a2e',
  }

  // ---------- colour maths ----------
  function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  function rgbToLab(r, g, b) {
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b)
    let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
    let y = R * 0.2126 + G * 0.7152 + B * 0.0722
    let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
    x = f(x); y = f(y); z = f(z)
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
  }
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  function luminance(r, g, b) { return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b) }
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  const NAME_LAB = Object.entries(NAMES).map(([n, h]) => [n, rgbToLab(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16))])
  function nameOf(lab) {
    let best = '', bd = Infinity
    NAME_LAB.forEach(([n, l]) => { const d = (l[0] - lab[0]) ** 2 + (l[1] - lab[1]) ** 2 + (l[2] - lab[2]) ** 2; if (d < bd) { bd = d; best = n } })
    return best
  }

  // ---------- k-means ----------
  function kmeans(data, k) {
    const n = data.length / 6 // [L,a,b,r,g,b] per pixel
    const pick = () => Kit.randInt(n)
    let best = null
    for (let run = 0; run < 3; run++) {
      // k-means++ seeding
      const first = pick()
      const cent = [Array.from(data.slice(first * 6, first * 6 + 3))]
      const d2 = new Float64Array(n)
      while (cent.length < k) {
        let sum = 0
        for (let i = 0; i < n; i++) {
          let m = Infinity
          for (const c of cent) { const d = (data[i * 6] - c[0]) ** 2 + (data[i * 6 + 1] - c[1]) ** 2 + (data[i * 6 + 2] - c[2]) ** 2; if (d < m) m = d }
          d2[i] = m; sum += m
        }
        let r = (Kit.randInt(1e6) / 1e6) * sum, idx = 0
        while (idx < n - 1 && (r -= d2[idx]) > 0) idx++
        cent.push(Array.from(data.slice(idx * 6, idx * 6 + 3)))
      }
      const assign = new Int32Array(n)
      let err = 0
      for (let iter = 0; iter < 14; iter++) {
        const sums = cent.map(() => [0, 0, 0, 0, 0, 0, 0])
        err = 0
        for (let i = 0; i < n; i++) {
          let m = Infinity, mi = 0
          for (let c = 0; c < cent.length; c++) { const d = (data[i * 6] - cent[c][0]) ** 2 + (data[i * 6 + 1] - cent[c][1]) ** 2 + (data[i * 6 + 2] - cent[c][2]) ** 2; if (d < m) { m = d; mi = c } }
          assign[i] = mi; err += m
          const s = sums[mi]
          for (let j = 0; j < 6; j++) s[j] += data[i * 6 + j]
          s[6]++
        }
        sums.forEach((s, c) => { if (s[6]) cent[c] = [s[0] / s[6], s[1] / s[6], s[2] / s[6], s[3] / s[6], s[4] / s[6], s[5] / s[6], s[6]] })
      }
      if (!best || err < best.err) best = { err, cent: cent.map((c) => c.slice()) }
    }
    return best.cent.filter((c) => c[6]).sort((a, b) => b[6] - a[6]).map((c) => ({ lab: c.slice(0, 3), rgb: c.slice(3, 6), share: c[6] / n }))
  }

  // ---------- image loading ----------
  async function load(file) {
    if (!file || !file.type.startsWith('image/')) return Kit.toast('That file isn\'t an image')
    baseName = (file.name || 'palette').replace(/\.[^.]+$/, '') || 'palette'
    let bmp
    try { bmp = await createImageBitmap(file) } catch (e) { return Kit.toast('Couldn\'t read that image') }
    const scale = Math.min(1, 180 / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale))
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(bmp, 0, 0, w, h)
    const img = ctx.getImageData(0, 0, w, h).data
    const out = []
    for (let i = 0; i < img.length; i += 4) {
      if (img[i + 3] < 128) continue // skip transparent pixels
      const lab = rgbToLab(img[i], img[i + 1], img[i + 2])
      out.push(lab[0], lab[1], lab[2], img[i], img[i + 1], img[i + 2])
    }
    if (!out.length) return Kit.toast('That image is fully transparent')
    pixels = new Float64Array(out)
    const prev = $('preview')
    if (prev.src) URL.revokeObjectURL(prev.src)
    prev.src = URL.createObjectURL(file)
    $('result').hidden = false
    run()
    $('result').scrollIntoView({ behavior: Kit.reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  function run() {
    palette = kmeans(pixels, k).map((c) => {
      const [r, g, b] = c.rgb
      const L = luminance(r, g, b)
      return { ...c, hex: hex(r, g, b), name: nameOf(c.lab), onWhite: contrast(L, 1), onBlack: contrast(L, 0) }
    })
    render()
  }

  function render() {
    $('strip').innerHTML = palette.map((p) => '<i style="--w:' + p.share.toFixed(3) + ';background:' + p.hex + '"></i>').join('')
    const box = $('colors')
    box.innerHTML = ''
    palette.forEach((p) => {
      const textOn = p.onBlack > p.onWhite ? '#17171a' : '#ffffff'
      const best = Math.max(p.onWhite, p.onBlack)
      const row = document.createElement('div')
      row.className = 'color'
      row.innerHTML = '<span class="sw-dot" aria-hidden="true">Aa</span><div><b></b><div class="codes"></div><div class="pct"></div></div><button class="btn btn-ghost btn-sm" type="button">Copy</button>'
      row.querySelector('.sw-dot').style.cssText = 'background:' + p.hex + ';color:' + textOn
      row.querySelector('b').textContent = p.name
      const [r, g, b] = p.rgb.map(Math.round)
      row.querySelector('.codes').textContent = p.hex.toUpperCase() + ' · rgb(' + r + ', ' + g + ', ' + b + ')'
      row.querySelector('.pct').textContent = Math.round(p.share * 100) + '% of the photo · ' + (textOn === '#ffffff' ? 'white' : 'black') + ' text ' + best.toFixed(1) + ':1' + (best >= 4.5 ? ' (readable)' : ' (large text only)')
      row.querySelector('button').addEventListener('click', () => Kit.copy(p.hex.toUpperCase(), p.hex.toUpperCase() + ' copied'))
      box.appendChild(row)
    })
    renderCode()
  }

  const slug = (s, i) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-') + (i ? '-' + (i + 1) : '')
  function names() {
    const seen = {}
    return palette.map((p) => { const base = slug(p.name); seen[base] = (seen[base] || 0) + 1; return seen[base] > 1 ? base + '-' + seen[base] : base })
  }
  function renderCode() {
    const n = names()
    let text = ''
    if (format === 'hex') text = palette.map((p) => p.hex.toUpperCase()).join('\n')
    if (format === 'css') text = ':root {\n' + palette.map((p, i) => '  --' + n[i] + ': ' + p.hex + ';').join('\n') + '\n}'
    if (format === 'tw') text = 'colors: {\n' + palette.map((p, i) => "  '" + n[i] + "': '" + p.hex + "',").join('\n') + '\n}'
    if (format === 'json') text = JSON.stringify(palette.map((p, i) => ({ name: p.name, hex: p.hex, share: +p.share.toFixed(3) })), null, 2)
    $('code').textContent = text
  }

  // ---------- events ----------
  const drop = $('drop')
  $('file').addEventListener('change', (e) => { load(e.target.files[0]); e.target.value = '' })
  ;['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-over') }))
  ;['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')))
  drop.addEventListener('drop', (e) => { e.preventDefault(); load(e.dataTransfer.files[0]) })
  window.addEventListener('paste', (e) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (item) load(item.getAsFile())
  })
  document.querySelectorAll('#count button').forEach((b) => b.addEventListener('click', () => {
    k = +b.dataset.k
    document.querySelectorAll('#count button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    if (pixels) run()
  }))
  document.querySelectorAll('#formats button').forEach((b) => b.addEventListener('click', () => {
    format = b.dataset.f
    document.querySelectorAll('#formats button').forEach((x) => x.setAttribute('aria-selected', String(x === b)))
    renderCode()
  }))
  $('copyAll').addEventListener('click', () => Kit.copy($('code').textContent, 'Palette copied'))
})()
