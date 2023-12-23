<template>
  <v-container class="fill-height">
    <DeviceItem></DeviceItem>
    <AddItem></AddItem>
  </v-container>
</template>

<script>
import DeviceItem from "@/components/DeviceList/DeviceItem.vue";
import AddItem from "@/components/DeviceList/AddItem.vue";

export default {
  components: {DeviceItem, AddItem},
};
</script>
