/* /assets/global.js */
(() => {
  // Ensure window.ShopUtils exists and destructure the required functions
  const { onKeyUpEscape, publish, subscribe, PUB_SUB_EVENTS } = window.ShopUtils || {};

  // Attach global event listener for escape key if available
  if (onKeyUpEscape) {
    document.addEventListener('keyup', onKeyUpEscape);
  }

  // Optional shims for legacy callers that might expect these to be global,
  // pointing to the consolidated ShopUtils versions.
  // This is safer than directly assigning, as it respects existing globals.
  if (publish && !window.publish) window.publish = publish;
  if (subscribe && !window.subscribe) window.subscribe = subscribe;
  if (PUB_SUB_EVENTS && !window.PUB_SUB_EVENTS) window.PUB_SUB_EVENTS = PUB_SUB_EVENTS;
})();