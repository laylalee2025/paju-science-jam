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
  const search = document.getElementById('boothSearch');
  const count = document.getElementById('boothCount');
  const empty = document.getElementById('boothEmpty');

  if (!grid || typeof BOOTHS === 'undefined') return;

  const fieldStyle = {};
  BOOTH_FIELDS.forEach(function (f) { fieldStyle[f.key] = f; });

  let activeField = '전체';
  let keyword = '';

  /* 필터 칩 만들기 */
  ['전체'].concat(BOOTH_FIELDS.map(function (f) { return f.key; })).forEach(function (key) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (key === '전체' ? ' is-on' : '');
    chip.textContent = key;
    chip.dataset.field = key;
    chip.setAttribute('aria-pressed', String(key === '전체'));
    chip.addEventListener('click', function () {
      activeField = key;
      filters.querySelectorAll('.chip').forEach(function (c) {
        const on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      render();
    });
    filters.appendChild(chip);
  });

  search.addEventListener('input', function () {
    keyword = search.value.trim().toLowerCase();
    render();
  });

  function cardHTML(b) {
    const s = fieldStyle[b.field] || {};
    const meta = [];
    if (b.time) meta.push('체험 ' + b.time);
    if (b.age) meta.push(b.age);

    return (
      '<article class="booth" style="--c:' + (s.color || 'var(--ink-2)') + '; --cs:' + (s.soft || 'var(--bg-2)') + '">' +
        '<div class="booth__top">' +
          '<span class="booth__field">' + esc(b.field) + '</span>' +
          (b.code ? '<span class="booth__code">' + esc(b.code) + '</span>' : '') +
        '</div>' +
        '<h3>' + esc(b.title) + '</h3>' +
        '<p class="booth__team">' + esc(b.school) + ' · ' + esc(b.team) + '</p>' +
        (b.desc ? '<p class="booth__desc">' + esc(b.desc) + '</p>' : '') +
        (meta.length ? '<div class="booth__meta"><span>' + meta.map(esc).join('</span><span>') + '</span></div>' : '') +
      '</article>'
    );
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render() {
    const list = BOOTHS.filter(function (b) {
      const okField = activeField === '전체' || b.field === activeField;
      if (!okField) return false;
      if (!keyword) return true;
      const hay = [b.title, b.school, b.team, b.desc, b.code, b.field].join(' ').toLowerCase();
      return hay.indexOf(keyword) > -1;
    });

    grid.innerHTML = list.map(cardHTML).join('');
    empty.hidden = list.length > 0;
    count.textContent = list.length + '개 부스' + (activeField === '전체' ? '' : ' · ' + activeField);
  }

  render();
})();
