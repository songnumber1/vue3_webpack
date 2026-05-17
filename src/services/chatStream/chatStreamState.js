export const CHAT_STREAM_STATE = Object.freeze({
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  STREAMING: 'streaming',
  COMPLETED: 'completed',
  ABORTED: 'aborted',
  ERROR: 'error',
});

export function isActiveStreamState(state) {
  return state === CHAT_STREAM_STATE.SUBMITTING || state === CHAT_STREAM_STATE.STREAMING;
}
