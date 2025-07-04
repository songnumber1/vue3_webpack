<template>
  <div class="nav-wrapper">
    <router-link to="/">home</router-link> <br />
    <router-link to="/about">about</router-link> <br />
    <router-link to="/login">login</router-link> <br /><br />
    <router-link to="/bootstrap-chat">bootstrap-chat</router-link> <br />
    <router-link to="/vuetify-chat">vuetify-chat</router-link> <br />
    <router-link to="/response-chat">response-chat</router-link> <br /><br />

    <router-link to="/mapmarker">mapmarker</router-link> <br />
    <router-link to="/maplist">maplist</router-link> <br />
    <router-link to="/timeline">timeline</router-link> <br /><br />
    <router-link to="/jest">jest</router-link> <br />
    <router-link to="/jest-list">jest-list</router-link> <br /><br />
    <router-link to="/jest-messagetoggle">jest-messagetoggle</router-link>
    <br />
    <router-link to="/element">element</router-link> <br />
    <router-link to="/axios">axios</router-link> <br />
    <router-link to="/jsonEditor">jsonEditor</router-link> <br /><br />

    <router-link to="/chart">Chart</router-link> <br />
    <router-link to="/stackedChart">Stacked Chart</router-link> <br />
    <router-link to="/barChart">Bar Chart</router-link> <br />
    <router-link to="/dashboard">Dashboard</router-link> <br />
    <router-link to="/filemanger">File manager</router-link> <br />
    <router-link to="/timeoutchecker">Timeout Checker</router-link>
  </div>
</template>

<script>
import {defineComponent} from "vue";

export default defineComponent({});
</script>

<style scoped>
.nav-wrapper {
  text-align: center;
  margin-top: 20px;
}
</style>
