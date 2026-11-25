// render.js — everything the player sees, drawn on one canvas: the tiled
// kitchen floor, the stations and their food, the chef, the order board and
// the shift timer, plus the title and end-of-shift screens. Pure drawing:
// it reads state and never mutates it.

import { COLORS, ITEMS, RECIPES, STATIONS, VIEW, recipeById } from './config.js';
import { itemLabel } from './orders.js';
import { nearestStation } from './kitchen.js';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One food item, drawn as a small readable icon. Chopped items are wedges,
// a grilled patty is dark with sear lines, a burnt one is charcoal.
export function drawItem(ctx, item, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (item === 'bun') {
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath(); ctx.arc(0, 2, r, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d18f35';
    ctx.fillRect(-r, 0, r * 2, r * 0.45);
    ctx.fillStyle = '#fff3d0';
    for (const sx of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.arc(sx * r, -r * 0.45, r * 0.12, 0, TAU); ctx.fill(); }
  } else if (item === 'patty') {
    ctx.fillStyle = '#8a5a3b';
    rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5); ctx.fill();
  } else if (item === 'grilled patty') {
    ctx.fillStyle = '#5d3a22';
    rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5); ctx.fill();
    ctx.strokeStyle = '#3a2413'; ctx.lineWidth = 2;
    for (const sx of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(sx * r, -r * 0.5); ctx.lineTo(sx * r, r * 0.5); ctx.stroke(); }
  } else if (item === 'burnt patty') {
    ctx.fillStyle = '#1d1a18';
    rr(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5); ctx.fill();
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, 2, 0, TAU); ctx.fill();
  } else if (item === 'cheese') {
    ctx.fillStyle = '#f5c542';
    ctx.beginPath(); ctx.moveTo(-r, r * 0.7); ctx.lineTo(r, r * 0.7); ctx.lineTo(0, -r * 0.8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d99e1f';
    for (const [hx, hy] of [[-0.3, 0.3], [0.25, 0.1], [0, 0.45]]) {
      ctx.beginPath(); ctx.arc(hx * r, hy * r, r * 0.14, 0, TAU); ctx.fill();
    }
  } else if (item.startsWith('chopped ')) {
    const base = item.slice(8);
    const color = ITEMS[base]?.color ?? '#ccc';
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a, a + TAU / 3 - 0.25);
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  } else {
    const color = ITEMS[item]?.color ?? '#ccc';
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.3, 0, TAU); ctx.fill();
    if (item === 'tomato') {
      ctx.fillStyle = '#3f7d33';
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(-r * 0.35, -r * 0.5); ctx.lineTo(r * 0.35, -r * 0.5); ctx.closePath(); ctx.fill();
    }
    if (item === 'onion') {
      ctx.strokeStyle = '#b9a8cc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, TAU); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, r) {
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#cfc8b4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, TAU); ctx.stroke();
  const n = items.length;
  items.forEach((item, i) => {
    const angle = -Math.PI / 2 + (i - (n - 1) / 2) * 0.5;
    drawItem(ctx, item, x + Math.cos(angle) * r * 0.45, y - 6 + Math.sin(angle) * r * 0.18, Math.min(15, r * 0.42));
  });
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, 88, VIEW.w, 14);
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 100, VIEW.w, 4);
  for (let ty = 0; ty < 8; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * 80, 104 + ty * 77, 80, 77);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let tx = 0; tx < 16; tx += 1) ctx.fillRect(tx * 80, 104, 80, 3);
}

function drawStation(ctx, state, s) {
  const x = s.x - s.w / 2;
  const y = s.y - s.h / 2;
  ctx.save();
  if (s.kind === 'pantry') {
    ctx.fillStyle = '#6b4426';
    rr(ctx, x - 4, y - 4, s.w + 8, s.h + 8, 10); ctx.fill();
    ctx.fillStyle = '#8a5a35';
    rr(ctx, x, y, s.w, s.h, 8); ctx.fill();
    drawItem(ctx, s.item, s.x - 34, s.y, 20);
    text(ctx, ITEMS[s.item].label, s.x - 8, s.y - 8, 15, '#fff6e0');
    text(ctx, 'pantry', s.x - 8, s.y + 12, 11, '#e8c890', '400');
  } else if (s.kind === 'board') {
    ctx.fillStyle = '#7a5230';
    rr(ctx, x - 5, y - 5, s.w + 10, s.h + 10, 10); ctx.fill();
    ctx.fillStyle = COLORS.board;
    rr(ctx, x, y, s.w, s.h, 8); ctx.fill();
    text(ctx, 'CHOP', s.x, y + 14, 12, '#7a5230', '800', 'center');
    if (state.board.item) {
      drawItem(ctx, state.board.item, s.x, s.y + 12, 22);
      if (state.board.progress > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(s.x - 40, s.y + 34, 80, 7);
        ctx.fillStyle = COLORS.good;
        ctx.fillRect(s.x - 40, s.y + 34, 80 * state.board.progress, 7);
      }
    }
  } else if (s.kind === 'grill') {
    ctx.fillStyle = '#2c2c34';
    rr(ctx, x - 5, y - 5, s.w + 10, s.h + 10, 10); ctx.fill();
    ctx.fillStyle = COLORS.grill;
    rr(ctx, x, y, s.w, s.h, 8); ctx.fill();
    ctx.strokeStyle = '#565660'; ctx.lineWidth = 3;
    for (let i = 1; i < 5; i += 1) {
      ctx.beginPath(); ctx.moveTo(x + (s.w / 5) * i, y + 8); ctx.lineTo(x + (s.w / 5) * i, y + s.h - 8); ctx.stroke();
    }
    text(ctx, 'GRILL', s.x, y + 13, 12, '#c8c8d0', '800', 'center');
    if (state.grill.item) {
      const frac = Math.min(1, state.grill.progress / 5);
      drawItem(ctx, state.grill.item === 'patty' && state.grill.progress >= 5 ? 'grilled patty' : state.grill.item, s.x, s.y + 14, 22);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(s.x - 40, s.y + 34, 80, 7);
      ctx.fillStyle = state.grill.progress >= 8.5 ? COLORS.bad : (frac >= 1 ? COLORS.good : '#ff9a3d');
      ctx.fillRect(s.x - 40, s.y + 34, 80 * Math.min(1, state.grill.progress / 8.5), 7);
    }
  } else if (s.kind === 'plating') {
    ctx.fillStyle = COLORS.counter;
    rr(ctx, x - 5, y - 5, s.w + 10, s.h + 10, 10); ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    rr(ctx, x, y, s.w, s.h, 8); ctx.fill();
    text(ctx, 'PLATING', s.x, y + 14, 12, '#5d3a1e', '800', 'center');
    if (state.plate.length > 0) drawPlate(ctx, state.plate, s.x, s.y + 22, 52);
    else text(ctx, 'empty plate spot', s.x, s.y + 26, 12, '#8a6a45', '400', 'center');
  } else if (s.kind === 'window') {
    ctx.fillStyle = '#3c5a3d';
    rr(ctx, x - 5, y - 5, s.w + 10, s.h + 10, 10); ctx.fill();
    ctx.fillStyle = COLORS.window;
    rr(ctx, x, y, s.w, s.h, 8); ctx.fill();
    text(ctx, 'SERVE', s.x, y + 22, 16, '#fff6e0', '800', 'center');
    text(ctx, 'window', s.x, y + 44, 12, '#d8e8d0', '400', 'center');
    ctx.fillStyle = '#f5c542';
    ctx.beginPath(); ctx.arc(s.x, y + s.h - 30, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3c5a3d';
    ctx.fillRect(s.x - 8, y + s.h - 32, 16, 5);
    ctx.fillRect(s.x - 2, y + s.h - 38, 4, 10);
    text(ctx, 'ding!', s.x, y + s.h - 8, 10, '#fff6e0', '400', 'center');
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#4a4a52';
    rr(ctx, x - 5, y - 5, s.w + 10, s.h + 10, 10); ctx.fill();
    ctx.fillStyle = '#5d5d66';
    rr(ctx, x, y, s.w, s.h, 8); ctx.fill();
    text(ctx, 'TRASH', s.x, y + 16, 13, '#d8d8de', '800', 'center');
    text(ctx, 'Q to bin', s.x, y + 36, 11, '#b8b8c0', '400', 'center');
  }
  ctx.restore();
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(state.time * 14) * 2 : 0;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 16, 20, 7, 0, 0, TAU); ctx.fill();
  // Body: coat, head, tall chef hat.
  ctx.fillStyle = COLORS.chefPants;
  ctx.fillRect(-11, 8, 22, 12);
  ctx.fillStyle = COLORS.chefCoat;
  rr(ctx, -16, -8, 32, 20, 8); ctx.fill();
  ctx.fillStyle = COLORS.chefSkin;
  ctx.beginPath(); ctx.arc(0, -16, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = COLORS.chefHat;
  rr(ctx, -13, -34, 26, 14, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -32, 9, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#2e1d12';
  ctx.beginPath(); ctx.arc(chef.dir * 4, -17, 1.8, 0, TAU); ctx.fill();
  // What the chef carries, held up high.
  if (chef.carryPlate) {
    drawPlate(ctx, chef.carryPlate, 0, -52, 30);
  } else if (chef.carry) {
    drawItem(ctx, chef.carry, 0, -50, 16);
  }
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = recipeById(order.recipeId);
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = COLORS.ticket;
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = COLORS.ticketEdge;
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 8); ctx.stroke();
  ctx.fillStyle = recipe.color;
  ctx.fillRect(x, y, 8, h);
  text(ctx, recipe.name, x + 16, y + 16, 14, COLORS.text, '800');
  text(ctx, `#${order.id}`, x + w - 10, y + 16, 11, '#8a6a45', '400', 'right');
  recipe.needs.forEach((item, i) => {
    drawItem(ctx, item, x + 28 + i * 34, y + 42, 13);
  });
  ctx.fillStyle = frac < 0.3 ? COLORS.bad : '#e8e0c8';
  ctx.fillRect(x + 12, y + h - 12, w - 24, 6);
  ctx.fillStyle = frac < 0.3 ? COLORS.bad : COLORS.good;
  ctx.fillRect(x + 12, y + h - 12, (w - 24) * frac, 6);
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW.w, 88);
  ctx.fillStyle = COLORS.hudEdge;
  ctx.fillRect(0, 86, VIEW.w, 2);
  text(ctx, 'SIZZLE & SERVE', 20, 24, 22, COLORS.gold, '800');
  text(ctx, 'rush hour kitchen', 20, 48, 12, '#c8a878', '400');
  // Order board.
  text(ctx, 'ORDERS', 250, 16, 12, '#c8a878', '800');
  state.orders.forEach((order, i) => {
    drawOrderTicket(ctx, order, 250 + i * 168, 24, 158, 56);
  });
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — grab ingredients!', 258, 52, 13, '#c8a878', '400');
  }
  // Timer, score, served.
  const urgent = state.timeLeft <= 30;
  text(ctx, formatTime(state.timeLeft), 1010, 34, 34, urgent ? COLORS.bad : COLORS.textLight, '800', 'center');
  text(ctx, 'SHIFT', 1010, 62, 11, '#c8a878', '400', 'center');
  text(ctx, `SCORE ${state.score}`, 1260, 26, 18, COLORS.textLight, '800', 'right');
  text(ctx, `served ${state.served} · combo x${state.combo}`, 1260, 50, 12, '#c8a878', '400', 'right');
}

function drawPrompt(ctx, state) {
  if (state.mode !== 'play') return;
  const station = nearestStation(state);
  if (!station) return;
  const hints = {
    pantry: `E: take ${ITEMS[station.item]?.label ?? 'item'}`,
    board: state.board.item ? 'Hold E: chop!' : 'E: put item on board',
    grill: state.grill.item ? 'E: take off grill' : 'E: put patty on grill',
    plating: 'E: add to plate / take plate',
    window: 'E: serve the plate!',
    trash: 'E: bin it',
  };
  const label = hints[station.kind] ?? 'E: use';
  const w = ctx.measureText(label).width + 24;
  ctx.save();
  ctx.font = '700 14px "Trebuchet MS", sans-serif';
  const tw = ctx.measureText(label).width + 28;
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  rr(ctx, station.x - tw / 2, station.y - station.h / 2 - 34, tw, 24, 12); ctx.fill();
  text(ctx, label, station.x, station.y - station.h / 2 - 22, 14, '#fff6e0', '700', 'center');
  ctx.restore();
  void w;
}

function drawToast(ctx, state) {
  if (!state.toast || state.time > state.toastUntil) return;
  ctx.save();
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  const w = ctx.measureText(state.toast).width + 32;
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  rr(ctx, state.chef.x - w / 2, state.chef.y - 84, w, 28, 14); ctx.fill();
  text(ctx, state.toast, state.chef.x, state.chef.y - 70, 16, '#fff6e0', '700', 'center');
  ctx.restore();
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = 1 - p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(20,10,4,0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = COLORS.ticket;
  rr(ctx, 340, 130, 600, 400, 16); ctx.fill();
  ctx.strokeStyle = COLORS.ticketEdge; ctx.lineWidth = 3;
  rr(ctx, 340, 130, 600, 400, 16); ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 190, 44, '#b3541e', '800', 'center');
  text(ctx, 'Rush Hour Kitchen', 640, 232, 20, '#7a5230', '400', 'center');
  text(ctx, 'Orders fly in — chop, grill, plate and serve', 640, 292, 17, COLORS.text, '400', 'center');
  text(ctx, 'before the customers walk out.', 640, 318, 17, COLORS.text, '400', 'center');
  text(ctx, 'Move: WASD / arrows      Use: E      Bin: Q', 640, 372, 16, '#7a5230', '700', 'center');
  text(ctx, 'Mouse: click a nearby station to use it', 640, 398, 14, '#8a6a45', '400', 'center');
  text(ctx, 'Serve fast for tips. Chain serves for combos.', 640, 428, 14, '#8a6a45', '400', 'center');
  ctx.fillStyle = '#b3541e';
  rr(ctx, 520, 458, 240, 44, 22); ctx.fill();
  text(ctx, 'START SHIFT  ▶', 640, 481, 18, '#fff6e0', '800', 'center');
  text(ctx, 'press Enter or click', 640, 516, 12, '#8a6a45', '400', 'center');
}

function drawEnd(ctx, state) {
  ctx.fillStyle = 'rgba(20,10,4,0.72)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = COLORS.ticket;
  rr(ctx, 380, 150, 520, 360, 16); ctx.fill();
  ctx.strokeStyle = COLORS.ticketEdge; ctx.lineWidth = 3;
  rr(ctx, 380, 150, 520, 360, 16); ctx.stroke();
  text(ctx, 'SHIFT OVER!', 640, 210, 40, '#b3541e', '800', 'center');
  text(ctx, `Score: ${state.score}`, 640, 280, 28, COLORS.text, '800', 'center');
  text(ctx, `Dishes served: ${state.served}    Orders lost: ${state.failed}`, 640, 330, 17, COLORS.text, '400', 'center');
  text(ctx, `Best combo: x${state.bestCombo}`, 640, 362, 17, COLORS.text, '400', 'center');
  const verdict = state.score >= 600 ? 'Head chef material!' : state.score >= 350 ? 'Solid service!' : 'The rush got you — try again!';
  text(ctx, verdict, 640, 404, 17, '#b3541e', '700', 'center');
  text(ctx, 'Press R to cook another shift', 640, 462, 15, '#7a5230', '700', 'center');
}

export function draw(ctx, state) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawFloor(ctx);
  for (const s of STATIONS) drawStation(ctx, state, s);
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawHud(ctx, state);
  drawPrompt(ctx, state);
  drawToast(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'end') drawEnd(ctx, state);
}
