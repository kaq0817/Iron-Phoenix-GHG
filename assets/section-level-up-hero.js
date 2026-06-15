(function () {
  // Simple pub/sub for when sections mount (supports multiple instances)
  function initSection(cfg) {
    const root = document.getElementById(cfg.id);
    if (!root) return;

    // Respect theme padding settings via CSS vars
    const top = root.closest('[data-section-id]') ? null : null; // not needed; kept for clarity
    const st = root.getAttribute('style') || '';
    root.style.setProperty('--lu-pad-top', (window.LevelUpHeroPadTop || 64) + 'px');
    root.style.setProperty('--lu-pad-bot', (window.LevelUpHeroPadBot || 64) + 'px');

    // Overlay intensity via extra glow behind content
    const overlay = document.createElement('div');
    overlay.className = 'levelup-hero__overlay';
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = `radial-gradient(60% 60% at 50% 50%, rgba(57,255,20,${cfg.overlay_opacity/200}) 0%, transparent 70%)`;
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '0';
    root.querySelector('.levelup-hero__bg').appendChild(overlay);

    // Floating particles
    if (cfg.particles) {
      const holder = root.querySelector('.levelup-hero__particles');
      const palette = [cfg.colors.neonGreen, cfg.colors.neonPink, cfg.colors.cyan, cfg.colors.yellow];

      function createParticle() {
        const p = document.createElement('div');
        p.className = 'LU-p';
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

      const key = document.createElement('style');
      key.textContent = `
        @keyframes LU-float {
          0% { transform: translateY(0) rotate(0deg); opacity:0; }
          10% { opacity:.6; }
          90% { opacity:.6; }
          100% { transform: translateY(-120vh) rotate(360deg); opacity:0; }
        }
      `;
      document.head.appendChild(key);

      const spawn = setInterval(createParticle, 800);
      root.addEventListener('shopify:section:unload', () => clearInterval(spawn));
    }

    // Parallax
    if (cfg.parallax) {
      const content = root.querySelector('.levelup-hero__content');
      const particles = root.querySelector('.levelup-hero__particles');
      const onScroll = () => {
        const scrolled = window.pageYOffset;
        if (!root.getBoundingClientRect) return;
        content.style.transform = `translateY(${scrolled * 0.3}px)`;
        particles.style.transform = `translateY(${scrolled * 0.1}px)`;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      root.addEventListener('shopify:section:unload', () => window.removeEventListener('scroll', onScroll));
    }

    // Animate stat counters when visible
    const statCards = root.querySelectorAll('.stat');
    if (statCards.length) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const numEl = e.target.querySelector('.stat__number');
          if (!numEl || numEl.dataset.luDone) return;

          const suffix = (numEl.dataset.suffix || '');
          const raw = (numEl.dataset.number || '0').toString();
          // If number includes non-digits (like 24/7), don't animate—just show it.
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
      root.addEventListener('shopify:section:unload', () => obs.disconnect());
    }

    // Subtle entrance fade to avoid jarring loads
    requestAnimationFrame(() => {
      root.style.opacity = '0';
      root.style.transition = 'opacity .5s ease';
      requestAnimationFrame(() => root.style.opacity = '1');
    });
  }

  // Drain queue on load
  function drainQueue(){
    (window.LevelUpHeroQueue || []).forEach(initSection);
    window.LevelUpHeroQueue = { push: initSection }; // hijack push for late sections
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drainQueue);
  } else {
    drainQueue();
  }
})();
