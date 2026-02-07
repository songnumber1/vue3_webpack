<template>
  <div class="messages">
    <component
      v-for="(m, i) in messages"
      :key="i"
      :is="resolveComponent(m.role)"
      :message="m"
      :render="render"
    />
  </div>
</template>

<script>
import ChatMessageUser from "./ChatMessageUser.vue";
import ChatMessageAssistant from "./ChatMessageAssistant.vue";
import { renderMarkdown, runMermaidWithin } from "@/utils/markdown";
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "ChatMessageList",

  components: {
    ChatMessageUser,
    ChatMessageAssistant,
  },

  computed: {
    store() {
      return useChatStore();
    },

    messages() {
      return this.store.messages;
    },
  },

  created() {
    // ✅ standalone-safe (works even when AppLayout is not mounted)
    this.store.ensureInitialized();
  },

  mounted() {
    this.$el?.addEventListener?.("click", this.onMdClick);
    this.refreshMermaid();
  },

  updated() {
    this.refreshMermaid();
  },

  beforeUnmount() {
    this.$el?.removeEventListener?.("click", this.onMdClick);
  },

  methods: {
    render(text) {
      return renderMarkdown(text);
    },

    resolveComponent(role) {
      return role === "user" ? "ChatMessageUser" : "ChatMessageAssistant";
    },

    async refreshMermaid() {
      // render after DOM update
      await this.$nextTick();
      await runMermaidWithin(this.$el);
    },

    async onMdClick(e) {
      const btn = e.target?.closest?.("[data-md-table]");
      if (!btn) return;

      const action = btn.getAttribute("data-md-table");
      const wrap = btn.closest(".md-table");
      const table = wrap?.querySelector?.("table");
      if (!table) return;

      const matrix = this.tableToMatrix(table);
      if (!matrix.length) return;

      if (action === "copy") {
        const tsv = matrix.map((row) => row.join("\t")).join("\n");
        await this.copyText(tsv);
      } else if (action === "csv") {
        const csv = this.matrixToCsv(matrix);
        this.downloadText(csv, `table-${Date.now()}.csv`, "text/csv;charset=utf-8");
      }
    },

    tableToMatrix(tableEl) {
      const rows = Array.from(tableEl.querySelectorAll("tr"));
      return rows
        .map((tr) =>
          Array.from(tr.querySelectorAll("th,td")).map((cell) =>
            (cell.innerText || "")
              .replace(/\r/g, "")
              .replace(/\n/g, " ")
              .trim()
          )
        )
        .filter((r) => r.length);
    },

    matrixToCsv(matrix) {
      const esc = (v) => {
        const s = String(v ?? "");
        const needs = /[",\n]/.test(s);
        const out = s.replace(/"/g, '""');
        return needs ? `"${out}"` : out;
      };
      return matrix.map((row) => row.map(esc).join(",")).join("\n");
    },

    async copyText(text) {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }
      } catch (_) {}
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (_) {}
      document.body.removeChild(ta);
    },

    downloadText(text, filename, mime) {
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },
};
</script>
