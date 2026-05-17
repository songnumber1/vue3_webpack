import {createI18n} from "vue-i18n";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const SUPPORT_LOCALES = ["ko", "en"];

export const messages = {
  ko: {
    accessDenied: {
      title: "지원하지 않는 접속 환경입니다.",
      description: "iOS 앱, iOS Chrome, iOS Safari에서는 접속할 수 없습니다.",
    },
    common: {
      back: "뒤로",
      close: "닫기",
      confirm: "확인",
      cancel: "취소",
      save: "저장",
      guide: "가이드",
      notice: "공지 사항",
      personalization: "개인화",
      language: "다국어",
      korean: "한국어",
      english: "영어",
      user: "사용자",
      plus: "Plus",
      theme: "테마",
      swagger: "Swagger 문서",
      settings: "설정",
      playground: "Playground",
    },
    feedback: {
      like: "좋아요",
      dislike: "싫어요",
      send: "피드백 보내기",
      copy: "클립보드 복사",
      hallucinationTitle: "무엇이 문제였나요?",
      more: "더보기",
      sendDescription: "답변 품질 개선을 위해 상세 의견을 남길 수 있습니다.",
      placeholder: "피드백 내용을 입력하세요.",
    },
    settings: {
      chatManagement: "대화 관리",
      chatManagementTitle: "대화 관리",
      chatManagementSummary: "대화 보관, 내보내기, 삭제 설정",
      chatManagementBody:
        "운영 API 연결 전까지 대화 관리 기능의 UI 구조를 미리 확인하는 영역입니다.",
      chatManagementArchive: "중요 대화 고정 및 보관",
      chatManagementExport: "대화 내보내기 및 공유",
      chatManagementDelete: "대화 삭제 및 복구 정책",
    },
    chat: {
      assistantSelect: "Assistant 선택",
      modelSelect: "모델 선택",
      modelReadonly: "대화방 모델은 변경할 수 없습니다.",
      tools: "도구",
      attachOptions: {
        camera: "카메라",
        image: "이미지",
        file: "파일",
      },
      hideSidebar: "사이드바 숨기기",
      openSidebar: "사이드바 열기",
      newChat: "새 채팅",
      chatSearch: "채팅 검색",
      conversations: "대화",
      recentChats: "최근 채팅",
      startQuestion: "어디서부터 시작할까요?",
      sharedReadonly: "공유 받은 대화입니다.",
      sharedConversationTitle: "공유 대화 {id}",
      scrollBottom: "맨 아래로 이동",
      assistant: "Assistant",
      promptPlaceholder: "무엇이든 물어보세요",
      send: "전송",
      voiceStart: "음성 입력 시작",
      voiceStop: "음성 입력 중지",
      attach: "첨부",
      suggestions: {
        image: "이미지 만들기",
        writing: "글쓰기 또는 편집",
        search: "필요한 항목 찾기",
      },
      historyMenu: {
        title: "대화방 메뉴",
        pinnedLabel: "즐겨찾기 대화방",
        pin: "즐겨찾기",
        unpin: "즐겨찾기 해지",
        rename: "제목 변경",
        share: "공유",
        delete: "삭제",
        renameTitle: "대화방 제목 변경",
        deleteTitle: "대화방 삭제",
        titleLabel: "대화방 제목",
        deleteMessage: "'{title}'을(를) 삭제하시겠습니까?",
        deleteDefaultTitle: "선택한 대화방",
        shareNotice: "공유 버튼을 선택했습니다.",
        noticeTitle: "알림",
      },
    },
    menu: {
      serviceMenu: "설정",
      serviceMenuDescription: "가이드, 공지, 개인화, 언어 설정",
      settingsDescription: "가이드, 공지, 개인화, 언어 설정",
      openNotice: "공지 사항 보기",
      openPersonalization: "개인화 설정",
      openLanguage: "언어 선택",
      noticeSummary: "서비스 업데이트와 운영 안내를 확인하세요.",
      personalizationSummary: "응답 방식과 화면 취향을 조정하세요.",
      languageSummary: "한국어 또는 영어로 화면 언어를 변경합니다.",
      playgroundSummary: "공통 UI와 플랫폼별 화면을 독립적으로 테스트합니다.",
    },
    notice: {
      title: "공지 사항",
      subtitle: "최근 서비스 변경 사항과 운영 안내입니다.",
      items: [
        {
          title: "모바일 채팅 UI 개선",
          date: "2026.05.14",
          body: "모바일 WebView와 브라우저에서 입력창, 스크롤, 대화 목록 표시 안정성을 개선했습니다.",
        },
        {
          title: "공유 대화 읽기 전용 지원",
          date: "2026.05.12",
          body: "공유 링크로 접근한 대화는 입력창 대신 읽기 전용 안내 영역을 표시합니다.",
        },
        {
          title: "마크다운 테이블 도구 추가",
          date: "2026.05.10",
          body: "테이블 복사와 CSV 다운로드 기능을 제공하여 응답 데이터를 더 쉽게 활용할 수 있습니다.",
        },
      ],
    },
    personalization: {
      title: "개인화",
      subtitle: "DSLLM 스타일의 개인화 설정 예시입니다.",
      memoryTitle: "메모리",
      memoryBody:
        "대화 맥락과 선호도를 기억하여 더 자연스러운 응답을 제공합니다.",
      styleTitle: "응답 스타일",
      styleBody:
        "간결함, 상세함, 기술 중심 답변 등 선호하는 응답 방식을 조정합니다.",
      dataTitle: "데이터 제어",
      dataBody:
        "개인화에 사용되는 정보를 확인하고 필요 시 초기화할 수 있습니다.",
      compact: "간결한 답변",
      detailed: "상세한 답변",
      technical: "기술 중심",
    },
    markdown: {
      table: "테이블",
      copyTable: "테이블 복사",
      downloadCsv: "CSV 다운로드",
      copyTableShort: "복사",
      downloadCsvShort: "CSV",
    },
    guide: {
      title: "사용 가이드",
      subtitle: "채팅, 공유 대화, 문서 기능을 빠르게 시작하세요.",
      sections: [
        {
          title: "새 채팅 시작",
          body: "좌측 메뉴의 새 채팅을 누르거나 메인 입력창에 질문을 입력하세요.",
        },
        {
          title: "공유 대화",
          body: "공유 링크는 읽기 전용으로 표시되며 입력창이 비활성화됩니다.",
        },
        {
          title: "마크다운 활용",
          body: "표, 코드, 수식, 다이어그램을 포함한 응답을 렌더링할 수 있습니다.",
        },
      ],
    },
  },
  en: {
    accessDenied: {
      title: "Unsupported access environment.",
      description: "iOS app, iOS Chrome, and iOS Safari are not supported.",
    },
    common: {
      back: "Back",
      close: "Close",
      confirm: "Confirm",
      cancel: "Cancel",
      save: "Save",
      guide: "Guide",
      notice: "Notices",
      personalization: "Personalization",
      language: "Language",
      korean: "Korean",
      english: "English",
      user: "User",
      plus: "Plus",
      theme: "Theme",
      swagger: "Swagger Docs",
      settings: "Settings",
      playground: "Playground",
    },
    feedback: {
      like: "Like",
      dislike: "Dislike",
      send: "Send feedback",
      copy: "Copy to clipboard",
      hallucinationTitle: "What was wrong?",
      more: "Show more",
      sendDescription: "Leave detailed feedback to improve answer quality.",
      placeholder: "Describe the issue.",
    },
    settings: {
      chatManagement: "Chat management",
      chatManagementTitle: "Chat management",
      chatManagementSummary: "Archive, export, and delete chat settings",
      chatManagementBody:
        "This area previews chat management UI before the production API is connected.",
      chatManagementArchive: "Pin and archive important chats",
      chatManagementExport: "Export and share conversations",
      chatManagementDelete: "Delete and recovery policy",
    },
    chat: {
      assistantSelect: "Select assistant",
      modelSelect: "Select model",
      modelReadonly: "The model for this chat cannot be changed.",
      tools: "Tools",
      attachOptions: {
        camera: "Camera",
        image: "Image",
        file: "File",
      },
      hideSidebar: "Hide sidebar",
      openSidebar: "Open sidebar",
      newChat: "New chat",
      chatSearch: "Search chats",
      conversations: "Chats",
      recentChats: "Recent chats",
      startQuestion: "Where should we start?",
      sharedReadonly: "This is a shared conversation.",
      sharedConversationTitle: "Shared chat {id}",
      scrollBottom: "Scroll to bottom",
      assistant: "Assistant",
      promptPlaceholder: "Ask anything",
      send: "Send",
      voiceStart: "Start voice input",
      voiceStop: "Stop voice input",
      attach: "Attach",
      suggestions: {
        image: "Create image",
        writing: "Write or edit",
        search: "Find what you need",
      },
      historyMenu: {
        title: "Chat menu",
        pinnedLabel: "Pinned chat",
        pin: "Pin",
        unpin: "Unpin",
        rename: "Rename",
        share: "Share",
        delete: "Delete",
        renameTitle: "Rename chat",
        deleteTitle: "Delete chat",
        titleLabel: "Chat title",
        deleteMessage: "Delete '{title}'?",
        deleteDefaultTitle: "selected chat",
        shareNotice: "Share was selected.",
        noticeTitle: "Notice",
      },
    },
    menu: {
      serviceMenu: "Settings",
      serviceMenuDescription: "Guide, notices, personalization, and language",
      settingsDescription: "Guide, notices, personalization, and language",
      openNotice: "View notices",
      openPersonalization: "Personalization settings",
      openLanguage: "Choose language",
      noticeSummary: "Check service updates and announcements.",
      personalizationSummary: "Adjust response style and preferences.",
      languageSummary: "Switch the UI between Korean and English.",
      playgroundSummary:
        "Test shared UI and platform-specific screens independently.",
    },
    notice: {
      title: "Notices",
      subtitle: "Recent service updates and announcements.",
      items: [
        {
          title: "Improved mobile chat UI",
          date: "2026.05.14",
          body: "Improved input, scrolling, and chat list stability for mobile WebView and browsers.",
        },
        {
          title: "Read-only shared chats",
          date: "2026.05.12",
          body: "Shared links now show a read-only notice instead of an input area.",
        },
        {
          title: "Markdown table tools",
          date: "2026.05.10",
          body: "Copy table and CSV download actions are available for rendered markdown tables.",
        },
      ],
    },
    personalization: {
      title: "Personalization",
      subtitle: "DSLLM-style personalization examples.",
      memoryTitle: "Memory",
      memoryBody:
        "Remember conversation context and preferences for more natural responses.",
      styleTitle: "Response style",
      styleBody: "Adjust concise, detailed, or technical response preferences.",
      dataTitle: "Data controls",
      dataBody: "Review or reset information used for personalization.",
      compact: "Concise",
      detailed: "Detailed",
      technical: "Technical",
    },
    markdown: {
      table: "Table",
      copyTable: "Copy table",
      downloadCsv: "Download CSV",
      copyTableShort: "Copy",
      downloadCsvShort: "CSV",
    },
    guide: {
      title: "Guide",
      subtitle:
        "Get started with chat, shared conversations, and document features.",
      sections: [
        {
          title: "Start a new chat",
          body: "Use New chat in the sidebar or enter a question on the main page.",
        },
        {
          title: "Shared chats",
          body: "Shared links are displayed as read-only conversations with the input disabled.",
        },
        {
          title: "Markdown",
          body: "Render tables, code, math, and diagrams in assistant responses.",
        },
      ],
    },
  },
};

const savedLocale =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("app-locale")
    : null;
const browserLocale =
  typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "ko";
const initialLocale = SUPPORT_LOCALES.includes(savedLocale)
  ? savedLocale
  : SUPPORT_LOCALES.includes(browserLocale)
    ? browserLocale
    : "ko";

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: "ko",
  messages,
});

/**
 * @description setAppLocale 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} locale - locale 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function setAppLocale(locale) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!SUPPORT_LOCALES.includes(locale)) return;
  i18n.global.locale.value = locale;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof document !== "undefined") document.documentElement.lang = locale;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof localStorage !== "undefined")
    localStorage.setItem("app-locale", locale);
}

setAppLocale(initialLocale);
