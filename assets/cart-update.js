export async function updateCartDrawer() {
  try {
    const cart = await (await fetch('/cart.js')).json();
    
    // Update cart count bubble
    const cartCount = document.querySelector('.cart-count-bubble span');
    if (cartCount) {
      cartCount.textContent = cart.item_count;
    }

    // Optional: update cart drawer if open
    const drawer = document.getElementById('CartDrawer');
    if (drawer && drawer.classList.contains('open')) {
      const drawerContent = await (await fetch('/?sections=cart-drawer')).json();
      drawer.innerHTML = drawerContent['cart-drawer'];
    }
  } catch (err) {
    console.error('Cart update failed:', err);
  }
}
