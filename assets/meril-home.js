/**
 * Meril Home — Master Client JavaScript
 * Full cart, drag/touch scrolling, gallery swipe, hero slider, filter & sort
 */

(function () {
  'use strict';

  const CART_STORAGE_KEY = 'meril_home_cart_v2';

  function parseTurkishPrice(str) {
    if (typeof str === 'number' && !isNaN(str)) return Math.round(str);
    if (!str) return 1490;
    const cleaned = String(str).replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 1490 : Math.round(num);
  }

  function formatTurkishPrice(num) {
    const safe = isNaN(num) ? 0 : Math.round(num);
    return '₺' + safe.toLocaleString('tr-TR') + ',00';
  }

  function showToast(message) {
    let toast = document.getElementById('meril-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'meril-toast';
      toast.className = 'meril-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('active');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('active');
    }, 2400);
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // ignore storage errors
    }
    return [];
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // ignore storage errors
    }
  }

  /**
   * Enable smooth mouse drag-to-scroll on horizontal scroll strips (desktop + mobile friendly)
   */
  function enableDragScroll(container) {
    if (!container || container.dataset.dragScrollBound === 'true') return;
    container.dataset.dragScrollBound = 'true';

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > 6) {
        hasDragged = true;
        e.preventDefault();
        container.scrollLeft = scrollLeft - walk * 1.25;
      }
    });

    function endDrag() {
      if (!isDown) return;
      isDown = false;
      container.classList.remove('is-dragging');
      if (hasDragged) {
        setTimeout(() => { hasDragged = false; }, 60);
      }
    }

    window.addEventListener('mouseup', endDrag);

    // Block accidental click right after dragging
    container.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  /**
   * Bind unified touch swipe + desktop mouse drag for sliders (Hero & Product Gallery)
   * Strict horizontal check so vertical scrolling is NEVER blocked or hijacked.
   */
  function bindSwipeGesture(el, onNext, onPrev, onStart, onEnd) {
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let mouseDown = false;
    let mouseDragged = false;

    // Mobile Touch
    el.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches[0]) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      if (onStart) onStart();
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const diffX = e.changedTouches[0].clientX - startX;
      const diffY = e.changedTouches[0].clientY - startY;

      if (Math.abs(diffX) > 38 && Math.abs(diffX) > Math.abs(diffY) * 1.35) {
        if (diffX < 0) onNext();
        else onPrev();
      }
      if (onEnd) onEnd();
    }, { passive: true });

    // Desktop Mouse Drag
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, a, input, select')) return;
      mouseDown = true;
      mouseDragged = false;
      startX = e.clientX;
      startY = e.clientY;
      if (onStart) onStart();
    });

    window.addEventListener('mousemove', (e) => {
      if (!mouseDown) return;
      if (Math.abs(e.clientX - startX) > 10) {
        mouseDragged = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!mouseDown) return;
      mouseDown = false;
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
        if (diffX < 0) onNext();
        else onPrev();
      }
      if (onEnd) onEnd();
      if (mouseDragged) {
        setTimeout(() => { mouseDragged = false; }, 60);
      }
    });

    el.addEventListener('click', (e) => {
      if (mouseDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  function initMerilHome() {
    // -------------------------------------------------------------------------
    // 0. Lock / Unlock Body Scroll Safely
    // -------------------------------------------------------------------------
    function syncBodyScrollLock() {
      const anyDrawerOpen = document.querySelector('.cart-drawer.active, .mobile-drawer.active, .filter-drawer.active');
      document.body.style.overflow = anyDrawerOpen ? 'hidden' : '';
    }

    // -------------------------------------------------------------------------
    // 1. Mini Cart State & Actions (Persistent via localStorage)
    // -------------------------------------------------------------------------
    const cartDrawer = document.getElementById('cart-drawer');
    const cartBtn = document.getElementById('cart-toggle-btn');
    const cartCloses = document.querySelectorAll('[data-action="close-cart"], .cart-drawer-close, .cart-drawer-overlay');
    const headerCartBadge = document.getElementById('header-cart-badge');
    const cartCountBadge = document.getElementById('cart-count-badge');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const cartDrawerItems = document.getElementById('cart-drawer-items');

    let cartItems = loadCart();

    function calculateCartTotal() {
      return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }

    function calculateCartCount() {
      return cartItems.reduce((sum, item) => sum + item.qty, 0);
    }

    function renderCartDrawer() {
      const totalCount = calculateCartCount();
      const totalPrice = calculateCartTotal();

      if (headerCartBadge) headerCartBadge.textContent = totalCount;
      if (cartCountBadge) cartCountBadge.textContent = totalCount;
      if (cartTotalAmount) cartTotalAmount.textContent = formatTurkishPrice(totalPrice);

      saveCart(cartItems);

      if (!cartDrawerItems) return;

      if (cartItems.length === 0) {
        cartDrawerItems.innerHTML = `
          <div style="text-align: center; padding: 48px 16px; color: #7A685D;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; display: block; opacity: 0.6;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <p style="font-size: 13px; font-weight: 700; color: #2A180E; margin-bottom: 4px;">Sepetiniz henüz boş</p>
            <p style="font-size: 11px; margin-bottom: 14px;">Eviniz için en güzel duvar örtülerini keşfedin.</p>
            <a href="/collection.html" style="display:inline-block;padding:8px 16px;border-radius:9999px;background:#3A2315;color:#fff;font-size:11.5px;font-weight:600;">Koleksiyonu Keşfet</a>
          </div>
        `;
        return;
      }

      let html = '';
      cartItems.forEach((item, index) => {
        html += `
          <div class="cart-item" data-cart-index="${index}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(232, 218, 207, 0.7);">
            <img src="${item.img}" alt="${item.title}" class="cart-item-img" style="width: 58px; height: 58px; border-radius: 8px; object-fit: cover; border: 1px solid #E8DACF; flex-shrink: 0;">
            <div class="cart-item-info" style="flex: 1; min-width: 0;">
              <div class="cart-item-title" style="font-size: 12px; font-weight: 700; color: #2A180E; line-height: 1.25; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</div>
              <div class="cart-item-variant" style="font-size: 10px; color: #7A685D; margin-bottom: 6px;">Ölçü: ${item.size}</div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                <div class="cart-item-price" style="font-size: 12px; font-weight: 700; color: #2A180E;">
                  ${formatTurkishPrice(item.price * item.qty)}
                  ${item.oldPrice ? `<span style="font-size: 9.5px; color: #9E8D82; text-decoration: line-through; margin-left: 3px; font-weight: 400;">${formatTurkishPrice(item.oldPrice * item.qty)}</span>` : ''}
                </div>
                <div style="display: flex; align-items: center; border: 1px solid #D5C2B3; border-radius: 9999px; background: #FFFDF9;">
                  <button type="button" class="btn-cart-qty-decrease" data-index="${index}" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #2A180E;" aria-label="Azalt">−</button>
                  <span style="font-size: 11px; font-weight: 700; min-width: 18px; text-align: center; color: #2A180E;">${item.qty}</span>
                  <button type="button" class="btn-cart-qty-increase" data-index="${index}" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #2A180E;" aria-label="Artır">+</button>
                </div>
              </div>
            </div>
            <button type="button" class="btn-cart-item-remove" data-index="${index}" style="color: #9E8D82; padding: 6px; border: none; background: transparent; cursor: pointer; flex-shrink: 0;" aria-label="Ürünü Sil">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `;
      });
      cartDrawerItems.innerHTML = html;

      cartDrawerItems.querySelectorAll('.btn-cart-qty-decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (cartItems[idx]) {
            if (cartItems[idx].qty > 1) cartItems[idx].qty -= 1;
            else cartItems.splice(idx, 1);
            renderCartDrawer();
          }
        });
      });

      cartDrawerItems.querySelectorAll('.btn-cart-qty-increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (cartItems[idx]) {
            cartItems[idx].qty += 1;
            renderCartDrawer();
          }
        });
      });

      cartDrawerItems.querySelectorAll('.btn-cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          if (cartItems[idx]) {
            cartItems.splice(idx, 1);
            renderCartDrawer();
          }
        });
      });
    }

    function openCart() {
      if (cartDrawer) {
        cartDrawer.classList.add('active');
        cartDrawer.setAttribute('aria-hidden', 'false');
        syncBodyScrollLock();
      }
    }

    function closeCart() {
      if (cartDrawer) {
        cartDrawer.classList.remove('active');
        cartDrawer.setAttribute('aria-hidden', 'true');
        syncBodyScrollLock();
      }
    }

    function addItemToCart(newItem) {
      const priceVal = parseTurkishPrice(newItem.price);
      const oldPriceVal = newItem.oldPrice ? parseTurkishPrice(newItem.oldPrice) : Math.round(priceVal * 1.3);
      const qtyVal = Math.max(1, parseInt(newItem.qty, 10) || 1);
      const titleVal = newItem.title || 'Duvar Örtüsü';
      const sizeVal = newItem.size || '100 × 140 cm';
      const imgVal = newItem.img || 'assets/urun-gunes-ve-daglar.webp';

      const existing = cartItems.find(it => it.title === titleVal && it.size === sizeVal);
      if (existing) {
        existing.qty += qtyVal;
      } else {
        cartItems.push({
          id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          title: titleVal,
          size: sizeVal,
          price: priceVal,
          oldPrice: oldPriceVal,
          img: imgVal,
          qty: qtyVal
        });
      }

      renderCartDrawer();
      showToast('✓ ' + titleVal + ' sepete eklendi');
      openCart();
    }

    if (cartBtn) {
      cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCart();
      });
    }

    cartCloses.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeCart();
      });
    });

    renderCartDrawer();

    // -------------------------------------------------------------------------
    // 2. Mobile Drawer Navigation
    // -------------------------------------------------------------------------
    const menuBtn = document.getElementById('menu-toggle-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const drawerCloses = document.querySelectorAll('[data-action="close-drawer"], .mobile-drawer-close, .mobile-drawer-overlay');

    function closeMobileDrawer() {
      if (mobileDrawer) {
        mobileDrawer.classList.remove('active');
        mobileDrawer.setAttribute('aria-hidden', 'true');
        syncBodyScrollLock();
      }
    }

    if (menuBtn && mobileDrawer) {
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        mobileDrawer.classList.add('active');
        mobileDrawer.setAttribute('aria-hidden', 'false');
        syncBodyScrollLock();
      });

      drawerCloses.forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          closeMobileDrawer();
        });
      });

      mobileDrawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => closeMobileDrawer());
      });
    }

    // -------------------------------------------------------------------------
    // 3. Product Page Variants, Quantity & Add To Cart
    // -------------------------------------------------------------------------
    let currentSelectedSize = '100 × 140 cm';
    let currentSelectedPrice = 1490;
    let currentSelectedCompare = 1990;

    const variantChips = document.querySelectorAll('.variants-options .variant-chip, .variant-chip');
    const productPriceEl = document.getElementById('product-price') || document.querySelector('.product-price-row .price-current');
    const productCompareEl = document.getElementById('product-compare-price') || document.querySelector('.product-price-row .price-old');
    const stickyPriceEl = document.getElementById('sticky-price') || document.querySelector('.sticky-current-price');
    const stickyCompareEl = document.getElementById('sticky-compare') || document.querySelector('.sticky-old-price');

    // Initialize from active chip if present
    const initialActiveChip = document.querySelector('.variants-options .variant-chip.active, .variant-chip.active');
    if (initialActiveChip) {
      currentSelectedSize = initialActiveChip.getAttribute('data-size') || initialActiveChip.textContent.trim();
      currentSelectedPrice = parseTurkishPrice(initialActiveChip.getAttribute('data-price') || '1490');
      currentSelectedCompare = parseTurkishPrice(initialActiveChip.getAttribute('data-compare') || '1990');
    }

    variantChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        variantChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        currentSelectedSize = chip.getAttribute('data-size') || chip.textContent.trim();
        const priceStr = chip.getAttribute('data-price') || formatTurkishPrice(1490);
        const compareStr = chip.getAttribute('data-compare') || formatTurkishPrice(1990);

        currentSelectedPrice = parseTurkishPrice(priceStr);
        currentSelectedCompare = parseTurkishPrice(compareStr);

        if (productPriceEl) productPriceEl.textContent = priceStr;
        if (productCompareEl) productCompareEl.textContent = compareStr;
        if (stickyPriceEl) stickyPriceEl.textContent = priceStr;
        if (stickyCompareEl) stickyCompareEl.textContent = compareStr;
      });
    });

    const qtyValSpan = document.getElementById('qty-value');
    const qtyInput = document.getElementById('product-quantity');
    const qtyDecrease = document.getElementById('qty-decrease') || document.getElementById('qty-minus');
    const qtyIncrease = document.getElementById('qty-increase') || document.getElementById('qty-plus');

    function getSelectedQty() {
      if (qtyValSpan) return parseInt(qtyValSpan.textContent, 10) || 1;
      if (qtyInput) return parseInt(qtyInput.value, 10) || 1;
      return 1;
    }

    function setSelectedQty(val) {
      const safe = Math.max(1, val);
      if (qtyValSpan) qtyValSpan.textContent = safe;
      if (qtyInput) qtyInput.value = safe;
    }

    if (qtyDecrease) {
      qtyDecrease.addEventListener('click', (e) => {
        e.preventDefault();
        setSelectedQty(getSelectedQty() - 1);
      });
    }

    if (qtyIncrease) {
      qtyIncrease.addEventListener('click', (e) => {
        e.preventDefault();
        setSelectedQty(getSelectedQty() + 1);
      });
    }

    const mainAtcBtn = document.getElementById('btn-add-to-cart') || document.getElementById('add-to-cart-btn') || document.querySelector('.btn-add-to-cart');
    const stickyAtcBtn = document.getElementById('btn-sticky-atc') || document.getElementById('sticky-atc-btn') || document.querySelector('.btn-sticky-atc');

    function handleProductAddToCart(btn) {
      const qty = getSelectedQty();
      const productTitleEl = document.querySelector('.product-title');
      const title = productTitleEl ? productTitleEl.textContent.trim() : 'Güneş ve Dağlar Duvar Örtüsü';
      const mainImgEl = document.getElementById('main-product-img') || document.querySelector('.product-main-img');
      const img = mainImgEl ? mainImgEl.getAttribute('src') : 'assets/urun-gunes-ve-daglar.webp';

      if (btn) {
        const span = btn.querySelector('span');
        const origText = span ? span.textContent : '';
        if (span) span.textContent = '✓ Eklendi!';
        btn.style.transform = 'scale(0.97)';
        setTimeout(() => {
          if (span) span.textContent = origText;
          btn.style.transform = '';
        }, 1200);
      }

      addItemToCart({
        title: title,
        size: currentSelectedSize,
        price: currentSelectedPrice,
        oldPrice: currentSelectedCompare,
        img: img,
        qty: qty
      });
    }

    if (mainAtcBtn) {
      mainAtcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleProductAddToCart(mainAtcBtn);
      });
    }

    if (stickyAtcBtn) {
      stickyAtcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleProductAddToCart(stickyAtcBtn);
      });
    }

    // -------------------------------------------------------------------------
    // 4. Product Gallery (Thumbnails, Arrows, Clickable Pills, Touch & Mouse Swipe)
    // -------------------------------------------------------------------------
    const mainProductImg = document.getElementById('main-product-img') || document.querySelector('.product-main-img');
    const thumbnailItems = document.querySelectorAll('.product-thumbnails-row .thumbnail-item, .gallery-thumb');
    const galleryPrevBtn = document.getElementById('gallery-prev');
    const galleryNextBtn = document.getElementById('gallery-next');
    const galleryPills = document.querySelectorAll('.gallery-pills .gallery-pill');
    const galleryWrapper = document.querySelector('.product-main-image-wrapper');

    let currentGalleryIndex = 0;
    const gallerySources = [];

    thumbnailItems.forEach((thumb, idx) => {
      const src = thumb.getAttribute('data-src') || thumb.getAttribute('data-full-img') || (thumb.querySelector('img') ? thumb.querySelector('img').getAttribute('src') : '');
      gallerySources.push(src);
      thumb.addEventListener('click', (e) => {
        e.preventDefault();
        setGalleryPhoto(idx);
      });
    });

    galleryPills.forEach((pill, idx) => {
      pill.style.cursor = 'pointer';
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        setGalleryPhoto(idx);
      });
    });

    function setGalleryPhoto(idx) {
      if (gallerySources.length === 0) return;
      currentGalleryIndex = (idx + gallerySources.length) % gallerySources.length;

      if (mainProductImg && gallerySources[currentGalleryIndex]) {
        mainProductImg.style.opacity = '0.45';
        setTimeout(() => {
          mainProductImg.src = gallerySources[currentGalleryIndex];
          mainProductImg.style.opacity = '1';
        }, 110);
      }

      thumbnailItems.forEach((thumb, i) => {
        const active = i === currentGalleryIndex;
        thumb.classList.toggle('active', active);
        if (active && thumb.scrollIntoView) {
          thumb.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        }
      });

      galleryPills.forEach((pill, i) => {
        pill.classList.toggle('active', i === (currentGalleryIndex % Math.max(1, galleryPills.length)));
      });
    }

    if (galleryPrevBtn) {
      galleryPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setGalleryPhoto(currentGalleryIndex - 1);
      });
    }

    if (galleryNextBtn) {
      galleryNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setGalleryPhoto(currentGalleryIndex + 1);
      });
    }

    if (galleryWrapper) {
      bindSwipeGesture(
        galleryWrapper,
        () => setGalleryPhoto(currentGalleryIndex + 1),
        () => setGalleryPhoto(currentGalleryIndex - 1)
      );
    }

    // -------------------------------------------------------------------------
    // 5. Hero Carousel Slider on Homepage (Touch Swipe + Mouse Drag + Auto-Play)
    // -------------------------------------------------------------------------
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroPills = document.querySelectorAll('.hero-pill');
    const heroPrev = document.getElementById('hero-prev-btn');
    const heroNext = document.getElementById('hero-next-btn');
    const heroSec = document.getElementById('hero-section');

    let currentHeroSlide = 0;
    const totalHeroSlides = heroSlides.length;
    let heroTimer = null;

    function setHeroSlide(idx) {
      if (totalHeroSlides === 0) return;
      currentHeroSlide = (idx + totalHeroSlides) % totalHeroSlides;

      heroSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentHeroSlide);
      });

      heroPills.forEach((pill, i) => {
        pill.classList.toggle('active', i === currentHeroSlide);
      });
    }

    function startHeroTimer() {
      stopHeroTimer();
      if (totalHeroSlides > 1) {
        heroTimer = setInterval(() => {
          setHeroSlide(currentHeroSlide + 1);
        }, 4800);
      }
    }

    function stopHeroTimer() {
      if (heroTimer) clearInterval(heroTimer);
    }

    if (heroPrev) {
      heroPrev.addEventListener('click', (e) => {
        e.preventDefault();
        setHeroSlide(currentHeroSlide - 1);
        startHeroTimer();
      });
    }

    if (heroNext) {
      heroNext.addEventListener('click', (e) => {
        e.preventDefault();
        setHeroSlide(currentHeroSlide + 1);
        startHeroTimer();
      });
    }

    heroPills.forEach((pill, idx) => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        setHeroSlide(idx);
        startHeroTimer();
      });
    });

    if (heroSec && totalHeroSlides > 1) {
      bindSwipeGesture(
        heroSec,
        () => setHeroSlide(currentHeroSlide + 1),
        () => setHeroSlide(currentHeroSlide - 1),
        stopHeroTimer,
        startHeroTimer
      );
      heroSec.addEventListener('mouseenter', stopHeroTimer);
      heroSec.addEventListener('mouseleave', startHeroTimer);
      startHeroTimer();
    }

    // -------------------------------------------------------------------------
    // 6. Quick Add to Cart (Category Page, Related Products, Best Sellers)
    // -------------------------------------------------------------------------
    const quickAddBtns = document.querySelectorAll('.card-quick-add-btn, .btn-related-add');
    quickAddBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const title = btn.getAttribute('data-title') || 'Duvar Örtüsü';
        const priceStr = btn.getAttribute('data-price') || '₺1.490,00';
        const price = parseTurkishPrice(priceStr);

        const card = btn.closest('.product-grid-card, .product-card, .related-card');
        let img = 'assets/urun-gunes-ve-daglar.webp';
        let oldPrice = Math.round(price * 1.3);
        if (card) {
          const imgEl = card.querySelector('img');
          if (imgEl && imgEl.getAttribute('src')) img = imgEl.getAttribute('src');
          const oldEl = card.querySelector('.price-old, .related-old-price');
          if (oldEl) oldPrice = parseTurkishPrice(oldEl.textContent);
        }

        btn.style.transform = 'scale(0.88)';
        setTimeout(() => { btn.style.transform = ''; }, 200);

        addItemToCart({
          title: title,
          size: '100 × 140 cm',
          price: price,
          oldPrice: oldPrice,
          img: img,
          qty: 1
        });
      });
    });

    // -------------------------------------------------------------------------
    // 7. Collection Page: Category Filter, Sort, Filter Drawer & Search Query
    // -------------------------------------------------------------------------
    const gridEl = document.getElementById('category-products-grid');
    const subcatPills = document.querySelectorAll('.subcat-pill');
    const sortSelect = document.querySelector('.sort-select');
    const filterToggleBtn = document.querySelector('.btn-filter-toggle');

    if (gridEl) {
      const allCards = Array.from(gridEl.querySelectorAll('.product-grid-card'));
      allCards.forEach((card, i) => {
        card.dataset.origIndex = String(i);
        const priceEl = card.querySelector('.price-current');
        card.dataset.priceNum = String(parseTurkishPrice(priceEl ? priceEl.textContent : '1490'));
        const ratingEl = card.querySelector('.rating-num');
        const reviewsNum = ratingEl ? (parseInt(ratingEl.textContent.replace(/[^\d]/g, ''), 10) || 0) : 0;
        card.dataset.reviewsNum = String(reviewsNum);
      });

      let activeCategory = 'all';
      let activeMaxPrice = Infinity;
      let activeSearchQuery = '';

      // Create active search bar container if needed
      let searchBanner = document.getElementById('collection-search-banner');

      function applyCollectionFilters() {
        let visibleCount = 0;

        allCards.forEach(card => {
          const cat = (card.getAttribute('data-category') || '').toLowerCase();
          const title = (card.querySelector('.product-card-title')?.textContent || '').toLowerCase();
          const price = parseInt(card.dataset.priceNum, 10) || 1490;

          const matchCat = (activeCategory === 'all') || (cat === activeCategory);
          const matchPrice = price <= activeMaxPrice;
          const matchSearch = !activeSearchQuery || title.includes(activeSearchQuery) || cat.includes(activeSearchQuery);

          const show = matchCat && matchPrice && matchSearch;
          card.style.display = show ? 'flex' : 'none';
          if (show) visibleCount += 1;
        });

        // Empty state message
        let emptyEl = document.getElementById('collection-empty-state');
        if (visibleCount === 0) {
          if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.id = 'collection-empty-state';
            emptyEl.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 36px 16px; color: #7A685D; background: #FAF5F0; border-radius: 14px; border: 1px solid #E8DACF;';
            emptyEl.innerHTML = `
              <p style="font-size: 13px; font-weight: 700; color: #2A180E; margin-bottom: 6px;">Seçtiğiniz filtrelere uygun ürün bulunamadı</p>
              <button type="button" id="btn-reset-collection-filters" style="padding: 8px 16px; border-radius: 9999px; background: #3A2315; color: #fff; font-size: 11.5px; font-weight: 600;">Filtreleri Temizle</button>
            `;
            gridEl.appendChild(emptyEl);
            document.getElementById('btn-reset-collection-filters').addEventListener('click', resetAllFilters);
          }
          emptyEl.style.display = 'block';
        } else if (emptyEl) {
          emptyEl.style.display = 'none';
        }

        // Update search banner
        if (activeSearchQuery) {
          if (!searchBanner) {
            searchBanner = document.createElement('div');
            searchBanner.id = 'collection-search-banner';
            searchBanner.style.cssText = 'margin: 0 14px 12px; padding: 8px 12px; border-radius: 10px; background: #F4E9DF; border: 1px solid #E8DACF; display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: #2A180E;';
            gridEl.parentNode.insertBefore(searchBanner, gridEl);
          }
          searchBanner.innerHTML = `
            <span>"<strong>${activeSearchQuery}</strong>" için ${visibleCount} sonuç</span>
            <button type="button" id="clear-search-query-btn" style="font-size: 11px; font-weight: 700; color: #3A2315; text-decoration: underline;">Temizle</button>
          `;
          searchBanner.style.display = 'flex';
          document.getElementById('clear-search-query-btn').addEventListener('click', () => {
            activeSearchQuery = '';
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, '', window.location.pathname);
            }
            applyCollectionFilters();
          });
        } else if (searchBanner) {
          searchBanner.style.display = 'none';
        }
      }

      function applyCollectionSort(mode) {
        const sorted = [...allCards];
        if (mode === 'price-asc') {
          sorted.sort((a, b) => parseInt(a.dataset.priceNum, 10) - parseInt(b.dataset.priceNum, 10));
        } else if (mode === 'price-desc') {
          sorted.sort((a, b) => parseInt(b.dataset.priceNum, 10) - parseInt(a.dataset.priceNum, 10));
        } else if (mode === 'best-selling') {
          sorted.sort((a, b) => parseInt(b.dataset.reviewsNum, 10) - parseInt(a.dataset.reviewsNum, 10));
        } else if (mode === 'newest') {
          sorted.sort((a, b) => parseInt(b.dataset.origIndex, 10) - parseInt(a.dataset.origIndex, 10));
        }
        sorted.forEach(card => gridEl.appendChild(card));
        const emptyEl = document.getElementById('collection-empty-state');
        if (emptyEl) gridEl.appendChild(emptyEl);
      }

      function setActiveCategoryPill(tag) {
        activeCategory = tag || 'all';
        subcatPills.forEach(p => {
          p.classList.toggle('active', (p.getAttribute('data-tag') || 'all') === activeCategory);
        });
        applyCollectionFilters();
      }

      function resetAllFilters() {
        activeCategory = 'all';
        activeMaxPrice = Infinity;
        activeSearchQuery = '';
        setActiveCategoryPill('all');
        if (sortSelect) {
          sortSelect.value = 'best-selling';
          applyCollectionSort('best-selling');
        }
        const filterDrawer = document.getElementById('filter-drawer');
        if (filterDrawer) {
          filterDrawer.querySelectorAll('.filter-cat-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
          filterDrawer.querySelectorAll('.filter-price-chip').forEach(c => c.classList.toggle('active', c.dataset.max === 'all'));
        }
      }

      subcatPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          const tag = pill.getAttribute('data-tag') || 'all';
          setActiveCategoryPill(tag);
        });
      });

      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          applyCollectionSort(sortSelect.value);
          showToast('Sıralama güncellendi');
        });
      }

      // Build and attach Filter Drawer for .btn-filter-toggle
      if (filterToggleBtn) {
        let filterDrawer = document.getElementById('filter-drawer');
        if (!filterDrawer) {
          filterDrawer = document.createElement('div');
          filterDrawer.id = 'filter-drawer';
          filterDrawer.className = 'filter-drawer';
          filterDrawer.setAttribute('aria-hidden', 'true');
          filterDrawer.innerHTML = `
            <div class="filter-drawer-overlay" data-action="close-filter"></div>
            <div class="filter-drawer-sheet">
              <div class="filter-drawer-header">
                <span class="filter-drawer-title">Ürünleri Filtrele</span>
                <button type="button" class="filter-drawer-close" data-action="close-filter" aria-label="Kapat">&times;</button>
              </div>
              <div class="filter-drawer-body">
                <div class="filter-group">
                  <div class="filter-group-label">Koleksiyon</div>
                  <div class="filter-chips-wrap">
                    <button type="button" class="filter-chip filter-cat-chip active" data-cat="all">Tümü</button>
                    <button type="button" class="filter-chip filter-cat-chip" data-cat="bohem">Bohem</button>
                    <button type="button" class="filter-chip filter-cat-chip" data-cat="dogal">Doğal</button>
                    <button type="button" class="filter-chip filter-cat-chip" data-cat="astrolojik">Astrolojik</button>
                    <button type="button" class="filter-chip filter-cat-chip" data-cat="manzara">Manzara</button>
                    <button type="button" class="filter-chip filter-cat-chip" data-cat="modern">Modern</button>
                  </div>
                </div>
                <div class="filter-group">
                  <div class="filter-group-label">Fiyat Aralığı</div>
                  <div class="filter-chips-wrap">
                    <button type="button" class="filter-chip filter-price-chip active" data-max="all">Tümü</button>
                    <button type="button" class="filter-chip filter-price-chip" data-max="1350">₺1.350 ve altı</button>
                    <button type="button" class="filter-chip filter-price-chip" data-max="1450">₺1.450 ve altı</button>
                    <button type="button" class="filter-chip filter-price-chip" data-max="1600">₺1.600 ve altı</button>
                  </div>
                </div>
                <div class="filter-group">
                  <div class="filter-group-label">Mevcut Ölçüler</div>
                  <div class="filter-chips-wrap">
                    <button type="button" class="filter-chip filter-size-chip active">70 × 100 cm</button>
                    <button type="button" class="filter-chip filter-size-chip active">100 × 140 cm</button>
                    <button type="button" class="filter-chip filter-size-chip active">140 × 200 cm</button>
                  </div>
                </div>
              </div>
              <div class="filter-drawer-footer">
                <button type="button" class="btn-filter-clear" id="btn-filter-clear">Temizle</button>
                <button type="button" class="btn-filter-apply" id="btn-filter-apply">Sonuçları Göster</button>
              </div>
            </div>
          `;
          document.body.appendChild(filterDrawer);
        }

        function openFilterDrawer() {
          filterDrawer.querySelectorAll('.filter-cat-chip').forEach(c => {
            c.classList.toggle('active', c.dataset.cat === activeCategory);
          });
          filterDrawer.classList.add('active');
          filterDrawer.setAttribute('aria-hidden', 'false');
          syncBodyScrollLock();
        }

        function closeFilterDrawer() {
          filterDrawer.classList.remove('active');
          filterDrawer.setAttribute('aria-hidden', 'true');
          syncBodyScrollLock();
        }

        filterToggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openFilterDrawer();
        });

        filterDrawer.querySelectorAll('[data-action="close-filter"]').forEach(el => {
          el.addEventListener('click', closeFilterDrawer);
        });

        filterDrawer.querySelectorAll('.filter-cat-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            filterDrawer.querySelectorAll('.filter-cat-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            setActiveCategoryPill(chip.dataset.cat);
          });
        });

        filterDrawer.querySelectorAll('.filter-price-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            filterDrawer.querySelectorAll('.filter-price-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeMaxPrice = chip.dataset.max === 'all' ? Infinity : parseInt(chip.dataset.max, 10);
            applyCollectionFilters();
          });
        });

        filterDrawer.querySelectorAll('.filter-size-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            chip.classList.toggle('active');
          });
        });

        const clearBtn = document.getElementById('btn-filter-clear');
        const applyBtn = document.getElementById('btn-filter-apply');
        if (clearBtn) clearBtn.addEventListener('click', () => { resetAllFilters(); closeFilterDrawer(); });
        if (applyBtn) applyBtn.addEventListener('click', closeFilterDrawer);
      }

      // Check URL params (?cat=... or ?q=...)
      try {
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('cat');
        const qParam = params.get('q');
        if (catParam) {
          setActiveCategoryPill(catParam.toLowerCase());
        }
        if (qParam) {
          activeSearchQuery = qParam.trim().toLowerCase();
          applyCollectionFilters();
        }
      } catch (e) {
        // ignore URLSearchParams error
      }
    }

    // -------------------------------------------------------------------------
    // 8. Custom Atelier Section (Wall Tapestry & Real-Time Scale & WhatsApp)
    // -------------------------------------------------------------------------
    let atelierSize = '100 × 140 cm';
    let atelierPrice = 1490;

    const sizeChips = document.querySelectorAll('.atelier-sizes-grid--three .atelier-size-chip, .atelier-size-chip');
    const previewDimBadge = document.getElementById('atelier-preview-dim-badge');
    const labelSelectedSize = document.getElementById('label-selected-size');
    const atelierTotalPrice = document.getElementById('atelier-total-price');
    const atelierWaBtn = document.getElementById('atelier-wa-btn');
    const atelierAddCartBtn = document.getElementById('atelier-add-cart-btn');

    function updateAtelierSizeUI() {
      if (previewDimBadge) previewDimBadge.textContent = atelierSize;
      if (labelSelectedSize) labelSelectedSize.textContent = atelierSize;
      if (atelierTotalPrice) atelierTotalPrice.textContent = formatTurkishPrice(atelierPrice);

      const tapestryWrap = document.querySelector('.mockup-tapestry-wrap');
      if (tapestryWrap) {
        tapestryWrap.classList.remove('size-70x100', 'size-100x140', 'size-140x200');
        if (atelierSize.indexOf('70 × 100') !== -1) {
          tapestryWrap.classList.add('size-70x100');
        } else if (atelierSize.indexOf('140 × 200') !== -1) {
          tapestryWrap.classList.add('size-140x200');
        } else {
          tapestryWrap.classList.add('size-100x140');
        }
      }

      if (atelierWaBtn) {
        const waText = encodeURIComponent(
          'Merhaba Meril Home, kişiye özel duvar örtüsü yaptırmak istiyorum.\n• Seçtiğim Ölçü: ' + atelierSize + '\n• Fiyat: ' + formatTurkishPrice(atelierPrice) + '\nBaskı provası hazırlanması için görselimi iletiyorum.'
        );
        atelierWaBtn.href = 'https://wa.me/905555555555?text=' + waText;
      }
    }

    sizeChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        sizeChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        atelierSize = chip.getAttribute('data-size') || '100 × 140 cm';
        atelierPrice = parseTurkishPrice(chip.getAttribute('data-price') || 1490);
        updateAtelierSizeUI();
      });
    });

    if (atelierAddCartBtn) {
      atelierAddCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addItemToCart({
          title: 'Kişiye Özel Duvar Örtüsü',
          size: atelierSize + ' (Ahşap Askı Kiti Dahil)',
          price: atelierPrice,
          oldPrice: Math.round(atelierPrice * 1.3),
          img: 'assets/urun-gunes-ve-daglar.webp',
          qty: 1
        });
      });
    }

    updateAtelierSizeUI();

    // -------------------------------------------------------------------------
    // 9. Product Accordions & FAQ Accordions
    // -------------------------------------------------------------------------
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.preventDefault();
        const item = header.closest('.accordion-item');
        if (!item) return;
        const body = item.querySelector('.accordion-body');
        const isExpanded = header.getAttribute('aria-expanded') === 'true';

        header.setAttribute('aria-expanded', String(!isExpanded));
        item.classList.toggle('active', !isExpanded);
        if (body) {
          body.style.display = isExpanded ? 'none' : 'block';
        }
      });
    });

    document.querySelectorAll('.faq-question-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const item = btn.closest('.faq-item');
        if (!item) return;
        const answer = item.querySelector('.faq-answer');
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        btn.setAttribute('aria-expanded', String(!isExpanded));
        item.classList.toggle('active', !isExpanded);
        if (answer) {
          answer.style.display = isExpanded ? 'none' : 'block';
        }
      });
    });

    // -------------------------------------------------------------------------
    // 10. Wishlist Buttons Toggle
    // -------------------------------------------------------------------------
    document.querySelectorAll('#wishlist-toggle, .wishlist-btn, .card-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('active');
        const isActive = btn.classList.contains('active');
        const svg = btn.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', isActive ? '#D9534F' : 'none');
          svg.setAttribute('stroke', isActive ? '#D9534F' : 'currentColor');
        }
        showToast(isActive ? '♥ Favorilere eklendi' : 'Favorilerden çıkarıldı');
      });
    });

    // -------------------------------------------------------------------------
    // 11. Horizontal Slide-Down Search Bar
    // -------------------------------------------------------------------------
    const searchToggles = document.querySelectorAll('.search-toggle, [data-action="open-search"]');
    const searchDropdown = document.getElementById('header-search-dropdown');
    const searchCloseBtn = document.getElementById('search-close-btn');
    const searchInput = document.getElementById('header-search-input');

    function openSearch() {
      if (searchDropdown) {
        searchDropdown.classList.add('active');
        searchDropdown.setAttribute('aria-hidden', 'false');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 150);
        }
      }
    }

    function closeSearch() {
      if (searchDropdown) {
        searchDropdown.classList.remove('active');
        searchDropdown.setAttribute('aria-hidden', 'true');
      }
    }

    searchToggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (searchDropdown && searchDropdown.classList.contains('active')) {
          closeSearch();
        } else {
          openSearch();
        }
      });
    });

    if (searchCloseBtn) {
      searchCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeSearch();
      });
    }

    // Close search when clicking outside header
    document.addEventListener('click', (e) => {
      if (searchDropdown && searchDropdown.classList.contains('active')) {
        if (!e.target.closest('#site-header')) {
          closeSearch();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearch();
        closeCart();
        closeMobileDrawer();
        const fd = document.getElementById('filter-drawer');
        if (fd && fd.classList.contains('active')) {
          fd.classList.remove('active');
          fd.setAttribute('aria-hidden', 'true');
          syncBodyScrollLock();
        }
      }
    });

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
          const query = encodeURIComponent(searchInput.value.trim());
          if (window.Shopify) {
            window.location.href = '/search?q=' + query;
          } else {
            window.location.href = '/collection?q=' + query;
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // 12. Enable Desktop Drag-to-Scroll on ALL Horizontal Scroll Strips
    // -------------------------------------------------------------------------
    document.querySelectorAll(
      '.subcategory-pills-row, .social-scroll-wrap, .related-products-scroll, .search-quick-tags, .product-thumbnails-row'
    ).forEach(enableDragScroll);

    // -------------------------------------------------------------------------
    // 13. Checkout Button Handler
    // -------------------------------------------------------------------------
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        const total = calculateCartTotal();
        if (total === 0) {
          e.preventDefault();
          showToast('Sepetiniz boş. Önce bir ürün ekleyin.');
          return;
        }
        if (!window.Shopify) {
          e.preventDefault();
          alert('🎉 Sipariş özetiniz hazır!\nToplam Ürün: ' + calculateCartCount() + ' adet\nToplam Tutar: ' + formatTurkishPrice(total) + '\nKargo: ÜCRETSİZ');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMerilHome);
  } else {
    initMerilHome();
  }
})();
