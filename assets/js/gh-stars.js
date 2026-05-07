/* ─── Live GitHub star counts ─── */
/*
 * Usage: <span data-gh-stars="owner/repo" data-fallback="400+">400+</span>
 *
 * Resolution order (fail-soft):
 *   1. /assets/data/stars.json — pre-fetched in CI on a 3-day schedule
 *      (.github/workflows/refresh-stars.yml). Single same-origin request,
 *      no GitHub API rate limit, no CORS, instant.
 *   2. Direct GitHub API call (60 req/hour per IP, used only for repos
 *      not yet baked into stars.json — e.g. when you add a new pub
 *      before the next CI run).
 *   3. The fallback text already in the HTML stays untouched.
 *
 * Per-visitor 6-hour localStorage cache on the API path so even repeat
 * visitors don't burn rate limit.
 */

(function () {
  const TTL_MS = 6 * 60 * 60 * 1000;
  const CACHE_PREFIX = 'gh-stars:';
  const STARS_JSON_URL = '/assets/data/stars.json';

  function format(n) {
    if (n == null || isNaN(n)) return null;
    if (n >= 10000) return Math.round(n / 1000) + 'k';
    if (n >= 1000)  return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function readCache(repo) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + repo);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj.t !== 'number' || typeof obj.n !== 'number') return null;
      if (Date.now() - obj.t > TTL_MS) return null;
      return obj.n;
    } catch (_) { return null; }
  }

  function writeCache(repo, n) {
    try { localStorage.setItem(CACHE_PREFIX + repo, JSON.stringify({ t: Date.now(), n: n })); }
    catch (_) {}
  }

  function paint(els, n) {
    const text = format(n);
    if (text == null) return;
    els.forEach(el => {
      el.textContent = text;
      el.setAttribute('data-gh-stars-loaded', 'true');
      el.title = n.toLocaleString() + ' stars';
    });
  }

  function fetchFromApi(repo, els) {
    const cached = readCache(repo);
    if (cached !== null) { paint(els, cached); return; }
    fetch('https://api.github.com/repos/' + repo, {
      headers: { 'Accept': 'application/vnd.github+json' }
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(data => {
        if (typeof data.stargazers_count !== 'number') throw new Error('no stargazers_count');
        writeCache(repo, data.stargazers_count);
        paint(els, data.stargazers_count);
      })
      .catch(() => { /* keep fallback text */ });
  }

  function init() {
    const els = Array.from(document.querySelectorAll('[data-gh-stars]'));
    if (els.length === 0) return;

    const groups = {};
    els.forEach(el => {
      const repo = el.getAttribute('data-gh-stars');
      if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return;
      (groups[repo] = groups[repo] || []).push(el);
    });

    fetch(STARS_JSON_URL, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(stars => {
        Object.keys(groups).forEach(repo => {
          if (typeof stars[repo] === 'number') {
            paint(groups[repo], stars[repo]);
          } else {
            fetchFromApi(repo, groups[repo]);
          }
        });
      })
      .catch(() => {
        // stars.json missing → fall through entirely to per-repo API calls
        Object.keys(groups).forEach(repo => fetchFromApi(repo, groups[repo]));
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
