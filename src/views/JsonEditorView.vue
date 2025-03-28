<template>
  <div style="padding: 10px">
    <h3>Redgoose JSON Editor</h3>
    <div
      class="editor-wrapper editor-scroll-box"
      ref="editorContainer"
      style="height: 220px"
    ></div>
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

    wrap.addEventListener(
      "context",
      ({detail: {body, node, type, isRoot, $}}) => {
        console.log(body, node, type);
        if (isRoot) {
          // ✅ 메뉴를 살짝 아래로 이동 (예: 10px)
          const $ol = $(body).find("ol");
          const currentTop = parseInt($ol.css("top") || "0", 10);
          $ol.css("top", `${currentTop + 11}px`);
        } else {
          const menu = body;

          // ✅ 외부 클릭 감지 핸들러
          const handleOutsideClick = (e) => {
            //menu.style.display = "none";
            console.log(e);
            menu.remove();
            document.removeEventListener("mousedown", handleOutsideClick);
          };

          setTimeout(() => {
            document.addEventListener("mousedown", handleOutsideClick);
          }, 10);
        }
      }
    );
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
