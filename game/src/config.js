// config.js — every constant that shapes Sizzle & Serve: the room, the menu,
// the stations and the feel. Nothing here imports anything; the other modules
// read these values so a balance tweak lives in exactly one place.

export const VIEW = { w: 1280, h: 720 };
export const SHIFT_SECONDS = 150;
export const ORDER_PATIENCE = 50;
export const ORDER_INTERVAL = 14;
export const MAX_ORDERS = 4;
export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 5;
export const BURN_SECONDS = 8.5;
export const CHEF_SPEED = 265;
export const INTERACT_RADIUS = 86;

// One item in the chef's hands at a time. A plate is a separate carried thing.
export const ITEMS = {
  tomato:  { label: 'Tomato',  color: '#e5484d', chop: true,  grill: false },
  lettuce: { label: 'Lettuce', color: '#5fbf4d', chop: true,  grill: false },
  onion:   { label: 'Onion',   color: '#e8e0f0', chop: true,  grill: false },
  cheese:  { label: 'Cheese',  color: '#f5c542', chop: false, grill: false },
  patty:   { label: 'Patty',   color: '#8a5a3b', chop: false, grill: true },
  bun:     { label: 'Bun',     color: '#e8a94f', chop: false, grill: false },
};

// A chopped item keeps its key with a "chopped " prefix in the dish list.
export function choppedKey(key) { return 'chopped ' + key; }
export function grilledKey(key) { return 'grilled ' + key; }

// The menu: each dish is a set of plate items, in any order.
export const RECIPES = [
  {
    id: 'burger', name: 'Sunny Burger', base: 100,
    needs: ['bun', 'grilled patty', 'chopped lettuce', 'chopped tomato'],
    color: '#e8a94f',
  },
  {
    id: 'salad', name: 'Garden Salad', base: 80,
    needs: ['chopped lettuce', 'chopped tomato', 'chopped onion'],
    color: '#5fbf4d',
  },
  {
    id: 'melt', name: 'Cheesy Melt', base: 90,
    needs: ['bun', 'grilled patty', 'cheese'],
    color: '#f5c542',
  },
  {
    id: 'stack', name: 'Veggie Stack', base: 110,
    needs: ['bun', 'chopped lettuce', 'chopped tomato', 'chopped onion'],
    color: '#e5484d',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? RECIPES[0];
}

// Stations, in logical canvas coordinates. Each has a centre, a size and a kind.
export const STATIONS = [
  { id: 'pantry-tomato',  kind: 'pantry', item: 'tomato',  x: 88,  y: 168, w: 116, h: 62 },
  { id: 'pantry-lettuce', kind: 'pantry', item: 'lettuce', x: 88,  y: 242, w: 116, h: 62 },
  { id: 'pantry-onion',   kind: 'pantry', item: 'onion',   x: 88,  y: 316, w: 116, h: 62 },
  { id: 'pantry-cheese',  kind: 'pantry', item: 'cheese',  x: 88,  y: 390, w: 116, h: 62 },
  { id: 'pantry-patty',   kind: 'pantry', item: 'patty',   x: 88,  y: 464, w: 116, h: 62 },
  { id: 'pantry-bun',     kind: 'pantry', item: 'bun',     x: 88,  y: 538, w: 116, h: 62 },
  { id: 'board',          kind: 'board',   x: 330, y: 168, w: 150, h: 84 },
  { id: 'grill',          kind: 'grill',   x: 540, y: 168, w: 150, h: 84 },
  { id: 'plating',        kind: 'plating', x: 640, y: 580, w: 220, h: 88 },
  { id: 'window',         kind: 'window',  x: 1150, y: 200, w: 130, h: 170 },
  { id: 'trash',          kind: 'trash',   x: 260, y: 620, w: 110, h: 64 },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export const COLORS = {
  floorA: '#c98f5f', floorB: '#bd8252', wall: '#7a4a2b', wallTop: '#8f5a35',
  hud: '#2e1d12', hudEdge: '#4a2f1c', ticket: '#fff6e0', ticketEdge: '#d8b878',
  counter: '#a06a3f', counterTop: '#c08b58', steel: '#9aa5ad', steelDark: '#6e7a83',
  board: '#e8c890', grill: '#3d3d46', plate: '#f4f1e8', window: '#5b7d5a',
  chefHat: '#f8f8f2', chefCoat: '#f2ede2', chefSkin: '#f0c08a', chefPants: '#3a4a6b',
  text: '#2e1d12', textLight: '#fff6e0', good: '#58b368', bad: '#e5484d',
  gold: '#f5c542',
};
