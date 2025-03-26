<template>
  <div>
    <h3>Redgoose JSON Editor</h3>
    <div ref="editorContainer" style="height: 300px"></div>
    <button @click="printData">현재 데이터 콘솔 출력</button> <br />
    <button @click="exportData">export</button>
  </div>
</template>

<script>
import JsonEditor from "@redgoose/json-editor";

import "@redgoose/json-editor/css";

export default {
  name: "RedgooseJsonEditorFixed",
  data() {
    return {
      editor: null,
      jsonData: {
        id: 927,
        brand: "Dos Equis",
        alcohol: "3.6%",
      },
    };
  },
  mounted() {
    this.editor = new JsonEditor(this.$refs.editorContainer, {
      node: this.jsonData,
      edit: "all",
      theme: "light",
      live: true,
      preview: true,
    });

    const wrap = this.editor.el.wrap.get(0);

    wrap.addEventListener("update", ({detail}) => {
      this.onEditorUpdate(detail);
    });
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    printData() {
      try {
        // const updated = JSON.parse(JSON.stringify(this.editor.node));
        console.log("현재 JSON:", this.jsonData);
      } catch (e) {
        console.warn("데이터 추출 실패:", e);
      }
    },
    exportData() {},
    onEditorUpdate(data) {
      console.log("updated data", data, JSON.stringify(data));
      this.jsonData = data;
    },
  },
};
</script>
