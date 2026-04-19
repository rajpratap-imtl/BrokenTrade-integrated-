<template>
  <n-button 
    round 
    type="error"
    @click="handleLogout"
    class="logout-btn"
  >
    Logout
  </n-button>
</template>

<script>
import { useAuthStore } from '../stores/auth';
import { NButton } from 'naive-ui';

export default {
  name: 'LogoutButton',

  components: {
    NButton,
  },

  setup() {
    const authStore = useAuthStore();

    function handleLogout() {
      authStore.logout();
    }

    return {
      handleLogout,
    };
  },
};
</script>

<style scoped>
.logout-btn {
  margin-left: auto;
}
</style>
