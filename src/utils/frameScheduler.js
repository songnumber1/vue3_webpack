export function waitAnimationFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

export async function waitAnimationFrames(count = 1) {
  const safeCount = Math.max(1, Number(count) || 1);
  for (let index = 0; index < safeCount; index += 1) {
    await waitAnimationFrame();
  }
}

export function requestDoubleAnimationFrame(callback) {
  return window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => callback?.());
  });
}
