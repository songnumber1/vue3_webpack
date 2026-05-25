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
  // 인입된 가장 최신의 전체 누적 문자열 값을 보관하는 렌더링 버퍼 포인터
  let latestValue = "";
  // 화면(Store) 레이어에 실제 반영 처리가 완료된 문자열 상태 스냅샷
  let committedValue = "";
  // 마이크로태스크 큐(Microtask Queue)에 커밋 배치 작업이 이미 예약되어 대기 중인지 여부를 나타내는 플래그
  let scheduled = false;
  // 다중 비동기 이벤트를 순차적으로 정렬하고 스케줄링의 기준점이 되는 마이크로태스크용 프로미스 체인 오브젝트
  let chain = Promise.resolve();

  // schedule된 commit의 실제 실행부입니다. 최신값과 이미 반영한 값이 같으면 아무 작업도 하지 않습니다.
  const run = async () => {
    // 실제 렌더링 함수가 실행 단계로 진입했으므로 대기 플래그를 해제
    scheduled = false;

    // 들어온 최신 청크 값이 아예 없거나, 마지막으로 화면에 렌더링한 값과 토큰 싱크가 일치한다면 불필요한 재렌더링 방지를 위해 즉각 탈출
    if (!latestValue || latestValue === committedValue) return;

    // 비동기 렌더링 도중(await 기간)에 상위 스코프의 `latestValue`가 새로 인입되어 오염되는 현상을 차단하기 위해 현재 시점의 값을 로컬 동기 상수에 스냅샷 복사
    const valueToCommit = latestValue;
    // 동기 마킹: 이번 회차에 스토어로 내보낼 타깃 문자열을 반영 완료 상태로 미리 지정
    committedValue = valueToCommit;

    // 주입받은 전역 UI/Store 바인딩 콜백 래퍼를 호출하여 실질적인 Vue 마크다운 렌더링 업데이트 트래킹 연산 가동
    await onChunk?.(valueToCommit);

    // [중요 가드 - 레이스 컨디션 방어]: 콜백 함수가 실행(await)되는 도중에 백엔드 sse 파이프라인으로부터 또 다른 신규 청크 문자열이 밀려 들어왔을 경우, 유실 없는 완전 스냅샷 출력을 위해 추가 후속 스케줄링을 연쇄 실행
    if (latestValue !== committedValue) schedule();
  };

  // 동시에 여러 update가 들어와도 commit chain은 하나만 유지합니다.
  function schedule() {
    // 이미 이벤트 루프 마이크로태스크 버스에 run 함수가 예약 탑승되어 대기 중이라면, 중복 스케줄링을 전면 방어하고 기존 프로미스 체인 리턴
    if (scheduled) return chain;
    // 새로운 예약 가드 점등
    scheduled = true;
    // 이전 비동기 파이프라인에서 예외/에러가 발생했더라도 후속 스트리밍 텍스트가 정상 렌더링되도록 catch 블록을 대치한 뒤, 자바스크립트 마이크로태스크 경계면 후미에 run 태스크를 체이닝 결합
    chain = chain.catch(() => {}).then(run);
    return chain;
  }

  // SSE read loop에서 새 누적 문자열을 받을 때 호출합니다.
  function update(value) {
    // 인입된 최신 전체 누적값을 버퍼 메모리에 임시 하이드레이션
    latestValue = value || "";
    // 비동기 배치 압축 스케줄러 시퀀스 점화 호출
    return schedule();
  }

  // stream 완료/오류/abort 시점에 아직 반영되지 않은 마지막 값을 강제로 반영합니다.
  async function flush(value) {
    // 스트림 정상 종료 직전 최종 누락 본문 값이 파라미터로 직접 꽂힌 경우 최신 값으로 강제 앵커링 처리
    if (typeof value === "string") latestValue = value;

    // 더 이상의 루프 기반 자동 후속 예약 스케줄링이 작동하지 않도록 플래그 강제 차단 리셋
    scheduled = false;
    // 현재 마이크로태스크 큐 안에서 잔존 연산 처리를 밟고 진행 중이던 기존 프로미스 체인이 최종 세틀먼트(완료)될 때까지 대기
    await chain.catch(() => {});

    // 모든 비동기 스레드 체인이 완료된 직후 최종 진단: 아직 버퍼(`latestValue`)에 남아 있는 잔여 문자열이 실제 화면에 커밋된 값(`committedValue`)과 일치하지 않는 미반영 잔존 데이터가 포착되었다면 강제 동기화 실행
    if (latestValue && latestValue !== committedValue) {
      const valueToCommit = latestValue;
      committedValue = valueToCommit;
      // 스트림 라이프사이클의 최종 종착지 유실을 완전 방지하는 마지막 동기식 화면 업데이트 확정 커밋 집행
      await onChunk?.(valueToCommit);
    }
  }

  return {update, flush};
}
