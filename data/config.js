/* ============================================================
   config.js — 스탬프 투어 설정
   ------------------------------------------------------------
   ※ 비밀번호는 그대로 적지 않고 해시(64자리)로 저장합니다.
     새 비밀번호의 해시는 admin.html → [설정] 탭에서 만들 수 있습니다.

   기본 비밀번호 (반드시 바꿔서 사용하세요)
     · 관리자      : jam-admin-2026
     · 부스        : jam-a01, jam-a05 … (부스 코드 기준)
     · 플로깅 인증 : jam-plogging
   ============================================================ */

var JAM_CONFIG = {
  /* 해시를 섞을 때 쓰는 값. 바꾸면 아래 모든 해시를 다시 만들어야 합니다. */
  salt: 'paju-jam-2026',

  /* 관리자 페이지 비밀번호 (기본: jam-admin-2026) */
  adminHash: 'ed2dde51acb1ecfa0dc1e75d1c1e41a8de2ac7b6f3ed43c021e9f414f973ab1e',

  /* 기념품 인증번호를 만들 때 쓰는 값. 외부에 알리지 마세요. */
  verifySecret: 'jam-gift-2026',

  /* 분야별 권장 스탬프 개수 (스탬프판에 표시) */
  requirements: [
    { field: '과학',      need: 2 },
    { field: '수학',      need: 1 },
    { field: '생태환경',  need: 1 },
    { field: 'AI·디지털', need: 2 }
  ],

  /* 기념품 자격: 전체 스탬프 최소 개수 */
  minTotal: 5,

  /* true 로 바꾸면 분야별 개수까지 모두 채워야 기념품 자격이 됩니다 */
  requireByField: false,

  /* 플로깅 챌린지 (기본 비밀번호: jam-plogging) */
  plogging: {
    need: 3,
    hash: '7dc5a96986e62870ed99df3a1fbaddd18649fa223d27e2408b45aa945b5426c0'
  },

  /* 부스별 인증 비밀번호. admin.html에서 목록을 만들고 내려받아 이 부분을 교체하세요. */
  auth: [
    { code: 'A-01', name: '코딩으로 탈출하라! AI 로봇 미로 챌린지', field: 'AI·디지털', hash: '63d89509fcb485860f02f8daf0c027452a279933ee9210261a5d0d3fb910e4cb' },
    { code: 'A-05', name: '내 목소리로 그리는 생성형 AI 그림책',     field: 'AI·디지털', hash: '8b5a8ee1ce745fec57d1df8d6cb0faf651384f8ac71e0034129ca4a2cc89fcce' },
    { code: 'B-03', name: '프리즘 컬러 사이언스, 빛을 분해하라!',    field: '과학',      hash: '627b0832072e2f7d2949d46daed4464ab6163bdf5d0d2c1ed31ef78c8312c32a' },
    { code: 'B-07', name: '거품이 부푸는 순간, 촉매 실험실',         field: '과학',      hash: 'bd39378eb333d1870b758b03230a6819cc9a99ac110f90d5ef6d9c0a538586d3' },
    { code: 'C-02', name: '지구를 살리는 에코 에너지 랩',            field: '생태환경',  hash: 'f8a4e2c0b6d08004b8c3a416c90b6de8d898bedf626dd2ee0bfaf3eb3c772c2f' },
    { code: 'C-06', name: '버려진 플라스틱이 굿즈가 되기까지',       field: '생태환경',  hash: '0e78d98fc465db8a5a158ee10ccbdf5d3bf003f1318c4ea18c22458932add13e' },
    { code: 'D-04', name: '테셀레이션 아틀리에',                     field: '수학',      hash: '39b61af9e933b9875ebf6954b14def638c1822c27e879ee9d88dc6a376752dd7' },
    { code: 'D-09', name: '뽑기 기계로 배우는 확률의 감각',          field: '수학',      hash: 'dccf696dea3422b619cd0af73f66a12e3ad4d0f4c3573da9353248885b6f0d19' }
  ]
};
