document.addEventListener('click', (e) => {
  const btn = e.target.closest('.address-delete-button');
  if (!btn) return;
  const msg = btn.dataset.confirm || 'Delete this address?';
  if (confirm(msg)) {
    const form = btn.closest('form');
    if (form) form.submit();
  }
});
