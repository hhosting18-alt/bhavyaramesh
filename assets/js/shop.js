/* Bhavya Ramesh — shop filter drawer
   Type + collection (multi-select, AND across groups), sort, live counts,
   URL hash state (#col=stare&type=earrings&sort=price-asc; legacy #stare works). */
(function () {
  'use strict';
  const root = document.querySelector('[data-sf]'); if (!root) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => window.matchMedia('(max-width: 767px)').matches;

  const grid = $('[data-grid]'), cards = $$('.product-card', grid);
  const toggle = $('.sf__toggle', root), panel = $('.sf__panel', root), scrim = $('.sf__scrim');
  const opts = $$('.sf__opt', root), chips = $('[data-sf-chips]', root);
  const sortBtn = $('.sf__sort-btn', root), sortList = $('.sf__sort-list', root), sortOpts = $$('.sf__sort-opt', root);
  const blurbs = window.SHOP_BLURBS || {};
  const NAMES = {}; opts.forEach((o) => { NAMES[o.dataset.group + ':' + o.dataset.value] = $('.sf__opt-name', o).textContent; });
  const SORT_NAMES = {}; sortOpts.forEach((o) => { SORT_NAMES[o.dataset.sort] = o.textContent; });

  const state = { type: new Set(), col: new Set(), sort: 'featured' };
  const data = cards.map((el) => ({
    el, type: el.dataset.type, cols: (el.dataset.collections || '').split(' ').filter(Boolean),
    price: +el.dataset.price || 0, badge: el.dataset.badge || '', order: +el.dataset.order || 0,
  }));
  const matches = (d, s, skip) =>
    (skip === 'type' || !s.type.size || s.type.has(d.type)) &&
    (skip === 'col' || !s.col.size || d.cols.some((c) => s.col.has(c)));

  /* ---------- URL state ---------- */
  const readHash = () => {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    state.type.clear(); state.col.clear(); state.sort = 'featured';
    if (!h) return;
    if (!h.includes('=')) { if (NAMES['col:' + h]) state.col.add(h); else if (NAMES['type:' + h]) state.type.add(h); return; }
    new URLSearchParams(h).forEach((v, k) => {
      if (k === 'sort' && SORT_NAMES[v]) state.sort = v;
      if (k === 'col' || k === 'type') v.split(',').forEach((x) => NAMES[k + ':' + x] && state[k].add(x));
    });
  };
  const writeHash = () => {
    const p = [];
    if (state.col.size) p.push('col=' + [...state.col].join(','));
    if (state.type.size) p.push('type=' + [...state.type].join(','));
    if (state.sort !== 'featured') p.push('sort=' + state.sort);
    history.replaceState(null, '', p.length ? '#' + p.join('&') : location.pathname + location.search);
  };

  /* ---------- render ---------- */
  let firstRender = true;
  function render(opts2 = {}) {
    // option states + facet counts
    opts.forEach((o) => {
      const g = o.dataset.group, v = o.dataset.value, on = state[g].has(v);
      const probe = { type: new Set(state.type), col: new Set(state.col) };
      probe[g] = new Set([v]);
      const n = data.filter((d) => matches(d, probe)).length;
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
      o.classList.toggle('-is-on', on);
      o.classList.toggle('-is-empty', !n && !on);
      $('[data-n]', o).textContent = n;
    });
    // sort
    sortOpts.forEach((o) => { const on = o.dataset.sort === state.sort; o.classList.toggle('-is-active', on); o.setAttribute('aria-selected', on); });
    $('[data-sf-sort-name]', root).textContent = state.sort === 'featured' ? 'Featured' : SORT_NAMES[state.sort];
    // chips
    const active = [...[...state.type].map((v) => ['type', v]), ...[...state.col].map((v) => ['col', v])];
    chips.innerHTML = active.map(([g, v]) => `<li><button type="button" class="sf__chip" data-group="${g}" data-value="${v}" aria-label="Remove ${NAMES[g + ':' + v]}">${NAMES[g + ':' + v]} <span aria-hidden="true">×</span></button></li>`).join('')
      + (active.length > 1 ? '<li><button type="button" class="sf__chip -clear" data-sf-clear>Clear all</button></li>' : '');
    const badge = $('[data-sf-active]', root); badge.hidden = !active.length; badge.textContent = active.length ? ` (${active.length})` : '';
    // cards: filter + sort (DOM reorder)
    const visible = data.filter((d) => matches(d, state));
    const sorted = [...data].sort((a, b) => {
      switch (state.sort) {
        case 'price-asc': return a.price - b.price || a.order - b.order;
        case 'price-desc': return b.price - a.price || a.order - b.order;
        case 'new': return (b.badge === 'new') - (a.badge === 'new') || a.order - b.order;
        case 'bestseller': return (b.badge === 'bestseller') - (a.badge === 'bestseller') || a.order - b.order;
        default: return a.order - b.order;
      }
    });
    const vis = new Set(visible);
    const apply = () => {
      const frag = document.createDocumentFragment();
      sorted.forEach((d) => { d.el.hidden = !vis.has(d); d.el.classList.remove('-in'); frag.appendChild(d.el); });
      grid.appendChild(frag);
      if (!reduced && !firstRender) {
        let i = 0;
        sorted.forEach((d) => { if (vis.has(d) && i < 20) { d.el.style.setProperty('--i', i++); d.el.classList.add('-in'); } });
      }
      grid.classList.remove('-swap');
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };
    if (firstRender || reduced) apply();
    else { grid.classList.add('-swap'); setTimeout(apply, 160); }
    firstRender = false;
    // counts + blurb
    $$('[data-sf-count]').forEach((n) => { n.textContent = visible.length; });
    $('[data-count]').textContent = visible.length;
    $('[data-empty]').hidden = visible.length > 0;
    const blurb = $('[data-blurb]');
    blurb.textContent = state.col.size === 1 && !state.type.size ? (blurbs[[...state.col][0]] || '') : '';
    blurb.hidden = !blurb.textContent;
    if (opts2.write !== false) writeHash();
    if (opts2.scroll) scrollToGrid();
  }

  const scrollToGrid = () => {
    const top = root.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(root).top) || 0);
    if (window.scrollY <= top + 2) return;
    if (window.__lenis) window.__lenis.scrollTo(top, { duration: 0.9 }); else window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ---------- panel open / close ---------- */
  let open = false, lastFocus = null;
  function setOpen(v) {
    if (open === v) return; open = v;
    root.classList.toggle('-open', v); document.body.classList.toggle('sf-open', v); document.documentElement.classList.toggle('menu-lock', v);
    toggle.setAttribute('aria-expanded', v);
    v ? panel.removeAttribute('inert') : panel.setAttribute('inert', '');
    if (window.__lenis) v ? window.__lenis.stop() : window.__lenis.start();
    if (v) { closeSort(); lastFocus = document.activeElement; setTimeout(() => (panel.querySelector('.sf__opt') || panel).focus({ preventScroll: true }), 60); }
    else if (lastFocus && root.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => {
    if (!open && !mobile()) { // bring the bar to the top first so the panel has room
      const r = root.getBoundingClientRect(), topGap = parseFloat(getComputedStyle(root).top) || 0;
      if (r.top > topGap + 4) {
        const y = r.top + window.scrollY - topGap;
        if (window.__lenis) { window.__lenis.scrollTo(y, { duration: 0.6, onComplete: () => setOpen(true) }); return; }
        window.scrollTo(0, y);
      }
    }
    setOpen(!open);
  });
  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-sf-close]')) { setOpen(false); scrollToGrid(); }
    if (ev.target.closest('[data-sf-clear]')) { state.type.clear(); state.col.clear(); render({ scroll: !open }); }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { if (open) setOpen(false); closeSort(); } });

  opts.forEach((o) => o.addEventListener('click', () => {
    const s = state[o.dataset.group], v = o.dataset.value;
    s.has(v) ? s.delete(v) : s.add(v); render();
  }));
  chips.addEventListener('click', (ev) => {
    const c = ev.target.closest('.sf__chip[data-group]'); if (!c) return;
    state[c.dataset.group].delete(c.dataset.value); render({ scroll: true });
  });
  const feat = $('[data-sf-feature]', root);
  if (feat) feat.addEventListener('click', (ev) => { ev.preventDefault(); state.col.clear(); state.type.clear(); state.col.add(feat.dataset.sfFeature); render(); setOpen(false); scrollToGrid(); });

  /* ---------- sort dropdown ---------- */
  function closeSort() { root.classList.remove('-sort-open'); sortBtn.setAttribute('aria-expanded', 'false'); }
  sortBtn.addEventListener('click', (ev) => {
    ev.stopPropagation(); const v = !root.classList.contains('-sort-open');
    if (v && open) setOpen(false);
    root.classList.toggle('-sort-open', v); sortBtn.setAttribute('aria-expanded', v);
    if (v) (sortList.querySelector('.-is-active') || sortList.querySelector('button')).focus({ preventScroll: true });
  });
  sortOpts.forEach((o) => o.addEventListener('click', () => { state.sort = o.dataset.sort; closeSort(); sortBtn.focus({ preventScroll: true }); render({ scroll: true }); }));
  sortList.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return; ev.preventDefault();
    const i = sortOpts.indexOf(document.activeElement), n = sortOpts.length;
    sortOpts[(i + (ev.key === 'ArrowDown' ? 1 : n - 1)) % n].focus();
  });
  document.addEventListener('click', (ev) => { if (!ev.target.closest('.sf__sort')) closeSort(); });

  /* ---------- stuck state (hairline + tighter bar once pinned) ---------- */
  const sentinel = document.createElement('div'); sentinel.className = 'sf__sentinel'; root.before(sentinel);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => root.classList.toggle('-stuck', !e.isIntersecting), { rootMargin: `-${parseFloat(getComputedStyle(root).top) || 0}px 0px 0px 0px` }).observe(sentinel);
  }

  readHash(); render({ write: false });
  window.addEventListener('hashchange', () => { readHash(); render({ write: false }); });
})();
