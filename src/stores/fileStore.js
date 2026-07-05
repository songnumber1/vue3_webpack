import {defineStore} from "pinia";

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return Array.from(value);
}

function isImageAttachment(file) {
  return Boolean(
    file?.kind === "image" ||
      file?.type?.startsWith?.("image/") ||
      /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(file?.name || "")
  );
}

export const useFileStore = defineStore("file", {
  state: () => ({
    tempImgFile: null,
    tempFileList: [],
    messageFileList: [],
    chatImageList: [],
    regFileList: [],
    fileFlag: false,
    isUploading: false,
  }),
  getters: {
    hasTempFiles: (state) => state.tempFileList.length > 0,
  },
  actions: {
    setTempImgFile(file = null) {
      this.tempImgFile = file || null;
    },
    setTempFileList(files = []) {
      this.tempFileList = toArray(files);
      this.syncTempImgFile();
      this.fileFlag = this.tempFileList.length > 0;
    },
    addTempFiles(files = []) {
      const nextFiles = toArray(files);
      if (!nextFiles.length) return;
      this.setTempFileList([...this.tempFileList, ...nextFiles]);
    },
    removeTempFile(idOrIndex) {
      if (typeof idOrIndex === "number") {
        this.setTempFileList(this.tempFileList.filter((_, index) => index !== idOrIndex));
        return;
      }
      this.setTempFileList(
        this.tempFileList.filter((file) => file?.id !== idOrIndex)
      );
    },
    clearTempFiles() {
      this.tempImgFile = null;
      this.tempFileList = [];
      this.fileFlag = false;
    },
    syncTempImgFile() {
      this.tempImgFile = this.tempFileList.find(isImageAttachment) || null;
    },
    setMessageFileList(files = []) {
      this.messageFileList = toArray(files);
    },
    setChatImageList(files = []) {
      this.chatImageList = toArray(files);
    },
    setRegFileList(files = []) {
      this.regFileList = toArray(files);
    },
    setFileFlag(value) {
      this.fileFlag = Boolean(value);
    },
    setIsUploading(value) {
      this.isUploading = Boolean(value);
    },
  },
});
