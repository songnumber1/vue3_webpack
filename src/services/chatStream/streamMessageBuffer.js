export function createStreamMessageBuffer(initialText = '') {
  let currentText = String(initialText || '');

  function replace(text) {
    currentText = String(text || '');
    return currentText;
  }

  function append(chunk) {
    currentText += String(chunk || '');
    return currentText;
  }

  function getText() {
    return currentText;
  }

  function reset() {
    currentText = '';
  }

  return {replace, append, getText, reset};
}
