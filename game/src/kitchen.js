// kitchen.js — the chef's body in the room: movement with wall and counter
// collision, finding the nearest station, and every interaction: grabbing an
// ingredient, chopping, grilling, plating, serving and binning.

import {
  BURN_SECONDS, CHEF_SPEED, CHOP_SECONDS, COLORS, GRILL_SECONDS,
  INTERACT_RADIUS, ITEMS, STATIONS, VIEW, choppedKey, grilledKey, stationById,
} from './config.js';
import { addParticles, setToast } from './state.js';
import { servePlate } from './orders.js';
import { setSizzle, sfx } from './audio.js';

const FLOOR = { x: 24, y: 100, w: 1232, h: 596 };

function clampChef(chef) {
  chef.x = Math.max(FLOOR.x + 18, Math.min(FLOOR.x + FLOOR.w - 18, chef.x));
  chef.y = Math.max(FLOOR.y + 18, Math.min(FLOOR.y + FLOOR.h - 18, chef.y));
  // Counters and the serving window are solid; push the chef out of them.
  for (const s of STATIONS) {
    const hw = s.w / 2 + 16;
    const hh = s.h / 2 + 16;
    const dx = chef.x - s.x;
    const dy = chef.y - s.y;
    if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
      const px = hw - Math.abs(dx);
      const py = hh - Math.abs(dy);
      if (px < py) chef.x += dx > 0 ? px : -px;
      else chef.y += dy > 0 ? py : -py;
    }
  }
}

export function moveChef(state, input, dt) {
  const chef = state.chef;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
  chef.moving = dx !== 0 || dy !== 0;
  if (dx !== 0) chef.dir = dx;
  chef.x += dx * CHEF_SPEED * dt;
  chef.y += dy * CHEF_SPEED * dt;
  clampChef(chef);
}

// Distance to a station is measured to the edge of its rectangle, so a wide
// counter is usable from where the chef actually stands beside it.
function rectDistance(px, py, s) {
  const dx = Math.max(Math.abs(px - s.x) - s.w / 2, 0);
  const dy = Math.max(Math.abs(py - s.y) - s.h / 2, 0);
  return Math.hypot(dx, dy);
}

export function nearestStation(state) {
  let best = null;
  let bestD = INTERACT_RADIUS;
  for (const s of STATIONS) {
    const d = rectDistance(state.chef.x, state.chef.y, s);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

// Holding E on the board chops; this runs every frame while the key is down.
export function holdChop(state, input, dt) {
  const station = nearestStation(state);
  if (!station || station.kind !== 'board') return;
  if (!input.interactHeld) return;
  if (!state.board.item) return;
  const item = ITEMS[state.board.item];
  if (!item || !item.chop) return;
  const before = state.board.progress;
  state.board.progress += dt / CHOP_SECONDS;
  if (Math.floor(state.board.progress * 4) !== Math.floor(before * 4)) sfx.chop();
  if (state.board.progress >= 1) {
    state.board.item = choppedKey(state.board.item);
    state.board.progress = 0;
    sfx.chopped();
    addParticles(state, station.x, station.y - 20, '#fff6e0', 10);
  }
}

export function tickGrill(state, dt) {
  const grill = state.grill;
  if (!grill.item) { setSizzle(false); return; }
  grill.progress += dt;
  setSizzle(true);
  if (grill.progress >= GRILL_SECONDS && !grill.doneChimed) {
    grill.doneChimed = true;
    sfx.ready();
    setToast(state, 'Patty is grilled — grab it before it burns!');
  }
  if (grill.progress >= BURN_SECONDS && grill.item === 'patty') {
    grill.item = 'burnt patty';
  }
}

export function interact(state) {
  const chef = state.chef;
  const station = nearestStation(state);
  if (!station) {
    if (chef.carry || chef.carryPlate) setToast(state, 'Nothing to use here.');
    return;
  }
  if (station.kind === 'pantry') return grabFromPantry(state, station);
  if (station.kind === 'board') return useBoard(state, station);
  if (station.kind === 'grill') return useGrill(state, station);
  if (station.kind === 'plating') return usePlating(state, station);
  if (station.kind === 'window') return useWindow(state, station);
  if (station.kind === 'trash') return useTrash(state, station);
}

function grabFromPantry(state, station) {
  const chef = state.chef;
  if (chef.carry || chef.carryPlate) { setToast(state, 'Hands full!'); sfx.error(); return; }
  chef.carry = station.item;
  sfx.pickup();
  addParticles(state, station.x, station.y - 20, ITEMS[station.item].color, 6);
}

function useBoard(state, station) {
  const chef = state.chef;
  const board = state.board;
  if (!board.item) {
    if (!chef.carry) { setToast(state, 'Bring something to chop.'); return; }
    const item = ITEMS[chef.carry];
    if (!item || !item.chop) { setToast(state, `${chef.carry} can't be chopped.`); sfx.error(); return; }
    board.item = chef.carry;
    board.progress = 0;
    chef.carry = null;
    sfx.drop();
    return;
  }
  // Board occupied: take the item back if hands are free.
  if (chef.carry || chef.carryPlate) { setToast(state, 'Hands full!'); return; }
  chef.carry = board.item;
  board.item = null;
  board.progress = 0;
  sfx.pickup();
}

function useGrill(state, station) {
  const chef = state.chef;
  const grill = state.grill;
  if (!grill.item) {
    if (!chef.carry) { setToast(state, 'Bring a patty to grill.'); return; }
    if (chef.carry !== 'patty') { setToast(state, 'Only patties go on the grill.'); sfx.error(); return; }
    grill.item = 'patty';
    grill.progress = 0;
    grill.doneChimed = false;
    chef.carry = null;
    sfx.grill();
    return;
  }
  if (chef.carry || chef.carryPlate) { setToast(state, 'Hands full!'); return; }
  if (grill.progress < GRILL_SECONDS) {
    setToast(state, 'Still cooking…');
    return;
  }
  chef.carry = grill.progress >= BURN_SECONDS ? 'burnt patty' : grilledKey('patty');
  grill.item = null;
  grill.progress = 0;
  grill.doneChimed = false;
  sfx.pickup();
}

function usePlating(state, station) {
  const chef = state.chef;
  if (chef.carryPlate) {
    // Put the carried plate back down.
    if (state.plate.length > 0) { setToast(state, 'A plate is already here.'); return; }
    state.plate = chef.carryPlate;
    chef.carryPlate = null;
    sfx.drop();
    return;
  }
  if (chef.carry) {
    if (chef.carry === 'burnt patty') { setToast(state, 'Burnt! Bin it, don\'t serve it.'); sfx.error(); return; }
    state.plate.push(chef.carry);
    chef.carry = null;
    sfx.drop();
    addParticles(state, station.x, station.y - 30, '#fff6e0', 8);
    return;
  }
  if (state.plate.length > 0) {
    chef.carryPlate = state.plate;
    state.plate = [];
    sfx.pickup();
  }
}

function useWindow(state, station) {
  const chef = state.chef;
  if (!chef.carryPlate) { setToast(state, 'Bring a finished plate to serve.'); return; }
  const result = servePlate(state, chef.carryPlate);
  if (result) chef.carryPlate = null;
}

function useTrash(state, station) {
  const chef = state.chef;
  if (chef.carry) { chef.carry = null; sfx.drop(); return; }
  if (chef.carryPlate) { chef.carryPlate = null; sfx.drop(); setToast(state, 'Plate binned.'); return; }
  if (state.plate.length > 0) { /* trash only clears the hand, not the counter */ }
  setToast(state, 'Nothing to bin.');
}

// Q bins whatever is in hand. Clicking a station walks the chef's attention
// to it: a click near a station interacts with it directly.
export function dropCarried(state) {
  const chef = state.chef;
  if (chef.carry) { chef.carry = null; sfx.drop(); return; }
  if (chef.carryPlate) { chef.carryPlate = null; sfx.drop(); setToast(state, 'Plate binned.'); }
}

export function clickInteract(state, x, y) {
  let best = null;
  let bestD = INTERACT_RADIUS + 30;
  for (const s of STATIONS) {
    const d = rectDistance(x, y, s);
    if (d < bestD) { best = s; bestD = d; }
  }
  if (!best) return;
  const chef = state.chef;
  if (rectDistance(chef.x, chef.y, best) > INTERACT_RADIUS) {
    setToast(state, 'Walk closer to use that.');
    return;
  }
  interact(state);
}

export { COLORS };
