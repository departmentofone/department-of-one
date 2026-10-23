"""Builds the site's static pages from the list of things on the shelf.

Run from the repo root:  python tools/shelf.py
Edit SHELF below to add a thing, change its status or give it a link; the cards, the detail
sheets and the counts in index.html all come from here. Pages stay plain static HTML (no build
step on Vercel); this script only saves typing.
"""
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GITHUB = 'https://github.com/departmentofone'
COFFEE = 'https://buymeacoffee.com/department.of.one'
EMAIL = 'departmentofone.app@gmail.com'

# Simple line icons drawn on a 24px grid, white on the tile colour.
ICONS = {
    'mountains': '<path d="M2.5 19.5 9 10l4 5.5 2.5-3.5 6 7.5z" fill="currentColor" stroke="none"/><circle cx="17" cy="6.5" r="2.2" fill="currentColor" stroke="none"/>',
    'squish': '<path d="M4 4l5 5M20 4l-5 5M4 20l5-5M20 20l-5-5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.2" fill="currentColor"/>',
    'qr': '<rect x="3.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.4"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.4"/><path d="M14.5 14.5h2.5v2.5M20.5 14.5v6h-3M14.5 20.5h.01"/>',
    'note': '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="16.5" cy="16" r="2.6"/>',
    'meter': '<circle cx="12" cy="13" r="8"/><path d="M12 13l3.5-3.5M12 2.5v2.5M9.5 2.5h5"/>',
    'bowl': '<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 7.5c0-1.2 1-1.6 1-2.8M12 7.5c0-1.2 1-1.6 1-2.8M16 7.5c0-1.2 1-1.6 1-2.8"/>',
    'swatch': '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="14.5" r="5"/>',
    'sprout': '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6.5 7.5-6.5 0 4.2-3 6.5-7.5 6.5zM12 14c0-3-2.2-5.3-6.5-5.3 0 3.2 2.2 5.3 6.5 5.3z"/><path d="M7.5 21h9"/>',
    'globe': '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5S14.6 18.1 12 20.5M12 3.5C9.4 5.9 8.2 8.7 8.2 12s1.2 6.1 3.8 8.5"/>',
    'breath': '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><rect x="8.5" y="8.5" width="7" height="7" rx="2"/>',
    'type': '<path d="M3.5 18.5 8 5.5h1L13.5 18.5M5.2 14h6.6"/><path d="M20.5 18.5v-6.2a2.8 2.8 0 0 0-5.3-1.2M20.5 15.5c0 1.9-1.5 3.2-3.2 3.2-1.4 0-2.3-.8-2.3-2 0-1.4 1.3-2.2 3.2-2.2h2.3"/>',
    'receipt': '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    'window': '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M12 3.5v17M3.5 12h17"/><path d="M6.5 8.6c.3-1 1.1-1.6 2-1.6.6 0 1.1.3 1.4.7.2-.1.4-.1.6-.1.8 0 1.4.6 1.4 1.4" stroke-width="1.6"/>',
    'cursor': '<path d="M5 3.5l13 7-5.5 1.5L10 17.5z"/><circle cx="17.5" cy="17.5" r="1.4" fill="currentColor"/><circle cx="20.5" cy="20.5" r=".9" fill="currentColor"/>',
    'wave': '<path d="M2.5 12c2.2 0 2.2-5 4.4-5s2.2 10 4.4 10 2.2-10 4.4-10 2.2 5 4.4 5h1.4"/>',
    'dice': '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
}

# kind: Apps | Tools | Toys | Wallpapers.  status: live | soon.
SHELF = [
    dict(slug='fitlog', name='FitLog', kind='Apps', status='live', tile='t-grass', icon=None, url='https://fitlog-two-gamma.vercel.app',
         blurb='Workouts, meals and fasting in one tidy app.',
         about='The one I use every day. A workout log, a meal and macro tracker and a fasting timer that live in the same place, work offline and install to your home screen.',
         points=['Log sets, PRs and reusable programs', 'Meals, macros, water and fasting windows', 'Works offline, export or delete everything any time']),
    dict(slug='shan-shui', name='Shan Shui', kind='Wallpapers', status='soon', tile='t-paper', icon='mountains',
         blurb='An ink landscape that paints itself forever and never repeats.',
         about='Procedurally generated Chinese ink-wash mountains, mist and little boats, scrolling on forever. Pick a size and keep it as a wallpaper, or leave it running on a spare screen.',
         points=['Every landscape is new', 'Wallpaper export at any resolution', 'Slow live mode for a second monitor']),
    dict(slug='squish', name='Squish', kind='Tools', status='soon', tile='t-tomato', icon='squish',
         blurb='Shrink and resize images right in your browser.',
         about='Drop in a pile of photos and get them back smaller, in WebP, AVIF or JPEG. Nothing is uploaded; the squishing happens on your own device.',
         points=['Batch drag and drop', 'Side-by-side before and after', 'Save one by one or as a ZIP']),
    dict(slug='beam', name='Beam', kind='Tools', status='soon', tile='t-sky', icon='qr',
         blurb='Send a file from your laptop to your phone by scanning a code.',
         about='Open Beam on both devices, scan the code, and drop files or text across. It goes straight from one device to the other, with no account and nothing stored on a server.',
         points=['No sign-up, no app to install', 'Peer to peer, encrypted in transit', 'Text, links, photos and files']),
    dict(slug='hum', name='Hum', kind='Toys', status='soon', tile='t-grape', icon='note',
         blurb='Hum a tune and see the notes you sang.',
         about='Hum or whistle into your mic and Hum writes the melody down as notes you can play back, transpose or copy. Good for catching a tune before it disappears.',
         points=['Pitch detection in the browser', 'Play it back on a piano or synth', 'Export as MIDI']),
    dict(slug='meeting-meter', name='Meeting Meter', kind='Toys', status='soon', tile='t-sun', icon='meter',
         blurb='Watch what this meeting is costing, live.',
         about='Enter how many people are in the room and a rough hourly rate, then watch the bill tick up by the second. Share it on screen if you dare.',
         points=['Big, screen-shareable counter', 'Milestones like "that was a sandwich"', 'Nothing saved, nothing sent']),
    dict(slug='skip-the-story', name='Skip the Story', kind='Tools', status='soon', tile='t-orange', icon='bowl',
         blurb='Paste a recipe link, get the ingredients and steps. No life story.',
         about='Recipe sites bury the recipe under ads and anecdotes. Paste the link and get a clean card with the ingredients, the steps and a cook mode that keeps your screen awake.',
         points=['Reads the recipe data most sites already include', 'Scale servings up or down', 'Cook mode with big text']),
    dict(slug='swatch', name='Swatch', kind='Tools', status='soon', tile='t-pink', icon='swatch',
         blurb='Pull a colour palette out of any photo.',
         about='Drop a photo and Swatch picks out its main colours, names them and gives you the codes. Copy them as hex, CSS variables or a Tailwind snippet.',
         points=['Five to ten colours per image', 'Contrast checks for text', 'Copy as hex, CSS or Tailwind']),
    dict(slug='desk-plant', name='Desk Plant', kind='Toys', status='soon', tile='t-lime', icon='sprout',
         blurb='A focus timer with a little plant that grows while you work.',
         about='Start a focus session and a pixel plant grows. Switch to another tab and it droops. Keep it up for a week and you have a small, smug garden.',
         points=['Sessions from 15 to 90 minutes', 'A garden that remembers your streak', 'Gentle chime, no notifications spam']),
    dict(slug='overlap', name='Overlap', kind='Tools', status='soon', tile='t-teal', icon='globe',
         blurb='Find the hours when friends in different time zones are all awake.',
         about='Add a few cities or people and Overlap shows a single day strip with the hours that work for everyone. Send the link and everyone sees it in their own time.',
         points=['Daylight saving handled', 'Shareable link, no accounts', 'Set awake hours for each person']),
    dict(slug='box-breath', name='Box Breath', kind='Tools', status='soon', tile='t-mint', icon='breath',
         blurb='A breathing pacer with soft shapes that slowly change.',
         about='In for four, hold for four, out for four. A calm shape guides each breath and slowly morphs so it never feels like staring at a timer.',
         points=['Box, 4-7-8 and custom patterns', 'Optional soft sound', 'Full screen, no distractions']),
    dict(slug='font-fight', name='Font Fight', kind='Toys', status='soon', tile='t-ink', icon='type',
         blurb='Two fonts enter, one leaves. Find your favourite.',
         about='Font Fight shows the same sentence in two typefaces and you pick the better one, bracket style, until a champion is left. Then it tells you where to get it.',
         points=['Free fonts only', 'Type your own sample text', 'Share your winner']),
    dict(slug='receipt', name='Receipt', kind='Toys', status='soon', tile='t-slate', icon='receipt',
         blurb='Turn your to-do list into a shop receipt.',
         about='Paste what you got done today and Receipt prints it as a little thermal-paper receipt, with a total, a barcode and a thank-you line. Save it as an image or print it for real.',
         points=['Looks like real thermal paper', 'Download as PNG', 'Daily, weekly or "this year" receipts']),
    dict(slug='sky-window', name='Sky Window', kind='Wallpapers', status='soon', tile='t-indigo', icon='window',
         blurb='A live wallpaper of the real sky colour over any city.',
         about='Pick a city and Sky Window paints the sky as it looks there right now, from dawn pinks to night blues, drifting slowly through the day.',
         points=['Uses real sun position and weather', 'Works as a browser new-tab page', 'Wallpaper snapshots any time']),
    dict(slug='six-clicks', name='Six Clicks', kind='Toys', status='soon', tile='t-rose', icon='cursor',
         blurb='Get from one Wikipedia page to another in as few clicks as you can.',
         about='You get a start page and a target, say "Toaster" to "Napoleon", and race there using only the links on each page. Daily puzzle, same for everyone.',
         points=['A new pair every day', 'Share your result', 'Practice mode with random pairs']),
    dict(slug='static', name='Static', kind='Toys', status='soon', tile='t-orange', icon='wave',
         blurb='Background noise you mix yourself: rain, waves, fire, train.',
         about='Slide a few sounds together until it feels right, then leave it running while you work or sleep. Mixes save to a link you can share.',
         points=['Seven sounds, all generated live', 'Sleep timer with a slow fade-out', 'Share a mix as a link']),
    dict(slug='decider', name='Decider', kind='Toys', status='soon', tile='t-grape', icon='dice',
         blurb='Coin flips, dice and wheels for when you really cannot choose.',
         about='Flip a coin, roll some dice or spin a wheel of your own options. It remembers your wheels, and it has a "best of three" button for sore losers.',
         points=['Coin, dice and custom wheels', 'Fair randomness from the browser', 'Big buttons for phones']),
]

KINDS = ['Apps', 'Tools', 'Toys', 'Wallpapers']

# A tool is live once its page fragment exists in tools/pages/<slug>.html. It is then served at
# /<slug> (generated into <slug>/index.html, with its script at <slug>/app.js).
PAGES = Path(__file__).resolve().parent / 'pages'
for _item in SHELF:
    if (PAGES / f"{_item['slug']}.html").exists():
        _item['status'] = 'live'
        _item['url'] = '/' + _item['slug']
e = html.escape


def tile(item, size_class=''):
    cls = f'tile {item["tile"]} {size_class}'.strip()
    if item['icon'] is None:
        return f'<span class="{cls}" aria-hidden="true"><img src="/assets/fitlog-icon.png" alt="" width="56" height="56" /></span>'
    return (f'<span class="{cls}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICONS[item["icon"]]}</svg></span>')


def card(item, i):
    live = item['status'] == 'live'
    pill = '<span class="pill pill-live">Open</span>' if live else '<span class="pill pill-soon">Soon</span>'
    search = e(' '.join([item['name'], item['kind'], item['blurb']]).lower())
    points = ''.join(f'<li>{e(p)}</li>' for p in item['points'])
    if live:
        external = item['url'].startswith('http')
        target = ' target="_blank" rel="noopener"' if external else ''
        note = 'Free. Opens in a new tab.' if external else 'Free, runs right in your browser.'
        action = f'<a class="btn btn-primary" href="{e(item["url"])}"{target}>Open {e(item["name"])}</a><span class="note">{note}</span>'
    else:
        action = (f'<a class="btn btn-ghost" href="{GITHUB}" target="_blank" rel="noopener">Follow on GitHub</a>'
                  f'<span class="note">Still in the workshop. It will be free and open source when it ships.</span>')
    kind = 'App' if item['kind'] == 'Apps' else item['kind'][:-1]
    return f'''          <article class="card" style="--i:{i}" data-kind="{item['kind']}" data-status="{item['status']}" data-search="{search}">
            {tile(item)}
            <h3><button type="button" class="card-hit" data-open="{item['slug']}" aria-haspopup="dialog">{e(item['name'])}</button></h3>
            <p class="kind">{kind}</p>
            <p class="blurb">{e(item['blurb'])}</p>
            <p class="foot"><span class="price"><s>$9.99</s>Free</span>{pill}</p>
            <template id="d-{item['slug']}" data-name="{e(item['name'])}" data-kind="{kind}">
              <div data-part="tile">{tile(item)}</div>
              <p data-part="about">{e(item['about'])}</p>
              <ul data-part="points">{points}</ul>
              <div data-part="actions">{action}</div>
            </template>
          </article>'''


ARROW = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
COFFEE_ICON = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c-.7.9-.7 1.6 0 2.5M12 3.5c-.7.9-.7 1.6 0 2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
MARK = ('<svg class="mark" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#ff5a36"/>'
        '<path d="M15 9.2 19.6 7h1.9v18.2h3.3V28H11.8v-2.8h4.6V11.7l-3.1 1.5-1.1-2.5z" fill="#fff"/>'
        '<g class="eyes" fill="#17171a"><circle cx="17.3" cy="15.4" r="1.25"/><circle cx="20.6" cy="15.4" r="1.25"/></g></svg>')
SOCIALS = f'''<ul class="socials" aria-label="Elsewhere">
            <li><a href="#" data-todo="add the X link" aria-label="X (Twitter)"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a></li>
            <li><a href="#" data-todo="add the Instagram link" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg></a></li>
            <li><a href="{GITHUB}" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></a></li>
            <li><a href="mailto:{EMAIL}" aria-label="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.8 7 12 13l8.2-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>
          </ul>'''


def head(title, desc, path, extra=''):
    url = 'https://www.departmentofone.net' + path
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <meta name="theme-color" content="#f6f3ec" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Department of One" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{url}" />
  <meta name="twitter:card" content="summary" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&display=swap" rel="stylesheet" />
{extra}  <link rel="stylesheet" href="/style.css" />
  <script>document.documentElement.classList.add('js')</script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
'''


def header(page):
    def nav(label, href, key):
        cur = ' aria-current="page"' if key == page else ''
        return f'<a class="navlink" href="{href}"{cur}>{label}</a>'
    return f'''
  <header class="site">
    <div class="wrap">
      <a class="wordmark" href="/" aria-label="Department of One, home">{MARK}<span class="wm-full">department of one</span></a>
      <nav class="primary" aria-label="Main">
        {nav('Shelf', '/#shelf', 'home')}
        {nav('About', '/about', 'about')}
        <a class="btn btn-coffee btn-sm" href="{COFFEE}" target="_blank" rel="noopener">{COFFEE_ICON}<span><span class="label-long">Buy me a </span>coffee</span></a>
      </nav>
    </div>
  </header>
'''


FOOTER = f'''
  <footer class="site">
    <div class="wrap">
      <div class="footer-top">
        <div>
          <a class="wordmark" href="/" aria-label="Department of One, home">{MARK}<span>department of one</span></a>
          <p class="tagline" data-content-key="s_footer_tagline">Made by one person, who also wrote this footer.</p>
        </div>
        {SOCIALS}
        <nav class="footer-links" aria-label="Footer">
          <a href="/#shelf">Shelf</a>
          <a href="/about">About</a>
          <a href="mailto:{EMAIL}">Email</a>
          <a href="/privacy">Privacy</a>
          <a href="{COFFEE}" target="_blank" rel="noopener">Buy me a coffee</a>
        </nav>
      </div>
      <p class="footer-word" aria-hidden="true">dept. of one</p>
    </div>
  </footer>
'''

SCRIPTS = '''
  <script src="/content.js"></script>
  <script src="/script.js" defer></script>
</body>
</html>
'''


def tipjar():
    return f'''
    <section class="wrap section" aria-labelledby="tipTitle">
      <div class="tipjar">
        <div class="cup" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="#2b2100" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19h24v9a10 10 0 0 1-10 10h-4A10 10 0 0 1 9 28z" fill="#ffd84d"/><path d="M33 22h3a5 5 0 0 1 0 10h-3"/><g class="steam"><path d="M17 8c-1.4 1.8-1.4 3.2 0 5"/><path d="M25 8c-1.4 1.8-1.4 3.2 0 5"/></g></svg></div>
        <div>
          <h2 id="tipTitle">Everything here is free.</h2>
          <p data-content-key="m_tip">If something on the shelf made your day a little better, a coffee keeps the servers on and the next weird idea moving. It's optional and doesn't unlock anything.</p>
        </div>
        <a class="btn" href="{COFFEE}" target="_blank" rel="noopener">{COFFEE_ICON}<span>Buy me a coffee</span></a>
      </div>
    </section>
'''


def index():
    live = sum(1 for s in SHELF if s['status'] == 'live')
    soon = len(SHELF) - live
    counts = {k: sum(1 for s in SHELF if s['kind'] == k) for k in KINDS}
    chips = '<button type="button" class="chip" aria-pressed="true" data-filter="all">All<span class="n">' + str(len(SHELF)) + '</span></button>'
    chips += ''.join(f'<button type="button" class="chip" aria-pressed="false" data-filter="{k}">{k}<span class="n">{counts[k]}</span></button>' for k in KINDS)
    chips += f'<button type="button" class="chip" aria-pressed="false" data-filter="live">Ready now<span class="n">{live}</span></button>'
    cards = '\n'.join(card(s, i) for i, s in enumerate(SHELF))
    fit = SHELF[0]
    ss = next(s for s in SHELF if s['slug'] == 'shan-shui')
    rots = [-6, 4, -3, 7, 3, -8, 5, -2, 6, -5, 2, -7]
    ys = [0, 10, -6, 4, -8, 6, -2, 12, 2, -6, 8, -4]
    picks = [s for s in SHELF if s['icon']][:11]
    pile = ''.join(tile(s).replace('class="tile', f'style="--r:{rots[i]}deg;--y:{ys[i]}px" class="tile', 1) for i, s in enumerate(picks))
    pile += '<span class="tile ghost" style="--r:-7deg;--y:-4px"></span>'
    squiggle = '<svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8c20-6 30 4 50-2s30-6 48 0 32 6 50-1 30-5 48 1" fill="none" stroke="#ff5a36" stroke-width="3.5" stroke-linecap="round"/></svg>'
    body = f'''
  <main id="main">
    <section class="wrap hero" id="top">
      <div class="pile" aria-hidden="true">{pile}</div>
      <p class="hero-kicker"><span class="dot" aria-hidden="true"></span>{live} ready, {soon} in the workshop</p>
      <h1>Free little things, made by <span class="squiggle">one person{squiggle}</span>.</h1>
      <p class="lede" data-content-key="m_hero_lede">Apps, tools, toys and wallpapers I make because I think someone might like them. Some are useful, some are silly. All of them are free and open source.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#shelf"><span>Browse the shelf</span>{ARROW}</a>
        <a class="btn btn-coffee" href="{COFFEE}" target="_blank" rel="noopener">{COFFEE_ICON}<span>Buy me a coffee</span></a>
      </div>
    </section>

    <section class="wrap section" aria-labelledby="featTitle">
      <div class="section-head"><h2 id="featTitle">Featured</h2><p>One you can use today, one that's on its way.</p></div>
      <div class="featured">
        <article class="feature feature-fitlog">
          <div class="copy">
            <p class="tag"><span class="dot" aria-hidden="true"></span>Ready now</p>
            <h3><button type="button" class="card-hit" data-open="fitlog" aria-haspopup="dialog">FitLog</button></h3>
            <p>{e(fit['about'])}</p>
          </div>
          <span class="cta" aria-hidden="true">See it {ARROW}</span>
          <img class="phone" src="/assets/fitlog/1-train.webp" width="720" height="1280" alt="" loading="lazy" />
        </article>
        <article class="feature feature-shanshui">
          <svg class="hills" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 200V120c40-30 60-70 95-60s50 50 85 35 45-70 85-62 55 55 135 40V200z" fill="#cfc6b2"/>
            <path d="M0 200v-45c50-25 80-10 120-30s60-45 105-20 60 35 100 20 50-20 75-10V200z" fill="#a89d86"/>
            <path d="M0 200v-20c60-20 110 5 170-8s110-25 160-5 50 15 70 10V200z" fill="#6f6656"/>
          </svg>
          <div class="copy">
            <p class="tag">In the workshop</p>
            <h3><button type="button" class="card-hit" data-open="shan-shui" aria-haspopup="dialog">Shan Shui</button></h3>
            <p>{e(ss['blurb'])}</p>
          </div>
          <span class="cta" aria-hidden="true">Read more {ARROW}</span>
        </article>
      </div>
    </section>

    <div class="shelf-zone">
    <div class="shelf-bar" id="shelf">
      <div class="wrap">
        <label class="search"><span class="sr-only" hidden>Search the shelf</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><input type="search" id="q" placeholder="Search the shelf" aria-label="Search the shelf" autocomplete="off" /></label>
        <div class="chips" role="group" aria-label="Filter">{chips}</div>
      </div>
    </div>

    <section class="wrap section" aria-label="Everything on the shelf">
      <div class="grid stagger" id="grid">
{cards}
        <p class="empty" id="empty" hidden>Nothing here matches that. <a href="mailto:{EMAIL}?subject=Idea%20for%20the%20shelf" style="text-decoration:underline">Suggest it?</a></p>
      </div>
    </section>
    </div>
{tipjar()}
    <section class="wrap section" id="requests" aria-labelledby="ideaTitle">
      <div class="ideabox">
        <div>
          <h2 id="ideaTitle" data-content-key="s_ideas_title">Got an idea for a weird little app?</h2>
          <p data-content-key="s_ideas_body">Tell me what it would do. If I'd use it too, it goes on the list.</p>
        </div>
        <a class="btn btn-ghost" href="mailto:{EMAIL}?subject=Idea%20for%20the%20shelf"><span>Send an idea</span>{ARROW}</a>
      </div>
    </section>
  </main>

  <dialog class="sheet" id="sheet" aria-labelledby="sheetTitle">
    <div class="sheet-head">
      <span id="sheetTile"></span>
      <div><h2 id="sheetTitle"></h2><p class="kind" id="sheetKind"></p></div>
      <button type="button" class="close" id="sheetClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </div>
    <div class="sheet-body">
      <p class="about" id="sheetAbout"></p>
      <div><h3>What it does</h3><ul id="sheetPoints" style="margin-top:10px"></ul></div>
      <div class="sheet-actions" id="sheetActions"></div>
    </div>
  </dialog>
'''
    return head('Department of One - free little apps, tools and toys',
                'Free, open source apps, tools, toys and wallpapers made by one person. FitLog, Shan Shui and a shelf of small things on the way.', '/',
                ) + header('home') + body + FOOTER + SCRIPTS


def about():
    body = f'''
  <main id="main" class="wrap page">
    <div class="about-grid">
      <div class="about-copy">
        <h1>Hi, I'm Milan. I make small things.</h1>
        <p class="big" data-content-key="m_about_1">Department of One is just me, messing around and building whatever I think people might enjoy. A fitness app, an endless ink painting, a timer with a plant in it.</p>
        <p data-content-key="m_about_2">Everything on the shelf is free and open source. I build the things I want to exist, finish them, and put them here. Some will be useful, some will be pointless in a fun way, and that's fine.</p>
        <p data-content-key="s_about_2">Away from the keyboard I read a lot: Tolkien and Sanderson for fiction, and anything about finance, a world I find fascinating.</p>
        <p>Found a bug, or want to say hi? Write to <a href="mailto:{EMAIL}" style="color:var(--text);text-decoration:underline">{EMAIL}</a>. I read everything.</p>
      </div>
      <aside class="side-card">
        <h2>Keep the lights on</h2>
        <p>Nothing here costs money. If you'd like to chip in for hosting and coffee, it's very much appreciated.</p>
        <a class="btn btn-coffee" href="{COFFEE}" target="_blank" rel="noopener">{COFFEE_ICON}<span>Buy me a coffee</span></a>
        <h2 style="margin-top:8px">Elsewhere</h2>
        {SOCIALS}
      </aside>
    </div>
  </main>
'''
    return head('About - Department of One', 'Department of One is one person making free little apps, tools and toys.', '/about') + header('about') + body + FOOTER + SCRIPTS


def brand():
    old = '<span class="wm-line"><span class="wm-text">department of one</span><span class="cursor" aria-hidden="true"></span></span>'
    body = f'''
  <main id="main" class="wrap page">
    <h1 style="font-size:clamp(2.2rem,5vw,3.4rem)">Logo options</h1>
    <p style="color:var(--muted);margin-top:10px;max-width:60ch">A private page for picking the logo. Not linked anywhere and hidden from search engines.</p>
    <div class="logo-grid">
      <article class="logo-option">
        <div class="stage"><span class="wordmark" style="font-size:1.5rem">{MARK.replace('class="mark"', 'class="mark" style="width:48px;height:48px"')}<span>department of one</span></span></div>
        <h2>A. Mr. One (in use)</h2>
        <p>A 1 with eyes on a tomato tile. The eyes blink every few seconds, which keeps the old cursor's blink.</p>
      </article>
      <article class="logo-option">
        <div class="stage"><span class="stamp"><b>1</b>dept. of one</span></div>
        <h2>B. The stamp</h2>
        <p>A slightly crooked rubber stamp. Feels like a tiny official office run by one person.</p>
      </article>
      <article class="logo-option">
        <div class="stage dark">{old}</div>
        <h2>C. The original</h2>
        <p>The mono wordmark with the blinking block cursor, as it was.</p>
      </article>
      <article class="logo-option">
        <div class="stage">{old}</div>
        <h2>C. The original, on paper</h2>
        <p>The same wordmark on the new light background, with the tomato cursor.</p>
      </article>
    </div>
  </main>
'''
    return head('Logo options - Department of One', 'Logo options.', '/brand', extra='  <meta name="robots" content="noindex, nofollow" />\n') + header('brand') + body + FOOTER + SCRIPTS


def privacy():
    body = f'''
  <main id="main" class="legal wrap">
    <h1>Privacy</h1>
    <p class="legal-meta">Last updated: 23 October 2026</p>

    <p>
      This page covers the Department of One website, departmentofone.net. It's run by Milan Solarov, an
      independent developer based in Serbia. Each app on the shelf that handles your data has its own policy;
      FitLog's is <a href="https://fitlog-two-gamma.vercel.app/privacy">here</a>.
    </p>

    <h2>What the site collects</h2>
    <p>
      Nothing about you. There are no forms, no accounts, no ads, no analytics and no tracking cookies. If you
      email me, I get your email address and whatever you write, and I use it only to reply.
    </p>

    <h2>Services involved</h2>
    <ul>
      <li><a href="https://vercel.com/legal/privacy-policy">Vercel</a> hosts the site and handles each request, which includes your IP address.</li>
      <li><a href="https://supabase.com/privacy">Supabase</a> stores the site's editable text. Your browser fetches it when a page loads.</li>
      <li><a href="https://policies.google.com/privacy">Google Fonts</a> delivers the site's fonts, which means Google sees your IP address and browser details.</li>
      <li><a href="https://buymeacoffee.com/privacy-policy">Buy Me a Coffee</a> handles anything you choose to tip there. I never see your card details.</li>
    </ul>
    <p>
      Some of these providers process data outside Serbia and the European Economic Area, including in the United
      States, and rely on recognized safeguards such as the European Commission's Standard Contractual Clauses.
    </p>

    <h2>Your rights</h2>
    <p>
      You can ask to see, correct or delete anything you've sent me, by writing to
      <a href="mailto:{EMAIL}">{EMAIL}</a>. You can also complain to the Commissioner for Information of Public
      Importance and Personal Data Protection in Serbia (<a href="https://www.poverenik.rs">poverenik.rs</a>), or to
      the data protection authority where you live.
    </p>
  </main>
'''
    return head('Privacy - Department of One', 'What the Department of One website collects: nothing, unless you email me.', '/privacy') + header('privacy') + body + FOOTER + SCRIPTS


def tool_page(item):
    body = (PAGES / f"{item['slug']}.html").read_text(encoding='utf-8')
    # Optional first-line directive: <!-- head: ... --> is copied into <head> (extra scripts, preloads).
    extra = ''
    if body.startswith('<!-- head:'):
        first, body = body.split('\n', 1)
        extra = '  ' + first[len('<!-- head:'):-len('-->')].strip() + '\n'
    bar = f'''
  <header class="tool-bar">
    <div class="wrap">
      <a class="home" href="/#shelf" aria-label="Back to the shelf">{MARK}<span>Shelf</span></a>
      <span class="sep" aria-hidden="true"></span>
      <span class="title">{tile(item)}<span>{e(item['name'])}</span></span>
      <span class="spacer"></span>
      <a class="btn btn-coffee btn-sm" href="{COFFEE}" target="_blank" rel="noopener">{COFFEE_ICON}<span><span class="label-long">Buy me a </span>coffee</span></a>
    </div>
  </header>
'''
    foot = f'''
  <footer class="k-footer">
    <div class="wrap">
      <span>{e(item['name'])} is free and open source, made by <a href="/about">one person</a>.</span>
      <span><a href="/#shelf">More on the shelf</a> · <a href="{GITHUB}/department-of-one/tree/main/{item['slug']}" target="_blank" rel="noopener">Source code</a> · <a href="{COFFEE}" target="_blank" rel="noopener">Buy me a coffee</a> · <a href="/privacy">Privacy</a></span>
    </div>
  </footer>
'''
    page = head(f"{item['name']} - {item['blurb'].rstrip('.')}", e(item['about']), '/' + item['slug'],
                extra=extra + '  <link rel="stylesheet" href="/kit/kit.css" />\n')
    page += bar + '\n  <main id="main" class="wrap tool">\n' + body.rstrip() + '\n  </main>\n' + foot
    page += f'''
  <script src="/kit/kit.js" defer></script>
  <script src="/{item['slug']}/app.js" defer></script>
</body>
</html>
'''
    out = ROOT / item['slug']
    out.mkdir(exist_ok=True)
    (out / 'index.html').write_text(page, encoding='utf-8', newline='\n')
    print('wrote', item['slug'] + '/index.html')


if __name__ == '__main__':
    for name, build in [('index.html', index), ('about.html', about), ('brand.html', brand), ('privacy.html', privacy)]:
        (ROOT / name).write_text(build(), encoding='utf-8', newline='\n')
        print('wrote', name)
    for item in SHELF:
        if (PAGES / f"{item['slug']}.html").exists():
            tool_page(item)
