document.getElementById('year').textContent = new Date().getFullYear();

const revealTargets = document.querySelectorAll(
  '.principle, .process-step, .work-copy, .work-visual, .cta-form, .cta h2, .cta-lead'
);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

  revealTargets.forEach((el, index) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(index % 4) * 70}ms`;
    revealObserver.observe(el);
  });
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

// Formspree: servicio gratuito de manejo de formularios por API, ideal para
// sitios estáticos en GitHub Pages (sin backend propio).
// Sustituye FORM_ID por tu propio endpoint creado en https://formspree.io
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/FORM_ID';

const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = 'Enviando...';

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form),
    });

    if (response.ok) {
      status.textContent = 'Mensaje enviado. Te respondemos pronto.';
      form.reset();
    } else {
      status.textContent = 'No se pudo enviar. Escríbenos directo a kuantis.dev@gmail.com';
    }
  } catch (error) {
    status.textContent = 'No se pudo enviar. Escríbenos directo a hola@kuantis.dev';
  } finally {
    submitButton.disabled = false;
  }
});
