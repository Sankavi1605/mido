/* ==========================================================================
   Mido — interactions
   1. Scroll reveal for text blocks (IntersectionObserver)
   2. Scroll parallax for decorative sprites (data-p = speed)
   3. Mouse parallax for the hero galaxy layers (data-mx = travel in px)
   4. Video: play only when visible, honour reduced motion
   ========================================================================== */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

  /* ---------- 1. Reveal ---------- */
  const reveal = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        reveal.unobserve(e.target);
      }
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.txt').forEach((el) => reveal.observe(el));

  /* ---------- 2. Scroll parallax ---------- */
  const sprites = Array.from(document.querySelectorAll('.deco[data-p]'));
  let ticking = false;

  function applyParallax() {
    ticking = false;
    if (reduceMotion || isMobile()) {
      sprites.forEach((s) => (s.style.transform = ''));
      return;
    }
    const vh = window.innerHeight;
    const mid = vh / 2;
    for (const s of sprites) {
      const r = s.getBoundingClientRect();
      // skip things far off screen
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const center = r.top + r.height / 2;
      const speed = parseFloat(s.dataset.p) || 0;
      const y = (center - mid) * speed;
      s.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  applyParallax();

  /* ---------- 3. Hero mouse parallax ---------- */
  const hero = document.querySelector('.hero');
  const heroLayers = Array.from(document.querySelectorAll('.hero .layer[data-mx]'));

  if (hero && heroLayers.length && !reduceMotion) {
    let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

    const animate = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      for (const l of heroLayers) {
        const amt = parseFloat(l.dataset.mx) || 0;
        // the star layer also has a CSS keyframe transform; we wrap it in a
        // parent-less translate via CSS var so both can coexist
        l.style.translate = `${(curX * amt).toFixed(2)}px ${(curY * amt).toFixed(2)}px`;
      }
      if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
        raf = requestAnimationFrame(animate);
      } else {
        raf = null;
      }
    };

    hero.addEventListener('pointermove', (e) => {
      if (isMobile()) return;
      const r = hero.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 .. 1
      targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(animate);
    });

    hero.addEventListener('pointerleave', () => {
      targetX = 0; targetY = 0;
      if (!raf) raf = requestAnimationFrame(animate);
    });
  }

  /* ---------- 3b. Hero particle field ---------- */
  const canvas = document.querySelector('.hero-particles');
  if (canvas && hero && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, particles = [], running = false, rafId = null, last = 0;

    const PALETTE = [
      [200, 160, 255],  // lavender
      [150, 90, 255],   // violet
      [255, 255, 255],  // white
      [120, 60, 230],   // deep purple
    ];

    function makeParticle(spawnAnywhere) {
      const size = Math.random();
      return {
        x: Math.random() * W,
        y: spawnAnywhere ? Math.random() * H : H + 10,
        r: 0.6 + size * 1.9,
        vy: -(0.08 + size * 0.35),
        vx: (Math.random() - 0.5) * 0.12,
        a: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        tw: 0.6 + Math.random() * 1.6,
        c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      };
    }

    function resize() {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(160, Math.round(W / 7));
      particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function frame(t) {
      if (!running) return;
      const dt = Math.min(48, t - last || 16) / 16;
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.vy * dt;
        p.x += p.vx * dt + Math.sin(t / 1400 + p.phase) * 0.05;
        if (p.y < -10 || p.x < -10 || p.x > W + 10) particles[i] = makeParticle(false);
        const twinkle = 0.55 + 0.45 * Math.sin(t / 1000 * p.tw + p.phase);
        const alpha = p.a * twinkle;
        const [cr, cg, cb] = p.c;
        // glow halo
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${(alpha * 0.18).toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        // core
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha.toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; last = 0; rafId = requestAnimationFrame(frame); } }
    function stop()  { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }

    resize();
    window.addEventListener('resize', () => { resize(); });

    // only animate while the hero is on screen
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    }, { threshold: 0.05 }).observe(hero);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (hero.getBoundingClientRect().bottom > 0) start();
    });
  }

  /* ---------- 4. Video ---------- */
  const video = document.querySelector('.vid');
  if (video) {
    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      const vio = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            video.play().catch(() => { /* autoplay blocked — poster stays */ });
          } else {
            video.pause();
          }
        }
      }, { threshold: 0.15 });
      vio.observe(video);
    }
  }

  /* ---------- Smooth in-page links (fallback for browsers w/o CSS smooth) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : document.body;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    });
  });
})();
