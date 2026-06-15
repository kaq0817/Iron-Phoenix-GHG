// assets/section-product-tabs.js

document.addEventListener('DOMContentLoaded', () => {
  function initializeProductTabs(sectionElement) {
    const tablist = sectionElement.querySelector('[role="tablist"]');
    const tabs = sectionElement.querySelectorAll('[role="tab"]');
    const panels = sectionElement.querySelectorAll('[role="tabpanel"]');

    if (!tablist || tabs.length === 0 || panels.length === 0) {
      return;
    }

    let activeTab = tabs[0]; // Set the first tab as active by default

    // Helper to activate a tab
    function activateTab(targetTab) {
      tabs.forEach(tab => {
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
        tab.classList.remove('is-active');
      });
      panels.forEach(panel => {
        panel.classList.add('is-hidden');
        panel.setAttribute('aria-hidden', 'true');
      });

      targetTab.setAttribute('aria-selected', 'true');
      targetTab.setAttribute('tabindex', '0');
      targetTab.classList.add('is-active');
      const targetPanel = sectionElement.querySelector(`#${targetTab.getAttribute('aria-controls')}`);
      targetPanel.classList.remove('is-hidden');
      targetPanel.setAttribute('aria-hidden', 'false');

      activeTab = targetTab;
      targetTab.focus(); // Focus the newly activated tab
    }

    // Click handler for tabs
    tablist.addEventListener('click', (event) => {
      const targetTab = event.target.closest('[role="tab"]');
      if (targetTab && !targetTab.classList.contains('is-active')) {
        activateTab(targetTab);
      }
    });

    // Keyboard navigation for tabs
    tablist.addEventListener('keydown', (event) => {
      let index = Array.from(tabs).indexOf(activeTab);
      let newIndex = index;

      switch (event.key) {
        case 'ArrowLeft':
          newIndex = index === 0 ? tabs.length - 1 : index - 1;
          event.preventDefault();
          break;
        case 'ArrowRight':
          newIndex = index === tabs.length - 1 ? 0 : index + 1;
          event.preventDefault();
          break;
        case 'Home':
          newIndex = 0;
          event.preventDefault();
          break;
        case 'End':
          newIndex = tabs.length - 1;
          event.preventDefault();
          break;
        default:
          return; // Do nothing for other keys
      }

      if (newIndex !== index) {
        activateTab(tabs[newIndex]);
      }
    });

    // Initialize first tab as active
    activateTab(tabs[0]);
  }

  // Initialize for all instances of the section on DOMContentLoaded
  document.querySelectorAll('.section-product-tabs').forEach(initializeProductTabs);

  // Re-initialize for new instances loaded via Shopify's theme editor
  document.addEventListener('shopify:section:load', (event) => {
    if (event.target.classList.contains('section-product-tabs')) {
      initializeProductTabs(event.target);
    }
  });
});