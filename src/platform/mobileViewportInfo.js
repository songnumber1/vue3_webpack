import {getViewportSize} from "@/platform/viewport/viewport";

export function resolveViewportInfo() {
  const size = getViewportSize();
  return {
    width: size.width,
    height: size.height,
    visualWidth: size.width,
    compactWidth: size.width,
  };
}
