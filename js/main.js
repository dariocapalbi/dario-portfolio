// Scroll-reveal for sections
const revealTargets = document.querySelectorAll('[data-reveal]');

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
    { threshold: 0.15 }
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
