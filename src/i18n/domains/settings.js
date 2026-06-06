/**
 * @file i18n/domains/settings.js
 * @description 다국어 메시지와 locale 관리 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const settingsMessages = {
  ko: {
    systemSettings: {
      eyebrow: "시스템",
      title: "앱 동작 설정",
      description:
        "화면 노출, API 사용 여부, 모바일 기준값을 한 곳에서 조정합니다. 적용을 누르면 즉시 저장되고 다음 화면 동작부터 반영됩니다.",
      close: "닫기",
      apply: "적용",
      authModeChangeLogoutConfirm:
        "인증 방식이 변경되어 현재 로그인 상태가 초기화됩니다. 적용 후 다시 로그인이 필요합니다. 계속하시겠습니까?",
      logoutRequiredSettingChangeConfirm:
        "대화방 URL 표시 방식 또는 인증 방식이 변경되어 현재 로그인 상태가 초기화됩니다. 적용 후 다시 로그인이 필요합니다. 계속하시겠습니까?",
      tabsLabel: "시스템 설정 분류",
      tabs: {
        common: "공통",
        pc: "PC",
        mobile: "모바일",
      },
      groups: {
        platformResponsive: "플랫폼 / 반응형",
        api: "API",
        auth: "인증",
        mobile: "모바일",
        bottomSheet: "Bottom Sheet",
        chat: "채팅방",
        action: "사용자 액션",
        menu: "사용자 메뉴",
      },
      items: {
        useRealApi: {
          label: "실제 API 통신",
          description: "끄면 프론트엔드 mock 데이터를 사용합니다.",
        },

        webAuthMode: {
          label: "웹 인증 방식",
          description: "PC/웹 환경에서 사용할 인증 방식을 선택합니다.",
        },
        mobileAuthMode: {
          label: "모바일 인증 방식",
          description:
            "모바일 브라우저/WebView 환경에서 사용할 인증 방식을 선택합니다.",
        },
        webLoginUrl: {
          label: "웹 로그인 URL",
          description: "웹 환경에서 로그인 확인 또는 진입에 사용할 URL입니다.",
        },
        mobileLoginUrl: {
          label: "모바일 로그인 URL",
          description:
            "모바일 환경에서 로그인 확인 또는 진입에 사용할 URL입니다.",
        },
        tempLoginUrl: {
          label: "임시 로그인 URL",
          description: "로컬 테스트용 임시 로그인 API URL입니다.",
        },
        accessInfoUrl: {
          label: "권한 확인 URL",
          description:
            "라우터 가드와 초기 인증 확인에 사용할 access/info URL입니다.",
        },
        logoutUrl: {
          label: "로그아웃 URL",
          description: "세션/JWT 로그아웃 요청 URL입니다.",
        },
        jwtRefreshUrl: {
          label: "JWT 갱신 URL",
          description:
            "access token 만료 시 refresh token으로 재발급 받을 URL입니다.",
        },
        jwtWithCredentials: {
          label: "JWT credential 전송",
          description:
            "JWT 모드에서도 쿠키 credential을 함께 보낼지 여부입니다.",
        },
        mobileBreakpoint: {
          label: "반응형 전환 기준",
          description:
            "브라우저 너비가 이 값 이하이면 모바일 화면으로 전환됩니다. 플랫폼 강제 설정을 Auto로 변경하면 시스템 기본값으로, Auto가 아닌 강제 플랫폼을 선택하면 8888px로 자동 설정됩니다. 입력 범위: 400~9999px.",
        },
        platformOverride: {
          label: "플랫폼 강제 설정",
          labelWithActual: "플랫폼 강제 설정 (진짜 플랫폼: {actual})",
          description:
            "웹 브라우저에서도 선택한 플랫폼 분기 로직을 적용합니다. Auto는 시스템 기본 반응형 기준을 사용하고, 강제 플랫폼은 반응형 전환 기준을 8888px로 자동 설정합니다.",
        },
        keyboardMode: {
          label: "키보드 모드",
          description:
            "메인/채팅 화면에서 키보드가 올라올 때 적용할 보정 정책입니다.",
        },
        useVirtualKeyboard: {
          label: "키보드 보정 사용",
          description:
            "adjustResize 모드에서 visualViewport 기반 CSS 보정 로직을 사용합니다.",
        },
        showVirtualKeyboardDebug: {
          label: "가상 키보드 디버그",
          description:
            "모바일 모드에서만 테스트용 가상 키보드 버튼을 노출합니다.",
        },
        virtualKeyboardHeight: {
          label: "가상 키보드 높이",
          description:
            "디버그용 가상 키보드 영역 높이(px)입니다. 기본값은 Android Chrome 확인용 340px입니다.",
        },
        useMicrophone: {
          label: "마이크 사용",
          description: "프롬프트 입력 영역의 음성 버튼 노출 여부입니다.",
        },
        showPcProgress: {
          label: "PC ProgressBar",
          description:
            "PC 플랫폼에서 코드가 요청한 전체 화면 ProgressBar 표시를 허용합니다. 화면 너비가 아니라 실제/강제 플랫폼 기준으로 판단합니다.",
        },
        showMobileProgress: {
          label: "모바일 ProgressBar",
          description:
            "모바일 플랫폼에서 코드가 요청한 전체 화면 ProgressBar 표시를 허용합니다. 강제 플랫폼 설정이 Android이면 PC에서도 이 설정을 따릅니다.",
        },
        bottomSheetMinHeight: {
          label: "최소 높이",
          description:
            "모바일 Bottom Sheet가 접혔을 때 유지할 최소 높이(px)입니다.",
        },
        bottomSheetMaxHeight: {
          label: "최대 높이",
          description:
            "모바일 Bottom Sheet가 확장될 때 넘지 않을 최대 높이(px)입니다.",
        },
        autoScrollOnAnswer: {
          label: "자동 스크롤",
          description: "답변 시 스크롤 자동 이동 여부입니다.",
        },
        conversationUrlMode: {
          label: "대화방 URL 표시 방식",
          description:
            "일반 대화방 주소에 chatId를 표시할지, /chat 주소로 숨길지 선택합니다. 숨김 모드는 새로고침 시 채팅 메인으로 이동합니다.",
        },
        showMermaidHeader: {
          label: "Mermaid 헤더 표시",
          description:
            "Mermaid 다이어그램 상단의 제목과 복사/SVG/코드 버튼 표시 여부입니다.",
        },
        enableMermaidRendering: {
          label: "Mermaid 렌더링 사용",
          description:
            "Mermaid 코드 블록을 SVG 다이어그램으로 렌더링합니다. 끄면 일반 코드 블록으로 표시합니다.",
        },
        pcShowMermaidHeader: {
          label: "PC Mermaid 헤더 표시",
          description:
            "PC에서 Mermaid 다이어그램 상단의 제목과 복사/SVG/코드 버튼 표시 여부입니다.",
        },
        pcEnableMermaidRendering: {
          label: "PC Mermaid 렌더링 사용",
          description:
            "PC에서 Mermaid 코드 블록을 SVG 다이어그램으로 렌더링합니다. 끄면 일반 코드 블록으로 표시합니다.",
        },
        mobileShowMermaidHeader: {
          label: "모바일 Mermaid 헤더 표시",
          description:
            "모바일에서 Mermaid 다이어그램 상단의 제목과 복사/SVG/코드 버튼 표시 여부입니다.",
        },
        mobileEnableMermaidRendering: {
          label: "모바일 Mermaid 렌더링 사용",
          description:
            "모바일에서 Mermaid 코드 블록을 SVG 다이어그램으로 렌더링합니다. 끄면 일반 코드 블록으로 표시합니다.",
        },
        historyLazyChunkSize: {
          label: "이력 메시지 로드 개수",
          description:
            "대용량 대화방 입장 및 상단 갱신 시 한 번에 렌더링할 메시지 개수입니다.",
        },
        historyLazyTopThreshold: {
          label: "이력 상단 로드 기준(PC 전용)",
          description:
            "PC에서 스크롤이 상단 몇 px 이내로 접근하면 이전 메시지를 자동 추가 로드할지 결정합니다. Android 버튼 방식에는 적용되지 않습니다.",
        },
        pcHistoryLazyInitialCount: {
          label: "PC 초기 렌더 개수",
          description:
            "PC 일반 대화방에 처음 입장할 때 하단 기준으로 먼저 렌더링할 메시지 개수입니다.",
        },
        pcHistoryLazyAppendCount: {
          label: "PC 추가 렌더 개수",
          description:
            "PC 일반 대화방에서 상단으로 이동했을 때 추가로 렌더링할 이전 메시지 개수입니다.",
        },
        pcHistoryLazyTopThresholdPx: {
          label: "PC 상단 로드 감지 거리(px)",
          description:
            "PC에서 스크롤이 상단 몇 px 이내로 접근하면 이전 메시지를 자동 추가 로드할지 결정합니다.",
        },
        mobileHistoryLazyInitialCount: {
          label: "모바일 초기 렌더 개수",
          description:
            "모바일 대화방에 처음 입장할 때 하단 기준으로 먼저 렌더링할 메시지 개수입니다.",
        },
        mobileHistoryLazyAppendCount: {
          label: "모바일 추가 렌더 개수",
          description:
            "모바일에서 이전 대화 더 보기 버튼을 눌렀을 때 추가로 렌더링할 메시지 개수입니다.",
        },
        abortChatOnMobileBackground: {
          label: "백그라운드 모드 시 채팅 종료",
          description:
            "모바일에서 브라우저가 백그라운드로 전환되면 진행 중인 답변 요청의 abort를 시도합니다.",
        },
        showGuideButton: {
          label: "가이드 버튼 화면 출력",
          description: "헤더와 모바일 설정의 가이드 진입 버튼을 제어합니다.",
        },
        showThemeButton: {
          label: "테마 버튼 출력",
          description: "테마 전환 버튼 노출 여부입니다.",
        },
        showSwaggerButton: {
          label: "Swagger 버튼 출력",
          description: "Swagger 문서 버튼 노출 여부입니다.",
        },
        showNoticeMenu: {
          label: "공지 사항 출력",
          description: "사용자 메뉴와 모바일 설정의 공지 사항 노출 여부입니다.",
        },
        showPrivacyMenu: {
          label: "개인정보 처리 방침 출력",
          description: "개인정보 처리 방침 메뉴 노출 여부입니다.",
        },
        showTermsMenu: {
          label: "이용 약관 출력",
          description: "이용 약관 메뉴 노출 여부입니다.",
        },
        showPersonalizationMenu: {
          label: "개인화 출력",
          description: "기존 개인화 메뉴 노출 여부입니다.",
        },
        showPlaygroundMenu: {
          label: "플레이그라운드 출력",
          description: "Playground 진입 버튼과 메뉴 노출 여부입니다.",
        },
        showLogoutButton: {
          label: "로그아웃 버튼 출력",
          description: "로그아웃 버튼 노출 여부입니다.",
        },
      },
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
    legal: {
      updatedAt: "시행일: 2026.05.18",
      privacy: {
        eyebrow: "Privacy",
        title: "개인정보처리방침",
        description:
          "DS Assistant는 서비스 제공에 필요한 최소한의 개인정보를 안전하게 처리합니다.",
        sections: [
          {
            title: "1. 수집하는 개인정보",
            body: "서비스 인증, 대화 이력 제공, 오류 대응을 위해 계정 식별 정보, 접속 환경, 서비스 이용 기록, 첨부 파일 메타데이터를 처리할 수 있습니다.",
          },
          {
            title: "2. 개인정보 이용 목적",
            body: "사용자 인증, 대화 서비스 제공, 보안 점검, 장애 분석, 고객 문의 대응 및 서비스 품질 개선 목적으로 이용합니다.",
          },
          {
            title: "3. 보관 및 파기",
            body: "개인정보는 목적 달성 후 내부 정책과 관련 법령에 따라 지체 없이 파기하며, 필요한 경우 법령상 보관 기간 동안만 분리 보관합니다.",
          },
          {
            title: "4. 제3자 제공 및 위탁",
            body: "법령에 따른 경우를 제외하고 사용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 위탁이 필요한 경우 목적과 범위를 명확히 고지합니다.",
          },
          {
            title: "5. 이용자의 권리",
            body: "사용자는 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있으며, 회사는 본인 확인 후 관련 법령에 따라 처리합니다.",
          },
          {
            title: "6. 안전성 확보 조치",
            body: "접근 권한 관리, 암호화, 접속 기록 점검, 보안 업데이트 등 개인정보 보호를 위한 기술적·관리적 조치를 적용합니다.",
          },
        ],
      },
      terms: {
        eyebrow: "Terms",
        title: "이용 약관",
        description:
          "DS Assistant 이용 전 서비스 이용 조건과 사용자 책임을 확인해 주세요.",
        agreeLabel: "이용 약관 내용을 확인했으며 동의합니다.",
        sections: [
          {
            title: "1. 목적",
            body: "본 약관은 DS Assistant 서비스 이용과 관련하여 회사와 이용자 사이의 권리, 의무 및 책임 사항을 정하는 것을 목적으로 합니다.",
          },
          {
            title: "2. 서비스 이용",
            body: "이용자는 인증 절차를 완료한 뒤 서비스를 사용할 수 있으며, 회사는 운영상 필요한 경우 서비스의 일부를 변경하거나 제한할 수 있습니다.",
          },
          {
            title: "3. 이용자 의무",
            body: "이용자는 타인의 권리를 침해하거나 서비스 안정성을 해치는 행위를 해서는 안 되며, 계정과 접속 권한을 안전하게 관리해야 합니다.",
          },
          {
            title: "4. 생성 콘텐츠",
            body: "AI 응답은 참고 자료로 제공되며, 중요한 의사결정에는 사용자의 검토와 확인이 필요합니다. 이용자는 입력한 정보와 활용 결과에 대한 책임을 집니다.",
          },
          {
            title: "5. 서비스 제한",
            body: "보안 위협, 비정상 이용, 법령 또는 약관 위반이 확인되는 경우 회사는 서비스 이용을 제한할 수 있습니다.",
          },
          {
            title: "6. 약관 변경",
            body: "회사는 필요한 경우 약관을 변경할 수 있으며, 중요한 변경 사항은 서비스 화면 또는 별도 공지로 안내합니다.",
          },
        ],
      },
    },
  },
  en: {
    systemSettings: {
      eyebrow: "System",
      title: "App behavior settings",
      description:
        "Manage visible screens, API usage, and mobile thresholds in one place. Changes are saved when you apply them and affect the next screen behavior immediately.",
      close: "Close",
      apply: "Apply",
      authModeChangeLogoutConfirm:
        "The authentication mode has changed, so your current login state will be cleared. You will need to sign in again after applying. Continue?",
      logoutRequiredSettingChangeConfirm:
        "The conversation URL mode or authentication mode has changed, so your current login state will be cleared. You will need to sign in again after applying. Continue?",
      tabsLabel: "System settings categories",
      tabs: {
        common: "Common",
        pc: "PC",
        mobile: "Mobile",
      },
      groups: {
        platformResponsive: "Platform / responsive",
        api: "API",
        auth: "Authentication",
        mobile: "Mobile",
        bottomSheet: "Bottom Sheet",
        chat: "Chat",
        action: "User actions",
        menu: "User menu",
      },
      items: {
        useRealApi: {
          label: "Use real API",
          description: "Turn this off to use frontend mock data.",
        },

        webAuthMode: {
          label: "Web auth mode",
          description: "Select the authentication mode for desktop/web.",
        },
        mobileAuthMode: {
          label: "Mobile auth mode",
          description:
            "Select the authentication mode for mobile browser/WebView.",
        },
        webLoginUrl: {
          label: "Web login URL",
          description: "Login check or entry URL for web.",
        },
        mobileLoginUrl: {
          label: "Mobile login URL",
          description: "Login check or entry URL for mobile.",
        },
        tempLoginUrl: {
          label: "Temporary login URL",
          description: "Temporary login API URL for local testing.",
        },
        accessInfoUrl: {
          label: "Access info URL",
          description:
            "access/info URL used by the route guard and auth checks.",
        },
        logoutUrl: {
          label: "Logout URL",
          description: "Logout request URL for session/JWT.",
        },
        jwtRefreshUrl: {
          label: "JWT refresh URL",
          description:
            "URL used to refresh an expired access token with a refresh token.",
        },
        jwtWithCredentials: {
          label: "Send JWT credentials",
          description: "Also send cookie credentials in JWT mode.",
        },
        mobileBreakpoint: {
          label: "Mobile breakpoint",
          description:
            "Switches to mobile layout when the browser width is at or below this value. Auto uses the system default breakpoint, while a forced platform automatically sets this value to 8888px. Allowed range: 400–9999px.",
        },
        platformOverride: {
          label: "Force platform",
          labelWithActual: "Force platform (Actual: {actual})",
          description:
            "Apply the selected platform branch logic even in a web browser. Auto uses the system default breakpoint, while a forced platform automatically sets the breakpoint to 8888px.",
        },
        keyboardMode: {
          label: "Keyboard mode",
          description:
            "Correction policy applied when the keyboard opens on main/chat screens.",
        },
        useVirtualKeyboard: {
          label: "Use keyboard correction",
          description:
            "Use visualViewport-based CSS correction in adjustResize mode.",
        },
        showVirtualKeyboardDebug: {
          label: "Virtual keyboard debug",
          description:
            "Show the test virtual keyboard button only in mobile mode.",
        },
        virtualKeyboardHeight: {
          label: "Virtual keyboard height",
          description:
            "Height in px for the debug virtual keyboard area. The default is 340px for Android Chrome checks.",
        },
        useMicrophone: {
          label: "Use microphone",
          description:
            "Controls whether the voice button is shown in the prompt input.",
        },
        showPcProgress: {
          label: "PC ProgressBar",
          description:
            "Allow full-screen ProgressBar display on PC platforms when code explicitly requests progress. This uses actual/forced platform, not viewport width.",
        },
        showMobileProgress: {
          label: "Mobile ProgressBar",
          description:
            "Allow full-screen ProgressBar display on mobile platforms when code explicitly requests progress. Forced Android platform uses this setting even on PC.",
        },
        bottomSheetMinHeight: {
          label: "Minimum height",
          description:
            "Minimum height in px kept when the mobile bottom sheet is collapsed.",
        },
        bottomSheetMaxHeight: {
          label: "Maximum height",
          description:
            "Maximum height in px when the mobile bottom sheet expands.",
        },
        autoScrollOnAnswer: {
          label: "Auto scroll",
          description:
            "Automatically scroll to the bottom while answers arrive.",
        },
        conversationUrlMode: {
          label: "Conversation URL mode",
          description:
            "Choose whether normal chat URLs expose the chatId or stay on /chat. Hidden mode returns to the chat main screen after refresh.",
        },
        showMermaidHeader: {
          label: "Show Mermaid header",
          description:
            "Controls the title and copy/SVG/code buttons above Mermaid diagrams.",
        },
        enableMermaidRendering: {
          label: "Enable Mermaid rendering",
          description:
            "Render Mermaid code blocks as SVG diagrams. When disabled, they are shown as normal code blocks.",
        },
        pcShowMermaidHeader: {
          label: "Show PC Mermaid header",
          description:
            "Controls the title and copy/SVG/code buttons above Mermaid diagrams on PC.",
        },
        pcEnableMermaidRendering: {
          label: "Enable PC Mermaid rendering",
          description:
            "Render Mermaid code blocks as SVG diagrams on PC. When disabled, they are shown as normal code blocks.",
        },
        mobileShowMermaidHeader: {
          label: "Show mobile Mermaid header",
          description:
            "Controls the title and copy/SVG/code buttons above Mermaid diagrams on mobile.",
        },
        mobileEnableMermaidRendering: {
          label: "Enable mobile Mermaid rendering",
          description:
            "Render Mermaid code blocks as SVG diagrams on mobile. When disabled, they are shown as normal code blocks.",
        },
        historyLazyChunkSize: {
          label: "History message load count",
          description:
            "Number of messages rendered at once when entering or prepending a large history chat.",
        },
        historyLazyTopThreshold: {
          label: "History top load threshold (PC only)",
          description:
            "ScrollTop threshold in px that triggers automatic previous-history loading on PC. This does not apply to the Android button-based mode.",
        },
        pcHistoryLazyInitialCount: {
          label: "PC initial render count",
          description:
            "Number of latest messages rendered first when entering a normal PC chat room.",
        },
        pcHistoryLazyAppendCount: {
          label: "PC append render count",
          description:
            "Number of previous messages appended when scrolling near the top in a normal PC chat room.",
        },
        pcHistoryLazyTopThresholdPx: {
          label: "PC top load trigger distance (px)",
          description:
            "ScrollTop distance in px that triggers automatic previous-message rendering on PC.",
        },
        mobileHistoryLazyInitialCount: {
          label: "Mobile initial render count",
          description:
            "Number of latest messages rendered first when entering a mobile chat room.",
        },
        mobileHistoryLazyAppendCount: {
          label: "Mobile append render count",
          description:
            "Number of previous messages appended when tapping the mobile load-previous button.",
        },
        abortChatOnMobileBackground: {
          label: "End chat on mobile background",
          description:
            "Try to abort an in-progress answer request when a mobile browser moves to the background.",
        },
        showGuideButton: {
          label: "Show guide button",
          description:
            "Controls guide entry buttons in the header and mobile settings.",
        },
        showThemeButton: {
          label: "Show theme button",
          description: "Controls whether the theme switch button is shown.",
        },
        showSwaggerButton: {
          label: "Show Swagger button",
          description:
            "Controls whether the Swagger documentation button is shown.",
        },
        showNoticeMenu: {
          label: "Show notices",
          description:
            "Controls notice menu visibility in user menu and mobile settings.",
        },
        showPrivacyMenu: {
          label: "Show privacy policy",
          description: "Controls privacy policy menu visibility.",
        },
        showTermsMenu: {
          label: "Show terms",
          description: "Controls terms menu visibility.",
        },
        showPersonalizationMenu: {
          label: "Show personalization",
          description: "Controls existing personalization menu visibility.",
        },
        showPlaygroundMenu: {
          label: "Show Playground",
          description: "Controls Playground entry buttons and menu visibility.",
        },
        showLogoutButton: {
          label: "Show logout button",
          description: "Controls whether the logout button is shown.",
        },
      },
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
    legal: {
      updatedAt: "Effective date: 2026.05.18",
      privacy: {
        eyebrow: "Privacy",
        title: "Privacy Policy",
        description:
          "DS Assistant processes only the minimum personal information needed to provide the service safely.",
        sections: [
          {
            title: "1. Information we process",
            body: "We may process account identifiers, access environment data, service usage records, and attachment metadata for authentication, chat history, troubleshooting, and security.",
          },
          {
            title: "2. Purpose of use",
            body: "Information is used for user authentication, chat service delivery, security checks, incident analysis, support, and service quality improvement.",
          },
          {
            title: "3. Retention and deletion",
            body: "Personal information is deleted after the purpose is fulfilled, except where retention is required by internal policy or applicable law.",
          },
          {
            title: "4. Sharing and outsourcing",
            body: "We do not provide personal information to third parties without consent unless required by law. Any necessary outsourcing will be clearly disclosed.",
          },
          {
            title: "5. User rights",
            body: "Users may request access, correction, deletion, or suspension of processing, and requests will be handled after identity verification under applicable law.",
          },
          {
            title: "6. Security measures",
            body: "We apply technical and administrative safeguards such as access control, encryption, log review, and security updates.",
          },
        ],
      },
      terms: {
        eyebrow: "Terms",
        title: "Terms of Service",
        description:
          "Please review the service conditions and user responsibilities before using DS Assistant.",
        agreeLabel: "I have read and agree to the Terms of Service.",
        sections: [
          {
            title: "1. Purpose",
            body: "These terms define the rights, obligations, and responsibilities between the company and users regarding DS Assistant.",
          },
          {
            title: "2. Service use",
            body: "Users may use the service after authentication, and the company may change or restrict parts of the service when operationally necessary.",
          },
          {
            title: "3. User obligations",
            body: "Users must not infringe the rights of others or disrupt service stability and must securely manage their account and access rights.",
          },
          {
            title: "4. Generated content",
            body: "AI responses are provided as references. Important decisions require user review and verification, and users are responsible for their inputs and use of outputs.",
          },
          {
            title: "5. Service restrictions",
            body: "The company may restrict service use when security threats, abnormal use, or violations of laws or these terms are identified.",
          },
          {
            title: "6. Changes to terms",
            body: "The company may revise these terms when necessary, and important changes will be announced through the service screen or separate notice.",
          },
        ],
      },
    },
  },
};
