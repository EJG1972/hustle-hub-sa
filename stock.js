/* Hide out-of-stock products (Riette's request, Nov 2026).
   Cards keep class "sold-out" in the HTML so they can be shown again by
   simply removing that class. Scentifique Christmas "Orders Closed" cards
   (.xm-grid) stay visible. Counts on the page are recalculated to show
   only what customers can order. */
(function () {
  var css = document.createElement('style');
  css.textContent = '.product-card.sold-out{display:none!important}.xm-grid .product-card.sold-out{display:flex!important}';
  document.head.appendChild(css);

  function run() {
    var all = document.querySelectorAll('.product-card');
    if (!all.length) return;
    var hidden = document.querySelectorAll('.product-card.sold-out:not(.xm-grid .product-card)').length;
    var total = all.length, visible = total - hidden;

    function fixWord(txt, n) {
      return n === 1 ? txt.replace(/\b(fragrance|perfume|scent|set|product)s\b/i, '$1') : txt;
    }

    // Per-section counts, e.g. "26 fragrances — R430 to R510" or "58 fragrances · R450 each · 20 sold out"
    document.querySelectorAll('.section-count').forEach(function (el) {
      var box = el.closest('section') || el.parentNode;
      var cards = box.querySelectorAll('.product-card');
      if (!cards.length) return;
      var hid = box.querySelectorAll('.product-card.sold-out:not(.xm-grid .product-card)').length;
      var vis = cards.length - hid;
      var m = el.textContent.match(/^\s*(\d+)/);
      var t = el.textContent.replace(/\s*·\s*\d+\s+sold out/i, '');
      if (m && +m[1] === cards.length) t = fixWord(t.replace(/^\s*\d+/, vis), vis);
      el.textContent = t;
      if (vis === 0 && box.tagName === 'SECTION') box.style.display = 'none';
    });

    // Page-wide totals in hero text, filter buttons and the announce strip
    if (hidden) {
      var re = new RegExp('\\b' + total + '\\b');
      document.querySelectorAll('.hero-desc, .hero-title, .filter-btn, .announce-item, .ticker-item').forEach(function (el) {
        if (el.children.length) return;
        if (re.test(el.textContent)) el.textContent = el.textContent.replace(re, visible);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
