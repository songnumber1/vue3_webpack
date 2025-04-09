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
  name: "ModelBarChartToggleLegend",
  components: {
    Bar,
  },
  data() {
    return {
      chartData: {
        labels: [],
        datasets: [],
      },
      //   chartOptions: {
      //     responsive: true,
      //     plugins: {
      //       legend: {
      //         display: true,
      //         position: "right",
      //       },
      //       title: {
      //         display: true,
      //         text: "Model Count by Model Name (Toggle by Legend)",
      //       },
      //       tooltip: {
      //         mode: "index",
      //         intersect: false,
      //       },
      //     },
      //     scales: {
      //       x: {
      //         title: {
      //           display: true,
      //           text: "Model Name",
      //         },
      //       },
      //       y: {
      //         beginAtZero: true,
      //         title: {
      //           display: true,
      //           text: "Model Count",
      //         },
      //       },
      //     },
      //   },
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "right",
          },
          title: {
            display: true,
            text: "Model Count by Model Name (Hover shows single model only)",
          },
          tooltip: {
            mode: "nearest", // 🔹 이게 핵심
            intersect: true, // 🔹 바 위에 있을 때만 툴팁 표시
          },
        },
        interaction: {
          mode: "nearest",
          intersect: true,
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Model Name",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Model Count",
            },
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
      // x축 레이블: 모든 모델 이름
      this.chartData.labels = rawData.map((d) => d.model_name);

      // dataset을 model 하나씩으로 쪼개기 (bar 하나에 하나의 dataset)
      this.chartData.datasets = rawData.map((entry, i) => ({
        label: entry.model_name,
        data: rawData.map((d) =>
          d.model_name === entry.model_name ? d.model_count : 0
        ),
        backgroundColor: this.getColor(i),
        stack: "models", // 같은 stack 그룹으로 묶기 (필요에 따라 제거 가능)
      }));
    },
    getColor(index) {
      const colors = [
        "rgba(255, 99, 132, 0.6)",
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(75, 192, 192, 0.6)",
        "rgba(153, 102, 255, 0.6)",
        "rgba(255, 159, 64, 0.6)",
        "rgba(199, 199, 199, 0.6)",
        "rgba(100, 149, 237, 0.6)",
        "rgba(255, 105, 180, 0.6)",
        "rgba(60, 179, 113, 0.6)",
        "rgba(218, 112, 214, 0.6)",
        "rgba(210, 180, 140, 0.6)",
      ];
      return colors[index % colors.length];
    },
  },
};
</script>
