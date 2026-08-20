/* ============================================================
   admin.js — 운영 관리 페이지
   · 부스 비밀번호 목록 관리 (이 기기 localStorage)
   · 기념품 인증번호 확인 / 수령 기록
   · data/config.js 파일 만들기
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.JAM_CONFIG;
  var K_BOOTH = 'jam.admin.booths';
  var K_CLAIM = 'jam.admin.claims';
  var K_SET   = 'jam.admin.settings';
  var FIELDS  = ['과학', '수학', '생태환경', 'AI·디지털'];

  var $ = function (id) { return document.getElementById(id); };

  function get(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  /* ---------- 로그인 ---------- */
  var loginBtn = $('loginBtn'), adminPw = $('adminPw'), lockMsg = $('lockMsg');

  function unlock() {
    $('lockView').hidden = true;
    $('adminView').hidden = false;
    $('logoutBtn').hidden = false;
    try { sessionStorage.setItem('jam.admin.session', '1'); } catch (e) {}
    renderBooths(); renderClaims(); renderSettings();
  }

  loginBtn.addEventListener('click', function () {
    var value = adminPw.value.trim();
    if (window.jamHash(value) === CFG.adminHash) { unlock(); return; }
    lockMsg.hidden = false;
    lockMsg.textContent = '비밀번호가 맞지 않습니다.';
    adminPw.select();
  });
  adminPw.addEventListener('keydown', function (e) { if (e.key === 'Enter') loginBtn.click(); });

  $('logoutBtn').addEventListener('click', function () {
    try { sessionStorage.removeItem('jam.admin.session'); } catch (e) {}
    location.reload();
  });

  try {
    if (sessionStorage.getItem('jam.admin.session') === '1') unlock();
  } catch (e) {}

  /* ---------- 탭 ---------- */
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('is-on', t === tab); });
      document.querySelectorAll('.panel').forEach(function (p) { p.hidden = p.id !== tab.dataset.panel; });
    });
  });

  /* ---------- 부스 비밀번호 ---------- */
  var booths = get(K_BOOTH, null);
  if (!booths) {
    /* 처음 열었을 때: config.js에 있는 부스를 그대로 보여줍니다(비밀번호는 알 수 없으므로 비움) */
    booths = CFG.auth.map(function (b) { return { code: b.code, name: b.name, field: b.field, pw: '' }; });
  }

  function saveBooths() { set(K_BOOTH, booths); renderBooths(); }

  function renderBooths() {
    var body = $('boothBody');
    if (!booths.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty-row">부스가 없습니다. [부스 목록에서 불러오기]를 눌러보세요.</td></tr>';
    } else {
      body.innerHTML = booths.map(function (b, i) {
        return '<tr>' +
          '<td><input class="input input--sm" data-i="' + i + '" data-k="code" value="' + esc(b.code) + '" style="width:84px"></td>' +
          '<td><input class="input input--sm" data-i="' + i + '" data-k="name" value="' + esc(b.name) + '" style="width:100%;min-width:200px"></td>' +
          '<td>' + fieldSelect(i, b.field) + '</td>' +
          '<td><input class="input input--sm" data-i="' + i + '" data-k="pw" value="' + esc(b.pw) + '" placeholder="비밀번호" style="width:140px"></td>' +
          '<td class="col-del"><button class="icon-btn" data-del="' + i + '" title="삭제">✕</button></td>' +
        '</tr>';
      }).join('');
    }

    $('statBooth').textContent = booths.length;
    var used = {};
    booths.forEach(function (b) { if (b.field) used[b.field] = 1; });
    $('statField').textContent = Object.keys(used).length;

    var seen = {}, dup = 0;
    booths.forEach(function (b) {
      var p = (b.pw || '').trim();
      if (!p) return;
      if (seen[p]) dup++; else seen[p] = 1;
    });
    $('statDup').textContent = dup;
    var msg = $('boothMsg');
    if (dup > 0) {
      msg.hidden = false; msg.className = 'msg msg--no';
      msg.textContent = '같은 비밀번호를 쓰는 부스가 ' + dup + '곳 있습니다. 먼저 찾은 부스로만 스탬프가 찍히니 서로 다르게 바꿔주세요.';
    } else {
      msg.hidden = true;
    }
  }

  function fieldSelect(i, value) {
    return '<select class="input input--sm" data-i="' + i + '" data-k="field" style="width:120px">' +
      FIELDS.map(function (f) {
        return '<option value="' + f + '"' + (f === value ? ' selected' : '') + '>' + f + '</option>';
      }).join('') + '</select>';
  }

  $('boothBody').addEventListener('input', function (e) {
    var el = e.target;
    if (el.dataset.i === undefined) return;
    booths[el.dataset.i][el.dataset.k] = el.value;
    set(K_BOOTH, booths);
  });

  $('boothBody').addEventListener('click', function (e) {
    var i = e.target.dataset.del;
    if (i === undefined) return;
    if (!confirm('이 부스를 목록에서 지울까요?')) return;
    booths.splice(i, 1); saveBooths();
  });

  $('addBtn').addEventListener('click', function () {
    booths.push({ code: '', name: '', field: FIELDS[0], pw: '' });
    saveBooths();
  });

  /* data/booths.js 의 부스 목록을 그대로 불러오고 비밀번호를 자동 생성 */
  $('importBtn').addEventListener('click', function () {
    if (typeof BOOTHS === 'undefined') { alert('data/booths.js 를 찾지 못했습니다.'); return; }
    if (!confirm('부스 목록 ' + BOOTHS.length + '개를 불러오고, 비어 있는 비밀번호를 자동으로 채웁니다. 계속할까요?')) return;

    var byCode = {};
    booths.forEach(function (b) { byCode[b.code] = b; });

    BOOTHS.forEach(function (b) {
      var pw = 'jam-' + String(b.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (byCode[b.code]) {
        byCode[b.code].name = b.title;
        byCode[b.code].field = b.field;
        if (!byCode[b.code].pw) byCode[b.code].pw = pw;
      } else {
        booths.push({ code: b.code, name: b.title, field: b.field, pw: pw });
      }
    });
    saveBooths();
  });

  $('printBtn').addEventListener('click', function () { window.print(); });

  $('csvBtn').addEventListener('click', function () {
    var rows = [['코드', '부스명', '분야', '비밀번호']].concat(
      booths.map(function (b) { return [b.code, b.name, b.field, b.pw]; })
    );
    downloadCSV(rows, '과학잼_부스비밀번호.csv');
  });

  /* ---------- 기념품 확인 ---------- */
  var claims = get(K_CLAIM, []);

  function expected(id) {
    return window.jamSha256(CFG.verifySecret + '::' + id).slice(0, 4).toUpperCase();
  }

  $('giftCheck').addEventListener('click', checkGift);
  $('giftInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkGift(); });

  function checkGift() {
    var raw = $('giftInput').value.trim().toUpperCase();
    var box = $('giftResult');
    var m = raw.match(/^([A-Z0-9]{6})-([A-Z0-9]{4})$/);

    if (!m) {
      box.innerHTML = result('no', '✕', '형식이 맞지 않습니다', '예: ABC123-9F2C');
      return;
    }
    if (expected(m[1]) !== m[2]) {
      box.innerHTML = result('no', '✕', '확인되지 않는 번호입니다', '참가자 화면을 다시 확인해 주세요.');
      return;
    }
    var already = claims.filter(function (c) { return c.code === raw; })[0];
    if (already) {
      box.innerHTML = result('dup', '!', '이미 수령한 번호입니다', already.at + ' 에 처리됨');
      return;
    }
    box.innerHTML = result('ok', '✓', '확인되었습니다', '기념품을 전달한 뒤 아래 버튼을 눌러주세요.') +
      '<button class="btn btn--primary btn--block" id="claimBtn" style="margin-top:12px">수령 처리하기</button>';
    $('claimBtn').addEventListener('click', function () {
      claims.unshift({ code: raw, at: stamp() });
      set(K_CLAIM, claims);
      renderClaims();
      box.innerHTML = result('ok', '✓', '수령 처리 완료', raw);
      $('giftInput').value = '';
      $('giftInput').focus();
    });
  }

  function result(kind, mark, title, sub) {
    return '<div class="result result--' + kind + '">' +
      '<div class="result__mark">' + mark + '</div>' +
      '<p class="result__title">' + esc(title) + '</p>' +
      '<p class="result__sub">' + esc(sub) + '</p></div>';
  }

  function stamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
           pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function pad(n) { return ('0' + n).slice(-2); }

  function renderClaims() {
    $('claimCount').textContent = claims.length + '건';
    var body = $('claimBody');
    if (!claims.length) {
      body.innerHTML = '<tr><td colspan="3" class="empty-row">아직 수령 기록이 없습니다.</td></tr>';
      return;
    }
    body.innerHTML = claims.map(function (c, i) {
      return '<tr><td>' + esc(c.code) + '</td><td>' + esc(c.at) + '</td>' +
             '<td class="col-del"><button class="icon-btn" data-claim="' + i + '">✕</button></td></tr>';
    }).join('');
  }

  $('claimBody').addEventListener('click', function (e) {
    var i = e.target.dataset.claim;
    if (i === undefined) return;
    claims.splice(i, 1); set(K_CLAIM, claims); renderClaims();
  });

  $('claimCsv').addEventListener('click', function () {
    var rows = [['인증번호', '수령 시각']].concat(claims.map(function (c) { return [c.code, c.at]; }));
    downloadCSV(rows, '과학잼_기념품수령.csv');
  });

  $('claimClear').addEventListener('click', function () {
    if (!confirm('수령 기록을 모두 지울까요?')) return;
    claims = []; set(K_CLAIM, claims); renderClaims();
  });

  /* ---------- 설정 ---------- */
  var settings = get(K_SET, null) || {
    requirements: CFG.requirements.map(function (r) { return { field: r.field, need: r.need }; }),
    minTotal: CFG.minTotal,
    plogNeed: CFG.plogging.need,
    requireByField: !!CFG.requireByField
  };

  function renderSettings() {
    $('reqBody').innerHTML = settings.requirements.map(function (r, i) {
      return '<tr><td>' + esc(r.field) + '</td>' +
        '<td><input class="input input--sm" type="number" min="0" max="20" data-req="' + i + '" value="' + r.need + '" style="width:90px"></td></tr>';
    }).join('');
    $('minTotalInput').value = settings.minTotal;
    $('plogNeed').value = settings.plogNeed;
    $('reqStrict').checked = !!settings.requireByField;
  }

  $('reqBody').addEventListener('input', function (e) {
    var i = e.target.dataset.req;
    if (i === undefined) return;
    settings.requirements[i].need = Math.max(0, parseInt(e.target.value || '0', 10));
    set(K_SET, settings);
  });
  $('minTotalInput').addEventListener('input', function () {
    settings.minTotal = Math.max(1, parseInt(this.value || '1', 10)); set(K_SET, settings);
  });
  $('reqStrict').addEventListener('change', function () {
    settings.requireByField = this.checked; set(K_SET, settings);
  });
  $('plogNeed').addEventListener('input', function () {
    settings.plogNeed = Math.max(0, parseInt(this.value || '0', 10)); set(K_SET, settings);
  });

  /* ---------- config.js 만들기 ---------- */
  function buildConfig() {
    var adminHash = $('newAdminPw').value.trim() ? window.jamHash($('newAdminPw').value.trim()) : CFG.adminHash;
    var plogHash  = $('plogPw').value.trim() ? window.jamHash($('plogPw').value.trim()) : CFG.plogging.hash;

    var auth = booths.filter(function (b) { return b.code && b.pw; }).map(function (b) {
      return '    { code: ' + q(b.code) + ', name: ' + q(b.name) + ', field: ' + q(b.field) +
             ', hash: ' + q(window.jamHash(b.pw)) + ' }';
    }).join(',\n');

    var req = settings.requirements.map(function (r) {
      return '    { field: ' + q(r.field) + ', need: ' + r.need + ' }';
    }).join(',\n');

    return '/* 과학잼 스탬프 투어 설정 — ' + stamp() + ' 관리자 페이지에서 생성 */\n\n' +
      'var JAM_CONFIG = {\n' +
      '  salt: ' + q(CFG.salt) + ',\n' +
      '  adminHash: ' + q(adminHash) + ',\n' +
      '  verifySecret: ' + q(CFG.verifySecret) + ',\n\n' +
      '  requirements: [\n' + req + '\n  ],\n\n' +
      '  minTotal: ' + settings.minTotal + ',\n' +
      '  requireByField: ' + (settings.requireByField ? 'true' : 'false') + ',\n\n' +
      '  plogging: {\n    need: ' + settings.plogNeed + ',\n    hash: ' + q(plogHash) + '\n  },\n\n' +
      '  auth: [\n' + auth + '\n  ]\n' +
      '};\n';
  }

  function q(v) { return "'" + String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }

  $('buildBtn').addEventListener('click', function () {
    $('preview').textContent = buildConfig();
  });

  $('downloadBtn').addEventListener('click', function () {
    var text = buildConfig();
    $('preview').textContent = text;
    downloadText(text, 'config.js', 'text/javascript');
  });

  $('copyBtn').addEventListener('click', function () {
    var text = buildConfig();
    $('preview').textContent = text;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { alert('복사했습니다.'); });
    } else {
      alert('미리보기 내용을 직접 선택해 복사해 주세요.');
    }
  });

  $('wipeBtn').addEventListener('click', function () {
    if (!confirm('이 기기에 저장된 부스 비밀번호 목록과 수령 기록을 모두 지웁니다. 계속할까요?')) return;
    [K_BOOTH, K_CLAIM, K_SET].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    location.reload();
  });

  /* ---------- 파일 내려받기 ---------- */
  function downloadText(text, filename, type) {
    var blob = new Blob(['\ufeff' + text], { type: (type || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function downloadCSV(rows, filename) {
    var text = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
    downloadText(text, filename, 'text/csv');
  }
})();
