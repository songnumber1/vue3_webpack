<template>
  <v-card class="mx-auto my-12" max-width="374" flat color="transparent">
    <v-tooltip text="사용자를 추가하세요.">
      <template v-slot:activator="{props}">
        <v-btn v-bind="props" icon style="margin: 1px">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </v-card>
</template>

<script>
export default {};
</script>
