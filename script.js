'use strict';

// ─── Carousel ───────────────────────────────────────────────────────────────

class Carousel {
  constructor(el) {
    this.el       = el;
    this.track    = el.querySelector('.carousel__track');
    this.items    = Array.from(el.querySelectorAll('.carousel__item'));
    this.btnPrev  = el.querySelector('.carousel__btn--prev');
    this.btnNext  = el.querySelector('.carousel__btn--next');
    this.dotsWrap = el.querySelector('.carousel__dots');
    this.current  = 0;
    this.perView  = this._perView();

    this._buildDots();
    this._update();
    this._bind();
  }

  _perView() {
    const isEventi = this.el.id === 'carouselEventi';
    if (window.innerWidth < 640)  return isEventi ? 1 : 2;
    if (window.innerWidth < 1024) return isEventi ? 2 : 3;
    return isEventi ? 2 : 5;
  }

  _buildDots() {
    if (!this.dotsWrap) return;
    const pages = Math.ceil(this.items.length / this.perView);
    this.dotsWrap.innerHTML = '';
    this.dots = Array.from({ length: pages }, (_, i) => {
      const btn = document.createElement('button');
      btn.className = 'carousel__dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('aria-label', `Pagina ${i + 1}`);
      btn.addEventListener('click', () => { this.current = i * this.perView; this._update(); });
      this.dotsWrap.appendChild(btn);
      return btn;
    });
  }

  _update() {
    const maxStart = Math.max(0, this.items.length - this.perView);
    this.current = Math.max(0, Math.min(this.current, maxStart));
    const offset = (this.current / this.items.length) * 100;
    this.track.style.transform = `translateX(-${offset}%)`;
    this.track.style.width = `${(this.items.length / this.perView) * 100}%`;
    this.items.forEach(item => {
      item.style.flexBasis = `${100 / this.items.length}%`;
    });
    this._updateDots();
  }

  _updateDots() {
    if (!this.dots) return;
    const page = Math.floor(this.current / this.perView);
    this.dots.forEach((d, i) => d.classList.toggle('active', i === page));
  }

  _bind() {
    this.btnPrev.addEventListener('click', () => {
      this.current = Math.max(0, this.current - this.perView);
      this._update();
    });
    this.btnNext.addEventListener('click', () => {
      const maxStart = Math.max(0, this.items.length - this.perView);
      if (this.current >= maxStart) {
        this.current = 0;
      } else {
        this.current = Math.min(maxStart, this.current + this.perView);
      }
      this._update();
    });
    window.addEventListener('resize', () => {
      const newPer = this._perView();
      if (newPer !== this.perView) {
        this.perView = newPer;
        this.current = 0;
        this._buildDots();
        this._update();
      }
    });
  }
}

// ─── DOMContentLoaded ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // Carousel
  document.querySelectorAll('.carousel').forEach(el => new Carousel(el));

  // ─── Nav scroll shadow ───────────────────────────────────────────────────
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // ─── Hamburger menu ──────────────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('navOverlay');
  const navClose  = document.getElementById('navClose');

  function openMenu() {
    overlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openMenu);
  navClose.addEventListener('click', closeMenu);
  overlay.querySelectorAll('.nav-overlay__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ─── Nav active section via IntersectionObserver ─────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));

  // ─── Anno footer ─────────────────────────────────────────────────────────
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── Form Formspree async ─────────────────────────────────────────────────
  function setupForm(formId, feedbackId) {
    const form     = document.getElementById(formId);
    const feedback = document.getElementById(feedbackId);
    if (!form || !feedback) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Invio in corso...';
      feedback.className = 'form-feedback';
      feedback.textContent = '';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (res.ok && data.success !== false && data.success !== 'false') {
          feedback.textContent = 'Inviato! Grazie.';
          feedback.classList.add('success');
          form.reset();
        } else {
          throw new Error('server error');
        }
      } catch {
        feedback.textContent = "Errore nell'invio. Riprova o scrivi direttamente via email.";
        feedback.classList.add('error');
      } finally {
        btn.disabled = false;
        btn.textContent = formId === 'formNewsletter' ? 'Iscriviti' : 'Invia messaggio';
      }
    });
  }

  setupForm('formNewsletter', 'feedbackNewsletter');
  setupForm('formContatti', 'feedbackContatti');

});
