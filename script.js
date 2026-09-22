// Three-state theme toggle (system → light → dark → system...), persisted per browser.
// Mirrors the token structure in style.css: no attribute = system, data-theme="light"/"dark" = forced.
;(function () {
  const root = document.documentElement
  const toggle = document.getElementById('themeToggle')
  const sun = document.getElementById('iconSun')
  const moon = document.getElementById('iconMoon')
  const KEY = 'theme'

  function systemIsDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function apply(mode) {
    if (mode === 'light' || mode === 'dark') {
      root.setAttribute('data-theme', mode)
    } else {
      root.removeAttribute('data-theme')
    }
    const isDark = mode === 'dark' || (mode !== 'light' && systemIsDark())
    sun.style.display = isDark ? 'none' : 'block'
    moon.style.display = isDark ? 'block' : 'none'
  }

  let stored = null
  try {
    stored = localStorage.getItem(KEY)
  } catch {
    // Private browsing / blocked storage - falls back to system each load, still works fine.
  }
  apply(stored)

  toggle.addEventListener('click', () => {
    const current = stored ?? 'system'
    const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system'
    stored = next === 'system' ? null : next
    try {
      if (stored) localStorage.setItem(KEY, stored)
      else localStorage.removeItem(KEY)
    } catch {
      // Nothing to persist to - the toggle still works for the rest of this visit.
    }
    apply(stored)
  })
})()
