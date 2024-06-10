<template>
  <div>
    <el-button type="primary" @click="ipconfirm">Axios Ip comfirm</el-button>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import axios from "axios";

export default defineComponent({
  name: "AxiosView",

  methods: {
    ipconfirm() {
      console.log("ipconfirm");

      let url = "test/home";

      axios
        .get(url)
        .then((data) => {
          console.log(data);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
});
</script>
