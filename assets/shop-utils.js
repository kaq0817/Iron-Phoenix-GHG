/* /assets/shop-utils.js */
(() => {
  // --- Timing ---
  function debounce(fn, wait){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a), wait); }; }
  function throttle(fn, delay){ let l=0; return function(...a){ const n=Date.now(); if(n-l<delay) return; l=n; return fn.apply(this,a); }; };

  // --- PubSub ---
  const PUB_SUB_EVENTS = {
    quantityUpdate: 'quantityUpdate',
    optionValueSelectionChange: 'optionValueSelectionChange',
    cartUpdate: 'cartUpdate',
    variantChange: 'variantChange',
    cartError: 'cartError'
  };
  const __subs = {};
  function subscribe(evt, cb){ (__subs[evt] ??= []).push(cb); return () => { __subs[evt] = (__subs[evt]||[]).filter(f => f !== cb); }; }
  function publish(evt, data){ (__subs[evt]||[]).forEach(cb => cb(data)); }

  // --- Focus & A11y ---
  function getFocusableElements(c){
    return Array.from(c.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    ));
  }
  function trapFocus(container, initialEl = container){
    removeTrapFocus();
    const els = getFocusableElements(container);
    const first = els[0], last = els[els.length - 1];
    function keydownHandler(e){
      if (e.key !== 'Tab' && e.code !== 'Tab') return;
      if (!els.length) return;
      if (e.shiftKey){
        if (document.activeElement === first || document.activeElement === container){ e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last){ e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', keydownHandler);
    container.__trapFocusKeydownHandler = keydownHandler;
    initialEl?.focus?.();
    if (initialEl?.tagName === 'INPUT' && ['search','text','email','url'].includes(initialEl.type) && initialEl.value){
      initialEl.setSelectionRange(0, initialEl.value.length);
    }
  }
  function removeTrapFocus(container = document){
    const h = container.__trapFocusKeydownHandler;
    if (h){ document.removeEventListener('keydown', h); delete container.__trapFocusKeydownHandler; }
  }
  function onKeyUpEscape(e){
    if (e.key !== 'Escape' && e.code !== 'Escape') return;
    const openDetails = e.target.closest('details[open]');
    if (!openDetails) return;
    const summary = openDetails.querySelector('summary');
    openDetails.removeAttribute('open');
    summary?.setAttribute('aria-expanded', 'false');
    summary?.focus();
  }

  // --- Media helpers ---
  function pauseAllMedia(){
    document.querySelectorAll('.js-youtube').forEach((el) => {
      el.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    });
    document.querySelectorAll('.js-vimeo').forEach((el) => {
      el.contentWindow?.postMessage('{"method":"pause"}', '*');
    });
    document.querySelectorAll('video').forEach((v) => v.pause?.());
    document.querySelectorAll('product-model').forEach((m) => { if (m.modelViewerUI) m.modelViewerUI.pause?.(); });
  }
  function loadDeferredMedia(host){
    if (!host || host.getAttribute('loaded')) return;
    const tmp = document.createElement('div');
    tmp.appendChild(host.querySelector('template')?.content.firstElementChild.cloneNode(true));
    host.setAttribute('loaded', 'true');
    const el = tmp.querySelector('video, model-viewer, iframe');
    if (!el) return;
    const injected = host.appendChild(el);
    if (el.nodeName === 'VIDEO' && el.getAttribute('autoplay')) injected.play?.();
    return injected;
  }

  // --- Country/Province selector (hardened: textContent instead of innerHTML) ---
  class CountryProvinceSelector{
    constructor(countryId, provinceId, opts = {}){
      this.countryEl = document.getElementById(countryId);
      this.provinceEl = document.getElementById(provinceId);
      this.provinceContainer = document.getElementById(opts['hideElement'] || provinceId);
      if (!this.countryEl || !this.provinceEl) return;
      this.initCountry(); this.initProvince();
      this.countryEl.addEventListener('change', this.countryHandler.bind(this));
    }
    initCountry(){ const def = this.countryEl.getAttribute('data-default'); this.setSelectorByValue(this.countryEl, def); this.countryHandler(); }
    initProvince(){ const def = this.provinceEl.getAttribute('data-default'); if (def && this.provinceEl.options.length > 0) this.setSelectorByValue(this.provinceEl, def); }
    countryHandler(){
      const opt = this.countryEl.options[this.countryEl.selectedIndex];
      const provinces = JSON.parse(opt.getAttribute('data-provinces') || '[]');
      this.clearOptions(this.provinceEl);
      if (!provinces.length){
        if (this.provinceContainer) this.provinceContainer.style.display = 'none';
      } else {
        provinces.forEach(([val, text]) => {
          const o = document.createElement('option');
          o.value = val;
          o.textContent = text; // safer than innerHTML
          this.provinceEl.appendChild(o);
        });
        if (this.provinceContainer) this.provinceContainer.style.display = '';
      }
    }
    setSelectorByValue(select, value){
      Array.from(select.options).forEach((o, i) => {
        if (value === o.value || value === o.textContent) select.selectedIndex = i;
      });
    }
    clearOptions(s){ while (s.firstChild) s.removeChild(s.firstChild); }
  }

  // --- HTML update utility ---
  class HTMLUpdateUtility{
    static viewTransition(oldNode, newContent, before = [], after = []){
      if (!oldNode || !newContent) return;
      before.forEach(cb => cb(newContent));
      const wrap = document.createElement('div');
      HTMLUpdateUtility.setInnerHTML(wrap, newContent.outerHTML);
      const newNode = wrap.firstChild;
      oldNode.parentNode.insertBefore(newNode, oldNode);
      oldNode.style.display = 'none';
      after.forEach(cb => cb(newNode));
      setTimeout(() => oldNode.remove(), 300);
    }
    static setInnerHTML(el, html){
      el.innerHTML = html; // expects trusted HTML from server-side (Shopify)
      el.querySelectorAll('script').forEach((oldS) => {
        const s = document.createElement('script');
        Array.from(oldS.attributes).forEach(a => s.setAttribute(a.name, a.value));
        s.appendChild(document.createTextNode(oldS.innerHTML));
        oldS.parentNode.replaceChild(s, oldS);
      });
    }
  }

  // Optional perf helper (design mode only)
  let CartPerformance = undefined;
  try{
    if (window.Shopify && Shopify.designMode){
      CartPerformance = class {
        static #p = 'cart-performance';
        static measure(n, fn){
          const k = `${this.#p}:${n}`;
          performance.mark(`${k}:start`);
          fn();
          performance.mark(`${k}:end`);
          performance.measure(k, `${k}:start`, `${k}:end`);
        }
      };
      window.CartPerformance = CartPerformance;
    }
  }catch(e){}

  // Single global for all utilities
  window.ShopUtils = {
    debounce, throttle,
    PUB_SUB_EVENTS, subscribe, publish,
    getFocusableElements, trapFocus, removeTrapFocus, onKeyUpEscape,
    pauseAllMedia, loadDeferredMedia,
    CountryProvinceSelector, HTMLUpdateUtility, CartPerformance
  };

  // Legacy convenience globals (optional)
  window.trapFocus = window.trapFocus || trapFocus;
  window.removeTrapFocus = window.removeTrapFocus || removeTrapFocus;
  window.onKeyUpEscape = window.onKeyUpEscape || onKeyUpEscape;
})();
