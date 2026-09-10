(() => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const nav = $('.nav');


  const updateNav = () => {
    if (!nav) return;
    const y = window.scrollY || 0;
    nav.classList.toggle('scrolled', y > 45);

    // 3D zoom-out depth: as the page scrolls, the navbar subtly pulls
    // backward in perspective and scales down, like a physical 3D panel.
    const depth = Math.min(y / 420, 1);
    const scale = 1 - (0.085 * depth);
    const rotateX = 4.5 * depth;
    const rotateY = -1.2 * depth;
    const lift = -3.5 * depth;
    nav.style.setProperty('--nav-scale', scale.toFixed(4));
    nav.style.setProperty('--nav-tilt', `${rotateX.toFixed(2)}deg`);
    nav.style.setProperty('--nav-y-tilt', `${rotateY.toFixed(2)}deg`);
    nav.style.setProperty('--nav-lift', `${lift.toFixed(2)}px`);
    nav.style.setProperty('--nav-shadow', `${(24 * depth).toFixed(1)}px ${(45 * depth).toFixed(1)}px ${(70 * depth).toFixed(1)}px rgba(0,0,0,${(0.10 + 0.16 * depth).toFixed(2)})`);
  };
  window.addEventListener('scroll', updateNav, {passive:true}); updateNav();

  // 3D page-to-page transition: the current page recedes, then the
  // destination page comes forward from depth. Works for every internal HTML page.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    document.documentElement.classList.add('page-transition-ready');
    requestAnimationFrame(() => document.body.classList.add('page-enter'));

    window.setTimeout(() => document.body.classList.remove('page-enter'), 760);

    const isInternalPage = (a) => {
      if (!a || !a.href) return false;
      const url = new URL(a.href, location.href);
      return url.origin === location.origin &&
        !a.hasAttribute('download') &&
        !a.target &&
        url.pathname.endsWith('.html') &&
        url.pathname !== location.pathname;
    };

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!isInternalPage(link)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (document.body.classList.contains('page-leaving')) return;

      const destination = link.href;
      document.body.classList.add('page-leaving');
      document.documentElement.classList.add('page-transitioning');

      // Let the 3D exit complete before the browser swaps documents.
      window.setTimeout(() => { window.location.href = destination; }, 720);
    });
  }

  const menu = $('.menu');
  const mobile = $('.mobile-panel');
  menu?.addEventListener('click', () => {
    const open = mobile?.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(!!open));
  });
  $$('.mobile-panel a').forEach(a => a.addEventListener('click', () => mobile?.classList.remove('open')));

  if (window.Lenis) {
    const lenis = new Lenis({duration:1.05, smoothWheel:true, syncTouch:false});
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal, .section-tag, .section-head h2, .manifesto h2, .feature-panel h2, .process h2, .why h2, .inner-hero h1, .about-intro h2, .timeline h2, .work-intro h2').forEach(el => {
      gsap.fromTo(el, {y:45, opacity:0}, {y:0, opacity:1, duration:.9, ease:'power3.out', scrollTrigger:{trigger:el,start:'top 86%',once:true}});
    });
    gsap.utils.toArray('.cap-card,.product-card,.product-mini,.work-card,.process-item,.why-item,.tile,.step').forEach((el,i) => {
      gsap.fromTo(el,{y:30,opacity:0},{y:0,opacity:1,duration:.65,delay:(i%4)*.05,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
    });
    const heroImg = $('.hero-media img, .inner-hero-media img');
    if (heroImg) gsap.to(heroImg,{yPercent:8,ease:'none',scrollTrigger:{trigger:heroImg.closest('section'),start:'top top',end:'bottom top',scrub:true}});
  }

  // Services dropdown: compact to the exact height of its options, with keyboard support.
  const servicesToggle = $('.services-toggle');
  const servicesWrap = $('.nav-services');
  servicesToggle?.addEventListener('click', e => {
    e.preventDefault();
    const open = servicesWrap.classList.toggle('is-open');
    servicesToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', e => {
    if (servicesWrap && !servicesWrap.contains(e.target)) {
      servicesWrap.classList.remove('is-open');
      servicesToggle?.setAttribute('aria-expanded','false');
    }
  });
  $$('.services-menu a').forEach(a => a.addEventListener('click', () => servicesWrap?.classList.remove('is-open')));

  // Keep the 3D effect for real page-to-page navigation only.
  // Sections remain normal-flow so there are no artificial full-screen blank gaps.

  const cursor = document.createElement('div'); cursor.className='cursor-dot'; document.body.appendChild(cursor);
  window.addEventListener('pointermove', e => { cursor.style.left=e.clientX+'px'; cursor.style.top=e.clientY+'px'; cursor.style.opacity='1'; }, {passive:true});

  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    const target = btn.dataset.target || 'products';
    $$('.filter[data-target="'+target+'"]') .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    const cards = target === 'work' ? $$('.work-card') : $$('.product-card');
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !show);
    });
  }));

  const form = $('#contactForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const status = $('.form-status');
    if (status) { status.textContent='Thank you. Your enquiry has been prepared successfully. JEC can now review your submitted details.'; status.classList.add('show'); }
    form.reset();
  });
})();

// Services side drawer: navigation stays compact; detailed capabilities live on Work.
(() => {
  const drawer = document.getElementById('servicesDrawer');
  if (!drawer) return;
  const toggles = document.querySelectorAll('.services-toggle');
  const close = drawer.querySelector('.services-close');
  const setOpen = (open) => {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    toggles.forEach(t => t.setAttribute('aria-expanded', String(open)));
  };
  toggles.forEach(t => t.addEventListener('click', (e) => { e.preventDefault(); setOpen(!drawer.classList.contains('open')); }));
  close?.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();
