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
