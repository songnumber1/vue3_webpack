<template>
  <div class="chart-card">
    <h3>{{ chartTitle }}</h3>
    <div class="chart-content">
      <canvas :ref="canvasRefName" height="300"></canvas>
      <div class="custom-legend">
        <div
          v-for="(item, i) in legendItems"
          :key="i"
          class="legend-item"
          @click="toggleDataset(i)"
          :class="{inactive: isDatasetHidden(i)}"
        >
          <span class="color-box" :style="{backgroundColor: item.color}"></span>
          {{ item.label }}
        </div>
      </div>
    </div>
    <button @click="createChart" :disabled="isDrawing">
      {{ isDrawing ? "그리는 중..." : "다시 그리기" }}
    </button>
  </div>
</template>

<script>
import {Chart, registerables} from "chart.js";
Chart.register(...registerables);

export default {
  props: {
    chartType: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      chart: null,
      isDrawing: false,
      legendItems: [],
    };
  },
  computed: {
    canvasRefName() {
      return `${this.chartType}Canvas`;
    },
    chartTitle() {
      const titles = {
        bar: "Bar Chart",
        line: "Line Chart",
        pie: "Pie Chart",
        doughnut: "Doughnut Chart",
        polarArea: "Polar Area Chart",
        "stacked-bar": "Stacked Bar Chart",
      };
      return titles[this.chartType] || "Chart";
    },
  },
  mounted() {
    this.createChart();
  },
  methods: {
    isDatasetHidden(index) {
      const meta = this.chart?.getDatasetMeta(index);
      return meta?.hidden;
    },
    toggleDataset(index) {
      console.log(index);
      if (!this.chart) return;
      const meta = this.chart.getDatasetMeta(index);
      if (!meta) return;

      // ✅ 상태 변경
      meta.hidden = !meta.hidden;

      requestAnimationFrame(() => {
        this.chart.update();
      });
    },
    async createChart() {
      if (this.isDrawing) return;
      this.isDrawing = true;
      await this.$nextTick();

      const canvas = this.$refs[this.canvasRefName];
      if (!canvas) {
        this.isDrawing = false;
        return;
      }

      if (this.chart) {
        try {
          this.chart.stop();
          this.chart.clear();
          this.chart.destroy();
        } catch (e) {
          console.warn("Chart destroy error:", e);
        }
        this.chart = null;
        await this.$nextTick();
      }

      const ctx = canvas.getContext("2d");
      const labels = ["A", "B", "C"];
      const colors = ["#60a5fa", "#f87171", "#10b981"];
      let data = {},
        options = {};

      if (this.chartType === "stacked-bar") {
        data = {
          labels,
          datasets: [
            {label: "부서 A", data: [10, 20, 30], backgroundColor: "#60a5fa"},
            {label: "부서 B", data: [15, 10, 5], backgroundColor: "#f87171"},
          ],
        };
        this.legendItems = [
          {label: "부서 A", color: "#60a5fa"},
          {label: "부서 B", color: "#f87171"},
        ];
        options = {
          responsive: true,
          plugins: {
            legend: {display: false},
            title: {display: true, text: this.chartTitle},
          },
          scales: {
            x: {stacked: true},
            y: {stacked: true, beginAtZero: true},
          },
        };
      } else {
        data = {
          labels,
          datasets: [
            {
              label: "데이터",
              data: [30, 50, 70],
              backgroundColor: colors,
              borderColor: colors,
              borderWidth: 1,
              fill: this.chartType === "line",
            },
          ],
        };
        this.legendItems = [
          {label: "A", color: "#60a5fa"},
          {label: "B", color: "#f87171"},
          {label: "C", color: "#10b981"},
        ];
        options = {
          responsive: true,
          plugins: {
            legend: {display: false},
            title: {display: true, text: this.chartTitle},
          },
          scales:
            this.chartType === "bar" || this.chartType === "line"
              ? {
                  y: {beginAtZero: true},
                }
              : undefined,
        };
      }

      options.animation = {
        onComplete: () => {
          this.isDrawing = false;
        },
      };

      this.chart = new Chart(ctx, {
        type: this.chartType === "stacked-bar" ? "bar" : this.chartType,
        data,
        options,
      });
    },
  },
};
</script>

<style scoped>
.chart-card {
  width: 100%;
  max-width: 600px;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.chart-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
}
.custom-legend {
  display: flex;
  flex-direction: column;
  padding-top: 0.5rem;
  min-width: 120px;
}
.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.2s;
}
.legend-item.inactive {
  opacity: 0.5;
}
.color-box {
  width: 12px;
  height: 12px;
  margin-right: 0.5rem;
  border-radius: 2px;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-weight: bold;
  background: #60a5fa;
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  min-width: 120px;
}
button:disabled {
  background: #a5b4fc;
  cursor: not-allowed;
}
</style>
