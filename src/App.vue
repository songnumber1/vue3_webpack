<template>
  <div class="container">
    <div class="card">
      <div class="row" style="justify-content: space-between">
        <div>
          <div style="font-size: 18px; font-weight: 800">
            Markdown + Mermaid Dual Render
          </div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 4px">
            completed 모드에서만 rehype-mermaid + runtime mermaid를 실행합니다.
          </div>
        </div>
        <div class="row">
          <span class="badge">isCompleted: { isCompleted }</span>
          <span class="badge">lineNumbers: { showLineNumbers }</span>
        </div>
      </div>

      <div style="margin-top: 12px">
        <textarea v-model="content" spellcheck="false"></textarea>
      </div>

      <div class="row" style="margin-top: 12px">
        <button
          :class="isCompleted ? 'primary' : 'secondary'"
          @click="isCompleted = !isCompleted"
        >
          Toggle Completed
        </button>
        <button class="secondary" @click="showLineNumbers = !showLineNumbers">
          Toggle Line Numbers
        </button>
        <button class="secondary" @click="loadSample">Load Sample</button>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
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

const SAMPLE =
  "일반 텍스트\n\n" +
  "수식: $a^2 + b^2 = c^2$\n\n" +
  "| colA | colB |\n" +
  "|---|---|\n" +
  "| 1 | 2 |\n" +
  "| 3 | 4 |\n\n" +
  "```mermaid\n" +
  "flowchart TD\n" +
  "    A[Christmas] -->|Get money| B(Go shopping)\n" +
  "    B --> C{Let me think}\n" +
  "    C -->|One| D[Laptop]\n" +
  "    C -->|Two| E[iPhone]\n" +
  "    C -->|Three| F[fa:fa-car Car]\n" +
  "```\n\n" +
  "```mermaid\n" +
  "mindmap\n" +
  "  root((mindmap))\n" +
  "    Origins\n" +
  "      Long history\n" +
  "      ::icon(fa fa-book)\n" +
  "      Popularisation\n" +
  "        British popular psychology author Tony Buzan\n" +
  "    Research\n" +
  "      On effectiveness<br/>and features\n" +
  "      On Automatic creation\n" +
  "        Uses\n" +
  "            Creative techniques\n" +
  "            Strategic planning\n" +
  "            Argument mapping\n" +
  "    Tools\n" +
  "      Pen and paper\n" +
  "      Mermaid\n" +
  "```\n\n" +
  "```mermaid\n" +
  "classDiagram\n" +
  "    Animal <|-- Duck\n" +
  "    Animal <|-- Fish\n" +
  "    Animal <|-- Zebra\n" +
  "    Animal : +int age\n" +
  "    Animal : +String gender\n" +
  "    Animal: +isMammal()\n" +
  "    Animal: +mate()\n" +
  "    class Duck{\n" +
  "      +String beakColor\n" +
  "      +swim()\n" +
  "      +quack()\n" +
  "    }\n" +
  "    class Fish{\n" +
  "      -int sizeInFeet\n" +
  "      -canEat()\n" +
  "    }\n" +
  "    class Zebra{\n" +
  "      +bool is_wild\n" +
  "      +run()\n" +
  "    }\n" +
  "```\n";

export default {
  name: "App",
  components: { Markdown },
  data() {
    return {
      content: SAMPLE,
      isCompleted: true,
      showLineNumbers: true,
    };
  },
  methods: {
    loadSample() {
      this.content = SAMPLE;
      this.isCompleted = true;
    },
  },
};
</script>
