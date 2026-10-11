const intro = document.getElementById("intro");

window.addEventListener("load", () => {
  setTimeout(() => intro.classList.add("hide"), 1100);
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.animationDelay = `${(i % 4) * 80}ms`;
  observer.observe(el);
});


/* animations.js — load AFTER gsap, ScrollTrigger, Lenis and js/main.js */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const intro = $('#intro');

  // Reduced motion: skip everything, just drop the intro overlay
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { intro && intro.remove(); return; }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-on');

  /* accent colour: borrowed from your existing theme (availability dot / .lime) */
  const accent = [$('.avail i'), $('.lime')].map(el => el && getComputedStyle(el))
    .flatMap(cs => cs ? [cs.backgroundColor, cs.color] : [])
    .find(c => c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c));
  if (accent) document.documentElement.style.setProperty('--accent', accent);

  /* 1. SMOOTH SCROLL (Lenis synced with ScrollTrigger) */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // locked until the intro finishes

    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 && $(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4, force: true, easing: t => 1 - Math.pow(1 - t, 4) });
      }
    }));

  }

  /* 2. INTRO + HERO TIMELINE */
  const titles = $$('.hero h1 .title-shine');
  titles.forEach(el => {
    const m = document.createElement('span'); m.className = 'mask';
    el.before(m); m.appendChild(el);
  });
  const heroBits = ['.hero__lead', '.hero__actions', '.avail'];
  gsap.set(titles, { yPercent: 120 });
  gsap.set(heroBits, { opacity: 0, y: 30 });

  const stats = $$('.stats article');
  gsap.set(stats, { opacity: 0, y: 40 });
  const statsIn = () => {
    const t = gsap.timeline();
    t.to(stats, { y: 0, opacity: 1, duration: .9, stagger: .12, ease: 'power3.out' });
    stats.forEach(art => {                       // count-up: "6+", "14+", "10K+"
      const h = $('h2', art), m = h && h.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      const o = { v: 0 }; h.textContent = '0' + m[2];
      t.to(o, { v: +m[1], duration: 2, ease: 'power2.out', snap: { v: 1 },
        onUpdate: () => (h.textContent = o.v + m[2]) }, 0);
    });
    return t;
  };

  const tl = gsap.timeline({ onComplete: () => lenis && lenis.start() });
  if (intro) {
    tl.fromTo('.intro__mark', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out' })
      .to(intro, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=.35')
      .set(intro, { display: 'none' });
  }
  tl.addLabel('hero', '-=0.45')
    .to(titles, { yPercent: 0, duration: 1.3, stagger: .12, ease: 'expo.out' }, 'hero')
    .to(heroBits, { opacity: 1, y: 0, duration: 1, stagger: .12, ease: 'power3.out' }, 'hero+=.35');

  if (stats[0] && stats[0].getBoundingClientRect().top < innerHeight * .95) tl.add(statsIn(), 'hero+=.7');
  else ScrollTrigger.create({ trigger: '.stats', start: 'top 90%', once: true, onEnter: statsIn });

  // hero parallax (desktop only)
  gsap.matchMedia().add('(min-width: 769px)', () => {
    gsap.to('.hero__copy', { yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  // /* 3. QUOTE: words light up as you scroll (scrubbed) */
  // //  

  /* 4. GENERIC FADE-UP for everything tagged .reveal + section titles */
  const special = '.stack__row, .project, .about__media, .quote';
  $$('.reveal').filter(el => !el.matches(special))
    .concat($$('.section-title, .stack > .eyebrow, .experience > .eyebrow, .projects > .eyebrow'))
    .forEach(el => gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));

  /* 5. ABOUT image: clip-path reveal + inner zoom-out */
  const media = $('.about__media');
  if (media) {
    gsap.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4,
      ease: 'expo.inOut', scrollTrigger: { trigger: media, start: 'top 80%', once: true } });
    const inner = $('.placeholder, .about__polygon-wrap, img', media);
    inner && gsap.fromTo(inner, { scale: 1.3 }, { scale: 1, ease: 'none',
      scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* 6. STACK rows: heading slides in, tags pop in with a stagger */
  $$('.stack__row').forEach(row => {
    const items = $$('li', row);
    gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 85%', once: true } })
      .fromTo($('h3', row), { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: .8, ease: 'power3.out' })
      .fromTo(items, { y: 30, opacity: 0, scale: .85 },
        { y: 0, opacity: 1, scale: 1, duration: .7, stagger: .05, ease: 'back.out(1.7)',
          onComplete: () => gsap.set(items, { clearProps: 'all' }) }, '-=.5');
  });

  /* 7. PROJECT cards: frame wipes open, text follows, image parallax + hover zoom */
  $$('.project').forEach(p => {
    const frame = $('.project__frame', p), img = $('.project__image', p), text = $$('h3, p', p);
    gsap.set(text, { y: 30, opacity: 0 });
    gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 85%', once: true } })
      .fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut' })
      .to(text, { y: 0, opacity: 1, duration: .8, stagger: .1, ease: 'power3.out' }, '-=.6');
    if (img) {
      gsap.set(img, { scale: 1.2 });
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      p.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.3, duration: .8, ease: 'power3.out', overwrite: 'auto' }));
      p.addEventListener('mouseleave', () => gsap.to(img, { scale: 1.2, duration: .8, ease: 'power3.out', overwrite: 'auto' }));
    }
  });

  /* 8. END SECTION */
  const mail = $('#endMail');
  if (mail) {
    const text = mail.textContent; mail.textContent = '';
    [...text].forEach(c => {
      const ch = document.createElement('span'); ch.className = 'ch'; ch.setAttribute('aria-hidden', 'true');
      const i = document.createElement('i'); i.textContent = c; ch.appendChild(i); mail.appendChild(ch);
    });
    gsap.fromTo($$('.ch i', mail), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .03, ease: 'expo.out',
      scrollTrigger: { trigger: mail, start: 'top 90%', once: true } });
    gsap.fromTo('.end__ask, .end__credit, .end__gh', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .45, ease: 'power3.out',
      scrollTrigger: { trigger: '.end', start: 'top 60%', once: true } });
  }

  // top row: title slides up out of a mask, number and tags fade in
  if ($('.end__row')) {
    const rowTl = gsap.timeline({ scrollTrigger: { trigger: '.end__row', start: 'top 85%', once: true } });
    rowTl.fromTo('.end__title', { yPercent: 115 }, { yPercent: 0, duration: 1.2, ease: 'expo.out' })
         .fromTo('.end__num, .end__tags', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .1, ease: 'power3.out' }, '-=.8');
  }

  

  /* 9. SCROLL PROGRESS THUMB */
  const thumb = document.createElement('div'); thumb.className = 'progress'; thumb.setAttribute('aria-hidden', 'true');
  document.body.appendChild(thumb);
  const moveThumb = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    thumb.style.transform = `translateY(${(max > 0 ? scrollY / max : 1) * (innerHeight - thumb.offsetHeight)}px)`;
  };
  addEventListener('scroll', moveThumb, { passive: true }); addEventListener('resize', moveThumb); moveThumb();

  addEventListener('load', () => ScrollTrigger.refresh());


  /* 9b. NAVBAR: solid after a little scroll, hides going down, shows going up, highlights current section */
  const nav = $('.nav');
  if (nav) {
    let hidden = false;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
      nav.classList.toggle('is-solid', self.scroll() > 40);
      const hide = self.direction === 1 && self.scroll() > 240;
      if (hide !== hidden) { hidden = hide; gsap.to(nav, { yPercent: hide ? -100 : 0, duration: .45, ease: 'power3.out', overwrite: 'auto' }); }
    } });
    $$('.nav__links a', nav).forEach(a => {
      const target = $(a.getAttribute('href'));
      if (target) ScrollTrigger.create({ trigger: target, start: 'top 55%', end: 'bottom 55%',
        toggleClass: { targets: a, className: 'is-active' } });
    });
  }
 
 /* 9a. TESTIMONIALS: infinite marquee that speeds up with scroll, pauses on hover */
  const track = $('.t-track');
  if (track) {
    gsap.fromTo('.t-wrap', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.t-wrap', start: 'top 88%', once: true } });
    const count = track.children.length;
    track.insertAdjacentHTML('beforeend', track.innerHTML);                 // duplicate for a seamless loop
    [...track.children].slice(count).forEach(c => c.setAttribute('aria-hidden', 'true'));
    const loop = gsap.to(track, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
    ScrollTrigger.create({ trigger: '.testimonials', start: 'top bottom', end: 'bottom top', onUpdate: self => {
      const boost = Math.min(Math.abs(self.getVelocity()) / 250, 6);
      gsap.to(loop, { timeScale: 1 + boost, duration: .25, overwrite: 'auto',
        onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1, overwrite: 'auto' }) });
    } });
    const wrap = $('.t-wrap');
    wrap.addEventListener('mouseenter', () => gsap.to(loop, { timeScale: 0, duration: .5, overwrite: 'auto' }));
    wrap.addEventListener('mouseleave', () => gsap.to(loop, { timeScale: 1, duration: .5, overwrite: 'auto' }));
  } 
})();