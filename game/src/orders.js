// orders.js — the order board: spawning tickets, their patience, matching a
// finished plate against them, and the score a serve earns.

import { MAX_ORDERS, ORDER_INTERVAL, ORDER_PATIENCE, RECIPES } from './config.js';
import { addParticles, rng, setToast } from './state.js';
import { sfx } from './audio.js';

export function spawnOrder(state) {
  const recipe = RECIPES[Math.floor(rng(state) * RECIPES.length)];
  state.orderSeq += 1;
  state.orders.push({
    id: state.orderSeq,
    recipeId: recipe.id,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
    born: state.time,
  });
}

export function tickOrders(state, dt) {
  state.orderTimer -= dt;
  if (state.orderTimer <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state);
    state.orderTimer = ORDER_INTERVAL;
  }
  for (const order of state.orders) order.patience -= dt;
  const expired = state.orders.filter((o) => o.patience <= 0);
  if (expired.length > 0) {
    state.orders = state.orders.filter((o) => o.patience > 0);
    state.failed += expired.length;
    state.combo = 0;
    setToast(state, 'Order expired! Combo lost.');
    sfx.expire();
  }
}

// A plate matches an order when it holds exactly the recipe's items, in any
// order. Returns the matched order, or null.
export function matchOrder(state, plateItems) {
  for (const order of state.orders) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    if (plateItems.length !== recipe.needs.length) continue;
    const remaining = [...recipe.needs];
    let ok = true;
    for (const item of plateItems) {
      const i = remaining.indexOf(item);
      if (i === -1) { ok = false; break; }
      remaining.splice(i, 1);
    }
    if (ok) return order;
  }
  return null;
}

export function servePlate(state, plateItems) {
  const order = matchOrder(state, plateItems);
  if (!order) {
    state.combo = 0;
    setToast(state, 'No order wants this plate!');
    sfx.error();
    return false;
  }
  const recipe = RECIPES.find((r) => r.id === order.recipeId);
  const patienceFrac = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(50 * patienceFrac);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = (state.combo - 1) * 10;
  const earned = recipe.base + tip + comboBonus;
  state.score += earned;
  state.served += 1;
  state.orders = state.orders.filter((o) => o.id !== order.id);
  const win = state.orders.length === 0;
  setToast(state, `Served ${recipe.name}! +${earned}${state.combo > 1 ? ` (combo x${state.combo})` : ''}`);
  addParticles(state, 1150, 240, '#f5c542', 26);
  sfx.serve();
  return { earned, recipe, win };
}

// Human-readable name for a plate item, e.g. "chopped tomato" -> "Chopped Tomato".
export function itemLabel(item) {
  return item.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}
