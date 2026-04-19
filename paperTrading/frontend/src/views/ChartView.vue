<template>
  <div class="trading-layout">
    <div class="chart-pane">
      <the-top-bar />
      <chart-area
        id="chart-area"
        ref="chartArea"
      />
    </div>
    <trading-sidebar />
  </div>
</template>

<script>
import { useMarketsStore } from "@/stores/marketsStore";
import { useCurrentMarketStore } from "@/stores/currentMarketStore";

import TheTopBar from "@/components/TopBar/TheTopBar.vue";
import ChartArea from "@/components/Chart/ChartArea.vue";
import TradingSidebar from "@/components/Trading/TradingSidebar.vue";

export default {
  name: "ChartView",

  components: {
    TheTopBar,
    ChartArea,
    TradingSidebar,
  },

  data() {
    return {
      marketsStore: useMarketsStore(),
      currentMarketStore: useCurrentMarketStore(),
    };
  },

  async created() {
    await this.initializeChartView();
  },

  methods: {
    async initializeChartView() {
      await this.fetchMarketsAndInitCurrent();
    },

    async fetchMarketsAndInitCurrent() {
      await this.marketsStore.fetch();

      if (this.marketsStore.all.length === 0) {
        return;
      }

      if (this.currentMarketStore.isValid(this.marketsStore.all)) {
        return;
      }

      this.currentMarketStore.setMarket(this.marketsStore.all[0]);
    },
  },
};
</script>

<style scoped>
.trading-layout {
  display: flex;
  gap: 10px;
  min-height: calc(100vh - 20px);
}

.chart-pane {
  min-width: 0;
  flex: 1;
}

#chart-area {
  height: calc(100vh - 80px);
}
</style>
