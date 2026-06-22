/* =========================================================
   Lumen Aura Max — Product Page Interactions
   With localStorage persistence + all buttons wired
   ========================================================= */
(function () {
  'use strict';

  // Price is read from the HTML (#currentPrice) so you can edit it there freely.
  const BASE_PRICE = parseFloat(
    (document.getElementById('currentPrice')?.textContent || '').replace(/[^0-9.]/g, '')
  ) || 50.00;
  const STORAGE_KEY = 'raycon_auramax_state';
  const money = (n) => '$' + n.toFixed(2);

  /* ---------- Default state ---------- */
  const state = {
    imgIndex: 0,
    color: 'midnight-black',
    colorName: 'Midnight Black',
    size: 'Pro',
    qty: 1,
    wished: false,
    cart: [], // { key, color, colorName, size, qty, price }
  };

  /* Each colourway has its own transparent-background shoe images
     ([front, top]) so the shoe recolours while the background stays white. */
  const colorImages = {
    'midnight-black': ['black/image.jpg', 'black/image1.jpg', 'black/images2.jpg'],
    'graphite-gray':  ['gray/gray1.jpg', 'gray/gray2.jpg', 'gray/gray3.jpg', 'gray/gray4.jpg'],
  };

  // Images for the currently selected colour (front, top). Updated on color change.
  let galleryImages = colorImages['midnight-black'];

  /* ---------- Element refs ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const activeImg   = $('#activeImg');
  const mainImg     = $('#mainImg');
  const thumbs      = $$('.gallery__thumb');
  const dots        = $$('.gallery__dot');
  const prevBtn     = $('#prevImg');
  const nextBtn     = $('#nextImg');

  const qtyVal      = $('#qtyVal');
  const qtyInc      = $('#qtyInc');
  const qtyDec      = $('#qtyDec');

  const currentPrice    = $('#currentPrice');
  const summarySubtotal = $('#summarySubtotal');
  const summaryTotal    = $('#summaryTotal');

  const selectedColorName = $('#selectedColorName');

  const addToCartBtn = $('#addToCartBtn');
  const wishBtn      = $('#wishBtn');
  const galleryWish  = $('#galleryWishBtn');

  const toast    = $('#toast');
  const toastMsg = $('#toastMsg');

  /* ---------- localStorage ---------- */
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        color: state.color,
        colorName: state.colorName,
        size: state.size,
        qty: state.qty,
        wished: state.wished,
        cart: state.cart,
      }));
    } catch (_) { /* storage unavailable — fail silently */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.color)      state.color = saved.color;
      if (saved.colorName)  state.colorName = saved.colorName;
      if (saved.size)       state.size = saved.size;
      if (typeof saved.qty === 'number') state.qty = Math.min(10, Math.max(1, saved.qty));
      if (typeof saved.wished === 'boolean') state.wished = saved.wished;
      if (Array.isArray(saved.cart)) state.cart = saved.cart;
    } catch (_) { /* corrupt or unavailable — ignore */ }
  }

  /* ---------- Gallery ---------- */
  const thumbsWrap = $('.gallery__thumbs');

  // Build the thumbnail strip for the current colourway's images
  function renderThumbs() {
    thumbsWrap.innerHTML = '';
    galleryImages.forEach((src, i) => {
      const btn = document.createElement('button');
      btn.className = 'gallery__thumb' + (i === state.imgIndex ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === state.imgIndex ? 'true' : 'false');
      btn.dataset.index = i;
      const im = document.createElement('img');
      im.src = src; im.alt = 'View ' + (i + 1); im.draggable = false;
      btn.appendChild(im);
      btn.addEventListener('click', () => setImage(i));
      thumbsWrap.appendChild(btn);
    });
  }

  function setImage(index, fade = true) {
    state.imgIndex = (index + galleryImages.length) % galleryImages.length;
    const src = galleryImages[state.imgIndex];

    if (fade) {
      activeImg.style.opacity = '0';
      setTimeout(() => {
        activeImg.src = src;
        activeImg.style.opacity = '1';
      }, 150);
    } else {
      activeImg.src = src;
    }

    Array.from(thumbsWrap.children).forEach((t, i) => {
      const on = i === state.imgIndex;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => setImage(state.imgIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setImage(state.imgIndex + 1));

  // Keyboard arrows for the gallery
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  setImage(state.imgIndex - 1);
    if (e.key === 'ArrowRight') setImage(state.imgIndex + 1);
  });

  /* Hover-to-zoom on the main image */
  mainImg.addEventListener('mousemove', (e) => {
    const r = mainImg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    activeImg.style.transformOrigin = `${x}% ${y}%`;
    activeImg.style.transform = 'scale(1.8)';
  });
  mainImg.addEventListener('mouseleave', () => {
    activeImg.style.transform = '';
    activeImg.style.transformOrigin = 'center center';
  });

  /* ---------- Color selection ---------- */
  function applyColor(value, label) {
    state.color = value;
    state.colorName = label || 'Selected';
    selectedColorName.textContent = state.colorName;

    $$('.color-swatch').forEach((s) => {
      const inp = s.querySelector('input');
      const on = inp && inp.value === value;
      s.classList.toggle('active', !!on);
      if (inp) inp.checked = !!on;
    });

    // Switch the gallery to this colourway's images & rebuild the thumbnail strip
    galleryImages = colorImages[value] || colorImages['midnight-black'];
    state.imgIndex = 0;
    renderThumbs();
    setImage(0, false); // show the first view in the new colour

    saveState();
  }

  $$('.color-swatch').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const input = swatch.querySelector('input');
      if (!input) return;
      applyColor(input.value, input.dataset.label);
    });
  });

  /* ---------- Size selection ---------- */
  function applySize(value) {
    state.size = value;
    $$('.size-btn').forEach((b) => {
      const inp = b.querySelector('input');
      const on = inp && inp.value === value && !inp.disabled;
      b.classList.toggle('active', !!on);
      if (inp && !inp.disabled) inp.checked = !!on;
    });
    saveState();
  }

  $$('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      const input = btn.querySelector('input');
      if (!input || input.disabled) return;
      applySize(input.value);
    });
  });

  /* ---------- Quantity stepper ---------- */
  function renderQty() {
    qtyVal.textContent = state.qty;
    qtyDec.disabled = state.qty <= 1;
    qtyInc.disabled = state.qty >= 10;
    const subtotal = BASE_PRICE * state.qty;
    summarySubtotal.textContent = money(subtotal);
    summaryTotal.textContent = money(subtotal);
  }

  qtyInc.addEventListener('click', () => {
    if (state.qty < 10) { state.qty++; renderQty(); saveState(); }
  });
  qtyDec.addEventListener('click', () => {
    if (state.qty > 1) { state.qty--; renderQty(); saveState(); }
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ---------- Cart ---------- */
  const cartCount   = $('#cartCount');
  const cartItemsEl = $('#cartItems');
  const cartEmpty   = $('#cartEmpty');
  const cartFooter  = $('#cartFooter');
  const cartTotal   = $('#cartTotal');
  const cartDrawer  = $('#cartDrawer');
  const cartOverlay = $('#cartOverlay');
  const checkoutBtn = $('.btn-checkout');

  function totalItems() {
    return state.cart.reduce((sum, i) => sum + i.qty, 0);
  }

  function renderCart() {
    const count = totalItems();

    cartCount.textContent = count;
    cartCount.classList.toggle('visible', count > 0);

    // Remove previously rendered line items (keep the empty-state node)
    $$('.cart-item', cartItemsEl).forEach((n) => n.remove());

    if (state.cart.length === 0) {
      cartEmpty.style.display = '';
      cartFooter.style.display = 'none';
      return;
    }

    cartEmpty.style.display = 'none';
    cartFooter.style.display = '';

    let total = 0;
    state.cart.forEach((item) => {
      total += item.price * item.qty;

      // Use the colourway's own shoe image as the cart thumbnail
      const thumbSrc = (colorImages[item.color] || colorImages['cloud-white'])[0];

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img class="cart-item__img" src="${thumbSrc}" alt="Aura Max — ${item.colorName}" />
        <div class="cart-item__info">
          <strong class="cart-item__name">Aura Max</strong>
          <span class="cart-item__meta">${item.colorName}</span>
          <div class="cart-item__controls">
            <button class="cart-item__qty" data-act="dec" aria-label="Decrease">−</button>
            <span class="cart-item__count">${item.qty}</span>
            <button class="cart-item__qty" data-act="inc" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="cart-item__right">
          <span class="cart-item__price">${money(item.price * item.qty)}</span>
          <button class="cart-item__remove" data-act="remove" aria-label="Remove">Remove</button>
        </div>`;

      row.querySelectorAll('[data-act]').forEach((b) => {
        b.addEventListener('click', () => {
          const act = b.dataset.act;
          if (act === 'inc') item.qty++;
          else if (act === 'dec') item.qty = Math.max(1, item.qty - 1);
          else if (act === 'remove') {
            state.cart = state.cart.filter((i) => i.key !== item.key);
          }
          renderCart();
          saveState();
        });
      });

      cartItemsEl.appendChild(row);
    });

    cartTotal.textContent = money(total);
  }

  function addToCart() {
    const key = `${state.color}|${state.size}`;
    const existing = state.cart.find((i) => i.key === key);

    if (existing) {
      existing.qty += state.qty;
    } else {
      state.cart.push({
        key,
        color: state.color,
        colorName: state.colorName,
        size: state.size,
        qty: state.qty,
        price: BASE_PRICE,
      });
    }

    renderCart();
    saveState();
    showToast(`Added ${state.qty} × Aura Max (${state.colorName})`);

    // little tactile pulse on the button
    addToCartBtn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'ease-out' }
    );

    openCart();
  }

  addToCartBtn.addEventListener('click', addToCart);

  /* ---------- Buy Now ---------- */
  const buyNowBtn = $('#buyNowBtn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      addToCart();
      showToast(`Proceeding to buy — Aura Max (${state.colorName}) 🛒`);
    });
  }

  /* ---------- Checkout ---------- */
  checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) {
      showToast('Your cart is empty 🛍️');
      return;
    }
    const items = totalItems();
    state.cart = [];
    renderCart();
    saveState();
    closeCart();
    showToast(`Order placed! ${items} item${items > 1 ? 's' : ''} on the way 🎉`);
  });

  /* ---------- Cart drawer open/close ---------- */
  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  }

  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  /* ---------- Wishlist ---------- */
  function renderWish() {
    wishBtn.classList.toggle('wished', state.wished);
    galleryWish.classList.toggle('liked', state.wished);
  }
  function toggleWish() {
    state.wished = !state.wished;
    renderWish();
    saveState();
    showToast(state.wished ? 'Added to wishlist ♥' : 'Removed from wishlist');
  }
  wishBtn.addEventListener('click', toggleWish);
  galleryWish.addEventListener('click', toggleWish);

  /* ---------- Size guide modal ---------- */
  const modalOverlay = $('#modalOverlay');
  const sizeGuideLink = $('#sizeGuideLink');
  const modalClose = $('#modalClose');

  function openModal(e) {
    if (e) e.preventDefault();
    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  if (sizeGuideLink) sizeGuideLink.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* Esc closes modal / cart */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
  });

  /* ---------- Nav + breadcrumb links (kept on-page) ---------- */
  $('#searchBtn').addEventListener('click', () => showToast('Search coming soon ✨'));

  $$('.nav__link').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(`${link.textContent.trim()} — coming soon ✨`);
    })
  );

  $$('.breadcrumb__link').forEach((link) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(`Navigating to ${link.textContent.trim()}…`);
    })
  );

  /* ---------- Scroll reveal (progressive enhancement) ---------- */
  function initReveal() {
    const targets = $$('.feature-card, .features-strip__label, .perk');
    targets.forEach((el) => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // stagger cards within the same row for a nicer cascade
          const idx = targets.indexOf(entry.target);
          entry.target.style.transitionDelay = `${(idx % 4) * 80}ms`;
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el) => io.observe(el));
  }

  /* ---------- Init: restore saved state, then render ---------- */
  loadState();

  applyColor(state.color, state.colorName);  // sets colourway images + active image
  applySize(state.size);
  renderQty();
  renderWish();
  renderCart();
  currentPrice.textContent = money(BASE_PRICE);
  initReveal();

  if (state.cart.length > 0) {
    // Reflect restored cart count immediately (badge already set by renderCart)
    showToast('Welcome back — your cart was restored 🛒');
  }
})();
