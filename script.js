const body = document.body;
const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.querySelector('.site-header');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

body.classList.add('animations-ready');
if (!('IntersectionObserver' in window)) body.classList.add('no-intersection-observer');

const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.appendChild(progressBar);

function closeMenu() {
  body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Открыть меню');
}

if (menuButton) {
  menuButton.addEventListener('click', () => {
    const isOpen = body.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothScrollTo(targetY, duration = 850) {
  if (reduceMotion) {
    window.scrollTo(0, targetY);
    return;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');

    if (!href || !href.startsWith('#')) return;

    const target = href === '#top' ? document.querySelector('main') : document.querySelector(href);

    if (target) {
      event.preventDefault();
      const offset = window.innerWidth <= 980 ? 95 : 130;
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      closeMenu();
      smoothScrollTo(Math.max(y, 0));
      setupActiveNavigation();
    }
  });
});

function prepareRevealAnimations() {
  if (reduceMotion) {
    body.classList.add('page-loaded');
    document.querySelectorAll('.reveal').forEach((item) => {
      item.classList.add('is-visible');
    });
    return;
  }

  const revealItems = [
    ...document.querySelectorAll('main > .section-card:not(.hero):not(.detail-hero)'),
    ...document.querySelectorAll('.object-card, .route-card, .info-card'),
    ...document.querySelectorAll('.catalog-card, .catalog-filter, .catalog-list, .catalog-cta'),
    ...document.querySelectorAll('.detail-card, .detail-cta'),
    ...document.querySelectorAll('.site-footer, .footer-about, .footer-column'),
    ...document.querySelectorAll('.reveal')
  ];

  const uniqueRevealItems = [...new Set(revealItems)].filter(Boolean);

  uniqueRevealItems.forEach((item, index) => {
    item.classList.add('reveal');

    const parentGrid = item.closest('.object-grid, .routes-grid, .info-grid, .footer-grid, .catalog-grid, .detail-main, .detail-sidebar');
    if (parentGrid) {
      const siblings = [...parentGrid.children].filter((child) => uniqueRevealItems.includes(child));
      const localIndex = siblings.indexOf(item);
      item.style.setProperty('--reveal-delay', `${Math.max(localIndex, 0) * 90}ms`);
    } else {
      item.style.setProperty('--reveal-delay', `${Math.min(index * 20, 120)}ms`);
    }
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.10,
    rootMargin: '0px 0px -4% 0px'
  });

  uniqueRevealItems.forEach((item) => {
    observer.observe(item);

    const rect = item.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight * 0.96 && rect.bottom > 0;
    if (alreadyVisible) {
      item.classList.add('is-visible');
    }
  });
}

function setupActiveNavigation() {
  const page = document.body.dataset.page || 'home';

  navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === page);
  });
}

function setupButtonRipples() {
  document.querySelectorAll('.button').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (reduceMotion) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      const ripple = document.createElement('span');

      ripple.className = 'button-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;

      button.appendChild(ripple);

      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

function setupCardTilt() {
  if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;

  const cards = document.querySelectorAll('.object-card, .route-card');

  cards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

function updateScrollEffects() {
  const scrollTop = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

  progressBar.style.transform = `scaleX(${progress})`;

  if (header) {
    header.classList.toggle('is-scrolled', scrollTop > 24);
  }

  if (!reduceMotion) {
    const heroShift = Math.min(scrollTop * 0.055, 34);
    document.documentElement.style.setProperty('--hero-bg-y', `${heroShift}px`);
  }
}

let lastScrollY = window.scrollY;
let ticking = false;

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateScrollEffects();

      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY;
      const farEnough = currentY > 520;

      if (header) {
        header.classList.toggle('is-hidden', scrollingDown && farEnough && !body.classList.contains('menu-open'));
      }

      lastScrollY = currentY;
      ticking = false;
    });

    ticking = true;
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', updateScrollEffects);

window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    body.classList.add('page-loaded');
    prepareRevealAnimations();
    setupActiveNavigation();
    setupButtonRipples();
    setupCardTilt();
    setupInteractiveMap();
    setupCatalogPage();
    setupDetailPage();
    updateScrollEffects();
  });
});


function setupInteractiveMap() {
  const map = document.querySelector('[data-interactive-map]');
  if (!map) return;

  const canvas = map.querySelector('.map-canvas');
  const popup = map.querySelector('[data-map-popup]');
  const markers = [...map.querySelectorAll('.map-marker')];
  const listItems = [...map.querySelectorAll('.map-list-item')];

  if (!canvas || !popup) return;

  const popupHome = document.createComment('map popup original position');
  if (popup.parentNode !== document.body) {
    popup.parentNode.insertBefore(popupHome, popup);
    document.body.appendChild(popup);
  }

  const closeButton = popup.querySelector('.map-popup-close');
  const popupImg = popup.querySelector('[data-popup-img]');
  const popupTag = popup.querySelector('[data-popup-tag]');
  const popupTitle = popup.querySelector('[data-popup-title]');
  const popupAddress = popup.querySelector('[data-popup-address]');
  const popupText = popup.querySelector('[data-popup-text]');
  const popupStyle = popup.querySelector('[data-popup-style]');
  const popupTime = popup.querySelector('[data-popup-time]');

  const points = {
    salamandra: {
      tag: 'Объект 1',
      title: 'Доходный дом страхового общества «Саламандра»',
      address: 'Гороховая улица, 6',
      text: 'Исторический доходный дом с выразительной парадной и атмосферой старого Петербурга.',
      style: 'Модерн',
      time: '10–15 минут',
      image: 'img/1_1_block.jpg',
      x: '26%',
      y: '45%'
    },
    sleptsova: {
      tag: 'Объект 2',
      title: 'Особняк Слепцова',
      address: 'Большая Конюшенная улица, 9',
      text: 'Камерный городской особняк, который хорошо подходит для маршрута по центральной части города.',
      style: 'Особняк',
      time: '8–12 минут',
      image: 'img/2_2_block.jpg',
      x: '35%',
      y: '48%'
    },
    eliseeva: {
      tag: 'Объект 3',
      title: 'Доходный дом Елисеева',
      address: 'Улица Ломоносова, 14',
      text: 'Доходный дом с насыщенной пластикой и выразительными деталями в исторической среде.',
      style: 'Эклектика',
      time: '12–18 минут',
      image: 'img/1_3_block.jpg',
      x: '54%',
      y: '64%'
    },
    kanshina: {
      tag: 'Объект 4',
      title: 'Особняк Каншина',
      address: 'Кузнечный переулок, 6',
      text: 'Выразительный объект с декоративными деталями, который добавляет маршруту интерьерный акцент.',
      style: 'Историзм',
      time: '10–15 минут',
      image: 'img/1_2_block.jpg',
      x: '63%',
      y: '64%'
    },
    rul: {
      tag: 'Объект 5',
      title: 'Дом Рюль / Дом Г. Г. Блокка',
      address: 'Невский проспект, 65',
      text: 'Заметный объект на Невском проспекте, удобный как точка маршрута в центральной части города.',
      style: 'Доходный дом',
      time: '10–15 минут',
      image: 'img/2_1_block.jpg',
      x: '66%',
      y: '54%'
    },
    pertsova: {
      tag: 'Объект 6',
      title: 'Доходный дом А. Н. Перцова',
      address: 'Лиговский проспект, 44',
      text: 'Доходный дом рядом с оживлённой городской осью, завершающий маршрут выразительной точкой.',
      style: 'Доходный дом',
      time: '10–15 минут',
      image: 'img/2_3_block.jpg',
      x: '70%',
      y: '73%'
    }
  };

  let activeId = 'salamandra';

  function fillPopup(point) {
    popupImg.src = point.image;
    popupImg.alt = point.title;
    popupTag.textContent = point.tag;
    popupTitle.textContent = point.title;
    popupAddress.textContent = point.address;
    popupText.textContent = point.text;
    popupStyle.textContent = point.style;
    popupTime.textContent = point.time;
  }

  function updateVisualState(id, mode = 'active') {
    const point = points[id];
    if (!point) return;

    canvas.style.setProperty('--active-x', point.x);
    canvas.style.setProperty('--active-y', point.y);

    markers.forEach((marker) => {
      const isTarget = marker.dataset.mapId === id;
      marker.classList.toggle('is-active', mode === 'active' && isTarget);
      marker.classList.toggle('is-preview', mode === 'preview' && isTarget);
    });

    listItems.forEach((item) => {
      const isTarget = item.dataset.mapId === id;
      item.classList.toggle('is-active', mode === 'active' && isTarget);
      item.classList.toggle('is-preview', mode === 'preview' && isTarget);
    });
  }

  function updatePopupPosition() {
    if (!popup.classList.contains('is-open')) return;

    const activeMarker = markers.find((marker) => marker.dataset.mapId === activeId);
    if (!activeMarker) return;

    const markerRect = activeMarker.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const gap = 18;
    const padding = 16;

    let left = markerRect.left + markerRect.width / 2 - popupRect.width / 2;
    let top = markerRect.top - popupRect.height - gap;

    if (left < padding) left = padding;
    if (left + popupRect.width > window.innerWidth - padding) {
      left = window.innerWidth - popupRect.width - padding;
    }

    if (top < padding) {
      top = markerRect.bottom + gap;
    }

    if (top + popupRect.height > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - popupRect.height - padding);
    }

    popup.style.setProperty('--popup-left', `${Math.round(left)}px`);
    popup.style.setProperty('--popup-top', `${Math.round(top)}px`);
  }

  function openPoint(id, animate = true) {
    const point = points[id];
    if (!point) return;

    activeId = id;
    updateVisualState(id, 'active');

    const wasOpen = popup.classList.contains('is-open');

    if (animate && wasOpen) {
      popup.classList.add('is-switching');

      window.setTimeout(() => {
        fillPopup(point);
        popup.classList.remove('is-switching');
        popup.classList.add('is-open');
        requestAnimationFrame(updatePopupPosition);
      }, 150);
    } else {
      fillPopup(point);
      popup.classList.add('is-open');
      requestAnimationFrame(updatePopupPosition);
    }
  }

  function previewPoint(id) {
    if (popup.classList.contains('is-open')) return;
    updateVisualState(id, 'preview');
  }

  function clearPreview() {
    if (popup.classList.contains('is-open')) return;
    updateVisualState(activeId, 'active');
  }

  function closePopup() {
    popup.classList.remove('is-open', 'is-switching');
    updateVisualState(activeId, 'active');
  }

  markers.forEach((marker) => {
    marker.addEventListener('click', (event) => {
      event.stopPropagation();
      openPoint(marker.dataset.mapId);
    });

    marker.addEventListener('mouseenter', () => {
      if (window.matchMedia('(pointer: fine)').matches) {
        previewPoint(marker.dataset.mapId);
      }
    });

    marker.addEventListener('mouseleave', clearPreview);
  });

  listItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      openPoint(item.dataset.mapId);
    });

    item.addEventListener('mouseenter', () => {
      if (window.matchMedia('(pointer: fine)').matches) {
        previewPoint(item.dataset.mapId);
      }
    });

    item.addEventListener('mouseleave', clearPreview);
  });

  closeButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    closePopup();
  });

  popup.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  canvas.addEventListener('click', (event) => {
    const clickedMarker = event.target.closest('.map-marker');
    if (!clickedMarker) closePopup();
  });

  document.addEventListener('click', (event) => {
    const clickedMapControl = event.target.closest('[data-interactive-map]');
    const clickedPopup = event.target.closest('[data-map-popup]');

    if (!clickedMapControl && !clickedPopup) {
      closePopup();
    }
  });

  const mapObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      canvas.classList.add('is-line-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.34
  });

  mapObserver.observe(canvas);

  fillPopup(points[activeId]);
  updateVisualState(activeId, 'active');
  closePopup();

  window.addEventListener('scroll', updatePopupPosition, { passive: true });
  window.addEventListener('resize', updatePopupPosition);
}


function setupCatalogPage() {
  const grid = document.querySelector('[data-catalog-grid]');
  if (!grid) return;

  const cards = [...grid.querySelectorAll('.catalog-card')];
  const searchInput = document.querySelector('[data-catalog-search]');
  const filterControls = [...document.querySelectorAll('[data-catalog-filter]')];
  const sortControl = document.querySelector('[data-catalog-sort]');
  const findButton = document.querySelector('[data-catalog-find]');
  const resetButton = document.querySelector('[data-catalog-reset]');
  const countLabel = document.querySelector('[data-catalog-count]');
  const emptyState = document.querySelector('[data-catalog-empty]');

  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/ё/g, 'е');
  }

  function getSearchHaystack(card) {
    return normalize([
      card.dataset.title,
      card.dataset.address,
      card.dataset.building,
      card.dataset.style,
      card.dataset.feature,
      card.textContent
    ].join(' '));
  }

  function cardMatches(card) {
    const query = normalize(searchInput?.value);
    const building = normalize(document.querySelector('[data-catalog-filter="building"]')?.value);
    const style = normalize(document.querySelector('[data-catalog-filter="style"]')?.value);
    const access = normalize(document.querySelector('[data-catalog-filter="access"]')?.value);
    const feature = normalize(document.querySelector('[data-catalog-filter="feature"]')?.value);

    const haystack = getSearchHaystack(card);

    const queryMatch = !query || haystack.includes(query);
    const buildingMatch = !building || normalize(card.dataset.building).includes(building);
    const styleMatch = !style || normalize(card.dataset.style).includes(style);
    const accessMatch = !access || normalize(card.dataset.access).includes(access);
    const featureMatch = !feature || normalize(card.dataset.feature).includes(feature);

    return queryMatch && buildingMatch && styleMatch && accessMatch && featureMatch;
  }

  function sortCards(visibleCards) {
    const sortValue = sortControl?.value || 'popular';

    const sorted = [...visibleCards].sort((a, b) => {
      if (sortValue === 'name') {
        return normalize(a.dataset.title).localeCompare(normalize(b.dataset.title), 'ru');
      }

      if (sortValue === 'address') {
        return normalize(a.dataset.address).localeCompare(normalize(b.dataset.address), 'ru');
      }

      return cards.indexOf(a) - cards.indexOf(b);
    });

    sorted.forEach((card) => grid.appendChild(card));
  }

  function applyCatalogFilters() {
    const visibleCards = [];

    cards.forEach((card) => {
      const isVisible = cardMatches(card);
      card.classList.toggle('is-hidden', !isVisible);

      if (isVisible) visibleCards.push(card);
    });

    sortCards(visibleCards);

    if (countLabel) {
      const count = visibleCards.length;
      const lastDigit = count % 10;
      const lastTwoDigits = count % 100;
      const word = lastDigit === 1 && lastTwoDigits !== 11
        ? 'объект'
        : lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)
          ? 'объекта'
          : 'объектов';
      countLabel.textContent = `Найдено ${count} ${word}`;
    }

    if (emptyState) {
      emptyState.hidden = visibleCards.length !== 0;
    }
  }

  searchInput?.addEventListener('input', applyCatalogFilters);
  sortControl?.addEventListener('change', applyCatalogFilters);
  filterControls.forEach((control) => control.addEventListener('change', applyCatalogFilters));
  findButton?.addEventListener('click', applyCatalogFilters);

  resetButton?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    filterControls.forEach((control) => {
      control.value = '';
    });
    if (sortControl) sortControl.value = 'popular';
    applyCatalogFilters();
  });

  applyCatalogFilters();
}


function setupDetailPage() {
  const addButton = document.querySelector('[data-add-route]');
  const gallery = document.querySelector('[data-gallery]');
  const pagination = document.querySelector('[data-gallery-pagination]');
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImg = document.querySelector('[data-lightbox-img]');
  const lightboxTitle = document.querySelector('[data-lightbox-title]');
  const lightboxAddress = document.querySelector('[data-lightbox-address]');
  const closeButton = document.querySelector('[data-lightbox-close]');
  const prevButton = document.querySelector('[data-lightbox-prev]');
  const nextButton = document.querySelector('[data-lightbox-next]');
  const galleryItems = [...document.querySelectorAll('[data-gallery-src]')];
  const detailTitle = document.querySelector('.detail-hero h1')?.textContent.trim();
  const detailAddress = document.querySelector('.detail-info .info-list dd')?.textContent.trim();

  if (lightboxTitle && detailTitle) lightboxTitle.textContent = detailTitle;
  if (lightboxAddress && detailAddress) lightboxAddress.textContent = detailAddress;

  addButton?.addEventListener('click', () => {
    const isAdded = addButton.classList.toggle('is-added');
    const text = addButton.querySelector('span');

    if (text) {
      text.textContent = isAdded ? 'Добавлено в маршрут' : 'Добавить в маршрут';
    }
  });

  if (gallery && pagination && galleryItems.length > 0) {
    const pageSize = Number(gallery.dataset.galleryPageSize) || 8;
    const pageCount = Math.ceil(galleryItems.length / pageSize);
    let currentPage = 1;

    function renderGalleryPage(page) {
      currentPage = Math.min(Math.max(page, 1), pageCount);
      gallery.classList.add('is-switching');

      window.setTimeout(() => {
        galleryItems.forEach((item, index) => {
          const itemPage = Math.floor(index / pageSize) + 1;
          item.classList.toggle('is-hidden', itemPage !== currentPage);
        });

        [...pagination.querySelectorAll('.gallery-page-button')].forEach((button) => {
          button.classList.toggle('is-active', Number(button.dataset.page) === currentPage);
        });

        const next = pagination.querySelector('[data-gallery-next]');
        if (next) {
          next.disabled = currentPage === pageCount;
          next.style.opacity = currentPage === pageCount ? '0.55' : '1';
        }

        gallery.classList.remove('is-switching');
      }, 130);
    }

    pagination.innerHTML = '';

    for (let page = 1; page <= pageCount; page += 1) {
      const button = document.createElement('button');
      button.className = 'gallery-page-button';
      button.type = 'button';
      button.dataset.page = String(page);
      button.textContent = String(page);
      button.addEventListener('click', () => renderGalleryPage(page));
      pagination.appendChild(button);
    }

    const nextButtonPage = document.createElement('button');
    nextButtonPage.className = 'gallery-next-button';
    nextButtonPage.type = 'button';
    nextButtonPage.dataset.galleryNext = 'true';
    nextButtonPage.textContent = 'Далее →';
    nextButtonPage.addEventListener('click', () => renderGalleryPage(currentPage + 1));
    pagination.appendChild(nextButtonPage);

    renderGalleryPage(1);
  }

  if (!lightbox || !lightboxImg || galleryItems.length === 0) return;

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = galleryItems[currentIndex].dataset.gallerySrc;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].dataset.gallerySrc;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].dataset.gallerySrc;
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  closeButton?.addEventListener('click', closeLightbox);
  prevButton?.addEventListener('click', showPrev);
  nextButton?.addEventListener('click', showNext);

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showPrev();
    if (event.key === 'ArrowRight') showNext();
  });
}
