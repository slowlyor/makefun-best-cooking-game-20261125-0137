// main.js — the entry point: the loop, the mode machine (title -> play ->
// end), the clock, and the ?shot= staging hook. It wires input, kitchen,
// orders and rendering together and owns nothing else.

import { SHIFT_SECONDS, VIEW } from './config.js';
import { createState, tickParticles } from './state.js';
import { createInput, endFrame } from './input.js';
import { draw } from './render.js';
import { clickInteract, dropCarried, holdChop, interact, moveChef, tickGrill } from './kitchen.js';
import { tickOrders } from './orders.js';
import { applyShot } from './shots.js';
import { ensureAudio, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// The canvas keeps the fixed 1280x720 logical space; CSS stretches it to
// the window, and input.js already converts the pointer into that space
// via the CSS size ratio.
function fitCanvasLogical() {
  canvas.width = VIEW.w;
  canvas.height = VIEW.h;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const state = createState();
const input = createInput(canvas);
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? 1);
state.seed = Number.isFinite(seed) ? seed : 1;
state.rngState = state.seed;

if (shotName) applyShot(state, shotName);

fitCanvasLogical();
window.addEventListener('resize', fitCanvasLogical);

let last = performance.now();
let lastTickSecond = -1;

function startShift() {
  const fresh = createState();
  Object.assign(state, fresh);
  state.mode = 'play';
  state.seed = seed;
  state.rngState = seed;
  ensureAudio();
  sfx.start();
}

function endShift() {
  state.mode = 'end';
  sfx.end();
}

function update(dt) {
  if (state.mode === 'title') {
    if (input.enterPressed || input.mouse.clicked) startShift();
    return;
  }
  if (state.mode === 'end') {
    if (input.restartPressed) startShift();
    return;
  }
  // mode === 'play'
  if (!state.frozen) {
    state.time += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.time);
    if (state.timeLeft <= 0) { endShift(); return; }
    const whole = Math.ceil(state.timeLeft);
    if (whole !== lastTickSecond) {
      lastTickSecond = whole;
      if (whole <= 5 && whole > 0) sfx.tick();
    }
    tickOrders(state, dt);
    tickGrill(state, dt);
  }
  moveChef(state, input, dt);
  holdChop(state, input, dt);
  if (input.interactPressed) interact(state);
  if (input.dropPressed) dropCarried(state);
  if (input.mouse.clicked) clickInteract(state, input.mouse.clickX, input.mouse.clickY);
  if (input.enterPressed) ensureAudio();
  tickParticles(state, dt);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw(ctx, state);
  const status = document.getElementById('status');
  if (status) {
    status.textContent = state.mode === 'play'
      ? `Score ${state.score}. ${state.orders.length} orders waiting. ${Math.ceil(state.timeLeft)} seconds left.`
      : state.mode === 'end' ? `Shift over. Score ${state.score}.` : 'Sizzle and Serve. Press Enter to start.';
  }
  endFrame(input);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
