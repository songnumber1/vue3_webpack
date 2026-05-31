# Tailwind migration style boundary

이 폴더는 SCSS 전체 전환을 한 번에 수행하지 않고, Tailwind 기반으로 안전하게 이동하기 위한 중간 계층입니다.

## 현재 단계: Step 4-2

- 기존 `src/assets/styles/index.scss` import 순서와 런타임 SCSS는 유지합니다.
- Vue 컴포넌트 구조, 상태 class, JS 로직은 변경하지 않습니다.
- Tailwind는 기존 CSS 변수 값을 직접 덮어쓰지 않고 `--tw-*` alias를 통해 참조합니다.
- 다크 테마, 계절 테마, 모바일 런타임, 키보드/scroll-lock 보정은 기존 SCSS가 계속 담당합니다.
- Tailwind utility는 반드시 `tw-` prefix를 사용합니다.
- Tailwind preflight는 비활성화되어 있습니다.
- `@tailwindcss/forms`는 전역 reset이 아니라 `strategy: 'class'`로만 사용합니다.

## 유지 파일

```txt
index.scss       Tailwind 진입점. @tailwind base/utilities와 token bridge만 노출합니다.
_tokens.scss     기존 CSS 변수 ↔ Tailwind token alias 연결
```

## Step 4-2에서 제거한 파일

아래 파일들은 현재 entry import graph에서 비활성이고, 다시 import될 경우 Studio/MCP/BottomSheet/Prompt 계열을 덮을 수 있어 source tree에서 제거했습니다.
보관본은 `doc/tailwind-migration/removed-step4-2/`에 있습니다.

```txt
_base.scss
_components.scss
_utilities.scss
```

특히 `_components.scss`는 다수의 `!important` 기반 migration component class를 포함하고 있어 다시 import하면 안 됩니다.
반복 컴포넌트 class가 필요할 경우 기존 파일을 되살리지 말고, 대상 컴포넌트 단위로 검증된 `tw-` utility를 Vue template에 직접 적용하세요.

## 다음 단계 기준

1. Layout / shell / sidebar / header / footer
2. Chat workspace / prompt / message wrapper
3. Studio / MCP / RAG / overlay
4. markdown / mermaid / runtime generated html은 마지막까지 layer 기반으로 유지

## 주의사항

Tailwind breakpoint는 빌드 타임 media query입니다. 현재 프로젝트의 런타임 반응형 기준은 JS/body class와 CSS variable 기반으로 동작하므로 Tailwind `mobile:` / `desktop:` prefix만으로 런타임 breakpoint 정책을 대체하지 않습니다.
