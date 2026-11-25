// Meril Home - JavaScript Logic
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

  let cartCount = 0;

  function openCart() {
    if (cartDrawer) {
      cartDrawer.classList.add('active');
    }
  }

  function updateCartUI() {
    if (headerCartBadge) headerCartBadge.textContent = cartCount;
    if (cartCountBadge) cartCountBadge.textContent = cartCount;
  }

  if (cartBtn && cartDrawer) {
    cartBtn.addEventListener('click', openCart);
    cartCloses.forEach(el => el.addEventListener('click', () => cartDrawer.classList.remove('active')));
  }

  // 3. Size Variant Selection
  const variantChips = document.querySelectorAll('.variant-chip');
  const productPrice = document.getElementById('product-price');
  const productComparePrice = document.getElementById('product-compare-price');
  const stickyPrice = document.getElementById('sticky-price');
  const stickyCompare = document.getElementById('sticky-compare');
  const cartVariantText = document.getElementById('cart-item-selected-size');
  const cartTotalAmount = document.getElementById('cart-total-amount');

  variantChips.forEach(chip => {
    chip.addEventListener('click', () => {
      variantChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const size = chip.getAttribute('data-size');
      const price = chip.getAttribute('data-price');
      const compare = chip.getAttribute('data-compare');

      if (productPrice) productPrice.textContent = price;
      if (productComparePrice) productComparePrice.textContent = compare;
      if (stickyPrice) stickyPrice.textContent = price;
      if (stickyCompare) stickyCompare.textContent = compare;
      if (cartVariantText) cartVariantText.textContent = 'Ölçü: ' + size;
      if (cartTotalAmount) cartTotalAmount.textContent = price;
    });
  });

  // 4. Quantity Selector
  const qtyDecrease = document.getElementById('qty-decrease');
  const qtyIncrease = document.getElementById('qty-increase');
  const qtyValue = document.getElementById('qty-value');
  let quantity = 1;

  if (qtyDecrease && qtyIncrease && qtyValue) {
    qtyDecrease.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        qtyValue.textContent = quantity;
      }
    });

    qtyIncrease.addEventListener('click', () => {
      quantity++;
      qtyValue.textContent = quantity;
    });
  }

  // 5. Add to Cart Actions (Main & Sticky Sync)
  const btnAddToCart = document.getElementById('btn-add-to-cart');
  const btnStickyAtc = document.getElementById('btn-sticky-atc');

  function handleAddToCart() {
    cartCount += quantity;
    updateCartUI();
    openCart();
  }

  if (btnAddToCart) btnAddToCart.addEventListener('click', handleAddToCart);
  if (btnStickyAtc) btnStickyAtc.addEventListener('click', handleAddToCart);

  // 6. Gallery Image & Thumbnails Switcher
  const mainProductImg = document.getElementById('main-product-img');
  const thumbnails = document.querySelectorAll('.thumbnail-item');
  const galleryPills = document.querySelectorAll('.gallery-pill');
  let activeImageIndex = 0;

  function setActiveGalleryImage(index) {
    activeImageIndex = (index + thumbnails.length) % thumbnails.length;
    thumbnails.forEach((t, i) => {
      t.classList.toggle('active', i === activeImageIndex);
    });
    galleryPills.forEach((p, i) => {
      p.classList.toggle('active', i === (activeImageIndex % galleryPills.length));
    });
    const selectedThumb = thumbnails[activeImageIndex];
    if (selectedThumb && mainProductImg) {
      const src = selectedThumb.getAttribute('data-src');
      mainProductImg.style.opacity = '0.4';
      setTimeout(() => {
        mainProductImg.src = src;
        mainProductImg.style.opacity = '1';
      }, 150);
    }
  }

  thumbnails.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => setActiveGalleryImage(idx));
  });

  const galleryPrev = document.getElementById('gallery-prev');
  const galleryNext = document.getElementById('gallery-next');
  if (galleryPrev) galleryPrev.addEventListener('click', () => setActiveGalleryImage(activeImageIndex - 1));
  if (galleryNext) galleryNext.addEventListener('click', () => setActiveGalleryImage(activeImageIndex + 1));

  // 7. Accordion Toggle
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
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

  // 9. Hero Carousel Loop with Accessible Pause
  const heroPills = document.querySelectorAll('.hero-pill');
  const heroPrev = document.getElementById('hero-prev-btn');
  const heroNext = document.getElementById('hero-next-btn');
  const heroTapestryLayer = document.getElementById('hero-tapestry-layer');
  let currentHeroSlide = 0;
  const totalHeroSlides = 3;

  function setHeroSlide(idx) {
    currentHeroSlide = (idx + totalHeroSlides) % totalHeroSlides;
    heroPills.forEach((pill, i) => {
      pill.classList.toggle('active', i === currentHeroSlide);
    });
  }

  if (heroPrev) heroPrev.addEventListener('click', () => setHeroSlide(currentHeroSlide - 1));
  if (heroNext) heroNext.addEventListener('click', () => setHeroSlide(currentHeroSlide + 1));
  heroPills.forEach((pill, idx) => {
    pill.addEventListener('click', () => setHeroSlide(idx));
  });
});
