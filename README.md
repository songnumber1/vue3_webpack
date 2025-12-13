# ChatGPT-like Layout (Vue 3 Option API + Webpack)

## Features

- ChatGPT-style layout: Sidebar + Header + Content(Chat) + Footer
- Theme select: `light / dim / dark` (saved to localStorage)
- Responsive: `sm` breakpoint -> sidebar becomes hamburger + slide-in drawer
- Bootstrap-like size utilities:
  - `.btn-sm .btn-md .btn-lg`
  - `.label-sm .label-md .label-lg`
  - `.btn-rsp/.label-rsp` auto scales via breakpoint (`html[data-bp]`)

## Run

```bash
npm i
npm run dev
```

## Build

```bash
npm run build
```

## 마크다운

---

### 📱 2. 모바일 UX 세밀 조정

- sm 사이즈에서
  - bubble 폭 최적화 (88%)
  - textarea 키보드 올라와도 입력창 가려지지 않음
- Sidebar drawer 열릴 때 body scroll lock 유지
- 터치 환경에서도 hover 의존 제거

---

### ✍ textarea 요구사항

- textarea 사용 유지
- ❌ 우측 하단 사이즈 조절 핸들 제거
- 크기 고정 (`resize: none`)
- Enter = 전송 / Shift+Enter = 줄바꿈

---

## 🔒 안정성 체크 (사이드 이펙트 없음)

| 항목             | 상태        |
| ---------------- | ----------- |
| ChatStore 구조   | 변경 ❌     |
| Sidebar / Router | 변경 ❌     |
| Theme            | 기존 그대로 |
| localStorage     | 그대로      |
| Playground       | 영향 없음   |

👉 **v11 구조 위에 “표현 레이어만 추가”**

---

## 다음 단계 (선택)

이제 거의 **ChatGPT 클론 v1 완성 단계**입니다.  
다음으로 자연스럽게 갈 수 있는 것들:

9️⃣ SSE / streaming 응답  
🔟 Markdown 안에 mermaid / math  
1️⃣1️⃣ 채팅 제목 편집 / 삭제  
1️⃣2️⃣ Spring WebClient 연동 구조

👉 다음으로 **원하는 번호만 말해 주세요.**  
v12 기준으로 깨지지 않게 계속 확장해드릴게요. ​:contentReference[oaicite:0]{index=0}​
