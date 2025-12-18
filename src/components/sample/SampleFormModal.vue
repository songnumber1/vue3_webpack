<template>
  <div class="sample-modal">
    <header class="header">
      <strong>샘플 폼</strong>
      <button class="close" @click="handleCancel">✕</button>
    </header>

    <section class="body">
      <label>
        이름
        <input v-model="name" placeholder="이름 입력" />
      </label>

      <label>
        설명
        <textarea v-model="desc" rows="3" placeholder="설명 입력" />
      </label>
    </section>

    <footer class="footer">
      <button class="btn ghost" @click="handleCancel">취소</button>
      <button class="btn primary" @click="handleConfirm">저장</button>
    </footer>
  </div>
</template>

<script>
export default {
  name: "SampleFormModal",

  props: {
    onConfirm: Function,
    onCancel: Function,
  },

  data() {
    return {
      name: "",
      desc: "",
    };
  },

  methods: {
    handleConfirm() {
      this.onConfirm?.({
        name: this.name,
        desc: this.desc,
      });
    },
    handleCancel() {
      this.onCancel?.();
    },
  },
};
</script>

<style scoped>
.sample-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
}

.close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  color: var(--text-muted);
}

input,
textarea {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
}

.btn.ghost {
  background: transparent;
  border: 1px solid var(--border);
}

.btn.primary {
  background: var(--accent);
  color: #fff;
  border: none;
}
</style>
