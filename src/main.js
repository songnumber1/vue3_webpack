/**
 * @file main.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import {bootstrap} from "@/core/bootstrap";
import "@/assets/styles/index.css";
import {installWebViewCompat} from "@/utils/webviewCompat";

installWebViewCompat();
bootstrap();
