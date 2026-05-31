# Tailwind migration style boundary

이 폴더는 SCSS 전체 전환을 한 번에 수행하지 않고, Tailwind 기반으로 안전하게 이동하기 위한 중간 계층입니다.

## 1단계에서 확정한 원칙

- 기존 `src/assets/styles/index.scss` import 순서와 런타임 SCSS는 유지합니다.
- Vue 컴포넌트 구조, 상태 class, JS 로직은 변경하지 않습니다.
- Tailwind는 기존 CSS 변수 값을 직접 덮어쓰지 않고 `--tw-*` alias를 통해 참조합니다.
- 다크 테마, 계절 테마, 모바일 런타임, 키보드/scroll-lock 보정은 기존 SCSS가 계속 담당합니다.

## 파일 역할

```txt
index.scss       Tailwind 진입점
_tokens.scss     기존 CSS 변수 ↔ Tailwind token alias 연결
_base.scss       Tailwind base layer. reset 최소화
_components.scss 반복 사용 가능한 tw-* component class
_utilities.scss  safe-area, app-height 등 보조 utility
```

## 다음 단계 기준

2단계부터 Vue template에 Tailwind utility class를 직접 적용할 때는 아래 순서를 우선합니다.

1. Layout / shell / sidebar / header / footer
2. Chat workspace / prompt / message wrapper
3. Studio / MCP / RAG / overlay
4. markdown / mermaid / runtime generated html은 마지막까지 layer 기반으로 유지

## 주의사항

Tailwind breakpoint는 빌드 타임 media query입니다. 현재 프로젝트의 런타임 반응형 기준은 JS/body class와 CSS variable 기반으로 동작하므로 Tailwind `mobile:` / `desktop:` prefix만으로 런타임 breakpoint 정책을 대체하지 않습니다.
