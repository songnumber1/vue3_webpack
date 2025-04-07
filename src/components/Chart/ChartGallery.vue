<template>
  <div class="gallery-wrapper">
    <ChartCard chart-type="bar" />
    <ChartCard chart-type="stacked-bar" />
    <ChartCard chart-type="line" />
    <ChartCard chart-type="pie" />
    <ChartCard chart-type="doughnut" />
    <ChartCard chart-type="polarArea" />
  </div>
</template>

<script>
import ChartCard from "./ChartCard.vue";

export default {
  components: {ChartCard},
};
</script>

<style scoped>
.gallery-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  padding: 2rem;
}
</style>
