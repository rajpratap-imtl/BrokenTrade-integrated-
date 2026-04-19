<template>
  <n-config-provider :theme="darkTheme">
    <n-message-provider>
      <main>
        <router-view />
      </main>
    </n-message-provider>
  </n-config-provider>
</template>

<script>
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui';

export default {
  name: 'App',

  components: {
    NConfigProvider,
    NMessageProvider,
  },

  data() {
    return {
      darkTheme,
    };
  },

  beforeUnmount() {
    if (this.$wss) {
      this.$wss.close();
    }
  },
};
</script>

<style>
main {
  padding: 10px;
}
</style>
