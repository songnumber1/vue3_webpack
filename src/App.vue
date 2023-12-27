<template>
  <v-app>
    <v-app-bar color="primary" class="flex-grow-0" app dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>Coding Beauty</v-app-bar-title>
      <v-spacer></v-spacer>

      <v-tooltip text="Login">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" icon>
            <v-icon>mdi-login</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip text="Logout">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" icon>
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-tooltip text="Setting">
        <template v-slot:activator="{props}">
          <v-btn v-bind="props" icon @click.stop="settingDialog = true">
            <v-icon>mdi-cog</v-icon>
          </v-btn>

          <Setting
            :value="settingDialog"
            @settingInput="settingDialog = $event"
          ></Setting>
        </template>
      </v-tooltip>
    </v-app-bar>
    <v-navigation-drawer app expand-on-hover rail v-model="drawer">
      <v-list>
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/women/85.jpg"
          title="Sandra Adams"
          subtitle="sandra_a88@gmailcom"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-home-outline"
          title="Home"
          to="/"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-outline"
          title="profile"
          to="/profile"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-star-outline"
          title="Login"
          to="/login"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-devices"
          title="Device List"
          to="/devicelist"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-map-outline"
          title="Map List"
          to="/maplist"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-map-marker-outline"
          title="Map Marker"
          to="/mapmarker"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-clock-outline"
          title="Time Line"
          to="/timeline"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-message-outline"
          title="Message"
          to="/message"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-alarm-light-outline"
          title="SOS List"
          to="/sos"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-alarm-light-outline"
          title="Jest"
          to="/jest"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import Setting from "./components/Setting.vue";
export default {
  name: "App",
  components: {Setting},
  data: () => ({
    drawer: false,
    settingDialog: false,
    icons: ["mdi-facebook", "mdi-twitter", "mdi-linkedin", "mdi-instagram"],
  }),
};
</script>
