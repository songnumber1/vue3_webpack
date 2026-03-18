<template>
    <div style="display:flex; height:100vh;">

        <!-- 좌측 -->
        <div style="width:50%; padding:10px;">
            <h3>JSON 입력</h3>

            <div>
                <button v-for="key in keys" :key="key" @click="load(key)">
                    {{ key }}
                </button>
            </div>

            <textarea v-model="jsonText" style="width:100%; height:300px;"></textarea>

            <button @click="render">렌더링</button>
        </div>

        <!-- 우측 -->
        <div style="width:50%; padding:10px;">
            <h3>렌더링 결과</h3>
            <div ref="container"></div>
        </div>

    </div>
</template>

<script>
import data from '../data/render.json'
import { createEngine } from '../render/RendererEngine.js'

export default {
    data() {
        return {
            jsonText: '',
            engine: null,
            keys: Object.keys(data)
        }
    },
    mounted() {
        this.engine = createEngine(this.$refs.container)
    },
    methods: {
        load(key) {
            this.jsonText = JSON.stringify(data[key], null, 2)
        },
        render() {
            try {
                const parsed = JSON.parse(this.jsonText)
                this.engine.render(parsed)
            } catch (e) {
                alert('JSON 형식 오류')
            }
        }
    }
}
</script>

<style>
.box {
    border: 1px solid #ddd;
    padding: 10px;
    margin-bottom: 10px;
}

.input {
    display: block;
    margin: 5px 0;
    padding: 5px;
}

.label {
    font-weight: bold;
    margin-top: 5px;
}

.select {
    margin-top: 5px;
}

.checkbox {
    margin-left: 5px;
}

.btn {
    padding: 6px 10px;
    background: #4caf50;
    color: white;
    border: none;
    cursor: pointer;
}
</style>