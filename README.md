# Sizzle & Serve — Rush Hour Kitchen

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/slowlyor/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/slowlyor/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A fast, original cooking game for [make.fun's best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). You are the lone chef on a 150-second dinner rush: orders fly onto the board, and you run the kitchen — grab ingredients from the pantry, chop them on the board, grill patties before they burn, stack plates and ring the bell at the serving window before customers walk out.

## How to play

- **Move:** WASD or arrow keys (mouse: click a nearby station to use it)
- **Use:** E — take an ingredient, put it on the board/grill/plate, serve
- **Hold E** at the chopping board to chop
- **Bin:** Q — throw away whatever is in your hands
- **Start:** Enter · **Restart after a shift:** R

Serve fast for tips, chain serves for combos, and watch the grill — a patty left too long turns to charcoal.

## The menu

| Dish | Needs |
| --- | --- |
| Sunny Burger | bun + grilled patty + chopped lettuce + chopped tomato |
| Garden Salad | chopped lettuce + chopped tomato + chopped onion |
| Cheesy Melt | bun + grilled patty + cheese |
| Veggie Stack | bun + chopped lettuce + chopped tomato + chopped onion |

## Play it

No build step, no network: open `game/index.html` in desktop Chrome, or serve it locally:

```sh
node serve.ts
# then open http://localhost:8080
```

All art is drawn in code and all sounds are synthesized with WebAudio — the game ships no media files.

## Layout

- `game/` — the playable game (plain static files)
  - `index.html` — canvas shell
  - `src/config.js` — menu, stations, constants
  - `src/state.js` — game state
  - `src/input.js` — keyboard + mouse
  - `src/audio.js` — synthesized sound effects
  - `src/orders.js` — the order board, matching, scoring
  - `src/kitchen.js` — movement and every station interaction
  - `src/render.js` — all drawing
  - `src/shots.js` — staged scenes for the screenshots
  - `src/main.js` — game loop and mode machine
- `screenshots/` — 4 screenshots taken from the running game
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
