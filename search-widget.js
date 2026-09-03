(function(){
  var PRODUCTS = window.HH_PRODUCTS || [];
  // row: [name, sub, price, img, page, category, status, mode, cardId]

  var SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var WA_LINK = 'https://wa.me/27712305401?text=';

  function esc(s){
    return (s||'').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function buildOverlay(){
    var overlay = document.createElement('div');
    overlay.className = 'hh-search-overlay';
    overlay.id = 'hhSearchOverlay';
    overlay.innerHTML =
      '<div class="hh-search-panel">' +
        '<div class="hh-search-input-row">' + SEARCH_ICON +
          '<input id="hhSearchInput" type="text" placeholder="Search perfumes, jewellery, fudge…" autocomplete="off" />' +
          '<button class="hh-search-close" id="hhSearchClose" aria-label="Close search">&#10005;</button>' +
        '</div>' +
        '<div class="hh-search-results" id="hhSearchResults">' +
          '<div class="hh-search-hint">Type a name — like <strong>"Gucci"</strong>, <strong>"gold bangle"</strong> or <strong>"fudge"</strong> — to find it instantly, wherever it lives on the site.</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) closeSearch(); });
    document.getElementById('hhSearchClose').addEventListener('click', closeSearch);
    return overlay;
  }

  var overlayEl, inputEl, resultsEl, activeIndex = -1, currentResults = [];

  function openSearch(){
    if (!overlayEl){ overlayEl = buildOverlay(); inputEl = document.getElementById('hhSearchInput'); resultsEl = document.getElementById('hhSearchResults'); wireInput(); }
    overlayEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ inputEl.focus(); }, 30);
  }
  function closeSearch(){
    if (!overlayEl) return;
    overlayEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  function score(row, terms){
    var name = row[0].toLowerCase(), sub = row[1].toLowerCase(), cat = row[5].toLowerCase();
    var total = 0;
    for (var i=0;i<terms.length;i++){
      var t = terms[i];
      if (name.indexOf(t) === 0) total += 10;
      else if (name.indexOf(t) !== -1) total += 6;
      else if (sub.indexOf(t) !== -1) total += 2;
      else if (cat.indexOf(t) !== -1) total += 1;
      else return -1;
    }
    return total;
  }

  function highlight(name, terms){
    var out = esc(name);
    terms.forEach(function(t){
      if (!t) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  function render(query){
    var q = query.trim().toLowerCase();
    activeIndex = -1;
    if (!q){
      resultsEl.innerHTML = '<div class="hh-search-hint">Type a name — like <strong>"Gucci"</strong>, <strong>"gold bangle"</strong> or <strong>"fudge"</strong> — to find it instantly, wherever it lives on the site.</div>';
      currentResults = [];
      return;
    }
    var terms = q.split(/\s+/).filter(Boolean);
    var scored = [];
    for (var i=0;i<PRODUCTS.length;i++){
      var s = score(PRODUCTS[i], terms);
      if (s > 0) scored.push([s, PRODUCTS[i]]);
    }
    scored.sort(function(a,b){ return b[0]-a[0]; });
    currentResults = scored.slice(0, 30).map(function(x){ return x[1]; });

    if (!currentResults.length){
      var waMsg = encodeURIComponent("Hi Riette! I couldn't find \"" + query.trim() + "\" on the website — is it something you stock?");
      resultsEl.innerHTML = '<div class="hh-search-empty">No matches for "' + esc(query.trim()) + '".<br>Try a shorter word, or <a href="' + WA_LINK + waMsg + '" target="_blank">ask Riette on WhatsApp</a>.</div>';
      return;
    }

    var html = '<div class="hh-search-count">' + currentResults.length + (currentResults.length === 30 ? '+' : '') + ' result' + (currentResults.length===1?'':'s') + '</div>';
    html += currentResults.map(function(row, idx){
      var name=row[0], sub=row[1], price=row[2], img=row[3], page=row[4], category=row[5], status=row[6], mode=row[7], cardId=row[8];
      var href = page + '#hh-find=' + encodeURIComponent(JSON.stringify({m:mode, n:name, c:cardId||''}));
      var thumb = img ? '<img src="'+esc(img)+'" alt="" loading="lazy">' : '<span>🌸</span>';
      var priceClass = status === 'sold-out' ? ' hh-sold' : '';
      return '<a class="hh-result" data-idx="'+idx+'" href="'+href+'">' +
        '<div class="hh-result-img">'+thumb+'</div>' +
        '<div class="hh-result-info">' +
          '<div class="hh-result-name">'+highlight(name, terms)+'</div>' +
          '<div class="hh-result-meta">'+esc(category)+'</div>' +
        '</div>' +
        '<div class="hh-result-price'+priceClass+'">'+esc(price)+'</div>' +
      '</a>';
    }).join('');
    resultsEl.innerHTML = html;
  }

  function setActive(i){
    var links = resultsEl.querySelectorAll('.hh-result');
    links.forEach(function(l){ l.classList.remove('hh-active'); });
    if (i >= 0 && i < links.length){
      links[i].classList.add('hh-active');
      links[i].scrollIntoView({block:'nearest'});
      activeIndex = i;
    }
  }

  function wireInput(){
    inputEl.addEventListener('input', function(){ render(inputEl.value); });
    inputEl.addEventListener('keydown', function(e){
      var links = resultsEl.querySelectorAll('.hh-result');
      if (e.key === 'ArrowDown'){ e.preventDefault(); setActive(Math.min(activeIndex+1, links.length-1)); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); setActive(Math.max(activeIndex-1, 0)); }
      else if (e.key === 'Enter'){ if (activeIndex >= 0 && links[activeIndex]) links[activeIndex].click(); }
      else if (e.key === 'Escape'){ closeSearch(); }
    });
  }

  document.addEventListener('keydown', function(e){
    if ((e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')){
      e.preventDefault(); openSearch();
    } else if (e.key === 'Escape' && overlayEl && overlayEl.classList.contains('open')){
      closeSearch();
    }
  });

  function injectButtons(){
    var nav = document.querySelector('nav');
    if (!nav) return;
    var navLinks = nav.querySelector('.nav-links');
    var mobileCart = nav.querySelector('.mobile-top-cart');

    if (navLinks){
      var li = document.createElement('li');
      li.innerHTML = '<button class="hh-search-btn" id="hhSearchBtnDesktop" type="button">' + SEARCH_ICON + '<span class="hh-search-btn-label">Search</span></button>';
      navLinks.insertBefore(li, navLinks.firstChild);
    }
    if (mobileCart){
      var btn = document.createElement('button');
      btn.className = 'hh-search-icon-only';
      btn.id = 'hhSearchBtnMobile';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Search');
      btn.innerHTML = SEARCH_ICON;
      mobileCart.parentNode.insertBefore(btn, mobileCart);
    }
    nav.addEventListener('click', function(e){
      if (e.target.closest('#hhSearchBtnDesktop') || e.target.closest('#hhSearchBtnMobile')){
        openSearch();
      }
    });
  }

  function locateFromHash(){
    var h = window.location.hash;
    if (h.indexOf('#hh-find=') !== 0) return;
    var payload;
    try { payload = JSON.parse(decodeURIComponent(h.slice(9))); } catch(e){ return; }

    function attempt(triesLeft){
      var target = null;
      if (payload.m === 'picker' && payload.c){
        var card = document.getElementById(payload.c);
        if (card){
          var btns = card.querySelectorAll('.scent-row .picker-btn');
          for (var i=0;i<btns.length;i++){
            var val = (btns[i].getAttribute('data-value') || btns[i].textContent || '').trim();
            if (val === payload.n){ btns[i].click(); target = card; break; }
          }
          if (!target) target = card;
        }
      } else {
        var names = document.querySelectorAll('.product-name');
        for (var j=0;j<names.length;j++){
          if (names[j].textContent.trim() === payload.n){ target = names[j].closest('.product-card'); break; }
        }
      }
      if (target){
        jumpTo(target);
        target.classList.add('hh-highlight');
        setTimeout(function(){ target.classList.remove('hh-highlight'); }, 2400);
        // Some pages here are extremely long and still have images loading in below
        // the target, which shifts the layout after our first jump — correct once
        // more once things have settled so we don't end up short of the mark.
        setTimeout(function(){ jumpTo(target); }, 500);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } else if (triesLeft > 0){
        setTimeout(function(){ attempt(triesLeft-1); }, 200);
      }
    }
    setTimeout(function(){ attempt(6); }, 250);
  }

  // Jump straight to an element, centred in the viewport. Used instead of
  // scrollIntoView({behavior:'smooth'}) because on this site's very long
  // product pages a smooth/animated scroll across tens of thousands of
  // pixels is unreliable on mobile browsers — it can silently never move
  // the screen at all, leaving the highlight flashing off-screen. An
  // instant jump always lands correctly.
  function jumpTo(el){
    var rect = el.getBoundingClientRect();
    var targetY = rect.top + window.pageYOffset - (window.innerHeight/2) + (rect.height/2);
    window.scrollTo(0, Math.max(0, targetY));
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectButtons);
  } else {
    injectButtons();
  }
  window.addEventListener('load', locateFromHash);
  // Some pages (Scented Serenity especially) list hundreds of products on
  // one page, so clicking a second search result while already on that
  // page is just a same-page hash change, not a full reload — 'load'
  // never fires again for it. Listen for that too, so a search result
  // always jumps to its product even when you're already on that page.
  window.addEventListener('hashchange', locateFromHash);
})();
