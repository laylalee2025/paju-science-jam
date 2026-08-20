/* ============================================================
   stamp.js — 참가자 스탬프판
   저장 위치: 참가자 휴대폰의 localStorage (서버 없음)
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'jam.stamp.v1';
  var CFG = window.JAM_CONFIG;

  var COLOR = {
    '과학': 'var(--jam)', '수학': 'var(--lid)',
    '생태환경': 'var(--eco)', 'AI·디지털': 'var(--ai)', '플로깅': 'var(--star)'
  };

  /* ---------- 저장/불러오기 ---------- */
  function newId() {
    var s = '';
    for (var i = 0; i < 6; i++) s += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)];
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 저장소를 못 쓰는 환경이면 새로 시작 */ }
    return { id: newId(), name: '', stamps: [], plogging: 0 };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();

  /* ---------- 화면 요소 ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var slots = $('slots'), bar = $('bar'), totalEl = $('total');
  var modal = $('modal'), pw = $('pw'), modalMsg = $('modalMsg');

  $('minTotal').textContent = CFG.minTotal;
  $('nickname').value = state.name || '';
  $('nickname').addEventListener('input', function () {
    state.name = this.value.trim(); save();
  });

  /* ---------- 스탬프판 그리기 ---------- */
  function countOf(field) {
    return state.stamps.filter(function (s) { return s.field === field; }).length;
  }

  /* 플로깅은 부스 스탬프 개수에 포함하지 않습니다 */
  function boothTotal() {
    return state.stamps.filter(function (s) { return s.field !== '플로깅'; }).length;
  }

  function render() {
    var html = '';

    CFG.requirements.forEach(function (r) {
      var got = countOf(r.field);
      html += slotHTML(r.field + '잼 ZONE', r.need + '개 권장', r.need, got, COLOR[r.field]);
    });
    html += slotHTML('플로깅 챌린지', '사진 인증 ' + CFG.plogging.need + '회', CFG.plogging.need, state.plogging, COLOR['플로깅']);
    slots.innerHTML = html;

    var total = boothTotal();
    totalEl.textContent = total;
    bar.style.width = Math.min(100, Math.round(total / CFG.minTotal * 100)) + '%';

    renderLog();
    renderGift();
  }

  function slotHTML(title, sub, need, got, color) {
    var dots = '';
    for (var i = 0; i < need; i++) {
      dots += '<span class="dot' + (i < got ? ' is-on' : '') + '" style="--c:' + color + '">' +
              (i < got ? '✓' : (i + 1)) + '</span>';
    }
    return '<div class="slot' + (got >= need ? ' slot--done' : '') + '">' +
             '<div class="slot__info"><b>' + title + '</b><span>' +
                (got >= need ? '완료' : sub) +
             '</span></div>' +
             '<div class="slot__dots">' + dots + '</div>' +
           '</div>';
  }

  function renderLog() {
    var list = $('logList');
    if (!state.stamps.length && !state.plogging) {
      list.innerHTML = '<li>아직 기록이 없습니다.<span></span></li>';
      return;
    }
    list.innerHTML = state.stamps.map(function (s) {
      return '<li>' + esc(s.name) + '<span>' + s.at + '</span></li>';
    }).join('');
  }

  function isDone() {
    if (boothTotal() < CFG.minTotal) return false;
    if (state.plogging < CFG.plogging.need) return false;
    if (!CFG.requireByField) return true;
    return CFG.requirements.every(function (r) { return countOf(r.field) >= r.need; });
  }

  function renderGift() {
    var card = $('giftCard');
    if (!isDone()) { card.hidden = true; return; }
    card.hidden = false;
    $('giftCode').textContent = state.id + '-' +
      window.jamSha256(CFG.verifySecret + '::' + state.id).slice(0, 4).toUpperCase();
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  /* ---------- 모달 ---------- */
  function openModal() {
    modal.classList.add('is-open');
    modalMsg.hidden = true; pw.value = '';
    setTimeout(function () { pw.focus(); }, 60);
  }
  function closeModal() { modal.classList.remove('is-open'); }

  $('openModal').addEventListener('click', openModal);
  $('closeModal').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
  $('submitPw').addEventListener('click', check);

  function say(text, kind) {
    modalMsg.hidden = false;
    modalMsg.className = 'msg msg--' + kind;
    modalMsg.textContent = text;
  }

  function nowLabel() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* ---------- 비밀번호 확인 ---------- */
  function check() {
    var value = pw.value.trim();
    if (!value) { say('비밀번호를 입력해 주세요.', 'no'); return; }

    var h = window.jamHash(value);

    /* 플로깅 인증 */
    if (h === CFG.plogging.hash) {
      if (state.plogging >= CFG.plogging.need) {
        say('플로깅 인증은 이미 ' + CFG.plogging.need + '회를 모두 채웠습니다.', 'info');
        return;
      }
      state.plogging += 1;
      state.stamps.push({ code: 'PLOG', name: '플로깅 챌린지 ' + state.plogging + '회', field: '플로깅', at: nowLabel() });
      save(); render();
      say('플로깅 인증 ' + state.plogging + '회 완료!', 'ok');
      pw.value = '';
      return;
    }

    /* 부스 인증 */
    var booth = null;
    for (var i = 0; i < CFG.auth.length; i++) {
      if (CFG.auth[i].hash === h) { booth = CFG.auth[i]; break; }
    }
    if (!booth) { say('맞지 않는 비밀번호입니다. 다시 확인해 주세요.', 'no'); return; }

    var already = state.stamps.some(function (s) { return s.code === booth.code; });
    if (already) { say('이 부스의 스탬프는 이미 받았습니다. 다른 부스로 가볼까요?', 'info'); return; }

    state.stamps.push({ code: booth.code, name: booth.code + ' ' + booth.name, field: booth.field, at: nowLabel() });
    save(); render();
    say('스탬프를 찍었습니다! (' + booth.field + ')', 'ok');
    pw.value = '';
  }

  /* ---------- 초기화 ---------- */
  $('resetBtn').addEventListener('click', function () {
    if (!confirm('지금까지 모은 스탬프가 모두 지워집니다. 계속할까요?')) return;
    state = { id: newId(), name: '', stamps: [], plogging: 0 };
    save();
    $('nickname').value = '';
    render();
  });

  render();
})();
