const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrowViewport = window.matchMedia('(max-width: 860px)').matches;

// Scroll-reveal: each .reveal element fades + slides up as it enters the
// viewport, same easing/motion as the hero headline. Siblings that share a
// parent (a row of service items, work slots, process steps…) get a small
// staggered delay so they animate in sequence rather than all at once.
const revealTargets = Array.from(document.querySelectorAll('.reveal'));
const STAGGER_MS = 90;
const MAX_STAGGER_MS = 360;

revealTargets.forEach((el) => {
  const siblings = Array.from(el.parentElement.children).filter((c) =>
    c.classList.contains('reveal')
  );
  const index = siblings.indexOf(el);
  const delay = Math.min(index * STAGGER_MS, MAX_STAGGER_MS);
  el.style.transitionDelay = `${delay}ms`;
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}

// Services pin: the list stays pinned in the viewport for an extra stretch
// of scroll, like the reference site's sticky team-name list — only the
// "current" service (by scroll progress through the pinned range) inks in
// black, the rest stay grey. Reversible, not a one-shot reveal.
const servicesPinWrap = document.querySelector('.services__pin-wrap');
const servicesItems = Array.from(document.querySelectorAll('.services__item'));

if (servicesPinWrap && servicesItems.length && !reduceMotion) {
  let servicesTicking = false;

  const updateServicesPin = () => {
    const rect = servicesPinWrap.getBoundingClientRect();
    const total = servicesPinWrap.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
    const progress = total > 0 ? scrolled / total : 0;
    const activeIndex = Math.min(
      servicesItems.length - 1,
      Math.floor(progress * servicesItems.length)
    );

    servicesItems.forEach((el, i) => {
      el.classList.toggle('is-active', i === activeIndex);
    });

    servicesTicking = false;
  };

  const onServicesScroll = () => {
    if (!servicesTicking) {
      requestAnimationFrame(updateServicesPin);
      servicesTicking = true;
    }
  };

  window.addEventListener('scroll', onServicesScroll, { passive: true });
  window.addEventListener('resize', onServicesScroll);
  updateServicesPin();
} else {
  servicesItems.forEach((el) => el.classList.add('is-active'));
}

// Hero → first-work pin/crossfade: the hero stays pinned for one extra
// viewport of scroll while the first Work slot fades in on top of it, so
// the hero visually "becomes" the first project. Driven directly by scroll
// position (not a one-shot trigger) so it tracks the scrollbar exactly.
const pinWrap = document.querySelector('.pin-wrap');
const pinHero = document.querySelector('.pin-hero');
const pinWork01 = document.querySelector('.pin-work01');

if (pinWrap && pinHero && pinWork01 && !reduceMotion && !narrowViewport) {
  let ticking = false;

  const updatePin = () => {
    const rect = pinWrap.getBoundingClientRect();
    const total = pinWrap.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
    const progress = total > 0 ? scrolled / total : 0;

    pinHero.style.opacity = String(1 - progress);
    pinWork01.style.opacity = String(progress);
    pinWork01.style.transform = `translateY(${(1 - progress) * 28}px)`;

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updatePin);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updatePin();
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Live local clock
const clockEl = document.getElementById('clock');
function updateClock() {
  if (!clockEl) return;
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  clockEl.textContent = `Local time — ${time}`;
}
updateClock();
setInterval(updateClock, 1000 * 30);
