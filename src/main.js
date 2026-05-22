import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import {bootstrap} from "@/core/bootstrap";
import "@/assets/styles/index.css";

if (process.env.NODE_ENV === "development") {
  import(
    /* webpackChunkName: "virtual-keyboard-debug-style" */
    "@/assets/styles/components/debug/virtual-keyboard-debug.css"
  );
}
import {installWebViewCompat} from "@/platform/browser/webviewCompat";

installWebViewCompat();
bootstrap();
