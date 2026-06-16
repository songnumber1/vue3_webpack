export function waitAnimationFrame() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

export async function waitAnimationFrames(count = 1) {
  for (let index = 0; index < count; index += 1) {
    await waitAnimationFrame();
  }
}
