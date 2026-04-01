class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0, event);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || 
      document.getElementById('CartDrawer-LineItemStatus');

    this.pendingUpdates = new Map();

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, async (event) => {
      if (event.source === 'cart-items') {
        return;
      }
      
      try {
        await this.onCartUpdate();
      } catch (error) {
        console.error('Cart update subscription failed:', error);
        this.showGlobalError('Failed to update cart. Please refresh the page.');
      }
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    if (input) {
      input.value = input.getAttribute('value');
      this.isEnterPressed = false;
    }
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const input = event.target;
    const inputValue = parseInt(input.value, 10);
    const index = input.dataset.index;
    const minValue = parseInt(input.dataset.min || input.min || 0, 10);
    const maxValue = parseInt(input.max || Infinity, 10);
    const stepValue = parseInt(input.step || 1, 10);

    if (isNaN(inputValue) || input.value.includes('.')) {
      this.setValidity(event, index, 'Please enter a whole number');
      return false;
    }

    if (inputValue < minValue) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.min_error.replace('[min]', minValue)
      );
      return false;
    }

    if (inputValue > maxValue) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.max_error.replace('[max]', maxValue)
      );
      return false;
    }

    if (stepValue > 1 && (inputValue - minValue) % stepValue !== 0) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.step_error.replace('[step]', stepValue)
      );
      return false;
    }

    input.setCustomValidity('');
    return true;
  }

  onChange(event) {
    if (this.validateQuantity(event)) {
      const inputValue = parseInt(event.target.value, 10);
      const index = event.target.dataset.index;

      this.updateQuantity(
        index,
        inputValue,
        event,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      return fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      return fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          if (sourceQty) {
            this.replaceChildren(...sourceQty.cloneNode(true).childNodes);
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      },
    ];
  }

  async updateQuantity(line, quantity, event, name, variantId) {
    if (this.pendingUpdates.has(line)) {
      this.pendingUpdates.get(line).abort();
    }

    const controller = new AbortController();
    this.pendingUpdates.set(line, controller);

    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });
    const eventTarget = event.currentTarget instanceof CartRemoveButton ? 'clear' : 'change';

    try {
      const response = await fetch(`${routes.cart_change_url}`, {
        ...fetchConfig(),
        body,
        signal: controller.signal
      });

      const state = await response.text();
      const parsedState = JSON.parse(state);

      CartPerformance.measure(`${eventTarget}:paint-updated-sections"`, () => {
        const quantityElement =
          document.getElementById(`Quantity-${line}`) || 
          document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart-item');

        if (parsedState.errors) {
          if (quantityElement) {
            quantityElement.value = quantityElement.getAttribute('value');
          }
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');

        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || 
            document.getElementById(section.id);
          const newNodes = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
          elementToReplace.replaceChildren(...newNodes);
        });

        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        let message = '';
        if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement?.value)) {
          if (typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }
        this.updateLiveRegions(line, message);

        this.manageFocusAfterUpdate(line, name, parsedState);
      });

      CartPerformance.measureFromEvent(`${eventTarget}:user-action`, event);

      publish(PUB_SUB_EVENTS.cartUpdate, { 
        source: 'cart-items', 
        cartData: parsedState, 
        variantId: variantId 
      });

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Update cancelled - newer request in progress');
        return;
      }
      this.handleUpdateError(line, error);
    } finally {
      this.pendingUpdates.delete(line);
      this.disableLoading(line);
    }
  }

  handleUpdateError(line, error) {
    const quantityElement = 
      document.getElementById(`Quantity-${line}`) || 
      document.getElementById(`Drawer-quantity-${line}`);
    
    if (quantityElement) {
      quantityElement.value = quantityElement.getAttribute('value');
    }

    let errorMessage = window.cartStrings.error;
    let canRetry = false;

    if (error.name === 'TypeError' || !navigator.onLine) {
      errorMessage = 'Network error. Please check your connection and try again.';
      canRetry = true;
    } else if (error.status === 422) {
      errorMessage = 'This item is no longer available in the requested quantity.';
    } else if (error.status === 404) {
      errorMessage = 'This item is no longer available.';
    }

    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || 
      document.getElementById(`CartDrawer-LineItemError-${line}`);
      
    if (lineItemError) {
      const errorText = lineItemError.querySelector('.cart-item__error-text');
      if (errorText) {
        errorText.textContent = errorMessage;
        lineItemError.setAttribute('role', 'alert');
        lineItemError.setAttribute('aria-live', 'assertive');
      }
    }

    const globalErrors = 
      document.getElementById('cart-errors') || 
      document.getElementById('CartDrawer-CartErrors');
      
    if (globalErrors) {
      globalErrors.textContent = errorMessage;
      globalErrors.setAttribute('role', 'alert');
    }

    console.error('Cart update failed:', {
      line,
      error: error.message,
      status: error.status,
      timestamp: new Date().toISOString()
    });
  }

  showGlobalError(message) {
    const globalErrors = 
      document.getElementById('cart-errors') || 
      document.getElementById('CartDrawer-CartErrors');
      
    if (globalErrors) {
      globalErrors.textContent = message;
      globalErrors.setAttribute('role', 'alert');
    }
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || 
      document.getElementById(`CartDrawer-LineItemError-${line}`);
      
    if (lineItemError) {
      const errorText = lineItemError.querySelector('.cart-item__error-text');
      if (errorText) {
        errorText.textContent = message;
        if (message) {
          lineItemError.setAttribute('role', 'alert');
          lineItemError.setAttribute('aria-live', 'assertive');
        }
      }
    }

    const cartStatus =
      document.getElementById('cart-live-region-text') || 
      document.getElementById('CartDrawer-LiveRegionText');
      
    if (cartStatus) {
      cartStatus.textContent = message || 'Cart updated';
      cartStatus.setAttribute('aria-live', 'polite');
      cartStatus.setAttribute('aria-atomic', 'true');
    }
  }

  manageFocusAfterUpdate(line, name, parsedState) {
    const cartDrawerWrapper = document.querySelector('cart-drawer');
    
    const lineItem =
      document.getElementById(`CartItem-${line}`) || 
      document.getElementById(`CartDrawer-Item-${line}`);
      
    if (lineItem && name) {
      const triggerElement = lineItem.querySelector(`[name="${name}"]`);
      if (triggerElement) {
        setTimeout(() => triggerElement.focus(), 100);
        return;
      }
    }
    
    if (parsedState.item_count === 0) {
      const emptyMessage = document.querySelector('.cart__empty-text');
      if (emptyMessage) {
        emptyMessage.setAttribute('tabindex', '-1');
        emptyMessage.focus();
      }
      return;
    }
    
    const remainingItems = document.querySelectorAll('.cart-item');
    if (remainingItems.length > 0) {
      const indexToFocus = Math.min(line - 1, remainingItems.length - 1);
      const nextItem = remainingItems[indexToFocus];
      const focusTarget = nextItem.querySelector('.quantity-input') || 
                         nextItem.querySelector('a');
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }
    }
  }

  getSectionInnerHTML(html, selector) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newContent = doc.querySelector(selector);
    return newContent ? Array.from(newContent.childNodes) : [];
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || 
                          document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) {
      mainCartItems.classList.add('cart__items--disabled');
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => 
      overlay.classList.remove('hidden')
    );

    document.activeElement.blur();
    if (this.lineItemStatusElement) {
      this.lineItemStatusElement.setAttribute('aria-hidden', false);
    }
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || 
                          document.getElementById('CartDrawer-CartItems');
    if (mainCartItems) {
      mainCartItems.classList.remove('cart__items--disabled');
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
              .then(() => CartPerformance.measureFromEvent('note-update:user-action', event))
              .catch((error) => {
                console.error('Failed to update cart note:', error);
              });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}