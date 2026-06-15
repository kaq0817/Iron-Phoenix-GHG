// snippet-paywall.js
(function () {
  function attachGateGuards(root) {
    var gates = (root || document).querySelectorAll('.ipx-gate');
    if (!gates.length) return;

    function insideGate(target) {
      return Array.prototype.some.call(gates, function (g) { return g.contains(target); });
    }

    document.addEventListener('contextmenu', function (e) {
      if (insideGate(e.target)) { e.preventDefault(); }
    }, { passive: false });

    document.addEventListener('copy', function (e) {
      if (insideGate(e.target)) { e.preventDefault(); }
    });

    document.addEventListener('keydown', function (e) {
      var k = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['c', 's', 'u', 'p'].includes(k) && insideGate(document.activeElement || e.target)) {
        e.preventDefault();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { attachGateGuards(document); });
  } else {
    attachGateGuards(document);
  }
})();
