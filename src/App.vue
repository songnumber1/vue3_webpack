<template>
  <div class="container">
    <div class="card">
      <h2>Markdown + Mermaid (Runtime Only)</h2>

      <textarea v-model="content" spellcheck="false" />

      <div class="row">
        <button @click="isCompleted = !isCompleted">
          Toggle Completed ({{ isCompleted }})
        </button>
        <button @click="showLineNumbers = !showLineNumbers">
          Toggle Line Numbers
        </button>
      </div>
    </div>

    <div class="card">
      <Markdown
        :content="content"
        :isCompleted="isCompleted"
        :showLineNumbers="showLineNumbers"
      />
    </div>
  </div>
</template>

<script>
import Markdown from "@/components/Markdown.vue";
import "katex/dist/katex.min.css";

export default {
  name: "App",
  components: { Markdown },
  data() {
    return {
      isCompleted: true,
      showLineNumbers: true,
      content: `일반 텍스트

\`\`\`mermaid
flowchart TD
A -->
\`\`\`

\`\`\`mermaid
flowchart TD
A --> B
B --> C
\`\`\`
`,
    };
  },
};
</script>
