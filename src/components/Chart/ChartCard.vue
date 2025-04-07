<template>
  <div class="chart-card">
    <h3>{{ chartTitle }}</h3>
    <component
      :is="chartComponent"
      ref="chartRef"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
} from "chart.js";

import {Bar, Line, Pie, Doughnut, PolarArea, Radar} from "vue-chartjs";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale
);

export default {
  props: ["chartType"],
  components: {Bar, Line, Pie, Doughnut, PolarArea, Radar},
  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      chartOptions: {},
    };
  },
  computed: {
    chartComponent() {
      return {
        bar: "Bar",
        "stacked-bar": "Bar",
        "grouped-bar": "Bar",
        line: "Line",
        pie: "Pie",
        doughnut: "Doughnut",
        polarArea: "PolarArea",
        radar: "Radar",
      }[this.chartType];
    },
    chartTitle() {
      return {
        bar: "Bar Chart",
        "stacked-bar": "Stacked Bar Chart",
        "grouped-bar": "Grouped Bar Chart",
        line: "Line Chart",
        pie: "Pie Chart",
        doughnut: "Doughnut Chart",
        polarArea: "Polar Area Chart",
        radar: "Radar Chart",
      }[this.chartType];
    },
  },
  mounted() {
    const colors = [
      "#60a5fa",
      "#f87171",
      "#10b981",
      "#facc15",
      "#a78bfa",
      "#fb923c",
    ];
    const labels = ["A", "B", "C"];

    if (this.chartType === "stacked-bar") {
      this.chartData.labels = ["전략실", "기획실", "개발실"];
      this.chartData.datasets = [
        {label: "부서 A", data: [10, 20, 30], backgroundColor: colors[0]},
        {label: "부서 B", data: [20, 10, 15], backgroundColor: colors[1]},
        {label: "부서 C", data: [5, 8, 12], backgroundColor: colors[2]},
      ];
      this.chartOptions = {
        responsive: true,
        plugins: {title: {display: true, text: this.chartTitle}},
        scales: {x: {stacked: true}, y: {stacked: true, beginAtZero: true}},
      };
    } else if (this.chartType === "grouped-bar") {
      this.chartData.labels = ["1분기", "2분기", "3분기"];
      this.chartData.datasets = [
        {label: "팀 A", data: [65, 59, 80], backgroundColor: colors[0]},
        {label: "팀 B", data: [28, 48, 40], backgroundColor: colors[1]},
      ];
      this.chartOptions = {
        responsive: true,
        plugins: {title: {display: true, text: this.chartTitle}},
        scales: {x: {stacked: false}, y: {stacked: false, beginAtZero: true}},
      };
    } else if (this.chartType === "radar") {
      this.chartData.labels = ["속도", "힘", "기술", "지구력", "지능"];
      this.chartData.datasets = [
        {
          label: "선수 A",
          data: [65, 59, 90, 81, 56],
          backgroundColor: "rgba(96,165,250,0.2)",
          borderColor: "#60a5fa",
          pointBackgroundColor: "#60a5fa",
        },
      ];
      this.chartOptions = {
        responsive: true,
        scales: {r: {beginAtZero: true}},
        plugins: {title: {display: true, text: this.chartTitle}},
      };
    } else if (["pie", "doughnut", "polarArea"].includes(this.chartType)) {
      this.chartData.labels = labels;
      this.chartData.datasets = [{data: [10, 20, 30], backgroundColor: colors}];
      this.chartOptions = {
        responsive: true,
        plugins: {
          legend: {position: "top"},
          title: {display: true, text: this.chartTitle},
        },
      };
    } else {
      console.log("1323131");
      this.chartData.labels = labels;
      this.chartData.datasets = [
        {
          label: "Data",
          data: [30, 50, 70],
          backgroundColor: this.chartType === "bar" ? colors : undefined,
          borderColor: this.chartType === "line" ? "#60a5fa" : undefined,
          fill: false,
        },
      ];
      this.chartOptions = {
        responsive: true,
        plugins: {
          legend: {display: this.chartType === "line"},
          title: {display: true, text: this.chartTitle},
        },
        scales: {y: {beginAtZero: true}},
      };
    }
  },
  methods: {
    updateChartData(newLabels, newData) {
      if (!this.chartData.datasets || this.chartData.datasets.length === 0) {
        this.chartData.datasets = [
          {data: [], backgroundColor: ["#60a5fa", "#f87171", "#10b981"]},
        ];
      }
      this.chartData.labels = newLabels;
      this.chartData.datasets[0].data = newData;
      this.$refs.chartRef.chart.update();
    },
    updateStackedData(newLabels, newMatrix) {
      if (
        !this.chartData.datasets ||
        newMatrix.length !== this.chartData.datasets.length
      ) {
        const colors = ["#60a5fa", "#f87171", "#10b981"];
        this.chartData.datasets = newMatrix.map((row, i) => ({
          label: `Dataset ${i + 1}`,
          data: row,
          backgroundColor: colors[i % colors.length],
        }));
      } else {
        newMatrix.forEach((row, i) => {
          this.chartData.datasets[i].data = row;
        });
      }
      this.chartData.labels = newLabels;
      this.$refs.chartRef.chart.update();
    },
  },
};
</script>

<style scoped>
.chart-card {
  width: 100%;
  max-width: 600px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
