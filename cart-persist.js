/* Keeps the order list when a customer moves between pages.
   Every page has its own cart that starts empty, so browsing from one
   category to another used to wipe what was already added. This saves the
   cart in the browser after every change and loads it back on each page. */
(function(){
  var KEY = 'hhsa_cart';
  if (typeof cart === 'undefined' || typeof renderCart !== 'function') return;

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) {
      saved.forEach(function(i){
        if (i && i.name && i.price && i.qty > 0) {
          cart.push({ name: i.name, price: i.price, img: i.img || '', qty: i.qty | 0 });
        }
      });
    }
  } catch (e) {}

  var originalRender = renderCart;
  window.renderCart = function(){
    var result = originalRender.apply(this, arguments);
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    return result;
  };

  renderCart();
  if (typeof updateCartBadge === 'function') updateCartBadge();
})();
