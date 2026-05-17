import {CHAT_STREAM_STATE} from './chatStreamState';
import {createStreamAbortManager} from './streamAbortManager';
import {createStreamMessageBuffer} from './streamMessageBuffer';

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createMockChatStream(options = {}) {
  const abortManager = createStreamAbortManager();
  const buffer = createStreamMessageBuffer();
  let state = CHAT_STREAM_STATE.IDLE;
  let error = null;

  function setState(nextState) {
    state = nextState;
    options.onStateChange?.(nextState);
  }

  async function start({text, onChunk, delay = 9}) {
    abortManager.reset();
    buffer.reset();
    error = null;
    setState(CHAT_STREAM_STATE.SUBMITTING);

    try {
      setState(CHAT_STREAM_STATE.STREAMING);
      const source = String(text || '');
      for (let index = 1; index <= source.length; index += 1) {
        if (abortManager.isAborted()) {
          setState(CHAT_STREAM_STATE.ABORTED);
          return {state, text: buffer.getText(), aborted: true};
        }
        buffer.replace(source.slice(0, index));
        onChunk?.(buffer.getText());
        await wait(delay);
      }
      setState(CHAT_STREAM_STATE.COMPLETED);
      return {state, text: buffer.getText(), aborted: false};
    } catch (caughtError) {
      error = caughtError;
      setState(CHAT_STREAM_STATE.ERROR);
      throw caughtError;
    }
  }

  function abort(reason) {
    abortManager.abort(reason);
  }

  function getState() {
    return state;
  }

  function getError() {
    return error;
  }

  return {start, abort, getState, getError};
}
