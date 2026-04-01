// Safe Product Page Enhancer - Won't break existing functionality
// Only adds enhancements, doesn't replace existing elements

class SafeProductPageEnhancer {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  init() {
    // Prevent multiple initializations
    if (this.isInitialized) return;
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhance());
    } else {
      this.enhance();
    }
  }

  enhance() {
    try {
      this.enhanceImageGallery();
      this.enhanceQuantityControls();
      this.addImageZoom();
      this.improveAccessibility();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Product enhancer encountered an error:', error);
    }
  }

  // Only enhance existing image galleries, don't replace them
  enhanceImageGallery() {
    const mediaContainers = document.querySelectorAll([
      '.product__media',
      '.product-single__photos',
      '[class*="product"][class*="media"]',
      '.product__media-wrapper'
    ].join(', '));

    mediaContainers.forEach(container => {
      this.addImageLazyLoading(container);
      this.addImageErrorHandling(container);
    });
  }

  addImageLazyLoading(container) {
    const images = container.querySelectorAll('img:not([loading])');
    
    images.forEach(img => {
      // Add lazy loading if not already set
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Ensure images don't break layout
      if (!img.style.maxWidth) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
  }

  addImageErrorHandling(container) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
      img.addEventListener('error', function(e) {
        // Hide broken images gracefully
        this.style.display = 'none';
        console.warn('Failed to load product image:', this.src);
      }, { once: true });
    });
  }

  // Add zoom functionality without breaking existing galleries
  addImageZoom() {
    const mainImages = document.querySelectorAll([
      '.product__media img',
      '.product-single__photos img:first-child',
      '.product__media-main img'
    ].join(', '));

    mainImages.forEach(img => {
      // Only add zoom if image is large enough
      img.addEventListener('load', function() {
        if (this.naturalWidth > 800) {
          this.style.cursor = 'zoom-in';
          this.addEventListener('click', (e) => {
            e.preventDefault();
            this.openImageModal(this);
          });
        }
      });
    });
  }

  openImageModal(img) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'product-image-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: zoom-out;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const modalImg = document.createElement('img');
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalImg.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
    `;

    modal.appendChild(modalImg);
    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
    });

    // Close modal on click
    modal.addEventListener('click', () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    });

    // Close modal on escape key
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') {
        modal.click();
        document.removeEventListener('keydown', closeOnEscape);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
  }

  // Enhance quantity controls without breaking existing ones
  enhanceQuantityControls() {
    const quantityInputs = document.querySelectorAll([
      'input[name="quantity"]',
      '.quantity__input',
      '[name*="quantity"]'
    ].join(', '));

    quantityInputs.forEach(input => {
      this.addQuantityValidation(input);
      this.addQuantityKeyboardSupport(input);
    });
  }

  addQuantityValidation(input) {
    input.addEventListener('input', function() {
      const value = parseInt(this.value);
      const min = parseInt(this.min) || 1;
      const max = parseInt(this.max) || 999;

      if (isNaN(value) || value < min) {
        this.value = min;
      } else if (value > max) {
        this.value = max;
      }
    });

    // Prevent invalid characters
    input.addEventListener('keypress', function(e) {
      if (!/[0-9]/.test(e.key) && 
          !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  addQuantityKeyboardSupport(input) {
    input.addEventListener('keydown', function(e) {
      const currentValue = parseInt(this.value) || 1;
      const min = parseInt(this.min) || 1;
      const max = parseInt(this.max) || 999;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentValue < max) {
          this.value = currentValue + 1;
          this.dispatchEvent(new Event('change'));
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentValue > min) {
          this.value = currentValue - 1;
          this.dispatchEvent(new Event('change'));
        }
      }
    });
  }

  // Improve accessibility without breaking existing functionality
  improveAccessibility() {
    // Add skip links for product sections
    this.addSkipLinks();
    
    // Enhance form labels
    this.enhanceFormLabels();
    
    // Add ARIA attributes where missing
    this.addAriaAttributes();
  }

  addSkipLinks() {
    const productContainer = document.querySelector([
      '.product',
      '.product-single',
      '[class*="product-"]'
    ].join(', '));

    if (productContainer && !document.querySelector('.skip-to-product')) {
      const skipLink = document.createElement('a');
      skipLink.href = '#product-info';
      skipLink.className = 'skip-to-product sr-only';
      skipLink.textContent = 'Skip to product information';
      skipLink.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;

      // Show skip link on focus
      skipLink.addEventListener('focus', function() {
        this.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          background: white;
          color: black;
          padding: 8px 12px;
          text-decoration: none;
          border: 2px solid black;
          z-index: 10000;
        `;
      });

      skipLink.addEventListener('blur', function() {
        this.style.cssText = `
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        `;
      });

      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  enhanceFormLabels() {
    // Find unlabeled inputs and add labels
    const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    
    unlabeledInputs.forEach(input => {
      if (input.name === 'quantity' && !input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', 'Quantity');
      }
      
      if (input.type === 'radio' && input.name === 'id' && !input.getAttribute('aria-label')) {
        const parentLabel = input.closest('label');
        if (!parentLabel) {
          input.setAttribute('aria-label', `Select ${input.value}`);
        }
      }
    });
  }

  addAriaAttributes() {
    // Add aria-expanded to collapsible elements
    const collapsibleButtons = document.querySelectorAll([
      '[data-toggle]',
      '.collapsible-trigger',
      '[class*="accordion"]'
    ].join(', '));

    collapsibleButtons.forEach(button => {
      if (!button.hasAttribute('aria-expanded')) {
        button.setAttribute('aria-expanded', 'false');
        
        button.addEventListener('click', function() {
          const isExpanded = this.getAttribute('aria-expanded') === 'true';
          this.setAttribute('aria-expanded', !isExpanded);
        });
      }
    });

    // Add alt text to images missing it
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    imagesWithoutAlt.forEach(img => {
      // Try to get alt text from nearby text or product title
      const productTitle = document.querySelector('.product__title, .product-single__title, h1');
      if (productTitle) {
        img.alt = `${productTitle.textContent.trim()} - Product Image`;
      } else {
        img.alt = 'Product Image';
      }
    });
  }
}

// Initialize safely
(() => {
  // Only initialize if not already done
  if (!window.safeProductEnhancer) {
    window.safeProductEnhancer = new SafeProductPageEnhancer();
  }
})();

// Re-initialize on dynamic content changes (AJAX cart, variant changes, etc.)
document.addEventListener('shopify:section:load', () => {
  if (window.safeProductEnhancer) {
    window.safeProductEnhancer.isInitialized = false;
    window.safeProductEnhancer.enhance();
  }
});

// Export for manual use
window.SafeProductPageEnhancer = SafeProductPageEnhancer;