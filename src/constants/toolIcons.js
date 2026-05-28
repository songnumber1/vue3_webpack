import mailIcon from "@/assets/img/tools/mail.svg";
import translateIcon from "@/assets/img/tools/translate.svg";
import summaryIcon from "@/assets/img/tools/summary.svg";
import codeIcon from "@/assets/img/tools/code.svg";

export const PROMPT_TEMPLATE_TOOL_ICONS = Object.freeze({
  mail: mailIcon,
  translate: translateIcon,
  summary: summaryIcon,
  code: codeIcon,
});

export function resolvePromptTemplateToolIcon(key) {
  return PROMPT_TEMPLATE_TOOL_ICONS[key] || "";
}
