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
