/* ============================================================
   main.js — 내비게이션 / 스크롤 효과 / 부스 검색·필터
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. 모바일 메뉴 ---------- */
  const nav = document.getElementById('nav');
  const menu = document.getElementById('navMenu');
  const toggle = document.getElementById('navToggle');

  toggle.addEventListener('click', function () {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- 2. 스크롤에 따른 헤더 그림자 ---------- */
  const onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2-1. 첫 화면 별 흩날리기 (약 10초) ---------- */
  const starLayer = document.getElementById('heroStars');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (starLayer && !reduceMotion) {
    const STAR_COLORS = ['#E0483F', '#5B8FE0', '#E39A1F', '#F2B63D'];
    const STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 1.8l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17l-6.1 3.4 1.4-6.8-5.1-4.7 6.9-.8Z"/></svg>';
    const SPAWN_MS = 6500;   /* 이 시간 동안 새 별을 만들고, 마지막 별은 약 10초 무렵 사라집니다 */
    const rand = function (min, max) { return min + Math.random() * (max - min); };

    const dropStar = function () {
      const star = document.createElement('span');
      star.className = 'hero__star';
      star.innerHTML = STAR_SVG;
      star.style.setProperty('--x', rand(-2, 100) + '%');
      star.style.setProperty('--size', rand(14, 30) + 'px');
      star.style.setProperty('--c', STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]);
      star.style.setProperty('--alpha', rand(.75, 1).toFixed(2));
      star.style.setProperty('--dur', rand(3, 4.2).toFixed(2) + 's');
      star.style.setProperty('--delay', rand(0, .3).toFixed(2) + 's');
      star.style.setProperty('--drift', rand(-90, 90) + 'px');
      star.style.setProperty('--spin', rand(-360, 360) + 'deg');
      star.addEventListener('animationend', function () { star.remove(); });
      starLayer.appendChild(star);
    };

    let running = false;
    const startStars = function () {
      if (running) return;
      running = true;
      starLayer.style.setProperty('--fall', starLayer.offsetHeight + 64 + 'px');
      for (let i = 0; i < 8; i++) dropStar();
      const timer = setInterval(dropStar, 150);
      setTimeout(function () { clearInterval(timer); running = false; }, SPAWN_MS);
    };

    /* 탭이 보이고 첫 화면이 화면에 들어왔을 때 시작합니다.
       (백그라운드 탭으로 열었거나, 아래쪽에서 새로고침해도 놓치지 않도록) */
    const startWhenSeen = function () {
      if (document.visibilityState !== 'visible') {
        document.addEventListener('visibilitychange', startWhenSeen, { once: true });
        return;
      }
      const io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        startStars();
      });
      io.observe(starLayer);
    };

    startWhenSeen();
    /* 뒤로 가기로 돌아온 경우(페이지가 그대로 복원됨)에도 다시 보여 줍니다. */
    window.addEventListener('pageshow', function (e) { if (e.persisted) startWhenSeen(); });
  }

  /* ---------- 3. 등장 애니메이션 ---------- */
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealItems.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      io.observe(el);
    });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 4. 현재 보고 있는 섹션 메뉴 강조 ---------- */
  const links = Array.prototype.slice.call(menu.querySelectorAll('a'));
  const sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 5. 부스 목록 ---------- */
  const grid = document.getElementById('boothGrid');
  const filters = document.getElementById('boothFilters');
  const ageFilters = document.getElementById('boothAgeFilters');
  const colorFilters = document.getElementById('boothColorFilters');
  const search = document.getElementById('boothSearch');
  const count = document.getElementById('boothCount');
  const empty = document.getElementById('boothEmpty');

  if (!grid || typeof BOOTHS === 'undefined') return;

  /* 부스별 설명서: assets/pdf/booths/booth-01.pdf ~ booth-71.pdf */
  const boothPdf = function (no) { return 'assets/pdf/booths/booth-' + String(no).padStart(2, '0') + '.pdf'; };

  /* 부스 번호 → 색 묶음, 운영 분야 → 필터 분야 */
  BOOTHS.forEach(function (b) {
    b.group = BOOTH_COLORS.filter(function (g) { return b.no >= g.from && b.no <= g.to; })[0] || {};
    b.category = (BOOTH_FIELDS.filter(function (f) { return f.subjects.indexOf(b.field) > -1; })[0] || {}).key;
  });

  let activeField = '전체';
  let activeAge = '전체';
  let activeGroup = '전체';
  let keyword = '';

  /* 필터 칩 만들기 */
  function chipRow(container, items, onPick) {
    items.forEach(function (item, i) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (item.color ? ' chip--color' : '') + (i === 0 ? ' is-on' : '');
      chip.textContent = item.label;
      if (item.color) chip.style.setProperty('--c', item.color);
      chip.setAttribute('aria-pressed', String(i === 0));
      chip.addEventListener('click', function () {
        container.querySelectorAll('.chip').forEach(function (c) {
          const on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', String(on));
        });
        onPick(item.key);
        render();
      });
      container.appendChild(chip);
    });
  }

  chipRow(filters, [{ key: '전체', label: '전체 분야' }].concat(BOOTH_FIELDS.map(function (f) {
    return { key: f.key, label: f.key };
  })), function (key) { activeField = key; });

  chipRow(ageFilters, [{ key: '전체', label: '모든 대상' }].concat(BOOTH_AGES), function (key) {
    activeAge = key;
  });

  chipRow(colorFilters, [{ key: '전체', label: '전체 번호' }].concat(BOOTH_COLORS.map(function (g) {
    return { key: g, label: g.from + '~' + g.to + '번', color: g.color };
  })), function (key) { activeGroup = key; });

  search.addEventListener('input', function () {
    keyword = search.value.trim().toLowerCase();
    render();
  });

  function ageText(age) {
    if (age.length === BOOTH_AGES.length) return '전 연령';
    return age.join('·');
  }

  function cardHTML(b) {
    const meta = [];
    if (b.time) meta.push(b.time);
    if (b.age.length) meta.push('대상 ' + ageText(b.age));

    return (
      '<article class="booth" style="--c:' + b.group.color + '; --cs:' + b.group.soft + '">' +
        '<div class="booth__top">' +
          '<span class="booth__no" aria-label="' + b.no + '번 부스">' + b.no + '</span>' +
          '<span class="booth__field">' + esc(b.field) + '</span>' +
        '</div>' +
        '<h3>' + esc(b.title) + '</h3>' +
        '<p class="booth__team">' + esc(b.school) + ' · ' + esc(b.team) + '</p>' +
        (b.desc ? '<p class="booth__desc">' + esc(b.desc) + '</p>' : '') +
        (meta.length ? '<div class="booth__meta"><span>' + meta.map(esc).join('</span><span>') + '</span></div>' : '') +
        '<a class="booth__more" href="' + boothPdf(b.no) + '" target="_blank" rel="noopener">부스 설명서 보기</a>' +
      '</article>'
    );
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render() {
    const list = BOOTHS.filter(function (b) {
      if (activeField !== '전체' && b.category !== activeField) return false;
      if (activeAge !== '전체' && b.age.indexOf(activeAge) < 0) return false;
      if (activeGroup !== '전체' && b.group !== activeGroup) return false;
      if (!keyword) return true;
      const hay = [b.no, b.no + '번', b.title, b.school, b.team, b.desc, b.field].join(' ').toLowerCase();
      return hay.indexOf(keyword) > -1;
    });

    grid.innerHTML = list.map(cardHTML).join('');
    empty.hidden = list.length > 0;
    const tags = [];
    if (activeField !== '전체') tags.push(activeField);
    if (activeAge !== '전체') tags.push(BOOTH_AGES.filter(function (a) { return a.key === activeAge; })[0].label);
    if (activeGroup !== '전체') tags.push(activeGroup.from + '~' + activeGroup.to + '번');
    count.textContent = list.length + '개 부스' + (tags.length ? ' · ' + tags.join(' · ') : '');
  }

  render();
})();
