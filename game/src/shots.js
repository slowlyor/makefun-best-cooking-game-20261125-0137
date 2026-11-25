// shots.js — staged scenes for the entry's screenshots. Each shot builds a
// real, playable game state (orders on the board, food on the stations, a
// plate mid-assembly) and freezes the clock, so the screenshot is a true
// render of the game's own code at a moment worth showing. The game itself
// never reads these helpers except through the ?shot= query parameter.

import { ORDER_PATIENCE } from './config.js';

function baseShot(state, timeLeft) {
  state.mode = 'play';
  state.frozen = true;
  state.timeLeft = timeLeft;
  state.time = 150 - timeLeft;
}

// Cover: the whole game in one frame — three orders on the board, chopped
// veg on the board, a patty on the grill, a burger nearly plated, the chef
// carrying the finished plate toward the window, timer running.
export function shotCover(state) {
  baseShot(state, 132);
  state.score = 340;
  state.served = 3;
  state.combo = 2;
  state.orders = [
    { id: 4, recipeId: 'burger', patience: 38, maxPatience: ORDER_PATIENCE, born: 0 },
    { id: 5, recipeId: 'salad', patience: 26, maxPatience: ORDER_PATIENCE, born: 0 },
    { id: 6, recipeId: 'melt', patience: 44, maxPatience: ORDER_PATIENCE, born: 0 },
  ];
  state.board = { item: 'chopped tomato', progress: 0 };
  state.grill = { item: 'patty', progress: 3.2, doneChimed: false };
  state.plate = ['bun', 'grilled patty', 'chopped lettuce'];
  state.chef = { x: 780, y: 480, dir: 1, moving: false, carry: null, carryPlate: ['bun', 'grilled patty', 'chopped lettuce', 'chopped tomato'] };
  state.toast = 'Served Sunny Burger! +150 (combo x2)';
  state.toastUntil = 9999;
}

// Mid-assembly: the chef chops a tomato while a patty grills and the plate
// waits with its first two layers.
export function shotMid(state) {
  baseShot(state, 96);
  state.score = 180;
  state.served = 2;
  state.combo = 1;
  state.orders = [
    { id: 3, recipeId: 'burger', patience: 31, maxPatience: ORDER_PATIENCE, born: 0 },
    { id: 4, recipeId: 'stack', patience: 42, maxPatience: ORDER_PATIENCE, born: 0 },
  ];
  state.board = { item: 'tomato', progress: 0.55 };
  state.grill = { item: 'patty', progress: 4.1, doneChimed: false };
  state.plate = ['bun', 'grilled patty'];
  state.chef = { x: 330, y: 268, dir: -1, moving: false, carry: null, carryPlate: null };
  state.toast = 'Chopping… hold E!';
  state.toastUntil = 9999;
}

// Serve: the chef carries a finished salad to the window as its ticket
// runs low — the timer and the rush both read at a glance.
export function shotServe(state) {
  baseShot(state, 58);
  state.score = 520;
  state.served = 5;
  state.combo = 3;
  state.bestCombo = 3;
  state.orders = [
    { id: 7, recipeId: 'salad', patience: 9, maxPatience: ORDER_PATIENCE, born: 0 },
    { id: 8, recipeId: 'burger', patience: 35, maxPatience: ORDER_PATIENCE, born: 0 },
  ];
  state.board = { item: null, progress: 0 };
  state.grill = { item: null, progress: 0, doneChimed: false };
  state.plate = [];
  state.chef = { x: 1020, y: 300, dir: 1, moving: true, carry: null, carryPlate: ['chopped lettuce', 'chopped tomato', 'chopped onion'] };
  state.toast = 'Serve it before the ticket runs out!';
  state.toastUntil = 9999;
}

// End: the shift-over screen with a strong final score.
export function shotEnd(state) {
  state.mode = 'end';
  state.frozen = true;
  state.timeLeft = 0;
  state.time = 150;
  state.score = 740;
  state.served = 8;
  state.failed = 1;
  state.combo = 0;
  state.bestCombo = 4;
  state.orders = [];
  state.chef = { x: 640, y: 420, dir: 1, moving: false, carry: null, carryPlate: null };
}

export const SHOTS = { cover: shotCover, mid: shotMid, serve: shotServe, end: shotEnd };

export function applyShot(state, name) {
  const fn = SHOTS[name];
  if (!fn) return false;
  fn(state);
  return true;
}
