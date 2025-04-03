<template>
  <div style="padding: 10px">
    <h3>Redgoose JSON Editor</h3>
    <div
      class="editor-wrapper editor-scroll-box"
      ref="editorContainer"
      style="height: 420px"
    ></div>
    <button @click="printData">현재 데이터 콘솔 출력</button> <br />
    <button @click="exportData">export</button> <br />
    <button @click="expandData">expand</button> <br />
    <button @click="collapseData">collapse</button> <br />
    <button @click="clearData">clear</button>
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
      wrap: null,
      handleContextEvent: null,
      jsonData: [
        [
          {
            userId: 1,
            id: 1,
            title:
              "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          },
          {
            userId: 1,
            id: 2,
            title: "qui est esse",
            body: "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
          },
          {
            userId: 1,
            id: 3,
            title:
              "ea molestias quasi exercitationem repellat qui ipsa sit aut",
            body: "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
          },
        ],
        [
          {
            userId: 1,
            id: 4,
            title: "eum et est occaecati",
            body: "ullam et saepe reiciendis voluptatem adipisci\nsit amet autem assumenda provident rerum culpa\nquis hic commodi nesciunt rem tenetur doloremque ipsam iure\nquis sunt voluptatem rerum illo velit",
          },
          {
            userId: 1,
            id: 5,
            title: "nesciunt quas odio",
            body: "repudiandae veniam quaerat sunt sed\nalias aut fugiat sit autem sed est\nvoluptatem omnis possimus esse voluptatibus quis\nest aut tenetur dolor neque",
          },
          {
            userId: 1,
            id: 6,
            title: "dolorem eum magni eos aperiam quia",
            body: "ut aspernatur corporis harum nihil quis provident sequi\nmollitia nobis aliquid molestiae\nperspiciatis et ea nemo ab reprehenderit accusantium quas\nvoluptate dolores velit et doloremque molestiae",
          },
          {
            userId: 1,
            id: 7,
            title: "magnam facilis autem",
            body: "dolore placeat quibusdam ea quo vitae\nmagni quis enim qui quis quo nemo aut saepe\nquidem repellat excepturi ut quia\nsunt ut sequi eos ea sed quas",
          },
        ],
      ],
    };
  },
  mounted() {
    this.initEditor();
  },
  beforeUnmount() {
    this.destroyEditor();
  },
  methods: {
    initEditor() {
      this.editor = new JsonEditor(this.$refs.editorContainer, {
        node: this.jsonData,
        edit: "all",
        theme: "light",
        live: true,
        preview: true,
      });

      this.wrap = this.editor.el.wrap.get(0);

      if (this.handleContextEvent) {
        this.wrap.removeEventListener("context", this.handleContextEvent);
      }

      // 새로운 context 이벤트 핸들러 정의 및 등록
      this.handleContextEvent = ({detail: {body, node, type, isRoot, $}}) => {
        if (isRoot) {
          const $ol = $(body).find("ol");
          const currentTop = parseInt($ol.css("top") || "0", 10);
          $ol.css("top", `${currentTop + 11}px`);
        }
      };

      this.wrap.addEventListener("context", this.handleContextEvent);
    },

    destroyEditor() {
      if (this.editor) {
        this.editor.destroy();
      }

      if (this.handleContextEvent && this.wrap) {
        this.wrap.removeEventListener("context", this.handleContextEvent);
        this.handleContextEvent = null;
      }
    },
    printData() {
      try {
        // const updated = JSON.parse(JSON.stringify(this.editor.node));
        console.log("현재 JSON:", this.jsonData);
      } catch (e) {
        console.warn("데이터 추출 실패:", e);
      }
    },
    exportData() {},
    expandData() {
      this.editor.el.wrap
        .get(0)
        .querySelectorAll("li.node")
        .forEach((el) => el.classList.add("open"));
    },
    collapseData() {
      this.editor.el.wrap
        .get(0)
        .querySelectorAll("li.node.open")
        .forEach((el) => el.classList.remove("open"));
    },
    clearData() {
      this.destroyEditor();

      this.jsonData = [];
      this.initEditor();
    },
    onEditorUpdate(data) {
      console.log("updated data", data, JSON.stringify(data));
      this.jsonData = data;
    },
  },
};
</script>

<style scoped>
.editor-wrapper {
  padding-top: 10px;
  padding-left: 5px;
  overflow: hidden;
  border: 1px solid #ccc;
}

.editor-scroll-box {
  height: 100%;
  overflow: auto;
}
</style>
