# 2026 파주 과학·융합축제 과학잼(JAM) 안내 사이트

정적 웹사이트입니다. 빌드 도구 없이 HTML/CSS/JS 파일만 있으면 돌아가므로,
VS Code에서 열어 바로 이어서 작업할 수 있습니다.

## 실행 방법

1. VS Code에서 이 폴더를 엽니다. (`파일 → 폴더 열기`)
2. 확장 **Live Server**를 설치합니다.
3. `index.html`에서 우클릭 → **Open with Live Server**.

Live Server 없이 `index.html`을 더블클릭해도 대부분 정상 동작하지만,
로컬 서버로 여는 쪽이 PDF 다운로드·지도 삽입 시 안전합니다.

## 폴더 구조

```
paju-science-jam/
├─ index.html            ← 축제 안내 페이지 (섹션별 주석 있음)
├─ css/
│  └─ style.css          ← 색·간격·반응형. 맨 위 :root 에서 색을 한 번에 변경
├─ js/
│  └─ main.js            ← 메뉴, 스크롤 효과, 부스 검색/필터
├─ data/
│  └─ booths.js          ← ★ 부스 목록 데이터 (71개)
└─ assets/
   ├─ img/               ← 엠블럼(잼 단지) 이미지, 파비콘, 부스 안내도(booth-map.jpg)
   └─ pdf/booths/        ← 부스별 설명서 PDF (booth-01 ~ booth-71)
```

내용 기준: 「[리플릿] 2026 파주 과학잼(2차) 2026.10.12.」, 「부스 설명서(A1) 2026 파주 과학잼(2026.10.12.)」, 「운영 계획(2026. 10. 수정)」

## 자주 고칠 곳 체크리스트

| 할 일 | 파일 | 위치 |
|---|---|---|
| 부스 정보 수정 | `data/booths.js` | `BOOTHS` 배열 |
| 부스 번호 색 변경 | `data/booths.js` | `BOOTH_COLORS` (+ `index.html`의 `no-legend`) |
| 부스 설명서 PDF 교체 | `assets/pdf/booths/` | `booth-01.pdf` ~ `booth-71.pdf` (아래 1번 참고) |
| 부스 안내도 교체 | `assets/img/` | `booth-map.jpg` 이름으로 덮어쓰기 |
| 장소·시간 변경 | `index.html` | 히어로 `hero__facts`, `about`의 `info-list`, `#schedule` 표 |
| 브랜드 색 변경 | `css/style.css` | 파일 최상단 `:root` |
| CSS·JS 수정 후 새로고침해도 그대로일 때 | `index.html` | `style.css?v=…`, `main.js?v=…`, `booths.js?v=…` 의 `v=` 값을 바꾸기 |
| 스탬프 투어 안내(종이 리플렛) | `index.html` | `#stamp` 섹션 (안내 문구만 있고 별도 기능 없음) |

### 1. 부스 설명서 PDF

부스 카드의 `부스 설명서 보기`를 누르면 그 부스의 설명서 한 쪽만 열립니다.
전체를 한 번에 내려받는 버튼은 두지 않습니다.

| 파일 | 내용 |
|---|---|
| `assets/pdf/booths/booth-01.pdf` ~ `booth-71.pdf` | 부스별 설명서 (부스당 0.4~0.7MB) |

설명서가 바뀌면 원본 PDF(71쪽, 부스 번호 = 쪽 번호)로 아래 명령을 다시 실행하세요. (Ghostscript 필요: `brew install ghostscript`)

```sh
for i in $(seq 1 71); do n=$(printf %02d $i)
  gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -dPDFSETTINGS=/printer \
     -dColorImageResolution=300 -dColorImageDownsampleThreshold=1.1 \
     -dFirstPage=$i -dLastPage=$i -sOutputFile=assets/pdf/booths/booth-$n.pdf 원본.pdf
done
```

### 2. 부스 목록

`data/booths.js`의 `BOOTHS` 배열 한 칸이 부스 하나입니다.

```js
{ no: 1, field: '화학', school: '해솔중학교', team: '화학나라 마녀들',
  title: '물속에서 자라는 알록달록 비밀정원',
  desc: '화학나라 마녀들과 함께 화학 정원을 만들고 퀴즈 맞추기',
  time: '약 20분', age: ['유', '초', '중', '고'] }
```

- `field` 는 `물리` `화학` `생명과학` `지구과학` `수학` `생태환경` `정보` 중 하나로 적어야
  분야 필터(과학 / 수학 / 생태환경 / AI·디지털)에 정상적으로 묶입니다.
- 카드 색은 부스 번호로 정해집니다(`BOOTH_COLORS`). 부스 설명서 배경·현수막·부스 목록표 번호 색과
  맞춘 값이니 인쇄물 색이 바뀔 때만 함께 고치세요.

  | 번호 | 색 |
  |---|---|
  | 1~12 | `#258371` 초록 |
  | 13~27 | `#D76EA7` 분홍 |
  | 28~42 | `#5D52A0` 보라 |
  | 43~57 | `#233B93` 남색 |
  | 58~71 | `#E55D2D` 주황 |

### 3. 지도 넣기

`index.html`의 `<div class="loc__map" id="map">` 안쪽 내용을 지도 iframe으로 교체하세요.

```html
<iframe src="지도 임베드 주소" title="운정호수공원 위치" loading="lazy" allowfullscreen></iframe>
```

카카오맵은 [지도 퍼가기](https://map.kakao.com) 기능으로, 구글 지도는 `공유 → 지도 퍼가기`로
iframe 코드를 얻을 수 있습니다.

## 배포

정적 파일이라 어디에 올려도 됩니다.

- **GitHub Pages**: 저장소에 올리고 `Settings → Pages → Deploy from a branch` 선택
- **Netlify / Vercel**: 폴더를 그대로 드래그 앤 드롭
- **학교·교육지원청 홈페이지**: 폴더 전체를 웹서버에 업로드

## 남은 작업 메모

- [x] 부스별 설명서 PDF `assets/pdf/booths/` 업로드
- [x] 선정 결과로 `BOOTHS` 데이터 교체 (71개)
- [x] 부스 안내도 이미지 추가
- [ ] 대중교통·주차 상세 안내 확정 후 `#location` 문구 수정
