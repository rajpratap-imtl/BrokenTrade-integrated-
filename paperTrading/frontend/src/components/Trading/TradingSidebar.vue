<template>
  <aside class="trading-sidebar">
    <section class="panel">
      <div class="panel-heading">
        <h2>Paper Trading</h2>
        <button v-if="tradingStore.isAuthenticated" class="ghost-button" @click="tradingStore.logout">
          Logout
        </button>
      </div>

      <form v-if="!tradingStore.isAuthenticated" class="auth-form" @submit.prevent="tradingStore.login">
        <input v-model="tradingStore.email" type="email" placeholder="Email" autocomplete="email">
        <input v-model="tradingStore.password" type="password" placeholder="Password" autocomplete="current-password">
        <div class="button-row">
          <button type="submit" :disabled="tradingStore.isLoading">Login</button>
          <button type="button" :disabled="tradingStore.isLoading" @click="tradingStore.register">
            Register
          </button>
        </div>
      </form>

      <div v-else class="account-summary">
        <span>{{ tradingStore.user?.email }}</span>
        <strong>{{ formatCurrency(tradingStore.balance) }}</strong>
      </div>

      <p v-if="tradingStore.error" class="error">{{ tradingStore.error }}</p>
    </section>

    <section class="panel">
      <h3>Order</h3>
      <div class="metric-row">
        <span>{{ symbol }}</span>
        <strong>{{ formatCurrency(currentPrice) }}</strong>
      </div>
      <label>
        Quantity
        <input v-model.number="tradingStore.quantity" type="number" min="1" step="1">
      </label>
      <div class="button-row">
        <button class="buy-button" :disabled="!canTrade" @click="tradingStore.placeOrder(symbol, 'BUY')">
          BUY
        </button>
        <button class="sell-button" :disabled="!canTrade" @click="tradingStore.placeOrder(symbol, 'SELL')">
          SELL
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h3>Positions</h3>
        <button class="ghost-button" :disabled="!tradingStore.isAuthenticated" @click="tradingStore.resetAccount">
          Reset
        </button>
      </div>
      <div v-if="!tradingStore.positions.length" class="empty">No open positions</div>
      <div v-for="position in tradingStore.positions" :key="position.id" class="position-row">
        <div>
          <strong>{{ position.symbol }}</strong>
          <span>{{ position.quantity }} @ {{ formatCurrency(position.avgPrice) }}</span>
        </div>
        <span :class="['pnl', position.pnl >= 0 ? 'positive' : 'negative']">
          {{ formatCurrency(position.pnl) }}
        </span>
      </div>
    </section>

    <section class="panel">
      <h3>Trade History</h3>
      <div v-if="!tradingStore.trades.length" class="empty">No closed trades</div>
      <div v-for="trade in tradingStore.trades.slice(0, 6)" :key="trade.id" class="trade-row">
        <span>{{ trade.symbol }}</span>
        <span>{{ formatCurrency(trade.entryPrice) }} -> {{ formatCurrency(trade.exitPrice) }}</span>
        <span :class="['pnl', trade.profit >= 0 ? 'positive' : 'negative']">
          {{ formatCurrency(trade.profit) }}
        </span>
      </div>
    </section>

    <section class="panel">
      <h3>Leaderboard</h3>
      <div v-if="!tradingStore.leaderboard.length" class="empty">No traders yet</div>
      <div v-for="row in tradingStore.leaderboard.slice(0, 5)" :key="row.email" class="leader-row">
        <span>#{{ row.rank }} {{ row.email }}</span>
        <strong :class="row.profit >= 0 ? 'positive' : 'negative'">
          {{ formatCurrency(row.profit) }}
        </strong>
      </div>
    </section>
  </aside>
</template>

<script>
import { useCandlesticksStore } from '@/stores/candlesticksStore';
import { useCurrentMarketStore } from '@/stores/currentMarketStore';
import { useTradingStore } from '@/stores/tradingStore';

export default {
  name: 'TradingSidebar',

  data() {
    return {
      tradingStore: useTradingStore(),
      candlesticksStore: useCandlesticksStore(),
      currentMarketStore: useCurrentMarketStore(),
    };
  },

  computed: {
    symbol() {
      return this.currentMarketStore.symbol;
    },

    currentPrice() {
      const last = this.candlesticksStore.data[this.candlesticksStore.data.length - 1];
      return Number(last?.close || 0);
    },

    canTrade() {
      return this.tradingStore.isAuthenticated && this.symbol && this.tradingStore.quantity > 0;
    },
  },

  mounted() {
    this.tradingStore.hydrate();
  },

  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'INR',
      }).format(Number(value || 0));
    },
  },
};
</script>

<style scoped>
.trading-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 360px;
  min-width: 320px;
  max-height: calc(100vh - 20px);
  overflow: auto;
  border-left: 1px solid #2a2e39;
  padding-left: 10px;
}

.panel {
  border: 1px solid #2a2e39;
  border-radius: 6px;
  background: #171b26;
  padding: 12px;
}

.panel-heading,
.metric-row,
.button-row,
.position-row,
.trade-row,
.leader-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

h2,
h3 {
  margin: 0 0 10px;
}

.auth-form,
label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

input {
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  border: 1px solid #363c4e;
  border-radius: 4px;
  background: #0f131d;
  color: #ffffffd1;
  padding: 8px;
}

button {
  min-height: 34px;
  border: 0;
  border-radius: 4px;
  background: #2962ff;
  color: white;
  cursor: pointer;
  padding: 0 12px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ghost-button {
  border: 1px solid #363c4e;
  background: transparent;
}

.buy-button {
  flex: 1;
  background: #089981;
}

.sell-button {
  flex: 1;
  background: #f23645;
}

.account-summary,
.position-row,
.trade-row,
.leader-row {
  padding: 8px 0;
  border-top: 1px solid #242936;
}

.account-summary,
.position-row > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trade-row {
  align-items: flex-start;
  flex-direction: column;
}

.positive {
  color: #00c853;
}

.negative,
.error {
  color: #ff5252;
}

.empty {
  color: #8d93a6;
  font-size: 13px;
}
</style>
