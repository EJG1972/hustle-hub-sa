/* Keeps the order list when a customer moves between pages.
   Every page has its own cart, so it is saved after every change and
   loaded back on every page. Saved in three places (localStorage,
   sessionStorage and window.name) so it survives phone browsers that
   block one of them, and re-read whenever a page is shown again (Back
   button, switching tabs) so an old restored page never overwrites it. */
(function(){
  var KEY = 'hhsa_cart', TAG = 'hhsa:';
  if (typeof cart === 'undefined' || typeof renderCart !== 'function') return;

  function parse(s){
    try { var a = JSON.parse(s); return Array.isArray(a) ? a : null; } catch (e) { return null; }
  }
  function load(){
    var a = null;
    try { a = parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!a || !a.length) { try { a = parse(sessionStorage.getItem(KEY)) || a; } catch (e) {} }
    if (!a || !a.length) {
      try { if (String(window.name).indexOf(TAG) === 0) a = parse(window.name.slice(TAG.length)) || a; } catch (e) {}
    }
    return a || [];
  }
  function save(){
    var s = JSON.stringify(cart);
    try { localStorage.setItem(KEY, s); } catch (e) {}
    try { sessionStorage.setItem(KEY, s); } catch (e) {}
    try { if (!window.name || String(window.name).indexOf(TAG) === 0) window.name = TAG + s; } catch (e) {}
  }
  function fill(){
    var saved = load();
    cart.length = 0;
    saved.forEach(function(i){
      if (i && i.name && i.price && i.qty > 0) {
        cart.push({ name: i.name, price: i.price, img: i.img || '', qty: i.qty | 0 });
      }
    });
  }

  var originalRender = renderCart;
  window.renderCart = function(){
    var result = originalRender.apply(this, arguments);
    save();
    return result;
  };

  function refresh(){
    fill();
    renderCart();
    if (typeof updateCartBadge === 'function') updateCartBadge(); else if (typeof updateBadge === 'function') updateBadge();
  }

  refresh();
  window.addEventListener('pageshow', refresh);
  window.addEventListener('focus', refresh);
  window.addEventListener('storage', function(e){ if (e.key === KEY) refresh(); });
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) refresh(); });
})();
