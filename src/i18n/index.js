import {createI18n} from "vue-i18n";

export const SUPPORT_LOCALES = ["ko", "en"];

export const messages = {
  ko: {
    app: {
      unsupportedTitle: "지원하지 않는 접속 환경입니다.",
      unsupportedMessage:
        "iOS 앱, iOS Chrome, iOS Safari에서는 접속할 수 없습니다.",
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
      logout: "로그아웃",
      theme: "테마",
      swagger: "Swagger 문서",
      settings: "설정",
      playground: "Playground",
      privacy: "개인정보처리방침",
      terms: "이용 약관",
      resize: "크기 조절",
      select: "선택",
    },
    clipboardNote: {
      title: "복사 완료",
      message: "클립보드에 복사되었습니다.",
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
      assistantSelected: "현재 선택된 어시스턴트",
      modelSelect: "모델 선택",
      modelReadonly: "대화방 모델은 변경할 수 없습니다.",
      tools: "도구",
      attachOptions: {
        camera: "카메라",
        image: "이미지",
        file: "파일",
      },
      hideSidebar: "사이드바 숨기기",
      collapsedSidebar: "접힌 사이드바",
      openSidebar: "사이드바 열기",
      newChat: "새 채팅",
      chatSearch: "채팅 검색",
      conversations: "대화",
      recentChats: "최근 채팅",
      startQuestion: "어디서부터 시작할까요?",
      sharedReadonly: "공유 받은 대화입니다.",
      readonlyInput: {
        deletedModelTitle: "삭제된 모델입니다.",
        deletedModelDesc:
          "이전 대화 내용은 확인할 수 있지만 새 메시지는 보낼 수 없습니다.",
        unavailableModelTitle: "사용할 수 없는 모델입니다.",
        unavailableModelDesc:
          "대화 이력은 열 수 있지만 모델 정보를 찾을 수 없어 새 메시지는 보낼 수 없습니다.",
        sharedDesc: "이 화면에서는 메시지를 입력하거나 전송할 수 없습니다.",
      },
      scrollBottom: "맨 아래로 이동",
      assistant: "Assistant",
      sharedConversationTitle: "공유 대화 {id}",
      promptPlaceholder: "무엇이든 물어보세요",
      send: "전송",
      voiceStart: "음성 입력 시작",
      voiceStop: "음성 입력 중지",
      attach: "첨부",
      suggestions: {
        image: "이미지 만들기",
        writing: "글쓰기 또는 편집",
        search: "필요한 항목 찾기",
        knowledgeSearch: "지식 검색",
        knowledge: {
          paper: "논문",
          confluence: "Confluence",
          jira: "Jira",
        },
        webSearch: "웹 검색",
        web: {
          perplexity: "퍼블렉시티",
          googleAiOverviews: "구글 AI 오버뷰",
          chatgptSearch: "오픈 AI 챗 GP",
          microsoftCopilot: "마이크로소프트 코파일럿",
        },
      },
      historyMenu: {
        title: "대화방 메뉴",
        pin: "즐겨찾기",
        unpin: "즐겨찾기 해지",
        rename: "제목 변경",
        share: "공유",
        delete: "삭제",
      },
      historyDialog: {
        deleteTitle: "대화방 삭제",
        renameTitle: "대화방 제목 변경",
        selectedConversation: "선택한 대화방",
        deleteMessage: "'{title}'을(를) 삭제하시겠습니까?",
        shareSelected: "공유 버튼을 선택했습니다.",
        titleField: "대화방 제목",
      },
      imagePreview: {
        loading: "이미지를 불러오는 중입니다...",
        error: "이미지를 미리보기로 표시할 수 없습니다.",
        close: "닫기",
        enlarge: "{name} 크게 보기",
      },
      attachment: {
        listLabel: "첨부 파일 목록",
        preview: "{name} 미리보기",
        remove: "{name} 제거",
      },
      reasoning: {
        thinking: "생각중입니다.",
        completed: "생각이 완료되었습니다.",
      },
    },
    prompt: {
      modelSelect: "모델 선택",
      attach: "첨부",
      modelReadonly: "대화방 모델은 변경할 수 없습니다.",
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
      playgroundSummary: "공통 UI와 플랫폼별 화면을 독립적으로 테스트합니다.",
      logoutSummary: "현재 세션을 종료하고 로그인 화면으로 이동합니다.",
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
      copyCode: "코드 복사",
      copyMermaid: "Mermaid 복사",
      regenerate: "답변 재생성",
      copyTableShort: "복사",
      downloadCsvShort: "CSV",
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
    loginRequired: {
      title: "임시 로그인",
      goHome: "홈페이지로 이동",
      tempLogin: "임시 로그인",
      loggingIn: "로그인 중...",
      retrySessionCheck: "세션 다시 확인",
      checkFailed: "세션 확인에 실패했습니다.",
      loginFailed: "임시 로그인에 실패했습니다.",
      reasons: {
        ACCESS_DENIED: "현재 계정으로는 해당 페이지에 접근할 수 없습니다.",
        USER_AGREE_REQUIRED: "서비스 이용 동의가 필요합니다.",
        AUTH_ERROR: "로그인 확인 중 오류가 발생했습니다.",
        LOGIN_REQUIRED: "서비스를 이용하려면 먼저 로그인해 주세요.",
      },
    },
    notFound: {
      title: "페이지를 찾을 수 없습니다.",
      description: "요청한 페이지가 존재하지 않거나 주소가 변경되었습니다.",
      goHome: "홈으로 이동",
      goBack: "이전 페이지",
    },
    androidUpdate: {
      label: "UPDATE REQUIRED",
      defaultTitle: "앱 업데이트가 필요합니다.",
      defaultMessage: "최신 버전으로 업데이트 후 다시 실행해 주세요.",
      currentVersion: "현재 버전",
      latestVersion: "최신 버전",
      doUpdate: "업데이트 진행",
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
        "iOS app, iOS Chrome, and iOS Safari are not supported.",
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
      logout: "Logout",
      theme: "Theme",
      swagger: "Swagger Docs",
      settings: "Settings",
      playground: "Playground",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      resize: "Resize",
      select: "Select",
    },
    clipboardNote: {
      title: "Copied",
      message: "Copied to clipboard.",
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
      assistantSelected: "Currently selected assistant",
      modelSelect: "Select model",
      modelReadonly: "The model for this chat cannot be changed.",
      tools: "Tools",
      attachOptions: {
        camera: "Camera",
        image: "Image",
        file: "File",
      },
      hideSidebar: "Hide sidebar",
      collapsedSidebar: "Collapsed sidebar",
      openSidebar: "Open sidebar",
      newChat: "New chat",
      chatSearch: "Search chats",
      conversations: "Chats",
      recentChats: "Recent chats",
      startQuestion: "Where should we start?",
      sharedReadonly: "This is a shared conversation.",
      readonlyInput: {
        deletedModelTitle: "This model has been deleted.",
        deletedModelDesc:
          "You can view this conversation, but you cannot send new messages.",
        unavailableModelTitle: "This model is unavailable.",
        unavailableModelDesc:
          "You can view this conversation, but model metadata is missing so new messages are blocked.",
        sharedDesc: "You cannot send messages from this screen.",
      },
      scrollBottom: "Scroll to bottom",
      assistant: "Assistant",
      sharedConversationTitle: "Shared chat {id}",
      promptPlaceholder: "Ask anything",
      send: "Send",
      voiceStart: "Start voice input",
      voiceStop: "Stop voice input",
      attach: "Attach",
      suggestions: {
        image: "Create image",
        writing: "Write or edit",
        search: "Find what you need",
        knowledgeSearch: "Knowledge search",
        knowledge: {
          paper: "Papers",
          confluence: "Confluence",
          jira: "Jira",
        },
        webSearch: "Web search",
        web: {
          perplexity: "Perplexity",
          googleAiOverviews: "Google AI Overviews",
          chatgptSearch: "ChatGPT Search",
          microsoftCopilot: "Microsoft Copilot",
        },
      },
      historyMenu: {
        title: "Chat menu",
        pin: "Add to favorites",
        unpin: "Remove from favorites",
        rename: "Rename",
        share: "Share",
        delete: "Delete",
      },
      historyDialog: {
        deleteTitle: "Delete chat",
        renameTitle: "Rename chat",
        selectedConversation: "selected chat",
        deleteMessage: "Delete '{title}'?",
        shareSelected: "Share was selected.",
        titleField: "Conversation title",
      },
      imagePreview: {
        loading: "Loading image...",
        error: "Unable to display image preview.",
        close: "Close",
        enlarge: "Enlarge {name}",
      },
      attachment: {
        listLabel: "Attached files",
        preview: "Preview {name}",
        remove: "Remove {name}",
      },
      reasoning: {
        thinking: "Thinking...",
        completed: "Thought completed.",
      },
    },
    prompt: {
      modelSelect: "Select model",
      attach: "Attach",
      modelReadonly: "The model for this chat cannot be changed.",
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
      playgroundSummary:
        "Test shared UI and platform-specific screens independently.",
      logoutSummary: "End the current session and go to the login screen.",
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
      copyCode: "Copy code",
      copyMermaid: "Copy Mermaid",
      regenerate: "Regenerate answer",
      copyTableShort: "Copy",
      downloadCsvShort: "CSV",
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
    loginRequired: {
      title: "Temporary login",
      goHome: "Go to home",
      tempLogin: "Temporary login",
      loggingIn: "Signing in...",
      retrySessionCheck: "Check session again",
      checkFailed: "Failed to check the session.",
      loginFailed: "Temporary login failed.",
      reasons: {
        ACCESS_DENIED: "Your account does not have access to this page.",
        USER_AGREE_REQUIRED: "You must agree to the terms of service.",
        AUTH_ERROR: "An error occurred while verifying login.",
        LOGIN_REQUIRED: "Please log in to use this service.",
      },
    },
    notFound: {
      title: "Page not found.",
      description:
        "The requested page does not exist or the address has changed.",
      goHome: "Go home",
      goBack: "Previous page",
    },
    androidUpdate: {
      label: "UPDATE REQUIRED",
      defaultTitle: "App update required.",
      defaultMessage: "Please update to the latest version and try again.",
      currentVersion: "Current version",
      latestVersion: "Latest version",
      doUpdate: "Update now",
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
export function setAppLocale(locale) {
  if (!SUPPORT_LOCALES.includes(locale)) return;
  i18n.global.locale.value = locale;
  if (typeof document !== "undefined") document.documentElement.lang = locale;
  if (typeof localStorage !== "undefined")
    localStorage.setItem("app-locale", locale);
}

setAppLocale(initialLocale);
