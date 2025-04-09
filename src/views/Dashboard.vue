<template>
  <div class="dashboard-container">
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card blue">
        <h2>Total Assists</h2>
        <p>{{ totalAssists }}</p>
      </div>
      <div class="card green">
        <h2>Total Models</h2>
        <p>{{ totalModels }}</p>
      </div>
      <div class="card yellow">
        <h2>Total Count</h2>
        <p>{{ totalCount }}</p>
      </div>
      <div class="card purple">
        <h2>Avg. Count per Model</h2>
        <p>{{ avgCount }}</p>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-container">
      <div class="chart-box">
        <h5>Model Type</h5>
        <Pie :data="modelTypeChart.data" :options="legendRightOptions" />
      </div>

      <div class="chart-box">
        <h5>Model Count - X축 나오게하면 legend가 안나옴</h5>
        <Bar :data="modelCountDistChart.data" :options="barWithLegendOptions" />
      </div>

      <div class="chart-box">
        <h5>Assist vs Model Type</h5>
        <Bar
          :data="assistTypeChart.data"
          :options="stackedLegendRightOptions"
        />
      </div>
    </div>
  </div>
</template>

<script>
import {Pie, Bar} from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import {chartData as rawData} from "./chartData.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale
);

export default {
  name: "ModelDashboard",
  components: {
    Pie,
    Bar,
  },
  data() {
    return {
      legendRightOptions: {
        responsive: true,
        plugins: {
          legend: {position: "right"},
          title: {display: false},
        },
      },
      barWithLegendOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "right", // 또는 'right', 'bottom' 등
          },
          title: {
            display: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Model Count Range",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Models",
            },
          },
        },
      },
      stackedLegendRightOptions: {
        responsive: true,
        plugins: {
          legend: {position: "right"},
          title: {display: false},
        },
        scales: {
          x: {stacked: true},
          y: {stacked: true, beginAtZero: true},
        },
      },
      modelTypeChart: {data: {}},
      modelCountDistChart: {data: {}},
      assistTypeChart: {data: {}},
    };
  },
  computed: {
    totalAssists() {
      return new Set(rawData.map((d) => d.assist_name)).size;
    },
    totalModels() {
      return rawData.length;
    },
    totalCount() {
      return rawData.reduce((sum, d) => sum + d.model_count, 0);
    },
    avgCount() {
      return (this.totalCount / this.totalModels).toFixed(1);
    },
  },
  created() {
    this.prepareModelTypeChart();
    this.prepareModelCountDistChart();
    this.prepareAssistTypeChart();
  },
  methods: {
    prepareModelTypeChart() {
      const grouped = {};
      rawData.forEach((d) => {
        grouped[d.model_type] = (grouped[d.model_type] || 0) + 1;
      });
      this.modelTypeChart.data = {
        labels: Object.keys(grouped),
        datasets: [
          {
            data: Object.values(grouped),
            backgroundColor: Object.keys(grouped).map((_, i) =>
              this.getColor(i)
            ),
          },
        ],
      };
    },
    prepareModelCountDistChart() {
      const bins = [0, 10, 20, 30, 40, 50, 60];
      const dist = Array(bins.length - 1).fill(0);
      rawData.forEach((d) => {
        const idx =
          bins.findIndex(
            (b, i) => d.model_count > b && d.model_count <= bins[i + 1]
          ) - 1;
        if (idx >= 0) dist[idx]++;
      });
      this.modelCountDistChart.data = {
        labels: [""], // 단일 항목만 놓고 dataset에서 구간 구분
        datasets: bins.slice(1).map((b, i) => ({
          label: `${bins[i] + 1}-${b}`, // legend에 표시될 구간 이름
          data: [dist[i]],
          backgroundColor: this.getColor(i),
        })),
      };
    },
    prepareAssistTypeChart() {
      const assists = [...new Set(rawData.map((d) => d.assist_name))];
      const types = [...new Set(rawData.map((d) => d.model_type))];
      const datasets = types.map((type, i) => {
        return {
          label: type,
          data: assists.map((a) => {
            return rawData
              .filter((d) => d.assist_name === a && d.model_type === type)
              .reduce((sum, d) => sum + d.model_count, 0);
          }),
          backgroundColor: this.getColor(i),
        };
      });
      this.assistTypeChart.data = {
        labels: assists,
        datasets,
      };
    },
    getColor(index) {
      const colors = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
        "#8B0000",
        "#00CED1",
        "#ADFF2F",
        "#FF69B4",
      ];
      return colors[index % colors.length];
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
}
.summary-cards {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.card {
  flex: 1;
  padding: 16px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.card h2 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.card p {
  font-size: 2rem;
  font-weight: bold;
}
.card.blue {
  background-color: #dbeafe;
  color: #1e40af;
}
.card.green {
  background-color: #d1fae5;
  color: #065f46;
}
.card.yellow {
  background-color: #fef9c3;
  color: #92400e;
}
.card.purple {
  background-color: #e9d5ff;
  color: #6b21a8;
}

.charts-container {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-top: 32px;
}
.chart-box {
  flex: 1;
}
</style>
