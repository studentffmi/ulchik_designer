'use strict';

const menuButton = document.querySelector('.mobile-nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

function closeMenu() {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Відкрити меню');
  mobileNav.hidden = true;
  document.body.classList.remove('no-scroll');
}

if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Закрити меню' : 'Відкрити меню');
    mobileNav.hidden = !opening;
    document.body.classList.toggle('no-scroll', opening);
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) closeMenu();
  });
}

const serviceSelect = document.getElementById('client-service');
document.querySelectorAll('.service-choose').forEach(link => {
  link.addEventListener('click', () => {
    if (serviceSelect) serviceSelect.value = link.dataset.service || '';
  });
});

const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');
if (form && statusEl) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const label = submitBtn.querySelector('.submit-label');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    statusEl.textContent = '';
    statusEl.className = 'form-status';
    submitBtn.disabled = true;
    label.textContent = 'Надсилаємо...';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree returned ${response.status}`);

      form.reset();
      statusEl.textContent = 'Дякую! Вашу заявку надіслано. Я зв’яжуся з вами за вказаним контактом.';
      statusEl.classList.add('success');
    } catch (error) {
      statusEl.textContent = 'Не вдалося надіслати заявку. Перевірте з’єднання та спробуйте ще раз. Якщо помилка повториться, напишіть мені в Instagram.';
      statusEl.classList.add('error');
    } finally {
      submitBtn.disabled = false;
      label.textContent = 'Надіслати заявку';
    }
  });
}

const yearEl = document.getElementById('copyright-year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Плавний слайдер портфоліо: циклічне гортання, свайпи, клавіатура, автопрокрутка.
(() => {
  const slider = document.getElementById('portfolio-slider');
  if (!slider) return;
  const viewport = slider.querySelector('.portfolio-viewport');
  const track = slider.querySelector('.portfolio-track');
  const slides = Array.from(track.querySelectorAll('.portfolio-slide'));
  const dots = Array.from(slider.querySelectorAll('.portfolio-dot'));
  const title = slider.querySelector('#portfolio-slide-title');
  const category = slider.querySelector('#portfolio-slide-category');
  const current = slider.querySelector('#portfolio-current');
  const nextButton = slider.querySelector('[data-slide-next]');
  const prevButton = slider.querySelector('[data-slide-prev]');
  if (!viewport || !track || slides.length < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 730;
  let index = 0;
  let physical = 1;
  let moving = false;
  let isInView = false;
  let isHovered = false;
  let isFocused = false;
  let autoplayId;
  let startX = null;
  let startY = null;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);
  for (const clone of [firstClone, lastClone]) {
    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('aria-label');
    clone.querySelectorAll('img').forEach(img => { img.alt = ''; img.loading = 'lazy'; });
  }
  track.insertBefore(lastClone, track.firstChild);
  track.appendChild(firstClone);
  const allSlides = Array.from(track.children);

  function position(animate = true) {
    const first = allSlides[0];
    const slideWidth = first.getBoundingClientRect().width;
    const viewportWidth = viewport.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const x = (viewportWidth - slideWidth) / 2 - physical * (slideWidth + gap);
    track.style.transition = animate && !reduceMotion.matches
      ? `transform ${duration}ms cubic-bezier(.22,1,.36,1)`
      : 'none';
    track.style.transform = `translate3d(${x}px,0,0)`;
  }

  function updateInfo() {
    const slide = slides[index];
    title.textContent = slide.dataset.title || '';
    category.textContent = slide.dataset.category || '';
    current.textContent = String(index + 1).padStart(2, '0');
    dots.forEach((dot,i) => {
      const active = i === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current',String(active));
    });
    allSlides.forEach((slide,i) => {
      slide.classList.toggle('is-active', i === physical);
    });
  }

  function move(direction) {
    if (moving) return;
    moving = true;
    physical += direction;
    index = (index + direction + slides.length) % slides.length;
    position(true);
    updateInfo();
    if (reduceMotion.matches) normalize();
  }

  function normalize() {
    if (physical === 0) physical = slides.length;
    if (physical === slides.length + 1) physical = 1;
    position(false);
    moving = false;
    updateInfo();
  }

  track.addEventListener('transitionend', event => {
    if (event.target === track && event.propertyName === 'transform') normalize();
  });

  function moveTo(target) {
    if (target === index || moving) return;
    if (reduceMotion.matches) {
      index = target;
      physical = target + 1;
      position(false);
      updateInfo();
      return;
    }
    const forward = (target - index + slides.length) % slides.length;
    const backward = (index - target + slides.length) % slides.length;
    move(forward <= backward ? 1 : -1);
    // Крапки перегортають до вибраного кадру, навіть якщо він далеко.
    queuedTarget = target;
  }

  let queuedTarget = null;
  track.addEventListener('transitionend', event => {
    if (event.target !== track || event.propertyName !== 'transform') return;
    if (queuedTarget !== null && index !== queuedTarget) {
      const target = queuedTarget;
      queuedTarget = null;
      moveTo(target);
    } else { queuedTarget = null; }
  });

  nextButton.addEventListener('click', () => { queuedTarget = null; move(1); restartAutoplay(); });
  prevButton.addEventListener('click', () => { queuedTarget = null; move(-1); restartAutoplay(); });
  dots.forEach(dot => dot.addEventListener('click', () => {
    const selected = Number(dot.dataset.slideTo);
    if (Number.isFinite(selected)) moveTo(selected);
    restartAutoplay();
  }));

  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      queuedTarget = null;
      move(event.key === 'ArrowRight' ? 1 : -1);
      restartAutoplay();
    }
  });
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    startX = event.clientX; startY = event.clientY;
  });
  viewport.addEventListener('pointerup', event => {
    if (startX === null || startY === null) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    startX = null; startY = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      queuedTarget = null;
      move(dx < 0 ? 1 : -1);
      restartAutoplay();
    }
  });
  viewport.addEventListener('pointercancel', () => { startX = null; startY = null; });

  function stopAutoplay() { if (autoplayId) clearInterval(autoplayId); autoplayId = null; }
  function canAutoplay() {
    return !reduceMotion.matches && isInView && !isFocused && !document.hidden;
  }
  function restartAutoplay() {
    stopAutoplay();
    if (canAutoplay()) autoplayId = setInterval(() => {
      if (!moving) { queuedTarget = null; move(1); }
    }, 2000);
  }
  slider.addEventListener('pointerenter', () => { isHovered = true; restartAutoplay(); });
  slider.addEventListener('pointerleave', () => { isHovered = false; restartAutoplay(); });
  slider.addEventListener('focusin', () => { isFocused = true; restartAutoplay(); });
  slider.addEventListener('focusout', () => {
    isFocused = slider.contains(document.activeElement);
    restartAutoplay();
  });
  document.addEventListener('visibilitychange', restartAutoplay);
  reduceMotion.addEventListener?.('change', () => {position(false);restartAutoplay();});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      isInView = entries[0].isIntersecting;
      restartAutoplay();
    }, {threshold:.35});
    observer.observe(slider);
  } else {isInView = true;}

  slider.classList.add('is-enhanced');
  viewport.classList.add('enhanced');
  updateInfo();
  position(false);
  window.addEventListener('resize', () => {position(false);});
  restartAutoplay();
})();
