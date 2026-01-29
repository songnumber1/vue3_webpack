<template>
  <div class="note-default-content">
    {{ content }}
  </div>
</template>

<script>
export default {
  name: "NoteDefaultContent",
  props: {
    content: { type: String, default: "" },
  },
};
</script>
