<template>
  <div class="gallery-wrapper">
    <select v-model="selectedChart" class="dropdown">
      <option value="">전체 보기</option>
      <option v-for="type in chartTypes" :key="type" :value="type">
        {{ type }}
      </option>
    </select>

    <div class="gallery">
      <ChartCard
        v-for="(type, index) in chartTypes"
        v-show="!selectedChart || selectedChart === type"
        :key="type"
        :ref="type"
        :chart-type="type"
      />
    </div>

    <button @click="changeAllData">데이터 변경</button>
  </div>
</template>

<script>
import ChartCard from "./ChartCard.vue";

export default {
  components: {ChartCard},
  data() {
    return {
      chartTypes: [
        "bar",
        "stacked-bar",
        "grouped-bar",
        "line",
        "pie",
        "doughnut",
        "polarArea",
        "radar",
      ],
      selectedChart: "",
    };
  },
  methods: {
    changeAllData() {
      this.$refs["bar"]?.updateChartData(["X", "Y", "Z"], [90, 20, 60]);
      this.$refs["line"]?.updateChartData(["1Q", "2Q", "3Q"], [150, 120, 170]);
      this.$refs["pie"]?.updateChartData(["A", "B", "C"], [10, 30, 60]);
      this.$refs["doughnut"]?.updateChartData(
        ["Red", "Blue", "Yellow"],
        [40, 50, 10]
      );
      this.$refs["polarArea"]?.updateChartData(
        ["Apple", "Orange", "Banana"],
        [11, 16, 7]
      );
      this.$refs["stacked-bar"]?.updateStackedData(
        ["총무실", "인사실", "연구실"],
        [
          [15, 25, 10],
          [5, 15, 20],
          [10, 5, 30],
        ]
      );
      this.$refs["grouped-bar"]?.updateStackedData(
        ["1분기", "2분기", "3분기"],
        [
          [50, 60, 70],
          [30, 45, 55],
        ]
      );
      this.$refs["radar"]?.updateChartData(
        ["속도", "힘", "기술", "지구력", "지능"],
        [70, 65, 95, 90, 60]
      );
    },
  },
};
</script>

<style scoped>
.gallery-wrapper {
  padding: 1rem;
  text-align: center;
}
.dropdown {
  margin-bottom: 1rem;
  padding: 0.5rem;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
}
.gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
}
</style>
