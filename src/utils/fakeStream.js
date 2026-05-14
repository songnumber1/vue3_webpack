/**
 * @file fakeStream.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

export function streamText(text, onChunk, options = {}) {
  const delay = options.delay ?? 14;
  let index = 0;

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      index += 1;
      onChunk(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, delay);
  });
}
