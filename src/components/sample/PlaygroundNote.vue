<template>
  <section class="card">
    <div class="card-head">
      <div class="card-title">Note Playground</div>
      <div class="card-sub">Note 페이지</div>
    </div>
    <div class="btn-row btn-container">
      <button class="btn btn-primary" @click="showNote('success')">
        success
      </button>
      |
      <button class="btn btn-ghost" @click="showNote('error')">error</button> |
      <button class="btn btn-danger" @click="showNote('warning')">
        warning</button
      >| <button class="btn btn-danger" @click="showNote('info')">info</button>|
      <button class="btn btn-danger" @click="showNote('progress')">
        progress</button
      >| <button class="btn btn-danger" @click="showNote('link')">link</button>|
    </div>
  </section>
</template>

<script>
import { useNote } from "@/composables/useNote";
import LinkNote from "@/components/note/LinkNote";
import ProgressNote from "@/components/note/ProgressNote";

export default {
  name: "PlaygroundStorage",

  props: {
    bpLabel: { type: String, default: "md" },
    width: { type: Number, default: 1200 },
  },

  methods: {
    showNote(type) {
      const { addNote } = useNote();
      if (type === "link") {
        addNote({
          component: LinkNote,
          props: {
            type: "info",
            title: "업로드 완료",
            content: "파일 업로드가 완료되었습니다.",
            href: "https://example.com/files",
            linkText: "파일 확인",
          },
        });
      } else if (type === "progress") {
        addNote({
          component: ProgressNote,
          props: {
            type: "warning",
            title: "업로드 중",
            percent: 42,
            duration: 5000, // 5초 후 자동 종료
          },
        });
      } else {
        addNote({
          type: type,
          title: "복사 완료",
          content: "클립보드에 복사되었습니다.",
        });
      }
    },
  },
};
</script>
