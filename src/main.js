import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import {bootstrap} from "@/core/bootstrap";
import "@/assets/styles/index.css";
import {installWebViewCompat} from "@/utils/webviewCompat";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
installWebViewCompat();
bootstrap();
