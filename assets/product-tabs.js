// section-product-tabs.js
class ProductTabs {
  constructor(container) {
    this.container = container;
    this.tabButtons = container.querySelectorAll('.product-tab-button');
    this.tabPanels = container.querySelectorAll('.product-tab-panel');
    
    if (this.tabButtons.length === 0) return;
    
    this.init();
  }

  init() {
    // Add click listeners to tab buttons
    this.tabButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleTabClick(e));
    });

    // Add keyboard navigation
    this.container.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  handleTabClick(event) {
    const clickedButton = event.currentTarget;
    const targetPanelId = clickedButton.getAttribute('aria-controls');
    
    this.activateTab(clickedButton, targetPanelId);
  }

  activateTab(activeButton, activePanelId) {
    // Deactivate all tabs
    this.tabButtons.forEach(button => {
      button.classList.remove('is-active');
      button.setAttribute('aria-selected', 'false');
      button.setAttribute('tabindex', '-1');
    });

    this.tabPanels.forEach(panel => {
      panel.classList.add('is-hidden');
      panel.setAttribute('aria-hidden', 'true');
    });

    // Activate selected tab
    activeButton.classList.add('is-active');
    activeButton.setAttribute('aria-selected', 'true');
    activeButton.setAttribute('tabindex', '0');

    const activePanel = document.getElementById(activePanelId);
    if (activePanel) {
      activePanel.classList.remove('is-hidden');
      activePanel.setAttribute('aria-hidden', 'false');
    }
  }

  handleKeydown(event) {
    const focusedElement = document.activeElement;
    
    if (!focusedElement.classList.contains('product-tab-button')) return;

    const currentIndex = Array.from(this.tabButtons).indexOf(focusedElement);
    let targetIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        targetIndex = currentIndex > 0 ? currentIndex - 1 : this.tabButtons.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        targetIndex = currentIndex < this.tabButtons.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        targetIndex = this.tabButtons.length - 1;
        break;
      default:
        return;
    }

    const targetButton = this.tabButtons[targetIndex];
    const targetPanelId = targetButton.getAttribute('aria-controls');
    
    this.activateTab(targetButton, targetPanelId);
    targetButton.focus();
  }
}

// Initialize tabs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-tabs').forEach(container => {
    new ProductTabs(container);
  });
});

// Also handle dynamic content (if tabs are loaded via AJAX)
if (typeof window.Shopify !== 'undefined' && window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    const container = event.target.querySelector('.product-tabs');
    if (container) {
      new ProductTabs(container);
    }
  });
}