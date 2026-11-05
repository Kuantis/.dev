(function () {
  'use strict';

  document.getElementById('year').textContent = new Date().getFullYear();
  setupBrief();
  setupCopy();
  setupMenu();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const field = window.KField || { state: {}, ripple() {}, render() {} };
  const st = field.state;
  const hasGsap = window.gsap && window.ScrollTrigger;

  if (!hasGsap) {
    document.documentElement.classList.remove('js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const ease = 'expo.out';
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- Desplazamiento suave ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { duration: 1.5, offset: 0 });
      else target.scrollIntoView();
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Nav: se oculta al bajar y vuelve al subir ---------- */
  const nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      nav.classList.toggle('is-scrolled', self.scroll() > 40);
      if (document.documentElement.classList.contains('menu-open')) return;
      nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 120 && !reduce);
    }
  });

  /* ---------- Bloques que siempre existen ---------- */
  setupCursor();

  if (reduce) {
    setupReducedField();
    return;
  }

  /* ---------- Apertura ---------- */
  const lines = gsap.utils.toArray('.hero h1 .line > span');
  gsap.set(lines, { yPercent: 112 });
  const intro = gsap.timeline({ defaults: { ease } });
  intro
    .to(lines, { yPercent: 0, duration: 1.5, stagger: 0.12 }, 0.15)
    .from('.hero-foot > *', { y: 26, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.75)
    .from('.nav > *', { y: -16, opacity: 0, duration: 1, stagger: 0.05 }, 0.9);
  if (field.ok) {
    gsap.fromTo(st, { dim: 0, scale: 1.25 }, { dim: 1, scale: 1, duration: 2.4, ease: 'power3.out' });
  }

  /* El clic empuja las partículas */
  window.addEventListener('click', (e) => field.ripple(e.clientX, e.clientY), { passive: true });

  /* ---------- El hero se aleja al bajar ---------- */
  gsap.to('.hero h1', {
    yPercent: -18, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true }
  });
  gsap.to('.hero-foot', {
    yPercent: -30, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom 40%', scrub: true }
  });

  /* ---------- Titulares por palabras ---------- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words
      .map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`)
      .join(' ');
    gsap.from(el.querySelectorAll('.w > span'), {
      yPercent: 110, duration: 1.2, ease, stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 82%', once: true }
    });
  });

  /* ---------- Principios: la línea se dibuja ---------- */
  gsap.utils.toArray('.principle').forEach((p, i) => {
    gsap.from(p, {
      '--line': 0, opacity: 0, y: 24, duration: 1.3, ease, delay: i * 0.1,
      scrollTrigger: { trigger: '.principles', start: 'top 78%', once: true }
    });
  });

  /* ---------- Procesos que se encienden al bajar ---------- */
  const fitItems = gsap.utils.toArray('.fit-list li');
  gsap.set(fitItems, { opacity: 0.16 });
  const fitTl = gsap.timeline({
    scrollTrigger: { trigger: '.fit-list', start: 'top 72%', end: 'bottom 45%', scrub: 0.6 }
  });
  fitItems.forEach((li, i) => {
    fitTl.to(li, { opacity: 1, duration: 1, ease: 'none' }, i);
    if (i < fitItems.length - 1) fitTl.to(li, { opacity: 0.42, duration: 1, ease: 'none' }, i + 1.2);
  });

  /* ---------- Partículas: una forma por cada conversación ---------- */
  if (field.ok) {
    const mm = gsap.matchMedia();
    gsap.to(st, {
      dim: window.innerWidth > 860 ? 0.6 : 0.28, noise: 0.075, ease: 'none',
      scrollTrigger: { trigger: '#enfoque', start: 'top 80%', end: 'top 10%', scrub: true }
    });

    mm.add({ wide: '(min-width: 861px)', narrow: '(max-width: 860px)' }, (ctx) => {
      const wide = ctx.conditions.wide;
      const off = wide ? { x: 0.32, y: 0 } : { x: 0, y: 0.42 };
      const scale = wide ? 0.66 : narrowScale();
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.steps', start: 'top 85%', end: 'bottom bottom', scrub: 0.9 }
      });
      tl.to(st, { dim: 1, noise: 0.008, cool: 1, scale, offX: off.x, offY: off.y, duration: 0.55 }, 0);
      tl.to(st, { p: 1, duration: 0.55 }, 0);
      tl.to(st, { p: 2, duration: 0.6 }, 1);
      tl.to(st, { p: 3, duration: 0.6 }, 2);
      tl.to(st, { p: 4, dim: 1.7, duration: 0.6 }, 3);
      tl.to({}, { duration: 0.4 }, 3.6);
      gsap.fromTo(st, { dim: 1.7 }, {
        dim: wide ? 1.15 : 0.34, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 40%', scrub: true }
      });
      // El logo se apaga antes del pie de página para no cruzarse con el nombre.
      gsap.fromTo(st, { dim: wide ? 1.15 : 0.34 }, {
        dim: 0, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '.footer', start: 'top 92%', end: 'bottom bottom', scrub: true }
      });
    });

    // El fondo se tiñe durante el proceso; con el mosaico encima no se dibuja nada.
    gsap.to(st.bg, {
      0: 12 / 255, 1: 14 / 255, 2: 38 / 255, ease: 'none',
      scrollTrigger: { trigger: '.process', start: 'top 70%', end: 'top top', scrub: true }
    });
    ScrollTrigger.create({
      trigger: '.mosaic-wrap', start: 'top top', endTrigger: '.more', end: 'bottom bottom',
      onToggle: (self) => { st.visible = !self.isActive; }
    });
    gsap.to(st.bg, {
      0: 8 / 255, 1: 9 / 255, 2: 15 / 255, ease: 'none',
      scrollTrigger: { trigger: '.more', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });
  }

  gsap.utils.toArray('.step').forEach((step) => {
    ScrollTrigger.create({
      trigger: step, start: 'top 58%', end: 'bottom 42%',
      toggleClass: { targets: step, className: 'is-active' }
    });
  });

  /* ---------- Mosaico: una imagen que se aleja hasta mostrar los proyectos ---------- */
  const grid = document.querySelector('.mosaic-grid');
  const mosTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.mosaic-wrap', start: 'top top', end: 'bottom bottom', scrub: 0.5 }
  });
  mosTl
    .fromTo(grid, { scale: 3.45 }, { scale: 1, duration: 1, ease: 'power2.inOut' }, 0.1)
    .fromTo('.mosaic-title', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.3 }, 0.12)
    .fromTo('.tile > span', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.95)
    .to({}, { duration: 0.2 }, 1.15);

  /* ---------- Historias apiladas ---------- */
  const stories = gsap.utils.toArray('.story');
  gsap.matchMedia().add('(min-width: 961px) and (min-height: 680px)', () => {
    stories.forEach((story, i) => {
      const next = stories[i + 1];
      if (!next) return;
      const card = story.querySelector('.story-card');
      gsap.to(card, {
        scale: 0.93, '--veil': 0.62, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true }
      });
    });
  });

  stories.forEach((story) => {
    const q = gsap.utils.selector(story);
    const tl = gsap.timeline({
      defaults: { ease, duration: 1.2 },
      scrollTrigger: { trigger: story, start: 'top 62%', once: true }
    });
    tl.from(q('.story-pain'), { y: 34, opacity: 0 }, 0)
      .from(q('.story-fix, .story-value, .story-note, .story-link'), { y: 20, opacity: 0, stagger: 0.09 }, 0.18);
    if (q('.ui-row').length) {
      tl.from(q('.ui'), { y: 40, opacity: 0, rotateX: 12, duration: 1.4 }, 0.05)
        .from(q('.ui-row'), { x: 22, opacity: 0, stagger: 0.07, duration: 0.9 }, 0.3);
    } else {
      tl.fromTo(q('.story-shot img'), { scale: 1.16 }, { scale: 1, duration: 1.8 }, 0)
        .from(q('.chip'), { y: 26, opacity: 0, duration: 1 }, 0.6);
    }

    // Lo que flota sigue al cursor con profundidad.
    if (!isTouch) {
      const floats = q('[data-depth]');
      if (floats.length) {
        story.addEventListener('pointermove', (e) => {
          const r = story.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          floats.forEach((f) => {
            const d = +f.dataset.depth;
            gsap.to(f, { x: nx * 22 * d, y: ny * 16 * d, rotateY: nx * 7, rotateX: -ny * 6, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
          });
        });
      }
    }
  });

  gsap.from('.more-title', {
    y: 28, opacity: 0, duration: 1.2, ease,
    scrollTrigger: { trigger: '.more', start: 'top 80%', once: true }
  });
  gsap.from('.more-list li', {
    y: 28, opacity: 0, duration: 1.1, ease, stagger: 0.1,
    scrollTrigger: { trigger: '.more-list', start: 'top 82%', once: true }
  });

  /* ---------- Contacto ---------- */
  gsap.from('.contact-lead, .brief', {
    y: 30, opacity: 0, duration: 1.2, ease, stagger: 0.12,
    scrollTrigger: { trigger: '.contact-lead', start: 'top 86%', once: true }
  });
  gsap.from('.wordmark', {
    y: 40, opacity: 0, duration: 1.4, ease,
    scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true }
  });

  /* ---------- Botones magnéticos ---------- */
  if (!isTouch) {
    document.querySelectorAll('.btn').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, {
          x: (e.clientX - r.left - r.width / 2) * 0.22,
          y: (e.clientY - r.top - r.height / 2) * 0.32,
          duration: 0.5, ease: 'power3.out'
        });
      });
      b.addEventListener('pointerleave', () => {
        gsap.to(b, { x: 0, y: 0, duration: 0.8, ease: 'expo.out' });
      });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- Funciones ---------- */
  function setupCursor() {
    if (isTouch || reduce) return;
    const cur = document.querySelector('.cursor');
    const label = cur.querySelector('span');
    document.documentElement.classList.add('has-cursor');
    const x = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
    const y = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const hit = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, label, textarea');
      cur.classList.toggle('is-label', !!hit);
      cur.classList.toggle('is-link', !hit && !!link);
      label.textContent = hit ? hit.dataset.cursor : '';
    });
  }

  // En pantallas angostas la forma se ajusta al ancho para que no se corte.
  function narrowScale() {
    return Math.min(0.46, (window.innerWidth / window.innerHeight) * 0.8);
  }

  function setupReducedField() {
    if (!field.ok) return;
    st.noise = 0.1;
    st.dim = 0.7;
    gsap.utils.toArray('.step').forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step, start: 'top 60%', end: 'bottom 40%',
        toggleClass: { targets: step, className: 'is-active' },
        onToggle(self) {
          if (!self.isActive) return;
          const wide = window.innerWidth > 860;
          Object.assign(st, { p: i + 1, cool: 1, noise: 0.008, dim: 1, scale: wide ? 0.66 : narrowScale(), offX: wide ? 0.32 : 0, offY: wide ? 0 : 0.42 });
          field.render();
        }
      });
    });
    field.render();
  }

  function closeMenu() {
    const t = document.querySelector('.nav-toggle');
    if (t && t.getAttribute('aria-expanded') === 'true') t.click();
  }

  function setupMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('menu');
    const label = toggle.querySelector('span');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Cerrar' : 'Menú';
      document.documentElement.classList.toggle('menu-open', open);
      menu.hidden = !open;
      if (window.gsap && open && !reduce) {
        gsap.from(menu.children, { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.click();
        toggle.focus();
      }
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a') && !window.gsap && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    });
  }

  function setupBrief() {
    const form = document.getElementById('brief');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const picked = form.querySelector('input[name="proceso"]:checked');
      const detail = form.querySelector('textarea').value.trim();
      const area = picked ? picked.value : '';
      const subject = area ? `Quiero revisar un proceso: ${area}` : 'Quiero revisar un proceso';
      const body = [
        'Hola, Kuantis:',
        '',
        area ? `El proceso que nos está costando es: ${area}.` : 'Hay un proceso que nos está costando más de la cuenta.',
        detail ? `Hoy pasa esto: ${detail}` : '',
      ].filter((l, i) => l || i === 1).join('\n');
      window.location.href = `mailto:kuantis.dev@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  function setupCopy() {
    const btn = document.querySelector('.copy');
    const state = btn.querySelector('.copy-state');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        state.textContent = 'Copiado';
      } catch (err) {
        state.textContent = 'Selecciona y copia';
      }
      setTimeout(() => { state.textContent = 'Copiar'; }, 2400);
    });
  }
})();
