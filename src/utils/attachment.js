/**
 * @file utils/attachment.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createId} from "@/utils/id";

export function inferMimeType(name = "") {
  const normalized = name.toLowerCase();
  if (/\.png$/.test(normalized)) return "image/png";
  if (/\.(jpg|jpeg)$/.test(normalized)) return "image/jpeg";
  if (/\.gif$/.test(normalized)) return "image/gif";
  if (/\.webp$/.test(normalized)) return "image/webp";
  if (/\.bmp$/.test(normalized)) return "image/bmp";
  if (/\.(heic|heif)$/.test(normalized)) return "image/heic";

  return "";
}
export function isImageFile(file) {
  return Boolean(
    file?.type?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file?.name || "")
  );
}
export function createBrowserAttachment(file) {
  const image = isImageFile(file);
  const objectUrl = URL.createObjectURL(file);

  return {
    id: createId("attachment"),
    name: file.name || "첨부 파일",
    size: file.size || 0,
    type: file.type || inferMimeType(file.name) || "application/octet-stream",
    kind: image ? "image" : "file",
    url: objectUrl,
    previewUrl: objectUrl,
    dataUrl: "",
    previewError: false,
    file,
  };
}
export function createNativeAttachment(file) {
  const type =
    file.type || inferMimeType(file.name) || "application/octet-stream";

  return {
    id: createId("attachment"),
    name: file.name || "네이티브 첨부 파일",
    size: file.size || 0,
    type,
    kind: type.startsWith("image/") ? "image" : "file",
    url: file.uri || "",
    previewUrl: file.uri || "",
    dataUrl: "",
    previewError: false,
    nativeFile: file,
  };
}
export function revokeAttachmentUrl(attachment) {
  if (attachment?.url?.startsWith?.("blob:"))
    URL.revokeObjectURL(attachment.url);
}
export function imageAttachment(attachment, onHydrated) {
  const sourceFile = attachment?.file;
  if (!sourceFile || typeof FileReader === "undefined") return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = typeof reader.result === "string" ? reader.result : "";
    if (dataUrl) onHydrated?.(dataUrl);
  };
  reader.onerror = () => {
    attachment.previewError = true;
  };
  reader.readAsDataURL(sourceFile);
}
export function formatFileSize(size) {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
