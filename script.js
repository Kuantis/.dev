document.getElementById('year').textContent = new Date().getFullYear();


const track = document.getElementById('carouselTrack');
if (track && projects.length) {
  const buildCard = (project) => {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = project.url;
    card.target = '_blank';
    card.rel = 'noopener';

    const img = document.createElement('img');
    img.src = project.image;
    img.alt = project.name;
    img.loading = 'lazy';

    const label = document.createElement('span');
    label.className = 'project-name';
    label.textContent = project.name;

    card.appendChild(img);
    card.appendChild(label);
    return card;
  };

  // Se duplica la lista para lograr un loop de scroll continuo y sin cortes.
  const renderSet = () => projects.forEach((p) => track.appendChild(buildCard(p)));
  renderSet();
  renderSet();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    track.classList.add('no-spin');
  }
}

const typeTarget = document.querySelector('.type-target');
if (typeTarget) {
  const fullText = typeTarget.dataset.text;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    typeTarget.textContent = fullText;
  } else {
    let i = 0;
    const typeNext = () => {
      typeTarget.textContent = fullText.slice(0, i);
      i++;
      if (i <= fullText.length) {
        setTimeout(typeNext, 28);
      }
    };
    typeNext();
  }
}

const revealTargets = document.querySelectorAll(
  '.principle, .process-step, .work-copy, .work-visual, .projects-title, .carousel, .cta-direct, .cta h2, .cta-lead'
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
