
/**
 * [chunk commit scheduler]
 * SSE chunk가 너무 자주 들어오면 Vue render/markdown render가 과도하게 발생합니다.
 * 이 committer는 최신 누적 content만 보관하고 microtask/timeout 경계에서 onChunk를 호출해
 * 화면 업데이트 빈도를 완화합니다. flush()는 stream 완료 시 마지막 content 누락을 막습니다.
 */
/**
 * @file api/sse/common/chunkCommitter.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

/**
 * SSE chunk를 UI에 반영하는 빈도를 제어합니다.
 *
 * 서버는 매우 짧은 간격으로 token을 보낼 수 있지만, 매 token마다 Vue message와
 * markdown renderer를 갱신하면 모바일 Chrome/WebView에서 렌더 비용이 커집니다.
 * 이 committer는 항상 최신 누적 문자열만 보관하고, 이미 schedule된 commit이 있으면
 * 같은 Promise chain 안에서 마지막 값만 한 번 더 반영합니다.
 *
 * @param {(value: string) => Promise<void>|void} onChunk 누적 문자열을 화면/store에 반영하는 함수
 * @returns {{update: (value: string) => Promise<void>, flush: (value?: string) => Promise<void>}}
 */
export function createChunkCommitter(onChunk) {
  let latestValue = "";
  let committedValue = "";
  let scheduled = false;
  let chain = Promise.resolve();

  // schedule된 commit의 실제 실행부입니다. 최신값과 이미 반영한 값이 같으면 아무 작업도 하지 않습니다.
  const run = async () => {
    scheduled = false;

    if (!latestValue || latestValue === committedValue) return;

    const valueToCommit = latestValue;
    committedValue = valueToCommit;

    await onChunk?.(valueToCommit);

    if (latestValue !== committedValue) schedule();
  };

  // 동시에 여러 update가 들어와도 commit chain은 하나만 유지합니다.
  function schedule() {
    if (scheduled) return chain;
    scheduled = true;
    chain = chain.catch(() => {}).then(run);
    return chain;
  }

  // SSE read loop에서 새 누적 문자열을 받을 때 호출합니다.
  function update(value) {
    latestValue = value || "";
    return schedule();
  }

  // stream 완료/오류/abort 시점에 아직 반영되지 않은 마지막 값을 강제로 반영합니다.
  async function flush(value) {
    if (typeof value === "string") latestValue = value;

    scheduled = false;
    await chain.catch(() => {});

    if (latestValue && latestValue !== committedValue) {
      const valueToCommit = latestValue;
      committedValue = valueToCommit;
      await onChunk?.(valueToCommit);
    }
  }

  return {update, flush};
}
