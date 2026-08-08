// /assets/media-utils.js — lightweight adapters to ShopUtils
(() => {
  const su = window.ShopUtils || {};
  // Create global helpers for legacy callers, pointing to ShopUtils
  if (su.pauseAllMedia && !window.pauseAllMedia) window.pauseAllMedia = su.pauseAllMedia;
  if (su.loadDeferredMedia && !window.loadDeferredMedia) window.loadDeferredMedia = su.loadDeferredMedia;
})();
