const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Custom yellow cursor ball: follows the pointer 1:1 and grows over links.
// It sits above everything and blends instead of covering (see styles.css).
// Mouse/trackpad only.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursorBall = document.getElementById('cursor-ball');

if (cursorBall && canHover && !reduceMotion) {
  document.documentElement.classList.add('has-custom-cursor');
  const dot = cursorBall.querySelector('.cursor-ball__dot');

  // Which blend keeps the ball yellow depends on what is under it, so we
  // read the ground: the first ancestor of the element under the pointer
  // that actually paints a background wins. Sections with artwork paint it
  // as a background-image over the page's own paper, so those count as
  // light ground, which is what their frame is.
  const isDarkGround = (x, y) => {
    let el = document.elementFromPoint(x, y);
    while (el && el !== document.documentElement) {
      const parts = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (parts && (parts.length < 4 || parseFloat(parts[3]) > 0.5)) {
        const [r, g, b] = parts.map(Number);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
      }
      el = el.parentElement;
    }
    return false;
  };

  const moveTo = (x, y) => {
    const w = dot.offsetWidth;
    const h = dot.offsetHeight;
    cursorBall.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px)`;
    cursorBall.classList.toggle('is-on-dark', isDarkGround(x, y));
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
      // Everything clickable grows the ball, whole-card Work links included.
      // They used to be the one exception: the slot is the size of the screen
      // and sticky, so it makes its own stacking context, and a 64px opaque
      // disc parked on the title could not be lifted back over by any
      // z-index. In multiply the disc can only darken what is under it, so
      // the title shows through and the exception is no longer needed.
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

  const servicesStage = document.querySelector('.services__pin-stage');

  const updateServicesPin = () => {
    const rect = servicesPinWrap.getBoundingClientRect();
    // The range to spread the fill over is how long the stage actually stays
    // pinned, not the wrapper minus a viewport. Those were the same when the
    // stage was a full 100vh; now that it is the height of its own list they
    // are not, and the fill was finishing long before the pin let go.
    const stageTop = servicesStage ? parseFloat(getComputedStyle(servicesStage).top) || 0 : 0;
    const stageH = servicesStage ? servicesStage.offsetHeight : window.innerHeight;
    const total = servicesPinWrap.offsetHeight - stageH - stageTop;
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

/* Il titolo dell'eroe deve riempire il pannello, ma quante righe occupa
   dipende dalla larghezza: a 1280 ne fa otto e lo riempie, a 1512 ne fa sei
   e resta mezzo pannello vuoto sopra. Nessun `clamp` puo saperlo -non sa
   quante righe verranno- quindi la misura si cerca: si prova una taglia, si
   guarda quanto e alto il titolo, si stringe. Dodici tentativi bastano a
   trovarla al decimo di pixel.
   L'altezza cresce sempre insieme al corpo -piu grande, al massimo piu
   righe- quindi la ricerca per bisezione e lecita. */
const panelloEroe = document.querySelector('.hero__panel--dark');
const titoloEroe = document.querySelector('.hero__headline');
const scorriEroe = document.querySelector('.hero__scroll');

function spazioPerIlTitolo(){
  const cs = getComputedStyle(panelloEroe);
  let h = panelloEroe.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (scorriEroe && getComputedStyle(scorriEroe).position !== 'absolute') {
    const s = getComputedStyle(scorriEroe);
    h -= scorriEroe.offsetHeight + parseFloat(s.marginTop) + parseFloat(s.marginBottom);
  }
  h -= parseFloat(getComputedStyle(titoloEroe).marginTop);
  return h;
}

function adattaTitoloEroe(){
  if (!panelloEroe || !titoloEroe) return;
  titoloEroe.style.fontSize = '';
  const spazio = spazioPerIlTitolo();
  // su schermi bassi o stretti lascia fare al clamp del foglio di stile
  if (spazio < 240 || window.innerWidth < 720) return;
  let basso = 24, alto = 168;
  if (titoloEroe.offsetHeight > spazio) alto = parseFloat(getComputedStyle(titoloEroe).fontSize);
  for (let i = 0; i < 12; i++) {
    const mezzo = (basso + alto) / 2;
    titoloEroe.style.fontSize = mezzo + 'px';
    if (titoloEroe.offsetHeight <= spazio) basso = mezzo; else alto = mezzo;
  }
  titoloEroe.style.fontSize = Math.floor(basso) + 'px';
}

adattaTitoloEroe();
// il serif arriva dopo il primo disegno e cambia dove vanno a capo le righe
if (document.fonts && document.fonts.ready) document.fonts.ready.then(adattaTitoloEroe);
let attesaTitolo;
window.addEventListener('resize', () => {
  clearTimeout(attesaTitolo);
  attesaTitolo = setTimeout(adattaTitoloEroe, 120);
});

// The hero only stays pinned while it fits on screen. Taller than the
// viewport — any phone once the panels stack, or a laptop short enough that
// the headline overflows — a sticky box pins immediately and everything
// below the fold, the wordmark included, can never be scrolled to.
const hero = document.querySelector('.hero');
if (hero) {
  const syncHeroPin = () => {
    hero.classList.toggle('hero--unpinned', hero.offsetHeight > window.innerHeight + 1);
  };
  syncHeroPin();
  window.addEventListener('resize', () => setTimeout(syncHeroPin, 160));
  // Webfonts landing reflow the headline, which is what decides the height.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeroPin);
}

// "Back to top". L'ancora a #top funziona sul desktop ma su iOS no: la
// pagina e lunghissima, ha elementi sticky a ogni sezione e lo scorrimento
// morbido sta nel CSS, e Safari mobile lascia il salto a meta o non parte
// proprio. Qui lo scorrimento lo chiediamo noi, che e deterministico.
// L'href resta al suo posto: senza JS il link funziona lo stesso.
const backToTop = document.querySelector('.footer__top');
if (backToTop) {
  backToTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
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
