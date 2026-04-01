// assets/product-modal.js
(() => {
  const SEL = {
    modal: '#ProductMediaModal',
    body: '[data-ip-modal-body]',
    close: '[data-ip-modal-close]',
    tmpl: '[data-ip-media-template]',
    mediaWrapper: '.product__media, [data-product-single-media-wrapper]',
  };

  let modal, body, activeTrigger = null, lastFocus = null;

  function $(root, s) { return (root || document).querySelector(s); }
  function $all(root, s) { return Array.from((root || document).querySelectorAll(s)); }

  function openWithTemplateId(tplId, trigger) {
    const tpl = document.getElementById(`ip-media-${tplId}`);
    if (!tpl) return;
    activeTrigger = trigger || null;
    lastFocus = document.activeElement;
    body.innerHTML = '';
    body.appendChild(tpl.content.cloneNode(true));
    showModal();
  }

  function showModal() {
    modal.hidden = false;
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      // Focus trap entry:
      body.setAttribute('tabindex', '-1');
      body.focus();
      document.addEventListener('keydown', onKeydown, { passive: false });
    });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.removeEventListener('keydown', onKeydown);
    setTimeout(() => {
      modal.hidden = true;
      body.innerHTML = '';
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }, 180);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    // rudimentary focus trap
    if (e.key === 'Tab') {
      const focusables = getFocusables(modal);
      if (!focusables.length) return;
      const idx = focusables.indexOf(document.activeElement);
      let next = idx;
      if (e.shiftKey) next = idx <= 0 ? focusables.length - 1 : idx - 1;
      else next = idx === focusables.length - 1 ? 0 : idx + 1;
      if (idx === -1) next = 0;
      if (focusables[next]) {
        e.preventDefault();
        focusables[next].focus();
      }
    }
  }

  function getFocusables(root) {
    return $all(root, [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')).filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }

  function clickDelegation(e) {
    const t = e.target.closest('[data-media-open], [data-media-id], [data-product-media-trigger]');
    if (!t) return;

    // Priority: explicit data-media-open
    let mediaId = t.getAttribute('data-media-open');
    if (!mediaId) mediaId = t.getAttribute('data-media-id');

    // Fallback: read from closest wrapper
    if (!mediaId) {
      const wrap = e.target.closest(SEL.mediaWrapper);
      if (wrap && wrap.dataset && wrap.dataset.mediaId) {
        mediaId = wrap.dataset.mediaId;
      }
    }

    // Final fallback: index → nth template
    if (!mediaId) {
      const tmpls = $all(document, SEL.tmpl);
      const i = tmpls.indexOf(tmpls.find(Boolean));
      mediaId = tmpls[i] && tmpls[i].id.replace('ip-media-', '');
    }

    if (mediaId) {
      e.preventDefault();
      openWithTemplateId(mediaId, t);
    }
  }

  function wire() {
    modal = $(document, SEL.modal);
    body = $(document, SEL.body);
    if (!modal || !body) return;

    document.addEventListener('click', clickDelegation);
    $all(modal, SEL.close).forEach(btn => btn.addEventListener('click', closeModal));
    const overlay = $(modal, '.ip-modal__overlay');
    overlay && overlay.addEventListener('click', closeModal);
  }

  function unwire() {
    document.removeEventListener('click', clickDelegation);
  }

  // Theme Editor lifecycle
  document.addEventListener('shopify:section:load', (evt) => {
    if (evt.target && evt.target.querySelector(SEL.modal)) {
      unwire();
      wire();
    }
  });
  document.addEventListener('shopify:section:unload', (evt) => {
    if (evt.target && evt.target.querySelector(SEL.modal)) {
      unwire();
    }
  });

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
