<template>
    <div class="playground">
        <h2>🔎 Search Snippet Playground (2 Line Clamp)</h2>

        <!-- 검색어 입력 -->
        <div class="control">
            <label>Keyword</label>
            <input v-model="keyword" />
        </div>

        <!-- 텍스트 입력 -->
        <div class="control">
            <label>Text</label>
            <textarea v-model="text" rows="4" />
        </div>

        <!-- 결과 영역 -->
        <div class="preview">
            <h3>Result</h3>

            <SearchSnippet :text="text" :keyword="keyword" />
        </div>
    </div>
</template>

<script>
import SearchSnippet from "@/components/sample/SearchSnippet.vue";

export default {
    name: "PlaygroundSearchSnippet",
    components: { SearchSnippet },

    data() {
        return {
            keyword: "search",
            text:
                "This is a very long example text that demonstrates how the search snippet system works. " +
                "If the keyword appears near the end of the sentence, it should align properly. " +
                "Let's test how the search behaves when the keyword search is near the end of the content.",
        };
    },
};
</script>

<style scoped>
.playground {
    padding: 40px;
    max-width: 600px;
    margin: auto;
    font-family: system-ui;
}

.control {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

input,
textarea {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 14px;
}

.preview {
    margin-top: 24px;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #ddd;
    background: #fafafa;
}
</style>
