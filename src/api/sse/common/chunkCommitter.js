export function createChunkCommitter(onChunk) {
  let latestValue = "";

  let committedValue = "";

  let scheduled = false;

  let chain = Promise.resolve();

  const run = async () => {
    scheduled = false;

    if (!latestValue || latestValue === committedValue) return;

    const valueToCommit = latestValue;

    committedValue = valueToCommit;

    await onChunk?.(valueToCommit);

    if (latestValue !== committedValue) schedule();
  };

  function schedule() {
    if (scheduled) return chain;

    scheduled = true;

    chain = chain.catch(() => {}).then(run);
    return chain;
  }

  function update(value) {
    latestValue = value || "";

    return schedule();
  }

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
