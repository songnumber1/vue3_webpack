/**
 * @file index.js
 * @description Vue i18n instance and message catalog for the chat application UI.
 */

import { createI18n } from "vue-i18n";

export const SUPPORT_LOCALES = ["ko", "en"];

export const messages = {
  ko: {
    common: {
      back: "뒤로",
      close: "닫기",
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
      settings: "설정"
    },
    chat: {
      assistantSelect: "Assistant 선택",
      hideSidebar: "사이드바 숨기기",
      openSidebar: "사이드바 열기",
      newChat: "새 채팅",
      chatSearch: "채팅 검색",
      conversations: "대화",
      recentChats: "최근 채팅",
      startQuestion: "어디서부터 시작할까요?",
      sharedReadonly: "공유 받은 대화입니다.",
      scrollBottom: "맨 아래로 이동",
      assistant: "Assistant",
      promptPlaceholder: "무엇이든 물어보세요",
      send: "전송",
      attach: "첨부",
      suggestions: {
        image: "이미지 만들기",
        writing: "글쓰기 또는 편집",
        search: "필요한 항목 찾기"
      }
    },
    menu: {
      serviceMenu: "서비스 메뉴",
      serviceMenuDescription: "가이드, 공지, 개인화, 언어 설정",
      openNotice: "공지 사항 보기",
      openPersonalization: "개인화 설정",
      openLanguage: "언어 선택",
      noticeSummary: "서비스 업데이트와 운영 안내를 확인하세요.",
      personalizationSummary: "응답 방식과 화면 취향을 조정하세요.",
      languageSummary: "한국어 또는 영어로 화면 언어를 변경합니다."
    },
    notice: {
      title: "공지 사항",
      subtitle: "최근 서비스 변경 사항과 운영 안내입니다.",
      items: [
        {
          title: "모바일 채팅 UI 개선",
          date: "2026.05.14",
          body: "모바일 WebView와 브라우저에서 입력창, 스크롤, 대화 목록 표시 안정성을 개선했습니다."
        },
        {
          title: "공유 대화 읽기 전용 지원",
          date: "2026.05.12",
          body: "공유 링크로 접근한 대화는 입력창 대신 읽기 전용 안내 영역을 표시합니다."
        },
        {
          title: "마크다운 테이블 도구 추가",
          date: "2026.05.10",
          body: "테이블 복사와 CSV 다운로드 기능을 제공하여 응답 데이터를 더 쉽게 활용할 수 있습니다."
        }
      ]
    },
    personalization: {
      title: "개인화",
      subtitle: "ChatGPT 스타일의 개인화 설정 예시입니다.",
      memoryTitle: "메모리",
      memoryBody: "대화 맥락과 선호도를 기억하여 더 자연스러운 응답을 제공합니다.",
      styleTitle: "응답 스타일",
      styleBody: "간결함, 상세함, 기술 중심 답변 등 선호하는 응답 방식을 조정합니다.",
      dataTitle: "데이터 제어",
      dataBody: "개인화에 사용되는 정보를 확인하고 필요 시 초기화할 수 있습니다.",
      compact: "간결한 답변",
      detailed: "상세한 답변",
      technical: "기술 중심"
    },
    markdown: {
      table: "테이블",
      copyTable: "테이블 복사",
      downloadCsv: "CSV 다운로드"
    },
    guide: {
      title: "사용 가이드",
      subtitle: "채팅, 공유 대화, 문서 기능을 빠르게 시작하세요.",
      sections: [
        {
          title: "새 채팅 시작",
          body: "좌측 메뉴의 새 채팅을 누르거나 메인 입력창에 질문을 입력하세요."
        },
        { title: "공유 대화", body: "공유 링크는 읽기 전용으로 표시되며 입력창이 비활성화됩니다." },
        {
          title: "마크다운 활용",
          body: "표, 코드, 수식, 다이어그램을 포함한 응답을 렌더링할 수 있습니다."
        }
      ]
    }
  },
  en: {
    common: {
      back: "Back",
      close: "Close",
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
      settings: "Settings"
    },
    chat: {
      assistantSelect: "Select assistant",
      hideSidebar: "Hide sidebar",
      openSidebar: "Open sidebar",
      newChat: "New chat",
      chatSearch: "Search chats",
      conversations: "Chats",
      recentChats: "Recent chats",
      startQuestion: "Where should we start?",
      sharedReadonly: "This is a shared conversation.",
      scrollBottom: "Scroll to bottom",
      assistant: "Assistant",
      promptPlaceholder: "Ask anything",
      send: "Send",
      attach: "Attach",
      suggestions: {
        image: "Create image",
        writing: "Write or edit",
        search: "Find what you need"
      }
    },
    menu: {
      serviceMenu: "Service menu",
      serviceMenuDescription: "Guide, notices, personalization, and language",
      openNotice: "View notices",
      openPersonalization: "Personalization settings",
      openLanguage: "Choose language",
      noticeSummary: "Check service updates and announcements.",
      personalizationSummary: "Adjust response style and preferences.",
      languageSummary: "Switch the UI between Korean and English."
    },
    notice: {
      title: "Notices",
      subtitle: "Recent service updates and announcements.",
      items: [
        {
          title: "Improved mobile chat UI",
          date: "2026.05.14",
          body: "Improved input, scrolling, and chat list stability for mobile WebView and browsers."
        },
        {
          title: "Read-only shared chats",
          date: "2026.05.12",
          body: "Shared links now show a read-only notice instead of an input area."
        },
        {
          title: "Markdown table tools",
          date: "2026.05.10",
          body: "Copy table and CSV download actions are available for rendered markdown tables."
        }
      ]
    },
    personalization: {
      title: "Personalization",
      subtitle: "ChatGPT-style personalization examples.",
      memoryTitle: "Memory",
      memoryBody: "Remember conversation context and preferences for more natural responses.",
      styleTitle: "Response style",
      styleBody: "Adjust concise, detailed, or technical response preferences.",
      dataTitle: "Data controls",
      dataBody: "Review or reset information used for personalization.",
      compact: "Concise",
      detailed: "Detailed",
      technical: "Technical"
    },
    markdown: {
      table: "Table",
      copyTable: "Copy table",
      downloadCsv: "Download CSV"
    },
    guide: {
      title: "Guide",
      subtitle: "Get started with chat, shared conversations, and document features.",
      sections: [
        {
          title: "Start a new chat",
          body: "Use New chat in the sidebar or enter a question on the main page."
        },
        {
          title: "Shared chats",
          body: "Shared links are displayed as read-only conversations with the input disabled."
        },
        {
          title: "Markdown",
          body: "Render tables, code, math, and diagrams in assistant responses."
        }
      ]
    }
  }
};

const savedLocale = typeof localStorage !== "undefined" ? localStorage.getItem("app-locale") : null;
const browserLocale = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "ko";
const initialLocale = SUPPORT_LOCALES.includes(savedLocale)
  ? savedLocale
  : SUPPORT_LOCALES.includes(browserLocale)
    ? browserLocale
    : "ko";

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: "ko",
  messages
});

/**
 * Persists and applies the requested application locale.
 * @param {string} locale Locale code to apply.
 * @returns {void}
 */
export function setAppLocale(locale) {
  if (!SUPPORT_LOCALES.includes(locale)) return;
  i18n.global.locale.value = locale;
  if (typeof document !== "undefined") document.documentElement.lang = locale;
  if (typeof localStorage !== "undefined") localStorage.setItem("app-locale", locale);
}

setAppLocale(initialLocale);
