<template>
  <div class="container">
    <h2>Bridge Test Page</h2>

    <!-- GET USER -->
    <div class="card">
      <h3>GET_USER</h3>
      <input v-model.number="userId" type="number" placeholder="User ID" />
      <button @click="handleGetUser">실행</button>
    </div>

    <!-- LOGIN -->
    <div class="card">
      <h3>LOGIN</h3>
      <input v-model="username" placeholder="username" />
      <input v-model="password" type="password" placeholder="password" />
      <button @click="handleLogin">실행</button>
    </div>

    <!-- 결과 -->
    <div class="result">
      <h3>결과</h3>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {callNative} from "@/bridge/bridgeClient";

const userId = ref(1);
const username = ref("admin");
const password = ref("1234");

const result = ref("");

// GET USER
const handleGetUser = async () => {
  result.value = "Loading...";

  try {
    const res = await callNative("GET_USER", {
      id: userId.value,
    });

    result.value = JSON.stringify(res, null, 2);
  } catch (e) {
    result.value = "ERROR: " + e.message;
  }
};

// LOGIN
const handleLogin = async () => {
  result.value = "Loading...";

  try {
    const res = await callNative("LOGIN", {
      username: username.value,
      password: password.value,
    });

    result.value = JSON.stringify(res, null, 2);
  } catch (e) {
    result.value = "ERROR: " + e.message;
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 600px;
  margin: auto;
}

.card {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
}

input {
  display: block;
  margin-bottom: 8px;
  padding: 6px;
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
}
</style>
