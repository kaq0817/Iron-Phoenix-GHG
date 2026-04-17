/* Go Hard Gaming Discord LLC DBA Iron Phoenix GHG — Quick Order controller (no dependencies) */
/* Works with snippets/quick-order-list.liquid */

(function () {
  'use strict';

  function $all(root, sel) { return Array.from((root || document).querySelectorAll(sel)); }
  function $(root, sel) { return (root || document).querySelector(sel); }

  function setMsg(form, text, type) {
    const msgEl = $('[data-qo-msg]', form);
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.classList.remove('is-error', 'is-success');
    if (type) msgEl.classList.add(type);
  }

  async function addItems(items) {
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ items })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (data && (data.description || data.message)) || 'Could not add to cart';
      throw new Error(err);
    }
    return data;
  }

  function bumpCartCount(by) {
    const badge = document.querySelector('.cart-count') || document.querySelector('[data-cart-count]');
    if (!badge) return;
    const current = parseInt(badge.textContent, 10) || 0;
    badge.textContent = String(current + by);
  }

  function wireForm(form) {
    const btn = $('[data-qo-submit]', form);
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Collect requested items
      const inputs = $all(form, 'input[data-variant-id]');
      const items = [];
      for (const input of inputs) {
        if (input.disabled) continue;
        const qty = parseInt(input.value, 10) || 0;
        if (qty > 0) {
          const id = parseInt(input.getAttribute('data-variant-id'), 10);
          if (id) items.push({ id, quantity: qty });
        }
      }

      if (items.length === 0) {
        setMsg(form, 'Choose quantities to add.', 'is-error');
        return;
      }

      // Lock UI
      btn.disabled = true;
      setMsg(form, 'Adding…');

      try {
        await addItems(items);
        // Success UI
        const total = items.reduce((a, b) => a + (b.quantity || 0), 0);
        setMsg(form, `Added ${total} item${total === 1 ? '' : 's'} to cart.`, 'is-success');

        // Reset inputs to 0
        inputs.forEach((el) => { if (!el.disabled) el.value = '0'; });

        // Nudge cart badge (best-effort)
        bumpCartCount(total);

        // Optional: emit a custom event (cart drawers can listen)
        document.dispatchEvent(new CustomEvent('quick-order:added', { detail: { total, items } }));
      } catch (err) {
        setMsg(form, err.message || 'Could not add to cart.', 'is-error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function init() {
    $all(document, 'form[data-qo-form]').forEach(wireForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
