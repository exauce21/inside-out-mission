/* ==========================================================================
   Inside Out Mission — scripts
   - Menu mobile + sous-menu "Inside Out"
   - Carrousel "Moments from Still Waters"
   - Animations d'apparition au scroll
   ========================================================================== */
(function () {
  'use strict';

  window.IOM = true;
  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. Navigation
     ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var mobileQuery = window.matchMedia('(max-width: 1024px)');

  function closeNav() {
    if (!header) return;
    header.classList.remove('nav-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  }

  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  document.querySelectorAll('.has-sub').forEach(function (item) {
    var btn = item.querySelector('.sub-toggle');
    var link = item.querySelector('.menu-link');

    function setOpen(open) {
      item.classList.toggle('is-open', open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (link) link.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (btn) {
      btn.addEventListener('click', function () {
        setOpen(!item.classList.contains('is-open'));
      });
    }

    // Le lien parent "Inside Out" n'a pas de page propre : il ouvre le sous-menu.
    if (link) {
      link.addEventListener('click', function (e) {
        if (link.getAttribute('href') === '#') {
          e.preventDefault();
          setOpen(!item.classList.contains('is-open'));
        }
      });
    }

    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setOpen(false);
        if (link) link.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!item.contains(e.target) && !mobileQuery.matches) setOpen(false);
    });
  });

  // Fermer le menu mobile après un clic sur une ancre de la même page
  document.querySelectorAll('.menu a[href*="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.getAttribute('href') !== '#') closeNav();
    });
  });

  var onBreakpoint = function (e) {
    if (!e.matches) closeNav();
  };
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', onBreakpoint);
  else if (mobileQuery.addListener) mobileQuery.addListener(onBreakpoint);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header && header.classList.contains('nav-open')) {
      closeNav();
      if (toggle) toggle.focus();
    }
  });

  /* ------------------------------------------------------------------
     2. Carrousel
     ------------------------------------------------------------------ */
  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var viewport = carousel.querySelector('.carousel-viewport');
    var track = carousel.querySelector('.carousel-track');
    var slides = Array.prototype.slice.call(track.children);
    var prev = carousel.querySelector('.carousel-arrow--prev');
    var next = carousel.querySelector('.carousel-arrow--next');
    var dotsWrap = carousel.querySelector('.carousel-dots');
    var total = slides.length;
    var index = parseInt(carousel.getAttribute('data-start') || '0', 10) || 0;
    var delay = parseInt(carousel.getAttribute('data-autoplay') || '5000', 10);
    var timer = null;
    var dots = [];
    var CLONES = 3; // nombre max de slides visibles : clones pour la boucle infinie
    var pos = index; // position réelle dans la piste (0 = première vraie slide)
    var busy = false;

    // Boucle infinie : copies des dernières slides au début et des premières à la fin
    slides.slice(-CLONES).forEach(function (s) {
      var c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.classList.add('is-clone');
      track.insertBefore(c, track.firstChild);
    });
    slides.slice(0, CLONES).forEach(function (s) {
      var c = s.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.classList.add('is-clone');
      track.appendChild(c);
    });
    track.querySelectorAll('.is-clone img').forEach(function (img) { img.alt = ''; });

    function perView() {
      var w = window.innerWidth;
      if (w <= 767) return 1;
      if (w <= 1024) return 2;
      return 3;
    }

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      return slides[0].getBoundingClientRect().width + gap;
    }

    function render(animate) {
      track.style.transition = animate === false ? 'none' : '';
      track.style.transform = 'translate3d(' + (-(pos + CLONES) * step()) + 'px,0,0)';
      index = ((pos % total) + total) % total;
      slides.forEach(function (s, i) {
        var rel = ((i - index) % total + total) % total;
        s.setAttribute('aria-hidden', rel < perView() ? 'false' : 'true');
      });
      dots.forEach(function (d, i) {
        d.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function snap() {
      // après une transition sur un clone, on revient sans animation sur la vraie slide
      if (pos >= total || pos < 0) {
        pos = ((pos % total) + total) % total;
        render(false);
        void track.offsetWidth; // force reflow
      }
      busy = false;
    }

    track.addEventListener('transitionend', function (e) {
      if (e.target === track) snap();
    });

    function go(target) {
      if (busy) snap();
      if (target === pos) return;
      pos = target;
      busy = true;
      render();
      if (reduceMotion) snap();
    }

    function goRelative(delta) {
      if (busy) snap();
      go(pos + delta);
    }

    for (var d = 0; d < total; d++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Go to slide ' + (d + 1));
      (function (n) { dot.addEventListener('click', function () { go(n); restart(); }); })(d);
      dotsWrap.appendChild(dot);
      dots.push(dot);
    }

    if (prev) prev.addEventListener('click', function () { goRelative(-1); restart(); });
    if (next) next.addEventListener('click', function () { goRelative(1); restart(); });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goRelative(-1); restart(); }
      if (e.key === 'ArrowRight') { goRelative(1); restart(); }
    });

    // Glisser / swipe
    var startX = null, deltaX = 0;
    viewport.addEventListener('pointerdown', function (e) {
      startX = e.clientX; deltaX = 0;
      stop();
    });
    window.addEventListener('pointermove', function (e) {
      if (startX === null) return;
      deltaX = e.clientX - startX;
    });
    window.addEventListener('pointerup', function () {
      if (startX === null) return;
      if (Math.abs(deltaX) > 40) goRelative(deltaX < 0 ? 1 : -1);
      startX = null;
      restart();
    });

    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() {
      stop();
      if (!reduceMotion && delay > 0) timer = setInterval(function () { goRelative(1); }, delay);
    }

    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', restart);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', restart);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else restart();
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { render(false); }, 120);
    });

    render(false);
    restart();
  });

  /* ------------------------------------------------------------------
     3. Animations d'apparition
     ------------------------------------------------------------------ */
  var revealItems = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealItems.forEach(function (el) { io.observe(el); });
  }
})();
