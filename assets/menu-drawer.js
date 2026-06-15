// /assets/menu-drawer.js — Accessible drawer using ShopUtils focus helpers
document.addEventListener('DOMContentLoaded', () => {
  // expect a <menu-drawer id="menu-drawer"> element
  const drawer = document.querySelector('menu-drawer#menu-drawer');
  if (!drawer) return;

  const { trapFocus, removeTrapFocus } = window.ShopUtils || {};
  // any button with aria-controls="menu-drawer" opens it
  const openTriggers = document.querySelectorAll('[aria-controls="menu-drawer"]');
  // elements inside the drawer that close it
  const closeTriggers = drawer.querySelectorAll('[data-close-menu], .menu-drawer__close, .menu-drawer__overlay');
  const panel = drawer.querySelector('.menu-drawer__panel');

  const openDrawer = () => {
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('active');
    document.body.classList.add('overflow-hidden');
    (panel || drawer).focus?.();
    trapFocus?.(panel || drawer);
    openTriggers.forEach((btn) => btn.setAttribute('aria-expanded', 'true'));
  };

  const closeDrawer = () => {
    drawer.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('active');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus?.(panel || drawer);
    openTriggers.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
  };

  openTriggers.forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); openDrawer(); }));
  closeTriggers.forEach((el) => el.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('active')) closeDrawer();
  });
});
