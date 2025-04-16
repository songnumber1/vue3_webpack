<template>
  <div>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import {Bar} from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import {chartData as rawData} from "./chartData.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export default {
  name: "StackedBarByModelName",
  components: {
    Bar,
  },
  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            position: "right",
          },
          title: {
            display: true,
            text: "Model Count by Assist Name (Legend: Model Name)",
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
          },
        },
      },
    };
  },
  created() {
    this.prepareChart();
  },
  methods: {
    prepareChart() {
      const assistNames = [...new Set(rawData.map((d) => d.assist_name))];

      // 각 model_name을 개별 dataset으로 생성
      const datasets = rawData.map((entry, index) => {
        return {
          label: entry.model_name,
          data: assistNames.map((name) =>
            name === entry.assist_name ? entry.model_count : 0
          ),
          backgroundColor: this.getColor(index),
        };
      });

      this.chartData = {
        labels: assistNames,
        datasets,
      };
    },
    getColor(index) {
      // 모델 수가 적으므로 색상 몇 개 순환
      const colors = [
        "rgba(255, 99, 132, 0.6)",
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(75, 192, 192, 0.6)",
        "rgba(153, 102, 255, 0.6)",
        "rgba(255, 159, 64, 0.6)",
        "rgba(199, 199, 199, 0.6)",
        "rgba(100, 149, 237, 0.6)",
      ];
      return colors[index % colors.length];
    },
  },
};
</script>
