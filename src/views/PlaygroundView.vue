<template>
  <div class="content">
    <div class="tabs">
      <button :class="{ active: tab === 'data' }" @click="tab = 'data'">
        Data
      </button>
      <button :class="{ active: tab === 'nav' }" @click="tab = 'nav'">
        Navigator
      </button>
      <button :class="{ active: tab === 'chart' }" @click="tab = 'chart'">
        Chart
      </button>
    </div>

    <div v-if="tab === 'data'">
      <h3>Data</h3>
      <p style="color: var(--muted)">
        여기에 JSON editor / table 등을 붙일 수 있습니다.
      </p>
      <pre
        style="
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--panel);
        "
      >
{
  "hello": "world",
  "theme": "{{ theme }}"
}
      </pre>
    </div>

    <div v-else-if="tab === 'nav'">
      <h3>Navigator</h3>
      <p style="color: var(--muted)">
        Vue Router / Nav 구조 테스트 영역입니다.
      </p>
    </div>

    <div v-else>
      <h3>Chart</h3>
      <p style="color: var(--muted)">Chart.js 등을 붙일 자리입니다.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tab: "data",
      theme: document.documentElement.getAttribute("data-theme") || "light",
    };
  },
};
</script>
