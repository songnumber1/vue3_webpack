/**
 * @file composables/markdown/useMarkdownTools.js
 * @description Markdown 내부 버튼/링크/도구 action을 담당하는 composable입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {
  openExternalBrowser,
  copyClipboardByPlatform,
} from "@/platform/bridge/platformBridge";
import {usePlatformStore} from "@/stores/platformStore";

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function tableToText(table) {
  // 네이티브 HTMLTableElement의 rows 컬렉션을 순회 가능한 배열로 가공합니다.
  return Array.from(table.rows)
    .map(
      (row) =>
        // 각 행(row) 내부의 셀(cells) 목록을 추출하여 탭(\t) 델리미터 문자열로 병합합니다.
        Array.from(row.cells)
          .map((cell) => cell.innerText.replace(/\s+/g, " ").trim()) // 글자 사이의 연속된 공백이나 개행문자를 단일 스페이스로 치환 보정
          .join("\t") // 클립보드 복사 시 엑셀 등 스프레드시트 컴포넌트에 바로 셀 단위 기하 구조로 붙도록 탭 문자로 조인
    )
    .join("\n"); // 줄바꿈을 구분자로 묶어 최종 텍스트 청크 완성
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function tableToCsv(table) {
  // 테이블 엘리먼트를 CSV 파일 표준 규격 문자열 포맷으로 변환 덤프합니다.
  return Array.from(table.rows)
    .map(
      (row) =>
        Array.from(row.cells)
          .map(
            (cell) =>
              // CSV 구문 손상을 막기 위해 데이터 본문 자체에 포함된 따옴표(")는 쌍따옴표("")로 이스케이프하고 외곽을 따옴표로 감쌉니다.
              `"${cell.innerText.replace(/"/g, '""').replace(/\s+/g, " ").trim()}"`
          )
          .join(",") // CSV 표준에 발맞추어 컴마(,) 기호로 셀 병합
    )
    .join("\n");
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function downloadText(content, filename, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], {type}); // 전달받은 텍스트 콘텐츠를 바이너리 대형 객체(Blob) 버퍼로 포장
  const url = URL.createObjectURL(blob); // 브라우저가 다운로드 세션에 접근할 수 있는 고유 임시 blob: URL 생성을 통해 주소 앵커 확보
  const link = document.createElement("a"); // 메모리상에 가상의 다운로드 트리거용 앵커 노드 생성
  link.href = url;
  link.download = filename; // 다운로드 속성에 목적지 파일명 하이드레이션
  document.body.appendChild(link); // 돔 트리에 잠시 부착 (구형 파이어폭스 등 특정 커널의 클릭 이벤트 미발동 에러 방어 가드)
  link.click(); // 브라우저 네이티브 파일 다운로드 시스템 전격 강제 구동
  link.remove(); // 태스크 완료 후 메모리 청소를 위해 임시 부착한 앵커 가차없이 노드 철거
  URL.revokeObjectURL(url); // 브라우저 메모리 누수를 원천 차단하기 위해 임시 주소 자원을 소멸 해제
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 래퍼 함수를 통해 중간 로직을 캡슐화합니다.
 */
function downloadCsv(csv) {
  // [중요 인코딩 가드]: 한국어 환경의 MS Excel 등에서 CSV 파일을 열었을 때 글자가 유령처럼 전부 깨지는 대참사를 방지하기 위해,
  // 문자열 맨 앞에 UTF-8 바이트 순서 표시 마커인 BOM(\ufeff) 기호를 인위적으로 결합하여 내보냅니다.
  downloadText(
    `\ufeff${csv}`,
    `table-${Date.now()}.csv`,
    "text/csv;charset=utf-8"
  );
}
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleTableAction(button) {
  const card = button.closest(".md-table-card"); // 버튼 기준으로 마크다운 테이블을 감싸고 있는 최상위 카드 컨테이너 추적 수색
  const table = card?.querySelector("table");
  if (!table) return; // 감시 대상 테이블 노드 부재 시 조기 탈출 예외 방어

  const action = button.dataset.mdTableAction; // 버튼 어트리뷰트에 바인딩되어 있던 실제 액션 식별키 추출

  // 케이스 A: 클립보드 복사 실행
  if (action === "copy") {
    await copyClipboardByPlatform(tableToText(table)); // 현재 크로스 플랫폼(웹/앱 브릿지) 규격에 맞춰 시스템 클립보드에 텍스트 록인
    return;
  }
  // 케이스 B: CSV 엑셀 파일 내보내기 다운로드 실행
  if (action === "csv") {
    downloadCsv(tableToCsv(table));
  }
}
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveMermaidSource(card) {
  const mermaid = card?.querySelector(".md-mermaid");
  // 렌더링 엔진에 의해 원본 텍스트가 SVG 형태로 완전히 치환되었을 상황을 대비해 속성에 백업해 둔 원시 스크립트 소스를 우선 로드하고, 부재 시 본문 텍스트 채택
  return (
    mermaid?.getAttribute("data-mermaid-source") || mermaid?.textContent || ""
  );
}
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveMermaidSvg(card) {
  const svg = card?.querySelector(".md-mermaid svg");
  if (!svg) return "";

  const clone = svg.cloneNode(true); // 오리지널 화면 돔이 손상되거나 렌더링이 깨지는 문제를 방지하기 위해 딥 복제본(Deep Clone) 생성

  // 네이티브 그래픽 규격화 가드: 다운로드된 독립형 단일 .svg 파일이 이미지 뷰어에서 정상 인식되려면 필수 네임스페이스(`xmlns`) 선언이 탑재되어 있어야 하므로 속성 보정 검증 진행
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  return new XMLSerializer().serializeToString(clone); // 메모리상의 SVG 돔 구조체를 다운로드 가능한 순수 XML 텍스트 스트링 버퍼로 원자적 직렬화 변환
}
/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleMermaidAction(button) {
  const card = button.closest(".md-mermaid-card"); // 머메이드 차트 영역 전용 카드 부모 컴포넌트 추적 수색
  if (!card) return;

  const action = button.dataset.mdMermaidAction;

  // 기능 분기 1: 머메이드 차트의 순수 텍스트 다이어그램 소스 코드 복사
  if (action === "copy") {
    const source = resolveMermaidSource(card);
    if (source) {
      await copyClipboardByPlatform(source);
    }
    return;
  }

  // 기능 분기 2: 확장자 `.mmd` 텍스트 다이어그램 파일 다운로드 연동
  if (action === "code") {
    const source = resolveMermaidSource(card);
    if (source) {
      downloadText(source, `mermaid-${Date.now()}.mmd`);
    }
    return;
  }

  // 기능 분기 3: 브라우저가 렌더링 완수한 결과물인 가시 벡터 그래픽 `.svg` 이미지 파일 다운로드 연동
  if (action === "svg") {
    const svg = resolveMermaidSvg(card);
    if (svg) {
      downloadText(
        svg,
        `mermaid-${Date.now()}.svg`,
        "image/svg+xml;charset=utf-8"
      );
    }
  }
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleCodeAction(button) {
  const card = button.closest(".md-code-card"); // 코드 블록을 감싼 최외곽 카드 수색 추적
  const pre = card?.querySelector("pre");
  // 마크다운 파서 및 하이라이터가 소스코드를 가공 처리했으므로 어트리뷰트에 은닉 보관해 둔 순수 텍스트 소스를 우선 수집하되, 없을 시 네이티브 본문 문자열로 백업 수집
  const code = pre?.getAttribute("data-md-code-source") || pre?.innerText || "";
  const action = button.dataset.mdCodeAction;

  // 기능 분기: 프로그래밍 코드 블록 원본 그대로 시스템 클립보드에 바인딩
  if (action === "copy" && code) {
    await copyClipboardByPlatform(code);
  }
}

export function useMarkdownTools(contentRef) {
  const platformStore = usePlatformStore(); // 하드웨어 디바이스 플랫폼 종류 판별을 위한 전역 스토어 로드

  /**
   * @description [고성능 이벤트 위임 패턴]: 마크다운 내부의 수많은 개별 버튼마다 리스너를 수천 개씩 중복 바인딩하면
   * 메모리가 붕괴되므로, 최상위 컨테이너 단에서 버블링되어 튕겨 올라오는 원시 클릭 신호를 하이재킹하여 동적으로 명령을 필터링 처리합니다.
   */
  async function handleMarkdownClick(event) {
    // 1단계 필터링: 클릭된 타깃 노드가 마크다운 '테이블 전용 도구 버튼' 영역에 속하는지 진단
    const tableActionButton = event.target?.closest?.(
      "button[data-md-table-action]"
    );
    // 조건 일치 및 현재 활성화되어 보고 있는 활성 마크다운 영역 범위 내에 안착한 버튼이 맞는다면 이벤트 인터셉트 단행
    if (tableActionButton && contentRef.value?.contains(tableActionButton)) {
      event.preventDefault(); // href 점프 및 네이티브 기본 마우스 액션 무효화
      event.stopPropagation(); // 부모 돔 레이어로 이벤트가 쓸데없이 번져나가는 버블링 강제 차단
      await handleTableAction(tableActionButton); // 테이블 제어 엑츄에이터 호출
      return; // 매칭 완수되었으므로 하부 다른 타입 버튼 검증 생략 조기 이탈
    }

    // 2단계 필터링: 클릭된 타깃 노드가 마크다운 '머메이드 차트 전용 도구 버튼'에 속하는지 진단
    const mermaidActionButton = event.target?.closest?.(
      "button[data-md-mermaid-action]"
    );
    if (
      mermaidActionButton &&
      contentRef.value?.contains(mermaidActionButton)
    ) {
      event.preventDefault();
      event.stopPropagation();
      await handleMermaidAction(mermaidActionButton);
      return;
    }

    // 3단계 필터링: 클릭된 타깃 노드가 마크다운 '개발 프로그래밍 코드 블록 복사 버튼'에 속하는지 진단
    const codeActionButton = event.target?.closest?.(
      "button[data-md-code-action]"
    );
    if (codeActionButton && contentRef.value?.contains(codeActionButton)) {
      event.preventDefault();
      event.stopPropagation();
      await handleCodeAction(codeActionButton);
      return;
    }

    // 4단계 필터링: 사용자가 하이퍼링크 텍스트 주소(`<a>` 태그)를 직접 클릭했는지 최종 탐색 진단
    const anchor = event.target?.closest?.("a[href]");
    if (!anchor || !contentRef.value?.contains(anchor)) return; // 하이퍼링크가 아니라면 처리권 포기 아웃

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return; // 단순 인페이지 앵커(ID 해시태그 이동 목점) 수치라면 네이티브 스크롤로 가도록 바이패스
    if (!platformStore.info.isAndroidApp) return; // 일반 PC 웹 브라우저 환경인 경우 네이티브 타깃 링크 처리가 불필요하므로 바이패스 예외 이탈

    // [중요 인앱 웹뷰 가드]: 안드로이드 네이티브 앱 환경 내부 웹뷰인 경우, 링크를 그냥 클릭하면 하이브리드 앱 화면 자체가
    // 외부 사이트로 넘어가서 채팅 세션이 완전히 폭파되는 심각한 오류가 있으므로 네이티브 웹뷰 주소 점프를 강제 압착 셧다운 처리합니다.
    event.preventDefault();
    event.stopPropagation();
    await openExternalBrowser(anchor.href); // 앱 네이티브 안드로이드 브릿지 명령어(네이티브 기기 아웃링크 크롬/사파리 브라우저 개통)를 우회 인보크
  }

  // 마크다운 컨테이너 컴포넌트의 클릭 바인딩용 팩토리 인터페이스 내보내기 방출
  return {handleMarkdownClick};
}
