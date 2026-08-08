// /assets/menu-drawer.js — Accessible drawer (with safe focus-trap fallbacks)
document.addEventListener('DOMContentLoaded', () => {
  const drawer = document.querySelector('menu-drawer#menu-drawer');
  if (!drawer) return;

  const panel = drawer.querySelector('.menu-drawer__panel');

  // Fallback focus trap if ShopUtils doesn't exist
  const fallbackTrap = (root) => {
    const selectors = 'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const f = Array.from(root.querySelectorAll(selectors)).filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return { first: null, last: null };
    const first = f[0], last = f[f.length - 1];
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    root._focusTrapHandler = onKey;
    document.addEventListener('keydown', onKey);
    first?.focus();
    return { first, last };
  };
  const fallbackUntrap = (root) => {
    if (root._focusTrapHandler) {
      document.removeEventListener('keydown', root._focusTrapHandler);
      delete root._focusTrapHandler;
    }
  };

  const { trapFocus, removeTrapFocus } = window.ShopUtils || {};
  const doTrap = trapFocus || ((node) => fallbackTrap(node));
  const doUntrap = removeTrapFocus || ((node) => fallbackUntrap(node));

  const openTriggers = document.querySelectorAll('[aria-controls="menu-drawer"]');
  const closeTriggers = drawer.querySelectorAll('[data-close-menu], .menu-drawer__close, .menu-drawer__overlay');

  const openDrawer = () => {
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('active');
    document.documentElement.classList.add('menu-drawer-open');
    (panel || drawer).focus?.();
    doTrap(panel || drawer);
    openTriggers.forEach((btn) => btn.setAttribute('aria-expanded', 'true'));
  };

  const closeDrawer = () => {
    drawer.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('active');
    document.documentElement.classList.remove('menu-drawer-open');
    doUntrap(panel || drawer);
    openTriggers.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
  };

  openTriggers.forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openDrawer(); }));
  closeTriggers.forEach((el) => el.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) closeDrawer();
  });

  // Re-bind on theme editor section reloads
  document.addEventListener('shopify:section:load', () => {
    openTriggers.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
  });
});
