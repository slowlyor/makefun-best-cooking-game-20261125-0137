// state.js — the whole game state in one plain object, created fresh by
// createState(). The loop mutates it; render.js only reads it; shots.js fills
// it in for the staged screenshots. No DOM or canvas access lives here.

import { SHIFT_SECONDS } from './config.js';

export function createState() {
  return {
    mode: 'title', // 'title' | 'play' | 'end'
    time: 0, // seconds since the shift started
    timeLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    orderTimer: 2, // first order arrives 2s in
    orderSeq: 0,
    orders: [], // {id, recipeId, patience, maxPatience, born}
    chef: { x: 640, y: 420, dir: 1, moving: false, carry: null, carryPlate: null },
    board: { item: null, progress: 0 }, // chopping board slot
    grill: { item: null, progress: 0 }, // grill slot, progress in seconds
    plate: [], // items stacked on the plating counter
    particles: [], // {x, y, vx, vy, life, maxLife, color, size}
    toast: '', // one-line message shown above the chef
    toastUntil: 0,
    frozen: false, // staged screenshots freeze the clock but keep rendering
    seed: 1,
    rngState: 1,
  };
}

// Tiny deterministic RNG so staged shots and replays agree.
export function rng(state) {
  state.rngState = (state.rngState * 1664525 + 1013904223) >>> 0;
  return state.rngState / 4294967296;
}

export function setToast(state, text) {
  state.toast = text;
  state.toastUntil = state.time + 2.2;
}

export function addParticles(state, x, y, color, n) {
  for (let i = 0; i < n; i += 1) {
    const a = rng(state) * Math.PI * 2;
    const speed = 40 + rng(state) * 120;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 60,
      life: 0, maxLife: 0.6 + rng(state) * 0.5,
      color, size: 3 + rng(state) * 4,
    });
  }
}

export function tickParticles(state, dt) {
  for (const p of state.particles) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 220 * dt;
  }
  state.particles = state.particles.filter((p) => p.life < p.maxLife);
}
