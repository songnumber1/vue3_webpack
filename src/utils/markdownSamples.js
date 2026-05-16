/**
 * @file markdownSamples.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {logWarn} from "@/utils/logger";

export async function loadMarkdownShowcase() {
  try {
    const response = await fetch("/samples/markdown-showcase.md", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    logWarn("Failed to load markdown showcase file.", error);
    return "# Markdown 샘플 로드 실패\n\n`public/samples/markdown-showcase.md` 파일을 확인해주세요.";
  }
}
