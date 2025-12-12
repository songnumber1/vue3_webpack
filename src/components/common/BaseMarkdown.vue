<template>
  <div class="markdown-body" v-html="rendered"></div>
</template>

<script>
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return (
        '<pre class="hljs"><code>' +
        hljs.highlight(code, { language: lang }).value +
        "</code></pre>"
      );
    }
    return (
      '<pre class="hljs"><code>' +
      md.utils.escapeHtml(code) +
      "</code></pre>"
    );
  }
});

export default {
  name: "BaseMarkdown",
  props: {
    content: {
      type: String,
      default: ""
    }
  },
  computed: {
    rendered() {
      return md.render(this.content || "");
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basemarkdown.scss";
</style>
