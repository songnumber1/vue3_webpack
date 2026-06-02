/**
 * @file i18n/domains/common.js
 * @description 다국어 메시지와 locale 관리 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const commonMessages = {
  ko: {
    app: {
      unsupportedTitle: "지원하지 않는 접속 환경입니다.",
      unsupportedMessage:
        "지원 환경은 Chrome 브라우저와 Android WebView입니다.",
    },
    application: {
      title: "Chat App",
      subtitle: "Application",
      headerLabel: "애플리케이션 헤더",
      footerLabel: "애플리케이션 푸터",
      userMenuLabel: "사용자 메뉴",
      footerText: "chat app",
    },
    common: {
      back: "뒤로",
      home: "홈",
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
      logout: "로그아웃",
      theme: "테마",
      swagger: "Swagger 문서",
      settings: "설정",
      system: "시스템",
      api: "API",
      mobile: "모바일",
      bottomSheet: "Bottom Sheet",
      playground: "Playground",
      privacy: "개인정보처리방침",
      terms: "이용 약관",
      resize: "크기 조절",
      select: "선택",
      koreanUi: "한국어 UI",
      englishUi: "English UI",
    },
    clipboardNote: {
      title: "복사 완료",
      message: "클립보드에 복사되었습니다.",
      toastMessage: "복사했습니다.",
      fail: "복사에 실패했습니다.",
    },
    toastNote: {
      title: "알림",
    },
    overlayProgress: {
      apiProcessing: "API 요청 처리 중입니다.",
    },
    virtualKeyboardDebug: {
      button: "키보드",
      body: "실제 키는 제공하지 않습니다. Android Chrome 기준 확인용이며 실제 기기와 높이/동작이 다를 수 있습니다.",
      titles: {
        adjustNothing: "가상 키보드 테스트 영역 · adjustNothing",
        adjustPan: "가상 키보드 테스트 영역 · adjustPan",
        adjustResize: "가상 키보드 테스트 영역 · adjustResize",
      },
      descriptions: {
        adjustNothing:
          "현재 모드는 화면 보정 없이 가상 키보드 영역만 덮어서 보여줍니다.",
        adjustPan:
          "현재 모드는 CSS resize 없이 화면 내용을 위로 밀어 올리는 pan 동작을 흉내냅니다.",
        adjustResize:
          "현재 모드는 CSS 키보드 높이 변수를 적용해 입력 영역과 컨텐츠 하단 여백을 조정합니다.",
      },
    },
    platformBridge: {
      browserHandled: "브라우저에서 처리되었습니다.",
      browserFileInputRequired:
        "브라우저에서는 input[type=file]을 사용해야 합니다.",
      browserFcmUnavailable:
        "브라우저에서는 FCM 토큰을 Native Bridge에서 조회하지 않습니다.",
      shareUnsupported: "현재 브라우저에서 공유 기능을 지원하지 않습니다.",
    },
    playground: {
      eyebrow: "UI Playground",
      title: "공통 UI 테스트 공간",
      description:
        "Web/Android 공통 컴포넌트, Overlay, Bottom Sheet, 알림/경고/확인 팝업을 실제 화면과 분리해서 확인합니다.",
      container: {
        label: "Container",
        title: "AppContainer 통합 확인",
        description:
          "기존 WebLayout/AndroidLayout의 단순 slot wrapper를 AppContainer로 통합하고, platform class로 Web/Android 차이를 분리했습니다.",
      },
      overlay: {
        label: "Overlay",
        title: "Modal / Full Screen",
        description:
          "공통 Overlay Provider를 통해 데스크톱에서는 모달, 모바일에서는 전체 화면 패널로 전환되는지 확인합니다.",
        openNotice: "공지 Overlay 열기",
        openPersonalization: "개인화 Overlay 열기",
      },
      popup: {
        label: "Popup",
        title: "알림 / 경고 / 확인 팝업",
        description:
          "실제 서비스에서 공통으로 사용할 알림, 경고, 확인 팝업 샘플입니다. 내용은 slot으로 교체하고, 버튼 액션은 부모에서 제어합니다.",
        alertButton: "알림 팝업",
        warningButton: "경고 팝업",
        confirmButton: "확인 팝업",
        lastResult: "마지막 팝업 결과",
        emptyResult: "아직 선택된 팝업 액션이 없습니다.",
        result: "{title} - {action}",
        alert: {
          title: "알림 팝업",
          subtitle: "일반 안내 메시지",
          message: "저장이 완료되었습니다.",
          detail:
            "서비스 공지, 단순 완료 안내, 토스트보다 강조가 필요한 안내에 사용합니다.",
        },
        warning: {
          title: "경고 팝업",
          subtitle: "주의가 필요한 작업",
          message: "입력값을 다시 확인해 주세요.",
          detail:
            "삭제 전 경고, 세션 만료, 네트워크 오류처럼 사용자의 주의가 필요한 상황에 사용합니다.",
        },
        confirm: {
          title: "확인 팝업",
          subtitle: "사용자 선택 필요",
          message: "선택한 대화를 삭제하시겠습니까?",
          detail:
            "확인/취소처럼 사용자의 명시적인 선택이 필요한 작업에 사용합니다.",
        },
      },
      clipboard: {
        label: "Clipboard",
        title: "클립보드 피드백 테스트",
        description:
          "PC 웹에서는 note, 모바일 브라우저에서는 toast, Android 앱웹에서는 Native toast가 출력되는지 확인합니다.",
        copyButton: "샘플 텍스트 복사",
        feedbackTarget: "피드백 출력 방식",
        webTarget: "PC 웹: 화면 우측 상단 note",
        mobileTarget: "모바일 브라우저: 화면 하단 toast",
        androidTarget: "Android 앱웹: Native toast",
        sampleText: "Playground 클립보드 테스트 문구입니다.",
      },
      toast: {
        label: "Toast",
        title: "SHOW_TOAST 테스트",
        description:
          "입력한 메시지를 별도 SHOW_TOAST 액션으로 출력합니다. 모바일 기기에서는 toast, PC 웹에서는 note로 확인합니다.",
        inputLabel: "토스트 메시지",
        placeholder: "출력할 메시지를 입력하세요.",
        showButton: "Show toast",
        feedbackTarget: "피드백 출력 방식",
        webTarget: "PC 웹: 화면 우측 상단 note",
        mobileTarget: "모바일 브라우저: 화면 하단 toast",
        androidTarget: "Android 앱웹: SHOW_TOAST Native toast",
        noteTitle: "Playground 알림",
        sampleText: "Playground toast 메시지입니다.",
      },
      bottomSheet: {
        label: "Bottom Sheet",
        title: "모바일 Sheet 테스트",
        description:
          "동적 컨텐츠가 들어가는 UI는 slot 기반을 유지하고, 외부에서 open/close만 제어합니다.",
        open: "Bottom Sheet 열기",
        sheetTitle: "Playground Bottom Sheet",
        optionA: "옵션 A",
        optionB: "옵션 B",
        optionC: "옵션 C",
        optionDescription: "동적으로 변경 가능한 slot 컨텐츠입니다.",
      },
      navigation: {
        label: "Navigation",
        title: "진입 경로 확인",
        description:
          "웹 모드에서는 헤더 사용자 메뉴의 하위 아이템, 모바일 모드에서는 좌측 메뉴 사용자 정보 우측 아이콘으로 이 화면에 접근합니다.",
        guideRoute: "가이드 경로",
        sharedRoute: "공유 대화 경로",
        chatRoute: "채팅 경로",
      },
    },
    swagger: {
      goHome: "홈으로 이동",
      home: "홈",
      renderError: "Swagger 렌더링 오류",
      renderErrorFallback: "Swagger UI를 렌더링하지 못했습니다.",
    },
    error: {
      authCheck: "로그인 확인 중 오류가 발생했습니다.",
    },
    menu: {
      serviceMenu: "설정",
      serviceMenuDescription: "가이드, 공지, 개인화, 언어 설정",
      settingsDescription: "가이드, 공지, 개인화, 언어 설정",
      openNotice: "공지 사항 보기",
      openPersonalization: "개인화 설정",
      openLanguage: "언어 선택",
      noticeSummary: "서비스 업데이트와 운영 안내를 확인하세요.",
      privacySummary: "개인정보 처리 기준을 확인하세요.",
      termsSummary: "서비스 이용 약관을 확인하고 동의합니다.",
      personalizationSummary: "응답 방식과 화면 취향을 조정하세요.",
      languageSummary: "한국어 또는 영어로 화면 언어를 변경합니다.",
      systemSummary: "앱 동작과 화면 노출 설정을 관리합니다.",
      playgroundSummary: "공통 UI와 플랫폼별 화면을 독립적으로 테스트합니다.",
      logoutSummary: "현재 세션을 종료하고 로그인 화면으로 이동합니다.",
    },
    markdown: {
      table: "테이블",
      copyTable: "테이블 복사",
      downloadCsv: "CSV 다운로드",
      copyCode: "코드 복사",
      codeInterpreter: "코드 인터프리터",
      copyMermaid: "Mermaid 복사",
      regenerate: "답변 재생성",
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
    app: {
      unsupportedTitle: "Unsupported access environment.",
      unsupportedMessage:
        "Supported environments are Chrome browser and Android WebView.",
    },
    application: {
      title: "Chat App",
      subtitle: "Application",
      headerLabel: "Application header",
      footerLabel: "Application footer",
      userMenuLabel: "User menu",
      footerText: "chat app",
    },
    common: {
      back: "Back",
      home: "Home",
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
      logout: "Logout",
      theme: "Theme",
      swagger: "Swagger Docs",
      settings: "Settings",
      system: "System",
      api: "API",
      mobile: "Mobile",
      bottomSheet: "Bottom Sheet",
      playground: "Playground",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      resize: "Resize",
      select: "Select",
      koreanUi: "Korean UI",
      englishUi: "English UI",
    },
    clipboardNote: {
      title: "Copied",
      message: "Copied to clipboard.",
      toastMessage: "Copied!",
      fail: "Copy failed.",
    },
    toastNote: {
      title: "Notice",
    },
    overlayProgress: {
      apiProcessing: "Processing API request.",
    },
    virtualKeyboardDebug: {
      button: "Keyboard",
      body: "This area does not provide real keys. It is for Android Chrome checks and may differ from real device height and behavior.",
      titles: {
        adjustNothing: "Virtual keyboard test area · adjustNothing",
        adjustPan: "Virtual keyboard test area · adjustPan",
        adjustResize: "Virtual keyboard test area · adjustResize",
      },
      descriptions: {
        adjustNothing:
          "This mode only overlays the virtual keyboard area without screen correction.",
        adjustPan:
          "This mode simulates pan behavior by moving content toward the focused input without CSS resize correction.",
        adjustResize:
          "This mode applies CSS keyboard height variables to adjust the input area and bottom content spacing.",
      },
    },
    platformBridge: {
      browserHandled: "Handled in the browser.",
      browserFileInputRequired: "Use input[type=file] in the browser.",
      browserFcmUnavailable:
        "FCM tokens are only available through the Native Bridge.",
      shareUnsupported: "Sharing is not supported in this browser.",
    },
    playground: {
      eyebrow: "UI Playground",
      title: "Common UI test space",
      description:
        "Test shared Web/Android components, overlays, bottom sheets, and alert/warning/confirm popups separately from production screens.",
      container: {
        label: "Container",
        title: "AppContainer integration check",
        description:
          "The simple WebLayout/AndroidLayout slot wrapper is unified into AppContainer, while platform classes separate Web and Android differences.",
      },
      overlay: {
        label: "Overlay",
        title: "Modal / Full Screen",
        description:
          "Check that the shared overlay provider switches between desktop modal and mobile full-screen panel.",
        openNotice: "Open notice overlay",
        openPersonalization: "Open personalization overlay",
      },
      popup: {
        label: "Popup",
        title: "Alert / Warning / Confirm popup",
        description:
          "Samples for shared alert, warning, and confirm popups. Content can be replaced by slots and actions are controlled by the parent.",
        alertButton: "Alert popup",
        warningButton: "Warning popup",
        confirmButton: "Confirm popup",
        lastResult: "Last popup result",
        emptyResult: "No popup action has been selected yet.",
        result: "{title} - {action}",
        alert: {
          title: "Alert popup",
          subtitle: "General notice",
          message: "Saved successfully.",
          detail:
            "Use this for service notices, simple completion messages, and notices that need more emphasis than a toast.",
        },
        warning: {
          title: "Warning popup",
          subtitle: "Action requires attention",
          message: "Please check the input again.",
          detail:
            "Use this for delete warnings, session expiration, and network errors that require user attention.",
        },
        confirm: {
          title: "Confirm popup",
          subtitle: "User choice required",
          message: "Delete the selected conversation?",
          detail:
            "Use this when the user must explicitly choose confirm or cancel.",
        },
      },
      clipboard: {
        label: "Clipboard",
        title: "Clipboard feedback test",
        description:
          "Check that PC web shows a note, mobile browsers show a toast, and Android app webviews show a native toast.",
        copyButton: "Copy sample text",
        feedbackTarget: "Feedback target",
        webTarget: "PC web: top-right note",
        mobileTarget: "Mobile browser: bottom toast",
        androidTarget: "Android app webview: native toast",
        sampleText: "This is a Playground clipboard test message.",
      },
      toast: {
        label: "Toast",
        title: "SHOW_TOAST test",
        description:
          "Display the entered message through a separate SHOW_TOAST action. Mobile devices show a toast and PC web shows a note.",
        inputLabel: "Toast message",
        placeholder: "Enter a message to show.",
        showButton: "Show toast",
        feedbackTarget: "Feedback target",
        webTarget: "PC web: top-right note",
        mobileTarget: "Mobile browser: bottom toast",
        androidTarget: "Android app webview: SHOW_TOAST native toast",
        noteTitle: "Playground notice",
        sampleText: "This is a Playground toast message.",
      },
      bottomSheet: {
        label: "Bottom Sheet",
        title: "Mobile sheet test",
        description:
          "Dynamic content keeps a slot-based structure while open and close are controlled externally.",
        open: "Open bottom sheet",
        sheetTitle: "Playground Bottom Sheet",
        optionA: "Option A",
        optionB: "Option B",
        optionC: "Option C",
        optionDescription: "Dynamic slot content can be placed here.",
      },
      navigation: {
        label: "Navigation",
        title: "Route entry check",
        description:
          "In web mode, enter from the header user menu; in mobile mode, enter from the icon next to the user footer in the side menu.",
        guideRoute: "Guide route",
        sharedRoute: "Shared route",
        chatRoute: "Chat route",
      },
    },
    swagger: {
      goHome: "Go to home",
      home: "Home",
      renderError: "Swagger render error",
      renderErrorFallback: "Failed to render Swagger UI.",
    },
    error: {
      authCheck: "An error occurred while verifying login.",
    },
    menu: {
      serviceMenu: "Settings",
      serviceMenuDescription: "Guide, notices, personalization, and language",
      settingsDescription: "Guide, notices, personalization, and language",
      openNotice: "View notices",
      openPersonalization: "Personalization settings",
      openLanguage: "Choose language",
      noticeSummary: "Check service updates and announcements.",
      privacySummary: "Review how personal information is processed.",
      termsSummary: "Review and agree to the service terms.",
      personalizationSummary: "Adjust response style and preferences.",
      languageSummary: "Switch the UI between Korean and English.",
      systemSummary: "Manage app behavior and visible screen options.",
      playgroundSummary:
        "Test shared UI and platform-specific screens independently.",
      logoutSummary: "End the current session and go to the login screen.",
    },
    markdown: {
      table: "Table",
      copyTable: "Copy table",
      downloadCsv: "Download CSV",
      copyCode: "Copy code",
      codeInterpreter: "Code Interpreter",
      copyMermaid: "Copy Mermaid",
      regenerate: "Regenerate answer",
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
