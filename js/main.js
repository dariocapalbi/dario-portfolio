const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Custom yellow cursor ball: follows the pointer 1:1 and grows over links,
// mix-blend-mode: difference does the color inversion. Mouse/trackpad only.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursorBall = document.getElementById('cursor-ball');

if (cursorBall && canHover && !reduceMotion) {
  document.documentElement.classList.add('has-custom-cursor');
  const dot = cursorBall.querySelector('.cursor-ball__dot');

  const moveTo = (x, y) => {
    const w = dot.offsetWidth;
    const h = dot.offsetHeight;
    cursorBall.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px)`;
  };

  window.addEventListener(
    'mousemove',
    (e) => {
      cursorBall.classList.add('is-active');
      moveTo(e.clientX, e.clientY);
    },
    { passive: true }
  );

  document.addEventListener('mouseleave', () => {
    cursorBall.classList.remove('is-active');
  });

  document.addEventListener(
    'mouseover',
    (e) => {
      if (e.target.closest('a, button')) {
        cursorBall.classList.add('is-hovering');
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'mouseout',
    (e) => {
      if (e.target.closest('a, button')) {
        cursorBall.classList.remove('is-hovering');
      }
    },
    { passive: true }
  );
}

// Word-by-word "emerge" reveal for headings: split each into individual
// masked words that slide up on scroll-into-view, staggered ~80ms apart —
// same mechanic as .reveal (IntersectionObserver + per-item delay) but at
// word granularity instead of whole-element. <br> and other child elements
// are preserved as-is; only text nodes get split into words.
const emergeTargets = Array.from(document.querySelectorAll('.emerge'));
const EMERGE_STAGGER_MS = 80;

emergeTargets.forEach((el) => {
  const originalNodes = Array.from(el.childNodes);
  el.textContent = '';
  let wordIndex = 0;

  originalNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/\s+/).filter(Boolean);
      words.forEach((word, i) => {
        const mask = document.createElement('span');
        mask.className = 'emerge-word';
        const inner = document.createElement('span');
        inner.textContent = word;
        inner.style.transitionDelay = `${wordIndex * EMERGE_STAGGER_MS}ms`;
        mask.appendChild(inner);
        el.appendChild(mask);
        wordIndex += 1;
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    } else {
      el.appendChild(node);
    }
  });
});

if (emergeTargets.length) {
  if ('IntersectionObserver' in window) {
    const emergeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            emergeObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );
    emergeTargets.forEach((el) => emergeObserver.observe(el));
  } else {
    emergeTargets.forEach((el) => el.classList.add('is-visible'));
  }
}

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
