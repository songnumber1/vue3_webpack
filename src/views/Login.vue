<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" xs="12" sm="4" md="4" lg="4" xl="4" xxl="4">
        <v-card width="100%">
          <v-card-text class="text-center px-12 py-16">
            <div class="text-h4 font-weight-black mb-10">로그인</div>
            <v-form v-model="form" @submit.prevent="onSubmit">
              <v-text-field
                v-model="email"
                :readonly="loading"
                :rules="[required]"
                variant="filled"
                color="deep-purple"
                counter="6"
                label="Email"
                style="min-height: 96px"
                type="email"
                clearable
              ></v-text-field>

              <v-text-field
                v-model="password"
                :readonly="loading"
                :rules="[required]"
                variant="filled"
                color="deep-purple"
                counter="6"
                label="Password"
                style="min-height: 96px"
                type="password"
              ></v-text-field>

              <v-btn
                class="mt-6"
                :disabled="!form"
                :loading="loading"
                block
                rounded
                color="success"
                size="large"
                type="submit"
                variant="elevated"
              >
                로그인
              </v-btn>
            </v-form>
            <div class="mt-5">
              <router-link class="text-decoration-none" to="/">
                홈
              </router-link>
              |
              <router-link
                class="text-decoration-none"
                to="/authentication/sign-up"
              >
                회원가입
              </router-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "SignIn",
  data() {
    return {
      form: false,
      email: null,
      password: null,
      loading: false,
    };
  },
  methods: {
    onSubmit() {
      if (!this.form) return;

      this.loading = true;

      setTimeout(() => (this.loading = false), 2000);
    },
    required(v) {
      return !!v || "Field is required";
    },
  },
};
</script>
