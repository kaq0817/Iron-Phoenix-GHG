/* path: assets/theme.js */
/* Iron Phoenix GHG — lean runtime: drawers, accessibility, AJAX cart, section lifecycle */

(() => {
  'use strict';

  /* -----------------------------
   * Lightweight PubSub (global)
   * ----------------------------- */
  const IPX = (function () {
    const events = {};
    return {
      on(evt, cb) {
        (events[evt] = events[evt] || []).push(cb);
        return () => this.off(evt, cb);
      },
      off(evt, cb) {
        if (!events[evt]) return;
        events[evt] = events[evt].filter((f) => f !== cb);
      },
      emit(evt, payload) {
        (events[evt] || []).forEach((f) => {
          try { f(payload); } catch (e) { console.error(e); }
        });
      }
    };
  })();
  window.IPX = window.IPX || IPX;

  // Ensure dataLayer for GTM
  window.dataLayer = window.dataLayer || [];

  /* -----------------------------
   * Utils
   * ----------------------------- */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const isFocusable = (el) => {
    if (!el) return false;
    const focusables = ['a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])', 'summary'];
    return el.matches(focusables.join(','));
  };

  // Focus trap
  let lastActiveElement = null;
  const trapFocus = (container, initial = null) => {
    if (!container) return;
    lastActiveElement = document.activeElement;
    const focusables = qsa('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), summary', container)
      .filter((el) => el.offsetParent !== null || el.tagName.toLowerCase() === 'summary');
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const onKeydown = (e) => {
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      // shift+tab
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      // tab
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.__trapHandler = onKeydown;
    container.addEventListener('keydown', onKeydown);
    (initial && isFocusable(initial) ? initial : first || container).focus({ preventScroll: true });
  };

  const removeTrapFocus = (container) => {
    if (!container || !container.__trapHandler) return;
    container.removeEventListener('keydown', container.__trapHandler);
    container.__trapHandler = null;
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus({ preventScroll: true });
    }
    lastActiveElement = null;
  };

  // Body scroll lock helpers
  const lockScroll = () => document.body.classList.add('overflow-hidden');
  const unlockScroll = () => document.body.classList.remove('overflow-hidden');

  /* -----------------------------
   * Cart Drawer Web Component
   * ----------------------------- */
  class _CartDrawer extends HTMLElement {
    constructor() {
      super();
      this._boundEsc = (e) => e.key === 'Escape' && this.close();
      this._overlay = qs('#CartDrawer-Overlay', this);
      this._panel = qs('.cart-drawer__panel', this);
      this._closeBtn = qs('[data-close-drawer]', this);

      if (this._overlay) this._overlay.addEventListener('click', () => this.close());
      if (this._closeBtn) this._closeBtn.addEventListener('click', () => this.close());

      // Header icon hookup
      const icon = document.getElementById('cart-icon-bubble');
      if (icon) {
        icon.setAttribute('role', 'button');
        icon.setAttribute('aria-haspopup', 'dialog');
        icon.addEventListener('click', (e) => {
          e.preventDefault();
          this.open(icon);
        });
        icon.addEventListener('keydown', (e) => {
          if (e.code && e.code.toUpperCase() === 'SPACE') {
            e.preventDefault();
            this.open(icon);
          }
        });
      }
    }

    open(triggerEl = null) {
      if (triggerEl) lastActiveElement = triggerEl;

      this.setAttribute('aria-hidden', 'false');
      this.classList.add('active', 'animate');
      lockScroll();

      document.addEventListener('keydown', this._boundEsc, { once: false });
      const focusTarget = this._panel || this;
      trapFocus(this, focusTarget);
      IPX.emit('drawer:cart:open');
    }

    close() {
      this.setAttribute('aria-hidden', 'true');
      this.classList.remove('active');
      removeTrapFocus(this);
      unlockScroll();

      document.removeEventListener('keydown', this._boundEsc);
      IPX.emit('drawer:cart:close');
    }

    // Replace inner content of specific parts after /?sections=… fetch
    renderFromSectionsPayload(payload) {
      try {
        // payload is an object { "cart-drawer": "<html>", "cart-icon-bubble": "<html>" }
        const parser = new DOMParser();

        if (payload['cart-drawer']) {
          const doc = parser.parseFromString(payload['cart-drawer'], 'text/html');
          const fresh = doc.querySelector('#CartDrawer');
          if (fresh) {
            // Replace inner of this drawer with fresh drawer inner (maintain component instance)
            const inner = fresh.innerHTML;
            this.innerHTML = inner;
            // Rebind overlay/close after replace
            this._overlay = qs('#CartDrawer-Overlay', this);
            this._panel = qs('.cart-drawer__panel', this);
            this._closeBtn = qs('[data-close-drawer]', this);
            if (this._overlay) this._overlay.addEventListener('click', () => this.close());
            if (this._closeBtn) this._closeBtn.addEventListener('click', () => this.close());
          }
        }

        if (payload['cart-icon-bubble']) {
          const doc2 = parser.parseFromString(payload['cart-icon-bubble'], 'text/html');
          const freshIcon = doc2.querySelector('#cart-icon-bubble');
          if (freshIcon) {
            const oldIcon = document.getElementById('cart-icon-bubble');
            if (oldIcon && oldIcon.parentNode) {
              oldIcon.parentNode.replaceChild(freshIcon, oldIcon);
            }
          }
        }
      } catch (e) {
        console.warn('Cart drawer refresh failed:', e);
      }
    }
  }

  if (!customElements.get('cart-drawer')) {
    customElements.define('cart-drawer', _CartDrawer);
  }

  const getCartDrawerEl = () => document.querySelector('cart-drawer#CartDrawer');

  /* -----------------------------
   * Menu Drawer (header nav)
   * ----------------------------- */
  const MenuDrawer = (() => {
    let drawer, toggleBtn, overlay, closeBtn;

    const cache = () => {
      drawer = qs('#MenuDrawer');
      toggleBtn = qs('#menu-drawer-toggle');
      overlay = drawer ? qs('[data-menu-overlay]', drawer) : null;
      closeBtn = drawer ? qs('[data-close-menu]', drawer) : null;
    };

    const open = () => {
      if (!drawer) return;
      drawer.classList.add('active', 'animate');
      drawer.setAttribute('aria-hidden', 'false');
      lockScroll();
      trapFocus(drawer, qs('button, a, [tabindex]:not([tabindex="-1"])', drawer));
      IPX.emit('drawer:menu:open');
    };

    const close = () => {
      if (!drawer) return;
      drawer.classList.remove('active');
      drawer.setAttribute('aria-hidden', 'true');
      removeTrapFocus(drawer);
      unlockScroll();
      IPX.emit('drawer:menu:close');
    };

    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };

    const bind = () => {
      cache();
      if (!drawer || !toggleBtn) return;

      toggleBtn.setAttribute('aria-haspopup', 'dialog');
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (drawer.classList.contains('active')) close();
        else open();
      });

      if (overlay) overlay.addEventListener('click', close);
      if (closeBtn) closeBtn.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
    };

    const unbind = () => {
      document.removeEventListener('keydown', onKey);
    };

    return { bind, unbind, open, close };
  })();

  /* -----------------------------
   * AJAX Add to Cart + Refresh
   * ----------------------------- */
  const refreshCartSections = async () => {
    try {
      const url = `${window.location.pathname}?sections=cart-drawer,cart-icon-bubble`;
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      const cd = getCartDrawerEl();
      if (cd) cd.renderFromSectionsPayload(data);
    } catch (e) {
      console.warn('Section refresh error', e);
    }
  };

  const interceptAddToCart = () => {
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      const action = (form.getAttribute('action') || '').toLowerCase();
      if (!action.includes('/cart/add')) return;
      if (form.hasAttribute('data-no-ajax')) return;

      e.preventDefault();

      const fd = new FormData(form);
      // Shopify JS endpoint
      const endpoint = (window.routes && window.routes.cart_add_url) || '/cart/add.js';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: fd,
          credentials: 'same-origin',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!res.ok) throw new Error('Add to cart failed');

        const lineItem = await res.json();

        // GTM: push add_to_cart
        window.dataLayer.push({
          event: 'add_to_cart',
          ecommerce: {
            items: [
              {
                item_id: lineItem.id,
                item_name: lineItem.title,
                quantity: Number(fd.get('quantity') || 1)
              }
            ]
          }
        });

        await refreshCartSections();

        // Open cart drawer
        const cd = getCartDrawerEl();
        if (cd) cd.open();
        IPX.emit('cart:add', { lineItem });
      } catch (err) {
        console.error(err);
        IPX.emit('cart:add:error', { error: err });
        // Fallback: redirect to cart page if AJAX fails
        window.location.href = (window.routes && window.routes.cart_url) || '/cart';
      }
    });
  };

  /* -----------------------------
   * Sticky Header (simple)
   * ----------------------------- */
  const stickyHeader = () => {
    const wrapper = qs('.section-header');
    if (!wrapper) return;

    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY && y > 40) {
        wrapper.classList.add('shopify-section-header-hidden', 'shopify-section-header-sticky');
      } else if (y < lastY) {
        wrapper.classList.add('shopify-section-header-sticky');
        wrapper.classList.remove('shopify-section-header-hidden');
      }
      if (y <= 1) wrapper.classList.remove('shopify-section-header-sticky', 'shopify-section-header-hidden');
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  /* -----------------------------
   * Quantity controls (min=1)
   * ----------------------------- */
  const bindQtyControls = () => {
    document.addEventListener('click', (e) => {
      const inc = e.target.closest('[data-qty-increase]');
      const dec = e.target.closest('[data-qty-decrease]');
      const input = inc?.closest('[data-qty]')?.querySelector('input[type="number"]')
        || dec?.closest('[data-qty]')?.querySelector('input[type="number"]');
      if (!input) return;

      const min = Number(input.getAttribute('min') || 1);
      const step = Number(input.getAttribute('step') || 1);

      if (inc) {
        input.value = String(Number(input.value || min) + step);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (dec) {
        const next = Math.max(min, Number(input.value || min) - step);
        input.value = String(next);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  };

  /* -----------------------------
   * Shopify Section lifecycle
   * ----------------------------- */
  const rebindAll = () => {
    // Re-bind menu drawer (safe even if not present)
    MenuDrawer.bind();
    // Cart icon may have been re-rendered
    const cd = getCartDrawerEl();
    if (cd && !cd.classList.contains('active')) {
      // ensure overlay/clicks are bound (component ctor handles)
    }
  };

  document.addEventListener('shopify:section:load', rebindAll);
  document.addEventListener('shopify:section:unload', () => {});
  document.addEventListener('shopify:section:select', () => {});
  document.addEventListener('shopify:section:deselect', () => {});
  document.addEventListener('shopify:block:select', () => {});
  document.addEventListener('shopify:block:deselect', () => {});

  /* -----------------------------
   * Boot
   * ----------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    // Define routes fallback if theme didn’t inject window.routes
    window.routes = window.routes || {
      cart_add_url: '/cart/add.js',
      cart_change_url: '/cart/change.js',
      cart_update_url: '/cart/update.js',
      cart_url: '/cart'
    };

    // Enable features
    MenuDrawer.bind();
    stickyHeader();
    bindQtyControls();
    interceptAddToCart();

    // Optional: open drawer when URL has ?openCart=1 (useful for testing)
    if (new URLSearchParams(location.search).get('openCart') === '1') {
      const cd = getCartDrawerEl();
      cd && cd.open();
    }
  });
})();
