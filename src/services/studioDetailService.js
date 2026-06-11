export async function getStudioDetail(studioId, fallbackStudio = null) {
  const id = String(studioId || "").trim();
  if (!id) throw new Error("studioId is required.");
  return fallbackStudio
    ? {...fallbackStudio, id: fallbackStudio.id || id}
    : null;
}

export async function deleteStudio(studioId) {
  const id = String(studioId || "").trim();
  if (!id) throw new Error("studioId is required.");
  return {ok: true, studioId: id};
}
