/* Bhavya Ramesh — 5 tales of silver
   Interaction layer reproducing the indigo-laboratory.it experience. */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined';
  if (hasGsap && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis) wired to ScrollTrigger
  ------------------------------------------------------------------ */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    lenis.stop();
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target, opts = {}) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el && typeof target !== 'number') return;
    if (lenis) lenis.scrollTo(el || target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else (el ? el.scrollIntoView({ behavior: 'smooth' }) : window.scrollTo({ top: target, behavior: 'smooth' }));
  };
  const lockScroll = (lock) => {
    document.body.classList.toggle('scroll-lock', lock);
    if (lenis) lock ? lenis.stop() : lenis.start();
  };

  /* ------------------------------------------------------------------
     Audio: procedurally generated ambient (no external files)
  ------------------------------------------------------------------ */
  const Audio = (() => {
    let ctx = null, master = null, enabled = false;
    const ensure = () => {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      return ctx;
    };
    // a soft evolving drone built from detuned sines + slow LFO + filtered noise
    const makeDrone = (seed = 0) => {
      const c = ensure(); if (!c) return null;
      const scale = [[110, 164.81, 220, 329.63], [123.47, 185, 246.94, 370], [98, 146.83, 196, 293.66], [130.81, 196, 261.63, 392], [87.31, 130.81, 174.61, 261.63], [110, 138.59, 220, 277.18]];
      const freqs = scale[seed % scale.length];
      const out = c.createGain(); out.gain.value = 0;
      const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 0.7;
      filt.connect(out);
      const nodes = [];
      freqs.forEach((f, i) => {
        [0, 1].forEach((k) => {
          const o = c.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine';
          o.frequency.value = f; o.detune.value = (k ? 6 : -6) + (seed * 1.7);
          const g = c.createGain(); g.gain.value = 0.12 / (i + 1);
          const lfo = c.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03 + seed * 0.01;
          const lg = c.createGain(); lg.gain.value = 0.06;
          lfo.connect(lg); lg.connect(g.gain);
          o.connect(g); g.connect(filt); o.start(); lfo.start();
          nodes.push(o, lfo);
        });
      });
      // breathy noise bed
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
      const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
      const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 400 + seed * 120; nf.Q.value = 0.5;
      const ng = c.createGain(); ng.gain.value = 0.035;
      n.connect(nf); nf.connect(ng); ng.connect(out); n.start(); nodes.push(n);
      out.connect(master);
      return {
        out, nodes,
        fade(to, t = 1.5) { const now = c.currentTime; out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now); out.gain.linearRampToValueAtTime(to, now + t); },
        stop() { this.fade(0, 1); setTimeout(() => nodes.forEach((x) => { try { x.stop(); } catch (e) {} }), 1200); }
      };
    };
    let bg = null;
    return {
      get enabled() { return enabled; },
      async enable() {
        const c = ensure(); if (!c) return false;
        try { if (c.state === 'suspended') await c.resume(); } catch (e) {}
        enabled = true;
        master.gain.cancelScheduledValues(c.currentTime); master.gain.linearRampToValueAtTime(0.8, c.currentTime + 1);
        if (!bg) { bg = makeDrone(0); bg.fade(0.6, 3); }
        return true;
      },
      disable() {
        enabled = false;
        if (ctx && master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8); }
      },
      duckBg(on) { if (bg) bg.fade(on ? 0.12 : 0.6, 1.2); },
      makeDrone
    };
  })();

  /* ------------------------------------------------------------------
     Text splitting (lines / chars / words)
  ------------------------------------------------------------------ */
  function splitLines(p) {
    const span = p.querySelector('span'); if (!span) return;
    const text = span.textContent; span.classList.add('src'); span.style.display = 'none';
    const wrapper = document.createElement('span'); wrapper.className = 'lines-wrap';
    p.appendChild(wrapper);
    const words = text.split(/\s+/);
    words.forEach((w, i) => { const ws = document.createElement('span'); ws.textContent = w + (i < words.length - 1 ? ' ' : ''); ws.style.display = 'inline'; wrapper.appendChild(ws); });
    // group by offsetTop
    const groups = []; let last = null;
    Array.from(wrapper.children).forEach((ws) => { const t = ws.offsetTop; if (t !== last) { groups.push([]); last = t; } groups[groups.length - 1].push(ws.textContent); });
    wrapper.remove();
    p.classList.add('-split');
    groups.forEach((g, i) => {
      const line = document.createElement('span'); line.className = 'line';
      const inner = document.createElement('div'); inner.textContent = g.join('').replace(/\s+$/, '');
      inner.style.transition = `transform .9s cubic-bezier(.16,1,.3,1) ${i * 0.08}s`;
      line.appendChild(inner); p.appendChild(line);
    });
  }
  function splitChars(el) {
    const span = el.querySelector('span'); if (!span) return;
    const text = span.textContent; span.classList.add('src'); span.style.display = 'none'; el.classList.add('-split');
    Array.from(text).forEach((ch, i) => { const c = document.createElement('div'); c.className = 'char'; c.textContent = ch; c.style.transition = `opacity .5s ease ${i * 0.03}s, transform .6s cubic-bezier(.16,1,.3,1) ${i * 0.03}s`; el.appendChild(c); });
  }
  function splitWords(el) {
    const span = el.querySelector('span'); if (!span) return;
    span.classList.add('src'); el.classList.add('-split');
    span.textContent.split(' ').forEach((w, i) => { const d = document.createElement('div'); d.className = 'word'; d.textContent = w; d.style.display = 'block'; d.style.transition = `opacity .7s ease ${i * 0.1}s, transform .9s cubic-bezier(.16,1,.3,1) ${i * 0.1}s`; el.appendChild(d); });
  }
  function prepareText() {
    $$('.js-lines').forEach(splitLines);
    $$('.js-chars').forEach(splitChars);
    $$('.js-words').forEach(splitWords);
    $$('.js-title > div > div').forEach((d, i) => { d.style.transition = `transform 1s cubic-bezier(.16,1,.3,1) ${(i % 3) * 0.1}s`; });
    $$('.tale-head__title > div').forEach((d, i) => { d.style.transition = `opacity .6s ease ${i * 0.06}s, transform .9s cubic-bezier(.16,1,.3,1) ${i * 0.06}s`; });
  }
  let revealObserver = null;
  function observeReveals() {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('-in'); revealObserver.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    $$('.js-lines, .js-chars, .js-words, .js-title, .tale-head__title').forEach((el) => revealObserver.observe(el));
  }
  // re-split lines on resize (debounced)
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => {
    $$('.js-lines').forEach((p) => { const wasIn = p.classList.contains('-in'); $$('.line', p).forEach((l) => l.remove()); p.classList.remove('-split'); splitLines(p); if (wasIn) p.classList.add('-in'); });
    if (hasGsap) ScrollTrigger.refresh();
  }, 250); });

  /* ------------------------------------------------------------------
     Splash
  ------------------------------------------------------------------ */
  const splash = $('.the-splash');
  const header = $('.the-header');
  const soundBtn = $('.the-header__sound-btn');
  if (!splash) { document.body.classList.remove('scroll-lock'); if (lenis) lenis.start(); }
  function setSoundUI(on) {
    if (!soundBtn) return;
    soundBtn.setAttribute('aria-pressed', String(on));
    $('.btn__text', soundBtn).textContent = on ? 'With sound' : 'Without sound';
  }
  function runSplash(withSound) {
    if (!splash || splash.classList.contains('-done')) return;
    splash.classList.add('-choosing', '-hide-choice');
    setSoundUI(withSound);
    const pink = $('.the-splash__bg.-bg-pink'), black = $('.the-splash__bg.-bg-black'), logo = $('.the-splash__logo');
    const cursor = $('.the-splash__ring-cursor');
    const finish = () => {
      splash.classList.add('-done'); splash.style.display = 'none';
      lockScroll(false);
      $$('.hero__index li:not(.hero__index-pretitle) .btn').forEach((b, i) => { b.style.transition = `transform .9s cubic-bezier(.16,1,.3,1) ${i * 0.07}s`; b.style.transform = 'none'; });
      if (header) $('.the-header__home img').style.opacity = '1';
      setTimeout(() => soundBtn.classList.add('-label-hidden'), 2600);
      if (hasGsap) ScrollTrigger.refresh();
    };
    if (reduced || !hasGsap) { finish(); return; }
    cursor.classList.remove('-visible');
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(pink, { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', duration: 1, ease: 'expo.inOut' }, 0.3)
      .to(logo, { y: '-100vh', duration: 1.1, ease: 'expo.inOut' }, 0.35)
      .to(black, { clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', duration: 0.8, ease: 'expo.inOut' }, 1.0)
      .to(pink, { clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', duration: 1, ease: 'expo.inOut' }, 1.45)
      .to(logo, { opacity: 0, duration: 0.4 }, 1.5)
      .set(splash, { pointerEvents: 'none' }, 2.0);
    // reveal hero index slightly earlier
    tl.call(() => { $('.hero').classList.add('-in'); }, null, 1.6);
  }
  if (splash) {
  $('.the-splash__sound-enable-btn').addEventListener('click', async () => { const ok = await Audio.enable(); runSplash(ok); });
  $('.the-splash__sound-disable-btn').addEventListener('click', () => { Audio.disable(); runSplash(false); });
  }
  if (soundBtn) soundBtn.addEventListener('click', async () => {
    soundBtn.classList.remove('-label-hidden');
    if (Audio.enabled) { Audio.disable(); setSoundUI(false); } else { await Audio.enable(); setSoundUI(true); }
    setTimeout(() => soundBtn.classList.add('-label-hidden'), 2000);
  });
  // splash ring cursor
  (function splashCursor() {
    const cur = $('.the-splash__ring-cursor'); if (!cur || !isDesktop() || !splash) return;
    const pics = $$('.base-image', cur); let idx = 0;
    const iv = setInterval(() => { pics[idx].classList.remove('-active'); idx = (idx + 1) % pics.length; pics[idx].classList.add('-active'); if (splash.classList.contains('-done')) clearInterval(iv); }, 350);
    splash.addEventListener('mousemove', (e) => { cur.classList.add('-visible'); cur.style.transform = `translate(${e.clientX - 24}px, ${e.clientY - 24}px)`; });
    splash.addEventListener('mouseleave', () => cur.classList.remove('-visible'));
  })();

  /* ------------------------------------------------------------------
     Header buttons / modals
  ------------------------------------------------------------------ */
  function openModal(id) {
    const m = $(id); if (!m) return; m.hidden = false; requestAnimationFrame(() => m.classList.add('-open')); lockScroll(true);
    const first = $('.the-modal__close', m); first && first.focus();
  }
  function closeModal(m) { m.classList.remove('-open'); setTimeout(() => { m.hidden = true; }, 700); lockScroll(false); }
  $$('.js-open-maker').forEach((b) => b.addEventListener('click', () => openModal('#maker-modal')));
  $$('.js-open-contact').forEach((b) => b.addEventListener('click', () => openModal('#contact-modal')));
  $$('.the-modal').forEach((m) => { $('.the-modal__close', m).addEventListener('click', () => closeModal(m)); $('.the-modal__backdrop', m).addEventListener('click', () => closeModal(m)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.the-modal.-open').forEach(closeModal); });
  $$('.js-back-top').forEach((b) => b.addEventListener('click', () => scrollTo(0)));
  const safe$ = (sel) => { try { return $(sel); } catch (_) { return null; } };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const h = a.getAttribute('href'); const t = h.length > 1 && safe$(h); if (t) { e.preventDefault(); scrollTo(t); closeMenu(); } }));

  /* ------------------------------------------------------------------
     Chapter progress bar + mobile menu
  ------------------------------------------------------------------ */
  const chapters = $$('.homepage__tale');
  const progress = $('.chapters-progress'), fill = $('.chapters-progress__fill');
  const menu = $('.chapters-menu'), menuProg = $('.chapters-menu__progress'), menuLabel = $('.chapters-menu__label');
  $$('.chapters-progress__bar').forEach((b) => b.addEventListener('click', () => scrollTo(b.dataset.target)));
  const trigger = $('.chapters-menu__trigger');
  const closeMenu = () => { if (!menu) return; menu.classList.remove('-open'); trigger.setAttribute('aria-expanded', 'false'); };
  if (trigger) {
    trigger.addEventListener('click', () => { const open = !menu.classList.contains('-open'); menu.classList.toggle('-open', open); trigger.setAttribute('aria-expanded', String(open)); });
    $('.chapters-menu__overlay').addEventListener('click', closeMenu);
  }

  function updateProgress() {
    if (!chapters.length || !progress) return;
    const vh = window.innerHeight, y = window.scrollY;
    const first = chapters[0], last = chapters[chapters.length - 1];
    const start = first.offsetTop - vh * 0.5;
    const end = last.offsetTop + last.offsetHeight - vh;
    const p = Math.min(1, Math.max(0, (y - start) / (end - start)));
    fill.style.transform = `scaleX(${p})`; menuProg.style.transform = `scaleX(${p})`;
    const show = y > $('.intro').offsetTop - vh * 0.3 && y < $('.the-footer').offsetTop - vh * 0.6;
    progress.classList.toggle('-visible', show); menu.classList.toggle('-visible', show);
    let active = 0; chapters.forEach((c, i) => { if (y >= c.offsetTop - vh * 0.5) active = i; });
    menuLabel.textContent = chapters[active].dataset.name;
    $$('.chapters-menu__list .btn').forEach((b, i) => b.classList.toggle('-is-active', i === active));
    // custom scrollbar
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  if (lenis) lenis.on('scroll', updateProgress);

  /* ------------------------------------------------------------------
     Parallax + product overview + gallery activity (GSAP ScrollTrigger)
  ------------------------------------------------------------------ */
  function initScrollEffects() {
    if (!hasGsap || reduced) return;
    $$('.js-parallax').forEach((el) => {
      const s = parseFloat(el.dataset.speed || '0.1');
      gsap.fromTo(el, { yPercent: -s * 40 }, { yPercent: s * 40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // tale cover: slow zoom out while pinned
    $$('.tale-cover__bg img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.12 }, { scale: 1.02, ease: 'none', scrollTrigger: { trigger: img.closest('.homepage__tale'), start: 'top bottom', end: 'top top', scrub: true } });
    });
    // product overview: title & tags in, product scale
    $$('.tale-product-overview').forEach((sec) => {
      const img = $('.tale-product-overview__main-image img', sec);
      gsap.fromTo(img, { scale: 1.25, yPercent: 8 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } });
      ScrollTrigger.create({ trigger: sec, start: 'top 60%', end: 'bottom 40%', onToggle: (st) => sec.classList.toggle('-title-visible', st.isActive) });
      ScrollTrigger.create({ trigger: $('.tale-product-overview__tags', sec), start: 'top 90%', once: true, onEnter: () => sec.classList.add('-tags-in') });
    });
    // gallery: active item follows scroll on desktop (initial centre)
    // outro image parallax
    $$('.tale-outro__image img').forEach((img) => gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  /* ------------------------------------------------------------------
     Cursor trail (tale head / lookbook, desktop)
  ------------------------------------------------------------------ */
  function initTrail() {
    const trail = $('.cursor-trail'); if (!trail || !isDesktop() || reduced) return;
    const N = 10; const imgs = [];
    for (let i = 0; i < N; i++) { const im = document.createElement('img'); im.alt = ''; trail.appendChild(im); imgs.push(im); }
    const pos = imgs.map(() => ({ x: -500, y: -500 })); let target = { x: -500, y: -500 }; let active = null;
    const sections = $$('[data-float]');
    sections.forEach((s) => {
      s.addEventListener('mouseenter', () => { active = s; imgs.forEach((im) => { im.src = s.dataset.float; }); trail.classList.add('-visible'); });
      s.addEventListener('mouseleave', () => { active = null; trail.classList.remove('-visible'); });
      s.addEventListener('mousemove', (e) => { target = { x: e.clientX, y: e.clientY }; });
    });
    const tick = () => {
      let px = target.x, py = target.y;
      pos.forEach((p, i) => { p.x += (px - p.x) * 0.35; p.y += (py - p.y) * 0.35; px = p.x; py = p.y; imgs[i].style.transform = `translate(${p.x - 120}px, ${p.y - 120}px) scale(${1 - i * 0.05})`; imgs[i].style.opacity = active ? String(1 - i * 0.085) : '0'; });
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ------------------------------------------------------------------
     Gallery: hover activation + custom "shop online" cursor + click
  ------------------------------------------------------------------ */
  function initGallery() {
    $$('.tale-product-gallery').forEach((g) => {
      const items = $$('.tale-product-gallery__item', g); const cur = $('.tale-product-gallery__open-cursor', g);
      items.forEach((it) => {
        it.addEventListener('mouseenter', () => { items.forEach((x) => x.classList.remove('-is-active')); it.classList.add('-is-active'); cur.style.opacity = '1'; cur.style.visibility = 'visible'; });
        it.addEventListener('mouseleave', () => { cur.style.opacity = '0'; cur.style.visibility = 'hidden'; });
        it.addEventListener('mousemove', (e) => { cur.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 16}px)`; });
        it.addEventListener('click', (e) => { if (e.target.closest('a')) return; window.location.href = it.dataset.url; });
      });
    });
  }

  /* ------------------------------------------------------------------
     Song player (generated ambient per chapter)
  ------------------------------------------------------------------ */
  function initPlayers() {
    let current = null;
    $$('.tale-product-story__song').forEach((song) => {
      const seed = parseInt(song.dataset.seed || '1', 10);
      const btn = $('.song-player__btn', song), text = $('.btn__text', btn), icon = $('.btn__icon', btn);
      const bar = $('.song-player__progress-bar', song), prog = $('.song-player__progress', song);
      const DUR = 84; let drone = null, playing = false, t0 = 0, offset = 0, raf = null;
      const iconPlay = icon.innerHTML;
      const iconPause = '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12"/><rect x="9" y="2" width="4" height="12"/></svg>';
      const render = () => { const el = playing ? (performance.now() - t0) / 1000 + offset : offset; const p = Math.min(1, el / DUR); bar.style.width = `${p * 100}%`; prog.setAttribute('aria-valuenow', String(Math.round(p * 100))); if (playing && p >= 1) stop(true); else if (playing) raf = requestAnimationFrame(render); };
      const stop = (reset) => { playing = false; cancelAnimationFrame(raf); if (drone) { drone.stop(); drone = null; } Audio.duckBg(false); text.textContent = 'Play'; icon.innerHTML = iconPlay; offset = reset ? 0 : offset; if (reset) bar.style.width = '0%'; if (current === api) current = null; };
      const play = async () => {
        if (current && current !== api) current.stop(false);
        await Audio.enable(); setSoundUI(true);
        drone = Audio.makeDrone(seed); if (drone) drone.fade(0.7, 2); Audio.duckBg(true);
        playing = true; t0 = performance.now(); text.textContent = 'Pause'; icon.innerHTML = iconPause; current = api; render();
      };
      const api = { stop: (r) => { if (playing) { offset += (performance.now() - t0) / 1000; } stop(r); } };
      btn.addEventListener('click', () => playing ? api.stop(false) : play());
      prog.addEventListener('click', (e) => { const r = prog.getBoundingClientRect(); const p = (e.clientX - r.left) / r.width; offset = p * DUR; t0 = performance.now(); if (!playing) render(); });
      // stop when scrolled far away
      if (hasGsap) ScrollTrigger.create({ trigger: song, start: 'top bottom', end: 'bottom top', onLeave: () => playing && api.stop(false), onLeaveBack: () => playing && api.stop(false) });
    });
  }

  /* ------------------------------------------------------------------
     Hero: background video (local mp4, YouTube fallback) + hover covers
  ------------------------------------------------------------------ */
  function initHero() {
    const hero = $('.hero'); if (!hero) return;
    const wr = $('.hero__video-wr'), video = $('.hero__video'), btn = $('.hero__video-btn');
    let playing = true;
    const useYouTube = () => {
      const id = video.dataset.youtube; if (!id || !video.isConnected) return;
      video.remove();
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1`;
      f.allow = 'autoplay; encrypted-media'; f.title = 'Bhavya Ramesh campaign film'; f.tabIndex = -1;
      wr.appendChild(f); wr.classList.add('-ready');
      btn.addEventListener('click', () => { playing = !playing; f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: playing ? 'playVideo' : 'pauseVideo', args: [] }), '*'); btn.classList.toggle('-paused', !playing); });
    };
    if (video) {
      const src = video.querySelector('source');
      if (src) fetch(src.getAttribute('src'), { method: 'HEAD' }).then((r) => { if (!r.ok) useYouTube(); }).catch(useYouTube);
      video.addEventListener('loadeddata', () => { wr.classList.add('-ready'); video.play().catch(() => {}); });
      video.addEventListener('error', useYouTube, true);
      if (src) src.addEventListener('error', useYouTube);
      btn.addEventListener('click', () => { if (!video.isConnected) return; playing ? video.pause() : video.play(); playing = !playing; btn.classList.toggle('-paused', !playing); });
    }
    const covers = $$('.hero__bg-featured-chapter');
    $$('.hero__index a[data-chapter]').forEach((a) => {
      a.addEventListener('mouseenter', () => covers.forEach((c) => c.classList.toggle('-is-active', c.dataset.chapter === a.dataset.chapter)));
      a.addEventListener('mouseleave', () => covers.forEach((c) => c.classList.remove('-is-active')));
      a.addEventListener('focus', () => covers.forEach((c) => c.classList.toggle('-is-active', c.dataset.chapter === a.dataset.chapter)));
      a.addEventListener('blur', () => covers.forEach((c) => c.classList.remove('-is-active')));
    });
    // pause the video while it is off-screen (keeps scrolling smooth)
    if (hasGsap && video) ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onLeave: () => video.isConnected && video.pause(), onEnterBack: () => video.isConnected && playing && video.play().catch(() => {}) });
  }

  /* ------------------------------------------------------------------
     Burger menu (shop page): slide-in side panel with The maker, Contact
  ------------------------------------------------------------------ */
  function initMenu() {
    const menu = $('#the-menu'), burger = $('.the-header__burger');
    if (!menu || !burger) return;
    const panel = $('.the-menu__panel', menu);
    let isOpen = false, t = null;
    const open = () => {
      if (isOpen) return; isOpen = true; clearTimeout(t);
      menu.hidden = false; void menu.offsetWidth;          // allow the transition to run
      menu.classList.add('-open'); burger.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('menu-lock'); if (lenis) lenis.stop();
      setTimeout(() => ($('.the-menu__link', panel) || panel).focus({ preventScroll: true }), 80);
    };
    const close = (handoff) => {
      if (!isOpen) return; isOpen = false;
      menu.classList.remove('-open'); burger.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('menu-lock');
      if (!handoff) { if (lenis) lenis.start(); burger.focus({ preventScroll: true }); }
      t = setTimeout(() => { menu.hidden = true; }, 700);
    };
    burger.addEventListener('click', () => (isOpen ? close() : open()));
    $$('[data-menu-close]', menu).forEach((b) => b.addEventListener('click', () => close()));
    $$('[data-menu-handoff]', menu).forEach((b) => b.addEventListener('click', () => close(true)));
    document.addEventListener('keydown', (ev) => {
      if (!isOpen) return;
      if (ev.key === 'Escape') close();
      if (ev.key === 'Tab') {                                // keep focus inside the panel
        const f = $$('button, a[href]', panel); const first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    });
    // swipe left to close on touch
    let sx = null;
    panel.addEventListener('touchstart', (ev) => { sx = ev.touches[0].clientX; }, { passive: true });
    panel.addEventListener('touchend', (ev) => { if (sx !== null && sx - ev.changedTouches[0].clientX > 60) close(); sx = null; }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Minimal scrollbar: native bar hidden (CSS), a thin thumb tracks the
     page and can be dragged. Hidden while scroll is locked (splash, modals).
  ------------------------------------------------------------------ */
  function initScrollbar() {
    const bar = document.createElement('div');
    bar.className = 'the-scrollbar'; bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="the-scrollbar__thumb"></div>';
    document.body.appendChild(bar);
    const thumb = bar.firstElementChild;
    let hideT = null, dragging = false, startY = 0, startScroll = 0;
    const metrics = () => {
      const vh = window.innerHeight, dh = document.documentElement.scrollHeight;
      const th = Math.max(40, vh * vh / Math.max(dh, 1));
      return { vh, dh, th, max: Math.max(dh - vh, 1) };
    };
    const update = () => {
      const { vh, dh, th, max } = metrics();
      const y = window.scrollY || document.documentElement.scrollTop;
      const locked = document.body.classList.contains('scroll-lock') || dh <= vh + 2;
      bar.classList.toggle('-hidden', locked);
      thumb.style.height = th + 'px';
      thumb.style.transform = `translateY(${(Math.min(y, max) / max) * (vh - th)}px)`;
      bar.classList.add('-active'); clearTimeout(hideT);
      if (!dragging) hideT = setTimeout(() => bar.classList.remove('-active'), 1200);
    };
    const to = (y) => (lenis ? lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y));
    thumb.addEventListener('pointerdown', (ev) => {
      dragging = true; startY = ev.clientY; startScroll = window.scrollY;
      thumb.setPointerCapture(ev.pointerId); bar.classList.add('-dragging'); ev.preventDefault();
    });
    thumb.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const { vh, th, max } = metrics();
      to(startScroll + (ev.clientY - startY) * (max / Math.max(vh - th, 1)));
    });
    const end = () => { dragging = false; bar.classList.remove('-dragging'); update(); };
    thumb.addEventListener('pointerup', end); thumb.addEventListener('pointercancel', end);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(document.body);
    update();
  }

  /* ------------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  function boot() {
    prepareText();
    observeReveals();
    initScrollEffects();
    initTrail();
    initGallery();
    initPlayers();
    initHero();
    initScrollbar();
    initMenu();
    updateProgress();
    if (hasGsap) { window.addEventListener('load', () => ScrollTrigger.refresh()); }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
})();
