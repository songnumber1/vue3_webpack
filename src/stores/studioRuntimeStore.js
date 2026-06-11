import {defineStore} from "pinia";

function normalizeId(id) {
  return String(id || "").trim();
}

export const useStudioRuntimeStore = defineStore("studioRuntime", {
  state: () => ({
    deletedStudioIds: [],
    pendingEditStudioId: "",
    pendingEditStudio: null,
  }),
  actions: {
    markStudioDeleted(studioId) {
      const id = normalizeId(studioId);
      if (!id || this.deletedStudioIds.includes(id)) return;
      this.deletedStudioIds = [...this.deletedStudioIds, id];
    },
    isStudioDeleted(studioId) {
      const id = normalizeId(studioId);
      return Boolean(id && this.deletedStudioIds.includes(id));
    },
    setPendingEditStudio(studio = null) {
      const id = normalizeId(studio?.id);
      this.pendingEditStudioId = id;
      this.pendingEditStudio = studio || null;
    },
    consumePendingEditStudio() {
      const payload = {
        studioId: this.pendingEditStudioId,
        studio: this.pendingEditStudio,
      };
      this.pendingEditStudioId = "";
      this.pendingEditStudio = null;
      return payload;
    },
  },
});
