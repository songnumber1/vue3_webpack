<template>
  <div class="container">
    <h2>Bridge Test Page</h2>
    <p class="summary">Windows/Web에서는 mock으로 실행되고, Android WebView에서는 AndroidBridge가 있으면 real bridge로 전달됩니다.</p>

    <div class="card">
      <h3>REST / Web API - GET_USER</h3>
      <input v-model.number="userId" type="number" placeholder="User ID" />
      <button @click="handleGetUser">실행</button>
    </div>

    <div class="card">
      <h3>JS → Android - GET_APP_VERSION</h3>
      <button @click="handleGetAppVersion">실행</button>
    </div>

    <div class="card">
      <h3>Android → JS - ON_PUSH_CLICK</h3>
      <input v-model="notificationId" placeholder="notificationId" />
      <input v-model="route" placeholder="route" />
      <button @click="handlePushClick">실행</button>
    </div>

    <div class="result">
      <h3>결과</h3>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {callNative, executeWebApi, receiveNativeEvent} from "@/bridge/bridgeClient";

const userId = ref(1);
const notificationId = ref("notice-1000");
const route = ref("/notice/1000");
const result = ref("");

const printResult = (value) => {
  result.value = JSON.stringify(value, null, 2);
};

const printError = (error) => {
  result.value = `ERROR: ${error.message}\n${JSON.stringify(error.response || {}, null, 2)}`;
};

const handleGetUser = async () => {
  result.value = "Loading...";

  try {
    printResult(await executeWebApi("GET_USER", {id: userId.value}));
  } catch (error) {
    printError(error);
  }
};

const handleGetAppVersion = async () => {
  result.value = "Loading...";

  try {
    printResult(await callNative("GET_APP_VERSION", {}));
  } catch (error) {
    printError(error);
  }
};

const handlePushClick = () => {
  result.value = "Loading...";

  try {
    printResult(receiveNativeEvent("ON_PUSH_CLICK", {
      notificationId: notificationId.value,
      route: route.value,
      payload: {
        type: "notice",
        id: notificationId.value,
      },
    }));
  } catch (error) {
    printError(error);
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 760px;
  margin: auto;
}

.summary {
  color: #555;
  line-height: 1.5;
}

.card {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
}

input {
  display: block;
  box-sizing: border-box;
  margin-bottom: 8px;
  padding: 8px;
  width: 100%;
}

button {
  padding: 6px 12px;
  cursor: pointer;
}

.result {
  background: #111;
  color: #0f0;
  padding: 10px;
  border-radius: 8px;
  overflow: auto;
}
</style>
