import {normalizeMessageId} from "@/utils/normalize";

export function getElementOffsetTopWithinScroll(element, container) {
  if (!element || !container) return 0;

  const containerRect = container.getBoundingClientRect?.();
  const elementRect = element.getBoundingClientRect?.();
  if (containerRect && elementRect) {
    return container.scrollTop + elementRect.top - containerRect.top;
  }

  let top = 0;
  let current = element;
  while (current && current !== container) {
    top += Number(current.offsetTop || 0);
    current = current.offsetParent;
  }
  return top;
}

export function findMessageElementById(container, messageId) {
  const targetId = normalizeMessageId(messageId);
  if (!container || !targetId) return null;

  const nodes = container.querySelectorAll?.("[data-message-id]") || [];
  for (const node of nodes) {
    if (String(node?.getAttribute?.("data-message-id") || "") === targetId) {
      return node;
    }
  }
  return null;
}

export function getFirstMessageElement(container) {
  return container?.querySelector?.("[data-message-id]") || null;
}
