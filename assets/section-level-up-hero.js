// assets/section-level-up-hero.js
(function () {
  function initSection(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;

    // Respect padding coming from Liquid inline style; set only if missing
    if (!root.style.getPropertyValue('--lu-pad-top')) {
      root.style.setProperty('--lu-pad-top', ((cfg.pad_top ?? 64)) + 'px');
    }
    if (!root.style.getPropertyValue('--lu-pad-bot')) {
      root.style.setProperty('--lu-pad-bot', ((cfg.pad_bottom ?? 64)) + 'px');
    }

    // Ambient overlay glow (intensity slider is 0-60)
    const overlay = document.createElement('div');
    overlay.className = 'levelup-hero__overlay';
    const alpha = Math.max(0, Math.min(1, (cfg.overlay_opacity || 0) / 100));
    overlay.style.background = `radial-gradient(60% 60% at 50% 50%, rgba(57,255,20,${alpha}) 0%, transparent 70%)`;
    root.querySelector('.levelup-hero__bg')?.appendChild(overlay);

    // Floating particles
    let spawn = null;
    if (cfg.particles) {
      const holder = root.querySelector('.levelup-hero__particles');
      const palette = [cfg.colors.neonGreen, cfg.colors.neonPink, cfg.colors.cyan, cfg.colors.yellow];

      function createParticle() {
        const p = document.createElement('div');
        const size = Math.random() * 3 + 3;
        p.style.cssText = `
          position:absolute;width:${size}px;height:${size}px;border-radius:50%;
          background:${palette[Math.floor(Math.random()*palette.length)]};
          left:${Math.random()*100}%;
          top:100%;
          opacity:.6; transform: translateY(0) rotate(0deg);
          animation: LU-float ${4 + Math.random()*4}s linear forwards;
        `;
        holder.appendChild(p);
        setTimeout(() => p.remove(), 9000);
      }

      // one-time keyframes
      if (!document.getElementById('lu-float-key')) {
        const key = document.createElement('style');
        key.id = 'lu-float-key';
        key.textContent = `
          @keyframes LU-float {
            0% { transform: translateY(0) rotate(0deg); opacity:0; }
            10% { opacity:.6; }
            90% { opacity:.6; }
            100% { transform: translateY(-120vh) rotate(360deg); opacity:0; }
          }
        `;
        document.head.appendChild(key);
      }

      spawn = setInterval(createParticle, 800);
    }

    // Parallax
    function onScroll() {
      const content = root.querySelector('.levelup-hero__content');
      const particles = root.querySelector('.levelup-hero__particles');
      const rect = root.getBoundingClientRect();
      if (!rect) return;
      const offset = Math.max(0, -rect.top); // only after leaving top
      if (cfg.parallax && content) {
        content.style.transform = `translateY(${offset * 0.1}px)`;
      }
      if (cfg.parallax && particles) {
        particles.style.transform = `translateY(${offset * 0.05}px)`;
      }
    }
    if (cfg.parallax) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Animate stat counters when visible
    const statCards = root.querySelectorAll('.stat');
    let obs = null;
    if (statCards.length) {
      obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const numEl = e.target.querySelector('.stat__number');
          if (!numEl || numEl.dataset.luDone) return;

          const suffix = (numEl.dataset.suffix || '');
          const raw = (numEl.dataset.number || '0').toString();
          if (!/^\d+$/.test(raw)) {
            numEl.textContent = raw + suffix;
            numEl.dataset.luDone = '1';
            obs.unobserve(e.target);
            return;
          }

          const end = parseInt(raw, 10) || 0;
          const start = 0;
          const duration = 1400;
          const t0 = performance.now();

          function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
          function tick(now){
            const p = Math.min((now - t0)/duration, 1);
            const cur = Math.floor(start + (end - start) * easeOutCubic(p));
            numEl.textContent = cur + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);

          numEl.dataset.luDone = '1';
          obs.unobserve(e.target);
        });
      }, { threshold: 0.6 });

      statCards.forEach((c) => obs.observe(c));
    }

    // Subtle entrance fade
    requestAnimationFrame(() => {
      root.style.opacity = '0';
      root.style.transition = 'opacity .5s ease';
      requestAnimationFrame(() => root.style.opacity = '1');
    });

    // Cleanup on section unload in editor
    root.addEventListener('shopify:section:unload', () => {
      if (spawn) clearInterval(spawn);
      if (cfg.parallax) window.removeEventListener('scroll', onScroll);
      if (obs) obs.disconnect();
    });
  }

  // Drain queue on load / allow future pushes
  function drainQueue(){
    (window.LevelUpHeroQueue || []).forEach(initSection);
    window.LevelUpHeroQueue = { push: initSection };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drainQueue);
  } else {
    drainQueue();
  }
})();
