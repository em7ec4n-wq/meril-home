// Meril Home - Complete Client JavaScript
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Drawer Navigation
  const menuBtn = document.getElementById('menu-toggle-btn');
  const drawer = document.getElementById('mobile-drawer');
  const drawerCloses = document.querySelectorAll('[data-action="close-drawer"]');

  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => drawer.classList.add('active'));
    drawerCloses.forEach(el => el.addEventListener('click', () => drawer.classList.remove('active')));
  }

  // 2. Mini Cart Drawer
  const cartBtn = document.getElementById('cart-toggle-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartCloses = document.querySelectorAll('[data-action="close-cart"]');
  const headerCartBadge = document.getElementById('header-cart-badge');
  const cartCountBadge = document.getElementById('cart-count-badge');
  const cartTotalAmount = document.getElementById('cart-total-amount');

  let cartCount = 0;

  function openCart() {
    if (cartDrawer) {
      cartDrawer.classList.add('active');
      cartDrawer.setAttribute('aria-hidden', 'false');
    }
  }

  function closeCart() {
    if (cartDrawer) {
      cartDrawer.classList.remove('active');
      cartDrawer.setAttribute('aria-hidden', 'true');
    }
  }

  function updateCartUI() {
    if (headerCartBadge) headerCartBadge.textContent = cartCount;
    if (cartCountBadge) cartCountBadge.textContent = cartCount;
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  cartCloses.forEach(el => el.addEventListener('click', closeCart));

  // 3. Product Variant Selector (Product page)
  const variantChips = document.querySelectorAll('.variant-chip');
  const currentPriceEl = document.querySelector('.price-current');
  const oldPriceEl = document.querySelector('.price-old');
  const stickyCurrentPrice = document.querySelector('.sticky-current-price');
  const stickyOldPrice = document.querySelector('.sticky-old-price');
  const cartVariantText = document.getElementById('cart-item-selected-size');

  variantChips.forEach(chip => {
    chip.addEventListener('click', () => {
      variantChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const price = chip.getAttribute('data-price');
      const compare = chip.getAttribute('data-compare');
      const size = chip.getAttribute('data-size');

      if (currentPriceEl && price) currentPriceEl.textContent = price;
      if (oldPriceEl && compare) oldPriceEl.textContent = compare;
      if (stickyCurrentPrice && price) stickyCurrentPrice.textContent = price;
      if (stickyOldPrice && compare) stickyOldPrice.textContent = compare;
      if (cartVariantText && size) cartVariantText.textContent = 'Ölçü: ' + size;
    });
  });

  // 4. Quantity Selector
  const qtyInput = document.getElementById('product-quantity');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
    });
  }

  // 5. Add to Cart Actions
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const stickyAtcBtn = document.getElementById('sticky-atc-btn');

  function handleAddToCart() {
    const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
    cartCount += qty;
    updateCartUI();
    openCart();
  }

  if (addToCartBtn) addToCartBtn.addEventListener('click', handleAddToCart);
  if (stickyAtcBtn) stickyAtcBtn.addEventListener('click', handleAddToCart);

  // 6. Gallery Thumbnails (Product Page)
  const mainGalleryImg = document.getElementById('main-gallery-img');
  const galleryThumbs = document.querySelectorAll('.gallery-thumb');

  galleryThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      galleryThumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      const fullSrc = thumb.getAttribute('data-full-img');
      if (mainGalleryImg && fullSrc) {
        mainGalleryImg.src = fullSrc;
      }
    });
  });

  // 7. Product Accordions
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      header.setAttribute('aria-expanded', !isExpanded);
      item.classList.toggle('active', !isExpanded);
      if (body) {
        body.style.display = isExpanded ? 'none' : 'block';
      }
    });
  });

  // 8. Wishlist Toggle
  const wishlistToggle = document.getElementById('wishlist-toggle');
  if (wishlistToggle) {
    wishlistToggle.addEventListener('click', () => {
      wishlistToggle.classList.toggle('active');
    });
  }

  // 9. Real Interactive Hero Carousel Slider
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroPills = document.querySelectorAll('.hero-pill');
  const heroPrev = document.getElementById('hero-prev-btn');
  const heroNext = document.getElementById('hero-next-btn');
  let currentHeroSlide = 0;
  const totalHeroSlides = heroSlides.length || 3;
  let heroTimer = null;

  function setHeroSlide(idx) {
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
    heroTimer = setInterval(() => {
      setHeroSlide(currentHeroSlide + 1);
    }, 4500);
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

  const heroSec = document.getElementById('hero-section');
  if (heroSec) {
    let touchStartX = 0;
    heroSec.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      stopHeroTimer();
    }, { passive: true });

    heroSec.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 35) {
        if (diff < 0) setHeroSlide(currentHeroSlide + 1);
        else setHeroSlide(currentHeroSlide - 1);
      }
      startHeroTimer();
    }, { passive: true });

    heroSec.addEventListener('mouseenter', stopHeroTimer);
    heroSec.addEventListener('mouseleave', startHeroTimer);
  }

  if (heroSlides.length > 0) {
    startHeroTimer();
  }

  // 10. Quick Add to Cart for Category & Related
  const quickAddBtns = document.querySelectorAll('.card-quick-add-btn');
  quickAddBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const title = btn.getAttribute('data-title') || 'Duvar Örtüsü';
      const price = btn.getAttribute('data-price') || '₺1.490,00';

      cartCount += 1;
      updateCartUI();

      const titleEl = document.querySelector('.cart-item-title');
      const priceEl = document.querySelector('.cart-item-price');
      if (titleEl) titleEl.textContent = title;
      if (priceEl) priceEl.innerHTML = price + ' <span class="cart-item-old-price">₺1.990,00</span>';
      if (cartTotalAmount) cartTotalAmount.textContent = price;

      openCart();
    });
  });

  // 11. Category Subcategory Pills Filter
  const subcatPills = document.querySelectorAll('.subcat-pill');
  const productCards = document.querySelectorAll('.product-grid-card');

  subcatPills.forEach(pill => {
    pill.addEventListener('click', () => {
      subcatPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const tag = pill.getAttribute('data-tag');
      productCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (tag === 'all' || cat === tag) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 12. FAQ Accordion Toggle
  const faqBtns = document.querySelectorAll('.faq-question-btn');
  faqBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', !isExpanded);
      item.classList.toggle('active', !isExpanded);
      if (answer) {
        answer.style.display = isExpanded ? 'none' : 'block';
      }
    });
  });

  // 13. Wishlist Heart buttons in cards
  const cardWishlists = document.querySelectorAll('.card-wishlist-btn');
  cardWishlists.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('active');
    });
  });

  // 14. Simplified Custom Atelier (Duvar Örtüsü & WhatsApp)
  let atelierSize = '100 × 140 cm';
  let atelierPrice = 1490;

  const sizeChips = document.querySelectorAll('.atelier-sizes-grid--three .atelier-size-chip');
  const previewDimBadge = document.getElementById('atelier-preview-dim-badge');
  const labelSelectedSize = document.getElementById('label-selected-size');
  const atelierTotalPrice = document.getElementById('atelier-total-price');
  const atelierWaBtn = document.getElementById('atelier-wa-btn');
  const atelierAddCartBtn = document.getElementById('atelier-add-cart-btn');

  function updateAtelierSizeUI() {
    if (previewDimBadge) previewDimBadge.textContent = atelierSize;
    if (labelSelectedSize) labelSelectedSize.textContent = atelierSize;
    if (atelierTotalPrice) atelierTotalPrice.textContent = '₺' + atelierPrice.toLocaleString('tr-TR') + ',00';

    // Real-time Visual Size Scaling on the Wall
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
        'Merhaba Meril Home, kişiye özel duvar örtüsü yaptırmak istiyorum.\n• Seçtiğim Ölçü: ' + atelierSize + '\n• Özel Üretim Tutarı: ₺' + atelierPrice.toLocaleString('tr-TR') + ',00\nBaskı provası hazırlanması için görselimi iletiyorum.'
      );
      atelierWaBtn.href = 'https://wa.me/905555555555?text=' + waText;
    }
  }

  sizeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      sizeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      atelierSize = chip.getAttribute('data-size') || '100 × 140 cm';
      atelierPrice = parseInt(chip.getAttribute('data-price')) || 1490;
      updateAtelierSizeUI();
    });
  });

  if (atelierAddCartBtn) {
    atelierAddCartBtn.addEventListener('click', () => {
      cartCount += 1;
      updateCartUI();

      const titleEl = document.querySelector('.cart-item-title');
      const varEl = document.querySelector('.cart-item-variant');
      const priceEl = document.querySelector('.cart-item-price');

      if (titleEl) titleEl.textContent = 'Kişiye Özel Duvar Örtüsü';
      if (varEl) varEl.textContent = 'Ölçü: ' + atelierSize + ' (Ahşap Askı Dahil)';
      if (priceEl) priceEl.innerHTML = '₺' + atelierPrice.toLocaleString('tr-TR') + ',00 <span class="cart-item-old-price">₺' + Math.round(atelierPrice * 1.3).toLocaleString('tr-TR') + ',00</span>';
      if (cartTotalAmount) cartTotalAmount.textContent = '₺' + atelierPrice.toLocaleString('tr-TR') + ',00';

      openCart();
    });
  }

  updateAtelierSizeUI();


  // 15. Horizontal Slide-Down Search Bar
  const searchToggles = document.querySelectorAll('.search-toggle');
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
  });

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        window.location.href = '/collection.html?q=' + encodeURIComponent(searchInput.value.trim());
      }
    });
  }

});
