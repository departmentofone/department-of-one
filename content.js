// Loads editable site copy from Supabase (migration_v24_site_content.sql, in the FitLog project -
// reused on purpose so the admin page can sign in with the same account). Every element tagged
// `data-content-key="..."` gets its text replaced once the fetch resolves. If the fetch fails
// (offline, ad blocker, key rotated) the page just keeps the text already in the HTML - that's a
// real fallback, not a loading placeholder, so nothing ever looks broken.
;(function () {
  var SUPABASE_URL = 'https://uxmdzudoojexfcoircoo.supabase.co'
  var SUPABASE_ANON_KEY = 'sb_publishable_JmN9P2H6oPKxcNh-jRPeEQ_aPc0NgLS'

  fetch(SUPABASE_URL + '/rest/v1/site_content?select=key,value', {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
  })
    .then(function (res) {
      if (!res.ok) throw new Error('site_content fetch failed: ' + res.status)
      return res.json()
    })
    .then(function (rows) {
      rows.forEach(function (row) {
        document.querySelectorAll('[data-content-key="' + row.key + '"]').forEach(function (el) {
          el.textContent = row.value
        })
      })
    })
    .catch(function (err) {
      console.warn('Live content unavailable, showing built-in text.', err)
    })
})()
